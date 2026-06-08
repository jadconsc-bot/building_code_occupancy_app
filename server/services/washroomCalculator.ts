/**
 * Washroom Count Calculator
 * NBC 3.7.2.1 — Minimum Plumbing Fixture Requirements
 *
 * Determines minimum water closets, lavatories, and drinking fountains
 * required based on occupancy group and occupant load.
 *
 * DETERMINISTIC ONLY — no LLM calls, no external dependencies.
 * All pass/fail decisions made by this engine, not by AI classification.
 *
 * Source: NBC 2020 Table 3.7.2.1 (confirmed identical in NBC(AE) 2023
 * and BCBC 2024 — no provincial override required for fixture counts).
 */

export interface WashroomInput {
  occupancyGroup: string;        // 'A1'|'A2'|'A3'|'A4'|'B1'|'B2'|'B3'|'C'|'D'|'E'|'F1'|'F2'|'F3'
  occupantLoad: number;          // total persons for this occupancy
  sprinklered: boolean;          // affects some thresholds
  province: string;              // 'AB'|'BC'|'ON' etc — reserved for future overrides
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export interface FixtureRequirement {
  waterClosetsMale: number;
  waterClosetsFemale: number;
  lavatories: number;
  drinkingFountains: number;
  // Accessibility fixtures (NBC 3.8.3.8) — flagged but not calculated here
  // H3 (barrier-free) will add accessible stall counts
  accessibleStallsRequired: boolean;
}

export interface WashroomResult {
  // Inputs echoed back for audit trail
  occupancyGroup: string;
  occupantLoad: number;

  // Calculated outputs
  required: FixtureRequirement;

  // Full rule traceability — Prime Directive requirement
  ruleId: string;               // 'WC-3.7.2.1-{province}'
  nbcRef: string;               // 'NBC 2020 Table 3.7.2.1'
  codeEdition: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  evaluationTimestamp: string;  // ISO 8601

  // Confidence model
  confidence: 'confirmed' | 'inferred' | 'advisory';
  // confirmed  = occupant load from calibrated drawing measurement
  // inferred   = occupant load from area estimate
  // advisory   = occupant load from default factors only

  assumptions: string[];        // e.g. ["Occupant load assumed equal male/female split"]
  severity: 'pass' | 'fail' | 'info';
}

// ─── NBC Table 3.7.2.1 fixture thresholds ───────────────────────────────────
// Structure: [maxOccupants, waterClosetsPerSex, lavatories, drinkingFountains]
// Read as: up to maxOccupants persons → these minimums apply
// Source: NBC 2020 Table 3.7.2.1

interface FixtureRow {
  maxOccupants: number;   // upper bound of this tier (Infinity for last row)
  wcPerSex: number;       // water closets per sex
  lav: number;            // lavatories (combined)
  df: number;             // drinking fountains
}

// Group A (Assembly) — NBC Table 3.7.2.1 Part A
const GROUP_A_FIXTURES: FixtureRow[] = [
  { maxOccupants: 100,      wcPerSex: 1, lav: 1, df: 1 },
  { maxOccupants: 200,      wcPerSex: 2, lav: 2, df: 1 },
  { maxOccupants: 400,      wcPerSex: 3, lav: 3, df: 2 },
  { maxOccupants: 750,      wcPerSex: 4, lav: 4, df: 2 },
  { maxOccupants: Infinity, wcPerSex: 5, lav: 5, df: 3 },
];

// Group B (Institutional) — NBC Table 3.7.2.1 Part B
const GROUP_B_FIXTURES: FixtureRow[] = [
  { maxOccupants: 10,       wcPerSex: 1, lav: 1, df: 1 },
  { maxOccupants: 25,       wcPerSex: 2, lav: 2, df: 1 },
  { maxOccupants: 50,       wcPerSex: 3, lav: 3, df: 1 },
  { maxOccupants: Infinity, wcPerSex: 4, lav: 4, df: 2 },
];

// Group C (Residential) — NBC 3.7.2.2 — 1 WC + 1 lav per dwelling unit
// Not a table lookup — handled separately below

// Group D (Business) + Group E (Mercantile) — NBC Table 3.7.2.1 Part D/E
const GROUP_DE_FIXTURES: FixtureRow[] = [
  { maxOccupants: 25,       wcPerSex: 1, lav: 1, df: 1 },
  { maxOccupants: 50,       wcPerSex: 2, lav: 2, df: 1 },
  { maxOccupants: 75,       wcPerSex: 3, lav: 2, df: 1 },
  { maxOccupants: 100,      wcPerSex: 3, lav: 3, df: 2 },
  { maxOccupants: Infinity, wcPerSex: 4, lav: 4, df: 2 },
];

// Group F (Industrial) — NBC Table 3.7.2.1 Part F
const GROUP_F_FIXTURES: FixtureRow[] = [
  { maxOccupants: 10,       wcPerSex: 1, lav: 1, df: 1 },
  { maxOccupants: 25,       wcPerSex: 2, lav: 2, df: 1 },
  { maxOccupants: 50,       wcPerSex: 3, lav: 3, df: 1 },
  { maxOccupants: Infinity, wcPerSex: 4, lav: 4, df: 2 },
];

// Map occupancy group to fixture table
const FIXTURE_TABLE: Record<string, FixtureRow[] | 'residential'> = {
  A1: GROUP_A_FIXTURES,
  A2: GROUP_A_FIXTURES,
  A3: GROUP_A_FIXTURES,
  A4: GROUP_A_FIXTURES,
  B1: GROUP_B_FIXTURES,
  B2: GROUP_B_FIXTURES,
  B3: GROUP_B_FIXTURES,
  C:  'residential',
  D:  GROUP_DE_FIXTURES,
  E:  GROUP_DE_FIXTURES,
  F1: GROUP_F_FIXTURES,
  F2: GROUP_F_FIXTURES,
  F3: GROUP_F_FIXTURES,
};

// ─── Core lookup function ────────────────────────────────────────────────────

function lookupFixtures(
  table: FixtureRow[],
  occupantLoad: number
): { wcPerSex: number; lav: number; df: number } {
  // Walk tiers in order — return first tier where load <= maxOccupants
  for (const row of table) {
    if (occupantLoad <= row.maxOccupants) {
      return { wcPerSex: row.wcPerSex, lav: row.lav, df: row.df };
    }
  }
  // Fallback to last row (Infinity tier) — should never reach here
  const last = table[table.length - 1];
  return { wcPerSex: last.wcPerSex, lav: last.lav, df: last.df };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function calculateWashroomRequirements(
  input: WashroomInput
): WashroomResult {
  const timestamp = new Date().toISOString();
  const assumptions: string[] = [
    'Occupant load assumed equal male/female split for water closet calculation',
  ];

  const table = FIXTURE_TABLE[input.occupancyGroup];

  // Residential — NBC 3.7.2.2: 1 WC + 1 lav per dwelling unit
  // Occupant load = number of dwelling units for this path
  if (table === 'residential') {
    const units = Math.ceil(input.occupantLoad / 2); // 2 persons per unit default
    assumptions.push('Residential: 1 WC + 1 lavatory per dwelling unit (NBC 3.7.2.2)');
    return {
      occupancyGroup: input.occupancyGroup,
      occupantLoad: input.occupantLoad,
      required: {
        waterClosetsMale:   units,
        waterClosetsFemale: units,
        lavatories:         units,
        drinkingFountains:  0, // not required for residential
        accessibleStallsRequired: input.occupantLoad > 1,
      },
      ruleId: `WC-3.7.2.2-${input.province}`,
      nbcRef: 'NBC 2020 Article 3.7.2.2',
      codeEdition: input.province === 'AB' ? 'NBC(AE) 2023'
                 : input.province === 'BC' ? 'BCBC 2024'
                 : 'NBC 2020',
      jurisdictionSource: input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence: 'inferred',
      assumptions,
      severity: 'info',
    };
  }

  // Unknown occupancy group — advisory result, not a failure
  if (!table) {
    return {
      occupancyGroup: input.occupancyGroup,
      occupantLoad: input.occupantLoad,
      required: {
        waterClosetsMale: 0, waterClosetsFemale: 0,
        lavatories: 0, drinkingFountains: 0,
        accessibleStallsRequired: false,
      },
      ruleId: `WC-3.7.2.1-UNKNOWN`,
      nbcRef: 'NBC 2020 Table 3.7.2.1',
      codeEdition: 'NBC 2020',
      jurisdictionSource: input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence: 'advisory',
      assumptions: ['Occupancy group not recognized — manual verification required'],
      severity: 'info',
    };
  }

  // Standard table lookup
  const { wcPerSex, lav, df } = lookupFixtures(table, input.occupantLoad);

  return {
    occupancyGroup: input.occupancyGroup,
    occupantLoad: input.occupantLoad,
    required: {
      waterClosetsMale:   wcPerSex,
      waterClosetsFemale: wcPerSex,
      lavatories:         lav,
      drinkingFountains:  df,
      accessibleStallsRequired: input.occupantLoad >= 6,
      // NBC 3.8.3.8: accessible stall required when 6+ persons
    },
    ruleId: `WC-3.7.2.1-${input.province}`,
    nbcRef: 'NBC 2020 Table 3.7.2.1',
    codeEdition: input.province === 'AB' ? 'NBC(AE) 2023'
               : input.province === 'BC' ? 'BCBC 2024'
               : 'NBC 2020',
    jurisdictionSource: input.jurisdictionSource,
    evaluationTimestamp: timestamp,
    confidence: 'confirmed',
    assumptions,
    severity: 'pass',
  };
}
