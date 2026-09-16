import { describe, expect, it } from 'vitest';
import { determineOccupantLoad } from './occupantLoadDetermination';

describe('determineOccupantLoad', () => {
  it('uses explicit Group C bedroom count', () => expect(determineOccupantLoad({ occupancyGroup: 'C', bedroomCount: 3, areaM2: 836 })).toMatchObject({ occupantLoad: 6, method: 'bedroom_count', needsReview: false }));
  it('counts Group C bedrooms from room labels', () => expect(determineOccupantLoad({ occupancyGroup: 'C', rooms: [ { occupancyGroup: 'C', roomLabel: 'Bedroom 1' }, { occupancyGroup: 'C', label: 'Master Bedroom' }, { occupancyGroup: 'C', label: 'Living Room' } ] })).toMatchObject({ occupantLoad: 4, bedroomCount: 2 }));
  it('counts bedrooms across all units', () => expect(determineOccupantLoad({ occupancyGroup: 'C', rooms: [ { occupancyGroup: 'C', label: 'Unit A Bedroom' }, { occupancyGroup: 'C', label: 'Unit B Bedroom' }, { occupancyGroup: 'C', label: 'Suite Bedroom' } ] }).occupantLoad).toBe(6));
  it('needs review when Group C bedroom data is absent', () => expect(determineOccupantLoad({ occupancyGroup: 'C', areaM2: 408 })).toMatchObject({ occupantLoad: 0, method: 'needs_review', needsReview: true }));
  it('uses area factor for non-Group-C', () => expect(determineOccupantLoad({ occupancyGroup: 'D', areaM2: 408 })).toMatchObject({ occupantLoad: 89, method: 'area_factor', needsReview: false }));
  it('does not count non-Group-C bedrooms', () => expect(determineOccupantLoad({ occupancyGroup: 'C', rooms: [{ occupancyGroup: 'D', label: 'Bedroom' }] }).needsReview).toBe(true));
});
