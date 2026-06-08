/**
 * useJurisdiction
 * Single source of truth for jurisdiction detection across all features.
 *
 * Resolution order:
 * 1. Project address → geocoded coordinates → province/municipality
 * 2. User's last used jurisdiction (localStorage: 'cc_last_jurisdiction')
 * 3. Manual selector fallback (returns null, feature shows manual input)
 *
 * Never throws — always returns a result or null.
 */

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { editionForProvince } from '@/lib/editionUtils';

export type JurisdictionSource = 'geocoded' | 'manual' | 'device' | 'fallback' | 'cached';

export interface JurisdictionResult {
  province: string;
  municipality: string;
  codeEdition: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  source: JurisdictionSource;
  confidence: 'high' | 'low';
}

export function useJurisdiction(projectId?: number | null): {
  jurisdiction: JurisdictionResult | null;
  isLoading: boolean;
  isGeocoded: boolean;
  geocodeAddress: (address: string) => Promise<JurisdictionResult | null>;
  setManual: (province: string, municipality: string) => void;
  source: JurisdictionSource | null;
} {
  const [jurisdiction, setJurisdiction] = useState<JurisdictionResult | null>(null);

  // 1. Fetch geocoded jurisdiction from project record
  const { data: projectJurisdiction, isLoading } = trpc.projects.getProjectJurisdiction.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  useEffect(() => {
    if (!projectJurisdiction?.province) return;
    const data = projectJurisdiction;
    setJurisdiction({
      province: data.province!,
      municipality: data.municipality ?? '',
      codeEdition: data.codeEdition ?? 'NBC 2020',
      address: data.address ?? undefined,
      latitude: data.latitude ? parseFloat(data.latitude as string) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude as string) : undefined,
      source: (data.jurisdictionSource as JurisdictionSource) ?? 'manual',
      confidence: data.jurisdictionSource === 'geocoded' ? 'high' : 'low',
    });
  }, [projectJurisdiction]);

  // 2. Fall back to localStorage cached jurisdiction
  useEffect(() => {
    if (jurisdiction || projectId) return;
    try {
      const cached = localStorage.getItem('cc_last_jurisdiction');
      if (cached) {
        const parsed = JSON.parse(cached) as JurisdictionResult;
        setJurisdiction({ ...parsed, source: 'cached', confidence: 'low' });
      }
    } catch {
      // ignore malformed cache
    }
  }, [jurisdiction, projectId]);

  const geocodeAddressMutation = trpc.projects.geocodeAddress.useMutation({
    onSuccess: (result) => {
      if ('province' in result) {
        const j: JurisdictionResult = {
          province: result.province,
          municipality: result.municipality,
          codeEdition: result.codeEdition,
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
          source: 'geocoded',
          confidence: 'high',
        };
        setJurisdiction(j);
        localStorage.setItem('cc_last_jurisdiction', JSON.stringify(j));
      }
    },
  });

  const geocodeAddress = async (address: string): Promise<JurisdictionResult | null> => {
    const result = await geocodeAddressMutation.mutateAsync({
      address,
      projectId: projectId ?? undefined,
    });
    if ('province' in result) {
      return {
        province: result.province,
        municipality: result.municipality,
        codeEdition: result.codeEdition,
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
        source: 'geocoded',
        confidence: 'high',
      };
    }
    return null;
  };

  const setManual = (province: string, municipality: string) => {
    const j: JurisdictionResult = {
      province,
      municipality,
      codeEdition: editionForProvince(province),
      source: 'manual',
      confidence: 'low',
    };
    setJurisdiction(j);
    localStorage.setItem('cc_last_jurisdiction', JSON.stringify(j));
  };

  return {
    jurisdiction,
    isLoading: isLoading && !!projectId,
    isGeocoded: jurisdiction?.source === 'geocoded',
    geocodeAddress,
    setManual,
    source: jurisdiction?.source ?? null,
  };
}
