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
}): Promise<{ parsed: unknown; modelVersion: string }> {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const { imageBase64, mimeType, systemPrompt, userPrompt, jsonSchema } = params;

  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  console.log('[Anthropic] API key prefix:', ENV.anthropicApiKey?.substring(0, 15) ?? 'NOT SET');

  const response = await client.messages.create({
    model: ANTHROPIC_VISION_MODEL,
    max_tokens: 4096,
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
  const text = block.text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  return {
    parsed: JSON.parse(text),
    modelVersion: response.model,
  };
}
