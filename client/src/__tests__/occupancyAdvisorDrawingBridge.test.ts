import { describe, expect, it } from "vitest";
import { summarizeDrawingForOccupancyAdvisor } from "@shared/occupancyAdvisorDrawingBridge";

describe("summarizeDrawingForOccupancyAdvisor", () => {
  it("aggregates all rooms and uses the first non-site page as the footprint", () => {
    const result = summarizeDrawingForOccupancyAdvisor(
      [
        { pageId: 2, areaSqm: 80, occupancyGroup: "C" },
        { pageId: 3, areaSqm: 40, occupancyGroup: "A" },
        { pageId: 1, areaSqm: 10, occupancyGroup: "site" },
      ],
      [
        { pageId: 1, pageNumber: 1, pageType: "site_plan" },
        { pageId: 2, pageNumber: 2, pageType: "floor_plan" },
        { pageId: 3, pageNumber: 3, pageType: "floor_plan" },
      ],
    );
    expect(result.estimatedArea).toBe(130);
    expect(result.estimatedFootprint).toBe(80);
    expect(result.storeys).toBe(2);
    expect(result.isMixedUse).toBe(true);
    expect(result.primaryUse).toBe("C");
  });

  it("does not shrink an existing larger storey count", () => {
    const result = summarizeDrawingForOccupancyAdvisor([{ pageId: 1, areaSqm: 50, occupancyGroup: "C" }], [], 4);
    expect(result.storeys).toBe(4);
    expect(result.storeysHeuristic).toBe(false);
  });
});
