export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Construye la URL de autorización de Google en tiempo real.
// Google redirigirá al usuario de vuelta a /api/oauth/callback con un código temporal.
export const getLoginUrl = () => {
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Codificamos el redirectUri en base64 como "state".
  // El backend lo decodificará para saber a dónde regresar al usuario.
  const state = btoa(redirectUri);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);       // Quién eres tú ante Google
  url.searchParams.set("redirect_uri", redirectUri); // A dónde regresa Google después del login
  url.searchParams.set("response_type", "code");     // Pedimos un código temporal (no el token directamente)
  url.searchParams.set("scope", "openid email profile"); // Qué info pedimos: identidad, email y nombre
  url.searchParams.set("state", state);              // Protección CSRF: el backend valida esto
  url.searchParams.set("access_type", "offline");    // Permite refresh tokens si se necesitan después

  return url.toString();
};
