export interface ConstraintValue {
  value: number | boolean;
  unit: string;
  ref: string;
  description: string;
  exits?: number; // for exit_count constraints
}

// Represents a hard prohibition (not a fire-resistance rating threshold).
// Used for occupancy combinations that the code forbids outright, regardless
// of what fire separation assembly might theoretically be provided.
export interface OccupancyProhibition {
  ref: string;
  description: string;
}

export type ConstraintId = string; // e.g. 'egress.travel_distance.unsprinklered'
