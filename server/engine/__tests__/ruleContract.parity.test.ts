import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComplianceEvaluator } from '../../complianceEngine';
import { getDb } from '../../db';
import { getLimits } from '../../services/travelDistanceService';
import { editionForProvince } from '../../rules/overlays/index';
import { Constraints } from '../constraints';
import { ruleResolver } from '../RuleResolver';
import type { ComplianceInput } from '../types/context';
import {
  engineRules, exitWidthRule, travelDistanceRule,
  type EngineRule, type RuleContext,
} from '../rules/ruleContract';

vi.mock('../../db', () => ({
  getDb: vi.fn(() => { throw new Error('Characterization tests must not access the DB'); }),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-06T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  expect(getDb).not.toHaveBeenCalled();
});

async function assertParity(rule: EngineRule, ctx: RuleContext) {
  const result = await new ComplianceEvaluator([], 'soft').evaluate(ctx.inputs);
  const matches = result.traces.filter(trace => rule.constraintIds.includes(trace.constraintId));
  expect(matches).toHaveLength(1);
  const trace = rule.evaluate(ctx);
  expect(trace.constraintId).toBe(matches[0].constraintId);
  expect(trace).toEqual(matches[0]);
  return trace;
}

describe('shadow-mode EngineRule parity', () => {
  // Federal-only inputs have NO province, taking the resolver's no-DB branch.
  it.each([undefined, 800, 849, 850, 851, 1200])('exit width %s mm matches the evaluator trace exactly', async (width) => {
    await assertParity(exitWidthRule, { inputs: { occupancy_major: 'D', exit_width_mm: width } });
  });

  it.each([
    { name: 'F-1 sprinklered at 30m', occupancy_major: 'F-1', travel_distance_m: 30, sprinklers: true },
    { name: 'A unsprinklered at 28m', occupancy_major: 'A', travel_distance_m: 28, sprinklers: false },
    { name: 'D unsprinklered at 35m', occupancy_major: 'D', travel_distance_m: 35, sprinklers: false },
    { name: 'C sprinklered at 40m', occupancy_major: 'C', travel_distance_m: 40, sprinklers: true },
    { name: 'missing distance', occupancy_major: 'D', travel_distance_m: undefined, sprinklers: false },
  ])('travel distance: $name matches the evaluator trace exactly', async ({ name: _name, ...scenario }) => {
    const inputs: ComplianceInput = scenario;
    // Mirrors complianceEngine.ts argument construction; use the real resolver,
    // not a hand-written ResolvedRule or a mock of rule evaluation.
    const { limits: travelDistanceLimits } = getLimits(inputs.occupancy_major ?? null);
    const edition = inputs.codeEdition ?? editionForProvince(inputs.province ?? '');
    const resolved = await ruleResolver.resolveConstraint(
      inputs.sprinklers
        ? Constraints.egress.travel_distance.sprinklered.ref
        : Constraints.egress.travel_distance.unsprinklered.ref,
      inputs.sprinklers
        ? travelDistanceLimits.sprinklered
        : travelDistanceLimits.unsprinklered,
      'm',
      inputs.sprinklers
        ? Constraints.egress.travel_distance.sprinklered.ref
        : Constraints.egress.travel_distance.unsprinklered.ref,
      {
        inputs,
        jurisdiction: {
          province: inputs.province ?? '',
          municipality: inputs.municipality ?? undefined,
          codeEdition: edition,
        },
        mode: 'soft',
      },
    );
    const trace = await assertParity(travelDistanceRule, { inputs, resolved: { travelDistanceRule: resolved } });
    if (inputs.travel_distance_m === undefined) expect(trace.evaluatedInputs.actual).toBe(0);
  });

  it('registers exactly two rules with unique rule and constraint identities', () => {
    expect(engineRules).toHaveLength(2);
    expect(engineRules.map(rule => rule.ruleId)).toEqual(['egress.exit_width', 'egress.travel_distance']);
    expect(new Set(engineRules.map(rule => rule.ruleId)).size).toBe(2);
    expect(engineRules.map(rule => rule.constraintIds)).toEqual([
      ['egress.exit_width.minimum'],
      ['egress.travel_distance.sprinklered', 'egress.travel_distance.unsprinklered'],
    ]);
    const constraintIds = engineRules.flatMap(rule => rule.constraintIds);
    expect(new Set(constraintIds).size).toBe(constraintIds.length);
  });
});
