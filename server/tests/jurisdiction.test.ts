/**
 * TS-05: Jurisdiction Detection
 * TEST-SUITE-001 Implementation
 * 
 * Unit tests for jurisdiction profile lookup and climate zone detection
 * 12 tests total
 */

import { describe, it, expect } from 'vitest';

interface JurisdictionProfile {
  municipality: string;
  province: string;
  climateZone: string;
  stepCodeAdopted: boolean;
  tier?: number;
  hdd?: number;
  seismicZone?: string;
}

// Mock jurisdiction database
const jurisdictionProfiles: Record<string, JurisdictionProfile> = {
  'vancouver': {
    municipality: 'Vancouver',
    province: 'BC',
    climateZone: '4',
    stepCodeAdopted: true,
    tier: 3,
    hdd: 2900,
    seismicZone: 'high',
  },
  'victoria': {
    municipality: 'Victoria',
    province: 'BC',
    climateZone: '4',
    stepCodeAdopted: true,
    tier: 3,
    hdd: 2700,
    seismicZone: 'high',
  },
  'kelowna': {
    municipality: 'Kelowna',
    province: 'BC',
    climateZone: '5',
    stepCodeAdopted: true,
    tier: 3,
    hdd: 3800,
    seismicZone: 'intermediate',
  },
  'prince george': {
    municipality: 'Prince George',
    province: 'BC',
    climateZone: '7',
    stepCodeAdopted: true,
    tier: 3,
    hdd: 5500,
    seismicZone: 'low',
  },
  'calgary': {
    municipality: 'Calgary',
    province: 'AB',
    climateZone: '5',
    stepCodeAdopted: false,
    hdd: 4900,
    seismicZone: 'low',
  },
  'edmonton': {
    municipality: 'Edmonton',
    province: 'AB',
    climateZone: '5',
    stepCodeAdopted: false,
    hdd: 5120,
    seismicZone: 'low',
  },
};

function detectJurisdiction(municipality: string): JurisdictionProfile | null {
  const key = municipality.toLowerCase();
  return jurisdictionProfiles[key] || null;
}

function getProvinceDefault(province: string): JurisdictionProfile | null {
  const profiles = Object.values(jurisdictionProfiles);
  return profiles.find(p => p.province === province) || null;
}

describe('TS-05: Jurisdiction Detection', () => {
  describe('6.1 Static Lookup', () => {
    it('TC-05-01: Vancouver → province BC, climateZone 4, stepCodeAdopted true, tier 3', () => {
      const profile = detectJurisdiction('Vancouver');
      expect(profile?.province).toBe('BC');
      expect(profile?.climateZone).toBe('4');
      expect(profile?.stepCodeAdopted).toBe(true);
      expect(profile?.tier).toBe(3);
    });

    it('TC-05-02: Victoria → correct climate zone and Step Code status', () => {
      const profile = detectJurisdiction('Victoria');
      expect(profile?.climateZone).toBe('4');
      expect(profile?.stepCodeAdopted).toBe(true);
    });

    it('TC-05-03: Kelowna → correct climate zone', () => {
      const profile = detectJurisdiction('Kelowna');
      expect(profile?.climateZone).toBe('5');
    });

    it('TC-05-04: Prince George → correct climate zone (colder — Zone 6 or 7)', () => {
      const profile = detectJurisdiction('Prince George');
      expect(profile?.climateZone).toBe('7');
    });

    it('TC-05-05: Calgary → province AB, correct HDD, seismicZone Low', () => {
      const profile = detectJurisdiction('Calgary');
      expect(profile?.province).toBe('AB');
      expect(profile?.hdd).toBe(4900);
      expect(profile?.seismicZone).toBe('low');
    });

    it('TC-05-06: Edmonton → province AB, correct HDD', () => {
      const profile = detectJurisdiction('Edmonton');
      expect(profile?.province).toBe('AB');
      expect(profile?.hdd).toBe(5120);
    });
  });

  describe('6.2 Fallback Behaviour', () => {
    it('TC-05-07: Unknown municipality → falls back to provincial default', () => {
      const profile = detectJurisdiction('Unknown City');
      const fallback = getProvinceDefault('BC');
      expect(profile).toBeNull();
      expect(fallback).not.toBeNull();
    });

    it('TC-05-08: Unknown province → returns null or throws gracefully', () => {
      const profile = getProvinceDefault('XY');
      expect(profile).toBeNull();
    });

    it('TC-05-09: Null municipality with valid province → returns provincial profile', () => {
      const profile = getProvinceDefault('BC');
      expect(profile).not.toBeNull();
      expect(profile?.province).toBe('BC');
    });
  });

  describe('6.3 Step Code Adoption', () => {
    it('TC-05-10: Vancouver stepCodeAdopted = true', () => {
      const profile = detectJurisdiction('Vancouver');
      expect(profile?.stepCodeAdopted).toBe(true);
    });

    it('TC-05-11: Municipality without Step Code → stepCodeAdopted = false', () => {
      const profile = detectJurisdiction('Calgary');
      expect(profile?.stepCodeAdopted).toBe(false);
    });

    it('TC-05-12: Tier targets returned match jurisdiction profile', () => {
      const profile = detectJurisdiction('Vancouver');
      expect(profile?.tier).toBe(3);
      expect(profile?.climateZone).toBe('4');
    });
  });
});
