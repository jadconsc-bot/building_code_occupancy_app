import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Plus, Trash2, Download, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface BatchRow {
  id: string;
  stairType: string;
  totalRise: string;
  result?: {
    numRisers: number;
    actualRiser: string;
    numTreads: number;
    treadDepth: number;
    totalRun: string;
    compliant: boolean;
  };
}

export function BatchStairCalculator() {
  const [rows, setRows] = useState<BatchRow[]>([
    { id: "1", stairType: "residential", totalRise: "" }
  ]);

  const addRow = () => {
    const newRow: BatchRow = {
      id: Date.now().toString(),
      stairType: "residential",
      totalRise: ""
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof BatchRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value, result: undefined } : row
    ));
  };

  const calculateRow = (row: BatchRow) => {
    const rise = parseFloat(row.totalRise);
    if (isNaN(rise) || rise <= 0) return undefined;

    const requirements = row.stairType === "residential" 
      ? { minTread: 235, maxRiser: 200, minRiser: 125 }
      : { minTread: 280, maxRiser: 180, minRiser: 125 };

    const numRisers = Math.ceil(rise / requirements.maxRiser);
    const actualRiser = rise / numRisers;
    const numTreads = numRisers - 1;
    const totalRun = numTreads * requirements.minTread;
    const compliant = actualRiser >= requirements.minRiser && actualRiser <= requirements.maxRiser;

    return {
      numRisers,
      actualRiser: actualRiser.toFixed(1),
      numTreads,
      treadDepth: requirements.minTread,
      totalRun: totalRun.toFixed(0),
      compliant
    };
  };

  const calculateAll = () => {
    const updatedRows = rows.map(row => ({
      ...row,
      result: calculateRow(row)
    }));
    setRows(updatedRows);
    toast.success(`Calculated ${updatedRows.filter(r => r.result).length} stair designs`);
  };

  const exportToExcel = () => {
    const data = rows
      .filter(row => row.result)
      .map((row, index) => ({
        "Scenario": index + 1,
        "Stair Type": row.stairType === "residential" ? "Residential" : "Commercial",
        "Total Rise (mm)": row.totalRise,
        "Number of Risers": row.result!.numRisers,
        "Riser Height (mm)": row.result!.actualRiser,
        "Number of Treads": row.result!.numTreads,
        "Tread Depth (mm)": row.result!.treadDepth,
        "Total Run (mm)": row.result!.totalRun,
        "Code Compliant": row.result!.compliant ? "Yes" : "No"
      }));

    if (data.length === 0) {
      toast.error("No results to export. Calculate first.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Stair Design");
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }
    ];

    XLSX.writeFile(workbook, `Batch_Stair_Design_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Exported to Excel successfully");
  };

  const hasResults = rows.some(row => row.result);
  const allCalculated = rows.every(row => row.result);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" /> Batch Stair Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Calculate multiple stair scenarios at once - NBC 3.4.6
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={calculateAll}
              className="gap-2"
            >
              <Calculator className="w-4 h-4" />
              Calculate All
            </Button>
            {hasResults && (
              <Button
                variant="default"
                size="sm"
                onClick={exportToExcel}
                className="gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Stair Type</div>
            <div className="col-span-3">Total Rise (mm)</div>
            <div className="col-span-4">Results</div>
            <div className="col-span-1"></div>
          </div>

          {/* Data Rows */}
          {rows.map((row, index) => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-start p-2 border rounded-lg bg-muted/20">
              <div className="col-span-1 flex items-center h-10">
                <Badge variant="outline" className="text-xs">{index + 1}</Badge>
              </div>
              
              <div className="col-span-3">
                <Select 
                  value={row.stairType} 
                  onValueChange={(value) => updateRow(row.id, "stairType", value)}
                >
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <NumericInput
                  value={row.totalRise}
                  onChange={(e) => updateRow(row.id, "totalRise", e.target.value)}
                  placeholder="e.g., 2700"
                  min="1000"
                  max="10000"
                  unit="mm"
                  showValidation={false}
                  className="h-10 text-xs"
                />
              </div>

              <div className="col-span-4">
                {row.result ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {row.result.compliant ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="font-medium">
                        {row.result.numRisers} risers × {row.result.actualRiser}mm
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.result.numTreads} treads × {row.result.treadDepth}mm = {row.result.totalRun}mm run
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic h-10 flex items-center">
                    Not calculated yet
                  </div>
                )}
              </div>

              <div className="col-span-1 flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add Row Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="w-full gap-2 border-dashed"
          >
            <Plus className="w-4 h-4" />
            Add Scenario
          </Button>

          {/* Summary */}
          {hasResults && (
            <div className="mt-4 p-3 bg-primary/5 border-l-4 border-primary rounded">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {rows.filter(r => r.result?.compliant).length} of {rows.filter(r => r.result).length} designs are code compliant
                </span>
                {allCalculated && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    All Calculated
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
