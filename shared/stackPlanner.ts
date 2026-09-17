export function updateStackZoneArea<T extends { id: string; floors: Array<{ zones: Array<{ area_m2: number }> }> }>(wings: T[], wingId: string, floorIdx: number, zoneIdx: number, area: number): T[] {
  return wings.map(wing => wing.id !== wingId ? wing : {
    ...wing,
    floors: wing.floors.map((floor, fi) => fi !== floorIdx ? floor : {
      ...floor,
      // Permit transient values while a user replaces a controlled number input;
      // confirmation validation rejects empty/zero-area zones.
      zones: floor.zones.map((zone, zi) => zi !== zoneIdx ? zone : { ...zone, area_m2: Math.max(0, area) }),
    }),
  });
}

export function stackAreaMatchesTarget(totalArea: number, targetArea: number, toleranceRatio = 0.05): boolean {
  const tolerance = Math.max(1, targetArea * toleranceRatio);
  return Math.abs(totalArea - targetArea) <= tolerance;
}

/** Number of occupied levels in the arrangement (wings share floor levels). */
export function getStackFloorCount(wings: Array<{ floors: unknown[] }>): number {
  return wings.reduce((max, wing) => Math.max(max, wing.floors.length), 0);
}
