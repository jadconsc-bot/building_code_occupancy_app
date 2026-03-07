/**
 * Occupant Load Calculator - Server-Side Implementation
 * 
 * Calculates occupant load based on NBC 2023 Table 4.1.5.3
 * Provides step-by-step trace for legal defensibility
 */

import { BaseCalculator, CalculatorStep, CalculatorExecutionResult } from '../baseCalculator';

/**
 * Occupancy type definition
 */
interface OccupancyType {
  code: string;
  name: string;
  loadFactor: number; // persons per square meter
}

/**
 * Occupant Load Calculator
 */
export class OccupantLoadCalculator extends BaseCalculator {
  get calculatorType(): string {
    return 'occupantLoad';
  }

  get displayName(): string {
    return 'Occupant Load Calculator';
  }

  get description(): string {
    return 'Calculates occupant load based on NBC 2023 Table 4.1.5.3 load factors';
  }

  /**
   * NBC 2023 Table 4.1.5.3 - Occupant Load Factors
   */
  private readonly occupancyTypes: Record<string, OccupancyType> = {
    'A-1': {
      code: 'A-1',
      name: 'Assembly - Performing Arts',
      loadFactor: 0.06, // 1 person per 16.7 m²
    },
    'A-2': {
      code: 'A-2',
      name: 'Assembly - General',
      loadFactor: 0.05, // 1 person per 20 m²
    },
    'A-3': {
      code: 'A-3',
      name: 'Assembly - Arena Type',
      loadFactor: 0.08, // 1 person per 12.5 m²
    },
    'A-4': {
      code: 'A-4',
      name: 'Assembly - Open Air',
      loadFactor: 0.05, // 1 person per 20 m²
    },
    'B': {
      code: 'B',
      name: 'Institutional',
      loadFactor: 0.1, // 1 person per 10 m²
    },
    'C': {
      code: 'C',
      name: 'Residential',
      loadFactor: 0.2, // 1 person per 5 m²
    },
    'D': {
      code: 'D',
      name: 'Office and Business',
      loadFactor: 0.1, // 1 person per 10 m²
    },
    'E': {
      code: 'E',
      name: 'Educational',
      loadFactor: 0.1, // 1 person per 10 m²
    },
    'F-1': {
      code: 'F-1',
      name: 'Factory/Industrial - Low Hazard',
      loadFactor: 0.05, // 1 person per 20 m²
    },
    'F-2': {
      code: 'F-2',
      name: 'Factory/Industrial - Medium Hazard',
      loadFactor: 0.05, // 1 person per 20 m²
    },
    'F-3': {
      code: 'F-3',
      name: 'Factory/Industrial - High Hazard',
      loadFactor: 0.05, // 1 person per 20 m²
    },
  };

  async execute(
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<CalculatorExecutionResult> {
    const steps: CalculatorStep[] = [];

    // Step 1: Validate and extract inputs
    const occupancyCode = this.requireInput(inputs, 'occupancyCode', 'string');
    const floorAreaSquareMeters = this.requireInput(inputs, 'floorArea', 'number');
    const adjustmentFactor = this.optionalInput(inputs, 'adjustmentFactor', 1.0);

    this.validatePositive(floorAreaSquareMeters, 'Floor Area');
    this.validateRange(adjustmentFactor, 0.5, 2.0, 'Adjustment Factor');

    steps.push(
      this.createStep(
        'Extract and validate inputs',
        {
          occupancyCode,
          floorAreaSquareMeters,
          adjustmentFactor,
        },
        { valid: true },
        'Validate occupancy code and floor area against constraints'
      )
    );

    // Step 2: Look up occupancy type
    const occupancy = this.occupancyTypes[occupancyCode];
    if (!occupancy) {
      throw new Error(
        `Invalid occupancy code: ${occupancyCode}. Valid codes: ${Object.keys(this.occupancyTypes).join(', ')}`
      );
    }

    steps.push(
      this.createStep(
        'Look up occupancy type',
        { occupancyCode },
        {
          occupancyName: occupancy.name,
          loadFactor: occupancy.loadFactor,
        },
        `Occupancy ${occupancyCode} has load factor of ${occupancy.loadFactor} persons/m²`
      )
    );

    // Step 3: Calculate base occupant load
    const baseOccupantLoad = this.round(floorAreaSquareMeters * occupancy.loadFactor, 0);

    steps.push(
      this.createStep(
        'Calculate base occupant load',
        {
          floorAreaSquareMeters,
          loadFactor: occupancy.loadFactor,
        },
        { baseOccupantLoad },
        `Base Load = ${floorAreaSquareMeters} m² × ${occupancy.loadFactor} persons/m² = ${baseOccupantLoad} persons`
      )
    );

    // Step 4: Apply adjustment factor (if provided)
    const adjustedOccupantLoad = this.round(baseOccupantLoad * adjustmentFactor, 0);

    steps.push(
      this.createStep(
        'Apply adjustment factor',
        {
          baseOccupantLoad,
          adjustmentFactor,
        },
        { adjustedOccupantLoad },
        `Adjusted Load = ${baseOccupantLoad} × ${adjustmentFactor} = ${adjustedOccupantLoad} persons`
      )
    );

    // Step 5: Determine exit requirements
    const exitsRequired = this.calculateExitsRequired(adjustedOccupantLoad);

    steps.push(
      this.createStep(
        'Determine exit requirements',
        { occupantLoad: adjustedOccupantLoad },
        { exitsRequired },
        `Occupant load of ${adjustedOccupantLoad} requires ${exitsRequired} exits (NBC 3.4.1)`
      )
    );

    // Step 6: Calculate exit width requirements
    const exitWidthRequired = this.calculateExitWidth(adjustedOccupantLoad, occupancyCode);

    steps.push(
      this.createStep(
        'Calculate exit width requirements',
        {
          occupantLoad: adjustedOccupantLoad,
          occupancyCode,
        },
        { exitWidthRequired },
        `Total exit width required: ${exitWidthRequired} mm (${(exitWidthRequired / 25.4).toFixed(1)} inches)`
      )
    );

    // Create result
    const results = this.createResult({
      occupancyCode,
      occupancyName: occupancy.name,
      floorAreaSquareMeters,
      loadFactor: occupancy.loadFactor,
      baseOccupantLoad,
      adjustmentFactor,
      adjustedOccupantLoad,
      exitsRequired,
      exitWidthRequired,
      summary: `${occupancyCode} (${occupancy.name}): ${adjustedOccupantLoad} occupants, ${exitsRequired} exits, ${exitWidthRequired}mm exit width`,
      nbcReferences: ['NBC 4.1.5.3', 'NBC 3.4.1'],
    });

    return { results, steps };
  }

  /**
   * Calculate number of exits required based on occupant load
   * NBC 3.4.1.1
   */
  private calculateExitsRequired(occupantLoad: number): number {
    if (occupantLoad <= 50) return 1;
    if (occupantLoad <= 500) return 2;
    if (occupantLoad <= 1000) return 3;
    return 4;
  }

  /**
   * Calculate exit width required based on occupant load
   * NBC 3.4.1.5 - 5.3 mm per person minimum
   */
  private calculateExitWidth(occupantLoad: number, occupancyCode: string): number {
    // Base requirement: 5.3 mm per person
    let widthPerPerson = 5.3;

    // Adjust based on occupancy type
    if (occupancyCode.startsWith('A')) {
      // Assembly occupancies require more exit width
      widthPerPerson = 7.5;
    }

    const totalWidth = occupantLoad * widthPerPerson;

    // Minimum exit width is 900 mm (3 ft)
    return Math.max(900, Math.ceil(totalWidth));
  }
}

/**
 * Export calculator instance
 */
export const occupantLoadCalculator = new OccupantLoadCalculator();
