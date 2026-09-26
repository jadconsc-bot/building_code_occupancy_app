export interface SnowLoadInput {
  location: 'calgary' | 'edmonton' | 'red-deer' | 'lethbridge' | 'fort-mcmurray' | 'grande-prairie';
  roofType: 'sloped' | 'flat';
  roofSlopeDegrees?: number;
  importance: 'low' | 'normal' | 'high' | 'post-disaster';
  exposure: 'sheltered' | 'normal' | 'exposed';
}

export interface SnowLoadResult {
  Ss: number; Is: number; Cs: number; Cw: number; Cb: number; Ca: number; Sr: number;
  roofSnowLoad: number; totalLoad: number; additionalRequirements: string[];
}

const groundSnowLoads = { calgary: 1.1, edmonton: 1.7, 'red-deer': 1.8, lethbridge: 1.2, 'fort-mcmurray': 1.5, 'grande-prairie': 2.2 } as const;
const associatedRainLoads = { calgary: 0.1, edmonton: 0.1, 'red-deer': 0.1, lethbridge: 0.1, 'fort-mcmurray': 0.1, 'grande-prairie': 0.1 } as const;
const importanceFactors = { low: 0.8, normal: 1.0, high: 1.15, 'post-disaster': 1.25 } as const;

export function evaluateSnowLoad(input: SnowLoadInput): SnowLoadResult {
  const Ss = groundSnowLoads[input.location];
  const Sr = associatedRainLoads[input.location];
  const Is = importanceFactors[input.importance];
  const slope = input.roofSlopeDegrees;
  let Cs = 1.0;
  if (input.roofType === 'sloped' && slope !== undefined && Number.isFinite(slope)) {
    if (slope <= 30) Cs = 1.0;
    else if (slope <= 70) Cs = (70 - slope) / 40;
    else Cs = 0;
  }
  const Cw = input.importance === 'low' || input.importance === 'normal'
    ? input.exposure === 'exposed' ? 0.75 : 1.0 : 1.0;
  const Cb = 1.0;
  const Ca = 1.0;
  const roofSnowLoad = Is * Ss * (Cb * Cw * Cs * Ca);
  const totalLoad = roofSnowLoad + Is * Sr;
  const additionalRequirements = [
    'Cb = 1.0 is assumed (NBC 4.1.6.2.(2)(c), low-profile-roof case). For roofs that do not meet this height condition, Cb must be determined from Table 4.1.6.2.-B; this calculator does not implement that table.',
    'Ca = 1.0 (uniform snow load) is assumed. This does not account for drifting, roof projections, valleys, gable/curved/dome roof shapes, sliding, or meltwater accumulation (NBC 4.1.6.2.(8)/(9), Articles 4.1.6.5-4.1.6.12).',
    'The steeper Sentence 4.1.6.2.(6) reduction for qualifying unobstructed slippery roofs is not modeled.',
  ];
  if (Cw === 0.75) additionalRequirements.push('The 0.75 wind-exposure reduction (NBC 4.1.6.2.(4)) requires full exposure on all sides, no significant roof obstructions, and no drifting accumulation from adjacent surfaces — confirm these conditions apply before relying on this reduction.');
  return { Ss, Is, Cs, Cw, Cb, Ca, Sr, roofSnowLoad, totalLoad, additionalRequirements };
}
