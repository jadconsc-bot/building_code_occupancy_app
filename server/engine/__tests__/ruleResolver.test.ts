import { describe, it, expect } from 'vitest';
import { RuleResolver } from '../RuleResolver';
import { Constraints } from '../constraints';

/**
 * RuleResolver cascade tests.
 *
 * When context.jurisdiction.province is absent the resolver short-circuits
 * to the federal baseline without hitting the database, making these tests
 * safe to run in unit-test environments with no DB connection.
 */

const federalOnlyContext = {
  inputs: { occupancy_major: 'D' },
  jurisdiction: {
    province: '',       // falsy → no DB lookup → pure federal
    codeEdition: 'NBC 2020',
  },
  mode: 'soft' as const,
};

describe('RuleResolver — 4-layer override cascade', () => {
  it('federal rule: exit width returns 850mm with no overrides', async () => {
    const resolver = new RuleResolver();
    const result = await resolver.resolveConstraint(
      Constraints.egress.exit_width.minimum.ref,
      Constraints.egress.exit_width.minimum.value,
      Constraints.egress.exit_width.minimum.unit,
      Constraints.egress.exit_width.minimum.ref,
      federalOnlyContext,
    );
    expect(result.value).toBe(850);
    expect(result.layer).toBe('federal');
    expect(result.source).toBe('NBC 2020 Federal');
  });

  it('override chain has 4 layers (federal, provincial, municipal, project)', async () => {
    const resolver = new RuleResolver();
    const result = await resolver.resolveConstraint(
      'NBC 3.4.3.4.(1)',
      860, 'mm', 'NBC 3.4.3.4.(1)',
      federalOnlyContext,
    );
    expect(Array.isArray(result.overrideChain)).toBe(true);
    expect(result.overrideChain.length).toBe(4);
    const layers = result.overrideChain.map(e => e.layer);
    expect(layers).toContain('federal');
    expect(layers).toContain('provincial');
    expect(layers).toContain('municipal');
    expect(layers).toContain('project');
  });

  it('federal layer is applied when no province given', async () => {
    const resolver = new RuleResolver();
    const result = await resolver.resolveConstraint(
      'NBC 3.4.6.3.(1)',
      Constraints.egress.stair_width.minimum.value,
      Constraints.egress.stair_width.minimum.unit,
      Constraints.egress.stair_width.minimum.ref,
      federalOnlyContext,
    );
    const fedEntry = result.overrideChain.find(e => e.layer === 'federal');
    expect(fedEntry?.applied).toBe(true);
    expect(fedEntry?.value).toBe(900);
  });

  it('non-federal layers are not applied in federal-only context', async () => {
    const resolver = new RuleResolver();
    const result = await resolver.resolveConstraint(
      'NBC 3.4.3.4.(1)',
      860, 'mm', 'NBC 3.4.3.4.(1)',
      federalOnlyContext,
    );
    const nonFedApplied = result.overrideChain
      .filter(e => e.layer !== 'federal')
      .some(e => e.applied);
    expect(nonFedApplied).toBe(false);
  });

  it('resolves corridor width 1100mm at federal level', async () => {
    const resolver = new RuleResolver();
    const result = await resolver.resolveConstraint(
      'NBC 3.4.1.9.(1)',
      Constraints.egress.corridor_width.minimum.value,
      Constraints.egress.corridor_width.minimum.unit,
      Constraints.egress.corridor_width.minimum.ref,
      federalOnlyContext,
    );
    expect(result.value).toBe(1100);
    expect(result.unit).toBe('mm');
  });

  it('returns ref string unchanged', async () => {
    const resolver = new RuleResolver();
    const ref = 'NBC 3.4.3.4.(1)';
    const result = await resolver.resolveConstraint(
      ref, 860, 'mm', ref,
      federalOnlyContext,
    );
    expect(result.ref).toBe(ref);
  });
});
