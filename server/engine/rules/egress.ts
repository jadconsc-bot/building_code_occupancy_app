import { Constraints } from '../constraints';
import { ComplianceTrace, OverrideChainEntry, buildFederalTrace, buildTrace, computeMargin } from '../types/trace';
import type { ComplianceInput } from '../types/context';
import type { ResolvedRule } from '../RuleResolver';

export function evaluateTravelDistance(
  inputs: ComplianceInput,
  resolvedRule?: ResolvedRule,
): ComplianceTrace {
  const sprinklered = !!inputs.sprinklers;
  const constraintId = sprinklered
    ? 'egress.travel_distance.sprinklered'
    : 'egress.travel_distance.unsprinklered';
  const federalRef = sprinklered
    ? Constraints.egress.travel_distance.sprinklered.ref
    : Constraints.egress.travel_distance.unsprinklered.ref;
  const federalMax = sprinklered
    ? Constraints.egress.travel_distance.sprinklered.value as number
    : Constraints.egress.travel_distance.unsprinklered.value as number;

  const ref          = resolvedRule?.ref ?? federalRef;
  const jurisdiction = resolvedRule
    ? (resolvedRule.layer === 'provincial' ? 'Provincial' : 'Federal')
    : 'Federal';
  const source       = resolvedRule?.source ?? 'NBC 2020 Federal';
  const overrideChain: OverrideChainEntry[] = (resolvedRule?.overrideChain as OverrideChainEntry[] | undefined) ?? [
    { layer: 'federal',    source: 'NBC 2020', value: federalMax, applied: true },
    { layer: 'provincial', source: null,        value: null,       applied: false },
    { layer: 'municipal',  source: null,        value: null,       applied: false },
    { layer: 'project',    source: null,        value: null,       applied: false },
  ];

  // Provincial amendment removed this rule
  if (resolvedRule && (resolvedRule.value === 'not_applicable' || resolvedRule.value === 'removed')) {
    return buildTrace({
      result: 'not_applicable',
      rule: ref,
      jurisdiction,
      source,
      reasoning: 'Travel distance requirement removed by provincial amendment',
      evaluatedInputs: { actual: inputs.travel_distance_m ?? 0, required: 0, unit: 'm' },
      severity: 'info',
      constraintId,
      overrideChain,
      recommendations: [],
    });
  }

  const maxTravel = resolvedRule ? Number(resolvedRule.value) : federalMax;
  const actual    = inputs.travel_distance_m ?? 0;
  const pass      = actual <= maxTravel;

  return buildTrace({
    result: pass ? 'pass' : 'fail',
    rule: ref,
    jurisdiction,
    source,
    reasoning: pass
      ? `Travel distance ${actual}m is within the ${maxTravel}m limit`
      : `Travel distance ${actual}m exceeds the ${maxTravel}m maximum`,
    evaluatedInputs: {
      actual,
      required: maxTravel,
      unit: 'm',
      ...computeMargin(actual, maxTravel),
    },
    severity: pass ? 'info' : 'high',
    constraintId,
    overrideChain,
    recommendations: pass ? [] : [
      'Add an additional exit to reduce travel distance',
      'Install sprinkler system to increase maximum travel distance to 45m',
    ],
  });
}

export function evaluateExitCount(
  inputs: ComplianceInput,
  occupantLoad: number,
): ComplianceTrace {
  const low = Constraints.egress.exit_count.threshold_low;
  const mid = Constraints.egress.exit_count.threshold_mid;

  const exitsRequired = occupantLoad > (mid.value as number) ? 3
    : occupantLoad > (low.value as number) ? 2
    : 1;

  const provided = inputs.exits ?? 0;
  const pass = provided >= exitsRequired;

  return buildFederalTrace({
    result: pass ? 'pass' : 'fail',
    rule: low.ref,
    reasoning: pass
      ? `${provided} exit(s) provided meets the ${exitsRequired} required for ${occupantLoad} occupants`
      : `${provided} exit(s) provided is insufficient — ${exitsRequired} required for ${occupantLoad} occupants`,
    evaluatedInputs: {
      actual: provided,
      required: exitsRequired,
      unit: 'exits',
      ...computeMargin(provided, exitsRequired),
    },
    severity: pass ? 'info' : 'high',
    constraintId: 'egress.exit_count',
    recommendations: pass ? [] : [
      `Add ${exitsRequired - provided} additional exit door(s)`,
      'Verify occupant load calculation — reducing floor area may reduce exit requirements',
    ],
  });
}

export function evaluateExitWidth(inputs: ComplianceInput): ComplianceTrace {
  const required = Constraints.egress.exit_width.minimum.value as number;

  if (!inputs.exit_width_mm) {
    return buildFederalTrace({
      result: 'not_applicable',
      rule: Constraints.egress.exit_width.minimum.ref,
      reasoning: 'Exit door width not provided — verify manually per NBC 3.4.3.4.(1)',
      evaluatedInputs: { actual: 'not measured', required, unit: 'mm' },
      severity: 'medium',
      constraintId: 'egress.exit_width.minimum',
      recommendations: ['Verify exit door clear width is minimum 860mm'],
    });
  }

  const actual = inputs.exit_width_mm;
  const pass   = actual >= required;

  return buildFederalTrace({
    result: pass ? 'pass' : 'fail',
    rule: Constraints.egress.exit_width.minimum.ref,
    reasoning: pass
      ? `Exit door width ${actual}mm meets the ${required}mm minimum`
      : `Exit door width ${actual}mm is below the ${required}mm minimum`,
    evaluatedInputs: { actual, required, unit: 'mm', ...computeMargin(actual, required) },
    severity: pass ? 'info' : 'critical',
    constraintId: 'egress.exit_width.minimum',
    recommendations: pass ? [] : [`Widen exit door to minimum ${required}mm clear width per NBC 3.4.3.4.(1)`],
  });
}
