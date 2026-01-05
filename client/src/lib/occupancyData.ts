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
    }
  },

  // Group C - Residential
  {
    id: "C",
    code: "C",
    name: "Residential",
    division: "",
    description: "Occupancy where sleeping accommodation is provided (non-institutional).",
    examples: [
      "Apartments",
      "Boarding houses",
      "Dormitories",
      "Hotels",
      "Houses",
      "Motels",
      "Schools (residential)"
    ],
    compliance: {
      fireResistance: "45min to 1h between suites. 1h to 2h for floor assemblies.",
      sprinklers: "Required for buildings > 3 storeys or large areas.",
      occupantLoad: "2 persons per sleeping room or based on suite area.",
      exits: "Direct exit or access to public corridor required.",
      construction: "Combustible permitted up to 6 storeys (with specific protections).",
      notes: "Smoke alarms required in every suite. CO detectors if fuel-burning appliances present."
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
    }
  }
];
