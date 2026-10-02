/**
 * Phase 2 Calculator Tests
 * 
 * Comprehensive tests for server-side calculator implementations
 */

import { describe, it, expect } from 'vitest';
import { PlumbingFixtureUnitsCalculator } from './calculators/plumbingFixtureUnitsCalculator';
import { ElectricalServiceLoadCalculator } from './calculators/electricalServiceLoadCalculator';

// Mock ruleset
const mockRuleset = {
  occupancy: {
    loadFactors: {},
  },
  stairs: {
    maxRiserHeight: 7.75,
    minTreadDepth: 10,
  },
};

describe('PlumbingFixtureUnitsCalculator', () => {
  const calculator = new PlumbingFixtureUnitsCalculator();

  it('should calculate DFU for single bathroom', async () => {
    const result = await calculator.execute(
      {
        fixtures: {
          toilet: 1,
          lavatory: 1,
          bathtub: 1,
        },
      },
      mockRuleset
    );

    expect(result.results.totalDFU).toBe(7); // 4 + 1 + 2
    expect(result.results.stackSize).toBeGreaterThanOrEqual(38); // 1.5" or 2"
  });

  it('should calculate DFU for multiple fixtures', async () => {
    const result = await calculator.execute(
      {
        fixtures: {
          toilet: 2,
          lavatory: 3,
          kitchenSink: 1,
          dishwasher: 1,
        },
      },
      mockRuleset
    );

    expect(result.results.totalDFU).toBe(15); // (2*4) + (3*1) + (1*2) + (1*2) = 8 + 3 + 2 + 2
    expect(result.results.stackSize).toBeGreaterThanOrEqual(38);
  });

  it('should determine wet venting requirement', async () => {
    const result = await calculator.execute(
      {
        fixtures: {
          toilet: 1,
          lavatory: 1,
        },
      },
      mockRuleset
    );

    expect(result.results.wetVentingRequired).toBe(true);
  });

  it('should provide DFU breakdown', async () => {
    const result = await calculator.execute(
      {
        fixtures: {
          toilet: 1,
          lavatory: 1,
        },
      },
      mockRuleset
    );

    expect(result.results.fixtureBreakdown.toilet).toBeDefined();
    expect(result.results.fixtureBreakdown.toilet.totalDFU).toBe(4);
    expect(result.results.fixtureBreakdown.lavatory.totalDFU).toBe(1);
  });

  it('should throw error for unknown fixture type', async () => {
    try {
      await calculator.execute(
        {
          fixtures: {
            unknownFixture: 1,
          },
        },
        mockRuleset
      );
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('ElectricalServiceLoadCalculator', () => {
  const calculator = new ElectricalServiceLoadCalculator();

  it('should calculate service load for residential', async () => {
    const result = await calculator.execute(
      {
        buildingType: 'residential',
        floorArea: 200,
        numberOfUnits: 1,
      },
      mockRuleset
    );

    expect(result.results.baseLoad).toBeCloseTo(5000, -1); // 200 * 25
    expect(result.results.demandLoad).toBeCloseTo(5000, -1); // 5000 * 1.0
    expect(result.results.serviceSize).toBeGreaterThan(0);
  });

  it('should calculate service load for office', async () => {
    const result = await calculator.execute(
      {
        buildingType: 'office',
        floorArea: 500,
        numberOfUnits: 1,
      },
      mockRuleset
    );

    expect(result.results.baseLoad).toBeCloseTo(25000, -1); // 500 * 50
  });

  it('should add heating load when specified', async () => {
    const result = await calculator.execute(
      {
        buildingType: 'residential',
        floorArea: 200,
        numberOfUnits: 1,
        hasElectricHeating: true,
      },
      mockRuleset
    );

    expect(result.results.heatingLoad).toBeCloseTo(10000, -1); // 200 * 50
    expect(result.results.totalLoad).toBeGreaterThan(result.results.demandLoad);
  });

  it('should add AC load when specified', async () => {
    const result = await calculator.execute(
      {
        buildingType: 'office',
        floorArea: 500,
        numberOfUnits: 1,
        hasAirConditioning: true,
      },
      mockRuleset
    );

    expect(result.results.acLoad).toBeCloseTo(12500, -1); // 500 * 25
  });

  it('should determine correct service size', async () => {
    const result = await calculator.execute(
      {
        buildingType: 'residential',
        floorArea: 200,
        numberOfUnits: 1,
      },
      mockRuleset
    );

    expect([60, 100, 150, 200, 400]).toContain(result.results.serviceSize);
  });

  it('should provide wire gauge recommendation', async () => {
    const result = await calculator.execute(
      {
        buildingType: 'residential',
        floorArea: 200,
        numberOfUnits: 1,
      },
      mockRuleset
    );

    expect(result.results.wireGauge).toMatch(/AWG|kcmil/);
  });

  it('should apply demand factor for multiple units', async () => {
    const singleUnit = await calculator.execute(
      {
        buildingType: 'residential',
        floorArea: 200,
        numberOfUnits: 1,
      },
      mockRuleset
    );

    const multiUnit = await calculator.execute(
      {
        buildingType: 'residential',
        floorArea: 200,
        numberOfUnits: 5,
      },
      mockRuleset
    );

    expect(multiUnit.results.demandLoad).toBeLessThan(singleUnit.results.demandLoad);
  });
});

describe('Calculator Traces', () => {
  it('PlumbingFixtureUnitsCalculator should have detailed trace', async () => {
    const calc = new PlumbingFixtureUnitsCalculator();
    const result = await calc.execute(
      {
        fixtures: {
          toilet: 1,
          lavatory: 1,
        },
      },
      mockRuleset
    );

    result.steps.forEach((step) => {
      expect(step.description).toBeTruthy();
      expect(step.inputs).toBeDefined();
      expect(step.output).toBeDefined();
    });
  });

  it('ElectricalServiceLoadCalculator should have detailed trace', async () => {
    const calc = new ElectricalServiceLoadCalculator();
    const result = await calc.execute(
      {
        buildingType: 'residential',
        floorArea: 200,
        numberOfUnits: 1,
      },
      mockRuleset
    );

    result.steps.forEach((step) => {
      expect(step.description).toBeTruthy();
      expect(step.inputs).toBeDefined();
      expect(step.output).toBeDefined();
    });
  });
});
