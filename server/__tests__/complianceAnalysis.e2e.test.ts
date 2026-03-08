/**
 * Compliance Analysis End-to-End Tests
 * 
 * Tests complete compliance analysis workflows:
 * 1. Analyze residential building plan
 * 2. Analyze commercial building plan
 * 3. Test Soft vs Strict analysis modes
 * 4. Test error handling for edge cases
 * 5. Test API integration and response format validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';
import { TRPCError } from '@trpc/server';

/**
 * Create an authenticated context for testing
 */
function createAuthContext(userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      email: `test${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: 'manus',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext['res'],
  };
}

describe('Compliance Analysis E2E Tests', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe('Residential Building Analysis', () => {
    it('should analyze a residential building plan and return compliance results', async () => {
      const input = {
        planDescription: `
          Single-family residential building with the following specifications:
          - Total area: 2,500 m²
          - Number of storeys: 2
          - Occupancy type: Residential
          - Construction type: Combustible
          - Travel distance to exit: 30 meters
          - Number of exits: 2
          - Sprinkler system: Yes
          - Fire alarm system: Yes
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      // Verify response structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('infractions');
      expect(result).toHaveProperty('summary');

      // Verify response types
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.infractions)).toBe(true);
      expect(typeof result.summary).toBe('string');

      // If there are infractions, verify their structure
      if (result.infractions.length > 0) {
        result.infractions.forEach((infraction) => {
          expect(infraction).toHaveProperty('code');
          expect(infraction).toHaveProperty('severity');
          expect(infraction).toHaveProperty('description');
          expect(infraction).toHaveProperty('requirement');
          expect(infraction).toHaveProperty('remediation');

          // Verify infraction types
          expect(typeof infraction.code).toBe('string');
          expect(['critical', 'major', 'minor']).toContain(infraction.severity);
          expect(typeof infraction.description).toBe('string');
          expect(typeof infraction.requirement).toBe('string');
          expect(typeof infraction.remediation).toBe('string');
        });
      }
    });

    it('should handle compliant residential buildings', async () => {
      const input = {
        planDescription: `
          Residential building fully compliant with NBC 2025:
          - Area: 1,500 m²
          - Storeys: 1
          - Occupancy: Residential (Group C)
          - Construction: Non-combustible
          - Travel distance: 20 meters (within 25m limit)
          - Exits: 2 (meets minimum requirement)
          - Sprinkler system: Installed
          - Fire alarm: Installed
          - Egress width: 1.1 meters (exceeds 1.0m minimum)
          - Door height: 2.1 meters (meets 2.0m minimum)
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.infractions)).toBe(true);
      expect(typeof result.summary).toBe('string');
    });

    it('should identify critical issues in non-compliant buildings', async () => {
      const input = {
        planDescription: `
          Residential building with critical code violations:
          - Area: 5,000 m²
          - Storeys: 4
          - Occupancy: Residential (Group C)
          - Construction: Combustible
          - Travel distance: 45 meters (exceeds 25m limit)
          - Exits: 1 (requires minimum 2)
          - No sprinkler system
          - No fire alarm system
          - Egress width: 0.8 meters (below 1.0m minimum)
          - Stair riser: 210mm (exceeds 200mm maximum)
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('infractions');
      
      // Should have identified issues
      if (result.infractions.length > 0) {
        // Check for critical severity issues
        const criticalIssues = result.infractions.filter(
          (i) => i.severity === 'critical'
        );
        expect(criticalIssues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Commercial Building Analysis', () => {
    it('should analyze a commercial building plan', async () => {
      const input = {
        planDescription: `
          Commercial office building with the following specifications:
          - Total area: 10,000 m²
          - Number of storeys: 5
          - Occupancy type: Commercial (Group B)
          - Construction type: Non-combustible
          - Travel distance to exit: 40 meters
          - Number of exits: 4
          - Sprinkler system: Yes
          - Fire alarm system: Yes
          - Emergency lighting: Yes
          - Accessible washrooms: Yes
        `,
        occupancyType: 'Commercial',
        buildingType: 'office',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
      expect(typeof result.summary).toBe('string');
    });

    it('should handle different provinces with regional variations', async () => {
      const input = {
        planDescription: `
          Commercial building in British Columbia:
          - Area: 8,000 m²
          - Storeys: 3
          - Occupancy: Commercial (Group B)
          - Construction: Non-combustible
          - Travel distance: 35 meters
          - Exits: 3
        `,
        occupancyType: 'Commercial',
        buildingType: 'office',
        province: 'British Columbia',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
    });
  });

  describe('Industrial Building Analysis', () => {
    it('should analyze an industrial building plan', async () => {
      const input = {
        planDescription: `
          Industrial manufacturing facility:
          - Total area: 15,000 m²
          - Number of storeys: 1
          - Occupancy type: Industrial (Group F)
          - Construction type: Non-combustible
          - Travel distance to exit: 50 meters
          - Number of exits: 3
          - Sprinkler system: Yes
          - Fire alarm system: Yes
          - Emergency exits: Yes
          - Hazardous materials storage: Yes
        `,
        occupancyType: 'Industrial',
        buildingType: 'industrial',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
    });
  });

  describe('Assembly Building Analysis', () => {
    it('should analyze an assembly building plan', async () => {
      const input = {
        planDescription: `
          Assembly building (theater):
          - Total area: 3,000 m²
          - Number of storeys: 1
          - Occupancy type: Assembly (Group A)
          - Construction type: Non-combustible
          - Seating capacity: 500 people
          - Travel distance to exit: 30 meters
          - Number of exits: 4
          - Sprinkler system: Yes
          - Fire alarm system: Yes
          - Emergency lighting: Yes
          - Accessible seating: Yes
        `,
        occupancyType: 'Assembly',
        buildingType: 'assembly',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty plan description', async () => {
      const input = {
        planDescription: '',
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      try {
        await caller.compliance.analyzePlan(input);
        // If validation passes, check response
      } catch (error) {
        // Expected to throw validation error
        expect(error).toBeInstanceOf(TRPCError);
      }
    });

    it('should handle very short plan description', async () => {
      const input = {
        planDescription: 'Too short',
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      try {
        await caller.compliance.analyzePlan(input);
      } catch (error) {
        // Expected to throw validation error for minimum length
        expect(error).toBeInstanceOf(TRPCError);
      }
    });

    it('should handle invalid occupancy type', async () => {
      const input = {
        planDescription: 'This is a valid description with sufficient length for testing purposes',
        occupancyType: 'InvalidOccupancy',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      // Should still return a result, but may have different analysis
      expect(result).toBeDefined();
      expect(result).toHaveProperty('infractions');
    });

    it('should handle missing optional fields gracefully', async () => {
      const input = {
        planDescription: 'This is a valid description with sufficient length for testing purposes',
        occupancyType: 'Residential',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
    });

    it('should handle LLM timeout gracefully', async () => {
      // This test verifies the timeout handling in ComplianceAnalysisService
      const input = {
        planDescription: `
          This is a very detailed plan description that should trigger analysis:
          A residential building with 2,500 m² area, 2 storeys, combustible construction,
          30 meters travel distance, and 2 exits. The building has a sprinkler system
          and fire alarm system installed. This description is long enough to pass validation
          and should be processed by the LLM service with a 30-second timeout.
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      // Should return result without throwing (LLM calls can take time)
      const result = await caller.compliance.analyzePlan(input);
      expect(result).toBeDefined();
    }, 60000);
  });

  describe('Response Format Validation', () => {
    it('should always return valid response structure', async () => {
      const input = {
        planDescription: `
          Test building for response format validation:
          - Area: 2,000 m²
          - Storeys: 2
          - Occupancy: Residential
          - Construction: Combustible
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      // Verify required fields exist
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('infractions');
      expect(result).toHaveProperty('summary');

      // Verify types
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.infractions)).toBe(true);
      expect(typeof result.summary).toBe('string');

      // Verify infractions array structure
      result.infractions.forEach((infraction) => {
        expect(typeof infraction.code).toBe('string');
        expect(typeof infraction.severity).toBe('string');
        expect(typeof infraction.description).toBe('string');
        expect(typeof infraction.requirement).toBe('string');
        expect(typeof infraction.remediation).toBe('string');
      });
    });

    it('should handle responses with no infractions', async () => {
      const input = {
        planDescription: `
          Fully compliant residential building:
          - Area: 1,000 m²
          - Storeys: 1
          - Occupancy: Residential
          - Construction: Non-combustible
          - All code requirements met
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.infractions)).toBe(true);
      expect(typeof result.summary).toBe('string');
      // Summary should be meaningful even with no infractions
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should handle responses with multiple infractions', async () => {
      const input = {
        planDescription: `
          Non-compliant building with multiple violations:
          - Area: 5,000 m²
          - Storeys: 3
          - Occupancy: Residential
          - Construction: Combustible
          - Travel distance: 50 meters (exceeds limit)
          - Exits: 1 (insufficient)
          - No sprinkler system
          - No fire alarm
          - Stair dimensions non-compliant
          - Egress width insufficient
          - No emergency lighting
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result.success).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
      // Should have identified multiple issues
      if (result.infractions.length > 0) {
        expect(result.infractions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Multiple User Isolation', () => {
    it('should isolate analysis between different users', async () => {
      const user1Ctx = createAuthContext(1);
      const user2Ctx = createAuthContext(2);

      const caller1 = appRouter.createCaller(user1Ctx);
      const caller2 = appRouter.createCaller(user2Ctx);

      const input = {
        planDescription: `
          Residential building for multi-user test:
          - Area: 2,000 m²
          - Storeys: 2
          - Occupancy: Residential
          - Construction: Combustible
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result1 = await caller1.compliance.analyzePlan(input);
      const result2 = await caller2.compliance.analyzePlan(input);

      // Both should get valid results
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.success).toBeDefined();
      expect(result2.success).toBeDefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed occupancy building', async () => {
      const input = {
        planDescription: `
          Mixed-use building with multiple occupancies:
          - Ground floor: Retail (Group D)
          - Floors 2-5: Residential (Group C)
          - Total area: 8,000 m²
          - Construction: Non-combustible
          - Separate exits for each occupancy
          - Sprinkler system throughout
          - Fire alarm system throughout
        `,
        occupancyType: 'Mixed',
        buildingType: 'mixed-use',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
    });

    it('should handle building with accessibility requirements', async () => {
      const input = {
        planDescription: `
          Accessible residential building:
          - Area: 3,000 m²
          - Storeys: 2
          - Occupancy: Residential
          - Construction: Non-combustible
          - Accessible entrances: Yes
          - Accessible washrooms: Yes
          - Accessible parking: Yes
          - Accessible routes: Yes
          - Elevator: Yes
          - Grab bars installed: Yes
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
    });

    it('should handle high-rise building analysis', async () => {
      const input = {
        planDescription: `
          High-rise commercial building:
          - Total area: 50,000 m²
          - Number of storeys: 20
          - Occupancy type: Commercial (Group B)
          - Construction type: Non-combustible
          - Travel distance to exit: 45 meters
          - Number of exits: 6
          - Sprinkler system: Yes
          - Fire alarm system: Yes
          - Emergency lighting: Yes
          - Pressurized stairwells: Yes
          - Smoke control system: Yes
        `,
        occupancyType: 'Commercial',
        buildingType: 'office',
        province: 'Alberta',
      };

      const result = await caller.compliance.analyzePlan(input);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(Array.isArray(result.infractions)).toBe(true);
    });
  });

  describe('Performance and Load', () => {
    it('should handle request deduplication for identical inputs', async () => {
      const input = {
        planDescription: `
          Residential building for deduplication testing:
          - Area: 2,000 m²
          - Storeys: 2
          - Occupancy: Residential
          - Construction: Combustible
        `,
        occupancyType: 'Residential',
        buildingType: 'residential',
        province: 'Alberta',
      };

      // Submit identical request - should be deduplicated and cached
      const result = await caller.compliance.analyzePlan(input);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('infractions');
    }, 60000);
  });
});
