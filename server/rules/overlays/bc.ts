/**
 * BCBC 2024 British Columbia Overlay
 *
 * Source: BC Building Code 2024 (Revision 2)
 * Applied when province === 'BC'. Replaces NBC 2020 base values where noted.
 *
 * Confirmed same as NBC 2020 (no override entry needed):
 *   - Part 3 travel distances (Table 3.4.2.5)
 *   - Occupant load factors (Table 3.1.17.1)
 *   - Egress window area (9.9.10.1 — 0.35 m² minimum)
 *   - Exit width minimum (860 mm)
 *
 * BC-specific pathways handled outside this overlay:
 *   - Energy Step Code (server/engine/home/stepCodeRules.ts)
 *   - Secondary suite ceiling: 2.1m (same as NBC 2020 standard — no override)
 *
 * TODO Sprint E2-3: Extract and confirm Part 9 residential divergences
 * from docs/BCBC_2024_web_revision2.pdf sections 9.5, 9.10
 */

import type { ProvincialOverride } from './types';

export const BC_OVERRIDES: ProvincialOverride[] = [
  // Egress window minimum clear dimension — BCBC 2024 s.9.9.10.1(1)(b)
  // NBC 2020: no explicit per-dimension minimum stated in same form
  // BCBC 2024: explicitly requires no single dimension < 380mm (already in engine as conditional)
  // No numerical value override — rule is same; engine already handles 380mm check.

  // Placeholder: Sprint E2-3 to add confirmed Part 9 divergences after extraction
];

export function getBcOverride(clauseId: string): ProvincialOverride | undefined {
  return BC_OVERRIDES.find((o) => o.clauseId === clauseId);
}
