/**
 * CodeComply Home — Part 9 Compliance Engine
 *
 * Deterministic rule evaluation for homeowner Q&A forms.
 * Plain-language output: PASS / CONDITIONAL / FAIL with "What to do" guidance.
 *
 * Provincial codes applied:
 *   AB → National Building Code – 2023 Alberta Edition (NBC(AE) 2023)
 *   BC → BC Building Code 2024 (BCBC 2024)
 *   ON → Ontario Building Code 2012 (OBC 2012)
 *
 * Iron Law: This engine never modifies occupancy classifications or the Part 3
 * rule engine. It operates on Part 9 residential Q&A data only.
 */

export type Province = "AB" | "BC" | "ON";
export type RuleResult = "pass" | "conditional" | "fail";

export interface ComplianceItem {
  ruleId: string;
  title: string;
  result: RuleResult;
  message: string;
  whatToDo?: string;
  codeRef?: string;
}

export interface ComplianceReport {
  projectType: string;
  province: Province;
  codeEdition: string;
  overallResult: RuleResult;
  items: ComplianceItem[];
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function codeEditionLabel(province: Province): string {
  return {
    AB: "National Building Code – 2023 Alberta Edition (NBC(AE) 2023)",
    BC: "BC Building Code 2024",
    ON: "Ontario Building Code 2012",
  }[province];
}

function ftToM(ft: number): number {
  return ft * 0.3048;
}

// Minimum ceiling height (m) for habitable space by province (Part 9)
function minCeilingM(province: Province): number {
  return province === "BC" ? 2.1 : 1.95;
}

function minCeilingLabel(province: Province): string {
  return province === "BC" ? "2.1m (6ft 11in)" : "1.95m (6ft 5in)";
}

function worstResult(items: ComplianceItem[]): RuleResult {
  if (items.some((i) => i.result === "fail")) return "fail";
  if (items.some((i) => i.result === "conditional")) return "conditional";
  return "pass";
}

function pass(ruleId: string, title: string, message: string, codeRef?: string): ComplianceItem {
  return { ruleId, title, result: "pass", message, codeRef };
}

function conditional(ruleId: string, title: string, message: string, whatToDo: string, codeRef?: string): ComplianceItem {
  return { ruleId, title, result: "conditional", message, whatToDo, codeRef };
}

function fail(ruleId: string, title: string, message: string, whatToDo: string, codeRef?: string): ComplianceItem {
  return { ruleId, title, result: "fail", message, whatToDo, codeRef };
}

// ─── Secondary Suite ──────────────────────────────────────────────────────────

export interface SecondarySuiteAnswers {
  province: Province;
  municipality?: string;
  yearBuilt?: number;
  storeys?: number;
  suiteLocation: "basement" | "above_grade" | "attached_garage";
  suiteAreaSqft?: number;
  separateEntrance: "yes" | "no";
  ceilingHeightFt: number;
  egressWindows: "yes" | "no";
  egressWindowSizeSqm?: number;
  smokeAlarms: "yes" | "no";
  coDetectors: "yes" | "no";
  fireSeparation: "yes" | "no";
  sprinklerSystem: "yes" | "no";
  parkingProvided: "yes" | "no";
  fullBathroom: "yes" | "no";
  kitchen: "yes" | "no";
}

function checkSecondarySuite(a: SecondarySuiteAnswers): ComplianceReport {
  const province = a.province;
  const items: ComplianceItem[] = [];

  // 1. Suite location
  if (a.suiteLocation === "attached_garage") {
    items.push(fail(
      "suite_location",
      "Suite Location",
      "An attached garage is generally not permitted as habitable space for a secondary suite.",
      "Consult your municipality — significant structural, ventilation, and fire separation upgrades are required before a garage can be used as living space.",
      "Part 9 NBC, provincial fire code",
    ));
  } else {
    items.push(pass("suite_location", "Suite Location", `${a.suiteLocation === "basement" ? "Basement" : "Above-grade"} suites are a permitted suite location.`));
  }

  // 2. Ceiling height
  const ceilingM = ftToM(a.ceilingHeightFt);
  const minM = minCeilingM(province);
  if (ceilingM >= minM) {
    items.push(pass(
      "ceiling_height",
      "Ceiling Height",
      `Your ${a.ceilingHeightFt}ft ceiling (${ceilingM.toFixed(2)}m) meets the minimum ${minCeilingLabel(province)} requirement.`,
      province === "BC" ? "BCBC 2024 9.7.2.1" : province === "AB" ? "NBC(AE) 2023 s.9.5.3.1(2)" : "NBC 9.7.2.1",
    ));
  } else {
    items.push(fail(
      "ceiling_height",
      "Ceiling Height",
      `Your ${a.ceilingHeightFt}ft ceiling (${ceilingM.toFixed(2)}m) is below the minimum ${minCeilingLabel(province)} required in ${province}.`,
      `Raise the ceiling to at least ${minCeilingLabel(province)}. This may require lowering the floor slab or underpinning — consult a structural engineer.`,
      province === "BC" ? "BCBC 2024 9.7.2.1" : province === "AB" ? "NBC(AE) 2023 s.9.5.3.1(2)" : "NBC 9.7.2.1",
    ));
  }

  // 3. Egress window
  if (a.egressWindows === "yes") {
    const size = a.egressWindowSizeSqm ?? 0;
    if (size >= 0.35) {
      items.push(pass("egress_window", "Egress Window", `Your egress window (${size}m²) meets the minimum 0.35m² opening requirement.`, "NBC 9.9.10.3"));
    } else if (size > 0) {
      items.push(fail(
        "egress_window",
        "Egress Window",
        `Your window opening (${size}m²) is below the minimum 0.35m².`,
        "Increase the operable opening to at least 0.35m² with minimum 380mm in each direction. A larger casement or egress window may be needed.",
        "NBC 9.9.10.3",
      ));
    } else {
      items.push(conditional(
        "egress_window",
        "Egress Window",
        "You indicated an egress window but didn't provide the size.",
        "Verify the operable opening is at least 0.35m² with minimum 380mm in both width and height.",
        "NBC 9.9.10.3",
      ));
    }
  } else {
    items.push(fail(
      "egress_window",
      "Egress Window",
      "Egress windows are required in all sleeping areas of the secondary suite.",
      "Install an operable egress window with minimum 0.35m² opening in each bedroom. Window wells may be required for basement bedrooms.",
      "NBC 9.9.10.3",
    ));
  }

  // 4. Smoke alarms
  if (a.smokeAlarms === "yes") {
    items.push(pass("smoke_alarms", "Smoke Alarms", "Interconnected smoke alarms are present. Good — this is a critical life-safety requirement.", "NBC 9.10.19.3"));
  } else {
    items.push(fail(
      "smoke_alarms",
      "Smoke Alarms",
      "Interconnected smoke alarms are required in all sleeping areas, outside sleeping areas, and on every storey of the suite.",
      "Install interconnected smoke alarms in each bedroom, in the hallway serving bedrooms, and on every floor. Alarms must be interconnected (hardwired or wireless).",
      "NBC 9.10.19.3",
    ));
  }

  // 5. CO detectors
  if (a.coDetectors === "yes") {
    items.push(pass("co_detectors", "CO Detectors", "Carbon monoxide detectors are installed."));
  } else {
    items.push(conditional(
      "co_detectors",
      "CO Detectors",
      "CO detectors are required when a fuel-burning appliance (furnace, water heater, fireplace) or attached garage is present.",
      "If the building has any gas appliances or an attached garage, install a CO detector on each floor of the suite. Check with your municipality — many require CO detectors regardless.",
      "NBC 9.33",
    ));
  }

  // 6. Fire separation
  if (a.fireSeparation === "yes") {
    items.push(pass("fire_separation", "Fire Separation", "Fire separation between the suite and main dwelling is present.", "NBC 9.10.9.7"));
  } else {
    items.push(fail(
      "fire_separation",
      "Fire Separation",
      "A minimum 30-minute fire separation is required between the secondary suite and the remainder of the building.",
      "Install Type X drywall (⅝\") on the ceiling and walls between the suite and main dwelling. Seal all penetrations (pipes, wiring) with fire-stop caulk.",
      "NBC 9.10.9.7",
    ));
  }

  // 7. Separate entrance
  if (a.separateEntrance === "yes") {
    items.push(pass("separate_entrance", "Separate Entrance", "A separate entrance to the suite is provided."));
  } else {
    items.push(conditional(
      "separate_entrance",
      "Separate Entrance",
      "Most municipalities require a separate exterior entrance for secondary suites.",
      "Verify with your local building department whether a separate entrance is required. Adding one typically involves a door through the foundation wall.",
    ));
  }

  // 8. Parking
  if (a.parkingProvided === "yes") {
    items.push(pass("parking", "Parking", "A parking space for the suite is provided."));
  } else {
    items.push(conditional(
      "parking",
      "Parking",
      "Many municipalities require one parking space per secondary suite.",
      "Check your local zoning bylaw for off-street parking requirements. A variance may be available in transit-oriented areas.",
    ));
  }

  // 9. Building age
  const yearBuilt = a.yearBuilt;
  if (yearBuilt && yearBuilt < 1975) {
    items.push(conditional(
      "building_age",
      "Building Age (Pre-1975)",
      `Your building (built ~${yearBuilt}) may contain hazardous materials common in older construction.`,
      "Before any renovation, conduct a hazardous materials assessment for asbestos (insulation, floor tiles, drywall joint compound) and lead paint. Improper disturbance is a health and legal risk.",
    ));
  }

  return {
    projectType: "secondary_suite",
    province,
    codeEdition: codeEditionLabel(province),
    overallResult: worstResult(items),
    items,
  };
}

// ─── Deck / Patio ─────────────────────────────────────────────────────────────

export interface DeckPatioAnswers {
  province: Province;
  municipality?: string;
  attachedToHouse: "yes" | "no";
  heightAboveGradeFt: number;
  deckAreaSqft?: number;
  ledgerAttachment?: "yes" | "no";
  footingType: "concrete" | "helical" | "surface";
  joistSpanFt: number;
  beamSpanFt: number;
  postHeightFt?: number;
  guardRail: "yes" | "no";
  guardRailHeightFt?: number;
}

function checkDeckPatio(a: DeckPatioAnswers): ComplianceReport {
  const items: ComplianceItem[] = [];

  // 1. Guard rail requirement (triggered at > 600mm / ~2ft above grade)
  const guardRequired = a.heightAboveGradeFt > 1.97; // 600mm = 1.97ft
  if (guardRequired) {
    if (a.guardRail === "no") {
      items.push(fail(
        "guard_rail",
        "Guard Rail Required",
        `Your deck is ${a.heightAboveGradeFt}ft above grade, exceeding the 600mm (2ft) threshold that triggers a guard rail requirement.`,
        "Install a guard rail at least 900mm (35in) high with no openings that allow a 100mm (4in) sphere to pass through.",
        "NBC 9.8.8.1",
      ));
    } else {
      const guardH = a.guardRailHeightFt ?? 0;
      const guardHm = ftToM(guardH);
      if (guardHm < 0.9) {
        items.push(fail(
          "guard_rail",
          "Guard Rail Height",
          `Your guard rail (${guardH}ft / ${guardHm.toFixed(2)}m) is below the minimum 900mm (35in).`,
          "Raise the guard rail to at least 900mm. For decks more than 1.8m above grade, a 1070mm guard is required.",
          "NBC 9.8.8.1",
        ));
      } else {
        items.push(pass("guard_rail", "Guard Rail", `Guard rail at ${guardH}ft meets the minimum 900mm requirement.`, "NBC 9.8.8.1"));
      }
    }
  } else {
    items.push(pass("guard_rail", "Guard Rail", `Deck is ${a.heightAboveGradeFt}ft above grade — below the 600mm threshold. Guard rail is not required, but recommended for safety.`));
  }

  // 2. Footing type
  if (a.footingType === "surface") {
    items.push(conditional(
      "footing_type",
      "Footing Type",
      "Surface footings (floating/deck blocks) are not permitted in frost-susceptible soil without engineering review.",
      "Use concrete piers below the frost line (typically 1.2m–1.5m in AB/BC/ON) or helical piers. Surface footings are only acceptable for freestanding low-level decks in well-drained granular soil — confirm with your municipality.",
      "NBC 9.4.4",
    ));
  } else {
    items.push(pass("footing_type", "Footing Type", `${a.footingType === "concrete" ? "Concrete" : "Helical"} piers are an acceptable footing type.`, "NBC 9.4.4"));
  }

  // 3. Ledger attachment
  if (a.attachedToHouse === "yes" && a.ledgerAttachment === "no") {
    items.push(fail(
      "ledger",
      "Ledger Attachment",
      "An attached deck must be fastened to the house framing with a proper ledger connection.",
      "Use lag bolts or structural screws into the rim joist or band joist — not into the sheathing or siding alone. A flashing is required above the ledger to prevent water infiltration.",
      "NBC 9.23.6",
    ));
  } else if (a.attachedToHouse === "yes") {
    items.push(pass("ledger", "Ledger Attachment", "Ledger attachment is confirmed. Ensure flashing is installed above the ledger board.", "NBC 9.23.6"));
  }

  // 4. Joist span
  if (a.joistSpanFt > 14) {
    items.push(conditional(
      "joist_span",
      "Joist Span",
      `Your joist span of ${a.joistSpanFt}ft exceeds typical prescriptive limits for standard dimensional lumber.`,
      "Spans over 14ft typically require engineering review to confirm the joist size and spacing. Provide the lumber species, grade, and joist dimensions to your building department.",
      "NBC Table A-9.23.4.2",
    ));
  } else {
    items.push(pass("joist_span", "Joist Span", `Joist span of ${a.joistSpanFt}ft is within typical prescriptive limits.`));
  }

  // 5. Beam span
  if (a.beamSpanFt > 12) {
    items.push(conditional(
      "beam_span",
      "Beam Span",
      `Your beam span of ${a.beamSpanFt}ft may require engineered lumber or a structural beam calculation.`,
      "For spans over 12ft, confirm beam size with a structural engineer or use an engineered wood product (LVL). Provide the load area (tributary area) to your building department.",
      "NBC Table A-9.23.4.2",
    ));
  } else {
    items.push(pass("beam_span", "Beam Span", `Beam span of ${a.beamSpanFt}ft is within typical prescriptive limits.`));
  }

  return {
    projectType: "deck_patio",
    province: a.province,
    codeEdition: codeEditionLabel(a.province),
    overallResult: worstResult(items),
    items,
  };
}

// ─── Basement Development ─────────────────────────────────────────────────────

export interface BasementDevelopmentAnswers {
  province: Province;
  municipality?: string;
  existingState: "finished" | "unfinished";
  ceilingHeightFt: number;
  egressWindows: "yes" | "no";
  bedroomCount: number;
  fullBathroom: "yes" | "no";
  smokeAlarms: "yes" | "no";
  separateEntrance: "yes" | "no";
  insulation: "yes" | "no";
  rValue?: number;
}

function checkBasementDevelopment(a: BasementDevelopmentAnswers): ComplianceReport {
  const province = a.province;
  const items: ComplianceItem[] = [];

  // 1. Ceiling height
  const ceilingM = ftToM(a.ceilingHeightFt);
  const minM = minCeilingM(province);
  if (ceilingM >= minM) {
    items.push(pass("ceiling_height", "Ceiling Height", `Your ${a.ceilingHeightFt}ft ceiling (${ceilingM.toFixed(2)}m) meets the minimum ${minCeilingLabel(province)} requirement.`));
  } else {
    items.push(fail(
      "ceiling_height",
      "Ceiling Height",
      `Your ${a.ceilingHeightFt}ft ceiling (${ceilingM.toFixed(2)}m) is below the minimum ${minCeilingLabel(province)}.`,
      "The floor/ceiling assembly will need to be modified. Options include: lowering the basement floor slab (expensive), or removing the existing ceiling finish if height is borderline.",
      province === "BC" ? "BCBC 2024 9.7.2.1" : province === "AB" ? "NBC(AE) 2023 s.9.5.3.1(2)" : "NBC 9.7.2.1",
    ));
  }

  // 2. Egress windows (required for bedrooms)
  if (a.bedroomCount > 0) {
    if (a.egressWindows === "yes") {
      items.push(pass("egress_window", "Egress Windows", "Egress windows are present. Confirm each bedroom has its own operable egress window with a minimum 0.35m² opening.", "NBC 9.9.10.3"));
    } else {
      items.push(fail(
        "egress_window",
        "Egress Windows Required",
        `You have ${a.bedroomCount} bedroom(s) planned but no egress windows.`,
        "Each basement bedroom requires an operable egress window with a minimum 0.35m² opening (minimum 380mm in each dimension). Window wells and covers may be required for proper egress.",
        "NBC 9.9.10.3",
      ));
    }
  } else if (a.egressWindows === "yes") {
    items.push(pass("egress_window", "Egress Windows", "Egress windows are provided — good for emergency egress even without bedrooms."));
  }

  // 3. Smoke alarms
  if (a.smokeAlarms === "yes") {
    items.push(pass("smoke_alarms", "Smoke Alarms", "Smoke alarms are installed on the basement level.", "NBC 9.10.19.3"));
  } else {
    items.push(fail(
      "smoke_alarms",
      "Smoke Alarms",
      "A smoke alarm is required on each storey of the dwelling, including the basement.",
      "Install an interconnected smoke alarm in the basement. If bedrooms are present, add one in each bedroom and the hallway serving the bedrooms.",
      "NBC 9.10.19.3",
    ));
  }

  // 4. Insulation
  const minRByProvince: Record<Province, number> = { AB: 12, BC: 10, ON: 12 };
  const minR = minRByProvince[province];
  if (a.insulation === "no") {
    items.push(conditional(
      "insulation",
      "Insulation",
      `Insulation is required for basement walls to meet the ${codeEditionLabel(province)} energy requirements.`,
      `Install minimum R-${minR} insulation on basement walls (interior or exterior). Check with your building department — the energy code tier may require more in your climate zone.`,
      `${codeEditionLabel(province)}, Part 12`,
    ));
  } else {
    const rVal = a.rValue ?? 0;
    if (rVal > 0 && rVal < minR) {
      items.push(fail(
        "insulation",
        "Insulation R-Value",
        `Your insulation (R-${rVal}) is below the minimum R-${minR} required in ${province}.`,
        `Increase insulation to at least R-${minR} on basement walls. Consider rigid foam insulation on the exterior of the foundation wall to avoid thermal bridging.`,
        `${codeEditionLabel(province)}, Part 12`,
      ));
    } else {
      items.push(pass("insulation", "Insulation", rVal > 0 ? `R-${rVal} insulation meets the minimum R-${minR} requirement for ${province}.` : "Insulation is confirmed. Verify R-value meets the energy code minimum for your municipality."));
    }
  }

  return {
    projectType: "basement_development",
    province,
    codeEdition: codeEditionLabel(province),
    overallResult: worstResult(items),
    items,
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export type HomeFormAnswers =
  | ({ projectType: "secondary_suite" } & SecondarySuiteAnswers)
  | ({ projectType: "deck_patio" } & DeckPatioAnswers)
  | ({ projectType: "basement_development" } & BasementDevelopmentAnswers);

export function runHomeCompliance(answers: HomeFormAnswers): ComplianceReport {
  switch (answers.projectType) {
    case "secondary_suite":
      return checkSecondarySuite(answers);
    case "deck_patio":
      return checkDeckPatio(answers);
    case "basement_development":
      return checkBasementDevelopment(answers);
    default:
      return {
        projectType: (answers as any).projectType,
        province: (answers as any).province ?? "AB",
        codeEdition: "—",
        overallResult: "conditional",
        items: [{
          ruleId: "not_configured",
          title: "Questions Not Yet Configured",
          result: "conditional",
          message: "Automated compliance checks for this project type are not yet available.",
          whatToDo: "Contact your local building department for project-specific requirements.",
        }],
      };
  }
}
