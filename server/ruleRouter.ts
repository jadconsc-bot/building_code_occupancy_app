/**
 * Rule Router
 * tRPC procedures for rule management and querying
 */

import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getActiveRulesets,
  getRulesetById,
  parseRulesFromRuleset,
  getRuleChangelog,
  getRuleTests,
  runRuleTest,
  runRulesetTests,
  getProjectSnapshots,
  getSnapshot,
  parseSnapshotData,
  getRuleChangeHistory,
  compareRulesets,
} from "./ruleService";

export const ruleRouter = router({
  /**
   * Get all active rulesets
   */
  getActiveRulesets: protectedProcedure
    .input(z.object({ codeVersion: z.string().optional() }).optional())
    .query(async ({ input }: { input?: { codeVersion?: string } }) => {
      try {
        const rulesets = await getActiveRulesets(input?.codeVersion);
        return {
          success: true,
          rulesets: rulesets.map((rs) => ({
            id: rs.rulesetId,
            code: rs.code,
            edition: rs.edition,
            version: rs.version,
            effectiveDate: rs.effectiveDate,
            description: rs.description,
          })),
        };
      } catch (error) {
        console.error("Error fetching active rulesets:", error);
        return {
          success: false,
          rulesets: [],
          error: "Failed to fetch rulesets",
        };
      }
    }),

  /**
   * Get specific ruleset with rules
   */
  getRuleset: protectedProcedure
    .input(z.object({ rulesetId: z.string() }))
    .query(async ({ input }: { input: { rulesetId: string } }) => {
      try {
        const ruleset = await getRulesetById(input.rulesetId);
        if (!ruleset) {
          return { success: false, error: "Ruleset not found" };
        }

        const rules = parseRulesFromRuleset(ruleset);

        return {
          success: true,
          ruleset: {
            id: ruleset.rulesetId,
            code: ruleset.code,
            edition: ruleset.edition,
            version: ruleset.version,
            effectiveDate: ruleset.effectiveDate,
            description: ruleset.description,
            ruleCount: rules.length,
            rules: rules.slice(0, 10), // Return first 10 for preview
          },
        };
      } catch (error) {
        console.error("Error fetching ruleset:", error);
        return { success: false, error: "Failed to fetch ruleset" };
      }
    }),

  /**
   * Get rule changelog
   */
  getRuleChangelog: protectedProcedure
    .input(z.object({ rulesetId: z.string() }))
    .query(async ({ input }: { input: { rulesetId: string } }) => {
      try {
        const changelog = await getRuleChangelog(input.rulesetId);

        return {
          success: true,
          changelog: changelog.map((entry) => ({
            id: entry.id,
            ruleId: entry.ruleId,
            clause: entry.clause,
            changeType: entry.changeType,
            description: entry.description,
            reason: entry.reason,
            approvedBy: entry.approvedBy,
            createdAt: entry.createdAt,
          })),
        };
      } catch (error) {
        console.error("Error fetching rule changelog:", error);
        return { success: false, changelog: [], error: "Failed to fetch changelog" };
      }
    }),

  /**
   * Get rule tests
   */
  getRuleTests: protectedProcedure
    .input(z.object({ rulesetId: z.string(), ruleId: z.string().optional() }))
    .query(async ({ input }: { input: { rulesetId: string; ruleId?: string } }) => {
      try {
        const tests = await getRuleTests(input.rulesetId, input.ruleId);

        return {
          success: true,
          tests: tests.map((test) => ({
            id: test.id,
            ruleId: test.ruleId,
            testName: test.testName,
            passed: test.passed === 1,
            lastRunAt: test.lastRunAt,
            createdAt: test.createdAt,
          })),
        };
      } catch (error) {
        console.error("Error fetching rule tests:", error);
        return { success: false, tests: [], error: "Failed to fetch tests" };
      }
    }),

  /**
   * Run a single rule test
   */
  runRuleTest: adminProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }: { input: { testId: number } }) => {
      try {
        const result = await runRuleTest(input.testId);

        return {
          success: true,
          result: {
            testId: result.testId,
            passed: result.passed,
            inputCount: Object.keys(result.inputs).length,
            outputCount: Object.keys(result.expectedOutputs).length,
          },
        };
      } catch (error) {
        console.error("Error running rule test:", error);
        return { success: false, error: "Failed to run test" };
      }
    }),

  /**
   * Run all tests for a ruleset
   */
  runRulesetTests: adminProcedure
    .input(z.object({ rulesetId: z.string() }))
    .mutation(async ({ input }: { input: { rulesetId: string } }) => {
      try {
        const result = await runRulesetTests(input.rulesetId);

        return {
          success: true,
          result: {
            rulesetId: result.rulesetId,
            totalTests: result.totalTests,
            passedTests: result.passedTests,
            failedTests: result.failedTests,
            passRate: result.totalTests > 0 ? (result.passedTests / result.totalTests) * 100 : 0,
          },
        };
      } catch (error) {
        console.error("Error running ruleset tests:", error);
        return { success: false, error: "Failed to run tests" };
      }
    }),

  /**
   * Get project compliance snapshots
   */
  getProjectSnapshots: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }: { input: { projectId: number } }) => {
      try {
        const snapshots = await getProjectSnapshots(input.projectId);

        return {
          success: true,
          snapshots: snapshots.map((snap) => ({
            id: snap.snapshotId,
            projectId: snap.projectId,
            rulesetId: snap.rulesetId,
            mode: snap.mode,
            complianceStatus: snap.complianceStatus,
            createdAt: snap.createdAt,
          })),
        };
      } catch (error) {
        console.error("Error fetching project snapshots:", error);
        return { success: false, snapshots: [], error: "Failed to fetch snapshots" };
      }
    }),

  /**
   * Get specific compliance snapshot
   */
  getSnapshot: protectedProcedure
    .input(z.object({ snapshotId: z.string() }))
    .query(async ({ input }: { input: { snapshotId: string } }) => {
      try {
        const snapshot = await getSnapshot(input.snapshotId);
        if (!snapshot) {
          return { success: false, error: "Snapshot not found" };
        }

        const data = parseSnapshotData(snapshot);

        return {
          success: true,
          snapshot: {
            id: snapshot.snapshotId,
            projectId: snapshot.projectId,
            rulesetId: snapshot.rulesetId,
            mode: snapshot.mode,
            complianceStatus: snapshot.complianceStatus,
            inputs: data.inputs,
            outputs: data.outputs,
            ruleTrace: data.ruleTrace,
            createdAt: snapshot.createdAt,
          },
        };
      } catch (error) {
        console.error("Error fetching snapshot:", error);
        return { success: false, error: "Failed to fetch snapshot" };
      }
    }),

  /**
   * Get rule change history
   */
  getRuleChangeHistory: protectedProcedure
    .input(z.object({ ruleId: z.string() }))
    .query(async ({ input }: { input: { ruleId: string } }) => {
      try {
        const history = await getRuleChangeHistory(input.ruleId);

        return {
          success: true,
          history: history.map((entry) => ({
            id: entry.id,
            rulesetId: entry.rulesetId,
            changeType: entry.changeType,
            description: entry.description,
            reason: entry.reason,
            approvedBy: entry.approvedBy,
            createdAt: entry.createdAt,
          })),
        };
      } catch (error) {
        console.error("Error fetching rule change history:", error);
        return { success: false, history: [], error: "Failed to fetch history" };
      }
    }),

  /**
   * Compare two rulesets
   */
  compareRulesets: protectedProcedure
    .input(z.object({ rulesetId1: z.string(), rulesetId2: z.string() }))
    .query(async ({ input }: { input: { rulesetId1: string; rulesetId2: string } }) => {
      try {
        const comparison = await compareRulesets(input.rulesetId1, input.rulesetId2);

        return {
          success: true,
          comparison: {
            ruleset1: comparison.ruleset1,
            ruleset2: comparison.ruleset2,
            summary: comparison.summary,
            changeCount: comparison.changes.length,
          },
        };
      } catch (error) {
        console.error("Error comparing rulesets:", error);
        return { success: false, error: "Failed to compare rulesets" };
      }
    }),
});
