import { describe, expect, it } from 'vitest';
import { reclassifyAccessoryOccupancy } from '../spatial/accessoryOccupancyReclassifier';

describe('reclassifyAccessoryOccupancy', () => {
  it('reclassifies accessory garage space to Group C for a single dwelling unit', () => {
    expect(
      reclassifyAccessoryOccupancy({
        occupancyGroup: 'F',
        spaceType: 'garage',
        dominantOccupancyGroup: 'C',
        totalDwellingUnits: 1,
      }),
    ).toMatchObject({
      action: 'reclassified',
      newOccupancyGroup: 'C',
      citation: 'NBC 3.1.2',
    });
  });

  it('flags accessory space for verification when dwelling-unit count is missing', () => {
    expect(
      reclassifyAccessoryOccupancy({
        occupancyGroup: 'F',
        spaceType: 'garage',
        dominantOccupancyGroup: 'C',
        totalDwellingUnits: undefined,
      }),
    ).toMatchObject({
      action: 'flagForVerification',
      citation: 'NBC 9.37 (Secondary Suites)',
    });
  });

  it('flags accessory space for verification when dwelling-unit count is multi-unit', () => {
    expect(
      reclassifyAccessoryOccupancy({
        occupancyGroup: 'F',
        spaceType: 'garage',
        dominantOccupancyGroup: 'C',
        totalDwellingUnits: 3,
      }),
    ).toMatchObject({
      action: 'flagForVerification',
      citation: 'NBC 9.37 (Secondary Suites)',
    });
  });

  it('leaves non-accessory rooms unchanged', () => {
    expect(
      reclassifyAccessoryOccupancy({
        occupancyGroup: 'D',
        spaceType: 'room',
        dominantOccupancyGroup: 'C',
        totalDwellingUnits: 1,
      }),
    ).toEqual({ action: 'unchanged' });
  });

  it('leaves non-C dominant contexts unchanged', () => {
    expect(
      reclassifyAccessoryOccupancy({
        occupancyGroup: 'F',
        spaceType: 'garage',
        dominantOccupancyGroup: 'D',
        totalDwellingUnits: 1,
      }),
    ).toEqual({ action: 'unchanged' });
  });
});
