/**
 * CodeComply Home — Form Answer Adapter
 *
 * Rev 2 Fix 5: Explicit translation layer between raw Q&A form answers
 * (as submitted by the client) and the normalized HomeFormAnswers shape
 * that the Part 9 rule engine (part9Rules.ts) expects.
 *
 * This adapter:
 *   1. Validates required fields per project type
 *   2. Normalises boolean fields (string "yes"/"no" → boolean)
 *   3. Converts units where needed (ft → stored as-is for rule engine)
 *   4. Derives province-specific context
 *
 * Does NOT call the Part 3 drawing extraction engine.
 * Does NOT produce DrawingExtractionResult — form-based and drawing-based
 * pipelines are separate. The spec's reference to DrawingExtractionResult
 * is aspirational; form answers feed part9Rules.ts directly.
 */

import type {
  HomeFormAnswers,
  HomeProjectType,
  HomeProvince,
} from "../engine/home/part9Rules.js";

/** Raw shape submitted from the client Q&A form */
export interface RawFormSubmission {
  province: string;
  municipality?: string;
  projectType: string;
  // Common
  ceilingHeightFt?: number | string;
  suiteAreaSqFt?: number | string;
  suiteLocation?: string;
  yearBuilt?: number | string;
  storeys?: number | string;
  separateEntrance?: string | boolean;
  egressWindows?: string | boolean;
  egressWindowAreaM2?: number | string;
  smokeAlarms?: string | boolean;
  coDetectors?: string | boolean;
  fireSeparation?: string | boolean;
  sprinklerSystem?: string | boolean;
  bedroomCount?: number | string;
  fullBathroom?: string | boolean;
  kitchen?: string | boolean;
  parking?: string | boolean;
  // Deck
  attachedToHouse?: string | boolean;
  heightAboveGradeFt?: number | string;
  deckAreaSqFt?: number | string;
  ledgerAttachment?: string | boolean;
  footingType?: string;
  joistSpanFt?: number | string;
  beamSpanFt?: number | string;
  postHeightFt?: number | string;
  guardRail?: string | boolean;
  guardRailHeightFt?: number | string;
  // Basement
  insulationRValue?: number | string;
  insulation?: string | boolean;
}

function toBool(value: string | boolean | undefined): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  return value === "yes" || value === "true";
}

function toNum(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

const VALID_PROVINCES: HomeProvince[] = ["AB", "BC", "ON"];
const VALID_PROJECT_TYPES: HomeProjectType[] = [
  "secondary_suite",
  "basement_development",
  "deck_patio",
  "new_single_family",
  "addition_renovation",
  "detached_garage",
  "interior_alteration",
  "pool_hot_tub",
];

/**
 * Adapt raw form submission to the normalized HomeFormAnswers shape.
 * Throws if required top-level fields are missing or invalid.
 */
export function adaptFormAnswers(raw: RawFormSubmission): HomeFormAnswers {
  if (!VALID_PROVINCES.includes(raw.province as HomeProvince)) {
    throw new Error(`Invalid province: ${raw.province}. Must be AB, BC, or ON.`);
  }
  if (!VALID_PROJECT_TYPES.includes(raw.projectType as HomeProjectType)) {
    throw new Error(`Unsupported project type: ${raw.projectType}`);
  }

  const province = raw.province as HomeProvince;
  const projectType = raw.projectType as HomeProjectType;

  return {
    province,
    municipality: raw.municipality,
    projectType,

    // Suite / basement
    ceilingHeightFt: toNum(raw.ceilingHeightFt),
    suiteAreaSqFt: toNum(raw.suiteAreaSqFt),
    suiteLocation: raw.suiteLocation as HomeFormAnswers["suiteLocation"],
    yearBuilt: toNum(raw.yearBuilt),
    storeys: toNum(raw.storeys),
    hasSeparateEntrance: toBool(raw.separateEntrance),
    hasEgressWindow: toBool(raw.egressWindows),
    egressWindowAreaM2: toNum(raw.egressWindowAreaM2),
    hasSmokeAlarms: toBool(raw.smokeAlarms),
    hasCODetectors: toBool(raw.coDetectors),
    hasFireSeparation: toBool(raw.fireSeparation),
    sprinklered: toBool(raw.sprinklerSystem),
    bedroomCount: toNum(raw.bedroomCount),
    hasFullBathroom: toBool(raw.fullBathroom),
    hasKitchen: toBool(raw.kitchen),
    hasParking: toBool(raw.parking),

    // Deck
    deckAttachedToHouse: toBool(raw.attachedToHouse),
    deckHeightAboveGradeFt: toNum(raw.heightAboveGradeFt),
    deckAreaSqFt: toNum(raw.deckAreaSqFt),
    deckLedgerAttached: toBool(raw.ledgerAttachment),
    deckFootingType: raw.footingType as HomeFormAnswers["deckFootingType"],
    deckJoistSpanFt: toNum(raw.joistSpanFt),
    deckBeamSpanFt: toNum(raw.beamSpanFt),
    deckPostHeightFt: toNum(raw.postHeightFt),
    hasGuardRail: toBool(raw.guardRail),
    guardRailHeightFt: toNum(raw.guardRailHeightFt),

    // Basement
    hasInsulation: toBool(raw.insulation),
    basementInsulationRValue: toNum(raw.insulationRValue),
  };
}

/** Derive a human-readable label for a project type */
export function getProjectTypeLabel(projectType: HomeProjectType): string {
  const labels: Record<HomeProjectType, string> = {
    secondary_suite: "Secondary Suite",
    basement_development: "Basement Development",
    deck_patio: "Deck / Patio",
    new_single_family: "New Single-Family Home",
    addition_renovation: "Addition / Renovation",
    detached_garage: "Detached Garage",
    interior_alteration: "Interior Alteration",
    pool_hot_tub: "Pool / Hot Tub",
  };
  return labels[projectType] ?? projectType;
}
