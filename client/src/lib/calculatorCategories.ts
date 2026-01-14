// Map calculator IDs to their category colors
export const calculatorCategories: Record<string, string> = {
  // Building Code calculators
  "construction_limits": "var(--tab-building)",
  "floor_joist_span": "var(--tab-building)",
  "beam_span": "var(--tab-building)",
  "roof_rafter_span": "var(--tab-building)",
  "column_span": "var(--tab-building)",
  
  // Plumbing calculators
  "plumbing_fixture": "var(--tab-plumbing)",
  "drainage_sizing": "var(--tab-plumbing)",
  "water_supply": "var(--tab-plumbing)",
  
  // Electrical calculators
  "electrical_load": "var(--tab-electrical)",
  "circuit_breaker": "var(--tab-electrical)",
  "conduit_sizing": "var(--tab-electrical)",
  
  // Additions calculators
  "permit_fee": "var(--tab-additions)",
  
  // Sustainability calculators
  "solar_panel": "var(--tab-sustainability)",
  "rainwater_harvesting": "var(--tab-sustainability)",
  "energy_code": "var(--tab-sustainability)",
  "thermal_resistance": "var(--tab-sustainability)",
  "ventilation_rate": "var(--tab-sustainability)",
  
  // Fire & Life Safety calculators
  "fire_separation": "var(--tab-fire)",
  "occupant_load": "var(--tab-fire)",
  "exit_requirements": "var(--tab-fire)",
  "travel_distance": "var(--tab-fire)",
  "construction_type": "var(--tab-fire)",
  "barrier_free": "var(--tab-fire)",
  "fire_alarm": "var(--tab-fire)",
  "emergency_lighting": "var(--tab-fire)",
  
  // Design Tools calculators
  "stair_design": "var(--tab-design)",
  "batch_stair": "var(--tab-design)",
  "guard_handrail": "var(--tab-design)",
  "snow_load": "var(--tab-design)",
  "accessibility_ramp": "var(--tab-design)",
  "stud_spacing": "var(--tab-design)",
  "lintel_span": "var(--tab-design)",
  "foundation_design": "var(--tab-design)",
  "lateral_load": "var(--tab-design)",
};

export function getCategoryColor(calculatorId: string): string {
  return calculatorCategories[calculatorId] || "var(--border)";
}
