import { ReactNode } from 'react';

/**
 * AuthHydrationProvider - Simple pass-through provider
 * Auth hydration is now handled by AuthHydrationWrapper component
 * which is rendered after tRPC provider is initialized
 */
export function AuthHydrationProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
