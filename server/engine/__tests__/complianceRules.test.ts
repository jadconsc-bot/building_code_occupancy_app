import { describe, it, expect } from 'vitest';
import { evaluateExitWidth, evaluateExitCount, evaluateTravelDistance } from '../rules/egress';
import { evaluateOccupantLoad } from '../rules/occupancy';
import { evaluateSprinklerRequirement, evaluateFireAlarm } from '../rules/fire';
import { Constraints } from '../constraints';

// ── NBC 3.3.1.13.(1)(a) Exit door width ─────────────────────────────────────
describe('NBC 3.3.1.13.(1)(a) — Exit door minimum clear width 850mm', () => {
  it('PASS: door width exactly 850mm', () => {
    const result = evaluateExitWidth({ occupancy_major: 'D', exit_width_mm: 850 });
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.margin).toBe(0);
  });

  it('PASS: door width 900mm', () => {
    const result = evaluateExitWidth({ occupancy_major: 'D', exit_width_mm: 900 });
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.margin).toBe(50);
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

// ── Exit count ────────────────────────────────────────────────────────────────
describe('NBC 3.4.2.1 — Exit count: 2 by default, 1 only via Sentence (2) exception', () => {
  it('PASS: 1 exit — Group D, 50 occupants, no area/travel data (exception may apply; caveats added)', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 1 }, 50);
    expect(result.result).toBe('pass');
  });

  it('FAIL: 1 exit insufficient for 200 occupants (>60 — exception cannot apply; requires 2)', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 1 }, 200);
    expect(result.result).toBe('fail');
    expect(result.evaluatedInputs.required).toBe(2);
  });

  it('PASS: 2 exits sufficient for 200 occupants', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 2 }, 200);
    expect(result.result).toBe('pass');
  });

  // NBC 3.4.2.1 has NO 3-exit tier — >600 persons still requires only 2 exits
  it('PASS: 2 exits sufficient for 800 occupants (no 3-exit tier in NBC 3.4.2.1)', () => {
    const result = evaluateExitCount({ occupancy_major: 'A', exits: 2 }, 800);
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.required).toBe(2);
  });

  // Spec scenario (a): former fake-3-exit trigger, Group C, 825 persons — must require 2, not 3
  it('PASS: 2 exits for 825 occupants Group C, unsprinklered — no 3-exit tier in NBC', () => {
    const result = evaluateExitCount({ occupancy_major: 'C', exits: 2, sprinklers: false }, 825);
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.required).toBe(2);
  });

  // Spec scenario (b): Group D, OL 40, 150m², 20m travel, unsprinklered — qualifies for 1 exit (Table A: 200m²/25m)
  it('PASS: 1 exit — Group D, 40 persons, 150m², 20m travel, unsprinklered (Table A allows 200m²/25m)', () => {
    const result = evaluateExitCount(
      { occupancy_major: 'D', area_m2: 150, travel_distance_m: 20, sprinklers: false, exits: 1 },
      40,
    );
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.required).toBe(1);
  });

  // Spec scenario (c): same but sprinklered — qualifies (Table B: Group D 300m², travel ≤25m)
  it('PASS: 1 exit — Group D, 40 persons, 150m², 20m travel, sprinklered (Table B allows 300m²)', () => {
    const result = evaluateExitCount(
      { occupancy_major: 'D', area_m2: 150, travel_distance_m: 20, sprinklers: true, exits: 1 },
      40,
    );
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.required).toBe(1);
  });

  // Spec scenario (d): Group B, OL 50, 80m², unsprinklered — fails area gate (Table A caps Group B at 75m²)
  it('FAIL: 1 exit — Group B, 50 persons, 80m², unsprinklered — exceeds Table A 75m² limit', () => {
    const result = evaluateExitCount(
      { occupancy_major: 'B', area_m2: 80, travel_distance_m: 8, sprinklers: false, exits: 1 },
      50,
    );
    expect(result.result).toBe('fail');
    expect(result.evaluatedInputs.required).toBe(2);
  });

  // Spec scenario (e): >600 persons — former fake-3-exit tier, now correctly 2
  it('PASS: 2 exits for 650 occupants — former fake-3-exit tier now correctly requires 2', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 2 }, 650);
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.required).toBe(2);
  });

  // Sentence (4): >2 storeys blocks the single-exit exception
  it('FAIL: 1 exit — Group D, 40 persons, all conditions met but 3 storeys blocks single-exit exception', () => {
    const result = evaluateExitCount(
      { occupancy_major: 'D', area_m2: 150, travel_distance_m: 20, sprinklers: false, storeys: 3, exits: 1 },
      40,
    );
    expect(result.result).toBe('fail');
    expect(result.evaluatedInputs.required).toBe(2);
  });

  // Citation must now reference NBC 3.4.2.1, not the old wrong clause
  it('rule citation is NBC 3.4.2.1.(1)', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 2 }, 100);
    expect(result.rule).toBe('NBC 3.4.2.1.(1)');
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
  it('Group A: 100m² / 0.40 = 250 persons (standing space conservative default, NBC 2020 Table 3.1.17.1)', () => {
    const { occupantLoad } = evaluateOccupantLoad({ occupancy_major: 'A', area_m2: 100 });
    expect(occupantLoad).toBe(250);
  });

  it('Group C: 186m² / 4.60 = 41 persons (dormitory conservative default, NBC 2020 Table 3.1.17.1)', () => {
    const { occupantLoad } = evaluateOccupantLoad({ occupancy_major: 'C', area_m2: 186 });
    expect(occupantLoad).toBe(41);
  });

  it('trace result is always pass (informational)', () => {
    const { trace } = evaluateOccupantLoad({ occupancy_major: 'D', area_m2: 100 });
    expect(trace.result).toBe('pass');
  });
});
