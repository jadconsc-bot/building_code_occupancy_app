// AUTH-LOOP-001: Owns the Clerk → CodeComply session exchange lifecycle as an
// explicit state machine. Replaces the fire-and-forget useClerkSessionExchange
// hook + authExchangeSignal event pattern.
//
// WHY A CONTEXT, NOT A SIGNAL: hydration gating, auth.me enablement, and the
// apiClient 401 handler all need to read "is the session exchange complete?"
// synchronously. An event signal can only notify; it cannot be queried.

import { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { trpc } from '@/lib/trpc';
import { setAuthReady } from '@/_core/authReadyFlag';

export type AuthExchangeStatus =
  | 'initializing'    // Clerk SDK still loading
  | 'unauthenticated' // Clerk loaded, no signed-in user (public access OK)
  | 'exchanging'      // POST /api/auth/session in flight
  | 'ready'           // CodeComply JWT cookie set; protected calls permitted
  | 'failed';         // Exchange failed; explicit error UI; retry available

interface AuthExchangeContextValue {
  status: AuthExchangeStatus;
  retry: () => void; // re-runs the exchange WITHOUT a page reload (INV-3)
}

const AuthExchangeContext = createContext<AuthExchangeContextValue | null>(null);

export function AuthExchangeProvider({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useClerkAuth();
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<AuthExchangeStatus>('initializing');
  // Guards against double-fire in React 18 StrictMode and re-renders.
  // Unlike the old hook, this ref is never reset by a page reload because
  // the fix removes all reloads from the auth path.
  const inFlight = useRef(false);

  const runExchange = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('exchanging');
    try {
      const token = await getToken();
      if (!token) {
        // Clerk says signed in but yields no token — treat as hard failure,
        // never as "proceed anonymously" (INV-2).
        console.error('[AuthExchange] Clerk returned no token');
        setStatus('failed');
        return;
      }
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkToken: token }),
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('[AuthExchange] /api/auth/session failed:', response.status, response.statusText);
        setStatus('failed');
        return;
      }
      // Cookie is now set. Flip readiness BEFORE invalidating auth.me so the
      // query's enabled gate (useAuth.ts) opens and the refetch carries the cookie.
      setStatus('ready');
      await utils.auth.me.invalidate();
      console.log('[AuthExchange] Session established');
    } catch (err) {
      console.error('[AuthExchange] Exchange error:', err);
      setStatus('failed');
    } finally {
      inFlight.current = false;
    }
  }, [getToken, utils]);

  useEffect(() => {
    if (!clerkLoaded) { setStatus('initializing'); return; }
    if (!isSignedIn)  { setStatus('unauthenticated'); return; }
    // Signed in: run exchange exactly once per signed-in lifecycle.
    if (status === 'initializing' || status === 'unauthenticated') {
      void runExchange();
    }
    // Deliberately NOT depending on `status` for re-fire: transitions out of
    // 'exchanging'/'ready'/'failed' are driven by runExchange/retry only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkLoaded, isSignedIn]);

  // Mirror readiness into the module-level flag apiClient reads.
  useEffect(() => {
    setAuthReady(status === 'ready' || status === 'unauthenticated');
  }, [status]);

  // Listens for genuine post-ready session expiry signalled by apiClient.
  // Transitions to 'failed' so the hydration layer shows the explicit
  // re-authentication screen — no hard redirect (INV-2, INV-3).
  useEffect(() => {
    const onExpired = () => setStatus('failed');
    window.addEventListener('codecomply:session-expired', onExpired);
    return () => window.removeEventListener('codecomply:session-expired', onExpired);
  }, []);

  const retry = useCallback(() => { void runExchange(); }, [runExchange]);

  return (
    <AuthExchangeContext.Provider value={{ status, retry }}>
      {children}
    </AuthExchangeContext.Provider>
  );
}

export function useAuthExchange(): AuthExchangeContextValue {
  const ctx = useContext(AuthExchangeContext);
  if (!ctx) throw new Error('useAuthExchange must be used within AuthExchangeProvider');
  return ctx;
}
