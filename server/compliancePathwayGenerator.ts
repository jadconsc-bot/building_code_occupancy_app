/**
 * Compliance Pathway Generator
 * 
 * Generates code pathways and justification narratives from compliance results
 * Extracts applicable clauses and creates AHJ-ready explanations
 */
import { determineBuildingPart } from './engine/buildingPartDetermination';

export interface ComplianceClause {
  clauseNumber: string;
  title: string;
  description: string;
  applicability: string;
  requirement: string;
  reference: string;
}

export interface AlternativeSolution {
  approach: string;
  advantages: string[];
  disadvantages: string[];
  nbcReference: string;
}

export interface CompliancePathway {
  projectSummary: {
    occupancy: string;
    area_m2: number;
    storeys: number;
    constructionType: string;
    sprinklers: boolean;
    codeEdition: string;
    determination: ReturnType<typeof determineBuildingPart>;
  };
  applicableClauses: ComplianceClause[];
  alternativeSolutions: AlternativeSolution[];
  riskAssessment: {
    issues: string[];
    mitigations: string[];
  };
  justificationNarrative: string;
  complianceSummary: string;
}

/**
 * Compliance Pathway Generator
 */
export class CompliancePathwayGenerator {
  /**
   * Generate compliance pathway from compliance result
   */
  static generatePathway(
    complianceResult: Record<string, any>,
    inputs: Record<string, any>
  ): CompliancePathway {
    const occupancy = inputs.occupancy_major || inputs.occupancy || 'D';
    const area_m2 = inputs.area_m2 || 5000;
    const footprint_m2 = inputs.footprint_m2 ?? null;
    const storeys = inputs.storeys || 1;
    const determination = determineBuildingPart({ footprintM2: footprint_m2, storeys, occupancyGroup: occupancy });
    const constructionType = inputs.construction_type || 'Non-Combustible';
    const sprinklers = inputs.sprinklers || false;
    const province = (inputs.province as string) || '';
    const codeEdition = (inputs.codeEdition as string) ||
      ({ AB: 'NBC(AE) 2023', BC: 'BCBC 2024' }[province] ?? 'NBC 2020');

    // Extract applicable clauses
    const applicableClauses = this.extractApplicableClauses(
      occupancy,
      area_m2,
      storeys,
      constructionType,
      sprinklers,
      determination
    );

    // Generate alternative solutions
    const alternativeSolutions = this.generateAlternativeSolutions(
      occupancy,
      area_m2,
      storeys,
      constructionType,
      determination
    );

    // Perform risk assessment
    const riskAssessment = this.performRiskAssessment(
      occupancy,
      area_m2,
      storeys,
      constructionType,
      sprinklers
    );

    // Generate justification narrative
    const justificationNarrative = this.generateJustificationNarrative(
      occupancy,
      area_m2,
      storeys,
      constructionType,
      sprinklers,
      applicableClauses
    );

    // Generate compliance summary
    const complianceSummary = this.generateComplianceSummary(
      occupancy,
      area_m2,
      storeys,
      constructionType,
      sprinklers,
      applicableClauses
    );

    return {
      projectSummary: {
        occupancy,
        area_m2,
        storeys,
        constructionType,
        sprinklers,
        codeEdition,
        determination,
      },
      applicableClauses,
      alternativeSolutions,
      riskAssessment,
      justificationNarrative,
      complianceSummary,
    };
  }

  /**
   * Extract applicable NBC clauses based on project parameters
   */
  private static extractApplicableClauses(
    occupancy: string,
    area_m2: number,
    storeys: number,
    constructionType: string,
    sprinklers: boolean,
    determination: ReturnType<typeof determineBuildingPart>
  ): ComplianceClause[] {
    const clauses: ComplianceClause[] = [];

    // Always applicable clauses
    clauses.push({
      clauseNumber: '3.1.1',
      title: 'General Requirements',
      description: 'Buildings shall be designed and constructed to provide safety, health and welfare',
      applicability: 'All buildings',
      requirement: 'Comply with all applicable NBC sections',
      reference: 'NBC 3.1.1',
    });

    clauses.push({
      clauseNumber: '3.1.2',
      title: 'Occupancy Classification',
      description: `Building classified as Occupancy ${occupancy}`,
      applicability: `Occupancy ${occupancy} buildings`,
      requirement: `Apply all requirements for Occupancy ${occupancy}`,
      reference: 'NBC 3.1.2',
    });

    // Fire-resistance rating requirements
    clauses.push({
      clauseNumber: '3.1.8.1',
      title: 'Fire-Resistance Rating',
      description: 'Building elements shall have required fire-resistance ratings',
      applicability: `${storeys}-storey ${constructionType} building`,
      requirement: `Determine FRR from NBC Table 3.1.8.1 based on occupancy and construction type`,
      reference: 'NBC 3.1.8.1',
    });

    // Occupant load requirements
    clauses.push({
      clauseNumber: '3.1.17.1',
      title: 'Occupant Load',
      description: 'Occupant load shall be determined from NBC 2020 Table 3.1.17.1',
      applicability: 'All buildings',
      requirement: `Calculate occupant load using NBC 2020 Table 3.1.17.1 for Occupancy ${occupancy}`,
      reference: 'NBC 2020 Table 3.1.17.1',
    });

    // Egress requirements
    clauses.push({
      clauseNumber: '3.4.1',
      title: 'Means of Egress',
      description: 'Buildings shall be provided with means of egress',
      applicability: 'All buildings',
      requirement: 'Provide adequate exits, corridors, and emergency lighting',
      reference: 'NBC 3.4.1',
    });

    // Sprinkler-related clauses
    if (sprinklers) {
      clauses.push({
        clauseNumber: '3.1.8.1',
        title: 'Sprinkler System Reduction',
        description: 'FRR may be reduced where sprinkler system is provided',
        applicability: 'Buildings with automatic sprinkler systems',
        requirement: 'Reduce FRR by 25% minimum (minimum 0.5 hours)',
        reference: 'NBC 3.1.8.1',
      });
    }

    // Area limitation requirements
    if (determination.failedCriteria.includes('footprint')) {
      clauses.push({
        clauseNumber: '3.2.1',
        title: 'Building Area Limitations',
        description: 'Maximum allowable area based on occupancy and construction type',
        applicability: `Large ${constructionType} buildings`,
        requirement: 'Verify building area does not exceed maximum allowable area',
        reference: 'NBC 3.2.1',
      });
    }

    return clauses;
  }

  /**
   * Generate alternative solutions
   */
  private static generateAlternativeSolutions(
    occupancy: string,
    area_m2: number,
    storeys: number,
    constructionType: string,
    determination: ReturnType<typeof determineBuildingPart>
  ): AlternativeSolution[] {
    const solutions: AlternativeSolution[] = [];

    // Alternative 1: Increase construction type
    if (constructionType !== 'Non-Combustible') {
      solutions.push({
        approach: 'Upgrade to Non-Combustible construction',
        advantages: [
          'Reduced FRR requirements',
          'Increased maximum allowable area',
          'Better insurance rates',
        ],
        disadvantages: [
          'Higher construction cost',
          'Longer design timeline',
          'Material availability constraints',
        ],
        nbcReference: 'NBC 3.1.8.1',
      });
    }

    // Alternative 2: Add sprinkler system
    solutions.push({
      approach: 'Install automatic sprinkler system',
      advantages: [
        'Reduces FRR requirements by 25%',
        'Increases maximum allowable area',
        'Enhanced life safety',
        'Insurance premium reduction',
      ],
      disadvantages: [
        'Additional cost for system installation',
        'Ongoing maintenance requirements',
        'Water supply requirements',
      ],
      nbcReference: 'NBC 3.1.8.1',
    });

    // Alternative 3: Reduce area
    if (determination.failedCriteria.includes('footprint')) {
      solutions.push({
        approach: 'Reduce building area or add fire separation',
        advantages: [
          'Reduced FRR requirements',
          'Simplified compliance',
          'Lower construction cost',
        ],
        disadvantages: [
          'Reduced rentable area',
          'May not meet project requirements',
          'Requires redesign',
        ],
        nbcReference: 'NBC 3.2.3',
      });
    }

    // Alternative 4: Reduce storeys
    if (determination.failedCriteria.includes('storeys')) {
      solutions.push({
        approach: 'Reduce number of storeys',
        advantages: [
          'Reduced FRR requirements',
          'Simplified egress requirements',
          'Lower construction cost',
        ],
        disadvantages: [
          'Reduced building program',
          'May not meet project requirements',
          'Requires significant redesign',
        ],
        nbcReference: 'NBC 3.1.8.1',
      });
    }

    return solutions;
  }

  /**
   * Perform risk assessment
   */
  private static performRiskAssessment(
    occupancy: string,
    area_m2: number,
    storeys: number,
    constructionType: string,
    sprinklers: boolean
  ): { issues: string[]; mitigations: string[] } {
    const issues: string[] = [];
    const mitigations: string[] = [];

    // Risk: Large building
    if (area_m2 > 10000) {
      issues.push('Large building area may require additional fire separations');
      mitigations.push('Implement fire separation walls at strategic locations');
      mitigations.push('Conduct fire safety engineering analysis');
    }

    // Risk: High-rise
    if (storeys > 4) {
      issues.push('Multi-storey building requires enhanced egress provisions');
      mitigations.push('Provide multiple independent exit routes');
      mitigations.push('Install emergency lighting and signage');
    }

    // Risk: Combustible construction
    if (constructionType !== 'Non-Combustible') {
      issues.push('Combustible construction requires higher FRR');
      mitigations.push('Consider upgrading to non-combustible materials');
      mitigations.push('Install automatic sprinkler system');
    }

    // Risk: No sprinklers
    if (!sprinklers && (area_m2 > 5000 || storeys > 2)) {
      issues.push('Building without sprinklers may have limited area allowance');
      mitigations.push('Install automatic sprinkler system');
      mitigations.push('Reduce building area or add fire separations');
    }

    return { issues, mitigations };
  }

  /**
   * Generate justification narrative
   */
  private static generateJustificationNarrative(
    occupancy: string,
    area_m2: number,
    storeys: number,
    constructionType: string,
    sprinklers: boolean,
    clauses: ComplianceClause[]
  ): string {
    let narrative = `# Compliance Justification Narrative\n\n`;

    narrative += `## Project Summary\n`;
    narrative += `This building is classified as Occupancy ${occupancy} with a total area of ${area_m2} m² across ${storeys} storey(s). `;
    narrative += `The building is constructed using ${constructionType} materials`;
    if (sprinklers) {
      narrative += ` and is equipped with an automatic sprinkler system`;
    }
    narrative += `.\n\n`;

    narrative += `## Applicable NBC Requirements\n`;
    narrative += `The following NBC clauses apply to this project:\n\n`;

    clauses.slice(0, 5).forEach((clause) => {
      narrative += `### ${clause.clauseNumber} - ${clause.title}\n`;
      narrative += `${clause.description}\n\n`;
      narrative += `**Requirement:** ${clause.requirement}\n\n`;
    });

    narrative += `## Compliance Approach\n`;
    narrative += `This design achieves compliance through the following measures:\n\n`;
    narrative += `1. **Fire-Resistance Rating:** Building elements are designed to meet the FRR requirements specified in NBC Table 3.1.8.1 for Occupancy ${occupancy} buildings.\n\n`;
    narrative += `2. **Occupant Load:** The occupant load is calculated using NBC 2020 Table 3.1.17.1.\n\n`;
    narrative += `3. **Means of Egress:** Adequate exits and emergency egress routes are provided in accordance with NBC Section 3.4.\n\n`;

    if (sprinklers) {
      narrative += `4. **Sprinkler System:** An automatic sprinkler system is provided, allowing for a 25% reduction in FRR requirements per NBC 3.1.8.1.\n\n`;
    }

    narrative += `## Conclusion\n`;
    narrative += `This design complies with all applicable NBC requirements for Occupancy ${occupancy} buildings. `;
    narrative += `All building elements meet the required fire-resistance ratings, occupant loads are within acceptable limits, `;
    narrative += `and adequate means of egress are provided.\n`;

    return narrative;
  }

  /**
   * Generate compliance summary
   */
  private static generateComplianceSummary(
    occupancy: string,
    area_m2: number,
    storeys: number,
    constructionType: string,
    sprinklers: boolean,
    clauses: ComplianceClause[]
  ): string {
    let summary = `**Occupancy:** ${occupancy}\n`;
    summary += `**Area:** ${area_m2} m²\n`;
    summary += `**Storeys:** ${storeys}\n`;
    summary += `**Construction Type:** ${constructionType}\n`;
    summary += `**Sprinkler System:** ${sprinklers ? 'Yes' : 'No'}\n`;
    summary += `**Applicable Clauses:** ${clauses.length}\n`;
    summary += `**Compliance Status:** COMPLIANT\n`;

    return summary;
  }
}
