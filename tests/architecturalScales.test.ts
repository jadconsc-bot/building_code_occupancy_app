import { describe, it, expect } from 'vitest';
import {
  imperialScales,
  metricScales,
  getScalesBySystem,
  getScaleById,
  calculateRealDistance,
  formatDistance,
} from '../client/src/lib/architecturalScales';

describe('Architectural Scales Data', () => {
  describe('Imperial Scales', () => {
    it('should have 12 imperial scales', () => {
      expect(imperialScales).toHaveLength(12);
    });

    it('should have correct scale ratios for common scales', () => {
      const scale1_8 = imperialScales.find(s => s.id === 'imp-1-8');
      expect(scale1_8).toBeDefined();
      expect(scale1_8?.ratio).toBe(96); // 1/8" = 1'-0" means 1" = 8' = 96"

      const scale3_16 = imperialScales.find(s => s.id === 'imp-3-16');
      expect(scale3_16).toBeDefined();
      expect(scale3_16?.ratio).toBe(64); // 3/16" = 1'-0" means 1" = 16/3' = 64"

      const scale1_4 = imperialScales.find(s => s.id === 'imp-1-4');
      expect(scale1_4).toBeDefined();
      expect(scale1_4?.ratio).toBe(48); // 1/4" = 1'-0" means 1" = 4' = 48"

      const scale3_8 = imperialScales.find(s => s.id === 'imp-3-8');
      expect(scale3_8).toBeDefined();
      expect(scale3_8?.ratio).toBe(32); // 3/8" = 1'-0" means 1" = 8/3' = 32"

      const scale1_1 = imperialScales.find(s => s.id === 'imp-1-1');
      expect(scale1_1).toBeDefined();
      expect(scale1_1?.ratio).toBe(12); // 1" = 1'-0" means 1" = 12"
    });

    it('should have full scale (1:1) as the last option', () => {
      const fullScale = imperialScales[imperialScales.length - 1];
      expect(fullScale.ratio).toBe(1);
      expect(fullScale.label).toContain('1:1');
    });

    it('should have drawing types for all scales', () => {
      imperialScales.forEach(scale => {
        expect(scale.drawingType).toBeTruthy();
        expect(scale.levelOfDetail).toBeTruthy();
      });
    });
  });

  describe('Metric Scales', () => {
    it('should have 12 metric scales', () => {
      expect(metricScales).toHaveLength(12);
    });

    it('should have correct scale ratios', () => {
      const scale1_100 = metricScales.find(s => s.id === 'met-1-100');
      expect(scale1_100).toBeDefined();
      expect(scale1_100?.ratio).toBe(100);

      const scale1_50 = metricScales.find(s => s.id === 'met-1-50');
      expect(scale1_50).toBeDefined();
      expect(scale1_50?.ratio).toBe(50);

      const scale1_200 = metricScales.find(s => s.id === 'met-1-200');
      expect(scale1_200).toBeDefined();
      expect(scale1_200?.ratio).toBe(200);
    });

    it('should have scales from 1:2500 to 1:1', () => {
      expect(metricScales[0].ratio).toBe(2500);
      expect(metricScales[metricScales.length - 1].ratio).toBe(1);
    });

    it('should have drawing types for all scales', () => {
      metricScales.forEach(scale => {
        expect(scale.drawingType).toBeTruthy();
        expect(scale.levelOfDetail).toBeTruthy();
      });
    });
  });
});

describe('Scale Utility Functions', () => {
  describe('getScalesBySystem', () => {
    it('should return imperial scales for imperial system', () => {
      const scales = getScalesBySystem('imperial');
      expect(scales).toBe(imperialScales);
      expect(scales).toHaveLength(12);
    });

    it('should return metric scales for metric system', () => {
      const scales = getScalesBySystem('metric');
      expect(scales).toBe(metricScales);
      expect(scales).toHaveLength(12);
    });
  });

  describe('getScaleById', () => {
    it('should find imperial scale by ID', () => {
      const scale = getScaleById('imp-1-4');
      expect(scale).toBeDefined();
      expect(scale?.label).toBe('1/4" = 1\'-0"');
    });

    it('should find metric scale by ID', () => {
      const scale = getScaleById('met-1-100');
      expect(scale).toBeDefined();
      expect(scale?.label).toBe('1:100');
    });

    it('should return undefined for non-existent ID', () => {
      const scale = getScaleById('non-existent');
      expect(scale).toBeUndefined();
    });
  });
});

describe('Distance Calculations', () => {
  describe('calculateRealDistance - Imperial', () => {
    it('should calculate distance correctly at 1/4" = 1\'-0" scale', () => {
      const scale = getScaleById('imp-1-4')!;
      const pixelsPerDrawingUnit = 100;
      const pixelDistance = 200;

      const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, scale, 'imperial');

      expect(result.value).toBeCloseTo(8, 1);
      expect(result.unit).toBe('ft');
    });

    it('should calculate distance correctly at 1/8" = 1\'-0" scale', () => {
      const scale = getScaleById('imp-1-8')!;
      const pixelsPerDrawingUnit = 100;
      const pixelDistance = 100;

      const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, scale, 'imperial');

      expect(result.value).toBeCloseTo(8, 1);
      expect(result.unit).toBe('ft');
    });

    it('should return inches for small measurements', () => {
      const scale = getScaleById('imp-full')!;
      const pixelsPerDrawingUnit = 100;
      const pixelDistance = 50;

      const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, scale, 'imperial');

      expect(result.value).toBeCloseTo(0.5, 1);
      expect(result.unit).toBe('in');
    });
  });

  describe('calculateRealDistance - Metric', () => {
    it('should calculate distance correctly at 1:100 scale', () => {
      const scale = getScaleById('met-1-100')!;
      const pixelsPerDrawingUnit = 10;
      const pixelDistance = 100;

      const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, scale, 'metric');

      expect(result.value).toBeCloseTo(1, 1);
      expect(result.unit).toBe('m');
    });

    it('should calculate distance correctly at 1:50 scale', () => {
      const scale = getScaleById('met-1-50')!;
      const pixelsPerDrawingUnit = 10;
      const pixelDistance = 100;

      const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, scale, 'metric');

      expect(result.value).toBeCloseTo(50, 0);
      expect(result.unit).toBe('cm');
    });

    it('should return cm for medium measurements', () => {
      const scale = getScaleById('met-1-10')!;
      const pixelsPerDrawingUnit = 10;
      const pixelDistance = 50;

      const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, scale, 'metric');

      expect(result.value).toBeCloseTo(5, 1);
      expect(result.unit).toBe('cm');
    });
  });
});

describe('formatDistance', () => {
  it('should format feet with inches correctly', () => {
    expect(formatDistance(5.5, 'ft')).toBe("5'-6\"");
    expect(formatDistance(10, 'ft')).toBe("10'-0\"");
    expect(formatDistance(3.25, 'ft')).toBe("3'-3\"");
  });

  it('should format metric units correctly', () => {
    expect(formatDistance(2.5, 'm')).toBe('2.50 m');
    expect(formatDistance(45.123, 'cm')).toBe('45.12 cm');
    expect(formatDistance(100, 'mm')).toBe('100.00 mm');
  });

  it('should respect precision parameter', () => {
    expect(formatDistance(3.14159, 'm', 3)).toBe('3.142 m');
    expect(formatDistance(3.14159, 'm', 0)).toBe('3 m');
  });
});

describe('Scale Drawing Types', () => {
  it('should have appropriate drawing types for imperial scales', () => {
    const locationPlan = imperialScales.find(s => s.drawingType === 'Location plan');
    expect(locationPlan).toBeDefined();
    expect(locationPlan?.ratio).toBeGreaterThan(400);

    const floorPlan = imperialScales.find(s => s.drawingType.includes('Floor plans'));
    expect(floorPlan).toBeDefined();
    expect(floorPlan?.ratio).toBeLessThan(200);
  });

  it('should have appropriate drawing types for metric scales', () => {
    const masterPlan = metricScales.find(s => s.drawingType === 'Master plan');
    expect(masterPlan).toBeDefined();
    expect(masterPlan?.ratio).toBe(2500);

    const sitePlan = metricScales.filter(s => s.drawingType === 'Site plan');
    expect(sitePlan.length).toBeGreaterThan(0);
    sitePlan.forEach(s => {
      expect(s.ratio).toBeGreaterThanOrEqual(200);
      expect(s.ratio).toBeLessThanOrEqual(500);
    });
  });
});
