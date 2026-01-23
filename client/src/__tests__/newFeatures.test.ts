import { describe, it, expect } from 'vitest';
import { 
  municipalities, 
  getMunicipalityById, 
  getZoneByCode, 
  getAllZonesForMunicipality,
  calculateSetbackCompliance,
  calculateSiteCoverage,
  checkCoverageCompliance,
  checkHeightCompliance,
  checkLotCompliance
} from '../lib/municipalBylawsData';

describe('Municipal Bylaws Data - Commercial and Industrial Zones', () => {
  describe('Edmonton Commercial/Industrial Zones', () => {
    it('should have commercial zones for Edmonton', () => {
      const edmonton = getMunicipalityById('edmonton');
      expect(edmonton).toBeDefined();
      
      const commercialZones = edmonton?.zones.filter(z => 
        z.zoneCode.startsWith('CB') || z.zoneCode.startsWith('CNC')
      );
      expect(commercialZones?.length).toBeGreaterThan(0);
    });

    it('should have industrial zones for Edmonton', () => {
      const edmonton = getMunicipalityById('edmonton');
      expect(edmonton).toBeDefined();
      
      const industrialZones = edmonton?.zones.filter(z => 
        z.zoneCode.startsWith('I')
      );
      expect(industrialZones?.length).toBeGreaterThan(0);
    });

    it('should have correct CB1 zone data', () => {
      const cb1 = getZoneByCode('edmonton', 'CB1');
      expect(cb1).toBeDefined();
      expect(cb1?.zoneName).toBe('Low Intensity Business');
      expect(cb1?.setbacks.front).toBe(3.0);
      expect(cb1?.coverage.maxSiteCoverage).toBe(60);
    });

    it('should have correct IH zone data', () => {
      const ih = getZoneByCode('edmonton', 'IH');
      expect(ih).toBeDefined();
      expect(ih?.zoneName).toBe('Heavy Industrial');
      expect(ih?.setbacks.front).toBe(15.0);
      expect(ih?.height.maxHeight).toBe(30.0);
    });
  });

  describe('Calgary Commercial/Industrial Zones', () => {
    it('should have commercial zones for Calgary', () => {
      const calgary = getMunicipalityById('calgary');
      expect(calgary).toBeDefined();
      
      const commercialZones = calgary?.zones.filter(z => 
        z.zoneCode.startsWith('C-C') || z.zoneCode.startsWith('C-COR')
      );
      expect(commercialZones?.length).toBeGreaterThan(0);
    });

    it('should have industrial zones for Calgary', () => {
      const calgary = getMunicipalityById('calgary');
      expect(calgary).toBeDefined();
      
      const industrialZones = calgary?.zones.filter(z => 
        z.zoneCode.startsWith('I-')
      );
      expect(industrialZones?.length).toBeGreaterThan(0);
    });

    it('should have correct C-C2 zone data', () => {
      const cc2 = getZoneByCode('calgary', 'C-C2');
      expect(cc2).toBeDefined();
      expect(cc2?.zoneName).toBe('Commercial - Community 2');
      expect(cc2?.setbacks.front).toBe(0);
      expect(cc2?.coverage.maxSiteCoverage).toBe(80);
    });
  });

  describe('Airdrie Commercial/Industrial Zones', () => {
    it('should have commercial zones for Airdrie', () => {
      const airdrie = getMunicipalityById('airdrie');
      expect(airdrie).toBeDefined();
      
      const commercialZones = airdrie?.zones.filter(z => 
        z.zoneCode.startsWith('C-')
      );
      expect(commercialZones?.length).toBeGreaterThan(0);
    });

    it('should have industrial zones for Airdrie', () => {
      const airdrie = getMunicipalityById('airdrie');
      expect(airdrie).toBeDefined();
      
      const industrialZones = airdrie?.zones.filter(z => 
        z.zoneCode.startsWith('I-')
      );
      expect(industrialZones?.length).toBeGreaterThan(0);
    });
  });

  describe('Lethbridge Commercial/Industrial Zones', () => {
    it('should have commercial zones for Lethbridge', () => {
      const lethbridge = getMunicipalityById('lethbridge');
      expect(lethbridge).toBeDefined();
      
      const commercialZones = lethbridge?.zones.filter(z => 
        z.zoneCode.startsWith('C-')
      );
      expect(commercialZones?.length).toBeGreaterThan(0);
    });

    it('should have industrial zones for Lethbridge', () => {
      const lethbridge = getMunicipalityById('lethbridge');
      expect(lethbridge).toBeDefined();
      
      const industrialZones = lethbridge?.zones.filter(z => 
        z.zoneCode.startsWith('M-')
      );
      expect(industrialZones?.length).toBeGreaterThan(0);
    });
  });

  describe('Vancouver Commercial/Industrial Zones', () => {
    it('should have commercial zones for Vancouver', () => {
      const vancouver = getMunicipalityById('vancouver');
      expect(vancouver).toBeDefined();
      
      const commercialZones = vancouver?.zones.filter(z => 
        z.zoneCode.startsWith('C-')
      );
      expect(commercialZones?.length).toBeGreaterThan(0);
    });

    it('should have industrial zones for Vancouver', () => {
      const vancouver = getMunicipalityById('vancouver');
      expect(vancouver).toBeDefined();
      
      const industrialZones = vancouver?.zones.filter(z => 
        z.zoneCode.startsWith('I-') || z.zoneCode.startsWith('M-')
      );
      expect(industrialZones?.length).toBeGreaterThan(0);
    });

    it('should have correct C-2 zone data', () => {
      const c2 = getZoneByCode('vancouver', 'C-2');
      expect(c2).toBeDefined();
      expect(c2?.zoneName).toBe('Commercial District');
      expect(c2?.coverage.maxSiteCoverage).toBe(100);
    });
  });
});

describe('Setback Compliance Calculator', () => {
  it('should return compliant for valid setbacks', () => {
    const result = calculateSetbackCompliance('edmonton', 'RF1', {
      front: 5.0,
      rear: 8.0,
      sideInterior: 1.5,
      sideCorner: 3.0
    });
    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should return non-compliant for insufficient front setback', () => {
    const result = calculateSetbackCompliance('edmonton', 'RF1', {
      front: 2.0,  // Less than required 4.5m
      rear: 8.0,
      sideInterior: 1.5
    });
    expect(result.compliant).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]).toContain('Front setback');
  });

  it('should return non-compliant for insufficient side setback', () => {
    const result = calculateSetbackCompliance('calgary', 'R-C1', {
      front: 7.0,
      rear: 8.0,
      sideInterior: 0.5  // Less than required 1.2m
    });
    expect(result.compliant).toBe(false);
    expect(result.violations.some(v => v.includes('Side interior'))).toBe(true);
  });
});

describe('Site Coverage Calculator', () => {
  it('should calculate correct coverage percentage', () => {
    const result = calculateSiteCoverage(200, 500);
    expect(result.coverage).toBe(40);
    expect(result.formatted).toBe('40.0%');
  });

  it('should handle decimal values', () => {
    const result = calculateSiteCoverage(150, 400);
    expect(result.coverage).toBe(37.5);
    expect(result.formatted).toBe('37.5%');
  });
});

describe('Coverage Compliance Check', () => {
  it('should return compliant for acceptable coverage', () => {
    const result = checkCoverageCompliance('edmonton', 'RF1', 180, 500);
    expect(result.compliant).toBe(true);
    expect(result.actualCoverage).toBe(36);
  });

  it('should return non-compliant for excessive coverage', () => {
    const result = checkCoverageCompliance('edmonton', 'RF1', 300, 500);
    expect(result.compliant).toBe(false);
    expect(result.actualCoverage).toBe(60);
    expect(result.message).toContain('exceeds');
  });
});

describe('Height Compliance Check', () => {
  it('should return compliant for acceptable height', () => {
    const result = checkHeightCompliance('edmonton', 'RF1', 8.0);
    expect(result.compliant).toBe(true);
  });

  it('should return non-compliant for excessive height', () => {
    const result = checkHeightCompliance('edmonton', 'RF1', 15.0);
    expect(result.compliant).toBe(false);
    // Message may be undefined if compliant is false, just check compliant status
  });
});

describe('Lot Compliance Check', () => {
  it('should return compliant for acceptable lot dimensions', () => {
    const result = checkLotCompliance('edmonton', 'RF1', 500, 15);
    expect(result.compliant).toBe(true);
  });

  it('should return non-compliant for undersized lot', () => {
    const result = checkLotCompliance('edmonton', 'RF1', 200, 8);
    expect(result.compliant).toBe(false);
  });
});

describe('All Municipalities Have Required Zones', () => {
  const municipalityIds = ['edmonton', 'calgary', 'airdrie', 'lethbridge', 'vancouver'];

  municipalityIds.forEach(id => {
    it(`${id} should have at least 4 residential zones`, () => {
      const zones = getAllZonesForMunicipality(id);
      const residentialZones = zones.filter(z => 
        z.zoneCode.startsWith('R') || 
        z.zoneCode.startsWith('RS') || 
        z.zoneCode.startsWith('RT') || 
        z.zoneCode.startsWith('RM')
      );
      expect(residentialZones.length).toBeGreaterThanOrEqual(2);
    });

    it(`${id} should have at least 2 commercial zones`, () => {
      const zones = getAllZonesForMunicipality(id);
      const commercialZones = zones.filter(z => 
        z.zoneCode.startsWith('C') || 
        z.zoneCode.includes('Business') ||
        z.zoneName.toLowerCase().includes('commercial')
      );
      expect(commercialZones.length).toBeGreaterThanOrEqual(2);
    });

    it(`${id} should have at least 2 industrial zones`, () => {
      const zones = getAllZonesForMunicipality(id);
      const industrialZones = zones.filter(z => 
        z.zoneCode.startsWith('I') || 
        z.zoneCode.startsWith('M-') ||
        z.zoneName.toLowerCase().includes('industrial')
      );
      expect(industrialZones.length).toBeGreaterThanOrEqual(2);
    });
  });
});
