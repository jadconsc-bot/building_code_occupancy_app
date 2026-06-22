/**
 * Code Conflict Detector
 * Cross-checks all orchestrator outputs for internal contradictions.
 *
 * A CONFLICT is distinct from a compliance FAILURE:
 *   - Failure: a single rule is violated (e.g. travel distance exceeded)
 *   - Conflict: two outputs contradict each other (e.g. combustible
 *     construction selected for an occupancy that always requires
 *     non-combustible)
 *
 * Conflicts indicate design problems that would survive individual
 * rule checks but fail at permit review or professional sign-off.
 *
 * DETERMINISTIC ONLY — no LLM calls, no external dependencies.
 * All conflict decisions made by this engine, not by AI.
 *
 * Source rules:
 *   NBC 2020 Table 3.2.2.20 — construction type limits
 *   NBC 2020 Article 3.2.5.2 — sprinkler requirements
 *   NBC 2020 Article 3.4.2.5 — travel distance limits
 *   NBC 2020 Article 3.3.4   — fire separation between occupancies
 *   NBC 2020 Article 3.8.3.8 — barrier-free washroom requirements
 */

import type { WashroomResult } from './washroomCalculator';
import type { ConstructionTypeResult } from './constructionTypeEngine';

// ─── Input — full orchestrator result passed in ──────────────────────────────

export interface ConflictDetectorInput {
  occupantLoad: Array<{
    roomLabel: string;
    occupancyGroup: string;
    areaM2: number | null;
    areaM2PerPerson: number;
    maxOccupants: number;
    nbcRef: string;
  }>;
  travelDistance: Array<{
    roomLabel: string;
    distanceM: number;
    limitM: number;
    result: string;
    nbcRef: string;
  }>;
  fireSeparation: Array<{
    ruleId: string;
    description: string;
    requiredFRR: string;
    citation: string;
  }>;
  washroomCounts: WashroomResult[];
  constructionTypes: ConstructionTypeResult[];
  sprinklered: boolean;
  storeys: number;
  province: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

// ─── Output ──────────────────────────────────────────────────────────────────

export interface CodeConflict {
  // Unique identifier for this conflict type — stable across runs
  conflictId: string;         // e.g. 'CONFLICT-CT-001'

  // Severity — how serious is this contradiction
  severity: 'critical' | 'major' | 'minor';

  // Which rule areas are in conflict
  conflictingRules: string[]; // e.g. ['NBC Table 3.2.2.20', 'NBC 3.2.5.2']

  // Human-readable description for audit trail and UI
  description: string;

  // The two contradicting values
  valueA: string;             // e.g. 'Construction type: Combustible'
  valueB: string;             // e.g. 'Occupancy B-1: always requires Non-Combustible'

  // Recommended resolution
  recommendation: string;

  // NBC citation
  nbcRef: string;
  codeEdition: string;

  // Audit trail
  evaluationTimestamp: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export interface ConflictDetectionResult {
  conflicts: CodeConflict[];
  conflictCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  // true if any critical conflicts found — gate for permit package
  hasBlockingConflicts: boolean;
  evaluationTimestamp: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

// ─── Occupancy groups that ALWAYS require Non-Combustible ────────────────────
// Source: NBC Table 3.2.2.20 — combustiblePermitted: false
const ALWAYS_NON_COMBUSTIBLE = new Set(['B1', 'F1']);

// ─── Occupancy groups that require sprinklers above threshold ────────────────
// Source: NBC 3.2.5.2
const SPRINKLER_REQUIRED_ALWAYS = new Set(['A1', 'B1', 'B2', 'F1']);
const SPRINKLER_REQUIRED_ABOVE_300 = new Set(['A2', 'A3']);

// ─── Travel distance limits ──────────────────────────────────────────────────
const TRAVEL_LIMIT_D_UNSPRINKLERED = 40; // m — NBC 3.4.2.5: Group D (business & personal services)
const TRAVEL_LIMIT_GENERAL_UNSPRINKLERED = 30; // m — NBC 3.4.2.5: A/B/C/E/F-2/F-3
const TRAVEL_LIMIT_F1 = 25; // m — NBC 3.4.2.5 Clause (c): F-1 excluded from 45m sprinklered benefit

// ─── Helper: normalize occupancy group ───────────────────────────────────────
function normalize(group: string): string {
  return group.replace('-', '').toUpperCase();
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function detectCodeConflicts(
  input: ConflictDetectorInput
): ConflictDetectionResult {
  const timestamp = new Date().toISOString();
  const conflicts: CodeConflict[] = [];

  const codeEdition = input.province === 'AB' ? 'NBC(AE) 2023'
                    : input.province === 'BC' ? 'BCBC 2024'
                    : 'NBC 2020';

  // ── CONFLICT CHECK 1 ─────────────────────────────────────────────────────
  // Construction type vs occupancy group
  // Fires when constructionType result says 'Combustible' but the occupancy
  // group always requires Non-Combustible per Table 3.2.2.20.
  for (const ct of input.constructionTypes) {
    const group = normalize(ct.occupancyGroup);
    if (
      ct.constructionType === 'Combustible' &&
      ALWAYS_NON_COMBUSTIBLE.has(group)
    ) {
      conflicts.push({
        conflictId: `CONFLICT-CT-001-${group}`,
        severity: 'critical',
        conflictingRules: ['NBC Table 3.2.2.20'],
        description: `Construction type 'Combustible' is incompatible with Group ${group} occupancy`,
        valueA: `Construction type: Combustible`,
        valueB: `Group ${group}: Non-Combustible always required (NBC Table 3.2.2.20)`,
        recommendation: `Change construction type to Non-Combustible or reclassify occupancy`,
        nbcRef: 'NBC 2020 Table 3.2.2.20',
        codeEdition,
        evaluationTimestamp: timestamp,
        jurisdictionSource: input.jurisdictionSource,
      });
    }
  }

  // ── CONFLICT CHECK 2 ─────────────────────────────────────────────────────
  // Sprinkler status vs occupancy group requirement
  // Fires when building is NOT sprinklered but occupancy requires it.
  if (!input.sprinklered) {
    const groups = input.occupantLoad.map(ol => normalize(ol.occupancyGroup));
    const uniqueGroups = [...new Set(groups)];

    for (const group of uniqueGroups) {
      if (SPRINKLER_REQUIRED_ALWAYS.has(group)) {
        conflicts.push({
          conflictId: `CONFLICT-SP-001-${group}`,
          severity: 'critical',
          conflictingRules: ['NBC 3.2.5.2'],
          description: `Group ${group} occupancy requires sprinklers throughout but building is marked unsprinklered`,
          valueA: `Sprinklered: false`,
          valueB: `Group ${group}: sprinklers required throughout (NBC 3.2.5.2)`,
          recommendation: `Add sprinkler system or reclassify occupancy`,
          nbcRef: 'NBC 2020 Article 3.2.5.2',
          codeEdition,
          evaluationTimestamp: timestamp,
          jurisdictionSource: input.jurisdictionSource,
        });
      }

      // A2/A3: sprinklers required when occupant load > 300
      if (SPRINKLER_REQUIRED_ABOVE_300.has(group)) {
        const groupLoad = input.occupantLoad
          .filter(ol => normalize(ol.occupancyGroup) === group)
          .reduce((sum, ol) => sum + ol.maxOccupants, 0);

        if (groupLoad > 300) {
          conflicts.push({
            conflictId: `CONFLICT-SP-002-${group}`,
            severity: 'critical',
            conflictingRules: ['NBC 3.2.5.2'],
            description: `Group ${group} with ${groupLoad} persons requires sprinklers but building is unsprinklered`,
            valueA: `Occupant load: ${groupLoad} persons (> 300 threshold)`,
            valueB: `Group ${group} > 300 persons: sprinklers required (NBC 3.2.5.2)`,
            recommendation: `Add sprinkler system or reduce occupant load below 300`,
            nbcRef: 'NBC 2020 Article 3.2.5.2',
            codeEdition,
            evaluationTimestamp: timestamp,
            jurisdictionSource: input.jurisdictionSource,
          });
        }
      }
    }
  }

  // ── CONFLICT CHECK 3 ─────────────────────────────────────────────────────
  // Travel distance limit vs sprinkler status
  // Fires when a passing travel distance result uses the sprinklered limit
  // but the building is actually unsprinklered.
  // Infer the applicable unsprinklered threshold from td.limitM:
  //   <= 25 → F-1 or default-conservative (25m)
  //   <= 30 → general groups A/B/C/E/F-2/F-3 (30m)
  //   <= 40 → Group D (40m)
  //   45    → sprinklered limit used in error → fall back to 30m general threshold
  for (const td of input.travelDistance) {
    if (td.result === 'pass' || td.result === 'PASS') {
      const unsprinkleredThreshold =
        td.limitM <= TRAVEL_LIMIT_F1              ? TRAVEL_LIMIT_F1 :
        td.limitM <= TRAVEL_LIMIT_GENERAL_UNSPRINKLERED ? TRAVEL_LIMIT_GENERAL_UNSPRINKLERED :
        td.limitM <= TRAVEL_LIMIT_D_UNSPRINKLERED ? TRAVEL_LIMIT_D_UNSPRINKLERED :
        TRAVEL_LIMIT_GENERAL_UNSPRINKLERED;         // 45m sprinklered → fall back to 30m
      if (
        !input.sprinklered &&
        td.limitM > unsprinkleredThreshold &&
        td.distanceM > unsprinkleredThreshold
      ) {
        conflicts.push({
          conflictId: `CONFLICT-TD-001-${td.roomLabel.replace(/\s/g, '_')}`,
          severity: 'major',
          conflictingRules: ['NBC 3.4.2.5'],
          description: `Travel distance for '${td.roomLabel}' passes using sprinklered limit but building is unsprinklered`,
          valueA: `Travel distance: ${td.distanceM}m (passes at ${td.limitM}m sprinklered limit)`,
          valueB: `Building is unsprinklered — ${unsprinkleredThreshold}m limit applies (NBC 3.4.2.5)`,
          recommendation: `Travel distance exceeds unsprinklered limit of ${unsprinkleredThreshold}m — add sprinklers or relocate exit`,
          nbcRef: 'NBC 2020 Article 3.4.2.5',
          codeEdition,
          evaluationTimestamp: timestamp,
          jurisdictionSource: input.jurisdictionSource,
        });
      }
    }
  }

  // ── CONFLICT CHECK 4 ─────────────────────────────────────────────────────
  // Mixed occupancy without fire separation
  // Fires when >1 unique occupancy group detected but fireSeparation[]
  // is empty — no fire separation rules were evaluated between them.
  const uniqueOccupancies = new Set(
    input.occupantLoad.map(ol => normalize(ol.occupancyGroup))
  );

  if (uniqueOccupancies.size > 1 && input.fireSeparation.length === 0) {
    const groups = [...uniqueOccupancies].join(', ');
    conflicts.push({
      conflictId: 'CONFLICT-FS-001',
      severity: 'major',
      conflictingRules: ['NBC 3.3.4'],
      description: `Mixed occupancy building (${groups}) has no fire separation rules evaluated`,
      valueA: `Occupancy groups detected: ${groups}`,
      valueB: `Fire separation between occupancy groups: not evaluated`,
      recommendation: `Run fire separation analysis for all occupancy interfaces`,
      nbcRef: 'NBC 2020 Article 3.3.4',
      codeEdition,
      evaluationTimestamp: timestamp,
      jurisdictionSource: input.jurisdictionSource,
    });
  }

  // ── CONFLICT CHECK 5 ─────────────────────────────────────────────────────
  // Accessible washroom required but not flagged in findings
  // Fires when washroomCounts indicates accessibleStallsRequired: true
  // but no barrier-free finding exists in findings[].
  // NOTE: This is a forward-looking check — H3 (barrier-free) will add
  // proper barrier-free findings. Until then this flags the gap.
  const accessibleRequired = input.washroomCounts.some(
    wc => wc.required.accessibleStallsRequired
  );

  if (accessibleRequired) {
    conflicts.push({
      conflictId: 'CONFLICT-BF-001',
      severity: 'minor',
      conflictingRules: ['NBC 3.8.3.8'],
      description: `Accessible washroom stall required but barrier-free analysis not yet completed`,
      valueA: `Washroom calculation: accessible stall required (NBC 3.8.3.8)`,
      valueB: `Barrier-free analysis: not evaluated (H3 pending)`,
      recommendation: `Complete barrier-free requirements analysis (NBC 3.8) before permit submission`,
      nbcRef: 'NBC 2020 Article 3.8.3.8',
      codeEdition,
      evaluationTimestamp: timestamp,
      jurisdictionSource: input.jurisdictionSource,
    });
  }

  // ── Assemble result ──────────────────────────────────────────────────────
  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const majorCount    = conflicts.filter(c => c.severity === 'major').length;
  const minorCount    = conflicts.filter(c => c.severity === 'minor').length;

  return {
    conflicts,
    conflictCount:       conflicts.length,
    criticalCount,
    majorCount,
    minorCount,
    // Blocking = any critical conflict — gates permit package generation
    hasBlockingConflicts: criticalCount > 0,
    evaluationTimestamp: timestamp,
    jurisdictionSource: input.jurisdictionSource,
  };
}
