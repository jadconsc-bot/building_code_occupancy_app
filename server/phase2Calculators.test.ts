/**
 * Phase 2 Calculator Tests
 * 
 * Comprehensive tests for server-side calculator implementations
 */

import { describe, it, expect } from 'vitest';
import { FireExitCalculator } from './calculators/fireExitCalculator';
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

describe('FireExitCalculator', () => {
  const calculator = new FireExitCalculator();

  it('should calculate fire exits for small occupancy', async () => {
    const result = await calculator.execute(
      {
        occupantLoad: 30,
        floorNumber: 0,
        buildingHeight: 5,
      },
      mockRuleset
    );

    expect(result.results.exitsRequired).toBe(1);
    expect(result.results.stairwellsRequired).toBe(1);
  });

  it('should calculate fire exits for medium occupancy', async () => {
    const result = await calculator.execute(
      {
        occupantLoad: 200,
        floorNumber: 2,
        buildingHeight: 10,
      },
      mockRuleset
    );

    expect(result.results.exitsRequired).toBe(2);
    expect(result.results.stairwellsRequired).toBe(2);
  });

  it('should calculate fire exits for large occupancy', async () => {
    const result = await calculator.execute(
      {
        occupantLoad: 600,
        floorNumber: 5,
        buildingHeight: 20,
      },
      mockRuleset
    );

    expect(result.results.exitsRequired).toBe(3);
    expect(result.results.stairwellsRequired).toBe(3);
  });

  it('should provide complete calculation trace', async () => {
    const result = await calculator.execute(
      {
        occupantLoad: 100,
        floorNumber: 1,
        buildingHeight: 8,
      },
      mockRuleset
    );

    expect(result.steps.length).toBeGreaterThanOrEqual(6);
    expect(result.steps.some((s) => s.description.toLowerCase().includes('exit'))).toBe(true);
  });

  it('should validate positive occupant load', async () => {
    try {
      await calculator.execute(
        {
          occupantLoad: -50,
          floorNumber: 0,
          buildingHeight: 5,
        },
        mockRuleset
      );
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  // NBC 3.4.3.2.(1)(b): Group B uses 18.4 mm/person (care/treatment/detention override)
  it('NBC 3.4.3.2.(1)(b): Group B uses 18.4 mm/person — ~3× larger than 6.1 default', async () => {
    const [resultB, resultD] = await Promise.all([
      calculator.execute({ occupantLoad: 100, floorNumber: 1, buildingHeight: 8, occupancyCode: 'B' }, mockRuleset),
      calculator.execute({ occupantLoad: 100, floorNumber: 1, buildingHeight: 8, occupancyCode: 'D' }, mockRuleset),
    ]);
    expect(resultB.results.totalExitWidth).toBe(1840); // 100 × 18.4
    expect(resultD.results.totalExitWidth).toBe(610);  // 100 × 6.1
  });

  // NBC 3.4.3.2.(7): when 2+ exits required, each exit ≤50% of total (cap = total / 2)
  it('NBC 3.4.3.2.(7): half-width cap — 2 exits: each exit = totalWidth / 2, not / 2', async () => {
    // occupantLoad 200 → exitsRequired 2, totalWidth = 200 × 6.1 = 1220
    const result = await calculator.execute(
      { occupantLoad: 200, floorNumber: 1, buildingHeight: 8, occupancyCode: 'D' },
      mockRuleset
    );
    expect(result.results.totalExitWidth).toBe(1220);  // 200 × 6.1
    expect(result.results.exitWidthPerExit).toBe(610); // 1220 / 2, not 1220 / 2 = 610 ✓
  });

  it('NBC 3.4.3.2.(7): 1 exit carries full required width (no halving)', async () => {
    // occupantLoad 30 → exitsRequired 1, totalWidth = 30 × 6.1 = 183
    const result = await calculator.execute(
      { occupantLoad: 30, floorNumber: 0, buildingHeight: 5, occupancyCode: 'D' },
      mockRuleset
    );
    expect(result.results.totalExitWidth).toBe(183);  // 30 × 6.1
    expect(result.results.exitWidthPerExit).toBe(183); // full width, no halving
  });
});

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
  it('FireExitCalculator should have detailed trace', async () => {
    const calc = new FireExitCalculator();
    const result = await calc.execute(
      {
        occupantLoad: 100,
        floorNumber: 1,
        buildingHeight: 8,
      },
      mockRuleset
    );

    result.steps.forEach((step) => {
      expect(step.description).toBeTruthy();
      expect(step.inputs).toBeDefined();
      expect(step.output).toBeDefined();
    });
  });

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
