import { Workbook } from 'exceljs';

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  data: any[][];
  headers?: string[];
}

/**
 * Export data to Excel file using exceljs
 */
export async function exportToExcel(options: ExcelExportOptions) {
  const { filename, sheetName, data, headers } = options;

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add headers if provided
  if (headers) {
    worksheet.addRow(headers);
  }

  // Add data rows
  data.forEach(row => {
    worksheet.addRow(row);
  });

  // Auto-size columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellLength = cell.value?.toString().length || 0;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export comparison data to Excel
 */
export async function exportComparisonToExcel(
  occupancy1: string,
  occupancy2: string,
  comparisonData: {
    loadFactors: any;
    constructionLimits: any;
  }
) {
  const data: any[][] = [];

  // Title
  data.push([`Occupancy Comparison: ${occupancy1} vs ${occupancy2}`]);
  data.push([]);

  // Load Factors
  data.push(['Load Calculation Factors']);
  data.push(['Load Type', occupancy1, occupancy2]);
  data.push(['Live Load', comparisonData.loadFactors[occupancy1]?.liveLoad || 'N/A', comparisonData.loadFactors[occupancy2]?.liveLoad || 'N/A']);
  data.push(['Dead Load', comparisonData.loadFactors[occupancy1]?.deadLoad || 'N/A', comparisonData.loadFactors[occupancy2]?.deadLoad || 'N/A']);
  data.push(['Snow Load', comparisonData.loadFactors[occupancy1]?.snowLoad || 'N/A', comparisonData.loadFactors[occupancy2]?.snowLoad || 'N/A']);
  data.push([]);

  // Construction Limits
  data.push(['Construction Limits']);
  data.push(['Article', 'Max Height', 'Max Area', 'Sprinklers', 'Construction Type']);
  
  const limits1 = comparisonData.constructionLimits[occupancy1] || [];
  const limits2 = comparisonData.constructionLimits[occupancy2] || [];
  
  data.push([`${occupancy1} Limits:`]);
  limits1.forEach((limit: any) => {
    data.push([limit.article, limit.maxHeight, limit.maxArea, limit.sprinklers, limit.constructionType]);
  });
  
  data.push([]);
  data.push([`${occupancy2} Limits:`]);
  limits2.forEach((limit: any) => {
    data.push([limit.article, limit.maxHeight, limit.maxArea, limit.sprinklers, limit.constructionType]);
  });

  await exportToExcel({
    filename: `Comparison_${occupancy1}_vs_${occupancy2}`,
    sheetName: 'Comparison',
    data
  });
}

/**
 * Export span table data to Excel
 */
export async function exportSpanTableToExcel(
  application: string,
  species: string,
  grade: string,
  spanData: any[]
) {
  const data: any[][] = [];

  // Title
  data.push([`Structural Span Tables - ${application}`]);
  data.push([`Species: ${species}, Grade: ${grade}`]);
  data.push([]);

  // Headers
  data.push(['Member Size', '12" (305mm)', '16" (406mm)', '24" (610mm)']);

  // Data rows
  spanData.forEach(row => {
    data.push([
      row.size,
      row.spacing12,
      row.spacing16,
      row.spacing24
    ]);
  });

  data.push([]);
  data.push(['Notes:']);
  data.push(['• Spans are based on NBC 2023 Part 9 Span Tables']);
  data.push(['• Floor joists assume 1.9 kPa live load + 0.5 kPa dead load']);
  data.push(['• Consult a structural engineer for complex applications']);

  await exportToExcel({
    filename: `Span_Table_${application}_${species}_${grade}`,
    sheetName: 'Span Table',
    data
  });
}

/**
 * Export inspector checklist to Excel
 */
export async function exportChecklistToExcel(
  occupancy: string,
  phase: string,
  checklistItems: any[],
  progress: { checked: number; total: number }
) {
  const data: any[][] = [];

  // Title
  data.push([`Inspector Checklist - ${occupancy}`]);
  data.push([`Phase: ${phase}`]);
  data.push([`Progress: ${progress.checked}/${progress.total} items (${Math.round((progress.checked / progress.total) * 100)}%)`]);
  data.push([]);

  // Headers
  data.push(['Status', 'Item', 'Code Reference', 'Priority']);

  // Checklist items
  checklistItems.forEach(item => {
    data.push([
      item.checked ? '✓' : '☐',
      item.description,
      item.codeRef,
      item.critical ? 'CRITICAL' : 'Standard'
    ]);
  });

  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Inspector_Checklist_${occupancy}_${phase}`,
    sheetName: 'Checklist',
    data
  });
}

/**
 * Export floor joist span calculator results to Excel
 */
export async function exportFloorJoistCalculatorToExcel(
  species: string,
  grade: string,
  joistSize: string,
  spacing: string,
  maxSpan: number
) {
  const data: any[][] = [];

  // Title
  data.push(['Floor Joist Span Calculator Results']);
  data.push(['Based on NBC Table 9.23.4.2-A']);
  data.push([]);

  // Input Parameters
  data.push(['Input Parameters']);
  data.push(['Species:', species]);
  data.push(['Grade:', grade]);
  data.push(['Joist Size:', `${joistSize} mm`]);
  data.push(['Joist Spacing:', `${spacing} mm`]);
  data.push([]);

  // Results
  data.push(['Maximum Allowable Span']);
  data.push(['Metric:', `${maxSpan.toFixed(2)} m`]);
  data.push(['Imperial:', `${(maxSpan * 3.28084).toFixed(1)} ft`]);
  data.push([]);

  // Notes
  data.push(['Important Notes:']);
  data.push(['• Spans assume 1.9 kPa live load + 0.5 kPa dead load']);
  data.push(['• Based on NBC 2023 Table 9.23.4.2-A']);
  data.push(['• Consult a structural engineer for complex applications']);
  data.push(['• Local building authority approval may be required']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Floor_Joist_Calculator_${species}_${grade}_${joistSize}`,
    sheetName: 'Calculator Results',
    data
  });
}

/**
 * Export beam span calculator results to Excel
 */
export async function exportBeamSpanToExcel(params: {
  species: string;
  grade: string;
  size: string;
  loading: string;
  spanMeters: number;
  spanFeet: number;
}) {
  const data: any[][] = [];

  // Title
  data.push(['Beam Span Calculator Results']);
  data.push(['Based on NBC Table 9.23.4.3']);
  data.push([]);

  // Input Parameters
  data.push(['Input Parameters']);
  data.push(['Species:', params.species]);
  data.push(['Grade:', params.grade]);
  data.push(['Beam Size:', params.size]);
  data.push(['Loading Condition:', params.loading]);
  data.push([]);

  // Results
  data.push(['Maximum Allowable Span']);
  data.push(['Metric:', `${params.spanMeters.toFixed(2)} m`]);
  data.push(['Imperial:', `${params.spanFeet} ft`]);
  data.push([]);

  // Notes
  data.push(['Important Notes:']);
  data.push(['• Spans assume 1.9 kPa live load + 0.5 kPa dead load']);
  data.push(['• Based on NBC 2023 Table 9.23.4.3']);
  data.push(['• "One Floor" = beam supporting one floor above']);
  data.push(['• "Two Floors" = beam supporting two floors above']);
  data.push(['• Consult a structural engineer for complex applications']);
  data.push(['• Local building authority approval may be required']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Beam_Span_Calculator_${params.species}_${params.grade}_${params.size}`,
    sheetName: 'Calculator Results',
    data
  });
}

/**
 * Export roof rafter span calculator results to Excel
 */
export async function exportRoofRafterSpanToExcel(params: {
  species: string;
  grade: string;
  size: string;
  spacing: string;
  pitch: string;
  snowLoad: string;
  spanMeters: number;
  spanFeet: number;
}) {
  const data: any[][] = [];

  // Title
  data.push(['Roof Rafter Span Calculator Results']);
  data.push(['Based on NBC Part 9 Span Tables']);
  data.push([]);

  // Input Parameters
  data.push(['Input Parameters']);
  data.push(['Species:', params.species]);
  data.push(['Grade:', params.grade]);
  data.push(['Rafter Size:', params.size]);
  data.push(['Rafter Spacing:', params.spacing]);
  data.push(['Roof Pitch:', params.pitch]);
  data.push(['Snow Load:', params.snowLoad]);
  data.push([]);

  // Results
  data.push(['Maximum Allowable Span']);
  data.push(['Metric:', `${params.spanMeters.toFixed(2)} m`]);
  data.push(['Imperial:', `${params.spanFeet} ft`]);
  data.push([]);

  // Notes
  data.push(['Important Notes:']);
  data.push(['• Spans based on NBC 2023 Part 9 Span Tables']);
  data.push(['• Assumes specified snow load for roof design']);
  data.push(['• Pitch affects load distribution and span capacity']);
  data.push(['• Consult a structural engineer for complex roof designs']);
  data.push(['• Local building authority approval may be required']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Roof_Rafter_Calculator_${params.species}_${params.grade}_${params.size}`,
    sheetName: 'Calculator Results',
    data
  });
}

/**
 * Export column load calculator results to Excel
 */
export async function exportColumnSpanToExcel(params: {
  species: string;
  grade: string;
  size: string;
  length: number;
  loadKN: number;
  loadLbs: number;
}) {
  const data: any[][] = [];

  // Title
  data.push(['Column Load Calculator Results']);
  data.push(['Based on NBC Table 9.23.4.4']);
  data.push([]);

  // Input Parameters
  data.push(['Input Parameters']);
  data.push(['Species:', params.species]);
  data.push(['Grade:', params.grade]);
  data.push(['Column Size:', params.size]);
  data.push(['Unsupported Length:', `${params.length.toFixed(2)} m`]);
  data.push([]);

  // Results
  data.push(['Maximum Allowable Load']);
  data.push(['Metric (kN):', params.loadKN.toFixed(2)]);
  data.push(['Imperial (lbs):', params.loadLbs.toFixed(0)]);
  data.push([]);

  // Notes
  data.push(['Important Notes:']);
  data.push(['• Loads based on NBC 2023 Table 9.23.4.4']);
  data.push(['• Assumes concentric loading']);
  data.push(['• Consult a structural engineer for complex applications']);
  data.push(['• Local building authority approval may be required']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Column_Load_Calculator_${params.species}_${params.grade}_${params.size}`,
    sheetName: 'Calculator Results',
    data
  });
}
