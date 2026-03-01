/**
 * Electrical Service Load Calculator - Server-Side Implementation
 * 
 * Calculates electrical service load requirements based on NBC 2023 Part 2
 * Provides step-by-step trace for legal defensibility
 */

import { BaseCalculator, CalculatorStep, CalculatorExecutionResult } from '../baseCalculator';

/**
 * Electrical Service Load Calculator
 */
export class ElectricalServiceLoadCalculator extends BaseCalculator {
  get calculatorType(): string {
    return 'electricalServiceLoad';
  }

  get displayName(): string {
    return 'Electrical Service Load Calculator';
  }

  get description(): string {
    return 'Calculates electrical service load requirements based on NBC 2023 Part 2';
  }

  async execute(
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<CalculatorExecutionResult> {
    const steps: CalculatorStep[] = [];

    // Step 1: Extract and validate inputs
    const buildingType = this.requireInput(inputs, 'buildingType', 'string');
    const floorArea = this.requireInput(inputs, 'floorArea', 'number');
    const numberOfUnits = this.optionalInput(inputs, 'numberOfUnits', 1);
    const hasElectricHeating = this.optionalInput(inputs, 'hasElectricHeating', false);
    const hasAirConditioning = this.optionalInput(inputs, 'hasAirConditioning', false);

    this.validatePositive(floorArea, 'Floor Area');
    this.validatePositive(numberOfUnits, 'Number of Units');

    steps.push(
      this.createStep(
        'Extract and validate inputs',
        {
          buildingType,
          floorArea,
          numberOfUnits,
          hasElectricHeating,
          hasAirConditioning,
        },
        { valid: true },
        'Validate building parameters'
      )
    );

    // Step 2: Calculate base load
    const baseLoadPerSquareMeter = this.getBaseLoadFactor(buildingType);
    const baseLoad = this.round(floorArea * baseLoadPerSquareMeter, 2);

    steps.push(
      this.createStep(
        'Calculate base electrical load',
        { floorArea, baseLoadPerSquareMeter },
        { baseLoad },
        `Base Load = ${floorArea}m² × ${baseLoadPerSquareMeter} W/m² = ${baseLoad}W`
      )
    );

    // Step 3: Apply demand factor
    const demandFactor = this.getDemandFactor(buildingType, numberOfUnits);
    const demandLoad = this.round(baseLoad * demandFactor, 2);

    steps.push(
      this.createStep(
        'Apply demand factor',
        { baseLoad, demandFactor },
        { demandLoad },
        `Demand Load = ${baseLoad}W × ${demandFactor} = ${demandLoad}W (NBC 2.3.1.1)`
      )
    );

    // Step 4: Add heating load if applicable
    let heatingLoad = 0;
    if (hasElectricHeating) {
      heatingLoad = this.calculateHeatingLoad(floorArea);

      steps.push(
        this.createStep(
          'Calculate electric heating load',
          { floorArea },
          { heatingLoad },
          `Heating Load = ${floorArea}m² × 50 W/m² = ${heatingLoad}W (NBC 2.3.1.2)`
        )
      );
    }

    // Step 5: Add air conditioning load if applicable
    let acLoad = 0;
    if (hasAirConditioning) {
      acLoad = this.calculateACLoad(floorArea);

      steps.push(
        this.createStep(
          'Calculate air conditioning load',
          { floorArea },
          { acLoad },
          `AC Load = ${floorArea}m² × 25 W/m² = ${acLoad}W (NBC 2.3.1.3)`
        )
      );
    }

    // Step 6: Calculate total load
    const totalLoad = demandLoad + heatingLoad + acLoad;

    steps.push(
      this.createStep(
        'Calculate total electrical load',
        { demandLoad, heatingLoad, acLoad },
        { totalLoad },
        `Total Load = ${demandLoad}W + ${heatingLoad}W + ${acLoad}W = ${totalLoad}W`
      )
    );

    // Step 7: Determine service size
    const serviceSize = this.getRequiredServiceSize(totalLoad);

    steps.push(
      this.createStep(
        'Determine required service size',
        { totalLoad },
        { serviceSize },
        `${totalLoad}W requires ${serviceSize}A service (NBC 2.3.2)`
      )
    );

    // Step 8: Calculate wire gauge
    const wireGauge = this.getRequiredWireGauge(serviceSize);

    steps.push(
      this.createStep(
        'Determine required wire gauge',
        { serviceSize },
        { wireGauge },
        `${serviceSize}A service requires ${wireGauge} copper wire (NBC 2.4.1)`
      )
    );

    // Create result
    const results = this.createResult({
      buildingType,
      floorArea,
      numberOfUnits,
      baseLoad,
      demandLoad,
      heatingLoad,
      acLoad,
      totalLoad,
      serviceSize,
      wireGauge,
      summary: `${totalLoad}W total load: ${serviceSize}A service with ${wireGauge} wire`,
      nbcReferences: ['NBC 2.3.1', 'NBC 2.3.2', 'NBC 2.4.1'],
    });

    return { results, steps };
  }

  /**
   * Get base load factor for building type
   */
  private getBaseLoadFactor(buildingType: string): number {
    // NBC 2.3.1.1 - Base load factors (W/m²)
    switch (buildingType.toLowerCase()) {
      case 'residential':
        return 25; // 25 W/m²
      case 'office':
        return 50; // 50 W/m²
      case 'retail':
        return 100; // 100 W/m²
      case 'industrial':
        return 150; // 150 W/m²
      case 'warehouse':
        return 10; // 10 W/m²
      default:
        return 50; // Default 50 W/m²
    }
  }

  /**
   * Get demand factor based on building type and units
   */
  private getDemandFactor(buildingType: string, numberOfUnits: number): number {
    // NBC 2.3.1.1 - Demand factors
    if (buildingType.toLowerCase() === 'residential') {
      if (numberOfUnits === 1) return 1.0; // Single unit: 100%
      if (numberOfUnits <= 3) return 0.9; // 2-3 units: 90%
      if (numberOfUnits <= 5) return 0.8; // 4-5 units: 80%
      return 0.7; // 6+ units: 70%
    }
    return 0.8; // Default 80% for other types
  }

  /**
   * Calculate electric heating load
   */
  private calculateHeatingLoad(floorArea: number): number {
    // NBC 2.3.1.2 - Heating load: 50 W/m²
    return this.round(floorArea * 50, 2);
  }

  /**
   * Calculate air conditioning load
   */
  private calculateACLoad(floorArea: number): number {
    // NBC 2.3.1.3 - AC load: 25 W/m²
    return this.round(floorArea * 25, 2);
  }

  /**
   * Get required service size in amperes
   */
  private getRequiredServiceSize(totalLoad: number): number {
    // Convert watts to amperes at 240V
    const amperes = totalLoad / 240;

    // Round up to standard service sizes
    if (amperes <= 60) return 60;
    if (amperes <= 100) return 100;
    if (amperes <= 150) return 150;
    if (amperes <= 200) return 200;
    return 400;
  }

  /**
   * Get required wire gauge for service size
   */
  private getRequiredWireGauge(serviceSize: number): string {
    // NBC 2.4.1 - Wire gauges for service sizes
    switch (serviceSize) {
      case 60:
        return '#6 AWG';
      case 100:
        return '#4 AWG';
      case 150:
        return '#2 AWG';
      case 200:
        return '4/0 AWG';
      case 400:
        return '250 kcmil';
      default:
        return '#4 AWG';
    }
  }
}

/**
 * Export calculator instance
 */
export const electricalServiceLoadCalculator = new ElectricalServiceLoadCalculator();
