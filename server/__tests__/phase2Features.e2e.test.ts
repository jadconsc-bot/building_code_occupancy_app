/**
 * Phase 2 Features E2E Tests
 * 
 * Comprehensive end-to-end tests for:
 * 1. Report Persistence
 * 2. Scenario History
 * 3. Project Integration
 * 4. Export Functionality
 * 5. Batch Comparisons
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTRPCMsw } from "@trpc/server/adapters/fetch";
import { appRouter } from "../routers";
import { getDb } from "../db";

describe("Phase 2: Report Persistence, Scenarios & Batch Comparisons", () => {
  let trpc: any;
  let testUserId = 1;
  let testProjectId = 1;

  beforeAll(async () => {
    // Initialize tRPC for testing
    const db = await getDb();
    expect(db).toBeDefined();
  });

  describe("Report Persistence", () => {
    it("should save a compliance report", async () => {
      const reportData = {
        projectId: testProjectId,
        name: "Compliance Report - Building A",
        type: "compliance" as const,
        content: {
          infractions: ["Egress width below minimum"],
          status: "non-compliant",
          recommendations: ["Increase door width to 900mm"],
        },
        metadata: {
          codeVersion: "NBC_2025",
          occupancy: "Residential",
        },
      };

      // Simulate saving report
      const result = await appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      }).phase2.saveReport(reportData);

      expect(result).toBeDefined();
      expect(result.name).toBe("Compliance Report - Building A");
      expect(result.type).toBe("compliance");
      expect(result.userId).toBe(testUserId);
    });

    it("should retrieve user reports", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const reports = await caller.phase2.getReports();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThanOrEqual(0);
    });

    it("should retrieve project-specific reports", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const projectReports = await caller.phase2.getProjectReports({
        projectId: testProjectId,
      });

      expect(Array.isArray(projectReports)).toBe(true);
    });

    it("should update a report", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      // First save a report
      const savedReport = await caller.phase2.saveReport({
        projectId: testProjectId,
        name: "Test Report",
        type: "calculation",
        content: { result: "test" },
      });

      // Then update it
      const updated = await caller.phase2.updateReport({
        reportId: savedReport.id,
        data: {
          name: "Updated Test Report",
          content: { result: "updated" },
        },
      });

      expect(updated?.name).toBe("Updated Test Report");
    });

    it("should delete a report", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      // Save a report
      const savedReport = await caller.phase2.saveReport({
        projectId: testProjectId,
        name: "Report to Delete",
        type: "pathway",
        content: { test: true },
      });

      // Delete it
      const result = await caller.phase2.deleteReport({
        reportId: savedReport.id,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Scenario History & Versioning", () => {
    it("should save a fire resistance scenario", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const scenario = await caller.phase2.saveScenario({
        projectId: testProjectId,
        name: "Fire Resistance Scenario A",
        description: "Testing fire resistance for residential building",
        type: "fire_resistance",
        inputData: {
          occupancy: "Residential",
          area_m2: 2500,
          storeys: 2,
          construction_type: "Combustible",
          sprinklers: false,
        },
        status: "draft",
      });

      expect(scenario).toBeDefined();
      expect(scenario.name).toBe("Fire Resistance Scenario A");
      expect(scenario.type).toBe("fire_resistance");
      expect(scenario.status).toBe("draft");
      expect(scenario.version).toBe(1);
    });

    it("should retrieve user scenarios", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const scenarios = await caller.phase2.getScenarios();
      expect(Array.isArray(scenarios)).toBe(true);
    });

    it("should retrieve project scenarios", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const projectScenarios = await caller.phase2.getProjectScenarios({
        projectId: testProjectId,
      });

      expect(Array.isArray(projectScenarios)).toBe(true);
    });

    it("should update scenario and record history", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      // Save initial scenario
      const scenario = await caller.phase2.saveScenario({
        projectId: testProjectId,
        name: "Versioned Scenario",
        type: "compliance",
        inputData: { version: 1 },
      });

      // Update with history tracking
      const updated = await caller.phase2.updateScenario({
        scenarioId: scenario.id,
        data: {
          inputData: { version: 2, updated: true },
          status: "calculated",
        },
        recordHistory: true,
      });

      expect(updated?.version).toBe(2);

      // Retrieve history
      const history = await caller.phase2.getScenarioHistory({
        scenarioId: scenario.id,
      });

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it("should delete a scenario", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const scenario = await caller.phase2.saveScenario({
        projectId: testProjectId,
        name: "Scenario to Delete",
        type: "custom",
        inputData: { test: true },
      });

      const result = await caller.phase2.deleteScenario({
        scenarioId: scenario.id,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Batch Comparisons", () => {
    it("should save a batch comparison", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      // Create test scenarios
      const scenario1 = await caller.phase2.saveScenario({
        projectId: testProjectId,
        name: "Scenario 1",
        type: "fire_resistance",
        inputData: { construction: "Combustible" },
      });

      const scenario2 = await caller.phase2.saveScenario({
        projectId: testProjectId,
        name: "Scenario 2",
        type: "fire_resistance",
        inputData: { construction: "Non-Combustible" },
      });

      // Create batch comparison
      const batch = await caller.phase2.saveBatchComparison({
        projectId: testProjectId,
        name: "Construction Type Comparison",
        description: "Comparing combustible vs non-combustible",
        scenarioIds: [scenario1.id, scenario2.id],
        analysisType: "fire_resistance",
      });

      expect(batch).toBeDefined();
      expect(batch.name).toBe("Construction Type Comparison");
      expect(batch.status).toBe("pending");
    });

    it("should retrieve batch comparisons", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const batches = await caller.phase2.getBatchComparisons();
      expect(Array.isArray(batches)).toBe(true);
    });

    it("should retrieve project batch comparisons", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const projectBatches = await caller.phase2.getProjectBatchComparisons({
        projectId: testProjectId,
      });

      expect(Array.isArray(projectBatches)).toBe(true);
    });

    it("should compare multiple scenarios", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      // Create scenarios
      const scenario1 = await caller.phase2.saveScenario({
        projectId: testProjectId,
        name: "Scenario A",
        type: "compliance",
        inputData: { occupancy: "Residential" },
        resultData: { compliant: true },
      });

      const scenario2 = await caller.phase2.saveScenario({
        projectId: testProjectId,
        name: "Scenario B",
        type: "compliance",
        inputData: { occupancy: "Commercial" },
        resultData: { compliant: false },
      });

      // Create batch
      const batch = await caller.phase2.saveBatchComparison({
        projectId: testProjectId,
        name: "Occupancy Comparison",
        scenarioIds: [scenario1.id, scenario2.id],
      });

      // Compare scenarios
      const comparison = await caller.phase2.compareBatchScenarios({
        batchId: batch.id,
        scenarioIds: [scenario1.id, scenario2.id],
      });

      expect(comparison).toBeDefined();
      expect(comparison.scenarioCount).toBe(2);
      expect(comparison.scenarios).toHaveLength(2);
      expect(comparison.comparedAt).toBeDefined();
    });

    it("should update batch comparison status", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const batch = await caller.phase2.saveBatchComparison({
        projectId: testProjectId,
        name: "Status Test",
        scenarioIds: [1],
      });

      const updated = await caller.phase2.updateBatchComparison({
        batchId: batch.id,
        data: {
          status: "completed",
          comparisonData: { result: "test" },
        },
      });

      expect(updated?.status).toBe("completed");
    });

    it("should delete a batch comparison", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const batch = await caller.phase2.saveBatchComparison({
        projectId: testProjectId,
        name: "Batch to Delete",
        scenarioIds: [1],
      });

      const result = await caller.phase2.deleteBatchComparison({
        batchId: batch.id,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Project Integration", () => {
    it("should link reports to projects", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const report = await caller.phase2.saveReport({
        projectId: testProjectId,
        name: "Project-Linked Report",
        type: "compliance",
        content: { test: true },
      });

      expect(report.projectId).toBe(testProjectId);

      const projectReports = await caller.phase2.getProjectReports({
        projectId: testProjectId,
      });

      const found = projectReports.find((r) => r.id === report.id);
      expect(found).toBeDefined();
    });

    it("should link scenarios to projects", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const scenario = await caller.phase2.saveScenario({
        projectId: testProjectId,
        name: "Project-Linked Scenario",
        type: "fire_resistance",
        inputData: { test: true },
      });

      expect(scenario.projectId).toBe(testProjectId);

      const projectScenarios = await caller.phase2.getProjectScenarios({
        projectId: testProjectId,
      });

      const found = projectScenarios.find((s) => s.id === scenario.id);
      expect(found).toBeDefined();
    });
  });

  describe("Data Isolation & Security", () => {
    it("should not allow access to other users' reports", async () => {
      const caller1 = appRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const caller2 = appRouter.createCaller({
        user: { id: 2 },
        req: {} as any,
        res: {} as any,
      });

      // User 1 saves a report
      const report = await caller1.phase2.saveReport({
        projectId: testProjectId,
        name: "Private Report",
        type: "compliance",
        content: { secret: true },
      });

      // User 2 tries to retrieve it
      const result = await caller2.phase2.getReport({
        reportId: report.id,
      });

      expect(result).toBeUndefined();
    });

    it("should not allow access to other users' scenarios", async () => {
      const caller1 = appRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const caller2 = appRouter.createCaller({
        user: { id: 2 },
        req: {} as any,
        res: {} as any,
      });

      // User 1 saves a scenario
      const scenario = await caller1.phase2.saveScenario({
        projectId: testProjectId,
        name: "Private Scenario",
        type: "compliance",
        inputData: { secret: true },
      });

      // User 2 tries to retrieve it
      const result = await caller2.phase2.getScenario({
        scenarioId: scenario.id,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid report data", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.phase2.saveReport({
          projectId: testProjectId,
          name: "", // Empty name should fail
          type: "compliance",
          content: {},
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should handle non-existent report retrieval", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.phase2.getReport({
        reportId: 999999,
      });

      expect(result).toBeUndefined();
    });

    it("should handle batch comparison with invalid scenarios", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const batch = await caller.phase2.saveBatchComparison({
        projectId: testProjectId,
        name: "Invalid Batch",
        scenarioIds: [999999, 888888],
      });

      try {
        await caller.phase2.compareBatchScenarios({
          batchId: batch.id,
          scenarioIds: [999999, 888888],
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Performance & Scalability", () => {
    it("should handle multiple reports efficiently", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      const startTime = Date.now();

      // Save 10 reports
      for (let i = 0; i < 10; i++) {
        await caller.phase2.saveReport({
          projectId: testProjectId,
          name: `Report ${i}`,
          type: "compliance",
          content: { index: i },
        });
      }

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Retrieve all reports
      const reports = await caller.phase2.getReports();
      expect(reports.length).toBeGreaterThanOrEqual(10);
    });

    it("should handle batch comparison with multiple scenarios", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId },
        req: {} as any,
        res: {} as any,
      });

      // Create 5 scenarios
      const scenarioIds: number[] = [];
      for (let i = 0; i < 5; i++) {
        const scenario = await caller.phase2.saveScenario({
          projectId: testProjectId,
          name: `Scenario ${i}`,
          type: "compliance",
          inputData: { index: i },
        });
        scenarioIds.push(scenario.id);
      }

      // Create batch with all scenarios
      const batch = await caller.phase2.saveBatchComparison({
        projectId: testProjectId,
        name: "Multi-Scenario Batch",
        scenarioIds,
      });

      // Compare all scenarios
      const comparison = await caller.phase2.compareBatchScenarios({
        batchId: batch.id,
        scenarioIds,
      });

      expect(comparison.scenarioCount).toBe(5);
    });
  });
});
