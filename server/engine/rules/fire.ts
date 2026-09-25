import { Constraints } from '../constraints';
import { ComplianceTrace, buildFederalTrace } from '../types/trace';
import type { ComplianceInput } from '../types/context';

export function evaluateSprinklerRequirement(inputs: ComplianceInput): ComplianceTrace {
  const group = inputs.occupancy_major?.charAt(0).toUpperCase() ?? '';

  const required = group === 'A' || group === 'B' || inputs.occupancy_major === 'F-1';
  const provided = inputs.sprinklers === true;
  const pass = !required || provided;

  return buildFederalTrace({
    result: pass ? 'pass' : 'fail',
    rule: Constraints.sprinklers.required_occupancies.group_b1.ref,
    reasoning: pass
      ? required
        ? `Sprinklers provided as required for Group ${group} occupancy`
        : `Sprinklers not required for Group ${group} occupancy`
      : `Sprinkler system required for Group ${group} occupancy but not provided`,
    evaluatedInputs: {
      actual: provided ? 'provided' : 'not provided',
      required: required ? 'required' : 'not required',
      unit: 'boolean',
    },
    severity: pass ? 'info' : 'critical',
    constraintId: `sprinklers.required_occupancies.group_${group.toLowerCase()}`,
    recommendations: pass ? [] : [
      `Install automatic sprinkler system throughout — required for Group ${group} occupancy per NBC 3.2.5.2.(1)`,
      'Consult mechanical engineer for sprinkler system design',
    ],
  });
}

type FireAlarmGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F-1' | 'F-2' | 'F-3';
type TriState = true | false | undefined;

function resolveFireAlarmGroup(inputs: ComplianceInput): FireAlarmGroup | null {
  const major = (inputs.occupancy_major ?? '').toUpperCase();
  const division = (inputs.occupancy_division ?? '').toUpperCase();
  if (major === 'F' && ['1', '2', '3'].includes(division)) return `F-${division}` as FireAlarmGroup;
  if (major.startsWith('F-1')) return 'F-1';
  if (major.startsWith('F-2')) return 'F-2';
  if (major.startsWith('F-3')) return 'F-3';
  if (major.startsWith('A')) return 'A';
  if (major.startsWith('B')) return 'B';
  if (major.startsWith('C')) return 'C';
  if (major.startsWith('D')) return 'D';
  if (major.startsWith('E')) return 'E';
  return null;
}

/** NBC 2020 Division B, Article 3.2.4.1. */
export function evaluateFireAlarm(inputs: ComplianceInput, occupantLoad: number): ComplianceTrace {
  const group = resolveFireAlarmGroup(inputs);
  const caveats: string[] = [];
  let required: true | false | undefined;
  let basis = '';

  if (inputs.sprinklers === undefined) {
    required = undefined;
    basis = 'Fire alarm requirement cannot be determined because sprinkler status was not provided';
    caveats.push('NBC 3.2.4.1: sprinkler status not provided — neither the sprinklered nor unsprinklered branch can be evaluated');
  } else if (inputs.sprinklers) {
    // Sentence (1), with the two explicit exceptions in Sentences (2) and (3).
    const nfpa13d: TriState = inputs.sprinkler_system_type === undefined
      ? undefined
      : inputs.sprinkler_system_type === 'nfpa13d';
    const fewerThanNine: TriState = inputs.sprinkler_count === undefined
      ? undefined
      : inputs.sprinkler_count < 9;
    if (nfpa13d === true) {
      caveats.push("NBC 3.2.4.1.(2)/(3)/(6): this exception's conformance to its referenced sub-clause was taken as given from the input, not independently verified");
      required = false;
      basis = 'Fire alarm not required — NBC 3.2.4.1.(2): NFPA 13D sprinkler system exception';
    } else if (fewerThanNine === true) {
      caveats.push("NBC 3.2.4.1.(2)/(3)/(6): this exception's conformance to its referenced sub-clause was taken as given from the input, not independently verified");
      required = false;
      basis = 'Fire alarm not required — NBC 3.2.4.1.(3): fewer than 9 qualifying sprinklers';
    } else {
      required = true;
      basis = 'Fire alarm required — NBC 3.2.4.1.(1): building is sprinklered and no exception was proven';
      if (nfpa13d === undefined) caveats.push('NBC 3.2.4.1.(2): sprinkler system type not provided — NFPA 13D exception could not be confirmed');
      if (fewerThanNine === undefined) caveats.push('NBC 3.2.4.1.(3): sprinkler count not provided — fewer-than-9-sprinklers exception could not be confirmed');
    }
  } else {
    // Sentence (4): every condition is tri-state. Unknown never becomes false.
    const condition = (value: boolean | undefined, label: string): TriState => {
      if (value === undefined) {
        caveats.push(`${label} not provided — condition remains unknown`);
        return undefined;
      }
      return value;
    };
    const conditions: Array<{ sentence: string; value: TriState; description: string }> = [
      { sentence: '3.2.4.1.(4)(a)', value: condition(inputs.contained_use_area, 'NBC 3.2.4.1.(4)(a) contained-use area'), description: 'contained-use area' },
      { sentence: '3.2.4.1.(4)(b)', value: condition(inputs.impeded_egress_zone, 'NBC 3.2.4.1.(4)(b) impeded-egress zone'), description: 'impeded-egress zone' },
      { sentence: '3.2.4.1.(4)(c)', value: inputs.storeys === undefined ? (caveats.push('NBC 3.2.4.1.(4)(c): storey count not provided — condition remains unknown'), undefined) : inputs.storeys > 3, description: 'more than 3 storeys' },
      { sentence: '3.2.4.1.(4)(d)', value: occupantLoad > 300, description: 'total occupant load more than 300' },
      { sentence: '3.2.4.1.(4)(e)', value: inputs.occupant_load_above_below_first_storey === undefined ? (caveats.push('NBC 3.2.4.1.(4)(e): occupant load above or below the first storey not provided — condition remains unknown'), undefined) : inputs.occupant_load_above_below_first_storey > 150, description: 'occupant load more than 150 above or below the first storey' },
      { sentence: '3.2.4.1.(4)(f)', value: inputs.is_school_college_childcare === undefined ? (caveats.push('NBC 3.2.4.1.(4)(f): school, college, or child-care status not provided — condition remains unknown'), undefined) : inputs.is_school_college_childcare && occupantLoad > 40, description: 'school, college, or child-care facility with occupant load more than 40' },
      { sentence: '3.2.4.1.(4)(g)', value: inputs.is_licensed_beverage_or_restaurant === undefined ? (caveats.push('NBC 3.2.4.1.(4)(g): licensed beverage-establishment or restaurant status not provided — condition remains unknown'), undefined) : inputs.is_licensed_beverage_or_restaurant && occupantLoad > 150, description: 'licensed beverage establishment or restaurant with occupant load more than 150' },
      { sentence: '3.2.4.1.(4)(h)', value: group === null ? (caveats.push('NBC 3.2.4.1.(4)(h): occupancy group not recognized — low-hazard industrial condition remains unknown'), undefined) : group !== 'F-3' ? false : inputs.occupant_load_above_below_first_storey === undefined ? (caveats.push('NBC 3.2.4.1.(4)(h): occupant load above or below the first storey not provided — low-hazard industrial condition remains unknown'), undefined) : inputs.occupant_load_above_below_first_storey > 75, description: 'low-hazard industrial occupancy with occupant load more than 75 above or below the first storey' },
      { sentence: '3.2.4.1.(4)(i)', value: group === null ? (caveats.push('NBC 3.2.4.1.(4)(i): occupancy group not recognized — medium-hazard industrial condition remains unknown'), undefined) : group !== 'F-2' ? false : inputs.occupant_load_above_below_first_storey === undefined ? (caveats.push('NBC 3.2.4.1.(4)(i): occupant load above or below the first storey not provided — medium-hazard industrial condition remains unknown'), undefined) : inputs.occupant_load_above_below_first_storey > 75, description: 'medium-hazard industrial occupancy with occupant load more than 75 above or below the first storey' },
      { sentence: '3.2.4.1.(4)(j)', value: group !== 'C' ? (group === null ? (caveats.push('NBC 3.2.4.1.(4)(j): occupancy group not recognized — residential sleeping-accommodation condition remains unknown'), undefined) : false) : inputs.residential_sleeping_capacity !== undefined ? inputs.residential_sleeping_capacity > 10 : inputs.bedroom_count !== undefined ? (caveats.push('NBC 3.2.4.1.(4)(j): residential sleeping capacity not provided — bedroom count used as an explicit approximation'), inputs.bedroom_count > 10) : (caveats.push('NBC 3.2.4.1.(4)(j): residential sleeping capacity not provided — condition remains unknown'), undefined), description: 'residential occupancy with sleeping accommodation for more than 10 persons' },
      { sentence: '3.2.4.1.(4)(k)', value: group === null ? (caveats.push('NBC 3.2.4.1.(4)(k): occupancy group not recognized — high-hazard industrial condition remains unknown'), undefined) : group === 'F-1' ? occupantLoad > 25 : false, description: 'high-hazard industrial occupancy with occupant load more than 25' },
      { sentence: '3.2.4.1.(4)(l)', value: inputs.open_air_seating_below_load === undefined ? (caveats.push('NBC 3.2.4.1.(4)(l): occupant load below an open-air seating area not provided — condition remains unknown'), undefined) : inputs.open_air_seating_below_load > 300, description: 'occupant load more than 300 below an open-air seating area' },
    ];

    const provenCondition = conditions.find(c => c.value === true);
    const unknownCondition = conditions.some(c => c.value === undefined);
    const residentialException = group === 'C'
      ? inputs.residential_suite_count === undefined && inputs.residential_direct_exterior_egress === undefined
        ? (caveats.push('NBC 3.2.4.1.(5): residential suite count and direct-exterior-egress status not provided — residential exemption cannot be confirmed'), undefined)
        : inputs.residential_suite_count !== undefined && inputs.residential_suite_count <= 4 || inputs.residential_direct_exterior_egress === true
      : false;
    const storageGarageException = inputs.is_storage_garage_only === undefined
      ? (caveats.push('NBC 3.2.4.1.(6): storage-garage-only status not provided — storage-garage exemption cannot be confirmed'), undefined)
      : inputs.is_storage_garage_only;

    if (residentialException === true) {
      if (inputs.residential_suite_count !== undefined && inputs.residential_suite_count <= 4) {
        caveats.push('NBC 3.2.4.1.(5)(a): using total building suite count as a conservative proxy for suites sharing a common means of egress — may require an alarm in some cases where the Code does not');
      }
      required = false;
      basis = 'Fire alarm not required — NBC 3.2.4.1.(5): residential exemption is proven';
    } else if (storageGarageException === true) {
      caveats.push("NBC 3.2.4.1.(2)/(3)/(6): this exception's conformance to its referenced sub-clause was taken as given from the input, not independently verified");
      required = false;
      basis = 'Fire alarm not required — NBC 3.2.4.1.(6): qualifying storage-garage exemption is proven';
    } else if (provenCondition) {
      if (provenCondition.sentence === '3.2.4.1.(4)(d)' || provenCondition.sentence === '3.2.4.1.(4)(e)') {
        caveats.push('NBC 3.2.4.1.(4)(d)/(e): this occupant load figure has not been reduced by any open-air seating area load, which the Code excludes — verify manually if open-air seating areas are present');
      }
      caveats.push('NBC 3.2.4.2.(4): a separated-portion exception exists in the Code and was not evaluated — verify manually if this building has a fire-separated portion meeting that exception\'s conditions');
      required = true;
      basis = `Fire alarm required — NBC ${provenCondition.sentence}: ${provenCondition.description}`;
    } else if (unknownCondition || residentialException === undefined || storageGarageException === undefined) {
      required = undefined;
      basis = 'Fire alarm requirement cannot be determined because one or more NBC 3.2.4.1 conditions remain unknown';
    } else {
      required = false;
      basis = 'Fire alarm not required — no NBC 3.2.4.1.(4) condition was proven';
    }
  }

  const provided = inputs.fire_alarm === true;
  const result = required === undefined ? 'not_applicable' : required && !provided ? 'fail' : 'pass';
  return buildFederalTrace({
    result,
    rule: 'NBC 3.2.4.1',
    reasoning: required === true && !provided ? `${basis}; system not provided` : basis,
    evaluatedInputs: {
      actual: provided ? 'provided' : 'not provided',
      required: required === undefined ? 'verify' : required ? 'required' : 'not required',
      unit: 'boolean',
    },
    severity: result === 'fail' ? 'critical' : result === 'not_applicable' ? 'medium' : 'info',
    constraintId: 'fire.alarm_required',
    recommendations: caveats,
  });
}
