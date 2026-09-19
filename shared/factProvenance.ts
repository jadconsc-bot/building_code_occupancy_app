export type FactSource = "ai-extracted" | "user-confirmed" | "derived";

export interface ProvenancedFact<T> {
  value: T;
  confirmed: boolean;
  source: FactSource;
}

export interface ReadProvenancedFactOptions<T> {
  wrapper: unknown;
  scalar: T | null | undefined;
  isValue: (value: unknown) => value is T;
  onInvalidWrapper?: () => void;
}

export interface ReadProvenancedFactResult<T> {
  value: T | null;
  confirmed: boolean;
  source: FactSource | null;
  usedFallback: boolean;
}

function isFactSource(value: unknown): value is FactSource {
  return value === "ai-extracted" || value === "user-confirmed" || value === "derived";
}

export function readProvenancedFact<T>({ wrapper, scalar, isValue, onInvalidWrapper }: ReadProvenancedFactOptions<T>): ReadProvenancedFactResult<T> {
  if (wrapper && typeof wrapper === "object") {
    const candidate = wrapper as Partial<ProvenancedFact<T>>;
    if (isValue(candidate.value) && typeof candidate.confirmed === "boolean" && isFactSource(candidate.source)) {
      return { value: candidate.value, confirmed: candidate.confirmed, source: candidate.source, usedFallback: false };
    }
  }
  if (wrapper !== null && wrapper !== undefined) onInvalidWrapper?.();
  return { value: scalar ?? null, confirmed: false, source: null, usedFallback: true };
}
