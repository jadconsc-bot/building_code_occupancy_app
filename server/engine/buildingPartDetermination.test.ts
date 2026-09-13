import { describe, expect, it } from 'vitest';
import { determineBuildingPart } from './buildingPartDetermination';

const input = (overrides: Partial<Parameters<typeof determineBuildingPart>[0]> = {}) => ({
  footprintM2: 600,
  storeys: 3,
  occupancyGroup: 'C',
  ...overrides,
});

describe('determineBuildingPart', () => {
  it.each(['B-4', 'C', 'D', 'E', 'F-2', 'F-3'])('returns Part 9 for permitted occupancy %s', occupancyGroup => {
    expect(determineBuildingPart(input({ occupancyGroup })).determination).toBe('Part 9');
  });
  it('returns Part 3 above the storey limit', () => {
    expect(determineBuildingPart(input({ storeys: 4 }))).toMatchObject({ determination: 'Part 3', failedCriterion: 'storeys' });
  });
  it('returns Part 3 above the footprint limit', () => {
    expect(determineBuildingPart(input({ footprintM2: 600.01 }))).toMatchObject({ determination: 'Part 3', failedCriterion: 'footprint' });
  });
  it.each(['A-1', 'B-1', 'B-2', 'B-3', 'F-1'])('returns Part 3 for disallowed occupancy %s', occupancyGroup => {
    expect(determineBuildingPart(input({ occupancyGroup })).determination).toBe('Part 3');
  });
  it('returns needs_review when footprint is missing', () => {
    expect(determineBuildingPart(input({ footprintM2: null }))).toMatchObject({ determination: 'needs_review', failedCriterion: 'missing-footprint' });
  });
  it('returns needs_review when required inputs are missing', () => {
    expect(determineBuildingPart({ footprintM2: null, storeys: null, occupancyGroup: null })).toMatchObject({ determination: 'needs_review' });
  });
});
