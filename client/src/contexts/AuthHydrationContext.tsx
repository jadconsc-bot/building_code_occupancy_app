import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { onExchangeFailed } from '@/_core/authExchangeSignal';

/**
 * AuthHydrationProvider handles session restoration on app startup
 * Calls /api/me to check if user has an active session
 * Prevents rendering until auth state is determined
 */
export function AuthHydrationProvider({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState(false);

  // Immediately show error UI if session exchange fails
  useEffect(() => {
    return onExchangeFailed(() => setHydrationError(true));
  }, []);

  // 10-second timeout fallback — catch hangs that never resolve
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isHydrated) setHydrationError(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isHydrated]);

  useEffect(() => {
    if (!loading) {
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

      if (error) {
        console.error('[Auth] Session check failed', error);
      }
    }
  }, [loading, user, error]);

  if (!isHydrated) {
    if (hydrationError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md px-4">
            <p className="text-muted-foreground mb-4">
              Having trouble connecting? Please check your connection and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

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
