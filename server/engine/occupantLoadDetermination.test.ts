import { describe, expect, it } from 'vitest';
import { determineOccupantLoad } from './occupantLoadDetermination';

describe('determineOccupantLoad', () => {
  it('uses explicit Group C bedroom count', () => expect(determineOccupantLoad({ occupancyGroup: 'C', bedroomCount: 3, areaM2: 836 })).toMatchObject({ occupantLoad: 6, method: 'bedroom_count', needsReview: false }));
  it('counts Group C bedrooms from room labels', () => expect(determineOccupantLoad({ occupancyGroup: 'C', rooms: [ { occupancyGroup: 'C', roomLabel: 'Bedroom 1' }, { occupancyGroup: 'C', label: 'Master Bedroom' }, { occupancyGroup: 'C', label: 'Living Room' } ] })).toMatchObject({ occupantLoad: 4, bedroomCount: 2 }));
  it('counts bedrooms across all units', () => expect(determineOccupantLoad({ occupancyGroup: 'C', rooms: [ { occupancyGroup: 'C', label: 'Unit A Bedroom' }, { occupancyGroup: 'C', label: 'Unit B Bedroom' }, { occupancyGroup: 'C', label: 'Suite Bedroom' } ] }).occupantLoad).toBe(6));
  it('needs review when Group C bedroom data is absent', () => expect(determineOccupantLoad({ occupancyGroup: 'C', areaM2: 408 })).toMatchObject({ occupantLoad: 0, method: 'needs_review', needsReview: true }));
  it('uses area factor for non-Group-C', () => expect(determineOccupantLoad({ occupancyGroup: 'D', areaM2: 408 })).toMatchObject({ occupantLoad: 89, method: 'area_factor', needsReview: false }));
  it('does not count non-Group-C bedrooms', () => expect(determineOccupantLoad({ occupancyGroup: 'C', rooms: [{ occupancyGroup: 'D', label: 'Bedroom' }] }).needsReview).toBe(true));
  it('does not count a bedroom below the 7.0m² minimum', () => {
    const result = determineOccupantLoad({ occupancyGroup: 'C', rooms: [{ occupancyGroup: 'C', label: 'Bedroom', areaM2: 6.5 }] });
    expect(result).toMatchObject({ occupantLoad: 0, needsReview: true });
    expect(result.areaFlags?.[0].personsCounted).toBe(0);
  });
  it('counts a 7.0–9.8m² bedroom as one person', () => {
    const result = determineOccupantLoad({ occupancyGroup: 'C', rooms: [{ occupancyGroup: 'C', label: 'Bedroom', areaM2: 8.5 }] });
    expect(result).toMatchObject({ occupantLoad: 1, needsReview: false });
    expect(result.areaFlags?.[0].personsCounted).toBe(1);
  });
  it('counts a bedroom at or above 9.8m² as two persons', () => {
    const result = determineOccupantLoad({ occupancyGroup: 'C', rooms: [{ occupancyGroup: 'C', label: 'Bedroom', areaM2: 11 }] });
    expect(result).toMatchObject({ occupantLoad: 2, needsReview: false });
    expect(result.areaFlags).toBeUndefined();
  });
  it('cross-checks each bedroom in a dwelling unit', () => {
    const result = determineOccupantLoad({ occupancyGroup: 'C', rooms: [
      { occupancyGroup: 'C', label: 'Bedroom 1', areaM2: 6.5 },
      { occupancyGroup: 'C', label: 'Bedroom 2', areaM2: 11 },
    ] });
    expect(result).toMatchObject({ occupantLoad: 2, needsReview: true });
  });
});
