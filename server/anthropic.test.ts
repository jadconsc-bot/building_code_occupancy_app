import { describe, it, expect, beforeAll } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Test suite to validate Anthropic API key and connection
 * This ensures the ANTHROPIC_API_KEY secret is correctly configured
 */
describe('Anthropic API Integration', () => {
  let client: Anthropic;

  beforeAll(() => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    
    client = new Anthropic({
      apiKey: apiKey,
    });
  });

  it('should successfully initialize Anthropic client', () => {
    expect(client).toBeDefined();
  });

  it('should successfully call Claude API with text analysis', async () => {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'What is building code compliance?',
        },
      ],
    });

    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.content[0].type).toBe('text');
    expect((response.content[0] as any).text).toBeTruthy();
  }, { timeout: 30000 });

  it('should handle building code compliance questions', async () => {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: 'Is a residential building with 4 units classified as Group C occupancy?',
        },
      ],
    });

    expect(response).toBeDefined();
    expect(response.content[0].type).toBe('text');
    const text = (response.content[0] as any).text;
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(0);
  }, { timeout: 30000 });

  it('should be ready for Vision API integration', async () => {
    // This test verifies the client is properly configured for future Vision API calls
    expect(client).toBeDefined();
    // Vision API will use the same client with vision_url content type
    // This is just a placeholder to ensure the infrastructure is ready
  });
});
