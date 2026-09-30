import { describe, expect, it } from "vitest";
import { getNonPositiveHomeFields, parseHomeNumberInput } from "@/lib/homeFormValidation";

describe("home form numeric validation", () => {
  it("preserves an explicitly typed zero", () => {
    expect(parseHomeNumberInput("0")).toBe(0);
    expect(parseHomeNumberInput("")).toBe("");
  });

  it("blocks only the positive-constrained spatial fields", () => {
    expect(getNonPositiveHomeFields({ limitingDistanceM: -1 })).toEqual(["Limiting distance"]);
    expect(getNonPositiveHomeFields({ exposingFaceAreaM2: 0 })).toEqual(["Exposing face area"]);
    expect(getNonPositiveHomeFields({ totalOpeningAreaM2: 0, bedroomCount: 0 })).toEqual([]);
  });
});
