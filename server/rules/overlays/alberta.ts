/**
 * NBC(AE) 2023 Alberta Overlay
 *
 * Source: National Building Code – 2023 Alberta Edition, NR24-28/7-2023E
 * Applied when province === 'AB'. Replaces NBC 2020 base values where noted.
 *
 * STANDATA: Alberta Municipal Affairs bulletins may further amend these values.
 * Monitor: alberta.ca/building-technical-standards-standata
 *
 * Part 3 travel distances / occupant loads / egress windows: identical to NBC 2020.
 * Only Part 9 residential values differ — no Part 3 numerical overrides in this overlay.
 */

import type { ProvincialOverride } from './types';

export const ALBERTA_OVERRIDES: ProvincialOverride[] = [
  {
    clauseId: 'CEIL-9.5.3.1-AB-SUITE',
    nbcSection: '9.5.3.1.(2)',
    ruleId: 'P9-CEILING-AB',
    description: 'Secondary suite minimum ceiling height',
    overrideType: 'replace',
    nbcValue: 2.10,
    overrideValue: 1.95,
    unit: 'm',
    codeRef: 'NBC(AE) 2023 s.9.5.3.1(2)',
  },
  {
    clauseId: 'BEAM-9.5.3.1-AB-SUITE',
    nbcSection: '9.5.3.1.(3)',
    ruleId: 'P9-CEILING-AB',
    description: 'Secondary suite beam/duct clearance height',
    overrideType: 'replace',
    nbcValue: 2.00,
    overrideValue: 1.85,
    unit: 'm',
    codeRef: 'NBC(AE) 2023 s.9.5.3.1(3)',
  },
  {
    clauseId: 'DOOR-9.5.5.1-AB-SUITE',
    nbcSection: '9.5.5.1.(2)',
    ruleId: 'P9-DOOR-AB',
    description: 'Secondary suite door height where 1.95m ceiling applies',
    overrideType: 'replace',
    nbcValue: 1980,
    overrideValue: 1890,
    unit: 'mm',
    codeRef: 'NBC(AE) 2023 s.9.5.5.1(2)',
  },

  // Fire separation entries (9.10.9.4, 9.10.9.15, 9.10.9.16)
  // were removed 2026-06-22 — unverified against primary source.
  // NBC_AE_2023_CODECOMPLY_EXTRACTION.md PART H notes these
  // articles as "TODO: full text extraction needed". Until
  // that extraction is complete and values are verified,
  // no Alberta override applies for fire separation.
  // The NBC(AE) 2023 primary source confirms occupant load,
  // travel distance, and egress windows are IDENTICAL to
  // NBC 2020 — no overrides needed for those domains.
];

export function getAlbertaOverride(clauseId: string): ProvincialOverride | undefined {
  return ALBERTA_OVERRIDES.find((o) => o.clauseId === clauseId);
}
