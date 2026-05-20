import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "../_core/env";

export const ANTHROPIC_TEXT_MODEL = "claude-sonnet-4-6";

export async function callAnthropicText(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<{ text: string; modelVersion: string }> {
  const client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  const response = await client.messages.create({
    model: ANTHROPIC_TEXT_MODEL,
    max_tokens: params.maxTokens ?? 1000,
    messages: [{ role: "user", content: params.userPrompt }],
    system: params.systemPrompt,
  });
  const text = response.content
    .filter(b => b.type === "text")
    .map(b => (b as any).text)
    .join("");
  return { text, modelVersion: response.model };
}
