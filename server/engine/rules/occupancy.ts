import { ComplianceTrace, buildFederalTrace } from '../types/trace';
import type { ComplianceInput } from '../types/context';
import { getDefaultLoadFactor } from '@shared/occupantLoadFactors';

export function evaluateOccupantLoad(inputs: ComplianceInput): {
  occupantLoad: number;
  trace: ComplianceTrace;
} {
  const group = inputs.occupancy_major?.charAt(0).toUpperCase() ?? 'D';
  const spec = getDefaultLoadFactor(group);
  const area = inputs.area_m2 ?? 0;
  const occupantLoad = area > 0 ? Math.ceil(area / spec.areaPerPerson) : 0;

  return {
    occupantLoad,
    trace: buildFederalTrace({
      result: 'pass',
      rule: spec.citation,
      reasoning: `Occupant load calculated as ${occupantLoad} persons (${area}m² ÷ ${spec.areaPerPerson}m²/person for Group ${group})`,
      evaluatedInputs: {
        actual: occupantLoad,
        required: 0,
        unit: 'persons',
      },
      severity: 'info',
      constraintId: `occupancy.load_factors.${group}`,
      recommendations: [],
    }),
  };
}
