/**
 * Project Calculator Context
 * 
 * Manages the association between calculators and projects
 * Automatically saves calculation results to the active project
 * Provides project selection and result tracking
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

export interface CalculationResult {
  id: string;
  projectId: string;
  calculatorType: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  signature: string;
  timestamp: number;
  createdAt: Date;
}

interface ProjectCalculatorContextType {
  activeProjectId: string | null;
  setActiveProjectId: (projectId: string | null) => void;
  lastCalculationResult: CalculationResult | null;
  setLastCalculationResult: (result: CalculationResult | null) => void;
  saveCalculationResult: (
    projectId: string,
    calculatorType: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>
  ) => Promise<CalculationResult>;
  isLoading: boolean;
}

const ProjectCalculatorContext = createContext<ProjectCalculatorContextType | undefined>(undefined);

export function ProjectCalculatorProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [lastCalculationResult, setLastCalculationResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use tRPC mutation to save calculation results
  const saveResultMutation = trpc.calculations.saveResult.useMutation();

  const saveCalculationResult = async (
    projectId: string,
    calculatorType: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>
  ): Promise<CalculationResult> => {
    setIsLoading(true);
    try {
      const result = await saveResultMutation.mutateAsync({
        projectId,
        calculatorType,
        inputs,
        outputs,
      });

      const calculationResult: CalculationResult = {
        id: result.id,
        projectId: String(result.projectId),
        calculatorType: result.calculatorType,
        inputs: result.inputs,
        outputs: result.outputs,
        signature: result.signature,
        timestamp: result.createdAt?.getTime() || Date.now(),
        createdAt: new Date(result.createdAt),
      };

      setLastCalculationResult(calculationResult);
      return calculationResult;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProjectCalculatorContext.Provider
      value={{
        activeProjectId,
        setActiveProjectId,
        lastCalculationResult,
        setLastCalculationResult,
        saveCalculationResult,
        isLoading,
      }}
    >
      {children}
    </ProjectCalculatorContext.Provider>
  );
}

export function useProjectCalculator() {
  const context = useContext(ProjectCalculatorContext);
  if (!context) {
    throw new Error('useProjectCalculator must be used within ProjectCalculatorProvider');
  }
  return context;
}
