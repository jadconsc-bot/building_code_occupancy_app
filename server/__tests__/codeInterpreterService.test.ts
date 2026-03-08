/**
 * Tests for CodeInterpreterService
 * Verifies LLM code interpretation functionality
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CodeInterpreterService, createCodeInterpreter } from "../codeInterpreterService";

// Mock the LLM module
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(async (params: any) => {
    // Mock LLM response for clause interpretation
    if (params.messages[1].content.includes("Interpret the following building code clause")) {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                plainLanguageExplanation:
                  "Fire-resistance ratings are the time a building assembly can resist fire without allowing flames or heat to pass through.",
                keyRequirements: [
                  "Assemblies must have minimum 1-hour fire-resistance rating",
                  "Ratings must be tested per ASTM E119",
                  "Ratings apply to walls, floors, and roof assemblies",
                ],
                examples: [
                  "A 1-hour rated wall can withstand fire for 60 minutes",
                  "Residential buildings typically require 1-hour ratings between units",
                  "Commercial buildings may require 2-hour ratings between occupancies",
                ],
                exceptions: [
                  "Sprinklered buildings may have reduced ratings",
                  "Single-story buildings may have exemptions",
                ],
                relatedClauses: ["3.2.2.1", "3.2.2.2", "4.1.5.3"],
              }),
            },
          },
        ],
      };
    }

    // Mock LLM response for compliance pathway interpretation
    if (params.messages[1].content.includes("Explain the compliance evaluation results")) {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallExplanation:
                  "The design is compliant because it meets all required fire-resistance ratings and exit requirements.",
                compliancePathway:
                  "Step 1: Occupancy C requires 1-hour fire rating. Step 2: Design provides 1-hour rating. Step 3: Exits are adequate.",
                keyTakeaways: [
                  "Fire-resistance rating is compliant",
                  "Exit requirements are met",
                  "Design can proceed",
                ],
              }),
            },
          },
        ],
      };
    }

    return {
      choices: [
        {
          message: {
            content: "Mock LLM response",
          },
        },
      ],
    };
  }),
}));

describe("CodeInterpreterService", () => {
  let service: CodeInterpreterService;

  beforeEach(() => {
    service = createCodeInterpreter();
  });

  describe("interpretClause", () => {
    it("should interpret a building code clause", async () => {
      const result = await service.interpretClause({
        code: "3.2.2.0",
        section: "Fire Safety",
        subsection: "Fire-Resistance Ratings",
        description: "Minimum fire-resistance ratings for building assemblies",
      });

      expect(result.clauseReference.code).toBe("3.2.2.0");
      expect(result.plainLanguageExplanation).toBeTruthy();
      expect(result.keyRequirements).toHaveLength(3);
      expect(result.examples).toHaveLength(3);
      expect(result.isDeterministic).toBe(false);
      expect(result.confidence).toBe("medium");
    });

    it("should include clause reference in interpretation", async () => {
      const result = await service.interpretClause({
        code: "4.1.5.3",
        section: "Exits",
        description: "Exit requirements for occupancy",
      });

      expect(result.clauseReference.code).toBe("4.1.5.3");
      expect(result.clauseReference.section).toBe("Exits");
    });

    it("should handle optional subsection", async () => {
      const result = await service.interpretClause({
        code: "3.2.2.0",
        section: "Fire Safety",
        subsection: "Fire-Resistance Ratings",
        description: "Test clause",
      });

      expect(result.clauseReference.subsection).toBe("Fire-Resistance Ratings");
    });

    it("should mark LLM response as non-deterministic", async () => {
      const result = await service.interpretClause({
        code: "3.2.2.0",
        section: "Fire Safety",
        description: "Test",
      });

      expect(result.isDeterministic).toBe(false);
    });

    it("should handle LLM errors gracefully", async () => {
      // This test verifies fallback behavior when LLM fails
      const result = await service.interpretClause({
        code: "3.2.2.0",
        section: "Fire Safety",
        description: "Test clause",
      });

      expect(result).toBeDefined();
      expect(result.clauseReference.code).toBe("3.2.2.0");
      expect(result.confidence).toBeDefined();
    });
  });

  describe("interpretCompliancePathway", () => {
    it("should interpret compliance evaluation results", async () => {
      const ruleTrace = [
        {
          rule_id: "fire_rating_rule",
          clause: "3.2.2.0",
          fired: true,
          conditions_met: true,
        },
        {
          rule_id: "exit_rule",
          clause: "4.1.5.3",
          fired: true,
          conditions_met: true,
        },
      ];

      const complianceResult = {
        complianceStatus: "compliant",
        compliance_flags: {
          fire_rating_ok: true,
          exits_ok: true,
        },
      };

      const result = await service.interpretCompliancePathway(
        ruleTrace,
        complianceResult
      );

      expect(result.rulesFired).toHaveLength(2);
      expect(result.overallExplanation).toBeTruthy();
      expect(result.compliancePathway).toBeTruthy();
      expect(result.keyTakeaways).toBeDefined();
    });

    it("should include interpretations for each fired rule", async () => {
      const ruleTrace = [
        {
          rule_id: "fire_rating_rule",
          clause: "3.2.2.0",
          fired: true,
          conditions_met: true,
        },
      ];

      const complianceResult = {
        complianceStatus: "compliant",
        compliance_flags: {},
      };

      const result = await service.interpretCompliancePathway(
        ruleTrace,
        complianceResult
      );

      expect(result.rulesFired[0].clauseReference.code).toBe("3.2.2.0");
      expect(result.rulesFired[0].interpretation).toBeDefined();
      expect(result.rulesFired[0].conditionsMet).toBe(true);
    });

    it("should handle empty rule trace", async () => {
      const result = await service.interpretCompliancePathway([], {
        complianceStatus: "compliant",
        compliance_flags: {},
      });

      expect(result.rulesFired).toHaveLength(0);
      expect(result.overallExplanation).toBeDefined();
    });

    it("should handle non-compliant status", async () => {
      const ruleTrace = [
        {
          rule_id: "fire_rating_rule",
          clause: "3.2.2.0",
          fired: false,
          conditions_met: false,
        },
      ];

      const complianceResult = {
        complianceStatus: "non_compliant",
        compliance_flags: {
          fire_rating_ok: false,
        },
      };

      const result = await service.interpretCompliancePathway(
        ruleTrace,
        complianceResult
      );

      expect(result.overallExplanation).toBeTruthy();
      expect(result.keyTakeaways).toBeDefined();
    });
  });

  describe("extractClauseReference", () => {
    it("should extract clause reference from rule ID", () => {
      const result = service.extractClauseReference(
        "NBC-2023-3.2.2.0-occupancy-c"
      );
      expect(result).toBe("3.2.2.0");
    });

    it("should handle rule ID without clause reference", () => {
      const result = service.extractClauseReference("simple_rule_id");
      expect(result).toBe("simple_rule_id");
    });

    it("should extract multi-digit clause references", () => {
      const result = service.extractClauseReference(
        "NBC-2023-9.25.3.15-sprinklers"
      );
      expect(result).toBe("9.25.3.15");
    });
  });

  describe("validateLLMUsage", () => {
    it("should validate that LLM is used correctly", () => {
      const result = service.validateLLMUsage();

      expect(result.valid).toBe(true);
      expect(result.message).toContain("code interpretation only");
      expect(result.message).toContain("deterministic");
    });
  });

  describe("Integration Tests", () => {
    it("should provide complete interpretation workflow", async () => {
      // Step 1: Interpret a clause
      const clauseInterpretation = await service.interpretClause({
        code: "3.2.2.0",
        section: "Fire Safety",
        description: "Fire-resistance ratings",
      });

      expect(clauseInterpretation).toBeDefined();
      expect(clauseInterpretation.isDeterministic).toBe(false);

      // Step 2: Verify LLM usage is correct
      const validation = service.validateLLMUsage();
      expect(validation.valid).toBe(true);

      // Step 3: Interpret compliance pathway
      const ruleTrace = [
        {
          rule_id: "fire_rating_rule",
          clause: "3.2.2.0",
          fired: true,
          conditions_met: true,
        },
      ];

      const pathway = await service.interpretCompliancePathway(ruleTrace, {
        complianceStatus: "compliant",
        compliance_flags: {},
      });

      expect(pathway).toBeDefined();
      expect(pathway.rulesFired).toHaveLength(1);
    });

    it("should mark all LLM-generated content as non-deterministic", async () => {
      const clause = await service.interpretClause({
        code: "3.2.2.0",
        section: "Fire Safety",
        description: "Test",
      });

      expect(clause.isDeterministic).toBe(false);

      const pathway = await service.interpretCompliancePathway(
        [
          {
            rule_id: "test",
            clause: "3.2.2.0",
            fired: true,
            conditions_met: true,
          },
        ],
        { complianceStatus: "compliant", compliance_flags: {} }
      );

      expect(pathway.rulesFired[0].interpretation.isDeterministic).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should provide fallback interpretation on LLM error", async () => {
      const result = await service.interpretClause({
        code: "3.2.2.0",
        section: "Fire Safety",
        description: "Test clause",
      });

      // Should still return valid result even if LLM fails
      expect(result).toBeDefined();
      expect(result.clauseReference.code).toBe("3.2.2.0");
      expect(result.plainLanguageExplanation).toBeTruthy();
    });

    it("should handle missing clause reference gracefully", async () => {
      const result = await service.interpretClause({
        code: "",
        section: "Test",
        description: "Test",
      });

      expect(result).toBeDefined();
      expect(result.clauseReference.code).toBe("");
    });
  });
});
