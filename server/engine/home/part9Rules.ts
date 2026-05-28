/**
 * CodeComply Home — Part 9 Rule Tables
 *
 * Rev 2 Fix 6: Per-province rule tables. AB, BC, ON from day one.
 * Each rule is a pure function of HomeFormAnswers → RuleResult.
 * No compliance engine mutation, no drawing analysis dependency.
 *
 * Provincial codes:
 *   AB → Alberta Building Code 2019 (ABC 2019)
 *   BC → BC Building Code 2024 (BCBC 2024)   ceiling: 2.0m
 *   ON → Ontario Building Code 2012 (OBC 2012) ceiling: 1.95m
 *
 * Iron Law: This engine never touches the Part 3 rule engine,
 * occupancy classifications, or any compliance determination
 * for professional drawing analyses.
 */

export type HomeProvince = "AB" | "BC" | "ON";
export type HomeProjectType =
  | "secondary_suite"
  | "basement_development"
  | "deck_patio"
  | "new_single_family"
  | "addition_renovation"
  | "detached_garage"
  | "interior_alteration"
  | "pool_hot_tub";

export interface HomeFormAnswers {
  province: HomeProvince;
  municipality?: string;
  projectType: HomeProjectType;
  // Suite / basement
  ceilingHeightFt?: number;
  suiteAreaSqFt?: number;
  suiteLocation?: "basement" | "above_grade" | "attached_garage";
  yearBuilt?: number;
  storeys?: number;
  hasSeparateEntrance?: boolean;
  hasEgressWindow?: boolean;
  egressWindowAreaM2?: number;
  hasSmokeAlarms?: boolean;
  hasCODetectors?: boolean;
  hasFireSeparation?: boolean;
  sprinklered?: boolean;
  bedroomCount?: number;
  hasFullBathroom?: boolean;
  hasKitchen?: boolean;
  hasParking?: boolean;
  // Deck / patio
  deckAttachedToHouse?: boolean;
  deckHeightAboveGradeFt?: number;
  deckAreaSqFt?: number;
  deckLedgerAttached?: boolean;
  deckFootingType?: "concrete" | "helical" | "surface";
  deckJoistSpanFt?: number;
  deckBeamSpanFt?: number;
  deckPostHeightFt?: number;
  hasGuardRail?: boolean;
  guardRailHeightFt?: number;
  // Basement development
  basementInsulationRValue?: number;
  hasInsulation?: boolean;
}

export interface RuleResult {
  result: "pass" | "fail" | "conditional" | "not_applicable";
  plainLanguage: string;
  whatToDo?: string;
  codeReference: string;
}

export interface EvaluatedRule extends RuleResult {
  ruleId: string;
  description: string;
}

export interface Part9Rule {
  ruleId: string;
  description: string;
  province: HomeProvince | "national";
  municipality?: string;
  projectTypes: HomeProjectType[];
  evaluate: (answers: HomeFormAnswers) => RuleResult;
}

// ─── Ceiling Height ──────────────────────────────────────────────────────────

const CEILING_HEIGHT_RULES: Part9Rule[] = [
  {
    ruleId: "P9-CEILING-AB",
    description: "Minimum ceiling height",
    province: "AB",
    projectTypes: ["secondary_suite", "basement_development"],
    evaluate: (answers) => {
      const heightM = (answers.ceilingHeightFt ?? 0) * 0.3048;
      const MIN = 1.95;
      if (heightM >= MIN) return {
        result: "pass",
        plainLanguage: `Your ${answers.ceilingHeightFt}ft ceiling (${heightM.toFixed(2)}m) meets the minimum 6ft 5in (1.95m) requirement.`,
        codeReference: "ABC 2019 Section 9.7.2",
      };
      return {
        result: "fail",
        plainLanguage: `Your ${answers.ceilingHeightFt}ft ceiling (${heightM.toFixed(2)}m) is below the minimum 6ft 5in (1.95m).`,
        whatToDo: "Increase ceiling height to at least 1.95m (6ft 5in). Options: lower the floor slab or remove the existing ceiling finish if borderline.",
        codeReference: "ABC 2019 Section 9.7.2",
      };
    },
  },
  {
    ruleId: "P9-CEILING-BC",
    description: "Minimum ceiling height",
    province: "BC",
    projectTypes: ["secondary_suite", "basement_development"],
    evaluate: (answers) => {
      const heightM = (answers.ceilingHeightFt ?? 0) * 0.3048;
      const MIN = 2.0; // BC requires 5cm more than AB/ON
      if (heightM >= MIN) return {
        result: "pass",
        plainLanguage: `Your ${answers.ceilingHeightFt}ft ceiling (${heightM.toFixed(2)}m) meets BC's minimum 6ft 7in (2.0m) requirement.`,
        codeReference: "BCBC 2024 Section 9.7.2",
      };
      return {
        result: "fail",
        plainLanguage: `Your ${answers.ceilingHeightFt}ft ceiling (${heightM.toFixed(2)}m) is below BC's minimum 6ft 7in (2.0m). Note: BC requires 5cm more than Alberta.`,
        whatToDo: "Increase ceiling height to at least 2.0m (6ft 7in). BC's requirement is 5cm higher than most other provinces.",
        codeReference: "BCBC 2024 Section 9.7.2",
      };
    },
  },
  {
    ruleId: "P9-CEILING-ON",
    description: "Minimum ceiling height",
    province: "ON",
    projectTypes: ["secondary_suite", "basement_development"],
    evaluate: (answers) => {
      const heightM = (answers.ceilingHeightFt ?? 0) * 0.3048;
      const MIN = 1.95;
      if (heightM >= MIN) return {
        result: "pass",
        plainLanguage: `Your ${answers.ceilingHeightFt}ft ceiling (${heightM.toFixed(2)}m) meets the minimum 6ft 5in (1.95m) requirement.`,
        codeReference: "OBC 2012 Section 9.7.2",
      };
      return {
        result: "fail",
        plainLanguage: `Your ${answers.ceilingHeightFt}ft ceiling (${heightM.toFixed(2)}m) is below the minimum 6ft 5in (1.95m).`,
        whatToDo: "Increase ceiling height to at least 1.95m (6ft 5in).",
        codeReference: "OBC 2012 Section 9.7.2",
      };
    },
  },
];

// ─── Egress Windows ──────────────────────────────────────────────────────────

const EGRESS_WINDOW_RULES: Part9Rule[] = [
  {
    ruleId: "P9-EGRESS-AB",
    description: "Egress window in sleeping rooms",
    province: "AB",
    projectTypes: ["secondary_suite", "basement_development"],
    evaluate: (answers) => {
      if (!answers.hasEgressWindow) return {
        result: "fail",
        plainLanguage: "Sleeping rooms require an egress window.",
        whatToDo: "Install a window with a minimum 0.35m² operable opening area.",
        codeReference: "NBC 9.9.10",
      };
      const area = answers.egressWindowAreaM2 ?? 0;
      if (area >= 0.35) return {
        result: "pass",
        plainLanguage: `Your egress window (${area}m²) meets the minimum 0.35m².`,
        codeReference: "NBC 9.9.10",
      };
      return {
        result: "fail",
        plainLanguage: `Your egress window (${area}m²) is below the minimum 0.35m².`,
        whatToDo: `Increase window opening to at least 0.35m² (approx 24" × 22").`,
        codeReference: "NBC 9.9.10",
      };
    },
  },
  {
    ruleId: "P9-EGRESS-ON",
    description: "Egress window in sleeping rooms",
    province: "ON",
    projectTypes: ["secondary_suite", "basement_development"],
    evaluate: (answers) => {
      if (!answers.hasEgressWindow) return {
        result: "fail",
        plainLanguage: "Sleeping rooms require an egress window.",
        whatToDo: "Install a window with a minimum 0.35m² operable opening area.",
        codeReference: "OBC 2012 Section 9.9.10",
      };
      const area = answers.egressWindowAreaM2 ?? 0;
      if (area >= 0.35) return {
        result: "pass",
        plainLanguage: `Your egress window (${area}m²) meets the minimum 0.35m².`,
        codeReference: "OBC 2012 Section 9.9.10",
      };
      return {
        result: "fail",
        plainLanguage: `Your egress window (${area}m²) is below the minimum 0.35m².`,
        whatToDo: `Increase window opening to at least 0.35m² (approx 24" × 22").`,
        codeReference: "OBC 2012 Section 9.9.10",
      };
    },
  },
  {
    ruleId: "P9-EGRESS-BC",
    description: "Egress window in sleeping rooms",
    province: "BC",
    projectTypes: ["secondary_suite", "basement_development"],
    evaluate: (answers) => {
      if (!answers.hasEgressWindow) return {
        result: "fail",
        plainLanguage: "BC requires an egress window in all sleeping rooms.",
        whatToDo: "Install a window with minimum 0.35m² opening and no dimension less than 380mm.",
        codeReference: "BCBC 2024 Section 9.9.10",
      };
      const area = answers.egressWindowAreaM2 ?? 0;
      // BC also requires minimum 380mm in any single dimension
      if (area >= 0.35) return {
        result: "pass",
        plainLanguage: `Your egress window (${area}m²) meets BC's minimum 0.35m² requirement. Confirm no single dimension is less than 380mm.`,
        codeReference: "BCBC 2024 Section 9.9.10",
      };
      return {
        result: "fail",
        plainLanguage: `Your window opening (${area}m²) does not meet BC's minimum 0.35m².`,
        whatToDo: "Increase to at least 0.35m² with no single dimension less than 380mm (BC-specific requirement).",
        codeReference: "BCBC 2024 Section 9.9.10",
      };
    },
  },
];

// ─── Smoke Alarms ────────────────────────────────────────────────────────────

const SMOKE_ALARM_RULE: Part9Rule = {
  ruleId: "P9-SMOKE-NATIONAL",
  description: "Interconnected smoke alarms in sleeping areas",
  province: "national",
  projectTypes: ["secondary_suite", "basement_development"],
  evaluate: (answers) => {
    if (answers.hasSmokeAlarms) return {
      result: "pass",
      plainLanguage: "Interconnected smoke alarms are installed — a critical life-safety requirement.",
      codeReference: "NBC 9.10.19.3",
    };
    return {
      result: "fail",
      plainLanguage: "Interconnected smoke alarms are required in all sleeping areas and on every storey.",
      whatToDo: "Install interconnected smoke alarms in each bedroom, hallway serving bedrooms, and on every floor. Alarms must activate together (hardwired or wireless interconnect).",
      codeReference: "NBC 9.10.19.3",
    };
  },
};

// ─── CO Detectors ────────────────────────────────────────────────────────────

const CO_DETECTOR_RULE: Part9Rule = {
  ruleId: "P9-CO-NATIONAL",
  description: "Carbon monoxide detectors near sleeping areas",
  province: "national",
  projectTypes: ["secondary_suite", "basement_development"],
  evaluate: (answers) => {
    if (answers.hasCODetectors) return {
      result: "pass",
      plainLanguage: "Carbon monoxide detectors are installed.",
      codeReference: "NBC 9.33",
    };
    return {
      result: "conditional",
      plainLanguage: "CO detectors are required when a fuel-burning appliance or attached garage is present.",
      whatToDo: "If the building has any gas appliances (furnace, water heater, fireplace) or an attached garage, install a CO detector on each floor of the suite.",
      codeReference: "NBC 9.33",
    };
  },
};

// ─── Fire Separation ─────────────────────────────────────────────────────────

const FIRE_SEPARATION_RULE: Part9Rule = {
  ruleId: "P9-FIRESEP-NATIONAL",
  description: "Fire separation between suite and main dwelling",
  province: "national",
  projectTypes: ["secondary_suite"],
  evaluate: (answers) => {
    if (answers.hasFireSeparation) return {
      result: "pass",
      plainLanguage: "Fire separation between the suite and main dwelling is present.",
      codeReference: "NBC 9.10.9.7",
    };
    return {
      result: "fail",
      plainLanguage: "A minimum 30-minute fire separation is required between the secondary suite and the remainder of the building.",
      whatToDo: `Install Type X drywall (⅝") on the ceiling and walls between the suite and main dwelling. Seal all penetrations (pipes, wiring) with fire-stop caulk.`,
      codeReference: "NBC 9.10.9.7",
    };
  },
};

// ─── Deck guard rail ─────────────────────────────────────────────────────────

const DECK_GUARD_RAIL_RULE: Part9Rule = {
  ruleId: "P9-DECK-GUARD-NATIONAL",
  description: "Guard rail requirement at elevated decks",
  province: "national",
  projectTypes: ["deck_patio"],
  evaluate: (answers) => {
    const heightFt = answers.deckHeightAboveGradeFt ?? 0;
    const guardRequired = heightFt > 1.97; // 600mm
    if (!guardRequired) return {
      result: "pass",
      plainLanguage: `Deck is ${heightFt}ft above grade — below the 600mm threshold. Guard rail not required, but recommended.`,
      codeReference: "NBC 9.8.8.1",
    };
    if (!answers.hasGuardRail) return {
      result: "fail",
      plainLanguage: `Your deck is ${heightFt}ft above grade, exceeding the 600mm threshold that requires a guard rail.`,
      whatToDo: "Install a guard rail at least 900mm (35in) high. No openings may allow a 100mm sphere to pass through.",
      codeReference: "NBC 9.8.8.1",
    };
    const guardHm = (answers.guardRailHeightFt ?? 0) * 0.3048;
    if (guardHm < 0.9) return {
      result: "fail",
      plainLanguage: `Your guard rail (${answers.guardRailHeightFt}ft) is below the minimum 900mm (35in).`,
      whatToDo: "Raise the guard rail to at least 900mm. Decks more than 1.8m above grade require 1070mm guards.",
      codeReference: "NBC 9.8.8.1",
    };
    return {
      result: "pass",
      plainLanguage: `Guard rail at ${answers.guardRailHeightFt}ft meets the minimum 900mm requirement.`,
      codeReference: "NBC 9.8.8.1",
    };
  },
};

// ─── Deck footing ────────────────────────────────────────────────────────────

const DECK_FOOTING_RULE: Part9Rule = {
  ruleId: "P9-DECK-FOOTING-NATIONAL",
  description: "Deck footing below frost line",
  province: "national",
  projectTypes: ["deck_patio"],
  evaluate: (answers) => {
    if (answers.deckFootingType === "surface") return {
      result: "conditional",
      plainLanguage: "Surface/floating footings are not permitted in frost-susceptible soil without engineering review.",
      whatToDo: "Use concrete piers below the frost line (typically 1.2–1.5m) or helical piles. Surface footings are only acceptable for freestanding, low-level decks in well-drained granular soil — confirm with your municipality.",
      codeReference: "NBC 9.4.4",
    };
    return {
      result: "pass",
      plainLanguage: `${answers.deckFootingType === "concrete" ? "Concrete" : "Helical"} piers are an acceptable footing type.`,
      codeReference: "NBC 9.4.4",
    };
  },
};

// ─── Calgary-specific rules (1P2007) ─────────────────────────────────────────

const CALGARY_SMOKE_ALARM_RULE: Part9Rule = {
  ruleId: "P9-SMOKE-CALGARY",
  description: "Hardwired and interconnected smoke/CO alarms (Calgary)",
  province: "AB",
  municipality: "Calgary",
  projectTypes: ["secondary_suite", "basement_development"],
  evaluate: (answers) => {
    if (!answers.hasSmokeAlarms) {
      return {
        result: "fail",
        plainLanguage:
          "Calgary requires hardwired, interconnected smoke and CO alarms in every bedroom, common space, and mechanical room.",
        whatToDo:
          "Install hardwired smoke/CO alarms wired to the electrical panel. Battery-only alarms do not meet Calgary requirements.",
        codeReference: "Calgary 1P2007 + NBC 2023 Alberta Edition",
      };
    }
    return {
      result: "conditional",
      plainLanguage:
        "Smoke/CO alarms required. Calgary specifically requires hardwired (not battery-only) interconnected alarms.",
      whatToDo:
        "Confirm alarms are permanently wired to the electrical panel, not battery-only. Required in every bedroom, common space, and mechanical room.",
      codeReference: "Calgary 1P2007 Secondary Suite Requirements",
    };
  },
};

// ─── All rules ───────────────────────────────────────────────────────────────

export const PART9_RULES: Part9Rule[] = [
  ...CEILING_HEIGHT_RULES,
  ...EGRESS_WINDOW_RULES,
  SMOKE_ALARM_RULE,
  CO_DETECTOR_RULE,
  FIRE_SEPARATION_RULE,
  DECK_GUARD_RAIL_RULE,
  DECK_FOOTING_RULE,
  CALGARY_SMOKE_ALARM_RULE,
];

export function evaluateHomeCompliance(answers: HomeFormAnswers): EvaluatedRule[] {
  const results: EvaluatedRule[] = PART9_RULES
    .filter((rule) => {
      const provinceMatch = rule.province === answers.province || rule.province === "national";
      const municipalityMatch = rule.municipality === undefined
        || rule.municipality === answers.municipality;
      return provinceMatch && municipalityMatch && rule.projectTypes.includes(answers.projectType);
    })
    .map((rule) => ({
      ruleId: rule.ruleId,
      description: rule.description,
      ...rule.evaluate(answers),
    }));

  // Calgary Secondary Suite Incentive Program notice
  if (
    answers.municipality === "Calgary" &&
    answers.province === "AB" &&
    answers.projectType === "secondary_suite"
  ) {
    results.push({
      ruleId: "INFO-CALGARY-INCENTIVE",
      description: "Calgary Secondary Suite Incentive Program",
      result: "pass",
      plainLanguage:
        "Calgary offers up to $10,000 grant for qualifying secondary suite safety upgrades.",
      whatToDo:
        "Apply at calgary.ca before starting work. Grant covers egress windows ($1,500), smoke/CO alarms ($1,000), smoke-tight barrier ($4,000), protected exiting ($1,000), split heat ($6,000).",
      codeReference: "City of Calgary Secondary Suite Incentive Program (2025)",
    });
  }

  return results;
}

export function aggregateOverallResult(
  results: EvaluatedRule[],
): "pass" | "conditional" | "fail" {
  if (results.some((r) => r.result === "fail")) return "fail";
  if (results.some((r) => r.result === "conditional")) return "conditional";
  return "pass";
}
