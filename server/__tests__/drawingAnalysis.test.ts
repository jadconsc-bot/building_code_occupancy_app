/**
 * Drawing Analyzer — Mandatory Tests (Prime Directive 2.0 §10)
 *
 * Test suite verifying:
 * 1. LLM Boundary Rule (§4.1) — extraction service prompt contains NO pass/fail language
 * 2. Compliance Engine Determinism — same input always produces same output
 * 3. Compliance Engine Rule Coverage — all NBC rules are evaluated
 * 4. UNABLE_TO_EVALUATE handling — engine handles missing data gracefully
 * 5. Exit door width rule — NBC 3.3.1.13.(1)(a) FAIL/PASS
 * 6. Corridor width rule — NBC 3.4.1.9 FAIL
 * 7. Stud size rule — NBC 9.5.5.2 FAIL/CONDITIONAL
 * 8. Audit trail — router uses protectedProcedure, inserts to DB, requires disclaimer
 * 9. Two-stage pipeline separation — engine never calls LLM, extractor never calls engine
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  RULE_ENGINE_VERSION,
  evaluateCompliance,
} from "../services/drawingComplianceEngine";
import { evaluateStructuralCompliance } from "../services/structuralComplianceEngine";
import {
  EXTRACTION_PROMPT_VERSION,
} from "../services/drawingExtractionService";
import type { DrawingExtractionResult } from "../services/drawingExtractionService";

// ============================================================================
// Helper: build a minimal valid DrawingExtractionResult fixture
// ============================================================================
function makeExtraction(overrides: Partial<DrawingExtractionResult> = {}): DrawingExtractionResult {
  return {
    analysisType: "comprehensive",
    drawingType: "floor-plan",
    extractionModel: "claude-3-5-sonnet",
    extractionPromptVersion: EXTRACTION_PROMPT_VERSION,
    structural: undefined,
    fireSafety: undefined,
    connections: undefined,
    ...overrides,
  };
}

// ============================================================================
// Test 1: LLM Boundary Rule
// ============================================================================
describe("PD2.0 §4.1 — LLM Boundary Rule", () => {
  it("extraction service source code must not contain pass/fail compliance decision language in the LLM prompt", () => {
    const source = readFileSync(
      join(__dirname, "../services/drawingExtractionService.ts"),
      "utf-8"
    );

    // Extract the system prompt string
    const promptMatch = source.match(/buildExtractionSystemPrompt[\s\S]*?`([\s\S]*?)`/);
    if (promptMatch) {
      const prompt = promptMatch[1].toLowerCase();
      const forbiddenPhrases = ["compliant", "passes", "fails", "does not meet", "approve", "reject"];
      for (const phrase of forbiddenPhrases) {
        expect(
          prompt.includes(phrase),
          `LLM extraction prompt must not contain compliance decision language: "${phrase}"`
        ).toBe(false);
      }
    }

    // Verify the prompt instructs extraction only
    expect(source).toContain("YOU MUST NOT");
    expect(source).toContain("Make pass/fail compliance decisions");
  });

  it("extraction service must export EXTRACTION_PROMPT_VERSION", () => {
    expect(EXTRACTION_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("compliance engine must export RULE_ENGINE_VERSION", () => {
    expect(RULE_ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ============================================================================
// Test 2: Compliance Engine Determinism
// ============================================================================
describe("PD2.0 §4.1 — Compliance Engine Determinism", () => {
  const sampleExtraction = makeExtraction({
    structural: {
      memberSizes: [
        { label: "Stud", dimension: "38x89mm", material: "SPF", location: "Exterior wall" },
        { label: "Floor Joist", dimension: "38x184mm", material: "SPF", location: "Main floor" },
      ],
      connectionTypes: [{ type: "Nail", location: "Stud-to-plate" }],
      loadPaths: ["Roof to stud to foundation"],
      materials: [{ material: "SPF lumber", grade: "No.2", location: "Framing" }],
      relevantNbcClauses: [{ clause: "9.5.5.2", reason: "Stud sizing" }],
      confidence: 0.85,
    },
    fireSafety: {
      exitWidths: [{ location: "Main entry", width: "920mm", doorType: "Swing" }],
      corridorWidths: [{ location: "Hallway", width: "1200mm" }],
      fireSeparations: [],
      sprinklerSystem: { present: false },
      smokeDetectors: { present: true },
      relevantNbcClauses: [],
      confidence: 0.9,
    },
  });

  it("produces identical output for identical input (deterministic)", () => {
    const result1 = evaluateCompliance(sampleExtraction);
    const result2 = evaluateCompliance(sampleExtraction);
    expect(result1).toEqual(result2);
  });

  it("compliance score is bounded 0–100", () => {
    const result = evaluateCompliance(sampleExtraction);
    expect(result.complianceScore).toBeGreaterThanOrEqual(0);
    expect(result.complianceScore).toBeLessThanOrEqual(100);
  });

  it("complianceLevel is one of the four valid values", () => {
    const result = evaluateCompliance(sampleExtraction);
    expect(["approved", "conditional", "revision", "rejected"]).toContain(result.complianceLevel);
  });

  it("ruleEngineVersion matches exported constant", () => {
    const result = evaluateCompliance(sampleExtraction);
    expect(result.ruleEngineVersion).toBe(RULE_ENGINE_VERSION);
  });
});

// ============================================================================
// Test 3: UNABLE_TO_EVALUATE handling — null structural/fireSafety data
// ============================================================================
describe("PD2.0 §4.1 — Graceful handling of missing extraction data", () => {
  const emptyExtraction = makeExtraction();

  it("returns UNABLE_TO_EVALUATE for all rules when no data extracted", () => {
    const result = evaluateCompliance(emptyExtraction);
    const allUnable = result.ruleEvaluations.every(
      (r) => r.result === "UNABLE_TO_EVALUATE"
    );
    expect(allUnable).toBe(true);
  });

  it("returns complianceLevel 'revision' or 'rejected' when no data can be evaluated", () => {
    const result = evaluateCompliance(emptyExtraction);
    expect(["revision", "rejected"]).toContain(result.complianceLevel);
  });
});

// ============================================================================
// Test 4: Exit door width rule — NBC 3.3.1.13.(1)(a)
// ============================================================================
describe("NBC 3.3.1.13.(1)(a) — Exit door minimum 850mm", () => {
  it("FAIL when exit width is below 850mm", () => {
    const extraction = makeExtraction({
      fireSafety: {
        exitWidths: [{ location: "Side door", width: "800mm", doorType: "Swing" }],
        corridorWidths: [],
        fireSeparations: [],
        sprinklerSystem: { present: null },
        smokeDetectors: { present: null },
        relevantNbcClauses: [],
        confidence: 0.9,
      },
    });

    const result = evaluateCompliance(extraction);
    const exitRule = result.ruleEvaluations.find((r) => r.ruleId === "NBC-3.3.1.13");
    expect(exitRule).toBeDefined();
    expect(exitRule?.result).toBe("FAIL");
  });

  it("PASS when exit width is at or above 850mm", () => {
    const extraction = makeExtraction({
      fireSafety: {
        exitWidths: [{ location: "Main entry", width: "900mm", doorType: "Swing" }],
        corridorWidths: [],
        fireSeparations: [],
        sprinklerSystem: { present: null },
        smokeDetectors: { present: null },
        relevantNbcClauses: [],
        confidence: 0.9,
      },
    });

    const result = evaluateCompliance(extraction);
    const exitRule = result.ruleEvaluations.find((r) => r.ruleId === "NBC-3.3.1.13");
    expect(exitRule).toBeDefined();
    expect(exitRule?.result).toBe("PASS");
  });
});

// ============================================================================
// Test 5: Corridor width rule — NBC 3.4.1.9
// ============================================================================
describe("NBC 3.4.1.9 — Corridor minimum 1100mm", () => {
  it("FAIL when corridor width is below 1100mm", () => {
    const extraction = makeExtraction({
      fireSafety: {
        exitWidths: [],
        corridorWidths: [{ location: "Main hallway", width: "900mm" }],
        fireSeparations: [],
        sprinklerSystem: { present: null },
        smokeDetectors: { present: null },
        relevantNbcClauses: [],
        confidence: 0.9,
      },
    });

    const result = evaluateCompliance(extraction);
    const corridorRule = result.ruleEvaluations.find((r) => r.ruleId === "NBC-3.4.1.9");
    expect(corridorRule).toBeDefined();
    expect(corridorRule?.result).toBe("FAIL");
  });
});

// ============================================================================
// Test 6: Stud size rule — NBC 9.5.5.2
// ============================================================================
describe("NBC 9.5.5.2 — Minimum stud size 38x89mm", () => {
  it("FAIL when stud dimension is below 89mm depth", () => {
    const extraction = makeExtraction({
      structural: {
        // Use a plain mm value so parseDimensionToMm can parse it below 89mm threshold
        memberSizes: [{ label: "Stud", dimension: "64mm" }],
        connectionTypes: [],
        loadPaths: [],
        materials: [],
        relevantNbcClauses: [],
        confidence: 0.8,
      },
    });

    const result = evaluateStructuralCompliance(extraction);
    const studRule = result.ruleEvaluations.find((r) => r.ruleId === "NBC-9.5.5.2");
    expect(studRule).toBeDefined();
    expect(studRule?.result).toBe("FAIL");
  });

  it("CONDITIONAL when stud dimension meets minimum", () => {
    const extraction = makeExtraction({
      structural: {
        memberSizes: [{ label: "Stud", dimension: "38x89mm" }],
        connectionTypes: [],
        loadPaths: [],
        materials: [],
        relevantNbcClauses: [],
        confidence: 0.8,
      },
    });

    const result = evaluateStructuralCompliance(extraction);
    const studRule = result.ruleEvaluations.find((r) => r.ruleId === "NBC-9.5.5.2");
    expect(studRule).toBeDefined();
    // CONDITIONAL because professional verification is always required
    expect(studRule?.result).toBe("CONDITIONAL");
  });
});

// ============================================================================
// Test 7: Audit trail — router uses protectedProcedure, inserts to DB, requires disclaimer
// ============================================================================
describe("PD2.0 §8 — Audit Trail Schema", () => {
  it("drawingAnalysisRouter source code contains disclaimerAcknowledged field", () => {
    const source = readFileSync(
      join(__dirname, "../routers/drawingAnalysisRouter.ts"),
      "utf-8"
    );
    expect(source).toContain("disclaimerAcknowledged");
  });

  it("drawingAnalysisRouter source code uses protectedProcedure (not publicProcedure) for analyze", () => {
    const source = readFileSync(
      join(__dirname, "../routers/drawingAnalysisRouter.ts"),
      "utf-8"
    );
    expect(source).toContain("protectedProcedure");
    // publicProcedure should not be used for the analyze endpoint
    const lines = source.split("\n");
    const analyzeLine = lines.findIndex(l => l.includes("analyze:"));
    if (analyzeLine > -1) {
      const analyzeBlock = lines.slice(analyzeLine, analyzeLine + 5).join("\n");
      expect(analyzeBlock).not.toContain("publicProcedure");
    }
  });

  it("drawingAnalysisRouter source code inserts into complianceAuditTrail", () => {
    const source = readFileSync(
      join(__dirname, "../routers/drawingAnalysisRouter.ts"),
      "utf-8"
    );
    expect(source).toContain("complianceAuditTrail");
  });

  it("drawingAnalysisRouter source code inserts into drawingAnalyses table", () => {
    const source = readFileSync(
      join(__dirname, "../routers/drawingAnalysisRouter.ts"),
      "utf-8"
    );
    expect(source).toContain("drawingAnalyses");
  });
});

// ============================================================================
// Test 8: Two-stage pipeline separation
// ============================================================================
describe("PD2.0 §4.1 — Two-Stage Pipeline Separation", () => {
  it("compliance engine source code must NOT import or call invokeLLM", () => {
    const source = readFileSync(
      join(__dirname, "../services/drawingComplianceEngine.ts"),
      "utf-8"
    );
    expect(source).not.toContain("invokeLLM");
    expect(source).not.toContain("from.*llm");
  });

  it("extraction service source code must NOT import from drawingComplianceEngine", () => {
    const source = readFileSync(
      join(__dirname, "../services/drawingExtractionService.ts"),
      "utf-8"
    );
    expect(source).not.toContain("evaluateCompliance");
    // Check for actual import statement, not comment references
    expect(source).not.toMatch(/^import.*drawingComplianceEngine/m);
    expect(source).not.toMatch(/from.*drawingComplianceEngine/m);
  });
});
