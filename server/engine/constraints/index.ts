import type { ConstraintValue } from '../types/constraints';

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
      residential_suite: {
        value: 1.0, unit: 'hr',
        ref: 'NBC 3.3.4.2.(1)',
        description: 'Fire separation between residential suites'
      },
      residential_mercantile: {
        value: 1.0, unit: 'hr',
        ref: 'NBC 3.3.4.2.(2)',
        description: 'Fire separation between Group C and Group E'
      },
      office_mercantile: {
        value: 0.75, unit: 'hr',
        ref: 'NBC 3.3.4.2.(3)',
        description: 'Fire separation between Group D and Group E'
      },
      residential_commercial: {
        value: 1.0, unit: 'hr',
        ref: 'NBC 3.3.4.2',
        description: 'Fire separation between Group C (residential) and Group D (business/personal services) occupancies'
      },
      assembly_any: {
        value: 2.0, unit: 'hr',
        ref: 'NBC 3.3.4.2.(4)',
        description: 'Fire separation between Group A and any other occupancy'
      },
      institutional_any: {
        value: 2.0, unit: 'hr',
        ref: 'NBC 3.3.4.2.(5)',
        description: 'Fire separation between Group B and any other occupancy'
      },
      high_hazard_any: {
        value: 2.0, unit: 'hr',
        ref: 'NBC 3.3.4.2.(6)',
        description: 'Fire separation between Group F-1 and any other occupancy'
      }
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
  occupant_load: {
    factors: {
      'A': { value: 0.65, unit: 'm2/person', ref: 'NBC Table 3.1.17.1', description: 'Assembly occupancies' },
      'B': { value: 3.0,  unit: 'm2/person', ref: 'NBC Table 3.1.17.1', description: 'Institutional occupancies' },
      'C': { value: 18.6, unit: 'm2/person', ref: 'NBC Table 3.1.17.1', description: 'Residential occupancies' },
      'D': { value: 9.3,  unit: 'm2/person', ref: 'NBC Table 3.1.17.1', description: 'Business & personal services' },
      'E': { value: 3.7,  unit: 'm2/person', ref: 'NBC Table 3.1.17.1', description: 'Mercantile occupancies' },
      'F': { value: 30.0, unit: 'm2/person', ref: 'NBC Table 3.1.17.1', description: 'Industrial occupancies' }
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
      minimum: { value: 1500, unit: 'mm', ref: 'NBC 3.8.3.3.(1)', description: 'Minimum accessible path width' }
    },
    door_width: {
      minimum: { value: 850, unit: 'mm', ref: 'NBC 3.8.3.8.(1)', description: 'Minimum accessible door clear width' }
    },
    units: {
      minimum_percent: {
        value: 0.15, unit: 'fraction',
        ref: 'NBC 3.8.3.3',
        description: 'Minimum fraction of residential units required to be accessible'
      }
    },
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
