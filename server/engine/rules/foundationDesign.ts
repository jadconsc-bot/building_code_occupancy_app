export type FoundationType = 'strip' | 'spread' | 'pier' | 'helical';
export interface FoundationDesignInput { soilType: 'rock' | 'gravel' | 'medium' | 'clay' | 'soft'; region: 'calgary' | 'edmonton' | 'red_deer' | 'lethbridge' | 'fort_mcmurray'; foundationType: FoundationType; wallLoadKn?: number; wallLengthM?: number; pointLoadKn?: number; }
export interface FoundationDesignResult { foundationType: FoundationType; computable: boolean; footingWidth?: number; footingShape?: 'strip' | 'square' | 'circular'; footingThickness?: number; wallThickness?: number; frostDepth: number; minDepth: number; bearingCapacity: number; bearingPressure?: number; rebarSize?: string; rebarSpacing?: number; drainageRequired: boolean; drainPipeSize: number; dampproofing: string; concreteVolume?: number; compliant: boolean; caveats: string[]; }
const capacities = { rock: 500, gravel: 200, medium: 100, clay: 75, soft: 50 } as const;
const frostDepths = { calgary: 1800, edmonton: 1800, red_deer: 1800, lethbridge: 1500, fort_mcmurray: 2100 } as const;
const helicalCaveat = 'Helical/screw pile capacity is established by installation torque correlation to manufacturer-specific published data, not by a soil-bearing-capacity table — this calculator cannot size a helical pile. An engineer or the pile manufacturer must specify pile length, helix configuration, and required installation torque for this load and soil condition.';
export function evaluateFoundationDesign(input: FoundationDesignInput): FoundationDesignResult {
  const bearingCapacity = capacities[input.soilType] ?? 100; const frostDepth = frostDepths[input.region] ?? 1800; const minDepth = frostDepth + 150; const drainageRequired = frostDepth > 1200; const drainPipeSize = 100; const dampproofing = 'Dampproofing compound or membrane required';
  if (input.foundationType === 'helical') return { foundationType: 'helical', computable: false, frostDepth, minDepth, bearingCapacity, drainageRequired, drainPipeSize, dampproofing, compliant: false, caveats: [helicalCaveat] };
  let width: number; let bearingPressure: number; let concreteVolume: number; let thickness: number; let shape: 'strip' | 'square' | 'circular';
  if (input.foundationType === 'strip') {
    const linearLoad = (input.wallLoadKn ?? 0) / (input.wallLengthM ?? 1);
    const requiredArea = (linearLoad / bearingCapacity) * 1000;
    width = Math.max(Math.ceil(requiredArea / 100) * 100, 400); shape = 'strip'; thickness = Math.max(Math.ceil(width / 3), 150); bearingPressure = linearLoad / (width / 1000); concreteVolume = (width / 1000) * (thickness / 1000) * (input.wallLengthM ?? 0);
  } else if (input.foundationType === 'spread') {
    const requiredAreaM2 = (input.pointLoadKn ?? 0) / bearingCapacity; width = Math.max(Math.ceil(Math.sqrt(requiredAreaM2 * 1e6) / 50) * 50, 400); shape = 'square'; thickness = Math.max(Math.ceil(width / 3), 150); bearingPressure = (input.pointLoadKn ?? 0) / ((width / 1000) ** 2); concreteVolume = (width / 1000) ** 2 * (thickness / 1000);
  } else {
    const requiredAreaM2 = (input.pointLoadKn ?? 0) / bearingCapacity; const computed = Math.ceil(Math.sqrt(4 * requiredAreaM2 / Math.PI) * 1000 / 50) * 50; const sizes = [200, 250, 300, 350, 400, 450, 500, 600]; width = sizes.find(size => size >= computed) ?? computed; shape = 'circular'; thickness = Math.max(Math.ceil(width / 3), 150); const area = Math.PI * (width / 2000) ** 2; bearingPressure = (input.pointLoadKn ?? 0) / area; concreteVolume = area * (thickness / 1000);
  }
  const wallThickness = width <= 600 ? 200 : 250; const requiresRebar = width > 600 || thickness > 200; const rebarSize = requiresRebar ? '15M' : 'None'; const rebarSpacing = requiresRebar ? 400 : 0;
  return { foundationType: input.foundationType, computable: true, footingWidth: width, footingShape: shape, footingThickness: thickness, wallThickness, frostDepth, minDepth, bearingCapacity, bearingPressure, rebarSize, rebarSpacing, drainageRequired, drainPipeSize, dampproofing, concreteVolume, compliant: width >= (input.foundationType === 'strip' ? 400 : 400) && thickness >= 150 && frostDepth >= 1200, caveats: [] };
}
