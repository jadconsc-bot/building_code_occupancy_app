/**
 * UPDATED DrawingDataService
 * 
 * This file shows how DrawingDataService integrates with ClaudeVisionClient
 * to make actual Claude Vision API calls.
 * 
 * FILE LOCATION: server/services/DrawingDataService.ts (after update)
 * 
 * KEY CHANGES:
 * - Import ClaudeVisionClient
 * - Replace placeholder callClaudeVisionWithTimeout() with actual implementation
 * - Use claudeVisionClient.analyzeDrawing() to call the API
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { claudeVisionClient } from '../integrations/ClaudeVisionClient';

// ... (all the Zod schemas remain the same) ...

export class DrawingDataService {
  private readonly LLM_MODEL = 'claude-3-5-sonnet-20241022';
  private readonly EXTRACTION_PROMPT_VERSION = '1.0';
  private readonly LLM_TIMEOUT_MS = 30000;
  private readonly MAX_RETRIES = 3;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.5;

  /**
   * Extract structured drawing data from file
   * 
   * This method now uses the actual Claude Vision API through ClaudeVisionClient
   */
  async extractDrawingData(
    input: DrawingDataExtractionInput
  ): Promise<DrawingDataExtractionResult> {
    this.validateExtractionInput(input);

    try {
      const prompt = this.generateExtractionPrompt(input.analysisType);

      // ACTUAL API CALL: Use ClaudeVisionClient instead of placeholder
      let llmResponse = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          // THIS IS THE ACTUAL API CALL:
          // claudeVisionClient.analyzeDrawing() sends request to Claude Vision API
          llmResponse = await claudeVisionClient.analyzeDrawing(
            input.drawingBuffer,
            input.drawingMimeType,
            prompt
          );
          break;
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
          message: 'Failed to extract drawing data after retries. Please try again.',
        });
      }

      // Parse and validate response (same as before)
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

      // Validate against Zod schema (same as before)
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

      // Calculate confidence (same as before)
      const confidence = this.calculateConfidence(
        validationResult.data,
        llmResponse.usage
      );

      const result: DrawingDataExtractionResult = {
        extractionId: 0,
        analysisId: input.analysisId,
        extractedData: validationResult.data,
        extractionModel: this.LLM_MODEL,
        extractionPromptVersion: this.EXTRACTION_PROMPT_VERSION,
        extractionConfidence: confidence,
        extractedAt: new Date(),
      };

      console.log('[DrawingDataService] Extraction successful:', {
        analysisId: input.analysisId,
        confidence,
        model: this.LLM_MODEL,
        timestamp: result.extractedAt.toISOString(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DrawingDataService.extractDrawingData] Error:', {
        error: errorMessage,
        analysisId: input.analysisId,
        userId: input.credentials.userId,
        timestamp: new Date().toISOString(),
      });

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to extract drawing data. Please try again.',
      });
    }
  }

  // ... (rest of methods remain the same) ...
}
