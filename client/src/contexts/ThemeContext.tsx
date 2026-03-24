import { createContext, useContext, useState, ReactNode } from 'react';

// Type definitions
export interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

// Create context (OUTSIDE component)
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

// Provider component (INSIDE component - where hooks work)
export function ThemeProvider({ children }: { children: ReactNode }) {
  // ✅ useState ONLY called inside function component body
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use context (with error handling)
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure ThemeProvider wraps your component tree.'
    );
  }
  
  return context;
}
