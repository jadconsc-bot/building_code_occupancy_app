/**
 * Shared overlay types for provincial code edition overlays.
 *
 * Architecture: NBC 2020 federal baseline
 *   └── + Alberta overlay  → NBC(AE) 2023
 *   └── + BC overlay       → BCBC 2024
 *   └── + 2025 delta       → NBC 2025
 */

export type OverrideType = 'replace' | 'add' | 'delete';

export interface ProvincialOverride {
  clauseId: string;       // CodeComply internal ID, e.g. "CEIL-9.5.3.1-AB-SUITE"
  nbcSection: string;     // Bare section ref (no "NBC " prefix), e.g. "9.5.3.1.(2)"
  ruleId: string;         // Rule engine ID
  description: string;
  overrideType: OverrideType;
  nbcValue: number | string;       // Federal baseline value
  overrideValue: number | string;  // Provincial override value
  unit: string;
  codeRef: string;        // Citation, e.g. "NBC(AE) 2023 s.9.5.3.1(2)"
  condition?: string;     // Optional condition string for documentation purposes
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}
