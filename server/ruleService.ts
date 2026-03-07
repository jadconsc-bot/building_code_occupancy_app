/**
 * Rule Service
 * Manages rule queries, caching, and operations for the compliance engine
 * Works with existing rulesets, ruleChangelog, and ruleTests tables
 */

import { getDb } from "./db";
import { rulesets, ruleChangelog, ruleTests, complianceSnapshots } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Get all active rulesets for a specific code version
 */
export async function getActiveRulesets(codeVersion?: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const query = db
      .select()
      .from(rulesets)
      .where(eq(rulesets.retiredDate, null as any))
      .orderBy(desc(rulesets.effectiveDate));

    const result = await query;
    return result;
  } catch (error) {
    console.error("Error fetching active rulesets:", error);
    throw error;
  }
}

/**
 * Get a specific ruleset by ID
 */
export async function getRulesetById(rulesetId: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select()
      .from(rulesets)
      .where(eq(rulesets.rulesetId, rulesetId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching ruleset:", error);
    throw error;
  }
}

/**
 * Parse rules from ruleset JSON
 */
export function parseRulesFromRuleset(ruleset: typeof rulesets.$inferSelect) {
  try {
    const rulesData = typeof ruleset.rulesData === "string" 
      ? JSON.parse(ruleset.rulesData) 
      : ruleset.rulesData;
    return rulesData || [];
  } catch (error) {
    console.error("Error parsing rules from ruleset:", error);
    return [];
  }
}

/**
 * Get rule changelog for a ruleset
 */
export async function getRuleChangelog(rulesetId: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select()
      .from(ruleChangelog)
      .where(eq(ruleChangelog.rulesetId, rulesetId))
      .orderBy(desc(ruleChangelog.createdAt));

    return result;
  } catch (error) {
    console.error("Error fetching rule changelog:", error);
    throw error;
  }
}

/**
 * Get test cases for a rule
 */
export async function getRuleTests(rulesetId: string, ruleId?: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const conditions = [eq(ruleTests.rulesetId, rulesetId)];
    if (ruleId) {
      conditions.push(eq(ruleTests.ruleId, ruleId));
    }

    const result = await db
      .select()
      .from(ruleTests)
      .where(and(...conditions))
      .orderBy(desc(ruleTests.createdAt));

    return result;
  } catch (error) {
    console.error("Error fetching rule tests:", error);
    throw error;
  }
}

/**
 * Run a single rule test
 */
export async function runRuleTest(testId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const test = await db
      .select()
      .from(ruleTests)
      .where(eq(ruleTests.id, testId))
      .limit(1);

    if (!test[0]) {
      throw new Error("Test not found");
    }

    const testCase = test[0];
    
    // Parse inputs and expected outputs
    const inputs = typeof testCase.inputs === "string" 
      ? JSON.parse(testCase.inputs) 
      : testCase.inputs;
    
    const expectedOutputs = typeof testCase.expectedOutputs === "string" 
      ? JSON.parse(testCase.expectedOutputs) 
      : testCase.expectedOutputs;

    // TODO: Execute rule logic against inputs
    // For now, mark as pending
    const passedValue = 0; // 0 = failed, 1 = passed

    // Update test with results
    await db
      .update(ruleTests)
      .set({
        passed: passedValue,
        lastRunAt: new Date(),
      })
      .where(eq(ruleTests.id, testId));

    return {
      testId,
      passed: passedValue === (1 as any),
      inputs,
      expectedOutputs,
    };
  } catch (error) {
    console.error("Error running rule test:", error);
    throw error;
  }
}

/**
 * Get all tests for a ruleset and run them
 */
export async function runRulesetTests(rulesetId: string) {
  try {
    const tests = await getRuleTests(rulesetId);
    
    const results = await Promise.all(
      tests.map((test) => runRuleTest(test.id))
    );

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    return {
      rulesetId,
      totalTests: total,
      passedTests: passed,
      failedTests: total - passed,
      results,
    };
  } catch (error) {
    console.error("Error running ruleset tests:", error);
    throw error;
  }
}

/**
 * Get compliance snapshots for a project
 */
export async function getProjectSnapshots(projectId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select()
      .from(complianceSnapshots)
      .where(eq(complianceSnapshots.projectId, projectId))
      .orderBy(desc(complianceSnapshots.createdAt));

    return result;
  } catch (error) {
    console.error("Error fetching project snapshots:", error);
    throw error;
  }
}

/**
 * Get a specific compliance snapshot
 */
export async function getSnapshot(snapshotId: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select()
      .from(complianceSnapshots)
      .where(eq(complianceSnapshots.snapshotId, snapshotId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching snapshot:", error);
    throw error;
  }
}

/**
 * Parse snapshot data
 */
export function parseSnapshotData(snapshot: typeof complianceSnapshots.$inferSelect) {
  try {
    return {
      inputs: typeof snapshot.inputs === "string" ? JSON.parse(snapshot.inputs) : snapshot.inputs,
      outputs: typeof snapshot.outputs === "string" ? JSON.parse(snapshot.outputs) : snapshot.outputs,
      ruleTrace: typeof snapshot.ruleTrace === "string" ? JSON.parse(snapshot.ruleTrace) : snapshot.ruleTrace,
    };
  } catch (error) {
    console.error("Error parsing snapshot data:", error);
    return {
      inputs: {},
      outputs: {},
      ruleTrace: [],
    };
  }
}

/**
 * Get rule change history for a specific rule
 */
export async function getRuleChangeHistory(ruleId: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db
      .select()
      .from(ruleChangelog)
      .where(eq(ruleChangelog.ruleId, ruleId))
      .orderBy(desc(ruleChangelog.createdAt));

    return result;
  } catch (error) {
    console.error("Error fetching rule change history:", error);
    throw error;
  }
}

/**
 * Compare two rulesets to identify changes
 */
export async function compareRulesets(rulesetId1: string, rulesetId2: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const [ruleset1, ruleset2] = await Promise.all([
      getRulesetById(rulesetId1),
      getRulesetById(rulesetId2),
    ]);

    if (!ruleset1 || !ruleset2) {
      throw new Error("One or both rulesets not found");
    }

    const rules1 = parseRulesFromRuleset(ruleset1);
    const rules2 = parseRulesFromRuleset(ruleset2);

    // Get changelog entries between the two versions
    const changelog = await db
      .select()
      .from(ruleChangelog)
      .where(eq(ruleChangelog.rulesetId, rulesetId2))
      .orderBy(desc(ruleChangelog.createdAt));

    return {
      ruleset1: {
        id: ruleset1.rulesetId,
        version: ruleset1.version,
        ruleCount: rules1.length,
      },
      ruleset2: {
        id: ruleset2.rulesetId,
        version: ruleset2.version,
        ruleCount: rules2.length,
      },
      changes: changelog,
      summary: {
        added: changelog.filter((c) => c.changeType === "added").length,
        modified: changelog.filter((c) => c.changeType === "modified").length,
        deprecated: changelog.filter((c) => c.changeType === "deprecated").length,
        removed: changelog.filter((c) => c.changeType === "removed").length,
      },
    };
  } catch (error) {
    console.error("Error comparing rulesets:", error);
    throw error;
  }
}
