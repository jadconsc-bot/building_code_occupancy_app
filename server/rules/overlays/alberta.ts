/**
 * NBC(AE) 2023 Alberta Overlay — Sprint E2-1
 *
 * Source: National Building Code – 2023 Alberta Edition, NR24-28/7-2023E
 * These entries replace the corresponding NBC 2020 base values when province='AB'.
 *
 * STANDATA amendments (Alberta Municipal Affairs bulletins) may further override
 * these values between code editions. Monitor: alberta.ca/building-technical-standards-standata
 */

export interface RuleOverride {
  clauseId: string;
  ruleId: string;
  description: string;
  nbcValue: number | string;
  albertaValue: number | string;
  unit: string;
  codeRef: string;
}

export const ALBERTA_OVERRIDES: RuleOverride[] = [
  {
    clauseId: 'CEIL-9.5.3.1-AB-SUITE',
    ruleId: 'P9-CEILING-AB',
    description: 'Secondary suite minimum ceiling height',
    nbcValue: 2.10,
    albertaValue: 1.95,
    unit: 'm',
    codeRef: 'NBC(AE) 2023 s.9.5.3.1(2)',
  },
  {
    clauseId: 'BEAM-9.5.3.1-AB-SUITE',
    ruleId: 'P9-CEILING-AB',
    description: 'Secondary suite beam/duct clearance height',
    nbcValue: 2.00,
    albertaValue: 1.85,
    unit: 'm',
    codeRef: 'NBC(AE) 2023 s.9.5.3.1(3)',
  },
  {
    clauseId: 'DOOR-9.5.5.1-AB-SUITE',
    ruleId: 'P9-DOOR-AB',
    description: 'Secondary suite door height where 1.95m ceiling applies',
    nbcValue: 1980,
    albertaValue: 1890,
    unit: 'mm',
    codeRef: 'NBC(AE) 2023 s.9.5.5.1(2)',
  },
];

export function getAlbertaOverride(clauseId: string): RuleOverride | undefined {
  return ALBERTA_OVERRIDES.find((o) => o.clauseId === clauseId);
}
