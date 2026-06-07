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

  // --- FIRE SEPARATION RULES (NBC(AE) 2023 Articles 9.10.9.4, 9.10.9.15, 9.10.9.16) ---

  {
    clauseId: 'FIRESEP-9.10.9.15-SUITES',
    nbcSection: '9.10.9.15.(1)',
    ruleId: 'P9-FIRESEP-SUITES',
    description: 'Fire separation between suites — 45 min FRR minimum',
    overrideType: 'add',
    nbcValue: 45,
    overrideValue: 45,
    unit: 'min',
    codeRef: 'NBC(AE) 2023 s.9.10.9.15(1)',
    priority: 'HIGH',
  },
  {
    clauseId: 'FIRESEP-9.10.9.16-RESIDENTIAL',
    nbcSection: '9.10.9.16.(1)',
    ruleId: 'P9-FIRESEP-RESIDENTIAL',
    description: 'Fire separation between residential suites — 45 min FRR minimum',
    overrideType: 'add',
    nbcValue: 45,
    overrideValue: 45,
    unit: 'min',
    codeRef: 'NBC(AE) 2023 s.9.10.9.16(1)',
    priority: 'HIGH',
  },
  {
    clauseId: 'FIRESEP-9.10.9.16-SUITE-SMOKE',
    nbcSection: '9.10.9.16.(4)',
    ruleId: 'P9-FIRESEP-SUITE-SMOKE',
    description: 'Secondary suite alternative: 12.7mm gypsum smoke-tight barrier on both sides of walls + underside of floor-ceiling framing — waives 45 min FRR requirement',
    overrideType: 'add',
    nbcValue: 45,
    overrideValue: 0,
    unit: 'min',
    condition: 'continuousSmokeBarrier === true && gypsumThicknessMm >= 12.7',
    codeRef: 'NBC(AE) 2023 s.9.10.9.16(4)',
    priority: 'HIGH',
  },
  {
    clauseId: 'FIRESEP-9.10.9.4-FLOOR',
    nbcSection: '9.10.9.4.(2)',
    ruleId: 'P9-FIRESEP-FLOOR',
    description: 'Floor assemblies within a house with secondary suite need NOT be fire separations',
    overrideType: 'add',
    nbcValue: 'required',
    overrideValue: 'not_required',
    unit: 'classification',
    condition: 'buildingType === "house_with_secondary_suite"',
    codeRef: 'NBC(AE) 2023 s.9.10.9.4(2)',
    priority: 'MEDIUM',
  },
];

export function getAlbertaOverride(clauseId: string): ProvincialOverride | undefined {
  return ALBERTA_OVERRIDES.find((o) => o.clauseId === clauseId);
}
