/**
 * Phase 2 Router: Report Persistence, Scenarios, and Batch Comparisons
 * 
 * This router provides tRPC procedures for:
 * 1. Report Persistence - Save, retrieve, update, delete reports
 * 2. Scenario History - Save, retrieve, and track scenario versions
 * 3. Project Integration - Link reports and scenarios to projects
 * 4. Batch Comparisons - Compare multiple scenarios simultaneously
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  saveReport,
  getUserReports,
  getProjectReports,
  getReportById,
  updateReport,
  deleteReport,
  saveScenario,
  getUserScenarios,
  getProjectScenarios,
  getScenarioById,
  updateScenario,
  deleteScenario,
  recordScenarioHistory,
  getScenarioHistory,
  saveBatchComparison,
  getUserBatchComparisons,
  getProjectBatchComparisons,
  getBatchComparisonById,
  updateBatchComparison,
  deleteBatchComparison,
} from "./db";

// ============================================================================
// ZODI SCHEMAS
// ============================================================================

const reportInputSchema = z.object({
  projectId: z.number().optional(),
  name: z.string().min(1, "Report name is required"),
  type: z.enum(["compliance", "calculation", "pathway", "batch"]),
  content: z.record(z.string(), z.any()),
  metadata: z.record(z.string(), z.any()).optional(),
});

const scenarioInputSchema = z.object({
  projectId: z.number().optional(),
  name: z.string().min(1, "Scenario name is required"),
  description: z.string().optional(),
  type: z.enum(["fire_resistance", "compliance", "custom"]),
  inputData: z.record(z.string(), z.any()),
  resultData: z.record(z.string(), z.any()).optional(),
  status: z.enum(["draft", "calculated", "archived"]).optional(),
});

const batchComparisonInputSchema = z.object({
  projectId: z.number().optional(),
  name: z.string().min(1, "Batch comparison name is required"),
  description: z.string().optional(),
  scenarioIds: z.array(z.number()),
  analysisType: z.string().optional(),
});

// ============================================================================
// REPORT PROCEDURES
// ============================================================================

export const phase2Router = router({
  // ========================================================================
  // REPORTS
  // ========================================================================

  /**
   * Save a new report
   */
  saveReport: protectedProcedure
    .input(reportInputSchema)
    .mutation(async ({ ctx, input }: any) => {
      return await saveReport({
        userId: ctx.user.id,
        projectId: input.projectId || null,
        name: input.name,
        type: input.type,
        content: input.content,
        metadata: input.metadata || null,
      });
    }),

  /**
   * Get all reports for the authenticated user
   */
  getReports: protectedProcedure.query(async ({ ctx }: any) => {
    return await getUserReports(ctx.user.id);
  }),

  /**
   * Get reports for a specific project
   */
  getProjectReports: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      return await getProjectReports(ctx.user.id, input.projectId);
    }),

  /**
   * Get a specific report by ID
   */
  getReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      return await getReportById(input.reportId, ctx.user.id);
    }),

  /**
   * Update a report
   */
  updateReport: protectedProcedure
    .input(
      z.object({
        reportId: z.number(),
        data: reportInputSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      await updateReport(input.reportId, ctx.user.id, input.data);
      return await getReportById(input.reportId, ctx.user.id);
    }),

  /**
   * Delete a report
   */
  deleteReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      await deleteReport(input.reportId, ctx.user.id);
      return { success: true };
    }),

  // ========================================================================
  // SCENARIOS
  // ========================================================================

  /**
   * Save a new scenario
   */
  saveScenario: protectedProcedure
    .input(scenarioInputSchema)
    .mutation(async ({ ctx, input }: any) => {
      return await saveScenario({
        userId: ctx.user.id,
        projectId: input.projectId || null,
        name: input.name,
        description: input.description || null,
        type: input.type,
        inputData: input.inputData,
        resultData: input.resultData || null,
        status: (input.status || "draft") as "draft" | "calculated" | "archived",
        version: 1,
      });
    }),

  /**
   * Get all scenarios for the authenticated user
   */
  getScenarios: protectedProcedure.query(async ({ ctx }: any) => {
    return await getUserScenarios(ctx.user.id);
  }),

  /**
   * Get scenarios for a specific project
   */
  getProjectScenarios: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      return await getProjectScenarios(ctx.user.id, input.projectId);
    }),

  /**
   * Get a specific scenario by ID
   */
  getScenario: protectedProcedure
    .input(z.object({ scenarioId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      return await getScenarioById(input.scenarioId, ctx.user.id);
    }),

  /**
   * Update a scenario and record history
   */
  updateScenario: protectedProcedure
    .input(
      z.object({
        scenarioId: z.number(),
        data: scenarioInputSchema.partial(),
        recordHistory: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const scenario = await getScenarioById(input.scenarioId, ctx.user.id);
      if (!scenario) {
        throw new Error("Scenario not found");
      }

      // Record history if requested
      if (input.recordHistory) {
        const newVersion = (scenario.version || 1) + 1;
        await recordScenarioHistory({
          scenarioId: input.scenarioId,
          userId: ctx.user.id,
          version: newVersion,
          changes: input.data,
          previousData: scenario,
        });
      }

      // Update scenario
      const updateData = {
        ...input.data,
        version: input.recordHistory ? (scenario.version || 1) + 1 : scenario.version,
      };
      await updateScenario(input.scenarioId, ctx.user.id, updateData);
      return await getScenarioById(input.scenarioId, ctx.user.id);
    }),

  /**
   * Delete a scenario
   */
  deleteScenario: protectedProcedure
    .input(z.object({ scenarioId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      await deleteScenario(input.scenarioId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Get version history for a scenario
   */
  getScenarioHistory: protectedProcedure
    .input(z.object({ scenarioId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      // Verify user owns this scenario
      const scenario = await getScenarioById(input.scenarioId, ctx.user.id);
      if (!scenario) {
        throw new Error("Scenario not found");
      }
      return await getScenarioHistory(input.scenarioId);
    }),

  // ========================================================================
  // BATCH COMPARISONS
  // ========================================================================

  /**
   * Save a new batch comparison
   */
  saveBatchComparison: protectedProcedure
    .input(batchComparisonInputSchema)
    .mutation(async ({ ctx, input }: any) => {
      return await saveBatchComparison({
        userId: ctx.user.id,
        projectId: input.projectId || null,
        name: input.name,
        description: input.description || null,
        scenarioIds: input.scenarioIds,
        comparisonData: null,
        analysisType: input.analysisType || null,
        status: "pending",
      });
    }),

  /**
   * Get batch comparisons for the authenticated user
   */
  getBatchComparisons: protectedProcedure.query(async ({ ctx }: any) => {
    return await getUserBatchComparisons(ctx.user.id);
  }),

  /**
   * Get batch comparisons for a specific project
   */
  getProjectBatchComparisons: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      return await getProjectBatchComparisons(ctx.user.id, input.projectId);
    }),

  /**
   * Get a specific batch comparison by ID
   */
  getBatchComparison: protectedProcedure
    .input(z.object({ batchId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      return await getBatchComparisonById(input.batchId, ctx.user.id);
    }),

  /**
   * Update batch comparison with results
   */
  updateBatchComparison: protectedProcedure
    .input(
      z.object({
        batchId: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          comparisonData: z.record(z.string(), z.any()).optional(),
          status: z.enum(["pending", "completed", "failed"]).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      await updateBatchComparison(input.batchId, ctx.user.id, input.data as any);
      return await getBatchComparisonById(input.batchId, ctx.user.id);
    }),

  /**
   * Delete a batch comparison
   */
  deleteBatchComparison: protectedProcedure
    .input(z.object({ batchId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      await deleteBatchComparison(input.batchId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Compare multiple scenarios
   * This procedure takes scenario IDs and returns a comparison analysis
   */
  compareBatchScenarios: protectedProcedure
    .input(
      z.object({
        batchId: z.number(),
        scenarioIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      // Verify user owns the batch comparison
      const batch = await getBatchComparisonById(input.batchId, ctx.user.id);
      if (!batch) {
        throw new Error("Batch comparison not found");
      }

      // Fetch all scenarios
      const scenarios = await Promise.all(
        input.scenarioIds.map((id: number) => getScenarioById(id, ctx.user.id))
      );

      // Filter out null scenarios
      const validScenarios = scenarios.filter((s) => s !== undefined);

      if (validScenarios.length === 0) {
        throw new Error("No valid scenarios found");
      }

      // Build comparison data
      const comparisonData = {
        scenarioCount: validScenarios.length,
        scenarios: validScenarios.map((s) => ({
          id: s?.id,
          name: s?.name,
          type: s?.type,
          inputData: s?.inputData,
          resultData: s?.resultData,
          status: s?.status,
        })),
        comparedAt: new Date(),
      };

      // Update batch with comparison results
      await updateBatchComparison(input.batchId, ctx.user.id, {
        comparisonData: comparisonData as any,
        status: "completed" as any,
      } as any);

      return comparisonData;
    }),
});
