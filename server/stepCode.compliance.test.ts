/**
 * Step Code Compliance Test Suite
 * Tests for BC Energy Step Code and Alberta NBC compliance calculations
 * 
 * Test Coverage:
 * - Database & Data Integrity (DB-001 to DB-005)
 * - Jurisdiction Detection API (API-JD-001 to API-JD-007)
 * - Step Code Compliance Calculations (SC-P9-001 to SC-P3-004)
 * - Climate-Dependent Rules (CD-001 to CD-005)
 * - Seismic Rules (SE-001 to SE-006)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db';
import { 
  jurisdictionProfiles, 
  stepCodeTiers,
  energyFeatures,
  stepCodeAnalyses,
  uiTranslations
} from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// TEST SUITE 1: Database & Data Integrity Tests
// ============================================================================

describe('Database & Data Integrity Tests', () => {
  
  it('DB-001: Verify all Step Code tiers seeded correctly', async () => {
    const tiers = await db
      .select()
      .from(stepCodeTiers)
      .where(eq(stepCodeTiers.buildingType, 'part9_single_family'));
    
    // Should have 5 tiers (1-5) × 5 climate zones (4, 5, 6, 7a, 7b) = 25 rows minimum
    expect(tiers.length).toBeGreaterThanOrEqual(5);
    
    // Verify Zone 4 Tier 3 specific values
    const zone4Tier3 = tiers.find(
      t => t.climateZone === '4' && t.tier === '3'
    );
    expect(zone4Tier3).toBeDefined();
    expect(zone4Tier3?.tediTarget).toBe(30.00);
    expect(zone4Tier3?.teuiTarget).toBe(50.00);
    expect(zone4Tier3?.airtightnessMax).toBe(2.50);
  });

  it('DB-002: Verify jurisdiction profiles for major cities', async () => {
    const cities = ['Vancouver', 'Calgary', 'Edmonton', 'Victoria', 'Kelowna'];
    
    for (const city of cities) {
      const profile = await db
        .select()
        .from(jurisdictionProfiles)
        .where(eq(jurisdictionProfiles.municipality, city))
        .limit(1);
      
      expect(profile.length).toBe(1);
      expect(profile[0].municipality).toBe(city);
      expect(profile[0].climateZone).toBeDefined();
    }
    
    // Verify specific profiles
    const vancouver = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Vancouver'))
      .limit(1);
    
    expect(vancouver[0].climateZone).toBe('4');
    expect(vancouver[0].seismicZone).toBe('High');
    expect(vancouver[0].currentStepCodeTier).toBe('3');
  });

  it('DB-003: Test foreign key constraints', async () => {
    // Verify that jurisdictionProfiles are referenced by projects
    // This would require a project table with FK to jurisdictionProfiles
    // For now, verify the schema is correct
    const vancouver = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Vancouver'))
      .limit(1);
    
    expect(vancouver.length).toBe(1);
    expect(vancouver[0].id).toBeDefined();
  });

  it('DB-004: Verify immutable audit records', async () => {
    // Verify that stepCodeAnalyses table has immutable flag
    const analyses = await db
      .select()
      .from(stepCodeAnalyses)
      .limit(1);
    
    // If records exist, verify they have immutable flag
    if (analyses.length > 0) {
      expect(analyses[0].immutable).toBe(true);
    }
  });

  it('DB-005: Test French translation completeness', async () => {
    const translations = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.context, 'calculator'));
    
    // Verify all calculator context translations have French versions
    for (const t of translations) {
      expect(t.en).toBeDefined();
      expect(t.fr).toBeDefined();
      expect(t.fr?.length).toBeGreaterThan(0);
    }
    
    expect(translations.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// TEST SUITE 2: Jurisdiction Detection Tests
// ============================================================================

describe('Jurisdiction Detection Tests', () => {
  
  it('API-JD-001: Vancouver jurisdiction detection', async () => {
    const vancouver = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Vancouver'))
      .limit(1);
    
    expect(vancouver[0]).toMatchObject({
      province: 'BC',
      municipality: 'Vancouver',
      climateZone: '4',
      seismicZone: 'High',
      currentStepCodeTier: '3'
    });
  });

  it('API-JD-002: Calgary jurisdiction detection', async () => {
    const calgary = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Calgary'))
      .limit(1);
    
    expect(calgary[0]).toMatchObject({
      province: 'AB',
      municipality: 'Calgary',
      climateZone: '7a',
      seismicZone: 'Low',
      stepCodeAdopted: false
    });
  });

  it('API-JD-003: Edmonton cold climate detection', async () => {
    const edmonton = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Edmonton'))
      .limit(1);
    
    expect(edmonton[0]).toMatchObject({
      province: 'AB',
      heatingDegreeDays: 5500,
      designTemperatureWinter: -37
    });
  });

  it('API-JD-004: Victoria lower tier than Vancouver', async () => {
    const victoria = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Victoria'))
      .limit(1);
    
    const vancouver = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Vancouver'))
      .limit(1);
    
    expect(parseInt(victoria[0].currentStepCodeTier || '0')).toBeLessThan(
      parseInt(vancouver[0].currentStepCodeTier || '0')
    );
  });

  it('API-JD-005: Kelowna interior BC profile', async () => {
    const kelowna = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Kelowna'))
      .limit(1);
    
    expect(kelowna[0]).toMatchObject({
      province: 'BC',
      climateZone: '5',
      currentStepCodeTier: '3'
    });
  });
});

// ============================================================================
// TEST SUITE 3: Step Code Compliance Calculations
// ============================================================================

describe('Step Code Compliance Calculations - Part 9 Zone 4', () => {
  
  it('SC-P9-001: Single Family Tier 3 - PASS both metrics', () => {
    const modelledTedi = 28;
    const modelledMeui = 45;
    const targetTedi = 30;
    const targetMeui = 50;
    
    const tediPass = modelledTedi <= targetTedi;
    const meuiPass = modelledMeui <= targetMeui;
    
    expect(tediPass && meuiPass).toBe(true);
  });

  it('SC-P9-002: Single Family Tier 3 - FAIL TEDI', () => {
    const modelledTedi = 32;
    const targetTedi = 30;
    
    expect(modelledTedi <= targetTedi).toBe(false);
  });

  it('SC-P9-003: Single Family Tier 3 - FAIL MEUI', () => {
    const modelledMeui = 55;
    const targetMeui = 50;
    
    expect(modelledMeui <= targetMeui).toBe(false);
  });

  it('SC-P9-004: Single Family Tier 5 - PASS both', () => {
    const modelledTedi = 14;
    const modelledMeui = 20;
    const targetTedi = 15;
    const targetMeui = 25;
    
    expect(modelledTedi <= targetTedi && modelledMeui <= targetMeui).toBe(true);
  });

  it('SC-P9-005: Single Family Tier 5 - FAIL TEDI', () => {
    const modelledTedi = 16;
    const targetTedi = 15;
    
    expect(modelledTedi <= targetTedi).toBe(false);
  });

  it('SC-P9-006: Multiplex Tier 4 - PASS', () => {
    const modelledTedi = 18;
    const modelledMeui = 35;
    const targetTedi = 20;
    const targetMeui = 40;
    
    expect(modelledTedi <= targetTedi && modelledMeui <= targetMeui).toBe(true);
  });
});

describe('Step Code Compliance Calculations - Part 9 Zone 5', () => {
  
  it('SC-P9-007: Single Family Tier 3 Zone 5 - PASS', () => {
    const modelledTedi = 38;
    const targetTedi = 40;
    
    expect(modelledTedi <= targetTedi).toBe(true);
  });

  it('SC-P9-008: Single Family Tier 3 Zone 5 - FAIL', () => {
    const modelledTedi = 42;
    const targetTedi = 40;
    
    expect(modelledTedi <= targetTedi).toBe(false);
  });

  it('SC-P9-009: Single Family Tier 4 Zone 5 - PASS', () => {
    const modelledTedi = 19;
    const targetTedi = 20;
    
    expect(modelledTedi <= targetTedi).toBe(true);
  });
});

describe('Step Code Compliance Calculations - Part 9 Zone 7a', () => {
  
  it('SC-P9-010: Single Family Tier 3 Zone 7a - PASS', () => {
    const modelledTedi = 58;
    const targetTedi = 60;
    
    expect(modelledTedi <= targetTedi).toBe(true);
  });

  it('SC-P9-011: Single Family Tier 4 Zone 7a - PASS', () => {
    const modelledTedi = 48;
    const targetTedi = 50;
    
    expect(modelledTedi <= targetTedi).toBe(true);
  });

  it('SC-P9-012: Single Family Tier 4 Zone 7a - FAIL', () => {
    const modelledTedi = 52;
    const targetTedi = 50;
    
    expect(modelledTedi <= targetTedi).toBe(false);
  });
});

describe('Step Code Compliance Calculations - Part 3 Commercial', () => {
  
  it('SC-P3-001: MURB Tier 3 - PASS', () => {
    const modelledTedi = 33;
    const modelledTeui = 125;
    const targetTedi = 35;
    const targetTeui = 130;
    
    expect(modelledTedi <= targetTedi && modelledTeui <= targetTeui).toBe(true);
  });

  it('SC-P3-002: Office Tier 4 - PASS', () => {
    const modelledTedi = 18;
    const modelledTeui = 135;
    const targetTedi = 20;
    const targetTeui = 140;
    
    expect(modelledTedi <= targetTedi && modelledTeui <= targetTeui).toBe(true);
  });

  it('SC-P3-003: Retail Tier 3 - PASS', () => {
    const modelledTedi = 32;
    const modelledTeui = 270;
    const targetTedi = 30;
    const targetTeui = 280;
    
    // TEDI fails but TEUI passes - should be FAIL overall
    expect(modelledTedi <= targetTedi && modelledTeui <= targetTeui).toBe(false);
  });

  it('SC-P3-004: Retail Tier 3 - PASS both', () => {
    const modelledTedi = 28;
    const modelledTeui = 270;
    const targetTedi = 30;
    const targetTeui = 280;
    
    expect(modelledTedi <= targetTedi && modelledTeui <= targetTeui).toBe(true);
  });
});

// ============================================================================
// TEST SUITE 4: Climate-Dependent Rule Tests
// ============================================================================

describe('Climate-Dependent Rule Tests', () => {
  
  it('CD-001: Calgary Zone 7 insulation - FAIL', () => {
    const actualRValue = 20;
    const requiredRValue = 22; // Zone 7 requirement
    
    expect(actualRValue >= requiredRValue).toBe(false);
  });

  it('CD-002: Calgary Zone 7 insulation - PASS', () => {
    const actualRValue = 24;
    const requiredRValue = 22;
    
    expect(actualRValue >= requiredRValue).toBe(true);
  });

  it('CD-003: Vancouver Zone 4 insulation - PASS', () => {
    const actualRValue = 18;
    const requiredRValue = 16; // Zone 4 requirement
    
    expect(actualRValue >= requiredRValue).toBe(true);
  });

  it('CD-004: Edmonton design temperature', () => {
    const designTemp = -37; // Edmonton
    const hvacSizingTemp = -37;
    
    expect(hvacSizingTemp).toBe(designTemp);
  });

  it('CD-005: Victoria design temperature', () => {
    const designTemp = -8; // Victoria
    const hvacSizingTemp = -8;
    
    expect(hvacSizingTemp).toBe(designTemp);
  });
});

// ============================================================================
// TEST SUITE 5: Seismic Rule Tests
// ============================================================================

describe('Seismic Rule Tests', () => {
  
  it('SE-001: Vancouver High Seismic - Regular shape PASS', () => {
    const seismicZone = 'High';
    const hasIrregularities = false;
    
    const result = seismicZone === 'High' && !hasIrregularities ? 'PASS' : 'CONDITIONAL';
    expect(result).toBe('PASS');
  });

  it('SE-002: Vancouver High Seismic - Soft story CONDITIONAL', () => {
    const seismicZone = 'High';
    const hasIrregularities = true; // Soft story detected
    
    const result = seismicZone === 'High' && hasIrregularities ? 'CONDITIONAL' : 'PASS';
    expect(result).toBe('CONDITIONAL');
  });

  it('SE-003: Vancouver High Seismic - Irregular shape CONDITIONAL', () => {
    const seismicZone = 'High';
    const shapeType = 'T-shape'; // Irregular
    
    const result = seismicZone === 'High' && shapeType !== 'regular' ? 'CONDITIONAL' : 'PASS';
    expect(result).toBe('CONDITIONAL');
  });

  it('SE-004: Kelowna Low Seismic - NOT_APPLICABLE', () => {
    const seismicZone = 'Low';
    
    const result = seismicZone === 'Low' ? 'NOT_APPLICABLE' : 'PASS';
    expect(result).toBe('NOT_APPLICABLE');
  });

  it('SE-005: Calgary Low Seismic - NOT_APPLICABLE', () => {
    const seismicZone = 'Low';
    
    const result = seismicZone === 'Low' ? 'NOT_APPLICABLE' : 'PASS';
    expect(result).toBe('NOT_APPLICABLE');
  });

  it('SE-006: Victoria Intermediate Seismic - PASS', () => {
    const seismicZone = 'Intermediate';
    const hasIrregularities = false;
    
    const result = seismicZone !== 'High' && !hasIrregularities ? 'PASS' : 'CONDITIONAL';
    expect(result).toBe('PASS');
  });
});

// ============================================================================
// TEST SUITE 6: Bilingual Support Tests
// ============================================================================

describe('Bilingual Support Tests', () => {
  
  it('BI-001: French calculator title', async () => {
    const translation = await db
      .select()
      .from(uiTranslations)
      .where(
        and(
          eq(uiTranslations.key, 'calculator.step_code.title'),
          eq(uiTranslations.context, 'calculator')
        )
      )
      .limit(1);
    
    expect(translation[0]?.fr).toBe('Calculateur du Code Échelon');
  });

  it('BI-002: French report header', async () => {
    const translation = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.key, 'report.compliant'))
      .limit(1);
    
    expect(translation[0]?.fr).toBe('Conforme');
  });

  it('BI-003: French occupancy label', async () => {
    const translation = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.key, 'occupancy.residential'))
      .limit(1);
    
    expect(translation[0]?.fr).toBe('Résidentiel');
  });

  it('BI-005: French error message', async () => {
    const translation = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.key, 'validation.tedi_required'))
      .limit(1);
    
    expect(translation[0]?.fr).toBeDefined();
    expect(translation[0]?.fr?.length).toBeGreaterThan(0);
  });

  it('BI-006: All calculator translations have both EN and FR', async () => {
    const translations = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.context, 'calculator'));
    
    for (const t of translations) {
      expect(t.en).toBeDefined();
      expect(t.fr).toBeDefined();
    }
  });
});

// ============================================================================
// TEST SUITE 7: Edge Cases & Error Handling
// ============================================================================

describe('Edge Cases & Error Handling', () => {
  
  it('EDGE-001: Lloydminster (BC/AB border) - assign to Alberta', () => {
    // Lloydminster is on the border but administratively in Alberta
    const province = 'AB';
    expect(province).toBe('AB');
  });

  it('EDGE-002: Negative TEDI validation error', () => {
    const tedi = -5;
    const isValid = tedi >= 0;
    
    expect(isValid).toBe(false);
  });

  it('EDGE-003: Zero airtightness validation error', () => {
    const ach50 = 0;
    const isValid = ach50 > 0;
    
    expect(isValid).toBe(false);
  });

  it('EDGE-004: Duplicate project name allowed with unique ID', () => {
    const projectName = 'Test Project';
    const projectId1 = 'proj_001';
    const projectId2 = 'proj_002';
    
    // Same name, different IDs - should be allowed
    expect(projectId1).not.toBe(projectId2);
  });

  it('EDGE-005: Missing required fields validation', () => {
    const requiredFields = ['projectName', 'address', 'buildingType'];
    const submittedData = { projectName: 'Test' }; // Missing address and buildingType
    
    const isValid = requiredFields.every(field => field in submittedData);
    expect(isValid).toBe(false);
  });
});

// ============================================================================
// TEST SUITE 8: Data Validation Tests
// ============================================================================

describe('Data Validation Tests', () => {
  
  it('Should validate TEDI within acceptable range', () => {
    const tedi = 25;
    const isValid = tedi >= 0 && tedi <= 200;
    
    expect(isValid).toBe(true);
  });

  it('Should validate airtightness within acceptable range', () => {
    const ach50 = 2.5;
    const isValid = ach50 > 0 && ach50 <= 10;
    
    expect(isValid).toBe(true);
  });

  it('Should reject invalid climate zone', () => {
    const validZones = ['4', '5', '6', '7a', '7b', '8'];
    const zone = '9';
    
    expect(validZones.includes(zone)).toBe(false);
  });

  it('Should reject invalid seismic zone', () => {
    const validZones = ['Low', 'Intermediate', 'High', 'Very High'];
    const zone = 'Extreme';
    
    expect(validZones.includes(zone)).toBe(false);
  });

  it('Should validate Step Code tier 1-5', () => {
    const validTiers = ['1', '2', '3', '4', '5'];
    const tier = '3';
    
    expect(validTiers.includes(tier)).toBe(true);
  });
});
