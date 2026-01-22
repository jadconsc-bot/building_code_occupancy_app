import { describe, it, expect } from 'vitest';

// Test data for plumbing fixture calculations
describe('Plumbing Fixture Calculator Logic', () => {
  // Assembly Table (NBC Table 3.7.2.2.-A)
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

  describe('Assembly Occupancy WC Calculations', () => {
    it('should return 0 for 0 occupants', () => {
      expect(calculateAssemblyWC(0)).toBe(0);
      expect(calculateAssemblyWCFemale(0)).toBe(0);
    });

    it('should calculate correctly for 1-25 persons', () => {
      expect(calculateAssemblyWC(1)).toBe(1);
      expect(calculateAssemblyWC(25)).toBe(1);
      expect(calculateAssemblyWCFemale(1)).toBe(1);
      expect(calculateAssemblyWCFemale(25)).toBe(1);
    });

    it('should calculate correctly for 26-50 persons', () => {
      expect(calculateAssemblyWC(26)).toBe(1);
      expect(calculateAssemblyWC(50)).toBe(1);
      expect(calculateAssemblyWCFemale(26)).toBe(2);
      expect(calculateAssemblyWCFemale(50)).toBe(2);
    });

    it('should calculate correctly for 151-175 persons', () => {
      expect(calculateAssemblyWC(151)).toBe(4);
      expect(calculateAssemblyWC(175)).toBe(4);
      expect(calculateAssemblyWCFemale(151)).toBe(7);
      expect(calculateAssemblyWCFemale(175)).toBe(7);
    });

    it('should calculate correctly for over 400 persons', () => {
      // Over 400: 7 + 1 per 200 excess for male
      expect(calculateAssemblyWC(401)).toBe(8); // 7 + 1
      expect(calculateAssemblyWC(600)).toBe(8); // 7 + 1 (200 excess)
      expect(calculateAssemblyWC(601)).toBe(9); // 7 + 2 (201 excess)
      
      // Over 400: 13 + 1 per 100 excess for female
      expect(calculateAssemblyWCFemale(401)).toBe(14); // 13 + 1
      expect(calculateAssemblyWCFemale(500)).toBe(14); // 13 + 1 (100 excess)
      expect(calculateAssemblyWCFemale(501)).toBe(15); // 13 + 2 (101 excess)
    });
  });

  describe('Urinal Substitution (NBC 3.7.2.3)', () => {
    function calculateUrinalSubstitution(maleWC: number, urinals: number): { maxSub: number, actualSub: number, adjustedWC: number } {
      const maxSub = Math.floor((maleWC * 2) / 3);
      let actualSub = Math.min(urinals, maxSub);
      let adjustedWC = maleWC - actualSub;
      
      // Ensure at least 1 WC remains
      if (adjustedWC < 1 && maleWC >= 1) {
        adjustedWC = 1;
        actualSub = maleWC - 1;
      }
      
      return { maxSub, actualSub, adjustedWC };
    }

    it('should allow up to 2/3 substitution', () => {
      const result = calculateUrinalSubstitution(6, 10);
      expect(result.maxSub).toBe(4); // 2/3 of 6 = 4
      expect(result.actualSub).toBe(4);
      expect(result.adjustedWC).toBe(2);
    });

    it('should ensure at least 1 WC remains', () => {
      const result = calculateUrinalSubstitution(2, 10);
      expect(result.maxSub).toBe(1); // 2/3 of 2 = 1.33 -> 1
      expect(result.adjustedWC).toBe(1); // At least 1 must remain
    });

    it('should handle 0 urinals', () => {
      const result = calculateUrinalSubstitution(6, 0);
      expect(result.actualSub).toBe(0);
      expect(result.adjustedWC).toBe(6);
    });
  });

  describe('Lavatory Calculations (NBC 3.7.2.4)', () => {
    function calculateLavatories(totalOccupants: number, ratio: number): number {
      if (totalOccupants <= 0 || ratio <= 0) return 0;
      return Math.max(1, Math.ceil(totalOccupants / ratio));
    }

    it('should calculate lavatories for assembly (1:75)', () => {
      expect(calculateLavatories(75, 75)).toBe(1);
      expect(calculateLavatories(76, 75)).toBe(2);
      expect(calculateLavatories(150, 75)).toBe(2);
      expect(calculateLavatories(151, 75)).toBe(3);
    });

    it('should calculate lavatories for business (1:40)', () => {
      expect(calculateLavatories(40, 40)).toBe(1);
      expect(calculateLavatories(80, 40)).toBe(2);
      expect(calculateLavatories(120, 40)).toBe(3);
    });

    it('should return minimum 1 for any positive occupancy', () => {
      expect(calculateLavatories(1, 75)).toBe(1);
      expect(calculateLavatories(10, 75)).toBe(1);
    });
  });

  describe('Drinking Fountain Calculations (NBC 3.7.2.5)', () => {
    function calculateDrinkingFountains(totalOccupants: number, ratio: number, area: number, areaRatio?: number): number {
      if (totalOccupants <= 0) return 0;
      const byOccupants = Math.ceil(totalOccupants / ratio);
      const byArea = areaRatio && area > 0 ? Math.ceil(area / areaRatio) : 0;
      return Math.max(byOccupants, byArea, 1);
    }

    it('should calculate drinking fountains for assembly (1:150)', () => {
      expect(calculateDrinkingFountains(150, 150, 0)).toBe(1);
      expect(calculateDrinkingFountains(300, 150, 0)).toBe(2);
      expect(calculateDrinkingFountains(450, 150, 0)).toBe(3);
    });

    it('should use floor area ratio when applicable', () => {
      // Business: 1 per 100 occupants OR 1 per 500 m²
      expect(calculateDrinkingFountains(50, 100, 1000, 500)).toBe(2); // 2 by area > 1 by occupants
      expect(calculateDrinkingFountains(200, 100, 500, 500)).toBe(2); // 2 by occupants > 1 by area
    });
  });

  describe('Shower Requirements (NBC 3.7.2.6)', () => {
    function calculateShowers(occupants: number, ratio: number): number {
      if (occupants <= 0 || ratio <= 0) return 0;
      return Math.ceil(occupants / ratio);
    }

    it('should calculate showers for primary schools (1:30)', () => {
      expect(calculateShowers(30, 30)).toBe(1);
      expect(calculateShowers(60, 30)).toBe(2);
      expect(calculateShowers(90, 30)).toBe(3);
    });

    it('should calculate showers for industrial (1:15)', () => {
      expect(calculateShowers(15, 15)).toBe(1);
      expect(calculateShowers(30, 15)).toBe(2);
      expect(calculateShowers(45, 15)).toBe(3);
    });
  });

  describe('Service Sink Requirements (NBC 3.7.2.7)', () => {
    function calculateServiceSinks(area: number, areaRatio: number, floors: number): number {
      const byArea = Math.ceil(area / areaRatio);
      return Math.max(floors, byArea);
    }

    it('should calculate service sinks by floor area', () => {
      expect(calculateServiceSinks(500, 500, 1)).toBe(1);
      expect(calculateServiceSinks(1000, 500, 1)).toBe(2);
      expect(calculateServiceSinks(1500, 500, 1)).toBe(3);
    });

    it('should ensure at least 1 per floor', () => {
      expect(calculateServiceSinks(100, 500, 3)).toBe(3); // 3 floors > 1 by area
      expect(calculateServiceSinks(2000, 500, 2)).toBe(4); // 4 by area > 2 floors
    });
  });
});

// Flame Spread Rating Tests
describe('Flame Spread Rating Classifications', () => {
  const fsrClassifications = [
    { class: 'A', minFSR: 0, maxFSR: 25 },
    { class: 'B', minFSR: 26, maxFSR: 75 },
    { class: 'C', minFSR: 76, maxFSR: 200 },
    { class: 'D', minFSR: 201, maxFSR: 500 },
  ];

  function getFSRClass(fsr: number): string {
    if (fsr <= 25) return 'A';
    if (fsr <= 75) return 'B';
    if (fsr <= 200) return 'C';
    if (fsr <= 500) return 'D';
    return 'Not Classified';
  }

  it('should classify FSR 0-25 as Class A', () => {
    expect(getFSRClass(0)).toBe('A');
    expect(getFSRClass(15)).toBe('A');
    expect(getFSRClass(25)).toBe('A');
  });

  it('should classify FSR 26-75 as Class B', () => {
    expect(getFSRClass(26)).toBe('B');
    expect(getFSRClass(50)).toBe('B');
    expect(getFSRClass(75)).toBe('B');
  });

  it('should classify FSR 76-200 as Class C', () => {
    expect(getFSRClass(76)).toBe('C');
    expect(getFSRClass(100)).toBe('C');
    expect(getFSRClass(200)).toBe('C');
  });

  it('should classify FSR 201-500 as Class D', () => {
    expect(getFSRClass(201)).toBe('D');
    expect(getFSRClass(350)).toBe('D');
    expect(getFSRClass(500)).toBe('D');
  });

  it('should classify FSR > 500 as Not Classified', () => {
    expect(getFSRClass(501)).toBe('Not Classified');
    expect(getFSRClass(1000)).toBe('Not Classified');
  });

  describe('Location Requirements', () => {
    const locationRequirements = {
      'Exit Stairways': 25,
      'Exit Corridors': 25,
      'Lobbies (Assembly)': 75,
      'Non-Exit Corridors': 75,
      'Vertical Service Spaces': 25,
      'Concealed Spaces': 25,
    };

    it('should have correct FSR limits for exit routes', () => {
      expect(locationRequirements['Exit Stairways']).toBe(25);
      expect(locationRequirements['Exit Corridors']).toBe(25);
    });

    it('should have correct FSR limits for corridors', () => {
      expect(locationRequirements['Lobbies (Assembly)']).toBe(75);
      expect(locationRequirements['Non-Exit Corridors']).toBe(75);
    });

    it('should have correct FSR limits for concealed spaces', () => {
      expect(locationRequirements['Vertical Service Spaces']).toBe(25);
      expect(locationRequirements['Concealed Spaces']).toBe(25);
    });
  });

  describe('Common Materials FSR Values', () => {
    const materialFSR: Record<string, { fsr: number, class: string }> = {
      'Gypsum Board (Type X)': { fsr: 15, class: 'A' },
      'Concrete': { fsr: 0, class: 'A' },
      'Red Oak': { fsr: 100, class: 'C' },
      'Southern Pine': { fsr: 150, class: 'C' },
      'Plywood (Untreated)': { fsr: 150, class: 'C' },
    };

    it('should classify gypsum board correctly', () => {
      expect(getFSRClass(materialFSR['Gypsum Board (Type X)'].fsr)).toBe('A');
    });

    it('should classify concrete correctly', () => {
      expect(getFSRClass(materialFSR['Concrete'].fsr)).toBe('A');
    });

    it('should classify wood products correctly', () => {
      expect(getFSRClass(materialFSR['Red Oak'].fsr)).toBe('C');
      expect(getFSRClass(materialFSR['Southern Pine'].fsr)).toBe('C');
      expect(getFSRClass(materialFSR['Plywood (Untreated)'].fsr)).toBe('C');
    });
  });
});
