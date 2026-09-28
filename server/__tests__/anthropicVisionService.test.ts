import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  }
  class Anthropic {
    static APIError = APIError;
    messages = { create: createMock };
    constructor(_options: { apiKey: string }) {}
  }
  return { default: Anthropic };
});
vi.mock('../_core/env', () => ({ ENV: { anthropicApiKey: 'test-key' } }));

describe('callAnthropicVision provider failures', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  const params = {
    imageBase64: 'ZmFrZQ==',
    mimeType: 'image/png',
    systemPrompt: 'system',
    userPrompt: 'user',
    jsonSchema: {},
  };

  it('maps authentication and account failures to a non-technical message', async () => {
    createMock.mockRejectedValueOnce(Object.assign(new Error('credit balance suspended'), { status: 400 }));
    const { callAnthropicVision } = await import('../services/anthropicVisionService');

    await expect(callAnthropicVision(params)).rejects.toThrow(
      'The AI analysis service is currently unavailable due to an account issue',
    );
  });

  it('maps rate limits to a temporary-busy message', async () => {
    createMock.mockRejectedValueOnce(Object.assign(new Error('rate limit exceeded'), { status: 429 }));
    const { callAnthropicVision } = await import('../services/anthropicVisionService');

    await expect(callAnthropicVision(params)).rejects.toThrow(
      'The AI analysis service is temporarily busy',
    );
  });

  it('maps unknown provider failures to a generic temporary-unavailable message', async () => {
    createMock.mockRejectedValueOnce(new Error('internal SDK details should not escape'));
    const { callAnthropicVision } = await import('../services/anthropicVisionService');

    await expect(callAnthropicVision(params)).rejects.toThrow(
      'The AI analysis service is temporarily unavailable',
    );
    await expect(callAnthropicVision(params)).rejects.not.toThrow('internal SDK details');
  });

  it('leaves successful vision responses unchanged', async () => {
    createMock.mockResolvedValueOnce({
      model: 'test-model',
      content: [{ type: 'text', text: '{"rooms":[]}' }],
    });
    const { callAnthropicVision } = await import('../services/anthropicVisionService');

    await expect(callAnthropicVision(params)).resolves.toMatchObject({
      parsed: { rooms: [] },
      rawText: '{"rooms":[]}',
      modelVersion: 'test-model',
    });
  });
});
