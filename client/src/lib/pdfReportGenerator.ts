import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export interface ProjectDetails {
  projectName: string;
  projectAddress: string;
  projectNumber?: string;
  preparedBy: string;
  preparedFor?: string;
  date: string;
  engineerName?: string;
  engineerLicense?: string;
  companyName?: string;
  companyLogo?: string;
}

export interface CalculatorData {
  calculatorName: string;
  nbcReference: string;
  inputs: Array<{ label: string; value: string; unit?: string }>;
  results: Array<{ label: string; value: string; unit?: string; status?: 'pass' | 'fail' | 'warning' }>;
  notes?: string[];
  codeRequirements?: string[];
}

export function generateCalculatorPDF(
  projectDetails: ProjectDetails,
  calculatorData: CalculatorData
): void {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Building Code Calculation Report', 105, yPos, { align: 'center' });
  yPos += 10;

  // Calculator Name
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(calculatorData.calculatorName, 105, yPos, { align: 'center' });
  yPos += 15;

  // Project Information Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Project Information', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const projectInfo = [
    ['Project Name:', projectDetails.projectName],
    ['Project Address:', projectDetails.projectAddress],
    ...(projectDetails.projectNumber ? [['Project Number:', projectDetails.projectNumber]] : []),
    ['Prepared By:', projectDetails.preparedBy],
    ...(projectDetails.preparedFor ? [['Prepared For:', projectDetails.preparedFor]] : []),
    ['Date:', projectDetails.date],
  ];

  doc.autoTable({
    startY: yPos,
    head: [],
    body: projectInfo,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 130 }
    },
    margin: { left: 20 }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // NBC Reference
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NBC 2025 Reference', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(calculatorData.nbcReference, 20, yPos);
  yPos += 10;

  // Input Parameters
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Input Parameters', 20, yPos);
  yPos += 7;

  const inputRows = calculatorData.inputs.map(input => [
    input.label,
    input.unit ? `${input.value} ${input.unit}` : input.value
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: inputRows,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 80, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Results
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Calculation Results', 20, yPos);
  yPos += 7;

  const resultRows = calculatorData.results.map(result => {
    const value = result.unit ? `${result.value} ${result.unit}` : result.value;
    const status = result.status ? result.status.toUpperCase() : '';
    return [result.label, value, status];
  });

  doc.autoTable({
    startY: yPos,
    head: [['Result', 'Value', 'Status']],
    body: resultRows,
    theme: 'striped',
    headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60, halign: 'right' },
      2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: function(data: any) {
      if (data.column.index === 2 && data.cell.text[0]) {
        const status = data.cell.text[0].toLowerCase();
        if (status === 'pass') {
          data.cell.styles.textColor = [39, 174, 96]; // Green
        } else if (status === 'fail') {
          data.cell.styles.textColor = [231, 76, 60]; // Red
        } else if (status === 'warning') {
          data.cell.styles.textColor = [243, 156, 18]; // Orange
        }
      }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Code Requirements
  if (calculatorData.codeRequirements && calculatorData.codeRequirements.length > 0) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NBC Code Requirements', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    calculatorData.codeRequirements.forEach((req, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${index + 1}. ${req}`, 25, yPos, { maxWidth: 160 });
      yPos += 6;
    });

    yPos += 5;
  }

  // Notes
  if (calculatorData.notes && calculatorData.notes.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    calculatorData.notes.forEach((note, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`• ${note}`, 25, yPos, { maxWidth: 160 });
      yPos += 6;
    });
  }

  // Footer with signature block
  doc.addPage();
  yPos = 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Professional Certification', 20, yPos);
  yPos += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('This calculation has been prepared in accordance with the National Building Code of Canada 2025', 20, yPos, { maxWidth: 170 });
  yPos += 15;

  if (projectDetails.engineerName) {
    doc.text(`Prepared by: ${projectDetails.engineerName}`, 20, yPos);
    yPos += 7;
  }

  if (projectDetails.engineerLicense) {
    doc.text(`Professional License: ${projectDetails.engineerLicense}`, 20, yPos);
    yPos += 7;
  }

  if (projectDetails.companyName) {
    doc.text(`Company: ${projectDetails.companyName}`, 20, yPos);
    yPos += 15;
  }

  // Signature line
  yPos += 20;
  doc.line(20, yPos, 100, yPos);
  yPos += 5;
  doc.setFontSize(9);
  doc.text('Professional Engineer Signature', 20, yPos);
  yPos += 10;
  doc.text(`Date: _______________________`, 20, yPos);

  // Disclaimer
  yPos += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('DISCLAIMER: This calculation is based on the inputs provided and applicable NBC 2025 requirements.', 20, yPos, { maxWidth: 170 });
  yPos += 4;
  doc.text('Verify all assumptions and consult local building authorities for specific requirements.', 20, yPos, { maxWidth: 170 });

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `${calculatorData.calculatorName.replace(/\s+/g, '_')}_${projectDetails.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
