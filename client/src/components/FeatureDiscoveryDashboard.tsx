/**
 * FeatureDiscoveryDashboard — semicircular arc carousel
 * Cards travel left → right along a curved arc.
 * Apex (largest card) is at horizontal center.
 * Hover pauses scroll and lifts hovered card.
 */

import { useLocation } from 'wouter';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Building2, FolderOpen, Calculator, Shield,
  History, ScanLine, CheckSquare, BarChart2, BookOpen,
} from 'lucide-react';

const FEATURES = [
  {
    id: 'occupancy',
    title: 'Occupancy Classifier',
    description: 'Classify building occupancy per NBC 2020, NBC(AE) 2023, BCBC 2024.',
    href: '/occupancy-classifier',
    icon: Building2,
    badge: null,
  },
  {
    id: 'drawing-analyzer',
    title: 'Drawing Analyzer',
    description: 'AI room detection, travel distance overlays, compliance heatmaps.',
    href: '/drawing-analyzer',
    icon: ScanLine,
    badge: 'AI',
  },
  {
    id: 'compliance',
    title: 'Compliance Engine',
    description: 'Deterministic pass/fail analysis with full rule traceability.',
    href: '/compliance',
    icon: CheckSquare,
    badge: null,
  },
  {
    id: 'projects',
    title: 'Project Management',
    description: 'Organize analyses by project with checklists and permit export.',
    href: '/project-checklists',
    icon: FolderOpen,
    badge: 'New',
  },
  {
    id: 'calculators',
    title: 'Professional Calculators',
    description: '34+ tools: span tables, drain sizing, egress windows, energy.',
    href: '/calculators',
    icon: Calculator,
    badge: '34+',
  },
  {
    id: 'analytics',
    title: 'Space Analyzer',
    description: 'LEED gap analysis, occupant load, spatial separation calculations.',
    href: '/space-analyzer',
    icon: BarChart2,
    badge: null,
  },
  {
    id: 'rules',
    title: 'Rule Management',
    description: 'Edit, version, and audit compliance rules across jurisdictions.',
    href: '/rule-management',
    icon: Shield,
    badge: 'Admin',
  },
  {
    id: 'history',
    title: 'Calculation History',
    description: 'Full audit trail of every compliance evaluation with snapshots.',
    href: '/calculation-history',
    icon: History,
    badge: 'New',
  },
  {
    id: 'docs',
    title: 'Documentation',
    description: 'NBC clauses, code references, and implementation guides.',
    href: '/documentation',
    icon: BookOpen,
    badge: null,
  },
] as const;

type FeatureId = (typeof FEATURES)[number]['id'];
type Badge = (typeof FEATURES)[number]['badge'];

const CARD_W          = 320;
const CARD_H          = 200;
const SPEED           = 0.006;
const ARC_HALF        = Math.PI * (35 / 180);  // 35° half-angle ≈ 0.611 rad
const ROTATION_FACTOR = 0.3;   // max tilt ≈ ±16° at opacity cutoff
const Y_OFFSET        = 150;   // shifts arc down so apex card lands within visible stage

function badgeClass(badge: NonNullable<Badge>): string {
  if (badge === 'AI')    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
  if (badge === 'New')   return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  if (badge === 'Admin') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
}

interface CardPos {
  x:        number;
  y:        number;
  scale:    number;
  z:        number;
  opacity:  number;
  rotation: number;
}

export function FeatureDiscoveryDashboard() {
  const [, navigate] = useLocation();
  const stageRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const [, forceUpdate] = useState(0);
  const cardPositions = useRef<CardPos[]>([]);
  const [hoveredId, setHoveredId] = useState<FeatureId | null>(null);

  const compute = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const W = stage.offsetWidth;
    const H = 420;
    const CX = W / 2;
    const R       = 2358;
    const SAGITTA = R - R * Math.cos(ARC_HALF);
    const CY      = H + (R - SAGITTA);
    const N = FEATURES.length;

    cardPositions.current = FEATURES.map((_, i) => {
      const t = (i + offsetRef.current) / N;
      const wrapped = ((t % 1) + 1.5) % 1 - 0.5;
      const angle = wrapped * 2 * ARC_HALF;
      const x = CX + R * Math.sin(angle) - CARD_W / 2;
      const y = CY - R * Math.cos(angle) - CARD_H / 2 + Y_OFFSET;
      const scale = 0.55 + 0.55 * Math.cos(angle * 0.9);
      const z = Math.round(scale * 100);
      const opacity  = Math.max(0, Math.min(1, 1 - Math.abs(angle) / (ARC_HALF * 1.3)));
      const rotation = angle * ROTATION_FACTOR * (180 / Math.PI);
      return { x, y, scale, z, opacity, rotation };
    });
  }, []);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (!pausedRef.current) {
        offsetRef.current = (offsetRef.current + SPEED) % FEATURES.length;
      }
      compute();
      frame++;
      if (frame % 2 === 0) forceUpdate(f => f + 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [compute]);

  const sortedIndices = FEATURES.map((_, i) => i).sort(
    (a, b) => (cardPositions.current[a]?.z ?? 0) - (cardPositions.current[b]?.z ?? 0),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Tools &amp; Features</h2>
        <span className="text-xs text-muted-foreground">{FEATURES.length} tools available</span>
      </div>

      {/* Arc stage */}
      <div
        ref={stageRef}
        className="relative overflow-hidden"
        style={{ height: 520 }}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; setHoveredId(null); }}
      >
        {sortedIndices.map(i => {
          const feature = FEATURES[i];
          const pos = cardPositions.current[i];
          if (!pos) return null;
          const isHovered = hoveredId === feature.id;
          const Icon = feature.icon;
          const liftY = isHovered ? -14 : 0;

          return (
            <div
              key={feature.id}
              onClick={() => pos.opacity > 0.3 && navigate(feature.href)}
              onMouseEnter={() => setHoveredId(feature.id as FeatureId)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'absolute',
                width: CARD_W,
                height: CARD_H,
                transform: `translate(${pos.x}px, ${pos.y + liftY}px) scale(${pos.scale.toFixed(3)}) rotate(${pos.rotation.toFixed(2)}deg)`,
                zIndex: pos.z,
                opacity: pos.opacity.toFixed(3) as unknown as number,
                pointerEvents: pos.opacity > 0.3 ? 'auto' : 'none',
                transformOrigin: 'center center',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                willChange: 'transform',
              }}
              className={[
                'bg-card border rounded-xl p-4',
                'flex flex-col justify-between cursor-pointer',
                isHovered
                  ? 'border-primary/40 shadow-lg shadow-black/10'
                  : 'border-border',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {feature.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass(feature.badge)}`}>
                    {feature.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight mb-1">
                  {feature.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {feature.description}
                </p>
              </div>
              <p className="text-[11px] font-medium text-primary">Open →</p>
            </div>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 pt-2 border-t border-border">
        {[
          { value: '42',     label: 'Occupancy types' },
          { value: '34+',    label: 'Calculators' },
          { value: 'AB + BC', label: 'Provinces covered' },
          { value: '100%',   label: 'Deterministic rules' },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className="text-xl font-semibold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureDiscoveryDashboard;
