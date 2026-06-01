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

export function frrLabel(frr: number): string {
  if (frr === 0.5) return "½HR";
  if (frr === 1.0) return "1HR";
  if (frr === 1.5) return "1½HR";
  if (frr === 2.0) return "2HR";
  return `${frr}HR`;
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
  ctx.setLineDash([]);
  ctx.restore();
}

export type WallTagCompliance = "pass" | "fail" | "marginal" | "unknown";

export function drawWallTag(
  ctx: CanvasRenderingContext2D,
  points: AssemblyPoint[],
  wallCode: string,
  frr: number,
  effectiveFrr: number | null,
  isStacked: boolean,
  compliance: WallTagCompliance,
  color: string,
) {
  if (points.length < 2) return;
  const mid = points[Math.floor(points.length / 2)];

  const displayFrr = effectiveFrr ?? frr;
  const label = frrLabel(displayFrr);
  const tagW = 44;
  const tagH = isStacked ? 30 : 26;

  ctx.save();

  // Convert hex color to rgba for background
  ctx.fillStyle = color;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1.5;

  // @ts-ignore — roundRect is available in modern browsers
  if (ctx.roundRect) {
    ctx.beginPath();
    (ctx as any).roundRect(mid.x - tagW / 2, mid.y - tagH - 4, tagW, tagH, 3);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(mid.x - tagW / 2, mid.y - tagH - 4, tagW, tagH);
    ctx.strokeRect(mid.x - tagW / 2, mid.y - tagH - 4, tagW, tagH);
  }

  if (isStacked) {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(mid.x - tagW / 2, mid.y - tagH - 4, tagW, 7);
    ctx.fillStyle = "white";
    ctx.font = "bold 6px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("STACKED", mid.x, mid.y - tagH + 2);
  }

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = `bold 8px sans-serif`;
  ctx.fillText(wallCode, mid.x, mid.y - tagH / 2 - 2 + (isStacked ? 4 : 0));

  ctx.font = "bold 9px sans-serif";
  ctx.fillText(label, mid.x, mid.y - 10);

  // Compliance dot
  const dotColor =
    compliance === "pass"     ? "#86efac" :
    compliance === "fail"     ? "#fca5a5" :
    compliance === "marginal" ? "#fcd34d" : "#e2e8f0";
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(mid.x + tagW / 2 - 5, mid.y - tagH + 3, 3, 0, Math.PI * 2);
  ctx.fill();

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
