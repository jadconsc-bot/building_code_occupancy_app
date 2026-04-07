import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { trpc } from '@/lib/trpc';

/**
 * AUTH-MIGRATE-001: Exchange Clerk token for CodeComply session
 * 
 * After Clerk authentication, this hook automatically exchanges the Clerk token
 * for a CodeComply JWT session token by calling POST /api/auth/session
 * 
 * Uses sessionStorage to ensure exchange only happens once per browser session
 */
export function useClerkSessionExchange() {
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useAuth();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!clerkLoaded || !isSignedIn) {
      return;
    }

    // Check if already exchanged in this session
    if (sessionStorage.getItem('session_exchanged')) {
      return;
    }

    // Exchange Clerk token for CodeComply session
    const exchangeToken = async () => {
      try {
        // Get the Clerk session token
        const token = await getToken();
        
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
          console.error('[Auth] Session creation failed:', response.statusText);
          return;
        }

        console.log('[Auth] Session created successfully');
        // Mark as exchanged so it doesn't happen again in this session
        sessionStorage.setItem('session_exchanged', 'true');
        // Refetch auth.me to get user data from session cookie
        await utils.auth.me.refetch();
      } catch (error) {
        console.error('[Auth] Token exchange failed:', error);
      }
    };

    exchangeToken();
  }, [clerkLoaded, isSignedIn, getToken, utils]);
}
