import { describe, expect, it } from "vitest";
import { runCalculatorOrchestrator } from "../services/calculatorOrchestrator";

const baseInput = {
  rooms: [{ label: "Living Room", occupancyGroup: "C", areaM2: 100 }],
  windows: [],
  travelDistanceResults: [],
  storeys: 2,
  sprinklered: false,
  province: "AB",
  calibrationConfidence: "high" as const,
  projectId: 9001,
};

describe("FRR compliance requirement candidates", () => {
  it("emits Group C FRR and an occupancy prerequisite", () => {
    const result = runCalculatorOrchestrator(baseInput, "AB");
    const frr = result.complianceRequirements.find(r => r.requirementType === "orchestrator-frr.fire-separation");
    const prerequisite = result.complianceRequirements.find(r => r.requirementType === "orchestrator-frr.occupancy-fact");

    expect(frr).toMatchObject({
      provisionRef: "NBC(AE) 2023 s.9.10.9.16",
      requiredValue: { value: 45, unit: "min" },
      status: "insufficient-evidence",
      actualValue: null,
    });
    expect(frr?.triggeredBy.length).toBeGreaterThan(0);
    expect(frr?.dependsOnKeys).toContain(
      `orchestrator-frr.occupancy-fact:NBC 3.1.3.1:DwellingUnit:project:9001:group:C`,
    );
    expect(prerequisite?.triggeredBy).toEqual([{ fact: "room.occupancyGroup", value: "C" }]);
  });

  it("emits the non-Group-C FRR requirement with insufficient evidence", () => {
    const result = runCalculatorOrchestrator({
      ...baseInput,
      rooms: [{ label: "Office", occupancyGroup: "D", areaM2: 80 }],
    }, "AB");
    const frr = result.complianceRequirements.find(r => r.requirementType === "orchestrator-frr.fire-separation");
    expect(frr?.requiredValue).toEqual({ value: 45, unit: "min" });
    expect(frr?.status).toBe("insufficient-evidence");
  });

  it("emits Stack Planner separation facts and a dependent requirement", () => {
    const result = runCalculatorOrchestrator({
      ...baseInput,
      stackSeparations: [{ from: "C", to: "B-3", frr: "2 hr", hours: 2, nbcRef: "NBC 3.1.3.1" }],
    }, "AB");
    const fact = result.complianceRequirements.find(r => r.requirementType === "orchestrator-frr.stack-fact");
    const separation = result.complianceRequirements.find(r => r.requirementType === "orchestrator-frr.stack-separation");
    expect(fact?.triggeredBy).toEqual([
      { fact: "stack.from", value: "C" },
      { fact: "stack.to", value: "B-3" },
    ]);
    expect(separation).toMatchObject({
      provisionRef: "NBC 3.1.3.1",
      requiredValue: { value: 120, unit: "min" },
      actualValue: null,
      status: "insufficient-evidence",
    });
    expect(separation?.dependsOnKeys?.[0]).toContain("orchestrator-frr.stack-fact");
  });
});
