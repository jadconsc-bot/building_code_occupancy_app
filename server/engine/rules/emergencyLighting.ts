import type { ComplianceInput } from '../types/context';

export interface EmergencyLightingResult {
  required: boolean;
  minimumIllumination: number;
  duration: number | 'verify';
  areas: string[];
  additionalRequirements: string[];
  nbcReferences: string[];
}

type TriState = true | false | undefined;
type LightingGroup = 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'B' | 'C' | 'D' | 'E' | 'F-1' | 'F-2' | 'F-3';

function resolveLightingGroup(inputs: ComplianceInput): LightingGroup | null {
  const major = (inputs.occupancy_major ?? '').toUpperCase();
  const division = (inputs.occupancy_division ?? '').toUpperCase();
  if (major === 'F' && ['1', '2', '3'].includes(division)) return `F-${division}` as LightingGroup;
  if (/^A-[1-4]/.test(major)) return major.slice(0, 3) as LightingGroup;
  if (major.startsWith('B')) return 'B';
  if (major.startsWith('C')) return 'C';
  if (major.startsWith('D')) return 'D';
  if (major.startsWith('E')) return 'E';
  if (major.startsWith('F-1')) return 'F-1';
  if (major.startsWith('F-2')) return 'F-2';
  if (major.startsWith('F-3')) return 'F-3';
  return null;
}

export function evaluateEmergencyLighting(
  inputs: ComplianceInput,
  occupantLoad: number,
): EmergencyLightingResult {
  const group = resolveLightingGroup(inputs);
  const areas = ['Exits', 'Principal routes providing access to exit in open floor areas and service rooms'];
  const nbcReferences = ['NBC 3.2.7.3.(1)(a)', 'NBC 3.2.7.3.(1)(b)'];
  const additionalRequirements: string[] = [];

  const clause = (
    value: boolean | undefined,
    label: string,
    reference: string,
    area: string,
  ): TriState => {
    if (value === true) {
      areas.push(area);
      nbcReferences.push(reference);
      return true;
    }
    if (value === undefined) {
      additionalRequirements.push(`${reference} ${label} not provided — condition remains unknown`);
      return undefined;
    }
    return false;
  };

  if (inputs.has_public_corridors === true) {
    areas.push('Corridors used by the public', 'Public corridors');
    nbcReferences.push('NBC 3.2.7.3.(1)(c)', 'NBC 3.2.7.3.(1)(h)');
  } else if (inputs.has_public_corridors === undefined) {
    additionalRequirements.push('NBC 3.2.7.3.(1)(c) and (h) public-corridor status not provided — conditions remain unknown');
  }
  clause(inputs.has_treatment_occupancy_sleeping_corridors, 'treatment-occupancy sleeping-corridor status', 'NBC 3.2.7.3.(1)(d)', 'Corridors serving sleeping rooms in a treatment occupancy');
  if (inputs.has_treatment_occupancy_sleeping_corridors === true) {
    additionalRequirements.push('Treatment occupancy battery-operated emergency lighting must conform to CSA Z32 — NBC 3.2.7.3.(4)');
  }
  clause(inputs.has_care_occupancy_sleeping_corridors, 'care-occupancy sleeping-corridor status', 'NBC 3.2.7.3.(1)(e)', 'Corridors serving sleeping rooms in a care occupancy');
  if (inputs.has_care_occupancy_sleeping_corridors === true) {
    additionalRequirements.push('The individual-suite corridor carve-out in NBC 3.2.7.3.(1)(e) was not modeled; confirm the suite-level condition separately.');
  }
  clause(inputs.has_classrooms, 'classroom-corridor status', 'NBC 3.2.7.3.(1)(f)', 'Corridors serving classrooms');
  clause(inputs.has_underground_walkways, 'underground-walkway status', 'NBC 3.2.7.3.(1)(g)', 'Underground walkways');
  clause(inputs.has_daycare_areas, 'daycare-area status', 'NBC 3.2.7.3.(1)(j)', 'Daycare-centre floor areas where persons are cared for');
  clause(inputs.has_commercial_kitchen, 'commercial-kitchen status', 'NBC 3.2.7.3.(1)(k)', 'Food preparation areas in commercial kitchens');
  clause(inputs.has_multi_person_public_washrooms, 'multi-person public-washroom status', 'NBC 3.2.7.3.(1)(l)', 'Public washrooms equipped to serve more than one person at a time');
  clause(inputs.has_electromagnetic_lock_doors, 'electromagnetic-lock door status', 'NBC 3.2.7.3.(1)(m)', 'Locations with electromagnetic-lock doors');
  clause(inputs.has_universal_washroom_or_accessible_change_space, 'universal-washroom, shower-room, or accessible-change-space status', 'NBC 3.2.7.3.(1)(n)', 'Required universal washrooms, universal shower rooms, and accessible change spaces');
  clause(inputs.has_service_space_3_2_1_1_8, 'service-space status', 'NBC 3.2.7.3.(2)', 'Service spaces referred to by Sentence 3.2.1.1.(8)');

  if (group === 'A-1') {
    areas.push('Floor areas where the public may congregate in Group A, Division 1');
    nbcReferences.push('NBC 3.2.7.3.(1)(i)(i)');
  } else if (group === 'A-2' || group === 'A-3') {
    if (occupantLoad >= 60) {
      areas.push('Floor areas where the public may congregate in Group A, Division 2 or 3');
      nbcReferences.push('NBC 3.2.7.3.(1)(i)(ii)');
    }
  } else if (group === null) {
    additionalRequirements.push('NBC 3.2.7.3.(1)(i) occupancy division not recognized — Group A congregation condition remains unknown');
  }

  additionalRequirements.push('Minimum point illumination must be at least 1 lx — NBC 3.2.7.3.(3)');
  additionalRequirements.push('Emergency power must transfer automatically upon regular-power failure — NBC 3.2.7.4.(1)(b)');
  additionalRequirements.push('Self-contained emergency lighting units must conform to CSA C22.2 No. 141 — NBC 3.2.7.4.(2)');

  let duration: number | 'verify' = 'verify';
  if (inputs.is_within_high_building_scope === true) {
    duration = 120;
    nbcReferences.push('NBC 3.2.7.4.(1)(b)(i)');
  } else if (inputs.is_within_high_building_scope === false && group === 'B') {
    duration = 60;
    nbcReferences.push('NBC 3.2.7.4.(1)(b)(ii)');
  } else if (inputs.is_3_2_2_51_or_60_construction === true) {
    duration = 60;
    nbcReferences.push('NBC 3.2.7.4.(1)(b)(iii)');
  } else if (
    inputs.is_within_high_building_scope === false &&
    group !== null && group !== 'B' &&
    inputs.is_3_2_2_51_or_60_construction === false
  ) {
    duration = 30;
    nbcReferences.push('NBC 3.2.7.4.(1)(b)(iv)');
  } else {
    if (inputs.is_within_high_building_scope === undefined) {
      additionalRequirements.push('NBC 3.2.7.4.(1)(b)(i)/(ii)/(iv) high-building scope was not provided — duration cannot be confirmed.');
    }
    if (inputs.is_3_2_2_51_or_60_construction === undefined) {
      additionalRequirements.push('NBC 3.2.7.4.(1)(b)(iii) construction under Article 3.2.2.51 or 3.2.2.60 was not provided — duration cannot be confirmed.');
    }
    if (group === null) {
      additionalRequirements.push('NBC 3.2.7.4.(1)(b)(ii) occupancy group was not recognized — Group B duration branch cannot be confirmed.');
    }
  }

  return {
    required: true,
    minimumIllumination: 10,
    duration,
    areas,
    additionalRequirements,
    nbcReferences,
  };
}
