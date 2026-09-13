/**
 * Deterministic Compliance Engine
 *
 * Evaluates building code compliance based on versioned, immutable rulesets.
 * Produces reproducible results with full traceability for legal defensibility.
 *
 * This file is an ORCHESTRATOR. Compliance logic lives in server/engine/rules/.
 */

import { Constraints } from './engine/constraints';
import { ComplianceTrace, buildFederalTrace, computeMargin } from './engine/types/trace';
import { evaluateTravelDistance, evaluateExitCount, evaluateExitWidth } from './engine/rules/egress';
import { evaluateSprinklerRequirement, evaluateFireAlarm } from './engine/rules/fire';
import { evaluateOccupantLoad } from './engine/rules/occupancy';
import { ruleResolver } from './engine/RuleResolver';
import { editionForProvince } from './rules/overlays/index';
import {
  EvaluationResult,
  calculateComplianceScore,
  buildSummary,
  deriveStatus,
} from './engine/EvaluationContract';

export type { ComplianceInput, EvaluationContext } from './engine/types/context';
export type { EvaluationResult } from './engine/EvaluationContract';
import type { ComplianceInput } from './engine/types/context';
import { determineBuildingPart } from './engine/buildingPartDetermination';

export interface Rule {
  rule_id: string;
  clause: string;
  section: string;
  description: string;
  conditions: Condition[];
  actions: Action[];
}

export interface Condition {
  field: string;
  op: "==" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "contains";
  value: any;
}

export interface Action {
  field: string;
  op: "SET" | "APPEND" | "INCREMENT";
  value: any;
}

export interface ComplianceOutput {
  [key: string]: any;
}

export interface RuleTrace {
  rule_id: string;
  clause: string;
  fired: boolean;
  conditions_met: boolean;
}

export interface ComplianceResult {
  outputs: ComplianceOutput;
  rule_trace: RuleTrace[];
  compliance_flags: { [key: string]: boolean };
  traces: ComplianceTrace[];
  mode: "strict" | "soft";
  timestamp: string;
}

/**
 * Deterministic evaluator that applies rules in order
 * Same inputs always produce same outputs
 */
export class ComplianceEvaluator {
  private rules: Rule[];
  private mode: "strict" | "soft";

  constructor(rules: Rule[], mode: "strict" | "soft" = "soft") {
    this.rules = rules;
    this.mode = mode;
  }

  /**
   * Evaluate compliance for given inputs
   * Returns deterministic results with full rule trace
   */
  async evaluate(inputs: ComplianceInput): Promise<EvaluationResult> {
    const outputs: ComplianceOutput = {};
    const ruleTrace: RuleTrace[] = [];
    const complianceFlags: { [key: string]: boolean } = {};

    // Apply JSON-defined rules in order (deterministic, backward-compatible)
    for (const rule of this.rules) {
      const conditionsMet = this.evaluateConditions(rule.conditions, inputs, outputs);

      ruleTrace.push({
        rule_id: rule.rule_id,
        clause: rule.clause,
        fired: conditionsMet,
        conditions_met: conditionsMet,
      });

      if (conditionsMet) {
        for (const action of rule.actions) {
          this.applyAction(action, outputs);
        }
      }
    }

    // ── Derived outputs ──────────────────────────────────────────────────

    // Occupant load
    const { occupantLoad, trace: occupantLoadTrace } = evaluateOccupantLoad(inputs);
    if (inputs.area_m2 && inputs.occupancy_major) {
      outputs.occupant_load = occupantLoad;
    }

    // Exit count
    const exitCountTrace = evaluateExitCount(inputs, occupantLoad);
    outputs.exits_required = exitCountTrace.evaluatedInputs.required;

    // Travel distance max (for backward-compat consumers of outputs)
    outputs.travel_distance_max = inputs.sprinklers
      ? Constraints.egress.travel_distance.sprinklered.value
      : Constraints.egress.travel_distance.unsprinklered.value;

    // Fire resistance rating (no dedicated rule function — inline derivation)
    if (inputs.occupancy_major && inputs.construction_type) {
      const nonCombustibleValues = ["non_combustible", "Non-Combustible", "fire_resistant", "Fire-Resistant"];
      const isNonCombustible = nonCombustibleValues.includes(inputs.construction_type);
      const isHighRisk = ["A", "B"].includes(inputs.occupancy_major);
      outputs.fire_resistance_rating = isHighRisk
        ? (isNonCombustible ? "2hr" : "1hr")
        : (isNonCombustible ? "1hr" : "45min");
    }

    // ── Rule evaluations ─────────────────────────────────────────────────────

    const edition = inputs.codeEdition ?? editionForProvince(inputs.province ?? '');

    const travelDistanceRule = await ruleResolver.resolveConstraint(
      inputs.sprinklers
        ? Constraints.egress.travel_distance.sprinklered.ref
        : Constraints.egress.travel_distance.unsprinklered.ref,
      inputs.sprinklers
        ? Constraints.egress.travel_distance.sprinklered.value as number
        : Constraints.egress.travel_distance.unsprinklered.value as number,
      'm',
      inputs.sprinklers
        ? Constraints.egress.travel_distance.sprinklered.ref
        : Constraints.egress.travel_distance.unsprinklered.ref,
      {
        inputs,
        jurisdiction: {
          province: inputs.province ?? '',
          municipality: inputs.municipality ?? undefined,
          codeEdition: edition,
        },
        mode: this.mode,
      },
    );
    const travelDistanceTrace = evaluateTravelDistance(inputs, travelDistanceRule);
    const sprinklersTrace     = evaluateSprinklerRequirement(inputs);
    const fireAlarmTrace      = evaluateFireAlarm(inputs);
    const exitWidthTrace      = evaluateExitWidth(inputs);

    // Area check (no dedicated rule file — uses building_limits constraint)
    const areaLimit  = Constraints.building_limits.part9_threshold.max_area.value as number;
    const areaActual = inputs.area_m2 ?? 0;
    const determination = determineBuildingPart({ footprintM2: inputs.footprint_m2 ?? null, storeys: inputs.storeys ?? null, occupancyGroup: inputs.occupancy_major });
    const areaPass   = determination.determination === 'Part 9';
    const { margin: areaMargin, marginPercent: areaMarginPct } = computeMargin(inputs.footprint_m2 ?? 0, areaLimit);
    const areaTrace = buildFederalTrace({
      result: determination.determination === 'needs_review' ? 'not_applicable' : areaPass ? 'pass' : 'fail',
      rule: Constraints.building_limits.part9_threshold.max_area.ref,
      constraintId: 'building_limits.part9_threshold.max_area',
      severity: areaPass ? 'info' : 'high',
      evaluatedInputs: {
        actual: inputs.footprint_m2 ?? 'not available',
        required: areaLimit,
        unit: 'm²',
        margin: areaMargin,
        marginPercent: areaMarginPct,
      },
      reasoning: determination.reasoning,
      recommendations: areaPass ? [] : ['Review Part 3 requirements and verify the building footprint, storeys, and occupancy group.'],
    });

    // ── Compliance flags (derived from rule traces) ───────────────────────────

    complianceFlags["area_ok"]            = areaTrace.result !== 'fail';
    complianceFlags["sprinklers_ok"]      = sprinklersTrace.result !== 'fail';
    complianceFlags["fire_alarm_ok"]      = fireAlarmTrace.result !== 'fail';
    complianceFlags["exits_ok"]           = exitCountTrace.result !== 'fail';
    complianceFlags["travel_distance_ok"] = travelDistanceTrace.result !== 'fail';

    const allPass = Object.values(complianceFlags).every((f) => f === true);
    const anyFail = Object.values(complianceFlags).some((f) => f === false);
    outputs.compliance_status = allPass ? "pass" : anyFail ? "fail" : "conditional";

    const traces: ComplianceTrace[] = [
      occupantLoadTrace,
      areaTrace,
      sprinklersTrace,
      fireAlarmTrace,
      exitCountTrace,
      travelDistanceTrace,
      exitWidthTrace,
    ];

    return {
      complianceStatus: deriveStatus(traces, this.mode),
      overallScore: calculateComplianceScore(traces),
      traces,
      outputs: {
        occupant_load:           (outputs.occupant_load          as number)  ?? 0,
        exits_required:          (outputs.exits_required         as number)  ?? 0,
        travel_distance_max:     (outputs.travel_distance_max    as number)  ?? 0,
        fire_resistance_rating:  (outputs.fire_resistance_rating as string)  ?? '',
        compliance_status:       (outputs.compliance_status      as string)  ?? 'conditional',
        sprinklers_required:     (outputs.sprinklers_required    as boolean) ?? false,
      },
      summary: buildSummary(traces),
      evaluatedAt: new Date().toISOString(),
      engineVersion: '1.0',
      jurisdictionApplied: travelDistanceRule.source,
      codeEdition: edition,
      // Passes through the caller-supplied jurisdiction source.
      // Do NOT default to 'manual' here — undefined is intentional.
      // It makes callers that haven't passed jurisdictionSource yet
      // visible in the audit trail output rather than silently masking them.
      jurisdictionSource: inputs.jurisdictionSource,
    };
  }

  private evaluateConditions(
    conditions: Condition[],
    inputs: ComplianceInput,
    outputs: ComplianceOutput,
  ): boolean {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const value = inputs[condition.field] ?? outputs[condition.field];
      if (!this.evaluateCondition(condition, value)) return false;
    }

    return true;
  }

  private evaluateCondition(condition: Condition, value: any): boolean {
    switch (condition.op) {
      case "==":      return value === condition.value;
      case "!=":      return value !== condition.value;
      case ">":       return value > condition.value;
      case "<":       return value < condition.value;
      case ">=":      return value >= condition.value;
      case "<=":      return value <= condition.value;
      case "in":      return Array.isArray(condition.value) && condition.value.includes(value);
      case "contains": return String(value).includes(String(condition.value));
      default:        return false;
    }
  }

  private applyAction(action: Action, outputs: ComplianceOutput): void {
    switch (action.op) {
      case "SET":
        outputs[action.field] = action.value;
        break;
      case "APPEND":
        if (!Array.isArray(outputs[action.field])) outputs[action.field] = [];
        outputs[action.field].push(action.value);
        break;
      case "INCREMENT":
        outputs[action.field] = (outputs[action.field] || 0) + action.value;
        break;
    }
  }
}

/**
 * Create a compliance evaluator from a ruleset
 */
export function createEvaluator(
  rulesetData: string,
  mode: "strict" | "soft" = "soft",
): ComplianceEvaluator {
  const ruleset = JSON.parse(rulesetData);
  return new ComplianceEvaluator(ruleset.rules || [], mode);
}

/**
 * Validate that inputs are complete for strict mode
 */
export function validateInputsForStrictMode(
  inputs: ComplianceInput,
  requiredFields: string[],
): { valid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(
    (field) => inputs[field] === undefined || inputs[field] === null,
  );
  return { valid: missingFields.length === 0, missingFields };
}
