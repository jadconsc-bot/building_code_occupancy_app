export interface HeightLimit {
  constructionType: string;
  maxHeight: string;
  maxStoreys: number;
  notes: string;
}

export interface SetbackRequirement {
  zone: string;
  front: string;
  rear: string;
  side: string;
  notes: string;
}

export interface AllowableOpening {
  assemblyRating: string;
  maxOpeningArea: string;
  maxSingleOpening: string;
  closureRequired: string;
  notes: string;
}

export interface ErgonomicRequirement {
  element: string;
  dimension: string;
  code: string;
  notes: string;
}

export const heightLimitsByOccupancy: Record<string, HeightLimit[]> = {
  "Group A": [
    {
      constructionType: "Combustible (Part 9)",
      maxHeight: "11 m",
      maxStoreys: 3,
      notes: "Limited to 600 m² building area"
    },
    {
      constructionType: "Non-Combustible",
      maxHeight: "18 m",
      maxStoreys: 6,
      notes: "Sprinklered buildings"
    },
    {
      constructionType: "Fire-Resistive",
      maxHeight: "Unlimited",
      maxStoreys: 999,
      notes: "With appropriate fire ratings"
    }
  ],
  "Group C": [
    {
      constructionType: "Combustible (Part 9)",
      maxHeight: "11 m",
      maxStoreys: 3,
      notes: "Single dwelling units"
    },
    {
      constructionType: "Wood Frame",
      maxHeight: "18 m",
      maxStoreys: 6,
      notes: "Sprinklered multi-unit residential"
    },
    {
      constructionType: "Non-Combustible",
      maxHeight: "Unlimited",
      maxStoreys: 999,
      notes: "With fire-resistive construction"
    }
  ],
  "Group D": [
    {
      constructionType: "Combustible (Part 9)",
      maxHeight: "11 m",
      maxStoreys: 3,
      notes: "Business and personal services"
    },
    {
      constructionType: "Non-Combustible",
      maxHeight: "36 m",
      maxStoreys: 12,
      notes: "Sprinklered office buildings"
    }
  ],
  "Group F": [
    {
      constructionType: "Combustible",
      maxHeight: "11 m",
      maxStoreys: 2,
      notes: "Low-hazard industrial"
    },
    {
      constructionType: "Non-Combustible",
      maxHeight: "18 m",
      maxStoreys: 4,
      notes: "Medium-hazard industrial"
    }
  ]
};

export const setbackRequirements: SetbackRequirement[] = [
  {
    zone: "R-1 (Single Detached)",
    front: "6.0 m",
    rear: "7.5 m",
    side: "1.2 m (each)",
    notes: "Corner lots: 4.5 m street side"
  },
  {
    zone: "R-2 (Semi-Detached)",
    front: "6.0 m",
    rear: "7.5 m",
    side: "0 m (attached) / 1.2 m (free)",
    notes: "Shared property line at 0 m"
  },
  {
    zone: "R-C1 (Row Housing)",
    front: "4.5 m",
    rear: "6.0 m",
    side: "0 m (attached) / 1.2 m (end unit)",
    notes: "Reduced setbacks for density"
  },
  {
    zone: "R-C2 (Low-Rise Apartments)",
    front: "6.0 m",
    rear: "7.5 m",
    side: "3.0 m",
    notes: "Increased for multi-unit buildings"
  },
  {
    zone: "M-C1 (Commercial Main Street)",
    front: "0 m",
    rear: "3.0 m",
    side: "0 m",
    notes: "Build-to street frontage"
  },
  {
    zone: "I-G (General Industrial)",
    front: "6.0 m",
    rear: "6.0 m",
    side: "3.0 m",
    notes: "Larger setbacks for truck access"
  }
];

export const allowableOpenings: AllowableOpening[] = [
  {
    assemblyRating: "45 min",
    maxOpeningArea: "No limit",
    maxSingleOpening: "No limit",
    closureRequired: "No",
    notes: "Typical interior partitions"
  },
  {
    assemblyRating: "1 hour",
    maxOpeningArea: "25% of wall area",
    maxSingleOpening: "No limit",
    closureRequired: "Yes (45 min)",
    notes: "Fire doors with self-closers"
  },
  {
    assemblyRating: "2 hour",
    maxOpeningArea: "25% of wall area",
    maxSingleOpening: "No limit",
    closureRequired: "Yes (1.5 hr)",
    notes: "Labeled fire doors required"
  },
  {
    assemblyRating: "3 hour (Firewall)",
    maxOpeningArea: "No openings permitted",
    maxSingleOpening: "N/A",
    closureRequired: "N/A",
    notes: "Absolute fire separation"
  },
  {
    assemblyRating: "Exterior Wall (< 3m)",
    maxOpeningArea: "10% of wall area",
    maxSingleOpening: "No limit",
    closureRequired: "Yes (45 min)",
    notes: "Limited openings near property line"
  },
  {
    assemblyRating: "Exterior Wall (≥ 3m)",
    maxOpeningArea: "No limit",
    maxSingleOpening: "No limit",
    closureRequired: "No",
    notes: "Beyond spatial separation distance"
  }
];

export const ergonomicRequirements: ErgonomicRequirement[] = [
  {
    element: "Stair Riser Height",
    dimension: "125 mm - 200 mm",
    code: "NBC 9.8.3.2",
    notes: "Consistent within flight (±6 mm)"
  },
  {
    element: "Stair Tread Depth",
    dimension: "≥ 235 mm",
    code: "NBC 9.8.3.2",
    notes: "Measured at 300 mm from narrow end"
  },
  {
    element: "Stair Width",
    dimension: "≥ 860 mm",
    code: "NBC 9.8.4.1",
    notes: "Clear width between handrails"
  },
  {
    element: "Handrail Height",
    dimension: "865 mm - 965 mm",
    code: "NBC 9.8.7.2",
    notes: "Measured from nosing"
  },
  {
    element: "Handrail Diameter",
    dimension: "30 mm - 43 mm",
    code: "NBC 9.8.7.4",
    notes: "Circular cross-section for graspability"
  },
  {
    element: "Guardrail Height (< 1.8m drop)",
    dimension: "≥ 920 mm",
    code: "NBC 9.8.8.2",
    notes: "Residential applications"
  },
  {
    element: "Guardrail Height (≥ 1.8m drop)",
    dimension: "≥ 1070 mm",
    code: "NBC 9.8.8.2",
    notes: "Assembly and commercial"
  },
  {
    element: "Guardrail Opening",
    dimension: "≤ 100 mm sphere",
    code: "NBC 9.8.8.3",
    notes: "Prevents child entrapment"
  },
  {
    element: "Door Clear Width",
    dimension: "≥ 810 mm",
    code: "ABC 3.8.3.3",
    notes: "Barrier-free entrance"
  },
  {
    element: "Door Threshold",
    dimension: "≤ 13 mm",
    code: "ABC 3.8.3.7",
    notes: "Beveled if > 6 mm"
  },
  {
    element: "Corridor Width",
    dimension: "≥ 1100 mm",
    code: "ABC 3.8.2.3",
    notes: "Barrier-free path of travel"
  },
  {
    element: "Turning Circle",
    dimension: "≥ 1500 mm diameter",
    code: "ABC 3.8.2.2",
    notes: "Wheelchair maneuvering space"
  },
  {
    element: "Counter Height (Accessible)",
    dimension: "865 mm max",
    code: "ABC 3.8.3.14",
    notes: "Service counters"
  },
  {
    element: "Reach Range (Forward)",
    dimension: "400 mm - 1200 mm",
    code: "ABC 3.8.2.6",
    notes: "Controls and switches"
  },
  {
    element: "Ceiling Height (Habitable)",
    dimension: "≥ 2300 mm",
    code: "NBC 9.5.3.1",
    notes: "Minimum for living spaces"
  },
  {
    element: "Ceiling Height (Basement)",
    dimension: "≥ 1950 mm",
    code: "NBC 9.5.3.1",
    notes: "Reduced for non-habitable"
  }
];
