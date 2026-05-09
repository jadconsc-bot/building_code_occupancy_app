/**
 * Deterministic Compliance Engine
 *
 * Evaluates building code compliance based on versioned, immutable rulesets.
 * Produces reproducible results with full traceability for legal defensibility.
 */

import { Constraints } from './engine/constraints';

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

export interface ComplianceInput {
  occupancy_major: string;
  occupancy_division?: string;
  area_m2?: number;
  storeys?: number;
  sprinklers?: boolean;
  fire_alarm?: boolean;
  exits?: number;
  travel_distance_m?: number;
  construction_type?: string;
  [key: string]: any;
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
  evaluate(inputs: ComplianceInput): ComplianceResult {
    const outputs: ComplianceOutput = {};
    const ruleTrace: RuleTrace[] = [];
    const complianceFlags: { [key: string]: boolean } = {};

    // Apply each rule in order (deterministic)
    for (const rule of this.rules) {
      const conditionsMet = this.evaluateConditions(rule.conditions, inputs, outputs);
      
      ruleTrace.push({
        rule_id: rule.rule_id,
        clause: rule.clause,
        fired: conditionsMet,
        conditions_met: conditionsMet,
      });

      if (conditionsMet) {
        // Apply actions from this rule
        for (const action of rule.actions) {
          this.applyAction(action, outputs);
        }
      }
    }

    // Populate standard derived outputs
    const cf = Constraints.occupant_load.factors;
    const loadFactors: Record<string, number> = {
      A: cf['A'].value as number,
      B: cf['B'].value as number,
      C: cf['C'].value as number,
      D: cf['D'].value as number,
      E: cf['E'].value as number,
      F:    cf['F'].value as number,
      'F-1': cf['F'].value as number,
      'F-2': cf['F'].value as number,
      'F-3': cf['F'].value as number,
    };
    if (inputs.area_m2 && inputs.occupancy_major) {
      const factor = loadFactors[inputs.occupancy_major] ?? (cf['D'].value as number);
      const occupantLoad = Math.ceil(Number(inputs.area_m2) / factor);
      outputs.occupant_load = occupantLoad;
      const low  = Constraints.egress.exit_count.threshold_low.value as number;
      const mid  = Constraints.egress.exit_count.threshold_mid.value as number;
      outputs.exits_required = occupantLoad <= low ? 1 : occupantLoad <= mid ? 2 : 3;
    }
    outputs.travel_distance_max = inputs.sprinklers
      ? Constraints.egress.travel_distance.sprinklered.value
      : Constraints.egress.travel_distance.unsprinklered.value;
    if (inputs.occupancy_major && inputs.construction_type) {
      const nonCombustibleValues = ["non_combustible", "Non-Combustible", "fire_resistant", "Fire-Resistant"];
      const isNonCombustible = nonCombustibleValues.includes(inputs.construction_type);
      const isHighRisk = ["A", "B"].includes(inputs.occupancy_major);
      outputs.fire_resistance_rating = isHighRisk
        ? (isNonCombustible ? "2hr" : "1hr")
        : (isNonCombustible ? "1hr" : "45min");
    }

    // Generate compliance flags based on outputs
    complianceFlags["area_ok"] = !(outputs.area_exceeds_limit === true);
    complianceFlags["sprinklers_ok"] = !(outputs.sprinklers_required === true) || inputs.sprinklers === true;
    complianceFlags["fire_alarm_ok"] = !(outputs.fire_alarm_required === true) || inputs.fire_alarm === true;
    complianceFlags["exits_ok"] = !(outputs.exits_required === true) || (inputs.exits && inputs.exits >= (typeof outputs.exits_required === 'number' ? outputs.exits_required : 0)) || false;
    complianceFlags["travel_distance_ok"] = !(outputs.travel_distance_exceeded === true);

    const allPass = Object.values(complianceFlags).every((f) => f === true);
    const anyFail = Object.values(complianceFlags).some((f) => f === false);
    outputs.compliance_status = allPass ? "pass" : anyFail ? "fail" : "conditional";

    return {
      outputs,
      rule_trace: ruleTrace,
      compliance_flags: complianceFlags,
      mode: this.mode,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Evaluate all conditions for a rule
   * All conditions must be true (AND logic)
   */
  private evaluateConditions(
    conditions: Condition[],
    inputs: ComplianceInput,
    outputs: ComplianceOutput
  ): boolean {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const value = inputs[condition.field] ?? outputs[condition.field];

      if (!this.evaluateCondition(condition, value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: Condition, value: any): boolean {
    switch (condition.op) {
      case "==":
        return value === condition.value;
      case "!=":
        return value !== condition.value;
      case ">":
        return value > condition.value;
      case "<":
        return value < condition.value;
      case ">=":
        return value >= condition.value;
      case "<=":
        return value <= condition.value;
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(value);
      case "contains":
        return String(value).includes(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Apply an action to the outputs
   */
  private applyAction(action: Action, outputs: ComplianceOutput): void {
    switch (action.op) {
      case "SET":
        outputs[action.field] = action.value;
        break;
      case "APPEND":
        if (!Array.isArray(outputs[action.field])) {
          outputs[action.field] = [];
        }
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
  mode: "strict" | "soft" = "soft"
): ComplianceEvaluator {
  const ruleset = JSON.parse(rulesetData);
  return new ComplianceEvaluator(ruleset.rules || [], mode);
}

/**
 * Validate that inputs are complete for strict mode
 */
export function validateInputsForStrictMode(
  inputs: ComplianceInput,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter((field) => inputs[field] === undefined || inputs[field] === null);
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
