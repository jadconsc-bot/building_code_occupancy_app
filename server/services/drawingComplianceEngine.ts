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

/** NBC 9.5.5.2 — Minimum stud size for bearing walls */
const RULE_STUD_MIN_SIZE: RuleEvaluation = {
  ruleId: "NBC-9.5.5.2",
  clause: "9.5.5.2",
  description: "Minimum stud size for bearing walls",
  category: "structural",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "major",
};

/** NBC 9.5.5.3 — Stud spacing */
const RULE_STUD_SPACING: RuleEvaluation = {
  ruleId: "NBC-9.5.5.3",
  clause: "9.5.5.3",
  description: "Stud spacing maximum 600mm o.c. for bearing walls",
  category: "structural",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "major",
};

/** NBC 9.23.3.2 — Joist size and span */
const RULE_JOIST_SIZE: RuleEvaluation = {
  ruleId: "NBC-9.23.3.2",
  clause: "9.23.3.2",
  description: "Floor joist size and span compliance",
  category: "structural",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "major",
};

/** NBC 3.4.3.4 — Exit door minimum width 860mm */
const RULE_EXIT_WIDTH: RuleEvaluation = {
  ruleId: "NBC-3.4.3.4",
  clause: "3.4.3.4",
  description: "Exit door minimum clear width 860mm",
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

/** NBC 3.1.3.4 — Fire separation ratings */
const RULE_FIRE_SEPARATION: RuleEvaluation = {
  ruleId: "NBC-3.1.3.4",
  clause: "3.1.3.4",
  description: "Fire separation construction and rating",
  category: "fire-safety",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "critical",
};

/** NBC 9.23.9 — Fastener requirements */
const RULE_FASTENERS: RuleEvaluation = {
  ruleId: "NBC-9.23.9",
  clause: "9.23.9",
  description: "Fastener type and size requirements",
  category: "connections",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "major",
};

/** CSA O86 — Engineered wood connections */
const RULE_CSA_O86: RuleEvaluation = {
  ruleId: "CSA-O86",
  clause: "CSA O86",
  description: "Engineered wood connection design per CSA O86",
  category: "csa",
  result: "UNABLE_TO_EVALUATE",
  details: "",
  severity: "major",
};

// ============================================================================
// Dimension parsing helpers
// ============================================================================

/** Parse a dimension string to millimetres. Returns null if unparseable. */
function parseDimensionToMm(dim: string): number | null {
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

function evaluateStructuralRules(extraction: DrawingExtractionResult): RuleEvaluation[] {
  const results: RuleEvaluation[] = [];
  const structural = extraction.structural;

  if (!structural) {
    return [
      { ...RULE_STUD_MIN_SIZE, result: "UNABLE_TO_EVALUATE", details: "No structural data extracted from drawing." },
      { ...RULE_STUD_SPACING, result: "UNABLE_TO_EVALUATE", details: "No structural data extracted from drawing." },
      { ...RULE_JOIST_SIZE, result: "UNABLE_TO_EVALUATE", details: "No structural data extracted from drawing." },
    ];
  }

  // NBC 9.5.5.2 — Stud minimum size (38x89mm for bearing walls)
  const studs = structural.memberSizes.filter(m =>
    m.label.toLowerCase().includes("stud") ||
    m.label.toLowerCase().includes("wall")
  );
  if (studs.length === 0) {
    results.push({ ...RULE_STUD_MIN_SIZE, result: "UNABLE_TO_EVALUATE", details: "No stud members identified in drawing." });
  } else {
    const nonCompliant = studs.filter(s => {
      const mm = parseDimensionToMm(s.dimension);
      return mm !== null && mm < 89; // minimum 38x89mm (depth)
    });
    if (nonCompliant.length > 0) {
      results.push({
        ...RULE_STUD_MIN_SIZE,
        result: "FAIL",
        details: `Stud(s) appear smaller than minimum 38x89mm: ${nonCompliant.map(s => `${s.label} (${s.dimension})`).join(", ")}. Verify with engineer.`,
      });
    } else {
      results.push({
        ...RULE_STUD_MIN_SIZE,
        result: "CONDITIONAL",
        details: `${studs.length} stud member(s) identified. Dimensions appear adequate but require professional verification against span tables.`,
      });
    }
  }

  // NBC 9.23.3.2 — Joist size
  const joists = structural.memberSizes.filter(m =>
    m.label.toLowerCase().includes("joist") ||
    m.label.toLowerCase().includes("rafter") ||
    m.label.toLowerCase().includes("beam")
  );
  if (joists.length === 0) {
    results.push({ ...RULE_JOIST_SIZE, result: "UNABLE_TO_EVALUATE", details: "No joist/rafter/beam members identified in drawing." });
  } else {
    results.push({
      ...RULE_JOIST_SIZE,
      result: "CONDITIONAL",
      details: `${joists.length} joist/rafter/beam member(s) identified: ${joists.map(j => `${j.label} (${j.dimension})`).join(", ")}. Compliance with span tables requires professional verification.`,
    });
  }

  // NBC 9.5.5.3 — Stud spacing (no spacing data from extraction, mark UNABLE)
  results.push({
    ...RULE_STUD_SPACING,
    result: "UNABLE_TO_EVALUATE",
    details: "Stud spacing cannot be reliably determined from drawing image extraction. Manual measurement required.",
  });

  return results;
}

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

  // NBC 3.4.3.4 — Exit door minimum 860mm clear width
  if (fire.exitWidths.length === 0) {
    results.push({ ...RULE_EXIT_WIDTH, result: "UNABLE_TO_EVALUATE", details: "No exit widths identified in drawing." });
  } else {
    const nonCompliant = fire.exitWidths.filter(e => {
      const mm = parseDimensionToMm(e.width);
      return mm !== null && mm < 860;
    });
    if (nonCompliant.length > 0) {
      results.push({
        ...RULE_EXIT_WIDTH,
        result: "FAIL",
        details: `Exit(s) appear narrower than minimum 860mm clear width: ${nonCompliant.map(e => `${e.location} (${e.width})`).join(", ")}.`,
      });
    } else {
      const unverifiable = fire.exitWidths.filter(e => parseDimensionToMm(e.width) === null);
      results.push({
        ...RULE_EXIT_WIDTH,
        result: unverifiable.length > 0 ? "CONDITIONAL" : "PASS",
        details: `${fire.exitWidths.length} exit(s) identified. ${unverifiable.length > 0 ? "Some widths could not be parsed — professional verification required." : "All parsed widths meet 860mm minimum."}`,
      });
    }
  }

  // NBC 3.4.1.9 — Corridor minimum 1100mm
  if (fire.corridorWidths.length === 0) {
    results.push({ ...RULE_CORRIDOR_WIDTH, result: "UNABLE_TO_EVALUATE", details: "No corridors identified in drawing." });
  } else {
    const nonCompliant = fire.corridorWidths.filter(c => {
      const mm = parseDimensionToMm(c.width);
      return mm !== null && mm < 1100;
    });
    if (nonCompliant.length > 0) {
      results.push({
        ...RULE_CORRIDOR_WIDTH,
        result: "FAIL",
        details: `Corridor(s) appear narrower than minimum 1100mm: ${nonCompliant.map(c => `${c.location} (${c.width})`).join(", ")}.`,
      });
    } else {
      results.push({
        ...RULE_CORRIDOR_WIDTH,
        result: "CONDITIONAL",
        details: `${fire.corridorWidths.length} corridor(s) identified. Professional verification of clear widths required.`,
      });
    }
  }

  // NBC 3.1.3.4 — Fire separations
  if (fire.fireSeparations.length === 0) {
    results.push({ ...RULE_FIRE_SEPARATION, result: "UNABLE_TO_EVALUATE", details: "No fire separations identified in drawing." });
  } else {
    const unrated = fire.fireSeparations.filter(f => !f.rating);
    results.push({
      ...RULE_FIRE_SEPARATION,
      result: unrated.length > 0 ? "CONDITIONAL" : "CONDITIONAL",
      details: `${fire.fireSeparations.length} fire separation(s) identified. ${unrated.length} without visible rating. Professional verification of construction and ratings required.`,
    });
  }

  return results;
}

function evaluateConnectionRules(extraction: DrawingExtractionResult): RuleEvaluation[] {
  const results: RuleEvaluation[] = [];
  const conn = extraction.connections;

  if (!conn) {
    return [
      { ...RULE_FASTENERS, result: "UNABLE_TO_EVALUATE", details: "No connection data extracted from drawing." },
      { ...RULE_CSA_O86, result: "UNABLE_TO_EVALUATE", details: "No connection data extracted from drawing." },
    ];
  }

  // NBC 9.23.9 — Fasteners
  if (conn.fastenerTypes.length === 0) {
    results.push({ ...RULE_FASTENERS, result: "UNABLE_TO_EVALUATE", details: "No fasteners identified in drawing." });
  } else {
    results.push({
      ...RULE_FASTENERS,
      result: "CONDITIONAL",
      details: `${conn.fastenerTypes.length} fastener type(s) identified: ${conn.fastenerTypes.map(f => f.type).join(", ")}. Compliance with NBC 9.23.9 fastener schedules requires professional verification.`,
    });
  }

  // CSA O86
  if (conn.csaStandards.length === 0) {
    results.push({ ...RULE_CSA_O86, result: "UNABLE_TO_EVALUATE", details: "No CSA standards referenced in drawing." });
  } else {
    const hasO86 = conn.csaStandards.some(s => s.standard.includes("O86"));
    results.push({
      ...RULE_CSA_O86,
      result: hasO86 ? "CONDITIONAL" : "UNABLE_TO_EVALUATE",
      details: hasO86
        ? "CSA O86 referenced in drawing. Compliance verification requires professional engineer review."
        : `CSA standards referenced: ${conn.csaStandards.map(s => s.standard).join(", ")}. CSA O86 not explicitly referenced.`,
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
  const resultScores: Record<EvaluationResult, number> = {
    PASS: 1.0,
    CONDITIONAL: 0.6,
    UNABLE_TO_EVALUATE: 0.4,
    FAIL: 0.0,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const ev of evaluations) {
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
 * Stage 2: Evaluate compliance using deterministic rules.
 *
 * @param extraction - Zod-validated extraction result from Stage 1
 * @returns Compliance evaluation output with score, level, issues, and recommendations
 */
export function evaluateCompliance(extraction: DrawingExtractionResult): ComplianceEngineOutput {
  const allEvaluations: RuleEvaluation[] = [];

  const type = extraction.analysisType;

  if (type === "structural" || type === "comprehensive") {
    allEvaluations.push(...evaluateStructuralRules(extraction));
  }
  if (type === "fire-safety" || type === "comprehensive") {
    allEvaluations.push(...evaluateFireSafetyRules(extraction));
  }
  if (type === "connections" || type === "comprehensive") {
    allEvaluations.push(...evaluateConnectionRules(extraction));
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
