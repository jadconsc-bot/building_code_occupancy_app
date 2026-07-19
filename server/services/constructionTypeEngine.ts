/**
 * Construction Type Scenario Engine
 * NBC 2025 Section 3.2.2 — Building Size and Construction Relative to Occupancy
 *
 * Implements all scenario articles (3.2.2.20–3.2.2.92) as rule objects.
 * For each occupancy group/division, evaluates every matching article and
 * returns the most permissive construction type permitted.
 *
 * Source: NBC 2025 Articles 3.2.2.20–3.2.2.92.
 * Confirmed identical structure in NBC(AE) 2023 and BCBC 2024.
 *
 * DETERMINISTIC ONLY — no LLM calls, no external dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConstructionType =
  | 'noncombustible'
  | 'combustible_or_noncombustible'
  | 'encapsulated_mass_timber_or_noncombustible'
  | 'heavy_timber_or_noncombustible';

export interface ConstructionTypeInput {
  occupancyGroup: string;
  storeys: number;
  buildingAreaM2: number;
  sprinklered: boolean;
  facingStreets?: 1 | 2 | 3;
  buildingHeightM?: number;    // metres, floor of first storey to uppermost floor
  occupantLoad?: number;       // only evaluated for A4
  limitingDistanceM?: number;  // only evaluated for A4
  lowFireLoad?: boolean;       // only evaluated for F3 3.2.2.91
  province?: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export interface ConstructionTypeResult {
  constructionType: ConstructionType;
  sprinklersRequired: boolean;
  matchingArticles: string[];
  catchAllArticle: string;
  summary: string;
  advisory: boolean;
  advisoryNote?: string;
  ruleId: string;
  nbcRef: string;
  codeEdition: string;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  evaluationTimestamp: string;
  confidence: 'confirmed' | 'inferred' | 'advisory';
  severity: 'pass' | 'fail' | 'conditional' | 'info';
  occupancyGroup: string;
  actualStoreys: number;
  actualAreaM2: number;
  assumptions: string[];
  recommendations: string[];
}

// ─── Area limit helpers ───────────────────────────────────────────────────────
// AreaLimitFn returns null (no limit) or a number (max m²).

type AreaLimitFn = (storeys: number, facingStreets: 1 | 2 | 3) => number | null;

const noLimit: AreaLimitFn = () => null;
const scalar = (m2: number): AreaLimitFn => () => m2;
const perStorey = (map: Record<number, number | null>): AreaLimitFn =>
  (s) => map[s] ?? null;
const byStreetsTable = (
  tbl: Record<number, Record<1 | 2 | 3, number | null>>
): AreaLimitFn =>
  (s, st) => {
    const row = tbl[s];
    return row ? (row[st] ?? null) : null;
  };

// ─── Scenario rules ───────────────────────────────────────────────────────────

interface ScenarioRule {
  article: string;
  occupancyGroups: string[];
  isCatchAll: boolean;
  // Conditions — all that are defined must be satisfied
  maxStoreys?: number;
  maxBuildingHeightM?: number;       // separate from storeys (metres)
  areaLimit: AreaLimitFn;
  requiresSprinklered?: true;        // article requires building to be sprinklered
  maxOccupantLoad?: number;          // A4 only
  minLimitingDistanceM?: number;     // A4 only
  lowFireLoadRequired?: boolean;     // F3-91 only
  // Conditions that require architectural knowledge (cannot be auto-evaluated)
  hasAdvisoryConditions?: boolean;
  advisoryConditions?: string;
  // Output
  constructionType: ConstructionType;
  sprinklersRequired: boolean;
}

// Permissiveness rank for picking the most permissive among matched articles.
// Higher number = more permissive = less restrictive.
const PERMISSIVENESS: Record<ConstructionType, number> = {
  noncombustible:                              1,
  heavy_timber_or_noncombustible:              2,
  encapsulated_mass_timber_or_noncombustible:  3,
  combustible_or_noncombustible:               4,
};

const RULES: ScenarioRule[] = [

  // ── GROUP A, Division 1 ─────────────────────────────────────────────────────

  {
    // 3.2.2.20 — Group A, Division 1, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.20',
    occupancyGroups: ['A1'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.21 — Group A, Division 1, One Storey, Limited Area, Sprinklered
    // Heavy timber or noncombustible; ≤1 storey, ≤600m², sprinklered, OL ≤600.
    // Advisory: also requires <40% 2-storey area for backstage/service purposes
    // and no occupancy above/below the auditorium — architectural conditions.
    article: 'NBC 3.2.2.21',
    occupancyGroups: ['A1'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: scalar(600),
    requiresSprinklered: true,
    maxOccupantLoad: 600,
    hasAdvisoryConditions: true,
    advisoryConditions: 'Requires <40% 2-storey backstage/service area and no occupancy above/below auditorium (3.2.2.21.(1)(c)(d)) — verify architecturally',
    constructionType: 'heavy_timber_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.22 — Group A, Division 1, One Storey, Sprinklered
    // Combustible or noncombustible; ≤1 storey, sprinklered, OL of auditorium ≤300.
    // Advisory: auditorium floor ≤5m above/below grade; no occupancy above/below
    // auditorium other than serving uses — architectural conditions.
    article: 'NBC 3.2.2.22',
    occupancyGroups: ['A1'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: noLimit,
    requiresSprinklered: true,
    maxOccupantLoad: 300,
    hasAdvisoryConditions: true,
    advisoryConditions: 'Requires auditorium floor ≤5m above/below grade and no occupancy above/below auditorium (3.2.2.22.(1)(c)(d)) — verify architecturally',
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },

  // ── GROUP A, Division 2 ─────────────────────────────────────────────────────

  {
    // 3.2.2.23 — Group A, Division 2, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.23',
    occupancyGroups: ['A2'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.24 — Group A, Division 2, up to 6 Storeys, Any Area, Sprinklered
    // Noncombustible, sprinklered, floor FRR ≥1h (reduced from catch-all 2h).
    article: 'NBC 3.2.2.24',
    occupancyGroups: ['A2'],
    isCatchAll: false,
    maxStoreys: 6,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.25 — Group A, Division 2, up to 2 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.25.
    // Table: 1S→1600/2000/2400m²; 2S→800/1000/1200m²
    article: 'NBC 3.2.2.25',
    occupancyGroups: ['A2'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: byStreetsTable({
      1: { 1: 1600, 2: 2000, 3: 2400 },
      2: { 1:  800, 2: 1000, 3: 1200 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.26 — Group A, Division 2, up to 2 Storeys, Increased Area, Sprinklered
    // Combustible or noncombustible; sprinklered; 1S→4800m², 2S→2400m².
    article: 'NBC 3.2.2.26',
    occupancyGroups: ['A2'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 4800, 2: 2400 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.27 — Group A, Division 2, up to 2 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered; 1S→1200m², 2S→600m².
    // Note: 3.2.2.27.(1)(c)(i) also permits 2400m² for 1-storey with no basement;
    // this engine uses conservative limits (1200/600m²) since basement status is unknown.
    article: 'NBC 3.2.2.27',
    occupancyGroups: ['A2'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 1200, 2: 600 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.28 — Group A, Division 2, One Storey (unsprinklered)
    // Combustible or noncombustible; ≤1 storey; area from Table 3.2.2.28.
    // Table: 1S→400/500/600m². (Doubled without basement with compartments — advisory.)
    article: 'NBC 3.2.2.28',
    occupancyGroups: ['A2'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: byStreetsTable({
      1: { 1: 400, 2: 500, 3: 600 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },

  // ── GROUP A, Division 3 ─────────────────────────────────────────────────────

  {
    // 3.2.2.29 — Group A, Division 3, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.29',
    occupancyGroups: ['A3'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.30 — Group A, Division 3, up to 2 Storeys (unsprinklered)
    // Noncombustible (heavy timber permitted for roof assembly and arches only);
    // area from Table 3.2.2.30.
    // Table: 1S→4000/5000/6000m²; 2S→2000/2500/3000m²
    article: 'NBC 3.2.2.30',
    occupancyGroups: ['A3'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: byStreetsTable({
      1: { 1: 4000, 2: 5000, 3: 6000 },
      2: { 1: 2000, 2: 2500, 3: 3000 },
    }),
    constructionType: 'noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.31 — Group A, Division 3, up to 2 Storeys, Sprinklered
    // Noncombustible (arches permitted as heavy timber); 1S→12000m², 2S→6000m².
    article: 'NBC 3.2.2.31',
    occupancyGroups: ['A3'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 12000, 2: 6000 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.32 — Group A, Division 3, One Storey, Increased Area (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.32.
    // Table: 1 street→2400m²; 2 streets→3000m²; 3 streets→3600m²
    article: 'NBC 3.2.2.32',
    occupancyGroups: ['A3'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: byStreetsTable({
      1: { 1: 2400, 2: 3000, 3: 3600 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.33 — Group A, Division 3, One Storey, Sprinklered
    // Combustible or noncombustible; sprinklered; ≤7200m².
    article: 'NBC 3.2.2.33',
    occupancyGroups: ['A3'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: scalar(7200),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.34 — Group A, Division 3, One Storey (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.34.
    // Table: 1 street→1000m²; 2 streets→1250m²; 3 streets→1500m²
    article: 'NBC 3.2.2.34',
    occupancyGroups: ['A3'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: byStreetsTable({
      1: { 1: 1000, 2: 1250, 3: 1500 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },

  // ── GROUP A, Division 4 ─────────────────────────────────────────────────────

  {
    // 3.2.2.35 — Group A, Division 4 (default: noncombustible)
    // A4 shall be of noncombustible construction (Sentence 1).
    // Roof assemblies and supporting members may be heavy timber (Sentence 2).
    // This rule is the catch-all; the combustible exception below may override it.
    article: 'NBC 3.2.2.35',
    occupancyGroups: ['A4'],
    isCatchAll: true,
    areaLimit: noLimit,
    constructionType: 'noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.35 Sentence (3) — Group A, Division 4, Combustible Exception
    // Combustible permitted when occupant load < 1500 AND limiting distance ≥ 6m.
    article: 'NBC 3.2.2.35 Sentence (3)',
    occupancyGroups: ['A4'],
    isCatchAll: false,
    areaLimit: noLimit,
    maxOccupantLoad: 1499,
    minLimitingDistanceM: 6,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },

  // ── GROUP B, Division 1 ─────────────────────────────────────────────────────

  {
    // 3.2.2.36 — Group B, Division 1, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.36',
    occupancyGroups: ['B1'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.37 — Group B, Division 1, up to 3 Storeys, Sprinklered
    // Noncombustible (reduced FRR); sprinklered; 1S→no limit, 2S→12000m², 3S→8000m².
    article: 'NBC 3.2.2.37',
    occupancyGroups: ['B1'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: perStorey({ 1: null, 2: 12000, 3: 8000 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },

  // ── GROUP B, Division 2 ─────────────────────────────────────────────────────

  {
    // 3.2.2.38 — Group B, Division 2, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.38',
    occupancyGroups: ['B2'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.39 — Group B, Division 2, up to 3 Storeys, Sprinklered
    // Noncombustible (reduced FRR); 1S→no limit, 2S→12000m², 3S→8000m².
    article: 'NBC 3.2.2.39',
    occupancyGroups: ['B2'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: perStorey({ 1: null, 2: 12000, 3: 8000 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.40 — Group B, Division 2, up to 2 Storeys, Sprinklered
    // Combustible or noncombustible; 1S→2400m², 2S→1600m².
    article: 'NBC 3.2.2.40',
    occupancyGroups: ['B2'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 2400, 2: 1600 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.41 — Group B, Division 2, One Storey, Sprinklered
    // Combustible or noncombustible; ≤1 storey; ≤500m².
    article: 'NBC 3.2.2.41',
    occupancyGroups: ['B2'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: scalar(500),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },

  // ── GROUP B, Division 3 ─────────────────────────────────────────────────────

  {
    // 3.2.2.42 — Group B, Division 3, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.42',
    occupancyGroups: ['B3'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.43 — Group B, Division 3, up to 3 Storeys (Noncombustible), Sprinklered
    // Noncombustible (reduced FRR); 1S→no limit, 2S→12000m², 3S→8000m².
    article: 'NBC 3.2.2.43',
    occupancyGroups: ['B3'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: perStorey({ 1: null, 2: 12000, 3: 8000 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.44 — Group B, Division 3, up to 3 Storeys, Sprinklered
    // Combustible or noncombustible; 1S→5400m², 2S→2700m², 3S→1800m².
    article: 'NBC 3.2.2.44',
    occupancyGroups: ['B3'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: perStorey({ 1: 5400, 2: 2700, 3: 1800 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.45 — Group B, Division 3, up to 2 Storeys, Sprinklered
    // Combustible or noncombustible; 1S→2400m², 2S→1600m².
    article: 'NBC 3.2.2.45',
    occupancyGroups: ['B3'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 2400, 2: 1600 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.46 — Group B, Division 3, One Storey, Sprinklered
    // Combustible or noncombustible; ≤1 storey; ≤600m².
    article: 'NBC 3.2.2.46',
    occupancyGroups: ['B3'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: scalar(600),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },

  // ── GROUP C ─────────────────────────────────────────────────────────────────

  {
    // 3.2.2.47 — Group C, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.47',
    occupancyGroups: ['C'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.48 — Group C, up to 12 Storeys, Sprinklered
    // Encapsulated mass timber or noncombustible; ≤12 storeys, ≤50m height,
    // ≤6000m²; sprinklered.
    article: 'NBC 3.2.2.48',
    occupancyGroups: ['C'],
    isCatchAll: false,
    maxStoreys: 12,
    maxBuildingHeightM: 50,
    areaLimit: scalar(6000),
    requiresSprinklered: true,
    constructionType: 'encapsulated_mass_timber_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.49 — Group C, up to 6 Storeys, Sprinklered, Noncombustible Construction
    // Noncombustible; sprinklered; 1S/2S→no limit, 3S→12000m², 4S→9000m²,
    // 5S→7200m², 6S→6000m².
    article: 'NBC 3.2.2.49',
    occupancyGroups: ['C'],
    isCatchAll: false,
    maxStoreys: 6,
    areaLimit: perStorey({ 1: null, 2: null, 3: 12000, 4: 9000, 5: 7200, 6: 6000 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.50 — Group C, up to 3 Storeys, Noncombustible Construction (unsprinklered)
    // Noncombustible; area from Table 3.2.2.50.
    // 1S→no limit; 2S→6000/no limit/no limit; 3S→4000/5000/6000m²
    article: 'NBC 3.2.2.50',
    occupancyGroups: ['C'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: byStreetsTable({
      1: { 1: null, 2: null,  3: null  },
      2: { 1: 6000, 2: null,  3: null  },
      3: { 1: 4000, 2: 5000,  3: 6000  },
    }),
    constructionType: 'noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.51 — Group C, up to 6 Storeys, Sprinklered
    // Combustible or noncombustible; ≤6 storeys, ≤18m building height (floor 1
    // to uppermost floor), sprinklered; area per-storey list.
    // 1S→9000m², 2S→4500m², 3S→3000m², 4S→2250m², 5S→1800m², 6S→1500m²
    article: 'NBC 3.2.2.51',
    occupancyGroups: ['C'],
    isCatchAll: false,
    maxStoreys: 6,
    maxBuildingHeightM: 18,
    areaLimit: perStorey({ 1: 9000, 2: 4500, 3: 3000, 4: 2250, 5: 1800, 6: 1500 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.52 — Group C, up to 4 Storeys, Sprinklered
    // Combustible or noncombustible; ≤4 storeys, sprinklered.
    // 1S→7200m², 2S→3600m², 3S→2400m², 4S→1800m²
    article: 'NBC 3.2.2.52',
    occupancyGroups: ['C'],
    isCatchAll: false,
    maxStoreys: 4,
    areaLimit: perStorey({ 1: 7200, 2: 3600, 3: 2400, 4: 1800 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.53 — Group C, up to 3 Storeys, Increased Area (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.53.
    // 1S→2400/3000/3600m²; 2S→1200/1500/1800m²; 3S→800/1000/1200m²
    article: 'NBC 3.2.2.53',
    occupancyGroups: ['C'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: byStreetsTable({
      1: { 1: 2400, 2: 3000, 3: 3600 },
      2: { 1: 1200, 2: 1500, 3: 1800 },
      3: { 1:  800, 2: 1000, 3: 1200 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.54 — Group C, up to 3 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.54.
    // 1S→1800/2250/2700m²; 2S→900/1125/1350m²; 3S→600/750/900m²
    article: 'NBC 3.2.2.54',
    occupancyGroups: ['C'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: byStreetsTable({
      1: { 1: 1800, 2: 2250, 3: 2700 },
      2: { 1:  900, 2: 1125, 3: 1350 },
      3: { 1:  600, 2:  750, 3:  900 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.55 — Group C, up to 3 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→5400m², 2S→2700m², 3S→1800m²
    article: 'NBC 3.2.2.55',
    occupancyGroups: ['C'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: perStorey({ 1: 5400, 2: 2700, 3: 1800 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },

  // ── GROUP D ─────────────────────────────────────────────────────────────────

  {
    // 3.2.2.56 — Group D, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.56',
    occupancyGroups: ['D'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.57 — Group D, up to 12 Storeys, Sprinklered
    // Encapsulated mass timber or noncombustible; ≤12 storeys, ≤50m height,
    // ≤7200m²; sprinklered.
    article: 'NBC 3.2.2.57',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 12,
    maxBuildingHeightM: 50,
    areaLimit: scalar(7200),
    requiresSprinklered: true,
    constructionType: 'encapsulated_mass_timber_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.58 — Group D, up to 6 Storeys (unsprinklered)
    // Noncombustible; area from Table 3.2.2.58.
    // 1S→no limit; 2S→7200/no limit/no limit; 3S→4800/6000/7200m²;
    // 4S→3600/4500/5400m²; 5S→2880/3600/4320m²; 6S→2400/3000/3600m²
    article: 'NBC 3.2.2.58',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 6,
    areaLimit: byStreetsTable({
      1: { 1: null,  2: null,  3: null  },
      2: { 1: 7200,  2: null,  3: null  },
      3: { 1: 4800,  2: 6000,  3: 7200  },
      4: { 1: 3600,  2: 4500,  3: 5400  },
      5: { 1: 2880,  2: 3600,  3: 4320  },
      6: { 1: 2400,  2: 3000,  3: 3600  },
    }),
    constructionType: 'noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.59 — Group D, up to 6 Storeys, Sprinklered, Noncombustible Construction
    // Noncombustible; sprinklered; 1S/2S→no limit, 3S→14400m², 4S→10800m²,
    // 5S→8640m², 6S→7200m².
    article: 'NBC 3.2.2.59',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 6,
    areaLimit: perStorey({ 1: null, 2: null, 3: 14400, 4: 10800, 5: 8640, 6: 7200 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.60 — Group D, up to 6 Storeys, Sprinklered
    // Combustible or noncombustible; ≤6 storeys, ≤18m building height, sprinklered.
    // 1S→18000m², 2S→9000m², 3S→6000m², 4S→4500m², 5S→3600m², 6S→3000m²
    article: 'NBC 3.2.2.60',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 6,
    maxBuildingHeightM: 18,
    areaLimit: perStorey({ 1: 18000, 2: 9000, 3: 6000, 4: 4500, 5: 3600, 6: 3000 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.61 — Group D, up to 4 Storeys, Sprinklered
    // Combustible or noncombustible; ≤4 storeys, ≤3600m²; sprinklered.
    article: 'NBC 3.2.2.61',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 4,
    areaLimit: scalar(3600),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.62 — Group D, up to 3 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.62.
    // 1S→4800/6000/7200m²; 2S→2400/3000/3600m²; 3S→1600/2000/2400m²
    article: 'NBC 3.2.2.62',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: byStreetsTable({
      1: { 1: 4800, 2: 6000, 3: 7200 },
      2: { 1: 2400, 2: 3000, 3: 3600 },
      3: { 1: 1600, 2: 2000, 3: 2400 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.63 — Group D, up to 3 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→14400m², 2S→7200m², 3S→4800m²
    article: 'NBC 3.2.2.63',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: perStorey({ 1: 14400, 2: 7200, 3: 4800 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.64 — Group D, up to 2 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.64.
    // 1S→1000/1250/1500m²; 2S→800/1000/1200m²
    article: 'NBC 3.2.2.64',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: byStreetsTable({
      1: { 1: 1000, 2: 1250, 3: 1500 },
      2: { 1:  800, 2: 1000, 3: 1200 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.65 — Group D, up to 2 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→3000m², 2S→2400m²
    article: 'NBC 3.2.2.65',
    occupancyGroups: ['D'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 3000, 2: 2400 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },

  // ── GROUP E ─────────────────────────────────────────────────────────────────

  {
    // 3.2.2.66 — Group E, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.66',
    occupancyGroups: ['E'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.67 — Group E, up to 4 Storeys, Sprinklered
    // Combustible or noncombustible; ≤4 storeys, ≤1800m²; sprinklered.
    article: 'NBC 3.2.2.67',
    occupancyGroups: ['E'],
    isCatchAll: false,
    maxStoreys: 4,
    areaLimit: scalar(1800),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.68 — Group E, up to 3 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.68.
    // Note: Table 3.2.2.68 has 1500m² for 1 storey regardless of streets facing.
    // 1S→1500/1500/1500m²; 2S→1200/1500/1500m²; 3S→800/1000/1500m²
    article: 'NBC 3.2.2.68',
    occupancyGroups: ['E'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: byStreetsTable({
      1: { 1: 1500, 2: 1500, 3: 1500 },
      2: { 1: 1200, 2: 1500, 3: 1500 },
      3: { 1:  800, 2: 1000, 3: 1500 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.69 — Group E, up to 3 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→7200m², 2S→3600m², 3S→2400m²
    article: 'NBC 3.2.2.69',
    occupancyGroups: ['E'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: perStorey({ 1: 7200, 2: 3600, 3: 2400 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.70 — Group E, up to 2 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.70.
    // 1S→1000/1250/1500m²; 2S→600/750/900m²
    article: 'NBC 3.2.2.70',
    occupancyGroups: ['E'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: byStreetsTable({
      1: { 1: 1000, 2: 1250, 3: 1500 },
      2: { 1:  600, 2:  750, 3:  900 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.71 — Group E, up to 2 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→3000m², 2S→1800m²
    article: 'NBC 3.2.2.71',
    occupancyGroups: ['E'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 3000, 2: 1800 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },

  // ── GROUP F, Division 1 ─────────────────────────────────────────────────────

  {
    // 3.2.2.72 — Group F, Division 1, up to 4 Storeys, Sprinklered
    // Catch-all for F1: noncombustible, sprinklered; ≤4 storeys.
    // 1S→9000m², 2S→4500m², 3S→3000m², 4S→2250m²
    article: 'NBC 3.2.2.72',
    occupancyGroups: ['F1'],
    isCatchAll: true,
    maxStoreys: 4,
    areaLimit: perStorey({ 1: 9000, 2: 4500, 3: 3000, 4: 2250 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.73 — Group F, Division 1, up to 3 Storeys, Sprinklered
    // Heavy timber or noncombustible; sprinklered.
    // 1S→3600m², 2S→1800m², 3S→1200m²
    article: 'NBC 3.2.2.73',
    occupancyGroups: ['F1'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: perStorey({ 1: 3600, 2: 1800, 3: 1200 }),
    requiresSprinklered: true,
    constructionType: 'heavy_timber_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.74 — Group F, Division 1, up to 2 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→2400m², 2S→1200m²
    article: 'NBC 3.2.2.74',
    occupancyGroups: ['F1'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 2400, 2: 1200 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.75 — Group F, Division 1, One Storey (unsprinklered)
    // Combustible or noncombustible; ≤1 storey; ≤800m².
    article: 'NBC 3.2.2.75',
    occupancyGroups: ['F1'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: scalar(800),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },

  // ── GROUP F, Division 2 ─────────────────────────────────────────────────────

  {
    // 3.2.2.76 — Group F, Division 2, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.76',
    occupancyGroups: ['F2'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.77 — Group F, Division 2, up to 4 Storeys, Increased Area, Sprinklered
    // Noncombustible (note: despite "Increased Area", still noncombustible);
    // sprinklered; 1S→18000m², 2S→9000m², 3S→6000m², 4S→4500m².
    article: 'NBC 3.2.2.77',
    occupancyGroups: ['F2'],
    isCatchAll: false,
    maxStoreys: 4,
    areaLimit: perStorey({ 1: 18000, 2: 9000, 3: 6000, 4: 4500 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.78 — Group F, Division 2, up to 3 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.78.
    // 1S→1500/1500/1500m²; 2S→1500/1500/1500m²; 3S→1070/1340/1500m²
    article: 'NBC 3.2.2.78',
    occupancyGroups: ['F2'],
    isCatchAll: false,
    maxStoreys: 3,
    areaLimit: byStreetsTable({
      1: { 1: 1500, 2: 1500, 3: 1500 },
      2: { 1: 1500, 2: 1500, 3: 1500 },
      3: { 1: 1070, 2: 1340, 3: 1500 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.79 — Group F, Division 2, up to 4 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→9600m², 2S→4800m², 3S→3200m², 4S→2400m²
    article: 'NBC 3.2.2.79',
    occupancyGroups: ['F2'],
    isCatchAll: false,
    maxStoreys: 4,
    areaLimit: perStorey({ 1: 9600, 2: 4800, 3: 3200, 4: 2400 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.80 — Group F, Division 2, up to 2 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.80.
    // 1S→1000/1250/1500m²; 2S→600/750/900m²
    article: 'NBC 3.2.2.80',
    occupancyGroups: ['F2'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: byStreetsTable({
      1: { 1: 1000, 2: 1250, 3: 1500 },
      2: { 1:  600, 2:  750, 3:  900 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.81 — Group F, Division 2, up to 2 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→4500m², 2S→1800m²
    article: 'NBC 3.2.2.81',
    occupancyGroups: ['F2'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 4500, 2: 1800 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },

  // ── GROUP F, Division 3 ─────────────────────────────────────────────────────

  {
    // 3.2.2.82 — Group F, Division 3, Any Height, Any Area, Sprinklered
    // Catch-all: noncombustible, sprinklered, floor FRR ≥2h.
    article: 'NBC 3.2.2.82',
    occupancyGroups: ['F3'],
    isCatchAll: true,
    areaLimit: noLimit,
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.83 — Group F, Division 3, up to 6 Storeys (unsprinklered)
    // Noncombustible; area from Table 3.2.2.83.
    // 1S→no limit; 2S→7200/9000/10800m²; 3S→4800/6000/7200m²;
    // 4S→3600/4500/5400m²; 5S→2880/3600/4320m²; 6S→2400/3000/3600m²
    article: 'NBC 3.2.2.83',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 6,
    areaLimit: byStreetsTable({
      1: { 1: null,  2: null,  3: null  },
      2: { 1: 7200,  2: 9000,  3: 10800 },
      3: { 1: 4800,  2: 6000,  3: 7200  },
      4: { 1: 3600,  2: 4500,  3: 5400  },
      5: { 1: 2880,  2: 3600,  3: 4320  },
      6: { 1: 2400,  2: 3000,  3: 3600  },
    }),
    constructionType: 'noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.84 — Group F, Division 3, up to 6 Storeys, Sprinklered
    // Noncombustible; sprinklered; 1S→no limit, 2S→21600m², 3S→14400m²,
    // 4S→10800m², 5S→8640m², 6S→7200m².
    article: 'NBC 3.2.2.84',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 6,
    areaLimit: perStorey({ 1: null, 2: 21600, 3: 14400, 4: 10800, 5: 8640, 6: 7200 }),
    requiresSprinklered: true,
    constructionType: 'noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.85 — Group F, Division 3, up to 4 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.85.
    // 1S→4800/6000/7200m²; 2S→2400/3000/3600m²; 3S→1600/2000/2400m²; 4S→1200/1500/1800m²
    article: 'NBC 3.2.2.85',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 4,
    areaLimit: byStreetsTable({
      1: { 1: 4800, 2: 6000, 3: 7200 },
      2: { 1: 2400, 2: 3000, 3: 3600 },
      3: { 1: 1600, 2: 2000, 3: 2400 },
      4: { 1: 1200, 2: 1500, 3: 1800 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.86 — Group F, Division 3, up to 4 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→14400m², 2S→7200m², 3S→4800m², 4S→3600m²
    article: 'NBC 3.2.2.86',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 4,
    areaLimit: perStorey({ 1: 14400, 2: 7200, 3: 4800, 4: 3600 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.87 — Group F, Division 3, up to 2 Storeys (unsprinklered)
    // Combustible or noncombustible; area from Table 3.2.2.87.
    // 1S→1600/2000/2400m²; 2S→800/1000/1200m²
    article: 'NBC 3.2.2.87',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: byStreetsTable({
      1: { 1: 1600, 2: 2000, 3: 2400 },
      2: { 1:  800, 2: 1000, 3: 1200 },
    }),
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.88 — Group F, Division 3, up to 2 Storeys, Sprinklered
    // Combustible or noncombustible; sprinklered.
    // 1S→7200m², 2S→2400m²
    article: 'NBC 3.2.2.88',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 2,
    areaLimit: perStorey({ 1: 7200, 2: 2400 }),
    requiresSprinklered: true,
    constructionType: 'combustible_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.89 — Group F, Division 3, One Storey (unsprinklered)
    // Heavy timber or noncombustible; ≤1 storey; area from Table 3.2.2.89.
    // 1 street→5600m²; 2 streets→7000m²; 3 streets→8400m²
    article: 'NBC 3.2.2.89',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: byStreetsTable({
      1: { 1: 5600, 2: 7000, 3: 8400 },
    }),
    constructionType: 'heavy_timber_or_noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.90 — Group F, Division 3, One Storey, Sprinklered
    // Heavy timber or noncombustible; ≤1 storey; ≤16800m²; sprinklered.
    article: 'NBC 3.2.2.90',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: scalar(16800),
    requiresSprinklered: true,
    constructionType: 'heavy_timber_or_noncombustible',
    sprinklersRequired: true,
  },
  {
    // 3.2.2.91 — Group F, Division 3, One Storey, Any Area, Low Fire Load Occupancy
    // Noncombustible; 1 storey; no area limit; low fire load only (power plants,
    // noncombustible materials manufacture/storage).
    article: 'NBC 3.2.2.91',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    maxStoreys: 1,
    areaLimit: noLimit,
    lowFireLoadRequired: true,
    constructionType: 'noncombustible',
    sprinklersRequired: false,
  },
  {
    // 3.2.2.92 — Group F, Division 3, Storage Garages up to 22 m High
    // Noncombustible; open-air storeys only; ≤10000m²; no FRR required.
    // Advisory: "open-air storeys" is an architectural condition.
    article: 'NBC 3.2.2.92',
    occupancyGroups: ['F3'],
    isCatchAll: false,
    areaLimit: scalar(10000),
    hasAdvisoryConditions: true,
    advisoryConditions: 'Requires all storeys to be open-air storeys and no other occupancy above (3.2.2.92.(1)) — verify architecturally',
    constructionType: 'noncombustible',
    sprinklersRequired: false,
  },
];

// ─── Evaluator ────────────────────────────────────────────────────────────────

function conditionsMet(rule: ScenarioRule, input: ConstructionTypeInput): boolean {
  const streets = (input.facingStreets ?? 1) as 1 | 2 | 3;

  if (rule.requiresSprinklered && !input.sprinklered) return false;

  if (rule.maxStoreys !== undefined && input.storeys > rule.maxStoreys) return false;

  if (rule.maxBuildingHeightM !== undefined) {
    if (input.buildingHeightM !== undefined && input.buildingHeightM > rule.maxBuildingHeightM) {
      return false;
    }
    // If buildingHeightM is not provided, we can't rule out the article —
    // the advisory flag will note this.
  }

  const areaMax = rule.areaLimit(input.storeys, streets);
  if (areaMax !== null && input.buildingAreaM2 > areaMax) return false;

  if (rule.maxOccupantLoad !== undefined) {
    if (input.occupantLoad === undefined) return false; // can't evaluate
    if (input.occupantLoad > rule.maxOccupantLoad) return false;
  }

  if (rule.minLimitingDistanceM !== undefined) {
    if (input.limitingDistanceM === undefined) return false; // can't evaluate
    if (input.limitingDistanceM < rule.minLimitingDistanceM) return false;
  }

  if (rule.lowFireLoadRequired && !input.lowFireLoad) return false;

  return true;
}

export function evaluateConstructionType(
  input: ConstructionTypeInput
): ConstructionTypeResult {
  const timestamp = new Date().toISOString();
  const group = input.occupancyGroup.replace(/-/g, '').toUpperCase();
  const streets = (input.facingStreets ?? 1) as 1 | 2 | 3;

  const codeEdition = input.province === 'AB' ? 'NBC(AE) 2023'
                    : input.province === 'BC' ? 'BCBC 2024'
                    : 'NBC 2025';

  const assumptions: string[] = [];
  const recommendations: string[] = [];

  if (!input.facingStreets) {
    assumptions.push('Number of streets faced not provided — defaulting to 1 street for area limit evaluation (conservative)');
  }

  // Filter rules to this occupancy group
  const groupRules = RULES.filter(r => r.occupancyGroups.includes(group));

  if (groupRules.length === 0) {
    return {
      constructionType: 'noncombustible',
      sprinklersRequired: false,
      matchingArticles: [],
      catchAllArticle: '',
      summary: `Occupancy group '${group}' not found in NBC 3.2.2 scenario rules — noncombustible assumed for safety`,
      advisory: true,
      advisoryNote: 'Verify occupancy classification; no matching articles found',
      ruleId: `CT-3.2.2-UNKNOWN`,
      nbcRef: 'NBC 2025 Section 3.2.2',
      codeEdition,
      jurisdictionSource: input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence: 'advisory',
      severity: 'info',
      occupancyGroup: group,
      actualStoreys: input.storeys,
      actualAreaM2: input.buildingAreaM2,
      assumptions,
      recommendations: ['Verify occupancy classification before permit submission'],
    };
  }

  const catchAllRule = groupRules.find(r => r.isCatchAll);
  const catchAllArticle = catchAllRule?.article ?? '';

  // Evaluate all rules for this group
  const matchingRules = groupRules.filter(r => conditionsMet(r, input));

  // If nothing matched (e.g. F1 building >4 storeys), fall back to advisory noncombustible
  if (matchingRules.length === 0) {
    recommendations.push(
      `No NBC 3.2.2 scenario article covers Group ${group} at ${input.storeys} storeys — building may require alternative solution per NBC 3.2.2.2`
    );
    return {
      constructionType: 'noncombustible',
      sprinklersRequired: false,
      matchingArticles: [],
      catchAllArticle,
      summary: `No scenario article in Section 3.2.2 covers Group ${group} at ${input.storeys} storeys with ${Math.round(input.buildingAreaM2)} m² — noncombustible assumed`,
      advisory: true,
      advisoryNote: 'Building may exceed all article limits; consult NBC 3.2.2.2 (Special and Unusual Structures)',
      ruleId: `CT-3.2.2-${group}-${input.province ?? 'CA'}`,
      nbcRef: 'NBC 2025 Section 3.2.2',
      codeEdition,
      jurisdictionSource: input.jurisdictionSource,
      evaluationTimestamp: timestamp,
      confidence: 'advisory',
      severity: 'info',
      occupancyGroup: group,
      actualStoreys: input.storeys,
      actualAreaM2: input.buildingAreaM2,
      assumptions,
      recommendations,
    };
  }

  // Pick the most permissive construction type among matched rules
  let bestType: ConstructionType = 'noncombustible';
  for (const rule of matchingRules) {
    if (PERMISSIVENESS[rule.constructionType] > PERMISSIVENESS[bestType]) {
      bestType = rule.constructionType;
    }
  }

  // Sprinklers required if ANY matching rule requires them
  // (catches the case where the most permissive type was the sprinklered article)
  const sprinklersRequired = matchingRules.some(r => r.sprinklersRequired);

  // Advisory: any matching rule has conditions we couldn't fully evaluate
  const advisoryRules = matchingRules.filter(
    r => r.hasAdvisoryConditions ||
         (r.maxBuildingHeightM !== undefined && input.buildingHeightM === undefined)
  );
  const isAdvisory = advisoryRules.length > 0;
  const advisoryNotes = advisoryRules
    .map(r => {
      if (r.maxBuildingHeightM !== undefined && input.buildingHeightM === undefined) {
        return `${r.article}: building height (metres) not provided — height ≤${r.maxBuildingHeightM}m condition not verified`;
      }
      return r.advisoryConditions ?? '';
    })
    .filter(Boolean);

  const matchingArticleIds = matchingRules.map(r => r.article);

  const typeDisplay: Record<ConstructionType, string> = {
    noncombustible:                             'Noncombustible',
    combustible_or_noncombustible:              'Combustible or Noncombustible',
    encapsulated_mass_timber_or_noncombustible: 'Encapsulated Mass Timber or Noncombustible',
    heavy_timber_or_noncombustible:             'Heavy Timber or Noncombustible',
  };

  const summary = `Group ${group}: ${typeDisplay[bestType]} permitted under ${matchingArticleIds.join(', ')} (${input.storeys} storeys, ${Math.round(input.buildingAreaM2)} m², ${input.sprinklered ? '' : 'un'}sprinklered, facing ${streets} street${streets > 1 ? 's' : ''})`;

  if (bestType === 'combustible_or_noncombustible') {
    recommendations.push('Combustible construction permitted — confirm building area and storey count against matching articles');
  }
  if (bestType === 'encapsulated_mass_timber_or_noncombustible') {
    recommendations.push('Encapsulated mass timber permitted per NBC 3.2.2 — EMT construction must comply with NBC 3.1.6 and 3.2.3');
  }

  return {
    constructionType: bestType,
    sprinklersRequired,
    matchingArticles: matchingArticleIds,
    catchAllArticle,
    summary,
    advisory: isAdvisory,
    advisoryNote: isAdvisory ? advisoryNotes.join('; ') : undefined,
    ruleId: `CT-3.2.2-${group}-${input.province ?? 'CA'}`,
    nbcRef: `NBC 2025 Section 3.2.2 (${matchingArticleIds[0]})`,
    codeEdition,
    jurisdictionSource: input.jurisdictionSource,
    evaluationTimestamp: timestamp,
    confidence: isAdvisory ? 'inferred' : 'confirmed',
    severity: 'pass',
    occupancyGroup: group,
    actualStoreys: input.storeys,
    actualAreaM2: input.buildingAreaM2,
    assumptions,
    recommendations,
  };
}

// ─── Legacy compatibility shim ────────────────────────────────────────────────
// The old signature used `totalAreaM2` and `province`; callers are updated in
// Step 6 of the redesign. This shim bridges the gap during the transition.

export interface LegacyConstructionTypeInput {
  occupancyGroup: string;
  storeys: number;
  sprinklered: boolean;
  totalAreaM2: number;
  province: string;
  facingStreets?: 1 | 2 | 3;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
}

export function determineConstructionType(
  input: LegacyConstructionTypeInput
): ConstructionTypeResult {
  return evaluateConstructionType({
    occupancyGroup: input.occupancyGroup,
    storeys: input.storeys,
    buildingAreaM2: input.totalAreaM2,
    sprinklered: input.sprinklered,
    facingStreets: input.facingStreets,
    province: input.province,
    jurisdictionSource: input.jurisdictionSource,
  });
}
