import { ReactNode, useState } from 'react';
import { SaveCalculatorResultDialog } from './SaveCalculatorResultDialog';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface SaveButtonProps {
  calculatorType: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
}

export function SaveButton({ calculatorType, inputs, results }: SaveButtonProps) {
  return (
    <SaveCalculatorResultDialog
      calculatorType={calculatorType}
      inputData={inputs}
      resultData={results}
    />
  );
}

interface CalculatorWithSaveProps {
  calculatorType: string;
  calculatorName: string;
  children: ReactNode;
  onCalculate?: (inputData: Record<string, unknown>, resultData: Record<string, unknown>) => void;
}

export function CalculatorWithSave({
  calculatorType,
  calculatorName,
  children,
  onCalculate,
}: CalculatorWithSaveProps) {
  const [lastCalculation, setLastCalculation] = useState<{
    inputData: Record<string, unknown>;
    resultData: Record<string, unknown>;
  } | null>(null);

  const handleSaveClick = () => {
    // This will be called when user clicks save
    // The SaveCalculatorResultDialog will handle the actual save
  };

  return (
    <div className="space-y-4">
      {/* Calculator Content */}
      <div className="border border-border rounded-lg p-4 bg-card">
        {children}
      </div>

      {/* Save Button */}
      {lastCalculation && (
        <div className="flex justify-end">
          <SaveCalculatorResultDialog
            calculatorType={calculatorType}
            inputData={lastCalculation.inputData}
            resultData={lastCalculation.resultData}
          >
            <Button className="gap-2">
              <Save size={16} />
              Save {calculatorName} Result
            </Button>
          </SaveCalculatorResultDialog>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage calculator state and results
 */
export function useCalculatorState(calculatorType: string) {
  const [inputData, setInputData] = useState<Record<string, unknown>>({});
  const [resultData, setResultData] = useState<Record<string, unknown>>({});
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleCalculate = (inputs: Record<string, unknown>, results: Record<string, unknown>) => {
    setInputData(inputs);
    setResultData(results);
    setHasCalculated(true);
  };

  return {
    inputData,
    resultData,
    hasCalculated,
    handleCalculate,
    calculatorType,
  };
}
