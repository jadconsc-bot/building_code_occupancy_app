import { Constraints } from '../constraints';
import { ComplianceTrace, buildFederalTrace } from '../types/trace';
import type { ComplianceInput } from '../types/context';

export function evaluateSprinklerRequirement(inputs: ComplianceInput): ComplianceTrace {
  const group = inputs.occupancy_major?.charAt(0).toUpperCase() ?? '';

  const required = group === 'A' || group === 'B' || inputs.occupancy_major === 'F-1';
  const provided = inputs.sprinklers === true;
  const pass = !required || provided;

  return buildFederalTrace({
    result: pass ? 'pass' : 'fail',
    rule: Constraints.sprinklers.required_occupancies.group_b1.ref,
    reasoning: pass
      ? required
        ? `Sprinklers provided as required for Group ${group} occupancy`
        : `Sprinklers not required for Group ${group} occupancy`
      : `Sprinkler system required for Group ${group} occupancy but not provided`,
    evaluatedInputs: {
      actual: provided ? 'provided' : 'not provided',
      required: required ? 'required' : 'not required',
      unit: 'boolean',
    },
    severity: pass ? 'info' : 'critical',
    constraintId: `sprinklers.required_occupancies.group_${group.toLowerCase()}`,
    recommendations: pass ? [] : [
      `Install automatic sprinkler system throughout — required for Group ${group} occupancy per NBC 3.2.5.2.(1)`,
      'Consult mechanical engineer for sprinkler system design',
    ],
  });
}

export function evaluateFireAlarm(inputs: ComplianceInput): ComplianceTrace {
  const group = inputs.occupancy_major?.charAt(0).toUpperCase() ?? '';
  const required = group === 'A' || group === 'B';
  const provided = inputs.fire_alarm === true;
  const pass = !required || provided;

  return buildFederalTrace({
    result: pass ? 'pass' : 'fail',
    rule: 'NBC 3.2.4.7.(1)',
    reasoning: pass
      ? required
        ? `Fire alarm provided as required for Group ${group} occupancy`
        : `Fire alarm not required for Group ${group} occupancy`
      : `Fire alarm system required for Group ${group} occupancy but not provided`,
    evaluatedInputs: {
      actual: provided ? 'provided' : 'not provided',
      required: required ? 'required' : 'not required',
      unit: 'boolean',
    },
    severity: pass ? 'info' : 'critical',
    constraintId: 'fire.alarm_required',
    recommendations: pass ? [] : [
      `Install fire alarm system — required for Group ${group} occupancy per NBC 3.2.4.7.(1)`,
    ],
  });
}
