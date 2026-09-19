import { readProvenancedFact as readSharedProvenancedFact } from '../../shared/factProvenance';
export type { FactSource, ProvenancedFact, ReadProvenancedFactOptions, ReadProvenancedFactResult } from '../../shared/factProvenance';

/** Read a provenance wrapper while preserving compatibility with scalar rows. */
export function readProvenancedFact<T>(options: import('../../shared/factProvenance').ReadProvenancedFactOptions<T> & { field: string; entityType: "project" | "room"; entityId: number }) {
  return readSharedProvenancedFact({
    ...options,
    onInvalidWrapper: () => console.warn(JSON.stringify({
      event: "fact_provenance_fallback",
      field: options.field,
      entityType: options.entityType,
      entityId: options.entityId,
      reason: "invalid_or_incomplete_wrapper",
    })),
  });
}

import type { ProvenancedFact } from '../../shared/factProvenance';
export function userConfirmedFact<T>(value: T): ProvenancedFact<T> {
  return { value, confirmed: true, source: "user-confirmed" };
}
