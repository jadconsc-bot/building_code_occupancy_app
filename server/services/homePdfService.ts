/**
 * CodeComply Home — PDF Report Generator
 * Uses jsPDF (already in deps). Runs server-side via node canvas.
 *
 * Generates a consumer-grade report with:
 *   1. Cover / project summary
 *   2. Compliance matrix (plain language)
 *   3. Required permits list
 *   4. Required inspections checklist
 *   5. Estimated timeline
 *   6. Next steps
 *   7. Disclaimer (building code only — NOT a professional stamp, NOT zoning)
 */

import { jsPDF } from "jspdf";
import type { ComplianceReport, ComplianceItem } from "./homeComplianceEngine.js";

type RGB = [number, number, number];
const BRAND_COLOR: RGB = [30, 64, 175];   // indigo-800
const PASS_COLOR: RGB  = [22, 101, 52];   // green-800
const COND_COLOR: RGB  = [120, 53, 15];   // amber-900
const FAIL_COLOR: RGB  = [153, 27, 27];   // red-800
const GRAY: RGB        = [75, 85, 99];
const LIGHT_GRAY: RGB  = [243, 244, 246];

export interface ReportMeta {
  reportToken: string;
  email: string;
  province: string;
  municipality?: string;
  projectTypeLabel: string;
  generatedAt: Date;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  secondary_suite: "Secondary Suite",
  deck_patio: "Deck / Patio",
  basement_development: "Basement Development",
  new_single_family: "New Single-Family Home",
  addition_renovation: "Addition / Renovation",
  detached_garage: "Detached Garage",
  interior_alteration: "Interior Alteration",
  pool_hot_tub: "Pool / Hot Tub",
};

const REQUIRED_PERMITS: Record<string, string[]> = {
  secondary_suite: ["Building permit", "Electrical permit (if new wiring)", "Plumbing permit (if new plumbing)", "Gas permit (if gas appliance added)"],
  deck_patio: ["Building permit"],
  basement_development: ["Building permit", "Electrical permit", "Plumbing permit (if bathroom added)"],
  new_single_family: ["Development permit", "Building permit", "Electrical permit", "Plumbing permit", "Gas permit"],
  addition_renovation: ["Building permit", "Electrical permit (if scope includes electrical)", "Plumbing permit (if scope includes plumbing)"],
  default: ["Building permit — contact your municipality for project-specific requirements"],
};

const REQUIRED_INSPECTIONS: Record<string, string[]> = {
  secondary_suite: ["Footing / foundation (if new entrance)", "Framing", "Insulation & vapour barrier", "Fire separation", "Final occupancy"],
  deck_patio: ["Footing", "Framing", "Final"],
  basement_development: ["Framing", "Insulation & vapour barrier", "Electrical rough-in", "Plumbing rough-in", "Final"],
  default: ["Contact your building department for required inspection stages"],
};

const ESTIMATED_TIMELINE: Record<string, string> = {
  secondary_suite: "Permit review: 4–12 weeks · Construction: 2–6 months",
  deck_patio: "Permit review: 2–6 weeks · Construction: 1–4 weeks",
  basement_development: "Permit review: 4–8 weeks · Construction: 1–3 months",
  default: "Permit review: 4–12 weeks · Contact your building department for current timelines",
};

function resultSymbol(r: ComplianceItem["result"]): string {
  return r === "pass" ? "PASS" : r === "conditional" ? "CONDITIONAL" : "FAIL";
}

function resultColor(r: ComplianceItem["result"]) {
  return r === "pass" ? PASS_COLOR : r === "conditional" ? COND_COLOR : FAIL_COLOR;
}

export async function generateHomeReportPdf(
  report: ComplianceReport,
  meta: ReportMeta,
): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });

  const pw = 215.9;
  const margin = 18;
  const contentW = pw - margin * 2;
  let y = 0;

  // ─── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pw, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CodeComply Home", margin, 14);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Building Code Compliance Report", margin, 21);
  doc.text(`Report ID: ${meta.reportToken.slice(0, 16)}…`, margin, 28);

  y = 42;

  // ─── Project summary ────────────────────────────────────────────────────────
  doc.setTextColor(...GRAY);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Project Summary", margin, y);
  y += 7;

  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(margin, y, contentW, 26, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);

  const summaryLines = [
    [`Project Type`, meta.projectTypeLabel],
    [`Province`, meta.province],
    [`Municipality`, meta.municipality ?? "Not specified"],
    [`Code Edition`, report.codeEdition],
    [`Generated`, meta.generatedAt.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })],
  ];

  const colW = contentW / 2;
  summaryLines.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? margin + 4 : margin + colW + 4;
    const row = y + 5 + Math.floor(i / 2) * 8;
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, col, row);
    doc.setFont("helvetica", "normal");
    doc.text(value, col + 30, row);
  });

  y += 32;

  // ─── Overall result badge ───────────────────────────────────────────────────
  const overallColor = resultColor(report.overallResult);
  doc.setFillColor(...overallColor);
  doc.roundedRect(margin, y, contentW, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Overall Result: ${resultSymbol(report.overallResult)}`, margin + 4, y + 8);
  y += 18;

  // ─── Compliance matrix ──────────────────────────────────────────────────────
  doc.setTextColor(...GRAY);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Compliance Matrix", margin, y);
  y += 6;

  for (const item of report.items) {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    const color = resultColor(item.result);
    const label = resultSymbol(item.result);

    // Row background
    doc.setFillColor(item.result === "pass" ? 240 : item.result === "conditional" ? 254 : 254, 249, 239);
    doc.rect(margin, y, contentW, item.whatToDo ? 20 : 14, "F");

    // Result badge
    doc.setFillColor(...color);
    doc.rect(margin, y, 24, item.whatToDo ? 20 : 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin + 2, y + (item.whatToDo ? 11 : 8));

    // Title + message
    doc.setTextColor(...GRAY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(item.title, margin + 27, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const msgLines = doc.splitTextToSize(item.message, contentW - 28);
    doc.text(msgLines[0], margin + 27, y + 11);

    if (item.whatToDo) {
      doc.setTextColor(...color);
      const wtdLines = doc.splitTextToSize(`What to do: ${item.whatToDo}`, contentW - 28);
      doc.text(wtdLines[0], margin + 27, y + 16);
      doc.setTextColor(...GRAY);
    }

    if (item.codeRef) {
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(item.codeRef, pw - margin - 2, y + 5, { align: "right" });
      doc.setTextColor(...GRAY);
    }

    y += (item.whatToDo ? 22 : 16);
  }

  y += 4;

  // ─── Required permits ───────────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Required Permits", margin, y);
  y += 6;

  const permits = REQUIRED_PERMITS[report.projectType] ?? REQUIRED_PERMITS.default;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const p of permits) {
    doc.text(`• ${p}`, margin + 4, y);
    y += 5;
  }

  y += 6;

  // ─── Required inspections ───────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Required Inspections", margin, y);
  y += 6;

  const inspections = REQUIRED_INSPECTIONS[report.projectType] ?? REQUIRED_INSPECTIONS.default;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const insp of inspections) {
    doc.text(`☐  ${insp}`, margin + 4, y);
    y += 5;
  }

  y += 6;

  // ─── Timeline ───────────────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Estimated Timeline", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(ESTIMATED_TIMELINE[report.projectType] ?? ESTIMATED_TIMELINE.default, margin + 4, y);
  y += 12;

  // ─── Next steps ─────────────────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Next Steps", margin, y);
  y += 6;

  const nextSteps = [
    "1. Address all FAIL and CONDITIONAL items in this report before applying for a permit.",
    "2. Prepare your permit application — drawings may be required by your municipality.",
    "3. Submit to your local building department and pay the permit fee.",
    "4. Schedule required inspections during and after construction.",
    "5. Obtain final occupancy approval before using the new space.",
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const step of nextSteps) {
    const lines = doc.splitTextToSize(step, contentW - 4);
    doc.text(lines, margin + 4, y);
    y += lines.length * 5 + 2;
  }

  // ─── Disclaimer ─────────────────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }

  y += 4;
  doc.setFillColor(254, 243, 199); // amber-100
  doc.rect(margin, y, contentW, 38, "F");

  doc.setTextColor(120, 53, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Important Disclaimer", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const disclaimerText = [
    "This report is based solely on the answers you provided and the applicable building code at the time of generation.",
    "It does not constitute a professional engineering or architectural opinion, a professional stamp, or a building permit.",
    "It does not address zoning bylaws, land-use regulations, subdivision restrictions, HOA rules, or utility requirements.",
    "Building code requirements change. Always verify current requirements with your local building department before construction.",
    "For complex projects, consult a licensed professional (P.Eng, architect, or building designer).",
  ];

  let dy = y + 12;
  for (const line of disclaimerText) {
    const lines = doc.splitTextToSize(line, contentW - 8);
    doc.text(lines, margin + 4, dy);
    dy += lines.length * 4.5;
  }

  y = dy + 8;

  // ─── Footer on all pages ─────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `CodeComply Home · Report ${meta.reportToken.slice(0, 16)}… · Page ${i} of ${pageCount} · codecomply.ca`,
      pw / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export function getProjectTypeLabel(projectType: string): string {
  return PROJECT_TYPE_LABELS[projectType] ?? projectType;
}
