import { Constraints } from '../constraints';
import { ComplianceTrace, OverrideChainEntry, buildFederalTrace, buildTrace, computeMargin } from '../types/trace';
import type { ComplianceInput } from '../types/context';
import type { ResolvedRule } from '../RuleResolver';

// NBC Table 3.4.2.1-A — unsprinklered single-exit exception limits
// NBC 2020 Division B, Article 3.4.2.1, Sentence (2)(a)
const TABLE_3421_A: Record<string, { maxArea: number; maxTravel: number }> = {
  'A':      { maxArea: 150, maxTravel: 15 },
  'B':      { maxArea:  75, maxTravel: 10 },
  'C':      { maxArea: 100, maxTravel: 15 },
  'D':      { maxArea: 200, maxTravel: 25 },
  'E':      { maxArea: 150, maxTravel: 15 },
  'F-Div2': { maxArea: 150, maxTravel: 10 },
  'F-Div3': { maxArea: 200, maxTravel: 15 },
};

// NBC Table 3.4.2.1-B — sprinklered single-exit exception limits (travel fixed at 25 m per Sentence 2(b)(i))
// NBC 2020 Division B, Article 3.4.2.1, Sentence (2)(b)
const TABLE_3421_B: Record<string, { maxArea: number }> = {
  'A':      { maxArea: 200 },
  'B':      { maxArea: 100 },
  'C':      { maxArea: 150 },
  'D':      { maxArea: 300 },
  'E':      { maxArea: 200 },
  'F-Div2': { maxArea: 200 },
  'F-Div3': { maxArea: 300 },
};

// Returns the table key for occupancy group lookups. Null means the single-exit exception is unavailable for this group.
function resolveGroupKey(occupancy_major: string, occupancy_division?: string): string | null {
  const major = (occupancy_major ?? '').trim().toUpperCase();
  if (['A', 'B', 'C', 'D', 'E'].includes(major)) return major;
  if (major === 'F') {
    const divDigit = (occupancy_division ?? '').replace(/\D/g, '');
    if (divDigit === '2') return 'F-Div2';
    if (divDigit === '3') return 'F-Div3';
    // F Division 1 (high hazard) is not in Tables 3.4.2.1-A/B; unknown division defaults conservatively
    return null;
  }
  return null;
}

export function evaluateTravelDistance(
  inputs: ComplianceInput,
  resolvedRule?: ResolvedRule,
): ComplianceTrace {
  const sprinklered = !!inputs.sprinklers;
  const constraintId = sprinklered
    ? 'egress.travel_distance.sprinklered'
    : 'egress.travel_distance.unsprinklered';
  const federalRef = sprinklered
    ? Constraints.egress.travel_distance.sprinklered.ref
    : Constraints.egress.travel_distance.unsprinklered.ref;
  const federalMax = sprinklered
    ? Constraints.egress.travel_distance.sprinklered.value as number
    : Constraints.egress.travel_distance.unsprinklered.value as number;

  const ref          = resolvedRule?.ref ?? federalRef;
  const jurisdiction = resolvedRule
    ? (resolvedRule.layer === 'provincial' ? 'Provincial' : 'Federal')
    : 'Federal';
  const source       = resolvedRule?.source ?? 'NBC 2020 Federal';
  const overrideChain: OverrideChainEntry[] = (resolvedRule?.overrideChain as OverrideChainEntry[] | undefined) ?? [
    { layer: 'federal',    source: 'NBC 2020', value: federalMax, applied: true },
    { layer: 'provincial', source: null,        value: null,       applied: false },
    { layer: 'municipal',  source: null,        value: null,       applied: false },
    { layer: 'project',    source: null,        value: null,       applied: false },
  ];

  // Provincial amendment removed this rule
  if (resolvedRule && (resolvedRule.value === 'not_applicable' || resolvedRule.value === 'removed')) {
    return buildTrace({
      result: 'not_applicable',
      rule: ref,
      jurisdiction,
      source,
      reasoning: 'Travel distance requirement removed by provincial amendment',
      evaluatedInputs: { actual: inputs.travel_distance_m ?? 0, required: 0, unit: 'm' },
      severity: 'info',
      constraintId,
      overrideChain,
      recommendations: [],
    });
  }

  const maxTravel = resolvedRule ? Number(resolvedRule.value) : federalMax;
  const actual    = inputs.travel_distance_m ?? 0;
  const pass      = actual <= maxTravel;

  return buildTrace({
    result: pass ? 'pass' : 'fail',
    rule: ref,
    jurisdiction,
    source,
    reasoning: pass
      ? `Travel distance ${actual}m is within the ${maxTravel}m limit`
      : `Travel distance ${actual}m exceeds the ${maxTravel}m maximum`,
    evaluatedInputs: {
      actual,
      required: maxTravel,
      unit: 'm',
      ...computeMargin(actual, maxTravel),
    },
    severity: pass ? 'info' : 'high',
    constraintId,
    overrideChain,
    recommendations: pass ? [] : [
      'Add an additional exit to reduce travel distance',
      'Install sprinkler system to increase maximum travel distance to 45m',
    ],
  });
}

export function evaluateExitCount(
  inputs: ComplianceInput,
  occupantLoad: number,
  occupantLoadNeedsReview = false,
): ComplianceTrace {
  const provided = inputs.exits ?? 0;
  const caveats: string[] = [];
  if (occupantLoadNeedsReview) {
    return buildFederalTrace({
      result: 'not_applicable',
      rule: 'NBC 3.4.2.1',
      reasoning: 'Exit-count exception not evaluated because occupant load needs review.',
      evaluatedInputs: { actual: 'not available', required: 'verify occupant load', unit: 'exits' },
      severity: 'high',
      constraintId: 'egress.exit_count',
      recommendations: ['Enter the total bedroom count across all dwelling units and suites before relying on exit-count results.'],
    });
  }

  // NBC 3.4.2.1(1): every occupied floor area requires at least 2 exits by default
  let exitsRequired = 2;

  // NBC 3.4.2.1(2): single-exit exception — all conditions must be satisfied
  const groupKey = resolveGroupKey(inputs.occupancy_major, inputs.occupancy_division);
  let singleExitApplies = false;

  if (occupantLoad <= 60) {
    if (groupKey === null) {
      caveats.push(
        `NBC 3.4.2.1.(2): single-exit exception not evaluated — occupancy '${inputs.occupancy_major}' not found in Tables 3.4.2.1-A/B; 2 exits required`,
      );
    } else {
      // Sentence (4): building must be not more than 2 storeys
      const storeys = inputs.storeys ?? null;
      if (storeys !== null && storeys > 2) {
        caveats.push(
          `NBC 3.4.2.1.(4): single-exit exception not available — building is ${storeys} storeys (maximum 2 permitted)`,
        );
      } else {
        if (storeys === null) {
          caveats.push(
            'NBC 3.4.2.1.(4): storey count not provided — single-exit exception requires ≤2 storeys; verify manually for buildings over 2 storeys',
          );
        }

        const sprinklered = !!inputs.sprinklers;
        const area = inputs.area_m2 ?? null;
        const travel = inputs.travel_distance_m ?? null;
        let areaOk = true;
        let travelOk = true;

        if (sprinklered) {
          const limits = TABLE_3421_B[groupKey];
          if (area !== null && area > limits.maxArea) {
            areaOk = false;
          } else if (area === null) {
            caveats.push(
              `NBC 3.4.2.1.(2)(b): floor area not provided — Table 3.4.2.1-B max for Group ${inputs.occupancy_major} is ${limits.maxArea} m²; verify manually`,
            );
          }
          if (travel !== null && travel > 25) {
            travelOk = false;
          } else if (travel === null) {
            caveats.push(
              'NBC 3.4.2.1.(2)(b)(i): travel distance not provided — maximum 25 m required in sprinklered building; verify manually',
            );
          }
        } else {
          const limits = TABLE_3421_A[groupKey];
          if (area !== null && area > limits.maxArea) {
            areaOk = false;
          } else if (area === null) {
            caveats.push(
              `NBC 3.4.2.1.(2)(a): floor area not provided — Table 3.4.2.1-A max for Group ${inputs.occupancy_major} is ${limits.maxArea} m²; verify manually`,
            );
          }
          if (travel !== null && travel > limits.maxTravel) {
            travelOk = false;
          } else if (travel === null) {
            caveats.push(
              `NBC 3.4.2.1.(2)(a): travel distance not provided — Table 3.4.2.1-A max for Group ${inputs.occupancy_major} is ${limits.maxTravel} m; verify manually`,
            );
          }
        }

        singleExitApplies = areaOk && travelOk;

        // Sentence (3): Group B or C single-exit must be an exterior doorway ≤1.5 m above grade
        if (singleExitApplies && (inputs.occupancy_major === 'B' || inputs.occupancy_major === 'C')) {
          caveats.push(
            `NBC 3.4.2.1.(3): single-exit exception for Group ${inputs.occupancy_major} requires the exit to be an exterior doorway ≤1.5 m above adjacent ground level — cannot be verified automatically; confirm manually`,
          );
        }
      }
    }
  }

  if (singleExitApplies) {
    exitsRequired = 1;
  }

  const pass = provided >= exitsRequired;

  const actionRecs = pass ? [] : [
    `Add ${exitsRequired - provided} additional exit door(s) — ${exitsRequired} exits required for ${occupantLoad} occupants per NBC 3.4.2.1.(1)`,
    'Verify occupant load calculation — reducing floor area may affect exit requirements',
  ];

  return buildFederalTrace({
    result: pass ? 'pass' : 'fail',
    rule: 'NBC 3.4.2.1.(1)',
    reasoning: pass
      ? `${provided} exit(s) meets the ${exitsRequired} required for ${occupantLoad} occupants${singleExitApplies ? ' (single-exit exception per NBC 3.4.2.1.(2) applies)' : ''}`
      : `${provided} exit(s) insufficient — ${exitsRequired} required for ${occupantLoad} occupants per NBC 3.4.2.1.(1)`,
    evaluatedInputs: {
      actual: provided,
      required: exitsRequired,
      unit: 'exits',
      ...computeMargin(provided, exitsRequired),
    },
    severity: pass ? 'info' : 'high',
    constraintId: 'egress.exit_count',
    recommendations: [...actionRecs, ...caveats],
  });
}

export function evaluateExitWidth(inputs: ComplianceInput): ComplianceTrace {
  const required = Constraints.egress.exit_width.minimum.value as number;

  if (!inputs.exit_width_mm) {
    return buildFederalTrace({
      result: 'not_applicable',
      rule: Constraints.egress.exit_width.minimum.ref,
      reasoning: 'Exit door width not provided — verify manually per NBC 3.3.1.13.(1)(a)',
      evaluatedInputs: { actual: 'not measured', required, unit: 'mm' },
      severity: 'medium',
      constraintId: 'egress.exit_width.minimum',
      recommendations: ['Verify exit door clear width is minimum 850mm per NBC 3.3.1.13.(1)(a)'],
    });
  }

  const actual = inputs.exit_width_mm;
  const pass   = actual >= required;

  return buildFederalTrace({
    result: pass ? 'pass' : 'fail',
    rule: Constraints.egress.exit_width.minimum.ref,
    reasoning: pass
      ? `Exit door width ${actual}mm meets the ${required}mm minimum`
      : `Exit door width ${actual}mm is below the ${required}mm minimum`,
    evaluatedInputs: { actual, required, unit: 'mm', ...computeMargin(actual, required) },
    severity: pass ? 'info' : 'critical',
    constraintId: 'egress.exit_width.minimum',
    recommendations: pass ? [] : [`Widen exit door to minimum ${required}mm clear width per NBC 3.4.3.4.(1)`],
  });
}
