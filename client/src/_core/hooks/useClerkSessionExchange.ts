import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { trpc } from '@/lib/trpc';

// Module-level signal — shared across hook instances
let sessionReady = false;
export const isSessionReady = () => sessionReady;
export const resetSessionReady = () => { sessionReady = false; };

export function useClerkSessionExchange() {
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useAuth();
  const utils = trpc.useUtils();
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) {
      hasExchanged.current = false;
      sessionReady = false;
      return;
    }

    if (hasExchanged.current) return;

    const exchangeToken = async () => {
      try {
        const token = await getToken();
        if (!token) {
          console.error('[Auth] Failed to get Clerk token');
          return;
        }

        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkToken: token }),
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('[Auth] Session creation failed:', response.statusText);
          return;
        }

        console.log('[Auth] Session created successfully');
        sessionReady = true;
        hasExchanged.current = true;
        await utils.auth.me.refetch();
      } catch (error) {
        console.error('[Auth] Token exchange failed:', error);
      }
    };

    exchangeToken();
  }, [clerkLoaded, isSignedIn]);
}
