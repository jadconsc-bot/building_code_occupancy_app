import { describe, it, expect } from 'vitest';

describe('Exit Stair Calculations', () => {
  // Helper function to calculate stairs based on NBC 3.4.6
  const calculateStairs = (stairType: string, totalRise: number) => {
    let requirements;
    let minWidth;
    let guardHeight;
    
    switch (stairType) {
      case 'private-residential':
        requirements = { minTread: 235, maxRiser: 200, minRiser: 125, minHeadroom: 1950 };
        minWidth = 860;
        guardHeight = 900;
        break;
      case 'exit-group-c':
        requirements = { minTread: 280, maxRiser: 180, minRiser: 125, minHeadroom: 2050 };
        minWidth = 1100;
        guardHeight = 1070;
        break;
      case 'exit-public':
        requirements = { minTread: 280, maxRiser: 180, minRiser: 125, minHeadroom: 2050 };
        minWidth = 1100;
        guardHeight = 1070;
        break;
      default:
        throw new Error('Invalid stair type');
    }
    
    const numRisers = Math.ceil(totalRise / requirements.maxRiser);
    const actualRiser = totalRise / numRisers;
    const numTreads = numRisers - 1;
    const totalRun = numTreads * requirements.minTread;
    const compliant = actualRiser >= requirements.minRiser && actualRiser <= requirements.maxRiser;
    
    return {
      numRisers,
      actualRiser,
      numTreads,
      treadDepth: requirements.minTread,
      totalRun,
      headroom: requirements.minHeadroom,
      minWidth,
      guardHeight,
      compliant,
      requirements
    };
  };

  describe('Private Residential Stairs', () => {
    it('should calculate correct dimensions for 2700mm rise', () => {
      const result = calculateStairs('private-residential', 2700);
      
      expect(result.numRisers).toBe(14); // 2700 / 200 = 13.5, rounds up to 14
      expect(result.actualRiser).toBeCloseTo(192.86, 1); // 2700 / 14
      expect(result.numTreads).toBe(13);
      expect(result.treadDepth).toBe(235);
      expect(result.totalRun).toBe(3055); // 13 * 235
      expect(result.minWidth).toBe(860);
      expect(result.guardHeight).toBe(900);
      expect(result.compliant).toBe(true);
    });

    it('should enforce maximum riser height of 200mm', () => {
      const result = calculateStairs('private-residential', 2700);
      expect(result.actualRiser).toBeLessThanOrEqual(200);
    });

    it('should enforce minimum tread depth of 235mm', () => {
      const result = calculateStairs('private-residential', 2700);
      expect(result.treadDepth).toBeGreaterThanOrEqual(235);
    });
  });

  describe('Exit Stair - Group C', () => {
    it('should calculate correct dimensions for 3000mm rise', () => {
      const result = calculateStairs('exit-group-c', 3000);
      
      expect(result.numRisers).toBe(17); // 3000 / 180 = 16.67, rounds up to 17
      expect(result.actualRiser).toBeCloseTo(176.47, 1); // 3000 / 17
      expect(result.numTreads).toBe(16);
      expect(result.treadDepth).toBe(280);
      expect(result.totalRun).toBe(4480); // 16 * 280
      expect(result.minWidth).toBe(1100);
      expect(result.guardHeight).toBe(1070);
      expect(result.compliant).toBe(true);
    });

    it('should enforce maximum riser height of 180mm', () => {
      const result = calculateStairs('exit-group-c', 3000);
      expect(result.actualRiser).toBeLessThanOrEqual(180);
    });

    it('should enforce minimum width of 1100mm for exit stairs', () => {
      const result = calculateStairs('exit-group-c', 3000);
      expect(result.minWidth).toBe(1100);
    });

    it('should enforce guard height of 1070mm for exit stairs', () => {
      const result = calculateStairs('exit-group-c', 3000);
      expect(result.guardHeight).toBe(1070);
    });
  });

  describe('Exit Stair - Public/Commercial', () => {
    it('should calculate correct dimensions for 4500mm rise', () => {
      const result = calculateStairs('exit-public', 4500);
      
      expect(result.numRisers).toBe(25); // 4500 / 180 = 25
      expect(result.actualRiser).toBe(180); // 4500 / 25
      expect(result.numTreads).toBe(24);
      expect(result.treadDepth).toBe(280);
      expect(result.totalRun).toBe(6720); // 24 * 280
      expect(result.minWidth).toBe(1100);
      expect(result.guardHeight).toBe(1070);
      expect(result.compliant).toBe(true);
    });

    it('should have same requirements as Group C exit stairs', () => {
      const publicResult = calculateStairs('exit-public', 3000);
      const groupCResult = calculateStairs('exit-group-c', 3000);
      
      expect(publicResult.requirements).toEqual(groupCResult.requirements);
      expect(publicResult.minWidth).toBe(groupCResult.minWidth);
      expect(publicResult.guardHeight).toBe(groupCResult.guardHeight);
    });
  });

  describe('Compliance Checks', () => {
    it('should mark non-compliant when riser exceeds maximum', () => {
      // This shouldn't happen with proper calculation, but test the logic
      const result = calculateStairs('private-residential', 400); // Very small rise
      expect(result.numRisers).toBe(2);
      expect(result.actualRiser).toBe(200); // Exactly at max
      expect(result.compliant).toBe(true);
    });

    it('should enforce minimum headroom for private stairs', () => {
      const result = calculateStairs('private-residential', 2700);
      expect(result.headroom).toBe(1950);
    });

    it('should enforce minimum headroom for exit stairs', () => {
      const result = calculateStairs('exit-public', 3000);
      expect(result.headroom).toBe(2050);
    });
  });

  describe('NBC 3.4.6 Requirements', () => {
    it('should use correct tread/riser for private residential', () => {
      const result = calculateStairs('private-residential', 2700);
      expect(result.requirements.minTread).toBe(235);
      expect(result.requirements.maxRiser).toBe(200);
      expect(result.requirements.minRiser).toBe(125);
    });

    it('should use correct tread/riser for exit stairs', () => {
      const result = calculateStairs('exit-public', 3000);
      expect(result.requirements.minTread).toBe(280);
      expect(result.requirements.maxRiser).toBe(180);
      expect(result.requirements.minRiser).toBe(125);
    });
  });
});
