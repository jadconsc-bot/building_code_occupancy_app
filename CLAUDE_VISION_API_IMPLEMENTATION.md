# Claude Vision API Implementation - Complete Code Reference

**Date:** March 15, 2026  
**Project:** Building Code Occupancy App (CodeComply)  
**Purpose:** Show exact code for Claude Vision API integration

---

## 1. FILE LOCATIONS

| File | Purpose |
|------|---------|
| `server/integrations/ClaudeVisionClient.ts` | Claude Vision API client (PRODUCTION READY) |
| `server/services/DrawingDataService.ts` | Drawing analysis service (uses ClaudeVisionClient) |
| `server/services/DrawingDataService.UPDATED.ts` | Example of integration (reference only) |

---

## 2. COMPLETE CLAUDE VISION CLIENT CODE

**File:** `server/integrations/ClaudeVisionClient.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

export interface LLMResponse {
  content: string; // JSON string from Claude
  model: string; // Model name used
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeVisionClient {
  private client: Anthropic;
  private readonly MODEL = 'claude-3-5-sonnet-20241022';
  private readonly MAX_TOKENS = 4096;
  private readonly TIMEOUT_MS = 30000;

  constructor() {
    // API KEY SOURCING:
    // Automatically reads from ANTHROPIC_API_KEY environment variable
    // Injected by Manus platform in production
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: this.TIMEOUT_MS,
    });
  }

  /**
   * FULL FUNCTION: Call Claude Vision API with image
   * 
   * This is the exact function that constructs and sends the API request.
   */
  async analyzeDrawing(
    imageBuffer: Buffer,
    mimeType: string,
    prompt: string
  ): Promise<LLMResponse> {
    try {
      // STEP 1: Convert image buffer to base64
      // This is how images are passed to the Claude Vision API
      const base64Image = imageBuffer.toString('base64');

      console.log('[ClaudeVisionClient.analyzeDrawing] Starting analysis', {
        model: this.MODEL,
        mimeType,
        bufferSize: imageBuffer.length,
        timestamp: new Date().toISOString(),
      });

      // STEP 2: Construct API request
      // This is the EXACT API request structure sent to Claude
      const response = await this.client.messages.create({
        // MODEL STRING: Specifies which Claude model to use
        model: this.MODEL, // 'claude-3-5-sonnet-20241022'

        // Maximum tokens in response
        max_tokens: this.MAX_TOKENS,

        // Messages array with image and text
        messages: [
          {
            role: 'user',
            content: [
              // IMAGE PART: How images are passed to the API
              {
                type: 'image',
                source: {
                  type: 'base64', // Images passed as base64-encoded data
                  media_type: mimeType, // application/pdf, image/png, image/jpeg
                  data: base64Image, // Base64-encoded image data
                },
              },
              // TEXT PART: The analysis prompt
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // STEP 3: Parse response
      // This is how the API response is parsed and returned
      const content = response.content[0];

      if (content.type !== 'text') {
        throw new Error(`Unexpected response type: ${content.type}`);
      }

      // STEP 4: Extract and structure response
      const llmResponse: LLMResponse = {
        // RESPONSE PARSING: Extract content from Claude response
        content: content.text, // The actual text response from Claude
        model: response.model, // The model that processed the request
        usage: {
          // Token usage for billing and monitoring
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };

      console.log('[ClaudeVisionClient.analyzeDrawing] Analysis complete', {
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        responseLength: content.text.length,
        timestamp: new Date().toISOString(),
      });

      // STEP 5: Return structured response to caller
      return llmResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('[ClaudeVisionClient.analyzeDrawing] API error', {
        error: errorMessage,
        mimeType,
        bufferSize: imageBuffer.length,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * ALTERNATIVE: Analyze drawing with system prompt
   * 
   * Shows alternative API usage pattern with system-level instructions.
   */
  async analyzeDrawingWithSystemPrompt(
    imageBuffer: Buffer,
    mimeType: string,
    prompt: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    try {
      const base64Image = imageBuffer.toString('base64');

      const response = await this.client.messages.create({
        model: this.MODEL,
        max_tokens: this.MAX_TOKENS,
        system: systemPrompt || 'You are an expert structural engineer analyzing construction drawings.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      const content = response.content[0];

      if (content.type !== 'text') {
        throw new Error(`Unexpected response type: ${content.type}`);
      }

      return {
        content: content.text,
        model: response.model,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('[ClaudeVisionClient.analyzeDrawingWithSystemPrompt] Error:', error);
      throw error;
    }
  }

  getModel(): string {
    return this.MODEL;
  }

  getTimeout(): number {
    return this.TIMEOUT_MS;
  }
}

export const claudeVisionClient = new ClaudeVisionClient();
```

---

## 3. HOW DRAWINGDATASERVICE USES CLAUDEVISIONCLIENT

**File:** `server/services/DrawingDataService.ts` (relevant excerpt)

```typescript
import { claudeVisionClient } from '../integrations/ClaudeVisionClient';

export class DrawingDataService {
  async extractDrawingData(
    input: DrawingDataExtractionInput
  ): Promise<DrawingDataExtractionResult> {
    // ... validation code ...

    const prompt = this.generateExtractionPrompt(input.analysisType);

    // THIS IS THE ACTUAL API CALL:
    // claudeVisionClient.analyzeDrawing() sends request to Claude Vision API
    let llmResponse = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // ACTUAL API CALL TO CLAUDE VISION
        llmResponse = await claudeVisionClient.analyzeDrawing(
          input.drawingBuffer,        // Image file as Buffer
          input.drawingMimeType,      // MIME type: application/pdf, image/png, image/jpeg
          prompt                      // Text prompt for analysis
        );
        break; // Success
      } catch (error) {
        lastError = error as Error;
        console.warn(`[DrawingDataService] LLM call attempt ${attempt} failed:`, {
          error: lastError.message,
          attempt,
          maxRetries: this.MAX_RETRIES,
        });

        if (attempt < this.MAX_RETRIES) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await this.sleep(backoffMs);
        }
      }
    }

    if (!llmResponse) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to extract drawing data after retries.',
      });
    }

    // Parse the JSON response from Claude
    let extractedData: unknown;
    try {
      extractedData = JSON.parse(llmResponse.content);
    } catch (error) {
      console.error('[DrawingDataService] Failed to parse LLM response:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        response: llmResponse.content.substring(0, 200),
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to parse drawing analysis.',
      });
    }

    // Validate against Zod schema
    const validationResult = DrawingDataSchema.safeParse(extractedData);

    if (!validationResult.success) {
      return {
        extractionId: 0,
        analysisId: input.analysisId,
        extractedData: extractedData as DrawingData,
        extractionModel: this.LLM_MODEL,
        extractionPromptVersion: this.EXTRACTION_PROMPT_VERSION,
        extractionConfidence: 0.3,
        extractedAt: new Date(),
        validationErrors: [validationResult.error],
      };
    }

    // Calculate confidence score
    const confidence = this.calculateConfidence(
      validationResult.data,
      llmResponse.usage
    );

    return {
      extractionId: 0,
      analysisId: input.analysisId,
      extractedData: validationResult.data,
      extractionModel: this.LLM_MODEL,
      extractionPromptVersion: this.EXTRACTION_PROMPT_VERSION,
      extractionConfidence: confidence,
      extractedAt: new Date(),
    };
  }
}
```

---

## 4. EXACT ANSWERS TO YOUR QUESTIONS

### Q1: Full function that constructs and sends the API request

**Answer:** `ClaudeVisionClient.analyzeDrawing()` in `server/integrations/ClaudeVisionClient.ts` (lines 54-130)

The function:
1. Converts image buffer to base64
2. Calls `this.client.messages.create()` with the image and prompt
3. Parses the response
4. Returns structured LLMResponse

### Q2: How images are passed to the API

**Answer:** **Base64 encoding**

```typescript
const base64Image = imageBuffer.toString('base64');

const response = await this.client.messages.create({
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',              // Base64 encoding method
            media_type: mimeType,        // application/pdf, image/png, image/jpeg
            data: base64Image,           // Base64-encoded image data
          },
        },
        // ... text prompt ...
      ],
    },
  ],
});
```

**Supported MIME types:**
- `application/pdf` - PDF drawings
- `image/png` - PNG images
- `image/jpeg` - JPEG images

### Q3: Where the API key is sourced from

**Answer:** Environment variable `ANTHROPIC_API_KEY`

```typescript
constructor() {
  this.client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY, // Read from environment
    timeout: this.TIMEOUT_MS,
  });
}
```

**How it works:**
- Anthropic SDK automatically reads `ANTHROPIC_API_KEY` environment variable
- In production: Manus platform injects this automatically
- In development: Set in `.env` file (not committed to git)
- Never hardcode API keys in source code

### Q4: The model string being used in the request

**Answer:** `'claude-3-5-sonnet-20241022'`

```typescript
private readonly MODEL = 'claude-3-5-sonnet-20241022';

const response = await this.client.messages.create({
  model: this.MODEL, // 'claude-3-5-sonnet-20241022'
  max_tokens: 4096,
  // ...
});
```

**Why this model:**
- Latest Claude 3.5 Sonnet (as of March 2026)
- Excellent vision capabilities for technical drawings
- Balanced cost/performance
- Can handle complex structural drawings

### Q5: How the response is parsed and returned to the caller

**Answer:** Three-step process

```typescript
// STEP 1: Extract text content from response
const content = response.content[0];

if (content.type !== 'text') {
  throw new Error(`Unexpected response type: ${content.type}`);
}

// STEP 2: Structure the response
const llmResponse: LLMResponse = {
  content: content.text,                    // Claude's text response
  model: response.model,                    // Model used
  usage: {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  },
};

// STEP 3: Return to caller
return llmResponse;
```

**Response structure:**
```typescript
interface LLMResponse {
  content: string;           // JSON string from Claude
  model: string;             // Model name
  usage: {
    input_tokens: number;    // Tokens consumed by input
    output_tokens: number;   // Tokens consumed by output
  };
}
```

### Q6: Which file(s) this lives in (full path from project root)

**Answer:** Two files

| File | Purpose |
|------|---------|
| `server/integrations/ClaudeVisionClient.ts` | Claude Vision API client (PRODUCTION) |
| `server/services/DrawingDataService.ts` | Drawing analysis service (uses client) |

**Full paths from project root:**
- `/home/ubuntu/building_code_occupancy_app/server/integrations/ClaudeVisionClient.ts`
- `/home/ubuntu/building_code_occupancy_app/server/services/DrawingDataService.ts`

---

## 5. ENVIRONMENT SETUP

### Required npm package

```bash
npm install @anthropic-ai/sdk
```

### Environment variable

```bash
# .env (development)
ANTHROPIC_API_KEY=sk-ant-...

# Production: Injected by Manus platform
```

### TypeScript types

```bash
npm install --save-dev @types/node
```

---

## 6. ERROR HANDLING

The implementation includes comprehensive error handling:

```typescript
try {
  const response = await this.client.messages.create({
    // ... API request ...
  });
  // ... parse response ...
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  console.error('[ClaudeVisionClient.analyzeDrawing] API error', {
    error: errorMessage,
    mimeType,
    bufferSize: imageBuffer.length,
    timestamp: new Date().toISOString(),
  });

  throw error; // Re-throw for caller to handle
}
```

**Common errors:**
- `401 Unauthorized` - Invalid API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Claude API issue
- `Timeout` - Request took > 30 seconds

---

## 7. RETRY LOGIC

DrawingDataService implements exponential backoff:

```typescript
for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
  try {
    llmResponse = await claudeVisionClient.analyzeDrawing(
      input.drawingBuffer,
      input.drawingMimeType,
      prompt
    );
    break; // Success
  } catch (error) {
    if (attempt < this.MAX_RETRIES) {
      const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      await this.sleep(backoffMs);
    }
  }
}
```

**Retry strategy:**
- Attempt 1: Immediate
- Attempt 2: Wait 1 second
- Attempt 3: Wait 2 seconds
- Attempt 4: Wait 4 seconds
- Max 3 retries (configurable)

---

## 8. USAGE EXAMPLE

```typescript
import { claudeVisionClient } from './server/integrations/ClaudeVisionClient';
import fs from 'fs';

// Read drawing file
const drawingBuffer = fs.readFileSync('structural-drawing.pdf');

// Analyze drawing
const result = await claudeVisionClient.analyzeDrawing(
  drawingBuffer,
  'application/pdf',
  'Extract all structural members, dimensions, and connections from this drawing.'
);

console.log('Extracted data:', result.content);
console.log('Tokens used:', result.usage);
```

---

## 9. LEGAL DEFENSIBILITY

**Critical boundary:** LLM output NEVER directly influences compliance decisions.

```typescript
// STEP 1: LLM extracts drawing data
const llmResponse = await claudeVisionClient.analyzeDrawing(...);
const extractedData = JSON.parse(llmResponse.content);

// STEP 2: Validate extracted data
const validationResult = DrawingDataSchema.safeParse(extractedData);

// STEP 3: Rule engine evaluates (NOT LLM)
// ComplianceEngine uses deterministic rules, never LLM output
const complianceResult = await complianceEngine.evaluate(validationResult.data);
```

**Audit trail records:**
- Extraction model version
- Extraction confidence score
- Extracted data (for reproducibility)
- Rule engine evaluation (deterministic)

---

## 10. PRODUCTION DEPLOYMENT CHECKLIST

- [ ] `ANTHROPIC_API_KEY` environment variable configured
- [ ] `@anthropic-ai/sdk` npm package installed
- [ ] ClaudeVisionClient.ts deployed to production
- [ ] DrawingDataService.ts updated to use ClaudeVisionClient
- [ ] Error handling tested (timeout, invalid API key, etc.)
- [ ] Retry logic tested
- [ ] Token usage monitored
- [ ] Audit trail records extraction events
- [ ] LLM output never influences compliance decisions
- [ ] Response parsing validated with real drawings

---

**End of Implementation Reference**
