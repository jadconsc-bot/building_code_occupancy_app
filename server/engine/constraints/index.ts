import type { ConstraintValue, OccupancyProhibition } from '../types/constraints';

export const Constraints = {
  egress: {
    travel_distance: {
      unsprinklered: {
        value: 25, unit: 'm',
        ref: 'NBC 3.4.2.5.(1)',
        description: 'Maximum travel distance to exit in unsprinklered building'
      },
      sprinklered: {
        value: 45, unit: 'm',
        ref: 'NBC 3.4.2.5.(2)',
        description: 'Maximum travel distance to exit in sprinklered building'
      }
    },
    exit_width: {
      minimum: {
        value: 850, unit: 'mm',
        ref: 'NBC 3.3.1.13.(1)(a)',
        description: 'Minimum clear width of exit door'
      }
    },
    corridor_width: {
      minimum: {
        value: 1100, unit: 'mm',
        ref: 'NBC 3.4.1.9.(1)',
        description: 'Minimum clear width of corridor used as access to exit'
      }
    },
    exit_count: {
      threshold_low: {
        value: 60, unit: 'persons', exits: 1,
        ref: 'NBC 3.4.2.2.(1)',
        description: 'Occupant load threshold requiring minimum 1 exit'
      },
      threshold_mid: {
        value: 600, unit: 'persons', exits: 2,
        ref: 'NBC 3.4.2.2.(2)',
        description: 'Occupant load threshold requiring minimum 2 exits'
      },
      threshold_high: {
        value: 600, unit: 'persons', exits: 3,
        ref: 'NBC 3.4.2.2.(3)',
        description: 'Occupant load above 600 requiring minimum 3 exits'
      }
    },
    stair_width: {
      minimum: {
        value: 900, unit: 'mm',
        ref: 'NBC 3.4.6.3.(1)',
        description: 'Minimum clear width of exit stairway'
      }
    },
  },
  fire: {
    separation: {
      // Residential suite separation — governed by NBC 3.3.4.2.(1) (Subsection 3.3.4,
      // Residential Occupancy), NOT by Table 3.1.3.1 which only covers different major
      // occupancy groups. Value and citation verified against BCBC 2024 code page 3-222.
      residential_suite: {
        value: 1.0, unit: 'hr',
        ref: 'NBC 3.3.4.2.(1)',
        description: 'Fire separation between suites of residential occupancy (Group C) and the remainder of the building'
      },
      // All entries below: NBC 3.1.3.1 / Table 3.1.3.1 (Major Occupancy Fire Separations).
      // Values verified against BCBC 2024 Table 3.1.3.1, code page 3-55.
      // Group A (assembly) pairs — each A sub-type has the same values vs external groups
      assembly_institutional: {   // A ↔ B
        value: 2.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group A (assembly) and Group B (institutional)'
      },
      assembly_residential: {     // A ↔ C
        value: 1.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group A (assembly) and Group C (residential)'
      },
      assembly_business: {        // A ↔ D
        value: 1.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group A (assembly) and Group D (business/personal services)'
      },
      assembly_mercantile: {      // A ↔ E
        value: 2.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group A (assembly) and Group E (mercantile)'
      },
      // Group B (institutional) — 2 hr vs all other major occupancies
      institutional_any: {
        value: 2.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group B (institutional) and any other major occupancy'
      },
      // Group C (residential) vs D and E
      residential_commercial: {   // C ↔ D
        value: 1.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group C (residential) and Group D (business/personal services)'
      },
      residential_mercantile: {   // C ↔ E
        value: 2.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group C (residential) and Group E (mercantile)'
      },
      // D ↔ E: Table 3.1.3.1 shows dash (no requirement) — no entry.
      // Group F-1 (high-hazard industrial) vs D and E
      // F-1 with A/B/C is prohibited, not rated — see fire.prohibitions below.
      high_hazard_business: {     // F-1 ↔ D
        value: 3.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group F-1 (high-hazard industrial) and Group D (business/personal services)'
      },
      high_hazard_mercantile: {   // F-1 ↔ E
        value: 3.0, unit: 'hr',
        ref: 'NBC 3.1.3.1 / Table 3.1.3.1',
        description: 'Fire separation between Group F-1 (high-hazard industrial) and Group E (mercantile)'
      },
    },
    // Hard prohibitions — occupancy combinations the code forbids regardless of
    // fire separation assembly. These are not FRR thresholds; they are categorical
    // blocks. Check these BEFORE consulting fire.separation.
    prohibitions: {
      f1_with_abc: {
        ref: 'NBC 3.1.3.2.(1)',
        description: 'Group F-1 (high-hazard industrial) may not be in a building containing Group A, B, or C — not permitted regardless of fire separation assembly'
      } satisfies OccupancyProhibition,
    },
    resistance_rating: {
      part3_non_combustible: {
        value: 2.0, unit: 'hr',
        ref: 'NBC 3.2.2',
        description: 'Minimum FRR for Part 3 non-combustible construction'
      },
      part9_minimum: {
        value: 0.75, unit: 'hr',
        ref: 'NBC 9.10',
        description: 'Minimum FRR for Part 9 buildings'
      }
    }
  },
  sprinklers: {
    required_occupancies: {
      group_a1: {
        value: true, unit: 'boolean',
        ref: 'NBC 3.2.5.2.(1)',
        description: 'Group A Division 1 — sprinklers required throughout'
      },
      group_a2_threshold: {
        value: 300, unit: 'persons',
        ref: 'NBC 3.2.5.2.(1)',
        description: 'Group A Division 2 — sprinklers required if occupant load > 300'
      },
      group_b1: {
        value: true, unit: 'boolean',
        ref: 'NBC 3.2.5.2.(1)',
        description: 'Group B Division 1 — sprinklers required throughout'
      },
      group_b2: {
        value: true, unit: 'boolean',
        ref: 'NBC 3.2.5.2.(1)',
        description: 'Group B Division 2 — sprinklers required throughout'
      },
      group_f1: {
        value: true, unit: 'boolean',
        ref: 'NBC 3.2.5.2.(1)',
        description: 'Group F Division 1 — sprinklers required throughout'
      }
    }
  },
  building_limits: {
    part9_threshold: {
      max_storeys: { value: 3, unit: 'storeys', ref: 'NBC 9.1.1.1', description: 'Maximum storeys for Part 9' },
      max_area:    { value: 600, unit: 'm2',      ref: 'NBC 9.1.1.1', description: 'Maximum area for Part 9' }
    },
    part3_area_threshold: {
      value: 600, unit: 'm2', ref: 'NBC 9.1.1.1',
      description: 'Buildings exceeding 600m² gross floor area require Part 3 compliance'
    },
    part3_storey_threshold: {
      value: 3, unit: 'storeys', ref: 'NBC 9.1.1.1',
      description: 'Buildings exceeding 3 storeys require Part 3 compliance'
    }
  },
  accessibility: {
    path_width: {
      minimum: { value: 1000, unit: 'mm', ref: 'NBC 3.8.3.2.(1)', description: 'Minimum interior accessible path of travel width' }
    },
    door_width: {
      minimum: { value: 850, unit: 'mm', ref: 'NBC 3.8.3.8.(1)', description: 'Minimum accessible door clear width' }
    },
    // Residential accessible unit percentage: no federal minimum
    // percentage of dwelling units is mandated by NBC 2020 s.3.8.
    // Accessibility application to dwelling units is governed by
    // 3.8.5 (Adaptable Dwelling Units) and AHJ designation per
    // 3.8.2.3.(2)(l) — not by a code-specified percentage.
    // Provincial amendments (e.g. BC Building Code) may impose
    // percentages; implement via provincial overlay, not here.
  },
  residential: {
    bedroom_area: {
      minimum_1_person: {
        value: 7.0, unit: 'm2',
        ref: 'NBC 9.5.2.3',
        description: 'Minimum bedroom area for 1 sleeping person'
      },
      minimum_2_person: {
        value: 9.8, unit: 'm2',
        ref: 'NBC 9.5.2.3',
        description: 'Minimum bedroom area for 2 sleeping persons'
      }
    }
  },
} as const;

/**
 * Retrieve a constraint by dot-notation path.
 * Example: getConstraint('egress.travel_distance.unsprinklered')
 */
export function getConstraint(path: string): ConstraintValue | undefined {
  const parts = path.split('.');
  let current: any = Constraints;
  for (const part of parts) {
    current = current?.[part];
  }
  return current as ConstraintValue | undefined;
}
