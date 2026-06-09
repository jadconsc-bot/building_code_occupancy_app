/**
 * Barrier-Free Requirements Calculator
 * NBC 2020 Part 3.8 — Barrier-Free Design
 *
 * Determines barrier-free requirements based on:
 *   - Occupancy group
 *   - Building storeys
 *   - Total occupant load
 *   - Presence of accessible washrooms (from H1 washroomCounts)
 *   - Residential unit count (Group C)
 *
 * DETERMINISTIC ONLY — no LLM calls, no external dependencies.
 *
 * Sources:
 *   NBC 2020 3.8.1   — Application
 *   NBC 2020 3.8.2   — Path of Travel
 *   NBC 2020 3.8.3   — Facilities
 *   NBC 2020 3.8.3.3 — Accessible dwelling units (Group C)
 *   NBC 2020 3.8.3.4 — Ramps
 *   NBC 2020 3.8.3.8 — Washroom requirements
 */

import type { WashroomResult } from './washroomCalculator';

export interface BarrierFreeInput {
  occupancyGroups: string[];
  storeys: number;
  totalOccupants: number;
  totalAreaM2: number;
  washroomCounts: WashroomResult[];
  totalDwellingUnits?: number;
  province: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export interface BarrierFreeRequirement {
  requirementId: string;
  description: string;
  nbcRef: string;
  required: boolean;
  value: string | null;
  actual: string | null;
  status: 'pass' | 'fail' | 'advisory' | 'not_applicable';
  severity: 'high' | 'medium' | 'low';
  recommendation: string | null;
}

export interface BarrierFreeResult {
  occupancyGroups: string[];
  storeys: number;
  isBarrierFreeRequired: boolean;
  requirementCount: number;
  passCount: number;
  failCount: number;
  advisoryCount: number;
  requirements: BarrierFreeRequirement[];
  accessiblePathRequired: boolean;
  accessibleWashroomRequired: boolean;
  accessibleWashroomProvided: boolean;
  elevatorRequired: boolean;
  accessibleUnitsRequired: number | null;
  accessibleUnitsMinPercent: number | null;
  ruleId: string;
  nbcRef: string;
  codeEdition: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  evaluationTimestamp: string;
  confidence: 'confirmed' | 'inferred' | 'advisory';
  assumptions: string[];
}

const ELEVATOR_REQUIRED_GROUPS = new Set(['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'D', 'E']);
const MIN_PATH_WIDTH_MM = 1500;
const MIN_DOOR_WIDTH_MM = 850;
const MIN_TURNING_RADIUS_MM = 1500;
const ACCESSIBLE_UNIT_PERCENT = 0.15;

export function calculateBarrierFreeRequirements(
  input: BarrierFreeInput
): BarrierFreeResult {
  const timestamp = new Date().toISOString();
  const assumptions: string[] = [];
  const requirements: BarrierFreeRequirement[] = [];

  const codeEdition = input.province === 'AB' ? 'NBC(AE) 2023'
                    : input.province === 'BC' ? 'BCBC 2024'
                    : 'NBC 2020';

  const normalizedGroups = input.occupancyGroups.map(g =>
    g.replace('-', '').toUpperCase()
  );

  // Exemption: single/semi-detached/duplex ≤2 storeys ≤2 units
  const isResidentialOnly = normalizedGroups.every(g => g === 'C');
  const isSmallResidential = isResidentialOnly &&
    input.storeys <= 2 &&
    (input.totalDwellingUnits ?? 999) <= 2;

  if (isSmallResidential) {
    assumptions.push(
      'Single/semi-detached/duplex dwelling ≤2 storeys — exempt from NBC Part 3.8 (NBC 3.8.1.1)'
    );
    return {
      occupancyGroups: input.occupancyGroups,
      storeys: input.storeys,
      isBarrierFreeRequired: false,
      requirementCount: 0,
      passCount: 0,
      failCount: 0,
      advisoryCount: 0,
      requirements: [],
      accessiblePathRequired: false,
      accessibleWashroomRequired: false,
      accessibleWashroomProvided: false,
      elevatorRequired: false,
      accessibleUnitsRequired: null,
      accessibleUnitsMinPercent: null,
      ruleId: 'BF-EXEMPT-3.8.1.1',
      nbcRef: 'NBC 2020 Article 3.8.1.1',
      codeEdition,
      jurisdictionSource: input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence: 'confirmed',
      assumptions,
    };
  }

  // REQ 1 — Accessible path of travel (NBC 3.8.2.1)
  requirements.push({
    requirementId: 'BF-PATH-3.8.2.1',
    description: 'Accessible path of travel from building entrance to all accessible spaces',
    nbcRef: 'NBC 2020 Article 3.8.2.1',
    required: true,
    value: `Min. ${MIN_PATH_WIDTH_MM} mm clear width`,
    actual: null,
    status: 'advisory',
    severity: 'high',
    recommendation: `Provide unobstructed ${MIN_PATH_WIDTH_MM} mm min. barrier-free path from accessible parking to all floors — verify on floor plans`,
  });

  // REQ 2 — Accessible entrance (NBC 3.8.2.2)
  requirements.push({
    requirementId: 'BF-ENT-3.8.2.2',
    description: 'At least one accessible building entrance',
    nbcRef: 'NBC 2020 Article 3.8.2.2',
    required: true,
    value: `Min. ${MIN_DOOR_WIDTH_MM} mm clear door width, level landing`,
    actual: null,
    status: 'advisory',
    severity: 'high',
    recommendation: `Designate and label one accessible entrance with ${MIN_DOOR_WIDTH_MM} mm min. clear width, automatic door opener if > 500 occupants`,
  });

  // REQ 3 — Door clear widths (NBC 3.8.3.2)
  requirements.push({
    requirementId: 'BF-DOOR-3.8.3.2',
    description: 'Accessible door clear width on barrier-free path',
    nbcRef: 'NBC 2020 Article 3.8.3.2',
    required: true,
    value: `${MIN_DOOR_WIDTH_MM} mm clear`,
    actual: null,
    status: 'advisory',
    severity: 'high',
    recommendation: `All doors on accessible path: min. ${MIN_DOOR_WIDTH_MM} mm clear width, lever handles, 300 mm clearance on latch side`,
  });

  // REQ 4 — Turning radius (NBC 3.8.3.3)
  requirements.push({
    requirementId: 'BF-TURN-3.8.3.3',
    description: 'Turning radius clearances at decision points on accessible path',
    nbcRef: 'NBC 2020 Article 3.8.3.3',
    required: true,
    value: `${MIN_TURNING_RADIUS_MM} mm diameter turning circle`,
    actual: null,
    status: 'advisory',
    severity: 'medium',
    recommendation: `Show ${MIN_TURNING_RADIUS_MM} mm turning circle at corridor intersections, elevator lobbies, and washroom entries`,
  });

  // REQ 5 — Ramp (NBC 3.8.3.4)
  requirements.push({
    requirementId: 'BF-RAMP-3.8.3.4',
    description: 'Ramps required where accessible path has level changes > 13 mm',
    nbcRef: 'NBC 2020 Article 3.8.3.4',
    required: true,
    value: 'Max slope 1:12, min width 870 mm, handrails both sides',
    actual: null,
    status: 'advisory',
    severity: 'medium',
    recommendation: 'Show ramp design: max 1:12 slope, 870 mm min. clear width, level landings every 9 m, handrails both sides',
  });

  // REQ 6 — Accessible washroom (NBC 3.8.3.8)
  const accessibleWashroomRequired = input.washroomCounts.some(
    wc => wc.required.accessibleStallsRequired
  );

  if (accessibleWashroomRequired) {
    requirements.push({
      requirementId: 'BF-WC-3.8.3.8',
      description: 'Accessible washroom stall required',
      nbcRef: 'NBC 2020 Article 3.8.3.8',
      required: true,
      value: 'Min. 1 accessible stall with 1500 mm turning circle, grab bars, raised seat',
      actual: 'Required — verify stall dimensions on drawings',
      status: 'advisory',
      severity: 'high',
      recommendation: 'Provide accessible washroom stall: 1500 mm turning circle, 900 mm × 1500 mm stall, grab bars NBC 3.8.3.11, raised seat 430–480 mm',
    });
  }

  // REQ 7 — Elevator (NBC 3.8.2.1)
  const hasPublicOccupancy = normalizedGroups.some(g =>
    ELEVATOR_REQUIRED_GROUPS.has(g)
  );
  const elevatorRequired = hasPublicOccupancy && input.storeys > 3;

  requirements.push({
    requirementId: 'BF-ELEV-3.8.2.1',
    description: elevatorRequired
      ? 'Elevator required — building > 3 storeys with public occupancy'
      : 'Elevator not required for this building height and occupancy',
    nbcRef: 'NBC 2020 Article 3.8.2.1',
    required: elevatorRequired,
    value: elevatorRequired ? 'Elevator or lift required on accessible path' : null,
    actual: elevatorRequired ? null : 'Not required',
    status: elevatorRequired ? 'advisory' : 'pass',
    severity: 'high',
    recommendation: elevatorRequired
      ? 'Provide elevator or accessible lift serving all floors — min. 1100 mm × 1400 mm cab (NBC 3.8.3.6)'
      : null,
  });

  // REQ 8 — Accessible parking (NBC 3.8.2.5)
  const parkingStallsRequired = input.totalOccupants > 0
    ? Math.max(1,
        Math.ceil(Math.min(input.totalOccupants, 100) / 25) +
        Math.max(0, Math.ceil((input.totalOccupants - 100) / 50))
      )
    : 1;

  requirements.push({
    requirementId: 'BF-PARK-3.8.2.5',
    description: 'Accessible parking stalls on site',
    nbcRef: 'NBC 2020 Article 3.8.2.5',
    required: true,
    value: `${parkingStallsRequired} accessible stall(s) min.`,
    actual: null,
    status: 'advisory',
    severity: 'medium',
    recommendation: `Provide ${parkingStallsRequired} accessible parking stall(s) — min. 2400 mm wide + 1500 mm access aisle, signed, near accessible entrance`,
  });

  // REQ 9 — Accessible dwelling units (NBC 3.8.3.3) — Group C only
  let accessibleUnitsRequired: number | null = null;
  let accessibleUnitsMinPercent: number | null = null;

  if (normalizedGroups.includes('C') && input.totalDwellingUnits) {
    accessibleUnitsMinPercent = ACCESSIBLE_UNIT_PERCENT;
    accessibleUnitsRequired = Math.max(1,
      Math.ceil(input.totalDwellingUnits * ACCESSIBLE_UNIT_PERCENT)
    );
    requirements.push({
      requirementId: 'BF-UNIT-3.8.3.3',
      description: `Accessible dwelling units — minimum ${Math.round(ACCESSIBLE_UNIT_PERCENT * 100)}% of total units`,
      nbcRef: 'NBC 2020 Article 3.8.3.3',
      required: true,
      value: `${accessibleUnitsRequired} unit(s) of ${input.totalDwellingUnits} (${Math.round(ACCESSIBLE_UNIT_PERCENT * 100)}% min.)`,
      actual: null,
      status: 'advisory',
      severity: 'high',
      recommendation: `Designate ${accessibleUnitsRequired} unit(s) as accessible: 850 mm door widths, 1500 mm turning circles, accessible washroom, no stairs to entrance`,
    });
    assumptions.push(
      `Group C: ${input.totalDwellingUnits} dwelling units — ${accessibleUnitsRequired} must be accessible (NBC 3.8.3.3)`
    );
  }

  // REQ 10 — Signage (NBC 3.8.3.12)
  requirements.push({
    requirementId: 'BF-SIGN-3.8.3.12',
    description: 'Accessible facility signage at all accessible entrances and amenities',
    nbcRef: 'NBC 2020 Article 3.8.3.12',
    required: true,
    value: 'ISA symbol at all accessible entrances, washrooms, parking',
    actual: null,
    status: 'advisory',
    severity: 'low',
    recommendation: 'Show ISA (International Symbol of Accessibility) signage on drawings at all accessible facilities',
  });

  const passCount = requirements.filter(r => r.status === 'pass').length;
  const failCount = requirements.filter(r => r.status === 'fail').length;
  const advisoryCount = requirements.filter(r => r.status === 'advisory').length;

  return {
    occupancyGroups: input.occupancyGroups,
    storeys: input.storeys,
    isBarrierFreeRequired: true,
    requirementCount: requirements.length,
    passCount,
    failCount,
    advisoryCount,
    requirements,
    accessiblePathRequired: true,
    accessibleWashroomRequired,
    accessibleWashroomProvided: accessibleWashroomRequired,
    elevatorRequired,
    accessibleUnitsRequired,
    accessibleUnitsMinPercent,
    ruleId: 'BF-3.8',
    nbcRef: 'NBC 2020 Part 3.8',
    codeEdition,
    jurisdictionSource: input.jurisdictionSource,
    evaluationTimestamp: timestamp,
    confidence: 'advisory',
    assumptions,
  };
}
