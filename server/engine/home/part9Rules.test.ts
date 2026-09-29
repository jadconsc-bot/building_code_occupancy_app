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

  it("evaluates Alberta beam clearance for secondary suites", () => {
    const missing = evaluateHomeCompliance(answers({ province: "AB", lowestBeamClearanceFt: undefined }))
      .find((item) => item.ruleId === "P9-CEILING-AB-BEAM");
    const pass = evaluateHomeCompliance(answers({ province: "AB", lowestBeamClearanceFt: 6.1 }))
      .find((item) => item.ruleId === "P9-CEILING-AB-BEAM");
    const fail = evaluateHomeCompliance(answers({ province: "AB", lowestBeamClearanceFt: 6 }))
      .find((item) => item.ruleId === "P9-CEILING-AB-BEAM");
    expect(missing?.result).toBe("not_applicable");
    expect(pass?.result).toBe("pass");
    expect(fail?.result).toBe("fail");
    expect(pass?.codeReference).toBe("NBC(AE) 2023 s.9.5.3.1(3)");
  });

  it("evaluates Alberta secondary-suite doorway height", () => {
    const missing = evaluateHomeCompliance(answers({ province: "AB", suiteDoorHeightMm: undefined }))
      .find((item) => item.ruleId === "P9-DOOR-HEIGHT-AB");
    const pass = evaluateHomeCompliance(answers({ province: "AB", suiteDoorHeightMm: 1890 }))
      .find((item) => item.ruleId === "P9-DOOR-HEIGHT-AB");
    const fail = evaluateHomeCompliance(answers({ province: "AB", suiteDoorHeightMm: 1889 }))
      .find((item) => item.ruleId === "P9-DOOR-HEIGHT-AB");
    expect(missing?.result).toBe("not_applicable");
    expect(pass?.result).toBe("pass");
    expect(fail?.result).toBe("fail");
    expect(fail?.codeReference).toContain("9.5.5.1(2)");
  });

  it("applies both optional Alberta checks to basement developments", () => {
    const result = evaluateHomeCompliance(answers({
      province: "AB",
      projectType: "basement_development",
      lowestBeamClearanceFt: 6.1,
      suiteDoorHeightMm: 1890,
    }));
    expect(result.find((item) => item.ruleId === "P9-CEILING-AB-BEAM")?.result).toBe("pass");
    expect(result.find((item) => item.ruleId === "P9-DOOR-HEIGHT-AB")?.result).toBe("pass");
  });
});
