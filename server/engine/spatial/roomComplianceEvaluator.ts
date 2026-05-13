import { Constraints } from '../constraints';
import { buildFederalTrace, computeMargin } from '../types/trace';
import type { ComplianceTrace } from '../types/trace';
import type { DetectedRoom } from './types';
import { getDb } from '../../db';
import { complianceResults } from '../../../drizzle/schema';

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
      : exitCount === 0 ? 'warning' // can't see exits doesn't mean none exist
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
    });
  }
}
