import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useAuthExchange } from '@/contexts/AuthExchangeContext';

/**
 * AuthHydrationProvider gates the app tree until the auth exchange and
 * auth.me query have settled. Keys off the AuthExchangeContext state machine
 * rather than the old event-signal pattern (AUTH-LOOP-001).
 */
export function AuthHydrationProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { status, retry } = useAuthExchange();
  const [isHydrated, setIsHydrated] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // 10-second watchdog — transitions to error UI state, never reloads (INV-3)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isHydrated) setTimedOut(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isHydrated]);

  useEffect(() => {
    const isReady =
      status === 'unauthenticated' ||
      (status === 'ready' && !loading);

    if (isReady) {
      setIsHydrated(true);

      if (user) {
        console.debug('[Auth] User session restored', {
          userId: user.id,
          email: user.email,
          role: user.role,
        });
      } else {
        console.debug('[Auth] No active session found');
      }
    }
  }, [status, loading, user]);

  // Explicit error screen for failed exchange or watchdog timeout (INV-2).
  // Retry re-runs the exchange in-React — no page reload (INV-3).
  if (status === 'failed' || (timedOut && !isHydrated)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md px-4">
          <p className="text-muted-foreground mb-4">
            Having trouble connecting? Please check your connection and try again.
          </p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
