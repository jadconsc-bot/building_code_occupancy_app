export interface EvaluatedInputs {
  actual: number | string;
  required: number | string;
  unit: string;
  margin?: number;        // actual - required (positive = headroom, negative = deficit)
  marginPercent?: number; // (margin / required) * 100
}

export interface OverrideChainEntry {
  layer: 'federal' | 'provincial' | 'municipal' | 'project';
  source: string | null;  // e.g. "NBC 2020", "City of Calgary Bylaw 123"
  value: number | string | boolean | null;
  applied: boolean;       // was this layer's value the one used?
}

export type ComplianceStatus = 'pass' | 'fail' | 'warning' | 'not_applicable';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ComplianceTrace {
  // Core result
  result: ComplianceStatus;
  rule: string;           // e.g. "NBC 3.4.2.5.(1)"
  jurisdiction: string;  // e.g. "Alberta"
  source: string;        // e.g. "NBC 2020 Federal" | "ABC 2023 Provincial"
  reasoning: string;     // Human-readable explanation of WHY

  // Inputs evaluated
  evaluatedInputs: EvaluatedInputs;

  // Metadata
  severity: Severity;
  constraintId: string;         // e.g. "egress.travel_distance.unsprinklered"
  evaluationTimestamp: string;  // ISO 8601

  // Provenance
  overrideChain: OverrideChainEntry[];
  evaluationPath?: string[];    // e.g. ["occupancy.classification", "egress.travel_distance"]

  // Guidance
  recommendations?: string[];
  confidence?: number;          // 0-1, for AI-assisted evaluations only
}

// ── Helpers ─────────────────────────────────────────────────────────────────────────────

/** Compute margin between actual and required values. */
export function computeMargin(
  actual: number,
  required: number,
): { margin: number; marginPercent: number } {
  const margin = actual - required;
  const marginPercent = required !== 0 ? (margin / required) * 100 : 0;
  return {
    margin: parseFloat(margin.toFixed(2)),
    marginPercent: parseFloat(marginPercent.toFixed(1)),
  };
}

/** Build a trace with full jurisdiction/source/override-chain control. */
export function buildTrace(params: {
  result: ComplianceStatus;
  rule: string;
  jurisdiction: string;
  source: string;
  reasoning: string;
  evaluatedInputs: EvaluatedInputs;
  severity: Severity;
  constraintId: string;
  overrideChain: OverrideChainEntry[];
  evaluationPath?: string[];
  recommendations?: string[];
  confidence?: number;
}): ComplianceTrace {
  return {
    ...params,
    evaluationTimestamp: new Date().toISOString(),
  };
}

/** Convenience wrapper for federal-only traces (no provincial/municipal overrides). */
export function buildFederalTrace(params: {
  result: ComplianceStatus;
  rule: string;
  reasoning: string;
  evaluatedInputs: EvaluatedInputs;
  severity: Severity;
  constraintId: string;
  recommendations?: string[];
}): ComplianceTrace {
  return buildTrace({
    ...params,
    jurisdiction: 'Federal',
    source: 'NBC 2020',
    overrideChain: [
      { layer: 'federal',    source: 'NBC 2020', value: params.evaluatedInputs.required, applied: true },
      { layer: 'provincial', source: null,        value: null,                            applied: false },
      { layer: 'municipal',  source: null,        value: null,                            applied: false },
      { layer: 'project',    source: null,        value: null,                            applied: false },
    ],
  });
}
