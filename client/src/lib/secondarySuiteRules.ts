export interface SuitePermissionResult {
  allowed: 'yes' | 'conditional' | 'no' | 'unknown';
  reason: string;
  bylaw: string;
  notes?: string;
}

// ─── Calgary ──────────────────────────────────────────────────────────────────

const CALGARY_ZONES: Record<string, SuitePermissionResult> = {
  'R-1':    { allowed: 'yes', reason: 'Secondary suite is a permitted use in R-1.',    bylaw: 'Calgary Land Use Bylaw 1P2007 §5' },
  'R-1L':   { allowed: 'yes', reason: 'Permitted use in R-1L.',                        bylaw: 'Calgary Land Use Bylaw 1P2007 §5' },
  'R-1N':   { allowed: 'yes', reason: 'Permitted use in R-1N.',                        bylaw: 'Calgary Land Use Bylaw 1P2007 §5' },
  'R-1S':   { allowed: 'yes', reason: 'Permitted use in R-1S.',                        bylaw: 'Calgary Land Use Bylaw 1P2007 §5' },
  'R-2':    { allowed: 'yes', reason: 'Secondary suite permitted in R-2.',             bylaw: 'Calgary Land Use Bylaw 1P2007 §6' },
  'R-2M':   { allowed: 'yes', reason: 'Permitted use in R-2M.',                        bylaw: 'Calgary Land Use Bylaw 1P2007 §6' },
  'R-C1':   { allowed: 'yes', reason: 'Permitted use in R-C1.',                        bylaw: 'Calgary Land Use Bylaw 1P2007 §7' },
  'R-C1L':  { allowed: 'yes', reason: 'Permitted use in R-C1L.',                       bylaw: 'Calgary Land Use Bylaw 1P2007 §7' },
  'R-C1N':  { allowed: 'yes', reason: 'Permitted use in R-C1N.',                       bylaw: 'Calgary Land Use Bylaw 1P2007 §7' },
  'R-C1S':  { allowed: 'yes', reason: 'Permitted use in R-C1S.',                       bylaw: 'Calgary Land Use Bylaw 1P2007 §7' },
  'R-C1SS': { allowed: 'conditional', reason: 'Discretionary use in R-C1Ss — development permit required.', bylaw: 'Calgary Land Use Bylaw 1P2007 §7' },
  'R-C2':   { allowed: 'yes', reason: 'Permitted use in R-C2.',                        bylaw: 'Calgary Land Use Bylaw 1P2007 §7' },
  'M-C1':   { allowed: 'yes', reason: 'Permitted use in M-C1.',                        bylaw: 'Calgary Land Use Bylaw 1P2007 §8' },
  'M-C2':   { allowed: 'yes', reason: 'Permitted use in M-C2.',                        bylaw: 'Calgary Land Use Bylaw 1P2007 §8' },
  'M-1':    { allowed: 'yes', reason: 'Permitted use in M-1.',                         bylaw: 'Calgary Land Use Bylaw 1P2007 §8' },
  'M-2':    { allowed: 'yes', reason: 'Permitted use in M-2.',                         bylaw: 'Calgary Land Use Bylaw 1P2007 §8' },
  'C-1':    { allowed: 'no',  reason: 'Secondary suite is not a permitted use in C-1 (Commercial Neighbourhood).', bylaw: 'Calgary Land Use Bylaw 1P2007' },
  'C-2':    { allowed: 'no',  reason: 'Not a permitted or discretionary use in C-2.',  bylaw: 'Calgary Land Use Bylaw 1P2007' },
  'C-C1':   { allowed: 'no',  reason: 'Not permitted in C-C1 (Commercial).',           bylaw: 'Calgary Land Use Bylaw 1P2007' },
  'I-B':    { allowed: 'no',  reason: 'Not permitted in industrial zones.',            bylaw: 'Calgary Land Use Bylaw 1P2007' },
  'I-G':    { allowed: 'no',  reason: 'Not permitted in industrial zones.',            bylaw: 'Calgary Land Use Bylaw 1P2007' },
  'S-R':    { allowed: 'no',  reason: 'Not permitted in S-R (Special Purpose – Recreation).',  bylaw: 'Calgary Land Use Bylaw 1P2007' },
};

// ─── Edmonton ─────────────────────────────────────────────────────────────────

const EDMONTON_ZONES: Record<string, SuitePermissionResult> = {
  'RF1':  { allowed: 'yes', reason: 'Secondary suite is a permitted use in RF1 (Single Detached Residential).', bylaw: 'Edmonton Zoning Bylaw 12800 §50' },
  'RF2':  { allowed: 'yes', reason: 'Permitted use in RF2 (Low Density Infill).',                                bylaw: 'Edmonton Zoning Bylaw 12800 §53' },
  'RF3':  { allowed: 'yes', reason: 'Permitted use in RF3 (Small Scale Infill).',                                bylaw: 'Edmonton Zoning Bylaw 12800 §56' },
  'RF4':  { allowed: 'yes', reason: 'Permitted use in RF4 (Semi-Detached).',                                     bylaw: 'Edmonton Zoning Bylaw 12800 §59' },
  'RF5':  { allowed: 'yes', reason: 'Permitted use in RF5 (Row Housing).',                                       bylaw: 'Edmonton Zoning Bylaw 12800 §60' },
  'RF6':  { allowed: 'yes', reason: 'Permitted use in RF6 (Medium Density Residential).',                        bylaw: 'Edmonton Zoning Bylaw 12800 §61' },
  'RSL':  { allowed: 'yes', reason: 'Permitted use in RSL (Residential Small Lot).',                             bylaw: 'Edmonton Zoning Bylaw 12800 §54' },
  'RSLD': { allowed: 'yes', reason: 'Permitted use in RSLD.',                                                    bylaw: 'Edmonton Zoning Bylaw 12800 §54' },
  'RA7':  { allowed: 'yes', reason: 'Permitted use in RA7 (Low Rise Apartment).',                                bylaw: 'Edmonton Zoning Bylaw 12800 §210' },
  'RA8':  { allowed: 'yes', reason: 'Permitted use in RA8.',                                                     bylaw: 'Edmonton Zoning Bylaw 12800 §210' },
  'RPL':  { allowed: 'conditional', reason: 'Discretionary use in RPL — development permit required.',           bylaw: 'Edmonton Zoning Bylaw 12800' },
  'RR':   { allowed: 'conditional', reason: 'Discretionary use in RR (Rural Residential) — verify with the City.', bylaw: 'Edmonton Zoning Bylaw 12800' },
  'CNC':  { allowed: 'no',  reason: 'Not a permitted use in CNC (Commercial Neighbourhood).',                    bylaw: 'Edmonton Zoning Bylaw 12800' },
  'CB1':  { allowed: 'no',  reason: 'Not permitted in CB1 (Low Intensity Business).',                           bylaw: 'Edmonton Zoning Bylaw 12800' },
  'CB2':  { allowed: 'no',  reason: 'Not permitted in CB2 (General Business).',                                 bylaw: 'Edmonton Zoning Bylaw 12800' },
  'IB':   { allowed: 'no',  reason: 'Not permitted in IB (Business Industrial).',                               bylaw: 'Edmonton Zoning Bylaw 12800' },
  'IM':   { allowed: 'no',  reason: 'Not permitted in IM (Medium Industrial).',                                  bylaw: 'Edmonton Zoning Bylaw 12800' },
};

// ─── Airdrie ──────────────────────────────────────────────────────────────────

const AIRDRIE_ZONES: Record<string, SuitePermissionResult> = {
  'R1':   { allowed: 'yes',         reason: 'Secondary suite permitted in R1 (Low Density Residential).',            bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
  'R1A':  { allowed: 'yes',         reason: 'Permitted use in R1A.',                                                  bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
  'R1B':  { allowed: 'yes',         reason: 'Permitted use in R1B.',                                                  bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
  'R2':   { allowed: 'yes',         reason: 'Permitted use in R2 (Medium Density Residential).',                      bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
  'R3':   { allowed: 'conditional', reason: 'Discretionary use in R3 — development permit required.',                 bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
  'R4':   { allowed: 'conditional', reason: 'Discretionary use in R4 — confirm with City of Airdrie Planning.',       bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
  'C1':   { allowed: 'no',          reason: 'Not a permitted or discretionary use in C1 (Commercial).',               bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
  'C2':   { allowed: 'no',          reason: 'Not permitted in C2.',                                                   bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
  'IB':   { allowed: 'no',          reason: 'Not permitted in industrial zones.',                                     bylaw: 'Airdrie Land Use Bylaw B-09/2005' },
};

// ─── Red Deer ─────────────────────────────────────────────────────────────────

const RED_DEER_ZONES: Record<string, SuitePermissionResult> = {
  'R1':   { allowed: 'yes',         reason: 'Secondary suite permitted in R1 (Single Detached Residential).',   bylaw: 'Red Deer Land Use Bylaw 3357/2004' },
  'R1A':  { allowed: 'yes',         reason: 'Permitted use in R1A.',                                            bylaw: 'Red Deer Land Use Bylaw 3357/2004' },
  'R2':   { allowed: 'yes',         reason: 'Permitted use in R2.',                                             bylaw: 'Red Deer Land Use Bylaw 3357/2004' },
  'R3':   { allowed: 'conditional', reason: 'Discretionary use in R3 — development permit required.',           bylaw: 'Red Deer Land Use Bylaw 3357/2004' },
  'C1':   { allowed: 'no',          reason: 'Not permitted in C1 (Commercial).',                                bylaw: 'Red Deer Land Use Bylaw 3357/2004' },
};

// ─── Lookup table ─────────────────────────────────────────────────────────────

type MunicipalityKey = string;

const ZONE_RULES: Record<MunicipalityKey, Record<string, SuitePermissionResult>> = {
  calgary:   CALGARY_ZONES,
  edmonton:  EDMONTON_ZONES,
  airdrie:   AIRDRIE_ZONES,
  'red deer': RED_DEER_ZONES,
  'red-deer': RED_DEER_ZONES,
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function checkSuitePermission(municipality: string, zoneCode?: string): SuitePermissionResult {
  const muniKey = municipality.toLowerCase().trim();
  const rules = ZONE_RULES[muniKey];

  if (!rules) {
    return {
      allowed: 'unknown',
      reason: `Zone rules not available for ${municipality} in our database.`,
      bylaw: 'Contact your local planning department to confirm suite eligibility.',
    };
  }

  if (!zoneCode || !zoneCode.trim()) {
    return {
      allowed: 'unknown',
      reason: `${municipality} permits secondary suites in most residential zones. Enter your zone code for a specific answer.`,
      bylaw: 'Find your zone code on your property tax assessment notice or the City portal.',
    };
  }

  const code = zoneCode.trim().toUpperCase();

  if (rules[code]) return rules[code];

  // Base zone fallback — strip lowercase suffix (e.g. "R-C1s" → "R-C1")
  const baseCode = code.replace(/[A-Z]+$/, '').replace(/-$/, '');
  if (baseCode && baseCode !== code && rules[baseCode]) {
    return { ...rules[baseCode], notes: `Matched base zone ${baseCode} — verify subzone rules with the City.` };
  }

  return {
    allowed: 'unknown',
    reason: `Zone ${code} not in our database for ${municipality}.`,
    bylaw: 'Contact the City planning department to confirm suite eligibility.',
  };
}
