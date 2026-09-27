import { describe, expect, it } from 'vitest';
import { calculateRoomCompliance } from '../lib/roomComplianceCalculator';

describe('calculateRoomCompliance calibration handling', () => {
  it('reports unknown area when no pixel calibration is supplied', () => {
    const result = calculateRoomCompliance(
      'room-1',
      'Bedroom',
      [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
      null,
    );

    expect(result.areaM2).toBeNull();
  });

  it('continues calculating area for a calibrated room', () => {
    const result = calculateRoomCompliance(
      'room-2',
      'Bedroom',
      [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
      10,
    );

    expect(result.areaM2).toBe(100);
  });
});
