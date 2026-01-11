import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  showValidation?: boolean;
  unit?: string;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, label, error, showValidation = true, unit, min, max, value, onChange, ...props }, ref) => {
    const [isValid, setIsValid] = React.useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string>("");

    React.useEffect(() => {
      if (value === "" || value === undefined) {
        setIsValid(null);
        setErrorMessage("");
        return;
      }

      const numValue = typeof value === "string" ? parseFloat(value) : typeof value === "number" ? value : NaN;
      
      if (isNaN(numValue)) {
        setIsValid(false);
        setErrorMessage("Please enter a valid number");
        return;
      }

      if (min !== undefined && numValue < Number(min)) {
        setIsValid(false);
        setErrorMessage(`Value must be at least ${min}`);
        return;
      }

      if (max !== undefined && numValue > Number(max)) {
        setIsValid(false);
        setErrorMessage(`Value must be at most ${max}`);
        return;
      }

      setIsValid(true);
      setErrorMessage("");
    }, [value, min, max]);

    const displayError = error || errorMessage;

    return (
      <div className="w-full">
        {label && (
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*\.?[0-9]*"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              showValidation && isValid === true && "border-green-500 pr-10",
              showValidation && isValid === false && "border-red-500 pr-10",
              unit && "pr-12",
              className
            )}
            ref={ref}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            {...props}
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {unit}
            </span>
          )}
          {showValidation && isValid === true && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
          )}
          {showValidation && isValid === false && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 pointer-events-none" />
          )}
        </div>
        {displayError && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {displayError}
          </p>
        )}
      </div>
    );
  }
);

NumericInput.displayName = "NumericInput";

export { NumericInput };
