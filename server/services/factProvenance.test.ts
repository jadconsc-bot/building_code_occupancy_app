import { describe, expect, it, vi } from "vitest";
import { readProvenancedFact, userConfirmedFact } from "./factProvenance";

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

describe("fact provenance reader", () => {
  it("returns a valid wrapper without falling back", () => {
    expect(readProvenancedFact({
      wrapper: { value: 3, confirmed: true, source: "user-confirmed" },
      scalar: 1,
      field: "bedroomCount",
      entityType: "project",
      entityId: 10,
      isValue: isNumber,
    })).toEqual({ value: 3, confirmed: true, source: "user-confirmed", usedFallback: false });
  });

  it("falls back to the scalar and logs server-side for an invalid wrapper", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(readProvenancedFact({
      wrapper: { value: "3", confirmed: true, source: "user-confirmed" },
      scalar: 2,
      field: "bedroomCount",
      entityType: "project",
      entityId: 10,
      isValue: isNumber,
    })).toEqual({ value: 2, confirmed: false, source: null, usedFallback: true });
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('"field":"bedroomCount"'));
    warning.mockRestore();
  });

  it("returns a null fallback without logging when both values are absent", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(readProvenancedFact({
      wrapper: null,
      scalar: null,
      field: "totalDwellingUnits",
      entityType: "project",
      entityId: 10,
      isValue: isNumber,
    })).toEqual({ value: null, confirmed: false, source: null, usedFallback: true });
    expect(warning).not.toHaveBeenCalled();
    warning.mockRestore();
  });

  it("creates the approved user-confirmed shape", () => {
    expect(userConfirmedFact(true)).toEqual({ value: true, confirmed: true, source: "user-confirmed" });
  });
});
