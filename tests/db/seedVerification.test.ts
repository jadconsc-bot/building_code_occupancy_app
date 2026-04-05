/**
 * Database Seed Verification Tests
 * 
 * Ensures that seed data is correctly populated and consistent
 * Run after `pnpm db:push` and before running compliance tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../../server/db';
import { stepCodeTiers, jurisdictionProfiles, uiTranslations } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// SEED VERIFICATION: Step Code Tiers
// ============================================================================

describe('Database Seed Verification - Step Code Tiers', () => {
  
  it('SEED-001: Should have all 5 tiers for Zone 4 Part 9', async () => {
    const tiers = await db
      .select()
      .from(stepCodeTiers)
      .where(
        and(
          eq(stepCodeTiers.climateZone, '4'),
          eq(stepCodeTiers.buildingType, 'part9_single_family')
        )
      );
    
    expect(tiers).toHaveLength(5);
    expect(tiers.map(t => t.tier).sort()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('SEED-002: Should have correct TEDI targets for Vancouver Tier 3', async () => {
    const tier = await db
      .select()
      .from(stepCodeTiers)
      .where(
        and(
          eq(stepCodeTiers.climateZone, '4'),
          eq(stepCodeTiers.tier, '3'),
          eq(stepCodeTiers.buildingType, 'part9_single_family')
        )
      )
      .limit(1);
    
    expect(tier).toHaveLength(1);
    expect(parseFloat(tier[0].tediTarget as any)).toBe(30.00);
    expect(parseFloat(tier[0].meuiTarget as any)).toBe(50.00);
    expect(parseFloat(tier[0].airtightnessMax as any)).toBe(2.50);
  });

  it('SEED-003: Should have tiers for Zone 5 (Kelowna)', async () => {
    const tiers = await db
      .select()
      .from(stepCodeTiers)
      .where(
        and(
          eq(stepCodeTiers.climateZone, '5'),
          eq(stepCodeTiers.buildingType, 'part9_single_family')
        )
      );
    
    expect(tiers.length).toBeGreaterThan(0);
    expect(tiers.map(t => t.tier)).toContain('3');
  });

  it('SEED-004: Should have tiers for Zone 7a (Northern BC)', async () => {
    const tiers = await db
      .select()
      .from(stepCodeTiers)
      .where(
        and(
          eq(stepCodeTiers.climateZone, '7a'),
          eq(stepCodeTiers.buildingType, 'part9_single_family')
        )
      );
    
    expect(tiers.length).toBeGreaterThan(0);
  });

  it('SEED-005: Should have Part 3 commercial tiers', async () => {
    const tiers = await db
      .select()
      .from(stepCodeTiers)
      .where(eq(stepCodeTiers.buildingType, 'part3_murb'));
    
    expect(tiers.length).toBeGreaterThan(0);
    expect(tiers[0].teuiTarget).toBeDefined();
  });

  it('SEED-006: TEDI targets should decrease with higher tiers (more stringent)', async () => {
    const tiers = await db
      .select()
      .from(stepCodeTiers)
      .where(
        and(
          eq(stepCodeTiers.climateZone, '4'),
          eq(stepCodeTiers.buildingType, 'part9_single_family')
        )
      );
    
    const sortedTiers = tiers.sort((a, b) => parseInt(a.tier) - parseInt(b.tier));
    
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevTedi = parseFloat(sortedTiers[i - 1].tediTarget as any);
      const currTedi = parseFloat(sortedTiers[i].tediTarget as any);
      
      expect(currTedi).toBeLessThanOrEqual(prevTedi);
    }
  });

  it('SEED-007: Airtightness should improve with higher tiers', async () => {
    const tiers = await db
      .select()
      .from(stepCodeTiers)
      .where(
        and(
          eq(stepCodeTiers.climateZone, '4'),
          eq(stepCodeTiers.buildingType, 'part9_single_family')
        )
      );
    
    const sortedTiers = tiers.sort((a, b) => parseInt(a.tier) - parseInt(b.tier));
    
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevAch = sortedTiers[i - 1].airtightnessMax;
      const currAch = sortedTiers[i].airtightnessMax;
      
      if (prevAch && currAch) {
        expect(parseFloat(currAch as any)).toBeLessThanOrEqual(parseFloat(prevAch as any));
      }
    }
  });

  it('SEED-008: All tiers should have required fields', async () => {
    const tiers = await db
      .select()
      .from(stepCodeTiers)
      .limit(10);
    
    for (const tier of tiers) {
      expect(tier.tier).toBeDefined();
      expect(tier.buildingType).toBeDefined();
      expect(tier.climateZone).toBeDefined();
      expect(tier.tediTarget).toBeDefined();
      expect(tier.effectiveDate).toBeDefined();
      expect(tier.isActive).toBe(true);
    }
  });
});

// ============================================================================
// SEED VERIFICATION: Jurisdiction Profiles
// ============================================================================

describe('Database Seed Verification - Jurisdiction Profiles', () => {
  
  it('SEED-101: Should have all 5 major cities', async () => {
    const cities = await db
      .select({ municipality: jurisdictionProfiles.municipality })
      .from(jurisdictionProfiles);
    
    const cityNames = cities.map(c => c.municipality);
    expect(cityNames).toContain('Vancouver');
    expect(cityNames).toContain('Calgary');
    expect(cityNames).toContain('Edmonton');
    expect(cityNames).toContain('Victoria');
    expect(cityNames).toContain('Kelowna');
  });

  it('SEED-102: Vancouver should have correct climate data', async () => {
    const vancouver = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Vancouver'))
      .limit(1);
    
    expect(vancouver).toHaveLength(1);
    expect(vancouver[0].province).toBe('BC');
    expect(vancouver[0].climateZone).toBe('4');
    expect(vancouver[0].heatingDegreeDays).toBe(2800);
    expect(vancouver[0].designTemperatureWinter).toBe(-12);
  });

  it('SEED-103: Vancouver should have Step Code adoption', async () => {
    const vancouver = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Vancouver'))
      .limit(1);
    
    expect(vancouver[0].stepCodeAdopted).toBe(true);
    expect(vancouver[0].currentStepCodeTier).toBe('3');
  });

  it('SEED-104: Vancouver should have seismic data', async () => {
    const vancouver = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Vancouver'))
      .limit(1);
    
    expect(vancouver[0].seismicZone).toBe('High');
    expect(vancouver[0].spectralAccelerationSa02).toBeDefined();
  });

  it('SEED-105: Calgary should have no Step Code', async () => {
    const calgary = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Calgary'))
      .limit(1);
    
    expect(calgary[0].stepCodeAdopted).toBe(false);
    expect(calgary[0].currentStepCodeTier).toBeNull();
  });

  it('SEED-106: Calgary should have extreme cold climate data', async () => {
    const calgary = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Calgary'))
      .limit(1);
    
    expect(calgary[0].climateZone).toBe('7A');
    expect(calgary[0].heatingDegreeDays).toBe(5500);
    expect(calgary[0].designTemperatureWinter).toBe(-37);
  });

  it('SEED-107: Edmonton should have extreme cold climate', async () => {
    const edmonton = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Edmonton'))
      .limit(1);
    
    expect(edmonton[0].climateZone).toBe('7A');
    expect(edmonton[0].heatingDegreeDays).toBe(5500);
    expect(edmonton[0].designTemperatureWinter).toBe(-37);
  });

  it('SEED-108: Victoria should have Tier 2 Step Code', async () => {
    const victoria = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Victoria'))
      .limit(1);
    
    expect(victoria[0].stepCodeAdopted).toBe(true);
    expect(victoria[0].currentStepCodeTier).toBe('2');
  });

  it('SEED-109: Kelowna should have Zone 5 climate', async () => {
    const kelowna = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.municipality, 'Kelowna'))
      .limit(1);
    
    expect(kelowna[0].climateZone).toBe('5');
    expect(kelowna[0].heatingDegreeDays).toBe(3200);
  });

  it('SEED-110: All jurisdictions should be active', async () => {
    const jurisdictions = await db
      .select()
      .from(jurisdictionProfiles);
    
    for (const j of jurisdictions) {
      expect(j.isActive).toBe(true);
    }
  });

  it('SEED-111: All jurisdictions should have required fields', async () => {
    const jurisdictions = await db
      .select()
      .from(jurisdictionProfiles);
    
    for (const j of jurisdictions) {
      expect(j.province).toBeDefined();
      expect(j.municipality).toBeDefined();
      expect(j.climateZone).toBeDefined();
      expect(j.heatingDegreeDays).toBeDefined();
      expect(j.nbcEdition).toBeDefined();
    }
  });
});

// ============================================================================
// SEED VERIFICATION: UI Translations
// ============================================================================

describe('Database Seed Verification - UI Translations', () => {
  
  it('SEED-201: Should have English translations for calculator', async () => {
    const translations = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.context, 'calculator'));
    
    expect(translations.length).toBeGreaterThan(0);
    expect(translations.map(t => t.key)).toContain('calculator.step_code.title');
  });

  it('SEED-202: Should have French translations for calculator', async () => {
    const translations = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.context, 'calculator'));
    
    for (const t of translations) {
      expect(t.en).toBeDefined();
      expect(t.fr).toBeDefined();
      expect(t.fr?.length).toBeGreaterThan(0);
    }
  });

  it('SEED-203: Should have occupancy labels', async () => {
    const translations = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.context, 'occupancy'));
    
    expect(translations.length).toBeGreaterThan(0);
    expect(translations.map(t => t.key)).toContain('occupancy.assembly');
    expect(translations.map(t => t.key)).toContain('occupancy.residential');
  });

  it('SEED-204: Should have report labels', async () => {
    const translations = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.context, 'report'));
    
    expect(translations.length).toBeGreaterThan(0);
    expect(translations.map(t => t.key)).toContain('report.compliant');
    expect(translations.map(t => t.key)).toContain('report.non_compliant');
  });

  it('SEED-205: All translations should have English version', async () => {
    const translations = await db
      .select()
      .from(uiTranslations);
    
    for (const t of translations) {
      expect(t.en).toBeDefined();
      expect(t.en?.length).toBeGreaterThan(0);
    }
  });

  it('SEED-206: French translations should match English count', async () => {
    const enCount = await db
      .select()
      .from(uiTranslations)
      .where(eq(uiTranslations.context, 'calculator'));
    
    const frCount = enCount.filter(t => t.fr && t.fr.length > 0);
    
    expect(frCount.length).toBe(enCount.length);
  });
});

// ============================================================================
// SEED VERIFICATION: Data Consistency
// ============================================================================

describe('Database Seed Verification - Data Consistency', () => {
  
  it('SEED-301: No duplicate step code tiers', async () => {
    const tiers = await db.select().from(stepCodeTiers);
    
    const uniqueKeys = new Set(
      tiers.map(t => `${t.tier}-${t.buildingType}-${t.climateZone}`)
    );
    
    expect(uniqueKeys.size).toBe(tiers.length);
  });

  it('SEED-302: No duplicate jurisdictions', async () => {
    const jurisdictions = await db.select().from(jurisdictionProfiles);
    
    const uniqueKeys = new Set(
      jurisdictions.map(j => `${j.province}-${j.municipality}`)
    );
    
    expect(uniqueKeys.size).toBe(jurisdictions.length);
  });

  it('SEED-303: All tier effective dates are valid', async () => {
    const tiers = await db.select().from(stepCodeTiers);
    
    for (const tier of tiers) {
      expect(tier.effectiveDate).toBeInstanceOf(Date);
      expect(tier.effectiveDate.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });

  it('SEED-304: All HDD values are positive', async () => {
    const jurisdictions = await db.select().from(jurisdictionProfiles);
    
    for (const j of jurisdictions) {
      if (j.heatingDegreeDays) {
        expect(j.heatingDegreeDays).toBeGreaterThan(0);
      }
    }
  });

  it('SEED-305: All R-values are positive', async () => {
    const tiers = await db.select().from(stepCodeTiers);
    
    for (const tier of tiers) {
      if (tier.tediTarget) {
        expect(parseFloat(tier.tediTarget as any)).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================================
// SEED VERIFICATION: Completeness
// ============================================================================

describe('Database Seed Verification - Completeness', () => {
  
  it('SEED-401: Should have at least 20 step code tier entries', async () => {
    const tiers = await db.select().from(stepCodeTiers);
    expect(tiers.length).toBeGreaterThanOrEqual(20);
  });

  it('SEED-402: Should have at least 5 jurisdiction entries', async () => {
    const jurisdictions = await db.select().from(jurisdictionProfiles);
    expect(jurisdictions.length).toBeGreaterThanOrEqual(5);
  });

  it('SEED-403: Should have at least 20 translation entries', async () => {
    const translations = await db.select().from(uiTranslations);
    expect(translations.length).toBeGreaterThanOrEqual(20);
  });

  it('SEED-404: BC should have more jurisdictions than AB', async () => {
    const bcJurisdictions = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.province, 'BC'));
    
    const abJurisdictions = await db
      .select()
      .from(jurisdictionProfiles)
      .where(eq(jurisdictionProfiles.province, 'AB'));
    
    expect(bcJurisdictions.length).toBeGreaterThan(abJurisdictions.length);
  });
});
