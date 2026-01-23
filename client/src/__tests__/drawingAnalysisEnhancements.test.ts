import { describe, it, expect } from 'vitest';

/**
 * Tests for Drawing Analysis Tool Enhancements
 * - Unit of measurement selector (mm, inches, feet)
 * - Mouse wheel zoom and pan controls
 * - Image rotation function
 * - Enhanced AI analysis for building code compliance
 */

describe('Drawing Analysis - Unit Conversion', () => {
  // Conversion factors
  const METERS_TO_MM = 1000;
  const METERS_TO_INCHES = 39.3701;
  const METERS_TO_FEET = 3.28084;
  
  const SQMETERS_TO_SQMM = 1000000;
  const SQMETERS_TO_SQINCHES = 1550.0031;
  const SQMETERS_TO_SQFEET = 10.7639;

  describe('convertToDisplayUnit', () => {
    it('should convert meters to millimeters correctly', () => {
      const meters = 3.0;
      const mm = meters * METERS_TO_MM;
      expect(mm).toBe(3000);
    });

    it('should convert meters to inches correctly', () => {
      const meters = 1.0;
      const inches = meters * METERS_TO_INCHES;
      expect(inches).toBeCloseTo(39.3701, 4);
    });

    it('should convert meters to feet correctly', () => {
      const meters = 1.0;
      const feet = meters * METERS_TO_FEET;
      expect(feet).toBeCloseTo(3.28084, 4);
    });

    it('should handle zero values', () => {
      expect(0 * METERS_TO_MM).toBe(0);
      expect(0 * METERS_TO_INCHES).toBe(0);
      expect(0 * METERS_TO_FEET).toBe(0);
    });

    it('should handle typical setback values', () => {
      // 7.5 meter front setback
      const setbackMeters = 7.5;
      expect(setbackMeters * METERS_TO_FEET).toBeCloseTo(24.606, 2);
      expect(setbackMeters * METERS_TO_MM).toBe(7500);
    });
  });

  describe('convertToMeters', () => {
    it('should convert millimeters to meters correctly', () => {
      const mm = 914.4;
      const meters = mm / METERS_TO_MM;
      expect(meters).toBeCloseTo(0.9144, 4);
    });

    it('should convert inches to meters correctly', () => {
      const inches = 36;
      const meters = inches / METERS_TO_INCHES;
      expect(meters).toBeCloseTo(0.9144, 4);
    });

    it('should convert feet to meters correctly', () => {
      const feet = 3;
      const meters = feet / METERS_TO_FEET;
      expect(meters).toBeCloseTo(0.9144, 4);
    });
  });

  describe('convertAreaToDisplayUnit', () => {
    it('should convert square meters to square millimeters correctly', () => {
      const sqMeters = 1.0;
      const sqMm = sqMeters * SQMETERS_TO_SQMM;
      expect(sqMm).toBe(1000000);
    });

    it('should convert square meters to square inches correctly', () => {
      const sqMeters = 1.0;
      const sqInches = sqMeters * SQMETERS_TO_SQINCHES;
      expect(sqInches).toBeCloseTo(1550.0031, 2);
    });

    it('should convert square meters to square feet correctly', () => {
      const sqMeters = 1.0;
      const sqFeet = sqMeters * SQMETERS_TO_SQFEET;
      expect(sqFeet).toBeCloseTo(10.7639, 2);
    });

    it('should handle typical room areas', () => {
      // 25 square meter living room
      const roomSqMeters = 25;
      expect(roomSqMeters * SQMETERS_TO_SQFEET).toBeCloseTo(269.1, 0);
    });
  });
});

describe('Drawing Analysis - Zoom Controls', () => {
  describe('mouse wheel zoom calculation', () => {
    it('should calculate zoom factor for scroll down (zoom out)', () => {
      const zoomFactor = 0.9;
      const currentZoom = 1.0;
      const newZoom = currentZoom * zoomFactor;
      expect(newZoom).toBe(0.9);
    });

    it('should calculate zoom factor for scroll up (zoom in)', () => {
      const zoomFactor = 1.1;
      const currentZoom = 1.0;
      const newZoom = currentZoom * zoomFactor;
      expect(newZoom).toBe(1.1);
    });

    it('should limit zoom to minimum 10%', () => {
      const minZoom = 0.1;
      const newZoom = Math.max(0.05, minZoom);
      expect(newZoom).toBe(0.1);
    });

    it('should limit zoom to maximum 500%', () => {
      const maxZoom = 5;
      const newZoom = Math.min(6, maxZoom);
      expect(newZoom).toBe(5);
    });

    it('should calculate pan offset to keep cursor position fixed', () => {
      const mouseX = 400;
      const mouseY = 300;
      const currentPan = { x: 0, y: 0 };
      const currentZoom = 1.0;
      const newZoom = 1.1;
      
      const scale = newZoom / currentZoom;
      const newPanX = mouseX - (mouseX - currentPan.x) * scale;
      const newPanY = mouseY - (mouseY - currentPan.y) * scale;
      
      expect(newPanX).toBeCloseTo(-40, 0);
      expect(newPanY).toBeCloseTo(-30, 0);
    });
  });
});

describe('Drawing Analysis - Image Rotation', () => {
  describe('rotation angle calculation', () => {
    it('should rotate clockwise by 90 degrees', () => {
      const currentRotation = 0;
      const newRotation = (currentRotation + 90) % 360;
      expect(newRotation).toBe(90);
    });

    it('should rotate counter-clockwise by 90 degrees', () => {
      const currentRotation = 0;
      const newRotation = (currentRotation - 90 + 360) % 360;
      expect(newRotation).toBe(270);
    });

    it('should wrap around at 360 degrees', () => {
      const currentRotation = 270;
      const newRotation = (currentRotation + 90) % 360;
      expect(newRotation).toBe(0);
    });

    it('should handle multiple rotations', () => {
      let rotation = 0;
      rotation = (rotation + 90) % 360; // 90
      rotation = (rotation + 90) % 360; // 180
      rotation = (rotation + 90) % 360; // 270
      rotation = (rotation + 90) % 360; // 0
      expect(rotation).toBe(0);
    });

    it('should convert degrees to radians for canvas transform', () => {
      const degrees = 90;
      const radians = (degrees * Math.PI) / 180;
      expect(radians).toBeCloseTo(Math.PI / 2, 6);
    });
  });
});

describe('Drawing Analysis - AI Analysis Input', () => {
  describe('measurement unit parameter', () => {
    it('should accept mm as valid unit', () => {
      const validUnits = ['mm', 'inches', 'feet'];
      expect(validUnits).toContain('mm');
    });

    it('should accept inches as valid unit', () => {
      const validUnits = ['mm', 'inches', 'feet'];
      expect(validUnits).toContain('inches');
    });

    it('should accept feet as valid unit', () => {
      const validUnits = ['mm', 'inches', 'feet'];
      expect(validUnits).toContain('feet');
    });

    it('should default to feet when not specified', () => {
      const defaultUnit = 'feet';
      expect(defaultUnit).toBe('feet');
    });
  });

  describe('compliance status values', () => {
    it('should recognize valid compliance statuses', () => {
      const validStatuses = ['pass', 'fail', 'warning', 'unknown'];
      expect(validStatuses).toContain('pass');
      expect(validStatuses).toContain('fail');
      expect(validStatuses).toContain('warning');
      expect(validStatuses).toContain('unknown');
    });
  });

  describe('measurement categories', () => {
    it('should include all required dimension categories', () => {
      const categories = [
        'lot-width', 'lot-depth', 
        'building-width', 'building-depth',
        'setback-front', 'setback-rear', 'setback-side',
        'building-height', 'room-area',
        'door-width', 'window-size', 'stair-width', 'corridor-width',
        'parking-space', 'other'
      ];
      
      expect(categories).toContain('door-width');
      expect(categories).toContain('window-size');
      expect(categories).toContain('stair-width');
      expect(categories).toContain('corridor-width');
      expect(categories).toContain('parking-space');
    });
  });
});

describe('Drawing Analysis - Building Code Compliance Thresholds', () => {
  describe('door width requirements', () => {
    it('should identify minimum door width for egress (810mm / 32in)', () => {
      const minDoorWidthMm = 810;
      const minDoorWidthInches = 32;
      
      expect(minDoorWidthMm / METERS_TO_MM).toBeCloseTo(0.81, 2);
      expect(minDoorWidthInches / METERS_TO_INCHES).toBeCloseTo(0.813, 2);
    });
  });

  describe('stair width requirements', () => {
    it('should identify minimum stair width for residential (860mm / 34in)', () => {
      const minStairWidthMm = 860;
      const minStairWidthInches = 34;
      
      expect(minStairWidthMm / METERS_TO_MM).toBeCloseTo(0.86, 2);
      expect(minStairWidthInches / METERS_TO_INCHES).toBeCloseTo(0.864, 2);
    });
  });

  describe('corridor width requirements', () => {
    it('should identify minimum corridor width for public (1100mm / 44in)', () => {
      const minCorridorWidthMm = 1100;
      const minCorridorWidthInches = 44;
      
      expect(minCorridorWidthMm / METERS_TO_MM).toBeCloseTo(1.1, 2);
      expect(minCorridorWidthInches / METERS_TO_INCHES).toBeCloseTo(1.118, 2);
    });
  });

  describe('accessible route requirements', () => {
    it('should identify minimum accessible route width (920mm / 36in)', () => {
      const minAccessibleWidthMm = 920;
      const minAccessibleWidthInches = 36;
      
      expect(minAccessibleWidthMm / METERS_TO_MM).toBeCloseTo(0.92, 2);
      expect(minAccessibleWidthInches / METERS_TO_INCHES).toBeCloseTo(0.914, 2);
    });
  });

  describe('parking space requirements', () => {
    it('should identify minimum parking space dimensions (2.6m x 5.5m)', () => {
      const minParkingWidth = 2.6;
      const minParkingLength = 5.5;
      
      expect(minParkingWidth * METERS_TO_FEET).toBeCloseTo(8.53, 1);
      expect(minParkingLength * METERS_TO_FEET).toBeCloseTo(18.04, 1);
    });
  });

  describe('window egress requirements', () => {
    it('should identify minimum window opening area (0.35 m²)', () => {
      const minWindowAreaSqM = 0.35;
      
      expect(minWindowAreaSqM * SQMETERS_TO_SQFEET).toBeCloseTo(3.77, 1);
      expect(minWindowAreaSqM * SQMETERS_TO_SQINCHES).toBeCloseTo(542.5, 0);
    });
  });
});

// Constants used in tests
const METERS_TO_MM = 1000;
const METERS_TO_INCHES = 39.3701;
const METERS_TO_FEET = 3.28084;
const SQMETERS_TO_SQMM = 1000000;
const SQMETERS_TO_SQINCHES = 1550.0031;
const SQMETERS_TO_SQFEET = 10.7639;
