/**
 * Drawing Compliance Engine — Stage 2 of the Two-Stage Analysis Pipeline
 *
 * ============================================================================
 * PRIME DIRECTIVE 2.0 §4.1 — COMPLIANCE ENGINE BOUNDARY RULE (CRITICAL)
 * ============================================================================
 * This engine is the ONLY place where compliance decisions are made.
 * It receives ONLY Zod-validated structured data from Stage 1 (extraction).
 * It NEVER receives raw LLM output or LLM-generated text.
 *
 * The engine's role:
 *   - Apply deterministic NBC rules to extracted structured data
 *   - Produce PASS / FAIL / CONDITIONAL / UNABLE_TO_EVALUATE per rule
 *   - Calculate a numeric compliance score from rule results
 *   - Identify issues (rule failures) and recommendations
 *   - Return a structured evaluation result
 *
 * The engine MUST NOT:
 *   - Call the LLM
 *   - Use non-deterministic logic
 *   - Invent data not present in the extraction result
 * ============================================================================
 */

import { DrawingExtractionResult } from "./drawingExtractionService";
import { evaluateStructuralCompliance } from "./structuralComplianceEngine";

export const RULE_ENGINE_VERSION = "2.0.0";

export type EvaluationResult = "PASS" | "FAIL" | "CONDITIONAL" | "UNABLE_TO_EVALUATE";

export interface RuleEvaluation {
  ruleId: string;
  clause: string;
  description: string;
  category: "structural" | "fire-safety" | "connections" | "materials" | "csa";
  result: EvaluationResult;
  details: string;
  severity: "critical" | "major" | "minor" | "info";
}

export interface ComplianceEngineOutput {
  ruleEvaluations: RuleEvaluation[];
  complianceScore: number; // 0–100
  complianceLevel: "approved" | "conditional" | "revision" | "rejected";
  issues: Array<{ severity: string; clause: string; description: string; details: string }>;
  recommendations: Array<{ priority: string; clause: string; description: string }>;
  ruleEngineVersion: string;
}

// ============================================================================
// NBC Rule Definitions (deterministic thresholds)
// ============================================================================

/** NBC 3.3.1.13.(1)(a) — Exit door minimum clear width 850mm */
const RULE_EXIT_WIDTH: RuleEvaluation = {
  ruleId: "NBC-3.3.1.13",
  clause: "3.3.1.13.(1)(a)",
  description: "Exit door minimum clear width 850mm",
  category: "fire-safety",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "critical",
};

/** NBC 3.4.1.9 — Corridor minimum width 1100mm */
const RULE_CORRIDOR_WIDTH: RuleEvaluation = {
  ruleId: "NBC-3.4.1.9",
  clause: "3.4.1.9",
  description: "Corridor minimum width 1100mm",
  category: "fire-safety",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "critical",
};

/** NBC 3.1.3.1 / Table 3.1.3.1 — Fire separation ratings */
const RULE_FIRE_SEPARATION: RuleEvaluation = {
  ruleId: "NBC-3.1.3.1",
  clause: "3.1.3.1",
  description: "Fire separation construction and rating",
  category: "fire-safety",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "critical",
};

// ============================================================================
// Dimension parsing helpers
// ============================================================================

/** Parse a dimension string to millimetres. Returns null if unparseable. */
export function parseDimensionToMm(dim: string): number | null {
  if (!dim) return null;
  const s = dim.toLowerCase().trim();

  // mm
  const mmMatch = s.match(/^(\d+(?:\.\d+)?)\s*mm$/);
  if (mmMatch) return parseFloat(mmMatch[1]);

  // m
  const mMatch = s.match(/^(\d+(?:\.\d+)?)\s*m$/);
  if (mMatch) return parseFloat(mMatch[1]) * 1000;

  // inches (e.g., 36", 36 in)
  const inMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)$/);
  if (inMatch) return parseFloat(inMatch[1]) * 25.4;

  // feet-inches (e.g., 3'-0", 3'6")
  const ftInMatch = s.match(/^(\d+)'\s*(\d+(?:\.\d+)?)"/);
  if (ftInMatch) return (parseInt(ftInMatch[1]) * 12 + parseFloat(ftInMatch[2])) * 25.4;

  // feet (e.g., 3', 3 ft)
  const ftMatch = s.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet|foot)$/);
  if (ftMatch) return parseFloat(ftMatch[1]) * 304.8;

  // nominal lumber (e.g., 2x4, 2x6, 2x8, 2x10, 2x12)
  const lumberMatch = s.match(/^(\d+)\s*[xX×]\s*(\d+)$/);
  if (lumberMatch) {
    // Nominal to actual (approximate)
    const nominalDepth = parseInt(lumberMatch[2]);
    const actualMm: Record<number, number> = { 4: 89, 6: 140, 8: 184, 10: 235, 12: 286 };
    return actualMm[nominalDepth] ?? null;
  }

  return null;
}

// ============================================================================
// Rule Evaluators
// ============================================================================

function evaluateFireSafetyRules(extraction: DrawingExtractionResult): RuleEvaluation[] {
  const results: RuleEvaluation[] = [];
  const fire = extraction.fireSafety;

  if (!fire) {
    return [
      { ...RULE_EXIT_WIDTH, result: "UNABLE_TO_EVALUATE", details: "No fire safety data extracted from drawing." },
      { ...RULE_CORRIDOR_WIDTH, result: "UNABLE_TO_EVALUATE", details: "No fire safety data extracted from drawing." },
      { ...RULE_FIRE_SEPARATION, result: "UNABLE_TO_EVALUATE", details: "No fire safety data extracted from drawing." },
    ];
  }

  // NBC 3.3.1.13.(1)(a) — Exit door minimum 850mm clear width
  if (fire.exitWidths.length === 0) {
    results.push({ ...RULE_EXIT_WIDTH, result: "UNABLE_TO_EVALUATE", details: "No exit widths identified in drawing." });
  } else {
    const nonCompliant = fire.exitWidths.filter((e: any) => {
      const mm = parseDimensionToMm(e.width);
      return mm !== null && mm < 850;
    });
    if (nonCompliant.length > 0) {
      results.push({
        ...RULE_EXIT_WIDTH,
        result: "FAIL",
        details: `Exit(s) appear narrower than minimum 850mm clear width: ${nonCompliant.map((e: any) => `${e.location} (${e.width})`).join(", ")}.`,
      });
    } else {
      const unverifiable = fire.exitWidths.filter((e: any) => parseDimensionToMm(e.width) === null);
      results.push({
        ...RULE_EXIT_WIDTH,
        result: unverifiable.length > 0 ? "CONDITIONAL" : "PASS",
        details: `${fire.exitWidths.length} exit(s) identified. ${unverifiable.length > 0 ? "Some widths could not be parsed — professional verification required." : "All parsed widths meet 850mm minimum."}`,
      });
    }
  }

  // NBC 3.4.1.9 — Corridor minimum 1100mm
  if (fire.corridorWidths.length === 0) {
    results.push({ ...RULE_CORRIDOR_WIDTH, result: "UNABLE_TO_EVALUATE", details: "No corridors identified in drawing." });
  } else {
    const nonCompliant = fire.corridorWidths.filter((c: any) => {
      const mm = parseDimensionToMm(c.width);
      return mm !== null && mm < 1100;
    });
    if (nonCompliant.length > 0) {
      results.push({
        ...RULE_CORRIDOR_WIDTH,
        result: "FAIL",
        details: `Corridor(s) appear narrower than minimum 1100mm: ${nonCompliant.map((c: any) => `${c.location} (${c.width})`).join(", ")}.`,
      });
    } else {
      results.push({
        ...RULE_CORRIDOR_WIDTH,
        result: "CONDITIONAL",
        details: `${fire.corridorWidths.length} corridor(s) identified. Professional verification of clear widths required.`,
      });
    }
  }

  // NBC 3.1.3.1 / Table 3.1.3.1 — Fire separations
  if (fire.fireSeparations.length === 0) {
    results.push({ ...RULE_FIRE_SEPARATION, result: "UNABLE_TO_EVALUATE", details: "No fire separations identified in drawing." });
  } else {
    const unrated = fire.fireSeparations.filter((f: any) => !f.rating);
    results.push({
      ...RULE_FIRE_SEPARATION,
      result: unrated.length > 0 ? "CONDITIONAL" : "CONDITIONAL",
      details: `${fire.fireSeparations.length} fire separation(s) identified. ${unrated.length} without visible rating. Professional verification of construction and ratings required.`,
    });
  }

  return results;
}

// ============================================================================
// Score Calculator
// ============================================================================

function calculateScore(evaluations: RuleEvaluation[]): number {
  if (evaluations.length === 0) return 0;

  const weights = { critical: 3, major: 2, minor: 1, info: 0.5 };
  const resultScores: Record<Exclude<EvaluationResult, 'UNABLE_TO_EVALUATE'>, number> = {
    PASS: 1.0,
    CONDITIONAL: 0.6,
    FAIL: 0.0,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const ev of evaluations) {
    // UNABLE_TO_EVALUATE means the rule cannot be checked from this drawing type
    // (e.g. stud sizes on a floor plan). Exclude it from scoring entirely — it is
    // neither a pass nor a failure and should not penalise the compliance score.
    if (ev.result === 'UNABLE_TO_EVALUATE') continue;
    const w = weights[ev.severity];
    totalWeight += w;
    weightedScore += w * resultScores[ev.result];
  }

  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
}

function scoreToLevel(score: number): "approved" | "conditional" | "revision" | "rejected" {
  if (score >= 85) return "approved";
  if (score >= 65) return "conditional";
  if (score >= 40) return "revision";
  return "rejected";
}

// ============================================================================
// Main Engine Entry Point
// ============================================================================

/**
 * Stage 2: Evaluate fire-safety compliance using deterministic rules.
 *
 * NOTE: Structural rules (stud size, stud spacing, joist size, fasteners,
 * CSA O86) have been moved to `structuralComplianceEngine.ts` and are gated
 * on analysisType === "structural". They must NOT run during floor plan
 * analysis — these rules require framing plans and detail sheets, not floor
 * plans, and will always return UNABLE_TO_EVALUATE on architectural drawings.
 *
 * @param extraction - Zod-validated extraction result from Stage 1
 * @returns Compliance evaluation output with score, level, issues, and recommendations
 */
export function evaluateCompliance(extraction: DrawingExtractionResult): ComplianceEngineOutput {
  const allEvaluations: RuleEvaluation[] = [];

  const type = extraction.analysisType;

  if (type === "fire-safety" || type === "comprehensive") {
    allEvaluations.push(...evaluateFireSafetyRules(extraction));
  }
  if (type === "structural") {
    allEvaluations.push(...evaluateStructuralCompliance(extraction).ruleEvaluations);
  }

  const score = calculateScore(allEvaluations);
  const level = scoreToLevel(score);

  // Build issues list from FAILs and CONDITIONALs
  const issues = allEvaluations
    .filter(e => e.result === "FAIL" || e.result === "CONDITIONAL")
    .map(e => ({
      severity: e.result === "FAIL" ? e.severity : "info",
      clause: e.clause,
      description: e.description,
      details: e.details,
    }));

  // Build recommendations from FAILs and UNABLE_TO_EVALUATEs
  const recommendations = allEvaluations
    .filter(e => e.result === "FAIL" || e.result === "UNABLE_TO_EVALUATE")
    .map(e => ({
      priority: e.result === "FAIL" ? "high" : "medium",
      clause: e.clause,
      description: e.result === "FAIL"
        ? `Resolve non-compliance with ${e.clause}: ${e.description}`
        : `Provide additional documentation for ${e.clause}: ${e.description}`,
    }));

  return {
    ruleEvaluations: allEvaluations,
    complianceScore: score,
    complianceLevel: level,
    issues,
    recommendations,
    ruleEngineVersion: RULE_ENGINE_VERSION,
  };
}
