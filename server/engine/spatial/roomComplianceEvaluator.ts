import { Constraints } from '../constraints';
import { buildFederalTrace, computeMargin } from '../types/trace';
import { getDefaultLoadFactor } from '@shared/occupantLoadFactors';
import {
  ACCESSORY_SPACE_TYPES,
  reclassifyAccessoryOccupancy,
} from './accessoryOccupancyReclassifier';
import type { ComplianceTrace } from '../types/trace';
import type { DetectedRoom } from './types';
import { getDb } from '../../db';
import { complianceResults, detectedRooms, projects } from '../../../drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Feature-to-occupancy scoring rules from the detection spec
const FEATURE_OCCUPANCY_RULES = [
  {
    features: ['kitchen_sink', 'stove', 'toilet', 'bathroom_sink'],
    candidateGroup: 'C',
    baseConfidence: 0.75,
    modifiers: [{ condition: 'multiple_units', delta: 0.20 }]
  },
  {
    features: ['retail_counter', 'reception_desk'],
    candidateGroup: 'E',
    baseConfidence: 0.70,
    modifiers: [{ condition: 'area_gt_200', delta: 0.20 }]
  },
  {
    features: ['lab_bench', 'fume_hood'],
    candidateGroup: 'F',
    baseConfidence: 0.70,
    modifiers: [{ condition: 'fume_hood_count_gte_3', delta: 0.20 }]
  },
  {
    features: ['nursing_station'],
    candidateGroup: 'B',
    baseConfidence: 0.80,
    modifiers: []
  },
  {
    features: ['fixed_seating'],
    candidateGroup: 'A',
    baseConfidence: 0.70,
    modifiers: []
  }
];

export interface RoomComplianceResult {
  roomId: number;
  roomLabel: string;
  occupancyGroup: string;
  traces: ComplianceTrace[];
  overallStatus: 'pass' | 'fail' | 'warning';
  criticalIssues: number;
}

/**
 * Findings this per-room evaluator is allowed to publish.
 *
 * Floor-area and building-level rules (exit count, sprinkler coverage, fire
 * alarms, Part 3/9 applicability, and construction type) are evaluated by the
 * project compliance engine, where the required aggregate inputs exist.  They
 * must not be repeated once per AI-detected room.
 */
export const ROOM_SCOPED_CONSTRAINT_IDS = new Set([
  'occupancy.load_factors',
  'egress.exit_width',
  'egress.corridor_width',
  'fire.separation.mixed_occupancy',
  'accessibility.door_width',
  'occupancy.high_hazard_f1',
  'egress.stair_enclosure',
  'residential.bedroom_area',
  'occupancy.storage_group_c',
]);

export function isRoomScopedConstraint(constraintId: string): boolean {
  return [...ROOM_SCOPED_CONSTRAINT_IDS].some(
    allowed => constraintId === allowed || constraintId.startsWith(`${allowed}.`)
  );
}

function pairFRR(g1: string, g2: string): { hr: number; ref: string } | null {
  const sep = Constraints.fire.separation;
  const b1 = g1.split('-')[0];
  const b2 = g2.split('-')[0];
  if ((g1 === 'F-1' || g2 === 'F-1') && ['A','B','C'].includes(g1 === 'F-1' ? b2 : b1)) return null;
  if (b1 === 'B' || b2 === 'B')
    return { hr: sep.institutional_any.value as number, ref: sep.institutional_any.ref };
  if (b1 === 'A' || b2 === 'A') {
    const nonA = b1 === 'A' ? b2 : b1;
    if (nonA === 'B') return { hr: sep.assembly_institutional.value as number, ref: sep.assembly_institutional.ref };
    if (nonA === 'C') return { hr: sep.assembly_residential.value as number, ref: sep.assembly_residential.ref };
    if (nonA === 'D') return { hr: sep.assembly_business.value as number, ref: sep.assembly_business.ref };
    if (nonA === 'E') return { hr: sep.assembly_mercantile.value as number, ref: sep.assembly_mercantile.ref };
  }
  if ((b1 === 'C' && b2 === 'D') || (b1 === 'D' && b2 === 'C'))
    return { hr: sep.residential_commercial.value as number, ref: sep.residential_commercial.ref };
  if ((b1 === 'C' && b2 === 'E') || (b1 === 'E' && b2 === 'C'))
    return { hr: sep.residential_mercantile.value as number, ref: sep.residential_mercantile.ref };
  if ((g1 === 'F-1' && b2 === 'D') || (g2 === 'F-1' && b1 === 'D'))
    return { hr: sep.high_hazard_business.value as number, ref: sep.high_hazard_business.ref };
  if ((g1 === 'F-1' && b2 === 'E') || (g2 === 'F-1' && b1 === 'E'))
    return { hr: sep.high_hazard_mercantile.value as number, ref: sep.high_hazard_mercantile.ref };
  return null;
}

function determineDominantOccupancyGroup(
  rows: Array<{ occupancyGroup: string | null; spaceType?: string | null }>
): string | null {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const spaceType = row.spaceType?.trim().toLowerCase();
    if (spaceType && ACCESSORY_SPACE_TYPES.includes(spaceType as (typeof ACCESSORY_SPACE_TYPES)[number])) {
      continue;
    }
    const group = row.occupancyGroup?.trim().toUpperCase();
    if (!group) continue;
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
}

/**
 * Rule 7 — Fire separation (adjacency-scoped). Exported for unit testing.
 *
 * @param group            This room's occupancy group
 * @param adjacentRoomIds  null = not yet computed; [] = no neighbours; [...] = has neighbours
 * @param adjacentGroups   Occupancy groups of adjacent rooms that differ from group
 * @param fireRatedDoorCount  Count of fire-rated door features on this room
 */
export function evaluateFireSeparationRule(
  group: string,
  adjacentRoomIds: number[] | null,
  adjacentGroups: string[],
  fireRatedDoorCount: number,
  adjacentLabels: string[] = [],
  roomLabel = 'This room',
): ComplianceTrace {
  if (adjacentRoomIds === null) {
    return buildFederalTrace({
      result: 'warning',
      rule: 'NBC 3.1.3.1 / Table 3.1.3.1',
      reasoning: `Room boundaries are not confirmed — fire separation between occupancies cannot be evaluated without confirmed room geometry`,
      evaluatedInputs: { actual: group, required: 'pending adjacency', unit: 'occupancy' },
      severity: 'medium',
      constraintId: 'fire.separation.mixed_occupancy',
      recommendations: [
        'Run Full Analysis with calibration set to confirm room boundaries and adjacency',
        'Confirm occupancy groups for adjoining rooms on the architectural drawings'
      ]
    });
  }

  if (adjacentRoomIds.length === 0 || adjacentGroups.length === 0) {
    const reason = adjacentRoomIds.length === 0
      ? 'No rooms physically adjacent to this room — inter-occupancy fire separation not applicable'
      : `Adjacent rooms are all Group ${group} — no inter-occupancy fire separation required`;
    return buildFederalTrace({
      result: 'not_applicable',
      rule: 'NBC 3.1.3.1 / Table 3.1.3.1',
      reasoning: reason,
      evaluatedInputs: { actual: group, required: 'N/A', unit: 'occupancy' },
      severity: 'info',
      constraintId: 'fire.separation.mixed_occupancy',
      recommendations: []
    });
  }

  // Check prohibited combinations (NBC 3.1.3.2.(1)) first
  const prohibitedBase = ['A', 'B', 'C'];
  const f1ProhibitedWith = (group === 'F-1')
    ? adjacentGroups.filter(g => prohibitedBase.includes(g.split('-')[0]))
    : adjacentGroups.includes('F-1') && prohibitedBase.includes(group.split('-')[0])
      ? ['F-1']
      : [];

  if (f1ProhibitedWith.length > 0) {
    const pairedWith = group === 'F-1' ? f1ProhibitedWith.join('/') : 'F-1';
    const prohibitedRoom = group === 'F-1' ? roomLabel : (adjacentLabels.join(', ') || 'The adjoining space');
    return buildFederalTrace({
      result: 'fail',
      rule: Constraints.fire.prohibitions.f1_with_abc.ref,
      reasoning: `${prohibitedRoom} (Group F-1, high-hazard industrial) cannot be in the same building as Group ${pairedWith} occupancies. This combination is prohibited — no fire separation can resolve it`,
      evaluatedInputs: {
        actual: `${group} + ${pairedWith}`,
        required: 'Groups F-1 and A/B/C must not be in same building',
        unit: 'occupancy group'
      },
      severity: 'critical',
      constraintId: 'fire.prohibition.f1_with_abc',
      recommendations: [
        'Remove Group F-1 occupancy from this building or relocate it to a separate building',
        'Consult a code consultant before proceeding per NBC 3.1.3.2.(1)'
      ]
    });
  }

  // Look up required FRR for non-prohibited pairs
  let maxFRR: { hr: number; ref: string } | null = null;
  for (const other of adjacentGroups) {
    const r = pairFRR(group, other);
    if (r && r.hr > (maxFRR?.hr ?? 0)) maxFRR = r;
  }

  if (maxFRR && maxFRR.hr > 0) {
    const hasSeparation = fireRatedDoorCount > 0;
    const adjacentDescription = adjacentLabels.length > 0
      ? adjacentLabels.join(', ')
      : 'the adjoining space(s)';
    return buildFederalTrace({
      result: hasSeparation ? 'pass' : 'warning',
      rule: maxFRR.ref,
      reasoning: hasSeparation
        ? `${roomLabel} (Group ${group}) adjoins ${adjacentDescription} (Group ${adjacentGroups.join(', ')}). A ${maxFRR.hr}-hour fire-rated assembly is required; ${fireRatedDoorCount} fire-rated door(s) were detected`
        : `${roomLabel} (Group ${group}) adjoins ${adjacentDescription} (Group ${adjacentGroups.join(', ')}). A ${maxFRR.hr}-hour fire-rated assembly is required between these spaces per NBC Table 3.1.3.1`,
      evaluatedInputs: {
        actual: hasSeparation ? `${fireRatedDoorCount} fire-rated door(s)` : 'not confirmed',
        required: `${maxFRR.hr}hr fire separation`,
        unit: 'hr'
      },
      severity: hasSeparation ? 'info' : 'high',
      constraintId: 'fire.separation.mixed_occupancy',
      recommendations: hasSeparation ? [] : [
        `Show a ${maxFRR.hr}-hour fire-rated assembly between Group ${group} and Group ${adjacentGroups.join('/')} spaces`,
        'Confirm the wall construction and FRR rating on the architectural drawings'
      ]
    });
  }

  return buildFederalTrace({
    result: 'not_applicable',
    rule: 'NBC 3.1.3.1 / Table 3.1.3.1',
    reasoning: `No fire separation required between adjacent Group ${group} and Group(s) ${adjacentGroups.join(', ')} per Table 3.1.3.1`,
    evaluatedInputs: { actual: group, required: 'none required', unit: 'occupancy' },
    severity: 'info',
    constraintId: 'fire.separation.mixed_occupancy',
    recommendations: []
  });
}

export async function evaluateRoomCompliance(
  room: DetectedRoom,
  roomDbId: number,
  projectId: number,
  province: string = 'AB'
): Promise<RoomComplianceResult> {

  const traces: ComplianceTrace[] = [];
  let group = room.occupancyGroup;
  const roomSpaceType = (room as DetectedRoom & { spaceType?: string }).spaceType ?? 'room';
  const roomManualOverride = Boolean((room as DetectedRoom & { manualOverride?: boolean | number }).manualOverride);

  if (!roomManualOverride) {
    try {
      const dbAccessory = await getDb();
      if (dbAccessory) {
        const [projectRow] = await dbAccessory
          .select({ totalDwellingUnits: projects.totalDwellingUnits })
          .from(projects)
          .where(eq(projects.id, projectId))
          .limit(1);

        const projectRooms = await dbAccessory
          .select({
            occupancyGroup: detectedRooms.occupancyGroup,
            spaceType: detectedRooms.spaceType,
          })
          .from(detectedRooms)
          .where(eq(detectedRooms.projectId, projectId));

        const accessoryDecision = reclassifyAccessoryOccupancy({
          occupancyGroup: group,
          spaceType: roomSpaceType,
          dominantOccupancyGroup: determineDominantOccupancyGroup(projectRooms),
          totalDwellingUnits: projectRow?.totalDwellingUnits ?? undefined,
        });

        if (accessoryDecision.action === 'reclassified') {
          group = accessoryDecision.newOccupancyGroup;
        } else if (accessoryDecision.action === 'flagForVerification') {
          traces.push(buildFederalTrace({
            result: 'warning',
            rule: accessoryDecision.citation,
            reasoning: accessoryDecision.reason,
            evaluatedInputs: {
              actual: `${group} / ${roomSpaceType}`,
              required: accessoryDecision.reason,
              unit: 'occupancy group',
            },
            severity: 'medium',
            constraintId: 'occupancy.storage_group_c',
            recommendations: [
              accessoryDecision.reason,
            ],
          }));
        }
      }
    } catch (err) {
      console.error('[RoomCompliance] Accessory occupancy reclassification failed:', err);
    }
  }

  // 1. Occupant load calculation
  const spec = getDefaultLoadFactor(group);
  const occupantLoad = room.areaSqm > 0
    ? Math.ceil(room.areaSqm / spec.areaPerPerson) : 0;

  traces.push(buildFederalTrace({
    result: 'pass',
    rule: spec.citation,
    reasoning: `Occupant load: ${occupantLoad} persons (${room.areaSqm}m² ÷ ${spec.areaPerPerson}m²/person for Group ${group})`,
    evaluatedInputs: {
      actual: occupantLoad,
      required: 0,
      unit: 'persons'
    },
    severity: 'info',
    constraintId: `occupancy.load_factors.${group}`,
    recommendations: []
  }));

  // 2. Exit count check — room-level heuristic only
  // NBC 3.4.2.1 governs exit count at the floor-area level, not per individual room.
  // This function evaluates a single room and cannot reliably determine aggregate
  // floor area, travel distance, or project-level sprinkler status at the point it
  // runs: sibling-room aggregation races concurrent room insertion (this function is
  // called fire-and-forget mid-insertion — see 2026-06-18 recon). The NBC 3.4.2.1.(1)
  // default of 2 exits is therefore applied without attempting the Sentence (2)
  // single-exit exception, which requires floor-area-level inputs. The authoritative
  // floor-area-level exit-count determination is computed by evaluateExitCount in
  // egress.ts via complianceEngine.ts.
  const exitDoors = room.features.filter(
    f => f.type === 'door' || f.type === 'door_fire_rated' || f.type === 'exit_sign'
  );
  const exitCount = exitDoors.length;
  const exitsRequired = 2;
  const exitPass = exitCount >= exitsRequired;

  traces.push(buildFederalTrace({
    result: exitPass ? 'pass' : 'warning',
    rule: 'NBC 3.4.2.1.(1)',
    reasoning: exitPass
      ? `${exitCount} exit-related feature(s) detected in this room — consistent with the NBC 3.4.2.1.(1) default of ≥2 exits per floor area. Note: the single-exit exception (NBC 3.4.2.1.(2)) is not evaluated here; it requires floor-area-level inputs unavailable at per-room granularity.`
      : exitCount === 0
        ? `No exit-related features detected in this room — verify exit count for this floor area manually. NBC 3.4.2.1.(1) requires at least 2 exits per floor area (room-level signal only; floor-area determination requires the Calculations Package).`
        : `${exitCount} exit-related feature(s) detected in this room; at least 2 per floor area required by NBC 3.4.2.1.(1). Room-level signal only — confirm actual floor-area exit count via the Calculations Package.`,
    evaluatedInputs: {
      actual: exitCount,
      required: exitsRequired,
      unit: 'exits',
      ...computeMargin(exitCount, exitsRequired)
    },
    severity: exitPass ? 'info' : 'medium',
    constraintId: 'egress.exit_count',
    recommendations: exitPass ? [] : exitCount === 0 ? [
      'No exits detected — manually verify that the floor area containing this room has at least 2 exits per NBC 3.4.2.1.(1)',
      'Review the Calculations Package for the authoritative floor-area-level exit count determination'
    ] : [
      `Only ${exitCount} exit-related feature(s) detected in this room — confirm the floor area has at least 2 exits total per NBC 3.4.2.1.(1)`,
      'Review the Calculations Package for the authoritative floor-area-level exit count determination'
    ]
  }));

  // 3. Sprinkler requirement check
  const sprinklersRequired = group === 'A' || group === 'B'
    || room.occupancyGroup === 'F-1';
  const sprinklersDetected = room.features.some(
    f => f.type === 'sprinkler_head'
  );
  const sprinklerPass = !sprinklersRequired || sprinklersDetected;

  traces.push(buildFederalTrace({
    result: sprinklerPass ? 'pass'
      : sprinklersRequired && !sprinklersDetected ? 'warning'
      : 'pass',
    rule: Constraints.sprinklers.required_occupancies.group_b1.ref,
    reasoning: sprinklerPass
      ? sprinklersRequired
        ? `Sprinkler heads detected in Group ${group} room — requirement met`
        : `Sprinklers not required for Group ${group} occupancy`
      : `Group ${group} requires sprinklers — none detected in room drawing`,
    evaluatedInputs: {
      actual: sprinklersDetected ? 'detected' : 'not detected',
      required: sprinklersRequired ? 'required' : 'not required',
      unit: 'boolean'
    },
    severity: sprinklerPass ? 'info' : 'critical',
    constraintId: `sprinklers.required_occupancies.group_${group.toLowerCase()}`,
    recommendations: sprinklerPass ? [] : [
      `Install sprinkler system in Group ${group} occupancy area`,
      'Consult mechanical engineer for sprinkler system design'
    ]
  }));

  // 4. Fire alarm check
  const fireAlarmRequired = group === 'A' || group === 'B';
  traces.push(buildFederalTrace({
    result: 'not_applicable',
    rule: 'NBC 3.2.4.7.(1)',
    reasoning: fireAlarmRequired
      ? `Fire alarm required for Group ${group} — verify at building level`
      : `Fire alarm not required for Group ${group}`,
    evaluatedInputs: {
      actual: 'see building-level check',
      required: fireAlarmRequired ? 'required' : 'not required',
      unit: 'boolean'
    },
    severity: 'info',
    constraintId: 'fire.alarm_required',
    recommendations: []
  }));

  // 5. Exit door width check
  const doorWidthMin = Constraints.egress.exit_width.minimum.value; // 850mm
  const doorWithWidth = exitDoors.find(f => {
    const meta = f.metadata as Record<string, unknown> | undefined;
    return typeof meta?.width === 'number' && (meta.width as number) > 0;
  });
  const doorWidth = doorWithWidth
    ? (doorWithWidth.metadata as Record<string, unknown>).width as number
    : null;

  traces.push(buildFederalTrace({
    result: doorWidth === null ? 'not_applicable'
      : doorWidth >= doorWidthMin ? 'pass' : 'fail',
    rule: Constraints.egress.exit_width.minimum.ref,
    reasoning: doorWidth === null
      ? `${exitDoors.length} exit door(s) identified — clear width could not be read from this drawing. Exit doors must open to at least ${doorWidthMin}mm (33½ inches) clear`
      : doorWidth >= doorWidthMin
        ? `${exitDoors.length} exit door(s) identified; the measured clear width is ${doorWidth}mm, at or above the ${doorWidthMin}mm (33½ inch) minimum`
        : `Exit door at ${room.label} measures ${doorWidth}mm — below the ${doorWidthMin}mm (33½ inch) minimum. This must be corrected before permit submission`,
    evaluatedInputs: {
      actual: doorWidth ?? 'not measured',
      required: doorWidthMin,
      unit: 'mm',
      ...(doorWidth !== null ? computeMargin(doorWidth, doorWidthMin) : {})
    },
    severity: doorWidth === null ? 'info' : doorWidth >= doorWidthMin ? 'info' : 'high',
    constraintId: 'egress.exit_width',
    recommendations: doorWidth === null
      ? ['Measure the clear opening on the stamped drawings and confirm before submitting per NBC 3.3.1.13.(1)(a)']
      : doorWidth >= doorWidthMin ? []
      : [`Widen exit door to minimum ${doorWidthMin}mm clear width (current: ${doorWidth}mm)`]
  }));

  // 6. Corridor width check
  const isCorridor = /corridor|hallway|hall\b/i.test(room.label);
  if (isCorridor) {
    const corrWidthMin = Constraints.egress.corridor_width.minimum.value; // 1100mm
    const bbox = room.boundingBox;
    let estimatedWidthMm: number | null = null;

    if (room.areaSqm > 0 && bbox.width > 0 && bbox.height > 0) {
      const minPx = Math.min(bbox.width, bbox.height);
      const maxPx = Math.max(bbox.width, bbox.height);
      const ratio = minPx / maxPx;
      const estimatedWidthM = Math.sqrt(room.areaSqm * ratio);
      estimatedWidthMm = Math.round(estimatedWidthM * 1000);
    }

    traces.push(buildFederalTrace({
      result: estimatedWidthMm === null ? 'not_applicable'
        : estimatedWidthMm >= corrWidthMin ? 'pass' : 'warning',
      rule: Constraints.egress.corridor_width.minimum.ref,
      reasoning: estimatedWidthMm === null
        ? `1 corridor identified — width could not be estimated from the available room geometry. Public corridors must be at least ${corrWidthMin}mm (43 inches) wide`
        : estimatedWidthMm >= corrWidthMin
          ? `Corridor width is estimated at approximately ${estimatedWidthMm}mm, at or above the ${corrWidthMin}mm (43 inch) minimum. This is a geometry estimate, not a measured clear width`
          : `Corridor width is estimated at approximately ${estimatedWidthMm}mm — below the ${corrWidthMin}mm (43 inch) minimum. Confirm the clear width on scaled drawings`,
      evaluatedInputs: {
        actual: estimatedWidthMm ?? 'not measurable',
        required: corrWidthMin,
        unit: 'mm',
        ...(estimatedWidthMm !== null ? computeMargin(estimatedWidthMm, corrWidthMin) : {})
      },
      severity: estimatedWidthMm === null ? 'info' : estimatedWidthMm >= corrWidthMin ? 'info' : 'medium',
      constraintId: 'egress.corridor_width',
      recommendations: estimatedWidthMm === null
        ? ['Confirm the corridor clear width on scaled drawings per NBC 3.3.1.9.(1)']
        : estimatedWidthMm >= corrWidthMin ? [
          'Confirm the geometry estimate by measuring clear width on scaled drawings'
        ] : [
          `Confirm and correct corridor clear width to at least ${corrWidthMin}mm before permit submission`,
          'The displayed width is estimated from room area and bounding-box aspect ratio'
        ]
    }));
  }

  // 7. Fire separation check (adjacent rooms only) — delegates to evaluateFireSeparationRule
  try {
    const db7 = await getDb();
    if (db7) {
      const thisRow = await db7
        .select({ adjacentRoomIds: detectedRooms.adjacentRoomIds })
        .from(detectedRooms)
        .where(eq(detectedRooms.id, roomDbId))
        .limit(1);

      const rawAdj = thisRow[0]?.adjacentRoomIds;
      const adjIds: number[] | null = (rawAdj === null || rawAdj === undefined)
        ? null
        : Array.isArray(rawAdj)
          ? (rawAdj as unknown[]).map(Number)
          : (typeof rawAdj === 'string' ? (JSON.parse(rawAdj) as number[]) : []);

      let adjacentGroups: string[] = [];
      let adjacentLabels: string[] = [];
      if (adjIds && adjIds.length > 0) {
        const adjRooms = await db7
          .select({
            occupancyGroup: detectedRooms.occupancyGroup,
            roomLabel: detectedRooms.roomLabel,
          })
          .from(detectedRooms)
          .where(inArray(detectedRooms.id, adjIds));
        adjacentGroups = Array.from(new Set(
          adjRooms.map(r => r.occupancyGroup).filter((g): g is string => !!g && g !== group)
        ));
        adjacentLabels = adjRooms
          .map(r => r.roomLabel)
          .filter((label): label is string => !!label);
      }

      const fireRatedDoorCount = room.features.filter(f => f.type === 'door_fire_rated').length;
      traces.push(evaluateFireSeparationRule(
        group,
        adjIds,
        adjacentGroups,
        fireRatedDoorCount,
        adjacentLabels,
        room.label,
      ));
    }
  } catch (err) {
    console.error('[RoomCompliance] Rule 7 fire separation query failed:', err);
  }

  // 8. Occupant load vs area plausibility check
  const minAreaByGroup: Record<string, number> = {
    'A': 10,
    'B': 3,
    'C': 20,
    'D': 5,
    'E': 5,
    'F': 10,
  };
  const minPlausibleArea = minAreaByGroup[group] ?? 5;
  const isAreaSuspicious = room.areaSqm > 0 && room.areaSqm < minPlausibleArea;

  traces.push(buildFederalTrace({
    result: isAreaSuspicious ? 'warning' : 'pass',
    rule: spec.citation,
    reasoning: isAreaSuspicious
      ? `Room area ${room.areaSqm}m² appears too small for Group ${group} occupancy (minimum expected ~${minPlausibleArea}m²) — verify occupancy classification or drawing scale`
      : `Room area ${room.areaSqm}m² is plausible for Group ${group} occupancy`,
    evaluatedInputs: {
      actual: room.areaSqm,
      required: minPlausibleArea,
      unit: 'm²',
      ...computeMargin(room.areaSqm, minPlausibleArea)
    },
    severity: isAreaSuspicious ? 'medium' : 'info',
    constraintId: 'occupancy.area_plausibility',
    recommendations: isAreaSuspicious ? [
      `Verify occupancy classification for "${room.label}" — ${room.areaSqm}m² may be too small for Group ${group}`,
      'Check drawing scale and re-measure if necessary'
    ] : []
  }));

  // 9. Accessibility check
  const isAccessibleSpace = /washroom|restroom|toilet|accessible|barrier.free|disability/i.test(room.label)
    || room.features.some(f => f.type === 'toilet' || f.type === 'bathroom_sink');

  if (isAccessibleSpace) {
    const accessDoorMin = Constraints.accessibility.door_width.minimum.value; // 850mm
    const accessDoorFeature = room.features.find(f => {
      const meta = f.metadata as Record<string, unknown> | undefined;
      return (f.type === 'door' || f.type === 'door_fire_rated') && typeof meta?.width === 'number';
    });
    const accessDoorWidth = accessDoorFeature
      ? (accessDoorFeature.metadata as Record<string, unknown>).width as number
      : null;

    traces.push(buildFederalTrace({
      result: accessDoorWidth === null ? 'not_applicable'
        : accessDoorWidth >= accessDoorMin ? 'pass' : 'fail',
      rule: Constraints.accessibility.door_width.minimum.ref,
      reasoning: accessDoorWidth === null
        ? `Accessible space detected — door width not measurable from drawing. Verify minimum ${accessDoorMin}mm clear width`
        : accessDoorWidth >= accessDoorMin
          ? `Door width ${accessDoorWidth}mm meets accessible minimum ${accessDoorMin}mm`
          : `Door width ${accessDoorWidth}mm is below accessible minimum ${accessDoorMin}mm`,
      evaluatedInputs: {
        actual: accessDoorWidth ?? 'not measured',
        required: accessDoorMin,
        unit: 'mm',
        ...(accessDoorWidth !== null ? computeMargin(accessDoorWidth, accessDoorMin) : {})
      },
      severity: accessDoorWidth === null ? 'info' : accessDoorWidth >= accessDoorMin ? 'info' : 'high',
      constraintId: 'accessibility.door_width',
      recommendations: accessDoorWidth !== null && accessDoorWidth < accessDoorMin
        ? [`Widen accessible door to minimum ${accessDoorMin}mm clear width`]
        : accessDoorWidth === null
          ? [`Verify door clear width — minimum ${accessDoorMin}mm required for accessible space`]
          : []
    }));
  }

  // 10. Part 3 vs Part 9 determination
  try {
    const db10 = await getDb();
    let grossFloorArea: number | null = null;
    if (db10) {
      const [proj] = await db10
        .select({ grossFloorArea: projects.grossFloorArea })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      if (proj?.grossFloorArea) {
        grossFloorArea = parseFloat(String(proj.grossFloorArea));
      }
    }

    const part3AreaThreshold = Constraints.building_limits.part3_area_threshold.value;
    const isPart3ByArea = grossFloorArea !== null && grossFloorArea > part3AreaThreshold;

    traces.push(buildFederalTrace({
      result: grossFloorArea === null ? 'not_applicable'
        : isPart3ByArea ? 'warning' : 'pass',
      rule: Constraints.building_limits.part3_area_threshold.ref,
      reasoning: grossFloorArea === null
        ? `Building gross floor area not set — Part 3 vs Part 9 determination requires manual review`
        : isPart3ByArea
          ? `Building GFA ${grossFloorArea}m² exceeds ${part3AreaThreshold}m² Part 9 limit — Part 3 provisions apply to this Group ${group} room`
          : `Building GFA ${grossFloorArea}m² is within Part 9 limits (≤${part3AreaThreshold}m²)`,
      evaluatedInputs: {
        actual: grossFloorArea ?? 'not available',
        required: part3AreaThreshold,
        unit: 'm²',
        ...(grossFloorArea !== null ? computeMargin(grossFloorArea, part3AreaThreshold) : {})
      },
      severity: grossFloorArea === null ? 'info' : isPart3ByArea ? 'high' : 'info',
      constraintId: 'building_limits.part3_determination',
      recommendations: isPart3ByArea
        ? [
            `Part 3 (NBC Division B) provisions apply — Group ${group} room must comply with Part 3 requirements`,
            'Engage licensed architect/engineer for Part 3 compliance review'
          ]
        : grossFloorArea === null
          ? ['Enter building gross floor area in project settings to enable Part 3 vs Part 9 determination']
          : []
    }));
  } catch (err) {
    console.error('[RoomCompliance] Rule 10 Part 3 determination failed:', err);
  }

  // 11. Construction type implication
  const requiresNonCombustible = group === 'A' || group === 'B';
  traces.push(buildFederalTrace({
    result: requiresNonCombustible ? 'warning' : 'not_applicable',
    rule: Constraints.fire.resistance_rating.part3_non_combustible.ref,
    reasoning: requiresNonCombustible
      ? `Group ${group} occupancy requires non-combustible construction with minimum ${Constraints.fire.resistance_rating.part3_non_combustible.value}hr FRR for Part 3 buildings`
      : `Non-combustible construction requirement does not apply to Group ${group} under this rule`,
    evaluatedInputs: {
      actual: 'see structural drawings',
      required: requiresNonCombustible
        ? `${Constraints.fire.resistance_rating.part3_non_combustible.value}hr FRR non-combustible`
        : 'not required',
      unit: 'construction type'
    },
    severity: requiresNonCombustible ? 'high' : 'info',
    constraintId: 'fire.resistance_rating.construction_type',
    recommendations: requiresNonCombustible ? [
      `Verify non-combustible construction for Group ${group} room in structural drawings`,
      `Minimum ${Constraints.fire.resistance_rating.part3_non_combustible.value}hr FRR required for structural members`
    ] : []
  }));

  // 12. High hazard flag (potential F-1)
  if (group === 'F') {
    const hasHighHazardFeatures = room.features.some(
      f => f.type === 'fume_hood' || f.type === 'lab_bench'
    );

    traces.push(buildFederalTrace({
      result: hasHighHazardFeatures ? 'warning' : 'not_applicable',
      rule: Constraints.sprinklers.required_occupancies.group_f1.ref,
      reasoning: hasHighHazardFeatures
        ? `Fume hood/lab bench detected in Group F room "${room.label}" — potential F-1 (High Hazard Industrial). Sprinklers required throughout if F-1 confirmed`
        : `Group F room with no high-hazard features detected — F-1 classification not indicated`,
      evaluatedInputs: {
        actual: hasHighHazardFeatures ? 'fume hood/lab bench present' : 'no high-hazard features',
        required: 'F-1 determination requires hazardous materials assessment',
        unit: 'classification'
      },
      severity: hasHighHazardFeatures ? 'critical' : 'info',
      constraintId: 'occupancy.high_hazard_f1',
      recommendations: hasHighHazardFeatures ? [
        'Verify Group F Division (F-1, F-2, or F-3) with hazardous materials inventory',
        'If F-1: automatic sprinkler system required throughout building',
        'If F-1: 2hr fire separation from all other occupancies required'
      ] : []
    }));
  }

  // 13. Exit stair enclosure check (NBC 3.4.3.1)
  const isStair = /stair|stairwell|stairway/i.test(room.label);
  if (isStair) {
    const hasFireRatedDoor = room.features.some(f => f.type === 'door_fire_rated');
    traces.push(buildFederalTrace({
      result: hasFireRatedDoor ? 'pass' : 'warning',
      rule: 'NBC 3.4.3.1.(1)',
      reasoning: hasFireRatedDoor
        ? `Fire-rated door detected at stair enclosure — exit stair shaft fire separation indicated`
        : `Exit stair "${room.label}" must be enclosed in a fire-rated shaft. Verify fire-rated walls (min 45 min for ≤3 storeys, 1 hr for >3 storeys) and self-closing fire doors at every floor opening`,
      evaluatedInputs: {
        actual: hasFireRatedDoor ? 'fire-rated door detected' : 'fire separation not confirmed',
        required: 'fire-rated enclosure required',
        unit: 'boolean'
      },
      severity: hasFireRatedDoor ? 'info' : 'high',
      constraintId: 'egress.stair_enclosure',
      recommendations: hasFireRatedDoor ? [] : [
        'Enclose exit stair in fire-rated shaft — min 45 min FRR (≤3 storeys) or 1 hr FRR (>3 storeys)',
        'Provide self-closing fire doors at every floor-level opening into the stair shaft',
        'Verify continuity of fire separation from floor slab to underside of floor above'
      ]
    }));
  }

  // 14. Minimum bedroom area (NBC 9.5.2.3)
  const isBedroom = /bedroom|chambre|sleeping room/i.test(room.label);
  if (isBedroom && group === 'C') {
    const minArea = Constraints.residential.bedroom_area.minimum_1_person.value;
    traces.push(buildFederalTrace({
      result: room.areaSqm <= 0 ? 'not_applicable'
        : room.areaSqm >= minArea ? 'pass' : 'fail',
      rule: Constraints.residential.bedroom_area.minimum_1_person.ref,
      reasoning: room.areaSqm <= 0
        ? `Bedroom "${room.label}" — area unavailable, verify minimum ${minArea}m²`
        : room.areaSqm >= minArea
          ? `Bedroom area ${room.areaSqm}m² meets minimum ${minArea}m² (NBC 9.5.2.3)`
          : `Bedroom "${room.label}" area ${room.areaSqm}m² is below minimum ${minArea}m²`,
      evaluatedInputs: {
        actual: room.areaSqm,
        required: minArea,
        unit: 'm²',
        ...computeMargin(room.areaSqm, minArea)
      },
      severity: room.areaSqm > 0 && room.areaSqm < minArea ? 'high' : 'info',
      constraintId: 'residential.bedroom_area',
      recommendations: room.areaSqm > 0 && room.areaSqm < minArea ? [
        `Enlarge bedroom "${room.label}" to minimum ${minArea}m² (current: ${room.areaSqm}m²)`,
        'No dimension in a bedroom may be less than 2000mm (NBC 9.5.2.3)'
      ] : []
    }));
  }

  // 15. Suite-to-suite fire separation requirement (NBC 3.3.4.2.(1))
  // Fires on Group C bedroom rooms to flag the 1-hour inter-suite separation requirement.
  if (isBedroom && group === 'C') {
    try {
      const dbB4 = await getDb();
      if (dbB4) {
        const groupCCount = await dbB4
          .select({ id: detectedRooms.id })
          .from(detectedRooms)
          .where(and(
            eq(detectedRooms.projectId, projectId),
            eq(detectedRooms.occupancyGroup, 'C')
          ));
        if (groupCCount.length > 1) {
          traces.push(buildFederalTrace({
            result: 'warning',
            rule: Constraints.fire.separation.residential_suite.ref,
            reasoning: `Group C multi-suite residential building — 1-hour fire separation required between all dwelling units (${Constraints.fire.separation.residential_suite.ref}). Verify fire-rated wall assemblies between suites from architectural details`,
            evaluatedInputs: {
              actual: 'see architectural details',
              required: `${Constraints.fire.separation.residential_suite.value}hr FRR between suites`,
              unit: 'hr'
            },
            severity: 'high',
            constraintId: 'fire.separation.residential_suite',
            recommendations: [
              'Verify 1-hour fire-rated assemblies between all residential suites (NBC 3.3.3.4)',
              'Fire separation must extend from floor slab to underside of floor above',
              'Fire-rated doors required at any openings in suite separation walls'
            ]
          }));
        }
      }
    } catch (err) {
      console.error('[RoomCompliance] Rule 15 suite separation query failed:', err);
    }
  }

  // 16. Accessible unit count: no federal minimum percentage of dwelling units
  // is mandated by NBC 2020 s.3.8. Accessibility for Group C is governed by
  // 3.8.5 (Adaptable Dwelling Units) and AHJ designation per 3.8.2.3.(2)(l).
  // Provincial percentages (if any) belong in a provincial overlay, not here.

  // 17. Accessory occupancy reclassification is handled above by the shared
  // accessoryOccupancyReclassifier. No storage-only regex remains here.

  // This service runs once per detected room. Keep aggregate floor/building
  // rules in the project compliance engine instead of publishing duplicate,
  // under-informed conclusions for every room.
  const roomScopedTraces = traces.filter(trace => {
    const inScope = isRoomScopedConstraint(trace.constraintId);
    if (!inScope) {
      console.log(
        `[RoomCompliance] Skipped non-room-scoped finding ${trace.constraintId} for "${room.label}"`
      );
    }
    return inScope;
  });

  await saveTracesToDb(roomScopedTraces, roomDbId, projectId);

  const criticalIssues = roomScopedTraces.filter(
    t => t.result === 'fail' && t.severity === 'critical'
  ).length;

  const overallStatus = criticalIssues > 0 ? 'fail'
    : roomScopedTraces.some(t => t.result === 'fail') ? 'fail'
    : roomScopedTraces.some(t => t.result === 'warning') ? 'warning'
    : 'pass';

  return {
    roomId: roomDbId,
    roomLabel: room.label,
    occupancyGroup: group,
    traces: roomScopedTraces,
    overallStatus,
    criticalIssues
  };
}

async function saveTracesToDb(
  traces: ComplianceTrace[],
  roomId: number,
  projectId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const trace of traces) {
    await db.insert(complianceResults).values({
      projectId,
      roomId,
      ruleReference: trace.rule,
      ruleCategory: trace.constraintId.split('.')[0],
      ruleText: trace.reasoning,
      status: trace.result === 'not_applicable' ? 'not_applicable' : trace.result,
      actualValue: String(trace.evaluatedInputs.actual),
      requiredValue: String(trace.evaluatedInputs.required),
      remediationSuggestion: trace.recommendations?.join(' ') ?? null,
      confidence: trace.confidence?.toString() ?? null,
      severity: trace.severity,
      constraintId: trace.constraintId,
      overrideChain: trace.overrideChain
        ? JSON.stringify(trace.overrideChain)
        : null
    });
  }
}
