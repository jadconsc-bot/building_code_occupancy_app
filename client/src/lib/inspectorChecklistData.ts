// Inspector Checklist Data by Occupancy and Construction Phase

export type ConstructionPhase = 
  | 'Foundation' 
  | 'Framing' 
  | 'Mechanical' 
  | 'Insulation & Vapour Barrier'
  | 'Drywall'
  | 'Final';

export interface ChecklistItem {
  id: string;
  description: string;
  codeReference: string;
  critical: boolean; // High priority items
}

export interface PhaseChecklist {
  phase: ConstructionPhase;
  items: ChecklistItem[];
}

// Base checklist items applicable to all occupancies
const baseChecklists: Record<ConstructionPhase, ChecklistItem[]> = {
  'Foundation': [
    { id: 'found-01', description: 'Verify foundation depth below frost line (min 1.2m in Alberta)', codeReference: '9.12.2.1', critical: true },
    { id: 'found-02', description: 'Check foundation wall thickness and reinforcement', codeReference: '9.15.2.2', critical: true },
    { id: 'found-03', description: 'Confirm footing width and bearing capacity', codeReference: '9.15.3.3', critical: true },
    { id: 'found-04', description: 'Verify dampproofing or waterproofing application', codeReference: '9.13.2.2', critical: false },
    { id: 'found-05', description: 'Check foundation drainage tile installation', codeReference: '9.14.1.1', critical: false },
    { id: 'found-06', description: 'Verify anchor bolt placement and spacing', codeReference: '9.23.3.4', critical: true },
  ],
  'Framing': [
    { id: 'frame-01', description: 'Verify lumber grade stamps and species', codeReference: '9.3.2.1', critical: true },
    { id: 'frame-02', description: 'Check floor joist size, spacing, and spans', codeReference: '9.23.4.2', critical: true },
    { id: 'frame-03', description: 'Verify wall stud size, spacing, and height', codeReference: '9.23.10.2', critical: true },
    { id: 'frame-04', description: 'Check roof rafter/truss spans and connections', codeReference: '9.23.13.2', critical: true },
    { id: 'frame-05', description: 'Verify headers and lintels over openings', codeReference: '9.23.10.4', critical: true },
    { id: 'frame-06', description: 'Check shear wall and hold-down installation', codeReference: '9.23.13.8', critical: true },
    { id: 'frame-07', description: 'Verify fire blocking and draft stops', codeReference: '9.10.14.5', critical: false },
  ],
  'Mechanical': [
    { id: 'mech-01', description: 'Verify HVAC equipment sizing and location', codeReference: '9.32.3.2', critical: false },
    { id: 'mech-02', description: 'Check ductwork sizing and support', codeReference: '9.32.3.6', critical: false },
    { id: 'mech-03', description: 'Verify plumbing rough-in and fixture locations', codeReference: '7.2.1.1', critical: true },
    { id: 'mech-04', description: 'Check drain, waste, and vent system', codeReference: '7.3.1.1', critical: true },
    { id: 'mech-05', description: 'Verify water supply piping and sizing', codeReference: '7.4.1.1', critical: true },
    { id: 'mech-06', description: 'Check electrical service size and panel location', codeReference: 'CEC 6-200', critical: true },
    { id: 'mech-07', description: 'Verify branch circuit wiring and device boxes', codeReference: 'CEC 12-3000', critical: true },
    { id: 'mech-08', description: 'Check GFCI and AFCI protection', codeReference: 'CEC 26-700', critical: true },
  ],
  'Insulation & Vapour Barrier': [
    { id: 'insul-01', description: 'Verify insulation R-values meet requirements', codeReference: '9.36.2.2', critical: true },
    { id: 'insul-02', description: 'Check insulation installation (no gaps or compression)', codeReference: '9.36.2.4', critical: true },
    { id: 'insul-03', description: 'Verify air barrier continuity', codeReference: '9.36.2.9', critical: true },
    { id: 'insul-04', description: 'Check vapour barrier installation and sealing', codeReference: '9.25.4.1', critical: true },
    { id: 'insul-05', description: 'Verify attic ventilation (1:300 ratio)', codeReference: '9.19.1.1', critical: false },
  ],
  'Drywall': [
    { id: 'dry-01', description: 'Verify drywall thickness and type', codeReference: '9.29.5.2', critical: false },
    { id: 'dry-02', description: 'Check fire-rated assembly construction', codeReference: '9.10.3.1', critical: true },
    { id: 'dry-03', description: 'Verify sound-rated assembly construction', codeReference: '9.11.1.1', critical: false },
  ],
  'Final': [
    { id: 'final-01', description: 'Verify smoke alarms installed and operational', codeReference: '9.10.19.1', critical: true },
    { id: 'final-02', description: 'Check carbon monoxide alarms', codeReference: '9.32.4.4', critical: true },
    { id: 'final-03', description: 'Verify exit signs and emergency lighting (if required)', codeReference: '3.4.5.1', critical: false },
    { id: 'final-04', description: 'Check handrails and guards meet code', codeReference: '9.8.8.2', critical: true },
    { id: 'final-05', description: 'Verify stair dimensions (rise, run, width)', codeReference: '9.8.3.3', critical: true },
    { id: 'final-06', description: 'Check window and door hardware operation', codeReference: '9.7.4.1', critical: false },
    { id: 'final-07', description: 'Verify house numbers visible from street', codeReference: '9.9.12.1', critical: false },
    { id: 'final-08', description: 'Check final grading and drainage', codeReference: '9.14.1.1', critical: false },
  ],
};

// Occupancy-specific additional checklist items
const occupancySpecificItems: Record<string, Partial<Record<ConstructionPhase, ChecklistItem[]>>> = {
  'A': { // Assembly occupancies
    'Framing': [
      { id: 'asm-frame-01', description: 'Verify fire separations between assembly and other occupancies', codeReference: '3.3.1.3', critical: true },
      { id: 'asm-frame-02', description: 'Check egress door swing direction (outward)', codeReference: '3.4.6.16', critical: true },
    ],
    'Final': [
      { id: 'asm-final-01', description: 'Verify occupant load posted', codeReference: '3.1.16.1', critical: true },
      { id: 'asm-final-02', description: 'Check exit signage and emergency lighting', codeReference: '3.4.5.1', critical: true },
      { id: 'asm-final-03', description: 'Verify fire extinguisher placement', codeReference: '3.2.5.17', critical: false },
    ],
  },
  'B': { // Institutional occupancies
    'Framing': [
      { id: 'inst-frame-01', description: 'Verify 1-hour fire separations between suites', codeReference: '3.3.4.4', critical: true },
      { id: 'inst-frame-02', description: 'Check corridor fire separation (45min minimum)', codeReference: '3.3.4.4', critical: true },
    ],
    'Mechanical': [
      { id: 'inst-mech-01', description: 'Verify nurse call system rough-in', codeReference: '3.2.7.1', critical: false },
    ],
    'Final': [
      { id: 'inst-final-01', description: 'Check accessible washroom facilities', codeReference: '3.8.2.8', critical: true },
      { id: 'inst-final-02', description: 'Verify fire alarm system operational', codeReference: '3.2.4.1', critical: true },
    ],
  },
  'C': { // Residential occupancies
    'Foundation': [
      { id: 'res-found-01', description: 'Verify radon mitigation rough-in (if required)', codeReference: '9.13.4', critical: false },
    ],
    'Framing': [
      { id: 'res-frame-01', description: 'Check fire separation between dwelling units (45min-1hr)', codeReference: '9.10.8.3', critical: true },
      { id: 'res-frame-02', description: 'Verify bedroom egress window size and operation', codeReference: '9.7.2.1', critical: true },
      { id: 'res-frame-03', description: 'Check secondary suite separation (1-hour)', codeReference: '9.10.9.14', critical: true },
    ],
    'Mechanical': [
      { id: 'res-mech-01', description: 'Verify bathroom ventilation (50 cfm minimum)', codeReference: '9.32.3.1', critical: false },
      { id: 'res-mech-02', description: 'Check kitchen range hood installation', codeReference: '9.32.3.4', critical: false },
    ],
    'Final': [
      { id: 'res-final-01', description: 'Verify smoke alarms in all sleeping rooms', codeReference: '9.10.19.2', critical: true },
      { id: 'res-final-02', description: 'Check CO alarm on each storey with fuel-burning appliance', codeReference: '9.32.4.4', critical: true },
    ],
  },
  'D': { // Business & Personal Services
    'Final': [
      { id: 'bus-final-01', description: 'Verify accessible entrance and path of travel', codeReference: '3.8.1.2', critical: true },
      { id: 'bus-final-02', description: 'Check accessible washroom facilities', codeReference: '3.8.2.8', critical: true },
    ],
  },
  'E': { // Mercantile
    'Final': [
      { id: 'merc-final-01', description: 'Verify exit width based on occupant load', codeReference: '3.4.3.2', critical: true },
      { id: 'merc-final-02', description: 'Check aisle widths and clearances', codeReference: '3.3.1.9', critical: false },
    ],
  },
  'F': { // Industrial
    'Framing': [
      { id: 'ind-frame-01', description: 'Verify fire separations based on hazard classification', codeReference: '3.3.1.3', critical: true },
    ],
    'Mechanical': [
      { id: 'ind-mech-01', description: 'Check hazardous area ventilation', codeReference: '3.6.2.1', critical: true },
    ],
  },
};

// Generate complete checklist for a given occupancy
export function getChecklistForOccupancy(occupancyCode: string): PhaseChecklist[] {
  const occupancyPrefix = occupancyCode.charAt(0); // Get first letter (A, B, C, D, E, F)
  
  const phases: ConstructionPhase[] = [
    'Foundation',
    'Framing',
    'Mechanical',
    'Insulation & Vapour Barrier',
    'Drywall',
    'Final'
  ];

  return phases.map(phase => {
    const baseItems = baseChecklists[phase] || [];
    const specificItems = occupancySpecificItems[occupancyPrefix]?.[phase] || [];
    
    return {
      phase,
      items: [...baseItems, ...specificItems]
    };
  });
}

// Get checklist for a specific phase
export function getChecklistForPhase(occupancyCode: string, phase: ConstructionPhase): ChecklistItem[] {
  const allChecklists = getChecklistForOccupancy(occupancyCode);
  return allChecklists.find(c => c.phase === phase)?.items || [];
}

// Get all critical items across all phases
export function getCriticalItems(occupancyCode: string): ChecklistItem[] {
  const allChecklists = getChecklistForOccupancy(occupancyCode);
  return allChecklists.flatMap(c => c.items.filter(item => item.critical));
}
