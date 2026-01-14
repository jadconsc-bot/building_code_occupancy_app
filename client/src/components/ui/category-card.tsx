import * as React from "react";
import { Card } from "@/components/ui/card";
import { getCategoryColor } from "@/lib/calculatorCategories";

interface CategoryCardProps extends React.ComponentProps<typeof Card> {
  calculatorId: string;
  children: React.ReactNode;
}

export function CategoryCard({ calculatorId, children, className, ...props }: CategoryCardProps) {
  const borderColor = getCategoryColor(calculatorId);
  
  return (
    <Card
      className={`border-l-4 ${className || ""}`}
      style={{ borderLeftColor: borderColor }}
      {...props}
    >
      {children}
    </Card>
  );
}
