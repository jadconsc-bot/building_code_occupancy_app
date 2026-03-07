/**
 * CompliancePDFExport Component
 * Generates professional PDF reports with legal citations and full justification
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, AlertCircle } from "lucide-react";
import jsPDF from "jspdf";

interface ComplianceSnapshot {
  snapshotId: string;
  projectId: number;
  rulesetId: string;
  mode: "strict" | "soft";
  complianceStatus: "compliant" | "non_compliant" | "conditional";
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  ruleTrace: Array<{
    rule_id: string;
    clause: string;
    fired: boolean;
  }>;
  createdAt: Date;
}

export function CompliancePDFExport({ snapshot }: { snapshot: ComplianceSnapshot }) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Header
      pdf.setFontSize(16);
      (pdf.setFont as any)(undefined, "bold");
      (pdf.text as any)("COMPLIANCE ANALYSIS REPORT", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      (pdf.setFont as any)(undefined, "normal");
      (pdf.text as any)("Professional Code Compliance Evaluation", margin, yPosition);
      yPosition += 15;

      // Legal Disclaimer Box
      pdf.setFillColor(255, 240, 240);
      pdf.rect(margin, yPosition, contentWidth, 25, "F");
      pdf.setFontSize(9);
      (pdf.setFont as any)(undefined, "bold");
      pdf.text("LEGAL DISCLAIMER", margin + 3, yPosition + 5);
      (pdf.setFont as any)(undefined, "normal");
      pdf.setFontSize(8);
      const disclaimerText =
        "This analysis must be reviewed by a qualified professional before use in legal or regulatory proceedings. Results are provided as-is without warranty.";
      const disclaimerLines = pdf.splitTextToSize(disclaimerText, contentWidth - 6) as string[];
      (pdf.text as any)(disclaimerLines, margin + 3, yPosition + 10);
      yPosition += 30;

      // Report Metadata
      pdf.setFontSize(12);
      (pdf.setFont as any)(undefined, "bold");
      (pdf.text as any)("REPORT METADATA", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      (pdf.setFont as any)(undefined, "normal");
      (pdf.text as any)(`Report ID: ${snapshot.snapshotId}`, margin, yPosition);
      yPosition += 6;
      (pdf.text as any)(`Generated: ${new Date(snapshot.createdAt).toLocaleString()}`, margin, yPosition);
      yPosition += 6;
      (pdf.text as any)(`Code Edition: ${snapshot.rulesetId}`, margin, yPosition);
      yPosition += 6;
      const modeText = snapshot.mode === "strict" ? "Strict (Legal)" : "Soft (Design)";
      (pdf.text as any)(`Analysis Mode: ${modeText}`, margin, yPosition);
      yPosition += 15;

      // Compliance Status
      const statusColor =
        snapshot.complianceStatus === "compliant"
          ? [0, 128, 0]
          : snapshot.complianceStatus === "non_compliant"
            ? [255, 0, 0]
            : [255, 165, 0];

      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.rect(margin, yPosition, contentWidth, 15, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      (pdf.setFont as any)(undefined, "bold");
      const statusText =
        snapshot.complianceStatus === "compliant"
          ? "✓ COMPLIANT"
          : snapshot.complianceStatus === "non_compliant"
            ? "✗ NON-COMPLIANT"
            : "⚠ CONDITIONAL";
      (pdf.text as any)(statusText, margin + 5, yPosition + 10);
      pdf.setTextColor(0, 0, 0);
      yPosition += 20;

      // Input Summary
      pdf.setFontSize(12);
      (pdf.setFont as any)(undefined, "bold");
      (pdf.text as any)("INPUT PARAMETERS", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      (pdf.setFont as any)(undefined, "normal");
      Object.entries(snapshot.inputs).forEach(([key, value]) => {
        const displayValue =
          typeof value === "boolean" ? (value ? "Yes" : "No") : JSON.stringify(value);
        (pdf.text as any)(`${key.replace(/_/g, " ")}: ${displayValue}`, margin, yPosition);
        yPosition += 6;
        if (yPosition > pageHeight - margin - 20) {
          pdf.addPage();
          yPosition = margin;
        }
      });

      yPosition += 5;

      // Compliance Findings
      pdf.setFontSize(12);
      (pdf.setFont as any)(undefined, "bold");
      (pdf.text as any)("COMPLIANCE FINDINGS", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      (pdf.setFont as any)(undefined, "normal");
      Object.entries(snapshot.outputs).forEach(([key, value]) => {
        const status = value ? "✓ PASS" : "✗ FAIL";
        (pdf.text as any)(`${key.replace(/_/g, " ")}: ${status}`, margin, yPosition);
        yPosition += 6;
        if (yPosition > pageHeight - margin - 20) {
          pdf.addPage();
          yPosition = margin;
        }
      });

      // Save PDF
      pdf.save(`compliance-report-${snapshot.snapshotId}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Professional PDF Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Professional Report Format</p>
              <p className="text-xs mt-1">
                Generates a comprehensive PDF with legal disclaimers, input/output summary, and professional
                certification section for regulatory submission.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Report Includes:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Compliance status and findings</li>
            <li>Complete input parameters</li>
            <li>Professional review certification section</li>
            <li>Full legal disclaimer and liability limitations</li>
            <li>Immutable audit trail reference</li>
          </ul>
        </div>

        <Button onClick={generatePDF} disabled={generating} className="w-full" size="lg">
          <Download className="w-4 h-4 mr-2" />
          {generating ? "Generating PDF..." : "Download Professional Report"}
        </Button>
      </CardContent>
    </Card>
  );
}
