import { Workbook } from "exceljs";

/**
 * Generic export function to handle Excel file generation
 */
async function exportToExcel({
  filename,
  sheetName,
  data
}: {
  filename: string;
  sheetName: string;
  data: any[][];
}) {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add rows
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

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export occupant load data to Excel
 */
export async function exportOccupantLoadToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Occupant Load Analysis - ${data.occupancyType}`]);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Occupancy Type', data.occupancyType]);
  rows.push(['Floor Area (m²)', data.floorArea]);
  rows.push(['Area Unit', data.areaUnit]);
  rows.push(['Load Factor', data.loadFactor]);
  rows.push(['Occupant Load', data.occupantLoad]);
  rows.push(['NBC Reference', data.nbcReference]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Occupant_Load_${data.occupancyType?.replace(/\s+/g, '_')}`,
    sheetName: 'Occupant Load',
    data: rows
  });
}

/**
 * Export water closet calculations to Excel
 */
export async function exportWaterClosetToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Water Closet Requirements - ${data.buildingType}`]);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Building Type', data.buildingType]);
  rows.push(['Occupancy Type', data.occupancyType]);
  rows.push(['Occupant Load', data.occupantLoad]);
  rows.push(['Required WC', data.requiredWC]);
  rows.push(['Required Urinals', data.urinals]);
  rows.push(['Required Lavatories', data.lavatories]);
  rows.push(['NBC Reference', data.nbcReference]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Water_Closet_${data.buildingType?.replace(/\s+/g, '_')}`,
    sheetName: 'WC Requirements',
    data: rows
  });
}

/**
 * Export travel distance calculations to Excel
 */
export async function exportTravelDistanceToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Travel Distance Analysis - ${data.occupancyType}`]);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Occupancy Type', data.occupancyType]);
  rows.push(['Distance to Exit (m)', data.distanceToExit]);
  rows.push(['Maximum Allowed (m)', data.maxAllowed]);
  rows.push(['Compliant', data.compliant ? 'Yes' : 'No']);
  rows.push(['NBC Reference', data.nbcReference]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Travel_Distance_${data.occupancyType?.replace(/\s+/g, '_')}`,
    sheetName: 'Travel Distance',
    data: rows
  });
}

/**
 * Export permit fee calculations to Excel
 */
export async function exportPermitFeeToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Permit Fee Calculation - ${data.projectType}`]);
  rows.push([]);
  rows.push(['Project Details']);
  rows.push(['Project Type:', data.projectType]);
  rows.push(['Construction Cost:', `$${data.constructionCost}`]);
  rows.push(['Floor Area (m²):', data.floorArea]);
  rows.push([]);
  rows.push(['Fee Breakdown']);
  rows.push(['Description', 'Rate', 'Amount']);
  
  if (data.fees && Array.isArray(data.fees)) {
    data.fees.forEach((fee: any) => {
      rows.push([fee.description, fee.rate, `$${fee.amount}`]);
    });
  }

  rows.push([]);
  rows.push(['Subtotal:', `$${data.subtotal}`]);
  rows.push(['Tax:', `$${data.tax || 0}`]);
  rows.push(['Total Fee:', `$${data.total}`]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Permit_Fee_${data.projectType?.replace(/\s+/g, '_')}`,
    sheetName: 'Permit Fee',
    data: rows
  });
}

/**
 * Export fire separation data to Excel
 */
export async function exportFireSeparationToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Fire Separation Analysis - ${data.buildingType}`]);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Building Type', data.buildingType]);
  rows.push(['Space Type', data.spaceType]);
  rows.push(['Required Rating (hrs)', data.requiredRating]);
  rows.push(['Actual Rating (hrs)', data.actualRating]);
  rows.push(['Compliant', data.compliant ? 'Yes' : 'No']);
  rows.push(['NBC Reference', data.nbcReference]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Fire_Separation_${data.buildingType?.replace(/\s+/g, '_')}`,
    sheetName: 'Fire Separation',
    data: rows
  });
}

/**
 * Export exit requirements data to Excel
 */
export async function exportExitRequirementsToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Exit Requirements - ${data.occupancyType}`]);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Occupancy Type', data.occupancyType]);
  rows.push(['Floor/Area', data.floor]);
  rows.push(['Occupant Load', data.occupantLoad]);
  rows.push(['Required Exits', data.requiredExits]);
  rows.push(['Provided Exits', data.providedExits]);
  rows.push(['Compliant', data.compliant ? 'Yes' : 'No']);
  rows.push(['NBC Reference', data.nbcReference]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Exit_Requirements_${data.occupancyType?.replace(/\s+/g, '_')}`,
    sheetName: 'Exit Requirements',
    data: rows
  });
}

/**
 * Export fire alarm data to Excel
 */
export async function exportFireAlarmToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Fire Alarm System Analysis - ${data.buildingType}`]);
  rows.push([]);
  rows.push(['System Details']);
  rows.push(['Building Type:', data.buildingType]);
  rows.push(['System Type:', data.systemType]);
  rows.push(['Coverage Area (m²):', data.coverageArea]);
  rows.push(['Number of Zones:', data.zones]);
  rows.push([]);
  rows.push(['Requirements']);
  rows.push(['Requirement', 'Required', 'Provided', 'Compliant']);
  
  if (data.requirements && Array.isArray(data.requirements)) {
    data.requirements.forEach((req: any) => {
      rows.push([
        req.name,
        req.required ? 'Yes' : 'No',
        req.provided ? 'Yes' : 'No',
        req.compliant ? 'Yes' : 'No'
      ]);
    });
  }

  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Fire_Alarm_${data.buildingType?.replace(/\s+/g, '_')}`,
    sheetName: 'Fire Alarm',
    data: rows
  });
}

/**
 * Export emergency lighting data to Excel
 */
export async function exportEmergencyLightingToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Emergency Lighting Analysis - ${data.buildingType}`]);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Building Type', data.buildingType]);
  rows.push(['Location', data.location]);
  rows.push(['Required (lux)', data.requiredLux]);
  rows.push(['Provided (lux)', data.providedLux]);
  rows.push(['Duration (hrs)', data.duration]);
  rows.push(['Compliant', data.compliant ? 'Yes' : 'No']);
  rows.push(['NBC Reference', data.nbcReference]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Emergency_Lighting_${data.buildingType?.replace(/\s+/g, '_')}`,
    sheetName: 'Emergency Lighting',
    data: rows
  });
}

/**
 * Export barrier-free design data to Excel
 */
export async function exportBarrierFreeToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Barrier-Free Design Analysis - ${data.projectType}`]);
  rows.push([]);
  rows.push(['Feature', 'Requirement', 'Provided', 'Compliant']);

  if (data.features && Array.isArray(data.features)) {
    data.features.forEach((feature: any) => {
      rows.push([
        feature.name,
        feature.requirement,
        feature.provided ? 'Yes' : 'No',
        feature.compliant ? 'Yes' : 'No'
      ]);
    });
  }

  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Barrier_Free_${data.projectType?.replace(/\s+/g, '_')}`,
    sheetName: 'Barrier-Free',
    data: rows
  });
}

/**
 * Export municipal bylaws data to Excel
 */
export async function exportMunicipalBylawsToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Municipal Bylaws - ${data.municipality}`]);
  rows.push([]);
  rows.push(['Bylaw', 'Requirement', 'Project Compliance', 'Notes']);

  if (data.bylaws && Array.isArray(data.bylaws)) {
    data.bylaws.forEach((bylaw: any) => {
      rows.push([
        bylaw.name,
        bylaw.requirement,
        bylaw.compliant ? 'Compliant' : 'Non-Compliant',
        bylaw.notes || ''
      ]);
    });
  }

  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Municipal_Bylaws_${data.municipality?.replace(/\s+/g, '_')}`,
    sheetName: 'Bylaws',
    data: rows
  });
}

/**
 * Export comparison data to Excel
 */
export async function exportComparisonToExcel(data: any) {
  const rows: any[][] = [];
  rows.push(['Calculator Comparison']);
  rows.push([]);
  rows.push(['#', 'Calculator Type', 'Result', ...Object.keys(data.items?.[0]?.parameters || {})]);

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      const row = [
        index + 1,
        item.calculatorType,
        `${item.result.value} ${item.result.unit}`,
        ...Object.values(item.parameters || {})
      ];
      rows.push(row);
    });
  }

  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: 'Calculator_Comparison',
    sheetName: 'Comparison',
    data: rows
  });
}

/**
 * Export span table data to Excel
 */
export async function exportSpanTableToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`${data.tableType} Span Table`]);
  rows.push([]);
  rows.push(['Span Data']);
  rows.push(['Spacing', 'Grade', 'Species', 'Maximum Span']);

  if (data.spans && Array.isArray(data.spans)) {
    data.spans.forEach((span: any) => {
      rows.push([
        span.spacing,
        span.grade,
        span.species,
        span.maxSpan
      ]);
    });
  }

  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `${data.tableType}_Span_Table`,
    sheetName: 'Span Table',
    data: rows
  });
}

/**
 * Export checklist data to Excel
 */
export async function exportChecklistToExcel(data: any) {
  const rows: any[][] = [];
  rows.push([`Inspection Checklist - ${data.projectName}`]);
  rows.push([]);
  rows.push(['Item', 'Status', 'Notes', 'Inspector']);

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: any) => {
      rows.push([
        item.name,
        item.status || 'Pending',
        item.notes || '',
        item.inspector || ''
      ]);
    });
  }

  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: `Checklist_${data.projectName?.replace(/\s+/g, '_')}`,
    sheetName: 'Checklist',
    data: rows
  });
}

/**
 * Export floor joist calculator data to Excel
 */
export async function exportFloorJoistCalculatorToExcel(data: any) {
  const rows: any[][] = [];
  rows.push(['Floor Joist Span Calculation']);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Joist Spacing', data.spacing]);
  rows.push(['Grade', data.grade]);
  rows.push(['Species', data.species]);
  rows.push(['Live Load', data.liveLoad]);
  rows.push(['Dead Load', data.deadLoad]);
  rows.push(['Maximum Span', data.maxSpan]);
  rows.push(['Deflection Limit', data.deflectionLimit]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: 'Floor_Joist_Calculation',
    sheetName: 'Floor Joist',
    data: rows
  });
}

/**
 * Export beam span calculator data to Excel
 */
export async function exportBeamSpanToExcel(data: any) {
  const rows: any[][] = [];
  rows.push(['Beam Span Calculation']);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Beam Type', data.beamType]);
  rows.push(['Material', data.material]);
  rows.push(['Grade', data.grade]);
  rows.push(['Live Load', data.liveLoad]);
  rows.push(['Dead Load', data.deadLoad]);
  rows.push(['Maximum Span', data.maxSpan]);
  rows.push(['Deflection Limit', data.deflectionLimit]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: 'Beam_Span_Calculation',
    sheetName: 'Beam Span',
    data: rows
  });
}

/**
 * Export roof rafter span calculator data to Excel
 */
export async function exportRoofRafterSpanToExcel(data: any) {
  const rows: any[][] = [];
  rows.push(['Roof Rafter Span Calculation']);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Rafter Spacing', data.spacing]);
  rows.push(['Grade', data.grade]);
  rows.push(['Species', data.species]);
  rows.push(['Snow Load', data.snowLoad]);
  rows.push(['Dead Load', data.deadLoad]);
  rows.push(['Maximum Span', data.maxSpan]);
  rows.push(['Deflection Limit', data.deflectionLimit]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: 'Roof_Rafter_Calculation',
    sheetName: 'Roof Rafter',
    data: rows
  });
}

/**
 * Export column span calculator data to Excel
 */
export async function exportColumnSpanToExcel(data: any) {
  const rows: any[][] = [];
  rows.push(['Column Span Calculation']);
  rows.push([]);
  rows.push(['Parameter', 'Value']);
  rows.push(['Column Type', data.columnType]);
  rows.push(['Material', data.material]);
  rows.push(['Grade', data.grade]);
  rows.push(['Height', data.height]);
  rows.push(['Axial Load', data.axialLoad]);
  rows.push(['Capacity', data.capacity]);
  rows.push(['Utilization Ratio', data.utilizationRatio]);
  rows.push([]);
  rows.push(['Generated:', new Date().toLocaleString()]);

  await exportToExcel({
    filename: 'Column_Span_Calculation',
    sheetName: 'Column Span',
    data: rows
  });
}
