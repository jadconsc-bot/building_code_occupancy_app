import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Loader2, FileText } from "lucide-react";

interface ProjectTabViewProps {
  readonly projectId: string;
  readonly onNavigate?: (route: string, params?: Record<string, any>) => void;
  readonly onBack?: () => void;
}

type Tab = "overview" | "code_strategy" | "calculations" | "permit_package";

// ── NBC Table 3.2.2.2 — client-side for live compliance preview ────────────
type HeightAreaRow = { maxStoreys: number | null; maxHeightM: number | null; maxAreaM2: number | null };
const NBC_TABLE: Record<string, Record<"sprinklered" | "unsprinklered", HeightAreaRow>> = {
  IA:   { sprinklered: { maxStoreys: null, maxHeightM: null, maxAreaM2: null  }, unsprinklered: { maxStoreys: 6, maxHeightM: 18, maxAreaM2: 7200 } },
  IB:   { sprinklered: { maxStoreys: null, maxHeightM: null, maxAreaM2: null  }, unsprinklered: { maxStoreys: 4, maxHeightM: 12, maxAreaM2: 4800 } },
  IIA:  { sprinklered: { maxStoreys: 12,  maxHeightM: 36,   maxAreaM2: 9600  }, unsprinklered: { maxStoreys: 3, maxHeightM: 9,  maxAreaM2: 2400 } },
  IIB:  { sprinklered: { maxStoreys: 6,   maxHeightM: 18,   maxAreaM2: 4800  }, unsprinklered: { maxStoreys: 2, maxHeightM: 6,  maxAreaM2: 1200 } },
  IIIA: { sprinklered: { maxStoreys: 6,   maxHeightM: 18,   maxAreaM2: 4800  }, unsprinklered: { maxStoreys: 3, maxHeightM: 9,  maxAreaM2: 2400 } },
  IIIB: { sprinklered: { maxStoreys: 4,   maxHeightM: 12,   maxAreaM2: 2400  }, unsprinklered: { maxStoreys: 2, maxHeightM: 6,  maxAreaM2: 600  } },
  IVA:  { sprinklered: { maxStoreys: 6,   maxHeightM: 18,   maxAreaM2: 4800  }, unsprinklered: { maxStoreys: 4, maxHeightM: 12, maxAreaM2: 3200 } },
  VA:   { sprinklered: { maxStoreys: 4,   maxHeightM: 12,   maxAreaM2: 2400  }, unsprinklered: { maxStoreys: 3, maxHeightM: 9,  maxAreaM2: 1200 } },
  VB:   { sprinklered: { maxStoreys: 3,   maxHeightM: 9,    maxAreaM2: 1200  }, unsprinklered: { maxStoreys: 2, maxHeightM: 6,  maxAreaM2: 600  } },
};
const FIRE_RATINGS: Record<string, { structure: string; floor: string; exterior: string }> = {
  IA:   { structure: "2 hr",   floor: "1.5 hr",  exterior: "2 hr"   },
  IB:   { structure: "1.5 hr", floor: "1 hr",    exterior: "1.5 hr" },
  IIA:  { structure: "1 hr",   floor: "1 hr",    exterior: "1 hr"   },
  IIB:  { structure: "0 hr",   floor: "0 hr",    exterior: "0 hr"   },
  IIIA: { structure: "1 hr",   floor: "0.75 hr", exterior: "1 hr"   },
  IIIB: { structure: "0 hr",   floor: "0 hr",    exterior: "0 hr"   },
  IVA:  { structure: "1 hr",   floor: "45 min",  exterior: "1 hr"   },
  VA:   { structure: "1 hr",   floor: "0.75 hr", exterior: "1 hr"   },
  VB:   { structure: "0 hr",   floor: "0 hr",    exterior: "0 hr"   },
};

function computeCompliance(ct: string, sprinklered: boolean, heightM: number | null, areaM2: number | null, storeys: number | null) {
  const row = NBC_TABLE[ct.toUpperCase()]?.[sprinklered ? "sprinklered" : "unsprinklered"] ?? null;
  const ratings = FIRE_RATINGS[ct.toUpperCase()] ?? null;
  const travelLimit = sprinklered ? 45 : 25;
  const check = (actual: number | null, max: number | null): "pass" | "fail" | "unknown" =>
    !row || actual === null ? "unknown" : max === null ? "pass" : actual <= max ? "pass" : "fail";
  return {
    row,
    ratings,
    travelLimit,
    heightResult: check(heightM, row?.maxHeightM ?? null),
    areaResult: check(areaM2, row?.maxAreaM2 ?? null),
    storeysResult: check(storeys, row?.maxStoreys ?? null),
  };
}

const OCCUPANCY_GROUPS = ["A-1", "A-2", "A-3", "A-4", "B-1", "B-2", "B-3", "C", "D", "E", "F-1", "F-2", "F-3"];
const CONSTRUCTION_TYPES = ["IA", "IB", "IIA", "IIB", "IIIA", "IIIB", "IVA", "VA", "VB"];
const CODE_EDITIONS = ["NBC 2020", "NBC 2015", "ABC 2019", "BCBC 2024", "OBC 2012"];

function ResultPill({ result }: { result: "pass" | "fail" | "unknown" }) {
  if (result === "pass") return <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700"><CheckCircle className="w-3 h-3" />PASS</span>;
  if (result === "fail") return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700"><XCircle className="w-3 h-3" />FAIL</span>;
  return <span className="text-xs text-gray-400">—</span>;
}

// ── Code Strategy Tab ─────────────────────────────────────────────────────────
function CodeStrategyTab({ projectId, userId, userRole }: { projectId: number; userId: number; userRole: string }) {
  const getQuery = trpc.codeStrategy.get.useQuery({ projectId });
  const saveMutation = trpc.codeStrategy.save.useMutation();
  const approveMutation = trpc.codeStrategy.approve.useMutation();
  const generatePdfMutation = trpc.codeStrategy.generatePDF.useMutation();

  const existing = getQuery.data;
  const isOrgAdmin = userRole === "org_admin" || userRole === "admin";

  const [province, setProvince] = useState(existing?.province ?? "AB");
  const [codeEdition, setCodeEdition] = useState(existing?.codeEdition ?? "NBC 2020");
  const [constructionType, setConstructionType] = useState(existing?.constructionType ?? "IIIA");
  const [sprinklered, setSprinklered] = useState(Boolean(existing?.sprinklered));
  const [heightM, setHeightM] = useState<string>(existing?.buildingHeightM ? String(parseFloat(existing.buildingHeightM as string)) : "");
  const [areaM2, setAreaM2] = useState<string>(existing?.buildingAreaM2 ? String(parseFloat(existing.buildingAreaM2 as string)) : "");
  const [storeys, setStoreys] = useState<string>(existing?.storeys?.toString() ?? "");
  const [occupancyGroups, setOccupancyGroups] = useState<string[]>((existing?.occupancyGroups as string[]) ?? ["C"]);
  const [exitCount, setExitCount] = useState<string>(existing?.exitCount?.toString() ?? "");
  const [separationRequired, setSeparationRequired] = useState(Boolean(existing?.separationRequired));
  const [egressStrategy, setEgressStrategy] = useState(existing?.egressStrategy ?? "");

  const toggleOccupancy = (g: string) =>
    setOccupancyGroups((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const compliance = computeCompliance(
    constructionType,
    sprinklered,
    heightM ? parseFloat(heightM) : null,
    areaM2 ? parseFloat(areaM2) : null,
    storeys ? parseInt(storeys, 10) : null,
  );

  const unlimited = (v: number | null) => (v === null ? "Unlimited" : String(v));

  async function handleSave() {
    if (!occupancyGroups.length) { toast.error("Select at least one occupancy group"); return; }
    try {
      await saveMutation.mutateAsync({
        projectId,
        province,
        codeEdition,
        constructionType,
        sprinklered,
        buildingHeightM: heightM ? parseFloat(heightM) : null,
        buildingAreaM2: areaM2 ? parseFloat(areaM2) : null,
        storeys: storeys ? parseInt(storeys, 10) : null,
        occupancyGroups,
        egressStrategy: egressStrategy || undefined,
        exitCount: exitCount ? parseInt(exitCount, 10) : null,
        separationRequired,
      });
      toast.success("Code strategy saved");
      getQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    }
  }

  async function handleGeneratePDF() {
    if (!existing?.id) { toast.error("Save the draft first"); return; }
    try {
      const result = await generatePdfMutation.mutateAsync({ id: existing.id });
      const a = document.createElement("a");
      a.href = result.base64;
      a.download = result.filename;
      a.click();
    } catch (err: any) {
      toast.error(err?.message ?? "PDF generation failed");
    }
  }

  async function handleApprove() {
    if (!existing?.id) return;
    try {
      await approveMutation.mutateAsync({ id: existing.id });
      toast.success("Code strategy approved");
      getQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Approval failed");
    }
  }

  if (getQuery.isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-5">
      {/* Status badge */}
      {existing && (
        <div className="flex items-center gap-2">
          {existing.status === "approved"
            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300"><CheckCircle className="w-3 h-3" />Approved</span>
            : existing.status === "superseded"
            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">Superseded</span>
            : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">Draft</span>}
          {existing.approvedAt && (
            <span className="text-xs text-gray-400">Approved {new Date(existing.approvedAt).toLocaleDateString("en-CA")}</span>
          )}
        </div>
      )}

      {/* ── Form ── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-medium">Province</Label>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["AB", "BC", "ON"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium">Code Edition</Label>
          <Select value={codeEdition} onValueChange={setCodeEdition}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CODE_EDITIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium">Construction Type (NBC 3.2.2.)</Label>
          <Select value={constructionType} onValueChange={setConstructionType}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONSTRUCTION_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium">Sprinklered (NBC 3.2.5.)</Label>
          <div className="flex gap-2 mt-1">
            {(["Yes", "No"] as const).map((v) => (
              <button key={v} type="button"
                onClick={() => setSprinklered(v === "Yes")}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                  (v === "Yes") === sprinklered
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium">Building Height (m)</Label>
          <Input type="number" step="0.01" min="0" value={heightM} onChange={(e) => setHeightM(e.target.value)} className="mt-1" placeholder="e.g. 12.5" />
        </div>

        <div>
          <Label className="text-xs font-medium">Building Area per Floor (m²)</Label>
          <Input type="number" step="1" min="0" value={areaM2} onChange={(e) => setAreaM2(e.target.value)} className="mt-1" placeholder="e.g. 2400" />
        </div>

        <div>
          <Label className="text-xs font-medium">Storeys</Label>
          <Input type="number" step="1" min="1" value={storeys} onChange={(e) => setStoreys(e.target.value)} className="mt-1" placeholder="e.g. 4" />
        </div>

        <div>
          <Label className="text-xs font-medium">Exit Count</Label>
          <Input type="number" step="1" min="0" value={exitCount} onChange={(e) => setExitCount(e.target.value)} className="mt-1" placeholder="e.g. 2" />
        </div>
      </div>

      {/* Occupancy Groups */}
      <div>
        <Label className="text-xs font-medium">Occupancy Groups (NBC Div. A Table 3.1.2.1.)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {OCCUPANCY_GROUPS.map((g) => (
            <button key={g} type="button" onClick={() => toggleOccupancy(g)}
              className={`px-3 py-1 rounded-md border text-xs font-medium transition-all ${
                occupancyGroups.includes(g)
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-400"
              }`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Fire separation */}
      <div>
        <Label className="text-xs font-medium">Fire Separation Required (NBC 3.1.3.)</Label>
        <div className="flex gap-2 mt-1">
          {(["Yes", "No"] as const).map((v) => (
            <button key={v} type="button"
              onClick={() => setSeparationRequired(v === "Yes")}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                (v === "Yes") === separationRequired
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Egress strategy */}
      <div>
        <Label className="text-xs font-medium">Egress Strategy (NBC Part 3.4)</Label>
        <Textarea
          value={egressStrategy}
          onChange={(e) => setEgressStrategy(e.target.value)}
          placeholder="Describe exit arrangement, travel paths, and compliance approach…"
          className="mt-1 min-h-[80px] text-sm"
          maxLength={2000}
        />
      </div>

      {/* ── Auto-computed compliance preview ── */}
      <div className="rounded-lg border bg-gray-50 p-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Live Compliance Preview — NBC Table 3.2.2.2</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Max Storeys</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{unlimited(compliance.row?.maxStoreys ?? null)}</span>
              <ResultPill result={compliance.storeysResult} />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Max Building Height</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{compliance.row?.maxHeightM === null ? "Unlimited" : compliance.row?.maxHeightM !== undefined ? `${compliance.row.maxHeightM} m` : "—"}</span>
              <ResultPill result={compliance.heightResult} />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Max Area per Floor</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{compliance.row?.maxAreaM2 === null ? "Unlimited" : compliance.row?.maxAreaM2 !== undefined ? `${compliance.row.maxAreaM2.toLocaleString()} m²` : "—"}</span>
              <ResultPill result={compliance.areaResult} />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Travel Distance Limit (NBC 3.4.2.2)</span>
            <span className="font-medium text-gray-900">{compliance.travelLimit} m</span>
          </div>
          {compliance.ratings && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Structure Fire Resistance</span>
                <span className="font-medium text-gray-900">{compliance.ratings.structure}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Floor / Ceiling Assembly</span>
                <span className="font-medium text-gray-900">{compliance.ratings.floor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Exterior Wall Assembly</span>
                <span className="font-medium text-gray-900">{compliance.ratings.exterior}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-blue-700 hover:bg-blue-800 text-white">
          {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Draft"}
        </Button>

        <Button variant="outline" onClick={handleGeneratePDF} disabled={generatePdfMutation.isPending || !existing?.id}>
          {generatePdfMutation.isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
            : <><FileText className="w-4 h-4 mr-1.5" />Generate PDF</>}
        </Button>

        {isOrgAdmin && existing?.id && existing.status === "draft" && (
          <Button variant="outline" onClick={handleApprove} disabled={approveMutation.isPending}
            className="border-green-500 text-green-700 hover:bg-green-50">
            {approveMutation.isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Approving…</>
              : <><CheckCircle className="w-4 h-4 mr-1.5" />Approve</>}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProjectTabView({ projectId, onNavigate, onBack }: ProjectTabViewProps) {
  const [, setLocation] = useLocation();
  const { setActiveProjectId } = useProject();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (!projectId) return <div>Loading...</div>;

  const numericProjectId = Number(projectId);

  const projectQuery = trpc.projects.get.useQuery(
    { id: numericProjectId },
    { enabled: !!projectId }
  );

  const snapshotsQuery = trpc.compliance.getProjectSnapshots.useQuery(
    { projectId: numericProjectId },
    { enabled: !!projectId }
  );

  const meQuery = trpc.auth.me.useQuery();

  const project = projectQuery.data;
  const snapshots = snapshotsQuery.data ?? [];
  const me = meQuery.data;

  const isLoading = projectQuery.isLoading || snapshotsQuery.isLoading;
  const isError = projectQuery.isError || snapshotsQuery.isError;

  const latestSnapshot = snapshots.length > 0
    ? snapshots.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    : null;

  const complianceStatus: "PASS" | "FAIL" | "IN_REVIEW" | "UNKNOWN" =
    !latestSnapshot ? "UNKNOWN"
    : latestSnapshot.complianceStatus === "compliant" ? "PASS"
    : latestSnapshot.complianceStatus === "non_compliant" ? "FAIL"
    : "IN_REVIEW";

  const snapshotInputs: Record<string, any> = latestSnapshot?.inputs ?? {};

  const nbcLoadFactors: Record<string, number> = {
    A: 1.0, B: 4.6, C: 25.0, D: 9.3, E: 3.7, "F-1": 30, "F-2": 30, "F-3": 30,
  };
  const occupancyMajor = String(snapshotInputs.occupancy_major ?? "");
  const areaM2 = Number(snapshotInputs.area_m2) || 0;
  const loadFactor = nbcLoadFactors[occupancyMajor] ?? 9.3;
  const occupancyCurrent = areaM2 > 0 ? Math.ceil(areaM2 / loadFactor) : 0;
  const travelDistanceActual = Number(snapshotInputs.travel_distance_m) || 0;
  const travelDistanceMax = 40;
  const egressProvided = Number(snapshotInputs.exits) || 0;
  const egressRequired =
    occupancyCurrent <= 0 ? 0
    : occupancyCurrent > 600 ? 3
    : occupancyCurrent > 60 ? 2
    : 1;

  const occupancyColor = occupancyCurrent === 0 ? "text-muted-foreground" : "text-foreground";
  const travelColor =
    travelDistanceActual === 0 ? "text-muted-foreground"
    : travelDistanceActual <= travelDistanceMax ? "text-green-600"
    : "text-red-600";
  const egressColor =
    egressProvided === 0 ? "text-muted-foreground"
    : egressProvided >= egressRequired ? "text-green-600"
    : "text-red-600";

  const hasCalculations = snapshots.length > 0;
  const hasFindings = complianceStatus === "FAIL" || complianceStatus === "IN_REVIEW";
  const actionLabel = !hasCalculations ? "Upload Plan" : hasFindings ? "Review Findings" : "View Report";

  const badgeConfig = {
    PASS:     { label: "PASS",      className: "bg-green-100 text-green-800 border-green-300" },
    FAIL:     { label: "FAIL",      className: "bg-red-100 text-red-800 border-red-300" },
    IN_REVIEW:{ label: "IN REVIEW", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    UNKNOWN:  { label: "NO DATA",   className: "bg-gray-100 text-gray-600 border-gray-300" },
  };
  const badge = badgeConfig[complianceStatus];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Failed to load project. Please try again.</p>
        <button onClick={onBack} className="mt-2 text-sm underline">Go back</button>
      </div>
    );
  }

  if (!project) return null;

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview",       label: "Overview" },
    { id: "code_strategy",  label: "Code Strategy" },
    { id: "calculations",   label: "Calculations" },
    { id: "permit_package", label: "Permit Package" },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Back button */}
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        ← Back to Projects
      </button>

      {/* Project header */}
      <div className="rounded-lg border bg-card p-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold leading-tight">{project.name}</h2>
            <p className="text-sm text-muted-foreground">{project.address ?? "No address on file"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.occupancyCode} · {project.template ?? "NBC 2023"}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded border ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {project.codeEdition && (
            <Badge variant="outline" className="text-xs">📋 {project.codeEdition}</Badge>
          )}
          {project.part3Determination && (
            <Badge variant="outline" className="text-xs">🏗️ {project.part3Determination}</Badge>
          )}
          {project.constructionType && (
            <Badge variant="outline" className="text-xs">
              🧱 {project.constructionType === "combustible" ? "Combustible"
                : project.constructionType === "non_combustible" ? "Non-Combustible"
                : project.constructionType}
            </Badge>
          )}
          {project.sprinklersRequired === 1 && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-300">🚿 Sprinklers Required</Badge>
          )}
          {project.sprinklersRequired === 0 && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-300">✓ Sprinklers Not Required</Badge>
          )}
          {project.zoningCategory && (
            <Badge variant="outline" className="text-xs">🏘️ {project.zoningCategory}</Badge>
          )}
          {project.storeys && (
            <Badge variant="outline" className="text-xs">📐 {project.storeys} {project.storeys === 1 ? "Storey" : "Storeys"}</Badge>
          )}
          {project.buildingHeight && (
            <Badge variant="outline" className="text-xs">📏 {parseFloat(project.buildingHeight as string).toFixed(1)}m height</Badge>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">Key Metrics</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Occupant Load</span>
                <span className={`font-medium ${occupancyColor}`}>
                  {occupancyCurrent > 0 ? `${occupancyCurrent} persons (est.)` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Travel Distance</span>
                <span className={`font-medium ${travelColor}`}>
                  {travelDistanceActual > 0 ? `${travelDistanceActual}m (max ${travelDistanceMax}m)` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Egress Doors</span>
                <span className={`font-medium ${egressColor}`}>
                  {egressRequired > 0 ? `${egressProvided} provided, ${egressRequired} required` : "—"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setLocation(`/compliance/${projectId}`)}
            className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {actionLabel}
          </button>

          <button
            onClick={() => { setActiveProjectId(numericProjectId); setLocation("/project-checklists"); }}
            className="w-full rounded-lg border border-border py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            View Checklist
          </button>
        </div>
      )}

      {activeTab === "code_strategy" && me && (
        <CodeStrategyTab
          projectId={numericProjectId}
          userId={me.id}
          userRole={me.role}
        />
      )}

      {activeTab === "calculations" && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Calculations Package</p>
          <p className="text-xs text-gray-400 mt-1">Available in Phase 4 — coming soon</p>
        </div>
      )}

      {activeTab === "permit_package" && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Permit Package</p>
          <p className="text-xs text-gray-400 mt-1">Available in Phase 5 — coming soon</p>
        </div>
      )}
    </div>
  );
}
