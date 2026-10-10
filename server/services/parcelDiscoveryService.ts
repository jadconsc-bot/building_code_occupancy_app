import { normalizeCalgaryAddress } from './parcelAreaLookupService';

/**
 * Read-only Calgary discovery: ok returns parcels grouped by CPID, accounts grouped
 * by roll number, counts, warnings, query/source metadata and retrieval time.
 * Assessment account land areas are NOT additive. No-data returns { status: 'no_data' };
 * transport failures return null. Boundaries are published WGS84 MultiPolygons, unchanged.
 */
export interface PublishedMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface DiscoveryRow {
  roll_year?: string;
  roll_number?: string;
  address?: string;
  assessment_class?: string;
  assessment_class_description?: string;
  land_use_designation?: string;
  land_size_sm?: string;
  short_legal?: string;
  cpid?: string;
  mod_date?: string;
  multipolygon?: PublishedMultiPolygon | null;
}

interface Parcel {
  cpid: string;
  geometry: PublishedMultiPolygon | null;
  landUseDesignations: string[];
  shortLegals: string[];
  accountRollNumbers: string[];
  addresses: string[];
  matchedRequestedAddress: boolean;
}

interface Account {
  rollNumber: string;
  address: string;
  assessmentClass: string | null;
  rollYear: number | null;
  landSizeSqm: number | null;
  cpids: string[];
  viaSharedParcel: boolean;
}

export interface ParcelDiscoveryResult {
  status: 'ok';
  truncated: boolean;
  quadrantSupplied: boolean;
  query: { normalized: string };
  parcels: Parcel[];
  accounts: Account[];
  counts: { rows: number; accounts: number; parcels: number };
  areaSemantics: 'assessment_account_land_area_not_additive';
  retrievedAt: string;
  source: {
    dataset: '4bsw-nn7w';
    name: 'Current Year Property Assessments (Parcel)';
    licenceUrl: 'https://data.calgary.ca/d/Open-Data-Terms/u45n-7awa';
  };
  warnings: string[];
}

const SELECT = 'roll_year,roll_number,address,assessment_class,assessment_class_description,land_use_designation,land_size_sm,short_legal,cpid,mod_date,multipolygon';
const LIMIT = 200;
const VALID_CPID = /^[0-9A-Za-z-]{1,20}$/;
class DiscoveryRequestError extends Error {
  constructor(readonly category: 'parse_error' | `http_${number}`) { super(category); }
}
const quote = (value: string) => value.replace(/'/g, "''");
const numeric = (value: string | undefined): number | null => {
  if (value == null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const add = (values: string[], value: string | undefined) => {
  if (value && !values.includes(value)) values.push(value);
};

export function matchesDiscoveryAddress(address: string, key: string, quadrant: string | null): boolean {
  const text = address.trim().toUpperCase();
  const quadrants = quadrant ? [quadrant] : ['SE', 'SW', 'NE', 'NW'];
  return quadrants.some(q => {
    const street = `${key} ${q}`;
    if (text === street) return true;
    if (!text.endsWith(` ${street}`)) return false;
    const unit = text.slice(0, -(street.length + 1));
    return /^\d+[A-Z]?$/.test(unit);
  });
}

/** Duplicate query rows are counted once; address matches take precedence over expansion. */
export function groupDiscoveryRows(
  matchedRows: DiscoveryRow[], expandedRows: DiscoveryRow[],
  normalized: string, quadrantSupplied: boolean, truncated: boolean,
): ParcelDiscoveryResult {
  const rows = new Map<string, { row: DiscoveryRow; matched: boolean }>();
  for (const [batch, matched] of [[matchedRows, true], [expandedRows, false]] as const) {
    for (const row of batch) {
      const identity = JSON.stringify(SELECT.split(',').map(field => row[field as keyof DiscoveryRow] ?? null));
      if (!rows.has(identity)) rows.set(identity, { row, matched });
    }
  }
  const parcels = new Map<string, Parcel>();
  const accounts = new Map<string, Account>();
  const areas = new Map<string, Set<number | null>>();
  const warnings = new Set<string>();
  if (truncated) warnings.add('Results were truncated at the 200-row cap; the candidate set may be incomplete.');
  if (!quadrantSupplied) warnings.add('No quadrant was supplied; candidates may span several quadrants.');
  if ([...rows.values()].some(({ matched }) => !matched)) warnings.add('Additional accounts were found via shared-parcel expansion.');
  let missingRollRows = 0;

  for (const { row, matched } of rows.values()) {
    const roll = row.roll_number?.trim() ? row.roll_number : undefined;
    const cpid = row.cpid?.trim() ? row.cpid : undefined;
    const area = numeric(row.land_size_sm);
    if (roll) {
      let account = accounts.get(roll);
      if (!account) {
        account = {
          rollNumber: roll, address: row.address ?? '', assessmentClass: row.assessment_class ?? null,
          rollYear: numeric(row.roll_year), landSizeSqm: area, cpids: [], viaSharedParcel: !matched,
        };
        accounts.set(roll, account);
        areas.set(roll, new Set());
      }
      if (matched) account.viaSharedParcel = false;
      areas.get(roll)!.add(area);
      add(account.cpids, cpid);
    } else {
      missingRollRows++;
    }
    if (!cpid) {
      if (roll) warnings.add(`Account ${roll} has no parcel identifier.`);
      continue;
    }
    let parcel = parcels.get(cpid);
    if (!parcel) {
      parcel = {
        cpid, geometry: row.multipolygon ?? null, landUseDesignations: [], shortLegals: [],
        accountRollNumbers: [], addresses: [], matchedRequestedAddress: matched,
      };
      parcels.set(cpid, parcel);
    } else if (row.multipolygon) {
      if (!parcel.geometry) parcel.geometry = row.multipolygon;
      else if (parcel.geometry.type !== row.multipolygon.type ||
        JSON.stringify(parcel.geometry.coordinates) !== JSON.stringify(row.multipolygon.coordinates)) {
        warnings.add(`Parcel ${cpid} geometries differed; the first published boundary was retained.`);
      }
    }
    parcel.matchedRequestedAddress ||= matched;
    add(parcel.landUseDesignations, row.land_use_designation);
    add(parcel.shortLegals, row.short_legal);
    add(parcel.accountRollNumbers, roll);
    add(parcel.addresses, row.address);
  }
  if (missingRollRows) warnings.add(`${missingRollRows} rows without a roll number were ignored for accounts`);
  for (const account of accounts.values()) {
    if (account.cpids.length > 1) warnings.add(`Account ${account.rollNumber} spans multiple CPIDs; its land area is not additive.`);
    const values = [...areas.get(account.rollNumber)!];
    if (values.length > 1) warnings.add(`Account ${account.rollNumber} land area values differed (${values.map(v => v ?? 'unknown').join(', ')}); the first value was retained.`);
  }
  for (const parcel of parcels.values()) {
    if (!parcel.geometry) warnings.add(`Parcel ${parcel.cpid} has no published boundary.`);
    if (parcel.accountRollNumbers.length > 1) warnings.add(`Several accounts share parcel ${parcel.cpid}; their land areas are not additive.`);
  }
  return {
    status: 'ok', truncated, quadrantSupplied, query: { normalized },
    parcels: [...parcels.values()], accounts: [...accounts.values()],
    counts: { rows: rows.size, accounts: accounts.size, parcels: parcels.size },
    areaSemantics: 'assessment_account_land_area_not_additive', retrievedAt: new Date().toISOString(),
    source: {
      dataset: '4bsw-nn7w', name: 'Current Year Property Assessments (Parcel)',
      licenceUrl: 'https://data.calgary.ca/d/Open-Data-Terms/u45n-7awa',
    },
    warnings: [...warnings],
  };
}

async function fetchRows(where: string): Promise<DiscoveryRow[]> {
  const url = `https://data.calgary.ca/resource/4bsw-nn7w.json?${new URLSearchParams({ $select: SELECT, $where: where, $limit: String(LIMIT), $order: 'address,roll_number,cpid' })}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new DiscoveryRequestError(`http_${response.status}`);
  try {
    return await response.json() as DiscoveryRow[];
  } catch (error) {
    if (error instanceof SyntaxError) throw new DiscoveryRequestError('parse_error');
    throw error;
  }
}

export async function discoverCalgaryParcels(address: string): Promise<ParcelDiscoveryResult | { status: 'no_data' } | null> {
  try {
    const { normalized, quadrant } = normalizeCalgaryAddress(address);
    const key = quadrant ? normalized.slice(0, -quadrant.length).trimEnd() : normalized;
    if (/[%_]/.test(key) || /[%_]/.test(quadrant ?? '')) return null;
    const escaped = quote(key);
    const where = quadrant
      ? `upper(address) = '${escaped} ${quadrant}' OR upper(address) like '% ${escaped} ${quadrant}'`
      : `upper(address) like '${escaped} %' OR upper(address) like '% ${escaped} %'`;
    const raw = await fetchRows(where);
    const matched = raw.filter(row => matchesDiscoveryAddress(row.address ?? '', key, quadrant));
    if (!matched.length) return { status: 'no_data' };
    const publishedCpids = [...new Set(matched.map(row => row.cpid).filter((cpid): cpid is string => Boolean(cpid?.trim())))];
    const cpids = publishedCpids.filter(cpid => VALID_CPID.test(cpid));
    const expanded = cpids.length ? await fetchRows(`cpid in (${cpids.map(cpid => `'${quote(cpid)}'`).join(',')})`) : [];
    // Only the CPIDs from the address query are eligible: no recursive or roll-number expansion.
    const result = groupDiscoveryRows(matched, expanded.filter(row => cpids.includes(row.cpid ?? '')),
      normalized, Boolean(quadrant), raw.length >= LIMIT || expanded.length >= LIMIT);
    for (const cpid of publishedCpids.filter(cpid => !VALID_CPID.test(cpid))) {
      result.warnings.push(`Parcel ${cpid} was skipped for expansion because its identifier format is invalid.`);
    }
    return result;
  } catch (error) {
    const category = error instanceof DiscoveryRequestError ? error.category
      : error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError') ? 'timeout' : 'network_error';
    console.warn(category);
    return null;
  }
}
