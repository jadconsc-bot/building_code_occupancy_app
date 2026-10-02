import { describe, expect, it } from 'vitest';
import { ComplianceEvaluator } from '../complianceEngine';

describe('occupancy-aware travel distance in ComplianceEvaluator', () => {
  const evaluate = (occupancy_major: string, travel_distance_m: number, sprinklers: boolean) =>
    new ComplianceEvaluator([], 'soft').evaluate({ occupancy_major, travel_distance_m, sprinklers });

  it('fails sprinklered Group F-1 at 30m because the high-hazard cap remains 25m', async () => {
    const result = await evaluate('F-1', 30, true);
    expect(result.outputs.travel_distance_max).toBe(25);
    expect(result.traces.find(trace => trace.constraintId === 'egress.travel_distance.sprinklered')?.result).toBe('fail');
    expect(result.outputs.compliance_status).toBe('fail');
  });

  it('passes unsprinklered Group A at 28m using the 30m limit', async () => {
    const result = await evaluate('A', 28, false);
    expect(result.outputs.travel_distance_max).toBe(30);
    expect(result.traces.find(trace => trace.constraintId === 'egress.travel_distance.unsprinklered')?.result).toBe('pass');
  });

  it('passes unsprinklered Group D at 35m using the 40m limit', async () => {
    const result = await evaluate('D', 35, false);
    expect(result.outputs.travel_distance_max).toBe(40);
    expect(result.traces.find(trace => trace.constraintId === 'egress.travel_distance.unsprinklered')?.result).toBe('pass');
  });

  it('keeps sprinklered Group C at 40m passing under the 45m limit', async () => {
    const result = await evaluate('C', 40, true);
    expect(result.outputs.travel_distance_max).toBe(45);
    expect(result.traces.find(trace => trace.constraintId === 'egress.travel_distance.sprinklered')?.result).toBe('pass');
  });
});
