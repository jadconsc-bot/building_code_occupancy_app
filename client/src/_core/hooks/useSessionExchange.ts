import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect, useRef } from 'react';

/**
 * AUTH-MIGRATE-001 Section 6.8: Exchange Clerk token for CodeComply JWT cookie
 * Fires once after Clerk login to create the app session
 */
export function useSessionExchange() {
  const { getToken, isSignedIn } = useClerkAuth();
  const exchanged = useRef(false);

  useEffect(() => {
    if (!isSignedIn || exchanged.current) return;

    exchanged.current = true;
    (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          console.error('[Auth] Failed to get Clerk token');
          return;
        }

        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkToken }),
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('[Auth] Session creation failed:', response.statusText);
          return;
        }

        // Redirect to home after successful session creation
        window.location.href = '/';
      } catch (error) {
        console.error('[Auth] Session exchange error:', error);
      }
    })();
  }, [isSignedIn, getToken]);
}
