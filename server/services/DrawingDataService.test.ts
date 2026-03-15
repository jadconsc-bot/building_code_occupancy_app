/**
 * DrawingDataService Integration Tests
 * 
 * Tests the complete flow:
 * 1. Extract drawing data with building code variant
 * 2. Validate extracted data
 * 3. Verify audit trail includes building code variant
 * 4. Ensure confidence scoring works correctly
 * 5. Test error handling and retries
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawingDataService, DrawingDataExtractionInput, DrawingDataExtractionResult } from './DrawingDataService';
import { TRPCError } from '@trpc/server';

// Mock ClaudeVisionClient
vi.mock('../integrations/ClaudeVisionClient', () => ({
  claudeVisionClient: {
    analyzeDrawingWithSystemPrompt: vi.fn(),
  },
}));

import { claudeVisionClient } from '../integrations/ClaudeVisionClient';

describe('DrawingDataService Integration Tests', () => {
  let service: DrawingDataService;

  beforeEach(() => {
    service = new DrawingDataService();
    vi.clearAllMocks();
  });

  describe('Building Code Variant Integration', () => {
    it('should include building code variant in extraction result', async () => {
      // Arrange
      const mockResponse = {
        content: JSON.stringify({
          members: [
            {
              type: 'beam',
              material: 'Steel C15x40',
              quantity: 2,
              span: 5000,
            },
          ],
          assemblies: [],
          connections: [],
          materials: [],
          dimensions: [],
          annotations: [],
          summary: 'Structural drawing with steel beams',
        }),
        model: 'claude-sonnet-4-6',
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      };

      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt).mockResolvedValue(mockResponse);

      const input: DrawingDataExtractionInput = {
        analysisId: 1,
        drawingBuffer: Buffer.from('fake-pdf-data'),
        drawingMimeType: 'application/pdf',
        analysisType: 'structural',
        buildingCodeVariant: 'NBC-2023',
        credentials: {
          userId: 123,
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-123',
        },
      };

      // Act
      const result = await service.extractDrawingData(input);

      // Assert
      expect(result.buildingCodeVariant).toBe('NBC-2023');
      expect(result.extractionModel).toBe('claude-sonnet-4-6');
      expect(result.extractionPromptVersion).toBe('2.0');
    });

    it('should pass building code variant to Claude API', async () => {
      // Arrange
      const mockResponse = {
        content: JSON.stringify({
          members: [],
          assemblies: [],
          connections: [],
          materials: [],
          dimensions: [],
          annotations: [],
          summary: 'Test drawing',
        }),
        model: 'claude-sonnet-4-6',
        usage: {
          input_tokens: 500,
          output_tokens: 300,
        },
      };

      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt).mockResolvedValue(mockResponse);

      const input: DrawingDataExtractionInput = {
        analysisId: 2,
        drawingBuffer: Buffer.from('fake-image-data'),
        drawingMimeType: 'image/png',
        analysisType: 'fire-safety',
        buildingCodeVariant: 'Alberta-2023',
        credentials: {
          userId: 456,
          userEmail: 'engineer@example.com',
          ipAddress: '192.168.1.1',
          sessionId: 'session-456',
        },
      };

      // Act
      await service.extractDrawingData(input);

      // Assert
      expect(claudeVisionClient.analyzeDrawingWithSystemPrompt).toHaveBeenCalledWith(
        input.drawingBuffer,
        input.drawingMimeType,
        expect.any(String), // prompt
        'Alberta-2023' // buildingCodeVariant passed
      );
    });

    it('should work without building code variant (optional parameter)', async () => {
      // Arrange
      const mockResponse = {
        content: JSON.stringify({
          members: [],
          assemblies: [],
          connections: [],
          materials: [],
          dimensions: [],
          annotations: [],
          summary: 'Test drawing without code variant',
        }),
        model: 'claude-sonnet-4-6',
        usage: {
          input_tokens: 500,
          output_tokens: 300,
        },
      };

      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt).mockResolvedValue(mockResponse);

      const input: DrawingDataExtractionInput = {
        analysisId: 3,
        drawingBuffer: Buffer.from('fake-image-data'),
        drawingMimeType: 'image/jpeg',
        analysisType: 'comprehensive',
        // buildingCodeVariant omitted
        credentials: {
          userId: 789,
          userEmail: 'user@example.com',
          ipAddress: '10.0.0.1',
          sessionId: 'session-789',
        },
      };

      // Act
      const result = await service.extractDrawingData(input);

      // Assert
      expect(result.buildingCodeVariant).toBeUndefined();
      expect(claudeVisionClient.analyzeDrawingWithSystemPrompt).toHaveBeenCalledWith(
        input.drawingBuffer,
        input.drawingMimeType,
        expect.any(String),
        undefined // buildingCodeVariant is undefined
      );
    });
  });

  describe('Audit Trail and Confidence Scoring', () => {
    it('should calculate confidence based on data completeness', async () => {
      // Arrange
      const mockResponse = {
        content: JSON.stringify({
          members: [
            {
              type: 'column',
              material: 'Steel W10x49',
              quantity: 4,
              height: 3500,
            },
          ],
          assemblies: [
            {
              type: 'floor',
              description: 'Composite floor system',
              members: [],
            },
          ],
          connections: [
            {
              type: 'bolted',
              members: ['M1', 'M2'],
              fastenerType: 'M20 Grade 8.8',
            },
          ],
          materials: [
            {
              material: 'Steel',
              grade: 'Grade 50',
              quantity: 5000,
              unit: 'kg',
            },
          ],
          dimensions: [
            {
              description: 'Column height',
              value: 3500,
              unit: 'mm',
            },
          ],
          annotations: [
            {
              text: 'Typical detail',
              location: 'top-left',
              type: 'note',
            },
          ],
          summary: 'Complete structural drawing',
        }),
        model: 'claude-sonnet-4-6',
        usage: {
          input_tokens: 2000,
          output_tokens: 2500,
        },
      };

      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt).mockResolvedValue(mockResponse);

      const input: DrawingDataExtractionInput = {
        analysisId: 4,
        drawingBuffer: Buffer.from('fake-pdf-data'),
        drawingMimeType: 'application/pdf',
        analysisType: 'comprehensive',
        buildingCodeVariant: 'NBC-2023',
        credentials: {
          userId: 111,
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-111',
        },
      };

      // Act
      const result = await service.extractDrawingData(input);

      // Assert
      expect(result.extractionConfidence).toBeGreaterThan(0.7); // High confidence for complete data
      expect(result.extractionConfidence).toBeLessThanOrEqual(1.0);
    });

    it('should record extraction metadata for audit trail', async () => {
      // Arrange
      const mockResponse = {
        content: JSON.stringify({
          members: [],
          assemblies: [],
          connections: [],
          materials: [],
          dimensions: [],
          annotations: [],
          summary: 'Simple drawing',
        }),
        model: 'claude-sonnet-4-6',
        usage: {
          input_tokens: 800,
          output_tokens: 400,
        },
      };

      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt).mockResolvedValue(mockResponse);

      const input: DrawingDataExtractionInput = {
        analysisId: 5,
        drawingBuffer: Buffer.from('fake-image-data'),
        drawingMimeType: 'image/png',
        analysisType: 'structural',
        buildingCodeVariant: 'BC-2024',
        credentials: {
          userId: 222,
          userEmail: 'engineer@example.com',
          ipAddress: '192.168.1.1',
          sessionId: 'session-222',
        },
      };

      // Act
      const result = await service.extractDrawingData(input);

      // Assert
      // Verify audit trail fields
      expect(result.extractionId).toBe(0); // Will be set by database
      expect(result.analysisId).toBe(5);
      expect(result.extractionModel).toBe('claude-sonnet-4-6');
      expect(result.extractionPromptVersion).toBe('2.0');
      expect(result.buildingCodeVariant).toBe('BC-2024');
      expect(result.extractedAt).toBeInstanceOf(Date);
      expect(result.extractionConfidence).toBeGreaterThanOrEqual(0);
      expect(result.extractionConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should throw error for missing drawing buffer', async () => {
      // Arrange
      const input: DrawingDataExtractionInput = {
        analysisId: 6,
        drawingBuffer: Buffer.alloc(0), // Empty buffer
        drawingMimeType: 'application/pdf',
        analysisType: 'structural',
        credentials: {
          userId: 333,
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-333',
        },
      };

      // Act & Assert
      await expect(service.extractDrawingData(input)).rejects.toThrow(TRPCError);
    });

    it('should throw error for missing MIME type', async () => {
      // Arrange
      const input: DrawingDataExtractionInput = {
        analysisId: 7,
        drawingBuffer: Buffer.from('fake-data'),
        drawingMimeType: '', // Empty MIME type
        analysisType: 'structural',
        credentials: {
          userId: 444,
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-444',
        },
      };

      // Act & Assert
      await expect(service.extractDrawingData(input)).rejects.toThrow(TRPCError);
    });

    it('should throw error for missing credentials', async () => {
      // Arrange
      const input: any = {
        analysisId: 8,
        drawingBuffer: Buffer.from('fake-data'),
        drawingMimeType: 'image/png',
        analysisType: 'structural',
        credentials: {
          userId: 0, // Invalid user ID
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-555',
        },
      };

      // Act & Assert
      await expect(service.extractDrawingData(input)).rejects.toThrow(TRPCError);
    });

    it('should handle invalid JSON response from LLM', async () => {
      // Arrange
      const mockResponse = {
        content: 'This is not valid JSON',
        model: 'claude-sonnet-4-6',
        usage: {
          input_tokens: 500,
          output_tokens: 300,
        },
      };

      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt).mockResolvedValue(mockResponse);

      const input: DrawingDataExtractionInput = {
        analysisId: 9,
        drawingBuffer: Buffer.from('fake-data'),
        drawingMimeType: 'image/png',
        analysisType: 'structural',
        credentials: {
          userId: 555,
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-666',
        },
      };

      // Act & Assert
      await expect(service.extractDrawingData(input)).rejects.toThrow(TRPCError);
    });

    it('should retry on API failure with exponential backoff', async () => {
      // Arrange
      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt)
        .mockRejectedValueOnce(new Error('API timeout'))
        .mockRejectedValueOnce(new Error('API timeout'))
        .mockResolvedValueOnce({
          content: JSON.stringify({
            members: [],
            assemblies: [],
            connections: [],
            materials: [],
            dimensions: [],
            annotations: [],
            summary: 'Success after retries',
          }),
          model: 'claude-sonnet-4-6',
          usage: {
            input_tokens: 500,
            output_tokens: 300,
          },
        });

      const input: DrawingDataExtractionInput = {
        analysisId: 10,
        drawingBuffer: Buffer.from('fake-data'),
        drawingMimeType: 'image/png',
        analysisType: 'structural',
        credentials: {
          userId: 666,
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-777',
        },
      };

      // Act
      const result = await service.extractDrawingData(input);

      // Assert
      expect(result).toBeDefined();
      expect(claudeVisionClient.analyzeDrawingWithSystemPrompt).toHaveBeenCalledTimes(3);
    });
  });

  describe('Analysis Type Variations', () => {
    it('should handle structural analysis type', async () => {
      // Arrange
      const mockResponse = {
        content: JSON.stringify({
          members: [
            {
              type: 'beam',
              material: 'Steel W12x65',
              quantity: 1,
              span: 6000,
            },
          ],
          assemblies: [],
          connections: [],
          materials: [],
          dimensions: [],
          annotations: [],
          summary: 'Structural analysis',
        }),
        model: 'claude-sonnet-4-6',
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      };

      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt).mockResolvedValue(mockResponse);

      const input: DrawingDataExtractionInput = {
        analysisId: 11,
        drawingBuffer: Buffer.from('fake-data'),
        drawingMimeType: 'application/pdf',
        analysisType: 'structural',
        buildingCodeVariant: 'NBC-2023',
        credentials: {
          userId: 777,
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-888',
        },
      };

      // Act
      const result = await service.extractDrawingData(input);

      // Assert
      expect(result.extractedData.members).toHaveLength(1);
      expect(result.extractedData.members?.[0].type).toBe('beam');
    });

    it('should handle fire-safety analysis type', async () => {
      // Arrange
      const mockResponse = {
        content: JSON.stringify({
          members: [],
          assemblies: [
            {
              type: 'wall',
              description: 'Fire-rated wall assembly',
              fireRating: '2-hour',
              members: [],
            },
          ],
          connections: [],
          materials: [],
          dimensions: [],
          annotations: [],
          summary: 'Fire-safety analysis',
        }),
        model: 'claude-sonnet-4-6',
        usage: {
          input_tokens: 900,
          output_tokens: 450,
        },
      };

      vi.mocked(claudeVisionClient.analyzeDrawingWithSystemPrompt).mockResolvedValue(mockResponse);

      const input: DrawingDataExtractionInput = {
        analysisId: 12,
        drawingBuffer: Buffer.from('fake-data'),
        drawingMimeType: 'image/png',
        analysisType: 'fire-safety',
        buildingCodeVariant: 'Alberta-2023',
        credentials: {
          userId: 888,
          userEmail: 'test@example.com',
          ipAddress: '127.0.0.1',
          sessionId: 'session-999',
        },
      };

      // Act
      const result = await service.extractDrawingData(input);

      // Assert
      expect(result.extractedData.assemblies).toHaveLength(1);
      expect(result.extractedData.assemblies?.[0].fireRating).toBe('2-hour');
    });
  });
});
