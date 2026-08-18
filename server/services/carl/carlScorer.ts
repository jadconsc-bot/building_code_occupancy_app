/**
 * CARL Permit Completeness Scorer
 * NBC 2020 / NBC(AE) 2023 / BCBC 2024
 *
 * Maps all 78 CARL items against available orchestrator outputs.
 * DETERMINISTIC ONLY — no LLM calls, no external dependencies.
 *
 * Scoring formula:
 *   score = (passCount + 0.5 * advisoryCount) / scorableItems * 100
 *   scorableItems = items where status !== out_of_scope && !== not_evaluated
 *
 * Labels:
 *   Ready      = score >= 80 AND hasBlockingFailures === false
 *   Needs Work = score 50–79
 *   Not Ready  = score < 50 OR hasBlockingFailures === true
 */

import type { OrchestratorResult } from '../calculatorOrchestrator';
import type { CARLItem, CARLReport, CARLSectionScore, CARLStatus } from './carlTypes';
import type { BarrierFreeResult } from '../barrierFreeCalculator';

export interface CARLScorerInput {
  orchestratorResult: OrchestratorResult;
  projectId: number | null;
  address: string | null;
  province: string;
  municipality: string | null;
  codeEdition: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  storeys: number;
  sprinklered: boolean;
  hasAbandonedWellDeclaration?: boolean;
  hasPublicTreeStatement?: boolean;
  hasAsbestosForm?: boolean;
  constructionYear?: number | null;
  barrierFreeRequirements?: BarrierFreeResult | null;
}

const SECTION_NAMES: Record<number, string> = {
  1: 'Project Information',
  2: 'Occupancy Classification',
  3: 'Building Size & Construction',
  4: 'Fire Protection & Life Safety',
  5: 'Egress & Exiting',
  6: 'Accessibility',
  7: 'Structural',
  8: 'Mechanical',
  9: 'Plumbing',
  10: 'Electrical & Lighting',
  11: 'Energy Efficiency',
  12: 'Site & Civil',
  13: 'Documentation & Drawing Quality',
};

function makeItem(
  carlId: string,
  section: number,
  sectionName: string,
  description: string,
  nbcRef: string,
  engineCoverage: CARLItem['engineCoverage'],
  dataSource: string | null,
  blockingIfFailed: boolean,
  status: CARLStatus,
  evidence: string | null,
  confidence: CARLItem['confidence'],
  recommendation: string | null,
  jurisdiction?: string,
): CARLItem {
  return {
    carlId, section, sectionName, description, nbcRef,
    jurisdiction, engineCoverage, dataSource, blockingIfFailed,
    status, evidence, confidence, recommendation,
  };
}

export function scoreCARLItems(input: CARLScorerInput): CARLReport {
  const timestamp = new Date().toISOString();
  const { orchestratorResult: o, province, municipality } = input;
  const isCalgary = municipality?.toLowerCase().includes('calgary') ?? false;
  const bf = input.barrierFreeRequirements;
  const bfRequired = bf?.isBarrierFreeRequired ?? true;
  const items: CARLItem[] = [];

  // ── SECTION 1 — Project Information ────────────────────────────────────────
  const s1 = SECTION_NAMES[1];

  items.push(makeItem('CARL-1.1', 1, s1,
    'Legal address confirmed', 'NBC 1.3.3.1', 'full', 'project.address', true,
    input.address ? 'pass' : 'not_evaluated',
    input.address ? `Address: ${input.address}` : null,
    input.address ? 'high' : null,
    input.address ? null : 'Enter project address in Project Wizard',
  ));

  items.push(makeItem('CARL-1.2', 1, s1,
    'Land use / zoning verified', 'NBC(AE) 1.3.3.1(3)', 'partial', 'project.jurisdictionSource', true,
    input.jurisdictionSource === 'geocoded' ? 'pass' : 'advisory',
    input.jurisdictionSource ? `Jurisdiction source: ${input.jurisdictionSource}` : null,
    input.jurisdictionSource === 'geocoded' ? 'high' : 'low',
    input.jurisdictionSource !== 'geocoded' ? 'Geocode project address to auto-detect jurisdiction' : null,
  ));

  items.push(makeItem('CARL-1.3', 1, s1,
    'Development permit status confirmed', 'MGA s.642', 'manual', null, true,
    'advisory', null, null,
    'Verify development permit is approved before building permit submission',
  ));

  items.push(makeItem('CARL-1.4', 1, s1,
    'Project description matches drawings', '—', 'manual', null, false,
    'advisory', null, null,
    'Confirm project description on application form matches drawing set',
  ));

  items.push(makeItem('CARL-1.5', 1, s1,
    'Professional involvement identified', 'Safety Codes Act s.16', 'manual', null, true,
    'advisory', null, null,
    'Identify responsible architect or engineer on permit application',
  ));

  items.push(makeItem('CARL-1.6', 1, s1,
    'Applicable code edition noted', 'NBC 1.1.1.1', 'full', 'summary.edition', true,
    input.codeEdition ? 'pass' : 'not_evaluated',
    input.codeEdition ? `Edition: ${input.codeEdition}` : null,
    'high', null,
  ));

  // ── SECTION 2 — Occupancy Classification ───────────────────────────────────
  const s2 = SECTION_NAMES[2];
  const hasOccupancy = o.occupantLoad.length > 0;
  const occupancyGroups = [...new Set(o.occupantLoad.map(r => r.occupancyGroup))];
  const isMixedUse = occupancyGroups.length > 1;

  items.push(makeItem('CARL-2.1', 2, s2,
    'Primary occupancy group identified', 'NBC 3.1.2.1', 'full', 'occupantLoad[].occupancyGroup', true,
    hasOccupancy ? 'pass' : 'not_evaluated',
    hasOccupancy ? `Groups: ${occupancyGroups.join(', ')}` : null,
    hasOccupancy ? 'high' : null,
    hasOccupancy ? null : 'Run Full Analysis to detect occupancy groups',
  ));

  items.push(makeItem('CARL-2.2', 2, s2,
    'Secondary / accessory occupancies identified', 'NBC 3.1.2.2', 'partial', 'occupantLoad[]', true,
    isMixedUse ? 'pass' : hasOccupancy ? 'advisory' : 'not_evaluated',
    isMixedUse ? `Mixed-use: ${occupancyGroups.join(' + ')}` : hasOccupancy ? 'Single occupancy detected' : null,
    hasOccupancy ? 'medium' : null,
    !isMixedUse && hasOccupancy ? 'Verify no accessory occupancies present' : null,
  ));

  items.push(makeItem('CARL-2.3', 2, s2,
    'Mixed-use conditions evaluated', 'NBC 3.1.3', 'partial', 'fireSeparation[]', true,
    isMixedUse
      ? (o.fireSeparation.length > 0 ? 'pass' : 'fail')
      : hasOccupancy ? 'pass' : 'not_evaluated',
    isMixedUse
      ? `${o.fireSeparation.length} fire separation rule(s) evaluated`
      : 'Single occupancy — mixed-use not applicable',
    isMixedUse ? 'medium' : 'high',
    isMixedUse && o.fireSeparation.length === 0
      ? 'Mixed-use detected but no fire separations evaluated'
      : null,
  ));

  items.push(makeItem('CARL-2.4', 2, s2,
    'Occupant load calculations provided', 'NBC T.3.1.17.1', 'full', 'occupantLoad[].maxOccupants', true,
    hasOccupancy ? 'pass' : 'not_evaluated',
    hasOccupancy ? `Total occupant load: ${o.summary.totalOccupants} persons` : null,
    hasOccupancy ? 'high' : null,
    hasOccupancy ? null : 'Run Full Analysis to calculate occupant loads',
  ));

  items.push(makeItem('CARL-2.5', 2, s2,
    'Occupancy affects zoning compliance', 'Land Use Bylaw 1P2007', 'manual', null, false,
    'advisory', null, null,
    'Verify occupancy is permitted under land use district',
  ));

  const hasHighHazard = occupancyGroups.some(g =>
    g.replace('-', '').toUpperCase() === 'F1'
  );
  items.push(makeItem('CARL-2.6', 2, s2,
    'Hazard classification reviewed (F1/F2/F3)', 'NBC 3.1.2.1', 'full', 'occupantLoad[].occupancyGroup', true,
    hasOccupancy ? 'pass' : 'not_evaluated',
    hasHighHazard
      ? 'High-hazard F1 occupancy detected — additional requirements apply'
      : hasOccupancy ? 'No high-hazard occupancy detected' : null,
    hasOccupancy ? 'high' : null,
    hasHighHazard ? 'F1 requires Non-Combustible construction and sprinklers throughout' : null,
  ));

  // ── SECTION 3 — Building Size & Construction ────────────────────────────────
  const s3 = SECTION_NAMES[3];
  const totalAreaM2 = o.occupantLoad.reduce((sum, r) => sum + (r.areaM2 ?? 0), 0);
  const hasConstructionType = o.constructionTypes.length > 0;
  const anyNCFail = o.constructionTypes.some(ct => ct.severity === 'fail');

  items.push(makeItem('CARL-3.1', 3, s3,
    'Building area calculated correctly', 'NBC 3.2.2', 'partial', 'occupantLoad[].areaM2', true,
    totalAreaM2 > 0 ? 'pass' : 'not_evaluated',
    totalAreaM2 > 0 ? `Total area: ${Math.round(totalAreaM2)} m²` : null,
    totalAreaM2 > 0 ? 'medium' : null,
    totalAreaM2 === 0 ? 'Upload and analyze drawings to calculate building area' : null,
  ));

  items.push(makeItem('CARL-3.2', 3, s3,
    'Number of storeys confirmed', 'NBC 1.1.3.2', 'full', 'input.storeys', true,
    input.storeys > 0 ? 'pass' : 'not_evaluated',
    input.storeys > 0 ? `${input.storeys} storey(s)` : null,
    'high',
    input.storeys === 0 ? 'Set storey count in project settings' : null,
  ));

  items.push(makeItem('CARL-3.3', 3, s3,
    'Building height confirmed', 'NBC 3.2.1.2', 'manual', null, true,
    'advisory', null, null,
    'Confirm building height in geodetic datum on elevation drawings',
  ));

  items.push(makeItem('CARL-3.4', 3, s3,
    'Construction type verified', 'NBC T.3.2.2.20', 'full', 'constructionTypes[]', true,
    hasConstructionType ? (anyNCFail ? 'fail' : 'pass') : 'not_evaluated',
    hasConstructionType
      ? o.constructionTypes.map(ct => `${ct.occupancyGroup}: ${ct.constructionType}`).join(', ')
      : null,
    hasConstructionType ? 'high' : null,
    anyNCFail ? 'Non-Combustible construction required — review construction type' : null,
  ));

  items.push(makeItem('CARL-3.5', 3, s3,
    'Fire-resistance ratings meet code', 'NBC 3.2.2', 'partial', 'fireSeparation[].requiredFRR', true,
    o.fireSeparation.length > 0 ? 'advisory' : 'not_evaluated',
    o.fireSeparation.length > 0 ? `${o.fireSeparation.length} FRR interface(s) identified` : null,
    o.fireSeparation.length > 0 ? 'medium' : null,
    o.fireSeparation.length > 0 ? 'Verify FRR assemblies are specified on drawings with ULC references' : null,
  ));

  items.push(makeItem('CARL-3.6', 3, s3,
    'Spatial separation distances calculated', 'NBC 9.10.14', 'partial', null, true,
    'advisory', null, null,
    'Calculate limiting distance and unprotected opening % on all elevation drawings',
  ));

  items.push(makeItem('CARL-3.7', 3, s3,
    'Limiting distance & unprotected openings compliant', 'NBC 9.10.14', 'partial', null, true,
    'advisory', null, null,
    'Document spatial separation calculations on side elevation drawings',
  ));

  // ── SECTION 4 — Fire Protection & Life Safety ──────────────────────────────
  const s4 = SECTION_NAMES[4];
  const sprinklerConflicts = o.codeConflicts.conflicts.filter(c =>
    c.conflictId.startsWith('CONFLICT-SP')
  );
  const sprinklerRequired = input.sprinklered ||
    occupancyGroups.some(g => ['A1', 'B1', 'B2', 'F1'].includes(g.replace('-', '').toUpperCase()));
  const fsConflict = o.codeConflicts.conflicts.find(c =>
    c.conflictId === 'CONFLICT-FS-001'
  );

  items.push(makeItem('CARL-4.1', 4, s4,
    'Sprinkler system requirement evaluated', 'NBC 3.2.5.2', 'full', 'codeConflicts', true,
    sprinklerConflicts.length > 0 ? 'fail'
      : sprinklerRequired ? 'pass' : 'advisory',
    sprinklerConflicts.length > 0
      ? 'Conflict: sprinklers required but building marked unsprinklered'
      : input.sprinklered ? 'Building marked as sprinklered'
      : 'Sprinklers not required for this occupancy',
    'high',
    sprinklerConflicts.length > 0 ? 'Add sprinkler system or verify occupancy classification' : null,
  ));

  items.push(makeItem('CARL-4.2', 4, s4,
    'Fire alarm system required?', 'NBC 3.2.4.7', 'manual', null, true,
    'advisory', null, null,
    'Determine fire alarm requirement based on occupancy, area, and sprinkler status',
  ));

  items.push(makeItem('CARL-4.3', 4, s4,
    'Standpipe requirements checked', 'NBC 3.2.5.4', 'manual', null, false,
    'advisory', null, null,
    'Check standpipe requirements for buildings over 3 storeys',
  ));

  items.push(makeItem('CARL-4.4', 4, s4,
    'Fire separations between occupancies', 'NBC 3.1.3.1 / Table 3.1.3.1', 'partial', 'fireSeparation[]', true,
    fsConflict ? 'fail'
      : o.fireSeparation.length > 0 ? 'advisory'
      : isMixedUse ? 'fail' : 'pass',
    fsConflict ? 'Mixed-use detected but no fire separations evaluated'
      : o.fireSeparation.length > 0 ? `${o.fireSeparation.length} separation(s) identified — verify assemblies`
      : 'Single occupancy — no inter-occupancy separations required',
    'medium',
    fsConflict ? 'Run fire separation analysis for all occupancy interfaces' : null,
  ));

  items.push(makeItem('CARL-4.5', 4, s4,
    'Fire-rated doors & hardware specified', 'NBC 3.1.8', 'manual', null, false,
    'advisory', null, null,
    'Specify fire door ratings and hardware on door schedule',
  ));

  items.push(makeItem('CARL-4.6', 4, s4,
    'Smoke control / smoke alarms compliant', 'NBC 9.10.19', 'manual', null, true,
    'advisory', null, null,
    'Show smoke alarm locations on electrical plan — hardwired interconnected required',
  ));

  items.push(makeItem('CARL-4.7', 4, s4,
    'Firestopping details provided', 'NBC 3.1.9', 'manual', null, false,
    'advisory', null, null,
    'Include firestopping details at all penetrations through fire separations',
  ));

  // ── SECTION 5 — Egress & Exiting ───────────────────────────────────────────
  const s5 = SECTION_NAMES[5];
  const tdResults = o.travelDistance;
  const tdFails = tdResults.filter(r => r.result === 'fail');
  const tdPasses = tdResults.filter(r => r.result === 'pass');
  const tdConflicts = o.codeConflicts.conflicts.filter(c =>
    c.conflictId.startsWith('CONFLICT-TD')
  );
  const egFails = o.egressWindows.filter(w => w.result === 'fail');
  type TraceableFinding = (typeof o.findings)[number] & {
    constraintId?: string;
    ruleReference?: string;
    result?: 'pass' | 'fail' | 'warning' | 'conditional';
  };
  const findings = (o.findings ?? []) as TraceableFinding[];
  const deriveFindingStatus = (matchedFindings: TraceableFinding[]): CARLStatus => {
    if (matchedFindings.length === 0) return 'not_evaluated';
    const statuses = matchedFindings.map(f => f.result ?? f.severity);
    if (statuses.includes('fail')) return 'fail';
    if (statuses.some(status => status === 'warning' || status === 'conditional' || status === 'advisory')) {
      return 'advisory';
    }
    return 'pass';
  };
  const exitWidthFindings = findings.filter(f =>
    f.constraintId?.includes('exit_width')
    || f.ruleReference?.includes('3.3.1.13')
    || f.citation?.includes('3.3.1.13')
    || /exit door.*width/i.test(f.description)
  );
  const exitWidthStatus = deriveFindingStatus(exitWidthFindings);
  const corridorWidthFindings = findings.filter(f =>
    f.constraintId?.includes('corridor_width')
    || f.ruleReference?.includes('3.3.1.9')
    || f.ruleReference?.includes('3.4.1.9')
    || f.citation?.includes('3.3.1.9')
    || f.citation?.includes('3.4.1.9')
    || /corridor.*width/i.test(f.description)
  );
  const corridorWidthStatus = deriveFindingStatus(corridorWidthFindings);

  items.push(makeItem('CARL-5.1', 5, s5,
    'Number of exits per floor compliant', 'NBC 3.4.2.2', 'partial', 'summary', true,
    o.summary.totalRooms > 0 ? 'advisory' : 'not_evaluated',
    o.summary.totalRooms > 0 ? `${o.summary.totalRooms} rooms analyzed` : null,
    'low',
    'Verify minimum exit count per floor — requires architectural review',
  ));

  items.push(makeItem('CARL-5.2', 5, s5,
    'Exit door minimum clear width 850mm', 'NBC 3.3.1.13.(1)(a)', 'partial', 'findings[]', true,
    exitWidthStatus,
    exitWidthFindings.length > 0
      ? `${exitWidthFindings.length} exit-width finding(s): ${exitWidthFindings.map(f => f.description).join('; ')}`
      : 'Exit door width requires drawing analysis',
    exitWidthFindings.length > 0 ? 'medium' : null,
    exitWidthStatus === 'not_evaluated'
      ? 'Upload a floor plan with labeled exit doors to verify 850mm minimum clear width per NBC 3.3.1.13.(1)(a)'
      : exitWidthStatus === 'fail'
        ? 'Correct exit door clear width to at least 850mm before permit submission'
        : exitWidthStatus === 'advisory'
          ? 'Confirm exit door clear width on stamped drawings before permit submission'
          : null,
  ));

  items.push(makeItem('CARL-5.2b', 5, s5,
    'Corridor minimum clear width 1100mm', 'NBC 3.3.1.9.(1)', 'partial', 'findings[]', true,
    corridorWidthStatus,
    corridorWidthFindings.length > 0
      ? `${corridorWidthFindings.length} corridor-width finding(s): ${corridorWidthFindings.map(f => f.description).join('; ')}`
      : 'Corridor clear width requires drawing analysis',
    corridorWidthFindings.length > 0 ? 'medium' : null,
    corridorWidthStatus === 'not_evaluated'
      ? 'Run drawing analysis and confirm corridor clear width is at least 1100mm per NBC 3.3.1.9.(1)'
      : corridorWidthStatus === 'fail'
        ? 'Correct corridor clear width to at least 1100mm before permit submission'
        : corridorWidthStatus === 'advisory'
          ? 'Confirm corridor clear width on scaled stamped drawings before permit submission'
          : null,
  ));

  items.push(makeItem('CARL-5.3', 5, s5,
    'Travel distance within limits', 'NBC 3.4.2.5', 'full', 'travelDistance[]', true,
    tdResults.length === 0 ? 'not_evaluated'
      : tdConflicts.length > 0 ? 'fail'
      : tdFails.length > 0 ? 'fail' : 'pass',
    tdResults.length > 0
      ? `${tdPasses.length} pass / ${tdFails.length} fail of ${tdResults.length} room(s)`
      : null,
    tdResults.length > 0 ? 'high' : null,
    (tdConflicts.length > 0
      ? 'Travel distance passes using wrong limit — check sprinkler status.'
      : tdFails.length > 0 ? 'Reduce travel distance or add exit.' : '') +
      ' Note: travel distance is currently measured as a straight-line approximation and does not account for walls or corridors.',
  ));

  items.push(makeItem('CARL-5.4', 5, s5,
    'Dead-end corridor limits respected', 'NBC 3.4.2.7', 'manual', null, true,
    'advisory', null, null,
    'Verify dead-end corridors do not exceed 6m (unsprinklered) or 15m (sprinklered)',
  ));

  items.push(makeItem('CARL-5.5', 5, s5,
    'Exit continuity maintained', 'NBC 3.4.4', 'manual', null, true,
    'advisory', null, null,
    'Confirm exit routes are continuous and unobstructed to public way',
  ));

  items.push(makeItem('CARL-5.6', 5, s5,
    'Bedroom egress window dimensions meet minimum (0.35m² opening, 380mm width)',
    'NBC 9.8.4', 'full', 'egressWindows[]', true,
    o.egressWindows.length > 0
      ? (egFails.length > 0 ? 'fail' : 'pass')
      : 'not_evaluated',
    o.egressWindows.length > 0
      ? `${o.egressWindows.length} window(s) checked — ${egFails.length} fail(s)`
      : null,
    o.egressWindows.length > 0 ? 'high' : null,
    egFails.length > 0
      ? `${egFails.length} egress window(s) below minimum 0.35m² / 380mm`
      : null,
  ));

  items.push(makeItem('CARL-5.7', 5, s5,
    'Door swings correct (in direction of travel)', 'NBC 3.4.6.3', 'manual', null, false,
    'advisory', null, null,
    'Verify exit doors swing in direction of travel where occupant load > 60',
  ));

  items.push(makeItem('CARL-5.8', 5, s5,
    'Exit signage & emergency lighting shown', 'NBC 3.2.7', 'manual', null, true,
    'advisory', null, null,
    'Show exit signs and emergency lighting on electrical plans',
  ));

  // ── SECTION 6 — Accessibility ───────────────────────────────────────────────
  const s6 = SECTION_NAMES[6];

  items.push(makeItem('CARL-6.1', 6, s6,
    'Barrier-free path of travel provided', 'NBC 3.8.1', 'partial',
    'barrierFreeRequirements.accessiblePathRequired', true,
    !bfRequired ? 'pass'
      : bf == null ? 'not_evaluated'
      : bf.accessiblePathRequired ? 'advisory'
      : 'pass',
    !bfRequired
      ? 'Building exempt from NBC Part 3.8 (single detached ≤2 storeys)'
      : 'Barrier-free path required — verify on floor plans',
    !bfRequired ? 'high' : 'medium',
    !bfRequired ? null
      : 'Show barrier-free path from accessible parking to all accessible spaces',
  ));

  items.push(makeItem('CARL-6.2', 6, s6,
    'Door clearances & hardware compliant', 'NBC 3.8.2.3', 'partial',
    'barrierFreeRequirements.requirements', true,
    !bfRequired ? 'pass' : 'advisory',
    !bfRequired
      ? 'Exempt from NBC Part 3.8'
      : 'Verify 850mm clear door width and lever hardware on accessible path',
    !bfRequired ? 'high' : 'medium',
    !bfRequired ? null
      : 'Verify 850mm clear door width and lever hardware on accessible path',
  ));

  items.push(makeItem('CARL-6.3', 6, s6,
    'Washroom accessibility verified', 'NBC 3.8.3.8', 'partial',
    'barrierFreeRequirements.accessibleWashroomRequired', true,
    !bfRequired ? 'pass'
      : bf == null ? 'not_evaluated'
      : bf.accessibleWashroomRequired ? 'advisory'
      : 'pass',
    !bfRequired
      ? 'Exempt from NBC Part 3.8'
      : bf?.accessibleWashroomRequired
      ? 'Accessible stall required — verify dimensions on drawings'
      : 'Accessible stall not required for this occupant load',
    !bfRequired ? 'high' : 'medium',
    bf?.accessibleWashroomRequired
      ? 'Provide accessible washroom stall: 1500mm turning circle, grab bars NBC 3.8.3.11'
      : null,
  ));

  items.push(makeItem('CARL-6.4', 6, s6,
    'Ramps & slopes compliant', 'NBC 3.8.3.4', 'partial',
    'barrierFreeRequirements.requirements', false,
    !bfRequired ? 'pass' : 'advisory',
    !bfRequired ? 'Exempt from NBC Part 3.8' : null,
    !bfRequired ? 'high' : null,
    !bfRequired ? null
      : 'Max slope 1:12, min width 870mm, landings at top and bottom',
  ));

  items.push(makeItem('CARL-6.5', 6, s6,
    'Elevators / lifts required?', 'NBC 3.8.2.1', 'partial',
    'barrierFreeRequirements.elevatorRequired', true,
    !bfRequired ? 'pass'
      : bf == null ? 'not_evaluated'
      : bf.elevatorRequired ? 'advisory'
      : 'pass',
    !bfRequired
      ? 'Exempt from NBC Part 3.8'
      : bf?.elevatorRequired
      ? `Elevator required — ${input.storeys} storeys with public occupancy`
      : 'Elevator not required for this building height and occupancy',
    'high',
    bf?.elevatorRequired
      ? 'Provide elevator or lift serving all floors — min. 1100mm × 1400mm cab (NBC 3.8.3.6)'
      : null,
  ));

  items.push(makeItem('CARL-6.6', 6, s6,
    'Turning radii & maneuvering spaces shown', 'NBC 3.8.3', 'partial',
    'barrierFreeRequirements.requirements', false,
    !bfRequired ? 'pass' : 'advisory',
    !bfRequired ? 'Exempt from NBC Part 3.8' : null,
    !bfRequired ? 'high' : null,
    !bfRequired ? null
      : 'Show 1500mm turning circle at all accessible route decision points',
  ));

  // ── SECTION 7 — Structural ──────────────────────────────────────────────────
  const s7 = SECTION_NAMES[7];

  items.push(makeItem('CARL-7.1', 7, s7,
    'Foundation design provided', 'NBC 9.4', 'out_of_scope', null, true,
    'out_of_scope', null, null,
    'Foundation design requires structural engineer — outside CodeComply scope',
  ));

  items.push(makeItem('CARL-7.2', 7, s7,
    'Framing plans complete', 'NBC 9.23', 'partial', null, false,
    'advisory', null, null,
    'Wood frame span tables available in CodeComply — verify engineered components are stamped',
  ));

  items.push(makeItem('CARL-7.3', 7, s7,
    'Engineered components stamped', 'Safety Codes Act', 'out_of_scope', null, true,
    'out_of_scope', null, null,
    'TJI/LVL/truss shop drawings require structural engineer stamp',
  ));

  items.push(makeItem('CARL-7.4', 7, s7,
    'Lateral bracing / shear walls shown', 'NBC 9.23.13', 'out_of_scope', null, false,
    'out_of_scope', null, null,
    'Shear wall design requires structural engineer',
  ));

  items.push(makeItem('CARL-7.5', 7, s7,
    'Snow, wind, live loads specified', 'NBC 4.1.6', 'out_of_scope', null, true,
    'out_of_scope', null, null,
    'Structural load calculations require engineer of record',
  ));

  items.push(makeItem('CARL-7.6', 7, s7,
    'Structural coordination with architectural', '—', 'manual', null, false,
    'advisory', null, null,
    'Verify structural drawings coordinate with architectural floor plans',
  ));

  // ── SECTION 8 — Mechanical ──────────────────────────────────────────────────
  const s8 = SECTION_NAMES[8];
  const mechItems = [
    { id: 'CARL-8.1', desc: 'HVAC design provided', ref: 'NBC 9.32', blocking: true },
    { id: 'CARL-8.2', desc: 'Ventilation rates compliant', ref: 'NBC 9.32.3', blocking: true },
    { id: 'CARL-8.3', desc: 'Combustion air requirements met', ref: 'NBC 9.33', blocking: true },
    { id: 'CARL-8.4', desc: 'Fire dampers where required', ref: 'NBC 3.6.5', blocking: true },
    { id: 'CARL-8.5', desc: 'Mechanical room clearances compliant', ref: 'NBC 9.33', blocking: false },
    { id: 'CARL-8.6', desc: 'Exhaust & makeup air balanced', ref: 'NBC 9.32', blocking: false },
  ];
  mechItems.forEach(m => {
    items.push(makeItem(m.id, 8, s8, m.desc, m.ref, 'manual', null, m.blocking,
      'advisory', null, null, `Provide mechanical drawings showing ${m.desc.toLowerCase()}`,
    ));
  });

  if (isCalgary) {
    items.push(makeItem('CARL-C8.1', 8, s8,
      'Separate ventilation and heating for suite', 'Calgary BP req.', 'manual', null, true,
      'advisory', null, null,
      'Calgary requires separate heating/ventilation for secondary suite — show on floor plans',
      'Calgary',
    ));
  }

  // ── SECTION 9 — Plumbing ───────────────────────────────────────────────────
  const s9 = SECTION_NAMES[9];
  const hasWashroom = o.washroomCounts.length > 0;
  const washroomPass = o.washroomCounts.every(wc => wc.severity === 'pass' || wc.severity === 'info');

  items.push(makeItem('CARL-9.1', 9, s9,
    'Plumbing fixture counts meet code', 'NBC 3.7.2.2', 'full', 'washroomCounts[]', true,
    hasWashroom ? (washroomPass ? 'pass' : 'advisory') : 'not_evaluated',
    hasWashroom
      ? o.washroomCounts.map(wc =>
          `${wc.occupancyGroup}: ${wc.required.waterClosetsMale}M/${wc.required.waterClosetsFemale}F WC, ${wc.required.lavatories} lav`
        ).join(' | ')
      : null,
    hasWashroom ? 'high' : null,
    !washroomPass && hasWashroom ? 'Verify fixture counts meet NBC 3.7.2.2 minimums' : null,
  ));

  items.push(makeItem('CARL-9.2', 9, s9,
    'Drainage & venting diagrams provided', 'NBC 7.2', 'manual', null, false,
    'advisory', null, null,
    'Provide drainage and venting isometric or riser diagram',
  ));

  items.push(makeItem('CARL-9.3', 9, s9,
    'Backflow prevention devices shown', 'NBC 7.4.4', 'partial', null, true,
    'advisory', null, null,
    'Show backwater valve location on plumbing plan (required for suites)',
  ));

  items.push(makeItem('CARL-9.4', 9, s9,
    'Hot water temperature control compliant', 'NBC 7.6.2', 'manual', null, false,
    'advisory', null, null,
    'Verify anti-scald valve at fixtures serving suites (max 49°C)',
  ));

  items.push(makeItem('CARL-9.5', 9, s9,
    'Grease/oil interceptors (if applicable)', 'NBC 7.4.6', 'manual', null, false,
    'advisory', null, null,
    'Required for commercial kitchen — not applicable for residential',
  ));

  // ── SECTION 10 — Electrical & Lighting ────────────────────────────────────
  const s10 = SECTION_NAMES[10];

  items.push(makeItem('CARL-10.1', 10, s10,
    'Panel schedules provided', 'CEC 26', 'manual', null, false,
    'advisory', null, null,
    'Include electrical panel schedule on electrical drawings',
  ));

  items.push(makeItem('CARL-10.2', 10, s10,
    'Emergency lighting shown', 'NBC 3.2.7.3', 'manual', null, true,
    'advisory', null, null,
    'Show emergency lighting locations on electrical plan',
  ));

  items.push(makeItem('CARL-10.3', 10, s10,
    'Exit signs shown', 'NBC 3.2.7.5', 'manual', null, true,
    'advisory', null, null,
    'Show exit sign locations on electrical plan at all exits',
  ));

  items.push(makeItem('CARL-10.4', 10, s10,
    'Arc-fault / GFCI requirements met', 'CEC 26-656/700', 'partial', null, true,
    'advisory', null, null,
    'AFCI: all bedroom circuits. GFCI: kitchen, bathroom, exterior, garage, crawlspace',
  ));

  items.push(makeItem('CARL-10.5', 10, s10,
    'Exterior lighting meets bylaws', 'Municipal bylaw', 'out_of_scope', null, false,
    'out_of_scope', null, null,
    'Verify exterior lighting against municipal light trespass bylaw',
  ));

  items.push(makeItem('CARL-10.6', 10, s10,
    'Coordination with mechanical & architectural', '—', 'manual', null, false,
    'advisory', null, null,
    'Verify electrical drawings coordinate with mechanical and architectural plans',
  ));

  // ── SECTION 11 — Energy Efficiency ────────────────────────────────────────
  const s11 = SECTION_NAMES[11];

  items.push(makeItem('CARL-11.1', 11, s11,
    'Building envelope compliance (NECB/NBC 9.36)', 'NBC 9.36 / NECB 2020', 'full', 'NECB calculator', true,
    'advisory',
    province === 'AB' ? 'Use NECB 2020 Prescriptive Path — ABC 9.36' : 'Use NECB 2020 or BCBC 2024 energy path',
    'medium',
    'Run NECB Energy Compliance tool and include 9.36 notes sheet in drawing set',
  ));

  items.push(makeItem('CARL-11.2', 11, s11,
    'Insulation values correct', 'NBC 9.36', 'full', 'Thermal RSI calculator', true,
    'advisory',
    'Use Thermal RSI Calculator in CodeComply to verify assembly RSI values',
    'medium',
    'Include effective RSI values for all assemblies on 9.36 notes sheet',
  ));

  items.push(makeItem('CARL-11.3', 11, s11,
    'Window performance (U-value/SHGC)', 'NBC 9.36 / NECB', 'full', 'WWR/FDWR calculator', true,
    'advisory',
    'Use WWR Calculator in CodeComply to verify window-to-wall ratio',
    'medium',
    'Specify window U-value on window schedule — max 1.6 W/m²K per NBC 9.36',
  ));

  items.push(makeItem('CARL-11.4', 11, s11,
    'Air barrier continuity shown', 'NBC 9.25.3', 'manual', null, false,
    'advisory', null, null,
    'Show air barrier continuity on wall section details',
  ));

  items.push(makeItem('CARL-11.5', 11, s11,
    'Mechanical efficiency requirements met', 'NECB', 'manual', null, false,
    'advisory', null, null,
    'Specify furnace/HRV efficiency ratings on mechanical schedule',
  ));

  // ── SECTION 12 — Site & Civil ──────────────────────────────────────────────
  const s12 = SECTION_NAMES[12];

  items.push(makeItem('CARL-12.1', 12, s12,
    'Site plan complete', isCalgary ? 'Calgary BP req.' : 'NBC', 'manual', null, true,
    'advisory', null, null,
    'Site plan must show: address, property lines, setbacks, building footprint, parking, amenity space',
    isCalgary ? 'Calgary' : undefined,
  ));

  items.push(makeItem('CARL-12.2', 12, s12,
    'Grading & drainage compliant', 'NBC 9.4.4', 'manual', null, false,
    'advisory', null, null,
    'Show existing and proposed grades on site plan',
  ));

  items.push(makeItem('CARL-12.3', 12, s12,
    'Fire department access maintained', 'NBC 3.2.5.6', 'manual', null, true,
    'advisory', null, null,
    'Verify fire department vehicle access to within 45m of all exterior walls',
  ));

  items.push(makeItem('CARL-12.4', 12, s12,
    'Parking requirements met', 'Land Use Bylaw', 'out_of_scope', null, false,
    'out_of_scope', null, null,
    'Parking requirements governed by land use bylaw — verify with DP',
  ));

  items.push(makeItem('CARL-12.5', 12, s12,
    'Barrier-free parking stalls provided', 'NBC 3.8.2.5', 'manual', null, true,
    'advisory', null, null,
    'Provide accessible stall(s) per NBC 3.8.2.5 — show on site plan',
  ));

  items.push(makeItem('CARL-12.6', 12, s12,
    'Utility connections shown', '—', 'manual', null, false,
    'advisory', null, null,
    'Show water, sewer, gas, and electrical service connections on site plan',
  ));

  // Calgary-specific
  if (isCalgary) {
    items.push(makeItem('CARL-C1.1', 1, SECTION_NAMES[1],
      'Abandoned Well Declaration completed', 'Calgary BP form', 'partial', null, true,
      input.hasAbandonedWellDeclaration ? 'pass' : 'advisory',
      input.hasAbandonedWellDeclaration ? 'Confirmed completed' : null,
      input.hasAbandonedWellDeclaration ? 'high' : null,
      !input.hasAbandonedWellDeclaration
        ? 'Complete Abandoned Well Declaration form with Calgary BP application' : null,
      'Calgary',
    ));

    items.push(makeItem('CARL-C1.2', 1, SECTION_NAMES[1],
      'Public Tree Disclosure Statement completed', 'Calgary BP form', 'partial', null, false,
      input.hasPublicTreeStatement ? 'pass' : 'advisory',
      input.hasPublicTreeStatement ? 'Confirmed completed' : null,
      input.hasPublicTreeStatement ? 'high' : null,
      !input.hasPublicTreeStatement
        ? 'Complete Public Tree Disclosure Statement with Calgary BP application' : null,
      'Calgary',
    ));

    if (input.constructionYear && input.constructionYear < 1990) {
      items.push(makeItem('CARL-C1.3', 1, SECTION_NAMES[1],
        'Asbestos Abatement Form completed (pre-1990 building)', 'Calgary BP form', 'partial', null, true,
        input.hasAsbestosForm ? 'pass' : 'fail',
        `Building constructed ${input.constructionYear} — asbestos form required`,
        'high',
        !input.hasAsbestosForm
          ? 'Pre-1990 building requires Asbestos Abatement Form with Calgary BP application' : null,
        'Calgary',
      ));
    }
  }

  // ── SECTION 13 — Documentation ─────────────────────────────────────────────
  const s13 = SECTION_NAMES[13];
  const hasFindings = o.findings.length > 0;

  items.push(makeItem('CARL-13.1', 13, s13,
    'Drawing set complete & coordinated', isCalgary ? 'Calgary BP req.' : '—', 'manual', null, true,
    'advisory', null, null,
    'Verify all required sheets: site plan, floor plans, elevations, sections, electrical, details',
  ));

  items.push(makeItem('CARL-13.2', 13, s13,
    'Professional seals where required', 'Safety Codes Act', 'manual', null, true,
    'advisory', null, null,
    'Architect/engineer seal required on all structural drawings and Part 3 buildings',
  ));

  items.push(makeItem('CARL-13.3', 13, s13,
    'Revisions clouded & dated', '—', 'manual', null, false,
    'advisory', null, null,
    'All revisions must be clouded with revision number and date',
  ));

  items.push(makeItem('CARL-13.4', 13, s13,
    'Code analysis summary included', '—', 'partial', 'findings[]', false,
    hasFindings ? 'pass' : 'advisory',
    hasFindings ? `${o.findings.length} finding(s) documented` : null,
    hasFindings ? 'medium' : null,
    !hasFindings ? 'Run Full Analysis to generate code findings for permit package' : null,
  ));

  items.push(makeItem('CARL-13.5', 13, s13,
    'Schedules & specifications provided', '—', 'manual', null, false,
    'advisory', null, null,
    'Include door schedule, window schedule, and construction assembly notes',
  ));

  items.push(makeItem('CARL-13.6', 13, s13,
    'Digital submission meets municipal standards', isCalgary ? 'Calgary ePermit' : '—',
    'out_of_scope', null, false,
    'out_of_scope', null, null,
    'Verify PDF/DWF submission meets Calgary ePermit digital document criteria',
    isCalgary ? 'Calgary' : undefined,
  ));

  // ── Scoring ────────────────────────────────────────────────────────────────

  const passCount = items.filter(i => i.status === 'pass').length;
  const failCount = items.filter(i => i.status === 'fail').length;
  const advisoryCount = items.filter(i => i.status === 'advisory').length;
  const outOfScopeCount = items.filter(i => i.status === 'out_of_scope').length;
  const notEvaluatedCount = items.filter(i => i.status === 'not_evaluated').length;
  const manualCount = items.filter(i => i.engineCoverage === 'manual').length;

  const scorableItems = items.filter(i =>
    i.status !== 'out_of_scope' && i.status !== 'not_evaluated'
  );
  const permitReadinessScore = scorableItems.length > 0
    ? Math.round((passCount + 0.5 * advisoryCount) / scorableItems.length * 100)
    : 0;

  const blockingItems = items.filter(
    i => i.blockingIfFailed && i.status === 'fail'
  );
  const hasBlockingFailures = blockingItems.length > 0;

  const permitReadinessLabel: CARLReport['permitReadinessLabel'] =
    hasBlockingFailures || permitReadinessScore < 50 ? 'Not Ready'
    : permitReadinessScore >= 80 ? 'Ready'
    : 'Needs Work';

  const sectionScores: CARLSectionScore[] = Array.from(
    { length: 13 }, (_, i) => {
      const sNum = i + 1;
      const sItems = items.filter(it => it.section === sNum);
      const sPass = sItems.filter(it => it.status === 'pass').length;
      const sFail = sItems.filter(it => it.status === 'fail').length;
      const sAdvisory = sItems.filter(it => it.status === 'advisory').length;
      const sOOS = sItems.filter(it => it.status === 'out_of_scope').length;
      const sScoreable = sItems.filter(it =>
        it.status !== 'out_of_scope' && it.status !== 'not_evaluated'
      );
      return {
        section: sNum,
        sectionName: SECTION_NAMES[sNum],
        score: sScoreable.length > 0
          ? Math.round((sPass + 0.5 * sAdvisory) / sScoreable.length * 100)
          : 0,
        itemCount: sItems.length,
        passCount: sPass,
        failCount: sFail,
        advisoryCount: sAdvisory,
        outOfScopeCount: sOOS,
        hasBlockingFailure: sItems.some(it => it.blockingIfFailed && it.status === 'fail'),
      };
    }
  );

  return {
    projectId: input.projectId,
    evaluationTimestamp: timestamp,
    codeEdition: input.codeEdition,
    province: input.province,
    jurisdictionSource: input.jurisdictionSource,
    items,
    totalItems: items.length,
    passCount,
    failCount,
    advisoryCount,
    manualCount,
    outOfScopeCount,
    notEvaluatedCount,
    permitReadinessScore,
    permitReadinessLabel,
    hasBlockingFailures,
    blockingItems,
    sectionScores,
  };
}
