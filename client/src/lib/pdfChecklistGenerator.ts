import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  codeRef: string;
  checked?: boolean;
}

export interface ChecklistSection {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface PDFChecklistOptions {
  occupancyCode: string;
  occupancyName: string;
  projectName?: string;
  projectAddress?: string;
  inspectorName?: string;
  date?: string;
  sections: ChecklistSection[];
  includeQRCode?: boolean;
}

export async function generatePDFChecklist(options: PDFChecklistOptions): Promise<void> {
  console.log('generatePDFChecklist called with:', options);
  
  try {
    const {
      occupancyCode,
      occupancyName,
      projectName = 'Unnamed Project',
      projectAddress = '',
      inspectorName = '',
      date = new Date().toLocaleDateString(),
      sections,
      includeQRCode = true,
    } = options;

    console.log('Creating jsPDF instance...');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Generate QR code if requested
    let qrCodeDataUrl: string | undefined;
    if (includeQRCode) {
      const currentUrl = window.location.origin + window.location.pathname + '#' + encodeURIComponent(occupancyCode);
      try {
        qrCodeDataUrl = await QRCode.toDataURL(currentUrl, {
          width: 80,
          margin: 1,
        });
        console.log('QR code generated successfully');
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    }

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Building Code Inspection Checklist', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Occupancy info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`${occupancyCode} - ${occupancyName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Project information box
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Information:', 14, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${projectName}`, 14, yPosition);
    yPosition += 5;
    if (projectAddress) {
      doc.text(`Address: ${projectAddress}`, 14, yPosition);
      yPosition += 5;
    }
    if (inspectorName) {
      doc.text(`Inspector: ${inspectorName}`, 14, yPosition);
      yPosition += 5;
    }
    doc.text(`Date: ${date}`, 14, yPosition);
    yPosition += 10;

    // Add QR code in top right corner
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 34, 10, 24, 24);
      doc.setFontSize(7);
      doc.text('Scan for details', pageWidth - 34, 36, { align: 'left' });
    }

    // Add horizontal line
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 8;

    console.log('Processing sections:', sections.length);
    
    // Process each section
    for (const section of sections) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Section header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.name, 14, yPosition);
      yPosition += 8;

      // Create table for checklist items
      const tableData = section.items.map((item) => [
        item.checked ? '☑' : '☐',
        item.label,
        item.codeRef,
        item.description,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['✓', 'Item', 'Code Ref', 'Description']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [30, 58, 138], // Blueprint blue
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 'auto' },
        },
        didDrawPage: (data) => {
          yPosition = data.cursor?.y || yPosition;
        },
      });

      yPosition += 10;
    }

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        'Based on National Building Code - 2023 Alberta Edition',
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    // Save the PDF
    const filename = `${occupancyCode.replace(/\s+/g, '_')}_Checklist_${date.replace(/\//g, '-')}.pdf`;
    console.log('Saving PDF as:', filename);
    doc.save(filename);
    console.log('PDF saved successfully');
  } catch (error) {
    console.error('Error generating PDF checklist:', error);
    throw error;
  }
}

// Batch export multiple checklists
export async function generateBatchPDFChecklists(
  checklistsOptions: PDFChecklistOptions[]
): Promise<void> {
  console.log('generateBatchPDFChecklists called with', checklistsOptions.length, 'checklists');
  
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let isFirstChecklist = true;

    for (const options of checklistsOptions) {
      if (!isFirstChecklist) {
        doc.addPage();
      }
      isFirstChecklist = false;

      const {
        occupancyCode,
        occupancyName,
        projectName = 'Unnamed Project',
        date = new Date().toLocaleDateString(),
        sections,
        includeQRCode = true,
      } = options;

      let yPosition = 20;

      // Generate QR code if requested
      let qrCodeDataUrl: string | undefined;
      if (includeQRCode) {
        const currentUrl = window.location.origin + window.location.pathname + '#' + encodeURIComponent(occupancyCode);
        try {
          qrCodeDataUrl = await QRCode.toDataURL(currentUrl, {
            width: 80,
            margin: 1,
          });
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }
      }

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Building Code Inspection Checklist', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Occupancy info
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`${occupancyCode} - ${occupancyName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Project information
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Information:', 14, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${projectName}`, 14, yPosition);
      yPosition += 5;
      doc.text(`Date: ${date}`, 14, yPosition);
      yPosition += 10;

      // Add QR code
      if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 34, 10, 24, 24);
        doc.setFontSize(7);
        doc.text('Scan for details', pageWidth - 34, 36, { align: 'left' });
      }

      // Add horizontal line
      doc.setLineWidth(0.5);
      doc.line(14, yPosition, pageWidth - 14, yPosition);
      yPosition += 8;

      // Process sections
      for (const section of sections) {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(section.name, 14, yPosition);
        yPosition += 8;

        const tableData = section.items.map((item) => [
          item.checked ? '☑' : '☐',
          item.label,
          item.codeRef,
          item.description,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['✓', 'Item', 'Code Ref', 'Description']],
          body: tableData,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [30, 58, 138],
            textColor: 255,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 'auto' },
          },
          didDrawPage: (data) => {
            yPosition = data.cursor?.y || yPosition;
          },
        });

        yPosition += 10;
      }
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        'Based on National Building Code - 2023 Alberta Edition',
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    // Save the batch PDF
    const filename = `Batch_Checklists_${new Date().toISOString().split('T')[0]}.pdf`;
    console.log('Saving batch PDF as:', filename);
    doc.save(filename);
    console.log('Batch PDF saved successfully');
  } catch (error) {
    console.error('Error generating batch PDF checklists:', error);
    throw error;
  }
}
