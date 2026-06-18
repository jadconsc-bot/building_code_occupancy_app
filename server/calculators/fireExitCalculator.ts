/**
 * Fire Exit Calculator - Server-Side Implementation
 * 
 * Calculates fire exit requirements based on NBC 2023 Part 3.4
 * Provides step-by-step trace for legal defensibility
 */

import { BaseCalculator, CalculatorStep, CalculatorExecutionResult } from '../baseCalculator';

/**
 * Fire Exit Calculator
 */
export class FireExitCalculator extends BaseCalculator {
  get calculatorType(): string {
    return 'fireExit';
  }

  get displayName(): string {
    return 'Fire Exit Calculator';
  }

  get description(): string {
    return 'Calculates fire exit requirements based on NBC 2023 Part 3.4';
  }

  async execute(
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<CalculatorExecutionResult> {
    const steps: CalculatorStep[] = [];

    // Step 1: Extract and validate inputs
    const occupantLoad = this.requireInput(inputs, 'occupantLoad', 'number');
    const floorNumber = this.requireInput(inputs, 'floorNumber', 'number');
    const buildingHeight = this.requireInput(inputs, 'buildingHeight', 'number');
    const occupancyCode = this.optionalInput(inputs, 'occupancyCode', 'D');

    this.validatePositive(occupantLoad, 'Occupant Load');
    this.validateNonNegative(floorNumber, 'Floor Number');
    this.validatePositive(buildingHeight, 'Building Height');

    steps.push(
      this.createStep(
        'Extract and validate inputs',
        {
          occupantLoad,
          floorNumber,
          buildingHeight,
          occupancyCode,
        },
        { valid: true },
        'Validate all inputs against NBC constraints'
      )
    );

    // Step 2: Determine number of exits required
    const exitsRequired = this.calculateExitsRequired(occupantLoad, floorNumber);

    steps.push(
      this.createStep(
        'Determine number of exits required',
        { occupantLoad, floorNumber },
        { exitsRequired },
        `Occupant load ${occupantLoad} on floor ${floorNumber} requires ${exitsRequired} exits (NBC 3.4.1.1)`
      )
    );

    // Step 3: Calculate exit width required
    const exitWidthPerPerson = this.getExitWidthFactor(occupancyCode);
    const totalExitWidth = this.round(occupantLoad * exitWidthPerPerson, 0);
    // NBC 3.4.3.2.(7): when 2+ exits required, each exit contributes ≤50% of total required
    // width. Minimum per exit = totalExitWidth / 2 (not ÷ numExits). When only 1 exit
    // required (single-exit exception), that exit must carry the full required width.
    const exitWidthPerExit = this.round(
      exitsRequired >= 2 ? totalExitWidth / 2 : totalExitWidth,
      0
    );

    steps.push(
      this.createStep(
        'Calculate exit width required',
        {
          occupantLoad,
          exitWidthPerPerson,
          exitsRequired,
        },
        { totalExitWidth, exitWidthPerExit },
        `Total width = ${occupantLoad} × ${exitWidthPerPerson} mm/person = ${totalExitWidth}mm (NBC 3.4.3.2.(1)). Min per exit = ${totalExitWidth} ÷ 2 = ${exitWidthPerExit}mm (NBC 3.4.3.2.(7) half-width cap)`
      )
    );

    // Step 4: Determine exit travel distance limits
    const maxTravelDistance = this.getMaxTravelDistance(occupancyCode);

    steps.push(
      this.createStep(
        'Determine exit travel distance limits',
        { occupancyCode },
        { maxTravelDistance },
        `Occupancy ${occupancyCode} allows maximum ${maxTravelDistance}m travel distance to exit (NBC 3.4.2.4)`
      )
    );

    // Step 5: Check for dead-end corridors
    const maxDeadEndLength = this.getMaxDeadEndLength(occupancyCode);

    steps.push(
      this.createStep(
        'Check dead-end corridor limits',
        { occupancyCode },
        { maxDeadEndLength },
        `Maximum dead-end corridor length: ${maxDeadEndLength}m (NBC 3.4.2.5)`
      )
    );

    // Step 6: Determine stairwell requirements
    const stairwellsRequired = this.calculateStairwellsRequired(
      buildingHeight,
      occupancyCode
    );

    steps.push(
      this.createStep(
        'Determine stairwell requirements',
        { buildingHeight, occupancyCode },
        { stairwellsRequired },
        `Building height ${buildingHeight}m in ${occupancyCode} occupancy requires ${stairwellsRequired} stairwells (NBC 3.4.3)`
      )
    );

    // Step 7: Calculate stairwell width
    const stairwellWidth = this.calculateStairwellWidth(occupantLoad, stairwellsRequired);

    steps.push(
      this.createStep(
        'Calculate stairwell width',
        { occupantLoad, stairwellsRequired },
        { stairwellWidth },
        `Stairwell width = ${occupantLoad} persons ÷ ${stairwellsRequired} stairwells = ${stairwellWidth}mm per stairwell`
      )
    );

    // Create result
    const results = this.createResult({
      occupantLoad,
      floorNumber,
      buildingHeight,
      occupancyCode,
      exitsRequired,
      totalExitWidth,
      exitWidthPerExit,
      maxTravelDistance,
      maxDeadEndLength,
      stairwellsRequired,
      stairwellWidth,
      summary: `${exitsRequired} exits (${exitWidthPerExit}mm each), ${stairwellsRequired} stairwells (${stairwellWidth}mm each), max travel ${maxTravelDistance}m`,
      nbcReferences: ['NBC 3.4.1', 'NBC 3.4.2', 'NBC 3.4.3'],
    });

    return { results, steps };
  }

  /**
   * Calculate number of exits required
   */
  private calculateExitsRequired(occupantLoad: number, floorNumber: number): number {
    // NBC 3.4.1.1 - Minimum number of exits based on occupant load
    if (occupantLoad <= 50) return 1;
    if (occupantLoad <= 500) return 2;
    if (occupantLoad <= 1000) return 3;
    return 4;
  }

  /**
   * Get exit width factor based on occupancy
   * NBC 3.4.3.2.(1): Group B (care/treatment/detention) uses 18.4 mm/person.
   * All others default to the doorway/corridor rate of 6.1 mm/person.
   * Stair-specific rates (8 mm standard stairs, 9.2 mm steeper) require exit-facility-type
   * data not collected here; 6.1 mm/person is the conservative doorway/corridor default.
   */
  private getExitWidthFactor(occupancyCode: string): number {
    // NBC 3.4.3.2.(1)(b): any exit serving Group B occupancy — 18.4 mm/person
    if (occupancyCode === 'B' || occupancyCode.startsWith('B-')) return 18.4;
    // NBC 3.4.3.2.(1)(a): doorways, corridors, passageways, ramps — 6.1 mm/person (default)
    return 6.1;
  }

  /**
   * Get maximum travel distance to exit
   */
  private getMaxTravelDistance(occupancyCode: string): number {
    // NBC 3.4.2.4 - Maximum travel distance (meters)
    if (occupancyCode.startsWith('A')) return 30; // Assembly
    if (occupancyCode === 'B') return 30; // Institutional
    if (occupancyCode === 'C') return 35; // Residential
    if (occupancyCode === 'D') return 40; // Office
    if (occupancyCode === 'E') return 30; // Educational
    if (occupancyCode.startsWith('F')) return 45; // Factory
    return 40; // Default
  }

  /**
   * Get maximum dead-end corridor length
   */
  private getMaxDeadEndLength(occupancyCode: string): number {
    // NBC 3.4.2.5 - Maximum dead-end corridor (meters)
    if (occupancyCode.startsWith('A')) return 7.5; // Assembly
    if (occupancyCode === 'B') return 7.5; // Institutional
    if (occupancyCode === 'C') return 7.5; // Residential
    if (occupancyCode === 'D') return 7.5; // Office
    if (occupancyCode === 'E') return 7.5; // Educational
    if (occupancyCode.startsWith('F')) return 7.5; // Factory
    return 7.5; // Default
  }

  /**
   * Calculate number of stairwells required
   */
  private calculateStairwellsRequired(buildingHeight: number, occupancyCode: string): number {
    // NBC 3.4.3 - Stairwell requirements based on height
    if (buildingHeight <= 7.5) return 1; // Single stairwell allowed
    if (buildingHeight <= 15) return 2; // Two stairwells required
    return 3; // Three or more stairwells for very tall buildings
  }

  /**
   * Calculate stairwell width
   */
  private calculateStairwellWidth(occupantLoad: number, stairwellsRequired: number): number {
    // 5.3 mm per person minimum
    const totalWidth = occupantLoad * 5.3;
    const widthPerStairwell = Math.ceil(totalWidth / stairwellsRequired);
    return Math.max(900, widthPerStairwell); // Minimum 900mm
  }
}

/**
 * Export calculator instance
 */
export const fireExitCalculator = new FireExitCalculator();
