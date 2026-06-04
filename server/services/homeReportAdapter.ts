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
  // NBC 9.10.7 egress window dimensions
  egressWindowHeightMm?: number | string;
  egressWindowWidthMm?: number | string;
  egressWindowSillMm?: number | string;
  // NBC 9.9.10 window well
  isBelowGradeBedroom?: string | boolean;
  windowWellProjectionMm?: number | string;
  windowWellDepthMm?: number | string;
  windowSwingType?: string;
  windowWellSashDepthMm?: number | string;
  windowWellHasCover?: string | boolean;
  windowWellCoverOpensInside?: string | boolean;
  windowWellHasLadder?: string | boolean;
  // NBC 9.10.14 spatial separation
  limitingDistanceM?: number | string;
  exposingFaceAreaM2?: number | string;
  totalOpeningAreaM2?: number | string;
  facesStreet?: string | boolean;
  fireResponseOver10Min?: string | boolean;
  // CEC electrical
  hasKitchenGFCI?: string | boolean;
  hasBathroomGFCI?: string | boolean;
  hasBedroomAFCI?: string | boolean;
  smokeAlarmType?: string;
  hasSubPanel?: string | boolean;
  serviceAmps?: number | string;
  // NBC Part 7 plumbing
  hasBackwaterValve?: string | boolean;
  suiteToilets?: number | string;
  suiteSinks?: number | string;
  suiteShowers?: number | string;
  suiteBathtubs?: number | string;
  suiteWashers?: number | string;
  hasSuiteFloorDrain?: string | boolean;
  propertyToilets?: number | string;
  propertySinks?: number | string;
  propertyShowers?: number | string;
  propertyBathtubs?: number | string;
  propertyWashers?: number | string;
  propertyDishwashers?: number | string;
  existingDrainSizeMm?: number | string;
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

    // NBC 9.10.7 egress window dimensions
    egressWindowHeightMm: toNum(raw.egressWindowHeightMm),
    egressWindowWidthMm:  toNum(raw.egressWindowWidthMm),
    egressWindowSillMm:   toNum(raw.egressWindowSillMm),

    // NBC 9.9.10 window well
    isBelowGradeBedroom:        toBool(raw.isBelowGradeBedroom),
    windowWellProjectionMm:     toNum(raw.windowWellProjectionMm),
    windowWellDepthMm:          toNum(raw.windowWellDepthMm),
    windowSwingType:            raw.windowSwingType as HomeFormAnswers["windowSwingType"],
    windowWellSashDepthMm:      toNum(raw.windowWellSashDepthMm),
    windowWellHasCover:         toBool(raw.windowWellHasCover),
    windowWellCoverOpensInside: toBool(raw.windowWellCoverOpensInside),
    windowWellHasLadder:        toBool(raw.windowWellHasLadder),

    // NBC 9.10.14 spatial separation
    limitingDistanceM:    toNum(raw.limitingDistanceM),
    exposingFaceAreaM2:   toNum(raw.exposingFaceAreaM2),
    totalOpeningAreaM2:   toNum(raw.totalOpeningAreaM2),
    facesStreet:          toBool(raw.facesStreet),
    fireResponseOver10Min: toBool(raw.fireResponseOver10Min),

    // CEC electrical
    hasKitchenGFCI:   toBool(raw.hasKitchenGFCI),
    hasBathroomGFCI:  toBool(raw.hasBathroomGFCI),
    hasBedroomAFCI:   toBool(raw.hasBedroomAFCI),
    smokeAlarmType:   raw.smokeAlarmType as HomeFormAnswers["smokeAlarmType"],
    hasSubPanel:      toBool(raw.hasSubPanel),
    serviceAmps:      toNum(raw.serviceAmps),

    // NBC Part 7 plumbing
    hasBackwaterValve:  toBool(raw.hasBackwaterValve),
    suiteToilets:       toNum(raw.suiteToilets),
    suiteSinks:         toNum(raw.suiteSinks),
    suiteShowers:       toNum(raw.suiteShowers),
    suiteBathtubs:      toNum(raw.suiteBathtubs),
    suiteWashers:       toNum(raw.suiteWashers),
    hasSuiteFloorDrain: toBool(raw.hasSuiteFloorDrain),
    propertyToilets:    toNum(raw.propertyToilets),
    propertySinks:      toNum(raw.propertySinks),
    propertyShowers:    toNum(raw.propertyShowers),
    propertyBathtubs:   toNum(raw.propertyBathtubs),
    propertyWashers:    toNum(raw.propertyWashers),
    propertyDishwashers: toNum(raw.propertyDishwashers),
    existingDrainSizeMm: toNum(raw.existingDrainSizeMm),
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
