import { describe, it, expect } from 'vitest';
import { Constraints, getConstraint } from '../constraints/index';

describe('NBC Constraints — correct values', () => {
  it('exit door minimum width is 850mm (NBC 3.3.1.13.(1)(a))', () => {
    expect(Constraints.egress.exit_width.minimum.value).toBe(850);
    expect(Constraints.egress.exit_width.minimum.unit).toBe('mm');
    expect(Constraints.egress.exit_width.minimum.ref).toBe('NBC 3.3.1.13.(1)(a)');
  });

  it('corridor minimum width is 1100mm', () => {
    expect(Constraints.egress.corridor_width.minimum.value).toBe(1100);
    expect(Constraints.egress.corridor_width.minimum.unit).toBe('mm');
  });

  it('bedroom minimum area for 1 person is 7.0m²', () => {
    expect(Constraints.residential.bedroom_area.minimum_1_person.value).toBe(7.0);
    expect(Constraints.residential.bedroom_area.minimum_1_person.unit).toBe('m2');
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

  it('residential suite fire separation is 1.0hr (NBC 3.3.4.2.(1))', () => {
    expect(Constraints.fire.separation.residential_suite.value).toBe(1.0);
    expect(Constraints.fire.separation.residential_suite.unit).toBe('hr');
    expect(Constraints.fire.separation.residential_suite.ref).toBe('NBC 3.3.4.2.(1)');
  });

  it('Part 9 threshold: max 3 storeys, 600m²', () => {
    expect(Constraints.building_limits.part9_threshold.max_storeys.value).toBe(3);
    expect(Constraints.building_limits.part9_threshold.max_area.value).toBe(600);
  });
});

// ── NBC 3.1.3.1 / Table 3.1.3.1 — Inter-occupancy fire separations ───────────
describe('NBC 3.1.3.1 Table 3.1.3.1 — fire separation values (BCBC 2024, code page 3-55)', () => {
  const sep = Constraints.fire.separation;

  // Group A (assembly) pairs — verified from Table 3.1.3.1 rows A-1/A-2/A-3/A-4
  it('A↔B: 2hr (assembly_institutional)', () => {
    expect(sep.assembly_institutional.value).toBe(2.0);
    expect(sep.assembly_institutional.ref).toBe('NBC 3.1.3.1 / Table 3.1.3.1');
  });
  it('A↔C: 1hr (assembly_residential) — NOT 2hr', () => {
    expect(sep.assembly_residential.value).toBe(1.0);
  });
  it('A↔D: 1hr (assembly_business) — NOT 2hr', () => {
    expect(sep.assembly_business.value).toBe(1.0);
  });
  it('A↔E: 2hr (assembly_mercantile)', () => {
    expect(sep.assembly_mercantile.value).toBe(2.0);
  });

  // Group B (institutional)
  it('B↔any: 2hr (institutional_any)', () => {
    expect(sep.institutional_any.value).toBe(2.0);
    expect(sep.institutional_any.ref).toBe('NBC 3.1.3.1 / Table 3.1.3.1');
  });

  // Group C (residential) vs D and E
  it('C↔D: 1hr (residential_commercial)', () => {
    expect(sep.residential_commercial.value).toBe(1.0);
    expect(sep.residential_commercial.ref).toBe('NBC 3.1.3.1 / Table 3.1.3.1');
  });
  it('C↔E: 2hr (residential_mercantile) — corrected from wrong 1hr', () => {
    expect(sep.residential_mercantile.value).toBe(2.0);
    expect(sep.residential_mercantile.ref).toBe('NBC 3.1.3.1 / Table 3.1.3.1');
  });

  // D↔E: no entry (Table 3.1.3.1 shows dash — no requirement)
  it('D↔E: no entry exists (Table 3.1.3.1 dash = no requirement)', () => {
    expect((sep as any).office_mercantile).toBeUndefined();
  });

  // F-1 (high-hazard industrial) pairs
  it('F-1↔D: 3hr (high_hazard_business) — corrected from wrong 2hr', () => {
    expect(sep.high_hazard_business.value).toBe(3.0);
    expect(sep.high_hazard_business.ref).toBe('NBC 3.1.3.1 / Table 3.1.3.1');
  });
  it('F-1↔E: 3hr (high_hazard_mercantile) — corrected from wrong 2hr', () => {
    expect(sep.high_hazard_mercantile.value).toBe(3.0);
    expect(sep.high_hazard_mercantile.ref).toBe('NBC 3.1.3.1 / Table 3.1.3.1');
  });

  // Prohibition — F-1 with A/B/C is not a rating, it is a hard block
  it('F-1+A/B/C prohibition is in fire.prohibitions, not fire.separation', () => {
    expect((sep as any).high_hazard_any).toBeUndefined();
    expect((sep as any).assembly_any).toBeUndefined();
    expect(Constraints.fire.prohibitions.f1_with_abc.ref).toBe('NBC 3.1.3.2.(1)');
  });
});

describe('getConstraint — dot-notation lookup', () => {
  it('retrieves egress exit width by path', () => {
    const c = getConstraint('egress.exit_width.minimum');
    expect(c).toBeDefined();
    expect((c as any).value).toBe(850);
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
