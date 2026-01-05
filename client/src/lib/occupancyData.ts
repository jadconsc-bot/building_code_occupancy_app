export interface OccupancyGroup {
  id: string;
  code: string;
  name: string;
  division?: string;
  description: string;
  examples: string[];
  compliance: {
    fireResistance: string;
    sprinklers: string;
    occupantLoad: string;
    exits: string;
    construction: string;
    notes?: string;
  };
  plumbing?: {
    fixtures: string;
    drainage: string;
    notes: string;
  };
  electrical?: {
    emergencyPower: string;
    lighting: string;
    notes: string;
  };
}

export const occupancyData: OccupancyGroup[] = [
  // Group A - Assembly
  {
    id: "A-1",
    code: "A-1",
    name: "Assembly - Performing Arts",
    division: "Division 1",
    description: "Assembly occupancies intended for the production and viewing of the performing arts.",
    examples: [
      "Motion picture theatres",
      "Opera houses",
      "Television studios admitting a viewing audience",
      "Theatres",
      "Experimental theatres"
    ],
    compliance: {
      fireResistance: "High requirements. Major occupancy separation required (typically 1h or 2h).",
      sprinklers: "Generally required for all Group A, Division 1 occupancies.",
      occupantLoad: "0.60 m² per person (standing/open), fixed seating count for theatres.",
      exits: "Must have sufficient aggregate width. Panic hardware often required.",
      construction: "Noncombustible construction typically required for larger/taller buildings.",
      notes: "Strict requirements for stage equipment, proscenium curtains, and fire safety systems."
    },
    plumbing: {
      fixtures: "High fixture count required based on peak occupancy. Separate staff facilities often required.",
      drainage: "Standard drainage, plus special requirements for stage areas if applicable.",
      notes: "Drinking fountains required. Accessibility requirements apply to all public washrooms."
    },
    electrical: {
      emergencyPower: "Mandatory for emergency lighting, exit signs, and fire alarm systems.",
      lighting: "Aisle lighting required. Emergency lighting must provide min 10 lux on floor.",
      notes: "Stage lighting systems require specialized circuits and controls."
    }
  },
  {
    id: "A-2",
    code: "A-2",
    name: "Assembly - General",
    division: "Division 2",
    description: "Assembly occupancies not elsewhere classified in Group A.",
    examples: [
      "Art galleries",
      "Auditoria",
      "Bowling alleys",
      "Clubs (nonresidential)",
      "Community halls",
      "Courtrooms",
      "Dance halls",
      "Child care facilities",
      "Exhibition halls",
      "Gymnasia",
      "Lecture halls",
      "Libraries",
      "Licensed beverage establishments",
      "Museums",
      "Passenger stations",
      "Places of worship",
      "Restaurants",
      "Schools and colleges"
    ],
    compliance: {
      fireResistance: "Varies by building height and area. Separation required from other occupancies.",
      sprinklers: "Required if occupant load > 300 or building area exceeds limits.",
      occupantLoad: "1.20 m² per person (dining/reading), 0.40 m² (standing space), 0.85 m² (classrooms).",
      exits: "Minimum 2 exits for occupant loads > 60. Travel distance limits apply.",
      construction: "Combustible permitted for smaller buildings; noncombustible for larger.",
      notes: "Specific requirements for commercial cooking equipment in restaurants."
    },
    plumbing: {
      fixtures: "Based on occupant load (e.g., 1 WC per 25-50 persons depending on gender/use).",
      drainage: "Grease interceptors required for commercial kitchens (restaurants).",
      notes: "Food preparation sinks must be separate from handwashing sinks."
    },
    electrical: {
      emergencyPower: "Required for emergency lighting and exit signs.",
      lighting: "Emergency lighting required in all public areas and exits.",
      notes: "GFCI protection required near water sources. Special wiring for kitchen equipment."
    }
  },
  {
    id: "A-3",
    code: "A-3",
    name: "Assembly - Arena Type",
    division: "Division 3",
    description: "Assembly occupancies of the arena type.",
    examples: [
      "Arenas",
      "Indoor swimming pools",
      "Rinks"
    ],
    compliance: {
      fireResistance: "Structural fire protection required based on construction type.",
      sprinklers: "Required for most arena structures, especially with combustible construction.",
      occupantLoad: "Fixed seating count + standing areas.",
      exits: "Wide distribution of exits required to prevent congestion.",
      construction: "Heavy timber or noncombustible often used for long spans.",
      notes: "Special provisions for ice plants and pool chemical storage."
    },
    plumbing: {
      fixtures: "Fixture counts based on peak spectator capacity. Showers often required for athletes.",
      drainage: "Floor drains required in dressing rooms and pool decks.",
      notes: "Pool systems require specialized circulation and filtration plumbing."
    },
    electrical: {
      emergencyPower: "Required for emergency lighting and life safety systems.",
      lighting: "High-bay lighting common. Emergency lighting for ice/pool surfaces.",
      notes: "Damp/wet location wiring methods required for pool areas."
    }
  },
  {
    id: "A-4",
    code: "A-4",
    name: "Assembly - Open Air",
    division: "Division 4",
    description: "Assembly occupancies in which occupants are gathered in the open air.",
    examples: [
      "Amusement park structures",
      "Bleachers",
      "Grandstands",
      "Reviewing stands",
      "Stadia"
    ],
    compliance: {
      fireResistance: "Requirements focus on structural stability and safe egress.",
      sprinklers: "Typically not required for open structures, but standpipes may be needed.",
      occupantLoad: "Based on seating capacity or 0.40 m² per person for standing.",
      exits: "Multiple egress routes required to open ground.",
      construction: "Noncombustible construction preferred for large grandstands.",
      notes: "Wind load and structural stability are critical factors."
    },
    plumbing: {
      fixtures: "Washrooms required within reasonable travel distance.",
      drainage: "Storm water management is critical.",
      notes: "Seasonal shut-off capabilities often required."
    },
    electrical: {
      emergencyPower: "Emergency lighting for egress paths.",
      lighting: "Egress lighting required for night use.",
      notes: "Weatherproof enclosures (NEMA 3R/4) required for all outdoor equipment."
    }
  },

  // Group B - Institutional
  {
    id: "B-1",
    code: "B-1",
    name: "Institutional - Detention",
    division: "Division 1",
    description: "Occupancy by persons who are restrained from or incapable of evacuating to a safe location without assistance.",
    examples: [
      "Jails",
      "Penitentiaries",
      "Police stations with detention",
      "Prisons",
      "Psychiatric hospitals (detention)",
      "Reformatories"
    ],
    compliance: {
      fireResistance: "Very high. Noncombustible construction mandatory for most.",
      sprinklers: "Mandatory throughout.",
      occupantLoad: "Based on design capacity.",
      exits: "Special locking arrangements permitted with central release.",
      construction: "Noncombustible required.",
      notes: "Smoke control and emergency power systems are critical."
    },
    plumbing: {
      fixtures: "Vandal-resistant fixtures required in detention areas.",
      drainage: "Floor drains with trap primers required.",
      notes: "Anti-ligature fixtures and fittings mandatory in secure areas."
    },
    electrical: {
      emergencyPower: "Mandatory for all life safety, security, and lighting systems (min 2h duration).",
      lighting: "Vandal-resistant fixtures. High security levels.",
      notes: "Tamper-proof devices and plates required."
    }
  },
  {
    id: "B-2",
    code: "B-2",
    name: "Institutional - Treatment",
    division: "Division 2",
    description: "Occupancy for the provision of treatment where overnight accommodation is available.",
    examples: [
      "Care facilities with treatment",
      "Hospitals",
      "Infirmaries",
      "Nursing homes with treatment"
    ],
    compliance: {
      fireResistance: "High. 1h to 2h separations required.",
      sprinklers: "Mandatory throughout.",
      occupantLoad: "Based on bed count and treatment areas.",
      exits: "Wide corridors (min 2.4m in hospitals) required for bed movement.",
      construction: "Noncombustible required for buildings > 1 storey.",
      notes: "Defend-in-place strategy often used; zone separations are key."
    },
    plumbing: {
      fixtures: "Handwashing sinks required in all patient care areas. Accessible fixtures in patient rooms.",
      drainage: "Special handling for medical waste/fluids may be required.",
      notes: "Medical gas systems (oxygen, vacuum) are critical components."
    },
    electrical: {
      emergencyPower: "Vital. Generator backup required for life support and critical care areas.",
      lighting: "High CRI lighting for examination. Emergency lighting in all areas.",
      notes: "Isolated power systems required in operating rooms (Z32 standard)."
    }
  },
  {
    id: "B-3",
    code: "B-3",
    name: "Institutional - Care",
    division: "Division 3",
    description: "Occupancy where care is provided to residents (assisted living).",
    examples: [
      "Assisted living facilities",
      "Care facilities without treatment",
      "Children's custodial homes",
      "Group homes",
      "Hospices without treatment"
    ],
    compliance: {
      fireResistance: "Moderate to High. 45min to 1h separations.",
      sprinklers: "Mandatory throughout.",
      occupantLoad: "Based on resident count.",
      exits: "Barrier-free access required.",
      construction: "Combustible permitted up to 3 storeys with sprinklers.",
      notes: "Alberta has specific 'B-3' provisions differing from national code."
    },
    plumbing: {
      fixtures: "Accessible fixtures required. Scald protection devices mandatory.",
      drainage: "Standard residential-type drainage.",
      notes: "Grab bars and accessible design standards apply to washrooms."
    },
    electrical: {
      emergencyPower: "Required for emergency lighting and fire alarm.",
      lighting: "Residential style but with higher illumination levels for elderly vision.",
      notes: "Call systems (nurse call) often integrated."
    }
  },

   // Group C - Residential
  {
    id: "C-1",
    code: "C",
    name: "Residential - General",
    division: "",
    description: "Occupancy for residential use.",
    examples: [
      "Apartments",
      "Boarding houses",
      "Clubs (residential)",
      "Colleges (residential)",
      "Convents",
      "Dormitories",
      "Hotels",
      "Houses",
      "Lodging houses",
      "Monasteries",
      "Motels",
      "Schools (residential)"
    ],
    compliance: {
      fireResistance: "45min to 1h separations between suites.",
      sprinklers: "Required for buildings > 3 storeys or > 600m² footprint.",
      occupantLoad: "2 persons per sleeping room or based on area.",
      exits: "Direct access to exterior or public corridor required.",
      construction: "Combustible permitted up to 6 storeys (with specific provisions).",
      notes: "Smoke alarms required in every sleeping room."
    },
    plumbing: {
      fixtures: "1 kitchen sink, 1 WC, 1 lavatory, 1 bathtub/shower per suite.",
      drainage: "Separate shut-offs often required for multi-unit buildings.",
      notes: "Laundry facilities hookups typically required."
    },
    electrical: {
      emergencyPower: "Required for public corridors and exits in multi-unit buildings.",
      lighting: "Switched outlets or ceiling fixtures in every room.",
      notes: "AFCI protection required for most branch circuits."
    }
  },
  {
    id: "C-2",
    code: "C (Secondary Suite)",
    name: "Residential - Secondary Suite",
    division: "",
    description: "A self-contained dwelling unit located within a house (max 2 units total).",
    examples: [
      "Basement suite",
      "Garden suite",
      "In-law suite",
      "Garage suite"
    ],
    compliance: {
      fireResistance: "Continuous smoke-tight barrier (min 12.7mm gypsum) required between suite and main house. 45min-1h rating if not sprinklered.",
      sprinklers: "Not mandatory if fire separation requirements are met, but highly recommended.",
      occupantLoad: "Based on bedroom count and living area.",
      exits: "Separate exit required. Can share a common exit if protected by smoke-tight barrier. Window egress required in bedrooms.",
      construction: "Ceiling height min 1.95m. Doorways min 1890mm height.",
      notes: "Sound transmission control (STC) required between units. Interconnected smoke/CO alarms mandatory."
    },
    plumbing: {
      fixtures: "Must have own kitchen sink, WC, lavatory, and bathtub/shower.",
      drainage: "Backwater valve recommended/required on sanitary lateral.",
      notes: "Independent hot water supply or shared system with sufficient capacity (min 65L/day/person calculation)."
    },
    electrical: {
      emergencyPower: "Not typically required.",
      lighting: "Exterior light at entrance required.",
      notes: "Separate electrical panel often required by utility, though code allows single service. AFCI protection mandatory."
    }
  },

  // Group D - Business
  {
    id: "D",
    code: "D",
    name: "Business & Personal Services",
    division: "",
    description: "Occupancy for transaction of business or professional services.",
    examples: [
      "Banks",
      "Beauty parlours",
      "Dental offices",
      "Medical offices",
      "Offices",
      "Police stations (no detention)",
      "Radio stations"
    ],
    compliance: {
      fireResistance: "Moderate. Separation from other occupancies required.",
      sprinklers: "Required for high-rise or large floor areas.",
      occupantLoad: "10.0 m² per person.",
      exits: "Standard width requirements. Travel distance max 40m (unsprinklered).",
      construction: "Combustible permitted for low-rise.",
      notes: "Often found in mixed-use buildings with Mercantile or Residential."
    },
    plumbing: {
      fixtures: "Based on employee/public count. Separate staff washrooms often provided.",
      drainage: "Standard commercial drainage.",
      notes: "Dental/Medical offices require special waste handling (amalgam separators, etc.)."
    },
    electrical: {
      emergencyPower: "Required for emergency lighting and exit signs.",
      lighting: "Energy efficiency codes (NECB) strictly apply to lighting power density.",
      notes: "Structured cabling for data/comms is a major component."
    }
  },

  // Group E - Mercantile
  {
    id: "E",
    code: "E",
    name: "Mercantile",
    division: "",
    description: "Occupancy for displaying or selling retail goods.",
    examples: [
      "Department stores",
      "Markets",
      "Shops",
      "Stores",
      "Supermarkets"
    ],
    compliance: {
      fireResistance: "Moderate to High depending on fire load.",
      sprinklers: "Required for areas > 1500 m² or storeys > 3.",
      occupantLoad: "3.7 m² per person (basement/ground), 5.6 m² (other floors).",
      exits: "Must handle high occupant loads. Panic hardware required on main doors.",
      construction: "Combustible permitted for smaller buildings.",
      notes: "High fire load due to stock; strict storage height limits."
    },
    plumbing: {
      fixtures: "Public washrooms required based on floor area/occupancy.",
      drainage: "Floor drains in public washrooms.",
      notes: "Staff facilities must be separate from public facilities in large stores."
    },
    electrical: {
      emergencyPower: "Required for emergency lighting and exit signs.",
      lighting: "High illumination levels for display. Energy code limits apply.",
      notes: "Special outlets for POS systems and security gates."
    }
  },

  // Group F - Industrial
  {
    id: "F-1",
    code: "F-1",
    name: "Industrial - High Hazard",
    division: "Division 1",
    description: "Industrial occupancy with high hazard potential (flammable/explosive).",
    examples: [
      "Bulk plants for flammable liquids",
      "Chemical manufacturing",
      "Distilleries",
      "Grain elevators",
      "Paint factories",
      "Spray painting operations"
    ],
    compliance: {
      fireResistance: "Very High. Explosion venting often required.",
      sprinklers: "Mandatory (often specialized systems).",
      occupantLoad: "4.6 m² per person.",
      exits: "Short travel distances (max 25m).",
      construction: "Noncombustible required.",
      notes: "Strict control of ignition sources and ventilation."
    },
    plumbing: {
      fixtures: "Emergency eyewash and shower stations mandatory.",
      drainage: "Oil/grit interceptors and chemical neutralization tanks often required.",
      notes: "Spill containment systems required for hazardous liquids."
    },
    electrical: {
      emergencyPower: "Critical for ventilation and safety systems.",
      lighting: "Explosion-proof fixtures (Class I/II Div 1/2) required in hazardous areas.",
      notes: "Hazardous location wiring methods (sealed conduits, intrinsic safety) mandatory."
    }
  },
  {
    id: "F-2",
    code: "F-2",
    name: "Industrial - Medium Hazard",
    division: "Division 2",
    description: "Industrial occupancy with medium hazard potential.",
    examples: [
      "Aircraft hangars",
      "Factories",
      "Laboratories",
      "Repair garages",
      "Service stations",
      "Warehouses",
      "Woodworking factories"
    ],
    compliance: {
      fireResistance: "Moderate. Separation from other occupancies required.",
      sprinklers: "Required for large areas or high-piled storage.",
      occupantLoad: "4.6 m² per person.",
      exits: "Standard industrial requirements.",
      construction: "Combustible permitted for smaller buildings.",
      notes: "Storage height and commodity class affect sprinkler design."
    },
    plumbing: {
      fixtures: "Industrial wash fountains common. Emergency showers may be required.",
      drainage: "Oil interceptors required for garages/service stations.",
      notes: "Floor drains required in production areas."
    },
    electrical: {
      emergencyPower: "Required for emergency lighting.",
      lighting: "High-bay industrial lighting.",
      notes: "Motor control centers (MCCs) and higher voltage distribution common."
    }
  },
  {
    id: "F-3",
    code: "F-3",
    name: "Industrial - Low Hazard",
    division: "Division 3",
    description: "Industrial occupancy with low hazard potential.",
    examples: [
      "Creameries",
      "Power plants",
      "Storage garages",
      "Warehouses (non-combustible contents)"
    ],
    compliance: {
      fireResistance: "Low. 45min to 1h separations.",
      sprinklers: "Often not required if fire load is very low.",
      occupantLoad: "4.6 m² per person.",
      exits: "Standard requirements.",
      construction: "Combustible permitted.",
      notes: "Least restrictive industrial classification."
    },
    plumbing: {
      fixtures: "Basic staff facilities.",
      drainage: "Standard drainage.",
      notes: "Floor drains for washdown areas."
    },
    electrical: {
      emergencyPower: "Required for emergency lighting.",
      lighting: "Standard industrial lighting.",
      notes: "Basic power distribution."
    }
  }
];
