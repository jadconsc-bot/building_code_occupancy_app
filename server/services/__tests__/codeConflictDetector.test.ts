import { describe, expect, it } from 'vitest';
import { detectCodeConflicts, type ConflictDetectorInput } from '../codeConflictDetector';

function input(overrides: Partial<ConflictDetectorInput> = {}): ConflictDetectorInput {
  return {
    occupantLoad: [],
    travelDistance: [],
    fireSeparation: [],
    washroomCounts: [],
    constructionTypes: [],
    sprinklered: true,
    storeys: 1,
    province: 'AB',
    ...overrides,
  };
}

describe('zoning storey-cap conflict', () => {
  it('fires when design storeys exceed the zoning cap', () => {
    const result = detectCodeConflicts(input({ storeys: 5, zoneCode: 'RS', zoneMaxStoreys: 3 }));
    expect(result.conflicts).toEqual(expect.arrayContaining([
      expect.objectContaining({ conflictId: 'CONFLICT-ZONING-STOREYS-001', severity: 'major' }),
    ]));
  });

  it.each([null, undefined])('stays silent when the zoning cap is %s', (zoneMaxStoreys) => {
    const result = detectCodeConflicts(input({ storeys: 5, zoneCode: 'RS', zoneMaxStoreys }));
    expect(result.conflicts.some(c => c.conflictId === 'CONFLICT-ZONING-STOREYS-001')).toBe(false);
  });

  it('stays silent when storeys are within the zoning cap', () => {
    const result = detectCodeConflicts(input({ storeys: 3, zoneCode: 'RS', zoneMaxStoreys: 3 }));
    expect(result.conflicts.some(c => c.conflictId === 'CONFLICT-ZONING-STOREYS-001')).toBe(false);
  });
});

describe('zoning site-analysis conflicts', () => {
  const siteAnalysis = {
    lotAreaSqm: 250,
    lotWidthM: 8,
    siteCoveragePct: 70,
    frontSetbackM: 2,
    rearSetbackM: 2,
    sideSetbackM: 1,
  };
  const requirements = {
    zoneMaxCoveragePct: 60,
    zoneMinLotAreaSqm: 300,
    zoneMinLotWidthM: 10,
    zoneSetbacks: { front: 4.5, rear: 4.5, sideInterior: 1.2 },
  };

  it('fires coverage, lot area, lot width, and each setback conflict when violated', () => {
    const result = detectCodeConflicts(input({ siteAnalysis, zoneCode: 'RS', ...requirements }));
    expect(result.conflicts.map(c => c.conflictId)).toEqual(expect.arrayContaining([
      'CONFLICT-ZONING-COVERAGE-001',
      'CONFLICT-ZONING-LOTAREA-001',
      'CONFLICT-ZONING-LOTWIDTH-001',
      'CONFLICT-ZONING-SETBACK-001-front',
      'CONFLICT-ZONING-SETBACK-001-rear',
      'CONFLICT-ZONING-SETBACK-001-sideInterior',
    ]));
  });

  it('stays silent when zone requirements are unknown', () => {
    const result = detectCodeConflicts(input({ siteAnalysis }));
    expect(result.conflicts.some(c => c.conflictId.startsWith('CONFLICT-ZONING-'))).toBe(false);
  });

  it('stays silent when site-analysis values are unknown', () => {
    const result = detectCodeConflicts(input({
      zoneCode: 'RS', ...requirements,
      siteAnalysis: { lotAreaSqm: null, lotWidthM: null, siteCoveragePct: null, frontSetbackM: null, rearSetbackM: null, sideSetbackM: null },
    }));
    expect(result.conflicts.some(c => c.conflictId.startsWith('CONFLICT-ZONING-'))).toBe(false);
  });

  it('stays silent when site analysis complies with zone requirements', () => {
    const result = detectCodeConflicts(input({
      zoneCode: 'RS',
      zoneMaxCoveragePct: 60,
      zoneMinLotAreaSqm: 300,
      zoneMinLotWidthM: 10,
      zoneSetbacks: { front: 4.5, rear: 4.5, sideInterior: 1.2 },
      siteAnalysis: { lotAreaSqm: 300, lotWidthM: 10, siteCoveragePct: 60, frontSetbackM: 4.5, rearSetbackM: 4.5, sideSetbackM: 1.2 },
    }));
    expect(result.conflicts.some(c => c.conflictId.startsWith('CONFLICT-ZONING-'))).toBe(false);
  });
});
