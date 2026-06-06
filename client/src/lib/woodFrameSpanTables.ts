/**
 * NBC Part 9 Section 9.23.4.2 Span Tables
 * Source: National Building Code of Canada
 * Tables A–G for joists, rafters, and beams
 * Values in metres
 */

export type SpeciesGroup = 'SPF' | 'HF' | 'DFL' | 'Northern';
export type LumberSize   = '38x89' | '38x140' | '38x184' | '38x235' | '38x286';
export type SpacingMm    = 300 | 400 | 600;

function ftInToM(s: string): number {
  const m = s.match(/^(\d+)-(\d+)$/);
  if (!m) return 0;
  const ft = parseInt(m[1]);
  const inches = parseInt(m[2]);
  return +((ft * 12 + inches) * 0.0254).toFixed(2);
}

// ── TABLE A: Floor Joists — Living Areas (1.9 kPa live load) ─────────────────
// NBC Span Table 9.23.4.2-A  No.1/No.2 grade
export const FLOOR_JOIST_SPANS: Record<SpeciesGroup, Record<LumberSize, Record<SpacingMm, number>>> = {
  HF: {
    '38x89':  { 300: ftInToM("6-10"), 400: ftInToM("6-2"),  600: ftInToM("5-5")  },
    '38x140': { 300: ftInToM("10-9"), 400: ftInToM("9-9"),  600: ftInToM("8-7")  },
    '38x184': { 300: ftInToM("13-9"), 400: ftInToM("12-9"), 600: ftInToM("11-3") },
    '38x235': { 300: ftInToM("15-10"),400: ftInToM("14-9"), 600: ftInToM("13-9") },
    '38x286': { 300: ftInToM("17-9"), 400: ftInToM("16-7"), 600: ftInToM("15-5") },
  },
  SPF: {
    '38x89':  { 300: ftInToM("6-6"),  400: ftInToM("5-11"), 600: ftInToM("5-2")  },
    '38x140': { 300: ftInToM("10-3"), 400: ftInToM("9-4"),  600: ftInToM("8-1")  },
    '38x184': { 300: ftInToM("13-1"), 400: ftInToM("12-2"), 600: ftInToM("10-8") },
    '38x235': { 300: ftInToM("15-1"), 400: ftInToM("14-1"), 600: ftInToM("13-1") },
    '38x286': { 300: ftInToM("16-11"),400: ftInToM("15-9"), 600: ftInToM("14-8") },
  },
  DFL: {
    '38x89':  { 300: ftInToM("7-2"),  400: ftInToM("6-6"),  600: ftInToM("5-8")  },
    '38x140': { 300: ftInToM("11-3"), 400: ftInToM("10-3"), 600: ftInToM("9-0")  },
    '38x184': { 300: ftInToM("14-5"), 400: ftInToM("13-1"), 600: ftInToM("11-6") },
    '38x235': { 300: ftInToM("16-7"), 400: ftInToM("15-1"), 600: ftInToM("13-2") },
    '38x286': { 300: ftInToM("18-7"), 400: ftInToM("16-11"),600: ftInToM("14-10")},
  },
  Northern: {
    '38x89':  { 300: ftInToM("5-10"), 400: ftInToM("5-4"),  600: ftInToM("4-8")  },
    '38x140': { 300: ftInToM("9-2"),  400: ftInToM("8-4"),  600: ftInToM("7-3")  },
    '38x184': { 300: ftInToM("11-9"), 400: ftInToM("10-8"), 600: ftInToM("9-4")  },
    '38x235': { 300: ftInToM("13-6"), 400: ftInToM("12-3"), 600: ftInToM("10-9") },
    '38x286': { 300: ftInToM("15-2"), 400: ftInToM("13-9"), 600: ftInToM("12-1") },
  },
};

// ── TABLE C: Ceiling Joists — Attic not accessible by stairway ──────────────
// NBC Span Table 9.23.4.2-C
export const CEILING_JOIST_SPANS: Record<SpeciesGroup, Record<LumberSize, Record<SpacingMm, number>>> = {
  HF: {
    '38x89':  { 300: ftInToM("10-8"), 400: ftInToM("9-9"),  600: ftInToM("8-6")  },
    '38x140': { 300: ftInToM("16-1"), 400: ftInToM("15-4"), 600: ftInToM("13-4") },
    '38x184': { 300: ftInToM("22-2"), 400: ftInToM("20-1"), 600: ftInToM("17-7") },
    '38x235': { 300: ftInToM("28-3"), 400: ftInToM("25-8"), 600: ftInToM("22-5") },
    '38x286': { 300: ftInToM("34-5"), 400: ftInToM("31-3"), 600: ftInToM("27-4") },
  },
  SPF: {
    '38x89':  { 300: ftInToM("10-2"), 400: ftInToM("9-3"),  600: ftInToM("8-1")  },
    '38x140': { 300: ftInToM("16-1"), 400: ftInToM("14-7"), 600: ftInToM("12-9") },
    '38x184': { 300: ftInToM("21-1"), 400: ftInToM("19-2"), 600: ftInToM("16-9") },
    '38x235': { 300: ftInToM("26-11"),400: ftInToM("24-6"), 600: ftInToM("21-4") },
    '38x286': { 300: ftInToM("32-9"), 400: ftInToM("29-10"),600: ftInToM("26-0") },
  },
  DFL: {
    '38x89':  { 300: ftInToM("11-1"), 400: ftInToM("10-1"), 600: ftInToM("8-10") },
    '38x140': { 300: ftInToM("17-5"), 400: ftInToM("15-10"),600: ftInToM("13-10")},
    '38x184': { 300: ftInToM("22-11"),400: ftInToM("20-10"),600: ftInToM("18-2") },
    '38x235': { 300: ftInToM("29-3"), 400: ftInToM("26-7"), 600: ftInToM("23-2") },
    '38x286': { 300: ftInToM("35-7"), 400: ftInToM("32-4"), 600: ftInToM("28-2") },
  },
  Northern: {
    '38x89':  { 300: ftInToM("9-1"),  400: ftInToM("8-3"),  600: ftInToM("7-2")  },
    '38x140': { 300: ftInToM("14-3"), 400: ftInToM("13-0"), 600: ftInToM("11-4") },
    '38x184': { 300: ftInToM("18-9"), 400: ftInToM("17-1"), 600: ftInToM("14-10")},
    '38x235': { 300: ftInToM("24-0"), 400: ftInToM("21-9"), 600: ftInToM("19-0") },
    '38x286': { 300: ftInToM("29-2"), 400: ftInToM("26-6"), 600: ftInToM("23-2") },
  },
};

// ── ROOF RAFTER SPANS — NBC Span Tables 9.23.4.2-E/F/G ──────────────────────
// Keyed by ground snow load bracket (kPa): 1.0, 2.0, 3.0
export const ROOF_RAFTER_SPANS: Record<number, Record<SpeciesGroup, Record<LumberSize, Record<SpacingMm, number>>>> = {
  1.0: {
    SPF: {
      '38x89':  { 300: 2.69, 400: 2.44, 600: 2.13 },
      '38x140': { 300: 4.22, 400: 3.84, 600: 3.35 },
      '38x184': { 300: 5.56, 400: 5.05, 600: 4.42 },
      '38x235': { 300: 7.09, 400: 6.45, 600: 5.64 },
      '38x286': { 300: 8.63, 400: 7.85, 600: 6.86 },
    },
    HF: {
      '38x89':  { 300: 2.82, 400: 2.57, 600: 2.24 },
      '38x140': { 300: 4.44, 400: 4.04, 600: 3.53 },
      '38x184': { 300: 5.85, 400: 5.32, 600: 4.65 },
      '38x235': { 300: 7.47, 400: 6.79, 600: 5.94 },
      '38x286': { 300: 9.09, 400: 8.27, 600: 7.22 },
    },
    DFL: {
      '38x89':  { 300: 2.95, 400: 2.68, 600: 2.34 },
      '38x140': { 300: 4.63, 400: 4.21, 600: 3.68 },
      '38x184': { 300: 6.10, 400: 5.55, 600: 4.85 },
      '38x235': { 300: 7.79, 400: 7.08, 600: 6.19 },
      '38x286': { 300: 9.48, 400: 8.62, 600: 7.53 },
    },
    Northern: {
      '38x89':  { 300: 2.39, 400: 2.18, 600: 1.90 },
      '38x140': { 300: 3.76, 400: 3.42, 600: 2.99 },
      '38x184': { 300: 4.96, 400: 4.51, 600: 3.94 },
      '38x235': { 300: 6.33, 400: 5.75, 600: 5.03 },
      '38x286': { 300: 7.70, 400: 7.00, 600: 6.12 },
    },
  },
  2.0: {
    SPF: {
      '38x89':  { 300: 2.07, 400: 1.88, 600: 1.64 },
      '38x140': { 300: 3.25, 400: 2.96, 600: 2.58 },
      '38x184': { 300: 4.28, 400: 3.90, 600: 3.40 },
      '38x235': { 300: 5.47, 400: 4.97, 600: 4.34 },
      '38x286': { 300: 6.65, 400: 6.05, 600: 5.29 },
    },
    HF: {
      '38x89':  { 300: 2.18, 400: 1.98, 600: 1.73 },
      '38x140': { 300: 3.43, 400: 3.12, 600: 2.72 },
      '38x184': { 300: 4.51, 400: 4.10, 600: 3.58 },
      '38x235': { 300: 5.76, 400: 5.24, 600: 4.58 },
      '38x286': { 300: 7.01, 400: 6.37, 600: 5.57 },
    },
    DFL: {
      '38x89':  { 300: 2.27, 400: 2.07, 600: 1.81 },
      '38x140': { 300: 3.57, 400: 3.25, 600: 2.84 },
      '38x184': { 300: 4.70, 400: 4.28, 600: 3.74 },
      '38x235': { 300: 6.00, 400: 5.46, 600: 4.77 },
      '38x286': { 300: 7.31, 400: 6.64, 600: 5.80 },
    },
    Northern: {
      '38x89':  { 300: 1.85, 400: 1.68, 600: 1.47 },
      '38x140': { 300: 2.90, 400: 2.64, 600: 2.31 },
      '38x184': { 300: 3.82, 400: 3.47, 600: 3.04 },
      '38x235': { 300: 4.88, 400: 4.44, 600: 3.88 },
      '38x286': { 300: 5.94, 400: 5.40, 600: 4.72 },
    },
  },
  3.0: {
    SPF: {
      '38x89':  { 300: 1.72, 400: 1.57, 600: 1.37 },
      '38x140': { 300: 2.71, 400: 2.46, 600: 2.15 },
      '38x184': { 300: 3.57, 400: 3.25, 600: 2.84 },
      '38x235': { 300: 4.56, 400: 4.14, 600: 3.62 },
      '38x286': { 300: 5.55, 400: 5.04, 600: 4.41 },
    },
    HF: {
      '38x89':  { 300: 1.81, 400: 1.65, 600: 1.44 },
      '38x140': { 300: 2.85, 400: 2.59, 600: 2.27 },
      '38x184': { 300: 3.76, 400: 3.42, 600: 2.99 },
      '38x235': { 300: 4.80, 400: 4.37, 600: 3.81 },
      '38x286': { 300: 5.85, 400: 5.32, 600: 4.65 },
    },
    DFL: {
      '38x89':  { 300: 1.90, 400: 1.72, 600: 1.51 },
      '38x140': { 300: 2.98, 400: 2.71, 600: 2.37 },
      '38x184': { 300: 3.92, 400: 3.57, 600: 3.12 },
      '38x235': { 300: 5.01, 400: 4.56, 600: 3.98 },
      '38x286': { 300: 6.10, 400: 5.54, 600: 4.84 },
    },
    Northern: {
      '38x89':  { 300: 1.54, 400: 1.40, 600: 1.22 },
      '38x140': { 300: 2.42, 400: 2.20, 600: 1.92 },
      '38x184': { 300: 3.19, 400: 2.90, 600: 2.53 },
      '38x235': { 300: 4.07, 400: 3.70, 600: 3.23 },
      '38x286': { 300: 4.96, 400: 4.50, 600: 3.94 },
    },
  },
};

// ── BUILT-UP BEAM SPANS — 3-ply SPF (most common) ───────────────────────────
// NBC Table 9.23.4.2 — supported length = half sum of joist spans each side
export const BEAM_SPANS_SPF: Array<{
  plies: number;
  size: LumberSize;
  supportedLengths: Record<number, number>;
}> = [
  { plies: 3, size: '38x140', supportedLengths: { 1.8: 2.59, 2.4: 2.26, 3.0: 2.03, 3.6: 1.83, 4.2: 1.68 } },
  { plies: 3, size: '38x184', supportedLengths: { 1.8: 3.43, 2.4: 2.99, 3.0: 2.68, 3.6: 2.44, 4.2: 2.26 } },
  { plies: 3, size: '38x235', supportedLengths: { 1.8: 4.39, 2.4: 3.81, 3.0: 3.43, 3.6: 3.12, 4.2: 2.87 } },
  { plies: 3, size: '38x286', supportedLengths: { 1.8: 5.33, 2.4: 4.65, 3.0: 4.17, 3.6: 3.81, 4.2: 3.51 } },
];

// ── CITY GROUND SNOW LOADS (Ss) — NBC Appendix C ────────────────────────────
export const CITY_SNOW_LOADS: Record<string, { province: string; groundSnowKPa: number }> = {
  Calgary:        { province: 'AB', groundSnowKPa: 1.2 },
  Edmonton:       { province: 'AB', groundSnowKPa: 1.1 },
  'Red Deer':     { province: 'AB', groundSnowKPa: 1.1 },
  Lethbridge:     { province: 'AB', groundSnowKPa: 0.8 },
  'Medicine Hat': { province: 'AB', groundSnowKPa: 0.8 },
  'Fort McMurray':{ province: 'AB', groundSnowKPa: 1.8 },
  'Grande Prairie':{ province: 'AB', groundSnowKPa: 1.5 },
  Vancouver:      { province: 'BC', groundSnowKPa: 1.4 },
  Victoria:       { province: 'BC', groundSnowKPa: 0.7 },
  Kelowna:        { province: 'BC', groundSnowKPa: 1.2 },
  'Prince George':{ province: 'BC', groundSnowKPa: 1.9 },
  Toronto:        { province: 'ON', groundSnowKPa: 1.1 },
  Ottawa:         { province: 'ON', groundSnowKPa: 1.7 },
  Winnipeg:       { province: 'MB', groundSnowKPa: 1.3 },
};

// NBC slope factors (simplified from Table 4.1.6.2)
export const SLOPE_FACTORS: Array<{ label: string; ratio: string; factor: number }> = [
  { label: 'Flat / Low-slope  (≤1:12)',  ratio: '≤1:12',  factor: 1.0 },
  { label: '2:12',                        ratio: '2:12',   factor: 0.90 },
  { label: '4:12',                        ratio: '4:12',   factor: 0.80 },
  { label: '6:12',                        ratio: '6:12',   factor: 0.65 },
  { label: '8:12',                        ratio: '8:12',   factor: 0.50 },
  { label: 'Steep  (>8:12)',              ratio: '>8:12',  factor: 0.35 },
];

// ── LABELS ───────────────────────────────────────────────────────────────────
export const SIZE_LABELS: Record<LumberSize, string> = {
  '38x89':  '2×4 (38×89 mm)',
  '38x140': '2×6 (38×140 mm)',
  '38x184': '2×8 (38×184 mm)',
  '38x235': '2×10 (38×235 mm)',
  '38x286': '2×12 (38×286 mm)',
};

export const SPECIES_LABELS: Record<SpeciesGroup, string> = {
  SPF:     'Spruce-Pine-Fir (SPF)',
  HF:      'Hem-Fir (HF)',
  DFL:     'Douglas Fir-Larch (D.Fir-L)',
  Northern:'Northern Species',
};

// ── LOOKUP HELPERS ───────────────────────────────────────────────────────────
export function getNearestSnowLoad(kPa: number): number {
  return [1.0, 2.0, 3.0].reduce((prev, curr) =>
    Math.abs(curr - kPa) < Math.abs(prev - kPa) ? curr : prev
  );
}

export function getMaxSpan(
  tableType: 'floorJoist' | 'ceilingJoist',
  species: SpeciesGroup,
  size: LumberSize,
  spacingMm: SpacingMm,
): number | null {
  const table = tableType === 'floorJoist' ? FLOOR_JOIST_SPANS : CEILING_JOIST_SPANS;
  return table[species]?.[size]?.[spacingMm] ?? null;
}

export function getRafterMaxSpan(
  species: SpeciesGroup,
  size: LumberSize,
  spacingMm: SpacingMm,
  snowLoadKPa: number,
): number | null {
  const bracket = getNearestSnowLoad(snowLoadKPa);
  return ROOF_RAFTER_SPANS[bracket]?.[species]?.[size]?.[spacingMm] ?? null;
}

export function findMinimumSize(
  tableType: 'floorJoist' | 'ceilingJoist',
  species: SpeciesGroup,
  spacingMm: SpacingMm,
  requiredSpanM: number,
): LumberSize | null {
  const sizes: LumberSize[] = ['38x89', '38x140', '38x184', '38x235', '38x286'];
  for (const size of sizes) {
    const maxSpan = getMaxSpan(tableType, species, size, spacingMm);
    if (maxSpan !== null && maxSpan >= requiredSpanM) return size;
  }
  return null;
}

export function findMinimumRafterSize(
  species: SpeciesGroup,
  spacingMm: SpacingMm,
  requiredSpanM: number,
  snowLoadKPa: number,
): LumberSize | null {
  const sizes: LumberSize[] = ['38x89', '38x140', '38x184', '38x235', '38x286'];
  for (const size of sizes) {
    const maxSpan = getRafterMaxSpan(species, size, spacingMm, snowLoadKPa);
    if (maxSpan !== null && maxSpan >= requiredSpanM) return size;
  }
  return null;
}

export function getBeamMaxSpan(
  size: LumberSize,
  supportedLengthM: number,
): number | null {
  const entry = BEAM_SPANS_SPF.find(b => b.size === size);
  if (!entry) return null;
  const keys = Object.keys(entry.supportedLengths).map(Number).sort((a, b) => a - b);
  const nearest = keys.reduce((prev, curr) =>
    Math.abs(curr - supportedLengthM) < Math.abs(prev - supportedLengthM) ? curr : prev
  );
  // Use the nearest bracket at or above the requested supported length (conservative)
  const bracket = keys.find(k => k >= supportedLengthM) ?? keys[keys.length - 1];
  return entry.supportedLengths[bracket] ?? null;
}
