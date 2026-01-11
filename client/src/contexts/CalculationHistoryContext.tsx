import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CalculationHistoryItem {
  id: string;
  calculatorType: string;
  timestamp: number;
  inputs: Record<string, any>;
  results: Record<string, any>;
  preview: string;
}

interface CalculationHistoryContextType {
  history: CalculationHistoryItem[];
  addToHistory: (item: Omit<CalculationHistoryItem, "id" | "timestamp">) => void;
  loadFromHistory: (id: string) => CalculationHistoryItem | undefined;
  deleteFromHistory: (id: string) => void;
  clearHistory: (calculatorType?: string) => void;
  getHistoryByType: (calculatorType: string) => CalculationHistoryItem[];
}

const CalculationHistoryContext = createContext<CalculationHistoryContextType | undefined>(undefined);

const MAX_HISTORY_PER_TYPE = 10;
const STORAGE_KEY = "calculation_history";

export function CalculationHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save calculation history:", error);
    }
  }, [history]);

  const addToHistory = (item: Omit<CalculationHistoryItem, "id" | "timestamp">) => {
    const newItem: CalculationHistoryItem = {
      ...item,
      id: `${item.calculatorType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Get existing items for this calculator type
      const typeHistory = prev.filter((h) => h.calculatorType === item.calculatorType);
      const otherHistory = prev.filter((h) => h.calculatorType !== item.calculatorType);

      // Add new item and keep only the most recent MAX_HISTORY_PER_TYPE items
      const updatedTypeHistory = [newItem, ...typeHistory].slice(0, MAX_HISTORY_PER_TYPE);

      // Combine and sort by timestamp (most recent first)
      return [...updatedTypeHistory, ...otherHistory].sort((a, b) => b.timestamp - a.timestamp);
    });
  };

  const loadFromHistory = (id: string): CalculationHistoryItem | undefined => {
    return history.find((item) => item.id === id);
  };

  const deleteFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = (calculatorType?: string) => {
    if (calculatorType) {
      setHistory((prev) => prev.filter((item) => item.calculatorType !== calculatorType));
    } else {
      setHistory([]);
    }
  };

  const getHistoryByType = (calculatorType: string): CalculationHistoryItem[] => {
    return history
      .filter((item) => item.calculatorType === calculatorType)
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  return (
    <CalculationHistoryContext.Provider
      value={{
        history,
        addToHistory,
        loadFromHistory,
        deleteFromHistory,
        clearHistory,
        getHistoryByType,
      }}
    >
      {children}
    </CalculationHistoryContext.Provider>
  );
}

export function useCalculationHistory() {
  const context = useContext(CalculationHistoryContext);
  if (!context) {
    throw new Error("useCalculationHistory must be used within CalculationHistoryProvider");
  }
  return context;
}
