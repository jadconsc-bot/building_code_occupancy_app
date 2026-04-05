/**
 * Claude Vision Mock for CI/CD Testing
 * 
 * Returns deterministic results based on file hash instead of calling real LLM.
 * Use for:
 * - Unit tests (fast, deterministic)
 * - CI/CD pipelines (no API costs)
 * - Local development
 * 
 * Use real Claude Vision for:
 * - Integration tests (daily, not per-commit)
 * - Confidence score calibration
 * - Final validation before production
 */

import { createHash } from 'crypto';

export interface EnergyFeatures {
  envelopeArea: number;
  windowAreas: Array<{
    orientation: string;
    area: number;
    uValue?: number;
  }>;
  wallAreas: Array<{
    type: string;
    rValue: number;
    area: number;
  }>;
  roofArea?: number;
  roofRValue?: number;
  foundationType?: string;
  foundationRValue?: number;
  mechanicalRoomLocation?: string;
  proposedHeatingSystem?: string;
  proposedCoolingSystem?: string;
  proposedVentilationSystem?: string;
  confidence: number;
}

export interface ExtractionResult {
  success: boolean;
  features?: EnergyFeatures;
  confidence: number;
  message: string;
  testData?: boolean; // Flag indicating this is mock data
}

/**
 * Generate deterministic hash from PDF buffer
 */
function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Mock Claude Vision - returns test data based on file hash
 */
export const mockClaudeVision = {
  /**
   * Extract energy features from PDF drawing (mock)
   * 
   * Returns different data based on file hash to simulate various drawings:
   * - Simple rectangle (high confidence)
   * - Complex geometry (medium confidence)
   * - Low quality scan (low confidence)
   */
  extractEnergyFeatures: async (pdfBuffer: Buffer): Promise<ExtractionResult> => {
    const hash = hashBuffer(pdfBuffer);
    const hashPrefix = hash.substring(0, 3);

    // Deterministic results based on file hash prefix
    
    // Pattern 1: Simple rectangle (rect_10x20.pdf simulation)
    if (hashPrefix.match(/^[0-3][a-f0-9]{2}$/) || hash.includes('rect')) {
      return {
        success: true,
        confidence: 0.95,
        testData: true,
        message: 'Mock extraction: Simple rectangle',
        features: {
          envelopeArea: 200,
          windowAreas: [
            {
              orientation: 'south',
              area: 24, // 2.4m × 1.8m × 5 windows
              uValue: 0.32
            }
          ],
          wallAreas: [
            {
              type: 'above_grade',
              rValue: 22,
              area: 176
            }
          ],
          roofArea: 200,
          roofRValue: 40,
          foundationType: 'basement',
          foundationRValue: 15,
          mechanicalRoomLocation: 'basement',
          proposedHeatingSystem: 'Gas furnace 95% AFUE',
          proposedCoolingSystem: 'Central AC SEER 16',
          proposedVentilationSystem: 'ERV 75% efficient',
          confidence: 0.95
        }
      };
    }

    // Pattern 2: L-shaped building (medium confidence)
    if (hashPrefix.match(/^[4-7][a-f0-9]{2}$/) || hash.includes('L_shape')) {
      return {
        success: true,
        confidence: 0.82,
        testData: true,
        message: 'Mock extraction: L-shaped geometry',
        features: {
          envelopeArea: 350,
          windowAreas: [
            {
              orientation: 'south',
              area: 35,
              uValue: 0.32
            },
            {
              orientation: 'east',
              area: 20,
              uValue: 0.32
            }
          ],
          wallAreas: [
            {
              type: 'above_grade',
              rValue: 20,
              area: 280
            }
          ],
          roofArea: 350,
          roofRValue: 38,
          foundationType: 'slab',
          foundationRValue: 12,
          mechanicalRoomLocation: 'main_floor',
          proposedHeatingSystem: 'Heat pump 4.0 COP',
          proposedCoolingSystem: 'Integrated heat pump',
          proposedVentilationSystem: 'HRV 70% efficient',
          confidence: 0.82
        }
      };
    }

    // Pattern 3: Multi-room (medium-high confidence)
    if (hashPrefix.match(/^[8-9a-b][a-f0-9]{2}$/) || hash.includes('multi_room')) {
      return {
        success: true,
        confidence: 0.88,
        testData: true,
        message: 'Mock extraction: Multi-room floor plan',
        features: {
          envelopeArea: 150,
          windowAreas: [
            {
              orientation: 'south',
              area: 18,
              uValue: 0.30
            }
          ],
          wallAreas: [
            {
              type: 'above_grade',
              rValue: 24,
              area: 132
            }
          ],
          roofArea: 150,
          roofRValue: 42,
          foundationType: 'basement',
          foundationRValue: 16,
          mechanicalRoomLocation: 'basement',
          proposedHeatingSystem: 'Ground source heat pump 5.0 COP',
          proposedCoolingSystem: 'Ground source heat pump',
          proposedVentilationSystem: 'ERV 80% efficient',
          confidence: 0.88
        }
      };
    }

    // Pattern 4: Low quality scan (low confidence)
    if (hashPrefix.match(/^c[a-f0-9]{2}$/) || hash.includes('low_quality')) {
      return {
        success: true,
        confidence: 0.52,
        testData: true,
        message: 'Mock extraction: Low quality scan - manual review recommended',
        features: {
          envelopeArea: 200, // Uncertain
          windowAreas: [
            {
              orientation: 'unknown',
              area: 20, // Approximate
              uValue: undefined
            }
          ],
          wallAreas: [
            {
              type: 'unknown',
              rValue: 20, // Estimated
              area: 180
            }
          ],
          confidence: 0.52
        }
      };
    }

    // Pattern 5: Drawing with north arrow (orientation detected)
    if (hash.includes('north') || hashPrefix.match(/^d[a-f0-9]{2}$/)) {
      return {
        success: true,
        confidence: 0.91,
        testData: true,
        message: 'Mock extraction: Drawing with orientation detected',
        features: {
          envelopeArea: 200,
          windowAreas: [
            {
              orientation: 'north',
              area: 12,
              uValue: 0.32
            },
            {
              orientation: 'south',
              area: 24,
              uValue: 0.32
            },
            {
              orientation: 'east',
              area: 15,
              uValue: 0.32
            },
            {
              orientation: 'west',
              area: 15,
              uValue: 0.32
            }
          ],
          wallAreas: [
            {
              type: 'above_grade',
              rValue: 22,
              area: 176
            }
          ],
          roofArea: 200,
          roofRValue: 40,
          confidence: 0.91
        }
      };
    }

    // Pattern 6: Window callouts (detailed dimensions)
    if (hash.includes('window') || hashPrefix.match(/^e[a-f0-9]{2}$/)) {
      return {
        success: true,
        confidence: 0.93,
        testData: true,
        message: 'Mock extraction: Window dimensions extracted',
        features: {
          envelopeArea: 150,
          windowAreas: [
            {
              orientation: 'south',
              area: 4.32, // 2.4m × 1.8m
              uValue: 0.30
            },
            {
              orientation: 'south',
              area: 4.32,
              uValue: 0.30
            },
            {
              orientation: 'south',
              area: 1.8, // 1.5m × 1.2m
              uValue: 0.30
            }
          ],
          wallAreas: [
            {
              type: 'above_grade',
              rValue: 22,
              area: 126
            }
          ],
          roofArea: 150,
          roofRValue: 40,
          confidence: 0.93
        }
      };
    }

    // Pattern 7: Building section with R-values (material properties)
    if (hash.includes('section') || hashPrefix.match(/^f[a-f0-9]{2}$/)) {
      return {
        success: true,
        confidence: 0.96,
        testData: true,
        message: 'Mock extraction: Building section with R-values',
        features: {
          envelopeArea: 200,
          windowAreas: [
            {
              orientation: 'south',
              area: 24,
              uValue: 0.30
            }
          ],
          wallAreas: [
            {
              type: 'above_grade',
              rValue: 22,
              area: 176
            }
          ],
          roofArea: 200,
          roofRValue: 60, // Explicitly extracted
          foundationType: 'basement',
          foundationRValue: 15, // Explicitly extracted
          confidence: 0.96
        }
      };
    }

    // Default: Generic building (fallback)
    return {
      success: true,
      confidence: 0.75,
      testData: true,
      message: 'Mock extraction: Generic building (default)',
      features: {
        envelopeArea: 200,
        windowAreas: [
          {
            orientation: 'south',
            area: 24,
            uValue: 0.32
          }
        ],
        wallAreas: [
          {
            type: 'above_grade',
            rValue: 22,
            area: 176
          }
        ],
        roofArea: 200,
        roofRValue: 40,
        foundationType: 'basement',
        foundationRValue: 15,
        mechanicalRoomLocation: 'basement',
        proposedHeatingSystem: 'Gas furnace',
        proposedCoolingSystem: 'Central AC',
        proposedVentilationSystem: 'Standard ventilation',
        confidence: 0.75
      }
    };
  },

  /**
   * Extract text from drawing (OCR mock)
   */
  extractText: async (pdfBuffer: Buffer): Promise<{ text: string; confidence: number }> => {
    const hash = hashBuffer(pdfBuffer);

    if (hash.includes('window')) {
      return {
        text: 'W1: 2.4m × 1.8m\nW2: 2.4m × 1.8m\nW3: 1.5m × 1.2m\nSouth Elevation',
        confidence: 0.92
      };
    }

    if (hash.includes('section')) {
      return {
        text: 'Roof: R-60\nWall: R-22\nFoundation: R-15\n200mm insulation',
        confidence: 0.94
      };
    }

    if (hash.includes('low_quality')) {
      return {
        text: 'Unclear text\nPoor contrast\nManual review needed',
        confidence: 0.45
      };
    }

    return {
      text: 'Building Plan\n10m × 20m = 200m²\nScale 1:100',
      confidence: 0.85
    };
  },

  /**
   * Detect building orientation from north arrow
   */
  detectOrientation: async (pdfBuffer: Buffer): Promise<{ orientation: number; confidence: number }> => {
    const hash = hashBuffer(pdfBuffer);

    if (hash.includes('north')) {
      return {
        orientation: 0, // North pointing up
        confidence: 0.98
      };
    }

    // Default: assume north is up
    return {
      orientation: 0,
      confidence: 0.75
    };
  }
};

/**
 * Use real Claude Vision (not mock)
 * Only call this for integration tests and final validation
 */
export const realClaudeVision = {
  extractEnergyFeatures: async (pdfBuffer: Buffer): Promise<ExtractionResult> => {
    // Implementation would call actual Claude Vision API
    // This is a placeholder
    throw new Error('Real Claude Vision not implemented in mock file');
  }
};

/**
 * Environment-aware factory
 * Returns mock in test/CI, real in production
 */
export function getClaudeVisionClient() {
  const env = process.env.NODE_ENV || 'development';
  const useReal = process.env.USE_REAL_LLM === 'true';

  if (env === 'test' || (env === 'development' && !useReal)) {
    return mockClaudeVision;
  }

  return realClaudeVision;
}
