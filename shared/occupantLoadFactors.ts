/**
 * Canonical occupant load factor table.
 *
 * Primary source: NBC 2020 Table 3.1.17.1 — "Occupant Load"
 * Division B, PDF pages 182-183 (code pages 3-43/3-44).
 * Verified against federal text this session (2026-06-21).
 *
 * Unit: Area per person, m²/person (larger = less dense).
 * null means the row uses a clause calculation instead of a table value.
 *
 * Rows annotated "OBC-sourced" have no counterpart in the federal NBC 2020
 * table; they originate from the Ontario Building Code or are design-judgment
 * values. Engineer sign-off is required when these rows are used for permit
 * calculations.
 *
 * CONSERVATIVE DEFAULTS (getDefaultLoadFactor):
 *   A / A-1-4 : 0.40  standing space — densest federal assembly row
 *   B / B-2-3 : 10.00 care/treatment areas
 *   B-1       : 11.60 detention quarters
 *   C         : 4.60  dormitories (dwelling units require 2 p/sleeping room clause)
 *   D         : 4.60  personal services shops — denser federal D row
 *   E         : 3.70  basements and first storeys — most conservative mercantile row
 *   F / F-1-3 : 4.60  manufacturing/process rooms — most conservative industrial row
 */

export interface OccupantLoadFactor {
  id: string;
  useType: string;
  areaPerPerson: number | null; // m²/person; null = clause calculation
  clause?: string;              // clause text when areaPerPerson is null
  category: string;
  occupancyGroups: string[];
  notes?: string;
  source?: 'federal' | 'OBC' | 'design-judgment'; // defaults to 'federal' when absent
}

export const occupantLoadFactors: OccupantLoadFactor[] = [
  // ── Assembly Uses (Group A) ────────────────────────────────────────────────
  {
    id: 'assembly-standing',
    useType: 'Standing space',
    areaPerPerson: 0.40,
    category: 'Assembly Uses',
    occupancyGroups: ['A-1', 'A-2', 'A-3', 'A-4'],
    notes: 'Areas where occupants stand',
  },
  {
    id: 'assembly-non-fixed',
    useType: 'Space with non-fixed seats',
    areaPerPerson: 0.75,
    category: 'Assembly Uses',
    occupancyGroups: ['A-1', 'A-2', 'A-3', 'A-4'],
    notes: 'Seating not permanently attached',
  },
  {
    id: 'assembly-non-fixed-tables',
    useType: 'Space with non-fixed seats and tables',
    areaPerPerson: 0.95,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2'],
    notes: 'Banquet halls, meeting rooms with tables',
  },
  {
    id: 'assembly-fixed-seats',
    useType: 'Space with fixed seats',
    areaPerPerson: null,
    clause: 'Number of fixed seats (see Clause 3.1.17.1.(1)(a))',
    category: 'Assembly Uses',
    occupancyGroups: ['A-1', 'A-2', 'A-3', 'A-4'],
    notes: 'Count actual fixed seats — table value does not apply',
  },
  {
    id: 'assembly-stages',
    useType: 'Stages for theatrical performances',
    areaPerPerson: 0.75,
    category: 'Assembly Uses',
    occupancyGroups: ['A-1'],
    notes: 'Performance stage areas',
  },
  {
    id: 'assembly-stadia',
    useType: 'Stadia and grandstands',
    areaPerPerson: 0.60,
    category: 'Assembly Uses',
    occupancyGroups: ['A-3', 'A-4'],
    notes: 'Indoor arenas and outdoor stadium seating',
  },
  {
    id: 'assembly-bowling',
    useType: 'Bowling alleys, pool and billiard rooms',
    areaPerPerson: 9.30,
    category: 'Assembly Uses',
    occupancyGroups: ['A-3'],
    notes: 'Bowling lanes, billiard/pool halls',
  },
  {
    id: 'assembly-classrooms',
    useType: 'Classrooms',
    areaPerPerson: 1.85,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2'],
    notes: 'Educational classrooms',
  },
  {
    id: 'assembly-school-shops',
    useType: 'School shops and vocational rooms',
    areaPerPerson: 9.30,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2'],
    notes: 'Workshop and vocational training spaces in schools',
  },
  {
    id: 'assembly-reading',
    useType: 'Reading or writing rooms or lounges',
    areaPerPerson: 1.85,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2'],
    notes: 'Libraries, study areas, lounges',
  },
  {
    id: 'assembly-dining',
    useType: 'Dining, beverage and cafeteria space',
    areaPerPerson: 1.20,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2'],
    notes: 'Restaurants, bars, cafeterias',
  },
  {
    id: 'assembly-labs',
    useType: 'Laboratories in schools',
    areaPerPerson: 4.60,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2'],
    notes: 'Science labs in educational buildings',
  },
  // OBC-sourced rows — no counterpart in NBC 2020 federal Table 3.1.17.1
  {
    id: 'assembly-exhibition',
    useType: 'Exhibition halls (other than those used for trade shows)',
    areaPerPerson: 2.80,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2', 'A-3'],
    notes: 'Museums, galleries — OBC-sourced; no federal NBC 2020 counterpart in Table 3.1.17.1',
    source: 'OBC',
  },
  {
    id: 'assembly-trade-shows',
    useType: 'Exhibition halls used for trade shows',
    areaPerPerson: 2.80,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2', 'A-3'],
    notes: 'Trade show floor space — OBC-sourced; no federal NBC 2020 counterpart in Table 3.1.17.1',
    source: 'OBC',
  },
  {
    id: 'assembly-skating',
    useType: 'Skating rinks, swimming pools',
    areaPerPerson: 4.60,
    category: 'Assembly Uses',
    occupancyGroups: ['A-3'],
    notes: 'Ice surface or pool deck — design-judgment value; no primary source row in NBC 2020 Table 3.1.17.1 — engineer sign-off required',
    source: 'design-judgment',
  },
  {
    id: 'assembly-exercise',
    useType: 'Exercise rooms',
    areaPerPerson: 9.30,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2', 'A-3'],
    notes: 'Gyms, fitness centres — design-judgment value; no primary source row in NBC 2020 Table 3.1.17.1 — engineer sign-off required',
    source: 'design-judgment',
  },
  {
    id: 'assembly-gaming',
    useType: 'Gaming premises',
    areaPerPerson: 1.85,
    category: 'Assembly Uses',
    occupancyGroups: ['A-2'],
    notes: 'Casinos, gaming floors — design-judgment value; no primary source row in NBC 2020 Table 3.1.17.1 — engineer sign-off required',
    source: 'design-judgment',
  },

  // ── Care, Treatment and Detention (Group B) ────────────────────────────────
  {
    id: 'care-b1-detention',
    useType: 'Detention quarters',
    areaPerPerson: 11.60,
    category: 'Care, Treatment & Detention',
    occupancyGroups: ['B-1'],
    notes: 'Prisons, jails, detention centres',
  },
  {
    id: 'care-b23-treatment',
    useType: 'Care, treatment and sleeping room areas',
    areaPerPerson: 10.00,
    category: 'Care, Treatment & Detention',
    occupancyGroups: ['B-2', 'B-3'],
    notes: 'Hospitals, nursing homes, group homes, assisted living',
  },
  {
    id: 'care-suites',
    useType: 'Suites',
    areaPerPerson: null,
    clause: '2 persons per sleeping room — apply dwelling unit values per Note (2) of Table 3.1.17.1',
    category: 'Care, Treatment & Detention',
    occupancyGroups: ['B-2', 'B-3'],
    notes: 'Care occupancy suites — clause calculation, not table value',
  },

  // ── Residential Uses (Group C) ────────────────────────────────────────────
  {
    id: 'residential-dwelling',
    useType: 'Dwelling units',
    areaPerPerson: null,
    clause: '2 persons per sleeping room (Note (2) of Table 3.1.17.1)',
    category: 'Residential Uses',
    occupancyGroups: ['C'],
    notes: 'Houses, apartments, condos — clause calculation; 4.60 dormitory default used when room count unavailable',
  },
  {
    id: 'residential-dormitories',
    useType: 'Dormitories',
    areaPerPerson: 4.60,
    category: 'Residential Uses',
    occupancyGroups: ['C'],
    notes: 'Student housing, barracks',
  },

  // ── Business and Personal Services Uses (Group D) ─────────────────────────
  {
    id: 'business-personal-services',
    useType: 'Personal services shops',
    areaPerPerson: 4.60,
    category: 'Business & Personal Services',
    occupancyGroups: ['D'],
    notes: 'Hair salons, dry cleaners, similar personal service retail',
  },
  {
    id: 'business-offices',
    useType: 'Offices',
    areaPerPerson: 9.30,
    category: 'Business & Personal Services',
    occupancyGroups: ['D'],
    notes: 'General office space',
  },

  // ── Mercantile Uses (Group E) ─────────────────────────────────────────────
  {
    id: 'mercantile-basement',
    useType: 'Basements and first storeys',
    areaPerPerson: 3.70,
    category: 'Mercantile Uses',
    occupancyGroups: ['E'],
    notes: 'Ground-floor and below-grade retail sales floors',
  },
  {
    id: 'mercantile-second-pedestrian',
    useType: 'Second storeys having a principal entrance from a pedestrian thoroughfare or a parking area',
    areaPerPerson: 3.70,
    category: 'Mercantile Uses',
    occupancyGroups: ['E'],
    notes: 'Second-floor retail with direct street or parking access',
  },
  {
    id: 'mercantile-upper',
    useType: 'Other storeys',
    areaPerPerson: 5.60,
    category: 'Mercantile Uses',
    occupancyGroups: ['E'],
    notes: 'Upper-floor retail without direct pedestrian entrance',
  },

  // ── Industrial Uses (Group F) ─────────────────────────────────────────────
  {
    id: 'industrial-manufacturing',
    useType: 'Manufacturing or process rooms',
    areaPerPerson: 4.60,
    category: 'Industrial Uses',
    occupancyGroups: ['F-1', 'F-2', 'F-3'],
    notes: 'Factory floors, production areas',
  },
  {
    id: 'industrial-storage-garages',
    useType: 'Storage garages',
    areaPerPerson: 46.00,
    category: 'Industrial Uses',
    occupancyGroups: ['F-2', 'F-3'],
    notes: 'Parking structures',
  },
  {
    id: 'industrial-warehouse',
    useType: 'Storage spaces (warehouse)',
    areaPerPerson: 28.00,
    category: 'Industrial Uses',
    occupancyGroups: ['F-2', 'F-3'],
    notes: 'Bulk storage facilities',
  },
  {
    id: 'industrial-hangars',
    useType: 'Aircraft hangars',
    areaPerPerson: 46.00,
    category: 'Industrial Uses',
    occupancyGroups: ['F-1', 'F-2'],
    notes: 'Aircraft storage and maintenance hangars',
  },

  // ── Other Uses ────────────────────────────────────────────────────────────
  {
    id: 'other-cleaning',
    useType: 'Cleaning and repair goods',
    areaPerPerson: 4.60,
    category: 'Other Uses',
    occupancyGroups: ['E', 'F-1'],
    notes: 'Laundry, dry cleaning, repair shops',
  },
  {
    id: 'other-kitchens',
    useType: 'Kitchens',
    areaPerPerson: 9.30,
    category: 'Other Uses',
    occupancyGroups: ['A-2', 'B-2', 'C', 'D', 'E', 'F-1'],
    notes: 'Commercial and institutional kitchens',
  },
  {
    id: 'other-storage',
    useType: 'Storage',
    areaPerPerson: 46.00,
    category: 'Other Uses',
    occupancyGroups: ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C', 'D', 'E', 'F-1', 'F-2', 'F-3'],
    notes: 'General storage rooms in any occupancy',
  },
  {
    id: 'other-public-corridors',
    useType: 'Public corridors intended for occupancies in addition to pedestrian travel',
    areaPerPerson: 3.70,
    category: 'Other Uses',
    occupancyGroups: ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C', 'D', 'E', 'F-1', 'F-2', 'F-3'],
    notes: 'Corridors used for activities beyond circulation (see Note A-3.3)',
  },
  {
    id: 'other-labs',
    useType: 'Laboratories',
    areaPerPerson: 4.60,
    category: 'Other Uses',
    occupancyGroups: ['A-2', 'B-2', 'D', 'F-1'],
    notes: 'Research, testing, and analytical labs outside schools',
  },
];

// ── Conservative defaults by occupancy group ──────────────────────────────────
// Used when only an occupancy group code is known and use-type detail is unavailable.
// Each default is the smallest m²/person value (densest = most conservative) from
// the federal rows applicable to that group. See NBC 2020 Table 3.1.17.1.

interface DefaultLoadFactor {
  areaPerPerson: number;
  useType: string;
  federalRow: string;
  note: string;
}

const GROUP_CONSERVATIVE_DEFAULTS: Record<string, DefaultLoadFactor> = {
  // Group A — standing space (0.40) is the densest federal assembly row.
  // All A subdivisions have standing space as an applicable use type.
  'A':   { areaPerPerson: 0.40, useType: 'Standing space', federalRow: 'NBC 2020 Table 3.1.17.1 — Assembly uses, standing space', note: 'Conservative default — actual value depends on sub-use-type (dining 1.20, classrooms 1.85, etc.)' },
  'A-1': { areaPerPerson: 0.40, useType: 'Standing space', federalRow: 'NBC 2020 Table 3.1.17.1 — Assembly uses, standing space', note: 'Performing arts — conservative default; fixed-seat venues use seat count per clause' },
  'A-2': { areaPerPerson: 0.40, useType: 'Standing space', federalRow: 'NBC 2020 Table 3.1.17.1 — Assembly uses, standing space', note: 'Dining/educational — conservative default; typical dining = 1.20, classrooms = 1.85' },
  'A-3': { areaPerPerson: 0.40, useType: 'Standing space', federalRow: 'NBC 2020 Table 3.1.17.1 — Assembly uses, standing space', note: 'Arenas/pools — conservative default; bowling alleys = 9.30 per federal table' },
  'A-4': { areaPerPerson: 0.40, useType: 'Standing space', federalRow: 'NBC 2020 Table 3.1.17.1 — Assembly uses, standing space', note: 'Open-air assembly — conservative default; stadia/grandstands = 0.60 per federal table' },
  // Group B — care/treatment (10.00) is the lowest numeric B value with a federal row.
  // B-1 detention quarters has its own specific federal value (11.60).
  'B':   { areaPerPerson: 10.00, useType: 'Care, treatment and sleeping room areas', federalRow: 'NBC 2020 Table 3.1.17.1 — Care, treatment or detention uses', note: 'Conservative default; B-1 detention quarters = 11.60' },
  'B-1': { areaPerPerson: 11.60, useType: 'Detention quarters',                       federalRow: 'NBC 2020 Table 3.1.17.1 — Care, treatment or detention uses, detention quarters', note: 'Only federal numeric B-1 row' },
  'B-2': { areaPerPerson: 10.00, useType: 'Care, treatment and sleeping room areas', federalRow: 'NBC 2020 Table 3.1.17.1 — Care, treatment or detention uses', note: 'Suites use 2-persons/sleeping-room clause' },
  'B-3': { areaPerPerson: 10.00, useType: 'Care, treatment and sleeping room areas', federalRow: 'NBC 2020 Table 3.1.17.1 — Care, treatment or detention uses', note: 'Suites use 2-persons/sleeping-room clause' },
  // Group C — dormitory (4.60) is the only numeric C federal row.
  // Dwelling units require the 2-persons/sleeping-room clause per Note (2).
  'C':   { areaPerPerson: 4.60,  useType: 'Dormitories', federalRow: 'NBC 2020 Table 3.1.17.1 — Residential uses, dormitories', note: 'Dwelling units must use 2 persons/sleeping room per Table 3.1.17.1 Note (2) — verify with architect' },
  // Group D — personal services shops (4.60) is denser than offices (9.30).
  'D':   { areaPerPerson: 4.60,  useType: 'Personal services shops', federalRow: 'NBC 2020 Table 3.1.17.1 — Business and personal services uses, personal services shops', note: 'Conservative default; typical office = 9.30' },
  // Group E — basements/first storeys (3.70) is the most conservative mercantile row.
  'E':   { areaPerPerson: 3.70,  useType: 'Basements and first storeys', federalRow: 'NBC 2020 Table 3.1.17.1 — Mercantile uses, basements and first storeys', note: 'Upper floors require 5.60 unless second storey with pedestrian entrance (also 3.70)' },
  // Group F — manufacturing/process (4.60) is the most conservative industrial row.
  // Storage warehouse = 28.00; storage garages/aircraft hangars = 46.00.
  'F':   { areaPerPerson: 4.60,  useType: 'Manufacturing or process rooms', federalRow: 'NBC 2020 Table 3.1.17.1 — Industrial uses, manufacturing or process rooms', note: 'Storage warehouse = 28.00; storage garages/hangars = 46.00' },
  'F-1': { areaPerPerson: 4.60,  useType: 'Manufacturing or process rooms', federalRow: 'NBC 2020 Table 3.1.17.1 — Industrial uses, manufacturing or process rooms', note: 'High-hazard industrial' },
  'F-2': { areaPerPerson: 4.60,  useType: 'Manufacturing or process rooms', federalRow: 'NBC 2020 Table 3.1.17.1 — Industrial uses, manufacturing or process rooms', note: 'Medium-hazard industrial; warehouse = 28.00' },
  'F-3': { areaPerPerson: 4.60,  useType: 'Manufacturing or process rooms', federalRow: 'NBC 2020 Table 3.1.17.1 — Industrial uses, manufacturing or process rooms', note: 'Low-hazard industrial; warehouse = 28.00' },
};

/**
 * Return the conservative default load factor for an occupancy group.
 *
 * Used when only a group code is available (e.g. 'A-1', 'D', 'F-2') and
 * no use-type detail has been captured. Returns the densest (smallest
 * m²/person) federal row for the group. Callers should note that actual
 * permit-level calculations require use-type selection.
 *
 * Lookup order: exact group → first-letter prefix → offices fallback (9.30).
 */
export function getDefaultLoadFactor(occupancyGroup: string): DefaultLoadFactor & { citation: string } {
  const normalized = occupancyGroup.trim().toUpperCase();
  const match =
    GROUP_CONSERVATIVE_DEFAULTS[normalized] ??
    GROUP_CONSERVATIVE_DEFAULTS[normalized.charAt(0)] ??
    { areaPerPerson: 9.30, useType: 'Offices (fallback)', federalRow: 'NBC 2020 Table 3.1.17.1 — Business and personal services uses, offices', note: 'Fallback — occupancy group not recognized' };

  return {
    ...match,
    citation: 'NBC 2020 Table 3.1.17.1 (conservative default; actual value requires use-type selection)',
  };
}

/**
 * Return all load factor rows applicable to an occupancy code.
 * Normalises the code and matches by prefix as well as exact group.
 */
export function getLoadFactorsForOccupancy(occupancyCode: string): OccupantLoadFactor[] {
  const normalizedCode = occupancyCode.toUpperCase().split(' ')[0].split('(')[0].trim();
  return occupantLoadFactors.filter(f =>
    f.occupancyGroups.some(g => {
      const ng = g.toUpperCase();
      return ng === normalizedCode
        || normalizedCode.startsWith(ng)
        || ng.startsWith(normalizedCode.split('-')[0]);
    })
  );
}

/** Calculate occupant load: ceil(floorArea / areaPerPerson). */
export function calculateOccupantLoad(floorArea: number, areaPerPerson: number): number {
  if (floorArea <= 0 || areaPerPerson <= 0) return 0;
  return Math.ceil(floorArea / areaPerPerson);
}
