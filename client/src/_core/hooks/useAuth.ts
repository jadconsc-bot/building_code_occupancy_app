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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60_000,
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
    const user = meQuery.data ?? null;
    const loading =
      !clerkLoaded ||
      !!(clerkUser && meQuery.isLoading) ||
      logoutMutation.isPending;
    const error = meQuery.error ?? logoutMutation.error ?? null;
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
