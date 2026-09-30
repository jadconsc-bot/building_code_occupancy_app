export interface DrawingRoomForAdvisor {
  pageId?: number | null;
  roomLabel?: string | null;
  occupancyGroup?: string | null;
  areaSqm?: number | null;
  areaM2?: number | null;
}

export interface DrawingPageForAdvisor {
  id?: number | null;
  pageId?: number | null;
  pageNumber?: number | null;
  pageType?: string | null;
}

export interface OccupancyAdvisorDrawingSummary {
  estimatedArea: number;
  estimatedFootprint: number;
  storeys: number;
  storeysHeuristic: boolean;
  isMixedUse: boolean;
  mixedUseZones: Array<{ use: string; area: string }>;
  primaryUse: string;
  buildingDescription: string;
}

/** Converts all rooms from an analysis into conservative advisor defaults. */
export function summarizeDrawingForOccupancyAdvisor(
  rooms: DrawingRoomForAdvisor[],
  pages: DrawingPageForAdvisor[] = [],
  existingStoreys?: number,
): OccupancyAdvisorDrawingSummary {
  const areaOf = (room: DrawingRoomForAdvisor) => {
    const area = Number(room.areaSqm ?? room.areaM2 ?? 0);
    return Number.isFinite(area) && area > 0 ? area : 0;
  };
  const estimatedArea = rooms.reduce((sum, room) => sum + areaOf(room), 0);
  const pageById = new Map(pages.map(page => [page.pageId ?? page.id, page]));
  const nonSitePages = [...new Set(rooms.map(room => room.pageId).filter((id): id is number => typeof id === "number"))]
    .filter(id => (pageById.get(id)?.pageType ?? "").toLowerCase() !== "site_plan");
  const groundPageId = nonSitePages.sort((a, b) => (pageById.get(a)?.pageNumber ?? a) - (pageById.get(b)?.pageNumber ?? b))[0];
  const groundRooms = groundPageId == null ? [] : rooms.filter(room => room.pageId === groundPageId);
  const estimatedFootprint = groundRooms.reduce((sum, room) => sum + areaOf(room), 0) || estimatedArea;
  const inferredStoreys = Math.max(1, nonSitePages.length);
  const storeys = Math.max(inferredStoreys, existingStoreys ?? 1);

  const byUse = new Map<string, number>();
  for (const room of rooms) {
    const use = room.occupancyGroup?.trim() || "Unclassified";
    byUse.set(use, (byUse.get(use) ?? 0) + areaOf(room));
  }
  const uses = [...byUse.entries()].sort((a, b) => b[1] - a[1]);
  const primaryUse = uses[0]?.[0] ?? "";
  const mixedUseZones = uses.map(([use, area]) => ({ use, area: area.toFixed(1) }));
  const isMixedUse = uses.length > 1;
  const roomCount = rooms.length;
  const buildingDescription = `${roomCount} detected room${roomCount === 1 ? "" : "s"}${primaryUse ? `, primarily occupancy group ${primaryUse}` : ""}.`;

  return { estimatedArea, estimatedFootprint, storeys, storeysHeuristic: existingStoreys == null, isMixedUse, mixedUseZones, primaryUse, buildingDescription };
}
