// NBC Table 9.23.4.2-A: Maximum Spans for Floor Joists - General Capacity
// Forming Part of Sentences 9.23.4.2.(1) and 9.23.4.2.(1) to (3)

export interface FloorJoistSpanData {
  species: string;
  grade: string;
  joistSize: string;
  spacing300: number; // mm spacing, span in meters
  spacing400: number;
  spacing600: number;
}

export const floorJoistSpans: FloorJoistSpanData[] = [
  // Douglas Fir - Larch (Select Structural)
  { species: "Douglas Fir - Larch", grade: "Select Structural", joistSize: "38 x 89", spacing300: 2.16, spacing400: 1.99, spacing600: 1.73 },
  { species: "Douglas Fir - Larch", grade: "Select Structural", joistSize: "38 x 140", spacing300: 3.39, spacing400: 3.12, spacing600: 2.73 },
  { species: "Douglas Fir - Larch", grade: "Select Structural", joistSize: "38 x 184", spacing300: 4.46, spacing400: 4.11, spacing600: 3.59 },
  { species: "Douglas Fir - Larch", grade: "Select Structural", joistSize: "38 x 235", spacing300: 5.69, spacing400: 5.24, spacing600: 4.58 },
  { species: "Douglas Fir - Larch", grade: "Select Structural", joistSize: "38 x 286", spacing300: 6.92, spacing400: 6.37, spacing600: 5.57 },
  
  // Douglas Fir - Larch (No. 1 and No. 2)
  { species: "Douglas Fir - Larch", grade: "No. 1 and No. 2", joistSize: "38 x 89", spacing300: 2.08, spacing400: 1.83, spacing600: 1.57 },
  { species: "Douglas Fir - Larch", grade: "No. 1 and No. 2", joistSize: "38 x 140", spacing300: 3.18, spacing400: 3.03, spacing600: 2.69 },
  { species: "Douglas Fir - Larch", grade: "No. 1 and No. 2", joistSize: "38 x 184", spacing300: 4.42, spacing400: 3.99, spacing600: 3.54 },
  { species: "Douglas Fir - Larch", grade: "No. 1 and No. 2", joistSize: "38 x 235", spacing300: 5.50, spacing400: 5.09, spacing600: 4.53 },
  { species: "Douglas Fir - Larch", grade: "No. 1 and No. 2", joistSize: "38 x 286", spacing300: 6.25, spacing400: 5.24, spacing600: 4.78 },
  
  // Hem - Fir (Select Structural)
  { species: "Hem - Fir", grade: "Select Structural", joistSize: "38 x 89", spacing300: 2.16, spacing400: 1.98, spacing600: 1.71 },
  { species: "Hem - Fir", grade: "Select Structural", joistSize: "38 x 140", spacing300: 3.39, spacing400: 3.08, spacing600: 2.69 },
  { species: "Hem - Fir", grade: "Select Structural", joistSize: "38 x 184", spacing300: 4.42, spacing400: 4.05, spacing600: 3.54 },
  { species: "Hem - Fir", grade: "Select Structural", joistSize: "38 x 235", spacing300: 5.57, spacing400: 5.17, spacing600: 4.51 },
  { species: "Hem - Fir", grade: "Select Structural", joistSize: "38 x 286", spacing300: 6.51, spacing400: 5.09, spacing600: 4.51 },
  
  // Hem - Fir (No. 1 and No. 2)
  { species: "Hem - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 89", spacing300: 2.08, spacing400: 1.83, spacing600: 1.57 },
  { species: "Hem - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 140", spacing300: 3.18, spacing400: 3.03, spacing600: 2.46 },
  { species: "Hem - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 184", spacing300: 4.16, spacing400: 3.89, spacing600: 3.46 },
  { species: "Hem - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 235", spacing300: 5.42, spacing400: 4.51, spacing600: 4.08 },
  { species: "Hem - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 286", spacing300: 5.14, spacing400: 5.24, spacing600: 4.36 },
  
  // Spruce - Pine - Fir (Select Structural)
  { species: "Spruce - Pine - Fir", grade: "Select Structural", joistSize: "38 x 89", spacing300: 2.05, spacing400: 1.81, spacing600: 1.64 },
  { species: "Spruce - Pine - Fir", grade: "Select Structural", joistSize: "38 x 140", spacing300: 3.23, spacing400: 2.85, spacing600: 2.57 },
  { species: "Spruce - Pine - Fir", grade: "Select Structural", joistSize: "38 x 184", spacing300: 4.24, spacing400: 3.74, spacing600: 3.38 },
  { species: "Spruce - Pine - Fir", grade: "Select Structural", joistSize: "38 x 235", spacing300: 5.41, spacing400: 4.76, spacing600: 4.31 },
  { species: "Spruce - Pine - Fir", grade: "Select Structural", joistSize: "38 x 286", spacing300: 6.58, spacing400: 5.79, spacing600: 5.24 },
  
  // Spruce - Pine - Fir (No. 1 and No. 2)
  { species: "Spruce - Pine - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 89", spacing300: 1.95, spacing400: 1.67, spacing600: 1.45 },
  { species: "Spruce - Pine - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 140", spacing300: 3.06, spacing400: 2.70, spacing600: 2.38 },
  { species: "Spruce - Pine - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 184", spacing300: 4.04, spacing400: 3.55, spacing600: 3.13 },
  { species: "Spruce - Pine - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 235", spacing300: 5.14, spacing400: 4.52, spacing600: 3.98 },
  { species: "Spruce - Pine - Fir", grade: "No. 1 and No. 2", joistSize: "38 x 286", spacing300: 6.25, spacing400: 5.49, spacing600: 4.84 },
  
  // Northern Species (Select Structural)
  { species: "Northern Species", grade: "Select Structural", joistSize: "38 x 89", spacing300: 1.85, spacing400: 1.67, spacing600: 1.45 },
  { species: "Northern Species", grade: "Select Structural", joistSize: "38 x 140", spacing300: 2.90, spacing400: 2.63, spacing600: 2.30 },
  { species: "Northern Species", grade: "Select Structural", joistSize: "38 x 184", spacing300: 3.82, spacing400: 3.46, spacing600: 3.03 },
  { species: "Northern Species", grade: "Select Structural", joistSize: "38 x 235", spacing300: 4.87, spacing400: 4.41, spacing600: 3.87 },
  { species: "Northern Species", grade: "Select Structural", joistSize: "38 x 286", spacing300: 5.92, spacing400: 5.36, spacing600: 4.71 },
  
  // Northern Species (No. 1 and No. 2)
  { species: "Northern Species", grade: "No. 1 and No. 2", joistSize: "38 x 89", spacing300: 1.77, spacing400: 1.53, spacing600: 1.33 },
  { species: "Northern Species", grade: "No. 1 and No. 2", joistSize: "38 x 140", spacing300: 2.77, spacing400: 2.41, spacing600: 2.08 },
  { species: "Northern Species", grade: "No. 1 and No. 2", joistSize: "38 x 184", spacing300: 3.65, spacing400: 3.17, spacing600: 2.74 },
  { species: "Northern Species", grade: "No. 1 and No. 2", joistSize: "38 x 235", spacing300: 4.65, spacing400: 4.04, spacing600: 3.49 },
  { species: "Northern Species", grade: "No. 1 and No. 2", joistSize: "38 x 286", spacing300: 5.65, spacing400: 4.91, spacing600: 4.24 },
];

export const speciesOptions = [
  "Douglas Fir - Larch",
  "Hem - Fir",
  "Spruce - Pine - Fir",
  "Northern Species"
];

export const gradeOptions = [
  "Select Structural",
  "No. 1 and No. 2"
];

export const joistSizeOptions = [
  "38 x 89",
  "38 x 140",
  "38 x 184",
  "38 x 235",
  "38 x 286"
];

export const spacingOptions = [
  { value: "300", label: "300mm (12\")" },
  { value: "400", label: "400mm (16\")" },
  { value: "600", label: "600mm (24\")" }
];

export function getFloorJoistSpan(
  species: string,
  grade: string,
  joistSize: string,
  spacing: string
): number | null {
  const data = floorJoistSpans.find(
    (item) =>
      item.species === species &&
      item.grade === grade &&
      item.joistSize === joistSize
  );

  if (!data) return null;

  switch (spacing) {
    case "300":
      return data.spacing300;
    case "400":
      return data.spacing400;
    case "600":
      return data.spacing600;
    default:
      return null;
  }
}
