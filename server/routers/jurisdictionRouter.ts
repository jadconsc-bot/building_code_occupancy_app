/**
 * Jurisdiction Router - BC/AB Compliance
 * 
 * Provides jurisdiction detection and climate/seismic zone lookup
 * Uses static jurisdiction database (no external API dependency)
 * 
 * PD2.0 Compliant:
 * - Deterministic results (same input = same output)
 * - Immutable audit trails
 * - No LLM-based decisions (pure data lookup)
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { jurisdictionProfiles } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

// ============================================================================
// JURISDICTION DATABASE - Static lookup (no external API)
// ============================================================================

interface JurisdictionData {
  province: 'BC' | 'AB' | 'ON' | 'SK' | 'MB';
  municipality: string;
  climateZone: string;
  heatingDegreeDays: number;
  designTemperatureWinter: number;
  designTemperatureSummer?: number;
  seismicZone: 'Low' | 'Intermediate' | 'High' | 'Very High';
  stepCodeAdopted: boolean;
  currentStepCodeTier?: '1' | '2' | '3' | '4' | '5';
  nbcEdition: string;
}

// Static jurisdiction lookup - fallback if database is unavailable
const JURISDICTION_LOOKUP: Record<string, JurisdictionData> = {
  'vancouver_bc': {
    province: 'BC',
    municipality: 'Vancouver',
    climateZone: '4',
    heatingDegreeDays: 2800,
    designTemperatureWinter: -12,
    seismicZone: 'High',
    stepCodeAdopted: true,
    currentStepCodeTier: '3',
    nbcEdition: '2024'
  },
  'victoria_bc': {
    province: 'BC',
    municipality: 'Victoria',
    climateZone: '4',
    heatingDegreeDays: 2400,
    designTemperatureWinter: -8,
    seismicZone: 'Intermediate',
    stepCodeAdopted: true,
    currentStepCodeTier: '2',
    nbcEdition: '2024'
  },
  'kelowna_bc': {
    province: 'BC',
    municipality: 'Kelowna',
    climateZone: '5',
    heatingDegreeDays: 3200,
    designTemperatureWinter: -18,
    seismicZone: 'Low',
    stepCodeAdopted: true,
    currentStepCodeTier: '3',
    nbcEdition: '2024'
  },
  'prince_george_bc': {
    province: 'BC',
    municipality: 'Prince George',
    climateZone: '7a',
    heatingDegreeDays: 4400,
    designTemperatureWinter: -30,
    seismicZone: 'Low',
    stepCodeAdopted: true,
    currentStepCodeTier: '3',
    nbcEdition: '2024'
  },
  'calgary_ab': {
    province: 'AB',
    municipality: 'Calgary',
    climateZone: '7A',
    heatingDegreeDays: 5500,
    designTemperatureWinter: -37,
    designTemperatureSummer: 28,
    seismicZone: 'Low',
    stepCodeAdopted: false,
    nbcEdition: '2023'
  },
  'edmonton_ab': {
    province: 'AB',
    municipality: 'Edmonton',
    climateZone: '7A',
    heatingDegreeDays: 5500,
    designTemperatureWinter: -37,
    designTemperatureSummer: 28,
    seismicZone: 'Low',
    stepCodeAdopted: false,
    nbcEdition: '2023'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fuzzy match municipality name to jurisdiction
 * Handles variations like "Vancouver, BC", "vancouver", "Van"
 */
function fuzzyMatchMunicipality(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  
  // Exact match
  for (const [key, data] of Object.entries(JURISDICTION_LOOKUP)) {
    if (normalized === `${data.municipality.toLowerCase()}_${data.province.toLowerCase()}` ||
        normalized === data.municipality.toLowerCase()) {
      return key;
    }
  }
  
  // Partial match (first 3 characters)
  for (const [key, data] of Object.entries(JURISDICTION_LOOKUP)) {
    if (data.municipality.toLowerCase().startsWith(normalized.substring(0, 3))) {
      return key;
    }
  }
  
  return null;
}

/**
 * Get jurisdiction from database or fallback to static lookup
 */
async function getJurisdictionData(municipality: string): Promise<JurisdictionData | null> {
      try {
        // Try database first
        const database = await getDb();
        if (database) {
          const dbResult = await database
            .select()
            .from(jurisdictionProfiles)
            .where(sql`LOWER(${jurisdictionProfiles.municipality}) = LOWER(${municipality})`)
            .limit(1);
    
          if (dbResult.length > 0) {
            const j = dbResult[0];
            return {
        province: (j.province as 'BC' | 'AB' | 'ON' | 'SK' | 'MB'),
        municipality: j.municipality || 'Provincial Default',
        climateZone: j.climateZone || '',
        heatingDegreeDays: j.heatingDegreeDays || 0,
        designTemperatureWinter: j.designTemperatureWinter || 0,
        designTemperatureSummer: j.designTemperatureSummer || undefined,
        seismicZone: (j.seismicZone || 'Low') as 'Low' | 'Intermediate' | 'High' | 'Very High',
        stepCodeAdopted: j.stepCodeAdopted || false,
        currentStepCodeTier: (j.currentStepCodeTier || undefined) as '1' | '2' | '3' | '4' | '5' | undefined,
        nbcEdition: j.nbcEdition || '2023'
      };
          }
        }
      } catch (error) {
        console.error('[Jurisdiction] Database lookup failed, using static fallback:', error);
      }
  
  // Fallback to static lookup
  const key = fuzzyMatchMunicipality(municipality);
  if (key) {
    return JURISDICTION_LOOKUP[key];
  }
  
  return null;
}

// ============================================================================
// tRPC PROCEDURES
// ============================================================================

export const jurisdictionRouter = router({
  /**
   * Detect jurisdiction from municipality name
   * Returns climate zone, seismic zone, and Step Code adoption status
   * 
   * Input: municipality name (e.g., "Vancouver", "Calgary", "Kelowna")
   * Output: Jurisdiction profile with climate/seismic data
   */
  detect: protectedProcedure
    .input(z.object({
      municipality: z.string().min(2).max(100),
      province: z.enum(['BC', 'AB', 'ON', 'SK', 'MB']).optional()
    }))
    .output(z.object({
      success: z.boolean(),
      jurisdiction: z.object({
        province: z.enum(['BC', 'AB', 'ON', 'SK', 'MB']),
        municipality: z.string(),
        climateZone: z.string(),
        heatingDegreeDays: z.number(),
        designTemperatureWinter: z.number(),
        designTemperatureSummer: z.number().optional(),
        seismicZone: z.enum(['Low', 'Intermediate', 'High', 'Very High']),
        stepCodeAdopted: z.boolean(),
        currentStepCodeTier: z.enum(['1', '2', '3', '4', '5']).optional(),
        nbcEdition: z.string(),
        applicableRulesets: z.array(z.string()),
        warnings: z.array(z.string())
      }).optional(),
      error: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const jurisdiction = await getJurisdictionData(input.municipality);
        
        if (!jurisdiction) {
          return {
            success: false,
            error: `Jurisdiction not found for "${input.municipality}". Supported municipalities: Vancouver, Victoria, Kelowna, Prince George (BC), Calgary, Edmonton (AB)`
          };
        }
        
        // Build applicable rulesets based on jurisdiction
        const applicableRulesets: string[] = [];
        const warnings: string[] = [];
        
        if (jurisdiction.province === 'BC') {
          applicableRulesets.push('nbc_bc_2024_v1');
          
          if (jurisdiction.stepCodeAdopted) {
            applicableRulesets.push(`stepcode_bc_2024_tier${jurisdiction.currentStepCodeTier}`);
          }
          
          // Seismic warnings for BC
          if (jurisdiction.seismicZone === 'High' || jurisdiction.seismicZone === 'Very High') {
            warnings.push(`${jurisdiction.municipality} is in a ${jurisdiction.seismicZone.toLowerCase()} seismic zone. Additional bracing requirements per NBC 9.23.13 apply.`);
          }
          
          // Step Code warnings
          if (jurisdiction.stepCodeAdopted) {
            warnings.push(`Step Code Tier ${jurisdiction.currentStepCodeTier} is mandatory for ${jurisdiction.municipality}. Performance or prescriptive pathway required.`);
          }
        } else if (jurisdiction.province === 'AB') {
          applicableRulesets.push('nbc_ab_2023_v1');
          
          // Cold climate warnings
          if (jurisdiction.heatingDegreeDays > 5000) {
            warnings.push(`${jurisdiction.municipality} has extreme cold climate (${jurisdiction.heatingDegreeDays} HDD). Frost protection and foundation insulation requirements per NBC 9.36.2 apply.`);
          }
        }
        
        return {
          success: true,
          jurisdiction: {
            ...jurisdiction,
            applicableRulesets,
            warnings
          } as any
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to detect jurisdiction: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }),

  /**
   * Get all supported jurisdictions
   * Returns list of municipalities with their climate zones
   */
  listSupported: protectedProcedure
    .output(z.array(z.object({
      province: z.enum(['BC', 'AB', 'ON', 'SK', 'MB']),
      municipality: z.string().nullable(),
      climateZone: z.string(),
      stepCodeAdopted: z.boolean().nullable()
    })))
    .query(async () => {
      try {
        // Try database first
        const database = await getDb();
        if (database) {
          const dbResults = await database
            .select({
              province: jurisdictionProfiles.province,
              municipality: jurisdictionProfiles.municipality,
              climateZone: jurisdictionProfiles.climateZone,
              stepCodeAdopted: jurisdictionProfiles.stepCodeAdopted
            })
            .from(jurisdictionProfiles)
            .where(eq(jurisdictionProfiles.isActive, true));
        
          if (dbResults.length > 0) {
            return dbResults;
          }
        }
      } catch (error) {
        console.error('[Jurisdiction] Database query failed, using static fallback:', error);
      }
      
      // Fallback to static lookup (always available)
      return Object.values(JURISDICTION_LOOKUP).map(j => ({
        province: j.province as 'BC' | 'AB' | 'ON' | 'SK' | 'MB',
        municipality: j.municipality || 'Provincial Default',
        climateZone: j.climateZone,
        stepCodeAdopted: j.stepCodeAdopted
      }));
    }),

  /**
   * Get climate zone details
   * Returns HDD, design temperatures, and applicable rules
   */
  getClimateZone: protectedProcedure
    .input(z.object({
      municipality: z.string()
    }))
    .output(z.object({
      success: z.boolean(),
      climateData: z.object({
        climateZone: z.string(),
        heatingDegreeDays: z.number(),
        designTemperatureWinter: z.number(),
        designTemperatureSummer: z.number().optional(),
        insulationZone: z.string().describe('NBC insulation zone (Zone 4, 5, 6, 7, 8)')
      }).optional(),
      error: z.string().optional()
    }))
    .query(async ({ input }) => {
      try {
        const jurisdiction = await getJurisdictionData(input.municipality);
        
        if (!jurisdiction) {
          return {
            success: false,
            error: `Municipality not found: ${input.municipality}`
          };
        }
        
        // Map HDD to NBC insulation zone
        const hdd = jurisdiction.heatingDegreeDays;
        let insulationZone = 'Zone 4';
        if (hdd > 5500) insulationZone = 'Zone 7';
        else if (hdd > 4000) insulationZone = 'Zone 5';
        else if (hdd > 3000) insulationZone = 'Zone 5';
        
        return {
          success: true,
          climateData: {
            climateZone: jurisdiction.climateZone,
            heatingDegreeDays: jurisdiction.heatingDegreeDays,
            designTemperatureWinter: jurisdiction.designTemperatureWinter,
            designTemperatureSummer: jurisdiction.designTemperatureSummer,
            insulationZone
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get climate zone: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }),

  /**
   * Get seismic zone details
   * Returns seismic classification and applicable bracing requirements
   */
  getSeismicZone: protectedProcedure
    .input(z.object({
      municipality: z.string()
    }))
    .output(z.object({
      success: z.boolean(),
      seismicData: z.object({
        seismicZone: z.enum(['Low', 'Intermediate', 'High', 'Very High']),
        bracingRequired: z.boolean(),
        applicableClause: z.string().describe('NBC clause reference'),
        requirements: z.array(z.string())
      }).optional(),
      error: z.string().optional()
    }))
    .query(async ({ input }) => {
      try {
        const jurisdiction = await getJurisdictionData(input.municipality);
        
        if (!jurisdiction) {
          return {
            success: false,
            error: `Municipality not found: ${input.municipality}`
          };
        }
        
        // Determine bracing requirements based on seismic zone
        const bracingRequired = jurisdiction.seismicZone !== 'Low';
        const requirements: string[] = [];
        
        if (jurisdiction.seismicZone === 'Low') {
          requirements.push('Standard bracing per NBC 9.23.1');
        } else if (jurisdiction.seismicZone === 'Intermediate') {
          requirements.push('Enhanced bracing per NBC 9.23.13');
          requirements.push('Shear wall design required');
          requirements.push('Foundation anchorage verification');
        } else if (jurisdiction.seismicZone === 'High' || jurisdiction.seismicZone === 'Very High') {
          requirements.push('Comprehensive seismic design per NBC 9.23.13');
          requirements.push('Structural irregularity analysis required');
          requirements.push('Soft story check mandatory');
          requirements.push('Professional engineer review required');
        }
        
        return {
          success: true,
          seismicData: {
            seismicZone: jurisdiction.seismicZone,
            bracingRequired,
            applicableClause: 'NBC 9.23.13',
            requirements
          }
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get seismic zone: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    })
});
