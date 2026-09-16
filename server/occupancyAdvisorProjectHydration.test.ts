import { describe, expect, it } from 'vitest';
import { getOccupancyAdvisorProjectDefaults } from '../shared/occupancyAdvisorDefaults';

describe('occupancy advisor project hydration', () => {
  it('maps stored project facts into editable advisor defaults', () => {
    expect(getOccupancyAdvisorProjectDefaults({ id: 15, grossFloorArea: '836.00', buildingFootprintJson: { value: 418 }, storeys: 2, province: 'AB', occupancyCode: 'C' })).toEqual({ projectId: 15, initialArea: 836, initialFootprint: 418, initialStoreys: 2, province: 'AB', initialOccupancy: 'C' });
  });
  it('preserves standalone mode when no project is selected', () => {
    expect(getOccupancyAdvisorProjectDefaults(null)).toEqual({ projectId: undefined, province: '', initialArea: undefined, initialFootprint: undefined, initialStoreys: undefined, initialOccupancy: undefined });
  });
});
