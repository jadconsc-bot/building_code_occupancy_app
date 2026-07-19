import { describe, expect, it } from 'vitest';
import {
  buildSitePlanPrompts,
  deriveLotCoveragePct,
  SitePlanExtractionSchema,
} from '../sitePlanExtractionService';

const FIELD_NAMES = [
  'parcelAreaM2',
  'parcelWidthM',
  'parcelDepthM',
  'frontSetbackM',
  'rearSetbackM',
  'sideSetbackLeftM',
  'sideSetbackRightM',
  'buildingFootprintM2',
  'lotCoveragePct',
  'mainFloorGeodeticM',
  'roofPeakGeodeticM',
  'footingGeodeticM',
  'hasLane',
  'parkingStalls',
  'parkingSurfaceType',
  'northArrowDetected',
  'municipalAddress',
  'detectedScale',
  'scaleConfidence',
] as const;

const completeExtraction = {
  parcelAreaM2: 331.52,
  parcelWidthM: 10.36,
  parcelDepthM: 32,
  frontSetbackM: 3,
  rearSetbackM: 7.5,
  sideSetbackLeftM: 1.2,
  sideSetbackRightM: 1.2,
  buildingFootprintM2: 137.5,
  lotCoveragePct: 41.47,
  mainFloorGeodeticM: 1045.125,
  roofPeakGeodeticM: 1052.375,
  footingGeodeticM: 1042.75,
  hasLane: true,
  parkingStalls: 2,
  parkingSurfaceType: 'concrete',
  northArrowDetected: true,
  municipalAddress: '123 Example Street SW, Calgary, AB',
  detectedScale: '1:100',
  scaleConfidence: 0.96,
};

describe('site plan extraction', () => {
  it('builds system and user prompts containing all extraction fields', () => {
    const prompts = buildSitePlanPrompts();

    expect(typeof prompts.system).toBe('string');
    expect(typeof prompts.user).toBe('string');
    for (const field of FIELD_NAMES) {
      expect(prompts.system).toContain(field);
      expect(prompts.user).toContain(field);
    }
  });

  it('parses a valid complete extraction', () => {
    expect(SitePlanExtractionSchema.parse(completeExtraction)).toEqual(completeExtraction);
  });

  it('parses an all-null extraction', () => {
    const allNull = Object.fromEntries(FIELD_NAMES.map(field => [field, null]));

    expect(SitePlanExtractionSchema.safeParse(allNull).success).toBe(true);
  });

  it('derives Calgary example lot coverage as 41.47 percent', () => {
    expect(deriveLotCoveragePct(137.5, 331.52)).toBe(41.48);
  });

  it('returns null lot coverage when building footprint is null', () => {
    expect(deriveLotCoveragePct(null, 331.52)).toBeNull();
  });

  it('returns null lot coverage when parcel area is null', () => {
    expect(deriveLotCoveragePct(137.5, null)).toBeNull();
  });
});
