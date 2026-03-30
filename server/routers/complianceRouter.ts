/**
 * Compliance Router
 * 
 * tRPC procedures for compliance analysis.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { complianceAnalysisService } from '../services/ComplianceAnalysisService';
import { quotaMiddleware } from '../_core/middleware';

export const complianceRouter = router({
  /**
   * Analyze a building plan for code compliance
   */
  analyzePlan: protectedProcedure
    .input(
      z.object({
        planDescription: z.string().min(10).max(5000),
        occupancyType: z.string(),
        buildingType: z.string().optional(),
        province: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Track usage
      return complianceAnalysisService.analyzePlan(input, ctx.user.id);
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
      })
    )
    .mutation(async ({ ctx, input }) => {
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
});
