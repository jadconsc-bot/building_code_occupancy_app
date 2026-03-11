import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

/**
 * AuthHydrationWrapper handles session restoration on app startup
 * Must be rendered AFTER tRPC provider is initialized
 * Prevents rendering until auth state is determined
 */
export function AuthHydrationWrapper({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Auth hook already handles hydration via useAuth
    // Once loading is false, we know auth state is determined
    if (!loading) {
      setIsHydrated(true);

      // Log auth state for debugging
      if (user) {
        console.debug('[Auth] User session restored', {
          userId: user.id,
          email: user.email,
          role: user.role,
        });
      } else {
        console.debug('[Auth] No active session found');
      }

      // Show error if auth check failed
      if (error) {
        console.error('[Auth] Session check failed', error);
        // Don't show toast for auth errors as they're expected when not logged in
      }
    }
  }, [loading, user, error]);

  // Show loading state while hydrating
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
