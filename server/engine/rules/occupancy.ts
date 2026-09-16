import { ComplianceTrace, buildFederalTrace } from '../types/trace';
import type { ComplianceInput } from '../types/context';
import { determineOccupantLoad } from '../occupantLoadDetermination';

export function evaluateOccupantLoad(inputs: ComplianceInput): {
  occupantLoad: number;
  needsReview: boolean;
  reasoning: string;
  trace: ComplianceTrace;
} {
  const result = determineOccupantLoad({
    occupancyGroup: inputs.occupancy_major,
    areaM2: inputs.area_m2,
    bedroomCount: inputs.bedroom_count,
    rooms: inputs.rooms,
  });

  return {
    occupantLoad: result.occupantLoad,
    needsReview: result.needsReview,
    reasoning: result.reasoning,
    trace: buildFederalTrace({
      result: result.needsReview ? 'not_applicable' : 'pass',
      rule: result.citation,
      reasoning: result.reasoning,
      evaluatedInputs: { actual: result.occupantLoad, required: 0, unit: 'persons' },
      severity: result.needsReview ? 'high' : 'info',
      constraintId: `occupancy.load_factors.${(inputs.occupancy_major ?? 'D').charAt(0).toUpperCase()}`,
      recommendations: result.needsReview ? ['Enter the total bedroom count across all dwelling units and suites.'] : [],
    }),
  };
}
