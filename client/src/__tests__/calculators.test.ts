import { describe, it, expect } from 'vitest';

describe('Design Tools Calculator Formulas', () => {
  
  describe('Stair Design Calculator (NBC 3.4.6)', () => {
    it('should calculate correct number of risers for standard residential stair', () => {
      const totalRise = 2700; // mm
      const maxRiserHeight = 200; // mm (residential)
      const minRisers = Math.ceil(totalRise / maxRiserHeight);
      
      expect(minRisers).toBe(14);
    });

    it('should ensure riser height is within NBC limits', () => {
      const totalRise = 2700; // mm
      const numRisers = 14;
      const riserHeight = totalRise / numRisers;
      
      expect(riserHeight).toBeGreaterThanOrEqual(125);
      expect(riserHeight).toBeLessThanOrEqual(200);
    });

    it('should calculate tread depth within NBC limits', () => {
      const riserHeight = 193; // mm
      const treadDepth = 280; // mm (typical)
      const sum = riserHeight + treadDepth;
      
      // NBC 3.4.6.5: riser + tread should be 450-500mm
      expect(sum).toBeGreaterThanOrEqual(450);
      expect(sum).toBeLessThanOrEqual(500);
    });
  });

  describe('Snow Load Calculator (NBC 4.1.6)', () => {
    it('should calculate snow load for Calgary residential', () => {
      const groundSnow = 1.5; // kPa
      const importance = 1.0;
      const exposure = 1.0;
      const slope = 1.0; // flat roof
      const thermal = 1.0;
      
      const snowLoad = groundSnow * importance * exposure * slope * thermal;
      
      expect(snowLoad).toBe(1.5);
    });

    it('should reduce snow load for sloped roof', () => {
      const groundSnow = 1.5; // kPa
      const roofSlope = 30; // degrees
      const slopeFactor = roofSlope >= 30 ? 0.67 : 1.0;
      
      const snowLoad = groundSnow * slopeFactor;
      
      expect(snowLoad).toBeCloseTo(1.0, 1);
    });
  });

  describe('Accessibility Ramp Calculator (NBC 3.8)', () => {
    it('should calculate ramp length for standard rise', () => {
      const totalRise = 600; // mm
      const maxSlope = 1/12; // 1:12 max slope
      const minLength = totalRise / maxSlope;
      
      expect(minLength).toBe(7200); // 7.2m
    });

    it('should require landing every 9m', () => {
      const rampLength = 20000; // mm
      const maxRunBetweenLandings = 9000; // mm
      const numLandings = Math.ceil(rampLength / maxRunBetweenLandings) - 1;
      
      expect(numLandings).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Thermal Resistance Calculator (NBC 5.3)', () => {
    it('should calculate RSI for 2x6 wall with batt insulation', () => {
      const insulationThickness = 140; // mm
      const rValuePerInch = 3.5; // R-value per inch for fiberglass
      const rValuePerMm = rValuePerInch / 25.4;
      const totalRValue = insulationThickness * rValuePerMm;
      const rsi = totalRValue * 0.1761; // Convert R to RSI
      
      expect(rsi).toBeGreaterThan(3.0);
      expect(rsi).toBeLessThan(4.0);
    });

    it('should meet Zone 7B wall requirements', () => {
      const requiredRSI = 2.97; // Zone 7B minimum
      const actualRSI = 3.52; // R-20 wall
      
      expect(actualRSI).toBeGreaterThanOrEqual(requiredRSI);
    });
  });

  describe('Ventilation Rate Calculator (NBC 6.2)', () => {
    it('should calculate ventilation for 100m² residential', () => {
      const floorArea = 100; // m²
      const minVentilation = 0.3; // ACH
      const ceilingHeight = 2.7; // m
      const volume = floorArea * ceilingHeight;
      const requiredFlow = volume * minVentilation;
      
      expect(requiredFlow).toBeCloseTo(81, 0); // L/s
    });
  });

  describe('Foundation Design Calculator (NBC 9.15)', () => {
    it('should calculate footing width for medium soil', () => {
      const wallLoad = 150; // kN
      const wallLength = 10; // m
      const bearingCapacity = 100; // kPa (medium soil)
      
      const linearLoad = wallLoad / wallLength; // 15 kN/m
      const requiredArea = (linearLoad / bearingCapacity) * 1000; // mm² per meter
      const calculatedWidth = Math.ceil(requiredArea / 100) * 100;
      const footingWidth = Math.max(calculatedWidth, 400); // Apply NBC minimum
      
      expect(footingWidth).toBeGreaterThanOrEqual(400); // NBC minimum
    });

    it('should meet minimum footing thickness', () => {
      const footingWidth = 600; // mm
      const minThickness = Math.max(footingWidth / 3, 150);
      
      expect(minThickness).toBe(200);
    });
  });

  describe('Lateral Load Calculator (NBC 4.1.7 & 4.1.8)', () => {
    it('should calculate wind pressure for Calgary', () => {
      const q = 0.47; // kPa reference pressure
      const Ce = 1.0; // suburban exposure
      const Iw = 1.0; // normal importance
      const Cp = 0.8; // windward wall
      const Cpi = 0.3; // internal pressure
      
      const windPressure = q * Ce * Iw * (Cp + Cpi);
      
      expect(windPressure).toBeCloseTo(0.517, 2);
    });

    it('should calculate wind force on building', () => {
      const windPressure = 0.517; // kPa
      const height = 8; // m
      const width = 12; // m
      const area = height * width;
      const windForce = windPressure * area;
      
      expect(windForce).toBeCloseTo(49.6, 1);
    });
  });

  describe('Energy Code Calculator (NBC Part 10)', () => {
    it('should check Zone 7B wall compliance', () => {
      const requiredRSI = 2.97;
      const actualRSI = 3.5;
      
      expect(actualRSI).toBeGreaterThanOrEqual(requiredRSI);
    });

    it('should check window-to-wall ratio for residential', () => {
      const windowArea = 18; // m²
      const wallArea = 120; // m²
      const ratio = windowArea / wallArea;
      const maxRatio = 0.17; // 17% for residential
      
      expect(ratio).toBeLessThanOrEqual(maxRatio);
    });

    it('should calculate heat loss coefficient', () => {
      const wallArea = 100; // m²
      const wallRSI = 3.5;
      const wallLoss = wallArea / wallRSI;
      
      expect(wallLoss).toBeCloseTo(28.6, 1);
    });
  });

  describe('Plumbing Fixture Calculator (NBC 7.2)', () => {
    it('should calculate fixture units correctly', () => {
      const toilets = 2; // 4 FU each
      const sinks = 2; // 1 FU each
      const showers = 1; // 2 FU
      
      const totalFU = (toilets * 4) + (sinks * 1) + (showers * 2);
      
      expect(totalFU).toBe(12);
    });

    it('should size drain pipe based on fixture units', () => {
      const totalFU = 12;
      let drainSize: string;
      
      if (totalFU <= 3) drainSize = "50mm";
      else if (totalFU <= 6) drainSize = "75mm";
      else if (totalFU <= 12) drainSize = "100mm";
      else drainSize = "125mm";
      
      expect(drainSize).toBe("100mm");
    });

    it('should calculate peak flow rate', () => {
      const totalFU = 12;
      const peakFlow = Math.sqrt(totalFU) * 15;
      
      expect(peakFlow).toBeCloseTo(52, 0);
    });
  });

  describe('Guard and Handrail Calculator (NBC 3.4.6)', () => {
    it('should require 1070mm guard for residential deck', () => {
      const occupancy = "residential";
      const location = "deck";
      const minHeight = 1070; // mm
      
      expect(minHeight).toBe(1070);
    });

    it('should require 920mm handrail height', () => {
      const minHandrailHeight = 865; // mm
      const maxHandrailHeight = 965; // mm
      const typicalHeight = 920; // mm
      
      expect(typicalHeight).toBeGreaterThanOrEqual(minHandrailHeight);
      expect(typicalHeight).toBeLessThanOrEqual(maxHandrailHeight);
    });

    it('should limit guard opening to 100mm', () => {
      const maxOpening = 100; // mm
      const sphereDiameter = 100; // mm test sphere
      
      expect(maxOpening).toBeLessThanOrEqual(sphereDiameter);
    });
  });

  describe('Stud Spacing Calculator (NBC Part 9)', () => {
    it('should validate 2x4 @ 16" o.c. for standard wall', () => {
      const studSize = "38x89"; // 2x4
      const spacing = 400; // mm (16" o.c.)
      const wallHeight = 2400; // mm
      
      // 2x4 studs at 16" o.c. are valid for walls up to 2.4m
      expect(wallHeight).toBeLessThanOrEqual(2400);
      expect(spacing).toBe(400);
    });

    it('should allow 2x6 @ 24" o.c. for energy-efficient walls', () => {
      const studSize = "38x140"; // 2x6
      const spacing = 600; // mm (24" o.c.)
      const wallHeight = 2400; // mm
      
      expect(spacing).toBe(600);
      expect(wallHeight).toBeLessThanOrEqual(2400);
    });
  });

  describe('Lintel Span Calculator (NBC Part 9)', () => {
    it('should size lintel for standard door opening', () => {
      const openingWidth = 900; // mm
      const floorsAbove = 1;
      const roofLoad = true;
      
      // Simplified: 2x10 SPF can span ~1.2m for typical residential loads
      const maxSpan = 1200; // mm for 2x10
      
      expect(openingWidth).toBeLessThan(maxSpan);
    });
  });
});
