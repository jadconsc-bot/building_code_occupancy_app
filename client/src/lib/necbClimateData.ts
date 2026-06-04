// NECB 2020 Table 3.2.2.2 — Max U-values for above-ground
// opaque assemblies by HDD zone (W/m²·K)
// Lower U-value = better insulation

export const NECB_HDD_ZONES = [
  { zone: 4,  label: 'Zone 4',  hddMin: 0,    hddMax: 2999,  description: 'Vancouver, Victoria, Kelowna' },
  { zone: 5,  label: 'Zone 5',  hddMin: 3000, hddMax: 3999,  description: 'Toronto, Ottawa, Halifax' },
  { zone: 6,  label: 'Zone 6',  hddMin: 4000, hddMax: 4999,  description: 'Calgary, Saskatoon, Quebec City' },
  { zone: 7,  label: 'Zone 7A', hddMin: 5000, hddMax: 5999,  description: 'Edmonton, Winnipeg' },
  { zone: 8,  label: 'Zone 7B', hddMin: 6000, hddMax: 6999,  description: 'Prince George, Thunder Bay' },
  { zone: 9,  label: 'Zone 8',  hddMin: 7000, hddMax: 99999, description: 'Yellowknife, Whitehorse' },
] as const;

// Key Canadian city HDD values for lookup
export const CITY_HDD: Record<string, { hdd: number; province: string }> = {
  'Vancouver':       { hdd: 2825, province: 'BC' },
  'Victoria':        { hdd: 2650, province: 'BC' },
  'Kelowna':         { hdd: 3201, province: 'BC' },
  'Prince George':   { hdd: 5147, province: 'BC' },
  'Surrey':          { hdd: 2890, province: 'BC' },
  'Burnaby':         { hdd: 2890, province: 'BC' },
  'Abbotsford':      { hdd: 3100, province: 'BC' },
  'Calgary':         { hdd: 5012, province: 'AB' },
  'Edmonton':        { hdd: 5120, province: 'AB' },
  'Red Deer':        { hdd: 5260, province: 'AB' },
  'Lethbridge':      { hdd: 4680, province: 'AB' },
  'Grande Prairie':  { hdd: 5832, province: 'AB' },
  'Fort McMurray':   { hdd: 6288, province: 'AB' },
  'Airdrie':         { hdd: 5012, province: 'AB' },
  'Chestermere':     { hdd: 5012, province: 'AB' },
  'Cochrane':        { hdd: 5100, province: 'AB' },
  'Okotoks':         { hdd: 4980, province: 'AB' },
  'Toronto':         { hdd: 3520, province: 'ON' },
  'Ottawa':          { hdd: 4440, province: 'ON' },
  'Hamilton':        { hdd: 3520, province: 'ON' },
  'London':          { hdd: 3870, province: 'ON' },
  'Mississauga':     { hdd: 3520, province: 'ON' },
  'Brampton':        { hdd: 3520, province: 'ON' },
  'Winnipeg':        { hdd: 5670, province: 'MB' },
  'Saskatoon':       { hdd: 6050, province: 'SK' },
  'Regina':          { hdd: 6150, province: 'SK' },
};

// NECB Table 3.2.2.2 — Max U-value W/(m²·K)
// Opaque above-ground building assemblies
export const NECB_OPAQUE_U_MAX: Record<string, Record<string, number>> = {
  walls: {
    zone4: 0.29, zone5: 0.24, zone6: 0.24,
    zone7a: 0.20, zone7b: 0.20, zone8: 0.15,
  },
  roofs: {
    zone4: 0.16, zone5: 0.16, zone6: 0.14,
    zone7a: 0.14, zone7b: 0.12, zone8: 0.12,
  },
  floorsOverCrawl: {
    zone4: 0.26, zone5: 0.22, zone6: 0.22,
    zone7a: 0.18, zone7b: 0.18, zone8: 0.13,
  },
  slabOnGrade: {
    zone4: 0.26, zone5: 0.26, zone6: 0.26,
    zone7a: 0.26, zone7b: 0.26, zone8: 0.26,
  },
  basementWalls: {
    zone4: 0.26, zone5: 0.26, zone6: 0.26,
    zone7a: 0.26, zone7b: 0.26, zone8: 0.26,
  },
};

// RSI equivalents (RSI = 1/U)
export const NECB_OPAQUE_RSI_MIN: Record<string, Record<string, number>> = {
  walls: {
    zone4:  +(1 / 0.29).toFixed(2), // 3.45
    zone5:  +(1 / 0.24).toFixed(2), // 4.17
    zone6:  +(1 / 0.24).toFixed(2), // 4.17
    zone7a: +(1 / 0.20).toFixed(2), // 5.00
    zone7b: +(1 / 0.20).toFixed(2), // 5.00
    zone8:  +(1 / 0.15).toFixed(2), // 6.67
  },
  roofs: {
    zone4:  +(1 / 0.16).toFixed(2), // 6.25
    zone5:  +(1 / 0.16).toFixed(2), // 6.25
    zone6:  +(1 / 0.14).toFixed(2), // 7.14
    zone7a: +(1 / 0.14).toFixed(2), // 7.14
    zone7b: +(1 / 0.12).toFixed(2), // 8.33
    zone8:  +(1 / 0.12).toFixed(2), // 8.33
  },
};

// NECB Table 3.2.2.3 — Max fenestration U-value W/(m²·K)
export const NECB_FENESTRATION_U_MAX: Record<string, Record<string, number>> = {
  verticalFenestration: {
    zone4: 1.90, zone5: 1.90, zone6: 1.73,
    zone7a: 1.73, zone7b: 1.44, zone8: 1.44,
  },
  skylights: {
    zone4: 2.69, zone5: 2.69, zone6: 2.41,
    zone7a: 2.41, zone7b: 2.01, zone8: 2.01,
  },
  doors: {
    zone4: 2.40, zone5: 2.40, zone6: 2.40,
    zone7a: 1.60, zone7b: 1.60, zone8: 1.60,
  },
};

// NECB Table A-3.2.1.4 — Max FDWR by HDD
// Fenestration and door to wall ratio limits
export const NECB_FDWR_MAX: Array<{ hddMax: number; fdwr: number }> = [
  { hddMax: 2999,  fdwr: 0.40 },
  { hddMax: 3249,  fdwr: 0.38 },
  { hddMax: 3499,  fdwr: 0.36 },
  { hddMax: 3749,  fdwr: 0.35 },
  { hddMax: 3999,  fdwr: 0.33 },
  { hddMax: 4249,  fdwr: 0.32 },
  { hddMax: 4499,  fdwr: 0.31 },
  { hddMax: 4749,  fdwr: 0.30 },
  { hddMax: 4999,  fdwr: 0.29 },
  { hddMax: 5249,  fdwr: 0.27 },
  { hddMax: 5499,  fdwr: 0.26 },
  { hddMax: 5749,  fdwr: 0.25 },
  { hddMax: 5999,  fdwr: 0.24 },
  { hddMax: 6249,  fdwr: 0.23 },
  { hddMax: 6499,  fdwr: 0.23 },
  { hddMax: 6749,  fdwr: 0.22 },
  { hddMax: 7000,  fdwr: 0.20 },
  { hddMax: 99999, fdwr: 0.20 },
];

export const ZONE_LABELS: Record<string, string> = {
  zone4: 'Zone 4', zone5: 'Zone 5', zone6: 'Zone 6',
  zone7a: 'Zone 7A', zone7b: 'Zone 7B', zone8: 'Zone 8',
};

export function getHDDZone(hdd: number): string {
  if (hdd < 3000) return 'zone4';
  if (hdd < 4000) return 'zone5';
  if (hdd < 5000) return 'zone6';
  if (hdd < 6000) return 'zone7a';
  if (hdd < 7000) return 'zone7b';
  return 'zone8';
}

export function getMaxFDWR(hdd: number): number {
  const entry = NECB_FDWR_MAX.find(e => hdd <= e.hddMax);
  return entry?.fdwr ?? 0.20;
}

export function getCityHDD(city: string): number | null {
  return CITY_HDD[city]?.hdd ?? null;
}

export function getNECBWallRSI(hdd: number, assemblyType: string): number {
  const zone = getHDDZone(hdd);
  return NECB_OPAQUE_RSI_MIN[assemblyType]?.[zone] ?? 0;
}
