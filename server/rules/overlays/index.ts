import type { ProvincialOverride } from './types';
import { ALBERTA_OVERRIDES } from './alberta';
import { BC_OVERRIDES } from './bc';
import { NBC_2025_DELTA } from './nbc2025';

export type { ProvincialOverride };
export { ALBERTA_OVERRIDES, BC_OVERRIDES, NBC_2025_DELTA };

// Province code → overlay array
const OVERLAY_REGISTRY: Record<string, ProvincialOverride[]> = {
  AB: ALBERTA_OVERRIDES,
  BC: BC_OVERRIDES,
};

// Edition code → overlay array (for edition-first lookups, e.g. NBC 2025)
const EDITION_REGISTRY: Record<string, ProvincialOverride[]> = {
  'NBC 2025': NBC_2025_DELTA,
};

/**
 * Look up a static provincial override for a given section.
 * nbcSection should be bare (e.g. "9.5.3.1.(2)") — "NBC " prefix is stripped automatically.
 */
export function getStaticOverride(
  province: string,
  nbcSection: string,
): ProvincialOverride | undefined {
  const overlays = OVERLAY_REGISTRY[province];
  if (!overlays?.length) return undefined;
  const normalized = nbcSection.replace(/^NBC\s+/i, '').trim();
  return overlays.find(
    (o) => o.nbcSection === normalized && o.overrideType !== 'delete',
  );
}

/**
 * Returns the governing code edition string for a province.
 * Used to stamp the correct label on traces and evaluation results.
 */
export function editionForProvince(province: string, explicitEdition?: string): string {
  if (explicitEdition && explicitEdition !== 'NBC 2020') return explicitEdition;
  const editions: Record<string, string> = {
    AB: 'NBC(AE) 2023',
    BC: 'BCBC 2024',
  };
  return editions[province] ?? 'NBC 2020';
}

/**
 * Look up a static override by explicit edition (e.g. "NBC 2025").
 */
export function getEditionOverride(
  edition: string,
  nbcSection: string,
): ProvincialOverride | undefined {
  const overlays = EDITION_REGISTRY[edition];
  if (!overlays?.length) return undefined;
  const normalized = nbcSection.replace(/^NBC\s+/i, '').trim();
  return overlays.find(
    (o) => o.nbcSection === normalized && o.overrideType !== 'delete',
  );
}
