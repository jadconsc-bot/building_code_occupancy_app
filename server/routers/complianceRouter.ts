/**
 * Compliance Router
 * 
 * tRPC procedures for compliance analysis.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { complianceAnalysisService } from '../services/ComplianceAnalysisService';
import { quotaMiddleware } from '../_core/middleware';
import { ComplianceEvaluator, createEvaluator, ComplianceInput } from '../complianceEngine';
import { CodeInterpreterService, type ClauseReference } from '../codeInterpreterService';
import { ProfessionalReviewService } from '../professionalReviewService';
import { CURRENT_DISCLAIMER_VERSION, isValidDisclaimerVersion } from '../../shared/constants/DISCLAIMER_CONSTANTS';
import { logger } from '../logger';
import { randomUUID } from 'crypto';
import { extractClientIp, extractUserAgent } from '../utils/ipExtraction';

export const complianceRouter = router({
  /**
   * Analyze a building plan for code compliance
   * Uses Claude with Manus LLM fallback
   */
  analyzePlan: protectedProcedure
    .input(
      z.object({
        planDescription: z.string().min(10).max(5000),
        occupancyType: z.string(),
        buildingType: z.string().optional(),
        province: z.string().optional(),
        analysisId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const analysisId = input.analysisId || randomUUID();
      
      // ✅ FIX #3: Extract real IP for audit trail
      const ipAddress = extractClientIp(ctx.req);
      const userAgent = extractUserAgent(ctx.req);
      
      logger.info('🟡 [Router] Starting compliance analysis', {
        analysisId,
        province: input.province || 'default',
        occupancyType: input.occupancyType,
        userId: ctx.user?.id,
        ipAddress,  // ← NOW REAL
        userAgent: userAgent.substring(0, 50),
      });

      try {
        const result = await complianceAnalysisService.analyzePlan(
          {
            planDescription: input.planDescription,
            occupancyType: input.occupancyType,
            buildingType: input.buildingType,
            province: input.province || 'Ontario',
            analysisId,
          },
          ctx.user.id
        );
        
        logger.info('✅ [Router] Analysis complete', {
          analysisId,
          source: result.source,
          usedFallback: result.usedFallback,
          confidence: result.confidence,
          userId: ctx.user?.id,
          ipAddress,  // ← NOW REAL
        });

        return {
          success: true,
          analysis: result.analysis,
          source: result.source,
          usedFallback: result.usedFallback,
          confidence: result.confidence,
          analysisId,
        };
      } catch (error) {
        logger.error('❌ [Router] Analysis failed', {
          analysisId,
          error: error instanceof Error ? error.message : String(error),
          userId: ctx.user?.id,
          ipAddress,  // ← NOW REAL
        });
        throw error;
      }
    }),

  /**
   * Analyze a building drawing for code compliance
   */
  analyzeDrawing: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        occupancyType: z.string(),
        analysisType: z.enum(['structural', 'egress', 'fire-safety', 'accessibility']),
        disclaimerAcknowledged: z.boolean().refine(
          (val) => val === true,
          { message: 'You must acknowledge the disclaimer before proceeding' }
        ),
        disclaimerVersion: z.string().refine(
          (val) => isValidDisclaimerVersion(val),
          { message: `Disclaimer version must be ${CURRENT_DISCLAIMER_VERSION}` }
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // API-layer disclaimer validation (Prime Directive 2.0)
      if (!input.disclaimerAcknowledged) {
        throw new Error('Disclaimer must be acknowledged before analysis');
      }
      if (!isValidDisclaimerVersion(input.disclaimerVersion)) {
        throw new Error(`Invalid disclaimer version. Expected ${CURRENT_DISCLAIMER_VERSION}, got ${input.disclaimerVersion}`);
      }
      // Track usage
      return complianceAnalysisService.analyzeDrawing(input, ctx.user.id);
    }),

  /**
   * Get analysis history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // TODO: Implement analysis history retrieval from database
      return {
        analyses: [],
        total: 0,
      };
    }),

  /**
   * Delete analysis result
   */
  deleteAnalysis: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement analysis deletion
      return { success: true };
    }),

  /**
   * Decision 1: Evaluate compliance using deterministic rule engine
   * Returns structured result with rule trace for legal defensibility
   */
  evaluateCompliance: protectedProcedure
    .input(
      z.object({
        scenario: z.object({
          occupancy_major: z.string(),
          occupancy_division: z.string().optional(),
          area_m2: z.number().optional(),
          storeys: z.number().optional(),
          sprinklers: z.boolean().optional(),
          fire_alarm: z.boolean().optional(),
          exits: z.number().optional(),
          travel_distance_m: z.number().optional(),
          construction_type: z.string().optional(),
        }),
        rulesetVersion: z.string().default('latest'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create evaluator with rules (in production, fetch from database)
        const rulesetJson = JSON.stringify({ rules: [] });
        const evaluator = createEvaluator(rulesetJson, 'strict');
        
        // Evaluate compliance deterministically
        const result = evaluator.evaluate(input.scenario as ComplianceInput);
        
        return {
          success: true,
          isDeterministic: true,
          result,
          userId: ctx.user.id,
          evaluatedAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Evaluation failed',
        };
      }
    }),

  /**
   * Decision 1: Interpret building code clauses using LLM
   * LLM role is LIMITED to interpretation only - NOT compliance evaluation
   */
  interpretRules: protectedProcedure
    .input(
      z.object({
        clauseReferences: z.array(
          z.object({
            code: z.string(),
            section: z.string(),
            subsection: z.string().optional(),
            description: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const interpreter = new CodeInterpreterService();
        const interpretations = [];
        
        for (const clause of input.clauseReferences) {
          const interpretation = await interpreter.interpretClause(clause as ClauseReference);
          interpretations.push(interpretation);
        }
        
        return {
          success: true,
          interpretations,
          userId: ctx.user.id,
          interpretedAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Interpretation failed',
        };
      }
    }),

  /**
   * Decision 3: Submit compliance snapshot for professional review
   */
  submitForReview: protectedProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        projectId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const reviewService = new ProfessionalReviewService();
        const reviewRequest = await reviewService.submitForReview(
          input.snapshotId,
          input.projectId,
          String(ctx.user?.id || 'unknown-user'),
          input.notes
        );
        
        return {
          success: true,
          reviewRequest,
          submittedAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Submission failed',
        };
      }
    }),

  /**
   * Decision 3: Sign compliance snapshot with digital signature
   */
  signReview: protectedProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        signature: z.string(), // Base64 encoded signature
        signerRole: z.enum(['engineer', 'architect', 'reviewer']),
        licenseNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const reviewService = new ProfessionalReviewService();
        const signedResult = await reviewService.signSnapshot(
          input.snapshotId,
          String(ctx.user?.id || 'unknown-user'),
          input.signerRole,
          input.signature
        );
        
        return {
          success: true,
          signedResult,
          signedAt: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Signing failed',
        };
      }
    }),
});
