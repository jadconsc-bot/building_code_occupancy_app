import { describe, expect, it } from "vitest";
import { getReportRelevantBlankSummary } from "../lib/homeReportCompleteness";

describe("home report review completeness", () => {
  it("counts only report-relevant optional fields and their affected checks", () => {
    const result = getReportRelevantBlankSummary(
      ["suiteToilets", "suiteSinks", "hasKitchenGFCI", "municipality", "ceilingHeightFt"],
      { suiteToilets: 1, municipality: "Victoria", ceilingHeightFt: 6.5 },
    );
    expect(result.blankKeys).toEqual(["suiteSinks", "hasKitchenGFCI"]);
    expect(result.blankCount).toBe(2);
    expect(result.affectedUnresolvedChecks).toBe(5);
  });

  it("does not count unrelated optional answers", () => {
    const result = getReportRelevantBlankSummary(["municipality", "suiteAreaSqFt"], {});
    expect(result.blankCount).toBe(0);
    expect(result.affectedUnresolvedChecks).toBe(0);
  });
});
