import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAuthExchange } from "@/contexts/AuthExchangeContext";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/" } =
    options ?? {};

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const utils = trpc.useUtils();
  const { status: exchangeStatus } = useAuthExchange();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60_000,
    // AUTH-LOOP-001: previously enabled the moment Clerk loaded, which fired
    // auth.me BEFORE the session exchange set the CodeComply cookie →
    // guaranteed 401 for every new user. Now waits for the exchange to complete.
    enabled: clerkLoaded && !!clerkUser && exchangeStatus === 'ready',
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
      exchangeStatus === 'exchanging' ||
      !!(clerkUser && (exchangeStatus !== 'ready' || meQuery.isLoading)) ||
      logoutMutation.isPending;
    const error = meQuery.error ?? logoutMutation.error ?? null;
    const isAuthenticated = Boolean(clerkUser && user);
    return { user, loading, error, isAuthenticated };
  }, [
    clerkLoaded,
    clerkUser,
    exchangeStatus,
    meQuery.data,
    meQuery.isLoading,
    meQuery.error,
    logoutMutation.isPending,
    logoutMutation.error,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
