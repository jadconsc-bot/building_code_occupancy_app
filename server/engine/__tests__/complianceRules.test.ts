import { describe, it, expect } from 'vitest';
import { evaluateExitWidth, evaluateExitCount, evaluateTravelDistance } from '../rules/egress';
import { evaluateOccupantLoad } from '../rules/occupancy';
import { evaluateSprinklerRequirement, evaluateFireAlarm } from '../rules/fire';
import { evaluateEmergencyLighting } from '../rules/emergencyLighting';
import { evaluateGuardHandrail } from '../rules/guardHandrail';
import { Constraints } from '../constraints';

describe('NBC guard and handrail requirements', () => {
  it('does not require a guard below the 600 mm elevation trigger', () => {
    expect(evaluateGuardHandrail({ occupancy_major: 'C', guard_elevation_difference_mm: 500 }).guardRequired).toBe(false);
  });
  it('fails safe when elevation is missing', () => {
    const result = evaluateGuardHandrail({ occupancy_major: 'C' });
    expect(result.guardRequired).toBe(true);
    expect(result.additionalRequirements.join(' ')).toContain('cannot be confirmed');
  });
  it('uses Part 9 dwelling and Part 3 exit-stair heights', () => {
    expect(evaluateGuardHandrail({ occupancy_major: 'C', building_part: 'Part 9', is_within_dwelling_unit_or_secondary_suite: true }).minGuardHeight).toBe(900);
    expect(evaluateGuardHandrail({ occupancy_major: 'D', building_part: 'Part 9', is_within_dwelling_unit_or_secondary_suite: false }).minGuardHeight).toBe(1070);
    expect(evaluateGuardHandrail({ occupancy_major: 'D', building_part: 'Part 3', guard_location_type: 'exit_stair_ramp', guard_exterior_height_above_grade_m: 12 }).minGuardHeight).toBe(1500);
    expect(evaluateGuardHandrail({ occupancy_major: 'D' }).minGuardHeight).toBe(1070);
  });
  it('returns the corrected handrail range and two-handrail note', () => {
    const result = evaluateGuardHandrail({ occupancy_major: 'D', guard_location_type: 'exit_stair_ramp', stair_or_ramp_width_mm: 1200 });
    expect(result.handrailRequired).toBe(true);
    expect(result.handrailHeight).toBe('865-1070mm');
    expect(result.additionalRequirements.join(' ')).toContain('3.4.6.5(2)(a)');
  });
  it('applies the small interior dwelling-unit stair exemption', () => {
    const result = evaluateGuardHandrail({ occupancy_major: 'C', building_part: 'Part 9', guard_location_type: 'exit_stair_ramp', riser_count: 2, serves_single_dwelling_unit: true });
    expect(result.handrailRequired).toBe(false);
    expect(result.additionalRequirements.join(' ')).toContain('9.8.7.1(3)(a)');
  });
});

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

// ── NBC 3.2.4.1 Fire alarm determination ───────────────────────────────────
describe('NBC 3.2.4.1 — Fire alarm system determination', () => {
  it('requires a fire alarm for a sprinklered building when both exceptions are unknown', () => {
    const result = evaluateFireAlarm({ occupancy_major: 'D', sprinklers: true }, 100);
    expect(result.result).toBe('fail');
    expect(result.rule).toBe('NBC 3.2.4.1');
    expect(result.evaluatedInputs.required).toBe('required');
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations?.[0]).toContain('3.2.4.1.(2)');
    expect(result.recommendations?.[1]).toContain('3.2.4.1.(3)');
  });

  it('does not require an alarm when the NFPA 13D exception is proven', () => {
    const result = evaluateFireAlarm({ occupancy_major: 'C', sprinklers: true, sprinkler_system_type: 'nfpa13d' }, 4);
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.required).toBe('not required');
    expect(result.reasoning).toContain('3.2.4.1.(2)');
  });

  it('requires an alarm for an unsprinklered building over 3 storeys', () => {
    const result = evaluateFireAlarm({
      occupancy_major: 'D', sprinklers: false, storeys: 4,
      contained_use_area: false, impeded_egress_zone: false,
      is_school_college_childcare: false, is_licensed_beverage_or_restaurant: false,
      occupant_load_above_below_first_storey: 0, open_air_seating_below_load: 0,
      is_storage_garage_only: false,
    }, 50);
    expect(result.result).toBe('fail');
    expect(result.reasoning).toContain('3.2.4.1.(4)(c)');
  });

  it('returns needs review when an unsprinklered Group D case has unknown conditions', () => {
    const result = evaluateFireAlarm({ occupancy_major: 'D', sprinklers: false, storeys: 2 }, 250);
    expect(result.result).toBe('not_applicable');
    expect(result.evaluatedInputs.required).toBe('verify');
    for (const sentence of ['(4)(a)', '(4)(b)', '(4)(e)', '(4)(f)', '(4)(g)', '(4)(l)']) {
      expect(result.recommendations?.some(caveat => caveat.includes(sentence))).toBe(true);
    }
  });

  it('requires an alarm for unsprinklered Group F-1 over 25 occupants', () => {
    const result = evaluateFireAlarm({ occupancy_major: 'F-1', sprinklers: false }, 30);
    expect(result.result).toBe('fail');
    expect(result.reasoning).toContain('3.2.4.1.(4)(k)');
  });

  it('requires an alarm for Group C sleeping accommodation over 10 persons', () => {
    const result = evaluateFireAlarm({ occupancy_major: 'C', sprinklers: false, residential_sleeping_capacity: 12 }, 12);
    expect(result.result).toBe('fail');
    expect(result.reasoning).toContain('3.2.4.1.(4)(j)');
  });

  it('applies the residential four-suite exemption only with all other conditions resolved', () => {
    const result = evaluateFireAlarm({
      occupancy_major: 'C', sprinklers: false, storeys: 2,
      contained_use_area: false, impeded_egress_zone: false,
      is_school_college_childcare: false, is_licensed_beverage_or_restaurant: false,
      occupant_load_above_below_first_storey: 0, open_air_seating_below_load: 0,
      is_storage_garage_only: false, residential_suite_count: 3,
      residential_sleeping_capacity: 0,
    }, 8);
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.required).toBe('not required');
    expect(result.reasoning).toContain('3.2.4.1.(5)');
  });
});

describe('NBC 3.2.7.3/3.2.7.4 — Emergency lighting determination', () => {
  it('requires exits/routes and verifies duration when all scope flags are omitted', () => {
    const result = evaluateEmergencyLighting({ occupancy_major: 'D' }, 50);
    expect(result.required).toBe(true);
    expect(result.areas).toEqual([
      'Exits',
      'Principal routes providing access to exit in open floor areas and service rooms',
    ]);
    expect(result.duration).toBe('verify');
    expect(result.additionalRequirements.some(c => c.includes('3.2.7.4.(1)(b)(i)'))).toBe(true);
    expect(result.additionalRequirements.some(c => c.includes('3.2.7.4.(1)(b)(iii)'))).toBe(true);
  });

  it('includes both public-corridor clauses when the flag is true', () => {
    const result = evaluateEmergencyLighting({ occupancy_major: 'D', has_public_corridors: true }, 50);
    expect(result.areas).toContain('Corridors used by the public');
    expect(result.areas).toContain('Public corridors');
    expect(result.nbcReferences).toContain('NBC 3.2.7.3.(1)(c)');
    expect(result.nbcReferences).toContain('NBC 3.2.7.3.(1)(h)');
  });

  it('proves Group A Division 1 congregation areas regardless of load', () => {
    const result = evaluateEmergencyLighting({ occupancy_major: 'A-1' }, 1);
    expect(result.areas).toContain('Floor areas where the public may congregate in Group A, Division 1');
    expect(result.nbcReferences).toContain('NBC 3.2.7.3.(1)(i)(i)');
  });

  it('proves Group A Division 2 congregation false below the threshold', () => {
    const result = evaluateEmergencyLighting({ occupancy_major: 'A-2' }, 40);
    expect(result.areas.some(a => a.includes('Group A, Division 2'))).toBe(false);
    expect(result.nbcReferences).toContain('NBC 3.2.7.3.(1)(a)');
  });

  it('proves Group A Division 3 congregation true at 60 occupants', () => {
    const result = evaluateEmergencyLighting({ occupancy_major: 'A-3' }, 75);
    expect(result.areas).toContain('Floor areas where the public may congregate in Group A, Division 2 or 3');
  });

  it('uses 120 minutes for a building within Subsection 3.2.6 scope', () => {
    expect(evaluateEmergencyLighting({ occupancy_major: 'D', is_within_high_building_scope: true }, 50).duration).toBe(120);
  });

  it('uses 60 minutes for Group B outside the high-building scope', () => {
    expect(evaluateEmergencyLighting({ occupancy_major: 'B-1', is_within_high_building_scope: false }, 50).duration).toBe(60);
  });

  it('uses 30 minutes only when all shorter-duration branches are ruled out', () => {
    expect(evaluateEmergencyLighting({ occupancy_major: 'D', is_within_high_building_scope: false, is_3_2_2_51_or_60_construction: false }, 50).duration).toBe(30);
  });

  it('does not confirm 60 minutes from the construction exception alone when high-building scope is unknown', () => {
    const result = evaluateEmergencyLighting({ occupancy_major: 'D', is_3_2_2_51_or_60_construction: true }, 50);
    expect(result.duration).toBe('verify');
    expect(result.additionalRequirements.some(c => c.includes('construction exception alone'))).toBe(true);
  });

  it('adds CSA Z32 for treatment occupancy sleeping corridors', () => {
    const result = evaluateEmergencyLighting({ occupancy_major: 'B-2', has_treatment_occupancy_sleeping_corridors: true }, 50);
    expect(result.additionalRequirements.some(c => c.includes('CSA Z32'))).toBe(true);
  });
});

// ── Exit count ────────────────────────────────────────────────────────────────
describe('NBC 3.4.2.1 — Exit count: 2 by default, 1 only via Sentence (2) exception', () => {
  it('FAIL: 1 exit — Group D, 50 occupants, no storey/area/travel data (exception cannot be confirmed)', () => {
    const result = evaluateExitCount({ occupancy_major: 'D', exits: 1 }, 50);
    expect(result.result).toBe('fail');
    expect(result.evaluatedInputs.required).toBe(2);
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
      { occupancy_major: 'D', area_m2: 150, travel_distance_m: 20, storeys: 2, sprinklers: false, exits: 1 },
      40,
    );
    expect(result.result).toBe('pass');
    expect(result.evaluatedInputs.required).toBe(1);
  });

  // Spec scenario (c): same but sprinklered — qualifies (Table B: Group D 300m², travel ≤25m)
  it('PASS: 1 exit — Group D, 40 persons, 150m², 20m travel, sprinklered (Table B allows 300m²)', () => {
    const result = evaluateExitCount(
      { occupancy_major: 'D', area_m2: 150, travel_distance_m: 20, storeys: 2, sprinklers: true, exits: 1 },
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

  it('does not apply single-exit exception when occupant load needs review', () => {
    const result = evaluateExitCount({ occupancy_major: 'C', exits: 1 }, 0, true);
    expect(result.result).toBe('not_applicable');
    expect(result.reasoning).toContain('needs review');
  });

  it('Group C without bedroom data requires review instead of area-factor fallback', () => {
    const { occupantLoad } = evaluateOccupantLoad({ occupancy_major: 'C', area_m2: 186 });
    expect(occupantLoad).toBe(0);
    expect(evaluateOccupantLoad({ occupancy_major: 'C', area_m2: 186 }).needsReview).toBe(true);
  });

  it('trace result is always pass (informational)', () => {
    const { trace } = evaluateOccupantLoad({ occupancy_major: 'D', area_m2: 100 });
    expect(trace.result).toBe('pass');
  });
});
