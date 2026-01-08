import { createContext, useContext, useState, ReactNode } from "react";
import { ComparisonItem } from "@/components/CalculatorComparison";

interface ComparisonContextType {
  items: ComparisonItem[];
  addItem: (item: Omit<ComparisonItem, "id" | "timestamp">) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ComparisonItem[]>([]);

  const addItem = (item: Omit<ComparisonItem, "id" | "timestamp">) => {
    const newItem: ComparisonItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
  };

  return (
    <ComparisonContext.Provider value={{ items, addItem, removeItem, clearAll }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
