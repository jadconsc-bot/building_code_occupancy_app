import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/" } =
    options ?? {};

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    enabled: clerkLoaded && !!clerkUser,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, undefined);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, undefined);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // Treat UNAUTHORIZED as "not logged in" — not a real error state.
    // This happens on the initial auth.me fire before the session cookie
    // is set; retry: false + retryOnMount: false ensure it stops there.
    const isUnauthorized =
      meQuery.error instanceof TRPCClientError &&
      meQuery.error.data?.code === 'UNAUTHORIZED';

    const user = meQuery.data ?? null;
    const loading =
      !clerkLoaded ||
      !!(clerkUser && meQuery.isLoading) ||
      logoutMutation.isPending;
    const error = isUnauthorized
      ? null
      : (meQuery.error ?? logoutMutation.error ?? null);
    const isAuthenticated = Boolean(clerkUser && user);
    return { user, loading, error, isAuthenticated };
  }, [
    clerkLoaded,
    clerkUser,
    meQuery.data,
    meQuery.isLoading,
    meQuery.error,
    logoutMutation.isPending,
    logoutMutation.error,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!clerkLoaded) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    clerkLoaded,
    meQuery.isLoading,
    logoutMutation.isPending,
    state.isAuthenticated,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
