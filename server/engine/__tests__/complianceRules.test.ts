import { describe, it, expect } from 'vitest';
import { evaluateExitWidth, evaluateExitCount, evaluateTravelDistance } from '../rules/egress';
import { evaluateOccupantLoad } from '../rules/occupancy';
import { evaluateSprinklerRequirement, evaluateFireAlarm } from '../rules/fire';
import { Constraints } from '../constraints';

// ── NBC 3.4.3.4 Exit door width ──────────────────────────────────────────────
describe('NBC 3.4.3.4 — Exit door minimum clear width 860mm', () => {
  it('PASS: door width exactly 860mm', () => {
    const result = evaluateExitWidth({ occupancy_major: 'D', exit_width_mm: 860 });
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.margin).toBe(0);
  });

  it('PASS: door width 900mm', () => {
    const result = evaluateExitWidth({ occupancy_major: 'D', exit_width_mm: 900 });
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.margin).toBe(40);
  });

  it('FAIL: door width 800mm', () => {
    const result = evaluateExitWidth({ occupancy_major: 'D', exit_width_mm: 800 });
    expect(result.result).toBe('fail');
    expect(result.severity).toBe('critical');
  });

  it('NOT APPLICABLE: door width not provided', () => {
    const result = evaluateExitWidth({ occupancy_major: 'D' });
    expect(result.result).toBe('not_applicable');
  });
});

// ── NBC 3.4.1.9 Corridor width (constraint value check) ─────────────────────
describe('NBC 3.4.1.9 — Corridor minimum width 1100mm', () => {
  it('constraint value is 1100mm', () => {
    expect(Constraints.egress.corridor_width.minimum.value).toBe(1100);
    expect(Constraints.egress.corridor_width.minimum.unit).toBe('mm');
  });

  it('width 1200mm exceeds minimum — passes constraint check', () => {
    const min = Constraints.egress.corridor_width.minimum.value as number;
    expect(1200 >= min).toBe(true);
  });

  it('width 900mm below minimum — fails constraint check', () => {
    const min = Constraints.egress.corridor_width.minimum.value as number;
    expect(900 >= min).toBe(false);
  });
});

// ── NBC 9.5.2.3 Bedroom area (constraint + evaluateOccupantLoad context) ─────
describe('NBC 9.5.2.3 — Minimum bedroom area 7.0m²', () => {
  it('constraint value is 7.0 m²', () => {
    expect(Constraints.residential.bedroom_area.minimum_1_person.value).toBe(7.0);
  });

  it('PASS: bedroom 11.5m² exceeds minimum', () => {
    const min = Constraints.residential.bedroom_area.minimum_1_person.value as number;
    expect(11.5 >= min).toBe(true);
  });

  it('FAIL: bedroom 5.2m² below minimum', () => {
    const min = Constraints.residential.bedroom_area.minimum_1_person.value as number;
    expect(5.2 >= min).toBe(false);
  });

  it('BOUNDARY: exactly 7.0m² equals minimum (pass)', () => {
    const min = Constraints.residential.bedroom_area.minimum_1_person.value as number;
    expect(7.0 >= min).toBe(true);
    expect(7.0 - min).toBe(0);
  });
});

// ── NBC 3.3.3 Sprinkler / fire separation ────────────────────────────────────
describe('NBC 3.2.5.2 — Sprinkler requirement by occupancy', () => {
  it('WARNING: Group B requires sprinklers — not provided', () => {
    const result = evaluateSprinklerRequirement({ occupancy_major: 'B', sprinklers: false });
    expect(result.result).toBe('fail');
    expect(result.severity).toBe('critical');
  });

  it('PASS: Group B requires sprinklers — provided', () => {
    const result = evaluateSprinklerRequirement({ occupancy_major: 'B', sprinklers: true });
    expect(result.result).toBe('pass');
  });

  it('PASS: Group C — sprinklers not required', () => {
    const result = evaluateSprinklerRequirement({ occupancy_major: 'C', sprinklers: false });
    expect(result.result).toBe('pass');
  });
});

// ── NBC 3.8.3.3 Accessible unit count ────────────────────────────────────────
describe('NBC 3.8.3.3 — Accessible units minimum 15%', () => {
  it('constraint value is 0.15 (fraction) = 15%', () => {
    expect(Constraints.accessibility.units.minimum_percent.value).toBe(0.15);
  });

  it('PASS: 2 accessible units out of 10 (20%) exceeds 15%', () => {
    const minFraction = Constraints.accessibility.units.minimum_percent.value as number;
    const ratio = 2 / 10;
    expect(ratio >= minFraction).toBe(true);
  });

  it('FAIL: 1 accessible unit out of 10 (10%) below 15%', () => {
    const minFraction = Constraints.accessibility.units.minimum_percent.value as number;
    const ratio = 1 / 10;
    expect(ratio >= minFraction).toBe(false);
  });

  it('WARN: 0 accessible units — fails', () => {
    const minFraction = Constraints.accessibility.units.minimum_percent.value as number;
    expect(0 >= minFraction).toBe(false);
  });
});

// ── Exit count ────────────────────────────────────────────────────────────────
describe('NBC 3.4.2.2 — Exit count by occupant load', () => {
  it('PASS: 1 exit sufficient for 50 occupants', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 1 }, 50);
    expect(result.result).toBe('pass');
  });

  it('FAIL: 1 exit insufficient for 200 occupants (requires 2)', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 1 }, 200);
    expect(result.result).toBe('fail');
  });

  it('PASS: 2 exits sufficient for 200 occupants', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 2 }, 200);
    expect(result.result).toBe('pass');
  });

  it('FAIL: 2 exits insufficient for 800 occupants (requires 3)', () => {
    const result = evaluateExitCount({ occupancy_major: 'A', exits: 2 }, 800);
    expect(result.result).toBe('fail');
  });
});

// ── Travel distance ────────────────────────────────────────────────────────────
describe('NBC 3.4.2.5 — Maximum travel distance to exit', () => {
  it('PASS: 20m travel in unsprinklered building (max 25m)', () => {
    const result = evaluateTravelDistance({ occupancy_major: 'D', travel_distance_m: 20, sprinklers: false });
    expect(result.result).toBe('pass');
  });

  it('FAIL: 30m travel in unsprinklered building (max 25m)', () => {
    const result = evaluateTravelDistance({ occupancy_major: 'D', travel_distance_m: 30, sprinklers: false });
    expect(result.result).toBe('fail');
  });

  it('PASS: 30m travel in sprinklered building (max 45m)', () => {
    const result = evaluateTravelDistance({ occupancy_major: 'D', travel_distance_m: 30, sprinklers: true });
    expect(result.result).toBe('pass');
  });
});

// ── Occupant load calculation ─────────────────────────────────────────────────
describe('Occupant load calculation by occupancy group', () => {
  it('Group A: 100m² / 0.65 = 154 persons', () => {
    const { occupantLoad } = evaluateOccupantLoad({ occupancy_major: 'A', area_m2: 100 });
    expect(occupantLoad).toBe(154);
  });

  it('Group C: 186m² / 18.6 = 10 persons', () => {
    const { occupantLoad } = evaluateOccupantLoad({ occupancy_major: 'C', area_m2: 186 });
    expect(occupantLoad).toBe(10);
  });

  it('trace result is always pass (informational)', () => {
    const { trace } = evaluateOccupantLoad({ occupancy_major: 'D', area_m2: 100 });
    expect(trace.result).toBe('pass');
  });
});
