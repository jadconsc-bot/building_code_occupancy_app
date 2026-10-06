// Per-rule contract (Sprint C). exitWidthRule is used by ComplianceEvaluator (Sprint C2); travelDistanceRule is shadow-mode only: covered by parity tests, not yet called by the evaluator. See CLAUDE.md.
import type { ComplianceInput } from '../types/context';
import type { ComplianceTrace } from '../types/trace';
import type { ResolvedRule } from '../RuleResolver';
import { evaluateExitWidth, evaluateTravelDistance } from './egress';

export interface RuleContext {
  inputs: ComplianceInput;
  resolved?: { travelDistanceRule?: ResolvedRule };
}

export interface EngineRule {
  readonly ruleId: string;
  readonly constraintIds: readonly string[];
  evaluate(ctx: RuleContext): ComplianceTrace;
}

export const exitWidthRule: EngineRule = {
  ruleId: 'egress.exit_width',
  constraintIds: ['egress.exit_width.minimum'],
  evaluate: (ctx) => evaluateExitWidth(ctx.inputs),
};

export const travelDistanceRule: EngineRule = {
  ruleId: 'egress.travel_distance',
  constraintIds: ['egress.travel_distance.sprinklered', 'egress.travel_distance.unsprinklered'],
  evaluate: (ctx) => evaluateTravelDistance(ctx.inputs, ctx.resolved?.travelDistanceRule),
};

export const engineRules: readonly EngineRule[] = [exitWidthRule, travelDistanceRule];
