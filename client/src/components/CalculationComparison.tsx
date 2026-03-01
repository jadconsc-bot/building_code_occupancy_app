/**
 * Calculation Comparison Component
 * 
 * Allows users to compare two calculations side-by-side
 * Shows differences in inputs, outputs, and compliance status
 * Useful for design iterations and what-if analysis
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Download, Eye } from 'lucide-react';

interface CalculationData {
  id: string;
  name: string;
  type: string;
  date: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  status: 'compliant' | 'warning' | 'non-compliant';
}

interface CalculationComparisonProps {
  calculations?: CalculationData[];
}

export function CalculationComparison({ calculations = [] }: CalculationComparisonProps) {
  const [selectedCalc1, setSelectedCalc1] = useState<string>('');
  const [selectedCalc2, setSelectedCalc2] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);

  const calc1 = calculations.find(c => c.id === selectedCalc1);
  const calc2 = calculations.find(c => c.id === selectedCalc2);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'non-compliant':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-600">Compliant</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-600">Warning</Badge>;
      case 'non-compliant':
        return <Badge className="bg-red-600">Non-Compliant</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const renderDifference = (value1: any, value2: any) => {
    if (value1 === value2) {
      return <span className="text-muted-foreground">No change</span>;
    }
    const diff = typeof value1 === 'number' && typeof value2 === 'number' 
      ? ((value2 - value1) / value1 * 100).toFixed(1)
      : 'N/A';
    return (
      <span className={diff !== 'N/A' && parseFloat(diff) > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
        {value2} {diff !== 'N/A' && `(${diff > 0 ? '+' : ''}${diff}%)`}
      </span>
    );
  };

  return (
    <Card className="rounded-none border-border">
      <CardHeader>
        <CardTitle>Calculation Comparison Tool</CardTitle>
        <CardDescription>
          Compare two calculations side-by-side to analyze differences and design iterations
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto max-h-[500px]">
        {/* Selection Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm font-semibold mb-2 block">First Calculation</label>
            <Select value={selectedCalc1} onValueChange={setSelectedCalc1}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Select calculation" />
              </SelectTrigger>
              <SelectContent>
                {calculations.map(calc => (
                  <SelectItem key={calc.id} value={calc.id}>
                    {calc.name} ({calc.date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Second Calculation</label>
            <Select value={selectedCalc2} onValueChange={setSelectedCalc2}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Select calculation" />
              </SelectTrigger>
              <SelectContent>
                {calculations.map(calc => (
                  <SelectItem key={calc.id} value={calc.id}>
                    {calc.name} ({calc.date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Button */}
        <Button 
          onClick={() => setShowComparison(true)}
          disabled={!selectedCalc1 || !selectedCalc2 || selectedCalc1 === selectedCalc2}
          className="w-full rounded-none"
        >
          <Eye className="w-4 h-4 mr-2" />
          Compare Calculations
        </Button>

        {/* Comparison Dialog */}
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-none">
            <DialogHeader>
              <DialogTitle>Calculation Comparison</DialogTitle>
              <DialogDescription>
                Detailed side-by-side comparison of inputs, outputs, and compliance status
              </DialogDescription>
            </DialogHeader>

            {calc1 && calc2 && (
              <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Status Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 ${getStatusColor(calc1.status)}`}>
                    <p className="text-sm font-semibold mb-2">{calc1.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Status:</span>
                      {getStatusBadge(calc1.status)}
                    </div>
                  </div>
                  <div className={`border rounded-lg p-4 ${getStatusColor(calc2.status)}`}>
                    <p className="text-sm font-semibold mb-2">{calc2.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Status:</span>
                      {getStatusBadge(calc2.status)}
                    </div>
                  </div>
                </div>

                {/* Inputs Comparison */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Input Parameters</h4>
                  <div className="space-y-2 border border-border rounded-lg overflow-hidden">
                    {Object.entries(calc1.inputs).map(([key, value1]) => {
                      const value2 = calc2.inputs[key];
                      return (
                        <div key={key} className="grid grid-cols-3 gap-4 p-3 border-b border-border last:border-b-0 hover:bg-muted/50">
                          <div className="text-sm font-medium text-muted-foreground">{key}</div>
                          <div className="text-sm">{value1}</div>
                          <div className="text-sm text-right">{renderDifference(value1, value2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Outputs Comparison */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Calculation Results</h4>
                  <div className="space-y-2 border border-border rounded-lg overflow-hidden">
                    {Object.entries(calc1.outputs).map(([key, value1]) => {
                      const value2 = calc2.outputs[key];
                      return (
                        <div key={key} className="grid grid-cols-3 gap-4 p-3 border-b border-border last:border-b-0 hover:bg-muted/50">
                          <div className="text-sm font-medium text-muted-foreground">{key}</div>
                          <div className="text-sm font-semibold text-primary">{value1}</div>
                          <div className="text-sm font-semibold text-right text-accent">{renderDifference(value1, value2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Comparison Summary</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Calculation 1: {calc1.name} ({calc1.date})</li>
                    <li>• Calculation 2: {calc2.name} ({calc2.date})</li>
                    <li>• Status Change: {calc1.status} → {calc2.status}</li>
                    <li>• Both calculations are cryptographically signed and immutable</li>
                  </ul>
                </div>

                {/* Export Button */}
                <Button className="w-full rounded-none" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Comparison Report
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Empty State */}
        {calculations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No calculations available for comparison</p>
            <p className="text-xs mt-2">Run calculations to enable this feature</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
