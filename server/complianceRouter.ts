/**
 * tRPC Router for Compliance Engine
 * Handles analysis, snapshots, rulesets, and governance
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { rulesets, complianceSnapshots, ruleChangelog, auditLog, ruleTests } from "../drizzle/schema";
import { ComplianceEvaluator, createEvaluator, validateInputsForStrictMode, ComplianceInput, EvaluationResult } from "./complianceEngine";
import { eq, and, isNull } from "drizzle-orm";

export const complianceRouter = router({
  /**
   * Get all active rulesets
   */
  getRulesets: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allRulesets = await db.select().from(rulesets).where(isNull(rulesets.retiredDate));
    return allRulesets.map((rs) => ({
      id: rs.id,
      rulesetId: rs.rulesetId,
      code: rs.code,
      edition: rs.edition,
      amendment: rs.amendment,
      version: rs.version,
      effectiveDate: rs.effectiveDate,
      description: rs.description,
    }));
  }),

  /**
   * Get specific ruleset by ID
   */
  getRuleset: publicProcedure
    .input(z.object({ rulesetId: z.string() }))
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const ruleset = await db
        .select()
        .from(rulesets)
        .where(eq(rulesets.rulesetId, input.rulesetId));
      return ruleset[0] || null;
    }),

  /**
   * Run compliance analysis
   */
  analyzeCompliance: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        rulesetId: z.string(),
        mode: z.enum(["strict", "soft"]),
        inputs: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Get ruleset
      const ruleset = await db
        .select()
        .from(rulesets)
        .where(eq(rulesets.rulesetId, input.rulesetId));

      if (!ruleset.length) {
        throw new Error("Ruleset not found");
      }

      // Create evaluator
      const evaluator = createEvaluator(ruleset[0].rulesData, input.mode);

      // Validate inputs for strict mode
      if (input.mode === "strict") {
        const requiredFields = ["occupancy_major"];
        const validation = validateInputsForStrictMode(input.inputs as ComplianceInput, requiredFields);
        const errors = [...validation.missingFields.map((f: string) => `${f}: required`)];
        if (!input.inputs.area_m2 || Number(input.inputs.area_m2) <= 0) {
          errors.push("area_m2: Building area is required");
        }
        if (errors.length > 0) {
          throw new Error(`Missing required fields for strict mode: ${errors.join(", ")}`);
        }
      }

      // Run analysis
      const result: EvaluationResult = await evaluator.evaluate(input.inputs as ComplianceInput);

      // Create snapshot
      const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(complianceSnapshots).values({
        snapshotId,
        projectId: input.projectId,
        userId: ctx.user.id,
        rulesetId: input.rulesetId,
        mode: input.mode,
        inputs: JSON.stringify(input.inputs),
        outputs: JSON.stringify(result.outputs),
        ruleTrace: JSON.stringify(result.traces.map(t => ({
          constraintId: t.constraintId,
          rule: t.rule,
          result: t.result,
          severity: t.severity,
        }))),
        complianceStatus: result.complianceStatus,
        notes: null,
      });

      // Log to audit trail
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        snapshotId,
        action: "analysis_run",
        details: JSON.stringify({
          rulesetId: input.rulesetId,
          mode: input.mode,
          complianceStatus: result.complianceStatus,
          overallScore: result.overallScore,
          jurisdictionApplied: result.jurisdictionApplied,
        }),
      });

      return {
        snapshotId,
        ...result,
      };
    }),

  /**
   * Get compliance snapshot
   */
  getSnapshot: protectedProcedure
    .input(z.object({ snapshotId: z.string() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const snapshot = await db
        .select()
        .from(complianceSnapshots)
        .where(eq(complianceSnapshots.snapshotId, input.snapshotId));

      if (!snapshot.length) {
        throw new Error("Snapshot not found");
      }

      const s = snapshot[0];
      if (s.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return {
        snapshotId: s.snapshotId,
        projectId: s.projectId,
        rulesetId: s.rulesetId,
        mode: s.mode,
        inputs: JSON.parse(s.inputs as string),
        outputs: JSON.parse(s.outputs as string),
        ruleTrace: JSON.parse(s.ruleTrace as string || "[]"),
        complianceStatus: s.complianceStatus,
        createdAt: s.createdAt,
      };
    }),

  /**
   * List snapshots for a project
   */
  listSnapshots: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const snapshots = await db
        .select()
        .from(complianceSnapshots)
        .where(
          and(
            eq(complianceSnapshots.projectId, input.projectId),
            eq(complianceSnapshots.userId, ctx.user.id)
          )
        );

      return snapshots.map((s) => ({
        snapshotId: s.snapshotId,
        projectId: s.projectId,
        rulesetId: s.rulesetId,
        mode: s.mode,
        complianceStatus: s.complianceStatus,
        createdAt: s.createdAt,
      }));
    }),

  /**
   * Get snapshots for a project (used by client components)
   */
  getProjectSnapshots: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const snapshots = await db
        .select()
        .from(complianceSnapshots)
        .where(
          and(
            eq(complianceSnapshots.projectId, input.projectId),
            eq(complianceSnapshots.userId, ctx.user.id)
          )
        );

      return snapshots.map((s) => ({
        snapshotId: s.snapshotId,
        projectId: s.projectId,
        rulesetId: s.rulesetId,
        mode: s.mode,
        complianceStatus: s.complianceStatus,
        inputs: JSON.parse(s.inputs || "{}") as Record<string, any>,
        outputs: JSON.parse(s.outputs || "{}") as Record<string, any>,
        ruleTrace: JSON.parse(s.ruleTrace || "[]") as any[],
        createdAt: s.createdAt,
      }));
    }),

  /**
   * Create new ruleset version
   */
  createRuleset: protectedProcedure
    .input(
      z.object({
        rulesetId: z.string(),
        code: z.string(),
        edition: z.string(),
        amendment: z.string().optional(),
        version: z.string(),
        effectiveDate: z.string(),
        description: z.string().optional(),
        rulesData: z.string(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(rulesets).values({
        rulesetId: input.rulesetId,
        code: input.code,
        edition: input.edition,
        amendment: input.amendment,
        version: input.version,
        effectiveDate: input.effectiveDate,
        description: input.description,
        rulesData: input.rulesData,
      });

      return { success: true };
    }),

  /**
   * Retire a ruleset
   */
  retireRuleset: protectedProcedure
    .input(z.object({ rulesetId: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(rulesets)
        .set({ retiredDate: new Date() })
        .where(eq(rulesets.rulesetId, input.rulesetId));

      await db.insert(ruleChangelog).values({
        rulesetId: input.rulesetId,
        changeType: "deprecated",
        ruleId: input.rulesetId,
        clause: "N/A",
        description: input.reason,
        approvedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Get audit log for project
   */
  getAuditLog: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const logs = await db
        .select()
        .from(auditLog)
        .where(
          and(
            eq(auditLog.projectId, input.projectId),
            eq(auditLog.userId, ctx.user.id)
          )
        );

      return logs.map((l) => ({
        id: l.id,
        action: l.action,
        details: JSON.parse(l.details as string || "{}"),
        snapshotId: l.snapshotId,
        createdAt: l.createdAt,
      }));
    }),

  /**
   * Run ruleset tests
   */
  runTests: protectedProcedure
    .input(z.object({ rulesetId: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const tests = await db
        .select()
        .from(ruleTests)
        .where(eq(ruleTests.rulesetId, input.rulesetId));

      const ruleset = await db
        .select()
        .from(rulesets)
        .where(eq(rulesets.rulesetId, input.rulesetId));

      if (!ruleset.length) {
        throw new Error("Ruleset not found");
      }

      const evaluator = createEvaluator(ruleset[0].rulesData, "soft");
      const results = [];

      for (const test of tests) {
        const inputs = JSON.parse(test.inputs);
        const expectedOutputs = JSON.parse(test.expectedOutputs);

        const result = await evaluator.evaluate(inputs);
        const passed = JSON.stringify(result.outputs) === JSON.stringify(expectedOutputs);

        results.push({
          testId: test.id,
          testName: test.testName,
          passed,
        });

        // Update test result
        await db
          .update(ruleTests)
          .set({ passed: passed ? 1 : 0, lastRunAt: new Date() })
          .where(eq(ruleTests.id, test.id));
      }

      return results;
    }),
});
