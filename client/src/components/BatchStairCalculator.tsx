import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Plus, Trash2, Download, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const exportToPDF = () => {
    const data = rows.filter(row => row.result);
    
    if (data.length === 0) {
      toast.error("No results to export. Calculate first.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Batch Stair Design Calculation Report", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`National Building Code of Canada 2025 - Alberta Edition`, pageWidth / 2, 28, { align: "center" });
    doc.text(`NBC Article 3.4.6 - Stairs, Ramps and Landings`, pageWidth / 2, 34, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, 40, { align: "center" });
    
    // Summary Box
    const compliantCount = data.filter(r => r.result!.compliant).length;
    doc.setFillColor(240, 248, 255);
    doc.rect(15, 48, pageWidth - 30, 20, "F");
    doc.setDrawColor(59, 130, 246);
    doc.rect(15, 48, pageWidth - 30, 20);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 20, 56);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Scenarios: ${data.length}`, 20, 62);
    doc.text(`Code Compliant: ${compliantCount} (${Math.round(compliantCount/data.length*100)}%)`, 80, 62);
    doc.text(`Non-Compliant: ${data.length - compliantCount}`, 140, 62);
    
    // Table
    const tableData = data.map((row, index) => [
      (index + 1).toString(),
      row.stairType === "residential" ? "Residential" : "Commercial",
      row.totalRise,
      row.result!.numRisers.toString(),
      row.result!.actualRiser,
      row.result!.numTreads.toString(),
      row.result!.treadDepth.toString(),
      row.result!.totalRun,
      row.result!.compliant ? "✓ Yes" : "✗ No"
    ]);
    
    autoTable(doc, {
      startY: 75,
      head: [[
        "#",
        "Stair Type",
        "Total Rise\n(mm)",
        "Risers",
        "Riser Ht\n(mm)",
        "Treads",
        "Tread Depth\n(mm)",
        "Total Run\n(mm)",
        "Compliant"
      ]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 9,
        fontStyle: "bold",
        halign: "center"
      },
      bodyStyles: {
        fontSize: 9,
        halign: "center"
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20, fontStyle: "bold" }
      },
      didParseCell: (data) => {
        if (data.column.index === 8 && data.section === "body") {
          if (data.cell.raw === "✓ Yes") {
            data.cell.styles.textColor = [34, 197, 94]; // Green
          } else if (data.cell.raw === "✗ No") {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }
      }
    });
    
    // Code Requirements Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("NBC 2025 Code Requirements", 15, finalY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const requirements = [
      "Residential Stairs (Group C occupancies):",
      "  • Maximum riser height: 200 mm",
      "  • Minimum riser height: 125 mm",
      "  • Minimum tread depth: 235 mm",
      "  • Handrail height: 865-965 mm",
      "",
      "Commercial Stairs (All other occupancies):",
      "  • Maximum riser height: 180 mm",
      "  • Minimum riser height: 125 mm",
      "  • Minimum tread depth: 280 mm",
      "  • Handrail height: 865-920 mm"
    ];
    
    let yPos = finalY + 8;
    requirements.forEach(req => {
      doc.text(req, 15, yPos);
      yPos += 5;
    });
    
    // Professional Stamp Area
    const stampY = pageHeight - 50;
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, stampY, 80, 35);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Professional Stamp/Seal", 55, stampY + 18, { align: "center" });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "This calculation is based on NBC 2025 requirements. Verify with local authorities having jurisdiction.",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    
    doc.save(`Batch_Stair_Design_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Exported to PDF successfully");
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={exportToExcel}
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel
                </Button>
              </>
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
