import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { trpc } from '@/lib/trpc';

/**
 * AUTH-MIGRATE-001: Exchange Clerk token for CodeComply session
 * 
 * After Clerk authentication, this hook automatically exchanges the Clerk token
 * for a CodeComply JWT session token by calling POST /api/auth/session
 */
export function useClerkSessionExchange() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn || !clerkUser) {
      return;
    }

    // Exchange Clerk token for CodeComply session
    const exchangeToken = async () => {
      try {
        // Get the Clerk session token
        const token = await clerkUser.getToken();
        
        if (!token) {
          console.error('[Auth] Failed to get Clerk token');
          return;
        }

        // Call backend to exchange token and create session
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clerkToken: token }),
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[Auth] Session creation failed:', error);
          return;
        }

        console.log('[Auth] Session created successfully');
        // Refetch auth.me to get user data from session cookie
        await utils.auth.me.refetch();
      } catch (error) {
        console.error('[Auth] Token exchange failed:', error);
      }
    };

    exchangeToken();
  }, [clerkLoaded, isSignedIn, clerkUser, utils]);
}
