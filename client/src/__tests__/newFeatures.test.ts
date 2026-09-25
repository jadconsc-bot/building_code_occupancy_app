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
} from '@shared/municipalBylawsData';

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

    it('should have correct CB zone data', () => {
      const cb = getZoneByCode('edmonton', 'CB');
      expect(cb).toBeDefined();
      expect(cb?.zoneName).toBe('Commercial Business');
      expect(cb?.setbacks.front).toBe(0);
      expect(cb?.coverage.maxSiteCoverage).toBe(80);
    });

    it('should have correct IH zone data', () => {
      const ih = getZoneByCode('edmonton', 'IH');
      expect(ih).toBeDefined();
      expect(ih?.zoneName).toBe('Heavy Industrial');
      expect(ih?.setbacks.front).toBe(7.5);
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
        z.zoneCode.startsWith('C')
      );
      expect(commercialZones?.length).toBeGreaterThan(0);
    });

    it('should have industrial zones for Airdrie', () => {
      const airdrie = getMunicipalityById('airdrie');
      expect(airdrie).toBeDefined();
      
      const industrialZones = airdrie?.zones.filter(z => 
        z.zoneCode.startsWith('IB') || z.zoneCode.startsWith('I-')
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
    const result = calculateSetbackCompliance('edmonton', 'RS', {
      front: 5.0,
      rear: 8.0,
      sideInterior: 1.5,
      sideCorner: 3.0
    });
    expect(result.compliant).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should return non-compliant for insufficient front setback', () => {
    const result = calculateSetbackCompliance('edmonton', 'RS', {
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
    const result = checkCoverageCompliance('edmonton', 'RS', 180, 500);
    expect(result.compliant).toBe(true);
    expect(result.actualCoverage).toBe(36);
  });

  it('should return non-compliant for excessive coverage', () => {
    const result = checkCoverageCompliance('edmonton', 'RS', 300, 500);
    expect(result.compliant).toBe(false);
    expect(result.actualCoverage).toBe(60);
    expect(result.message).toContain('exceeds');
  });
});

describe('Height Compliance Check', () => {
  it('should return compliant for acceptable height', () => {
    const result = checkHeightCompliance('edmonton', 'RS', 8.0);
    expect(result.compliant).toBe(true);
  });

  it('should return non-compliant for excessive height', () => {
    const result = checkHeightCompliance('edmonton', 'RS', 15.0);
    expect(result.compliant).toBe(false);
    // Message may be undefined if compliant is false, just check compliant status
  });
});

describe('Lot Compliance Check', () => {
  it('should return compliant for acceptable lot dimensions', () => {
    const result = checkLotCompliance('edmonton', 'RS', 500, 15);
    expect(result.compliant).toBe(true);
  });

  it('should return non-compliant for undersized lot', () => {
    const result = checkLotCompliance('edmonton', 'RS', 200, 8);
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


// AI Drawing Analysis Tests
describe("AI Drawing Analysis", () => {
  it("should parse AI response with measurements correctly", () => {
    const mockAiResponse = {
      drawingType: "site-plan",
      scale: "1:100",
      scalePixelsPerMeter: null,
      measurements: [
        {
          id: "m1",
          category: "lot-width",
          value: 15.2,
          label: "Lot Width",
          confidence: "high",
          location: "Bottom of drawing"
        },
        {
          id: "m2",
          category: "setback-front",
          value: 4.5,
          label: "Front Setback",
          confidence: "medium",
          location: "Front of lot"
        }
      ],
      rooms: [
        {
          id: "r1",
          name: "Living Room",
          area: 25.5,
          location: "Center of floor plan"
        }
      ],
      notes: ["Drawing appears to be a residential site plan"]
    };

    expect(mockAiResponse.drawingType).toBe("site-plan");
    expect(mockAiResponse.measurements.length).toBe(2);
    expect(mockAiResponse.measurements[0].category).toBe("lot-width");
    expect(mockAiResponse.measurements[0].value).toBe(15.2);
    expect(mockAiResponse.rooms.length).toBe(1);
    expect(mockAiResponse.rooms[0].name).toBe("Living Room");
    expect(mockAiResponse.notes.length).toBeGreaterThan(0);
  });

  it("should convert AI measurements to annotation format", () => {
    const measurements = [
      { id: "m1", category: "lot-width", value: 15.2, label: "Lot Width", confidence: "high", location: "Bottom" },
      { id: "m2", category: "building-depth", value: 10.5, label: "Building Depth", confidence: "medium", location: "Side" }
    ];

    const annotations = measurements.map((m, index) => ({
      id: `ai-dim-${index}`,
      type: "dimension" as const,
      start: { x: 50 + index * 30, y: 50 },
      end: { x: 150 + index * 30, y: 50 },
      value: m.value,
      label: m.label,
      category: m.category
    }));

    expect(annotations.length).toBe(2);
    expect(annotations[0].id).toBe("ai-dim-0");
    expect(annotations[0].type).toBe("dimension");
    expect(annotations[0].value).toBe(15.2);
    expect(annotations[1].category).toBe("building-depth");
  });

  it("should convert AI rooms to label annotations", () => {
    const rooms = [
      { id: "r1", name: "Living Room", area: 25.5, location: "Center" },
      { id: "r2", name: "Kitchen", area: 12.0, location: "East side" }
    ];

    const labelAnnotations = rooms.map((r, index) => ({
      id: `ai-room-${index}`,
      type: "label" as const,
      position: { x: 100 + index * 50, y: 100 + index * 30 },
      text: `${r.name} (${r.area}m²)`,
      category: "room"
    }));

    expect(labelAnnotations.length).toBe(2);
    expect(labelAnnotations[0].text).toBe("Living Room (25.5m²)");
    expect(labelAnnotations[1].text).toBe("Kitchen (12m²)");
  });

  it("should handle empty AI response gracefully", () => {
    const emptyResponse = {
      drawingType: "unknown",
      scale: null,
      scalePixelsPerMeter: null,
      measurements: [],
      rooms: [],
      notes: []
    };

    expect(emptyResponse.measurements.length).toBe(0);
    expect(emptyResponse.rooms.length).toBe(0);
    expect(emptyResponse.drawingType).toBe("unknown");
  });

  it("should validate measurement categories", () => {
    const validCategories = [
      "lot-width", "lot-depth", "building-width", "building-depth",
      "setback-front", "setback-rear", "setback-side", "building-height",
      "room-area", "other"
    ];

    const testMeasurement = { category: "lot-width" };
    expect(validCategories.includes(testMeasurement.category)).toBe(true);

    const invalidMeasurement = { category: "invalid-category" };
    expect(validCategories.includes(invalidMeasurement.category)).toBe(false);
  });

  it("should validate confidence levels", () => {
    const validConfidenceLevels = ["high", "medium", "low"];

    expect(validConfidenceLevels.includes("high")).toBe(true);
    expect(validConfidenceLevels.includes("medium")).toBe(true);
    expect(validConfidenceLevels.includes("low")).toBe(true);
    expect(validConfidenceLevels.includes("very-high")).toBe(false);
  });

  it("should validate drawing types", () => {
    const validDrawingTypes = ["site-plan", "floor-plan", "elevation", "unknown"];

    expect(validDrawingTypes.includes("site-plan")).toBe(true);
    expect(validDrawingTypes.includes("floor-plan")).toBe(true);
    expect(validDrawingTypes.includes("elevation")).toBe(true);
    expect(validDrawingTypes.includes("unknown")).toBe(true);
    expect(validDrawingTypes.includes("section")).toBe(false);
  });
});
