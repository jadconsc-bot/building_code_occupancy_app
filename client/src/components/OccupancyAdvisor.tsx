import { useState } from "react";
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
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, Info, Bot, Plus, Trash2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

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

function badgeClass(code: string): string {
  return OCCUPANCY_BADGE[code.charAt(0)] ?? "bg-gray-100 text-gray-800 border-gray-200";
}

function mostRestrictiveCode(candidates: Candidate[]): string {
  return candidates.reduce((max, c) =>
    (RESTRICTIVENESS[c.code] ?? 0) > (RESTRICTIVENESS[max.code] ?? 0) ? c : max
  ).code;
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
}: OccupancyAdvisorProps) {
  const [screen, setScreen] = useState<1 | 2 | 3>(1);

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

  // Screen 3 confirmation
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

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

  function addZone() {
    setMixedUseZones(prev => [...prev, { use: "", area: "" }]);
  }

  function removeZone(i: number) {
    setMixedUseZones(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateZone(i: number, field: "use" | "area", value: string) {
    setMixedUseZones(prev => prev.map((z, idx) => idx === i ? { ...z, [field]: value } : z));
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
    setChecked1(false); setChecked2(false); setChecked3(false);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const formValid =
    buildingDescription.trim().length >= 10 && !!occupantBehavior && !!hazardLevel;

  const allScored = classifyResult
    ? scoreCount >= classifyResult.candidates.length
    : false;

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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAll();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  { value: "Transient visitors", desc: "Short-stay public (retail, assembly)" },
                  { value: "Regular employees", desc: "Daily workers (office, industrial)" },
                  { value: "Residents/overnight", desc: "Sleep on premises (residential, hotel)" },
                  { value: "Detained/supervised", desc: "Cannot self-evacuate (hospital, prison)" },
                  { value: "Mixed", desc: "Combination of the above" },
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
                  { value: "Low", desc: "Office, retail, residential" },
                  { value: "Medium", desc: "Workshop, lab, food processing" },
                  { value: "High", desc: "Chemical, explosive, flammable storage" },
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
                        onChange={e => updateZone(i, "use", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Area m²"
                        type="number"
                        value={zone.area}
                        onChange={e => updateZone(i, "area", e.target.value)}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeZone(i)}
                        className="h-8 w-8 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addZone} className="gap-1.5">
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
                    onClick={() => setScreen(3)}
                    disabled={!selectedCode}
                  >
                    Confirm Selection → {selectedCode}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

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
                {classifyResult?.candidates.find(c => c.code === selectedCode)?.name}
              </p>
            </div>

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
              <Button variant="ghost" onClick={() => setScreen(2)}>← Back</Button>
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
