/**
 * Base Calculator Abstract Class
 * 
 * All building code calculators inherit from this class to ensure:
 * - Consistent calculation methodology
 * - Deterministic results (same inputs = same outputs)
 * - Complete step-by-step traces for reproducibility
 * - Validation and error handling
 * - Legal defensibility
 */

/**
 * A single step in a calculation with full details
 */
export interface CalculatorStep {
  description: string;
  formula?: string;
  inputs: Record<string, any>;
  output: any;
}

/**
 * Result of a calculator execution
 */
export interface CalculatorExecutionResult {
  results: Record<string, any>;
  steps: CalculatorStep[];
}

/**
 * Abstract base class for all calculators
 */
export abstract class BaseCalculator {
  /**
   * Unique identifier for this calculator type
   * Must be overridden in subclass
   */
  abstract get calculatorType(): string;

  /**
   * Human-readable name for this calculator
   */
  abstract get displayName(): string;

  /**
   * Description of what this calculator does
   */
  abstract get description(): string;

  /**
   * Execute the calculation with step-by-step trace
   * Must be implemented by subclass
   */
  abstract execute(
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<CalculatorExecutionResult>;

  /**
   * Validate inputs before calculation
   * Override in subclass for type-specific validation
   */
  protected validateInputs(inputs: Record<string, any>): void {
    if (!inputs || typeof inputs !== 'object') {
      throw new Error('Inputs must be an object');
    }
  }

  /**
   * Validate results after calculation
   * Override in subclass for type-specific validation
   */
  protected validateResults(results: Record<string, any>): void {
    if (!results || typeof results !== 'object') {
      throw new Error('Results must be an object');
    }
  }

  /**
   * Helper: Create a calculation step
   */
  protected createStep(
    description: string,
    inputs: Record<string, any>,
    output: any,
    formula?: string
  ): CalculatorStep {
    return {
      description,
      formula,
      inputs,
      output,
    };
  }

  /**
   * Helper: Validate required input field
   */
  protected requireInput(inputs: Record<string, any>, field: string, type?: string): any {
    if (!(field in inputs)) {
      throw new Error(`Required input field missing: ${field}`);
    }

    const value = inputs[field];

    if (type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Input ${field} must be a valid number`);
      }
      return value;
    }

    if (type === 'string') {
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Input ${field} must be a non-empty string`);
      }
      return value;
    }

    if (type === 'boolean') {
      if (typeof value !== 'boolean') {
        throw new Error(`Input ${field} must be a boolean`);
      }
      return value;
    }

    if (type === 'array') {
      if (!Array.isArray(value)) {
        throw new Error(`Input ${field} must be an array`);
      }
      return value;
    }

    return value;
  }

  /**
   * Helper: Validate optional input field
   */
  protected optionalInput(inputs: Record<string, any>, field: string, defaultValue?: any): any {
    if (!(field in inputs)) {
      return defaultValue;
    }
    return inputs[field];
  }

  /**
   * Helper: Validate numeric range
   */
  protected validateRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new Error(
        `${fieldName} must be between ${min} and ${max}, got ${value}`
      );
    }
  }

  /**
   * Helper: Validate that value is positive
   */
  protected validatePositive(value: number, fieldName: string): void {
    if (value <= 0) {
      throw new Error(`${fieldName} must be positive, got ${value}`);
    }
  }

  /**
   * Helper: Validate that value is non-negative
   */
  protected validateNonNegative(value: number, fieldName: string): void {
    if (value < 0) {
      throw new Error(`${fieldName} must be non-negative, got ${value}`);
    }
  }

  /**
   * Helper: Round to specific decimal places
   */
  protected round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Helper: Format result with units
   */
  protected formatResult(value: number, unit: string, decimals: number = 2): string {
    return `${this.round(value, decimals)} ${unit}`;
  }

  /**
   * Helper: Look up value from ruleset
   */
  protected getRulesetValue(
    ruleset: any,
    path: string,
    defaultValue?: any
  ): any {
    const keys = path.split('.');
    let current = ruleset;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new Error(`Ruleset value not found: ${path}`);
      }
    }

    return current;
  }

  /**
   * Helper: Create result object
   */
  protected createResult(data: Record<string, any>): Record<string, any> {
    return {
      ...data,
      calculatorType: this.calculatorType,
      displayName: this.displayName,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper: Verify ruleset has required sections
   */
  protected validateRuleset(ruleset: any, requiredSections: string[]): void {
    for (const section of requiredSections) {
      if (!(section in ruleset)) {
        throw new Error(`Ruleset missing required section: ${section}`);
      }
    }
  }

  /**
   * Execute with error handling and validation
   */
  async executeWithValidation(
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<CalculatorExecutionResult> {
    // Validate inputs
    this.validateInputs(inputs);

    // Execute calculation
    const result = await this.execute(inputs, ruleset);

    // Validate results
    this.validateResults(result.results);

    // Ensure we have steps
    if (!Array.isArray(result.steps) || result.steps.length === 0) {
      throw new Error('Calculation must produce at least one step');
    }

    return result;
  }
}

/**
 * Example: Stair Design Calculator (will be fully implemented in Phase 4)
 */
export class StairDesignCalculator extends BaseCalculator {
  get calculatorType(): string {
    return 'stairDesign';
  }

  get displayName(): string {
    return 'Stair Design Calculator';
  }

  get description(): string {
    return 'Calculates stair dimensions and compliance with building codes';
  }

  async execute(
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<CalculatorExecutionResult> {
    const steps: CalculatorStep[] = [];

    // Step 1: Extract and validate inputs
    const floorHeightInches = this.requireInput(inputs, 'floorHeight', 'number');
    const maxRiserHeight = this.getRulesetValue(ruleset, 'stairs.maxRiserHeight', 7.75);
    const minTreadDepth = this.getRulesetValue(ruleset, 'stairs.minTreadDepth', 10);

    this.validatePositive(floorHeightInches, 'Floor Height');
    this.validateRange(maxRiserHeight, 7, 8, 'Max Riser Height');

    steps.push(
      this.createStep(
        'Extract and validate inputs',
        { floorHeightInches, maxRiserHeight, minTreadDepth },
        { valid: true },
        'Validate all inputs against ruleset constraints'
      )
    );

    // Step 2: Calculate number of risers
    const numRisers = Math.ceil(floorHeightInches / maxRiserHeight);
    const actualRiserHeight = this.round(floorHeightInches / numRisers, 2);

    steps.push(
      this.createStep(
        'Calculate number of risers',
        { floorHeightInches, maxRiserHeight },
        { numRisers, actualRiserHeight },
        `numRisers = ceil(${floorHeightInches} / ${maxRiserHeight}) = ${numRisers}`
      )
    );

    // Step 3: Validate riser height
    if (actualRiserHeight > maxRiserHeight) {
      throw new Error(
        `Calculated riser height (${actualRiserHeight}") exceeds maximum (${maxRiserHeight}")`
      );
    }

    steps.push(
      this.createStep(
        'Validate riser height',
        { actualRiserHeight, maxRiserHeight },
        { compliant: actualRiserHeight <= maxRiserHeight },
        `${actualRiserHeight} <= ${maxRiserHeight}`
      )
    );

    // Step 4: Calculate number of treads
    const numTreads = numRisers - 1;

    steps.push(
      this.createStep(
        'Calculate number of treads',
        { numRisers },
        { numTreads },
        `numTreads = numRisers - 1 = ${numTreads}`
      )
    );

    // Step 5: Calculate total run
    const totalRun = this.round(numTreads * minTreadDepth, 2);

    steps.push(
      this.createStep(
        'Calculate total run',
        { numTreads, minTreadDepth },
        { totalRun },
        `totalRun = ${numTreads} * ${minTreadDepth} = ${totalRun}"`
      )
    );

    // Create result
    const results = this.createResult({
      numRisers,
      numTreads,
      actualRiserHeight,
      totalRun,
      compliant: actualRiserHeight <= maxRiserHeight,
      summary: `${numRisers} risers of ${actualRiserHeight}" with ${numTreads} treads of ${minTreadDepth}" depth`,
    });

    return { results, steps };
  }
}

// Export all calculator implementations
export const calculators: Record<string, typeof BaseCalculator> = {
  stairDesign: StairDesignCalculator,
  // More calculators will be added as they're migrated to server-side
};
