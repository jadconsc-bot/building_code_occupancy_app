import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

export const ANTHROPIC_VISION_MODEL = "claude-sonnet-4-6";

/**
 * Call Claude vision via the Anthropic SDK.
 * Returns the parsed JSON response and the model version string from the API.
 */
export async function callAnthropicVision(params: {
  imageBase64: string;
  mimeType: string;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  /** Maximum tokens for the response. Defaults to 8192. */
  maxTokens?: number;
}): Promise<{ parsed: unknown; rawText: string; modelVersion: string }> {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const { imageBase64, mimeType, systemPrompt, userPrompt, jsonSchema, maxTokens = 8192 } = params;

  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_VISION_MODEL,
      max_tokens: maxTokens,
      system: `${systemPrompt}\n\nReturn ONLY valid JSON with no additional text or markdown fencing. The JSON must conform to this schema:\n${JSON.stringify(jsonSchema, null, 2)}`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Anthropic returned empty or non-text content");
    }

    // Strip markdown code fences the model may add despite instructions
    const rawText = block.text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Caller receives rawText for truncation recovery; parsed stays null
    }

    return { parsed, rawText, modelVersion: response.model };
  } catch (error) {
    // Keep the complete SDK error in server logs for diagnosis, but never
    // expose provider internals, account details, or a stack trace to users.
    console.error('[AnthropicVision] Anthropic request failed:', error);

    const status = error instanceof Anthropic.APIError
      ? error.status
      : typeof error === 'object' && error !== null && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : undefined;
    const rawMessage = error instanceof Error ? error.message : String(error);

    if (status === 401 || status === 403 || (status !== undefined && status >= 400 && status < 500 && /billing|credit\s+balance|insufficient|payment|quota/i.test(rawMessage))) {
      throw new Error('The AI analysis service is currently unavailable due to an account issue. Please try again later or contact support.');
    }
    if (status === 429) {
      throw new Error('The AI analysis service is temporarily busy. Please try again in a few minutes.');
    }
    throw new Error('The AI analysis service is temporarily unavailable. Please try again shortly.');
  }
}
