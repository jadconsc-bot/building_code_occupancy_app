import type { EvaluationContext } from './types/context';
import type { ComplianceTrace } from './types/trace';

export interface EvaluationResult {
  complianceStatus: 'compliant' | 'non_compliant' | 'conditional';
  overallScore: number;        // 0-100
  traces: ComplianceTrace[];   // one per rule evaluated
  outputs: {
    occupant_load: number;
    exits_required: number;
    travel_distance_max: number;
    fire_resistance_rating: string;
    compliance_status: string;
    sprinklers_required: boolean;
  };
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    critical: number;         // count of severity === 'critical' fails
  };
  evaluatedAt: string;         // ISO 8601
  engineVersion: string;       // '1.0'
  jurisdictionApplied: string; // 'NBC 2020 Federal' | 'NBC(AE) 2023 Provincial' etc.
  codeEdition: string;         // governing edition: 'NBC 2020' | 'NBC(AE) 2023' | 'BCBC 2024' | 'NBC 2025'
}

export interface EngineContract {
  evaluate(context: EvaluationContext): Promise<EvaluationResult>;
}

export function calculateComplianceScore(traces: ComplianceTrace[]): number {
  if (traces.length === 0) return 0;

  const weights: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    info: 0,
  };

  let totalWeight = 0;
  let passedWeight = 0;

  for (const trace of traces) {
    if (trace.result === 'not_applicable') continue;
    const weight = weights[trace.severity] ?? 1;
    totalWeight += weight;
    if (trace.result === 'pass') passedWeight += weight;
    if (trace.result === 'warning') passedWeight += weight * 0.5;
  }

  return totalWeight === 0 ? 100 : Math.round((passedWeight / totalWeight) * 100);
}

export function buildSummary(traces: ComplianceTrace[]): EvaluationResult['summary'] {
  return {
    passed:   traces.filter(t => t.result === 'pass').length,
    failed:   traces.filter(t => t.result === 'fail').length,
    warnings: traces.filter(t => t.result === 'warning').length,
    critical: traces.filter(t => t.result === 'fail' && t.severity === 'critical').length,
  };
}

export function deriveStatus(
  traces: ComplianceTrace[],
  mode: 'soft' | 'strict',
): EvaluationResult['complianceStatus'] {
  const criticalFails = traces.filter(t => t.result === 'fail' && t.severity === 'critical');
  const anyFails      = traces.filter(t => t.result === 'fail');
  const anyWarnings   = traces.filter(t => t.result === 'warning');

  if (criticalFails.length > 0) return 'non_compliant';
  if (mode === 'strict' && anyFails.length > 0) return 'non_compliant';
  if (anyWarnings.length > 0 || (mode === 'soft' && anyFails.length > 0)) return 'conditional';
  return 'compliant';
}
