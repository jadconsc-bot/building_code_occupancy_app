import { describe, expect, it, vi } from "vitest";
import dotenv from "dotenv";
import { and, desc, eq } from "drizzle-orm";

vi.unmock("../db");
dotenv.config({ path: ".env.local" });
const live = process.env.RUN_LIVE_DB_TESTS === "1";

describe.skipIf(!live)("CIM FRR graph live router round-trip", () => {
  it("persists, no-ops, and supersedes FRR snapshots through the real router", async () => {
    const { appRouter } = await import("../routers");
    const { getDb } = await import("../db");
    const {
      projects, drawingAnalyses, drawingPages, detectedRooms,
      complianceRequirements, requirementDependencies,
      complianceRequirementSnapshots, complianceResults,
    } = await import("../../drizzle/schema");

    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = 1240;
    const [projectInsert] = await db.insert(projects).values({
      userId,
      name: `CIM FRR graph test ${Date.now()}`,
      occupancyCode: "C",
      grossFloorArea: "100.00",
      storeys: 2,
      province: "AB",
    });
    const projectId = Number(projectInsert.insertId);
    let analysisId: number | undefined;
    let pageId: number | undefined;
    let roomId: number | undefined;

    try {
      const [analysisInsert] = await db.insert(drawingAnalyses).values({
        projectId, userId, analysisType: "cim-frr-live", fileType: "png",
      } as any);
      analysisId = Number(analysisInsert.insertId);
      const [pageInsert] = await db.insert(drawingPages).values({
        drawingId: analysisId, pageNumber: 1, widthPx: 1000, heightPx: 1000,
      });
      pageId = Number(pageInsert.insertId);
      const [roomInsert] = await db.insert(detectedRooms).values({
        pageId, projectId, roomLabel: "Bedroom 1", boundingBoxJson: { x: 0, y: 0, width: 100, height: 100 },
        areaSqm: "100.00", occupancyGroup: "C", spaceType: "room", detectionMethod: "flood_fill",
      } as any);
      roomId = Number(roomInsert.insertId);
      await db.insert(complianceResults).values({
        projectId, roomId, ruleReference: "NBC test", ruleCategory: "room-adjacency",
        ruleText: "Existing room evaluator row", status: "pass",
        actualValue: "ok", requiredValue: "ok", constraintId: "room.test.preserved",
      } as any);

      const caller = appRouter.createCaller({ user: { id: userId }, req: {}, res: {} } as any);
      const input = {
        drawingPageId: pageId,
        rooms: [{ label: "Bedroom 1", occupancyGroup: "C", areaM2: 100 }],
        windows: [], travelDistanceResults: [], storeys: 2, sprinklered: false,
        province: "AB", calibrationConfidence: "high" as const,
      };

      const first = await caller.drawingAnalysis.runCalculatorOrchestrator(input);
      const firstSnapshots = await db.select().from(complianceRequirementSnapshots).where(and(
        eq(complianceRequirementSnapshots.projectId, projectId),
        eq(complianceRequirementSnapshots.scope, "frr"),
      ));
      const firstRequirements = await db.select().from(complianceRequirements).where(eq(complianceRequirements.projectId, projectId));
      const firstDependencies = await db.select().from(requirementDependencies).where(eq(requirementDependencies.projectId, projectId));
      const firstProjection = await db.select().from(complianceResults).where(and(eq(complianceResults.projectId, projectId), eq(complianceResults.ruleCategory, "orchestrator-frr")));
      const adjacencyRows = await db.select().from(complianceResults).where(and(eq(complianceResults.projectId, projectId), eq(complianceResults.roomId, roomId)));
      const occupantLoadSnapshots = await db.select().from(complianceRequirementSnapshots).where(and(
        eq(complianceRequirementSnapshots.projectId, projectId),
        eq(complianceRequirementSnapshots.scope, "occupant-load"),
      ));
      const washroomSnapshots = await db.select().from(complianceRequirementSnapshots).where(and(
        eq(complianceRequirementSnapshots.projectId, projectId),
        eq(complianceRequirementSnapshots.scope, "washroom-count"),
      ));
      const washroomRequirement = firstRequirements.find(r => r.requirementType === "orchestrator-washroom-count.determination");
      const washroomDependencies = washroomRequirement
        ? await db.select().from(requirementDependencies).where(and(
            eq(requirementDependencies.projectId, projectId),
            eq(requirementDependencies.requirementId, washroomRequirement.id),
          ))
        : [];
      const dependedOn = washroomDependencies.length > 0
        ? await db.select().from(complianceRequirements).where(eq(complianceRequirements.id, washroomDependencies[0].dependsOnRequirementId))
        : [];
      expect(first.complianceGraph.created).toBe(true);
      expect(firstSnapshots).toHaveLength(1);
      expect(firstRequirements.some(r => r.requirementType === "orchestrator-frr.fire-separation")).toBe(true);
      expect(occupantLoadSnapshots).toHaveLength(1);
      expect(firstRequirements.some(r => r.requirementType === "orchestrator-occupant-load.determination")).toBe(true);
      expect(washroomSnapshots).toHaveLength(1);
      expect(washroomRequirement).toBeDefined();
      expect(washroomDependencies.length).toBeGreaterThan(0);
      expect(dependedOn[0]?.requirementType).toBe("orchestrator-occupant-load.determination");
      expect(firstDependencies.length).toBeGreaterThan(0);
      expect(firstProjection.length).toBeGreaterThan(0);

      const second = await caller.drawingAnalysis.runCalculatorOrchestrator(input);
      const secondSnapshots = await db.select().from(complianceRequirementSnapshots).where(and(
        eq(complianceRequirementSnapshots.projectId, projectId),
        eq(complianceRequirementSnapshots.scope, "frr"),
      ));
      const secondRequirements = await db.select().from(complianceRequirements).where(eq(complianceRequirements.projectId, projectId));
      expect(second.complianceGraph.created).toBe(false);
      expect(secondSnapshots).toHaveLength(firstSnapshots.length);
      expect(secondRequirements).toHaveLength(firstRequirements.length);

      const changed = await caller.drawingAnalysis.runCalculatorOrchestrator({
        ...input,
        stackSeparations: [{ from: "C", to: "B-3", frr: "1 hr", hours: 1, nbcRef: "NBC 3.1.3.1" }],
      });
      const finalSnapshots = await db.select().from(complianceRequirementSnapshots).where(and(
        eq(complianceRequirementSnapshots.projectId, projectId),
        eq(complianceRequirementSnapshots.scope, "frr"),
      )).orderBy(desc(complianceRequirementSnapshots.snapshotVersion));
      const finalRequirements = await db.select().from(complianceRequirements).where(eq(complianceRequirements.projectId, projectId));
      const finalDependencies = await db.select().from(requirementDependencies).where(eq(requirementDependencies.projectId, projectId));
      const finalProjection = await db.select().from(complianceResults).where(and(eq(complianceResults.projectId, projectId), eq(complianceResults.ruleCategory, "orchestrator-frr")));
      expect(changed.complianceGraph.created).toBe(true);
      expect(finalSnapshots[0]?.snapshotVersion).toBe(2);
      expect(finalRequirements.some(r => r.supersedes)).toBe(true);
      expect(finalDependencies.length).toBeGreaterThan(0);
      expect(finalProjection.length).toBeGreaterThan(0);
      const preservedAdjacency = await db.select().from(complianceResults).where(eq(complianceResults.constraintId, "room.test.preserved"));
      expect(adjacencyRows.every(r => r.ruleCategory !== "orchestrator-frr")).toBe(true);
      expect(preservedAdjacency).toHaveLength(1);
      expect(changed.complianceGraph.requirements.some(r => r.dependsOn.length > 0)).toBe(true);
      expect(changed.complianceGraph.requirements.some(r => r.dependents.length > 0)).toBe(true);
      expect(firstRequirements.find(r => r.requirementType === "orchestrator-frr.fire-separation")?.actualValue).toBeNull();

      console.log("[CIM live]", {
        projectId, firstSnapshot: firstSnapshots[0], finalSnapshot: finalSnapshots[0],
        requirementCount: finalRequirements.length, dependencyCount: finalDependencies.length,
        graphProjection: finalProjection,
      });
    } finally {
      await db.delete(requirementDependencies).where(eq(requirementDependencies.projectId, projectId));
      await db.delete(complianceRequirements).where(eq(complianceRequirements.projectId, projectId));
      await db.delete(complianceRequirementSnapshots).where(eq(complianceRequirementSnapshots.projectId, projectId));
      await db.delete(complianceResults).where(eq(complianceResults.projectId, projectId));
      if (roomId) await db.delete(detectedRooms).where(eq(detectedRooms.id, roomId));
      if (pageId) await db.delete(drawingPages).where(eq(drawingPages.id, pageId));
      if (analysisId) await db.delete(drawingAnalyses).where(eq(drawingAnalyses.id, analysisId));
      await db.delete(projects).where(eq(projects.id, projectId));
    }
  }, 120000);
});
