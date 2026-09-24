import { describe, it, expect } from 'vitest';
import { 
  occupantLoadFactors, 
  getLoadFactorsForOccupancy, 
  calculateOccupantLoad 
} from '@shared/occupantLoadFactors';

describe('OccupantLoadFactors', () => {
  describe('occupantLoadFactors data', () => {
    it('should have all required categories', () => {
      const categories = [...new Set(occupantLoadFactors.map(f => f.category))];
      expect(categories).toContain('Assembly Uses');
      expect(categories).toContain('Care, Treatment & Detention');
      expect(categories).toContain('Residential Uses');
      expect(categories).toContain('Business & Personal Services');
      expect(categories).toContain('Mercantile Uses');
      expect(categories).toContain('Industrial Uses');
      expect(categories).toContain('Other Uses');
    });

    it('should have unique IDs for all factors', () => {
      const ids = occupantLoadFactors.map(f => f.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should have valid area per person values or clause references', () => {
      occupantLoadFactors.forEach(factor => {
        if (factor.areaPerPerson !== null) {
          expect(factor.areaPerPerson).toBeGreaterThan(0);
        } else {
          expect(factor.clause).toBeDefined();
        }
      });
    });

    it('should have at least one occupancy group for each factor', () => {
      occupantLoadFactors.forEach(factor => {
        expect(factor.occupancyGroups.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getLoadFactorsForOccupancy', () => {
    it('should return factors for Assembly A-1 occupancy', () => {
      const factors = getLoadFactorsForOccupancy('A-1');
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some(f => f.category === 'Assembly Uses')).toBe(true);
    });

    it('should return factors for Assembly A-2 occupancy', () => {
      const factors = getLoadFactorsForOccupancy('A-2');
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some(f => f.useType.includes('Dining'))).toBe(true);
      expect(factors.some(f => f.useType.includes('Classrooms'))).toBe(true);
    });

    it('should return factors for Residential C occupancy', () => {
      const factors = getLoadFactorsForOccupancy('C');
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some(f => f.useType.includes('Dwelling'))).toBe(true);
      expect(factors.some(f => f.useType.includes('Dormitories'))).toBe(true);
    });

    it('should return factors for Business D occupancy', () => {
      const factors = getLoadFactorsForOccupancy('D');
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some(f => f.useType.includes('Offices'))).toBe(true);
    });

    it('should return factors for Mercantile E occupancy', () => {
      const factors = getLoadFactorsForOccupancy('E');
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some(f => f.useType.includes('Basements'))).toBe(true);
    });

    it('should return factors for Industrial F-1 occupancy', () => {
      const factors = getLoadFactorsForOccupancy('F-1');
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some(f => f.useType.includes('Manufacturing'))).toBe(true);
    });

    it('should return factors for Care B-2 occupancy', () => {
      const factors = getLoadFactorsForOccupancy('B-2');
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some(f => f.useType.toLowerCase().includes('treatment'))).toBe(true);
    });

    it('should handle occupancy codes with extra text', () => {
      const factors = getLoadFactorsForOccupancy('C (Secondary Suite)');
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some(f => f.useType.includes('Dwelling'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const factorsUpper = getLoadFactorsForOccupancy('A-1');
      const factorsLower = getLoadFactorsForOccupancy('a-1');
      expect(factorsUpper.length).toBe(factorsLower.length);
    });
  });

  describe('calculateOccupantLoad', () => {
    it('should calculate occupant load correctly for standing space', () => {
      // 100 m² at 0.40 m²/person = 250 persons
      const load = calculateOccupantLoad(100, 0.40);
      expect(load).toBe(250);
    });

    it('should calculate occupant load correctly for non-fixed seats', () => {
      // 100 m² at 0.75 m²/person = 134 persons (rounded up)
      const load = calculateOccupantLoad(100, 0.75);
      expect(load).toBe(134);
    });

    it('should calculate occupant load correctly for offices', () => {
      // 100 m² at 9.30 m²/person = 11 persons (rounded up)
      const load = calculateOccupantLoad(100, 9.30);
      expect(load).toBe(11);
    });

    it('should calculate occupant load correctly for classrooms', () => {
      // 50 m² at 1.85 m²/person = 28 persons (rounded up)
      const load = calculateOccupantLoad(50, 1.85);
      expect(load).toBe(28);
    });

    it('should calculate occupant load correctly for storage', () => {
      // 1000 m² at 46.00 m²/person = 22 persons (rounded up)
      const load = calculateOccupantLoad(1000, 46.00);
      expect(load).toBe(22);
    });

    it('should round up to nearest whole person', () => {
      // 10 m² at 9.30 m²/person = 1.075... = 2 persons (rounded up)
      const load = calculateOccupantLoad(10, 9.30);
      expect(load).toBe(2);
    });

    it('should return 0 for zero floor area', () => {
      const load = calculateOccupantLoad(0, 9.30);
      expect(load).toBe(0);
    });

    it('should return 0 for negative floor area', () => {
      const load = calculateOccupantLoad(-100, 9.30);
      expect(load).toBe(0);
    });

    it('should return 0 for zero area per person', () => {
      const load = calculateOccupantLoad(100, 0);
      expect(load).toBe(0);
    });

    it('should return 0 for negative area per person', () => {
      const load = calculateOccupantLoad(100, -9.30);
      expect(load).toBe(0);
    });
  });

  describe('NBC Table 3.1.17.1 specific values', () => {
    it('should have correct value for standing space (0.40 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Standing space');
      expect(factor?.areaPerPerson).toBe(0.40);
    });

    it('should have correct value for non-fixed seats (0.75 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Space with non-fixed seats');
      expect(factor?.areaPerPerson).toBe(0.75);
    });

    it('should have correct value for dining space (1.20 m²)', () => {
      const factor = occupantLoadFactors.find(f =>
        f.useType === 'Dining, beverage and cafeteria space' &&
        f.category === 'Assembly Uses'
      );
      expect(factor?.areaPerPerson).toBe(1.20);
    });

    it('should have correct value for classrooms (1.85 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Classrooms');
      expect(factor?.areaPerPerson).toBe(1.85);
    });

    it('should have correct value for offices (9.30 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Offices');
      expect(factor?.areaPerPerson).toBe(9.30);
    });

    it('should have correct value for mercantile basement (3.70 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Basements and first storeys');
      expect(factor?.areaPerPerson).toBe(3.70);
    });

    it('should have correct value for storage garages (46.00 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Storage garages');
      expect(factor?.areaPerPerson).toBe(46.00);
    });

    it('should have correct value for dormitories (4.60 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Dormitories');
      expect(factor?.areaPerPerson).toBe(4.60);
    });

    it('should have correct value for B-1 detention (11.60 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Detention quarters');
      expect(factor?.areaPerPerson).toBe(11.60);
    });

    it('should have correct value for B-2 treatment (10.00 m²)', () => {
      const factor = occupantLoadFactors.find(f => f.useType === 'Care, treatment and sleeping room areas');
      expect(factor?.areaPerPerson).toBe(10.00);
    });
  });
});
