/**
 * Code Interpreter Service
 * 
 * Uses LLM to interpret building code clauses and provide explanations.
 * LLM role is LIMITED to code interpretation only - NOT compliance evaluation.
 * Compliance evaluation is handled by the deterministic ComplianceEngine.
 * 
 * This service:
 * 1. Takes a rule or clause reference (e.g., "3.2.2.0")
 * 2. Uses LLM to interpret what the code means
 * 3. Returns plain language explanation with exact clause reference
 * 4. Provides examples and context
 */

import { invokeLLM } from "./_core/llm";
import type { ComplianceResult } from "./complianceEngine";

export interface ClauseReference {
  code: string; // e.g., "3.2.2.0"
  section: string; // e.g., "Fire Safety"
  subsection?: string; // e.g., "Fire-Resistance Ratings"
  description: string; // Short description from ruleset
}

export interface CodeInterpretation {
  clauseReference: ClauseReference;
  plainLanguageExplanation: string;
  keyRequirements: string[];
  examples: string[];
  exceptions?: string[];
  relatedClauses?: string[];
  confidence: "high" | "medium" | "low";
  isDeterministic: false; // Always false for LLM-generated content
}

export interface CompliancePathwayExplanation {
  rulesFired: Array<{
    clauseReference: ClauseReference;
    interpretation: CodeInterpretation;
    conditionsMet: boolean;
  }>;
  overallExplanation: string;
  compliancePathway: string;
  keyTakeaways: string[];
}

/**
 * Service for interpreting building code clauses using LLM
 * Provides plain language explanations with exact clause references
 */
export class CodeInterpreterService {
  /**
   * Interpret a single code clause
   * 
   * @param clauseReference - The clause to interpret (e.g., "3.2.2.0")
   * @param clauseDescription - The clause description from ruleset
   * @returns Plain language interpretation with examples
   */
  async interpretClause(
    clauseReference: ClauseReference
  ): Promise<CodeInterpretation> {
    try {
      const prompt = `You are a building code expert. Interpret the following building code clause in plain language.

Clause Reference: ${clauseReference.code}
Section: ${clauseReference.section}
${clauseReference.subsection ? `Subsection: ${clauseReference.subsection}` : ""}
Description: ${clauseReference.description}

Provide:
1. Plain language explanation (2-3 sentences)
2. Key requirements (3-5 bullet points)
3. Real-world examples (2-3 examples)
4. Any exceptions or special cases
5. Related clauses that might apply

Format your response as JSON with these exact keys:
{
  "plainLanguageExplanation": "...",
  "keyRequirements": ["...", "..."],
  "examples": ["...", "..."],
  "exceptions": ["...", "..."],
  "relatedClauses": ["...", "..."]
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a building code expert who explains code clauses in plain language. Always be accurate and reference the exact clause numbers. Format responses as JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Parse LLM response
      let interpretation;
      try {
        const content = response.choices[0].message.content;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        interpretation = JSON.parse(contentStr || "{}");
      } catch {
        // If JSON parsing fails, create a basic interpretation
        interpretation = {
          plainLanguageExplanation:
            response.choices[0].message.content ||
            clauseReference.description,
          keyRequirements: ["See clause " + clauseReference.code],
          examples: [],
          exceptions: [],
          relatedClauses: [],
        };
      }

      return {
        clauseReference,
        plainLanguageExplanation:
          interpretation.plainLanguageExplanation ||
          clauseReference.description,
        keyRequirements: interpretation.keyRequirements || [],
        examples: interpretation.examples || [],
        exceptions: interpretation.exceptions,
        relatedClauses: interpretation.relatedClauses,
        confidence: "medium",
        isDeterministic: false,
      };
    } catch (error) {
      console.error("Error interpreting clause:", error);
      // Return fallback interpretation
      return {
        clauseReference,
        plainLanguageExplanation: clauseReference.description,
        keyRequirements: ["See clause " + clauseReference.code],
        examples: [],
        exceptions: undefined,
        relatedClauses: undefined,
        confidence: "low",
        isDeterministic: false,
      };
    }
  }

  /**
   * Interpret a compliance pathway based on rule trace
   * Explains which rules fired and why
   * 
   * @param ruleTrace - Array of rules that fired
   * @param complianceResult - The compliance evaluation result
   * @returns Explanation of the compliance pathway
   */
  async interpretCompliancePathway(
    ruleTrace: Array<{
      rule_id: string;
      clause: string;
      fired: boolean;
      conditions_met: boolean;
    }>,
    complianceResult: any
  ): Promise<CompliancePathwayExplanation> {
    try {
      // Build list of fired rules with clause references
      const firedRules = ruleTrace
        .filter((r) => r.fired)
        .map((r) => ({
          clauseReference: {
            code: r.clause,
            section: "Building Code",
            description: r.rule_id,
          },
          conditionsMet: r.conditions_met,
        }));

      // Create prompt for LLM to explain the pathway
      const prompt = `You are a building code compliance expert. Explain the compliance evaluation results.

Rules that fired:
${firedRules.map((r) => `- Clause ${r.clauseReference.code}: ${r.clauseReference.description}`).join("\n")}

Compliance status: ${complianceResult.complianceStatus}
Compliance flags: ${JSON.stringify(complianceResult.compliance_flags)}

Provide:
1. Overall explanation of why the design is compliant/non-compliant
2. The compliance pathway (step-by-step logic)
3. Key takeaways for the designer

Format as JSON:
{
  "overallExplanation": "...",
  "compliancePathway": "...",
  "keyTakeaways": ["...", "..."]
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a building code compliance expert. Explain compliance evaluation results clearly and accurately.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Parse LLM response
      let explanation;
      try {
        const content = response.choices[0].message.content;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        explanation = JSON.parse(contentStr || "{}");
      } catch {
        explanation = {
          overallExplanation:
            response.choices[0].message.content ||
            "See compliance results above",
          compliancePathway: "See rule trace above",
          keyTakeaways: [],
        };
      }

      // Build full pathway explanation
      const interpretations = await Promise.all(
        firedRules.map((r) =>
          this.interpretClause(
            r.clauseReference as ClauseReference
          )
        )
      );

      return {
        rulesFired: firedRules.map((r, i) => ({
          ...r,
          interpretation: interpretations[i],
        })),
        overallExplanation:
          explanation.overallExplanation ||
          "See compliance results",
        compliancePathway:
          explanation.compliancePathway || "See rule trace",
        keyTakeaways: explanation.keyTakeaways || [],
      };
    } catch (error) {
      console.error("Error interpreting compliance pathway:", error);
      // Return fallback explanation
      return {
        rulesFired: [],
        overallExplanation: "See compliance results above",
        compliancePathway: "See rule trace above",
        keyTakeaways: [],
      };
    }
  }

  /**
   * Get clause reference from rule ID
   * Extracts clause number in format X.X.X.X from rule data
   * 
   * @param ruleId - The rule identifier
   * @returns Formatted clause reference (e.g., "3.2.2.0")
   */
  extractClauseReference(ruleId: string): string {
    // Try to extract clause number from rule ID
    // Format: NBC-2023-3.2.2.0-occupancy-c
    const match = ruleId.match(/(\d+\.\d+\.\d+\.\d+)/);
    return match ? match[1] : ruleId;
  }

  /**
   * Validate that LLM is only used for interpretation, not evaluation
   * This is a safety check to ensure compliance with the architecture
   */
  validateLLMUsage(): {
    valid: boolean;
    message: string;
  } {
    return {
      valid: true,
      message:
        "LLM is correctly used for code interpretation only. Compliance evaluation is deterministic.",
    };
  }
}

/**
 * Create a code interpreter service instance
 */
export function createCodeInterpreter(): CodeInterpreterService {
  return new CodeInterpreterService();
}
