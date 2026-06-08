/**
 * IsometricStackView v3
 * Wings-based data model. Each wing is an independent tower with its own floor stack.
 * Supports vertical (multi-tower) and horizontal (floor-plan) orientations,
 * fire separation planes/walls, and hallway cuts.
 * Pure SVG — no Three.js. ViewBox and origin scale dynamically with wing count.
 */

import { useState, useRef, useCallback } from 'react';

// ─── Exported interfaces ─────────────────────────────────────────────────────

export interface HallwayConfig {
  floorIndex: number | 'all';
  positionPct: number;     // 0–100 across building width
  widthMm: number;         // default 1100 (NBC 3.3.1.2 min)
  orientation: 'horizontal' | 'vertical';
  wingId?: string;         // if set, hallway only renders on the matching wing
}

export interface OccupancyZone {
  floor: number;           // floor index (vertical) or section index (horizontal)
  wing?: number;           // kept for backwards compat; not used in v3 render loop
  label: string;
  occupancyGroup: string;
  color: string;
  widthUnits: number;
  xOffset: number;         // within-floor x offset (0..4)
}

export interface FireSeparation {
  betweenFloors: [number, number];
  requiredFRR: number;
  result: 'pass' | 'fail' | 'advisory';
}

export interface WingData {
  id: string;
  label: string;
  zones: OccupancyZone[];
  floorCount: number;
}

export interface WingSeparation {
  wingAIdx: number;
  wingBIdx: number;
  requiredFRR: number;
  result: 'pass' | 'fail' | 'advisory';
}

interface IsometricStackViewProps {
  wings: WingData[];
  separations: FireSeparation[];
  totalFloors: number;
  orientation?: 'vertical' | 'horizontal';
  hallways?: HallwayConfig[];
  wingSeparations?: WingSeparation[];
}

// ─── Fixed constants ──────────────────────────────────────────────────────────

const TILE_W    = 55;
const TILE_H    = 36;
const FLOOR_H   = 3;
const BOX_W     = 4;
const BOX_D     = 2;
const WING_STEP = 4.8;
const H_STEP    = 4.8;
const ORIGIN_Y  = 360;   // baseline Y — kept fixed; width scaling handles horizontal fit

const OCCUPANCY_COLORS: Record<string, string> = {
  'A-1': '#EF4444', 'A-2': '#F97316', 'A-3': '#F59E0B', 'A-4': '#EAB308',
  'B-1': '#8B5CF6', 'B-2': '#7C3AED', 'B-3': '#6D28D9',
  'C':   '#3B82F6',
  'D':   '#06B6D4',
  'E':   '#10B981',
  'F-1': '#6B7280', 'F-2': '#4B5563', 'F-3': '#374151',
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

// originX is passed explicitly so the component can compute it dynamically
function isoProject(x: number, y: number, z: number, rotRad: number, originX: number): [number, number] {
  const rx = x * Math.cos(rotRad) - y * Math.sin(rotRad);
  const ry = x * Math.sin(rotRad) + y * Math.cos(rotRad);
  const sx = (rx - ry) * Math.cos(Math.PI / 6) * TILE_W;
  const sy = (rx + ry) * Math.sin(Math.PI / 6) * TILE_W - z * TILE_H;
  return [sx + originX, sy + ORIGIN_Y];
}

function pts(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function shade(hex: string, factor: number): string {
  const clean = hex.startsWith('#') ? hex : '#3B82F6';
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

function zoneColor(zone: OccupancyZone): string {
  return zone.color?.startsWith('#') ? zone.color : (OCCUPANCY_COLORS[zone.occupancyGroup] ?? '#3B82F6');
}

function sepColors(result: FireSeparation['result'] | WingSeparation['result']) {
  if (result === 'fail')     return { fill: 'rgba(239,68,68,0.45)',   stroke: '#EF4444' };
  if (result === 'advisory') return { fill: 'rgba(245,158,11,0.45)',  stroke: '#F59E0B' };
  return                            { fill: 'rgba(34,197,94,0.45)',   stroke: '#22C55E' };
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function renderBlock(
  key: string,
  x0: number, x1: number,
  y0: number, y1: number,
  z0: number, z1: number,
  color: string,
  rotRad: number,
  originX: number,
  label?: string,
): React.ReactNode {
  const ip = (x: number, y: number, z: number) => isoProject(x, y, z, rotRad, originX);
  const topFace   = [ip(x0,y0,z1), ip(x1,y0,z1), ip(x1,y1,z1), ip(x0,y1,z1)] as [number,number][];
  const frontFace = [ip(x0,y1,z0), ip(x1,y1,z0), ip(x1,y1,z1), ip(x0,y1,z1)] as [number,number][];
  const sideFace  = [ip(x1,y0,z0), ip(x1,y1,z0), ip(x1,y1,z1), ip(x1,y0,z1)] as [number,number][];

  const cx = topFace.reduce((s,p) => s+p[0], 0) / 4;
  const cy = topFace.reduce((s,p) => s+p[1], 0) / 4;

  return (
    <g key={key}>
      <polygon points={pts(frontFace)} fill={shade(color,0.72)} stroke="#fff" strokeWidth="0.5" />
      <polygon points={pts(sideFace)}  fill={shade(color,0.58)} stroke="#fff" strokeWidth="0.5" />
      <polygon points={pts(topFace)}   fill={shade(color,0.90)} stroke="#fff" strokeWidth="0.5" />
      {label && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="bold" fill="#fff" opacity="0.95"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Vertical wall renderer ────────────────────────────────────────────────────

function renderWall(
  key: string,
  atX: number,
  y0: number, y1: number,
  z0: number, z1: number,
  frr: number,
  result: WingSeparation['result'],
  rotRad: number,
  originX: number,
): React.ReactNode {
  const ip = (x: number, y: number, z: number) => isoProject(x, y, z, rotRad, originX);
  const { fill, stroke } = sepColors(result);
  const p1 = ip(atX, y0, z0);
  const p2 = ip(atX, y1, z0);
  const p3 = ip(atX, y1, z1);
  const p4 = ip(atX, y0, z1);
  const face = [p1,p2,p3,p4] as [number,number][];
  const cx = (p1[0]+p4[0])/2;
  const cy = (p1[1]+p4[1])/2 - 6;
  return (
    <g key={key}>
      <polygon points={pts(face)} fill={fill} stroke={stroke} strokeWidth="1.2" />
      {frr > 0 && (
        <text x={cx} y={cy} textAnchor="middle" fontSize="7" fontFamily="monospace"
          fill={stroke} fontWeight="bold" style={{ pointerEvents:'none', userSelect:'none' }}
        >
          {frr}min
        </text>
      )}
    </g>
  );
}

// ─── Horizontal floor-separation plane ────────────────────────────────────────

function renderHorizSep(
  key: string,
  xBase: number,
  z: number,
  frr: number,
  result: FireSeparation['result'],
  rotRad: number,
  originX: number,
): React.ReactNode {
  const ip = (x: number, y: number) => isoProject(x, y, z, rotRad, originX);
  const { fill, stroke } = sepColors(result);
  const margin = 0.15;
  const face = [
    ip(xBase - margin,         0 - margin),
    ip(xBase + BOX_W + margin, 0 - margin),
    ip(xBase + BOX_W + margin, BOX_D + margin),
    ip(xBase - margin,         BOX_D + margin),
  ] as [number,number][];
  const cx = (face[0][0]+face[1][0])/2;
  const cy = (face[0][1]+face[1][1])/2 - 5;
  return (
    <g key={key}>
      <polygon points={pts(face)} fill={fill} stroke={stroke} strokeWidth="1" />
      {frr > 0 && (
        <text x={cx} y={cy} textAnchor="middle" fontSize="7" fontFamily="monospace"
          fill={stroke} fontWeight="bold" style={{ pointerEvents:'none', userSelect:'none' }}
        >
          {frr}min FRR
        </text>
      )}
    </g>
  );
}

// ─── Hallway overlay renderer ─────────────────────────────────────────────────

function renderHallway(
  key: string,
  xBase: number,
  posU: number,
  widthU: number,
  z0: number,
  z1: number,
  rotRad: number,
  originX: number,
): React.ReactNode {
  const ip = (x: number, y: number, z: number) => isoProject(x, y, z, rotRad, originX);
  const topStripe = [
    ip(xBase + posU,          0,     z1),
    ip(xBase + posU + widthU, 0,     z1),
    ip(xBase + posU + widthU, BOX_D, z1),
    ip(xBase + posU,          BOX_D, z1),
  ] as [number,number][];
  const frontStripe = [
    ip(xBase + posU,          BOX_D, z0),
    ip(xBase + posU + widthU, BOX_D, z0),
    ip(xBase + posU + widthU, BOX_D, z1),
    ip(xBase + posU,          BOX_D, z1),
  ] as [number,number][];
  const rightStripe = [
    ip(xBase + posU + widthU, 0,     z0),
    ip(xBase + posU + widthU, BOX_D, z0),
    ip(xBase + posU + widthU, BOX_D, z1),
    ip(xBase + posU + widthU, 0,     z1),
  ] as [number,number][];

  const figX = (topStripe[0][0]+topStripe[1][0]+topStripe[2][0]+topStripe[3][0]) / 4;
  const figY = (topStripe[0][1]+topStripe[1][1]+topStripe[2][1]+topStripe[3][1]) / 4;

  return (
    <g key={key}>
      <polygon points={pts(rightStripe)} fill="rgba(160,160,160,0.92)" stroke="#aaa" strokeWidth="0.5" />
      <polygon points={pts(frontStripe)} fill="rgba(180,180,180,0.92)" stroke="#aaa" strokeWidth="0.5" />
      <polygon points={pts(topStripe)}   fill="rgba(210,210,210,0.95)" stroke="#bbb" strokeWidth="0.8" strokeDasharray="2,1" />
      <text x={figX} y={figY} textAnchor="middle" dominantBaseline="middle"
        fontSize="8" style={{ pointerEvents:'none', userSelect:'none' }} opacity="0.8"
      >
        🚶
      </text>
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IsometricStackView({
  wings,
  separations,
  totalFloors,
  orientation = 'vertical',
  hallways = [],
  wingSeparations = [],
}: IsometricStackViewProps) {
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown  = useCallback((e: React.MouseEvent)  => { isDragging.current = true;  lastX.current = e.clientX; }, []);
  const onMouseUp    = useCallback(() => { isDragging.current = false; }, []);
  const onTouchStart = useCallback((e: React.TouchEvent)  => { isDragging.current = true;  lastX.current = e.touches[0].clientX; }, []);
  const onTouchEnd   = useCallback(() => { isDragging.current = false; }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setRotation(r => Math.max(-30, Math.min(30, r + dx * 0.5)));
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;
    setRotation(r => Math.max(-30, Math.min(30, r + dx * 0.5)));
  }, []);

  // ── Dynamic viewport — scales with wing count and floor height ────────────
  const wingCount = Math.max(wings.length, 1);
  const svgW   = 600 + (wingCount - 1) * 280;
  const svgH   = 500 + totalFloors * 20;
  const originX = 300 - (wingCount - 1) * 60;

  const rotRad = (rotation * Math.PI) / 180;
  const elements: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];

  // ── Vertical mode: each wing is an independent tower ──────────────────────
  if (orientation === 'vertical') {
    wings.forEach((wing, wingIdx) => {
      const xBase = wingIdx * WING_STEP;
      const floorCount = Math.max(wing.floorCount, 1);

      for (let floorIdx = 0; floorIdx < floorCount; floorIdx++) {
        const z0 = floorIdx * FLOOR_H;
        const z1 = z0 + FLOOR_H;
        const floorZones = wing.zones.filter(z => z.floor === floorIdx);

        if (floorZones.length === 0) {
          elements.push(renderBlock(
            `empty-w${wingIdx}-f${floorIdx}`,
            xBase, xBase + BOX_W, 0, BOX_D, z0, z1, '#E5E7EB', rotRad, originX
          ));
        } else {
          for (let zi = 0; zi < floorZones.length; zi++) {
            const zone = floorZones[zi];
            const x0 = xBase + zone.xOffset;
            const x1 = x0 + zone.widthUnits;
            elements.push(renderBlock(
              `zone-w${wingIdx}-f${floorIdx}-z${zi}`,
              x0, x1, 0, BOX_D, z0, z1, zoneColor(zone), rotRad, originX, zone.occupancyGroup
            ));
          }
        }

        // Hallways on this floor — skip if scoped to a different wing
        for (let hi = 0; hi < hallways.length; hi++) {
          const hw = hallways[hi];
          if (hw.wingId !== undefined && hw.wingId !== wing.id) continue;
          if (hw.floorIndex !== 'all' && hw.floorIndex !== floorIdx) continue;
          const posU = (hw.positionPct / 100) * BOX_W;
          const widthU = Math.max(hw.widthMm / 5000, 0.12);
          elements.push(renderHallway(
            `hw-w${wingIdx}-f${floorIdx}-h${hi}`,
            xBase, posU, widthU, z0, z1, rotRad, originX
          ));
        }

        // Floor separation plane above this floor
        const sep = separations.find(s =>
          (s.betweenFloors[0] === floorIdx && s.betweenFloors[1] === floorIdx + 1) ||
          (s.betweenFloors[1] === floorIdx && s.betweenFloors[0] === floorIdx + 1)
        );
        if (sep) {
          elements.push(renderHorizSep(
            `flsep-w${wingIdx}-f${floorIdx}`, xBase, z1, sep.requiredFRR, sep.result, rotRad, originX
          ));
        }
      }

      // Floor labels on left of tower
      for (let fl = 0; fl < floorCount; fl++) {
        const zMid = fl * FLOOR_H + FLOOR_H / 2;
        const [lx, ly] = isoProject(xBase - 0.4, BOX_D / 2, zMid, rotRad, originX);
        labels.push(
          <text key={`lbl-w${wingIdx}-f${fl}`} x={lx - 4} y={ly} textAnchor="end"
            fontSize="8" fill="#6B7280" fontWeight="600" style={{ userSelect:'none' }}
          >
            {fl === 0 ? 'G/F' : `L${fl + 1}`}
          </text>
        );
      }

      // Wing name label above tower (only when multiple wings)
      if (wings.length > 1) {
        const topZ = wing.floorCount * FLOOR_H;
        const [wx, wy] = isoProject(xBase + BOX_W / 2, BOX_D / 2, topZ, rotRad, originX);
        labels.push(
          <text key={`wing-lbl-${wingIdx}`} x={wx} y={wy - 8} textAnchor="middle"
            fontSize="9" fill="#374151" fontWeight="700" style={{ userSelect:'none' }}
          >
            {wing.label}
          </text>
        );
      }
    });

    // Wing separation walls — only at overlapping floor heights
    for (const ws of wingSeparations) {
      const wingA = wings[ws.wingAIdx];
      const wingB = wings[ws.wingBIdx];
      const atX = ws.wingAIdx * WING_STEP + BOX_W + (WING_STEP - BOX_W) / 2;
      const fromZ = 0;
      const toZ = Math.min(
        (wingA?.floorCount ?? 0) * FLOOR_H,
        (wingB?.floorCount ?? 0) * FLOOR_H
      );
      if (toZ > fromZ) {
        elements.push(renderWall(
          `wsep-${ws.wingAIdx}-${ws.wingBIdx}`,
          atX, 0, BOX_D, fromZ, toZ, ws.requiredFRR, ws.result, rotRad, originX
        ));
      }
    }
  }

  // ── Horizontal mode: sections laid out along X ─────────────────────────────
  if (orientation === 'horizontal') {
    const flatZones = wings[0]?.zones ?? [];
    const sections = [...new Set(flatZones.map(z => z.floor))].sort((a, b) => a - b);

    for (const sectionIdx of sections) {
      const xBase = sectionIdx * H_STEP;
      const sectionZones = flatZones.filter(z => z.floor === sectionIdx);
      const z0 = 0, z1 = FLOOR_H;

      if (sectionZones.length === 0) {
        elements.push(renderBlock(`empty-s${sectionIdx}`, xBase, xBase + BOX_W, 0, BOX_D, z0, z1, '#E5E7EB', rotRad, originX));
      } else {
        for (let zi = 0; zi < sectionZones.length; zi++) {
          const zone = sectionZones[zi];
          const x0 = xBase + zone.xOffset;
          const x1 = x0 + zone.widthUnits;
          elements.push(renderBlock(`zone-s${sectionIdx}-z${zi}`, x0, x1, 0, BOX_D, z0, z1, zoneColor(zone), rotRad, originX, zone.occupancyGroup));
        }
      }

      // Hallways on this section
      for (let hi = 0; hi < hallways.length; hi++) {
        const hw = hallways[hi];
        if (hw.floorIndex !== 'all' && hw.floorIndex !== sectionIdx) continue;
        const posU = (hw.positionPct / 100) * BOX_W;
        const widthU = Math.max(hw.widthMm / 5000, 0.12);
        elements.push(renderHallway(`hw-s${sectionIdx}-h${hi}`, xBase, posU, widthU, z0, z1, rotRad, originX));
      }

      // Vertical fire separation wall on the right edge of each section
      const rightSep = separations.find(s =>
        (s.betweenFloors[0] === sectionIdx && s.betweenFloors[1] === sectionIdx + 1) ||
        (s.betweenFloors[1] === sectionIdx && s.betweenFloors[0] === sectionIdx + 1)
      );
      if (rightSep) {
        const wallX = xBase + BOX_W + 0.2;
        elements.push(renderWall(`hsep-s${sectionIdx}`, wallX, 0, BOX_D, z0, z1, rightSep.requiredFRR, rightSep.result, rotRad, originX));
      }

      // Section label below
      const [lx, ly] = isoProject(xBase + BOX_W / 2, BOX_D, 0, rotRad, originX);
      labels.push(
        <text key={`slbl-${sectionIdx}`} x={lx} y={ly + 14} textAnchor="middle"
          fontSize="8" fill="#6B7280" fontWeight="600" style={{ userSelect:'none' }}
        >
          {sectionIdx === 0 ? 'G/F' : `Sec ${sectionIdx + 1}`}
        </text>
      );
    }

    // Wing separations in horizontal mode (if any)
    for (const ws of wingSeparations) {
      const atX = ws.wingAIdx * WING_STEP + BOX_W + (WING_STEP - BOX_W) / 2;
      elements.push(renderWall(`wsep-h-${ws.wingAIdx}`, atX, 0, BOX_D, 0, FLOOR_H, ws.requiredFRR, ws.result, rotRad, originX));
    }
  }

  return (
    <div className="select-none">
      <svg
        width="100%"
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab', touchAction: 'none', maxWidth: svgW }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {elements}
        {labels}
        <text x={svgW / 2} y={svgH - 8} textAnchor="middle" fontSize="8" fill="#9CA3AF"
          style={{ userSelect: 'none' }}
        >
          Drag to rotate
        </text>
      </svg>
    </div>
  );
}
