// Standard architectural drawing scales for imperial and metric systems
// Based on common industry standards for architectural drawings

export type ScaleSystem = "imperial" | "metric";

export interface ArchitecturalScale {
  id: string;
  label: string;
  ratio: number; // How many real-world units per drawing unit (e.g., 1:100 means 100 real units per 1 drawing unit)
  drawingType: string;
  levelOfDetail: string;
  // For imperial: inches on drawing to feet in real world
  // For metric: mm on drawing to mm in real world (or the ratio directly)
}

// Imperial scales - format: drawing inches = real feet
export const imperialScales: ArchitecturalScale[] = [
  {
    id: "imp-1-80",
    label: '1" = 80\'-0"',
    ratio: 960, // 1 inch = 80 feet = 960 inches
    drawingType: "Location plan",
    levelOfDetail: "Outline building"
  },
  {
    id: "imp-1-40",
    label: '1" = 40\'-0"',
    ratio: 480, // 1 inch = 40 feet = 480 inches
    drawingType: "Site plan",
    levelOfDetail: "Outline buildings, roads, and trees"
  },
  {
    id: "imp-1-16",
    label: '1/16" = 1\'-0"',
    ratio: 192, // 1/16 inch = 1 foot, so 1 inch = 16 feet = 192 inches
    drawingType: "Site plan",
    levelOfDetail: "Outline buildings, roads, and trees"
  },
  {
    id: "imp-1-8",
    label: '1/8" = 1\'-0"',
    ratio: 96, // 1/8 inch = 1 foot, so 1 inch = 8 feet = 96 inches
    drawingType: "Floor plans, elevations, and sections",
    levelOfDetail: "Interiors and exteriors with walls, floors and furniture"
  },
  {
    id: "imp-3-16",
    label: '3/16" = 1\'-0"',
    ratio: 64, // 3/16 inch = 1 foot, so 1 inch = 16/3 feet = 64 inches
    drawingType: "Floor plans, elevations, and sections",
    levelOfDetail: "Interiors and exteriors with walls, floors and furniture"
  },
  {
    id: "imp-1-4",
    label: '1/4" = 1\'-0"',
    ratio: 48, // 1/4 inch = 1 foot, so 1 inch = 4 feet = 48 inches
    drawingType: "Room layouts and interior elevations",
    levelOfDetail: "Materials, construction, and joinery"
  },
  {
    id: "imp-3-8",
    label: '3/8" = 1\'-0"',
    ratio: 32, // 3/8 inch = 1 foot, so 1 inch = 8/3 feet = 32 inches
    drawingType: "Room layouts and interior elevations",
    levelOfDetail: "Materials, construction, and joinery"
  },
  {
    id: "imp-1-2",
    label: '1/2" = 1\'-0"',
    ratio: 24, // 1/2 inch = 1 foot, so 1 inch = 2 feet = 24 inches
    drawingType: "Room layouts and interior elevations",
    levelOfDetail: "Materials, construction, and joinery"
  },
  {
    id: "imp-1-1",
    label: '1" = 1\'-0"',
    ratio: 12, // 1 inch = 1 foot = 12 inches
    drawingType: "Details",
    levelOfDetail: "Material junctions and assembly"
  },
  {
    id: "imp-1-5-1",
    label: '1-1/2" = 1\'-0"',
    ratio: 8, // 1.5 inch = 1 foot, so 1 inch = 8 inches
    drawingType: "Details",
    levelOfDetail: "Material junctions and assembly"
  },
  {
    id: "imp-3-1",
    label: '3" = 1\'-0"',
    ratio: 4, // 3 inch = 1 foot, so 1 inch = 4 inches
    drawingType: "Details",
    levelOfDetail: "Material junctions and assembly"
  },
  {
    id: "imp-full",
    label: "1:1 (Full scale)",
    ratio: 1,
    drawingType: "Full scale",
    levelOfDetail: "Actual size"
  }
];

// Metric scales - format: 1:ratio (e.g., 1:100 means 1mm on drawing = 100mm in reality)
export const metricScales: ArchitecturalScale[] = [
  {
    id: "met-1-2500",
    label: "1:2500",
    ratio: 2500,
    drawingType: "Master plan",
    levelOfDetail: "Outline building types and land use"
  },
  {
    id: "met-1-1250",
    label: "1:1250",
    ratio: 1250,
    drawingType: "Location plan",
    levelOfDetail: "Outline building types and land use"
  },
  {
    id: "met-1-1000",
    label: "1:1000",
    ratio: 1000,
    drawingType: "Location plan",
    levelOfDetail: "Outline building types and land use"
  },
  {
    id: "met-1-500",
    label: "1:500",
    ratio: 500,
    drawingType: "Site plan",
    levelOfDetail: "Outline buildings, roads and trees"
  },
  {
    id: "met-1-200",
    label: "1:200",
    ratio: 200,
    drawingType: "Site plan",
    levelOfDetail: "Outline buildings, roads and trees"
  },
  {
    id: "met-1-100",
    label: "1:100",
    ratio: 100,
    drawingType: "Floor plans, elevations, and sections",
    levelOfDetail: "Interiors and exteriors with walls, floors and furniture"
  },
  {
    id: "met-1-50",
    label: "1:50",
    ratio: 50,
    drawingType: "Room layouts and interior elevations",
    levelOfDetail: "Materials, construction, and joinery"
  },
  {
    id: "met-1-20",
    label: "1:20",
    ratio: 20,
    drawingType: "Room layouts and interior elevations",
    levelOfDetail: "Materials, construction, and joinery"
  },
  {
    id: "met-1-10",
    label: "1:10",
    ratio: 10,
    drawingType: "Details",
    levelOfDetail: "Material junctions and assembly"
  },
  {
    id: "met-1-5",
    label: "1:5",
    ratio: 5,
    drawingType: "Details",
    levelOfDetail: "Material junctions and assembly"
  },
  {
    id: "met-1-2",
    label: "1:2",
    ratio: 2,
    drawingType: "Details",
    levelOfDetail: "Material junctions and assembly"
  },
  {
    id: "met-full",
    label: "1:1 (Full scale)",
    ratio: 1,
    drawingType: "Full scale",
    levelOfDetail: "Actual size"
  }
];

// Get scales by system
export function getScalesBySystem(system: ScaleSystem): ArchitecturalScale[] {
  return system === "imperial" ? imperialScales : metricScales;
}

// Get scale by ID
export function getScaleById(id: string): ArchitecturalScale | undefined {
  return [...imperialScales, ...metricScales].find(s => s.id === id);
}

// Calculate real-world distance from pixel distance
// pixelsPerUnit: how many pixels represent one unit on the drawing (calibrated from reference measurement)
// scale: the architectural scale being used
// system: imperial or metric
export function calculateRealDistance(
  pixelDistance: number,
  pixelsPerUnit: number,
  scale: ArchitecturalScale,
  system: ScaleSystem
): { value: number; unit: string } {
  // Drawing units from pixels
  const drawingUnits = pixelDistance / pixelsPerUnit;
  
  // Real-world units based on scale ratio
  const realUnits = drawingUnits * scale.ratio;
  
  if (system === "imperial") {
    // Result is in inches, convert to feet and inches for display
    const feet = Math.floor(realUnits / 12);
    const inches = realUnits % 12;
    if (feet > 0) {
      return { value: realUnits / 12, unit: "ft" }; // Return in feet for calculations
    }
    return { value: realUnits, unit: "in" };
  } else {
    // Result is in mm, convert to appropriate unit
    if (realUnits >= 1000) {
      return { value: realUnits / 1000, unit: "m" };
    } else if (realUnits >= 10) {
      return { value: realUnits / 10, unit: "cm" };
    }
    return { value: realUnits, unit: "mm" };
  }
}

// Format distance for display
export function formatDistance(value: number, unit: string, precision: number = 2): string {
  if (unit === "ft") {
    const feet = Math.floor(value);
    const inches = Math.round((value - feet) * 12);
    if (inches === 12) {
      return `${feet + 1}'-0"`;
    }
    return `${feet}'-${inches}"`;
  }
  return `${value.toFixed(precision)} ${unit}`;
}
