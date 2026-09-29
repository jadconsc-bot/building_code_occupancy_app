import { describe, expect, it } from "vitest";
import { evaluateHomeCompliance, type HomeFormAnswers } from "./part9Rules";

function answers(overrides: Partial<HomeFormAnswers> = {}): HomeFormAnswers {
  return {
    province: "BC",
    projectType: "secondary_suite",
    ceilingHeightFt: 6.5,
    ...overrides,
  };
}

describe("Part 9 home rules", () => {
  it("uses 1.95m for BC secondary suites", () => {
    const result = evaluateHomeCompliance(answers({ ceilingHeightFt: 6.5 }));
    const rule = result.find((item) => item.ruleId === "P9-CEILING-BC-SUITE");
    expect(rule?.result).toBe("pass");
    expect(rule?.plainLanguage).toContain("1.95m");
  });

  it("uses 2.1m for BC basement developments", () => {
    const result = evaluateHomeCompliance(answers({ projectType: "basement_development", ceilingHeightFt: 6.8 }));
    const rule = result.find((item) => item.ruleId === "P9-CEILING-BC-BASEMENT");
    expect(rule?.result).toBe("fail");
    expect(rule?.plainLanguage).toContain("2.1m");
  });

  it("returns a conditional individual-opening review with nearest anchors", () => {
    const result = evaluateHomeCompliance(answers({ limitingDistanceM: 1.7, totalOpeningAreaM2: 1.2 }));
    const rule = result.find((item) => item.ruleId === "P9-SPATIAL-INDIVIDUAL-OPENING");
    expect(rule?.result).toBe("conditional");
    expect(rule?.plainLanguage).toContain("1.5m → 0.78m²");
    expect(rule?.plainLanguage).toContain("2m → 1.88m²");
  });

  it("does not add the individual-opening review at 2m or above", () => {
    const result = evaluateHomeCompliance(answers({ limitingDistanceM: 2, totalOpeningAreaM2: 1 }));
    const rule = result.find((item) => item.ruleId === "P9-SPATIAL-INDIVIDUAL-OPENING");
    expect(rule?.result).toBe("not_applicable");
  });
});
