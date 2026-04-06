import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

/**
 * AUTH-MIGRATE-001: Exchange Clerk token for CodeComply session
 * 
 * After Clerk authentication, this hook automatically exchanges the Clerk token
 * for a CodeComply JWT session token by calling POST /api/auth/session
 */
export function useClerkSessionExchange() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();

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
        // Reload to trigger auth state update
        window.location.reload();
      } catch (error) {
        console.error('[Auth] Token exchange failed:', error);
      }
    };

    exchangeToken();
  }, [clerkLoaded, isSignedIn, clerkUser]);
}
