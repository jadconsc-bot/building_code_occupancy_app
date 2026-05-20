/**
 * ExportAnalysisPDFButton Component
 *
 * Generates and downloads a PDF compliance report for VALID-status analyses.
 * Uses client-side PDF generation via the jsPDF library.
 *
 * PD2.0 §9.1: Only VALID analyses can be exported.
 * The exported PDF includes:
 * - Analysis summary with compliance score
 * - Rule evaluation results
 * - Issues and recommendations
 * - Professional reviewer credentials
 * - Audit trail summary
 * - Disclaimer and legal notices
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { jsPDF } from "jspdf";

interface ExportAnalysisPDFButtonProps {
  analysisId: number;
  fileName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ExportAnalysisPDFButton({
  analysisId,
  fileName,
  variant = "outline",
  size = "sm",
}: ExportAnalysisPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportQuery = trpc.drawingAnalysis.exportReport.useQuery(
    { analysisId },
    { enabled: false }
  );

  const handleExport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await exportQuery.refetch();
      if (!result.data) {
        throw new Error("No data returned from export endpoint");
      }

      const data = result.data;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const addLine = (text: string, fontSize: number, bold = false, color: [number, number, number] = [0, 0, 0]) => {
        checkPageBreak(fontSize * 0.6 + 2);
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * (fontSize * 0.5) + 2;
      };

      const addSectionHeader = (title: string) => {
        checkPageBreak(20);
        y += 4;
        doc.setFillColor(30, 58, 138); // deep blue
        doc.rect(margin, y - 5, contentWidth, 10, "F");
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(title.toUpperCase(), margin + 3, y + 2);
        doc.setTextColor(0, 0, 0);
        y += 10;
      };

      const addKeyValue = (key: string, value: string) => {
        checkPageBreak(8);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);
        doc.text(key + ":", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const valLines = doc.splitTextToSize(value, contentWidth - 50);
        doc.text(valLines, margin + 50, y);
        y += Math.max(valLines.length * 4.5, 6);
      };

      // ── Header ────────────────────────────────────────────────────────────
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 30, "F");
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("BUILDING CODE COMPLIANCE REPORT", pageWidth / 2, 13, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("CodeComply — PD2.0 Compliant Output", pageWidth / 2, 22, { align: "center" });
      doc.setTextColor(0, 0, 0);
      y = 38;

      // ── Status badge ──────────────────────────────────────────────────────
      doc.setFillColor(22, 163, 74); // green
      doc.roundedRect(margin, y - 4, 40, 9, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("✓ VALID", margin + 20, y + 1.5, { align: "center" });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 45, y + 1.5);
      y += 12;

      // ── Analysis Summary ──────────────────────────────────────────────────
      addSectionHeader("Analysis Summary");
      addKeyValue("Analysis ID", `#${data.analysisId}`);
      addKeyValue("File", fileName || "N/A");
      addKeyValue("Analysis Type", data.analysisType || "comprehensive");
      addKeyValue("Created", data.createdAt ? new Date(data.createdAt).toLocaleString() : "N/A");
      addKeyValue("Validated", data.validatedAt ? new Date(data.validatedAt).toLocaleString() : "N/A");
      addKeyValue("Rule Engine", `v${data.ruleEngineVersion ?? "N/A"}`);
      addKeyValue("LLM Model", data.llmModelVersion ?? "N/A");
      addKeyValue("Disclaimer Version", `v${data.disclaimerVersion ?? "N/A"}`);

      // ── Compliance Score ──────────────────────────────────────────────────
      addSectionHeader("Compliance Score");
      if (data.complianceScore !== null && data.complianceScore !== undefined) {
        const score = data.complianceScore;
        const scoreColor: [number, number, number] = score >= 80 ? [22, 163, 74] : score >= 60 ? [202, 138, 4] : [220, 38, 38];
        checkPageBreak(20);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...scoreColor);
        doc.text(`${score}%`, margin, y + 10);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(data.complianceLevel ?? "", margin + 30, y + 10);
        doc.setTextColor(0, 0, 0);
        y += 18;
      }
      addKeyValue("Issues Found", String(data.issues?.length ?? 0));
      addKeyValue("Recommendations", String(data.recommendations?.length ?? 0));

      // ── Professional Reviewer ─────────────────────────────────────────────
      if (data.professionalDetails) {
        addSectionHeader("Professional Reviewer");
        addKeyValue("Reviewer", data.reviewerName ?? "N/A");
        addKeyValue("Email", data.reviewerEmail ?? "N/A");
        addKeyValue("License Number", data.professionalDetails.licenseNumber ?? "N/A");
        addKeyValue("Association", data.professionalDetails.association ?? "N/A");
        addKeyValue("Jurisdiction", data.professionalDetails.jurisdiction ?? "N/A");
        if (data.professionalDetails.notes) {
          addKeyValue("Notes", data.professionalDetails.notes);
        }
      }

      // ── Compliance Issues ─────────────────────────────────────────────────
      if (data.issues && data.issues.length > 0) {
        addSectionHeader("Compliance Issues");
        (data.issues as any[]).forEach((issue, idx) => {
          const severityColor: [number, number, number] =
            issue.severity === "critical" ? [220, 38, 38] :
            issue.severity === "major" ? [202, 138, 4] : [80, 80, 80];
          checkPageBreak(18);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...severityColor);
          doc.text(`${idx + 1}. [${(issue.severity || "").toUpperCase()}] ${issue.clause || ""}`, margin, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          const descLines = doc.splitTextToSize(issue.description || "", contentWidth - 5);
          checkPageBreak(descLines.length * 4.5);
          doc.text(descLines, margin + 3, y);
          y += descLines.length * 4.5;
          if (issue.recommendation) {
            doc.setTextColor(30, 58, 138);
            const recLines = doc.splitTextToSize(`Recommendation: ${issue.recommendation}`, contentWidth - 5);
            checkPageBreak(recLines.length * 4.5);
            doc.text(recLines, margin + 3, y);
            y += recLines.length * 4.5;
          }
          doc.setTextColor(0, 0, 0);
          y += 3;
        });
      }

      // ── Recommendations ───────────────────────────────────────────────────
      if (data.recommendations && data.recommendations.length > 0) {
        addSectionHeader("Recommendations");
        (data.recommendations as string[]).forEach((rec, idx) => {
          const recLines = doc.splitTextToSize(`${idx + 1}. ${rec}`, contentWidth);
          checkPageBreak(recLines.length * 4.5 + 2);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(recLines, margin, y);
          y += recLines.length * 4.5 + 2;
        });
      }

      // ── Audit Trail ───────────────────────────────────────────────────────
      if (data.auditTrailSummary && data.auditTrailSummary.length > 0) {
        addSectionHeader("Audit Trail Summary");
        (data.auditTrailSummary as any[]).forEach((event) => {
          const ts = event.timestamp ? new Date(event.timestamp).toISOString() : "N/A";
          addLine(`[${ts}]  ${event.action}  —  ${event.userEmail || "N/A"}`, 8);
        });
      }

      // ── Legal Disclaimer ──────────────────────────────────────────────────
      addSectionHeader("Legal Disclaimer");
      const disclaimerLines = [
        "This report was generated by CodeComply using the PD2.0 two-stage pipeline:",
        "  Stage 1: LLM-based data extraction (informational only)",
        "  Stage 2: Deterministic rule engine evaluation",
        "",
        "This report has been reviewed and validated by a licensed professional.",
        "The VALID status indicates professional review has been completed.",
        "This report may be used for informational purposes only.",
        "Always verify compliance with local authorities having jurisdiction (AHJ).",
      ];
      disclaimerLines.forEach((line) => addLine(line, 8, false, [80, 80, 80]));

      // ── Footer on every page ──────────────────────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 160, 160);
        doc.text(
          `CodeComply PD2.0 — Analysis #${data.analysisId} — Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
      }

      // Save
      const safeName = (fileName || `analysis-${analysisId}`)
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "_");
      doc.save(`compliance-report-${safeName}-${analysisId}.pdf`);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleExport}
        disabled={isGenerating}
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <FileText className="w-4 h-4" />
            Export Compliance Report
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
