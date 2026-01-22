import { describe, it, expect } from 'vitest';

// Test the calculation logic directly
// NBC Table 3.7.2.2.-A - Water Closets for Assembly Occupancy
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
  
  // Over 400: 7 + 1 for each additional 200 males
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
  
  // Over 400: 13 + 1 for each additional 100 females
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

describe('Water Closet Calculator', () => {
  describe('Assembly Occupancy - Male WC (Table 3.7.2.2.-A)', () => {
    it('returns 0 for 0 males', () => {
      expect(calculateAssemblyWC(0)).toBe(0);
    });

    it('returns 1 WC for 1-25 males', () => {
      expect(calculateAssemblyWC(1)).toBe(1);
      expect(calculateAssemblyWC(25)).toBe(1);
    });

    it('returns 1 WC for 26-50 males', () => {
      expect(calculateAssemblyWC(26)).toBe(1);
      expect(calculateAssemblyWC(50)).toBe(1);
    });

    it('returns 2 WC for 51-75 males', () => {
      expect(calculateAssemblyWC(51)).toBe(2);
      expect(calculateAssemblyWC(75)).toBe(2);
    });

    it('returns 2 WC for 76-100 males', () => {
      expect(calculateAssemblyWC(76)).toBe(2);
      expect(calculateAssemblyWC(100)).toBe(2);
    });

    it('returns 3 WC for 101-125 males', () => {
      expect(calculateAssemblyWC(101)).toBe(3);
      expect(calculateAssemblyWC(125)).toBe(3);
    });

    it('returns 3 WC for 126-150 males', () => {
      expect(calculateAssemblyWC(126)).toBe(3);
      expect(calculateAssemblyWC(150)).toBe(3);
    });

    it('returns 4 WC for 151-175 males', () => {
      expect(calculateAssemblyWC(151)).toBe(4);
      expect(calculateAssemblyWC(175)).toBe(4);
    });

    it('returns 4 WC for 176-200 males', () => {
      expect(calculateAssemblyWC(176)).toBe(4);
      expect(calculateAssemblyWC(200)).toBe(4);
    });

    it('returns 5 WC for 201-250 males', () => {
      expect(calculateAssemblyWC(201)).toBe(5);
      expect(calculateAssemblyWC(250)).toBe(5);
    });

    it('returns 5 WC for 251-300 males', () => {
      expect(calculateAssemblyWC(251)).toBe(5);
      expect(calculateAssemblyWC(300)).toBe(5);
    });

    it('returns 6 WC for 301-350 males', () => {
      expect(calculateAssemblyWC(301)).toBe(6);
      expect(calculateAssemblyWC(350)).toBe(6);
    });

    it('returns 6 WC for 351-400 males', () => {
      expect(calculateAssemblyWC(351)).toBe(6);
      expect(calculateAssemblyWC(400)).toBe(6);
    });

    it('returns 7 + additional for over 400 males', () => {
      // 401-600: 7 + 1 = 8
      expect(calculateAssemblyWC(401)).toBe(8);
      expect(calculateAssemblyWC(600)).toBe(8);
      // 601-800: 7 + 2 = 9
      expect(calculateAssemblyWC(601)).toBe(9);
      expect(calculateAssemblyWC(800)).toBe(9);
      // 1000: 7 + 3 = 10
      expect(calculateAssemblyWC(1000)).toBe(10);
    });
  });

  describe('Assembly Occupancy - Female WC (Table 3.7.2.2.-A)', () => {
    it('returns 0 for 0 females', () => {
      expect(calculateAssemblyWCFemale(0)).toBe(0);
    });

    it('returns 1 WC for 1-25 females', () => {
      expect(calculateAssemblyWCFemale(1)).toBe(1);
      expect(calculateAssemblyWCFemale(25)).toBe(1);
    });

    it('returns 2 WC for 26-50 females', () => {
      expect(calculateAssemblyWCFemale(26)).toBe(2);
      expect(calculateAssemblyWCFemale(50)).toBe(2);
    });

    it('returns 3 WC for 51-75 females', () => {
      expect(calculateAssemblyWCFemale(51)).toBe(3);
      expect(calculateAssemblyWCFemale(75)).toBe(3);
    });

    it('returns 4 WC for 76-100 females', () => {
      expect(calculateAssemblyWCFemale(76)).toBe(4);
      expect(calculateAssemblyWCFemale(100)).toBe(4);
    });

    it('returns 7 WC for 151-175 females', () => {
      expect(calculateAssemblyWCFemale(151)).toBe(7);
      expect(calculateAssemblyWCFemale(175)).toBe(7);
    });

    it('returns 12 WC for 351-400 females', () => {
      expect(calculateAssemblyWCFemale(351)).toBe(12);
      expect(calculateAssemblyWCFemale(400)).toBe(12);
    });

    it('returns 13 + additional for over 400 females', () => {
      // 401-500: 13 + 1 = 14
      expect(calculateAssemblyWCFemale(401)).toBe(14);
      expect(calculateAssemblyWCFemale(500)).toBe(14);
      // 501-600: 13 + 2 = 15
      expect(calculateAssemblyWCFemale(501)).toBe(15);
      expect(calculateAssemblyWCFemale(600)).toBe(15);
      // 1000: 13 + 6 = 19
      expect(calculateAssemblyWCFemale(1000)).toBe(19);
    });
  });

  describe('Ratio-based Calculations', () => {
    it('returns 0 for 0 occupants', () => {
      expect(calculateRatioWC(0, 25)).toBe(0);
    });

    it('returns 0 for invalid ratio', () => {
      expect(calculateRatioWC(100, 0)).toBe(0);
      expect(calculateRatioWC(100, -1)).toBe(0);
    });

    it('calculates correctly for primary schools (1 per 30 males)', () => {
      expect(calculateRatioWC(30, 30)).toBe(1);
      expect(calculateRatioWC(31, 30)).toBe(2);
      expect(calculateRatioWC(60, 30)).toBe(2);
      expect(calculateRatioWC(90, 30)).toBe(3);
    });

    it('calculates correctly for primary schools (1 per 25 females)', () => {
      expect(calculateRatioWC(25, 25)).toBe(1);
      expect(calculateRatioWC(26, 25)).toBe(2);
      expect(calculateRatioWC(50, 25)).toBe(2);
      expect(calculateRatioWC(75, 25)).toBe(3);
    });

    it('calculates correctly for places of worship (1 per 150)', () => {
      expect(calculateRatioWC(150, 150)).toBe(1);
      expect(calculateRatioWC(151, 150)).toBe(2);
      expect(calculateRatioWC(300, 150)).toBe(2);
      expect(calculateRatioWC(450, 150)).toBe(3);
    });

    it('calculates correctly for business occupancy (1 per 25)', () => {
      expect(calculateRatioWC(25, 25)).toBe(1);
      expect(calculateRatioWC(50, 25)).toBe(2);
      expect(calculateRatioWC(100, 25)).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('handles negative numbers', () => {
      expect(calculateAssemblyWC(-1)).toBe(0);
      expect(calculateAssemblyWCFemale(-1)).toBe(0);
      expect(calculateRatioWC(-1, 25)).toBe(0);
    });

    it('handles very large numbers', () => {
      // 10000 males: 7 + ceil(9600/200) = 7 + 48 = 55
      expect(calculateAssemblyWC(10000)).toBe(55);
      // 10000 females: 13 + ceil(9600/100) = 13 + 96 = 109
      expect(calculateAssemblyWCFemale(10000)).toBe(109);
    });

    it('rounds up for ratio calculations', () => {
      expect(calculateRatioWC(1, 25)).toBe(1);
      expect(calculateRatioWC(26, 25)).toBe(2);
    });
  });

  describe('Assembly Table Data Integrity', () => {
    it('has 12 rows in the table', () => {
      expect(assemblyTable.length).toBe(12);
    });

    it('covers ranges from 1 to 400', () => {
      expect(assemblyTable[0].min).toBe(1);
      expect(assemblyTable[assemblyTable.length - 1].max).toBe(400);
    });

    it('has no gaps in ranges', () => {
      for (let i = 1; i < assemblyTable.length; i++) {
        expect(assemblyTable[i].min).toBe(assemblyTable[i - 1].max + 1);
      }
    });

    it('female WC count is always >= male WC count', () => {
      for (const row of assemblyTable) {
        expect(row.female).toBeGreaterThanOrEqual(row.male);
      }
    });
  });
});
