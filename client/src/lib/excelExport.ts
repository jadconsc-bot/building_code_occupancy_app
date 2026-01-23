import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  data: any[][];
  headers?: string[];
}

/**
 * Export data to Excel file
 */
export function exportToExcel(options: ExcelExportOptions) {
  const { filename, sheetName, data, headers } = options;

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Add headers if provided
  const wsData = headers ? [headers, ...data] : data;
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns
  const colWidths = wsData[0].map((_, colIndex) => {
    const maxLength = Math.max(
      ...wsData.map(row => {
        const cellValue = row[colIndex]?.toString() || '';
        return cellValue.length;
      })
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Max width 50 characters
  });
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export comparison data to Excel
 */
export function exportComparisonToExcel(
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

  exportToExcel({
    filename: `Comparison_${occupancy1}_vs_${occupancy2}`,
    sheetName: 'Comparison',
    data
  });
}

/**
 * Export span table data to Excel
 */
export function exportSpanTableToExcel(
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

  exportToExcel({
    filename: `Span_Table_${application}_${species}_${grade}`,
    sheetName: 'Span Table',
    data
  });
}

/**
 * Export inspector checklist to Excel
 */
export function exportChecklistToExcel(
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

  exportToExcel({
    filename: `Inspector_Checklist_${occupancy}_${phase}`,
    sheetName: 'Checklist',
    data
  });
}

/**
 * Export floor joist span calculator results to Excel
 */
export function exportFloorJoistCalculatorToExcel(
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

  exportToExcel({
    filename: `Floor_Joist_Calculator_${species}_${grade}_${joistSize}`,
    sheetName: 'Calculator Results',
    data
  });
}

/**
 * Export beam span calculator results to Excel
 */
export function exportBeamSpanToExcel(params: {
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

  exportToExcel({
    filename: `Beam_Span_Calculator_${params.species}_${params.grade}_${params.size}`,
    sheetName: 'Calculator Results',
    data
  });
}

/**
 * Export roof rafter span calculator results to Excel
 */
export function exportRoofRafterSpanToExcel(params: {
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

  exportToExcel({
    filename: `Roof_Rafter_Calculator_${params.species}_${params.grade}_${params.size}`,
    sheetName: 'Calculator Results',
    data
  });
}

/**
 * Export column load calculator results to Excel
 */
export function exportColumnSpanToExcel(params: {
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
  data.push(['Maximum Allowable Axial Load']);
  data.push(['Metric:', `${params.loadKN.toFixed(1)} kN`]);
  data.push(['Imperial:', `${params.loadLbs} lbs`]);
  data.push([]);

  // Warning if overloaded
  if (params.loadKN <= 0) {
    data.push(['⚠ WARNING']);
    data.push(['Unsupported length exceeds safe capacity for this column size.']);
    data.push(['Consider using a larger column or reducing the unsupported length.']);
    data.push([]);
  }

  // Notes
  data.push(['Important Notes:']);
  data.push(['• Based on NBC 2023 Table 9.23.4.4']);
  data.push(['• Assumes axial compression loading only']);
  data.push(['• Unsupported length is the distance between lateral supports']);
  data.push(['• Load capacity decreases with increasing unsupported length']);
  data.push(['• Does not account for eccentric loads or bending moments']);
  data.push(['• Consult a structural engineer for complex applications']);
  data.push(['• Local building authority approval may be required']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Column_Load_Calculator_${params.species}_${params.grade}_${params.size}`,
    sheetName: 'Calculator Results',
    data
  });
}


/**
 * Export Fire Separation Calculator results to Excel
 */
export function exportFireSeparationToExcel(params: {
  occupancy1: string;
  occupancy2: string;
  fireResistanceRating: string;
  nbcReference: string;
  notes: string[];
}) {
  const data: any[][] = [];

  data.push(['Fire Separation Calculator Results']);
  data.push(['Based on NBC Table 3.1.3.1']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Occupancy 1:', params.occupancy1]);
  data.push(['Occupancy 2:', params.occupancy2]);
  data.push([]);

  data.push(['Required Fire Separation']);
  data.push(['Fire Resistance Rating:', params.fireResistanceRating]);
  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);

  data.push(['Notes:']);
  params.notes.forEach(note => {
    data.push([`• ${note}`]);
  });
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Fire_Separation_${params.occupancy1}_to_${params.occupancy2}`,
    sheetName: 'Fire Separation',
    data
  });
}

/**
 * Export Occupant Load Calculator results to Excel
 */
export function exportOccupantLoadToExcel(params: {
  occupancyType: string;
  floorArea: number;
  areaUnit: string;
  loadFactor: number;
  occupantLoad: number;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Occupant Load Calculator Results']);
  data.push(['Based on NBC Table 3.1.17.1']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Occupancy Type:', params.occupancyType]);
  data.push(['Floor Area:', `${params.floorArea} ${params.areaUnit}`]);
  data.push(['Load Factor:', `${params.loadFactor} ${params.areaUnit}/person`]);
  data.push([]);

  data.push(['Calculated Occupant Load']);
  data.push(['Total Occupants:', params.occupantLoad]);
  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);

  data.push(['Notes:']);
  data.push(['• Occupant load determines exit requirements']);
  data.push(['• Round up to nearest whole number']);
  data.push(['• May require multiple exits if > 60 occupants']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Occupant_Load_${params.occupancyType}_${params.floorArea}${params.areaUnit}`,
    sheetName: 'Occupant Load',
    data
  });
}

/**
 * Export Exit Requirements Calculator results to Excel
 */
export function exportExitRequirementsToExcel(params: {
  occupantLoad: number;
  requiredExits: number;
  totalExitWidth: number;
  widthUnit: string;
  travelDistance: number;
  distanceUnit: string;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Exit Requirements Calculator Results']);
  data.push(['Based on NBC Part 3.4']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Occupant Load:', params.occupantLoad]);
  data.push([]);

  data.push(['Exit Requirements']);
  data.push(['Number of Exits Required:', params.requiredExits]);
  data.push(['Minimum Total Exit Width:', `${params.totalExitWidth} ${params.widthUnit}`]);
  data.push(['Maximum Travel Distance:', `${params.travelDistance} ${params.distanceUnit}`]);
  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);

  data.push(['Notes:']);
  data.push(['• Exits must be separated by minimum distance']);
  data.push(['• Exit doors must swing in direction of travel']);
  data.push(['• Emergency lighting required at exits']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Exit_Requirements_${params.occupantLoad}_occupants`,
    sheetName: 'Exit Requirements',
    data
  });
}

/**
 * Export Travel Distance Calculator results to Excel
 */
export function exportTravelDistanceToExcel(params: {
  occupancyType: string;
  hasSprinkers: boolean;
  maxTravelDistance: number;
  distanceUnit: string;
  deadEndLimit: number;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Travel Distance Calculator Results']);
  data.push(['Based on NBC 3.4.2.5']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Occupancy Type:', params.occupancyType]);
  data.push(['Sprinkler Protected:', params.hasSprinkers ? 'Yes' : 'No']);
  data.push([]);

  data.push(['Maximum Travel Distances']);
  data.push(['To Exit:', `${params.maxTravelDistance} ${params.distanceUnit}`]);
  data.push(['Dead End Corridor:', `${params.deadEndLimit} ${params.distanceUnit}`]);
  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);

  data.push(['Notes:']);
  data.push(['• Sprinkler protection increases allowable distances']);
  data.push(['• Measure along path of travel, not straight line']);
  data.push(['• Dead ends must not exceed specified limits']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Travel_Distance_${params.occupancyType}`,
    sheetName: 'Travel Distance',
    data
  });
}

/**
 * Export Construction Limits Calculator results to Excel
 */
export function exportConstructionLimitsToExcel(params: {
  occupancyType: string;
  storeys: number;
  buildingHeight: number;
  heightUnit: string;
  hasSprinkers: boolean;
  maxArea: number;
  areaUnit: string;
  constructionType: string;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Construction Limits Calculator Results']);
  data.push(['Based on NBC Table 3.2.2']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Occupancy Type:', params.occupancyType]);
  data.push(['Number of Storeys:', params.storeys]);
  data.push(['Building Height:', `${params.buildingHeight} ${params.heightUnit}`]);
  data.push(['Sprinkler Protected:', params.hasSprinkers ? 'Yes' : 'No']);
  data.push([]);

  data.push(['Allowable Construction']);
  data.push(['Maximum Building Area:', `${params.maxArea} ${params.areaUnit}`]);
  data.push(['Construction Type:', params.constructionType]);
  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);

  data.push(['Notes:']);
  data.push(['• Sprinkler protection may allow area increases']);
  data.push(['• Street frontage may allow additional area']);
  data.push(['• Consult local authority for specific requirements']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Construction_Limits_${params.occupancyType}_${params.storeys}storey`,
    sheetName: 'Construction Limits',
    data
  });
}

/**
 * Export Plumbing Fixture Calculator results to Excel
 */
export function exportPlumbingFixturesToExcel(params: {
  occupancyType: string;
  occupantLoad: number;
  maleOccupants: number;
  femaleOccupants: number;
  fixtures: {
    type: string;
    maleRequired: number;
    femaleRequired: number;
    total: number;
  }[];
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Plumbing Fixture Calculator Results']);
  data.push(['Based on NBC Table 3.7.2.2']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Occupancy Type:', params.occupancyType]);
  data.push(['Total Occupant Load:', params.occupantLoad]);
  data.push(['Male Occupants:', params.maleOccupants]);
  data.push(['Female Occupants:', params.femaleOccupants]);
  data.push([]);

  data.push(['Required Fixtures']);
  data.push(['Fixture Type', 'Male', 'Female', 'Total']);
  params.fixtures.forEach(f => {
    data.push([f.type, f.maleRequired, f.femaleRequired, f.total]);
  });
  data.push([]);

  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);
  data.push(['Notes:']);
  data.push(['• Barrier-free fixtures may be required']);
  data.push(['• Check local amendments for additional requirements']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Plumbing_Fixtures_${params.occupancyType}_${params.occupantLoad}occ`,
    sheetName: 'Plumbing Fixtures',
    data
  });
}

/**
 * Export Stair Design Calculator results to Excel
 */
export function exportStairDesignToExcel(params: {
  totalRise: number;
  riserHeight: number;
  treadDepth: number;
  numberOfRisers: number;
  stairWidth: number;
  headroom: number;
  unit: string;
  compliant: boolean;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Stair Design Calculator Results']);
  data.push(['Based on NBC 9.8.4']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Total Rise:', `${params.totalRise} ${params.unit}`]);
  data.push([]);

  data.push(['Calculated Dimensions']);
  data.push(['Riser Height:', `${params.riserHeight} ${params.unit}`]);
  data.push(['Tread Depth:', `${params.treadDepth} ${params.unit}`]);
  data.push(['Number of Risers:', params.numberOfRisers]);
  data.push(['Stair Width:', `${params.stairWidth} ${params.unit}`]);
  data.push(['Headroom:', `${params.headroom} ${params.unit}`]);
  data.push([]);

  data.push(['Compliance Status:', params.compliant ? 'COMPLIANT' : 'NON-COMPLIANT']);
  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);

  data.push(['NBC Requirements:']);
  data.push(['• Riser height: 125-200mm (5-8")']);
  data.push(['• Tread depth: minimum 235mm (9.25")']);
  data.push(['• Headroom: minimum 1950mm (6\'5")']);
  data.push(['• 2R + T should equal 585-660mm']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Stair_Design_${params.totalRise}${params.unit}_rise`,
    sheetName: 'Stair Design',
    data
  });
}

/**
 * Export Guard/Handrail Calculator results to Excel
 */
export function exportGuardHandrailToExcel(params: {
  location: string;
  dropHeight: number;
  guardRequired: boolean;
  guardHeight: number;
  handrailRequired: boolean;
  handrailHeight: number;
  unit: string;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Guard & Handrail Calculator Results']);
  data.push(['Based on NBC 9.8.8']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Location:', params.location]);
  data.push(['Drop Height:', `${params.dropHeight} ${params.unit}`]);
  data.push([]);

  data.push(['Requirements']);
  data.push(['Guard Required:', params.guardRequired ? 'Yes' : 'No']);
  if (params.guardRequired) {
    data.push(['Minimum Guard Height:', `${params.guardHeight} ${params.unit}`]);
  }
  data.push(['Handrail Required:', params.handrailRequired ? 'Yes' : 'No']);
  if (params.handrailRequired) {
    data.push(['Handrail Height:', `${params.handrailHeight} ${params.unit}`]);
  }
  data.push([]);

  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);
  data.push(['Notes:']);
  data.push(['• Guards required where drop > 600mm']);
  data.push(['• Handrails required on stairs with 3+ risers']);
  data.push(['• Guard openings must not pass 100mm sphere']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Guard_Handrail_${params.location}`,
    sheetName: 'Guard Handrail',
    data
  });
}

/**
 * Export Energy Code Calculator results to Excel
 */
export function exportEnergyCodeToExcel(params: {
  climateZone: string;
  buildingType: string;
  wallRValue: number;
  roofRValue: number;
  windowUValue: number;
  airTightness: number;
  compliant: boolean;
  necbReference: string;
}) {
  const data: any[][] = [];

  data.push(['Energy Code Calculator Results']);
  data.push(['Based on NECB 2020']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Climate Zone:', params.climateZone]);
  data.push(['Building Type:', params.buildingType]);
  data.push([]);

  data.push(['Thermal Requirements']);
  data.push(['Wall R-Value:', `R-${params.wallRValue}`]);
  data.push(['Roof R-Value:', `R-${params.roofRValue}`]);
  data.push(['Window U-Value:', `U-${params.windowUValue}`]);
  data.push(['Air Tightness:', `${params.airTightness} ACH50`]);
  data.push([]);

  data.push(['Compliance Status:', params.compliant ? 'COMPLIANT' : 'NON-COMPLIANT']);
  data.push(['NECB Reference:', params.necbReference]);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Energy_Code_Zone${params.climateZone}_${params.buildingType}`,
    sheetName: 'Energy Code',
    data
  });
}

/**
 * Export Snow Load Calculator results to Excel
 */
export function exportSnowLoadToExcel(params: {
  location: string;
  groundSnowLoad: number;
  roofSnowLoad: number;
  roofSlope: number;
  exposureFactor: number;
  thermalFactor: number;
  unit: string;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Snow Load Calculator Results']);
  data.push(['Based on NBC 4.1.6']);
  data.push([]);

  data.push(['Location Data']);
  data.push(['Location:', params.location]);
  data.push(['Ground Snow Load (Ss):', `${params.groundSnowLoad} ${params.unit}`]);
  data.push([]);

  data.push(['Roof Parameters']);
  data.push(['Roof Slope:', `${params.roofSlope}°`]);
  data.push(['Exposure Factor (Ce):', params.exposureFactor]);
  data.push(['Thermal Factor (Ct):', params.thermalFactor]);
  data.push([]);

  data.push(['Calculated Roof Snow Load']);
  data.push(['Design Snow Load:', `${params.roofSnowLoad} ${params.unit}`]);
  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);

  data.push(['Notes:']);
  data.push(['• S = Ss × Cb × Cw × Cs × Ca']);
  data.push(['• Consider drift loads at roof transitions']);
  data.push(['• Consult structural engineer for complex roofs']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Snow_Load_${params.location}_${params.roofSlope}deg`,
    sheetName: 'Snow Load',
    data
  });
}

/**
 * Export Ventilation Rate Calculator results to Excel
 */
export function exportVentilationRateToExcel(params: {
  spaceType: string;
  floorArea: number;
  occupants: number;
  outdoorAirRate: number;
  exhaustRate: number;
  unit: string;
  ashrae621Reference: string;
}) {
  const data: any[][] = [];

  data.push(['Ventilation Rate Calculator Results']);
  data.push(['Based on ASHRAE 62.1']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Space Type:', params.spaceType]);
  data.push(['Floor Area:', `${params.floorArea} m²`]);
  data.push(['Number of Occupants:', params.occupants]);
  data.push([]);

  data.push(['Ventilation Requirements']);
  data.push(['Outdoor Air Rate:', `${params.outdoorAirRate} ${params.unit}`]);
  data.push(['Exhaust Air Rate:', `${params.exhaustRate} ${params.unit}`]);
  data.push(['ASHRAE Reference:', params.ashrae621Reference]);
  data.push([]);

  data.push(['Notes:']);
  data.push(['• Rates based on occupancy and floor area']);
  data.push(['• Consider local code amendments']);
  data.push(['• May require heat recovery in cold climates']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Ventilation_${params.spaceType}_${params.occupants}occ`,
    sheetName: 'Ventilation',
    data
  });
}

/**
 * Export Thermal Resistance Calculator results to Excel
 */
export function exportThermalResistanceToExcel(params: {
  assemblyType: string;
  layers: { material: string; thickness: number; rValue: number }[];
  totalRValue: number;
  requiredRValue: number;
  compliant: boolean;
  climateZone: string;
}) {
  const data: any[][] = [];

  data.push(['Thermal Resistance Calculator Results']);
  data.push(['Based on NBC 9.36']);
  data.push([]);

  data.push(['Assembly Information']);
  data.push(['Assembly Type:', params.assemblyType]);
  data.push(['Climate Zone:', params.climateZone]);
  data.push([]);

  data.push(['Layer Analysis']);
  data.push(['Material', 'Thickness (mm)', 'R-Value']);
  params.layers.forEach(layer => {
    data.push([layer.material, layer.thickness, `R-${layer.rValue}`]);
  });
  data.push([]);

  data.push(['Total Assembly R-Value:', `R-${params.totalRValue}`]);
  data.push(['Required R-Value:', `R-${params.requiredRValue}`]);
  data.push(['Compliance Status:', params.compliant ? 'COMPLIANT' : 'NON-COMPLIANT']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Thermal_Resistance_${params.assemblyType}_Zone${params.climateZone}`,
    sheetName: 'Thermal Resistance',
    data
  });
}

/**
 * Export Permit Fee Calculator results to Excel
 */
export function exportPermitFeeToExcel(params: {
  municipality: string;
  projectValue: number;
  baseFee: number;
  rate: number;
  estimatedFee: number;
}) {
  const data: any[][] = [];

  data.push(['Permit Fee Calculator Results']);
  data.push([]);

  data.push(['Project Information']);
  data.push(['Municipality:', params.municipality]);
  data.push(['Project Value:', `$${params.projectValue.toLocaleString()}`]);
  data.push([]);

  data.push(['Fee Structure']);
  data.push(['Base Fee:', `$${params.baseFee.toLocaleString()}`]);
  data.push(['Rate:', `${(params.rate * 100).toFixed(2)}%`]);
  data.push([]);
  data.push(['ESTIMATED PERMIT FEE:', `$${params.estimatedFee.toLocaleString()}`]);
  data.push([]);

  data.push(['Notes:']);
  data.push(['• Fees are estimates and subject to change']);
  data.push(['• Contact municipality for exact fee schedule']);
  data.push(['• Additional fees may apply for inspections']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Permit_Fees_${params.municipality}_${params.projectValue}`,
    sheetName: 'Permit Fees',
    data
  });
}

/**
 * Export Accessibility Ramp Calculator results to Excel
 */
export function exportAccessibilityRampToExcel(params: {
  totalRise: number;
  rampSlope: string;
  rampLength: number;
  landingLength: number;
  rampWidth: number;
  handrailHeight: number;
  unit: string;
  compliant: boolean;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Accessibility Ramp Calculator Results']);
  data.push(['Based on NBC 3.8']);
  data.push([]);

  data.push(['Input Parameters']);
  data.push(['Total Rise:', `${params.totalRise} ${params.unit}`]);
  data.push([]);

  data.push(['Ramp Design']);
  data.push(['Ramp Slope:', params.rampSlope]);
  data.push(['Ramp Length:', `${params.rampLength} ${params.unit}`]);
  data.push(['Landing Length:', `${params.landingLength} ${params.unit}`]);
  data.push(['Ramp Width:', `${params.rampWidth} ${params.unit}`]);
  data.push(['Handrail Height:', `${params.handrailHeight} ${params.unit}`]);
  data.push([]);

  data.push(['Compliance Status:', params.compliant ? 'COMPLIANT' : 'NON-COMPLIANT']);
  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);

  data.push(['NBC Requirements:']);
  data.push(['• Maximum slope: 1:12 (8.33%)']);
  data.push(['• Minimum width: 900mm']);
  data.push(['• Landing every 9m of run']);
  data.push(['• Handrails on both sides']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Accessibility_Ramp_${params.totalRise}${params.unit}_rise`,
    sheetName: 'Accessibility Ramp',
    data
  });
}

/**
 * Export Fire Alarm Calculator results to Excel
 */
export function exportFireAlarmToExcel(params: {
  occupancyType: string;
  buildingHeight: number;
  floorArea: number;
  systemType: string;
  detectionRequired: boolean;
  voiceCommunication: boolean;
  requirements: string[];
  nbcReferences: string[];
}) {
  const data: any[][] = [];

  data.push(['Fire Alarm Calculator Results']);
  data.push(['Based on NBC 3.2.4']);
  data.push([]);

  data.push(['Building Information']);
  data.push(['Occupancy Type:', params.occupancyType]);
  data.push(['Building Height:', `${params.buildingHeight} m`]);
  data.push(['Floor Area:', `${params.floorArea} m²`]);
  data.push([]);

  data.push(['Fire Alarm Requirements']);
  data.push(['System Type:', params.systemType]);
  data.push(['Automatic Detection Required:', params.detectionRequired ? 'Yes' : 'No']);
  data.push(['Voice Communication Required:', params.voiceCommunication ? 'Yes' : 'No']);
  data.push([]);

  data.push(['System Requirements:']);
  params.requirements.forEach(req => {
    data.push(['•', req]);
  });
  data.push([]);

  data.push(['NBC References:', params.nbcReferences.join(', ')]);
  data.push([]);
  data.push(['Notes:']);
  data.push(['• System must be designed by qualified professional']);
  data.push(['• Annual testing and maintenance required']);
  data.push(['• Connection to monitoring station may be required']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Fire_Alarm_${params.occupancyType}_${params.floorArea}m2`,
    sheetName: 'Fire Alarm',
    data
  });
}

/**
 * Export Emergency Lighting Calculator results to Excel
 */
export function exportEmergencyLightingToExcel(params: {
  occupancyType: string;
  floorArea: number;
  exitPaths: number;
  emergencyLightingRequired: boolean;
  minimumIllumination: number;
  batteryDuration: number;
  nbcReference: string;
}) {
  const data: any[][] = [];

  data.push(['Emergency Lighting Calculator Results']);
  data.push(['Based on NBC 3.2.7']);
  data.push([]);

  data.push(['Building Information']);
  data.push(['Occupancy Type:', params.occupancyType]);
  data.push(['Floor Area:', `${params.floorArea} m²`]);
  data.push(['Number of Exit Paths:', params.exitPaths]);
  data.push([]);

  data.push(['Emergency Lighting Requirements']);
  data.push(['Emergency Lighting Required:', params.emergencyLightingRequired ? 'Yes' : 'No']);
  if (params.emergencyLightingRequired) {
    data.push(['Minimum Illumination:', `${params.minimumIllumination} lux`]);
    data.push(['Battery Duration:', `${params.batteryDuration} minutes`]);
  }
  data.push([]);

  data.push(['NBC Reference:', params.nbcReference]);
  data.push([]);
  data.push(['Notes:']);
  data.push(['• Required along exit paths and in exit stairways']);
  data.push(['• Must illuminate floor to minimum 10 lux']);
  data.push(['• Battery backup minimum 30 minutes']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Emergency_Lighting_${params.occupancyType}`,
    sheetName: 'Emergency Lighting',
    data
  });
}

/**
 * Generic calculator export function for simple results
 */
export function exportGenericCalculatorToExcel(params: {
  calculatorName: string;
  inputs: { label: string; value: string | number }[];
  results: { label: string; value: string | number }[];
  notes?: string[];
  reference?: string;
}) {
  const data: any[][] = [];

  data.push([`${params.calculatorName} Results`]);
  data.push([]);

  data.push(['Input Parameters']);
  params.inputs.forEach(input => {
    data.push([`${input.label}:`, input.value]);
  });
  data.push([]);

  data.push(['Calculated Results']);
  params.results.forEach(result => {
    data.push([`${result.label}:`, result.value]);
  });
  data.push([]);

  if (params.reference) {
    data.push(['Reference:', params.reference]);
    data.push([]);
  }

  if (params.notes && params.notes.length > 0) {
    data.push(['Notes:']);
    params.notes.forEach(note => {
      data.push([`• ${note}`]);
    });
    data.push([]);
  }

  data.push(['Generated:', new Date().toLocaleString()]);

  const filename = params.calculatorName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  exportToExcel({
    filename: filename,
    sheetName: 'Results',
    data
  });
}


/**
 * Export Barrier-Free Calculator results to Excel
 */
export function exportBarrierFreeToExcel(params: {
  occupancyType: string;
  floorArea: number;
  totalWashrooms: number;
  totalParkingSpaces: number;
  accessibleWashroomsRequired: number;
  accessibleParkingRequired: number;
  requirements: string[];
}) {
  const data: any[][] = [];

  data.push(['Barrier-Free Design Calculator Results']);
  data.push(['Based on NBC Part 3.8']);
  data.push([]);

  data.push(['Building Information']);
  data.push(['Occupancy Type:', params.occupancyType]);
  data.push(['Floor Area:', `${params.floorArea} m²`]);
  data.push([]);

  data.push(['Accessibility Requirements']);
  data.push(['Total Washrooms:', params.totalWashrooms]);
  data.push(['Accessible Washrooms Required:', params.accessibleWashroomsRequired]);
  data.push(['Total Parking Spaces:', params.totalParkingSpaces]);
  data.push(['Accessible Parking Required:', params.accessibleParkingRequired]);
  data.push([]);

  data.push(['Additional Requirements:']);
  params.requirements.forEach(req => {
    data.push(['•', req]);
  });
  data.push([]);

  data.push(['NBC Reference:', 'NBC Part 3.8']);
  data.push([]);
  data.push(['Notes:']);
  data.push(['• Accessible washrooms must include grab bars and clear floor space']);
  data.push(['• Accessible parking spaces must be 3.4m wide with 1.5m access aisle']);
  data.push(['• Barrier-free path of travel required from entrance to all floors']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Barrier_Free_${params.occupancyType}_${params.floorArea}m2`,
    sheetName: 'Barrier-Free',
    data
  });
}


/**
 * Export Water Closet Calculator results to Excel
 */
export function exportWaterClosetToExcel(params: {
  occupancyType: string;
  codeReference: string;
  maleOccupants: number;
  femaleOccupants: number;
  totalOccupants: number;
  maleWaterClosets: number;
  femaleWaterClosets: number;
  totalWaterClosets: number;
  notes: string;
}) {
  const data: any[][] = [];

  data.push(['Water Closet Calculator Results']);
  data.push([]);

  data.push(['Occupancy Information']);
  data.push(['Occupancy Type:', params.occupancyType]);
  data.push(['Code Reference:', params.codeReference]);
  data.push([]);

  data.push(['Occupant Count']);
  data.push(['Male Occupants:', params.maleOccupants]);
  data.push(['Female Occupants:', params.femaleOccupants]);
  data.push(['Total Occupants:', params.totalOccupants]);
  data.push([]);

  data.push(['Required Water Closets']);
  data.push(['Male Water Closets:', params.maleWaterClosets]);
  data.push(['Female Water Closets:', params.femaleWaterClosets]);
  data.push(['TOTAL WATER CLOSETS:', params.totalWaterClosets]);
  data.push([]);

  if (params.notes) {
    data.push(['Notes:', params.notes]);
    data.push([]);
  }

  data.push(['Additional Requirements:']);
  data.push(['• Barrier-free water closets must be provided per NBC 3.8.2.8']);
  data.push(['• Urinals may substitute up to 2/3 of male water closets']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Water_Closet_${params.occupancyType.replace(/[^a-zA-Z0-9]/g, '_')}_${params.totalOccupants}`,
    sheetName: 'Water Closets',
    data
  });
}


/**
 * Export Municipal Bylaws Calculator results to Excel
 */
export function exportMunicipalBylawsToExcel(params: {
  municipality: string;
  zone: string;
  zoneName: string;
  setbacks: {
    front: { required: number; proposed: number; compliant: boolean };
    rear: { required: number; proposed: number; compliant: boolean };
    sideInterior: { required: number; proposed: number; compliant: boolean };
    sideCorner?: { required: number; proposed: number; compliant: boolean };
  };
  coverage?: { maxAllowed: number; proposed: number; compliant: boolean };
  height?: { maxHeight: number; proposedHeight: number; maxStoreys?: number; proposedStoreys?: number; compliant: boolean };
  lot?: { minArea: number; proposedArea: number; minWidth: number; proposedWidth: number; compliant: boolean };
  overallCompliant: boolean;
}) {
  const data: any[][] = [];

  data.push(['Municipal Bylaws Compliance Report']);
  data.push([]);

  data.push(['Location Information']);
  data.push(['Municipality:', params.municipality]);
  data.push(['Zone Code:', params.zone]);
  data.push(['Zone Name:', params.zoneName]);
  data.push([]);

  data.push(['Setback Compliance']);
  data.push(['Type', 'Required (m)', 'Proposed (m)', 'Status']);
  data.push(['Front Setback', params.setbacks.front.required, params.setbacks.front.proposed, params.setbacks.front.compliant ? 'PASS' : 'FAIL']);
  data.push(['Rear Setback', params.setbacks.rear.required, params.setbacks.rear.proposed, params.setbacks.rear.compliant ? 'PASS' : 'FAIL']);
  data.push(['Side Interior', params.setbacks.sideInterior.required, params.setbacks.sideInterior.proposed, params.setbacks.sideInterior.compliant ? 'PASS' : 'FAIL']);
  if (params.setbacks.sideCorner) {
    data.push(['Side Corner', params.setbacks.sideCorner.required, params.setbacks.sideCorner.proposed, params.setbacks.sideCorner.compliant ? 'PASS' : 'FAIL']);
  }
  data.push([]);

  if (params.coverage) {
    data.push(['Coverage Compliance']);
    data.push(['Max Allowed:', `${params.coverage.maxAllowed}%`]);
    data.push(['Proposed:', `${params.coverage.proposed}%`]);
    data.push(['Status:', params.coverage.compliant ? 'PASS' : 'FAIL']);
    data.push([]);
  }

  if (params.height) {
    data.push(['Height Compliance']);
    data.push(['Max Height:', `${params.height.maxHeight}m`]);
    data.push(['Proposed Height:', `${params.height.proposedHeight}m`]);
    if (params.height.maxStoreys) {
      data.push(['Max Storeys:', params.height.maxStoreys]);
      data.push(['Proposed Storeys:', params.height.proposedStoreys || 'N/A']);
    }
    data.push(['Status:', params.height.compliant ? 'PASS' : 'FAIL']);
    data.push([]);
  }

  if (params.lot) {
    data.push(['Lot Size Compliance']);
    data.push(['Min Area:', `${params.lot.minArea} m²`]);
    data.push(['Proposed Area:', `${params.lot.proposedArea} m²`]);
    data.push(['Min Width:', `${params.lot.minWidth}m`]);
    data.push(['Proposed Width:', `${params.lot.proposedWidth}m`]);
    data.push(['Status:', params.lot.compliant ? 'PASS' : 'FAIL']);
    data.push([]);
  }

  data.push(['OVERALL COMPLIANCE:', params.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT']);
  data.push([]);
  data.push(['Generated:', new Date().toLocaleString()]);

  exportToExcel({
    filename: `Municipal_Bylaws_${params.municipality}_${params.zone}`,
    sheetName: 'Bylaws Compliance',
    data
  });
}
