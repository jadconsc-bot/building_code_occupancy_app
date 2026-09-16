export interface ComplianceInput {
  occupancy_major: string;
  occupancy_division?: string;
  area_m2?: number;
  footprint_m2?: number;
  storeys?: number;
  travel_distance_m?: number;
  exits?: number;
  exit_width_mm?: number;
  construction_type?: string;
  sprinklers?: boolean;
  fire_alarm?: boolean;
  province?: string;
  municipality?: string;
  codeEdition?: string;  // e.g. 'NBC(AE) 2023', 'BCBC 2024' — overrides province-derived default
  projectId?: number;
  bedroom_count?: number;
  totalDwellingUnits?: number;
  rooms?: Array<{ occupancyGroup?: string | null; label?: string | null; roomLabel?: string | null; areaM2?: number | null; areaSqm?: number | null; }>;
  jurisdictionSource?: 'geocoded' | 'manual' | 'device' | 'fallback';
  [key: string]: any;
}

export interface EvaluationContext {
  inputs: ComplianceInput;
  jurisdiction: {
    province: string;
    municipality?: string;
    codeEdition: string;
    amendments?: object;
  };
  mode: 'soft' | 'strict';
}
