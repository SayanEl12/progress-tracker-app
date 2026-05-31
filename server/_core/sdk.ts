import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import https from "https";
import http from "http";

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

// ---------------------------------------------------------------------------
// Tipos de respuesta de Google
// ---------------------------------------------------------------------------
type GoogleTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

type GoogleUserInfo = {
  id: string;           // ID único del usuario en Google → usamos como "openId"
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  verified_email?: boolean;
};

// ---------------------------------------------------------------------------
// SDKServer: lógica de OAuth con Google + gestión de sesión interna (JWT)
// ---------------------------------------------------------------------------
class SDKServer {
  // Fuerza IPv4 en todas las peticiones salientes (IPv6 no disponible en la red)
  private readonly httpsAgent = new https.Agent({ family: 4 });
  private readonly httpAgent = new http.Agent({ family: 4 });

  // -- Helpers de cookies --------------------------------------------------

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  // -- OAuth con Google ----------------------------------------------------

  /**
   * Decodifica el "state" que mandamos en la URL de login (es el redirectUri en base64).
   */
  private decodeState(state: string): string {
    return atob(state);
  }

  /**
   * Paso 1 del callback: canjea el código temporal de Google por un access token.
   * Google entrega el código en la URL → nosotros lo canjeamos servidor a servidor.
   *
   * @example
   * const { accessToken } = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code: string, state: string
  ): Promise<{ accessToken: string }> {
    const redirectUri = this.decodeState(state);

    // Google requiere el cuerpo en formato form-urlencoded, NO JSON
    const params = new URLSearchParams({
      code,
      client_id: ENV.oAuthId,
      client_secret: ENV.oAuthSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const { data } = await axios.post<GoogleTokenResponse>(
      "https://oauth2.googleapis.com/token",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: AXIOS_TIMEOUT_MS,
        httpsAgent: this.httpsAgent,
        httpAgent: this.httpAgent
      }
    );

    return { accessToken: data.access_token };
  }

  /**
   * Paso 2 del callback: usa el access token para obtener el perfil del usuario.
   * Devuelve los datos en el formato que espera el resto del sistema.
   *
   * @example
   * const userInfo = await sdk.getUserInfo(accessToken);
   */
  async getUserInfo(accessToken: string): Promise<{
    openId: string;
    name: string | null;
    email: string | null;
    loginMethod: string | null;
    platform: string | null;
  }> {
    const { data } = await axios.get<GoogleUserInfo>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: AXIOS_TIMEOUT_MS,
        httpsAgent: this.httpsAgent,
        httpAgent: this.httpAgent,
      }
    );

    return {
      openId: data.id,           // El ID único de Google actúa como nuestro openId
      name: data.name || null,
      email: data.email || null,
      loginMethod: "google",
      platform: "google",
    };
  }

  // -- Gestión de sesión interna (JWT) -------------------------------------
  // Estas funciones NO tienen nada que ver con Google. Crean y verifican
  // nuestra propia cookie cifrada para saber si el usuario ya inició sesión.

  /**
   * Crea un token JWT de sesión para guardar en una cookie.
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId, { name: "Ana" });
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      { openId, appId: ENV.appId, name: options.name || "" },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return { openId, appId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  // -- Autenticación de peticiones -----------------------------------------

  /**
   * Verifica si la petición HTTP tiene una sesión válida.
   * Se llama en cada endpoint protegido del backend.
   */
  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserByOpenId(session.openId);

    if (!user) {
      // El usuario tiene una cookie válida pero no está en la BD.
      // Esto no debería ocurrir en condiciones normales.
      throw ForbiddenError("User not found in database");
    }

    // Actualizamos la fecha de último acceso en cada petición
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }
}

/** Resultado de `sdk.authenticateRequest`. */
export type AuthenticatedUser = User;

export const sdk = new SDKServer();
