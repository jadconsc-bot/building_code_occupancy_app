/**
 * IsometricStackView v2
 * Renders occupancy zones as isometric 3D boxes.
 * Supports vertical (tower) and horizontal (floor-plan) orientations,
 * multi-wing towers, fire separation planes/walls, and hallway cuts.
 * Pure SVG — no Three.js.
 */

import { useState, useRef, useCallback } from 'react';

// ─── Exported interfaces ─────────────────────────────────────────────────────

export interface HallwayConfig {
  floorIndex: number | 'all';
  positionPct: number;     // 0–100 across building width
  widthMm: number;         // default 1100 (NBC 3.3.1.2 min)
  orientation: 'horizontal' | 'vertical';
}

export interface OccupancyZone {
  floor: number;           // floor index (vertical) or section index (horizontal)
  wing?: number;           // 0 = main tower (default), 1+ = additional wings
  label: string;
  occupancyGroup: string;
  color: string;
  widthUnits: number;
  xOffset: number;         // within-section x offset (0..4)
}

export interface FireSeparation {
  betweenFloors: [number, number];   // floor indices (vertical)
  requiredFRR: number;
  result: 'pass' | 'fail' | 'advisory';
}

export interface WingSeparation {
  atX: number;             // x position (building units) of the wall
  fromZ: number;           // z start
  toZ: number;             // z end
  requiredFRR: number;
  result: 'pass' | 'fail' | 'advisory';
}

interface IsometricStackViewProps {
  zones: OccupancyZone[];
  separations: FireSeparation[];
  totalFloors: number;
  orientation?: 'vertical' | 'horizontal';
  hallways?: HallwayConfig[];
  wingSeparations?: WingSeparation[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TILE_W  = 55;    // isometric tile width (px)
const TILE_H  = 36;    // height per Z unit (px)
const FLOOR_H = 3;     // Z units per floor
const BOX_W   = 4;     // building width in units
const BOX_D   = 2;     // building depth in units
const WING_STEP = 4.8; // x offset per wing
const H_STEP  = 4.8;   // x offset per horizontal section
const ORIGIN_X = 300;
const ORIGIN_Y = 360;
const SVG_W   = 680;
const SVG_H   = 480;

const OCCUPANCY_COLORS: Record<string, string> = {
  'A-1': '#EF4444', 'A-2': '#F97316', 'A-3': '#F59E0B', 'A-4': '#EAB308',
  'B-1': '#8B5CF6', 'B-2': '#7C3AED', 'B-3': '#6D28D9',
  'C':   '#3B82F6',
  'D':   '#06B6D4',
  'E':   '#10B981',
  'F-1': '#6B7280', 'F-2': '#4B5563', 'F-3': '#374151',
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function isoProject(x: number, y: number, z: number, rotRad: number): [number, number] {
  const rx = x * Math.cos(rotRad) - y * Math.sin(rotRad);
  const ry = x * Math.sin(rotRad) + y * Math.cos(rotRad);
  const sx = (rx - ry) * Math.cos(Math.PI / 6) * TILE_W;
  const sy = (rx + ry) * Math.sin(Math.PI / 6) * TILE_W - z * TILE_H;
  return [sx + ORIGIN_X, sy + ORIGIN_Y];
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
  label?: string,
): React.ReactNode {
  const topFace  = [isoProject(x0,y0,z1,rotRad), isoProject(x1,y0,z1,rotRad), isoProject(x1,y1,z1,rotRad), isoProject(x0,y1,z1,rotRad)] as [number,number][];
  const frontFace = [isoProject(x0,y1,z0,rotRad), isoProject(x1,y1,z0,rotRad), isoProject(x1,y1,z1,rotRad), isoProject(x0,y1,z1,rotRad)] as [number,number][];
  const sideFace  = [isoProject(x1,y0,z0,rotRad), isoProject(x1,y1,z0,rotRad), isoProject(x1,y1,z1,rotRad), isoProject(x1,y0,z1,rotRad)] as [number,number][];

  const cx = topFace.reduce((s,p)=>s+p[0],0)/4;
  const cy = topFace.reduce((s,p)=>s+p[1],0)/4;

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

// ─── Horizontal separation wall renderer ─────────────────────────────────────

function renderWall(
  key: string,
  atX: number,
  y0: number, y1: number,
  z0: number, z1: number,
  frr: number,
  result: FireSeparation['result'],
  rotRad: number,
): React.ReactNode {
  const { fill, stroke } = sepColors(result);
  const p1 = isoProject(atX, y0, z0, rotRad);
  const p2 = isoProject(atX, y1, z0, rotRad);
  const p3 = isoProject(atX, y1, z1, rotRad);
  const p4 = isoProject(atX, y0, z1, rotRad);
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
): React.ReactNode {
  const { fill, stroke } = sepColors(result);
  const margin = 0.15;
  const face = [
    isoProject(xBase - margin,         0 - margin, z, rotRad),
    isoProject(xBase + BOX_W + margin, 0 - margin, z, rotRad),
    isoProject(xBase + BOX_W + margin, BOX_D + margin, z, rotRad),
    isoProject(xBase - margin,         BOX_D + margin, z, rotRad),
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
): React.ReactNode {
  // Top stripe (grey, overlaid on block top face at z1)
  const topStripe = [
    isoProject(xBase + posU,         0,     z1, rotRad),
    isoProject(xBase + posU + widthU, 0,    z1, rotRad),
    isoProject(xBase + posU + widthU, BOX_D, z1, rotRad),
    isoProject(xBase + posU,         BOX_D, z1, rotRad),
  ] as [number,number][];

  // Front face strip (at y=BOX_D, showing hallway depth)
  const frontStripe = [
    isoProject(xBase + posU,          BOX_D, z0, rotRad),
    isoProject(xBase + posU + widthU, BOX_D, z0, rotRad),
    isoProject(xBase + posU + widthU, BOX_D, z1, rotRad),
    isoProject(xBase + posU,          BOX_D, z1, rotRad),
  ] as [number,number][];

  // Right wall strip (x = posU+widthU face)
  const rightStripe = [
    isoProject(xBase + posU + widthU, 0,     z0, rotRad),
    isoProject(xBase + posU + widthU, BOX_D, z0, rotRad),
    isoProject(xBase + posU + widthU, BOX_D, z1, rotRad),
    isoProject(xBase + posU + widthU, 0,     z1, rotRad),
  ] as [number,number][];

  // Walking figure at center of top stripe
  const figX = (topStripe[0][0] + topStripe[1][0] + topStripe[2][0] + topStripe[3][0]) / 4;
  const figY = (topStripe[0][1] + topStripe[1][1] + topStripe[2][1] + topStripe[3][1]) / 4;

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
  zones,
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

  const rotRad = (rotation * Math.PI) / 180;
  const elements: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];

  // ── Vertical mode ─────────────────────────────────────────────────────────
  if (orientation === 'vertical') {
    const floorCount = Math.max(totalFloors, 1);
    const wings = [...new Set(zones.map(z => z.wing ?? 0))].sort();

    // Render each wing as a separate tower
    for (const wingIdx of wings) {
      const xBase = wingIdx * WING_STEP;
      const wingZones = zones.filter(z => (z.wing ?? 0) === wingIdx);

      // Floor 0 = bottom (Z=0), floor N = top — iterate 0..N-1 (ground up)
      for (let floorIdx = 0; floorIdx < floorCount; floorIdx++) {
        const z0 = floorIdx * FLOOR_H;
        const z1 = z0 + FLOOR_H;
        const floorZones = wingZones.filter(z => z.floor === floorIdx);

        if (floorZones.length === 0) {
          // Empty placeholder
          elements.push(renderBlock(`empty-w${wingIdx}-f${floorIdx}`, xBase, xBase + BOX_W, 0, BOX_D, z0, z1, '#E5E7EB', rotRad));
        } else {
          for (let zi = 0; zi < floorZones.length; zi++) {
            const zone = floorZones[zi];
            const x0 = xBase + zone.xOffset;
            const x1 = x0 + zone.widthUnits;
            elements.push(renderBlock(`zone-w${wingIdx}-f${floorIdx}-z${zi}`, x0, x1, 0, BOX_D, z0, z1, zoneColor(zone), rotRad, zone.occupancyGroup));
          }
        }

        // Hallways on this floor for this wing
        for (let hi = 0; hi < hallways.length; hi++) {
          const hw = hallways[hi];
          const applies = hw.floorIndex === 'all' || hw.floorIndex === floorIdx;
          if (!applies) continue;
          const posU = (hw.positionPct / 100) * BOX_W;
          const widthU = Math.max(hw.widthMm / 5000, 0.12);
          elements.push(renderHallway(`hw-w${wingIdx}-f${floorIdx}-h${hi}`, xBase, posU, widthU, z0, z1, rotRad));
        }

        // Floor separation plane (above this floor = between floorIdx and floorIdx+1)
        const sep = separations.find(s =>
          (s.betweenFloors[0] === floorIdx && s.betweenFloors[1] === floorIdx + 1) ||
          (s.betweenFloors[1] === floorIdx && s.betweenFloors[0] === floorIdx + 1)
        );
        if (sep) {
          elements.push(renderHorizSep(`flsep-w${wingIdx}-f${floorIdx}`, xBase, z1, sep.requiredFRR, sep.result, rotRad));
        }
      }

      // Floor labels on left of this wing
      for (let fl = 0; fl < floorCount; fl++) {
        const zMid = fl * FLOOR_H + FLOOR_H / 2;
        const [lx, ly] = isoProject(xBase - 0.4, BOX_D / 2, zMid, rotRad);
        labels.push(
          <text key={`lbl-w${wingIdx}-f${fl}`} x={lx - 4} y={ly} textAnchor="end"
            fontSize="8" fill="#6B7280" fontWeight="600" style={{ userSelect:'none' }}
          >
            {fl === 0 ? 'G/F' : `L${fl + 1}`}
          </text>
        );
      }
    }

    // Wing separation walls between adjacent wings
    for (const ws of wingSeparations) {
      elements.push(renderWall(`wsep-${ws.atX}`, ws.atX, 0, BOX_D, ws.fromZ, ws.toZ, ws.requiredFRR, ws.result, rotRad));
    }

    // Between-wing plain wall (no FRR data) — for gaps with no wingSeparation
    // (already handled above; just ensure wall renders between every wing pair)
  }

  // ── Horizontal mode ────────────────────────────────────────────────────────
  if (orientation === 'horizontal') {
    // Each "floor" is a section laid out along X at ground level (z=0..FLOOR_H)
    const sections = [...new Set(zones.map(z => z.floor))].sort((a, b) => a - b);

    for (const sectionIdx of sections) {
      const xBase = sectionIdx * H_STEP;
      const sectionZones = zones.filter(z => z.floor === sectionIdx);
      const z0 = 0, z1 = FLOOR_H;

      if (sectionZones.length === 0) {
        elements.push(renderBlock(`empty-s${sectionIdx}`, xBase, xBase + BOX_W, 0, BOX_D, z0, z1, '#E5E7EB', rotRad));
      } else {
        for (let zi = 0; zi < sectionZones.length; zi++) {
          const zone = sectionZones[zi];
          const x0 = xBase + zone.xOffset;
          const x1 = x0 + zone.widthUnits;
          elements.push(renderBlock(`zone-s${sectionIdx}-z${zi}`, x0, x1, 0, BOX_D, z0, z1, zoneColor(zone), rotRad, zone.occupancyGroup));
        }
      }

      // Hallways on this section
      for (let hi = 0; hi < hallways.length; hi++) {
        const hw = hallways[hi];
        const applies = hw.floorIndex === 'all' || hw.floorIndex === sectionIdx;
        if (!applies) continue;
        const posU = (hw.positionPct / 100) * BOX_W;
        const widthU = Math.max(hw.widthMm / 5000, 0.12);
        elements.push(renderHallway(`hw-s${sectionIdx}-h${hi}`, xBase, posU, widthU, z0, z1, rotRad));
      }

      // Vertical fire separation wall on the right edge of each section (between sections)
      const rightSep = separations.find(s =>
        (s.betweenFloors[0] === sectionIdx && s.betweenFloors[1] === sectionIdx + 1) ||
        (s.betweenFloors[1] === sectionIdx && s.betweenFloors[0] === sectionIdx + 1)
      );
      if (rightSep) {
        const wallX = xBase + BOX_W + 0.2;
        elements.push(renderWall(`hsep-s${sectionIdx}`, wallX, 0, BOX_D, z0, z1, rightSep.requiredFRR, rightSep.result, rotRad));
      }

      // Section label below
      const [lx, ly] = isoProject(xBase + BOX_W / 2, BOX_D, 0, rotRad);
      labels.push(
        <text key={`slbl-${sectionIdx}`} x={lx} y={ly + 14} textAnchor="middle"
          fontSize="8" fill="#6B7280" fontWeight="600" style={{ userSelect:'none' }}
        >
          {sectionIdx === 0 ? 'G/F' : `Sec ${sectionIdx + 1}`}
        </text>
      );
    }

    // Wing separations (passed from parent for horizontal mode too, if any)
    for (const ws of wingSeparations) {
      elements.push(renderWall(`wsep-h-${ws.atX}`, ws.atX, 0, BOX_D, ws.fromZ, ws.toZ, ws.requiredFRR, ws.result, rotRad));
    }
  }

  return (
    <div className="select-none">
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab', touchAction: 'none', maxWidth: SVG_W }}
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
        <text x={SVG_W / 2} y={SVG_H - 8} textAnchor="middle" fontSize="8" fill="#9CA3AF"
          style={{ userSelect: 'none' }}
        >
          Drag to rotate
        </text>
      </svg>
    </div>
  );
}
