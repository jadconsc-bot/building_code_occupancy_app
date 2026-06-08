/**
 * Construction Type Determination Engine
 * NBC 2020 Table 3.2.2.20 — Limiting Height and Area
 *
 * Determines whether Non-Combustible construction is required based on:
 *   - Occupancy group
 *   - Number of storeys
 *   - Sprinkler status
 *   - Total gross floor area (m²)
 *
 * DETERMINISTIC ONLY — no LLM calls, no external dependencies.
 * Output conforms to the existing compliance engine contract:
 *   'Non-Combustible' | 'Combustible'
 *
 * Source: NBC 2020 Table 3.2.2.20 (confirmed identical in
 * NBC(AE) 2023 and BCBC 2024 for Part 3 buildings).
 *
 * IMPORTANT: This engine covers Part 3 buildings only.
 * Part 9 buildings (≤3 storeys, ≤600m²) are always permitted
 * to use combustible construction — see NBC 9.10.1.
 */

export interface ConstructionTypeInput {
  occupancyGroup: string;   // 'A1'|'A2'|...|'F3' (unhyphenated)
  storeys: number;
  sprinklered: boolean;
  totalAreaM2: number;      // sum of all room areas for this occupancy
  province: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export interface ConstructionTypeResult {
  // Engine contract value — feeds directly into complianceEngine inputs
  constructionType: 'Non-Combustible' | 'Combustible';

  // Whether Non-Combustible is mandatory or just the recommendation
  required: boolean;

  // Limiting values from the table that triggered this decision
  limitingStoreys: number;      // max storeys permitted for Combustible
  limitingAreaM2: number;       // max area permitted for Combustible

  // Actual values that were evaluated
  actualStoreys: number;
  actualAreaM2: number;

  // Margin information for professional review
  storeyMargin: number;         // positive = headroom, negative = exceeded
  areaMarginM2: number;         // positive = headroom, negative = exceeded
  areaMarginPercent: number;

  // Full rule traceability — Prime Directive requirement
  ruleId: string;               // 'CT-3.2.2.20-{province}'
  nbcRef: string;               // 'NBC 2020 Table 3.2.2.20'
  codeEdition: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  evaluationTimestamp: string;

  // Confidence model
  confidence: 'confirmed' | 'inferred' | 'advisory';
  severity: 'pass' | 'fail' | 'conditional' | 'info';

  // Human-readable reasoning for audit trail
  reasoning: string;
  assumptions: string[];
  recommendations: string[];

  // Echoed back from input for audit trail and UI display
  occupancyGroup: string;
}

// ─── NBC Table 3.2.2.20 limiting heights and areas ──────────────────────────
//
// Structure per occupancy group:
//   combustiblePermitted: true  → Combustible allowed up to these limits
//   maxStoreysCombustible       → max building height in storeys
//   maxAreaCombustibleM2        → max gross area per storey (m²)
//   sprinklerExemptionStoreys   → extra storeys permitted when sprinklered
//   sprinklerExemptionAreaM2    → extra area permitted when sprinklered
//
// When building exceeds limits → Non-Combustible required.
// When combustiblePermitted: false → Non-Combustible always required.
//
// Source: NBC 2020 Table 3.2.2.20
// Note: Area limits are per-storey, not total building area.
// Note: Group B-1 (detention) always requires Non-Combustible.

interface ConstructionLimits {
  combustiblePermitted: boolean;
  maxStoreysCombustible: number;       // Infinity if no storey limit
  maxAreaCombustibleM2: number;        // Infinity if no area limit
  sprinklerBonusStoreys: number;       // additional storeys when sprinklered
  sprinklerBonusAreaM2: number;        // additional area when sprinklered
}

// NBC Table 3.2.2.20 — keyed by unhyphenated occupancy group
const CONSTRUCTION_LIMITS: Record<string, ConstructionLimits> = {
  // Group A — Assembly
  // A1/A2: Non-Combustible required above 3 storeys or 2 200 m²
  A1: { combustiblePermitted: true,  maxStoreysCombustible: 3, maxAreaCombustibleM2: 2200,  sprinklerBonusStoreys: 1, sprinklerBonusAreaM2: 1100 },
  A2: { combustiblePermitted: true,  maxStoreysCombustible: 3, maxAreaCombustibleM2: 2200,  sprinklerBonusStoreys: 1, sprinklerBonusAreaM2: 1100 },
  A3: { combustiblePermitted: true,  maxStoreysCombustible: 3, maxAreaCombustibleM2: 2200,  sprinklerBonusStoreys: 1, sprinklerBonusAreaM2: 1100 },
  A4: { combustiblePermitted: true,  maxStoreysCombustible: 1, maxAreaCombustibleM2: 2200,  sprinklerBonusStoreys: 1, sprinklerBonusAreaM2: 1100 },

  // Group B — Institutional
  // B1 (detention): always Non-Combustible
  B1: { combustiblePermitted: false, maxStoreysCombustible: 0, maxAreaCombustibleM2: 0,     sprinklerBonusStoreys: 0, sprinklerBonusAreaM2: 0 },
  // B2/B3: Non-Combustible above 3 storeys
  B2: { combustiblePermitted: true,  maxStoreysCombustible: 3, maxAreaCombustibleM2: 2200,  sprinklerBonusStoreys: 1, sprinklerBonusAreaM2: 1100 },
  B3: { combustiblePermitted: true,  maxStoreysCombustible: 3, maxAreaCombustibleM2: 2200,  sprinklerBonusStoreys: 1, sprinklerBonusAreaM2: 1100 },

  // Group C — Residential
  // Combustible permitted up to 4 storeys (6 when sprinklered)
  C:  { combustiblePermitted: true,  maxStoreysCombustible: 4, maxAreaCombustibleM2: 1400,  sprinklerBonusStoreys: 2, sprinklerBonusAreaM2: 700  },

  // Group D — Business and Personal Services
  D:  { combustiblePermitted: true,  maxStoreysCombustible: 4, maxAreaCombustibleM2: 2800,  sprinklerBonusStoreys: 2, sprinklerBonusAreaM2: 1400 },

  // Group E — Mercantile
  E:  { combustiblePermitted: true,  maxStoreysCombustible: 4, maxAreaCombustibleM2: 2800,  sprinklerBonusStoreys: 2, sprinklerBonusAreaM2: 1400 },

  // Group F — Industrial
  // F1 (high hazard): Non-Combustible always required
  F1: { combustiblePermitted: false, maxStoreysCombustible: 0, maxAreaCombustibleM2: 0,     sprinklerBonusStoreys: 0, sprinklerBonusAreaM2: 0 },
  // F2/F3: Combustible permitted up to 2 storeys
  F2: { combustiblePermitted: true,  maxStoreysCombustible: 2, maxAreaCombustibleM2: 1600,  sprinklerBonusStoreys: 1, sprinklerBonusAreaM2: 800  },
  F3: { combustiblePermitted: true,  maxStoreysCombustible: 3, maxAreaCombustibleM2: 2800,  sprinklerBonusStoreys: 1, sprinklerBonusAreaM2: 1400 },
};

// ─── Part 9 threshold ────────────────────────────────────────────────────────
// Buildings ≤3 storeys AND ≤600m² fall under Part 9 (NBC 9.10.1).
// Part 9 always permits combustible construction regardless of occupancy.
const PART9_MAX_STOREYS = 3;
const PART9_MAX_AREA_M2 = 600;

// ─── Main export ─────────────────────────────────────────────────────────────

export function determineConstructionType(
  input: ConstructionTypeInput
): ConstructionTypeResult {
  const timestamp = new Date().toISOString();
  const assumptions: string[] = [];
  const recommendations: string[] = [];

  const codeEdition = input.province === 'AB' ? 'NBC(AE) 2023'
                    : input.province === 'BC' ? 'BCBC 2024'
                    : 'NBC 2020';

  const ruleId = `CT-3.2.2.20-${input.province}`;
  const nbcRef = 'NBC 2020 Table 3.2.2.20';

  // ── Part 9 check ────────────────────────────────────────────────────────────
  // Small buildings always permitted to use combustible construction.
  // Return early — no further table lookup needed.
  if (input.storeys <= PART9_MAX_STOREYS && input.totalAreaM2 <= PART9_MAX_AREA_M2) {
    assumptions.push(
      `Building qualifies as Part 9 (≤${PART9_MAX_STOREYS} storeys, ≤${PART9_MAX_AREA_M2} m²) — NBC 9.10.1 permits combustible construction`
    );
    return {
      constructionType: 'Combustible',
      required: false,
      limitingStoreys: PART9_MAX_STOREYS,
      limitingAreaM2: PART9_MAX_AREA_M2,
      actualStoreys: input.storeys,
      actualAreaM2: input.totalAreaM2,
      storeyMargin: PART9_MAX_STOREYS - input.storeys,
      areaMarginM2: PART9_MAX_AREA_M2 - input.totalAreaM2,
      areaMarginPercent: Math.round(
        ((PART9_MAX_AREA_M2 - input.totalAreaM2) / PART9_MAX_AREA_M2) * 100
      ),
      ruleId, nbcRef, codeEdition,
      jurisdictionSource: input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence: 'confirmed',
      severity: 'pass',
      reasoning: `Part 9 building — combustible construction permitted (NBC 9.10.1)`,
      assumptions,
      recommendations,
      occupancyGroup: input.occupancyGroup,
    };
  }

  // ── Normalize occupancy group ────────────────────────────────────────────────
  // Strip hyphens for table lookup consistency ('A-1' → 'A1')
  const group = input.occupancyGroup.replace('-', '').toUpperCase();
  const limits = CONSTRUCTION_LIMITS[group];

  // ── Unknown occupancy group ──────────────────────────────────────────────────
  if (!limits) {
    assumptions.push('Occupancy group not recognized — defaulting to Non-Combustible for safety');
    recommendations.push('Verify occupancy classification before permit submission');
    return {
      constructionType: 'Non-Combustible',
      required: true,
      limitingStoreys: 0,
      limitingAreaM2: 0,
      actualStoreys: input.storeys,
      actualAreaM2: input.totalAreaM2,
      storeyMargin: 0,
      areaMarginM2: 0,
      areaMarginPercent: 0,
      ruleId, nbcRef, codeEdition,
      jurisdictionSource: input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence: 'advisory',
      severity: 'info',
      reasoning: `Occupancy group '${input.occupancyGroup}' not found in construction type table — Non-Combustible assumed`,
      assumptions,
      recommendations,
      occupancyGroup: input.occupancyGroup,
    };
  }

  // ── Always Non-Combustible ───────────────────────────────────────────────────
  if (!limits.combustiblePermitted) {
    recommendations.push(
      `Group ${group} requires Non-Combustible construction regardless of height or area (NBC Table 3.2.2.20)`
    );
    return {
      constructionType: 'Non-Combustible',
      required: true,
      limitingStoreys: 0,
      limitingAreaM2: 0,
      actualStoreys: input.storeys,
      actualAreaM2: input.totalAreaM2,
      storeyMargin: 0,
      areaMarginM2: 0,
      areaMarginPercent: 0,
      ruleId, nbcRef, codeEdition,
      jurisdictionSource: input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence: 'confirmed',
      severity: 'pass',
      reasoning: `Group ${group} occupancy always requires Non-Combustible construction (NBC Table 3.2.2.20)`,
      assumptions,
      recommendations,
      occupancyGroup: group,
    };
  }

  // ── Apply sprinkler bonus ────────────────────────────────────────────────────
  const effectiveMaxStoreys = limits.maxStoreysCombustible +
    (input.sprinklered ? limits.sprinklerBonusStoreys : 0);
  const effectiveMaxAreaM2 = limits.maxAreaCombustibleM2 +
    (input.sprinklered ? limits.sprinklerBonusAreaM2 : 0);

  if (input.sprinklered) {
    assumptions.push(
      `Sprinkler bonus applied: +${limits.sprinklerBonusStoreys} storeys, +${limits.sprinklerBonusAreaM2} m²`
    );
  }

  // ── Evaluate against limits ──────────────────────────────────────────────────
  const storeyExceeded = input.storeys > effectiveMaxStoreys;
  const areaExceeded   = input.totalAreaM2 > effectiveMaxAreaM2;
  const nonCombustibleRequired = storeyExceeded || areaExceeded;

  const storeyMargin = effectiveMaxStoreys - input.storeys;
  const areaMarginM2 = effectiveMaxAreaM2 - input.totalAreaM2;
  const areaMarginPercent = Math.round((areaMarginM2 / effectiveMaxAreaM2) * 100);

  if (storeyExceeded) {
    recommendations.push(
      `Building exceeds ${effectiveMaxStoreys}-storey combustible limit for Group ${group} — Non-Combustible required (NBC Table 3.2.2.20)`
    );
  }
  if (areaExceeded) {
    recommendations.push(
      `Building exceeds ${effectiveMaxAreaM2} m² area limit for Group ${group} — Non-Combustible required (NBC Table 3.2.2.20)`
    );
  }
  if (!nonCombustibleRequired) {
    recommendations.push(
      `Combustible construction permitted — ${storeyMargin} storey(s) and ${Math.round(areaMarginM2)} m² of headroom remaining`
    );
  }

  return {
    constructionType: nonCombustibleRequired ? 'Non-Combustible' : 'Combustible',
    required: nonCombustibleRequired,
    limitingStoreys: effectiveMaxStoreys,
    limitingAreaM2:  effectiveMaxAreaM2,
    actualStoreys:   input.storeys,
    actualAreaM2:    input.totalAreaM2,
    storeyMargin,
    areaMarginM2,
    areaMarginPercent,
    ruleId, nbcRef, codeEdition,
    jurisdictionSource: input.jurisdictionSource,
    evaluationTimestamp: timestamp,
    confidence: input.totalAreaM2 > 0 ? 'confirmed' : 'inferred',
    occupancyGroup: group,
    severity: nonCombustibleRequired ? 'fail' : 'pass',
    reasoning: nonCombustibleRequired
      ? `Non-Combustible required: ${storeyExceeded ? `${input.storeys} storeys exceeds ${effectiveMaxStoreys}-storey limit` : ''}${storeyExceeded && areaExceeded ? '; ' : ''}${areaExceeded ? `${Math.round(input.totalAreaM2)} m² exceeds ${Math.round(effectiveMaxAreaM2)} m² limit` : ''}`
      : `Combustible construction permitted for Group ${group} at ${input.storeys} storey(s) and ${Math.round(input.totalAreaM2)} m²`,
    assumptions,
    recommendations,
  };
}
