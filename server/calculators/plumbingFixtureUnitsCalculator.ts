/**
 * Plumbing Fixture Units Calculator - Server-Side Implementation
 * 
 * Calculates drainage fixture units (DFU) based on NBC 2023 Part 7
 * Provides step-by-step trace for legal defensibility
 */

import { BaseCalculator, CalculatorStep, CalculatorExecutionResult } from '../baseCalculator';

/**
 * Fixture definition
 */
interface Fixture {
  name: string;
  dfu: number; // Drainage Fixture Units
}

/**
 * Plumbing Fixture Units Calculator
 */
export class PlumbingFixtureUnitsCalculator extends BaseCalculator {
  get calculatorType(): string {
    return 'plumbingFixtureUnits';
  }

  get displayName(): string {
    return 'Plumbing Fixture Units Calculator';
  }

  get description(): string {
    return 'Calculates drainage fixture units based on NBC 2023 Part 7';
  }

  /**
   * NBC 2023 Part 7 - Fixture Unit Values
   */
  private readonly fixtures: Record<string, Fixture> = {
    toilet: { name: 'Water Closet (Toilet)', dfu: 4 },
    urinal: { name: 'Urinal', dfu: 2 },
    lavatory: { name: 'Lavatory (Sink)', dfu: 1 },
    bathtub: { name: 'Bathtub', dfu: 2 },
    shower: { name: 'Shower Stall', dfu: 2 },
    kitchenSink: { name: 'Kitchen Sink', dfu: 2 },
    laundryTub: { name: 'Laundry Tub', dfu: 2 },
    floorDrain: { name: 'Floor Drain', dfu: 1 },
    bidet: { name: 'Bidet', dfu: 1 },
    dishwasher: { name: 'Dishwasher', dfu: 2 },
  };

  async execute(
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<CalculatorExecutionResult> {
    const steps: CalculatorStep[] = [];

    // Step 1: Extract and validate inputs
    const fixtures = this.requireInput(inputs, 'fixtures', 'object');
    const buildingType = this.optionalInput(inputs, 'buildingType', 'residential');

    if (!fixtures || typeof fixtures !== 'object') {
      throw new Error('Fixtures must be an object with fixture types as keys and quantities as values');
    }

    steps.push(
      this.createStep(
        'Extract and validate inputs',
        { fixtureCount: Object.keys(fixtures).length, buildingType },
        { valid: true },
        'Validate fixture list and building type'
      )
    );

    // Step 2: Calculate total DFU for each fixture type
    let totalDFU = 0;
    const fixtureBreakdown: Record<string, any> = {};

    for (const [fixtureType, quantity] of Object.entries(fixtures)) {
      const fixture = this.fixtures[fixtureType];
      if (!fixture) {
        throw new Error(
          `Unknown fixture type: ${fixtureType}. Valid types: ${Object.keys(this.fixtures).join(', ')}`
        );
      }

      const qty = this.requireInput({ [fixtureType]: quantity }, fixtureType, 'number');
      this.validateNonNegative(qty, `${fixture.name} quantity`);

      const dfuForType = qty * fixture.dfu;
      totalDFU += dfuForType;

      fixtureBreakdown[fixtureType] = {
        name: fixture.name,
        quantity: qty,
        dfuPerUnit: fixture.dfu,
        totalDFU: dfuForType,
      };
    }

    steps.push(
      this.createStep(
        'Calculate DFU for each fixture type',
        fixtures,
        fixtureBreakdown,
        'Sum DFU values: Σ(quantity × DFU per unit)'
      )
    );

    // Step 3: Calculate total DFU
    steps.push(
      this.createStep(
        'Calculate total drainage fixture units',
        fixtureBreakdown,
        { totalDFU },
        `Total DFU = ${Object.values(fixtureBreakdown)
          .map((f: any) => `${f.quantity}×${f.dfuPerUnit}`)
          .join(' + ')} = ${totalDFU}`
      )
    );

    // Step 4: Determine required stack size
    const stackSize = this.getRequiredStackSize(totalDFU);

    steps.push(
      this.createStep(
        'Determine required stack size',
        { totalDFU },
        { stackSize },
        `${totalDFU} DFU requires ${stackSize}mm (${(stackSize / 25.4).toFixed(1)}" ) drainage stack (NBC 7.2.2.2)`
      )
    );

    // Step 5: Determine required trap arm size
    const trapArmSize = this.getRequiredTrapArmSize(totalDFU);

    steps.push(
      this.createStep(
        'Determine required trap arm size',
        { totalDFU },
        { trapArmSize },
        `${totalDFU} DFU requires ${trapArmSize}mm (${(trapArmSize / 25.4).toFixed(1)}" ) trap arm (NBC 7.2.2.3)`
      )
    );

    // Step 6: Check for wet venting requirements
    const wetVentingRequired = this.checkWetVentingRequired(fixtureBreakdown);

    steps.push(
      this.createStep(
        'Check wet venting requirements',
        fixtureBreakdown,
        { wetVentingRequired },
        `Wet venting ${wetVentingRequired ? 'IS' : 'IS NOT'} required (NBC 7.2.3.2)`
      )
    );

    // Create result
    const results = this.createResult({
      totalDFU,
      fixtureBreakdown,
      stackSize,
      trapArmSize,
      wetVentingRequired,
      summary: `${totalDFU} total DFU: ${stackSize}mm stack, ${trapArmSize}mm trap arm${
        wetVentingRequired ? ', wet venting required' : ''
      }`,
      nbcReferences: ['NBC 7.2.2', 'NBC 7.2.3'],
    });

    return { results, steps };
  }

  /**
   * Get required stack size based on DFU
   */
  private getRequiredStackSize(dfu: number): number {
    // NBC 7.2.2.2 - Drainage stack sizing
    if (dfu <= 12) return 38; // 1.5"
    if (dfu <= 20) return 50; // 2"
    if (dfu <= 160) return 75; // 3"
    if (dfu <= 620) return 100; // 4"
    return 125; // 5"
  }

  /**
   * Get required trap arm size based on DFU
   */
  private getRequiredTrapArmSize(dfu: number): number {
    // NBC 7.2.2.3 - Trap arm sizing
    if (dfu <= 12) return 38; // 1.5"
    if (dfu <= 20) return 50; // 2"
    if (dfu <= 160) return 75; // 3"
    if (dfu <= 620) return 100; // 4"
    return 125; // 5"
  }

  /**
   * Check if wet venting is required
   */
  private checkWetVentingRequired(fixtureBreakdown: Record<string, any>): boolean {
    // Wet venting is required when multiple fixtures share a single vent
    // Typically for residential bathrooms with multiple fixtures
    const fixtureCount = Object.keys(fixtureBreakdown).length;
    return fixtureCount > 1;
  }
}

/**
 * Export calculator instance
 */
export const plumbingFixtureUnitsCalculator = new PlumbingFixtureUnitsCalculator();
