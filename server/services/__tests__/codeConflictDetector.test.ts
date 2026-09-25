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
