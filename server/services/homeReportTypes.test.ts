import { describe, expect, it } from "vitest";
import { groupComplianceItems, selectHomeReportDiagrams } from "./homeReportTypes";

describe("home report item grouping", () => {
  it("puts failures first, conditionals in Needs Your Input, and N/A in the compact list", () => {
    const grouped = groupComplianceItems([
      { ruleId: "p", title: "Passed", result: "pass", message: "ok" },
      { ruleId: "n", title: "Not applicable", result: "not_applicable", message: "skip" },
      { ruleId: "c", title: "Conditional", result: "conditional", message: "confirm" },
      { ruleId: "f", title: "Failed", result: "fail", message: "fix" },
    ]);
    expect(grouped.resolved.map((item) => item.ruleId)).toEqual(["f", "p"]);
    expect(grouped.needsInput.map((item) => item.ruleId)).toEqual(["c"]);
    expect(grouped.notApplicable.map((item) => item.ruleId)).toEqual(["n"]);
  });

  it("selects only diagrams for applicable fired rules", () => {
    const selected = selectHomeReportDiagrams([
      { ruleId: "P9-EGRESS-DIM-NATIONAL", title: "Egress", result: "pass", message: "ok" },
      { ruleId: "P9-WELL-PROJECTION", title: "Well", result: "not_applicable", message: "skip" },
      { ruleId: "P9-SPATIAL-INDIVIDUAL-OPENING", title: "Opening", result: "conditional", message: "confirm" },
      { ruleId: "P9-PLUMB-BACKWATER", title: "Backwater", result: "fail", message: "fix" },
    ]);
    expect(selected.map((diagram) => diagram.file)).toEqual([
      "egress-window.png",
      "limiting-distance.png",
      "backwater-valve.png",
    ]);
  });

  it("returns no visual page inputs when all matching rules are N/A", () => {
    expect(selectHomeReportDiagrams([
      { ruleId: "P9-EGRESS-DIM-NATIONAL", title: "Egress", result: "not_applicable", message: "skip" },
    ])).toEqual([]);
  });
});
