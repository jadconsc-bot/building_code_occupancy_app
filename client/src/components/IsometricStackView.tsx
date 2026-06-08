/**
 * IsometricStackView
 * Renders occupancy zones as isometric 3D boxes stacked by floor.
 * Pure SVG — no Three.js dependency.
 */

import { useState, useRef, useCallback } from 'react';

export interface OccupancyZone {
  floor: number;
  label: string;
  occupancyGroup: string;
  color: string;
  widthUnits: number;
  xOffset: number;
}

export interface FireSeparation {
  betweenFloors: [number, number];
  requiredFRR: number;
  result: 'pass' | 'fail' | 'advisory';
}

interface IsometricStackViewProps {
  zones: OccupancyZone[];
  separations: FireSeparation[];
  totalFloors: number;
}

const TILE_W = 60;
const TILE_H = 40;
const FLOOR_H = 3;
const ORIGIN_X = 300;
const ORIGIN_Y = 380;
const SVG_W = 600;
const SVG_H = 480;

function isoProject(x: number, y: number, z: number, rotRad: number): [number, number] {
  const rx = x * Math.cos(rotRad) - y * Math.sin(rotRad);
  const ry = x * Math.sin(rotRad) + y * Math.cos(rotRad);
  const sx = (rx - ry) * Math.cos(Math.PI / 6) * TILE_W;
  const sy = (rx + ry) * Math.sin(Math.PI / 6) * TILE_W - z * TILE_H;
  return [sx + ORIGIN_X, sy + ORIGIN_Y];
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function shadedColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex.startsWith('#') ? hex : '#3B82F6');
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

function pointsStr(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

const OCCUPANCY_COLORS: Record<string, string> = {
  'A-1': '#EF4444', 'A-2': '#F97316', 'A-3': '#F59E0B', 'A-4': '#EAB308',
  'B-1': '#8B5CF6', 'B-2': '#7C3AED', 'B-3': '#6D28D9',
  'C':   '#3B82F6',
  'D':   '#06B6D4',
  'E':   '#10B981',
  'F-1': '#6B7280', 'F-2': '#4B5563', 'F-3': '#374151',
};

function getZoneColor(zone: OccupancyZone): string {
  if (zone.color && zone.color.startsWith('#')) return zone.color;
  return OCCUPANCY_COLORS[zone.occupancyGroup] ?? '#3B82F6';
}

export function IsometricStackView({ zones, separations, totalFloors }: IsometricStackViewProps) {
  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setRotation(r => Math.max(-30, Math.min(30, r + dx * 0.5)));
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    lastX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;
    setRotation(r => Math.max(-30, Math.min(30, r + dx * 0.5)));
  }, []);

  const onTouchEnd = useCallback(() => { isDragging.current = false; }, []);

  const rotRad = (rotation * Math.PI) / 180;
  const floorCount = Math.max(totalFloors, 1);
  const elements: React.ReactNode[] = [];

  // Render floors bottom to top
  for (let floor = 0; floor < floorCount; floor++) {
    const z = floor * FLOOR_H;
    const floorZones = zones.filter(z => z.floor === floor);

    if (floorZones.length === 0) {
      // Empty placeholder floor
      const x0 = 0, x1 = 4, y0 = 0, y1 = 2;
      const top = [
        isoProject(x0, y0, z + FLOOR_H, rotRad),
        isoProject(x1, y0, z + FLOOR_H, rotRad),
        isoProject(x1, y1, z + FLOOR_H, rotRad),
        isoProject(x0, y1, z + FLOOR_H, rotRad),
      ];
      elements.push(
        <polygon key={`empty-${floor}-top`}
          points={pointsStr(top)}
          fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="0.5" opacity="0.5"
        />
      );
    }

    for (let zi = 0; zi < floorZones.length; zi++) {
      const zone = floorZones[zi];
      const color = getZoneColor(zone);
      const x0 = zone.xOffset;
      const x1 = zone.xOffset + zone.widthUnits;
      const y0 = 0;
      const y1 = 2;

      // 3 faces: top (lighter), left (base), right (darker)
      const topFace = [
        isoProject(x0, y0, z + FLOOR_H, rotRad),
        isoProject(x1, y0, z + FLOOR_H, rotRad),
        isoProject(x1, y1, z + FLOOR_H, rotRad),
        isoProject(x0, y1, z + FLOOR_H, rotRad),
      ];
      const leftFace = [
        isoProject(x0, y1, z,           rotRad),
        isoProject(x1, y1, z,           rotRad),
        isoProject(x1, y1, z + FLOOR_H, rotRad),
        isoProject(x0, y1, z + FLOOR_H, rotRad),
      ];
      const rightFace = [
        isoProject(x1, y0, z,           rotRad),
        isoProject(x1, y1, z,           rotRad),
        isoProject(x1, y1, z + FLOOR_H, rotRad),
        isoProject(x1, y0, z + FLOOR_H, rotRad),
      ];

      const key = `zone-${floor}-${zi}`;
      elements.push(
        <g key={key}>
          <polygon points={pointsStr(leftFace)}  fill={shadedColor(color, 0.75)} stroke="#fff" strokeWidth="0.5" />
          <polygon points={pointsStr(rightFace)} fill={shadedColor(color, 0.60)} stroke="#fff" strokeWidth="0.5" />
          <polygon points={pointsStr(topFace)}   fill={shadedColor(color, 0.90)} stroke="#fff" strokeWidth="0.5" />
          {/* Label on top face */}
          {(() => {
            const cx = (topFace[0][0] + topFace[1][0] + topFace[2][0] + topFace[3][0]) / 4;
            const cy = (topFace[0][1] + topFace[1][1] + topFace[2][1] + topFace[3][1]) / 4;
            return (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="bold" fill="#fff" opacity="0.9"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {zone.occupancyGroup}
              </text>
            );
          })()}
        </g>
      );
    }

    // Fire separation plane between floors
    const sep = separations.find(s =>
      (s.betweenFloors[0] === floor && s.betweenFloors[1] === floor + 1) ||
      (s.betweenFloors[1] === floor && s.betweenFloors[0] === floor + 1)
    );
    if (sep) {
      const sepZ = (floor + 1) * FLOOR_H;
      const px0 = -0.2, px1 = 4.2, py0 = -0.2, py1 = 2.2;
      const sepPlane = [
        isoProject(px0, py0, sepZ, rotRad),
        isoProject(px1, py0, sepZ, rotRad),
        isoProject(px1, py1, sepZ, rotRad),
        isoProject(px0, py1, sepZ, rotRad),
      ];
      const sepColor =
        sep.result === 'fail'     ? 'rgba(239,68,68,0.45)' :
        sep.result === 'advisory' ? 'rgba(245,158,11,0.45)' :
        'rgba(34,197,94,0.45)';
      const sepStroke =
        sep.result === 'fail'     ? '#EF4444' :
        sep.result === 'advisory' ? '#F59E0B' :
        '#22C55E';

      const cx = (sepPlane[0][0] + sepPlane[1][0]) / 2;
      const cy = (sepPlane[0][1] + sepPlane[1][1]) / 2 - 6;

      elements.push(
        <g key={`sep-${floor}`}>
          <polygon points={pointsStr(sepPlane)} fill={sepColor} stroke={sepStroke} strokeWidth="1" />
          <text x={cx} y={cy} textAnchor="middle" fontSize="8" fontFamily="monospace"
            fill={sepStroke} fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {sep.requiredFRR}min FRR
          </text>
        </g>
      );
    }
  }

  // Floor labels on the left
  const floorLabels: React.ReactNode[] = [];
  for (let floor = 0; floor < floorCount; floor++) {
    const z = floor * FLOOR_H + FLOOR_H / 2;
    const [lx, ly] = isoProject(-0.5, 1, z, rotRad);
    floorLabels.push(
      <text key={`lbl-${floor}`} x={lx - 4} y={ly} textAnchor="end"
        fontSize="9" fill="#6B7280" fontWeight="600"
        style={{ userSelect: 'none' }}
      >
        {floor === 0 ? 'G/F' : `L${floor + 1}`}
      </text>
    );
  }

  return (
    <div className="select-none">
      <svg
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {elements}
        {floorLabels}
        <text x={SVG_W / 2} y={SVG_H - 10} textAnchor="middle" fontSize="9" fill="#9CA3AF"
          style={{ userSelect: 'none' }}
        >
          Drag to rotate
        </text>
      </svg>
    </div>
  );
}
