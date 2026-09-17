import { describe, expect, it } from 'vitest';
import { getStackFloorCount, stackAreaMatchesTarget, updateStackZoneArea } from '../shared/stackPlanner';

describe('Stack Planner area handling', () => {
  it('allows an existing zone area to be changed to an arbitrary value', () => {
    const wings = [{ id: 'wing-0', label: 'Wing A', floors: [{ zones: [{ code: 'C', area_m2: 100 }] }] }];
    // Simulate the rendered input's successive change events when 100 is
    // replaced with 408 (4 → 40 → 408), rather than calling one final setter.
    const after4 = updateStackZoneArea(wings, 'wing-0', 0, 0, 4);
    const after40 = updateStackZoneArea(after4, 'wing-0', 0, 0, 40);
    const after408 = updateStackZoneArea(after40, 'wing-0', 0, 0, 408);
    expect(after408[0].floors[0].zones[0].area_m2).toBe(408);
  });

  it('rejects a mismatched total at confirmation time', () => {
    expect(getStackFloorCount([{ floors: [{}, {}] }])).toBe(2);
    expect(stackAreaMatchesTarget(839.25, 408 * 2)).toBe(true);
    expect(stackAreaMatchesTarget(408, 408)).toBe(true);
    expect(stackAreaMatchesTarget(408 * 3, 408 * 2)).toBe(false);
  });
});
