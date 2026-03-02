/**
 * Compliance Analysis Service
 * 
 * Encapsulates all LLM-based compliance analysis logic.
 * Handles plan analysis, drawing analysis, and code interpretation.
 */

import { invokeLLM } from '../_core/llm';
import { TRPCError } from '@trpc/server';
import { checkRateLimit, rateLimiters, requestDeduplicator } from '../_core/security';

export interface AnalyzePlanInput {
  planDescription: string;
  occupancyType: string;
  buildingType?: string;
  province?: string;
}

export interface AnalyzePlanOutput {
  success: boolean;
  infractions: Array<{
    code: string;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    requirement: string;
    remediation: string;
  }>;
  summary: string;
  error?: string;
}

export interface AnalyzeDrawingInput {
  imageUrl: string;
  occupancyType: string;
  analysisType: 'structural' | 'egress' | 'fire-safety' | 'accessibility';
}

export interface AnalyzeDrawingOutput {
  success: boolean;
  findings: Array<{
    location: string;
    issue: string;
    severity: 'critical' | 'major' | 'minor';
    code_reference: string;
    remediation: string;
  }>;
  summary: string;
  error?: string;
}

export class ComplianceAnalysisService {
  /**
   * Analyze building plan for code compliance
   */
  async analyzePlan(input: AnalyzePlanInput, userId: number): Promise<AnalyzePlanOutput> {
    // Check rate limit (10 per hour per user)
    checkRateLimit(rateLimiters.llm, `user:${userId}:plan`);

    // Deduplicate identical requests
    const deduplicationKey = `plan:${userId}:${input.planDescription}:${input.occupancyType}`;

    return requestDeduplicator.deduplicate(deduplicationKey, async () => {
      try {
        const prompt = this.buildPlanAnalysisPrompt(input);

        const response = await Promise.race([
          invokeLLM({
            messages: [
              {
                role: 'system',
                content: 'You are a building code compliance expert. Analyze the provided plan description and identify any code violations. Return a JSON object with infractions array.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'compliance_analysis',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    infractions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          code: { type: 'string' },
                          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
                          description: { type: 'string' },
                          requirement: { type: 'string' },
                          remediation: { type: 'string' },
                        },
                        required: ['code', 'severity', 'description', 'requirement', 'remediation'],
                      },
                    },
                    summary: { type: 'string' },
                  },
                  required: ['infractions', 'summary'],
                },
              },
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('LLM timeout')), 30000)
          ),
        ]);

        const content = response.choices[0].message.content;
        if (!content) {
          return {
            success: false,
            infractions: [],
            summary: 'No response from analysis',
            error: 'Empty response from LLM',
          };
        }

        const parsed = JSON.parse(content);

        return {
          success: true,
          infractions: parsed.infractions || [],
          summary: parsed.summary || '',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        console.error('[ComplianceAnalysis] Plan analysis failed:', message);

        return {
          success: false,
          infractions: [],
          summary: '',
          error: `Analysis failed: ${message}`,
        };
      }
    });
  }

  /**
   * Analyze building drawing/image for code compliance
   */
  async analyzeDrawing(
    input: AnalyzeDrawingInput,
    userId: number
  ): Promise<AnalyzeDrawingOutput> {
    // Check rate limit
    checkRateLimit(rateLimiters.llm, `user:${userId}:drawing`);

    // Deduplicate identical requests
    const deduplicationKey = `drawing:${userId}:${input.imageUrl}:${input.analysisType}`;

    return requestDeduplicator.deduplicate(deduplicationKey, async () => {
      try {
        const prompt = this.buildDrawingAnalysisPrompt(input);

        const response = await Promise.race([
          invokeLLM({
            messages: [
              {
                role: 'system',
                content: 'You are a building code compliance expert analyzing architectural drawings. Identify code violations and provide remediation guidance. Return a JSON object.',
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: input.imageUrl,
                      detail: 'high',
                    },
                  },
                ],
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'drawing_analysis',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    findings: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          location: { type: 'string' },
                          issue: { type: 'string' },
                          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
                          code_reference: { type: 'string' },
                          remediation: { type: 'string' },
                        },
                        required: ['location', 'issue', 'severity', 'code_reference', 'remediation'],
                      },
                    },
                    summary: { type: 'string' },
                  },
                  required: ['findings', 'summary'],
                },
              },
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('LLM timeout')), 30000)
          ),
        ]);

        const content = response.choices[0].message.content;
        if (!content) {
          return {
            success: false,
            findings: [],
            summary: 'No response from analysis',
            error: 'Empty response from LLM',
          };
        }

        const parsed = JSON.parse(content);

        return {
          success: true,
          findings: parsed.findings || [],
          summary: parsed.summary || '',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        console.error('[ComplianceAnalysis] Drawing analysis failed:', message);

        return {
          success: false,
          findings: [],
          summary: '',
          error: `Analysis failed: ${message}`,
        };
      }
    });
  }

  /**
   * Build prompt for plan analysis
   */
  private buildPlanAnalysisPrompt(input: AnalyzePlanInput): string {
    return `
Analyze the following building plan for code compliance:

Occupancy Type: ${input.occupancyType}
Building Type: ${input.buildingType || 'Not specified'}
Province: ${input.province || 'Alberta'}

Plan Description:
${input.planDescription}

Please identify all code violations according to the National Building Code and provincial amendments.
For each violation, provide:
1. The specific code section violated
2. Severity level (critical/major/minor)
3. Description of the violation
4. What the code requires
5. How to remediate the issue

Return a JSON object with an infractions array and a summary.
    `.trim();
  }

  /**
   * Build prompt for drawing analysis
   */
  private buildDrawingAnalysisPrompt(input: AnalyzeDrawingInput): string {
    const analysisTypeDescriptions = {
      structural: 'structural integrity, load paths, and support systems',
      egress: 'emergency egress routes, exit widths, and travel distances',
      'fire-safety': 'fire-rated assemblies, compartmentalization, and sprinkler placement',
      accessibility: 'accessibility features, ramp slopes, door widths, and clearances',
    };

    return `
Analyze this architectural drawing for code compliance.

Occupancy Type: ${input.occupancyType}
Analysis Focus: ${analysisTypeDescriptions[input.analysisType]}

Please examine the drawing and identify any violations related to ${analysisTypeDescriptions[input.analysisType]}.

For each finding, provide:
1. Location in the drawing
2. Description of the issue
3. Severity (critical/major/minor)
4. Applicable code reference
5. Recommended remediation

Return a JSON object with a findings array and a summary.
    `.trim();
  }
}

export const complianceAnalysisService = new ComplianceAnalysisService();
