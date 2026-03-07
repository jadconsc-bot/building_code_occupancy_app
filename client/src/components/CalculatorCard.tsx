import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalculatorCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function CalculatorCard({ title, subtitle, description, children, className }: CalculatorCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border shadow-md", className)}>
      {/* Header with brown background */}
      <div className="bg-secondary text-secondary-foreground">
        {subtitle && (
          <div className="px-4 py-1.5 text-xs font-medium opacity-80 border-b border-secondary-foreground/20">
            {subtitle}
          </div>
        )}
        <div className="px-4 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </div>
      
      {/* Description */}
      {description && (
        <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground border-b border-border">
          {description}
        </div>
      )}
      
      {/* Content */}
      <div className="bg-card">
        {children}
      </div>
    </Card>
  );
}

interface CalculatorSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function CalculatorSection({ title, children, className }: CalculatorSectionProps) {
  return (
    <div className={cn("border-t border-border", className)}>
      <div className="bg-muted px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

interface CalculatorRowProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
  large?: boolean;
  className?: string;
}

export function CalculatorRow({ label, value, unit, highlight = false, large = false, className }: CalculatorRowProps) {
  return (
    <div className={cn(
      "flex justify-between items-center px-4 py-3 border-b border-border/50 last:border-b-0",
      "even:bg-muted/30",
      className
    )}>
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={cn(
        "font-semibold",
        highlight && "text-accent",
        large && "text-xl"
      )}>
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}

interface CalculatorInputRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function CalculatorInputRow({ label, children, className }: CalculatorInputRowProps) {
  return (
    <div className={cn(
      "flex justify-between items-center px-4 py-3 border-b border-border/50 last:border-b-0",
      "even:bg-muted/30",
      className
    )}>
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}

interface CalculatorNotesProps {
  children: ReactNode;
  className?: string;
}

export function CalculatorNotes({ children, className }: CalculatorNotesProps) {
  return (
    <div className={cn("border-t border-border", className)}>
      <div className="bg-muted px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Notes
      </div>
      <div className="px-4 py-3 bg-muted/30 text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

interface CalculatorResultProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: "compliant" | "warning" | "non-compliant";
  className?: string;
}

export function CalculatorResult({ label, value, unit, status, className }: CalculatorResultProps) {
  const statusColors = {
    compliant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "non-compliant": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className={cn(
      "flex justify-between items-center px-4 py-4 border-t border-border bg-primary/5",
      className
    )}>
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xl font-bold",
          status ? statusColors[status] : "text-accent",
          status && "px-3 py-1 rounded-full text-sm"
        )}>
          {value}
          {unit && !status && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
        </span>
      </div>
    </div>
  );
}
