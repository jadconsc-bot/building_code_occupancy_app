/**
 * useProjectContext
 *
 * Single source of truth for project data across all tools.
 * Wraps trpc.projects.get with jurisdiction resolution via useJurisdiction.
 *
 * tRPC query deduplication: all components calling this hook with the same
 * projectId share one cache entry — no duplicate network requests.
 *
 * Never throws — returns null project/jurisdiction on error or missing id.
 */

import { trpc } from '@/lib/trpc';
import { useJurisdiction } from './useJurisdiction';

export interface ProjectContext {
  id: number;
  name: string;
  province: string | null;
  municipality: string | null;
  address: string | null;
  grossFloorArea: string | null;
  storeys: number | null;
  totalDwellingUnits: number | null;
  totalDwellingUnitsJson?: unknown;
  occupancyCode: string | null;
  codeEdition: string | null;
  jurisdictionSource: 'geocoded' | 'manual' | 'device' | 'fallback' | null;
  geocodedAt: Date | null;
}

export interface ProjectContextResult {
  project: ProjectContext | null;
  jurisdiction: ReturnType<typeof useJurisdiction>['jurisdiction'];
  isGeocoded: boolean;
  isLoading: boolean;
  error: unknown;
  complianceInputSlice: {
    province: string;
    municipality: string;
    codeEdition: string;
    jurisdictionSource: 'geocoded' | 'manual' | 'device' | 'fallback';
  } | null;
}

export function useProjectContext(projectId: number | null | undefined): ProjectContextResult {
  // Fetch full project record.
  // staleTime 30s: project data changes infrequently during a session.
  // tRPC deduplication: multiple components with same projectId share
  // one cache entry — no duplicate network requests.
  const { data: project, isLoading, error } = trpc.projects.get.useQuery(
    { id: projectId! },
    {
      enabled: !!projectId,
      staleTime: 30_000,
    }
  );

  // useJurisdiction has its own query (getProjectJurisdiction).
  // tRPC deduplication prevents a second network request if already cached.
  const { jurisdiction, isGeocoded, setManual } = useJurisdiction(projectId);

  // Build compliance input slice — only when province is resolvable.
  // Jurisdiction resolution priority:
  //   1. Geocoded jurisdiction (highest confidence)
  //   2. Project record province/municipality
  //   3. null (caller must show manual selector)
  const complianceInputSlice = (() => {
    const province = jurisdiction?.province ?? project?.province ?? null;
    const municipality = jurisdiction?.municipality ?? project?.municipality ?? null;
    const codeEdition = jurisdiction?.codeEdition ?? project?.codeEdition ?? 'NBC 2020';
    const source = jurisdiction?.source ?? project?.jurisdictionSource ?? 'manual';

    // Cannot build slice without province — return null so callers
    // know to show manual fallback selector
    if (!province) return null;

    return {
      province,
      municipality: municipality ?? '',
      codeEdition,
      jurisdictionSource: source as 'geocoded' | 'manual' | 'device' | 'fallback',
    };
  })();

  return {
    project: project ?? null,
    jurisdiction,
    isGeocoded,
    isLoading,
    error,
    complianceInputSlice,
  };
}
