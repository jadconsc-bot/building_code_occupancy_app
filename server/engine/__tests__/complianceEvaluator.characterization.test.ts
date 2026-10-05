import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ComplianceEvaluator, createEvaluator,
  type ComplianceInput, type Condition, type EvaluationResult, type Rule,
} from '../../complianceEngine';
import { getDb } from '../../db';

vi.mock('../../db', () => ({
  getDb: vi.fn(() => { throw new Error('Characterization tests must not access the DB'); }),
}));

// No province: the real resolver short-circuits to federal rules without a DB.
const input: ComplianceInput = {
  occupancy_major: 'D', area_m2: 400, footprint_m2: 400, storeys: 2,
  travel_distance_m: 20, exits: 2, exit_width_mm: 850,
  construction_type: 'non_combustible', sprinklers: false, fire_alarm: true,
  contained_use_area: false, impeded_egress_zone: false,
  is_school_college_childcare: false, is_licensed_beverage_or_restaurant: false,
  occupant_load_above_below_first_storey: 0, open_air_seating_below_load: 0,
  is_storage_garage_only: false,
};

function rule(overrides: Partial<Rule> = {}): Rule {
  return {
    rule_id: 'JSON-A', clause: 'characterization', section: 'characterization',
    description: 'JSON interpreter characterization', conditions: [],
    // This output survives the orchestrator's fixed output projection.
    actions: [{ field: 'sprinklers_required', op: 'SET', value: true }],
    ...overrides,
  };
}

function evaluate(rules: Rule[] = [], overrides: Partial<ComplianceInput> = {}, mode: 'strict' | 'soft' = 'soft') {
  return new ComplianceEvaluator(rules, mode).evaluate({ ...input, ...overrides });
}

function withoutTimestamps(result: EvaluationResult) {
  // Only evaluatedAt and each trace.evaluationTimestamp are excluded.
  const { evaluatedAt, traces, ...rest } = result;
  return { ...rest, traces: traces.map(({ evaluationTimestamp, ...trace }) => trace) };
}

afterEach(() => {
  expect(getDb).not.toHaveBeenCalled();
});

describe('ComplianceEvaluator characterization', () => {
  describe('createEvaluator envelope', () => {
    it.each([
      ['empty object envelope', { rules: [] }],
      ['empty top-level array', []],
    ])('%s still evaluates seven code-defined traces', async (_name, envelope) => {
      const result = await createEvaluator(JSON.stringify(envelope)).evaluate(input);
      expect(result.outputs.sprinklers_required).toBe(false);
      expect(result.traces).toHaveLength(7);
      expect(result.complianceStatus).toBe('compliant');
    });

    it('ignores a populated top-level rule array', async () => {
      // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
      const result = await createEvaluator(JSON.stringify([rule()])).evaluate(input);
      expect(result.outputs.sprinklers_required).toBe(false);
      expect(result.traces).toHaveLength(7);
    });

    it('applies a rule inside the rules object envelope', async () => {
      const result = await createEvaluator(JSON.stringify({ rules: [rule()] })).evaluate(input);
      expect(result.outputs.sprinklers_required).toBe(true);
    });

    it('throws SyntaxError synchronously for malformed JSON', () => {
      expect(() => createEvaluator('{"rules":')).toThrow(SyntaxError);
    });
  });

  describe('condition operators', () => {
    const cases: Array<{ op: Condition['op']; expected: unknown; passing: unknown; failing: unknown }> = [
      { op: '==', expected: 5, passing: 5, failing: '5' },
      { op: '!=', expected: 5, passing: '5', failing: 5 },
      { op: '>', expected: 5, passing: 6, failing: 5 },
      { op: '<', expected: 5, passing: 4, failing: 5 },
      { op: '>=', expected: 5, passing: 5, failing: 4 },
      { op: '<=', expected: 5, passing: 5, failing: 6 },
      { op: 'in', expected: [5, 6], passing: 5, failing: '5' },
      { op: 'contains', expected: 'room', passing: 'bedroom', failing: 'office' },
    ];

    it.each(cases)('$op fires for the passing input and does not fire for the failing input', async ({ op, expected, passing, failing }) => {
      const candidate = rule({ conditions: [{ field: 'probe', op, value: expected }] });
      expect((await evaluate([candidate], { probe: passing })).outputs.sprinklers_required).toBe(true);
      expect((await evaluate([candidate], { probe: failing })).outputs.sprinklers_required).toBe(false);
    });

    it('requires every condition to match', async () => {
      const candidate = rule({ conditions: [
        { field: 'probe', op: '>=', value: 5 },
        { field: 'probe', op: '<=', value: 10 },
      ] });
      expect((await evaluate([candidate], { probe: 7 })).outputs.sprinklers_required).toBe(true);
      expect((await evaluate([candidate], { probe: 11 })).outputs.sprinklers_required).toBe(false);
    });
  });

  describe('actions and ordering', () => {
    it('SET preserves a JSON-assigned exposed output', async () => {
      expect((await evaluate([rule()])).outputs.sprinklers_required).toBe(true);
    });

    it('APPEND initializes an unset output as an array and accumulates in action order', async () => {
      // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
      // Runtime accepts an array even though the public output type says boolean.
      const result = await evaluate([rule({ actions: [
        { field: 'sprinklers_required', op: 'APPEND', value: 'first' },
        { field: 'sprinklers_required', op: 'APPEND', value: 'second' },
      ] })]);
      expect(result.outputs.sprinklers_required).toEqual(['first', 'second']);
    });

    it('INCREMENT starts an unset output at zero and accumulates in action order', async () => {
      // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
      // Runtime accepts a number even though the public output type says boolean.
      const result = await evaluate([rule({ actions: [
        { field: 'sprinklers_required', op: 'INCREMENT', value: 2 },
        { field: 'sprinklers_required', op: 'INCREMENT', value: 3 },
      ] })]);
      expect(result.outputs.sprinklers_required).toBe(5);
    });

    it('later SET wins when two rules touch the same output', async () => {
      const result = await evaluate([
        rule(), rule({ rule_id: 'JSON-B', actions: [{ field: 'sprinklers_required', op: 'SET', value: false }] }),
      ]);
      expect(result.outputs.sprinklers_required).toBe(false);
    });

    it('two rules accumulate INCREMENT on the same output', async () => {
      // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
      const increment = (value: number, rule_id: string) => rule({ rule_id, actions: [{ field: 'sprinklers_required', op: 'INCREMENT', value }] });
      expect((await evaluate([increment(2, 'JSON-A'), increment(3, 'JSON-B')])).outputs.sprinklers_required).toBe(5);
    });

    it('later conditions can read an earlier rule output', async () => {
      const result = await evaluate([
        rule({ actions: [{ field: 'intermediate', op: 'SET', value: 5 }] }),
        rule({ rule_id: 'JSON-B', conditions: [{ field: 'intermediate', op: '==', value: 5 }] }),
      ]);
      expect(result.outputs.sprinklers_required).toBe(true);
      // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
      expect(result.outputs).not.toHaveProperty('intermediate');
    });

    it('unmet conditions leave every returned output unchanged', async () => {
      const baseline = await evaluate();
      const result = await evaluate([rule({ conditions: [{ field: 'storeys', op: '>', value: 10 }] })]);
      expect(result.outputs).toEqual(baseline.outputs);
    });

    it('derived outputs overwrite JSON SET on occupant_load', async () => {
      // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
      const result = await evaluate([rule({ actions: [{ field: 'occupant_load', op: 'SET', value: 999 }] })]);
      expect(result.outputs.occupant_load).toBe(87);
    });
  });

  it('does not return the JSON loop ruleTrace or legacy rule_trace', async () => {
    // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
    const result = await evaluate([rule()]);
    expect(result.outputs.sprinklers_required).toBe(true);
    expect(result).not.toHaveProperty('ruleTrace');
    expect(result).not.toHaveProperty('rule_trace');
    expect(result.traces).toHaveLength(7);
    expect(result.traces.some(trace => trace.rule === 'JSON-A' || trace.constraintId === 'JSON-A')).toBe(false);
  });

  describe('strict and soft aggregate status', () => {
    it('noncritical failure is conditional in soft mode and non_compliant in strict mode', async () => {
      const soft = await evaluate([], { travel_distance_m: 41 }, 'soft');
      const strict = await evaluate([], { travel_distance_m: 41 }, 'strict');
      expect(soft.complianceStatus).toBe('conditional');
      expect(strict.complianceStatus).toBe('non_compliant');
      expect(soft.outputs.compliance_status).toBe('fail');
      expect(strict.outputs).toEqual(soft.outputs);
      const { complianceStatus: _softStatus, ...softRest } = withoutTimestamps(soft);
      const { complianceStatus: _strictStatus, ...strictRest } = withoutTimestamps(strict);
      expect(strictRest).toEqual(softRest);
    });

    it('missing required area does not throw or prevent compliant status in either mode', async () => {
      // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
      // Router validation is separate; ComplianceEvaluator does not enforce it.
      const soft = await evaluate([], { area_m2: undefined }, 'soft');
      const strict = await evaluate([], { area_m2: undefined }, 'strict');
      expect(soft.complianceStatus).toBe('compliant');
      expect(strict.complianceStatus).toBe('compliant');
      expect(soft.outputs.occupant_load).toBe(0);
      expect(soft.outputs.compliance_status).toBe('pass');
      expect(withoutTimestamps(strict)).toEqual(withoutTimestamps(soft));
    });

    it('critical exit-width failure is non_compliant in both modes while legacy status passes', async () => {
      // CHARACTERIZATION: current behavior, possible defect — see Sprint C notes
      for (const mode of ['soft', 'strict'] as const) {
        const result = await evaluate([], { exit_width_mm: 800 }, mode);
        expect(result.complianceStatus).toBe('non_compliant');
        expect(result.outputs.compliance_status).toBe('pass');
        expect(result.summary).toEqual({ passed: 6, failed: 1, warnings: 0, critical: 1 });
      }
    });
  });

  describe('exit width', () => {
    it.each([
      { width: 800, result: 'fail', severity: 'critical', margin: -50 },
      { width: 850, result: 'pass', severity: 'info', margin: 0 },
      { width: undefined, result: 'not_applicable', severity: 'medium', margin: undefined },
    ])('$width mm yields $result / $severity with margin $margin', async ({ width, result, severity, margin }) => {
      const evaluation = await evaluate([], { exit_width_mm: width });
      const trace = evaluation.traces.find(t => t.constraintId === 'egress.exit_width.minimum');
      expect(trace).toMatchObject({ result, severity });
      expect(trace?.evaluatedInputs.required).toBe(850);
      expect(trace?.evaluatedInputs.margin).toBe(margin);
    });
  });

  it('returns the full public result contract and seven expected trace identities', async () => {
    const result = await evaluate();
    expect(Object.keys(result).sort()).toEqual([
      'codeEdition', 'complianceStatus', 'engineVersion', 'evaluatedAt',
      'jurisdictionApplied', 'jurisdictionSource', 'outputs', 'overallScore', 'summary', 'traces',
    ].sort());
    expect(result.outputs).toEqual({
      occupant_load: 87, occupant_load_needs_review: false,
      occupant_load_reasoning: expect.any(String), exits_required: 2,
      travel_distance_max: 40, fire_resistance_rating: '1hr',
      compliance_status: 'pass', sprinklers_required: false,
    });
    expect(result).toMatchObject({
      complianceStatus: 'compliant', overallScore: 100, engineVersion: '1.0',
      jurisdictionApplied: 'NBC 2020 Federal', codeEdition: 'NBC 2020', jurisdictionSource: undefined,
      summary: { passed: 7, failed: 0, warnings: 0, critical: 0 },
    });
    expect(Number.isNaN(Date.parse(result.evaluatedAt))).toBe(false);
    expect(result.traces.map(({ constraintId, result, severity }) => ({ constraintId, result, severity }))).toEqual([
      { constraintId: 'occupancy.load_factors.D', result: 'pass', severity: 'info' },
      { constraintId: 'building_limits.part9_threshold.max_area', result: 'pass', severity: 'info' },
      { constraintId: 'sprinklers.required_occupancies.group_d', result: 'pass', severity: 'info' },
      { constraintId: 'fire.alarm_required', result: 'pass', severity: 'info' },
      { constraintId: 'egress.exit_count', result: 'pass', severity: 'info' },
      { constraintId: 'egress.travel_distance.unsprinklered', result: 'pass', severity: 'info' },
      { constraintId: 'egress.exit_width.minimum', result: 'pass', severity: 'info' },
    ]);
    for (const trace of result.traces) {
      expect(trace).toMatchObject({
        rule: expect.any(String), jurisdiction: 'Federal', source: expect.any(String),
        reasoning: expect.any(String), evaluationTimestamp: expect.any(String),
        evaluatedInputs: { actual: expect.anything(), required: expect.anything(), unit: expect.any(String) },
        overrideChain: expect.any(Array), recommendations: expect.any(Array),
      });
      expect(trace.overrideChain.map(entry => entry.layer)).toEqual(['federal', 'provincial', 'municipal', 'project']);
      expect(Number.isNaN(Date.parse(trace.evaluationTimestamp))).toBe(false);
    }
  });

  it('passes through supplied jurisdictionSource', async () => {
    expect((await evaluate([], { jurisdictionSource: 'manual' })).jurisdictionSource).toBe('manual');
  });

  it('is deeply deterministic after excluding only result and trace timestamps', async () => {
    expect(withoutTimestamps(await evaluate([rule()]))).toEqual(withoutTimestamps(await evaluate([rule()])));
  });
});
