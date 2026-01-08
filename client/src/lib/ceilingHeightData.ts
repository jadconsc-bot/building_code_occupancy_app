// NBC Minimum Ceiling Height Requirements by Occupancy
// Based on National Building Code of Canada 2023

export interface CeilingHeightRequirement {
  occupancy: string;
  standardHeight: number; // in meters
  standardHeightFeet: string;
  basementHeight?: number; // in meters
  basementHeightFeet?: string;
  serviceRoomHeight?: number; // in meters
  serviceRoomHeightFeet?: string;
  notes: string[];
  exceptions?: string[];
}

export const ceilingHeightData: Record<string, CeilingHeightRequirement> = {
  "A-1": {
    occupancy: "A-1 (Assembly - Performing Arts)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Minimum 2.3m (7'6\") for assembly spaces",
      "Performance areas may require greater heights for acoustics",
      "Corridors and exits: minimum 2.1m (6'11\")",
      "Lobby areas typically 2.3m minimum",
    ],
    exceptions: [
      "Projection rooms: 2.1m minimum",
      "Technical/mechanical spaces: as required for equipment",
    ],
  },
  "A-2": {
    occupancy: "A-2 (Assembly - General)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Minimum 2.3m (7'6\") for assembly spaces",
      "Corridors and exits: minimum 2.1m (6'11\")",
      "Meeting rooms and halls: 2.3m minimum",
      "Washrooms: 2.1m minimum",
    ],
    exceptions: [
      "Storage rooms: 2.1m minimum",
      "Mechanical rooms: as required",
    ],
  },
  "A-3": {
    occupancy: "A-3 (Assembly - Arena Type)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Minimum 2.3m (7'6\") for assembly spaces",
      "Arena floor: height determined by use (typically much higher)",
      "Seating areas: 2.3m minimum",
      "Corridors and concourses: 2.1m minimum",
    ],
    exceptions: [
      "Storage and equipment rooms: 2.1m minimum",
      "Playing surface areas: no minimum (determined by sport requirements)",
    ],
  },
  "A-4": {
    occupancy: "A-4 (Assembly - Open Air)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Covered seating areas: 2.3m minimum",
      "Concession stands: 2.3m minimum",
      "Washroom facilities: 2.1m minimum",
      "Open air areas: no ceiling height requirement",
    ],
    exceptions: [
      "Ticket booths: 2.1m minimum",
      "Storage areas: 2.1m minimum",
    ],
  },
  "B-1": {
    occupancy: "B-1 (Institutional - Detention)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Minimum 2.3m (7'6\") for cells and dayrooms",
      "Corridors: minimum 2.1m (6'11\")",
      "Common areas: 2.3m minimum",
      "Administrative spaces: 2.3m minimum",
    ],
    exceptions: [
      "Mechanical and service rooms: 2.1m minimum",
      "Storage areas: 2.1m minimum",
    ],
  },
  "B-2": {
    occupancy: "B-2 (Institutional - Treatment)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Patient rooms: minimum 2.3m (7'6\")",
      "Treatment rooms: 2.3m minimum",
      "Corridors: minimum 2.4m (7'10\") for hospital beds",
      "Operating rooms: typically 3.0m+ for equipment",
    ],
    exceptions: [
      "Washrooms: 2.1m minimum",
      "Storage closets: 2.1m minimum",
      "Mechanical rooms: as required for equipment",
    ],
  },
  "B-3": {
    occupancy: "B-3 (Institutional - Care)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Resident rooms: minimum 2.3m (7'6\")",
      "Common areas: 2.3m minimum",
      "Corridors: minimum 2.1m (6'11\")",
      "Dining areas: 2.3m minimum",
    ],
    exceptions: [
      "Washrooms: 2.1m minimum",
      "Storage rooms: 2.1m minimum",
    ],
  },
  "C": {
    occupancy: "C (Residential)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    basementHeight: 2.1,
    basementHeightFeet: "6'11\"",
    serviceRoomHeight: 2.0,
    serviceRoomHeightFeet: "6'7\"",
    notes: [
      "Living spaces: minimum 2.3m (7'6\")",
      "Basements: minimum 2.1m (6'11\")",
      "Service rooms (laundry, storage): 2.0m (6'7\")",
      "Bathrooms: 2.1m minimum",
      "Hallways and corridors: 2.1m minimum",
    ],
    exceptions: [
      "Sloped ceilings: minimum 50% of floor area at full height, remainder not less than 1.5m",
      "Beams and ducts: may project 100mm below minimum height if at least 2.1m clearance maintained",
      "Mezzanines: 2.1m minimum above and below",
    ],
  },
  "C (Secondary Suite)": {
    occupancy: "C (Secondary Suite)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    basementHeight: 2.1,
    basementHeightFeet: "6'11\"",
    serviceRoomHeight: 2.0,
    serviceRoomHeightFeet: "6'7\"",
    notes: [
      "Same requirements as principal dwelling",
      "Living spaces: minimum 2.3m (7'6\")",
      "Basements: minimum 2.1m (6'11\")",
      "Service rooms: 2.0m (6'7\")",
    ],
    exceptions: [
      "Sloped ceilings: minimum 50% of floor area at full height",
      "Existing buildings: some relaxations may apply (verify with authority)",
    ],
  },
  "D": {
    occupancy: "D (Business & Personal Services)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Office spaces: minimum 2.3m (7'6\")",
      "Customer service areas: 2.3m minimum",
      "Corridors: minimum 2.1m (6'11\")",
      "Washrooms: 2.1m minimum",
    ],
    exceptions: [
      "Storage rooms: 2.1m minimum",
      "Mechanical rooms: as required",
      "Mezzanines: 2.1m minimum above and below",
    ],
  },
  "E": {
    occupancy: "E (Mercantile)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Sales areas: minimum 2.3m (7'6\")",
      "Customer areas: 2.3m minimum",
      "Corridors and aisles: 2.1m minimum",
      "Washrooms: 2.1m minimum",
    ],
    exceptions: [
      "Storage areas: 2.1m minimum",
      "Back-of-house spaces: 2.1m minimum",
      "Warehouse areas: may be higher for racking systems",
    ],
  },
  "F-1": {
    occupancy: "F-1 (Industrial - High Hazard)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Work areas: minimum 2.3m (7'6\")",
      "Process areas: height determined by equipment and ventilation requirements",
      "Corridors: minimum 2.1m (6'11\")",
      "Control rooms: 2.3m minimum",
    ],
    exceptions: [
      "Equipment rooms: as required for equipment clearance",
      "Storage areas: as required for materials handling",
      "Ventilation requirements may dictate greater heights",
    ],
  },
  "F-2": {
    occupancy: "F-2 (Industrial - Medium Hazard)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Work areas: minimum 2.3m (7'6\")",
      "Manufacturing floors: height determined by equipment",
      "Corridors: minimum 2.1m (6'11\")",
      "Office areas: 2.3m minimum",
    ],
    exceptions: [
      "Equipment rooms: as required",
      "Storage areas: as required for racking/materials",
      "High-bay areas: significantly greater heights typical",
    ],
  },
  "F-3": {
    occupancy: "F-3 (Industrial - Low Hazard)",
    standardHeight: 2.3,
    standardHeightFeet: "7'6\"",
    notes: [
      "Work areas: minimum 2.3m (7'6\")",
      "Processing areas: height determined by equipment",
      "Corridors: minimum 2.1m (6'11\")",
      "Office areas: 2.3m minimum",
    ],
    exceptions: [
      "Equipment rooms: as required",
      "Storage areas: as required",
      "Warehouse sections: typically higher for efficiency",
    ],
  },
};

/**
 * Get ceiling height requirements for a specific occupancy
 */
export function getCeilingHeightRequirements(occupancy: string): CeilingHeightRequirement | null {
  return ceilingHeightData[occupancy] || null;
}

/**
 * Get all ceiling height requirements
 */
export function getAllCeilingHeightRequirements(): CeilingHeightRequirement[] {
  return Object.values(ceilingHeightData);
}
