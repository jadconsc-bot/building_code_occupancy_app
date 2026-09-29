import { describe, expect, it } from "vitest";
import { groupComplianceItems } from "./homeReportTypes";

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
});
