/**
 * Fire-Resistance Rating Calculator - Server-Side Implementation
 * 
 * Calculates required fire-resistance ratings based on NBC 2020 Table 3.1.8.1
 * Provides step-by-step trace for legal defensibility
 */

import { BaseCalculator, CalculatorStep, CalculatorExecutionResult } from '../baseCalculator';

/**
 * Fire-Resistance Rating Calculator
 */
export class FireResistanceRatingCalculator extends BaseCalculator {
  get calculatorType(): string {
    return 'fireResistanceRating';
  }

  get displayName(): string {
    return 'Fire-Resistance Rating Calculator';
  }

  get description(): string {
    return 'Calculates required fire-resistance ratings based on NBC 2020 Table 3.1.8.1';
  }

  /**
   * NBC 2020 Table 3.1.8.1 - Fire-Resistance Ratings
   * Maps occupancy + construction type + area to required FRR
   */
  private readonly frrTable: Record<string, Record<string, Record<string, number>>> = {
    'A': { // Assembly
      'Non-Combustible': { '1': 1.0, '2': 1.0, '3': 1.5, '4': 2.0 },
      'Combustible': { '1': 1.0, '2': 1.5, '3': 2.0, '4': 2.0 },
    },
    'B': { // Institutional
      'Non-Combustible': { '1': 1.0, '2': 1.0, '3': 1.5, '4': 2.0 },
      'Combustible': { '1': 1.0, '2': 1.5, '3': 2.0, '4': 2.0 },
    },
    'C': { // Residential
      'Non-Combustible': { '1': 0.75, '2': 1.0, '3': 1.0, '4': 1.5 },
      'Combustible': { '1': 1.0, '2': 1.0, '3': 1.5, '4': 2.0 },
    },
    'D': { // Office and Business
      'Non-Combustible': { '1': 0.5, '2': 0.75, '3': 1.0, '4': 1.5 },
      'Combustible': { '1': 0.75, '2': 1.0, '3': 1.5, '4': 2.0 },
    },
    'E': { // Educational
      'Non-Combustible': { '1': 1.0, '2': 1.0, '3': 1.5, '4': 2.0 },
      'Combustible': { '1': 1.0, '2': 1.5, '3': 2.0, '4': 2.0 },
    },
    'F-1': { // Factory/Industrial - Low Hazard
      'Non-Combustible': { '1': 0.5, '2': 0.75, '3': 1.0, '4': 1.5 },
      'Combustible': { '1': 0.75, '2': 1.0, '3': 1.5, '4': 2.0 },
    },
    'F-2': { // Factory/Industrial - Medium Hazard
      'Non-Combustible': { '1': 1.0, '2': 1.0, '3': 1.5, '4': 2.0 },
      'Combustible': { '1': 1.0, '2': 1.5, '3': 2.0, '4': 2.0 },
    },
    'F-3': { // Factory/Industrial - High Hazard
      'Non-Combustible': { '1': 1.5, '2': 2.0, '3': 2.0, '4': 2.0 },
      'Combustible': { '1': 2.0, '2': 2.0, '3': 2.0, '4': 2.0 },
    },
  };

  /**
   * Building elements that require FRR
   */
  private readonly buildingElements = [
    { element: 'Structural members', code: 'NBC 3.1.8.1' },
    { element: 'Fire separations', code: 'NBC 3.2.3' },
    { element: 'Exterior walls', code: 'NBC 3.1.8.1' },
    { element: 'Floor/ceiling assemblies', code: 'NBC 3.1.8.1' },
  ];

  async execute(
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<CalculatorExecutionResult> {
    const steps: CalculatorStep[] = [];

    // Validate inputs
    this.validateInputs(inputs);

    const occupancy = inputs.occupancy || 'D';
    const area_m2 = inputs.area_m2 || 5000;
    const storeys = inputs.storeys || 1;
    const constructionType = inputs.construction_type || 'Non-Combustible';
    const sprinklers = inputs.sprinklers || false;

    // Step 1: Validate occupancy
    steps.push(
      this.createStep(
        'Validate occupancy classification',
        { occupancy },
        occupancy,
        `Occupancy: ${occupancy}`
      )
    );

    // Step 2: Determine storey category
    const storeyCategory = this.getStoreyCategory(storeys);
    steps.push(
      this.createStep(
        'Determine storey category',
        { storeys },
        storeyCategory,
        `${storeys} storey(s) = Category ${storeyCategory}`
      )
    );

    // Step 3: Look up base FRR from table
    const baseFRR = this.getBaseFRR(occupancy, constructionType, storeyCategory);
    steps.push(
      this.createStep(
        'Look up base FRR from NBC Table 3.1.8.1',
        { occupancy, constructionType, storeyCategory },
        baseFRR,
        `Occupancy: ${occupancy}, Construction: ${constructionType}, Storeys: ${storeyCategory} = ${baseFRR} hours`
      )
    );

    // Step 4: Apply sprinkler reduction
    let finalFRR = baseFRR;
    if (sprinklers) {
      const reduction = baseFRR * 0.25; // Sprinklers reduce by 25%
      finalFRR = Math.max(0.5, baseFRR - reduction); // Minimum 0.5 hours
      steps.push(
        this.createStep(
          'Apply sprinkler reduction (NBC 3.1.8.1)',
          { baseFRR, sprinklers },
          finalFRR,
          `${baseFRR} hours - 25% reduction = ${finalFRR} hours (minimum 0.5)`
        )
      );
    } else {
      steps.push(
        this.createStep(
          'Sprinkler reduction',
          { sprinklers },
          finalFRR,
          'No sprinklers - no reduction applied'
        )
      );
    }

    // Step 5: Calculate FRR for each building element
    const buildingElementResults = this.buildingElements.map((element) => ({
      buildingElement: element.element,
      requirement: finalFRR,
      nbcReference: element.code,
    }));

    steps.push(
      this.createStep(
        'Apply FRR to all building elements',
        { finalFRR, elementCount: buildingElementResults.length },
        buildingElementResults,
        `All elements require ${finalFRR} hours fire-resistance rating`
      )
    );

    // Compile results
    const results = {
      finalFRR,
      occupancy,
      constructionType,
      storeys,
      sprinklers,
      buildingElements: buildingElementResults,
      nbcReferences: ['NBC Table 3.1.8.1', 'NBC Section 3.1.8', 'NBC Section 3.2.3'],
    };

    this.validateResults(results);

    return { results, steps };
  }

  /**
   * Get storey category (1, 2, 3, or 4+)
   */
  private getStoreyCategory(storeys: number): string {
    if (storeys === 1) return '1';
    if (storeys === 2) return '2';
    if (storeys === 3) return '3';
    return '4'; // 4 or more
  }

  /**
   * Get base FRR from table
   */
  private getBaseFRR(
    occupancy: string,
    constructionType: string,
    storeyCategory: string
  ): number {
    const occupancyTable = this.frrTable[occupancy];
    if (!occupancyTable) {
      throw new Error(`Unknown occupancy: ${occupancy}`);
    }

    const constructionTable = occupancyTable[constructionType];
    if (!constructionTable) {
      throw new Error(`Unknown construction type: ${constructionType}`);
    }

    const frr = constructionTable[storeyCategory];
    if (frr === undefined) {
      throw new Error(`Invalid storey category: ${storeyCategory}`);
    }

    return frr;
  }


}
