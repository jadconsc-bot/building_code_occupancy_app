// Alberta Safety Codes Act Data
// Based on RSA 2000, Chapter S-1 (Current as of December 1, 2025)

export interface PermitRequirement {
  type: "building" | "electrical" | "plumbing" | "gas" | "fire" | "elevating";
  name: string;
  description: string;
  required: boolean;
  conditions?: string;
  codeReference: string;
  inspectionStages?: string[];
}

export interface CertificateRequirement {
  trade: string;
  certificateType: string;
  description: string;
  requiredFor: string[];
  codeReference: string;
}

export interface VarianceInfo {
  title: string;
  description: string;
  process: string[];
  requirements: string[];
  codeReference: string;
}

export interface InspectorPower {
  power: string;
  description: string;
  codeReference: string;
}

export interface OwnerResponsibility {
  responsibility: string;
  description: string;
  codeReference: string;
}

export interface AppealsInfo {
  type: string;
  description: string;
  timeline: string;
  process: string[];
  codeReference: string;
}

// Permit requirements by occupancy type
export const permitRequirementsByOccupancy: Record<string, PermitRequirement[]> = {
  // Assembly Occupancies (A-1, A-2, A-3, A-4)
  "A-1": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for construction, alteration, or change of use of assembly occupancies for performing arts",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical installations including stage lighting, sound systems, and emergency lighting",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for washroom facilities, concession areas, and fire suppression systems",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for heating systems and any gas-fired equipment",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire alarm systems, sprinkler systems, and emergency exits",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final", "Commissioning"]
    }
  ],
  "A-2": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for general assembly occupancies including restaurants, churches, and community halls",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical installations",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for washroom facilities and food service areas",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for commercial kitchen equipment and heating systems",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection systems",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final"]
    }
  ],
  "A-3": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for arena-type assembly occupancies",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical installations including pool equipment",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for pool systems, change rooms, and washroom facilities",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for pool heaters and HVAC systems",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection systems",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final"]
    }
  ],
  "A-4": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for open-air assembly structures",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for lighting and sound systems",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for washroom facilities",
      required: true,
      conditions: "If permanent washroom facilities are installed",
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for emergency egress and fire protection",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Final"]
    }
  ],
  // Institutional Occupancies (B-1, B-2, B-3)
  "B-1": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for detention facilities with enhanced security requirements",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Security Systems", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical including security systems and emergency power",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Security", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for all plumbing systems with security considerations",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for heating systems",
      required: true,
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection with security integration",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final", "Commissioning"]
    }
  ],
  "B-2": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for hospitals and treatment facilities",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Medical Gas", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical including medical equipment and emergency power",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2 & 24",
      inspectionStages: ["Rough-in", "Medical Equipment", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for medical plumbing including medical gas systems",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Medical Gas", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for heating and medical gas systems",
      required: true,
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for enhanced fire protection systems",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final", "Commissioning"]
    },
    {
      type: "elevating",
      name: "Elevating Devices Permit",
      description: "Required for elevators and patient lifts",
      required: true,
      codeReference: "Elevating Devices Codes Regulation",
      inspectionStages: ["Installation", "Final", "Annual"]
    }
  ],
  "B-3": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for care facilities and group homes",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical including nurse call systems",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for accessible washroom facilities",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for heating systems",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection systems with enhanced requirements for care occupancies",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final", "Commissioning"]
    }
  ],
  // Residential Occupancies (C, C-Secondary)
  "C": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for residential construction including apartments and houses",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical installations",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for all plumbing systems",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for furnaces, water heaters, and gas appliances",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection in multi-unit residential",
      required: true,
      conditions: "For buildings with more than 2 dwelling units",
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final"]
    }
  ],
  "C-secondary": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for secondary suites including basement suites and garden suites",
      required: true,
      codeReference: "Safety Codes Act, Section 43; ABC 9.36.2",
      inspectionStages: ["Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for separate electrical service or sub-panel",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for kitchen and bathroom plumbing",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required if separate gas appliances are installed",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Separation Inspection",
      description: "Required to verify fire separation between principal dwelling and secondary suite",
      required: true,
      codeReference: "ABC 9.10.9",
      inspectionStages: ["Framing", "Final"]
    }
  ],
  // Business & Personal Services (D)
  "D": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for offices, banks, and personal service establishments",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical installations",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for washroom facilities",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for heating systems",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection systems",
      required: true,
      conditions: "For buildings over 600m² or 3+ storeys",
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final"]
    }
  ],
  // Mercantile (E)
  "E": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for retail stores and shopping centres",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical including display lighting",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for washroom facilities and any food service areas",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for heating systems",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection systems",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final"]
    }
  ],
  // Industrial (F-1, F-2, F-3)
  "F-1": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for high-hazard industrial occupancies",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Hazmat Systems", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical with hazardous location classifications",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2 & 18",
      inspectionStages: ["Rough-in", "Hazardous Locations", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for industrial plumbing and process piping",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for process equipment and heating systems",
      required: true,
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for enhanced fire protection including special suppression systems",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final", "Commissioning"]
    }
  ],
  "F-2": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for medium-hazard industrial occupancies",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical installations",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for industrial plumbing",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for heating and process equipment",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection systems",
      required: true,
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final"]
    }
  ],
  "F-3": [
    {
      type: "building",
      name: "Building Permit",
      description: "Required for low-hazard industrial occupancies",
      required: true,
      codeReference: "Safety Codes Act, Section 43",
      inspectionStages: ["Foundation", "Framing", "Insulation", "Final"]
    },
    {
      type: "electrical",
      name: "Electrical Permit",
      description: "Required for all electrical installations",
      required: true,
      codeReference: "Alberta Electrical Code, Section 2",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "plumbing",
      name: "Plumbing Permit",
      description: "Required for industrial plumbing",
      required: true,
      codeReference: "Alberta Plumbing Code",
      inspectionStages: ["Underground", "Rough-in", "Final"]
    },
    {
      type: "gas",
      name: "Gas Permit",
      description: "Required for heating systems",
      required: true,
      conditions: "If gas appliances are installed",
      codeReference: "Alberta Gas Code",
      inspectionStages: ["Rough-in", "Final"]
    },
    {
      type: "fire",
      name: "Fire Safety Permit",
      description: "Required for fire protection systems",
      required: true,
      conditions: "For buildings over 600m² or 3+ storeys",
      codeReference: "Alberta Fire Code, Division B",
      inspectionStages: ["Rough-in", "Final"]
    }
  ]
};

// Certificate requirements for different trades
export const certificateRequirements: CertificateRequirement[] = [
  {
    trade: "Electrician",
    certificateType: "Journeyman Electrician or Master Electrician",
    description: "Required to perform electrical work in Alberta",
    requiredFor: ["All electrical installations", "Electrical repairs", "Electrical alterations"],
    codeReference: "Safety Codes Act, Section 41; Certification and Permit Regulation"
  },
  {
    trade: "Plumber",
    certificateType: "Journeyman Plumber or Master Plumber",
    description: "Required to perform plumbing work in Alberta",
    requiredFor: ["All plumbing installations", "Plumbing repairs", "Plumbing alterations"],
    codeReference: "Safety Codes Act, Section 41; Certification and Permit Regulation"
  },
  {
    trade: "Gas Fitter",
    certificateType: "Gas Fitter (Class A, B, or C)",
    description: "Required to install, alter, or repair gas equipment",
    requiredFor: ["Gas appliance installation", "Gas line installation", "Gas equipment repairs"],
    codeReference: "Safety Codes Act, Section 41; Gas Code Regulation"
  },
  {
    trade: "Fire Protection Installer",
    certificateType: "Fire Protection Technician",
    description: "Required for fire suppression system installation",
    requiredFor: ["Sprinkler system installation", "Fire alarm installation", "Fire suppression systems"],
    codeReference: "Safety Codes Act, Section 41; Fire Code Regulation"
  },
  {
    trade: "Power Engineer",
    certificateType: "Power Engineer (1st to 5th Class)",
    description: "Required to operate pressure equipment and heating plants",
    requiredFor: ["Boiler operation", "Pressure vessel operation", "Heating plant operation"],
    codeReference: "Safety Codes Act, Section 41; Power Engineers Regulation"
  },
  {
    trade: "Elevator Mechanic",
    certificateType: "Elevator Mechanic Certificate",
    description: "Required to install, maintain, or repair elevating devices",
    requiredFor: ["Elevator installation", "Escalator maintenance", "Lift repairs"],
    codeReference: "Safety Codes Act, Section 41; Elevating Devices Codes Regulation"
  }
];

// Variance information
export const varianceInfo: VarianceInfo = {
  title: "Code Variances",
  description: "An Administrator or safety codes officer may issue a written variance with respect to any thing, process or activity to which the Safety Codes Act applies if the variance provides approximately equivalent or greater safety performance.",
  process: [
    "Submit a written variance application to the safety codes officer or Administrator",
    "Provide technical documentation demonstrating equivalent or greater safety",
    "Include professional engineering assessment if required",
    "Pay applicable variance application fees",
    "Await decision from Administrator or safety codes officer",
    "If refused, appeal within 30 days to the Safety Codes Council"
  ],
  requirements: [
    "The variance must provide approximately equivalent or greater safety performance",
    "Technical justification must be provided",
    "The variance may include terms and conditions",
    "The safety codes officer must notify the Administrator when issuing a variance",
    "Variances are recorded in a public register"
  ],
  codeReference: "Safety Codes Act, Section 38"
};

// Safety codes officer powers during inspection
export const inspectorPowers: InspectorPower[] = [
  {
    power: "Entry Without Warrant",
    description: "May enter any premises or place (except private dwellings in use) at any reasonable time where there is reason to believe something to which the Act applies exists",
    codeReference: "Section 34(1)"
  },
  {
    power: "Entry to Private Dwellings",
    description: "May enter a private dwelling with consent of owner/occupant or with a warrant from a justice",
    codeReference: "Section 34(2)"
  },
  {
    power: "Inspection and Review",
    description: "May carry out inspections, review designs, examine and evaluate quality management systems and manufacturing/construction processes",
    codeReference: "Section 34(1)"
  },
  {
    power: "Accompanied by Others",
    description: "May be accompanied by a police officer, peace officer, or any other person the officer considers appropriate",
    codeReference: "Section 34(4)(a)"
  },
  {
    power: "Photograph and Record",
    description: "May inspect, review, examine and evaluate any thing, process or activity and photograph or otherwise record",
    codeReference: "Section 34(4)(b)"
  },
  {
    power: "Require Disclosure",
    description: "May require any person on the premises to be interviewed and to make full disclosure about any matter concerning the Act",
    codeReference: "Section 34(4)(c)"
  },
  {
    power: "Temporary Closure",
    description: "May temporarily close or disconnect, or require temporary closure or disconnection of, any thing for safety reasons",
    codeReference: "Section 34(4)(d)"
  },
  {
    power: "Require Tests",
    description: "May review, perform or require to be performed any tests and evaluations considered necessary",
    codeReference: "Section 34(4)(e)"
  }
];

// Owner/occupier responsibilities during inspection
export const ownerResponsibilities: OwnerResponsibility[] = [
  {
    responsibility: "Provide Assistance",
    description: "Ensure a person capable of taking necessary precautions is in attendance on request of the safety codes officer",
    codeReference: "Section 34(5)(a)"
  },
  {
    responsibility: "Provide Safety Equipment",
    description: "Ensure any necessary safety equipment, including that requested by the officer, is immediately available for the officer's use",
    codeReference: "Section 34(5)(b)"
  },
  {
    responsibility: "Produce Documents",
    description: "Produce any record or document pertaining to compliance with the Act within a reasonable time when demanded",
    codeReference: "Section 35(1)"
  },
  {
    responsibility: "Allow Document Copying",
    description: "Allow the officer to remove documents for up to 48 hours for the purpose of making copies",
    codeReference: "Section 35(1)"
  }
];

// Appeals process information
export const appealsInfo: AppealsInfo[] = [
  {
    type: "Appeal of Orders",
    description: "A person affected by an order may appeal to the Council",
    timeline: "Within 30 days of receiving the order",
    process: [
      "File a written notice of appeal with the Safety Codes Council",
      "Pay the required appeal fee",
      "Provide grounds for the appeal",
      "Council reviews the appeal and may confirm, vary, or rescind the order",
      "Further appeal to the Court of King's Bench is available"
    ],
    codeReference: "Section 50"
  },
  {
    type: "Appeal of Permit Refusal",
    description: "A person refused a permit may appeal to the Council",
    timeline: "Within 30 days of receiving notice of refusal",
    process: [
      "File a written notice of appeal with the Safety Codes Council",
      "Pay the required appeal fee",
      "Provide documentation supporting the permit application",
      "Council reviews and may direct the permit to be issued"
    ],
    codeReference: "Section 51"
  },
  {
    type: "Appeal of Variance Refusal",
    description: "A person refused a variance may appeal to the Council",
    timeline: "Within 30 days of receiving notice of refusal",
    process: [
      "File a written notice of appeal with the Safety Codes Council",
      "Pay the required appeal fee",
      "Provide technical documentation supporting the variance",
      "Council reviews and may direct the variance to be issued"
    ],
    codeReference: "Section 38(7)"
  },
  {
    type: "Appeal of Administrative Penalty",
    description: "A person served with an administrative penalty may appeal",
    timeline: "Within 30 days of being served the penalty notice",
    process: [
      "File a written notice of appeal with the Safety Codes Council",
      "Pay the required appeal fee",
      "Provide grounds for the appeal",
      "Council may confirm, vary, or rescind the penalty"
    ],
    codeReference: "Section 57.3"
  }
];

// Helper function to get permits for an occupancy
export function getPermitsForOccupancy(occupancyCode: string): PermitRequirement[] {
  // Normalize the code (handle variations like "C (Secondary Suite)")
  let normalizedCode = occupancyCode.toUpperCase();
  if (normalizedCode.includes("SECONDARY")) {
    normalizedCode = "C-secondary";
  }
  
  // Try exact match first
  if (permitRequirementsByOccupancy[normalizedCode]) {
    return permitRequirementsByOccupancy[normalizedCode];
  }
  
  // Try base code (e.g., "A-1" from "A-1 (something)")
  const baseCode = normalizedCode.split(" ")[0];
  if (permitRequirementsByOccupancy[baseCode]) {
    return permitRequirementsByOccupancy[baseCode];
  }
  
  // Default to residential if no match
  return permitRequirementsByOccupancy["C"] || [];
}

// Get permit type icon color
export function getPermitTypeColor(type: PermitRequirement["type"]): string {
  const colors: Record<string, string> = {
    building: "text-blue-600",
    electrical: "text-yellow-600",
    plumbing: "text-cyan-600",
    gas: "text-orange-600",
    fire: "text-red-600",
    elevating: "text-purple-600"
  };
  return colors[type] || "text-gray-600";
}

// Get permit type background color
export function getPermitTypeBgColor(type: PermitRequirement["type"]): string {
  const colors: Record<string, string> = {
    building: "bg-blue-50 border-blue-200",
    electrical: "bg-yellow-50 border-yellow-200",
    plumbing: "bg-cyan-50 border-cyan-200",
    gas: "bg-orange-50 border-orange-200",
    fire: "bg-red-50 border-red-200",
    elevating: "bg-purple-50 border-purple-200"
  };
  return colors[type] || "bg-gray-50 border-gray-200";
}
