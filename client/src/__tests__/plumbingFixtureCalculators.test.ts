import { describe, it, expect } from 'vitest';

// Test the calculation logic used in PlumbingFixtureCalculators

// Assembly table data
const assemblyTable = [
  { min: 1, max: 25, male: 1, female: 1 },
  { min: 26, max: 50, male: 1, female: 2 },
  { min: 51, max: 75, male: 2, female: 3 },
  { min: 76, max: 100, male: 2, female: 4 },
  { min: 101, max: 125, male: 3, female: 5 },
  { min: 126, max: 150, male: 3, female: 6 },
  { min: 151, max: 175, male: 4, female: 7 },
  { min: 176, max: 200, male: 4, female: 8 },
  { min: 201, max: 250, male: 5, female: 9 },
  { min: 251, max: 300, male: 5, female: 10 },
  { min: 301, max: 350, male: 6, female: 11 },
  { min: 351, max: 400, male: 6, female: 12 },
];

function calculateAssemblyWC(count: number): number {
  if (count <= 0) return 0;
  for (const row of assemblyTable) {
    if (count >= row.min && count <= row.max) {
      return row.male;
    }
  }
  if (count > 400) {
    const excess = count - 400;
    const additional = Math.ceil(excess / 200);
    return 7 + additional;
  }
  return 1;
}

function calculateAssemblyWCFemale(count: number): number {
  if (count <= 0) return 0;
  for (const row of assemblyTable) {
    if (count >= row.min && count <= row.max) {
      return row.female;
    }
  }
  if (count > 400) {
    const excess = count - 400;
    const additional = Math.ceil(excess / 100);
    return 13 + additional;
  }
  return 1;
}

function calculateRatioWC(count: number, ratio: number): number {
  if (count <= 0 || ratio <= 0) return 0;
  return Math.ceil(count / ratio);
}

function calculateUrinalSubstitution(maleWC: number, requestedUrinals: number): { adjustedMaleWC: number; actualUrinals: number } {
  const maxUrinalSubstitution = Math.floor((maleWC * 2) / 3);
  let actualUrinals = Math.min(requestedUrinals, maxUrinalSubstitution);
  let adjustedMaleWC = maleWC - actualUrinals;
  
  // Ensure at least 1 male WC remains
  if (adjustedMaleWC < 1 && maleWC >= 1) {
    adjustedMaleWC = 1;
    actualUrinals = maleWC - 1;
  }
  
  return { adjustedMaleWC, actualUrinals };
}

function calculateLavatories(totalOccupants: number, ratio: number): number {
  if (totalOccupants <= 0 || ratio <= 0) return 0;
  return Math.max(1, Math.ceil(totalOccupants / ratio));
}

function calculateDrinkingFountains(totalOccupants: number, ratio: number, floorArea: number = 0, areaRatio: number = 0): number {
  if (totalOccupants <= 0) return 0;
  const byOccupants = Math.ceil(totalOccupants / ratio);
  const byArea = areaRatio > 0 && floorArea > 0 ? Math.ceil(floorArea / areaRatio) : 0;
  return Math.max(byOccupants, byArea, 1);
}

describe('Water Closet Calculations - Assembly Occupancy', () => {
  it('should return correct male WC for assembly table ranges', () => {
    expect(calculateAssemblyWC(1)).toBe(1);
    expect(calculateAssemblyWC(25)).toBe(1);
    expect(calculateAssemblyWC(26)).toBe(1);
    expect(calculateAssemblyWC(50)).toBe(1);
    expect(calculateAssemblyWC(51)).toBe(2);
    expect(calculateAssemblyWC(100)).toBe(2);
    expect(calculateAssemblyWC(150)).toBe(3);
    expect(calculateAssemblyWC(200)).toBe(4);
    expect(calculateAssemblyWC(300)).toBe(5);
    expect(calculateAssemblyWC(400)).toBe(6);
  });

  it('should return correct female WC for assembly table ranges', () => {
    expect(calculateAssemblyWCFemale(1)).toBe(1);
    expect(calculateAssemblyWCFemale(25)).toBe(1);
    expect(calculateAssemblyWCFemale(50)).toBe(2);
    expect(calculateAssemblyWCFemale(75)).toBe(3);
    expect(calculateAssemblyWCFemale(100)).toBe(4);
    expect(calculateAssemblyWCFemale(150)).toBe(6);
    expect(calculateAssemblyWCFemale(200)).toBe(8);
    expect(calculateAssemblyWCFemale(300)).toBe(10);
    expect(calculateAssemblyWCFemale(400)).toBe(12);
  });

  it('should calculate correctly for over 400 males', () => {
    // Over 400: 7 + 1 for each additional 200 males
    expect(calculateAssemblyWC(401)).toBe(8); // 7 + 1
    expect(calculateAssemblyWC(500)).toBe(8); // 7 + 1 (100 excess)
    expect(calculateAssemblyWC(600)).toBe(8); // 7 + 1 (200 excess)
    expect(calculateAssemblyWC(601)).toBe(9); // 7 + 2 (201 excess)
    expect(calculateAssemblyWC(800)).toBe(9); // 7 + 2 (400 excess)
    expect(calculateAssemblyWC(1000)).toBe(10); // 7 + 3 (600 excess)
  });

  it('should calculate correctly for over 400 females', () => {
    // Over 400: 13 + 1 for each additional 100 females
    expect(calculateAssemblyWCFemale(401)).toBe(14); // 13 + 1
    expect(calculateAssemblyWCFemale(500)).toBe(14); // 13 + 1 (100 excess)
    expect(calculateAssemblyWCFemale(501)).toBe(15); // 13 + 2 (101 excess)
    expect(calculateAssemblyWCFemale(600)).toBe(15); // 13 + 2 (200 excess)
    expect(calculateAssemblyWCFemale(700)).toBe(16); // 13 + 3 (300 excess)
    expect(calculateAssemblyWCFemale(1000)).toBe(19); // 13 + 6 (600 excess)
  });

  it('should return 0 for zero or negative counts', () => {
    expect(calculateAssemblyWC(0)).toBe(0);
    expect(calculateAssemblyWC(-1)).toBe(0);
    expect(calculateAssemblyWCFemale(0)).toBe(0);
    expect(calculateAssemblyWCFemale(-10)).toBe(0);
  });
});

describe('Water Closet Calculations - Ratio-based Occupancies', () => {
  it('should calculate primary school WC correctly (1:30 male, 1:25 female)', () => {
    expect(calculateRatioWC(30, 30)).toBe(1);
    expect(calculateRatioWC(31, 30)).toBe(2);
    expect(calculateRatioWC(60, 30)).toBe(2);
    expect(calculateRatioWC(25, 25)).toBe(1);
    expect(calculateRatioWC(50, 25)).toBe(2);
    expect(calculateRatioWC(75, 25)).toBe(3);
  });

  it('should calculate places of worship WC correctly (1:150)', () => {
    expect(calculateRatioWC(150, 150)).toBe(1);
    expect(calculateRatioWC(151, 150)).toBe(2);
    expect(calculateRatioWC(300, 150)).toBe(2);
    expect(calculateRatioWC(450, 150)).toBe(3);
  });

  it('should calculate business/mercantile/industrial WC correctly (1:25)', () => {
    expect(calculateRatioWC(25, 25)).toBe(1);
    expect(calculateRatioWC(50, 25)).toBe(2);
    expect(calculateRatioWC(100, 25)).toBe(4);
  });

  it('should return 0 for zero or negative counts', () => {
    expect(calculateRatioWC(0, 25)).toBe(0);
    expect(calculateRatioWC(-10, 25)).toBe(0);
    expect(calculateRatioWC(100, 0)).toBe(0);
    expect(calculateRatioWC(100, -25)).toBe(0);
  });
});

describe('Urinal Substitution Calculations (NBC 3.7.2.3)', () => {
  it('should allow up to 2/3 of male WC to be substituted by urinals', () => {
    // 6 male WC: max 4 urinals (2/3 of 6)
    const result1 = calculateUrinalSubstitution(6, 4);
    expect(result1.actualUrinals).toBe(4);
    expect(result1.adjustedMaleWC).toBe(2);

    // 9 male WC: max 6 urinals (2/3 of 9)
    const result2 = calculateUrinalSubstitution(9, 6);
    expect(result2.actualUrinals).toBe(6);
    expect(result2.adjustedMaleWC).toBe(3);
  });

  it('should cap urinals at maximum allowed substitution', () => {
    // 6 male WC: max 4 urinals, requesting 10
    const result = calculateUrinalSubstitution(6, 10);
    expect(result.actualUrinals).toBe(4);
    expect(result.adjustedMaleWC).toBe(2);
  });

  it('should ensure at least 1 male WC remains', () => {
    // 2 male WC: max 1 urinal (2/3 of 2 = 1.33, floor = 1)
    const result1 = calculateUrinalSubstitution(2, 5);
    expect(result1.adjustedMaleWC).toBeGreaterThanOrEqual(1);

    // 1 male WC: no urinals allowed
    const result2 = calculateUrinalSubstitution(1, 5);
    expect(result2.adjustedMaleWC).toBe(1);
    expect(result2.actualUrinals).toBe(0);
  });

  it('should handle 3 male WC correctly', () => {
    // 3 male WC: max 2 urinals (2/3 of 3 = 2)
    const result = calculateUrinalSubstitution(3, 2);
    expect(result.actualUrinals).toBe(2);
    expect(result.adjustedMaleWC).toBe(1);
  });
});

describe('Lavatory Calculations (NBC 3.7.2.4)', () => {
  it('should calculate lavatories for assembly (1:75)', () => {
    expect(calculateLavatories(75, 75)).toBe(1);
    expect(calculateLavatories(76, 75)).toBe(2);
    expect(calculateLavatories(150, 75)).toBe(2);
    expect(calculateLavatories(300, 75)).toBe(4);
  });

  it('should calculate lavatories for primary school (1:30)', () => {
    expect(calculateLavatories(30, 30)).toBe(1);
    expect(calculateLavatories(60, 30)).toBe(2);
    expect(calculateLavatories(90, 30)).toBe(3);
  });

  it('should calculate lavatories for business (1:40)', () => {
    expect(calculateLavatories(40, 40)).toBe(1);
    expect(calculateLavatories(80, 40)).toBe(2);
    expect(calculateLavatories(100, 40)).toBe(3);
  });

  it('should return minimum 1 lavatory for any positive occupant count', () => {
    expect(calculateLavatories(1, 75)).toBe(1);
    expect(calculateLavatories(10, 75)).toBe(1);
  });

  it('should return 0 for zero occupants', () => {
    expect(calculateLavatories(0, 75)).toBe(0);
  });
});

describe('Drinking Fountain Calculations (NBC 3.7.2.5)', () => {
  it('should calculate drinking fountains for assembly (1:150)', () => {
    expect(calculateDrinkingFountains(150, 150)).toBe(1);
    expect(calculateDrinkingFountains(151, 150)).toBe(2);
    expect(calculateDrinkingFountains(300, 150)).toBe(2);
    expect(calculateDrinkingFountains(450, 150)).toBe(3);
  });

  it('should calculate drinking fountains for primary school (1:75)', () => {
    expect(calculateDrinkingFountains(75, 75)).toBe(1);
    expect(calculateDrinkingFountains(150, 75)).toBe(2);
    expect(calculateDrinkingFountains(225, 75)).toBe(3);
  });

  it('should use floor area when applicable (1:500 m²)', () => {
    // 100 occupants at 1:100 = 1, but 1000 m² at 1:500 = 2
    expect(calculateDrinkingFountains(100, 100, 1000, 500)).toBe(2);
    
    // 200 occupants at 1:100 = 2, 500 m² at 1:500 = 1
    expect(calculateDrinkingFountains(200, 100, 500, 500)).toBe(2);
  });

  it('should return minimum 1 drinking fountain for any positive occupant count', () => {
    expect(calculateDrinkingFountains(1, 150)).toBe(1);
    expect(calculateDrinkingFountains(10, 150)).toBe(1);
  });

  it('should return 0 for zero occupants', () => {
    expect(calculateDrinkingFountains(0, 150)).toBe(0);
  });
});

describe('Combined Fixture Calculations', () => {
  it('should calculate all fixtures for a typical assembly venue (200 males, 200 females)', () => {
    const males = 200;
    const females = 200;
    const totalOccupants = males + females;

    const maleWC = calculateAssemblyWC(males);
    const femaleWC = calculateAssemblyWCFemale(females);
    const lavatories = calculateLavatories(totalOccupants, 75);
    const drinkingFountains = calculateDrinkingFountains(totalOccupants, 150);

    expect(maleWC).toBe(4);
    expect(femaleWC).toBe(8);
    expect(lavatories).toBe(6); // 400/75 = 5.33, ceil = 6
    expect(drinkingFountains).toBe(3); // 400/150 = 2.67, ceil = 3
  });

  it('should calculate all fixtures for a typical office (50 males, 50 females)', () => {
    const males = 50;
    const females = 50;
    const totalOccupants = males + females;

    const maleWC = calculateRatioWC(males, 25);
    const femaleWC = calculateRatioWC(females, 25);
    const lavatories = calculateLavatories(totalOccupants, 40);
    const drinkingFountains = calculateDrinkingFountains(totalOccupants, 100);

    expect(maleWC).toBe(2);
    expect(femaleWC).toBe(2);
    expect(lavatories).toBe(3); // 100/40 = 2.5, ceil = 3
    expect(drinkingFountains).toBe(1); // 100/100 = 1
  });

  it('should calculate fixtures with urinal substitution for office', () => {
    const males = 100;
    const maleWC = calculateRatioWC(males, 25); // 4 WC
    const { adjustedMaleWC, actualUrinals } = calculateUrinalSubstitution(maleWC, 2);

    expect(maleWC).toBe(4);
    expect(actualUrinals).toBe(2); // max 2 (2/3 of 4 = 2.67, floor = 2)
    expect(adjustedMaleWC).toBe(2);
  });
});
