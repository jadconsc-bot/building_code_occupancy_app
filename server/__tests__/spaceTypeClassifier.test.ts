import { describe, expect, it } from "vitest";
import { inferSpaceTypeFromLabel } from "../engine/spatial/spaceTypeClassifier";

describe("inferSpaceTypeFromLabel", () => {
  it.each([
    ["Double Garage", "garage"],
    ["Concrete Driveway", "exterior"],
    ["Concrete Landing", "exterior"],
    ["CONC. PATIO", "exterior"],
    ["Stair Landing", "stairwell"],
    ["Stairwell", "stairwell"],
    ["Main Corridor", "corridor"],
    ["Hallway", "corridor"],
    ["WIC", "closet"],
    ["Walk-in Closet", "closet"],
    ["Storage Room", "storage"],
    ["Mechanical Room", "mechanical"],
    ["Vestibule", "vestibule"],
    ["Lobby", "lobby"],
    ["Bedroom 3", "room"],
  ])('classifies "%s" as %s', (label, expected) => {
    expect(inferSpaceTypeFromLabel(label)).toBe(expected);
  });
});
