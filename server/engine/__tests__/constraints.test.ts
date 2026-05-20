import { describe, it, expect } from 'vitest';
import { Constraints, getConstraint } from '../constraints/index';

describe('NBC Constraints — correct values', () => {
  it('exit door minimum width is 860mm', () => {
    expect(Constraints.egress.exit_width.minimum.value).toBe(860);
    expect(Constraints.egress.exit_width.minimum.unit).toBe('mm');
  });

  it('corridor minimum width is 1100mm', () => {
    expect(Constraints.egress.corridor_width.minimum.value).toBe(1100);
    expect(Constraints.egress.corridor_width.minimum.unit).toBe('mm');
  });

  it('bedroom minimum area for 1 person is 7.0m²', () => {
    expect(Constraints.residential.bedroom_area.minimum_1_person.value).toBe(7.0);
    expect(Constraints.residential.bedroom_area.minimum_1_person.unit).toBe('m2');
  });

  it('accessible units minimum is 15% (0.15 fraction)', () => {
    expect(Constraints.accessibility.units.minimum_percent.value).toBe(0.15);
    expect(Constraints.accessibility.units.minimum_percent.unit).toBe('fraction');
  });

  it('stair minimum width is 900mm', () => {
    expect(Constraints.egress.stair_width.minimum.value).toBe(900);
    expect(Constraints.egress.stair_width.minimum.unit).toBe('mm');
  });

  it('travel distance unsprinklered max is 25m', () => {
    expect(Constraints.egress.travel_distance.unsprinklered.value).toBe(25);
    expect(Constraints.egress.travel_distance.unsprinklered.unit).toBe('m');
  });

  it('travel distance sprinklered max is 45m', () => {
    expect(Constraints.egress.travel_distance.sprinklered.value).toBe(45);
    expect(Constraints.egress.travel_distance.sprinklered.unit).toBe('m');
  });

  it('residential fire separation is 1.0hr', () => {
    expect(Constraints.fire.separation.residential_suite.value).toBe(1.0);
    expect(Constraints.fire.separation.residential_suite.unit).toBe('hr');
  });

  it('Part 9 threshold: max 3 storeys, 600m²', () => {
    expect(Constraints.building_limits.part9_threshold.max_storeys.value).toBe(3);
    expect(Constraints.building_limits.part9_threshold.max_area.value).toBe(600);
  });
});

describe('getConstraint — dot-notation lookup', () => {
  it('retrieves egress exit width by path', () => {
    const c = getConstraint('egress.exit_width.minimum');
    expect(c).toBeDefined();
    expect((c as any).value).toBe(860);
  });

  it('retrieves residential bedroom area by path', () => {
    const c = getConstraint('residential.bedroom_area.minimum_1_person');
    expect(c).toBeDefined();
    expect((c as any).value).toBe(7.0);
  });

  it('returns undefined for non-existent path', () => {
    const c = getConstraint('egress.nonexistent.value');
    expect(c).toBeUndefined();
  });

  it('retrieves deeply nested stair width', () => {
    const c = getConstraint('egress.stair_width.minimum');
    expect((c as any).value).toBe(900);
  });
});
