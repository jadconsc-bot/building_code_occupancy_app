import type { ComplianceInput } from '../types/context';

export interface GuardHandrailResult {
  guardRequired: boolean;
  minGuardHeight: number;
  maxOpeningSize: number;
  loadRequirement: string;
  handrailRequired: boolean;
  handrailHeight: string;
  compliant: boolean;
  additionalRequirements: string[];
}

function isPart9(inputs: ComplianceInput): boolean {
  return inputs.building_part === 'Part 9';
}

export function evaluateGuardHandrail(inputs: ComplianceInput): GuardHandrailResult {
  const notes: string[] = [];
  const elevation = inputs.guard_elevation_difference_mm;
  const roofAccess = inputs.guard_location_type === 'roof_access';
  // Missing elevation cannot safely prove that a guard is unnecessary.
  const guardRequired = roofAccess || elevation === undefined || elevation >= 600;
  if (elevation === undefined && !roofAccess) {
    notes.push('Guard requirement cannot be confirmed without an elevation difference; treated as required pending verification — NBC 3.3.1.18/9.8.8.1.');
  }

  let minGuardHeight = 1070;
  if (isPart9(inputs)) {
    const lowExterior = inputs.guard_exterior_height_above_grade_m !== undefined
      && inputs.guard_exterior_height_above_grade_m <= 1.8
      && inputs.serves_single_dwelling_unit === true;
    if (inputs.is_within_dwelling_unit_or_secondary_suite === true || lowExterior) minGuardHeight = 900;
  } else if (inputs.building_part === 'Part 3'
    && inputs.guard_location_type === 'exit_stair_ramp'
    && (inputs.guard_exterior_height_above_grade_m ?? 0) > 10) {
    minGuardHeight = 1500;
  } else if (inputs.building_part === undefined) {
    notes.push('Building part was not provided; conservative 1070 mm guard height used pending Part 9/Part 3 confirmation.');
  }

  const loadRequirement = isPart9(inputs)
    ? inputs.is_within_dwelling_unit_or_secondary_suite === true
      ? '0.5 kN/m (dwelling unit guard) — NBC 9.8.8.2'
      : inputs.guard_serves_max_two_dwelling_units === true
        ? '1.0 kN/m (guard serving not more than two dwelling units) — NBC 9.8.8.2'
        : '1.5 kN/m or 1.0 kN concentrated, whichever governs (all other guards) — NBC 9.8.8.2'
    : '0.75 kN/m or 1.0 kN concentrated, whichever governs — NBC 4.1.5.14(1)(c)';
  if (inputs.guard_use_category === undefined) notes.push('Specific guard use category was not provided; conservative default load requirement returned.');

  const stairOrRamp = inputs.guard_location_type === 'exit_stair_ramp';
  let handrailRequired = stairOrRamp;
  const interiorExemption = isPart9(inputs) && inputs.serves_single_dwelling_unit === true
    && inputs.riser_count !== undefined && inputs.riser_count <= 2;
  const rampExemption = isPart9(inputs) && inputs.serves_single_dwelling_unit === true
    && inputs.ramp_rise_mm !== undefined && inputs.ramp_rise_mm <= 400;
  if (interiorExemption) {
    handrailRequired = false;
    notes.push('Handrail exemption applied for an interior dwelling-unit stair with not more than 2 risers — NBC 9.8.7.1(3)(a).');
  } else if (rampExemption) {
    handrailRequired = false;
    notes.push('Handrail exemption applied for a dwelling-unit ramp with rise not more than 400 mm — NBC 9.8.7.1(3)(c).');
  }
  if (handrailRequired) {
    if (inputs.stair_or_ramp_width_mm !== undefined && inputs.stair_or_ramp_width_mm >= 1100) notes.push('Two handrails required — NBC 3.4.6.5(2)(a): stair or ramp is at least 1100 mm wide.');
    if (inputs.is_curved_flight === true) notes.push('Two handrails required for a curved flight — NBC 3.4.6.5(2)(b).');
    notes.push('Handrails must be continuous, graspable, properly extended and returned, with required wall clearance — NBC 3.4.6.5.');
  }
  if (guardRequired) {
    notes.push('Guard openings must not permit passage of the applicable limiting sphere; climbing-resistance and construction-detail provisions also apply — NBC 3.3.1.18/9.8.8.5/9.8.8.6.');
    if (inputs.is_industrial_occupancy === true) notes.push('Industrial-occupancy opening relaxations may apply only under additional conditions not modeled here; verify the applicable NBC exception.');
  }

  const proposed = inputs.proposed_guard_height_mm;
  const compliant = !guardRequired || (proposed !== undefined && proposed >= minGuardHeight);
  return {
    guardRequired,
    minGuardHeight,
    maxOpeningSize: 100,
    loadRequirement,
    handrailRequired,
    handrailHeight: '865-1070mm',
    compliant,
    additionalRequirements: notes,
  };
}
