export interface AdditionRequirement {
  id: string;
  title: string;
  description: string;
  codeRef?: string;
  critical?: boolean;
}

export interface AdditionType {
  id: string;
  name: string;
  description: string;
  requirements: AdditionRequirement[];
  zoningNotes: string;
}

export const additionsData: AdditionType[] = [
  {
    id: "deck",
    name: "Uncovered Deck",
    description: "An exterior structure without a roof, typically elevated above grade.",
    zoningNotes: "Decks under 0.6m (2ft) height often have relaxed setback rules. Higher decks usually must meet principal building setbacks.",
    requirements: [
      {
        id: "piles",
        title: "Pile Depth",
        description: "Concrete piles must extend below the frost line (min. 1.2m / 4ft in most of Alberta) to prevent heaving.",
        codeRef: "NBC(AE) 9.12.2.2",
        critical: true
      },
      {
        id: "guards",
        title: "Guardrail Height",
        description: "Decks > 600mm (24\") above grade require a 900mm (36\") guard. Decks > 1800mm (6ft) require a 1070mm (42\") guard.",
        codeRef: "NBC(AE) 9.8.8.3",
        critical: true
      },
      {
        id: "spindles",
        title: "Spindle Spacing",
        description: "Openings in guards must not allow the passage of a 100mm (4\") sphere. No climbable horizontal members.",
        codeRef: "NBC(AE) 9.8.8.5",
        critical: true
      },
      {
        id: "ledger",
        title: "Ledger Board Attachment",
        description: "Must be bolted/lagged to the house rim joist. Nailing is NOT permitted. Flashing required to prevent rot.",
        codeRef: "NBC(AE) 9.23.14",
        critical: true
      }
    ]
  },
  {
    id: "sunroom",
    name: "Sunroom / Enclosed Porch",
    description: "A roofed, enclosed structure attached to the house, often with extensive glazing.",
    zoningNotes: "Considered part of the Principal Building. Must meet full Front, Rear, and Side Yard setbacks.",
    requirements: [
      {
        id: "foundation",
        title: "Full Foundation",
        description: "Unlike simple decks, sunrooms usually require a full frost-protected foundation (strip footings or engineered screw piles) due to roof loads.",
        codeRef: "NBC(AE) 9.15",
        critical: true
      },
      {
        id: "thermal",
        title: "Thermal Separation",
        description: "If not heated by the main house system, must be thermally separated (exterior door) to avoid full energy code compliance.",
        codeRef: "NBC(AE) 9.36",
        critical: false
      },
      {
        id: "glazing",
        title: "Window Performance",
        description: "Windows must meet NAFS standards for air/water tightness and wind load resistance.",
        codeRef: "NBC(AE) 9.7.4",
        critical: true
      }
    ]
  },
  {
    id: "garage",
    name: "Detached Garage",
    description: "An accessory building for vehicle storage.",
    zoningNotes: "Typically allowed in Rear Yard. Separation distance from house affects fire rating requirements.",
    requirements: [
      {
        id: "slab",
        title: "Thickened Edge Slab",
        description: "Floating slab on grade is permitted for detached garages < 55m² (592 sq ft). Larger requires piles/footings.",
        codeRef: "NBC(AE) 9.35.3",
        critical: true
      },
      {
        id: "fire_separation",
        title: "Limiting Distance",
        description: "If < 1.2m from property line, wall must be non-combustible or 45min fire-rated with no windows.",
        codeRef: "NBC(AE) 9.10.15",
        critical: true
      }
    ]
  }
];
