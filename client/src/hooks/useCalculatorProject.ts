import { useProject } from '@/contexts/ProjectContext';
import { trpc } from '@/lib/trpc';

interface CalculatorResult {
  calculatorType: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  notes?: string;
}

export function useCalculatorProject() {
  const { activeProjectId } = useProject();
  const utils = trpc.useUtils();
  const saveMutation = trpc.projects.calculatorResults.save.useMutation({
    onSuccess: () => {
      if (activeProjectId) {
        utils.projects.calculatorResults.list.invalidate({ projectId: activeProjectId });
      }
    },
  });

  const saveCalculatorResult = async (result: CalculatorResult) => {
    if (!activeProjectId) {
      console.warn('No active project selected');
      return null;
    }

    try {
      const response = await saveMutation.mutateAsync({
        projectId: activeProjectId,
        calculatorType: result.calculatorType,
        inputData: JSON.stringify(result.inputData),
        resultData: JSON.stringify(result.resultData),
        notes: result.notes,
      });
      return response;
    } catch (error) {
      console.error('Failed to save calculator result:', error);
      throw error;
    }
  };

  return {
    activeProjectId,
    saveCalculatorResult,
    isSaving: saveMutation.isPending,
  };
}
