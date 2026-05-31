import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

// Contador global para identificar cada instancia del hook en los logs
let instanceCounter = 0;

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};

  // ID único por instancia del hook (cada componente que llame useAuth tendrá el suyo)
  const instanceId = useRef(`useAuth#${++instanceCounter}`).current;
  // Cuenta cuántas veces re-renderiza esta instancia
  const renderCount = useRef(0);
  renderCount.current++;

  console.log(
    `%c[${instanceId}] render #${renderCount.current}`,
    "color: #6366f1; font-weight: bold"
  );

  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Log cada vez que cambia el estado de la query
  console.log(`%c[${instanceId}] trpc.auth.me estado:`, "color: #0ea5e9", {
    status: meQuery.status,           // 'pending' | 'success' | 'error'
    fetchStatus: meQuery.fetchStatus, // 'fetching' | 'paused' | 'idle'
    isLoading: meQuery.isLoading,
    isFetching: meQuery.isFetching,
    data: meQuery.data,
    error: meQuery.error?.message ?? null,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      console.log(`%c[${instanceId}] logout exitoso → limpiando cache`, "color: #f59e0b");
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    console.log(`%c[${instanceId}] logout iniciado`, "color: #f59e0b");
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        console.warn(`%c[${instanceId}] logout: sesión ya expirada, ignorando error`, "color: #f59e0b");
        return;
      }
      console.error(`%c[${instanceId}] logout: error inesperado`, "color: #ef4444", error);
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const computed = {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };

    // Log del estado computado final que reciben los componentes
    console.log(
      `%c[${instanceId}] estado computado →`,
      computed.isAuthenticated ? "color: #22c55e; font-weight:bold" : "color: #ef4444; font-weight:bold",
      {
        isAuthenticated: computed.isAuthenticated,
        loading: computed.loading,
        user: computed.user ? `${computed.user.name} (${computed.user.email})` : null,
        error: computed.error?.message ?? null,
      }
    );

    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );

    return computed;
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    console.log(
      `%c[${instanceId}] useEffect [redirect] evaluando:`,
      "color: #a855f7",
      {
        redirectOnUnauthenticated,
        isLoading: meQuery.isLoading,
        isPending: logoutMutation.isPending,
        hasUser: Boolean(state.user),
        currentPath: typeof window !== "undefined" ? window.location.pathname : "SSR",
        redirectPath,
      }
    );

    if (!redirectOnUnauthenticated) {
      console.log(`%c[${instanceId}] redirect desactivado, saliendo`, "color: #a855f7");
      return;
    }
    if (meQuery.isLoading || logoutMutation.isPending) {
      console.log(`%c[${instanceId}] aún cargando, no redirigir todavía`, "color: #a855f7");
      return;
    }
    if (state.user) {
      console.log(`%c[${instanceId}] usuario autenticado, no redirigir`, "color: #a855f7");
      return;
    }
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) {
      console.log(`%c[${instanceId}] ya estamos en redirectPath, no redirigir`, "color: #a855f7");
      return;
    }

    console.warn(
      `%c[${instanceId}] redirigiendo a ${redirectPath} (usuario no autenticado)`,
      "color: #ef4444; font-weight: bold"
    );
    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {
      console.log(`%c[${instanceId}] refresh manual llamado`, "color: #6366f1");
      return meQuery.refetch();
    },
    logout,
  };
}