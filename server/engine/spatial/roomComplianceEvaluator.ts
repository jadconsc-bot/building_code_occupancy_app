import { Constraints } from '../constraints';
import { buildFederalTrace, computeMargin } from '../types/trace';
import type { ComplianceTrace } from '../types/trace';
import type { DetectedRoom } from './types';
import { getDb } from '../../db';
import { complianceResults, detectedRooms, projects } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

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

export async function evaluateRoomCompliance(
  room: DetectedRoom,
  roomDbId: number,
  projectId: number,
  province: string = 'AB'
): Promise<RoomComplianceResult> {

  const traces: ComplianceTrace[] = [];
  const group = room.occupancyGroup;

  // 1. Occupant load calculation
  const factors = Constraints.occupant_load.factors;
  const factor = factors[group as keyof typeof factors]?.value
    ?? factors['D'].value;
  const occupantLoad = room.areaSqm > 0
    ? Math.ceil(room.areaSqm / factor) : 0;

  traces.push(buildFederalTrace({
    result: 'pass',
    rule: Constraints.occupant_load.factors['D'].ref,
    reasoning: `Occupant load: ${occupantLoad} persons (${room.areaSqm}m² ÷ ${factor}m²/person for Group ${group})`,
    evaluatedInputs: {
      actual: occupantLoad,
      required: 0,
      unit: 'persons'
    },
    severity: 'info',
    constraintId: `occupancy.load_factors.${group}`,
    recommendations: []
  }));

  // 2. Exit count check
  const exitDoors = room.features.filter(
    f => f.type === 'door' || f.type === 'door_fire_rated' || f.type === 'exit_sign'
  );
  const exitCount = exitDoors.length;
  const exitsRequired = occupantLoad > 600 ? 3
    : occupantLoad > 60 ? 2 : 1;
  const exitPass = exitCount >= exitsRequired;

  traces.push(buildFederalTrace({
    result: exitPass ? 'pass'
      : exitCount === 0 ? 'warning'
      : 'fail',
    rule: Constraints.egress.exit_count.threshold_low.ref,
    reasoning: exitPass
      ? `${exitCount} exit(s) detected meets minimum ${exitsRequired} required`
      : exitCount === 0
        ? `No exits detected in drawing — verify exit count manually`
        : `${exitCount} exit(s) detected, ${exitsRequired} required for ${occupantLoad} occupants`,
    evaluatedInputs: {
      actual: exitCount,
      required: exitsRequired,
      unit: 'exits',
      ...computeMargin(exitCount, exitsRequired)
    },
    severity: exitPass ? 'info' : exitCount === 0 ? 'medium' : 'high',
    constraintId: 'egress.exit_count',
    recommendations: exitPass ? [] : [
      `Add ${exitsRequired - exitCount} exit door(s) to Room: ${room.label}`,
      'Ensure exits discharge to exterior or exit stairwell'
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
  const doorWidthMin = Constraints.egress.exit_width.minimum.value; // 860mm
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
      ? `Exit door width not measurable from drawing — manual measurement required`
      : doorWidth >= doorWidthMin
        ? `Exit door width ${doorWidth}mm meets minimum ${doorWidthMin}mm clear width`
        : `Exit door width ${doorWidth}mm is below minimum ${doorWidthMin}mm clear width`,
    evaluatedInputs: {
      actual: doorWidth ?? 'not measured',
      required: doorWidthMin,
      unit: 'mm',
      ...(doorWidth !== null ? computeMargin(doorWidth, doorWidthMin) : {})
    },
    severity: doorWidth === null ? 'info' : doorWidth >= doorWidthMin ? 'info' : 'high',
    constraintId: 'egress.exit_width',
    recommendations: doorWidth === null
      ? ['Measure exit door clear width from architectural drawings — minimum 860mm required']
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
        ? `Corridor width cannot be determined — manual measurement required`
        : estimatedWidthMm >= corrWidthMin
          ? `Estimated corridor width ~${estimatedWidthMm}mm meets minimum ${corrWidthMin}mm (estimated from area + bounding box)`
          : `Estimated corridor width ~${estimatedWidthMm}mm may be below minimum ${corrWidthMin}mm — verify from scaled drawing`,
      evaluatedInputs: {
        actual: estimatedWidthMm ?? 'not measurable',
        required: corrWidthMin,
        unit: 'mm',
        ...(estimatedWidthMm !== null ? computeMargin(estimatedWidthMm, corrWidthMin) : {})
      },
      severity: estimatedWidthMm === null ? 'info' : estimatedWidthMm >= corrWidthMin ? 'info' : 'medium',
      constraintId: 'egress.corridor_width',
      recommendations: (estimatedWidthMm === null || estimatedWidthMm >= corrWidthMin) ? [] : [
        `Verify corridor clear width on scaled drawing — minimum ${corrWidthMin}mm required`,
        'Width estimated from area and bounding box aspect ratio only'
      ]
    }));
  }

  // 7. Fire separation check (mixed occupancy) — queries other rooms in project
  try {
    const db7 = await getDb();
    if (db7) {
      const allRooms = await db7
        .select({ occupancyGroup: detectedRooms.occupancyGroup })
        .from(detectedRooms)
        .where(eq(detectedRooms.projectId, projectId));

      const otherGroups = Array.from(new Set(
        allRooms
          .map(r => r.occupancyGroup)
          .filter((g): g is string => !!g && g !== group)
      ));

      if (otherGroups.length > 0) {
        let separationHr = 0;
        let separationRef = 'NBC 3.3.4.2';

        if (group === 'A' || otherGroups.includes('A')) {
          separationHr = Constraints.fire.separation.assembly_any.value;
          separationRef = Constraints.fire.separation.assembly_any.ref;
        } else if (group === 'B' || otherGroups.includes('B')) {
          separationHr = Constraints.fire.separation.institutional_any.value;
          separationRef = Constraints.fire.separation.institutional_any.ref;
        } else if (
          (group === 'C' && otherGroups.includes('E')) ||
          (group === 'E' && otherGroups.includes('C'))
        ) {
          separationHr = Constraints.fire.separation.residential_mercantile.value;
          separationRef = Constraints.fire.separation.residential_mercantile.ref;
        } else if (
          (group === 'D' && otherGroups.includes('E')) ||
          (group === 'E' && otherGroups.includes('D'))
        ) {
          separationHr = Constraints.fire.separation.office_mercantile.value;
          separationRef = Constraints.fire.separation.office_mercantile.ref;
        }

        if (separationHr > 0) {
          const fireRatedDoors = room.features.filter(f => f.type === 'door_fire_rated');
          const hasSeparation = fireRatedDoors.length > 0;

          traces.push(buildFederalTrace({
            result: hasSeparation ? 'pass' : 'warning',
            rule: separationRef,
            reasoning: hasSeparation
              ? `Fire-rated door(s) detected — ${separationHr}hr separation indicated between Group ${group} and adjacent Group(s) ${otherGroups.join(', ')}`
              : `Mixed occupancy: Group ${group} with Group(s) ${otherGroups.join(', ')} — ${separationHr}hr fire separation required. Cannot confirm from room drawing alone`,
            evaluatedInputs: {
              actual: hasSeparation ? `${fireRatedDoors.length} fire-rated door(s)` : 'not confirmed',
              required: `${separationHr}hr fire separation`,
              unit: 'hr'
            },
            severity: hasSeparation ? 'info' : 'high',
            constraintId: 'fire.separation.mixed_occupancy',
            recommendations: hasSeparation ? [] : [
              `Provide ${separationHr}hr fire-rated separation between Group ${group} and adjacent Group ${otherGroups.join('/')} occupancies`,
              'Verify fire separation assembly in architectural details'
            ]
          }));
        } else {
          traces.push(buildFederalTrace({
            result: 'not_applicable',
            rule: 'NBC 3.3.4.2',
            reasoning: `No specific NBC fire separation table entry for Group ${group} adjacent to Group(s) ${otherGroups.join(', ')} — verify with AHJ`,
            evaluatedInputs: {
              actual: group,
              required: 'see NBC 3.3.4',
              unit: 'occupancy'
            },
            severity: 'info',
            constraintId: 'fire.separation.mixed_occupancy',
            recommendations: []
          }));
        }
      } else {
        traces.push(buildFederalTrace({
          result: 'not_applicable',
          rule: 'NBC 3.3.4.2',
          reasoning: `Single occupancy group (${group}) detected in project — no inter-occupancy fire separation required`,
          evaluatedInputs: {
            actual: group,
            required: 'N/A — single group',
            unit: 'occupancy'
          },
          severity: 'info',
          constraintId: 'fire.separation.mixed_occupancy',
          recommendations: []
        }));
      }
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
    rule: factors[group as keyof typeof factors]?.ref ?? 'NBC Table 3.1.17.1',
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

  // Save all traces to complianceResults table
  await saveTracesToDb(traces, roomDbId, projectId);

  const criticalIssues = traces.filter(
    t => t.result === 'fail' && t.severity === 'critical'
  ).length;

  const overallStatus = criticalIssues > 0 ? 'fail'
    : traces.some(t => t.result === 'fail') ? 'fail'
    : traces.some(t => t.result === 'warning') ? 'warning'
    : 'pass';

  return {
    roomId: roomDbId,
    roomLabel: room.label,
    occupancyGroup: group,
    traces,
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
