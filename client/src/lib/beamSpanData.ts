/**
 * Beam Span Data based on NBC 2020 Table 9.23.4.3
 * Maximum Spans for Steel Beams Supporting Floors in Dwelling Units
 * Assumes laterally supported top flanges and residential loading (1.9 kPa live + 0.5 kPa dead)
 */

export interface BeamSpanData {
  beamSize: string;
  twoStoreys: number; // span in meters
  oneStorey: number; // span in meters
}

// W-section steel beams (wide flange)
export const steelBeamSpans: BeamSpanData[] = [
  { beamSize: "W150 × 13", twoStoreys: 2.4, oneStorey: 3.4 },
  { beamSize: "W150 × 18", twoStoreys: 2.9, oneStorey: 4.1 },
  { beamSize: "W150 × 22", twoStoreys: 3.2, oneStorey: 4.5 },
  { beamSize: "W200 × 15", twoStoreys: 2.9, oneStorey: 4.1 },
  { beamSize: "W200 × 22", twoStoreys: 3.6, oneStorey: 5.1 },
  { beamSize: "W200 × 27", twoStoreys: 4.0, oneStorey: 5.6 },
  { beamSize: "W250 × 18", twoStoreys: 3.4, oneStorey: 4.8 },
  { beamSize: "W250 × 22", twoStoreys: 3.8, oneStorey: 5.4 },
  { beamSize: "W250 × 28", twoStoreys: 4.3, oneStorey: 6.0 },
  { beamSize: "W250 × 33", twoStoreys: 4.7, oneStorey: 6.6 },
  { beamSize: "W310 × 21", twoStoreys: 3.9, oneStorey: 5.5 },
  { beamSize: "W310 × 24", twoStoreys: 4.2, oneStorey: 5.9 },
  { beamSize: "W310 × 28", twoStoreys: 4.5, oneStorey: 6.3 },
  { beamSize: "W310 × 33", twoStoreys: 4.9, oneStorey: 6.9 },
  { beamSize: "W310 × 39", twoStoreys: 5.4, oneStorey: 7.6 },
];

// Built-up wood beams (multiple 38mm members)
export interface WoodBeamSpanData {
  beamSize: string; // e.g., "2-2x8", "3-2x10"
  species: string;
  grade: string;
  supportingOneFloor: number; // span in meters
  supportingTwoFloors: number; // span in meters
}

export const woodBeamSpans: WoodBeamSpanData[] = [
  // Douglas Fir-Larch, Select Structural
  { beamSize: "2-2×8", species: "Douglas Fir-Larch", grade: "Select Structural", supportingOneFloor: 3.2, supportingTwoFloors: 2.3 },
  { beamSize: "2-2×10", species: "Douglas Fir-Larch", grade: "Select Structural", supportingOneFloor: 4.1, supportingTwoFloors: 2.9 },
  { beamSize: "2-2×12", species: "Douglas Fir-Larch", grade: "Select Structural", supportingOneFloor: 4.9, supportingTwoFloors: 3.5 },
  { beamSize: "3-2×8", species: "Douglas Fir-Larch", grade: "Select Structural", supportingOneFloor: 3.9, supportingTwoFloors: 2.8 },
  { beamSize: "3-2×10", species: "Douglas Fir-Larch", grade: "Select Structural", supportingOneFloor: 5.0, supportingTwoFloors: 3.6 },
  { beamSize: "3-2×12", species: "Douglas Fir-Larch", grade: "Select Structural", supportingOneFloor: 6.0, supportingTwoFloors: 4.3 },
  
  // Douglas Fir-Larch, No. 1/No. 2
  { beamSize: "2-2×8", species: "Douglas Fir-Larch", grade: "No. 1/No. 2", supportingOneFloor: 2.8, supportingTwoFloors: 2.0 },
  { beamSize: "2-2×10", species: "Douglas Fir-Larch", grade: "No. 1/No. 2", supportingOneFloor: 3.6, supportingTwoFloors: 2.6 },
  { beamSize: "2-2×12", species: "Douglas Fir-Larch", grade: "No. 1/No. 2", supportingOneFloor: 4.3, supportingTwoFloors: 3.1 },
  { beamSize: "3-2×8", species: "Douglas Fir-Larch", grade: "No. 1/No. 2", supportingOneFloor: 3.5, supportingTwoFloors: 2.5 },
  { beamSize: "3-2×10", species: "Douglas Fir-Larch", grade: "No. 1/No. 2", supportingOneFloor: 4.4, supportingTwoFloors: 3.1 },
  { beamSize: "3-2×12", species: "Douglas Fir-Larch", grade: "No. 1/No. 2", supportingOneFloor: 5.3, supportingTwoFloors: 3.8 },
  
  // Spruce-Pine-Fir, Select Structural
  { beamSize: "2-2×8", species: "Spruce-Pine-Fir", grade: "Select Structural", supportingOneFloor: 2.9, supportingTwoFloors: 2.1 },
  { beamSize: "2-2×10", species: "Spruce-Pine-Fir", grade: "Select Structural", supportingOneFloor: 3.7, supportingTwoFloors: 2.6 },
  { beamSize: "2-2×12", species: "Spruce-Pine-Fir", grade: "Select Structural", supportingOneFloor: 4.5, supportingTwoFloors: 3.2 },
  { beamSize: "3-2×8", species: "Spruce-Pine-Fir", grade: "Select Structural", supportingOneFloor: 3.6, supportingTwoFloors: 2.6 },
  { beamSize: "3-2×10", species: "Spruce-Pine-Fir", grade: "Select Structural", supportingOneFloor: 4.6, supportingTwoFloors: 3.3 },
  { beamSize: "3-2×12", species: "Spruce-Pine-Fir", grade: "Select Structural", supportingOneFloor: 5.5, supportingTwoFloors: 3.9 },
  
  // Spruce-Pine-Fir, No. 1/No. 2
  { beamSize: "2-2×8", species: "Spruce-Pine-Fir", grade: "No. 1/No. 2", supportingOneFloor: 2.6, supportingTwoFloors: 1.8 },
  { beamSize: "2-2×10", species: "Spruce-Pine-Fir", grade: "No. 1/No. 2", supportingOneFloor: 3.3, supportingTwoFloors: 2.3 },
  { beamSize: "2-2×12", species: "Spruce-Pine-Fir", grade: "No. 1/No. 2", supportingOneFloor: 3.9, supportingTwoFloors: 2.8 },
  { beamSize: "3-2×8", species: "Spruce-Pine-Fir", grade: "No. 1/No. 2", supportingOneFloor: 3.2, supportingTwoFloors: 2.3 },
  { beamSize: "3-2×10", species: "Spruce-Pine-Fir", grade: "No. 1/No. 2", supportingOneFloor: 4.0, supportingTwoFloors: 2.9 },
  { beamSize: "3-2×12", species: "Spruce-Pine-Fir", grade: "No. 1/No. 2", supportingOneFloor: 4.8, supportingTwoFloors: 3.4 },
];

export const beamTypeOptions = [
  { value: "steel", label: "Steel Beams (W-sections)" },
  { value: "wood", label: "Built-up Wood Beams" }
];

export const woodSpeciesOptions = [
  "Douglas Fir-Larch",
  "Spruce-Pine-Fir"
];

export const woodGradeOptions = [
  "Select Structural",
  "No. 1/No. 2"
];

export const loadingConditionOptions = [
  { value: "one-floor", label: "Supporting One Floor" },
  { value: "two-floors", label: "Supporting Two Floors" }
];

export function getSteelBeamSpan(beamSize: string, loadingCondition: string): number | null {
  const beam = steelBeamSpans.find(b => b.beamSize === beamSize);
  if (!beam) return null;
  
  return loadingCondition === "two-floors" ? beam.twoStoreys : beam.oneStorey;
}

export function getWoodBeamSpan(
  beamSize: string,
  species: string,
  grade: string,
  loadingCondition: string
): number | null {
  const beam = woodBeamSpans.find(
    b => b.beamSize === beamSize && b.species === species && b.grade === grade
  );
  if (!beam) return null;
  
  return loadingCondition === "two-floors" ? beam.supportingTwoFloors : beam.supportingOneFloor;
}

export function getAvailableWoodBeamSizes(species: string, grade: string): string[] {
  const sizes = woodBeamSpans
    .filter(b => b.species === species && b.grade === grade)
    .map(b => b.beamSize);
  return Array.from(new Set(sizes));
}
