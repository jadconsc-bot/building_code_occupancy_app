import { Constraints } from '../constraints';
import { ComplianceTrace, buildFederalTrace } from '../types/trace';
import type { ComplianceInput } from '../types/context';

export function evaluateOccupantLoad(inputs: ComplianceInput): {
  occupantLoad: number;
  trace: ComplianceTrace;
} {
  const group = inputs.occupancy_major?.charAt(0).toUpperCase() ?? 'D';
  const factors = Constraints.occupant_load.factors;
  const factor = (factors[group as keyof typeof factors]?.value ?? factors['D'].value) as number;
  const area = inputs.area_m2 ?? 0;
  const occupantLoad = area > 0 ? Math.ceil(area / factor) : 0;

  return {
    occupantLoad,
    trace: buildFederalTrace({
      result: 'pass',
      rule: Constraints.occupant_load.factors['D'].ref,
      reasoning: `Occupant load calculated as ${occupantLoad} persons (${area}m² ÷ ${factor}m²/person for Group ${group})`,
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
