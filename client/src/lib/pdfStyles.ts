/**
 * Shared PDF styling helpers for CodeComply reports.
 * All generators use these constants and helpers for visual consistency.
 */
import jsPDF from 'jspdf';

// ── Palette ──────────────────────────────────────────────────────────────────
export const C = {
  navyDark:   [27,  43,  75]  as [number, number, number], // #1B2B4B
  navyMid:    [45,  74,  138] as [number, number, number], // #2D4A8A
  cream:      [255, 253, 247] as [number, number, number], // #FFFDF7
  creamWarm:  [240, 237, 227] as [number, number, number], // #F0EDE3
  creamBorder:[216, 208, 190] as [number, number, number], // #D8D0BE
  green:      [30,  107, 60]  as [number, number, number], // #1E6B3C
  textPrimary:[44,  44,  42]  as [number, number, number], // #2C2C2A
  textMuted:  [136, 135, 128] as [number, number, number], // #888780
  navyText:   [200, 212, 232] as [number, number, number], // #C8D4E8
  navySubtext:[143, 164, 200] as [number, number, number], // #8FA4C8
  amber:      [183, 119, 13]  as [number, number, number], // #B7770D
  red:        [146, 43,  33]  as [number, number, number], // #922B21
  white:      [255, 255, 255] as [number, number, number],
} as const;

// ── Building type labels ──────────────────────────────────────────────────────
export const BUILDING_TYPE_LABELS: Record<string, string> = {
  part9_single_family: 'Part 9 — Single Family Residential',
  part9_multiplex:     'Part 9 — Multi-Family',
  part3_residential:   'Part 3 — Residential',
  part3_commercial:    'Part 3 — Commercial',
  part3_industrial:    'Part 3 — Industrial',
};

// ── autoTable style presets ───────────────────────────────────────────────────
export const TABLE_STYLES = {
  styles: {
    fontSize: 9,
    textColor: C.textPrimary,
    lineColor: C.creamBorder,
    lineWidth: 0.2,
  },
  headStyles: {
    fillColor: C.navyDark,
    textColor: C.navyText,
    fontStyle: 'bold' as const,
    fontSize: 9,
  },
  alternateRowStyles: {
    fillColor: C.creamWarm,
  },
};

// label-column style for info tables (dark label / cream value)
export const INFO_COL_LABEL = {
  fillColor: C.navyDark,
  textColor: C.navyText,
  fontStyle: 'bold' as const,
};
export const INFO_COL_VALUE = {
  fillColor: C.cream,
  textColor: C.textPrimary,
};

// ── Status helpers ────────────────────────────────────────────────────────────
export type StatusKey = 'compliant' | 'non_compliant' | 'conditional' | 'approved' | 'rejected' | 'pass' | 'fail';

export function statusFill(status: string): [number, number, number] {
  if (['compliant', 'approved', 'pass'].includes(status)) return C.green;
  if (['conditional'].includes(status)) return C.amber;
  return C.red;
}

export function statusLabel(status: string): string {
  const MAP: Record<string, string> = {
    compliant: 'COMPLIANT',
    non_compliant: 'NON-COMPLIANT',
    conditional: 'CONDITIONAL',
    approved: 'APPROVED',
    rejected: 'REJECTED',
    pass: 'PASS',
    fail: 'FAIL',
  };
  return MAP[status] ?? status.toUpperCase();
}

// ── Page helpers ──────────────────────────────────────────────────────────────

/**
 * Draws the full-width navy header bar.
 * Returns the y position immediately below the header (ready for first content).
 */
export function drawHeader(
  doc: jsPDF,
  reportType: string,
  date: string,
  analyst: string
): number {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.navyDark);
  doc.rect(0, 0, pw, 22, 'F');

  // Left — brand
  doc.setTextColor(...C.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CodeComply', 14, 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.navyText);
  doc.text('BUILDING CODE COMPLIANCE PLATFORM', 14, 17);

  // Right — meta
  doc.setFontSize(8);
  doc.setTextColor(...C.navyText);
  doc.text(reportType, pw - 14, 9, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(...C.navySubtext);
  doc.text(`${date}  \xB7  ${analyst}`, pw - 14, 16.5, { align: 'right' });

  doc.setTextColor(...C.textPrimary);
  return 26;
}

/**
 * Draws a full-width status banner (green / amber / red).
 * Returns y after the banner.
 */
export function drawStatusBanner(
  doc: jsPDF,
  status: string,
  subtitle: string,
  startY: number
): number {
  const pw = doc.internal.pageSize.getWidth();
  const fill = statusFill(status);
  const label = statusLabel(status);
  const bannerH = subtitle ? 18 : 12;

  doc.setFillColor(...fill);
  doc.rect(0, startY, pw, bannerH, 'F');

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(label, pw / 2, startY + (subtitle ? 8 : 8), { align: 'center' });

  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pw / 2, startY + 14, { align: 'center' });
  }

  doc.setTextColor(...C.textPrimary);
  return startY + bannerH + 4;
}

/**
 * Draws a section-title bar (navy mid).
 * Returns y after the bar.
 */
export function drawSectionBar(doc: jsPDF, title: string, y: number): number {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.navyMid);
  doc.rect(14, y, pw - 28, 8, 'F');
  doc.setTextColor(...C.navyText);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 18, y + 5.5);
  doc.setTextColor(...C.textPrimary);
  return y + 11;
}

/**
 * Draws the navy footer bar on every page with page numbers.
 */
export function drawFooters(
  doc: jsPDF,
  leftText: string,
  rightPrefix?: string
): void {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.navyDark);
    doc.rect(0, ph - 12, pw, 12, 'F');
    doc.setTextColor(...C.navyText);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(leftText, 14, ph - 5);
    const right = rightPrefix
      ? `${rightPrefix}  \xB7  Page ${i} of ${pageCount}  \xB7  Confidential`
      : `Page ${i} of ${pageCount}  \xB7  Confidential`;
    doc.text(right, pw - 14, ph - 5, { align: 'right' });
  }
}

/** Effective page content height (accounting for header + footer). */
export function contentHeight(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight() - 20; // 20px footer
}
