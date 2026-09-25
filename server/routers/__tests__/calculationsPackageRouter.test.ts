import { describe, expect, it } from 'vitest';
import { calculateTravelDistancesByPage } from '../calculationsPackageRouter';
import type { DetectedRoomInput } from '../../services/travelDistanceService';

const page = (roomId: number, calibrationScale: number | null): { rooms: DetectedRoomInput[]; calibrationScale: number | null } => ({
  calibrationScale,
  rooms: [
    { id: roomId, roomLabel: `Bedroom ${roomId}`, boundingBox: { x: 0, y: 0, width: 100, height: 100 }, occupancyGroup: 'D', features: [] },
    { id: roomId + 100, roomLabel: 'Exit stair', boundingBox: { x: 200, y: 0, width: 100, height: 100 }, occupancyGroup: 'D', features: [] },
  ],
});

describe('calculations package travel distance page scoping', () => {
  it('includes rooms from every page in the flat result', () => {
    const results = calculateTravelDistancesByPage([page(1, 1), page(2, 1)], false);
    expect(results.map(result => result.roomId)).toEqual(expect.arrayContaining([1, 2, 101, 102]));
  });

  it('limits missing-calibration unable results to that page', () => {
    const results = calculateTravelDistancesByPage([page(1, null), page(2, 1)], false);
    expect(results.find(result => result.roomId === 1)?.result).toBe('unable_to_evaluate');
    expect(results.find(result => result.roomId === 2)?.result).toBe('pass');
  });
});
