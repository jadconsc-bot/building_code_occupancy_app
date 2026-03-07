import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { ComparisonItem } from "./CalculatorComparison";

interface PDFReportGeneratorProps {
  occupancyCode?: string;
  occupancyName?: string;
  comparisonItems?: ComparisonItem[];
}

export function PDFReportGenerator({ 
  occupancyCode = "", 
  occupancyName = "",
  comparisonItems = []
}: PDFReportGeneratorProps) {
  const [projectName, setProjectName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [notes, setNotes] = useState("");

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to add wrapped text
      const addWrappedText = (text: string, fontSize: number, maxWidth: number) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          checkPageBreak(10);
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
      };

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Building Code Compliance Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Subtitle
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Horizontal line
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Project Information Section
      if (projectName || projectAddress || projectDescription) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Project Information", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        if (projectName) {
          doc.setFont("helvetica", "bold");
          doc.text("Project Name:", margin, yPosition);
          doc.setFont("helvetica", "normal");
          doc.text(projectName, margin + 35, yPosition);
          yPosition += 7;
        }

        if (projectAddress) {
          doc.setFont("helvetica", "bold");
          doc.text("Address:", margin, yPosition);
          doc.setFont("helvetica", "normal");
          addWrappedText(projectAddress, 10, contentWidth - 35);
          yPosition += 3;
        }

        if (projectDescription) {
          doc.setFont("helvetica", "bold");
          doc.text("Description:", margin, yPosition);
          yPosition += 7;
          doc.setFont("helvetica", "normal");
          addWrappedText(projectDescription, 10, contentWidth);
          yPosition += 3;
        }

        if (preparedBy) {
          doc.setFont("helvetica", "bold");
          doc.text("Prepared By:", margin, yPosition);
          doc.setFont("helvetica", "normal");
          doc.text(preparedBy, margin + 35, yPosition);
          yPosition += 7;
        }

        yPosition += 5;
      }

      // Occupancy Classification Section
      if (occupancyCode && occupancyName) {
        checkPageBreak(30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Occupancy Classification", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Classification: ${occupancyCode} - ${occupancyName}`, margin, yPosition);
        yPosition += 7;
        doc.text("Reference: National Building Code of Canada 2023", margin, yPosition);
        yPosition += 10;
      }

      // Calculator Results Section
      if (comparisonItems && comparisonItems.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Structural Calculator Results", margin, yPosition);
        yPosition += 10;

        comparisonItems.forEach((item, index) => {
          checkPageBreak(50);
          
          // Item header
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${getCalculatorTypeName(item.calculatorType)}`, margin, yPosition);
          yPosition += 8;

          // Result
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Result: ${item.result.value} ${item.result.unit}`, margin + 5, yPosition);
          yPosition += 7;

          // Parameters
          doc.setFont("helvetica", "normal");
          Object.entries(item.parameters).forEach(([key, value]) => {
            checkPageBreak(7);
            doc.text(`  ${formatParameterName(key)}: ${value}`, margin + 5, yPosition);
            yPosition += 6;
          });

          yPosition += 5;
        });
      }

      // Notes Section
      if (notes) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Additional Notes", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        addWrappedText(notes, 10, contentWidth);
        yPosition += 10;
      }

      // Compliance Statement
      checkPageBreak(50);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Compliance Statement", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      const disclaimer = "This report is generated based on the National Building Code of Canada 2023 - Alberta Edition. All calculations and classifications should be verified by a qualified professional engineer or architect. Local building authority approval is required for all construction projects. This report is for preliminary assessment purposes only and does not constitute professional engineering advice.";
      addWrappedText(disclaimer, 9, contentWidth);

      // Footer on every page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        doc.text(
          "Building Code Occupancy Classifier",
          margin,
          pageHeight - 10
        );
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = projectName 
        ? `${projectName.replace(/[^a-z0-9]/gi, '_')}-${timestamp}.pdf`
        : `building-code-report-${timestamp}.pdf`;

      doc.save(filename);
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> PDF Report Generator
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Generate a comprehensive PDF report with project details and calculator results
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Project Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Project Information
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-xs font-medium">
                Project Name
              </Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Downtown Office Building"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectAddress" className="text-xs font-medium">
                Project Address
              </Label>
              <Input
                id="projectAddress"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                placeholder="e.g., 123 Main Street, Calgary, AB"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription" className="text-xs font-medium">
                Project Description
              </Label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Brief description of the project scope and requirements..."
                className="rounded-none min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparedBy" className="text-xs font-medium">
                Prepared By
              </Label>
              <Input
                id="preparedBy"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="e.g., John Smith, P.Eng"
                className="rounded-none"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              Additional Notes
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-medium">
                Project Notes & Observations
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes, observations, or special considerations..."
                className="rounded-none min-h-[100px]"
              />
            </div>
          </div>

          {/* Report Summary */}
          <div className="p-4 bg-muted/30 border border-border rounded-none">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              Report Will Include
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Project information and details</span>
              </li>
              {occupancyCode && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Occupancy classification: {occupancyCode} - {occupancyName}</span>
                </li>
              )}
              {comparisonItems && comparisonItems.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Structural calculator results ({comparisonItems.length} scenario{comparisonItems.length !== 1 ? "s" : ""})</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>NBC 2023 references and compliance notes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Professional disclaimer and verification requirements</span>
              </li>
            </ul>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generatePDF}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <Download className="w-5 h-5" />
            Generate PDF Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getCalculatorTypeName(type: string): string {
  const names: Record<string, string> = {
    "floor-joist": "Floor Joist Span Calculator",
    "beam": "Beam Span Calculator",
    "roof-rafter": "Roof Rafter Span Calculator",
    "column": "Column Load Calculator",
  };
  return names[type] || type;
}

function formatParameterName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
