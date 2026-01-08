import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, X, Plus, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export interface ComparisonItem {
  id: string;
  calculatorType: "floor-joist" | "beam" | "roof-rafter" | "column";
  parameters: Record<string, string | number>;
  result: {
    value: number;
    unit: string;
    label: string;
  };
  timestamp: number;
}

interface CalculatorComparisonProps {
  items: ComparisonItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export function CalculatorComparison({ items, onRemoveItem, onClearAll }: CalculatorComparisonProps) {
  if (items.length === 0) {
    return (
      <Card className="rounded-none border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border bg-muted/20">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" /> Calculator Comparison
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            No items to compare. Add calculator results using the "Add to Comparison" button.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Plus className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Start adding calculator results to compare different scenarios</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Prepare comparison data
      const comparisonData = items.map((item, index) => {
        const row: Record<string, string | number> = {
          "#": index + 1,
          "Calculator Type": getCalculatorTypeName(item.calculatorType),
          "Result": `${item.result.value} ${item.result.unit}`,
        };
        
        // Add all parameters
        Object.entries(item.parameters).forEach(([key, value]) => {
          row[formatParameterName(key)] = value;
        });
        
        return row;
      });
      
      const worksheet = XLSX.utils.json_to_sheet(comparisonData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Comparison");
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `calculator-comparison-${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      toast.success("Comparison exported to Excel successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export comparison");
    }
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" /> Calculator Comparison
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Comparing {items.length} scenario{items.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={onClearAll}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="relative border border-border rounded-none p-4 bg-card hover:border-primary/50 transition-colors"
            >
              {/* Remove Button */}
              <Button
                onClick={() => onRemoveItem(item.id)}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
              
              {/* Item Header */}
              <div className="mb-3">
                <Badge variant="secondary" className="mb-2">
                  Scenario {index + 1}
                </Badge>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                  {getCalculatorTypeName(item.calculatorType)}
                </h4>
              </div>
              
              {/* Result */}
              <div className="mb-4 p-3 bg-primary/5 border-l-4 border-primary">
                <p className="text-xs text-muted-foreground mb-1">{item.result.label}</p>
                <p className="text-2xl font-bold text-primary">
                  {item.result.value} {item.result.unit}
                </p>
              </div>
              
              {/* Parameters */}
              <div className="space-y-2">
                {Object.entries(item.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{formatParameterName(key)}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
              
              {/* Timestamp */}
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Comparison Table */}
        {items.length > 1 && (
          <div className="mt-8">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">
              Results Summary
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/20">
                    <th className="border border-border p-2 text-left text-xs font-bold uppercase tracking-wider">
                      Scenario
                    </th>
                    <th className="border border-border p-2 text-left text-xs font-bold uppercase tracking-wider">
                      Type
                    </th>
                    <th className="border border-border p-2 text-center text-xs font-bold uppercase tracking-wider">
                      Result
                    </th>
                    {/* Get all unique parameter keys */}
                    {Array.from(
                      new Set(items.flatMap(item => Object.keys(item.parameters)))
                    ).map(key => (
                      <th
                        key={key}
                        className="border border-border p-2 text-left text-xs font-bold uppercase tracking-wider"
                      >
                        {formatParameterName(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="border border-border p-2 text-sm font-medium">
                        Scenario {index + 1}
                      </td>
                      <td className="border border-border p-2 text-xs">
                        {getCalculatorTypeName(item.calculatorType)}
                      </td>
                      <td className="border border-border p-2 text-center text-sm font-bold text-primary">
                        {item.result.value} {item.result.unit}
                      </td>
                      {Array.from(
                        new Set(items.flatMap(item => Object.keys(item.parameters)))
                      ).map(key => (
                        <td key={key} className="border border-border p-2 text-xs">
                          {item.parameters[key] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getCalculatorTypeName(type: ComparisonItem["calculatorType"]): string {
  const names = {
    "floor-joist": "Floor Joist Span",
    "beam": "Beam Span",
    "roof-rafter": "Roof Rafter Span",
    "column": "Column Load",
  };
  return names[type] || type;
}

function formatParameterName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
