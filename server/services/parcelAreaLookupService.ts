export interface ParcelAreaResult {
  lotAreaSqm: number;
  confirmedAddress: string | null;
  source: 'calgary_assessment' | 'edmonton_assessment';
  parcelCount: number;
  rollNumbers: string[];
  ambiguous: false;
  matchType: 'exact' | 'prefix';
}

export interface AmbiguousParcelAreaResult {
  source: 'calgary_assessment';
  parcelCount: number;
  ambiguous: true;
  matchType: 'exact' | 'prefix';
  candidates: { address: string | null; rollNumber: string | null; landSizeSqm: number | null }[];
  error: string;
}

const CALGARY_URL = 'https://data.calgary.ca/resource/4bsw-nn7w.json';
type CalgaryRow = Record<string, string>;

// Calgary's published street types: https://www.calgary.ca/311/standard-address-format.html
// Aliases: Canada Post's symbols-and-abbreviations reference; TRL/CT/PKWY are common address forms.
const STREET_TYPES: Record<string, string> = {
  ALLEY: 'AL', AVENUE: 'AV', AVE: 'AV', BAY: 'BA', BOULEVARD: 'BV', BLVD: 'BV',
  CAPE: 'CA', CENTRE: 'CE', CTR: 'CE', CIRCLE: 'CI', CIR: 'CI', CLOSE: 'CL', COMMON: 'CM',
  COURT: 'CO', CT: 'CO', CRT: 'CO', CRESCENT: 'CR', CRES: 'CR', COVE: 'CV', DRIVE: 'DR',
  GATE: 'GA', GARDENS: 'GD', GDNS: 'GD', GREEN: 'GR', GROVE: 'GV', HEATH: 'HE',
  HIGHWAY: 'HI', HWY: 'HI', HILL: 'HL', HEIGHTS: 'HT', HTS: 'HT', ISLAND: 'IS',
  LANDING: 'LD', LANDNG: 'LD', LINK: 'LI', LANE: 'LN', MEWS: 'ME', MANOR: 'MR', MOUNT: 'MT',
  PARK: 'PA', PK: 'PA', PATH: 'PH', PLACE: 'PL', PARADE: 'PR', PASSAGE: 'PS', PASS: 'PS',
  POINT: 'PT', PARKWAY: 'PY', PKY: 'PY', PKWY: 'PY', PLAZA: 'PZ', ROAD: 'RD', RISE: 'RI',
  ROW: 'RO', SQUARE: 'SQ', STREET: 'ST', TERRACE: 'TC', TERR: 'TC', TRAIL: 'TR', TRL: 'TR',
  VILLAS: 'VI', VIEW: 'VW', WALK: 'WK', WAY: 'WY',
};

export function normalizeCalgaryAddress(input: string): { normalized: string; quadrant: string | null } {
  let text = input.toUpperCase().trim().replace(/\s+/g, ' ');
  // Explicit unit markers are handled before commas so "Unit 101, 823 ..." keeps the civic address.
  text = text.replace(/^(?:UNIT|SUITE)\s+(\d+[A-Z]?)(?:\s*,\s*|\s+)(?=\d)/, '$1 ')
    .replace(/^#\s*(\d+[A-Z]?)\s+(?=\d)/, '$1 ')
    .replace(/^(\d+[A-Z]?)\s*-\s*(?=\d)/, '$1 ')
    .split(',')[0].replace(/\./g, '').trim();

  const quadrantMatch = [...text.matchAll(/\b(NORTH\s*EAST|NORTH\s*WEST|SOUTH\s*EAST|SOUTH\s*WEST|[NS]\s+[EW]|[NS][EW])\b/g)].at(-1);
  const followingType = quadrantMatch ? text.slice(quadrantMatch.index! + quadrantMatch[0].length).trim().split(' ').at(-1) : '';
  // A direction followed by a street type belongs to the name, not the quadrant. CA after a quadrant is a country suffix.
  const directionInName = followingType && followingType !== 'CA' &&
    (STREET_TYPES[followingType] || Object.values(STREET_TYPES).includes(followingType));
  let quadrant: string | null = null;
  if (quadrantMatch && !directionInName) {
    quadrant = quadrantMatch[1].replace(/NORTH/g, 'N').replace(/SOUTH/g, 'S')
      .replace(/EAST/g, 'E').replace(/WEST/g, 'W').replace(/\s/g, '');
    text = `${text.slice(0, quadrantMatch.index).trim()} ${quadrant}`;
  } else {
    // Repeat to handle both "AB postal CANADA" and "CANADA postal". Bare CA is a street type.
    const tail = /\s+(?:[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d|CANADA|ALBERTA|AB|CALGARY)$/;
    while (tail.test(text)) text = text.replace(tail, '').trim();
  }
  text = text.replace(/\b(\d+)(?:ST|ND|RD|TH)\b/g, '$1');
  // Remove user wildcards and every character outside the approved address alphabet.
  text = text.replace(/[^\p{L}\p{N} '#\-/.&]/gu, '').replace(/\s+/g, ' ').trim();
  const tokens = text.split(' ');
  const typeIndex = tokens.length - (quadrant ? 2 : 1);
  tokens[typeIndex] = STREET_TYPES[tokens[typeIndex]] ?? tokens[typeIndex];
  return { normalized: tokens.join(' '), quadrant };
}

function escapeSoql(value: string): string {
  return value.replace(/'/g, "''");
}

async function fetchCalgary(where: string, limit: number): Promise<CalgaryRow[] | null> {
  const url = `${CALGARY_URL}?${new URLSearchParams({ $where: where, $limit: String(limit) })}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  return await response.json() as CalgaryRow[];
}

function parseArea(row: CalgaryRow): number | null {
  const rawArea = row.land_size_sm;
  if (rawArea == null || rawArea.trim() === '') return null;
  const area = Number(rawArea);
  return Number.isFinite(area) && area > 0 ? area : null;
}

function classifyRows(rows: CalgaryRow[], matchType: 'exact' | 'prefix', limit: number, quadrant: string | null, rawRowCount: number): ParcelAreaResult | AmbiguousParcelAreaResult {
  const rollNumbers = [...new Set(rows.map(row => row.roll_number))];
  const areas = rows.map(parseArea);
  const addresses = new Set(rows.map(row => row.address?.trim().toUpperCase()));
  const truncated = rawRowCount >= limit;
  const matchesQuadrant = (row: CalgaryRow) => !quadrant || row.address?.trim().toUpperCase().endsWith(` ${quadrant}`);
  if (truncated || rows.some(row => !matchesQuadrant(row)) || rollNumbers.length !== 1 || !rollNumbers[0] ||
      areas.includes(null) || new Set(areas).size !== 1 ||
      (matchType === 'prefix' && addresses.size !== 1)) {
    const seen = new Set<string>();
    const candidates = rows.filter(matchesQuadrant).filter(row => {
      if (seen.has(row.roll_number)) return false;
      seen.add(row.roll_number);
      return true;
    }).slice(0, 10).map(row => ({
      address: row.address ?? null,
      rollNumber: row.roll_number ?? null,
      landSizeSqm: parseArea(row),
    }));
    return {
      source: 'calgary_assessment', parcelCount: rows.length, ambiguous: true, matchType, candidates,
      error: truncated
        ? 'Property match results were truncated; select a property before using its area.'
        : 'Multiple properties or inconsistent land areas match this address; select one.',
    };
  }
  return {
    lotAreaSqm: Math.round(areas[0]! * 100) / 100,
    confirmedAddress: rows[0].address ?? null,
    source: 'calgary_assessment', parcelCount: rows.length, rollNumbers, ambiguous: false, matchType,
  };
}

async function lookupCalgaryParcelArea(address: string): Promise<ParcelAreaResult | AmbiguousParcelAreaResult | null> {
  try {
    const { normalized, quadrant } = normalizeCalgaryAddress(address);
    const escaped = escapeSoql(normalized);
    let rows = await fetchCalgary(`upper(address) = '${escaped}'`, 100);
    let rawRowCount = rows?.length ?? 0;
    let matchType: 'exact' | 'prefix' = 'exact';
    if (!rows?.length) {
      const civicMatch = normalized.match(/^(\d+[A-Z]?)\s+(.+)$/);
      if (civicMatch) {
        const key = quadrant ? normalized.slice(0, -quadrant.length).trimEnd() : normalized;
        matchType = 'prefix';
        rows = await fetchCalgary(`upper(address) like '${escapeSoql(key)} %'`, 25);
        rawRowCount = rows?.length ?? 0;
        rows = rows?.filter(row => row.address?.trim().toUpperCase().startsWith(`${key} `)) ?? null;
      }
    }
    if (!rows?.length) return null;

    const result = classifyRows(rows, matchType, matchType === 'exact' ? 100 : 25, quadrant, rawRowCount);
    if (!result.ambiguous) {
      console.log(`[ParcelArea] Calgary parcel area found: ${result.lotAreaSqm} m² for ${result.confirmedAddress ?? address}`);
    }
    return result;
  } catch (error) {
    console.log(`[ParcelArea] Calgary lookup failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export async function lookupParcelArea(address: string, municipality: string): Promise<ParcelAreaResult | AmbiguousParcelAreaResult | null> {
  const mun = municipality.toLowerCase();
  if (mun.includes('calgary')) return lookupCalgaryParcelArea(address);
  // Edmonton's current assessment dataset has no lot/land area field.
  return null;
}
