import { useState, useEffect, useRef } from "react";
import { IsometricStackView, type OccupancyZone, type FireSeparation, type HallwayConfig, type WingSeparation, type WingData } from "./IsometricStackView";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, Info, Bot, Plus, Trash2, Building2, X, Layers, Flame, Circle, PenLine } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen = 1 | 2 | 'stackPlanner' | 3;

type Candidate = {
  code: string;
  name: string;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
};

type ClassifyResult = {
  candidates: Candidate[];
  mixedUseFlags: string[];
  ambiguityNotes: string;
  defaultToMoreRestrictive: boolean;
  modelVersion: string;
};

type ScoreResult = {
  code: string;
  ruleScore: number;
  sprinklersRequired: boolean;
  constructionRecommendation: string;
  part3Required: boolean;
  warnings: string[];
  nbcReferences: string[];
};

type CandidateWithScore = Candidate & {
  ruleScore?: number;
  combined: number;
  scoreResult?: ScoreResult;
};

interface StackZone {
  code: string;
  name: string;
  color: string;
  textColor: string;
  sprinklersRequired: boolean;
  part3Required: boolean;
  area_m2: number;
}

interface FloorLevel {
  id: string;
  zones: StackZone[];
}

interface Wing {
  id: string;
  label: string;
  floors: FloorLevel[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS = [
  "Office work",
  "Patient care",
  "Retail sales",
  "Food service",
  "Assembly/events",
  "Manufacturing",
  "Storage",
  "Residential living",
  "Detention/custody",
  "Education",
];

const OCCUPANCY_BADGE: Record<string, string> = {
  A: "bg-purple-100 text-purple-800 border-purple-200",
  B: "bg-red-100 text-red-800 border-red-200",
  C: "bg-blue-100 text-blue-800 border-blue-200",
  D: "bg-green-100 text-green-800 border-green-200",
  E: "bg-yellow-100 text-yellow-800 border-yellow-200",
  F: "bg-orange-100 text-orange-800 border-orange-200",
};

const RESTRICTIVENESS: Record<string, number> = {
  "B-1": 10, "B-2": 9, "B-3": 8,
  "A-1": 7, "F-1": 7, "A-2": 6,
  "A-3": 5, "C": 5, "A-4": 4, "F-2": 4,
  "D": 3, "E": 2, "F-3": 1,
};

const OCCUPANCY_VISUAL_DATA: Record<string, {
  color: string; textColor: string;
  sprinklersRequired: boolean; part3Required: boolean;
}> = {
  'A-1': { color: '#534AB7', textColor: '#EEEDFE', sprinklersRequired: true,  part3Required: true  },
  'A-2': { color: '#534AB7', textColor: '#EEEDFE', sprinklersRequired: true,  part3Required: true  },
  'A-3': { color: '#534AB7', textColor: '#EEEDFE', sprinklersRequired: true,  part3Required: true  },
  'A-4': { color: '#534AB7', textColor: '#EEEDFE', sprinklersRequired: true,  part3Required: true  },
  'B-1': { color: '#993556', textColor: '#FBEAF0', sprinklersRequired: true,  part3Required: true  },
  'B-2': { color: '#993556', textColor: '#FBEAF0', sprinklersRequired: true,  part3Required: true  },
  'B-3': { color: '#993556', textColor: '#FBEAF0', sprinklersRequired: true,  part3Required: true  },
  'C':   { color: '#0F6E56', textColor: '#E1F5EE', sprinklersRequired: false, part3Required: false },
  'D':   { color: '#185FA5', textColor: '#E6F1FB', sprinklersRequired: false, part3Required: false },
  'E':   { color: '#BA7517', textColor: '#FAEEDA', sprinklersRequired: false, part3Required: false },
  'F-1': { color: '#A32D2D', textColor: '#FCEBEB', sprinklersRequired: true,  part3Required: true  },
  'F-2': { color: '#633806', textColor: '#FAEEDA', sprinklersRequired: false, part3Required: true  },
  'F-3': { color: '#3B6D11', textColor: '#EAF3DE', sprinklersRequired: false, part3Required: false },
};

const ALL_NBC_CODES: { code: string; name: string }[] = [
  { code: 'A-1', name: 'Theatre & Entertainment' },
  { code: 'A-2', name: 'Restaurant & Arena'      },
  { code: 'A-3', name: 'Museum & Library'         },
  { code: 'A-4', name: 'Open Air Assembly'        },
  { code: 'B-1', name: 'Detention Occupancy'      },
  { code: 'B-2', name: 'Care & Treatment'         },
  { code: 'B-3', name: 'Care Occupancy'           },
  { code: 'C',   name: 'Residential'              },
  { code: 'D',   name: 'Business & Services'      },
  { code: 'E',   name: 'Mercantile'               },
  { code: 'F-1', name: 'High-Hazard Industrial'   },
  { code: 'F-2', name: 'Medium-Hazard Industrial' },
  { code: 'F-3', name: 'Low-Hazard Industrial'    },
];

// ── Pure helpers ──────────────────────────────────────────────────────────────

function badgeClass(code: string): string {
  return OCCUPANCY_BADGE[code.charAt(0)] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

function mostRestrictiveCode(candidates: Candidate[]): string {
  return candidates.reduce((max, c) =>
    (RESTRICTIVENESS[c.code] ?? 0) > (RESTRICTIVENESS[max.code] ?? 0) ? c : max
  ).code;
}

function getFireSeparation(codeA: string, codeB: string): {
  frr: string; hours: number; color: string; bgColor: string; nbcRef: string;
} {
  const a = codeA.split('-')[0];
  const b = codeB.split('-')[0];

  if (a === 'B' || b === 'B')
    return { frr: '2 hr', hours: 2, color: '#A32D2D', bgColor: '#FCEBEB', nbcRef: 'NBC 3.1.3.4' };
  if (a === 'A' || b === 'A')
    return { frr: '2 hr', hours: 2, color: '#A32D2D', bgColor: '#FCEBEB', nbcRef: 'NBC 3.1.3.4' };
  if (codeA === 'F-1' || codeB === 'F-1')
    return { frr: '2 hr', hours: 2, color: '#A32D2D', bgColor: '#FCEBEB', nbcRef: 'NBC 3.1.3.4' };

  const pair = [a, b].sort().join('-');
  if (pair === 'C-E' || pair === 'D-F' || pair === 'E-F')
    return { frr: '1 hr', hours: 1, color: '#BA7517', bgColor: '#FAEEDA', nbcRef: 'NBC 3.1.3.4' };

  return { frr: '45 min', hours: 0.75, color: '#639922', bgColor: '#EAF3DE', nbcRef: 'NBC 3.1.3.4' };
}

function getMaxFloorSeparation(zonesA: StackZone[], zonesB: StackZone[]): ReturnType<typeof getFireSeparation> {
  let best = getFireSeparation(zonesA[0]?.code ?? 'D', zonesB[0]?.code ?? 'D');
  for (const a of zonesA) {
    for (const b of zonesB) {
      const sep = getFireSeparation(a.code, b.code);
      if (sep.hours > best.hours) best = sep;
    }
  }
  return best;
}

function makeStackZone(code: string): StackZone | null {
  const visual = OCCUPANCY_VISUAL_DATA[code];
  const entry = ALL_NBC_CODES.find(c => c.code === code);
  if (!visual || !entry) return null;
  return { code, name: entry.name, ...visual, area_m2: 100 };
}

// ── Hallway / corridor helpers ─────────────────────────────────────────────────

const NBC_MIN_CORRIDOR_WIDTH_MM = 1100;
const CORRIDOR_CITATION = 'NBC 2023 s.3.3.1.7';

const CORRIDOR_FRR_RULES: Record<string, number> = {
  'A-1': 45, 'A-2': 45, 'A-3': 45, 'A-4': 45,
  'B-1': 45, 'B-2': 45, 'B-3': 45,
  'C': 45,
  'D': 0,
  'E': 45,
  'F-1': 45, 'F-2': 45, 'F-3': 0,
};

interface HallwaySeparation {
  hallwayIdx: number;
  floorIndex: number | 'all';
  side: 'left' | 'right';
  adjacentOccupancy: string;
  requiredFRR: number;
  citation: string;
  widthMm: number;
  widthCompliant: boolean;
  result: 'pass' | 'fail' | 'advisory';
}

function calculateHallwaySeparations(
  hallways: HallwayConfig[],
  floors: FloorLevel[],
): HallwaySeparation[] {
  const results: HallwaySeparation[] = [];
  for (let hi = 0; hi < hallways.length; hi++) {
    const hw = hallways[hi];
    const floorIndices: number[] = hw.floorIndex === 'all'
      ? floors.map((_, i) => i)
      : [(hw.floorIndex as number)];

    for (const fi of floorIndices) {
      const floor = floors[fi];
      if (!floor) continue;
      const total = floor.zones.reduce((s, z) => s + z.area_m2, 0) || 1;
      const posU = (hw.positionPct / 100) * 4;
      const widthU = Math.max(hw.widthMm / 5000, 0.12);

      let xOff = 0;
      for (const zone of floor.zones) {
        const w = (zone.area_m2 / total) * 4;
        const x0 = xOff, x1 = xOff + w;
        xOff += w;

        const isLeft  = x0 < posU;
        const isRight = x1 > posU + widthU;
        const side = isLeft ? 'left' : (isRight ? 'right' : null);
        if (!side) continue;

        const frr = CORRIDOR_FRR_RULES[zone.code] ?? 0;
        const widthCompliant = hw.widthMm >= NBC_MIN_CORRIDOR_WIDTH_MM;
        results.push({
          hallwayIdx: hi,
          floorIndex: hw.floorIndex,
          side,
          adjacentOccupancy: zone.code,
          requiredFRR: frr,
          citation: CORRIDOR_CITATION,
          widthMm: hw.widthMm,
          widthCompliant,
          result: !widthCompliant ? 'fail' : frr === 0 ? 'pass' : 'advisory',
        });
      }
    }
  }
  return results;
}

// ── Fire Separation Panel ─────────────────────────────────────────────────────

function FireSeparationPanel({ projectId }: { projectId: number }) {
  const [, setLocation] = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data } = trpc.permitPackage.getFireSeparationStatus.useQuery(
    { projectId },
    { enabled: projectId > 0, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("highlight") === "missing-separations" && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [data]);

  if (!data?.pairs.length) return null;

  const missing      = data.pairs.filter(p => p.status === "missing");
  const compliant    = data.pairs.filter(p => p.status === "compliant");

  return (
    <div ref={panelRef} className="rounded-lg border border-border p-4 space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Fire Separation Required
        </h3>
        <Badge variant={missing.length > 0 ? "destructive" : "secondary"} className="text-xs">
          {compliant.length}/{data.pairs.length} drawn
        </Badge>
      </div>

      <div className="space-y-1.5">
        {data.pairs.map((pair, i) => (
          <div key={i} className={`flex items-center justify-between p-2 rounded text-xs ${
            pair.status === "compliant"     ? "bg-green-50 border border-green-100" :
            pair.status === "non_compliant" ? "bg-red-50 border border-red-100"    :
                                              "bg-amber-50 border border-amber-100"
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {pair.status === "compliant"     && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />}
              {pair.status === "non_compliant" && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
              {pair.status === "missing"       && <Circle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              <span className="font-medium truncate">{pair.labelA} / {pair.labelB}</span>
              <span className="text-muted-foreground shrink-0">Grp {pair.groupA}+{pair.groupB}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                pair.status === "compliant" ? "bg-green-100 text-green-800" : "bg-slate-100"
              }`}>
                {pair.drawn != null ? `${pair.drawn}hr` : "—"} / {pair.required}hr
              </span>
              {pair.wallCode && (
                <span className="font-mono text-xs bg-slate-200 px-1 rounded">{pair.wallCode}</span>
              )}
              {pair.status !== "compliant" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={() => setLocation(
                    `/drawing-analyzer?autoFrr=${pair.required}&pairA=${pair.groupA}&pairB=${pair.groupB}&pairLabel=${encodeURIComponent(pair.labelA + "/" + pair.labelB)}`
                  )}
                >
                  Draw {pair.required}hr →
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => setLocation(`/drawing-analyzer?highlight=fire-walls`)}
      >
        <PenLine className="w-3.5 h-3.5 mr-1.5" />
        Open Drawing Analyzer — Fire Wall Mode
      </Button>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface OccupancyAdvisorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  province?: string;
  onConfirm?: (
    occupancyCode: string,
    stackData?: {
      separations: Array<{
        from: string; to: string;
        frr: string; hours: number; nbcRef: string;
      }>;
      wings: Array<{
        id: string; label: string;
        floors: Array<{ zones: Array<{ code: string; area_m2: number }> }>;
      }>;
    }
  ) => void;
  initialArea?: number;
  initialStoreys?: number;
  projectId?: number;
  projectName?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OccupancyAdvisor({
  open,
  onOpenChange,
  province = "",
  onConfirm,
  initialArea,
  initialStoreys,
  projectId,
  projectName,
}: OccupancyAdvisorProps) {
  const [screen, setScreen] = useState<Screen>(1);

  // Screen 1 form
  const [buildingDescription, setBuildingDescription] = useState("");
  const [primaryUse, setPrimaryUse] = useState("");
  const [activities, setActivities] = useState<string[]>([]);
  const [occupantBehavior, setOccupantBehavior] = useState("");
  const [hazardLevel, setHazardLevel] = useState("");
  const [estimatedArea, setEstimatedArea] = useState(initialArea?.toString() ?? "");
  const [storeysStr, setStoreysStr] = useState(initialStoreys?.toString() ?? "");
  const [isMixedUse, setIsMixedUse] = useState(false);
  const [mixedUseZones, setMixedUseZones] = useState<{ use: string; area: string }[]>([]);
  const [selectedProvince, setSelectedProvince] = useState(province);
  const [classifyError, setClassifyError] = useState("");

  // Screen 2 results
  const [classifyResult, setClassifyResult] = useState<ClassifyResult | null>(null);
  const [ruleScores, setRuleScores] = useState<Record<string, ScoreResult>>({});
  const [scoreCount, setScoreCount] = useState(0);
  const [selectedCode, setSelectedCode] = useState("");

  // Screen 2.5 stack planner
  const [wings, setWings] = useState<Wing[]>([{ id: 'wing-0', label: 'Wing A', floors: [] }]);
  const [activeWingId, setActiveWingId] = useState<string>('wing-0');
  const [stackOrientation, setStackOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [stackView, setStackView] = useState<'flat' | 'isometric'>('flat');
  const [hallways, setHallways] = useState<HallwayConfig[]>([]);
  const [hallwayToolActive, setHallwayToolActive] = useState(false);
  const [draggingCode, setDraggingCode] = useState<string | null>(null);
  const [splitFloorIndex, setSplitFloorIndex] = useState<number | null>(null);

  // Screen 3 confirmation
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  // Sync prop values into form state whenever the dialog opens or the target project changes.
  // useState initial values only capture props at first mount, so re-sync is needed here.
  useEffect(() => {
    if (open) {
      setEstimatedArea(initialArea?.toString() ?? "");
      setStoreysStr(initialStoreys?.toString() ?? "");
      setSelectedProvince(province ?? "");
    }
  }, [open, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutations ────────────────────────────────────────────────────────────────

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Occupancy classification saved to project");
    },
  });

  const scoreMutation = trpc.occupancyAdvisor.scoreCandidate.useMutation({
    onSuccess: (data) => {
      setRuleScores(prev => ({ ...prev, [data.code]: data }));
      setScoreCount(prev => prev + 1);
    },
  });

  const classifyMutation = trpc.occupancyAdvisor.classify.useMutation({
    onSuccess: (data) => {
      setClassifyResult(data);
      setSelectedCode(data.candidates[0]?.code ?? "");
      setRuleScores({});
      setScoreCount(0);
      setScreen(2);
      const area = parseFloat(estimatedArea) || 500;
      const storeysNum = parseInt(storeysStr) || 1;
      data.candidates.forEach((c: any) => {
        scoreMutation.mutate({ code: c.code, area, storeys: storeysNum, province: selectedProvince });
      });
    },
    onError: (err) => {
      setClassifyError(err.message || "Analysis failed. Please try again.");
    },
  });

  const saveStackMutation = trpc.projects.update.useMutation({
    onError: () => console.warn('[OccupancyAdvisor] Failed to save stack data'),
  });

  // ── Wing helpers ─────────────────────────────────────────────────────────────

  const activeWing = wings.find(w => w.id === activeWingId) ?? wings[0];
  const floors = activeWing?.floors ?? [];

  function updateActiveWingFloors(updater: (prev: FloorLevel[]) => FloorLevel[]) {
    setWings(prev => prev.map(w =>
      w.id === activeWingId ? { ...w, floors: updater(w.floors) } : w
    ));
  }

  function addWing() {
    const WING_LABELS = ['Wing A', 'Wing B', 'Wing C', 'Wing D'];
    const newId = `wing-${Date.now()}`;
    const label = WING_LABELS[wings.length] ?? `Wing ${wings.length + 1}`;
    setWings(prev => [...prev, { id: newId, label, floors: [] }]);
    setActiveWingId(newId);
  }

  function removeActiveWing() {
    if (wings.length <= 1) return;
    const idx = wings.findIndex(w => w.id === activeWingId);
    const newWings = wings.filter(w => w.id !== activeWingId);
    setWings(newWings);
    setActiveWingId(newWings[Math.max(0, idx - 1)].id);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function toggleActivity(a: string) {
    setActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  function addMixedUseZone() {
    setMixedUseZones(prev => [...prev, { use: "", area: "" }]);
  }

  function removeMixedUseZone(i: number) {
    setMixedUseZones(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateMixedUseZone(i: number, field: "use" | "area", value: string) {
    setMixedUseZones(prev => prev.map((z, idx) => idx === i ? { ...z, [field]: value } : z));
  }

  // Add a new floor (storey) containing one zone — targets active wing
  function addFloorFromCode(code: string) {
    const zone = makeStackZone(code);
    if (!zone) return;
    updateActiveWingFloors(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, zones: [zone] }]);
  }

  // Add a zone alongside existing zones on a given floor — targets active wing
  function addZoneToFloor(floorIdx: number, code: string) {
    const zone = makeStackZone(code);
    if (!zone) return;
    updateActiveWingFloors(prev => prev.map((f, i) =>
      i === floorIdx ? { ...f, zones: [...f.zones, zone] } : f
    ));
    setSplitFloorIndex(null);
  }

  // Remove a zone; removes the whole floor if it was the last zone — targets active wing
  function removeZoneFromFloor(floorIdx: number, zoneIdx: number) {
    updateActiveWingFloors(prev => {
      const floor = prev[floorIdx];
      if (floor.zones.length <= 1) return prev.filter((_, i) => i !== floorIdx);
      return prev.map((f, i) =>
        i === floorIdx ? { ...f, zones: f.zones.filter((_, zi) => zi !== zoneIdx) } : f
      );
    });
  }

  function updateZoneArea(floorIdx: number, zoneIdx: number, area: number) {
    updateActiveWingFloors(prev => prev.map((f, fi) =>
      fi === floorIdx
        ? { ...f, zones: f.zones.map((z, zi) => zi === zoneIdx ? { ...z, area_m2: Math.max(10, area) } : z) }
        : f
    ));
  }

  function addHallway() {
    const isWingScoped = stackView === 'isometric' && stackOrientation === 'vertical' && wings.length > 1;
    setHallways(prev => [...prev, {
      floorIndex: 'all', positionPct: 50, widthMm: 1200, orientation: 'horizontal',
      ...(isWingScoped ? { wingId: activeWingId } : {}),
    }]);
  }
  function updateHallway(idx: number, patch: Partial<HallwayConfig>) {
    setHallways(prev => prev.map((h, i) => i === idx ? { ...h, ...patch } : h));
  }
  function removeHallway(idx: number) {
    setHallways(prev => prev.filter((_, i) => i !== idx));
  }

  function handleGoToStackPlanner() {
    if (floors.length === 0 && candidatesWithScores.length >= 2) {
      const c0 = candidatesWithScores[0];
      const c1 = candidatesWithScores[1];
      const v0 = OCCUPANCY_VISUAL_DATA[c0.code] ?? { color: '#6B7280', textColor: '#fff', sprinklersRequired: false, part3Required: false };
      const v1 = OCCUPANCY_VISUAL_DATA[c1.code] ?? { color: '#6B7280', textColor: '#fff', sprinklersRequired: false, part3Required: false };
      updateActiveWingFloors(() => [
        { id: '1', zones: [{ code: c0.code, name: c0.name, ...v0, area_m2: 100 }] },
        { id: '2', zones: [{ code: c1.code, name: c1.name, ...v1, area_m2: 100 }] },
      ]);
    }
    setScreen('stackPlanner');
  }

  function handleAnalyze() {
    setClassifyError("");
    classifyMutation.mutate({
      buildingDescription: buildingDescription.trim(),
      primaryUse: primaryUse.trim(),
      activities,
      occupantBehavior,
      hazardLevel,
      estimatedArea: parseFloat(estimatedArea) || 500,
      storeys: parseInt(storeysStr) || 1,
      isMixedUse,
      mixedUseZones: isMixedUse
        ? mixedUseZones.map(z => ({ use: z.use, area: parseFloat(z.area) || 0 }))
        : undefined,
      province: selectedProvince,
    });
  }

  function handleConfirm() {
    if (projectId) {
      updateProjectMutation.mutate({ id: projectId, occupancyCode: selectedCode });
    }

    let stackData: Parameters<NonNullable<typeof onConfirm>>[1] | undefined;

    if (allStackZones.length > 0) {
      const floorSeparations = floors.slice(0, -1).map((floor, i) => ({
        from: floor.zones.map((z: any) => z.code).join('/'),
        to: floors[i + 1].zones.map((z: any) => z.code).join('/'),
        ...getMaxFloorSeparation(floor.zones, floors[i + 1].zones),
      }));

      stackData = {
        separations: floorSeparations.map(s => ({
          from: s.from, to: s.to, frr: s.frr, hours: s.hours, nbcRef: s.nbcRef,
        })),
        wings: wings.map((w: any) => ({
          id: w.id, label: w.label,
          floors: (w.floors ?? []).map((f: any) => ({
            zones: (f.zones ?? []).map((z: any) => ({ code: z.code, area_m2: z.area_m2 ?? 0 })),
          })),
        })),
      };

      if (projectId) {
        saveStackMutation.mutate({
          id: projectId,
          stackSeparationsJson: stackData.separations,
          stackWingsJson: stackData.wings,
          stackConfirmedAt: new Date(),
        });
      }
    }

    onConfirm?.(selectedCode, stackData);
    handleClose();
  }

  function handleClose() {
    onOpenChange(false);
  }

  function resetAll() {
    setScreen(1);
    setBuildingDescription(""); setPrimaryUse(""); setActivities([]);
    setOccupantBehavior(""); setHazardLevel("");
    setEstimatedArea(initialArea?.toString() ?? "");
    setStoreysStr(initialStoreys?.toString() ?? "");
    setIsMixedUse(false); setMixedUseZones([]);
    setSelectedProvince(province);
    setClassifyError("");
    setClassifyResult(null); setRuleScores({}); setScoreCount(0); setSelectedCode("");
    setWings([{ id: 'wing-0', label: 'Wing A', floors: [] }]); setActiveWingId('wing-0');
    setStackOrientation('vertical'); setDraggingCode(null); setSplitFloorIndex(null);
    setChecked1(false); setChecked2(false); setChecked3(false);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const formValid =
    buildingDescription.trim().length >= 10 && !!occupantBehavior && !!hazardLevel;

  const candidatesWithScores: CandidateWithScore[] = (classifyResult?.candidates ?? []).map(c => {
    const score = ruleScores[c.code];
    const combined = score
      ? Math.round(c.confidence * 100 * 0.4 + score.ruleScore * 0.6)
      : Math.round(c.confidence * 100 * 0.4);
    return { ...c, ruleScore: score?.ruleScore, combined, scoreResult: score };
  }).sort((a, b) => b.combined - a.combined);

  const topRestrictive = classifyResult
    ? mostRestrictiveCode(classifyResult.candidates)
    : "";

  const confirmEnabled = checked1 && checked2 && checked3 && !!selectedCode;

  const allStackZones = wings.flatMap(w => w.floors.flatMap(f => f.zones));
  const governingStackCode = allStackZones.length > 0
    ? allStackZones.reduce((max, z) =>
        (RESTRICTIVENESS[z.code] ?? 0) > (RESTRICTIVENESS[max.code] ?? 0) ? z : max
      ).code
    : '';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAll();
        onOpenChange(o);
      }}
    >
      <DialogContent className={`${screen === 'stackPlanner' ? 'max-w-3xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Occupancy Advisor — AI-Assisted Classification
          </DialogTitle>
          <DialogDescription>
            AI suggestions only — must be confirmed by a licensed professional.
          </DialogDescription>
        </DialogHeader>

        {/* Disclaimer banner */}
        <div className="flex items-start gap-2 p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>AI suggestion only.</strong> This tool does not replace professional judgment.
            A licensed architect or engineer must confirm all occupancy classifications before use in permit submissions.
          </span>
        </div>

        {/* Project name banner */}
        {projectName && (
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-medium text-blue-800">Classifying: {projectName}</span>
          </div>
        )}

        {/* ── Screen 1: Form ── */}
        {screen === 1 && (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="oa-desc">Building Description *</Label>
              <Textarea
                id="oa-desc"
                placeholder="Describe the building's primary purpose and intended use in detail..."
                value={buildingDescription}
                onChange={e => setBuildingDescription(e.target.value)}
                rows={3}
              />
              {buildingDescription.length > 0 && buildingDescription.length < 10 && (
                <p className="text-xs text-amber-600">Please provide at least 10 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="oa-use">Primary Use</Label>
              <Input
                id="oa-use"
                placeholder="e.g. Medical clinic, Retail store, Office building"
                value={primaryUse}
                onChange={e => setPrimaryUse(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Activities (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {ACTIVITY_OPTIONS.map(a => (
                  <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activities.includes(a)}
                      onChange={() => toggleActivity(a)}
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Occupant Behavior *</Label>
              <div className="space-y-1.5">
                {[
                  { value: "Transient visitors",  desc: "Short-stay public (retail, assembly)" },
                  { value: "Regular employees",   desc: "Daily workers (office, industrial)" },
                  { value: "Residents/overnight", desc: "Sleep on premises (residential, hotel)" },
                  { value: "Detained/supervised", desc: "Cannot self-evacuate (hospital, prison)" },
                  { value: "Mixed",               desc: "Combination of the above" },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-2.5 border rounded cursor-pointer transition-colors ${
                      occupantBehavior === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="occupantBehavior"
                      value={opt.value}
                      checked={occupantBehavior === opt.value}
                      onChange={() => setOccupantBehavior(opt.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{opt.value}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hazard Level *</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "Low",    desc: "Office, retail, residential" },
                  { value: "Medium", desc: "Workshop, lab, food processing" },
                  { value: "High",   desc: "Chemical, explosive, flammable storage" },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex flex-col gap-1 p-3 border rounded cursor-pointer transition-colors text-center ${
                      hazardLevel === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="hazardLevel"
                      value={opt.value}
                      checked={hazardLevel === opt.value}
                      onChange={() => setHazardLevel(opt.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold">{opt.value}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="oa-area">Estimated Area m²</Label>
                <Input
                  id="oa-area"
                  type="number"
                  placeholder="e.g. 500"
                  value={estimatedArea}
                  onChange={e => setEstimatedArea(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oa-storeys">Storeys</Label>
                <Input
                  id="oa-storeys"
                  type="number"
                  placeholder="e.g. 3"
                  min="1"
                  value={storeysStr}
                  onChange={e => setStoreysStr(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMixedUse}
                  onChange={e => setIsMixedUse(e.target.checked)}
                />
                <span className="text-sm font-medium">This building has multiple distinct uses (mixed-use)</span>
              </label>
              {isMixedUse && (
                <div className="space-y-2 pl-5">
                  {mixedUseZones.map((zone, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder="Use description"
                        value={zone.use}
                        onChange={e => updateMixedUseZone(i, "use", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Area m²"
                        type="number"
                        value={zone.area}
                        onChange={e => updateMixedUseZone(i, "area", e.target.value)}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMixedUseZone(i)}
                        className="h-8 w-8 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addMixedUseZone} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Use Zone
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="oa-province">Province</Label>
              <select
                id="oa-province"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                value={selectedProvince}
                onChange={e => setSelectedProvince(e.target.value)}
              >
                <option value="">Not specified</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="ON">Ontario</option>
                <option value="SK">Saskatchewan</option>
                <option value="MB">Manitoba</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {classifyError && (
              <div className="flex items-start gap-2 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{classifyError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleAnalyze}
                disabled={!formValid || classifyMutation.isPending}
              >
                {classifyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Analyze Building
              </Button>
            </div>
          </div>
        )}

        {/* ── Fire Separation Panel (shown when project has rooms) ── */}
        {projectId && <FireSeparationPanel projectId={projectId} />}

        {/* ── Screen 2: Candidates ── */}
        {screen === 2 && (
          <div className="space-y-4 mt-2">
            {classifyMutation.isPending ? (
              <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing building description...</span>
              </div>
            ) : (
              <>
                {projectName && (
                  <p className="text-sm font-semibold text-gray-700">Results for {projectName}</p>
                )}

                {classifyResult?.modelVersion && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    Analysis by {classifyResult.modelVersion}
                  </p>
                )}

                {classifyResult?.ambiguityNotes && (
                  <div className="flex items-start gap-2 p-3 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{classifyResult.ambiguityNotes}</span>
                  </div>
                )}

                {candidatesWithScores.length > 1 && classifyResult?.defaultToMoreRestrictive && (
                  <div className="flex items-start gap-2 p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      When in doubt, apply the more restrictive classification (NBC 3.1.2.1).
                      <strong> {topRestrictive}</strong> is the most restrictive candidate.
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  {candidatesWithScores.map((c, rank) => (
                    <div
                      key={c.code}
                      onClick={() => setSelectedCode(c.code)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedCode === c.code
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold px-2.5 py-1 rounded border font-mono ${badgeClass(c.code)}`}>
                            {c.code}
                          </span>
                          <div>
                            <p className="font-semibold text-sm">{c.name}</p>
                            {rank === 0 && (
                              <Badge className="bg-green-100 text-green-800 text-[10px] mt-0.5">Top match</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">Combined score</p>
                          <p className="text-xl font-bold text-primary">{c.combined}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-20 shrink-0">AI confidence</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${c.confidence * 100}%` }} />
                          </div>
                          <span className="w-8 text-right font-medium">{Math.round(c.confidence * 100)}%</span>
                        </div>
                        {c.ruleScore !== undefined ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground w-20 shrink-0">Rule score</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-400 rounded-full" style={{ width: `${c.ruleScore}%` }} />
                            </div>
                            <span className="w-8 text-right font-medium">{c.ruleScore}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Scoring rules...</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">{c.reasoning}</p>

                      <ul className="space-y-0.5 mb-3">
                        {c.keyFactors.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {c.scoreResult && (
                        <div className="pt-3 border-t border-border space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={c.scoreResult.sprinklersRequired ? "bg-red-100 text-red-800 text-xs" : "bg-green-100 text-green-800 text-xs"}>
                              {c.scoreResult.sprinklersRequired ? "Sprinklers Required" : "Sprinklers Not Required"}
                            </Badge>
                            <Badge className={c.scoreResult.part3Required ? "bg-orange-100 text-orange-800 text-xs" : "bg-blue-100 text-blue-800 text-xs"}>
                              {c.scoreResult.part3Required ? "Part 3" : "Part 9"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{c.scoreResult.constructionRecommendation}</p>
                          {c.scoreResult.warnings.length > 0 && (
                            <div className="space-y-1">
                              {c.scoreResult.warnings.slice(0, 2).map((w, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                  <span>{w}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {c.scoreResult.nbcReferences.slice(0, 4).join(" · ")}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {classifyResult?.mixedUseFlags && classifyResult.mixedUseFlags.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mixed Use Considerations</p>
                    {classifyResult.mixedUseFlags.map((flag, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Fire separation requirements between occupancies: refer to NBC Table 3.1.7.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between gap-2 pt-2 border-t">
                    <Button variant="ghost" onClick={() => setScreen(1)}>← Back</Button>
                    <Button
                      onClick={() => (isMixedUse || candidatesWithScores.length > 1) ? handleGoToStackPlanner() : setScreen(3)}
                      disabled={!selectedCode}
                    >
                      {(isMixedUse || candidatesWithScores.length > 1) ? (
                        <><Layers className="w-4 h-4 mr-2" />Plan Mixed Use Stack →</>
                      ) : (
                        <>Confirm Selection → {selectedCode}</>
                      )}
                    </Button>
                  </div>
                  {!isMixedUse && candidatesWithScores.length > 1 && (
                    <p className="text-xs text-amber-600 text-right">
                      ⚠ Multiple occupancy types detected — stack planner recommended
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Screen 2.5: Mixed Use Stack Planner ── */}
        {screen === 'stackPlanner' && (() => {
          const allZones = wings.flatMap(w => w.floors.flatMap(f => f.zones));
          const totalArea = allZones.reduce((sum, z) => sum + z.area_m2, 0) || 1;

          // Floor-to-floor separation schedule for the active wing
          const floorSepSchedule = floors.slice(0, -1).map((floor, i) => ({
            interfaceLabel: `Floor ${i + 1} → Floor ${i + 2}`,
            zonesA: floor.zones,
            zonesB: floors[i + 1].zones,
            ...getMaxFloorSeparation(floor.zones, floors[i + 1].zones),
          }));

          // Flags
          const stackFlags: { severity: 'critical' | 'warning' | 'info'; message: string }[] = [];
          const sprinklerTrigger = allZones.find(z => z.sprinklersRequired);
          if (sprinklerTrigger) {
            stackFlags.push({ severity: 'critical', message: `Sprinkler system required throughout building (NBC 3.2.5.2) — ${sprinklerTrigger.code} triggers this requirement` });
          }
          if (stackOrientation === 'vertical' && floors.length > 2) {
            stackFlags.push({ severity: 'warning', message: 'Vertical shafts (stairs, elevators, mechanical) must be fire-separated per NBC 3.6' });
          }
          if (allZones.some(z => z.code.startsWith('B'))) {
            stackFlags.push({ severity: 'critical', message: 'Group B requires 2-hour separation from all other occupancies (NBC 3.1.3.4)' });
          }
          if (allZones.some(z => z.part3Required)) {
            stackFlags.push({ severity: 'warning', message: 'Part 3 provisions apply — verify limits in NBC Table 3.2.2.70' });
          }
          if (stackOrientation === 'horizontal' && allZones.length > 1) {
            stackFlags.push({ severity: 'info', message: 'Each occupancy zone requires independent means of egress (NBC 3.4.1)' });
          }

          const constructionRec = allZones.some(z =>
            z.code.startsWith('B') || z.code.startsWith('A') || z.code === 'F-1'
          ) ? 'Non-Combustible required' : 'Combustible may be acceptable — verify limits';

          const governingVisual = governingStackCode ? OCCUPANCY_VISUAL_DATA[governingStackCode] : null;

          // Inline area input style
          const areaInputStyle = (transparent?: boolean): React.CSSProperties => ({
            width: '60px', fontSize: '11px',
            background: transparent ? 'transparent' : undefined,
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'inherit', borderRadius: '4px', padding: '2px 4px', textAlign: 'center',
          });

          return (
            <div className="space-y-4 mt-2">
              <div>
                <p className="text-sm font-semibold">Mixed Use Stack Planner</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Arrange occupancy zones to calculate fire separation requirements between each interface.
                  In vertical mode, use + to split a floor into side-by-side zones.
                </p>
              </div>

              {/* Orientation + view toggles + isometric tools */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Layout:</span>
                  <div className="flex rounded border overflow-hidden text-xs">
                    <button
                      className={`px-3 py-1.5 transition-colors ${stackOrientation === 'vertical' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
                      onClick={() => setStackOrientation('vertical')}
                    >
                      Vertical Stack
                    </button>
                    <button
                      className={`px-3 py-1.5 transition-colors border-l ${stackOrientation === 'horizontal' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`}
                      onClick={() => setStackOrientation('horizontal')}
                    >
                      Horizontal Adjacent
                    </button>
                  </div>
                </div>
                <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                  <button
                    onClick={() => setStackView('flat')}
                    className={`px-3 py-1.5 transition-colors ${stackView === 'flat' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'}`}
                  >
                    Flat
                  </button>
                  <button
                    onClick={() => setStackView('isometric')}
                    className={`px-3 py-1.5 transition-colors border-l ${stackView === 'isometric' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'}`}
                  >
                    ⬡ Isometric
                  </button>
                </div>
                {stackView === 'isometric' && stackOrientation === 'vertical' && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {wings.map(w => (
                      <button
                        key={w.id}
                        onClick={() => setActiveWingId(w.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          w.id === activeWingId
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                    <button
                      onClick={addWing}
                      disabled={wings.length >= 4}
                      className="px-2 py-1 rounded text-xs border border-dashed border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
                      title="Add wing (max 4)"
                    >
                      + Wing
                    </button>
                    {wings.length > 1 && (
                      <button
                        onClick={removeActiveWing}
                        className="px-2 py-1 rounded text-xs border border-red-200 text-red-500 hover:bg-red-50"
                        title={`Remove ${activeWing?.label}`}
                      >
                        − Remove
                      </button>
                    )}
                  </div>
                )}
                {stackView === 'isometric' && (
                  <Button
                    variant={hallwayToolActive ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setHallwayToolActive(h => !h)}
                  >
                    🚶 Set Hallway
                  </Button>
                )}
              </div>

              {/* Hallway configuration panel */}
              {stackView === 'isometric' && hallwayToolActive && (() => {
                const visibleHallways = hallways
                  .map((hw, idx) => ({ hw, idx }))
                  .filter(({ hw }) => !hw.wingId || hw.wingId === activeWingId);
                const isWingScoped = stackOrientation === 'vertical' && wings.length > 1;
                return (
                <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Hallway Configuration{isWingScoped ? ` — ${activeWing?.label}` : ''}
                    </span>
                    <Button variant="ghost" size="sm" onClick={addHallway} className="text-xs h-7">+ Add Hallway</Button>
                  </div>
                  {visibleHallways.length === 0 && (
                    <p className="text-xs text-muted-foreground">Click "+ Add Hallway" to insert a corridor cut.</p>
                  )}
                  {visibleHallways.map(({ hw, idx }) => (
                    <div key={idx} className="space-y-2 border-t pt-2 first:border-t-0 first:pt-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-16">Floor:</span>
                        <select
                          value={hw.floorIndex === 'all' ? 'all' : hw.floorIndex}
                          onChange={e => updateHallway(idx, {
                            floorIndex: e.target.value === 'all' ? 'all' : parseInt(e.target.value),
                          })}
                          className="text-xs border rounded px-2 py-1 bg-background"
                        >
                          <option value="all">All floors</option>
                          {floors.map((_, fi) => (
                            <option key={fi} value={fi}>
                              {fi === 0 ? 'Ground Floor' : `Floor ${fi + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-16">Position:</span>
                        <input
                          type="range" min={5} max={95} step={1}
                          value={hw.positionPct}
                          onChange={e => updateHallway(idx, { positionPct: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="w-8 text-right">{hw.positionPct}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-16">Width:</span>
                        <input
                          type="range" min={900} max={3000} step={100}
                          value={hw.widthMm}
                          onChange={e => updateHallway(idx, { widthMm: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="w-16 text-right">{hw.widthMm}mm</span>
                      </div>
                      <p className={`text-[10px] ${hw.widthMm < NBC_MIN_CORRIDOR_WIDTH_MM ? 'text-red-600' : 'text-green-600'}`}>
                        {hw.widthMm < NBC_MIN_CORRIDOR_WIDTH_MM
                          ? `⚠ Below NBC 3.3.1.2 minimum (${NBC_MIN_CORRIDOR_WIDTH_MM}mm)`
                          : `✓ Meets NBC 3.3.1.2 minimum corridor width`}
                      </p>
                      <Button variant="ghost" size="sm" className="text-red-500 text-xs h-6 px-2" onClick={() => removeHallway(idx)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                );
              })()}

              {/* Zone palette */}
              <div className="rounded border border-dashed border-border p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Drag onto canvas or click to add new floor — use + on a floor to split it
                </p>
                {candidatesWithScores.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">AI candidates</p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidatesWithScores.slice(0, 3).map(c => {
                        const vis = OCCUPANCY_VISUAL_DATA[c.code];
                        return (
                          <button
                            key={c.code}
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData('text/plain', c.code); setDraggingCode(c.code); }}
                            onDragEnd={() => setDraggingCode(null)}
                            onClick={() => addFloorFromCode(c.code)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-grab active:cursor-grabbing border"
                            style={vis ? { backgroundColor: vis.color, color: vis.textColor, borderColor: vis.color } : {}}
                            title={c.name}
                          >
                            {c.code}<Plus className="w-3 h-3 opacity-70" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">All NBC codes</p>
                  <div className="flex flex-wrap gap-1">
                    {ALL_NBC_CODES.map(({ code, name }) => {
                      const vis = OCCUPANCY_VISUAL_DATA[code];
                      return (
                        <button
                          key={code}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData('text/plain', code); setDraggingCode(code); }}
                          onDragEnd={() => setDraggingCode(null)}
                          onClick={() => addFloorFromCode(code)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold cursor-grab active:cursor-grabbing border"
                          style={vis ? { backgroundColor: vis.color, color: vis.textColor, borderColor: vis.color } : {}}
                          title={name}
                        >
                          {code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Canvas */}
              <div
                className={`rounded border-2 border-dashed transition-colors ${
                  draggingCode ? 'border-primary bg-primary/5' : 'border-border bg-muted/10'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const code = e.dataTransfer.getData('text/plain') || draggingCode;
                  if (code) addFloorFromCode(code);
                  setDraggingCode(null);
                }}
              >
                {floors.length === 0 && allZones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-28 text-muted-foreground">
                    <Layers className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">Drag occupancy chips here, or click them above</p>
                    {wings.length > 1 && (
                      <p className="text-[10px] mt-1 opacity-60">Adding to {activeWing?.label}</p>
                    )}
                  </div>
                ) : floors.length === 0 && allZones.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-28 text-muted-foreground">
                    <Layers className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">{activeWing?.label} is empty — drag chips above to add floors</p>
                  </div>
                ) : stackView === 'isometric' ? (
                  /* ── Isometric 3D view ── */
                  (() => {
                    function buildWingZones(floorArr: FloorLevel[]): OccupancyZone[] {
                      const zones: OccupancyZone[] = [];
                      for (let fi = 0; fi < floorArr.length; fi++) {
                        const fl = floorArr[fi];
                        const total = fl.zones.reduce((s, z) => s + z.area_m2, 0) || 1;
                        let xOff = 0;
                        for (const zone of fl.zones) {
                          const w = (zone.area_m2 / total) * 4;
                          zones.push({ floor: fi, label: `${zone.code} — ${zone.name}`, occupancyGroup: zone.code, color: zone.color, widthUnits: w, xOffset: xOff });
                          xOff += w;
                        }
                      }
                      return zones;
                    }

                    let wingDataArr: WingData[];

                    if (stackOrientation === 'horizontal') {
                      // Horizontal: flatten wings[0] floors into sections
                      wingDataArr = [{
                        id: 'h-main',
                        label: wings[0]?.label ?? 'Main',
                        zones: buildWingZones(wings[0]?.floors ?? []),
                        floorCount: 1,
                      }];
                    } else {
                      // Vertical: each wing is an independent tower
                      wingDataArr = wings.map(wing => ({
                        id: wing.id,
                        label: wing.label,
                        zones: buildWingZones(wing.floors),
                        floorCount: wing.floors.length,
                      }));
                    }

                    const isoSeps: FireSeparation[] = floorSepSchedule.map((s, i) => ({
                      betweenFloors: [i, i + 1] as [number, number],
                      requiredFRR: parseInt(s.frr ?? '0') || 0,
                      result: (s.frr === '0 min' || s.frr === 'None' ? 'pass' : 'advisory') as 'pass' | 'fail' | 'advisory',
                    }));

                    // Wing separation walls between adjacent towers (correct FRR per pair)
                    const isoWingSeps: WingSeparation[] = [];
                    if (stackOrientation === 'vertical' && wings.length > 1) {
                      for (let wi = 0; wi < wings.length - 1; wi++) {
                        const zonesA = wings[wi].floors.flatMap(f => f.zones);
                        const zonesB = wings[wi + 1].floors.flatMap(f => f.zones);
                        const govSep = (zonesA.length > 0 && zonesB.length > 0)
                          ? getMaxFloorSeparation(zonesA, zonesB)
                          : { frr: '45 min', hours: 0.75 };
                        const frr = parseInt(govSep.frr) || 45;
                        isoWingSeps.push({ wingAIdx: wi, wingBIdx: wi + 1, requiredFRR: frr, result: 'advisory' });
                      }
                    }

                    const maxFloors = Math.max(...wingDataArr.map(w => w.floorCount), 1);

                    return (
                      <div className="overflow-hidden rounded">
                        <IsometricStackView
                          wings={wingDataArr}
                          separations={isoSeps}
                          totalFloors={maxFloors}
                          orientation={stackOrientation}
                          hallways={hallways}
                          wingSeparations={isoWingSeps}
                        />
                      </div>
                    );
                  })()
                ) : stackOrientation === 'vertical' ? (
                  /* ── Vertical: floors rendered top-to-bottom in REVERSE so Ground Floor is at bottom ── */
                  <div>
                    {floors.slice().reverse().map((floor, reversedIdx) => {
                      // Original index in the data array (0 = Ground Floor)
                      const floorIdx = floors.length - 1 - reversedIdx;
                      const floorArea = floor.zones.reduce((s, z) => s + z.area_m2, 0);
                      const floorH = Math.max(64, (floorArea / totalArea) * 400);
                      return (
                        <div key={floor.id}>
                          {/* Between-floor separation — shown ABOVE each floor except the topmost */}
                          {reversedIdx > 0 && (() => {
                            // In the reversed render, the floor above in the visual is floors[floorIdx + 1]
                            const sep = getMaxFloorSeparation(floors[floorIdx + 1].zones, floor.zones);
                            return (
                              <div
                                className="flex items-center gap-2 px-4 py-1 text-xs font-semibold border-y"
                                style={{ backgroundColor: sep.bgColor, color: sep.color, borderColor: `${sep.color}40` }}
                              >
                                <span>──── Floor Separation: {sep.frr} ────</span>
                                <span className="text-[10px] opacity-70">{sep.nbcRef}</span>
                              </div>
                            );
                          })()}

                          {/* Floor row */}
                          <div className="flex overflow-hidden" style={{ height: `${floorH}px` }}>
                            {/* Floor label strip */}
                            <div className="w-14 shrink-0 flex flex-col items-center justify-center bg-gray-100 border-r border-gray-200 text-[9px] text-gray-500 font-semibold gap-0.5">
                              <span>{floorIdx === 0 ? 'G/F' : `L${floorIdx + 1}`}</span>
                            </div>

                            {/* Zones on this floor */}
                            <div className="flex flex-1 overflow-hidden">
                              {floor.zones.map((zone, zoneIdx) => (
                                <div key={zoneIdx} className="flex">
                                  {/* Zone block */}
                                  <div
                                    className="relative flex flex-col justify-center px-3 h-full"
                                    style={{ flex: zone.area_m2, minWidth: '80px', backgroundColor: zone.color, color: zone.textColor }}
                                  >
                                    <span className="font-bold text-sm font-mono leading-tight">{zone.code}</span>
                                    <span className="text-[10px] opacity-80 leading-tight">{zone.name}</span>
                                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                                      <input
                                        type="number"
                                        value={zone.area_m2}
                                        min={10}
                                        onChange={(e) => updateZoneArea(floorIdx, zoneIdx, Number(e.target.value))}
                                        onClick={(e) => e.stopPropagation()}
                                        style={areaInputStyle(true)}
                                      />
                                      <span style={{ fontSize: '10px', opacity: 0.8 }}>m²</span>
                                      <span style={{ fontSize: '10px', opacity: 0.65 }}>
                                        {Math.round((zone.area_m2 / totalArea) * 100)}%
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => removeZoneFromFloor(floorIdx, zoneIdx)}
                                      className="absolute top-1 right-1 opacity-60 hover:opacity-100"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* In-floor separation divider */}
                                  {zoneIdx < floor.zones.length - 1 && (() => {
                                    const sep = getFireSeparation(zone.code, floor.zones[zoneIdx + 1].code);
                                    return (
                                      <div
                                        className="flex items-center justify-center shrink-0 text-[9px] font-bold"
                                        style={{ width: '28px', backgroundColor: sep.bgColor, color: sep.color, borderLeft: `2px solid ${sep.color}`, borderRight: `2px solid ${sep.color}` }}
                                      >
                                        <span style={{ writingMode: 'vertical-rl' }}>{sep.frr}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ))}
                            </div>

                            {/* Split-floor button */}
                            <button
                              onClick={() => setSplitFloorIndex(splitFloorIndex === floorIdx ? null : floorIdx)}
                              className="w-8 shrink-0 flex items-center justify-center border-l border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                              title="Add zone to this floor"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Split-floor zone picker */}
                          {splitFloorIndex === floorIdx && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 border-x border-b border-dashed border-border">
                              <span className="text-[10px] text-muted-foreground shrink-0">Add to Floor {floorIdx + 1}:</span>
                              <select
                                className="flex-1 text-xs border rounded px-2 py-1 bg-background"
                                defaultValue=""
                                onChange={(e) => { if (e.target.value) addZoneToFloor(floorIdx, e.target.value); }}
                              >
                                <option value="" disabled>Pick occupancy…</option>
                                {ALL_NBC_CODES.map(({ code, name }) => (
                                  <option key={code} value={code}>{code} — {name}</option>
                                ))}
                              </select>
                              <button
                                className="text-[10px] text-muted-foreground hover:text-foreground"
                                onClick={() => setSplitFloorIndex(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ── Horizontal: all zones flat, proportional flex widths ── */
                  <div className="flex w-full overflow-hidden rounded" style={{ height: '200px' }}>
                    {floors.flatMap((floor, floorIdx) =>
                      floor.zones.map((zone, zoneIdx) => ({ zone, floorIdx, zoneIdx }))
                    ).map(({ zone, floorIdx, zoneIdx }, flatIdx, arr) => (
                      <div key={`${floorIdx}-${zoneIdx}`} className="flex" style={{ flex: zone.area_m2, minWidth: '60px' }}>
                        <div
                          className="flex flex-col items-center justify-center p-2 relative w-full"
                          style={{ backgroundColor: zone.color, color: zone.textColor }}
                        >
                          <span className="font-bold text-sm font-mono">{zone.code}</span>
                          <span className="text-[10px] opacity-80 text-center leading-tight mt-0.5">{zone.name}</span>
                          <div className="mt-1.5 flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={zone.area_m2}
                                min={10}
                                onChange={(e) => updateZoneArea(floorIdx, zoneIdx, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={areaInputStyle(true)}
                              />
                              <span style={{ fontSize: '10px', opacity: 0.8 }}>m²</span>
                            </div>
                            <span style={{ fontSize: '10px', opacity: 0.7 }}>
                              {Math.round((zone.area_m2 / totalArea) * 100)}% of total
                            </span>
                          </div>
                          <button
                            onClick={() => removeZoneFromFloor(floorIdx, zoneIdx)}
                            className="absolute top-1 right-1 opacity-70 hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Separation divider between adjacent flat zones */}
                        {flatIdx < arr.length - 1 && (() => {
                          const nextEntry = arr[flatIdx + 1];
                          const sep = getFireSeparation(zone.code, nextEntry.zone.code);
                          return (
                            <div
                              className="flex items-center justify-center shrink-0 text-[9px] font-bold"
                              style={{ width: '28px', backgroundColor: sep.bgColor, color: sep.color, borderLeft: `3px solid ${sep.color}`, borderRight: `3px solid ${sep.color}` }}
                            >
                              <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>{sep.frr}</span>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analysis panel */}
              {allZones.length > 0 && (
                <div className="space-y-3 rounded border border-border p-3 bg-muted/10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Real-Time Analysis</p>

                  {/* Governing occupancy */}
                  {governingStackCode && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground shrink-0">Governing occupancy:</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold font-mono border"
                        style={governingVisual ? { backgroundColor: governingVisual.color, color: governingVisual.textColor, borderColor: governingVisual.color } : {}}
                      >
                        {governingStackCode}
                      </span>
                      <span className="text-xs text-muted-foreground">(most restrictive)</span>
                    </div>
                  )}

                  {/* Total area */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0">Total building area:</span>
                    <span className="font-semibold">{(totalArea === 1 ? 0 : totalArea).toLocaleString()} m²</span>
                    <span className="text-muted-foreground">
                      {wings.length > 1 ? `${wings.length} wings, ` : ''}{allZones.length} zone{allZones.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Floor breakdown (vertical mode) — active wing */}
                  {stackOrientation === 'vertical' && floors.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Floor Breakdown{wings.length > 1 ? ` — ${activeWing?.label}` : ''}
                      </p>
                      <div className="space-y-0.5">
                        {floors.map((floor, i) => {
                          const floorArea = floor.zones.reduce((s, z) => s + z.area_m2, 0);
                          return (
                            <div key={floor.id} className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground w-20 shrink-0">{i === 0 ? 'Ground Floor' : `Level ${i + 1}`}</span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {floor.zones.map((z, zi) => {
                                  const vis = OCCUPANCY_VISUAL_DATA[z.code];
                                  return (
                                    <span
                                      key={zi}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border"
                                      style={vis ? { backgroundColor: vis.color, color: vis.textColor, borderColor: vis.color } : {}}
                                    >
                                      {z.code}
                                    </span>
                                  );
                                })}
                              </div>
                              <span className="text-muted-foreground text-[10px]">{floorArea} m² ({Math.round((floorArea / totalArea) * 100)}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Floor separation schedule */}
                  {(floorSepSchedule.length > 0 || hallways.length > 0) && (() => {
                    const activeHallways = hallways.filter(hw => !hw.wingId || hw.wingId === activeWingId);
                    const hallwaySeps = calculateHallwaySeparations(activeHallways, floors);
                    return (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          Separation Schedule{wings.length > 1 ? ` — ${activeWing?.label}` : ''}
                        </p>
                        <div className="rounded overflow-hidden border border-border text-xs">
                          <div className="grid grid-cols-4 bg-muted/40 font-semibold text-[10px]">
                            <div className="px-2 py-1.5">Interface</div>
                            <div className="px-2 py-1.5">Zone A</div>
                            <div className="px-2 py-1.5">Zone B</div>
                            <div className="px-2 py-1.5">Required FRR</div>
                          </div>
                          {floorSepSchedule.map((row, i) => (
                            <div key={i} className="grid grid-cols-4 border-t border-border text-[10px]" style={{ backgroundColor: `${row.bgColor}60` }}>
                              <div className="px-2 py-1.5 text-muted-foreground">{row.interfaceLabel}</div>
                              <div className="px-2 py-1.5">
                                {row.zonesA.map(z => (
                                  <span key={z.code} className="font-mono font-bold mr-1" style={{ color: z.color }}>{z.code} <span className="font-normal text-muted-foreground">({z.area_m2} m²)</span></span>
                                ))}
                              </div>
                              <div className="px-2 py-1.5">
                                {row.zonesB.map(z => (
                                  <span key={z.code} className="font-mono font-bold mr-1" style={{ color: z.color }}>{z.code} <span className="font-normal text-muted-foreground">({z.area_m2} m²)</span></span>
                                ))}
                              </div>
                              <div className="px-2 py-1.5 font-bold" style={{ color: row.color }}>
                                {row.frr}
                                <span className="ml-1 font-normal text-[9px] text-muted-foreground">{row.nbcRef}</span>
                              </div>
                            </div>
                          ))}
                          {/* Wing-to-wing separations (vertical multi-wing) */}
                          {stackOrientation === 'vertical' && wings.length > 1 && (() => {
                            const wingWallRows = wings.slice(0, -1).map((wA, wi) => {
                              const wB = wings[wi + 1];
                              const zonesA = wA.floors.flatMap(f => f.zones);
                              const zonesB = wB.floors.flatMap(f => f.zones);
                              const sep = (zonesA.length > 0 && zonesB.length > 0)
                                ? getMaxFloorSeparation(zonesA, zonesB)
                                : { frr: '45 min', hours: 0.75, color: '#BA7517', bgColor: '#FAEEDA', nbcRef: 'NBC 3.1.3.4' };
                              return { wA, wB, sep };
                            });
                            return (
                              <>
                                <div className="col-span-4 px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/20 border-t grid grid-cols-4">
                                  <div className="col-span-4">Wing-to-Wing Wall Separations (NBC 3.1.3.4)</div>
                                </div>
                                {wingWallRows.map(({ wA, wB, sep }, idx) => (
                                  <div key={idx} className="grid grid-cols-4 border-t border-border text-[10px]" style={{ backgroundColor: `${sep.bgColor}60` }}>
                                    <div className="px-2 py-1.5 text-muted-foreground">{wA.label} / {wB.label}</div>
                                    <div className="px-2 py-1.5">
                                      {wA.floors.flatMap(f => f.zones).map(z => z.code).filter((v, i, a) => a.indexOf(v) === i).map(c => (
                                        <span key={c} className="font-mono font-bold mr-1" style={{ color: OCCUPANCY_VISUAL_DATA[c]?.color }}>{c}</span>
                                      ))}
                                    </div>
                                    <div className="px-2 py-1.5">
                                      {wB.floors.flatMap(f => f.zones).map(z => z.code).filter((v, i, a) => a.indexOf(v) === i).map(c => (
                                        <span key={c} className="font-mono font-bold mr-1" style={{ color: OCCUPANCY_VISUAL_DATA[c]?.color }}>{c}</span>
                                      ))}
                                    </div>
                                    <div className="px-2 py-1.5 font-bold" style={{ color: sep.color }}>
                                      {sep.frr}
                                      <span className="ml-1 font-normal text-[9px] text-muted-foreground">{sep.nbcRef}</span>
                                    </div>
                                  </div>
                                ))}
                              </>
                            );
                          })()}
                          {/* Corridor separations */}
                          {hallwaySeps.length > 0 && (
                            <>
                              <div className="col-span-4 px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/20 border-t grid grid-cols-4">
                                <div className="col-span-4">Corridor Separations (NBC 3.3.1.7)</div>
                              </div>
                              {hallwaySeps.map((hs, idx) => (
                                <div key={idx} className={`grid grid-cols-4 border-t border-border text-[10px] ${hs.result === 'fail' ? 'bg-red-50' : ''}`}>
                                  <div className="px-2 py-1.5 text-muted-foreground">
                                    Hallway {hs.hallwayIdx + 1} — {hs.side}
                                    <span className="block text-[9px]">{hs.floorIndex === 'all' ? 'all floors' : `Floor ${(hs.floorIndex as number) + 1}`}</span>
                                  </div>
                                  <div className="px-2 py-1.5">
                                    Corridor ({hs.widthMm}mm{!hs.widthCompliant ? ' ⚠' : ''})
                                  </div>
                                  <div className="px-2 py-1.5 font-mono font-bold">{hs.adjacentOccupancy}</div>
                                  <div className={`px-2 py-1.5 font-medium ${hs.requiredFRR === 0 ? 'text-green-600' : hs.result === 'fail' ? 'text-red-600' : 'text-amber-600'}`}>
                                    {hs.requiredFRR === 0 ? 'None required' : `${hs.requiredFRR} min`}
                                    <span className="block font-normal text-[9px] text-muted-foreground">{hs.citation}</span>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hallway width warnings */}
                  {hallways.some(hw => (!hw.wingId || hw.wingId === activeWingId) && hw.widthMm < NBC_MIN_CORRIDOR_WIDTH_MM) && (
                    <div className="space-y-1">
                      {hallways.map((hw, idx) => (!hw.wingId || hw.wingId === activeWingId) && hw.widthMm < NBC_MIN_CORRIDOR_WIDTH_MM && (
                        <div key={idx} className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          Hallway {idx + 1}: {hw.widthMm}mm width is below NBC 3.3.1.2 minimum ({NBC_MIN_CORRIDOR_WIDTH_MM}mm)
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Flags */}
                  {stackFlags.length > 0 && (
                    <div className="space-y-1.5">
                      {stackFlags.map((flag, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 p-2 rounded text-xs border ${
                            flag.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800'
                            : flag.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                          }`}
                        >
                          {flag.severity === 'critical' ? <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            : flag.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            : <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                          <span>{flag.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Construction recommendation */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0">Construction type:</span>
                    <span className={`font-semibold ${constructionRec.startsWith('Non') ? 'text-red-700' : 'text-green-700'}`}>
                      {constructionRec}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2 border-t">
                <Button variant="ghost" onClick={() => setScreen(2)}>← Back</Button>
                <Button
                  onClick={() => {
                    if (governingStackCode) setSelectedCode(governingStackCode);
                    setScreen(3);
                  }}
                  disabled={allZones.length === 0}
                >
                  Confirm Arrangement →
                </Button>
              </div>
            </div>
          );
        })()}

        {/* ── Screen 3: Professional Confirmation ── */}
        {screen === 3 && (
          <div className="space-y-4 mt-2">
            <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Selected Classification</p>
              <span className={`text-3xl font-bold px-4 py-2 rounded border-2 font-mono inline-block ${badgeClass(selectedCode)}`}>
                {selectedCode}
              </span>
              <p className="text-sm font-medium mt-2">
                {classifyResult?.candidates.find(c => c.code === selectedCode)?.name
                  ?? ALL_NBC_CODES.find(c => c.code === selectedCode)?.name}
              </p>
              {isMixedUse && allStackZones.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Governing occupancy from {wings.length > 1 ? `${wings.length}-wing` : `${floors.length}-floor`}, {allStackZones.length}-zone mixed use stack
                </p>
              )}
            </div>

            {projectName && (
              <p className="text-sm font-semibold text-gray-700">Confirm classification for {projectName}</p>
            )}

            <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Professional Confirmation Required</p>
              {[
                { state: checked1, setter: setChecked1, text: "I have reviewed the AI suggestion and applicable NBC requirements" },
                { state: checked2, setter: setChecked2, text: "I confirm this classification reflects my professional judgment" },
                { state: checked3, setter: setChecked3, text: "I understand this tool does not replace professional review" },
              ].map((item, i) => (
                <label key={i} className="flex items-start gap-2.5 cursor-pointer p-2 rounded hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={e => item.setter(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">{item.text}</span>
                </label>
              ))}
            </div>

            {confirmEnabled && (
              <div className="flex items-center gap-2 p-2 rounded bg-green-50 border border-green-200 text-green-800 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Ready to confirm — occupancy {selectedCode} will be applied</span>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => isMixedUse ? setScreen('stackPlanner') : setScreen(2)}>
                ← Back
              </Button>
              <Button onClick={handleConfirm} disabled={!confirmEnabled}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Classification
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
