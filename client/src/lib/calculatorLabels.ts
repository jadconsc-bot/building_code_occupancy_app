export const CALCULATOR_LABELS: Record<string, string> = {
  // Life Safety
  occupantLoad: "Occupant Load",
  travelDistance: "Travel Distance",
  exitRequirements: "Exit Requirements",
  fireSeparation: "Fire Separation",
  fireAlarm: "Fire Alarm",
  emergencyLighting: "Emergency Lighting",
  guardHandrail: "Guard & Handrail",
  accessibilityRamp: "Accessibility Ramp",
  barrierFree: "Barrier-Free Design",
  spatialSeparation: "Spatial Separation",
  // Structural
  stairDesign: "Stair Design",
  beamSpan: "Beam Span",
  woodFrameSpan: "Wood Frame Span",
  snowLoad: "Snow Load",
  // Mechanical / Environmental
  ventilationRate: "Ventilation Rate",
  plumbingFixture: "Plumbing Fixture Count",
  thermalResistance: "Thermal Resistance",
  necbEnvelope: "NECB Envelope",
  // Electrical
  "service-load": "Electrical Service Load",
  "voltage-drop": "Voltage Drop",
  "conduit-fill": "Conduit Fill",
  // Reports
  stepCodeReport: "Step Code Report",
  albertaNBCReport: "Alberta NBC Report",
};

export function getCalculatorLabel(type: string): string {
  return CALCULATOR_LABELS[type] ?? type;
}
