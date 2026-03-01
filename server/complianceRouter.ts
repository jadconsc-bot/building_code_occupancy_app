/**
 * tRPC Router for Compliance Engine
 * Handles analysis, snapshots, rulesets, and governance
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { rulesets, complianceSnapshots, ruleChangelog, auditLog, ruleTests } from "../drizzle/schema";
import { ComplianceEvaluator, createEvaluator, validateInputsForStrictMode, ComplianceInput } from "./complianceEngine";
import { eq, and } from "drizzle-orm";

export const complianceRouter = router({
  /**
   * Get all active rulesets
   */
  getRulesets: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allRulesets = await db.select().from(rulesets).where(eq(rulesets.retiredDate, null as any));
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
        if (!validation.valid) {
          throw new Error(`Missing required fields for strict mode: ${validation.missingFields.join(", ")}`);
        }
      }

      // Run analysis
      const result = evaluator.evaluate(input.inputs as ComplianceInput);

      // Determine compliance status
      const allCompliant = Object.values(result.compliance_flags).every((flag) => flag === true);
      const anyNonCompliant = Object.values(result.compliance_flags).some((flag) => flag === false);
      const complianceStatus = allCompliant ? "compliant" : anyNonCompliant ? "non_compliant" : "conditional";

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
        ruleTrace: JSON.stringify(result.rule_trace),
        complianceStatus: complianceStatus as "compliant" | "non_compliant" | "conditional",
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
          complianceStatus,
        }),
      });

      return {
        snapshotId,
        ...result,
        complianceStatus,
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

      const snap = snapshot[0];

      // Verify user owns this snapshot
      if (snap.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return {
        ...snap,
        inputs: JSON.parse(snap.inputs),
        outputs: JSON.parse(snap.outputs),
        ruleTrace: JSON.parse(snap.ruleTrace),
      };
    }),

  /**
   * Get all snapshots for a project
   */
  getProjectSnapshots: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const snapshots = await db
        .select()
        .from(complianceSnapshots)
        .where(and(eq(complianceSnapshots.projectId, input.projectId), eq(complianceSnapshots.userId, ctx.user.id)));

      return snapshots.map((snap) => ({
        ...snap,
        inputs: JSON.parse(snap.inputs),
        outputs: JSON.parse(snap.outputs),
        ruleTrace: JSON.parse(snap.ruleTrace),
      }));
    }),

  /**
   * Get audit log for a project
   */
  getAuditLog: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const logs = await db
        .select()
        .from(auditLog)
        .where(and(eq(auditLog.projectId, input.projectId), eq(auditLog.userId, ctx.user.id)));

      return logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      }));
    }),

  /**
   * Create or update ruleset (admin only)
   */
  createRuleset: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        edition: z.string(),
        amendment: z.string().optional(),
        version: z.string(),
        description: z.string().optional(),
        rules: z.array(z.record(z.string(), z.any())),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create rulesets");
      }

      const rulesetId = `${input.code.toLowerCase()}_${input.edition}_v${input.version}`.replace(/\s+/g, "_");

      const values = {
        rulesetId,
        code: input.code,
        edition: input.edition,
        amendment: input.amendment || null,
        version: input.version,
        effectiveDate: new Date(),
        retiredDate: null,
        description: input.description || null,
        rulesData: JSON.stringify({ rules: input.rules }),
      };

      await db.insert(rulesets).values(values as any);
      return { rulesetId };
    }),

  /**
   * Get rule changelog
   */
  getRuleChangelog: publicProcedure
    .input(z.object({ rulesetId: z.string() }))
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const changes = await db
        .select()
        .from(ruleChangelog)
        .where(eq(ruleChangelog.rulesetId, input.rulesetId));

      return changes;
    }),

  /**
   * Add rule change to changelog (admin only)
   */
  logRuleChange: protectedProcedure
    .input(
      z.object({
        rulesetId: z.string(),
        changeType: z.enum(["added", "modified", "deprecated", "removed"]),
        ruleId: z.string(),
        clause: z.string(),
        description: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can log rule changes");
      }

      await db.insert(ruleChangelog).values({
        rulesetId: input.rulesetId,
        changeType: input.changeType,
        ruleId: input.ruleId,
        clause: input.clause,
        description: input.description,
        reason: input.reason || null,
        approvedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Run rule tests
   */
  runRuleTests: publicProcedure
    .input(z.object({ rulesetId: z.string() }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const tests = await db.select().from(ruleTests).where(eq(ruleTests.rulesetId, input.rulesetId));

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

        const result = evaluator.evaluate(inputs);
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
