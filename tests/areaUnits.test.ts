import { describe, expect, it } from "vitest";
import { formatArea, fromSquareMeters, toSquareMeters } from "@/lib/areaUnits";
import { determineBuildingPart } from "../server/engine/buildingPartDetermination";

describe("area unit conversion", () => {
  it("preserves the 600 m² / 6458.34 ft² boundary", () => {
    expect(fromSquareMeters(600, "ft2")).toBeCloseTo(6458.34, 2);
    expect(toSquareMeters(6458.34, "ft2")).toBeCloseTo(600, 10);
  });

  it("keeps a value just over the boundary above 600 m²", () => {
    const footprintM2 = toSquareMeters(6458.35, "ft2");
    expect(footprintM2).toBeGreaterThan(600);
    expect(determineBuildingPart({ footprintM2, storeys: 2, occupancyGroup: "C" }).determination).toBe("Part 3");
  });

  it("produces the same canonical stored value regardless of entry unit", () => {
    expect(toSquareMeters(fromSquareMeters(418, "ft2"), "ft2")).toBeCloseTo(418, 10);
  });

  it("formats only at the display boundary", () => {
    expect(formatArea(418, "ft2", 2)).toBe("4499.31");
    expect(toSquareMeters(4499.31, "ft2")).toBeCloseTo(418, 2);
  });
});
