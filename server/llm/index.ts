import { analyzeComplianceWithClaude } from "./claude";
import { invokeLLM } from "../_core/llm";
import { logger } from "../logger";

/**
 * Compliance analysis with intelligent fallback
 *
 * Strategy:
 * 1. Try Claude first (faster, more accurate)
 * 2. If Claude fails, fall back to Manus LLM
 * 3. Log all attempts for monitoring
 */
export async function analyzeCompliance(
  buildingDescription: string,
  occupancyType: string,
  province: string,
  context?: {
    analysisId?: string;
    userId?: string;
  }
) {
  logger.info("🟡 [LLM Routing] Starting compliance analysis", {
    analysisId: context?.analysisId,
    strategy: "Claude primary, Manus fallback",
  });

  // Try Claude first
  const claudeResult = await analyzeComplianceWithClaude(
    buildingDescription,
    occupancyType,
    province,
    context
  );

  if (claudeResult.success && claudeResult.analysis) {
    logger.info("✅ [LLM Routing] Claude analysis successful", {
      analysisId: context?.analysisId,
    });
    return {
      analysis: claudeResult.analysis,
      confidence: claudeResult.confidence || 0.95,
      source: "claude",
      usedFallback: false,
    };
  }

  // Claude failed, try Manus LLM
  logger.warn("⚠️ [LLM Routing] Claude failed, trying Manus LLM fallback", {
    analysisId: context?.analysisId,
    claudeError: claudeResult.error,
  });

  try {
    const manusResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: buildComplianceSystemPrompt(province),
        },
        {
          role: "user",
          content: buildComplianceUserPrompt(
            buildingDescription,
            occupancyType,
            province
          ),
        },
      ],
    });

    const manusAnalysis =
      manusResult.choices?.[0]?.message?.content || "Analysis failed";

    logger.info("✅ [LLM Routing] Manus LLM fallback successful", {
      analysisId: context?.analysisId,
    });

    return {
      analysis: manusAnalysis,
      confidence: 0.85, // Manus is fallback, slightly lower confidence
      source: "manus",
      usedFallback: true,
    };
  } catch (error) {
    logger.error("🔴 [LLM Routing] Both Claude and Manus failed", {
      analysisId: context?.analysisId,
      claudeError: claudeResult.error,
      manusError: error instanceof Error ? error.message : String(error),
    });

    throw new Error(
      `All LLM providers failed. Claude: ${claudeResult.error}, Manus: ${error}`
    );
  }
}

/**
 * For future use: Drawing analysis with Claude Vision
 * This will eventually replace/supplement current drawing analyzer
 */
export async function analyzeDrawing(
  imageData: {
    type: "base64" | "url";
    data: string;
  },
  context?: {
    analysisId?: string;
    userId?: string;
  }
) {
  // TODO: Implement when Vision API is ready
  // For now, return error
  throw new Error(
    "Drawing analysis with Vision API not yet implemented. Skeleton ready in server/llm/vision.ts"
  );
}

/**
 * Build system prompt for building code compliance analysis
 * This is the instruction set Claude/Manus follows
 */
function buildComplianceSystemPrompt(province: string): string {
  return `You are an expert building code compliance analyst specializing in ${province} building codes.

Your role is to analyze building descriptions and provide:
1. Occupancy classification (e.g., A-2, B-1, C-2)
2. Fire resistance rating requirements
3. Egress requirements (exits, corridors, stairs)
4. Accessibility requirements
5. Plumbing fixture requirements
6. Building service systems (electrical, HVAC, etc.)

Format your response as a structured analysis with:
- OCCUPANCY CLASSIFICATION: [code and description]
- KEY REQUIREMENTS: [list of critical code sections]
- FIRE PROTECTION: [rating and protection systems]
- EGRESS ANALYSIS: [exit requirements]
- ACCESSIBILITY: [barrier-free requirements]
- PLUMBING: [fixture unit requirements]
- COMPLIANCE NOTES: [any special considerations]

Be precise and cite specific code sections where applicable.
Only reference ${province} building codes. Do not make up code references.`;
}

/**
 * Build user prompt for specific analysis request
 */
function buildComplianceUserPrompt(
  buildingDescription: string,
  occupancyType: string,
  province: string
): string {
  return `Please analyze the following building for ${province} building code compliance:

Building Description:
${buildingDescription}

Intended Use: ${occupancyType}

Provide a detailed compliance analysis following the structure outlined in your instructions.
Focus on practical recommendations and code citations.`;
}

/**
 * Utility: Get remaining tokens in current request
 * Use this to monitor token usage for optimization
 */
export function getTokenEstimate(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Utility: Log token usage for monitoring
 */
export function logTokenUsage(
  model: string,
  inputTokens: number,
  outputTokens: number
): void {
  const inputCost = (inputTokens / 1000000) * 3; // $3 per 1M input tokens for Sonnet
  const outputCost = (outputTokens / 1000000) * 15; // $15 per 1M output tokens for Sonnet
  const totalCost = inputCost + outputCost;

  logger.info("💰 [Token Usage]", {
    model,
    inputTokens,
    outputTokens,
    estimatedCost: `$${totalCost.toFixed(4)}`,
  });
}
