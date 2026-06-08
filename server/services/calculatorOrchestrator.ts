/**
 * Calculator Orchestrator
 * Deterministic only — NO LLM calls.
 * Runs occupant load, egress window, travel distance, and FRR checks
 * against extracted drawing data.
 */

import {
  calculateWashroomRequirements,
  WashroomResult,
} from './washroomCalculator';
import {
  determineConstructionType,
  ConstructionTypeResult,
} from './constructionTypeEngine';

// NBC 2023 Table 4.1.5.3 occupant load factors (persons/m²)
const OCCUPANT_LOAD_FACTORS: Record<string, { factor: number; nbcRef: string }> = {
  'A-1': { factor: 0.75,  nbcRef: 'NBC 2023 T.4.1.5.3' },
  'A-2': { factor: 0.5,   nbcRef: 'NBC 2023 T.4.1.5.3' },
  'A-3': { factor: 0.08,  nbcRef: 'NBC 2023 T.4.1.5.3' },
  'A-4': { factor: 0.05,  nbcRef: 'NBC 2023 T.4.1.5.3' },
  'B-1': { factor: 0.1,   nbcRef: 'NBC 2023 T.4.1.5.3' },
  'B-2': { factor: 0.1,   nbcRef: 'NBC 2023 T.4.1.5.3' },
  'B-3': { factor: 0.1,   nbcRef: 'NBC 2023 T.4.1.5.3' },
  'B':   { factor: 0.1,   nbcRef: 'NBC 2023 T.4.1.5.3' },
  'C':   { factor: 0.2,   nbcRef: 'NBC 2023 T.4.1.5.3' },
  'D':   { factor: 0.1,   nbcRef: 'NBC 2023 T.4.1.5.3' },
  'E':   { factor: 0.1,   nbcRef: 'NBC 2023 T.4.1.5.3' },
  'F-1': { factor: 0.05,  nbcRef: 'NBC 2023 T.4.1.5.3' },
  'F-2': { factor: 0.05,  nbcRef: 'NBC 2023 T.4.1.5.3' },
  'F-3': { factor: 0.05,  nbcRef: 'NBC 2023 T.4.1.5.3' },
};

// FRR requirements by occupancy group for single-occupancy floors (minutes)
const FRR_BY_GROUP: Record<string, { frr: number; citation: string }> = {
  'A-1': { frr: 60,  citation: 'NBC 2023 T.3.1.8.1' },
  'A-2': { frr: 60,  citation: 'NBC 2023 T.3.1.8.1' },
  'A-3': { frr: 60,  citation: 'NBC 2023 T.3.1.8.1' },
  'A-4': { frr: 60,  citation: 'NBC 2023 T.3.1.8.1' },
  'B-1': { frr: 90,  citation: 'NBC 2023 T.3.1.8.1' },
  'B-2': { frr: 90,  citation: 'NBC 2023 T.3.1.8.1' },
  'B-3': { frr: 90,  citation: 'NBC 2023 T.3.1.8.1' },
  'B':   { frr: 90,  citation: 'NBC 2023 T.3.1.8.1' },
  'C':   { frr: 45,  citation: 'NBC(AE) 2023 s.9.10.9.16' },
  'D':   { frr: 45,  citation: 'NBC 2023 T.3.1.8.1' },
  'E':   { frr: 45,  citation: 'NBC 2023 T.3.1.8.1' },
  'F-1': { frr: 30,  citation: 'NBC 2023 T.3.1.8.1' },
  'F-2': { frr: 45,  citation: 'NBC 2023 T.3.1.8.1' },
  'F-3': { frr: 60,  citation: 'NBC 2023 T.3.1.8.1' },
};

// Egress window minimums — NBC s.9.9.10.1
const EGRESS_MIN_AREA_M2   = 0.35;
const EGRESS_MIN_DIM_MM    = 380;

export interface OrchestratorInput {
  rooms: Array<{
    label: string;
    occupancyGroup: string;
    areaM2: number | null;
  }>;
  windows: Array<{ widthMm: number; heightMm: number; areaM2: number }>;
  travelDistanceResults: Array<{
    roomLabel: string;
    distanceM: number;
    limit: number;
    result: string;
    nbcClause: string;
  }>;
  storeys: number;
  sprinklered: boolean;
  province: string;
  calibrationConfidence: 'high' | 'low' | 'none';
  /**
   * How jurisdiction was determined — flows through to washroom result
   * audit trail. Optional: legacy callers that omit it get undefined,
   * which is intentional (visible gap, not silent masking).
   */
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export interface OrchestratorResult {
  occupantLoad: Array<{
    roomLabel: string;
    occupancyGroup: string;
    areaM2: number;
    occupantsPerM2: number;
    maxOccupants: number;
    nbcRef: string;
  }>;
  egressWindows: Array<{
    windowIdx: number;
    widthMm: number;
    heightMm: number;
    areaM2: number;
    minAreaM2: 0.35;
    minDimensionMm: 380;
    result: 'pass' | 'fail';
    nbcRef: string;
  }>;
  travelDistance: Array<{
    roomLabel: string;
    distanceM: number;
    limitM: number;
    result: 'pass' | 'fail' | 'unable_to_evaluate';
    nbcRef: string;
  }>;
  fireSeparation: Array<{
    ruleId: string;
    description: string;
    requiredFRR: number;
    citation: string;
  }>;
  summary: {
    totalRooms: number;
    totalOccupants: number;
    passCount: number;
    failCount: number;
    advisoryCount: number;
    calibrationConfidence: 'high' | 'low' | 'none';
    edition: string;
  };
  findings: Array<{
    issueId: string;
    severity: 'fail' | 'advisory' | 'pass';
    description: string;
    actual: string;
    required: string;
    citation: string;
  }>;
  /**
   * Washroom fixture requirements per occupancy group.
   * NBC 3.7.2.1 — one entry per unique occupancy group detected.
   * Empty array if no rooms with recognized occupancy groups found.
   */
  washroomCounts: WashroomResult[];
  /**
   * Jurisdiction source threaded through from input for audit trail.
   */
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  /**
   * Construction type determination per NBC Table 3.2.2.20.
   * One entry per unique occupancy group — mixed-use buildings get separate evaluations.
   * Empty array if no rooms with recognized occupancy groups found.
   */
  constructionTypes: ConstructionTypeResult[];
}

export function runCalculatorOrchestrator(
  input: OrchestratorInput,
  province: string,
): OrchestratorResult {
  const isAB = province === 'AB';
  const egressCitation = isAB
    ? 'NBC(AE) 2023 s.9.9.10.1'
    : 'NBC 2020 s.9.9.10.1';
  const edition = isAB ? 'NBC(AE) 2023' : 'NBC 2020';

  const findings: OrchestratorResult['findings'] = [];
  let passCount = 0;
  let failCount = 0;
  let advisoryCount = 0;

  // ── Occupant Load ──────────────────────────────────────────────────────────
  const occupantLoad: OrchestratorResult['occupantLoad'] = [];
  let totalOccupants = 0;

  for (let i = 0; i < input.rooms.length; i++) {
    const room = input.rooms[i];
    if (room.areaM2 === null || room.areaM2 <= 0) continue;

    // Normalize group: "B-1" → "B-1", "B" → "B"
    const group = room.occupancyGroup.trim().toUpperCase();
    const spec = OCCUPANT_LOAD_FACTORS[group] ?? OCCUPANT_LOAD_FACTORS['D'];
    const maxOccupants = Math.ceil(room.areaM2 * spec.factor);
    totalOccupants += maxOccupants;

    const issueId = `OCC-${String(i + 1).padStart(3, '0')}`;
    occupantLoad.push({
      roomLabel: room.label,
      occupancyGroup: group,
      areaM2: room.areaM2,
      occupantsPerM2: spec.factor,
      maxOccupants,
      nbcRef: spec.nbcRef,
    });

    findings.push({
      issueId,
      severity: 'pass',
      description: `Occupant load — ${room.label}`,
      actual: `${room.areaM2.toFixed(1)} m² × ${spec.factor}/m² = ${maxOccupants} persons`,
      required: `Group ${group} load factor ${spec.factor} p/m²`,
      citation: spec.nbcRef,
    });
    passCount++;
  }

  // ── Washroom counts (NBC 3.7.2.1) ────────────────────────────────────────
  // One calculation per unique occupancy group found in occupant load
  // results. Mixed-use buildings get separate counts per group.
  // Deduplication via groupsSeen prevents double-counting when multiple
  // rooms share the same occupancy group.
  const washroomCounts: WashroomResult[] = [];
  const groupsSeen = new Set<string>();

  for (const ol of occupantLoad) {
    const normalizedGroup = ol.occupancyGroup.replace('-', '');
    if (groupsSeen.has(normalizedGroup)) continue;
    groupsSeen.add(normalizedGroup);

    // Sum all persons across rooms sharing this occupancy group —
    // fixture count is based on total load for the group, not per-room.
    const groupTotalPersons = occupantLoad
      .filter(r => r.occupancyGroup === ol.occupancyGroup)
      .reduce((sum, r) => sum + r.maxOccupants, 0);

    washroomCounts.push(
      calculateWashroomRequirements({
        occupancyGroup: normalizedGroup,   // 'A-1' → 'A1', 'B-2' → 'B2'
        occupantLoad: groupTotalPersons,
        sprinklered: input.sprinklered,
        province: input.province ?? 'CA',
        jurisdictionSource: input.jurisdictionSource,
      })
    );
  }
  // ── End washroom counts ───────────────────────────────────────────────────

  // ── Construction Type (NBC Table 3.2.2.20) ────────────────────────────────
  // One evaluation per unique occupancy group, using the group-total area.
  // Reuses groupsSeen deduplication already populated by the washroom loop.
  const constructionTypes: ConstructionTypeResult[] = [];
  const ctGroupsSeen = new Set<string>();

  for (const ol of occupantLoad) {
    const normalizedGroup = ol.occupancyGroup.replace('-', '');
    if (ctGroupsSeen.has(normalizedGroup)) continue;
    ctGroupsSeen.add(normalizedGroup);

    const groupTotalAreaM2 = occupantLoad
      .filter(r => r.occupancyGroup === ol.occupancyGroup)
      .reduce((sum, r) => sum + r.areaM2, 0);

    constructionTypes.push(
      determineConstructionType({
        occupancyGroup: normalizedGroup,
        storeys: input.storeys,
        sprinklered: input.sprinklered,
        totalAreaM2: groupTotalAreaM2,
        province: input.province ?? 'CA',
        jurisdictionSource: input.jurisdictionSource,
      })
    );
  }
  // ── End construction type ─────────────────────────────────────────────────

  // ── Egress Windows ─────────────────────────────────────────────────────────
  const egressWindows: OrchestratorResult['egressWindows'] = [];

  for (let i = 0; i < input.windows.length; i++) {
    const w = input.windows[i];
    const issueId = `EGR-${String(i + 1).padStart(3, '0')}`;

    const areaOk = w.areaM2 >= EGRESS_MIN_AREA_M2;
    const widthOk = w.widthMm >= EGRESS_MIN_DIM_MM;
    const heightOk = w.heightMm >= EGRESS_MIN_DIM_MM;
    const dimensionallyPass = areaOk && widthOk && heightOk;

    // If calibration not high, dimension-dependent checks are advisory
    const effectiveResult = input.calibrationConfidence === 'high'
      ? (dimensionallyPass ? 'pass' : 'fail')
      : 'pass'; // advisory path below

    egressWindows.push({
      windowIdx: i + 1,
      widthMm: w.widthMm,
      heightMm: w.heightMm,
      areaM2: w.areaM2,
      minAreaM2: 0.35,
      minDimensionMm: 380,
      result: effectiveResult as 'pass' | 'fail',
      nbcRef: egressCitation,
    });

    if (input.calibrationConfidence !== 'high') {
      findings.push({
        issueId,
        severity: 'advisory',
        description: `Egress window ${i + 1} — calibrate scale for definitive result`,
        actual: `${w.widthMm.toFixed(0)}mm × ${w.heightMm.toFixed(0)}mm (${w.areaM2.toFixed(3)} m²)`,
        required: `≥ ${EGRESS_MIN_DIM_MM}mm × ${EGRESS_MIN_DIM_MM}mm, ≥ ${EGRESS_MIN_AREA_M2} m²`,
        citation: `${egressCitation} — Calibrate scale for definitive pass/fail`,
      });
      advisoryCount++;
    } else if (!dimensionallyPass) {
      findings.push({
        issueId,
        severity: 'fail',
        description: `Egress window ${i + 1} undersized`,
        actual: `${w.widthMm.toFixed(0)}mm × ${w.heightMm.toFixed(0)}mm (${w.areaM2.toFixed(3)} m²)`,
        required: `≥ ${EGRESS_MIN_DIM_MM}mm × ${EGRESS_MIN_DIM_MM}mm, ≥ ${EGRESS_MIN_AREA_M2} m²`,
        citation: egressCitation,
      });
      failCount++;
    } else {
      findings.push({
        issueId,
        severity: 'pass',
        description: `Egress window ${i + 1} — compliant`,
        actual: `${w.widthMm.toFixed(0)}mm × ${w.heightMm.toFixed(0)}mm (${w.areaM2.toFixed(3)} m²)`,
        required: `≥ ${EGRESS_MIN_DIM_MM}mm × ${EGRESS_MIN_DIM_MM}mm, ≥ ${EGRESS_MIN_AREA_M2} m²`,
        citation: egressCitation,
      });
      passCount++;
    }
  }

  // ── Travel Distance (pass-through) ─────────────────────────────────────────
  const travelDistance: OrchestratorResult['travelDistance'] = [];

  for (let i = 0; i < input.travelDistanceResults.length; i++) {
    const r = input.travelDistanceResults[i];
    const issueId = `TRAVEL-${String(i + 1).padStart(3, '0')}`;
    const result = (r.result === 'pass' || r.result === 'fail')
      ? r.result as 'pass' | 'fail'
      : 'unable_to_evaluate' as const;

    travelDistance.push({
      roomLabel: r.roomLabel,
      distanceM: r.distanceM,
      limitM: r.limit,
      result,
      nbcRef: `NBC ${r.nbcClause}`,
    });

    if (result === 'fail') {
      findings.push({
        issueId,
        severity: 'fail',
        description: `Travel distance exceeded — ${r.roomLabel}`,
        actual: `${r.distanceM.toFixed(1)} m`,
        required: `≤ ${r.limit} m`,
        citation: `NBC ${r.nbcClause}.(1)`,
      });
      failCount++;
    } else if (result === 'pass') {
      findings.push({
        issueId,
        severity: 'pass',
        description: `Travel distance — ${r.roomLabel}`,
        actual: `${r.distanceM.toFixed(1)} m`,
        required: `≤ ${r.limit} m`,
        citation: `NBC ${r.nbcClause}.(1)`,
      });
      passCount++;
    }
  }

  // ── Fire Separation ────────────────────────────────────────────────────────
  const fireSeparation: OrchestratorResult['fireSeparation'] = [];
  const seenGroups = new Set<string>();

  for (let i = 0; i < input.rooms.length; i++) {
    const room = input.rooms[i];
    const group = room.occupancyGroup.trim().toUpperCase();
    if (seenGroups.has(group)) continue;
    seenGroups.add(group);

    const spec = FRR_BY_GROUP[group];
    if (!spec) continue;

    const ruleId = `FRR-${String(i + 1).padStart(3, '0')}`;
    fireSeparation.push({
      ruleId,
      description: `Group ${group} fire separation`,
      requiredFRR: spec.frr,
      citation: spec.citation,
    });

    findings.push({
      issueId: ruleId,
      severity: 'advisory',
      description: `FRR advisory — Group ${group} occupancy`,
      actual: 'Verify assembly rating on drawing',
      required: `${spec.frr} min FRR`,
      citation: spec.citation,
    });
    advisoryCount++;
  }

  return {
    occupantLoad,
    egressWindows,
    travelDistance,
    fireSeparation,
    summary: {
      totalRooms: input.rooms.length,
      totalOccupants,
      passCount,
      failCount,
      advisoryCount,
      calibrationConfidence: input.calibrationConfidence,
      edition,
    },
    findings,
    washroomCounts,
    constructionTypes,
    jurisdictionSource: input.jurisdictionSource,
  };
}
