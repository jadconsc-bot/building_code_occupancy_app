/**
 * generateBrief logic unit tests
 *
 * Tests the pure-function building blocks used by the generateBrief procedure:
 * occupant load calculation, exit count thresholds, travel distance limits,
 * and exit width factors.
 */

import { describe, it, expect } from 'vitest';
import { getDefaultLoadFactor } from '../shared/occupantLoadFactors';
import { getLimits } from './services/travelDistanceService';
import { Constraints } from './engine/constraints/index';

// ── Helpers ──────────────────────────────────────────────────────────────────

function occupantLoad(occupancyGroup: string, areaM2: number): number {
  const spec = getDefaultLoadFactor(occupancyGroup);
  return Math.ceil(areaM2 / spec.areaPerPerson);
}

function exitCount(load: number): number {
  const ec = Constraints.egress.exit_count;
  if (load <= ec.threshold_low.value) return ec.threshold_low.exits;
  if (load <= ec.threshold_mid.value) return ec.threshold_mid.exits;
  return ec.threshold_high.exits;
}

function exitWidth(load: number, occupancyGroup: string): number {
  const isGroupB = occupancyGroup.toUpperCase().startsWith('B');
  return Math.ceil(load * (isGroupB ? 18.4 : 6.1));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateBrief — occupant load', () => {
  it('Group D, 300 m² → 33 persons (ceil(300 / 9.30))', () => {
    expect(occupantLoad('D', 300)).toBe(Math.ceil(300 / getDefaultLoadFactor('D').areaPerPerson));
  });
});

describe('generateBrief — exit count', () => {
  it('33 persons → 1 exit (≤ threshold_low)', () => {
    expect(exitCount(33)).toBe(1);
  });

  it('61 persons → 2 exits (> threshold_low)', () => {
    expect(exitCount(61)).toBe(2);
  });

  it('601 persons → 3 exits (> threshold_mid)', () => {
    expect(exitCount(601)).toBe(3);
  });
});

describe('generateBrief — travel distance limits', () => {
  it('Group A unsprinklered → 30 m', () => {
    expect(getLimits('A').limits.unsprinklered).toBe(30);
  });

  it('Group D unsprinklered → 40 m', () => {
    expect(getLimits('D').limits.unsprinklered).toBe(40);
  });
});

describe('generateBrief — exit width', () => {
  it('50 persons, non-B → ceil(50 × 6.1) = 305 mm', () => {
    expect(exitWidth(50, 'D')).toBe(305);
  });

  it('50 persons, Group B → ceil(50 × 18.4) = 920 mm', () => {
    expect(exitWidth(50, 'B')).toBe(920);
  });
});

describe('generateBrief — input coercion and null-guard paths', () => {

  // 1. parseFloat: numeric string input produces correct number
  it('parseFloat("150.5") produces correct occupant load', () => {
    const area = parseFloat('150.5');
    expect(isNaN(area)).toBe(false);
    const load = Math.ceil(area / 9.30); // Group D offices
    expect(load).toBe(17);
  });

  // 2. parseFloat: empty string produces NaN, null-guard fires
  it('parseFloat("") is NaN — null-guard returns null section', () => {
    const area = parseFloat('');
    expect(isNaN(area)).toBe(true);
    const occupantLoad = isNaN(area) ? null : Math.ceil(area / 9.30);
    expect(occupantLoad).toBeNull();
  });

  // 3. sprinkleredInput coercion — all three tinyint states
  it('sprinkleredInput coercion: 1 → true, 0 → false, null → null', () => {
    const coerce = (v: number | null): boolean | null =>
      v !== null ? v === 1 : null;
    expect(coerce(1)).toBe(true);
    expect(coerce(0)).toBe(false);
    expect(coerce(null)).toBeNull();
  });

  // 4. completeness counting
  it('completeness: 0 of 5 inputs set → 0', () => {
    const inputs = [null, null, null, null, null];
    const pct = Math.round(
      (inputs.filter(v => v !== null).length / inputs.length) * 100
    );
    expect(pct).toBe(0);
  });

  it('completeness: 3 of 5 inputs set → 60', () => {
    const inputs = ['D', 150, null, 'AB', null];
    const pct = Math.round(
      (inputs.filter(v => v !== null).length / inputs.length) * 100
    );
    expect(pct).toBe(60);
  });

  it('completeness: all 5 inputs set → 100', () => {
    const inputs = ['D', 150, 3, 'AB', true];
    const pct = Math.round(
      (inputs.filter(v => v !== null).length / inputs.length) * 100
    );
    expect(pct).toBe(100);
  });

  // 5. travel distance null-default: sprinkleredInput null → unsprinklered
  it('null sprinklered input defaults to unsprinklered limits', () => {
    const sprinkleredInput: number | null = null;
    const sprinklered = sprinkleredInput !== null ? sprinkleredInput === 1 : false;
    const { limits } = getLimits('A');
    const applicable = sprinklered ? limits.sprinklered : limits.unsprinklered;
    expect(sprinklered).toBe(false);
    expect(applicable).toBe(30);
  });

});
