import { describe, expect, it } from 'vitest';
import { stackAreaMatchesTarget, updateStackZoneArea } from '../shared/stackPlanner';

describe('Stack Planner area handling', () => {
  it('allows an existing zone area to be changed to an arbitrary value', () => {
    const wings = [{ id: 'wing-0', label: 'Wing A', floors: [{ zones: [{ code: 'C', area_m2: 100 }] }] }];
    const updated = updateStackZoneArea(wings, 'wing-0', 0, 0, 408);
    expect(updated[0].floors[0].zones[0].area_m2).toBe(408);
  });

  it('rejects a mismatched total at confirmation time', () => {
    expect(stackAreaMatchesTarget(200, 418)).toBe(false);
    expect(stackAreaMatchesTarget(408, 418)).toBe(true);
  });
});
