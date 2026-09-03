/**
 * Washroom Count Calculator
 * NBC 3.7.2.2 — Minimum Plumbing Fixture Requirements
 *
 * Determines minimum water closets and lavatories required based on
 * occupancy group and occupant load.
 *
 * DETERMINISTIC ONLY — no LLM calls, no external dependencies.
 *
 * Source: NBC 2020 Article 3.7.2.2, Tables 3.7.2.2.-A / -B / -C.
 * Confirmed identical in NBC(AE) 2023, BCBC 2024, and NBC 2025.
 * Drinking fountains are not mandated by NBC 3.7.2.2; accessibility
 * provisions are handled by barrierFreeCalculator (NBC 3.8).
 */

export interface WashroomInput {
  occupancyGroup: string;        // 'A1'|'A2'|'A3'|'A4'|'B1'|'B2'|'B3'|'C'|'D'|'E'|'F1'|'F2'|'F3'
  occupantLoad: number;          // total persons for this occupancy
  sprinklered: boolean;          // reserved — no effect on fixture counts in NBC 3.7.2.2
  province: string;              // 'AB'|'BC'|'ON' etc — reserved for future overrides
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export interface FixtureRequirement {
  waterClosetsMale: number;
  waterClosetsFemale: number;
  lavatories: number;
  // Accessibility fixtures (NBC 3.8.3.8) — flagged but not calculated here;
  // barrierFreeCalculator adds accessible stall counts
  accessibleStallsRequired: boolean;
}

export interface WashroomResult {
  // Inputs echoed back for audit trail
  occupancyGroup: string;
  occupantLoad: number;

  // Calculated outputs
  required: FixtureRequirement;

  // Full rule traceability
  ruleId: string;               // 'WC-3.7.2.2-{province}'
  nbcRef: string;               // varies by occupancy group
  codeEdition: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  evaluationTimestamp: string;  // ISO 8601

  // Confidence model
  confidence: 'confirmed' | 'inferred' | 'advisory';
  // confirmed  = occupant load from calibrated drawing measurement
  // inferred   = occupant load from area estimate
  // advisory   = occupant load from default factors only

  assumptions: string[];
  severity: 'pass' | 'fail' | 'info';
}

// ─── NBC Table 3.7.2.2.-A — Assembly (Groups A1–A4) ─────────────────────────
// Separate male/female WC counts indexed by total occupant load.
// Source: NBC 2020 Table 3.7.2.2.-A

interface AssemblyRow {
  maxOccupants: number;
  wcMale: number;
  wcFemale: number;
}

const GROUP_A_FIXTURES: AssemblyRow[] = [
  { maxOccupants: 25,  wcMale: 1, wcFemale: 1  },
  { maxOccupants: 50,  wcMale: 1, wcFemale: 2  },
  { maxOccupants: 75,  wcMale: 2, wcFemale: 3  },
  { maxOccupants: 100, wcMale: 2, wcFemale: 4  },
  { maxOccupants: 125, wcMale: 3, wcFemale: 5  },
  { maxOccupants: 150, wcMale: 3, wcFemale: 6  },
  { maxOccupants: 175, wcMale: 4, wcFemale: 7  },
  { maxOccupants: 200, wcMale: 4, wcFemale: 8  },
  { maxOccupants: 250, wcMale: 5, wcFemale: 9  },
  { maxOccupants: 300, wcMale: 5, wcFemale: 10 },
  { maxOccupants: 350, wcMale: 6, wcFemale: 11 },
  { maxOccupants: 400, wcMale: 6, wcFemale: 12 },
  // Over 400: handled procedurally — 7+1/200 males, 13+1/100 females (50/50 split)
];

function assemblyWC(occupantLoad: number): { wcMale: number; wcFemale: number } {
  for (const row of GROUP_A_FIXTURES) {
    if (occupantLoad <= row.maxOccupants) {
      return { wcMale: row.wcMale, wcFemale: row.wcFemale };
    }
  }
  // Over 400: assume 50/50 sex split for excess
  const excessPerSex = (occupantLoad - 400) / 2;
  return {
    wcMale:   7  + Math.ceil(excessPerSex / 200),
    wcFemale: 13 + Math.ceil(excessPerSex / 100),
  };
}

// ─── NBC Table 3.7.2.2.-B — Business/Personal Services (Group D) ────────────
// Per-sex tier table. Persons per sex = ceil(occupantLoad / 2).
// Source: NBC 2020 Table 3.7.2.2.-B

interface PerSexRow {
  maxPerSex: number;
  wc: number;
}

const GROUP_D_FIXTURES: PerSexRow[] = [
  { maxPerSex: 25, wc: 1 },
  { maxPerSex: 50, wc: 2 },
  // Over 50 per sex: 3 + 1 per additional 50 persons per sex
];

function businessWC(perSex: number): number {
  for (const row of GROUP_D_FIXTURES) {
    if (perSex <= row.maxPerSex) return row.wc;
  }
  return 3 + Math.ceil((perSex - 50) / 50);
}

// ─── NBC 3.7.2.2.(11) — Mercantile (Group E) ────────────────────────────────
// Ratio-based: 1 WC per 300 males, 1 WC per 150 females. 50/50 split assumed.

function mercantileWC(occupantLoad: number): { wcMale: number; wcFemale: number } {
  const perSex = occupantLoad / 2;
  return {
    wcMale:   Math.max(1, Math.ceil(perSex / 300)),
    wcFemale: Math.max(1, Math.ceil(perSex / 150)),
  };
}

// ─── NBC Table 3.7.2.2.-C — Industrial (Groups F1–F3) ───────────────────────
// Per-sex tier table. Persons per sex = ceil(occupantLoad / 2).
// Source: NBC 2020 Table 3.7.2.2.-C

const GROUP_F_FIXTURES: PerSexRow[] = [
  { maxPerSex: 10,  wc: 1 },
  { maxPerSex: 25,  wc: 2 },
  { maxPerSex: 50,  wc: 3 },
  { maxPerSex: 75,  wc: 4 },
  { maxPerSex: 100, wc: 5 },
  // Over 100 per sex: 6 + 1 per additional 30 persons per sex
];

function industrialWC(perSex: number): number {
  for (const row of GROUP_F_FIXTURES) {
    if (perSex <= row.maxPerSex) return row.wc;
  }
  return 6 + Math.ceil((perSex - 100) / 30);
}

// ─── Group B (Institutional) — original thresholds preserved ────────────────
// NBC 3.7.2.2 does not publish a standalone table for Group B;
// these tiers are a best-effort approximation pending primary-source verification.

interface TotalLoadRow {
  maxOccupants: number;
  wcPerSex: number;
}

const GROUP_B_FIXTURES: TotalLoadRow[] = [
  { maxOccupants: 10,       wcPerSex: 1 },
  { maxOccupants: 25,       wcPerSex: 2 },
  { maxOccupants: 50,       wcPerSex: 3 },
  { maxOccupants: Infinity, wcPerSex: 4 },
];

function institutionalWC(occupantLoad: number): number {
  for (const row of GROUP_B_FIXTURES) {
    if (occupantLoad <= row.maxOccupants) return row.wcPerSex;
  }
  return GROUP_B_FIXTURES[GROUP_B_FIXTURES.length - 1].wcPerSex;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function calculateWashroomRequirements(
  input: WashroomInput
): WashroomResult {
  const timestamp = new Date().toISOString();
  const assumptions: string[] = [
    'Occupant load assumed equal male/female split for water closet calculation',
  ];

  const codeEdition = input.province === 'AB' ? 'NBC(AE) 2023'
                    : input.province === 'BC' ? 'BCBC 2024'
                    : 'NBC 2020';

  // Residential — NBC 3.7.2.2.(1)(c): at least 1 WC + 1 lav per dwelling unit.
  // Flat minimum, not scaled by occupant load.
  if (input.occupancyGroup === 'C') {
    assumptions.push('Residential: at least 1 water closet and 1 lavatory per dwelling unit (NBC 3.7.2.2.(1)(c)) - flat minimum, not occupant-load-scaled');
    return {
      occupancyGroup: input.occupancyGroup,
      occupantLoad:   input.occupantLoad,
      required: {
        waterClosetsMale:        1,
        waterClosetsFemale:      1,
        lavatories:              1,
        accessibleStallsRequired: input.occupantLoad > 1,
      },
      ruleId:              `WC-3.7.2.2-${input.province}`,
      nbcRef:              'NBC 2020 Article 3.7.2.2.(1)(c)',
      codeEdition,
      jurisdictionSource:  input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence:          'confirmed',
      assumptions,
      severity:            'pass',
    };
  }

  const grp = input.occupancyGroup;
  let wcMale:   number;
  let wcFemale: number;
  let nbcRef:   string;

  if (grp === 'A1' || grp === 'A2' || grp === 'A3' || grp === 'A4') {
    const counts = assemblyWC(input.occupantLoad);
    wcMale   = counts.wcMale;
    wcFemale = counts.wcFemale;
    nbcRef   = 'NBC 2020 Table 3.7.2.2.-A';

  } else if (grp === 'B1' || grp === 'B2' || grp === 'B3') {
    const wc = institutionalWC(input.occupantLoad);
    wcMale   = wc;
    wcFemale = wc;
    nbcRef   = 'NBC 2020 Article 3.7.2.2 (Group B — advisory; verify against occupancy-specific provisions)';
    assumptions.push('Group B institutional: approximate tiers applied — primary-source table not yet verified');

  } else if (grp === 'D') {
    const perSex = Math.ceil(input.occupantLoad / 2);
    const wc = businessWC(perSex);
    wcMale   = wc;
    wcFemale = wc;
    nbcRef   = 'NBC 2020 Table 3.7.2.2.-B';

  } else if (grp === 'E') {
    const counts = mercantileWC(input.occupantLoad);
    wcMale   = counts.wcMale;
    wcFemale = counts.wcFemale;
    nbcRef   = 'NBC 2020 Article 3.7.2.2.(11)';

  } else if (grp === 'F1' || grp === 'F2' || grp === 'F3') {
    const perSex = Math.ceil(input.occupantLoad / 2);
    const wc = industrialWC(perSex);
    wcMale   = wc;
    wcFemale = wc;
    nbcRef   = 'NBC 2020 Table 3.7.2.2.-C';

  } else {
    return {
      occupancyGroup: input.occupancyGroup,
      occupantLoad:   input.occupantLoad,
      required: {
        waterClosetsMale:        0,
        waterClosetsFemale:      0,
        lavatories:              0,
        accessibleStallsRequired: false,
      },
      ruleId:              `WC-3.7.2.2-UNKNOWN`,
      nbcRef:              'NBC 2020 Article 3.7.2.2',
      codeEdition,
      jurisdictionSource:  input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence:          'advisory',
      assumptions:         ['Occupancy group not recognized — manual verification required'],
      severity:            'info',
    };
  }

  // NBC 3.7.2.3.(1): lavatories = ceil((wcMale + wcFemale) / 2)
  const lavatories = Math.ceil((wcMale + wcFemale) / 2);

  return {
    occupancyGroup: input.occupancyGroup,
    occupantLoad:   input.occupantLoad,
    required: {
      waterClosetsMale:        wcMale,
      waterClosetsFemale:      wcFemale,
      lavatories,
      accessibleStallsRequired: input.occupantLoad >= 6,
    },
    ruleId:              `WC-3.7.2.2-${input.province}`,
    nbcRef,
    codeEdition,
    jurisdictionSource:  input.jurisdictionSource,
    evaluationTimestamp: timestamp,
    confidence:          'confirmed',
    assumptions,
    severity:            'pass',
  };
}
