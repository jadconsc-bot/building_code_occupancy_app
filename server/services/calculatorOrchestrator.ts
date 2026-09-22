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
import {
  detectCodeConflicts,
  ConflictDetectionResult,
} from './codeConflictDetector';
import {
  calculateBarrierFreeRequirements,
  BarrierFreeResult,
} from './barrierFreeCalculator';
import { scoreCARLItems } from './carl/carlScorer';
import type { CARLReport } from './carl/carlTypes';
import { getAccessoryLoadFactor, getDefaultLoadFactor } from '@shared/occupantLoadFactors';
import { determineOccupantLoad } from '../engine/occupantLoadDetermination';
import {
  ACCESSORY_SPACE_TYPES,
  inferAccessorySpaceType,
  reclassifyAccessoryOccupancy,
  type ReclassificationResult,
} from '../engine/spatial/accessoryOccupancyReclassifier';
import type { RequirementCandidate } from './complianceRequirementGraph';
import { readProvenancedFact } from './factProvenance';

// FRR requirements by occupancy group for single-occupancy floors (minutes)
// NOTE: These are conservative single-occupancy
// FRR approximations only. NBC Table 3.1.3.1
// requires pairwise occupancy evaluation.
// Full pairwise FRR is computed by the adjacency
// engine in adjacencyService.ts + Rule 7 in
// roomComplianceEvaluator.ts. This flat lookup
// exists only for the calculator orchestrator
// which lacks adjacency context.
// TODO: wire orchestrator to adjacency engine
// output when available in calculator context.
const FRR_BY_GROUP: Record<string, { frr: number; citation: string }> = {
  'A-1': { frr: 60,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'A-2': { frr: 60,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'A-3': { frr: 60,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'A-4': { frr: 60,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'B-1': { frr: 90,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'B-2': { frr: 90,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'B-3': { frr: 90,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'B':   { frr: 90,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'C':   { frr: 45,  citation: 'NBC(AE) 2023 s.9.10.9.16' },
  'D':   { frr: 45,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'E':   { frr: 45,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'F-1': { frr: 30,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'F-2': { frr: 45,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
  'F-3': { frr: 60,  citation: 'NBC 3.1.3.1 / Table 3.1.3.1 (conservative single-occupancy approximation — full pairwise evaluation requires adjacency context)' },
};

// Egress window minimums — NBC s.9.9.10.1
const EGRESS_MIN_AREA_M2   = 0.35;
const EGRESS_MIN_DIM_MM    = 380;

export interface OrchestratorInput {
  rooms: Array<{
    label: string;
    occupancyGroup: string;
    spaceType?: string;
    manualOverride?: boolean;
    areaM2: number | null;
    areaSqmJson?: unknown;
    occupancyGroupJson?: unknown;
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
  projectId?: number | null;
  address?: string | null;
  municipality?: string | null;
  totalDwellingUnits?: number;
  calibrationConfidence: 'high' | 'low' | 'none';
  /**
   * How jurisdiction was determined — flows through to washroom result
   * audit trail. Optional: legacy callers that omit it get undefined,
   * which is intentional (visible gap, not silent masking).
   */
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  /**
   * Stack Planner FRR data — from Occupancy Advisor confirmation.
   * When present, used as authoritative floor-to-floor separation
   * requirements instead of single-group FRR_BY_GROUP lookup.
   */
  stackSeparations?: Array<{
    from: string;
    to: string;
    frr: string;
    hours: number;
    nbcRef: string;
    needsReview?: boolean;
  }>;
  /** Persisted Stack Planner confirmation marker, when the project has one. */
  stackConfirmedAt?: Date | null;
}

export interface OrchestratorResult {
  occupantLoad: Array<{
    roomLabel: string;
    occupancyGroup: string;
    areaM2: number;
    areaM2PerPerson: number;
    maxOccupants: number;
    nbcRef: string;
    needsReview?: boolean;
    isAccessory?: boolean;
  }>;
  accessoryOccupantLoad: Array<{
    roomLabel: string;
    occupancyGroup: string;
    areaM2: number;
    areaM2PerPerson: number;
    maxOccupants: number;
    nbcRef: string;
    isAccessory: true;
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
  complianceRequirements: RequirementCandidate[];
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
   * Barrier-free requirements per NBC Part 3.8.
   * null if building is exempt (single detached ≤2 storeys).
   */
  barrierFreeRequirements: BarrierFreeResult | null;
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
  /**
   * Cross-check conflicts between all rule outputs.
   * A conflict is two outputs that contradict each other — distinct
   * from a single-rule failure.
   * hasBlockingConflicts: true gates permit package generation.
   */
  codeConflicts: ConflictDetectionResult;
  /**
   * CARL permit completeness report — 78-item scored checklist.
   * hasBlockingFailures gates permit package PDF alongside hasBlockingConflicts.
   */
  carlReport: CARLReport;
}

export function runCalculatorOrchestrator(
  input: OrchestratorInput,
  province: string,
): OrchestratorResult {
  const normalizedRooms = input.rooms.map(room => ({
    ...room,
    areaM2: readProvenancedFact({ wrapper: room.areaSqmJson, scalar: room.areaM2, field: 'areaSqm', entityType: 'room', entityId: 0, isValue: (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 }).value,
    occupancyGroup: readProvenancedFact({ wrapper: room.occupancyGroupJson, scalar: room.occupancyGroup, field: 'occupancyGroup', entityType: 'room', entityId: 0, isValue: (v): v is string => typeof v === 'string' && v.length > 0 }).value ?? room.occupancyGroup,
  }));
  const isAB = province === 'AB';
  const egressCitation = isAB
    ? 'NBC(AE) 2023 s.9.9.10.1'
    : 'NBC 2020 s.9.9.10.1';
  const edition = isAB ? 'NBC(AE) 2023' : 'NBC 2020';

  const findings: OrchestratorResult['findings'] = [];
  let passCount = 0;
  let failCount = 0;
  let advisoryCount = 0;

  const normalizeGroup = (value: string) => value.trim().toUpperCase();
  const dominantOccupancyGroup = (() => {
    const counts = new Map<string, number>();
    for (const room of normalizedRooms) {
      const spaceType = room.spaceType?.trim().toLowerCase();
      if (spaceType && ACCESSORY_SPACE_TYPES.includes(spaceType as (typeof ACCESSORY_SPACE_TYPES)[number])) {
        continue;
      }
      const group = normalizeGroup(room.occupancyGroup);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
    let dominant: string | null = null;
    let dominantCount = 0;
    let tied = false;
    for (const [group, count] of counts.entries()) {
      if (count > dominantCount) {
        dominant = group;
        dominantCount = count;
        tied = false;
      } else if (count === dominantCount) {
        tied = true;
      }
    }
    return tied ? null : dominant;
  })();

  const effectiveRooms: Array<OrchestratorInput['rooms'][number]> = [];
  const accessoryRoomLabels = new Set<string>();
  const accessoryAssessments: Array<{
    room: OrchestratorInput['rooms'][number];
    decision: ReclassificationResult;
  }> = [];
  let accessoryAdvisoryIndex = 1;

  for (const room of normalizedRooms) {
    const accessorySpaceType = inferAccessorySpaceType(room.spaceType, room.label);
    if (accessorySpaceType && !room.manualOverride) accessoryRoomLabels.add(room.label);

    if (room.manualOverride) {
      effectiveRooms.push(room);
      accessoryAssessments.push({ room, decision: { action: 'unchanged' } });
      continue;
    }

    const decision = reclassifyAccessoryOccupancy({
      occupancyGroup: room.occupancyGroup,
      spaceType: room.spaceType,
      label: room.label,
      dominantOccupancyGroup,
      totalDwellingUnits: input.totalDwellingUnits,
    });

    if (decision.action === 'reclassified') {
      effectiveRooms.push({
        ...room,
        occupancyGroup: decision.newOccupancyGroup,
      });
      accessoryAssessments.push({ room, decision });
      continue;
    }

    if (decision.action === 'flagForVerification') {
      findings.push({
        issueId: `ACC-${String(accessoryAdvisoryIndex++).padStart(3, '0')}`,
        severity: 'advisory',
        description: `Accessory occupancy verification — ${room.label}`,
        actual: `Occupancy group ${room.occupancyGroup} with space type ${room.spaceType ?? 'unknown'}`,
        required: decision.reason,
        citation: decision.citation,
      });
      advisoryCount++;
      accessoryAssessments.push({ room, decision });
      continue;
    }

    effectiveRooms.push(room);
    accessoryAssessments.push({ room, decision });
  }

  // ── Occupant Load ──────────────────────────────────────────────────────────
  const occupantLoad: OrchestratorResult['occupantLoad'] = [];
  const accessoryOccupantLoad: OrchestratorResult['accessoryOccupantLoad'] = [];
  const complianceRequirements: RequirementCandidate[] = [];
  let totalOccupants = 0;

  const groupCRooms = effectiveRooms.filter(
    r => r.occupancyGroup.trim().toUpperCase() === 'C' && !accessoryRoomLabels.has(r.label) && r.areaM2 !== null && r.areaM2 > 0
  );

  if (groupCRooms.length > 0) {
    const totalGroupCArea = groupCRooms.reduce((sum, r) => sum + (r.areaM2 ?? 0), 0);
    const determination = determineOccupantLoad({ occupancyGroup: 'C', areaM2: totalGroupCArea, rooms: groupCRooms.map(r => ({ occupancyGroup: r.occupancyGroup, label: r.label, areaM2: r.areaM2 })) });
    const bedroomCount = determination.bedroomCount ?? 0;
    const issueId = 'OCC-UNIT-001';

    occupantLoad.push({
      roomLabel: 'Dwelling Unit',
      occupancyGroup: 'C',
      areaM2: totalGroupCArea,
      areaM2PerPerson: 0,
      maxOccupants: determination.occupantLoad,
      nbcRef: determination.citation,
      needsReview: determination.needsReview,
    });

    // orchestrator-occupant-load.determination — Group C dwelling-unit fact.
    // Always insufficient-evidence, matching the FRR occupancy-fact/stack-fact
    // precedent: this is a determination/fact node, not a code-minimum
    // requirement, so requiredValue.value stays null. needsReview is visible
    // in triggeredBy but must not drive graph status.
    complianceRequirements.push({
      provisionRef: determination.citation,
      requirementType: 'orchestrator-occupant-load.determination',
      appliesTo: { kind: 'DwellingUnit', id: `project:${input.projectId ?? 'drawing'}:occupant-load` },
      requiredValue: { value: null, unit: 'persons' },
      actualValue: determination.needsReview
        ? null
        : {
            value: determination.occupantLoad,
            unit: 'persons',
            confirmed: false,
            source: 'derived',
          },
      status: 'insufficient-evidence',
      triggeredBy: [
        { fact: 'occupancyGroup', value: 'C' },
        { fact: 'areaM2', value: totalGroupCArea },
        { fact: 'bedroomCount', value: determination.bedroomCount },
        { fact: 'method', value: determination.method },
        { fact: 'needsReview', value: determination.needsReview },
        { fact: 'reasoning', value: determination.reasoning },
      ],
    });

    if (!determination.needsReview) {
      const unitOccupants = determination.occupantLoad;
      totalOccupants += unitOccupants;
      findings.push({
        issueId,
        severity: 'pass',
        description: 'Occupant load — Dwelling unit',
        actual: `Total area: ${totalGroupCArea.toFixed(1)} m² — ${bedroomCount} bedroom${bedroomCount !== 1 ? 's' : ''} identified × 2 persons/bedroom = ${unitOccupants} persons`,
        required: '2 persons per bedroom (dwelling units)',
        citation: 'NBC 3.1.17.1 Note (2)',
      });
      passCount++;
    } else {
      findings.push({
        issueId,
        severity: 'advisory',
        description: 'Occupant load — Dwelling unit',
        actual: `Total area: ${totalGroupCArea.toFixed(1)} m² — no bedroom-labeled rooms detected among Group C spaces; occupant count could not be determined`,
        required: 'Verify bedroom count and occupancy classification — NBC 3.1.17.1 Note (2) requires 2 persons/bedroom for dwelling units',
        citation: 'NBC 3.1.17.1 Note (2)',
      });
      advisoryCount++;
    }
  }

  // Aggregated by occupancy group (not per-room): the input carries labels
  // but no stable room identifiers, so room-level graph keys would be
  // fragile and could collide when labels repeat. Matches the grouping
  // already used by the washroom-count calculation below.
  const nonGroupCTotals = new Map<string, {
    areaM2: number;
    occupants: number;
    areaPerPerson: number;
    citation: string;
    rooms: Array<{ label: string; areaM2: number }>;
  }>();

  for (let i = 0; i < effectiveRooms.length; i++) {
    const room = effectiveRooms[i];
    if (room.areaM2 === null || room.areaM2 <= 0) continue;

    const accessorySpaceType = inferAccessorySpaceType(room.spaceType, room.label);
    if (accessorySpaceType && !room.manualOverride) {
      continue;
    }

    // Normalize group: "B-1" → "B-1", "B" → "B"
    const group = room.occupancyGroup.trim().toUpperCase();
    if (group === 'C') continue;
    const spec = getDefaultLoadFactor(group);
    const maxOccupants = Math.ceil(room.areaM2 / spec.areaPerPerson);
    totalOccupants += maxOccupants;

    const issueId = `OCC-${String(i + 1).padStart(3, '0')}`;
    occupantLoad.push({
      roomLabel: room.label,
      occupancyGroup: group,
      areaM2: room.areaM2,
      areaM2PerPerson: spec.areaPerPerson,
      maxOccupants,
      nbcRef: spec.citation,
    });

    const groupTotals = nonGroupCTotals.get(group) ?? {
      areaM2: 0,
      occupants: 0,
      areaPerPerson: spec.areaPerPerson,
      citation: spec.citation,
      rooms: [],
    };
    groupTotals.areaM2 += room.areaM2;
    groupTotals.occupants += maxOccupants;
    groupTotals.rooms.push({ label: room.label, areaM2: room.areaM2 });
    nonGroupCTotals.set(group, groupTotals);

    findings.push({
      issueId,
      severity: 'pass',
      description: `Occupant load — ${room.label}`,
      actual: `${room.areaM2.toFixed(1)} m² ÷ ${spec.areaPerPerson} m²/p = ${maxOccupants} persons`,
      required: `Group ${group} conservative default ${spec.areaPerPerson} m²/p`,
      citation: spec.citation,
    });
    passCount++;
  }

  // orchestrator-occupant-load.determination — one candidate per non-Group-C
  // occupancy group present, aggregated (not per-room — see comment above).
  // Accessory rooms excluded by accessoryOccupancyReclassifier never reach
  // nonGroupCTotals, matching the current headline-total behavior.
  for (const [group, totals] of nonGroupCTotals) {
    complianceRequirements.push({
      provisionRef: totals.citation,
      requirementType: 'orchestrator-occupant-load.determination',
      appliesTo: { kind: 'DwellingUnit', id: `project:${input.projectId ?? 'drawing'}:occupant-load:${group}` },
      requiredValue: { value: null, unit: 'persons' },
      actualValue: {
        value: totals.occupants,
        unit: 'persons',
        confirmed: false,
        source: 'derived',
      },
      status: 'insufficient-evidence',
      triggeredBy: [
        { fact: 'occupancyGroup', value: group },
        { fact: 'areaM2', value: totals.areaM2 },
        { fact: 'areaPerPerson', value: totals.areaPerPerson },
        { fact: 'method', value: 'area_factor' },
        { fact: 'needsReview', value: false },
        { fact: 'rooms', value: totals.rooms },
      ],
    });
  }

  for (const room of normalizedRooms) {
    if (room.manualOverride || room.areaM2 === null || room.areaM2 <= 0) continue;
    const accessorySpaceType = inferAccessorySpaceType(room.spaceType, room.label);
    if (!accessorySpaceType) continue;
    const accessoryFactor = getAccessoryLoadFactor(accessorySpaceType, room.occupancyGroup);
    accessoryOccupantLoad.push({
      roomLabel: room.label,
      occupancyGroup: `Accessory (${accessorySpaceType})`,
      areaM2: room.areaM2,
      areaM2PerPerson: accessoryFactor.areaPerPerson,
      maxOccupants: Math.ceil(room.areaM2 / accessoryFactor.areaPerPerson),
      nbcRef: accessoryFactor.citation,
      isAccessory: true,
    });
    findings.push({
      issueId: `OCC-ACCESSORY-${accessoryOccupantLoad.length.toString().padStart(3, '0')}`,
      severity: 'advisory',
      description: `Accessory occupant load — ${room.label}`,
      actual: `${room.areaM2.toFixed(1)} m² ÷ ${accessoryFactor.areaPerPerson} m²/p = ${Math.ceil(room.areaM2 / accessoryFactor.areaPerPerson)} persons (informational)`,
      required: 'Accessory/non-dwelling space is excluded from the primary building occupant total; verify its classification separately',
      citation: accessoryFactor.citation,
    });
    advisoryCount++;
  }

  // ── Washroom counts (NBC 3.7.2.1) ────────────────────────────────────────
  // One calculation per unique occupancy group found in occupant load
  // results. Mixed-use buildings get separate counts per group.
  // Deduplication via groupsSeen prevents double-counting when multiple
  // rooms share the same occupancy group.
  const washroomCounts: WashroomResult[] = [];
  const groupsSeen = new Set<string>();

  for (const ol of occupantLoad) {
    if (ol.needsReview) continue;
    const normalizedGroup = ol.occupancyGroup.replace('-', '');
    if (groupsSeen.has(normalizedGroup)) continue;
    groupsSeen.add(normalizedGroup);

    // Sum all persons across rooms sharing this occupancy group —
    // fixture count is based on total load for the group, not per-room.
    const groupTotalPersons = occupantLoad
      .filter(r => r.occupancyGroup === ol.occupancyGroup)
      .reduce((sum, r) => sum + r.maxOccupants, 0);

    const washroomResult = calculateWashroomRequirements({
      occupancyGroup: normalizedGroup,   // 'A-1' → 'A1', 'B-2' → 'B2'
      occupantLoad: groupTotalPersons,
      sprinklered: input.sprinklered,
      province: input.province ?? 'CA',
      jurisdictionSource: input.jurisdictionSource,
    });
    washroomCounts.push(washroomResult);

    // orchestrator-washroom-count.determination — the FRR fire-separation
    // shape, not the occupancy-fact shape: this IS a code-minimum
    // (NBC 3.7.2.2 fixture count), not just an echoed input fact, so
    // requiredValue carries the computed minimum. actualValue stays null
    // until an as-built fixture count is confirmed from drawings — there
    // is no mechanism for that yet, matching fire-separation's actualValue:
    // null. dependsOnKeys ties this to the occupant-load determination
    // this group total was derived from, using the same nbcRef/appliesTo.id
    // construction the occupant-load candidates used when they were built,
    // so the key matches exactly without re-deriving citation logic here.
    const occupantLoadAppliesToId = ol.occupancyGroup === 'C'
      ? `project:${input.projectId ?? 'drawing'}:occupant-load`
      : `project:${input.projectId ?? 'drawing'}:occupant-load:${ol.occupancyGroup}`;
    const occupantLoadKey = `orchestrator-occupant-load.determination:${ol.nbcRef}:DwellingUnit:${occupantLoadAppliesToId}`;

    complianceRequirements.push({
      provisionRef: washroomResult.nbcRef,
      requirementType: 'orchestrator-washroom-count.determination',
      appliesTo: { kind: 'DwellingUnit', id: `project:${input.projectId ?? 'drawing'}:washroom:${normalizedGroup}` },
      requiredValue: { value: washroomResult.required, unit: 'fixture-requirement' },
      actualValue: null,
      status: 'insufficient-evidence',
      triggeredBy: [
        { fact: 'occupancyGroup', value: normalizedGroup },
        { fact: 'occupantLoad', value: groupTotalPersons },
        { fact: 'sprinklered', value: input.sprinklered },
        { fact: 'province', value: input.province ?? 'CA' },
      ],
      dependsOnKeys: [occupantLoadKey],
    });
  }
  // ── End washroom counts ───────────────────────────────────────────────────

  // ── Barrier-free requirements (NBC Part 3.8) ─────────────────────────────
  const barrierFreeRequirements = calculateBarrierFreeRequirements({
    occupancyGroups: [...new Set(occupantLoad.map(ol => ol.occupancyGroup))],
    storeys: input.storeys,
    totalOccupants: occupantLoad.reduce((sum, ol) => sum + ol.maxOccupants, 0),
    totalAreaM2: effectiveRooms.reduce((sum, r) => sum + (r.areaM2 ?? 0), 0),
    washroomCounts,
    totalDwellingUnits: input.totalDwellingUnits,
    province: input.province ?? 'CA',
    jurisdictionSource: input.jurisdictionSource,
  });
  // ── End barrier-free ──────────────────────────────────────────────────────

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

  for (let i = 0; i < normalizedRooms.length; i++) {
    const room = normalizedRooms[i];
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

    const occupancyAppliesTo = { kind: 'DwellingUnit' as const, id: `project:${input.projectId ?? 'drawing'}:group:${group}` };
    const occupancyKey = `orchestrator-frr.occupancy-fact:NBC 3.1.3.1:DwellingUnit:${occupancyAppliesTo.id}`;
    complianceRequirements.push({
      provisionRef: 'NBC 3.1.3.1',
      requirementType: 'orchestrator-frr.occupancy-fact',
      appliesTo: occupancyAppliesTo,
      requiredValue: { value: group, unit: 'occupancy-group' },
      actualValue: { value: group, confirmed: false, source: 'derived' },
      status: 'insufficient-evidence',
      triggeredBy: [{ fact: 'room.occupancyGroup', value: group }],
    });
    complianceRequirements.push({
      provisionRef: spec.citation,
      requirementType: 'orchestrator-frr.fire-separation',
      appliesTo: { kind: 'DwellingUnit', id: `project:${input.projectId ?? 'drawing'}:group:${group}` },
      requiredValue: { value: spec.frr, unit: 'min' },
      actualValue: null,
      status: 'insufficient-evidence',
      triggeredBy: [
        { fact: 'room.occupancyGroup', value: group },
        { fact: 'frr.lookup', value: spec.frr, factRefId: spec.citation },
      ],
      dependsOnKeys: [occupancyKey],
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

  // ── Garage-specific separation advisory ───────────────────────────────────
  // Adds a garage-specific marker when Phase 1 reclassified a garage into the
  // dwelling-unit total (single-dwelling-unit case only). This is additive and
  // does not replace the generic Group C FRR advisory above.
  let garageAdvisoryIndex = 1;
  for (const item of accessoryAssessments) {
    if (item.decision.action !== 'reclassified') continue;
    if (inferAccessorySpaceType(item.room.spaceType, item.room.label) !== 'garage') continue;

    findings.push({
      issueId: `FRR-GARAGE-${garageAdvisoryIndex++}`,
      severity: 'advisory',
      description: 'Garage-dwelling separation required',
      actual: 'Verify air barrier system and self-closing, weather-stripped, solid-core door on stamped drawings',
      required: 'Air barrier system (NBC 9.10.9.16.(4)) + self-closing, weather-stripped, solid-core door (NBC 9.10.13.15)',
      citation: 'NBC 9.10.9.16 / 9.10.13.15',
    });
    advisoryCount++;
  }

  // ── F3: Stack Planner FRR bridge ────────────────────────────────────────
  // Stack separations from Occupancy Advisor are more accurate than
  // single-group FRR_BY_GROUP — they account for actual floor interfaces.
  // When present, append them to fireSeparation[].
  // Deterministic only — no LLM involvement.
  if (input.stackSeparations && input.stackSeparations.length > 0) {
    for (const sep of input.stackSeparations) {
      fireSeparation.push({
        ruleId: `FS-STACK-${sep.from.replace('/', '_')}-${sep.to.replace('/', '_')}`,
        description: `Floor separation: ${sep.from} above ${sep.to}`,
        requiredFRR: sep.hours * 60,
        citation: sep.nbcRef,
      });

      const stackFactAppliesTo = { kind: 'Wall' as const, id: `stack-fact:${sep.from}->${sep.to}` };
      const stackKey = `orchestrator-frr.stack-fact:${sep.nbcRef}:Wall:${stackFactAppliesTo.id}`;
      complianceRequirements.push({
        provisionRef: sep.nbcRef,
        requirementType: 'orchestrator-frr.stack-fact',
        appliesTo: stackFactAppliesTo,
        requiredValue: { value: sep.frr, unit: 'declared-rating' },
        actualValue: {
          value: sep.frr,
          confirmed: Boolean(input.stackConfirmedAt),
          source: input.stackConfirmedAt ? 'user-confirmed' : 'derived',
        },
        status: sep.needsReview ? 'insufficient-evidence' : 'compliant',
        triggeredBy: [
          { fact: 'stack.from', value: sep.from },
          { fact: 'stack.to', value: sep.to },
        ],
      });
      complianceRequirements.push({
        provisionRef: sep.nbcRef,
        requirementType: 'orchestrator-frr.stack-separation',
        appliesTo: { kind: 'Wall', id: `stack:${sep.from}->${sep.to}` },
        requiredValue: { value: sep.hours * 60, unit: 'min' },
        actualValue: null,
        // No actual/verified FRR value exists yet to compare against requiredValue.
        // Keep this insufficient-evidence until a real actual-FRR input is wired in.
        status: 'insufficient-evidence',
        triggeredBy: [
          { fact: 'stack.from', value: sep.from },
          { fact: 'stack.to', value: sep.to },
          { fact: 'stack.frr', value: sep.frr, factRefId: sep.nbcRef },
        ],
        dependsOnKeys: [stackKey],
      });
    }
  }
  // ── End F3 bridge ────────────────────────────────────────────────────────

  // ── Code conflict detection ─────────────────────────────────────────────
  // Runs last — all other outputs must be fully populated before this call.
  // Cross-checks occupantLoad, travelDistance, fireSeparation,
  // washroomCounts, and constructionTypes for internal contradictions.
  // hasBlockingConflicts: true gates permit package generation.
  // fireSeparation.requiredFRR is number in OrchestratorResult but string
  // in ConflictDetectorInput — cast at call site.
  const codeConflicts = detectCodeConflicts({
    occupantLoad,
    travelDistance,
    fireSeparation: fireSeparation.map(fs => ({
      ...fs,
      requiredFRR: String(fs.requiredFRR),
    })),
    washroomCounts,
    constructionTypes,
    sprinklered: input.sprinklered,
    storeys: input.storeys,
    province: input.province ?? 'CA',
    jurisdictionSource: input.jurisdictionSource,
  });
  // ── End conflict detection ──────────────────────────────────────────────

  // ── CARL permit completeness scoring ─────────────────────────────────────
  // Runs last — requires all other outputs to be complete.
  const summary = {
    totalRooms: normalizedRooms.length,
    totalOccupants,
    passCount,
    failCount,
    advisoryCount,
    calibrationConfidence: input.calibrationConfidence,
    edition,
  };

  const carlReport = scoreCARLItems({
    orchestratorResult: {
      occupantLoad,
      accessoryOccupantLoad,
      egressWindows,
      travelDistance,
      fireSeparation,
      complianceRequirements,
      summary,
      findings,
      washroomCounts,
      barrierFreeRequirements,
      jurisdictionSource: input.jurisdictionSource,
      constructionTypes,
      codeConflicts,
      carlReport: null as unknown as CARLReport,
    },
    projectId: input.projectId ?? null,
    address: input.address ?? null,
    province: input.province ?? 'CA',
    municipality: input.municipality ?? null,
    codeEdition: edition,
    jurisdictionSource: input.jurisdictionSource,
    storeys: input.storeys,
    sprinklered: input.sprinklered,
    barrierFreeRequirements,
  });
  // ── End CARL scoring ──────────────────────────────────────────────────────

  return {
    occupantLoad,
    accessoryOccupantLoad,
    egressWindows,
    travelDistance,
    fireSeparation,
    complianceRequirements,
    summary,
    findings,
    washroomCounts,
    barrierFreeRequirements,
    constructionTypes,
    codeConflicts,
    carlReport,
    jurisdictionSource: input.jurisdictionSource,
  };
}
