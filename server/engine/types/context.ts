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
  contained_use_area?: boolean;
  impeded_egress_zone?: boolean;
  is_school_college_childcare?: boolean;
  is_licensed_beverage_or_restaurant?: boolean;
  is_storage_garage_only?: boolean;
  sprinkler_system_type?: 'standard' | 'nfpa13d';
  sprinkler_count?: number;
  residential_suite_count?: number;
  residential_direct_exterior_egress?: boolean;
  residential_sleeping_capacity?: number;
  occupant_load_above_below_first_storey?: number;
  open_air_seating_below_load?: number;
  has_public_corridors?: boolean;
  has_treatment_occupancy_sleeping_corridors?: boolean;
  has_care_occupancy_sleeping_corridors?: boolean;
  has_classrooms?: boolean;
  has_underground_walkways?: boolean;
  has_daycare_areas?: boolean;
  has_commercial_kitchen?: boolean;
  has_multi_person_public_washrooms?: boolean;
  has_electromagnetic_lock_doors?: boolean;
  has_universal_washroom_or_accessible_change_space?: boolean;
  has_service_space_3_2_1_1_8?: boolean;
  is_within_high_building_scope?: boolean;
  is_3_2_2_51_or_60_construction?: boolean;
  building_part?: 'Part 9' | 'Part 3';
  guard_location_type?: 'roof_access' | 'mezzanine_balcony_ramp' | 'exit_stair_ramp' | 'other_elevation_change';
  guard_elevation_difference_mm?: number;
  guard_exterior_height_above_grade_m?: number;
  is_within_dwelling_unit_or_secondary_suite?: boolean;
  guard_serves_max_two_dwelling_units?: boolean;
  is_industrial_occupancy?: boolean;
  stair_or_ramp_width_mm?: number;
  is_curved_flight?: boolean;
  riser_count?: number;
  ramp_rise_mm?: number;
  serves_single_dwelling_unit?: boolean;
  guard_use_category?: 'grandstand_egress' | 'equipment_access' | 'other';
  proposed_guard_height_mm?: number;
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
