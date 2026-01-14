import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CalculatorResult {
  calculatorName: string;
  timestamp: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  nbcReference?: string;
}

interface OccupancyDetails {
  code: string;
  name: string;
  description: string;
  examples: string[];
  compliance: {
    fireResistance: string;
    sprinklers: string;
    occupantLoad: string;
    exits: string;
    construction: string;
    notes: string;
  };
}

interface PDFReportData {
  projectName?: string;
  projectAddress?: string;
  preparedBy?: string;
  occupancy?: OccupancyDetails;
  calculatorResults: CalculatorResult[];
  notes?: string;
}

export function generateCodeComplianceReport(data: PDFReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Building Code Compliance Report', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('National Building Code of Canada - 2023 Alberta Edition', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setTextColor(0);

  // Project Information
  if (data.projectName || data.projectAddress || data.preparedBy) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Information', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (data.projectName) {
      doc.text(`Project: ${data.projectName}`, 14, yPos);
      yPos += 6;
    }
    
    if (data.projectAddress) {
      doc.text(`Address: ${data.projectAddress}`, 14, yPos);
      yPos += 6;
    }
    
    if (data.preparedBy) {
      doc.text(`Prepared By: ${data.preparedBy}`, 14, yPos);
      yPos += 6;
    }
    
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, yPos);
    yPos += 10;
  }

  // Occupancy Classification
  if (data.occupancy) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Occupancy Classification', 14, yPos);
    yPos += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.occupancy.code} - ${data.occupancy.name}`, 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(data.occupancy.description, pageWidth - 28);
    doc.text(descLines, 14, yPos);
    yPos += descLines.length * 5 + 5;

    // Compliance Requirements Table
    const complianceData = [
      ['Fire Resistance', data.occupancy.compliance.fireResistance],
      ['Sprinklers', data.occupancy.compliance.sprinklers],
      ['Occupant Load', data.occupancy.compliance.occupantLoad],
      ['Exits', data.occupancy.compliance.exits],
      ['Construction', data.occupancy.compliance.construction],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [['Requirement', 'Value']],
      body: complianceData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Compliance Notes
    if (data.occupancy.compliance.notes) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Compliance Notes:', 14, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(data.occupancy.compliance.notes, pageWidth - 28);
      doc.text(notesLines, 14, yPos);
      yPos += notesLines.length * 5 + 10;
    }
  }

  // Calculator Results
  if (data.calculatorResults.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Design Calculations', 14, yPos);
    yPos += 10;

    data.calculatorResults.forEach((result, index) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${result.calculatorName}`, 14, yPos);
      yPos += 6;

      if (result.nbcReference) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text(`NBC Reference: ${result.nbcReference}`, 14, yPos);
        yPos += 5;
        doc.setTextColor(0);
      }

      // Inputs Table
      const inputsData = Object.entries(result.inputs).map(([key, value]) => [
        key,
        String(value)
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Input Parameter', 'Value']],
        body: inputsData,
        theme: 'plain',
        headStyles: { fillColor: [236, 240, 241], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;

      // Results Table
      const resultsData = Object.entries(result.results).map(([key, value]) => [
        key,
        String(value)
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Result', 'Value']],
        body: resultsData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    });
  }

  // Additional Notes
  if (data.notes) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 28);
    doc.text(notesLines, 14, yPos);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by Building Code Occupancy Classifier',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `Code_Compliance_Report_${Date.now()}.pdf`;
  doc.save(filename);
}

// Export individual calculator result as PDF
export function exportCalculatorToPDF(result: CalculatorResult) {
  generateCodeComplianceReport({
    calculatorResults: [result],
  });
}
