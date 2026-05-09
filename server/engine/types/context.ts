export interface ComplianceInput {
  occupancy_major: string;
  occupancy_division?: string;
  area_m2?: number;
  storeys?: number;
  travel_distance_m?: number;
  exits?: number;
  exit_width_mm?: number;
  construction_type?: string;
  sprinklers?: boolean;
  fire_alarm?: boolean;
  province?: string;
  municipality?: string;
  projectId?: number;
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
