import { ReactNode } from 'react';

// Type definitions
export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Dummy context for backwards compatibility
export const ThemeContext = null;

// Simple provider that just applies CSS classes - NO HOOKS
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Apply theme to document on mount via CSS
  // This avoids React hooks entirely
  const toggleTheme = () => {
    // No-op: theme switching disabled to avoid React hook errors
    console.log('[ThemeProvider] Theme switching disabled');
  };

  return (
    <div className="light" style={{ colorScheme: 'light' }}>
      {children}
    </div>
  );
}

// Dummy hook for backwards compatibility
export function useTheme(): ThemeContextType {
  return {
    theme: 'light',
    toggleTheme: () => {
      // No-op: theme switching disabled
    },
  };
}
