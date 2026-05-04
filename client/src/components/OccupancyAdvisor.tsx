import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, Info, Bot, Plus, Trash2, Building2, X, Layers } from "lucide-react";

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

// ── Props ─────────────────────────────────────────────────────────────────────

interface OccupancyAdvisorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  province?: string;
  onConfirm?: (occupancyCode: string) => void;
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
  const [stackZones, setStackZones] = useState<StackZone[]>([]);
  const [stackOrientation, setStackOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [draggingCode, setDraggingCode] = useState<string | null>(null);

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
      data.candidates.forEach(c => {
        scoreMutation.mutate({ code: c.code, area, storeys: storeysNum, province: selectedProvince });
      });
    },
    onError: (err) => {
      setClassifyError(err.message || "Analysis failed. Please try again.");
    },
  });

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

  function addStackZoneFromCode(code: string) {
    const visual = OCCUPANCY_VISUAL_DATA[code];
    const entry = ALL_NBC_CODES.find(c => c.code === code);
    if (!visual || !entry) return;
    setStackZones(prev => [...prev, { code, name: entry.name, ...visual, area_m2: 100 }]);
  }

  function removeStackZone(i: number) {
    setStackZones(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateZoneArea(index: number, area: number) {
    setStackZones(prev => prev.map((z, i) =>
      i === index ? { ...z, area_m2: Math.max(10, area) } : z
    ));
  }

  function handleGoToStackPlanner() {
    if (stackZones.length === 0 && candidatesWithScores.length >= 2) {
      const c0 = candidatesWithScores[0];
      const c1 = candidatesWithScores[1];
      const v0 = OCCUPANCY_VISUAL_DATA[c0.code] ?? { color: '#6B7280', textColor: '#fff', sprinklersRequired: false, part3Required: false };
      const v1 = OCCUPANCY_VISUAL_DATA[c1.code] ?? { color: '#6B7280', textColor: '#fff', sprinklersRequired: false, part3Required: false };
      setStackZones([
        { code: c0.code, name: c0.name, ...v0, area_m2: 100 },
        { code: c1.code, name: c1.name, ...v1, area_m2: 100 },
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
    if (stackZones.length > 0) {
      const totalArea = stackZones.reduce((sum, z) => sum + z.area_m2, 0);
      const separationSchedule = stackZones.slice(0, -1).map((zone, i) => ({
        interface: `${zone.code} / ${stackZones[i + 1].code}`,
        zoneA: { code: zone.code, area_m2: zone.area_m2, pct: Math.round((zone.area_m2 / totalArea) * 100) },
        zoneB: { code: stackZones[i + 1].code, area_m2: stackZones[i + 1].area_m2, pct: Math.round((stackZones[i + 1].area_m2 / totalArea) * 100) },
        ...getFireSeparation(zone.code, stackZones[i + 1].code),
      }));
      console.log('Mixed occupancy stack confirmed', { stackZones, stackOrientation, totalArea, separationSchedule });
    }
    onConfirm?.(selectedCode);
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
    setStackZones([]); setStackOrientation('vertical'); setDraggingCode(null);
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

  const governingStackCode = stackZones.length > 0
    ? stackZones.reduce((max, z) =>
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
                {/* Screen 2 sub-header */}
                {projectName && (
                  <p className="text-sm font-semibold text-gray-700">Results for {projectName}</p>
                )}

                {/* AI model attribution */}
                {classifyResult?.modelVersion && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    Analysis by {classifyResult.modelVersion}
                  </p>
                )}

                {/* Ambiguity notes */}
                {classifyResult?.ambiguityNotes && (
                  <div className="flex items-start gap-2 p-3 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{classifyResult.ambiguityNotes}</span>
                  </div>
                )}

                {/* Most restrictive warning */}
                {candidatesWithScores.length > 1 && classifyResult?.defaultToMoreRestrictive && (
                  <div className="flex items-start gap-2 p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      When in doubt, apply the more restrictive classification (NBC 3.1.2.1).
                      <strong> {topRestrictive}</strong> is the most restrictive candidate.
                    </span>
                  </div>
                )}

                {/* Candidate cards */}
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

                      {/* Score bars */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-20 shrink-0">AI confidence</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-400 rounded-full"
                              style={{ width: `${c.confidence * 100}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-medium">{Math.round(c.confidence * 100)}%</span>
                        </div>
                        {c.ruleScore !== undefined ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground w-20 shrink-0">Rule score</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-400 rounded-full"
                                style={{ width: `${c.ruleScore}%` }}
                              />
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

                      {/* AI reasoning */}
                      <p className="text-xs text-muted-foreground mb-2">{c.reasoning}</p>

                      {/* Key factors */}
                      <ul className="space-y-0.5 mb-3">
                        {c.keyFactors.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Rule score details */}
                      {c.scoreResult && (
                        <div className="pt-3 border-t border-border space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={c.scoreResult.sprinklersRequired
                              ? "bg-red-100 text-red-800 text-xs"
                              : "bg-green-100 text-green-800 text-xs"
                            }>
                              {c.scoreResult.sprinklersRequired ? "Sprinklers Required" : "Sprinklers Not Required"}
                            </Badge>
                            <Badge className={c.scoreResult.part3Required
                              ? "bg-orange-100 text-orange-800 text-xs"
                              : "bg-blue-100 text-blue-800 text-xs"
                            }>
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

                {/* Mixed use flags */}
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

                <div className="flex justify-between gap-2 pt-2 border-t">
                  <Button variant="ghost" onClick={() => setScreen(1)}>← Back</Button>
                  <Button
                    onClick={() => {
                      if (isMixedUse) {
                        handleGoToStackPlanner();
                      } else {
                        setScreen(3);
                      }
                    }}
                    disabled={!selectedCode}
                  >
                    {isMixedUse ? (
                      <><Layers className="w-4 h-4 mr-2" />Plan Mixed Use Stack →</>
                    ) : (
                      <>Confirm Selection → {selectedCode}</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Screen 2.5: Mixed Use Stack Planner ── */}
        {screen === 'stackPlanner' && (() => {
          const totalArea = stackZones.reduce((sum, z) => sum + z.area_m2, 0) || 1;
          const separationSchedule = stackZones.slice(0, -1).map((zone, i) => ({
            interfaceLabel: `${zone.code} / ${stackZones[i + 1].code}`,
            zoneA: zone,
            zoneB: stackZones[i + 1],
            ...getFireSeparation(zone.code, stackZones[i + 1].code),
          }));

          const stackFlags: { severity: 'critical' | 'warning' | 'info'; message: string }[] = [];
          const sprinklerTrigger = stackZones.find(z => z.sprinklersRequired);
          if (sprinklerTrigger) {
            stackFlags.push({
              severity: 'critical',
              message: `Sprinkler system required throughout building (NBC 3.2.5.2) — ${sprinklerTrigger.code} triggers this requirement`,
            });
          }
          if (stackOrientation === 'vertical' && stackZones.length > 2) {
            stackFlags.push({
              severity: 'warning',
              message: 'Vertical shafts (stairs, elevators, mechanical) must be fire-separated per NBC 3.6',
            });
          }
          if (stackZones.some(z => z.code.startsWith('B'))) {
            stackFlags.push({
              severity: 'critical',
              message: 'Group B requires 2-hour separation from all other occupancies (NBC 3.1.3.4)',
            });
          }
          if (stackZones.some(z => z.part3Required)) {
            stackFlags.push({
              severity: 'warning',
              message: 'Part 3 provisions apply — verify limits in NBC Table 3.2.2.70',
            });
          }
          if (stackOrientation === 'horizontal' && stackZones.length > 1) {
            stackFlags.push({
              severity: 'info',
              message: 'Each occupancy zone requires independent means of egress (NBC 3.4.1)',
            });
          }

          const constructionRec = stackZones.some(z =>
            z.code.startsWith('B') || z.code.startsWith('A') || z.code === 'F-1'
          ) ? 'Non-Combustible required' : 'Combustible may be acceptable — verify limits';

          const governingVisual = governingStackCode ? OCCUPANCY_VISUAL_DATA[governingStackCode] : null;

          return (
            <div className="space-y-4 mt-2">
              <div>
                <p className="text-sm font-semibold">Mixed Use Stack Planner</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Arrange your occupancy zones to calculate fire separation requirements between each interface.
                </p>
              </div>

              {/* Orientation toggle */}
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

              {/* Zone palette */}
              <div className="rounded border border-dashed border-border p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Drag zones onto canvas — or click to add
                </p>

                {/* AI candidates */}
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
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', c.code);
                              setDraggingCode(c.code);
                            }}
                            onDragEnd={() => setDraggingCode(null)}
                            onClick={() => addStackZoneFromCode(c.code)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-grab active:cursor-grabbing border"
                            style={vis ? { backgroundColor: vis.color, color: vis.textColor, borderColor: vis.color } : {}}
                            title={c.name}
                          >
                            {c.code}
                            <Plus className="w-3 h-3 opacity-70" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All NBC codes */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">All NBC codes</p>
                  <div className="flex flex-wrap gap-1">
                    {ALL_NBC_CODES.map(({ code, name }) => {
                      const vis = OCCUPANCY_VISUAL_DATA[code];
                      return (
                        <button
                          key={code}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', code);
                            setDraggingCode(code);
                          }}
                          onDragEnd={() => setDraggingCode(null)}
                          onClick={() => addStackZoneFromCode(code)}
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
                className={`rounded border-2 border-dashed p-3 min-h-[140px] transition-colors ${
                  draggingCode ? 'border-primary bg-primary/5' : 'border-border bg-muted/10'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const code = e.dataTransfer.getData('text/plain') || draggingCode;
                  if (code) addStackZoneFromCode(code);
                  setDraggingCode(null);
                }}
              >
                {stackZones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <Layers className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">Drag occupancy chips here, or click them above</p>
                  </div>
                ) : stackOrientation === 'vertical' ? (
                  /* Vertical stack */
                  <div className="space-y-0">
                    {stackZones.map((zone, i) => (
                      <div key={i}>
                        <div
                          className="px-4 flex items-center justify-between overflow-hidden transition-all"
                          style={{
                            backgroundColor: zone.color,
                            color: zone.textColor,
                            height: `${Math.max(60, (zone.area_m2 / totalArea) * 400)}px`,
                          }}
                        >
                          <div>
                            <span className="font-bold text-base font-mono">{zone.code}</span>
                            <span className="ml-2 text-xs opacity-80">{zone.name}</span>
                            <span className="ml-3 text-[10px] opacity-60">
                              {i === 0 ? 'Ground Floor' : `Level ${i + 1}`}
                            </span>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <input
                                type="number"
                                value={zone.area_m2}
                                min={10}
                                onChange={(e) => updateZoneArea(i, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: '70px', fontSize: '11px', background: 'transparent',
                                  border: '1px solid rgba(255,255,255,0.4)', color: 'inherit',
                                  borderRadius: '4px', padding: '2px 4px', textAlign: 'center',
                                }}
                              />
                              <span style={{ fontSize: '10px', opacity: 0.8 }}>m²</span>
                              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                                · {Math.round((zone.area_m2 / totalArea) * 100)}% of total
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeStackZone(i)}
                            className="opacity-70 hover:opacity-100 p-0.5 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {i < stackZones.length - 1 && (() => {
                          const sep = getFireSeparation(zone.code, stackZones[i + 1].code);
                          return (
                            <div
                              className="flex items-center gap-2 px-4 py-1 text-xs font-semibold border-y"
                              style={{ backgroundColor: sep.bgColor, color: sep.color, borderColor: sep.color + '40' }}
                            >
                              <span>──── Fire Separation: {sep.frr} ────</span>
                              <span className="text-[10px] opacity-70">{sep.nbcRef}</span>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Horizontal adjacent */
                  <div className="flex h-48 rounded overflow-hidden">
                    {stackZones.map((zone, i) => (
                      <div
                        key={i}
                        className="flex shrink-0 transition-all"
                        style={{ width: `${Math.max(80, (zone.area_m2 / totalArea) * 500)}px` }}
                      >
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
                                onChange={(e) => updateZoneArea(i, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: '60px', fontSize: '11px', background: 'transparent',
                                  border: '1px solid rgba(255,255,255,0.4)', color: 'inherit',
                                  borderRadius: '4px', padding: '2px 4px', textAlign: 'center',
                                }}
                              />
                              <span style={{ fontSize: '10px', opacity: 0.8 }}>m²</span>
                            </div>
                            <span style={{ fontSize: '10px', opacity: 0.7 }}>
                              {Math.round((zone.area_m2 / totalArea) * 100)}% of total
                            </span>
                          </div>
                          <button
                            onClick={() => removeStackZone(i)}
                            className="absolute top-1 right-1 opacity-70 hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {i < stackZones.length - 1 && (() => {
                          const sep = getFireSeparation(zone.code, stackZones[i + 1].code);
                          return (
                            <div
                              className="flex items-center justify-center w-10 shrink-0 text-[10px] font-bold writing-mode-vertical"
                              style={{ backgroundColor: sep.bgColor, color: sep.color, borderLeft: `3px solid ${sep.color}`, borderRight: `3px solid ${sep.color}` }}
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
              {stackZones.length > 0 && (
                <div className="space-y-3 rounded border border-border p-3 bg-muted/10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Real-Time Analysis</p>

                  {/* Governing occupancy */}
                  {governingStackCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">Governing occupancy:</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold font-mono border"
                        style={governingVisual ? {
                          backgroundColor: governingVisual.color,
                          color: governingVisual.textColor,
                          borderColor: governingVisual.color,
                        } : {}}
                      >
                        {governingStackCode}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (most restrictive — drives overall classification)
                      </span>
                    </div>
                  )}

                  {/* Total area */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0">Total building area:</span>
                    <span className="font-semibold">{(totalArea === 1 ? 0 : totalArea).toLocaleString()} m²</span>
                  </div>

                  {/* Separation schedule */}
                  {separationSchedule.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Separation Schedule</p>
                      <div className="rounded overflow-hidden border border-border text-xs">
                        <div className="grid grid-cols-4 bg-muted/40 font-semibold">
                          <div className="px-2 py-1.5">Interface</div>
                          <div className="px-2 py-1.5">Zone A (area)</div>
                          <div className="px-2 py-1.5">Zone B (area)</div>
                          <div className="px-2 py-1.5">Required FRR</div>
                        </div>
                        {separationSchedule.map((row, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-4 border-t border-border"
                            style={{ backgroundColor: row.bgColor + '60' }}
                          >
                            <div className="px-2 py-1.5 text-muted-foreground">{row.interfaceLabel}</div>
                            <div className="px-2 py-1.5 font-mono font-bold" style={{ color: row.zoneA.color }}>
                              {row.zoneA.code}
                              <span className="ml-1 font-normal text-[10px] text-muted-foreground">
                                {row.zoneA.area_m2} m²
                              </span>
                            </div>
                            <div className="px-2 py-1.5 font-mono font-bold" style={{ color: row.zoneB.color }}>
                              {row.zoneB.code}
                              <span className="ml-1 font-normal text-[10px] text-muted-foreground">
                                {row.zoneB.area_m2} m²
                              </span>
                            </div>
                            <div className="px-2 py-1.5 font-bold" style={{ color: row.color }}>
                              {row.frr}
                              <span className="ml-1 font-normal text-[10px] text-muted-foreground">{row.nbcRef}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flags */}
                  {stackFlags.length > 0 && (
                    <div className="space-y-1.5">
                      {stackFlags.map((flag, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 p-2 rounded text-xs border ${
                            flag.severity === 'critical'
                              ? 'bg-red-50 border-red-200 text-red-800'
                              : flag.severity === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-blue-50 border-blue-200 text-blue-800'
                          }`}
                        >
                          {flag.severity === 'critical' ? (
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          ) : flag.severity === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          ) : (
                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          )}
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
                  disabled={stackZones.length === 0}
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
            {/* Selected occupancy display */}
            <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Selected Classification</p>
              <span className={`text-3xl font-bold px-4 py-2 rounded border-2 font-mono inline-block ${badgeClass(selectedCode)}`}>
                {selectedCode}
              </span>
              <p className="text-sm font-medium mt-2">
                {classifyResult?.candidates.find(c => c.code === selectedCode)?.name
                  ?? ALL_NBC_CODES.find(c => c.code === selectedCode)?.name}
              </p>
              {isMixedUse && stackZones.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Governing occupancy from {stackZones.length}-zone mixed use stack
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
              <Button
                onClick={handleConfirm}
                disabled={!confirmEnabled}
              >
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
