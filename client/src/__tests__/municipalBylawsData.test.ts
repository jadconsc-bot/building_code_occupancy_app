import { describe, it, expect } from 'vitest';
import {
  municipalities,
  getMunicipalityById,
  getZoneByCode,
  getAllZonesForMunicipality,
  calculateSetbackCompliance,
  checkCoverageCompliance,
  checkHeightCompliance,
  checkLotCompliance,
  compareZonesAcrossMunicipalities,
} from '@/lib/municipalBylawsData';

describe('Municipal Bylaws Data', () => {
  describe('municipalities data structure', () => {
    it('should have 5 municipalities', () => {
      expect(municipalities).toHaveLength(5);
    });

    it('should include Edmonton, Calgary, Airdrie, Lethbridge, and Vancouver', () => {
      const ids = municipalities.map(m => m.id);
      expect(ids).toContain('edmonton');
      expect(ids).toContain('calgary');
      expect(ids).toContain('airdrie');
      expect(ids).toContain('lethbridge');
      expect(ids).toContain('vancouver');
    });

    it('each municipality should have required fields', () => {
      municipalities.forEach(m => {
        expect(m.id).toBeDefined();
        expect(m.name).toBeDefined();
        expect(m.province).toBeDefined();
        expect(m.bylawName).toBeDefined();
        expect(m.bylawNumber).toBeDefined();
        expect(m.sourceUrl).toBeDefined();
        expect(m.zones).toBeDefined();
        expect(m.zones.length).toBeGreaterThan(0);
      });
    });

    it('each zone should have required fields', () => {
      municipalities.forEach(m => {
        m.zones.forEach(z => {
          expect(z.zoneCode).toBeDefined();
          expect(z.zoneName).toBeDefined();
          expect(z.description).toBeDefined();
          expect(z.setbacks).toBeDefined();
          // Setbacks can be 0 for commercial/industrial zones
          expect(z.setbacks.front).toBeGreaterThanOrEqual(0);
          expect(z.setbacks.rear).toBeGreaterThanOrEqual(0);
          expect(z.setbacks.sideInterior).toBeGreaterThanOrEqual(0);
          expect(z.height).toBeDefined();
          expect(z.height.maxHeight).toBeGreaterThan(0);
          expect(z.coverage).toBeDefined();
          expect(z.coverage.maxSiteCoverage).toBeGreaterThan(0);
          expect(z.lotRequirements).toBeDefined();
          // Lot requirements can be 0 for commercial/industrial zones
          expect(z.lotRequirements.minArea).toBeGreaterThanOrEqual(0);
          expect(z.lotRequirements.minWidth).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('getMunicipalityById', () => {
    it('should return Edmonton when id is "edmonton"', () => {
      const result = getMunicipalityById('edmonton');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Edmonton');
      expect(result?.province).toBe('Alberta');
    });

    it('should return Vancouver when id is "vancouver"', () => {
      const result = getMunicipalityById('vancouver');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Vancouver');
      expect(result?.province).toBe('British Columbia');
    });

    it('should return undefined for non-existent id', () => {
      const result = getMunicipalityById('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getZoneByCode', () => {
    it('should return RF1 zone for Edmonton', () => {
      const result = getZoneByCode('edmonton', 'RF1');
      expect(result).toBeDefined();
      expect(result?.zoneName).toBe('Single Detached Residential');
    });

    it('should return R-C1 zone for Calgary', () => {
      const result = getZoneByCode('calgary', 'R-C1');
      expect(result).toBeDefined();
      expect(result?.zoneName).toBe('Residential - Contextual One Dwelling');
    });

    it('should return undefined for non-existent zone', () => {
      const result = getZoneByCode('edmonton', 'NONEXISTENT');
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent municipality', () => {
      const result = getZoneByCode('nonexistent', 'RF1');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllZonesForMunicipality', () => {
    it('should return all zones for Edmonton', () => {
      const result = getAllZonesForMunicipality('edmonton');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(z => z.zoneCode === 'RF1')).toBe(true);
    });

    it('should return empty array for non-existent municipality', () => {
      const result = getAllZonesForMunicipality('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('calculateSetbackCompliance', () => {
    it('should return compliant when all setbacks meet requirements', () => {
      const result = calculateSetbackCompliance('edmonton', 'RF1', {
        front: 5.0,
        rear: 8.0,
        sideInterior: 1.5,
        sideCorner: 3.0,
      });
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should return non-compliant when front setback is insufficient', () => {
      const result = calculateSetbackCompliance('edmonton', 'RF1', {
        front: 3.0, // RF1 requires 4.5m
        rear: 8.0,
        sideInterior: 1.5,
      });
      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain('Front setback');
    });

    it('should return non-compliant when rear setback is insufficient', () => {
      const result = calculateSetbackCompliance('edmonton', 'RF1', {
        front: 5.0,
        rear: 5.0, // RF1 requires 7.5m
        sideInterior: 1.5,
      });
      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.includes('Rear setback'))).toBe(true);
    });

    it('should return zone not found for invalid zone', () => {
      const result = calculateSetbackCompliance('edmonton', 'INVALID', {
        front: 5.0,
        rear: 8.0,
        sideInterior: 1.5,
      });
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('Zone not found');
    });
  });

  describe('checkCoverageCompliance', () => {
    it('should return compliant when coverage is within limit', () => {
      // RF1 allows 40% coverage
      const result = checkCoverageCompliance('edmonton', 'RF1', 100, 300); // 33.3%
      expect(result.compliant).toBe(true);
      expect(result.actualCoverage).toBeCloseTo(33.33, 1);
      expect(result.maxAllowed).toBe(40);
    });

    it('should return non-compliant when coverage exceeds limit', () => {
      // RF1 allows 40% coverage
      const result = checkCoverageCompliance('edmonton', 'RF1', 200, 300); // 66.7%
      expect(result.compliant).toBe(false);
      expect(result.actualCoverage).toBeCloseTo(66.67, 1);
    });

    it('should return zone not found for invalid zone', () => {
      const result = checkCoverageCompliance('edmonton', 'INVALID', 100, 300);
      expect(result.compliant).toBe(false);
      expect(result.message).toBe('Zone not found');
    });
  });

  describe('checkHeightCompliance', () => {
    it('should return compliant when height is within limit', () => {
      // RF1 allows 10m height
      const result = checkHeightCompliance('edmonton', 'RF1', 9.0, 2);
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should return non-compliant when height exceeds limit', () => {
      // RF1 allows 10m height
      const result = checkHeightCompliance('edmonton', 'RF1', 12.0, 2);
      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.includes('height'))).toBe(true);
    });

    it('should return non-compliant when storeys exceed limit', () => {
      // RF1 allows 2 storeys
      const result = checkHeightCompliance('edmonton', 'RF1', 9.0, 4);
      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.includes('storeys'))).toBe(true);
    });

    it('should return zone not found for invalid zone', () => {
      const result = checkHeightCompliance('edmonton', 'INVALID', 9.0);
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('Zone not found');
    });
  });

  describe('checkLotCompliance', () => {
    it('should return compliant when lot meets requirements', () => {
      // RF1 requires 360 sqm area and 12m width
      const result = checkLotCompliance('edmonton', 'RF1', 400, 13);
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should return non-compliant when lot area is insufficient', () => {
      // RF1 requires 360 sqm area
      const result = checkLotCompliance('edmonton', 'RF1', 300, 13);
      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.includes('Lot area'))).toBe(true);
    });

    it('should return non-compliant when lot width is insufficient', () => {
      // RF1 requires 12m width
      const result = checkLotCompliance('edmonton', 'RF1', 400, 10);
      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.includes('Lot width'))).toBe(true);
    });

    it('should return zone not found for invalid zone', () => {
      const result = checkLotCompliance('edmonton', 'INVALID', 400, 13);
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('Zone not found');
    });
  });

  describe('compareZonesAcrossMunicipalities', () => {
    it('should return comparison data for single-detached zones', () => {
      const result = compareZonesAcrossMunicipalities('single-detached');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(r => r.municipality === 'Edmonton')).toBe(true);
      expect(result.some(r => r.municipality === 'Calgary')).toBe(true);
    });

    it('should return comparison data for duplex zones', () => {
      const result = compareZonesAcrossMunicipalities('duplex');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return comparison data for multi-family zones', () => {
      const result = compareZonesAcrossMunicipalities('multi-family');
      expect(result.length).toBeGreaterThan(0);
    });

    it('each result should have municipality name and zone data', () => {
      const result = compareZonesAcrossMunicipalities('single-detached');
      result.forEach(r => {
        expect(r.municipality).toBeDefined();
        expect(r.zone).toBeDefined();
        expect(r.zone.setbacks).toBeDefined();
        expect(r.zone.height).toBeDefined();
        expect(r.zone.coverage).toBeDefined();
      });
    });
  });
});
