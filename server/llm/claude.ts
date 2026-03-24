import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../logger";

// Initialize once
// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

if (!process.env.ANTHROPIC_API_KEY) {
  logger.warn("⚠️ [Claude] ANTHROPIC_API_KEY not set");
}

/**
 * Main interface to Claude for compliance analysis
 * Handles retries, token limits, and error logging
 */
export async function analyzeComplianceWithClaude(
  buildingDescription: string,
  occupancyType: string,
  province: string,
  context?: {
    analysisId?: string;
    userId?: string;
  }
): Promise<{
  success: boolean;
  analysis?: string;
  confidence?: number;
  error?: string;
  source: "claude" | "fallback";
}> {
  try {
    logger.info("🔵 [Claude] Starting compliance analysis", {
      analysisId: context?.analysisId,
      province,
      occupancyType,
    });

    const systemPrompt = buildComplianceSystemPrompt(province);
    const userPrompt = buildComplianceUserPrompt(
      buildingDescription,
      occupancyType,
      province
    );

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract text from response
    const analysisText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("\n");

    if (!analysisText) {
      throw new Error("No text content in Claude response");
    }

    logger.info("🟢 [Claude] Analysis complete", {
      analysisId: context?.analysisId,
      tokens: response.usage?.output_tokens,
      stopReason: response.stop_reason,
    });

    return {
      success: true,
      analysis: analysisText,
      confidence: 0.95, // Claude's primary model is highly reliable
      source: "claude",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("🔴 [Claude] Analysis failed", {
      error: errorMessage,
      analysisId: context?.analysisId,
    });

    // Return error for caller to handle fallback
    return {
      success: false,
      error: errorMessage,
      source: "fallback",
    };
  }
}

/**
 * Claude Vision API for drawing analysis (SKELETON - not yet implemented)
 */
export async function analyzeDrawingWithClaude(
  imageData: {
    type: "base64" | "url";
    data: string;
  },
  context?: {
    analysisId?: string;
    userId?: string;
  }
): Promise<{
  success: boolean;
  analysis?: string;
  error?: string;
  source: "claude-vision" | string;
}> {
  try {
    logger.info("🔵 [Claude Vision] Starting drawing analysis", {
      analysisId: context?.analysisId,
      imageType: imageData.type,
    });

    // TODO: Implement Claude Vision integration
    // For now, return placeholder
    logger.warn("⚠️ [Claude Vision] Not yet implemented", {
      analysisId: context?.analysisId,
    });

    return {
      success: false,
      error: "Vision API not yet implemented",
      source: "claude-vision",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("🔴 [Claude Vision] Analysis failed", {
      error: errorMessage,
      analysisId: context?.analysisId,
    });

    return {
      success: false,
      error: errorMessage,
      source: "claude-vision",
    };
  }
}

/**
 * Build system prompt for building code compliance analysis
 * This is the instruction set Claude follows
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
