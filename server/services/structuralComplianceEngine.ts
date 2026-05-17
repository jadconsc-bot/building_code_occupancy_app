/**
 * Structural Compliance Engine — evaluates NBC structural rules.
 *
 * This engine ONLY activates when analysisType === "structural".
 * Structural rules require framing plans, structural sections, and
 * detail sheets — they will always return UNABLE_TO_EVALUATE on
 * architectural floor plans and must NOT run during floor plan analysis.
 *
 * Rules moved here from drawingComplianceEngine.ts (Phase A cleanup).
 */

import { DrawingExtractionResult } from "./drawingExtractionService";
import {
  RuleEvaluation,
  ComplianceEngineOutput,
  EvaluationResult,
  parseDimensionToMm,
} from "./drawingComplianceEngine";

export const STRUCTURAL_ENGINE_VERSION = "1.0.0";

// ── Rule definitions ────────────────────────────────────────────────────────

const RULE_STUD_MIN_SIZE: RuleEvaluation = {
  ruleId: "NBC-9.5.5.2", clause: "9.5.5.2",
  description: "Minimum stud size for bearing walls",
  category: "structural", result: "UNABLE_TO_EVALUATE", details: "", severity: "major",
};

const RULE_STUD_SPACING: RuleEvaluation = {
  ruleId: "NBC-9.5.5.3", clause: "9.5.5.3",
  description: "Stud spacing maximum 600mm o.c. for bearing walls",
  category: "structural", result: "UNABLE_TO_EVALUATE", details: "", severity: "major",
};

const RULE_JOIST_SIZE: RuleEvaluation = {
  ruleId: "NBC-9.23.3.2", clause: "9.23.3.2",
  description: "Floor joist size and span compliance",
  category: "structural", result: "UNABLE_TO_EVALUATE", details: "", severity: "major",
};

const RULE_FASTENERS: RuleEvaluation = {
  ruleId: "NBC-9.23.9", clause: "9.23.9",
  description: "Fastener type and size requirements",
  category: "connections", result: "UNABLE_TO_EVALUATE", details: "", severity: "major",
};

const RULE_CSA_O86: RuleEvaluation = {
  ruleId: "CSA-O86", clause: "CSA O86",
  description: "Engineered wood connection design per CSA O86",
  category: "csa", result: "UNABLE_TO_EVALUATE", details: "", severity: "major",
};

// ── Evaluators ───────────────────────────────────────────────────────────────

function evaluateStructuralRules(extraction: DrawingExtractionResult): RuleEvaluation[] {
  const results: RuleEvaluation[] = [];
  const structural = extraction.structural;

  if (!structural) {
    return [
      { ...RULE_STUD_MIN_SIZE, result: "UNABLE_TO_EVALUATE", details: "No structural data extracted from drawing." },
      { ...RULE_STUD_SPACING,  result: "UNABLE_TO_EVALUATE", details: "No structural data extracted from drawing." },
      { ...RULE_JOIST_SIZE,    result: "UNABLE_TO_EVALUATE", details: "No structural data extracted from drawing." },
    ];
  }

  const studs = structural.memberSizes.filter(m =>
    m.label.toLowerCase().includes("stud") || m.label.toLowerCase().includes("wall")
  );
  if (studs.length === 0) {
    results.push({ ...RULE_STUD_MIN_SIZE, result: "UNABLE_TO_EVALUATE", details: "No stud members identified in drawing." });
  } else {
    const nonCompliant = studs.filter(s => {
      const mm = parseDimensionToMm(s.dimension);
      return mm !== null && mm < 89;
    });
    results.push(nonCompliant.length > 0
      ? { ...RULE_STUD_MIN_SIZE, result: "FAIL",
          details: `Stud(s) appear smaller than minimum 38x89mm: ${nonCompliant.map(s => `${s.label} (${s.dimension})`).join(", ")}. Verify with engineer.` }
      : { ...RULE_STUD_MIN_SIZE, result: "CONDITIONAL",
          details: `${studs.length} stud member(s) identified. Dimensions appear adequate but require professional verification against span tables.` }
    );
  }

  const joists = structural.memberSizes.filter(m =>
    m.label.toLowerCase().includes("joist") ||
    m.label.toLowerCase().includes("rafter") ||
    m.label.toLowerCase().includes("beam")
  );
  results.push(joists.length === 0
    ? { ...RULE_JOIST_SIZE, result: "UNABLE_TO_EVALUATE", details: "No joist/rafter/beam members identified in drawing." }
    : { ...RULE_JOIST_SIZE, result: "CONDITIONAL",
        details: `${joists.length} joist/rafter/beam member(s) identified: ${joists.map(j => `${j.label} (${j.dimension})`).join(", ")}. Compliance with span tables requires professional verification.` }
  );

  results.push({ ...RULE_STUD_SPACING, result: "UNABLE_TO_EVALUATE",
    details: "Stud spacing cannot be reliably determined from drawing image extraction. Manual measurement required." });

  return results;
}

function evaluateConnectionRules(extraction: DrawingExtractionResult): RuleEvaluation[] {
  const results: RuleEvaluation[] = [];
  const conn = extraction.connections;

  if (!conn) {
    return [
      { ...RULE_FASTENERS, result: "UNABLE_TO_EVALUATE", details: "No connection data extracted from drawing." },
      { ...RULE_CSA_O86,   result: "UNABLE_TO_EVALUATE", details: "No connection data extracted from drawing." },
    ];
  }

  results.push(conn.fastenerTypes.length === 0
    ? { ...RULE_FASTENERS, result: "UNABLE_TO_EVALUATE", details: "No fasteners identified in drawing." }
    : { ...RULE_FASTENERS, result: "CONDITIONAL",
        details: `${conn.fastenerTypes.length} fastener type(s) identified: ${conn.fastenerTypes.map(f => f.type).join(", ")}. Compliance with NBC 9.23.9 fastener schedules requires professional verification.` }
  );

  const hasO86 = conn.csaStandards.some(s => s.standard.includes("O86"));
  results.push({ ...RULE_CSA_O86,
    result: hasO86 ? "CONDITIONAL" : "UNABLE_TO_EVALUATE",
    details: hasO86
      ? "CSA O86 referenced in drawing. Compliance verification requires professional engineer review."
      : conn.csaStandards.length > 0
        ? `CSA standards referenced: ${conn.csaStandards.map(s => s.standard).join(", ")}. CSA O86 not explicitly referenced.`
        : "No CSA standards referenced in drawing.",
  });

  return results;
}

// ── Score calculator (same weights as floor-plan engine) ─────────────────────

function calculateStructuralScore(evaluations: RuleEvaluation[]): number {
  if (evaluations.length === 0) return 0;
  const weights: Record<string, number> = { critical: 3, major: 2, minor: 1, info: 0.5 };
  const resultScores: Record<string, number> = { PASS: 1.0, CONDITIONAL: 0.6, FAIL: 0.0 };

  let totalWeight = 0;
  let weightedScore = 0;
  for (const ev of evaluations) {
    if (ev.result === "UNABLE_TO_EVALUATE") continue;
    const w = weights[ev.severity] ?? 1;
    totalWeight += w;
    weightedScore += w * (resultScores[ev.result] ?? 0);
  }
  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Evaluate NBC structural rules for a structural drawing.
 * Returns an empty result if the extraction analysisType is not "structural".
 */
export function evaluateStructuralCompliance(
  extraction: DrawingExtractionResult,
): ComplianceEngineOutput {
  if (extraction.analysisType !== "structural") {
    return {
      ruleEvaluations: [],
      complianceScore: 0,
      complianceLevel: "approved",
      issues: [],
      recommendations: [],
      ruleEngineVersion: STRUCTURAL_ENGINE_VERSION,
    };
  }

  const evaluations: RuleEvaluation[] = [
    ...evaluateStructuralRules(extraction),
    ...evaluateConnectionRules(extraction),
  ];

  const score = calculateStructuralScore(evaluations);
  const level = score >= 85 ? "approved" : score >= 65 ? "conditional" : score >= 40 ? "revision" : "rejected";

  const issues = evaluations
    .filter(e => e.result === "FAIL" || e.result === "CONDITIONAL")
    .map(e => ({
      severity: e.result === "FAIL" ? e.severity : "info",
      clause: e.clause,
      description: e.description,
      details: e.details,
    }));

  const recommendations = evaluations
    .filter(e => e.result === "FAIL" || e.result === "UNABLE_TO_EVALUATE")
    .map(e => ({
      priority: e.result === "FAIL" ? "high" : "medium",
      clause: e.clause,
      description: e.result === "FAIL"
        ? `Resolve non-compliance with ${e.clause}: ${e.description}`
        : `Provide additional documentation for ${e.clause}: ${e.description}`,
    }));

  return {
    ruleEvaluations: evaluations,
    complianceScore: score,
    complianceLevel: level,
    issues,
    recommendations,
    ruleEngineVersion: STRUCTURAL_ENGINE_VERSION,
  };
}
