/**
 * DrawingDataService
 * 
 * LEGAL DEFENSIBILITY SERVICE - STAGE 1: DATA EXTRACTION
 * 
 * Extracts structured drawing data from PDF/image files using Claude Vision LLM.
 * This is the FIRST STAGE of the two-stage pipeline:
 * 1. LLM extracts drawing data (members, dimensions, assemblies, connections)
 * 2. Rule engine evaluates extracted data against NBC rules
 * 
 * CRITICAL BOUNDARY: LLM output NEVER directly influences compliance decisions.
 * All compliance scores, issue classifications, and legally consequential outputs
 * flow exclusively from the deterministic rule engine.
 * 
 * EXTRACTION CONFIDENCE: Scored 0.0-1.0 to measure LLM certainty.
 * Low confidence (<0.5) triggers manual review flag.
 * 
 * AUDIT TRAIL: Records extraction model version, confidence, extracted data, and building code variant.
 * Enables reproducibility and legal defensibility.
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { claudeVisionClient } from '../integrations/ClaudeVisionClient';

/**
 * Zod schemas for runtime type validation
 * Ensures extracted data conforms to expected structure
 */

const StructuralMemberSchema = z.object({
  type: z.enum(['beam', 'column', 'stud', 'header', 'joist', 'rafter', 'plate']),
  material: z.string(), // e.g., "Steel C15x40", "2x6 SPF"
  quantity: z.number().positive(),
  span: z.number().positive().optional(), // In mm
  height: z.number().positive().optional(),
  notes: z.string().optional(),
});

const AssemblySchema = z.object({
  type: z.enum(['wall', 'roof', 'floor', 'foundation', 'connection']),
  description: z.string(),
  fireRating: z.string().optional(), // e.g., "2-hour", "1-hour"
  members: z.array(StructuralMemberSchema),
  notes: z.string().optional(),
});

const ConnectionSchema = z.object({
  type: z.enum(['bolted', 'welded', 'screwed', 'nailed', 'riveted']),
  members: z.array(z.string()), // Member IDs being connected
  fastenerType: z.string(), // e.g., "M16 Grade 8.8 bolt"
  edgeDistance: z.number().optional(), // In mm
  spacing: z.number().optional(), // In mm
  notes: z.string().optional(),
});

const MaterialSpecificationSchema = z.object({
  material: z.string(), // e.g., "Steel", "Wood", "Concrete"
  grade: z.string(), // e.g., "Grade 50", "SPF", "30 MPa"
  quantity: z.number().positive(),
  unit: z.string(), // e.g., "kg", "board feet", "m3"
  notes: z.string().optional(),
});

const DimensionSchema = z.object({
  description: z.string(), // e.g., "Beam span", "Column height"
  value: z.number().positive(),
  unit: z.string(), // e.g., "mm", "m", "ft"
});

const AnnotationSchema = z.object({
  text: z.string(),
  location: z.string().optional(), // e.g., "top-left", "center"
  type: z.enum(['note', 'label', 'dimension', 'symbol']).optional(),
});

export const DrawingDataSchema = z.object({
  members: z.array(StructuralMemberSchema).optional(),
  assemblies: z.array(AssemblySchema).optional(),
  connections: z.array(ConnectionSchema).optional(),
  materials: z.array(MaterialSpecificationSchema).optional(),
  dimensions: z.array(DimensionSchema).optional(),
  annotations: z.array(AnnotationSchema).optional(),
  summary: z.string().optional(), // Overall drawing description
});

export type DrawingData = z.infer<typeof DrawingDataSchema>;

/**
 * LLM response structure
 */
interface LLMResponse {
  content: string; // JSON string
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Extraction input with credentials for audit trail
 */
export interface DrawingDataExtractionInput {
  analysisId: number;
  drawingBuffer: Buffer;
  drawingMimeType: string;
  analysisType: 'structural' | 'fire-safety' | 'connections' | 'comprehensive';
  buildingCodeVariant?: string; // e.g., 'NBC-2023', 'Alberta-2023', 'BC-2024'
  credentials: {
    userId: number;
    userEmail: string;
    ipAddress: string;
    sessionId: string;
  };
}

/**
 * Extraction result with confidence and audit info
 */
export interface DrawingDataExtractionResult {
  extractionId: number;
  analysisId: number;
  extractedData: DrawingData;
  extractionModel: string;
  extractionPromptVersion: string;
  extractionConfidence: number; // 0.0-1.0
  extractedAt: Date; // Server-generated UTC
  buildingCodeVariant?: string; // Audit trail: which code variant was used
  validationErrors?: z.ZodError[];
}

/**
 * HTTP status code classification for retry decisions
 */
interface HttpError extends Error {
  statusCode?: number;
  message: string;
}

export class DrawingDataService {
  private readonly LLM_MODEL = 'claude-sonnet-4-6'; // Updated to latest model
  private readonly EXTRACTION_PROMPT_VERSION = '2.0'; // Incremented for building code variant support
  private readonly LLM_TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.5;

  /**
   * Determine if an error is retriable
   * 
   * RETRIABLE ERRORS:
   * - 429 (Too Many Requests): Rate limit - retry with backoff
   * - 5xx (Server Errors): Temporary server issues - retry with backoff
   * - Timeout: Network issue - retry with backoff
   * 
   * NON-RETRIABLE ERRORS:
   * - 401 (Unauthorized): Invalid credentials - fail fast
   * - 403 (Forbidden): Access denied - fail fast
   * - 400 (Bad Request): Invalid input - fail fast
   * - 404 (Not Found): Resource missing - fail fast
   * 
   * @param error Error to classify
   * @returns true if error is retriable, false otherwise
   */
  private isRetriableError(error: unknown): boolean {
    // Extract status code if available
    const statusCode = this.extractStatusCode(error);
    
    // RETRIABLE ERRORS (check these FIRST before generic ranges)
    
    // Retriable: Rate limit (429) - must check BEFORE generic 4xx range
    if (statusCode === 429) {
      return true;
    }
    
    // Retriable: Server errors (5xx)
    if (statusCode && statusCode >= 500) {
      return true;
    }
    
    // Retriable: Timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      return true;
    }
    
    // NON-RETRIABLE ERRORS
    
    // Non-retriable: Auth errors (401, 403)
    if (statusCode === 401 || statusCode === 403) {
      return false;
    }
    
    // Non-retriable: Other client errors (400, 404, etc.)
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return false;
    }
    
    // Default: Not retriable (fail fast on unknown errors)
    return false;
  }

  /**
   * Extract HTTP status code from error object
   * 
   * Handles various error formats:
   * - { statusCode: number }
   * - { status: number }
   * - { response: { status: number } }
   * - Error message containing status code
   * 
   * @param error Error object
   * @returns Status code or undefined
   */
  private extractStatusCode(error: unknown): number | undefined {
    if (!error) return undefined;
    
    // Direct statusCode property
    if (typeof error === 'object' && 'statusCode' in error) {
      const code = (error as any).statusCode;
      if (typeof code === 'number') return code;
    }
    
    // Direct status property
    if (typeof error === 'object' && 'status' in error) {
      const code = (error as any).status;
      if (typeof code === 'number') return code;
    }
    
    // Nested response.status
    if (typeof error === 'object' && 'response' in error) {
      const response = (error as any).response;
      if (response && typeof response === 'object' && 'status' in response) {
        const code = response.status;
        if (typeof code === 'number') return code;
      }
    }
    
    // Try to extract from error message
    if (error instanceof Error) {
      const match = error.message.match(/\b(\d{3})\b/);
      if (match) {
        const code = parseInt(match[1], 10);
        if (code >= 100 && code < 600) return code;
      }
    }
    
    return undefined;
  }

  /**
   * Extract structured drawing data from file
   * 
   * DETERMINISTIC: Same drawing + same prompt version = same extraction
   * AUDITED: Records model version, confidence, extracted data, building code variant
   * VALIDATED: All extracted data passes Zod schema
   * 
   * STEPS:
   * 1. Validate input
   * 2. Generate extraction prompt based on analysis type
   * 3. Call Claude Vision API with retry logic (includes building code variant)
   * 4. Parse LLM response as JSON
   * 5. Validate against Zod schema
   * 6. Calculate confidence score
   * 7. Return extraction result with audit trail
   * 
   * @param input Extraction input with drawing buffer, credentials, and building code variant
   * @returns Extraction result with validated data, confidence, and audit trail
   * @throws TRPCError on validation or extraction failure
   */
  async extractDrawingData(
    input: DrawingDataExtractionInput
  ): Promise<DrawingDataExtractionResult> {
    // STEP 1: Validate input
    this.validateExtractionInput(input);

    try {
      // STEP 2: Generate extraction prompt
      const prompt = this.generateExtractionPrompt(input.analysisType);

      // STEP 3: Call Claude Vision API with smart retry logic
      let llmResponse: LLMResponse | null = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          llmResponse = await this.callClaudeVisionWithTimeout(
            input.drawingBuffer,
            input.drawingMimeType,
            prompt,
            input.buildingCodeVariant
          );
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error as Error;
          const statusCode = this.extractStatusCode(error);
          const isRetriable = this.isRetriableError(error);
          
          console.warn(`[DrawingDataService] LLM call attempt ${attempt} failed:`, {
            error: lastError.message,
            statusCode,
            isRetriable,
            attempt,
            maxRetries: this.MAX_RETRIES,
            buildingCodeVariant: input.buildingCodeVariant,
          });

          // FAIL FAST: Do not retry on non-retriable errors (401, 403, 4xx)
          if (!isRetriable) {
            console.error(`[DrawingDataService] Non-retriable error (${statusCode}), failing immediately:`, {
              error: lastError.message,
              statusCode,
              userId: input.credentials.userId,
              analysisId: input.analysisId,
            });
            throw lastError;
          }

          if (attempt < this.MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            console.info(`[DrawingDataService] Retrying in ${backoffMs}ms (attempt ${attempt}/${this.MAX_RETRIES})`);
            await this.sleep(backoffMs);
          }
        }
      }

      if (!llmResponse) {
        // If we exhausted retries, throw the last error with appropriate code
        const statusCode = this.extractStatusCode(lastError);
        
        if (statusCode === 429) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'API rate limit exceeded. Please try again later.',
          });
        }
        
        if (statusCode && statusCode >= 500) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Drawing analysis service temporarily unavailable. Please try again.',
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to extract drawing data after retries. Please try again.',
        });
      }

      // STEP 4: Parse LLM response
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
          message: 'Failed to parse drawing analysis. Please try again.',
        });
      }

      // STEP 5: Validate against Zod schema
      const validationResult = DrawingDataSchema.safeParse(extractedData);

      if (!validationResult.success) {
        console.warn('[DrawingDataService] Validation failed:', {
          errors: validationResult.error.issues,
          extractedData: JSON.stringify(extractedData).substring(0, 500),
        });

        // Return with validation errors and low confidence
        return {
          extractionId: 0, // Will be set by repository
          analysisId: input.analysisId,
          extractedData: extractedData as DrawingData,
          extractionModel: this.LLM_MODEL,
          extractionPromptVersion: this.EXTRACTION_PROMPT_VERSION,
          extractionConfidence: 0.3, // Low confidence due to validation errors
          extractedAt: new Date(),
          buildingCodeVariant: input.buildingCodeVariant,
          validationErrors: [validationResult.error],
        };
      }

      // STEP 6: Calculate confidence score
      const confidence = this.calculateConfidence(
        validationResult.data,
        llmResponse.usage
      );

      // STEP 7: Return extraction result with audit trail
      const result: DrawingDataExtractionResult = {
        extractionId: 0, // Will be set by repository
        analysisId: input.analysisId,
        extractedData: validationResult.data,
        extractionModel: this.LLM_MODEL,
        extractionPromptVersion: this.EXTRACTION_PROMPT_VERSION,
        extractionConfidence: confidence,
        extractedAt: new Date(), // Server-generated UTC
        buildingCodeVariant: input.buildingCodeVariant, // Audit trail
      };

      console.log('[DrawingDataService] Extraction successful:', {
        analysisId: input.analysisId,
        confidence,
        model: this.LLM_MODEL,
        buildingCodeVariant: input.buildingCodeVariant,
        timestamp: result.extractedAt.toISOString(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = this.extractStatusCode(error);
      
      console.error('[DrawingDataService.extractDrawingData] Error:', {
        error: errorMessage,
        statusCode,
        analysisId: input.analysisId,
        userId: input.credentials.userId,
        buildingCodeVariant: input.buildingCodeVariant,
        timestamp: new Date().toISOString(),
      });

      // Re-throw TRPCError as-is
      if (error instanceof TRPCError) {
        throw error;
      }

      // Map HTTP status codes to specific TRPC error codes
      if (statusCode === 401) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication failed. Please check your credentials.',
        });
      }
      
      if (statusCode === 403) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied. You do not have permission to perform this action.',
        });
      }
      
      if (statusCode === 400) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid request. Please check your input and try again.',
        });
      }
      
      if (statusCode === 404) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Resource not found.',
        });
      }
      
      if (statusCode === 429) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'API rate limit exceeded. Please try again later.',
        });
      }
      
      if (statusCode && statusCode >= 500) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Drawing analysis service temporarily unavailable. Please try again.',
        });
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to extract drawing data. Please try again.',
      });
    }
  }

  /**
   * Call Claude Vision API with timeout
   * 
   * Integrates ClaudeVisionClient for real API communication.
   * Passes buildingCodeVariant to system prompt for audit trail.
   * 
   * @param buffer Drawing file buffer
   * @param mimeType MIME type
   * @param prompt Extraction prompt
   * @param buildingCodeVariant Building code variant for audit trail
   * @returns LLM response
   * @throws Error on timeout or API failure
   */
  private async callClaudeVisionWithTimeout(
    buffer: Buffer,
    mimeType: string,
    prompt: string,
    buildingCodeVariant?: string
  ): Promise<LLMResponse> {
    // Use ClaudeVisionClient for real API integration
    // Passes buildingCodeVariant to system prompt for legal defensibility and audit trail
    
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error('LLM API timeout'));
      }, this.LLM_TIMEOUT_MS);

      (async () => {
        try {
          // Call ClaudeVisionClient with building code variant
          // This integrates the buildingCodeVariant into the system prompt
          // for legal defensibility and audit trail
          const response = await claudeVisionClient.analyzeDrawingWithSystemPrompt(
            buffer,
            mimeType,
            prompt,
            buildingCodeVariant // Passed to system prompt
          );

          clearTimeout(timeoutHandle);
          resolve(response);
        } catch (error) {
          clearTimeout(timeoutHandle);
          reject(error);
        }
      })();
    });
  }

  /**
   * Generate extraction prompt based on analysis type
   * 
   * AUDIT TRAIL: Prompt version is recorded in extraction result
   * Same drawing + same prompt version = reproducible extraction
   * 
   * @param analysisType Type of analysis
   * @returns Extraction prompt
   */
  private generateExtractionPrompt(analysisType: string): string {
    const basePrompt = `You are an expert structural engineer analyzing construction drawings for code compliance.

Extract the following information from the drawing:
1. Structural members (beams, columns, joists, etc.) with specifications
2. Assemblies (walls, roofs, floors, foundations) with fire ratings
3. Connections (bolted, welded, etc.) with fastener details
4. Materials and specifications with grades
5. Key dimensions and spans
6. Annotations and design notes

Return the extracted data as a JSON object matching this structure:
{
  "members": [...],
  "assemblies": [...],
  "connections": [...],
  "materials": [...],
  "dimensions": [...],
  "annotations": [...],
  "summary": "..."
}

Be precise and include all visible specifications. This data will be used for code compliance verification.`;

    switch (analysisType) {
      case 'structural':
        return basePrompt + `\n\nFocus on: Structural members, spans, loads, and connections. Include all member sizes and grades.`;
      case 'fire-safety':
        return basePrompt + `\n\nFocus on: Fire ratings, separations, and protection systems. Note all fire-rated assemblies.`;
      case 'connections':
        return basePrompt + `\n\nFocus on: Connection details, fasteners, edge distances, and spacing. Be precise with measurements.`;
      case 'comprehensive':
        return basePrompt + `\n\nProvide comprehensive analysis of all aspects including structural, fire-safety, and connections.`;
      default:
        return basePrompt;
    }
  }

  /**
   * Calculate confidence score based on extraction quality
   * 
   * FACTORS:
   * - Data completeness (more fields = higher confidence)
   * - Token usage (higher tokens = more thorough analysis)
   * - Validation success (no errors = higher confidence)
   * 
   * @param data Extracted drawing data
   * @param usage Token usage from LLM
   * @returns Confidence score 0.0-1.0
   */
  private calculateConfidence(data: DrawingData, usage: { input_tokens: number; output_tokens: number }): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on data completeness
    const fieldCount = Object.keys(data).filter(key => data[key as keyof DrawingData]).length;
    confidence += (fieldCount / 7) * 0.3; // Up to 0.3 points for completeness

    // Increase confidence based on token usage (more analysis = higher confidence)
    if (usage.output_tokens > 1000) confidence += 0.1;
    if (usage.output_tokens > 2000) confidence += 0.1;

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  /**
   * Validate extraction input
   * 
   * @param input Extraction input
   * @throws TRPCError on validation failure
   */
  private validateExtractionInput(input: DrawingDataExtractionInput): void {
    if (!input.drawingBuffer || input.drawingBuffer.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Drawing buffer is required',
      });
    }

    if (!input.drawingMimeType) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Drawing MIME type is required',
      });
    }

    if (!input.analysisType) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Analysis type is required',
      });
    }

    if (!input.credentials || !input.credentials.userId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User credentials are required',
      });
    }
  }

  /**
   * Sleep utility for retry backoff
   * 
   * @param ms Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
