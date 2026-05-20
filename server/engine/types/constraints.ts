export interface ConstraintValue {
  value: number | boolean;
  unit: string;
  ref: string;
  description: string;
  exits?: number; // for exit_count constraints
}

export type ConstraintId = string; // e.g. 'egress.travel_distance.unsprinklered'
