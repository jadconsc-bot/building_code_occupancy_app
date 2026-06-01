/**
 * Styles and canvas helpers for fire assembly line drawing.
 */

export type AssemblyType = "none" | "0.5hr" | "1hr" | "1.5hr" | "2hr" | "fire_separation";

export const FIRE_ASSEMBLY_STYLES: Record<AssemblyType, { color: string; dash: number[]; label: string }> = {
  none:            { color: "#94a3b8", dash: [],       label: "None" },
  "0.5hr":         { color: "#f59e0b", dash: [6, 3],   label: "½ hr" },
  "1hr":           { color: "#f97316", dash: [8, 3],   label: "1 hr" },
  "1.5hr":         { color: "#ef4444", dash: [10, 3],  label: "1½ hr" },
  "2hr":           { color: "#dc2626", dash: [],       label: "2 hr" },
  fire_separation: { color: "#7c3aed", dash: [12, 4],  label: "Fire Sep." },
};

export interface AssemblyPoint { x: number; y: number }

export function frrFromType(type: AssemblyType): number {
  if (type === "0.5hr") return 0.5;
  if (type === "1hr")   return 1;
  if (type === "1.5hr") return 1.5;
  if (type === "2hr")   return 2;
  if (type === "fire_separation") return 1;
  return 0;
}

export function drawFireAssemblyLine(
  ctx: CanvasRenderingContext2D,
  points: AssemblyPoint[],
  type: AssemblyType,
  isCompliant: boolean | null,
  label?: string,
) {
  if (points.length < 2) return;
  const style = FIRE_ASSEMBLY_STYLES[type];

  ctx.save();
  ctx.strokeStyle = isCompliant === false ? "#ef4444" : isCompliant === true ? "#22c55e" : style.color;
  ctx.lineWidth = 3;
  ctx.setLineDash(style.dash);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  // Midpoint label
  const mid = points[Math.floor(points.length / 2)];
  const displayLabel = label ?? style.label;
  ctx.setLineDash([]);
  ctx.font = "bold 11px sans-serif";
  ctx.fillStyle = "#ffffff";
  const tw = ctx.measureText(displayLabel).width;
  ctx.fillRect(mid.x - tw / 2 - 3, mid.y - 12, tw + 6, 16);
  ctx.fillStyle = style.color;
  ctx.fillText(displayLabel, mid.x - tw / 2, mid.y);

  ctx.restore();
}

export interface RoomRect {
  id: number;
  label: string;
  occupancyGroup: string;
  bbox: { x: number; y: number; width: number; height: number };
}

export function detectRoomsOnSides(
  p1: AssemblyPoint,
  p2: AssemblyPoint,
  rooms: RoomRect[],
  threshold = 40,
): { roomA: RoomRect | null; roomB: RoomRect | null } {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { roomA: null, roomB: null };

  // Normal vectors perpendicular to the line
  const nx = -dy / len;
  const ny = dx / len;
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const probeA = { x: mid.x + nx * threshold, y: mid.y + ny * threshold };
  const probeB = { x: mid.x - nx * threshold, y: mid.y - ny * threshold };

  function pointInRoom(pt: AssemblyPoint, room: RoomRect): boolean {
    const { x, y, width, height } = room.bbox;
    return pt.x >= x && pt.x <= x + width && pt.y >= y && pt.y <= y + height;
  }

  const roomA = rooms.find(r => pointInRoom(probeA, r)) ?? null;
  const roomB = rooms.find(r => pointInRoom(probeB, r)) ?? null;
  return { roomA, roomB };
}
