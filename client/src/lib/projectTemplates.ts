export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  occupancy: string;
  phases: {
    name: string;
    items: {
      description: string;
      codeRef: string;
      critical: boolean;
    }[];
  }[];
  typicalRequirements: string[];
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: "single-family-home",
    name: "Single-Family Home",
    description: "Detached single-family residential dwelling (Part 9 construction)",
    icon: "Home",
    occupancy: "C",
    phases: [
      {
        name: "Foundation",
        items: [
          { description: "Verify footing depth below frost line (min 1.2m)", codeRef: "NBC 9.12.2.1", critical: true },
          { description: "Check footing width and thickness", codeRef: "NBC 9.15.3", critical: true },
          { description: "Inspect foundation wall thickness and reinforcement", codeRef: "NBC 9.15.4", critical: true },
          { description: "Verify dampproofing/waterproofing installation", codeRef: "NBC 9.13.2", critical: true },
          { description: "Check foundation drainage system", codeRef: "NBC 9.14.1", critical: false },
        ]
      },
      {
        name: "Framing",
        items: [
          { description: "Verify lumber grade stamps and species", codeRef: "NBC 9.3.2", critical: true },
          { description: "Check floor joist size, spacing, and spans", codeRef: "NBC 9.23.4.2", critical: true },
          { description: "Inspect wall stud size and spacing", codeRef: "NBC 9.23.10.2", critical: true },
          { description: "Verify header/beam sizes over openings", codeRef: "NBC 9.23.13", critical: true },
          { description: "Check roof rafter/truss spans and spacing", codeRef: "NBC 9.23.14", critical: true },
          { description: "Inspect shear wall bracing", codeRef: "NBC 9.23.13.8", critical: true },
        ]
      },
      {
        name: "Mechanical",
        items: [
          { description: "Verify HVAC equipment sizing and placement", codeRef: "NBC 9.33", critical: false },
          { description: "Check plumbing rough-in and venting", codeRef: "NBC 7.4", critical: true },
          { description: "Inspect electrical service size and panel location", codeRef: "CEC 8-200", critical: true },
          { description: "Verify smoke alarm locations", codeRef: "NBC 9.10.19.1", critical: true },
          { description: "Check carbon monoxide alarm placement", codeRef: "NBC 9.10.19.2", critical: true },
        ]
      },
      {
        name: "Insulation & Vapour Barrier",
        items: [
          { description: "Verify insulation R-values meet climate zone requirements", codeRef: "NBC 9.36.2", critical: true },
          { description: "Check vapour barrier installation and continuity", codeRef: "NBC 9.25.4", critical: true },
          { description: "Inspect air barrier system", codeRef: "NBC 9.36.2.9", critical: true },
        ]
      },
      {
        name: "Drywall",
        items: [
          { description: "Check fire-rated assembly installations", codeRef: "NBC 9.10.3", critical: true },
          { description: "Verify ceiling and wall finishes", codeRef: "NBC 9.29", critical: false },
        ]
      },
      {
        name: "Final",
        items: [
          { description: "Test smoke and CO alarms", codeRef: "NBC 9.10.19", critical: true },
          { description: "Verify egress window sizes and operation", codeRef: "NBC 9.9.10", critical: true },
          { description: "Check guardrail and handrail heights", codeRef: "NBC 9.8.8", critical: true },
          { description: "Inspect stair dimensions (rise/run)", codeRef: "NBC 9.8.9", critical: true },
          { description: "Verify house numbers visible from street", codeRef: "ABC 8.2.1", critical: false },
          { description: "Check final grading and drainage", codeRef: "NBC 9.14.1", critical: false },
        ]
      }
    ],
    typicalRequirements: [
      "Building permit required",
      "Development permit may be required",
      "Real Property Report (RPR) recommended",
      "Geotechnical report for challenging sites",
      "Energy efficiency compliance (EnerGuide)",
      "Smoke alarm interconnection required"
    ]
  },
  {
    id: "multi-unit-residential",
    name: "Multi-Unit Residential",
    description: "Apartment building or multi-family dwelling (Part 3 construction)",
    icon: "Building2",
    occupancy: "C",
    phases: [
      {
        name: "Foundation",
        items: [
          { description: "Verify geotechnical report recommendations", codeRef: "NBC 4.2.2", critical: true },
          { description: "Check foundation design by structural engineer", codeRef: "NBC 4.2", critical: true },
          { description: "Inspect waterproofing system", codeRef: "NBC 9.13.2", critical: true },
          { description: "Verify foundation drainage and sump system", codeRef: "NBC 9.14", critical: true },
        ]
      },
      {
        name: "Structural",
        items: [
          { description: "Verify structural drawings stamped by P.Eng", codeRef: "NBC 3.1.3", critical: true },
          { description: "Check fire separations between suites (45min-1hr)", codeRef: "NBC 3.3.4.4", critical: true },
          { description: "Inspect floor assembly fire ratings", codeRef: "NBC 3.3.4.5", critical: true },
          { description: "Verify exit stairwell enclosures", codeRef: "NBC 3.3.1", critical: true },
          { description: "Check sprinkler system installation", codeRef: "NBC 3.2.5", critical: true },
        ]
      },
      {
        name: "Mechanical & Fire Protection",
        items: [
          { description: "Verify sprinkler system design and installation", codeRef: "NBC 3.2.5", critical: true },
          { description: "Check fire alarm system", codeRef: "NBC 3.2.4", critical: true },
          { description: "Inspect HVAC system and fire dampers", codeRef: "NBC 3.6.4", critical: true },
          { description: "Verify plumbing riser sizes and venting", codeRef: "NBC 7.4", critical: true },
        ]
      },
      {
        name: "Electrical",
        items: [
          { description: "Check electrical service size for building load", codeRef: "CEC 8-200", critical: true },
          { description: "Verify emergency lighting and exit signs", codeRef: "NBC 3.2.7", critical: true },
          { description: "Inspect fire alarm panel and devices", codeRef: "CAN/ULC-S524", critical: true },
        ]
      },
      {
        name: "Envelope & Insulation",
        items: [
          { description: "Verify building envelope thermal performance", codeRef: "NBC 3.2.2", critical: true },
          { description: "Check air barrier continuity", codeRef: "NBC 5.4.3", critical: true },
          { description: "Inspect exterior cladding and weather protection", codeRef: "NBC 5.6", critical: false },
        ]
      },
      {
        name: "Final",
        items: [
          { description: "Test fire alarm system", codeRef: "CAN/ULC-S537", critical: true },
          { description: "Verify sprinkler system flow test", codeRef: "NFPA 25", critical: true },
          { description: "Check suite separation smoke sealing", codeRef: "NBC 3.3.4.4", critical: true },
          { description: "Inspect accessibility features", codeRef: "NBC 3.8", critical: true },
          { description: "Verify emergency lighting battery backup", codeRef: "NBC 3.2.7", critical: true },
        ]
      }
    ],
    typicalRequirements: [
      "Building permit required",
      "Development permit required",
      "Structural drawings by P.Eng required",
      "Fire protection system design required",
      "Energy model (Part 3 compliance)",
      "Accessibility compliance (barrier-free suites)",
      "Geotechnical report required"
    ]
  },
  {
    id: "commercial-office",
    name: "Commercial Office",
    description: "Business and personal services building (Occupancy D)",
    icon: "Briefcase",
    occupancy: "D",
    phases: [
      {
        name: "Foundation",
        items: [
          { description: "Verify geotechnical recommendations", codeRef: "NBC 4.2.2", critical: true },
          { description: "Check foundation design and reinforcement", codeRef: "NBC 4.2", critical: true },
          { description: "Inspect waterproofing and drainage", codeRef: "NBC 9.13", critical: true },
        ]
      },
      {
        name: "Structural",
        items: [
          { description: "Verify structural drawings by P.Eng", codeRef: "NBC 3.1.3", critical: true },
          { description: "Check fire separations and ratings", codeRef: "NBC 3.3.3", critical: true },
          { description: "Inspect floor live load capacity (2.4 kPa minimum)", codeRef: "NBC 4.1.5.3", critical: true },
          { description: "Verify exit requirements and travel distances", codeRef: "NBC 3.4", critical: true },
        ]
      },
      {
        name: "Mechanical & Fire Protection",
        items: [
          { description: "Check sprinkler system (if required)", codeRef: "NBC 3.2.5", critical: true },
          { description: "Verify fire alarm system", codeRef: "NBC 3.2.4", critical: true },
          { description: "Inspect HVAC system and ventilation rates", codeRef: "NBC 6.2", critical: false },
          { description: "Check washroom facilities (occupant load)", codeRef: "NBC 3.7.2", critical: false },
        ]
      },
      {
        name: "Electrical",
        items: [
          { description: "Verify electrical service sizing", codeRef: "CEC 8-200", critical: true },
          { description: "Check emergency lighting", codeRef: "NBC 3.2.7", critical: true },
          { description: "Inspect exit signs and illumination", codeRef: "NBC 3.4.5", critical: true },
        ]
      },
      {
        name: "Envelope & Finishes",
        items: [
          { description: "Verify building envelope performance", codeRef: "NBC 5.4", critical: true },
          { description: "Check interior finish flame-spread ratings", codeRef: "NBC 3.1.13", critical: true },
          { description: "Inspect accessibility features", codeRef: "NBC 3.8", critical: true },
        ]
      },
      {
        name: "Final",
        items: [
          { description: "Test fire alarm system", codeRef: "CAN/ULC-S537", critical: true },
          { description: "Verify emergency lighting operation", codeRef: "NBC 3.2.7", critical: true },
          { description: "Check exit signage and egress paths", codeRef: "NBC 3.4.5", critical: true },
          { description: "Inspect barrier-free washrooms", codeRef: "NBC 3.8.3", critical: false },
          { description: "Verify occupancy load posting", codeRef: "ABC 2.8", critical: false },
        ]
      }
    ],
    typicalRequirements: [
      "Building permit required",
      "Development permit required",
      "Structural drawings by P.Eng",
      "Fire protection system design",
      "Energy compliance (Part 3)",
      "Accessibility compliance",
      "Occupancy permit before use"
    ]
  }
];

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find(template => template.id === id);
}

export function getTemplatesByOccupancy(occupancy: string): ProjectTemplate[] {
  return projectTemplates.filter(template => template.occupancy === occupancy);
}
