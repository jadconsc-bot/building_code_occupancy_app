import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project } from '@/components/ProjectDashboard';

interface ChecklistItem {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  phase: string;
  status?: 'pass' | 'fail' | 'conditional';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PDFGeneratorOptions {
  includeNotes?: boolean;
  includeTimestamps?: boolean;
  includeComplianceSummary?: boolean;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

/**
 * ChecklistPDFGenerator - Generates professional PDF documents from project checklists
 * Includes project details, checklist items with status indicators, and compliance summaries
 */
export class ChecklistPDFGenerator {
  private doc: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number = 15;
  private lineHeight: number = 7;
  private options: Required<PDFGeneratorOptions>;

  constructor(options: PDFGeneratorOptions = {}) {
    this.options = {
      includeNotes: options.includeNotes ?? true,
      includeTimestamps: options.includeTimestamps ?? true,
      includeComplianceSummary: options.includeComplianceSummary ?? true,
      pageSize: options.pageSize ?? 'a4',
      orientation: options.orientation ?? 'portrait',
    };

    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.pageSize,
    });

    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.currentY = this.margin;
  }

  /**
   * Check if we need a new page and add one if necessary
   */
  private checkPageBreak(spaceNeeded: number = 20): void {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
      this.addPageFooter();
    }
  }

  /**
   * Add header with project title and date
   */
  private addHeader(project: Project): void {
    this.doc.setFontSize(18);
    (this.doc as any).setFont(undefined, 'bold');
    this.doc.text('Inspection Checklist Report', this.margin, this.currentY);
    this.currentY += 12;

    this.doc.setFontSize(10);
    (this.doc as any).setFont(undefined, 'normal');
    this.doc.text(`Project: ${project.name}`, this.margin, this.currentY);
    this.currentY += 6;

    if ((project as any).description) {
      this.doc.setFontSize(9);
      const descLines = this.doc.splitTextToSize((project as any).description, this.pageWidth - 2 * this.margin) as string[];
      this.doc.text(descLines, this.margin, this.currentY);
      this.currentY += descLines.length * this.lineHeight + 2;
    }

    const now = new Date();
    this.doc.setFontSize(9);
    (this.doc as any).setFont(undefined, 'italic');
    this.doc.text(`Generated: ${now.toLocaleString()}`, this.margin, this.currentY);
    this.currentY += 8;

    // Add separator line
    this.doc.setDrawColor(200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 6;
  }

  /**
   * Add project information section
   */
  private addProjectInfo(project: Project): void {
    this.checkPageBreak(30);

    this.doc.setFontSize(12);
    (this.doc as any).setFont(undefined, 'bold');
    this.doc.text('Project Information', this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(10);
    (this.doc as any).setFont(undefined, 'normal');

    const infoData = [
      ['Project Name:', project.name],
      ['Occupancy Type:', (project as any).occupancyName || 'Not specified'],
      ['Address:', project.address || 'Not specified'],
      ['Project ID:', `#${project.id}`],
      ['Created:', project.createdDate ? new Date(project.createdDate).toLocaleDateString() : 'N/A'],
    ];

    infoData.forEach(([label, value]) => {
      (this.doc as any).setFont(undefined, 'bold');
      this.doc.text(String(label), this.margin, this.currentY);
      (this.doc as any).setFont(undefined, 'normal');
      this.doc.text(String(value), this.margin + 60, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 4;
  }

  /**
   * Add checklist items grouped by phase
   */
  private addChecklistItems(items: ChecklistItem[]): void {
    // Group items by phase
    const itemsByPhase = items.reduce(
      (acc, item) => {
        if (!acc[item.phase]) {
          acc[item.phase] = [];
        }
        acc[item.phase].push(item);
        return acc;
      },
      {} as Record<string, ChecklistItem[]>
    );

    Object.entries(itemsByPhase).forEach(([phase, phaseItems]) => {
      this.checkPageBreak(20);

      // Phase header
      this.doc.setFontSize(11);
      (this.doc as any).setFont(undefined, 'bold');
      this.doc.setFillColor(240, 240, 240);
      this.doc.rect(this.margin, this.currentY - 4, this.pageWidth - 2 * this.margin, 8, 'F');
      this.doc.text(`Phase: ${phase}`, this.margin + 2, this.currentY);
      this.currentY += 10;

      // Create table for phase items
      const tableData = phaseItems.map((item) => [
        this.getStatusSymbol(item.status),
        item.title || '',
        item.description || '',
        item.notes || '',
      ]);

      autoTable(this.doc, {
        head: [['Status', 'Item', 'Description', this.options.includeNotes ? 'Notes' : '']],
        body: tableData,
        startY: this.currentY,
        margin: { left: this.margin, right: this.margin, top: 10, bottom: 10 },
        didDrawPage: (data: any) => {
          this.currentY = data.cursor.y + 2;
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' as const },
          1: { cellWidth: 40 },
          2: { cellWidth: 50 },
          3: { cellWidth: this.options.includeNotes ? 30 : 0 },
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      } as any);

      this.currentY += 4;
    });
  }

  /**
   * Get status symbol for PDF
   */
  private getStatusSymbol(status: string | undefined): string {
    switch (status) {
      case 'pass':
        return '✓'; // Checkmark
      case 'fail':
        return '✗'; // X mark
      case 'conditional':
        return '◐'; // Half circle
      default:
        return '○'; // Empty circle
    }
  }

  /**
   * Add compliance summary section
   */
  private addComplianceSummary(items: ChecklistItem[]): void {
    this.checkPageBreak(30);

    this.doc.setFontSize(12);
    (this.doc as any).setFont(undefined, 'bold');
    this.doc.text('Compliance Summary', this.margin, this.currentY);
    this.currentY += 8;

    // Calculate statistics
    const stats = {
      total: items.length,
      passed: items.filter((i) => i.status === 'pass').length,
      failed: items.filter((i) => i.status === 'fail').length,
      conditional: items.filter((i) => i.status === 'conditional').length,
      unchecked: items.filter((i) => !i.status).length,
    };

    const passPercentage = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

    this.doc.setFontSize(10);
    (this.doc as any).setFont(undefined, 'normal');

    // Summary table
    const summaryData = [
      ['Total Items:', String(stats.total)],
      ['Passed (✓):', `${stats.passed} (${passPercentage}%)`],
      ['Failed (✗):', String(stats.failed)],
      ['Conditional (◐):', String(stats.conditional)],
      ['Unchecked (○):', String(stats.unchecked)],
    ];

    summaryData.forEach(([label, value], index) => {
      (this.doc as any).setFont(undefined, 'bold');
      this.doc.text(String(label), this.margin, this.currentY);
      (this.doc as any).setFont(undefined, 'normal');
      this.doc.text(String(value), this.margin + 60, this.currentY);
      this.currentY += 6;
    });

    // Compliance status
    this.currentY += 4;
    (this.doc as any).setFont(undefined, 'bold');
    if (stats.failed === 0 && stats.unchecked === 0) {
      (this.doc as any).setTextColor(34, 139, 34); // Green
      this.doc.text('Status: COMPLIANT ✓', this.margin, this.currentY);
    } else if (stats.failed > 0) {
      (this.doc as any).setTextColor(220, 20, 60); // Red
      this.doc.text('Status: NON-COMPLIANT ✗', this.margin, this.currentY);
    } else {
      (this.doc as any).setTextColor(255, 140, 0); // Orange
      this.doc.text('Status: PENDING REVIEW ◐', this.margin, this.currentY);
    }
    (this.doc as any).setTextColor(0);
    this.currentY += 8;
  }

  /**
   * Add footer to each page
   */
  private addPageFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    this.doc.setFontSize(8);
    (this.doc as any).setFont(undefined, 'italic');
    (this.doc as any).setTextColor(150);
    this.doc.text(
      `Page ${pageCount}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' } as any
    );
    (this.doc as any).setTextColor(0);
  }

  /**
   * Generate PDF document
   */
  public generatePDF(project: Project, items: ChecklistItem[]): jsPDF {
    this.addHeader(project);
    this.addProjectInfo(project);
    this.addChecklistItems(items);

    if (this.options.includeComplianceSummary) {
      this.addComplianceSummary(items);
    }

    // Add footer to all pages
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.addPageFooter();
    }

    return this.doc;
  }

  /**
   * Download PDF file
   */
  public downloadPDF(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Get PDF as data URL for preview
   */
  public getPDFDataUrl(): string {
    return this.doc.output('dataurlstring');
  }

  /**
   * Get PDF as blob for upload
   */
  public getPDFBlob(): Blob {
    return this.doc.output('blob');
  }
}

/**
 * Batch PDF generator for multiple checklists
 */
export class BatchChecklistPDFGenerator {
  /**
   * Generate a single PDF with multiple checklists
   */
  static generateCombinedPDF(
    projects: Project[],
    itemsByProject: Record<number, ChecklistItem[]>,
    options?: PDFGeneratorOptions
  ): jsPDF {
    const doc = new jsPDF({
      orientation: options?.orientation ?? 'portrait',
      unit: 'mm',
      format: options?.pageSize ?? 'a4',
    });

    let isFirstProject = true;

      projects.forEach((project) => {
      if (!isFirstProject) {
        doc.addPage();
      }
      isFirstProject = false;

      const generator = new ChecklistPDFGenerator(options);
      const projectId = typeof project.id === 'string' ? parseInt(project.id, 10) : project.id;
      const projectItems = itemsByProject[projectId] || [];
      const projectDoc = generator.generatePDF(project, projectItems);

      // Copy pages from project PDF to combined PDF
      const pageCount = projectDoc.getNumberOfPages();
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) doc.addPage();
        const pageData = (projectDoc.internal as any).pages[i + 1];
        (doc.internal as any).pages.push(pageData);
      }
    });

    return doc;
  }
}
