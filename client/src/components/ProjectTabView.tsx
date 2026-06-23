import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { PermitCompletenessPanel } from "@/components/PermitCompletenessPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Loader2, FileText } from "lucide-react";
import { BriefTab } from "@/components/BriefTab";

interface ProjectTabViewProps {
  readonly projectId: string;
  readonly onNavigate?: (route: string, params?: Record<string, any>) => void;
  readonly onBack?: () => void;
}

type Tab = "brief" | "overview" | "code_strategy" | "calculations" | "permit_package";

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

type EditionStatus = 'supported' | 'partial' | 'coming_soon';
const CODE_EDITIONS = [
  { value: 'NBC 2020',        label: 'NBC 2020',                                  status: 'supported'   },
  { value: 'NBC(AE) 2023-12', label: '⚠ NBC(AE) 2023-12 — Alberta (Partial)',    status: 'partial'     },
  { value: 'BCBC 2024',       label: '⚠ BCBC 2024 — BC (Partial)',               status: 'partial'     },
  { value: 'NBC 2025',        label: 'NBC 2025 — Coming Soon',                    status: 'coming_soon' },
] as const;

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
              {CODE_EDITIONS.map((e) => (
                <SelectItem
                  key={e.value}
                  value={e.value}
                  disabled={e.status === 'coming_soon'}
                  title={e.status === 'partial' ? 'Rules partially implemented. Results reflect NBC 2020 base with limited provincial overrides.' : undefined}
                  className={e.status === 'coming_soon' ? 'text-muted-foreground opacity-50 cursor-not-allowed' : ''}
                >
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {codeEdition !== 'NBC 2020' && codeEdition !== 'NBC 2025' && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 mt-2">
              <span>⚠</span>
              <span>
                {codeEdition === 'NBC(AE) 2023-12'
                  ? 'NBC(AE) 2023-12 analysis uses NBC 2020 as the base. Alberta-specific overrides are partially implemented. Verify results against the Alberta Building Code.'
                  : 'BCBC 2024 analysis uses NBC 2020 as the base. BC-specific energy and spatial separation overrides are partially implemented. Verify results against the BC Building Code.'}
              </span>
            </div>
          )}
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

// ── Calculations Tab ──────────────────────────────────────────────────────────
const PROVINCES = ["AB", "BC", "ON", "QC", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "NU", "YT"];

const OCCUPANT_LOAD_FACTORS: Record<string, number> = {
  "A-1": 0.67, "A-2": 1.0, "A-3": 0.5, "A-4": 0.67,
  "B-1": 0.1, "B-2": 0.1, "B-3": 0.1,
  C: 0.04, D: 0.107, E: 0.27,
  "F-1": 0.033, "F-2": 0.033, "F-3": 0.033,
};

function CalculationsTab({ projectId, userRole }: { projectId: number; userRole: string }) {
  const isOrgAdmin = userRole === "org_admin" || userRole === "admin";

  const [province, setProvince] = useState("AB");
  const [codeEdition, setCodeEdition] = useState("NBC 2020");
  const [sprinklered, setSprinklered] = useState(false);

  const getQuery = trpc.calculationsPackage.get.useQuery({ projectId });
  const generateMutation = trpc.calculationsPackage.generate.useMutation({
    onSuccess: () => { getQuery.refetch(); toast.success("Calculations generated"); },
    onError: (e) => toast.error(e.message),
  });
  const approveMutation = trpc.calculationsPackage.approve.useMutation({
    onSuccess: () => { getQuery.refetch(); toast.success("Calculations approved"); },
    onError: (e) => toast.error(e.message),
  });
  const generatePdfMutation = trpc.calculationsPackage.generatePDF.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.pdfBase64;
      link.download = `calculations-package-${data.packageId}.pdf`;
      link.click();
      toast.success("PDF downloaded");
    },
    onError: (e) => toast.error(e.message),
  });

  const pkg = getQuery.data;
  const occupantRows = (pkg?.occupantLoadByGroup as any[] | null) ?? [];
  const travelResults = (pkg?.travelDistanceResults as any[] | null) ?? [];
  const areaByFloor = (pkg?.areaByFloor as Record<string, number> | null) ?? {};
  const summary = pkg?.calculationsSummaryJson as any;

  const handleGenerate = () => {
    generateMutation.mutate({ projectId, province, codeEdition, sprinklered });
  };
  const handleApprove = () => {
    if (pkg?.id) approveMutation.mutate({ packageId: pkg.id });
  };
  const handlePDF = () => {
    if (pkg?.id) generatePdfMutation.mutate({ packageId: pkg.id });
  };

  if (getQuery.isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Status badge */}
      {pkg && (
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            pkg.status === "approved" ? "bg-green-50 text-green-700 border-green-300"
            : pkg.status === "draft"    ? "bg-amber-50 text-amber-700 border-amber-300"
            : "bg-gray-100 text-gray-600 border-gray-300"
          }`}>
            {pkg.status === "approved" ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {(pkg.status ?? "draft").toUpperCase()}
          </span>
          {pkg.approvedAt && <span className="text-xs text-gray-500">Approved {new Date(pkg.approvedAt).toLocaleDateString("en-CA")}</span>}
        </div>
      )}

      {/* Generation inputs */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Generate Calculations Package</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <Label className="text-xs">Province</Label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Code Edition</Label>
            <Select value={codeEdition} onValueChange={setCodeEdition}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CODE_EDITIONS.map((e) => (
                  <SelectItem
                    key={e.value}
                    value={e.value}
                    disabled={e.status === 'coming_soon'}
                    title={e.status === 'partial' ? 'Rules partially implemented. Results reflect NBC 2020 base with limited provincial overrides.' : undefined}
                    className={e.status === 'coming_soon' ? 'text-muted-foreground opacity-50 cursor-not-allowed' : ''}
                  >
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {codeEdition !== 'NBC 2020' && codeEdition !== 'NBC 2025' && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 mt-2">
                <span>⚠</span>
                <span>
                  {codeEdition === 'NBC(AE) 2023-12'
                    ? 'NBC(AE) 2023-12 analysis uses NBC 2020 as the base. Alberta-specific overrides are partially implemented. Verify results against the Alberta Building Code.'
                    : 'BCBC 2024 analysis uses NBC 2020 as the base. BC-specific energy and spatial separation overrides are partially implemented. Verify results against the BC Building Code.'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sprinklered} onChange={e => setSprinklered(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm text-gray-700">Sprinklered</span>
            </label>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="bg-blue-700 hover:bg-blue-800 text-white">
          {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : "Generate Calculations"}
        </Button>
      </div>

      {/* Results */}
      {pkg && (
        <div className="space-y-5">
          {/* Occupant Load */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Occupant Load — NBC Table 4.1.5.3</h4>
            {occupantRows.length > 0 ? (
              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Group</th>
                      <th className="px-3 py-2 text-right font-medium">Area (m²)</th>
                      <th className="px-3 py-2 text-right font-medium">Factor (p/m²)</th>
                      <th className="px-3 py-2 text-right font-medium">Persons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {occupantRows.map((r: any) => (
                      <tr key={r.group} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{r.group}</td>
                        <td className="px-3 py-2 text-right">{Number(r.areaSqm).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{r.factor}</td>
                        <td className="px-3 py-2 text-right font-medium">{r.persons}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                      <td className="px-3 py-2">TOTAL</td>
                      <td className="px-3 py-2 text-right">{Number(pkg.totalAreaM2 ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">—</td>
                      <td className="px-3 py-2 text-right text-blue-700">{pkg.totalOccupantLoad ?? 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No room data detected. Upload and process a drawing first.</p>
            )}
          </div>

          {/* Exit Width */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-1">Exit Width — NBC 3.4.3.2</h4>
            <p className="text-sm text-blue-700">
              {pkg.totalOccupantLoad ?? 0} persons × 6.1 mm/person = <strong>{Number(pkg.exitWidthRequiredMm ?? 0)} mm</strong> required exit width
            </p>
            <p className="text-xs text-blue-500 mt-1">Minimum door clear width: 850 mm (NBC 3.3.1.13.(1)(a))</p>
          </div>

          {/* Travel Distance */}
          {travelResults.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Travel Distance — NBC 3.4.2.5</h4>
              <div className="flex gap-4 text-xs mb-2">
                <span className="text-green-600 font-medium">Pass: {summary?.travelDistancePass ?? 0}</span>
                <span className="text-red-600 font-medium">Fail: {summary?.travelDistanceFail ?? 0}</span>
                <span className="text-gray-500">Unable: {summary?.travelDistanceUnable ?? 0}</span>
              </div>
              <div className="overflow-x-auto rounded border border-gray-200 max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 text-gray-600 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Room</th>
                      <th className="px-3 py-2 text-right font-medium">Distance</th>
                      <th className="px-3 py-2 text-right font-medium">Limit</th>
                      <th className="px-3 py-2 text-center font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {travelResults.filter((r: any) => r.result !== "not_applicable").map((r: any) => (
                      <tr key={r.roomId} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{r.roomLabel}</td>
                        <td className="px-3 py-2 text-right">{r.distanceM !== null ? `${Number(r.distanceM).toFixed(1)} m` : "—"}</td>
                        <td className="px-3 py-2 text-right">{r.limit} m</td>
                        <td className="px-3 py-2 text-center">
                          {r.result === "pass" ? <span className="text-green-600 font-semibold">PASS</span>
                           : r.result === "fail" ? <span className="text-red-600 font-semibold">FAIL</span>
                           : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Area by Floor */}
          {Object.keys(areaByFloor).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Floor Area Summary</h4>
              <div className="rounded border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Floor</th>
                      <th className="px-3 py-2 text-right font-medium">Area (m²)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(areaByFloor).map(([floor, area]) => (
                      <tr key={floor} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{floor}</td>
                        <td className="px-3 py-2 text-right">{Number(area).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" onClick={handlePDF} disabled={generatePdfMutation.isPending || !pkg?.id}>
              {generatePdfMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                : <><FileText className="w-4 h-4 mr-1.5" />Generate PDF</>}
            </Button>
            {isOrgAdmin && pkg?.id && pkg.status === "draft" && (
              <Button variant="outline" onClick={handleApprove} disabled={approveMutation.isPending}
                className="border-green-500 text-green-700 hover:bg-green-50">
                {approveMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Approving…</>
                  : <><CheckCircle className="w-4 h-4 mr-1.5" />Approve</>}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Permit Package Tab ────────────────────────────────────────────────────────
type SubmissionStatus = "not_submitted" | "submitted" | "under_review" | "approved" | "rejected";

const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  not_submitted: "Not Submitted",
  submitted:     "Submitted",
  under_review:  "Under Review",
  approved:      "Approved",
  rejected:      "Rejected",
};

function StageRow({ label, exists, status, approvedAt }: {
  label: string;
  exists: boolean;
  status: string | null;
  approvedAt: Date | string | null;
}) {
  const isApproved = status === "approved";
  const isDraft    = status === "draft";
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {!exists
          ? <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
          : isApproved
          ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          : <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
        <span className={`text-sm font-medium ${!exists ? "text-gray-400" : isApproved ? "text-green-700" : "text-amber-700"}`}>
          {label}
        </span>
      </div>
      <div className="text-right">
        {!exists
          ? <span className="text-xs text-gray-400">Not started</span>
          : <span className={`text-xs font-semibold ${isApproved ? "text-green-600" : isDraft ? "text-amber-600" : "text-gray-500"}`}>
              {(status ?? "draft").toUpperCase()}
              {isApproved && approvedAt && ` · ${new Date(approvedAt).toLocaleDateString("en-CA")}`}
            </span>}
      </div>
    </div>
  );
}

function PermitPackageTab({ projectId, userRole, projectName }: { projectId: number; userRole: string; projectName: string }) {
  const isOrgAdmin = userRole === "org_admin" || userRole === "admin";

  const statusQuery = trpc.permitPackage.getStatus.useQuery({ projectId });
  const generateMutation = trpc.permitPackage.generate.useMutation({
    onSuccess: () => { statusQuery.refetch(); toast.success("Permit package generated"); },
    onError: (e) => toast.error(e.message),
  });
  const generatePdfMutation = trpc.permitPackage.generatePDF.useMutation({
    onSuccess: (data) => {
      const safeName = (projectName || String(projectId)).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
      const date = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");
      link.href = data.pdfBase64;
      link.download = `CodeComply_PermitPackage_${safeName}_${date}.pdf`;
      link.click();
      toast.success("PDF downloaded");
    },
    onError: (e) => toast.error(e.message),
  });
  const generateJsonMutation = trpc.permitPackage.generateJSON.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data.json, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `permit-package-${projectId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Electronic package downloaded");
    },
    onError: (e) => toast.error(e.message),
  });
  const trackingMutation = trpc.permitPackage.updateSubmissionTracking.useMutation({
    onSuccess: () => { statusQuery.refetch(); toast.success("Tracking updated"); },
    onError: (e) => toast.error(e.message),
  });

  const status = statusQuery.data;
  const pkg    = status?.permitPackage;

  const [submittedDate,    setSubmittedDate]    = useState(pkg?.submittedDate ? String(pkg.submittedDate).slice(0, 10) : "");
  const [appNumber,        setAppNumber]        = useState(pkg?.permitApplicationNumber ?? "");
  const [authority,        setAuthority]        = useState(pkg?.reviewingAuthority ?? "");
  const [subStatus,        setSubStatus]        = useState<SubmissionStatus>((pkg?.submissionStatus as SubmissionStatus | null) ?? "not_submitted");
  const [permitNum,        setPermitNum]        = useState(pkg?.permitNumber ?? "");

  // Sync form when status loads
  if (pkg && !trackingMutation.isPending && !trackingMutation.isSuccess) {
    // only set if different to avoid re-render loops — handled via key prop in parent
  }

  if (statusQuery.isLoading) return (
    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  );

  const handleSaveTracking = () => {
    if (!pkg?.reviewId) return;
    trackingMutation.mutate({
      reviewId:                pkg.reviewId,
      submittedDate:           submittedDate || undefined,
      permitApplicationNumber: appNumber || undefined,
      reviewingAuthority:      authority || undefined,
      submissionStatus:        subStatus,
      permitNumber:            permitNum || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stage Checklist */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Stage Readiness</p>
        <StageRow
          label="Code Strategy"
          exists={status?.codeStrategy.exists ?? false}
          status={status?.codeStrategy.status ?? null}
          approvedAt={status?.codeStrategy.approvedAt ?? null}
        />
        <StageRow
          label="Calculations Package"
          exists={status?.calculations.exists ?? false}
          status={status?.calculations.status ?? null}
          approvedAt={status?.calculations.approvedAt ?? null}
        />
        <StageRow
          label="Permit Package"
          exists={status?.permitPackage.exists ?? false}
          status={status?.permitPackage.exists ? "approved" : null}
          approvedAt={status?.permitPackage.approvedAt ?? null}
        />
      </div>

      {/* Ready for Submission banner */}
      {status?.readyForSubmission && (
        <div className="rounded-lg bg-green-50 border border-green-300 p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Ready for Submission</p>
            <p className="text-xs text-green-600">All three stages approved. You may now submit to the AHJ.</p>
          </div>
        </div>
      )}

      {/* Permit number banner */}
      {pkg?.permitNumber && (
        <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
          <p className="text-xs text-blue-500 uppercase font-semibold tracking-wide mb-1">Permit Approved</p>
          <p className="text-lg font-bold text-blue-800">{pkg.permitNumber}</p>
          <p className="text-xs text-blue-600 mt-0.5">Permit Number</p>
        </div>
      )}

      {/* Generate Package button (org admin only) */}
      {isOrgAdmin && (
        <Button
          onClick={() => generateMutation.mutate({ projectId })}
          disabled={generateMutation.isPending || !status?.codeStrategy.exists}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          {generateMutation.isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
            : <><FileText className="w-4 h-4 mr-1.5" />{pkg?.exists ? "Regenerate Package" : "Generate Permit Package"}</>}
        </Button>
      )}

      {/* Permit Completeness + PDF Generation */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">Permit Package Completeness</p>
        <PermitCompletenessPanel
          projectId={projectId}
          onGenerate={() => generatePdfMutation.mutate({ projectId })}
          isGenerating={generatePdfMutation.isPending}
        />
      </div>

      {/* Electronic package export */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateJsonMutation.mutate({ projectId })}
          disabled={generateJsonMutation.isPending}
        >
          {generateJsonMutation.isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting…</>
            : <><FileText className="w-4 h-4 mr-1.5" />Download Electronic Package (JSON)</>}
        </Button>
      </div>

      {/* Submission Tracking Form */}
      {pkg?.exists && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Submission Tracking</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Submitted Date</Label>
              <Input
                type="date"
                value={submittedDate}
                onChange={e => setSubmittedDate(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Permit Application Number</Label>
              <Input
                value={appNumber}
                onChange={e => setAppNumber(e.target.value)}
                placeholder="e.g. BP-2026-00123"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Reviewing Authority</Label>
              <Input
                value={authority}
                onChange={e => setAuthority(e.target.value)}
                placeholder="e.g. City of Calgary Development Services"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Submission Status</Label>
              <Select value={subStatus} onValueChange={v => setSubStatus(v as SubmissionStatus)}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(SUBMISSION_STATUS_LABELS) as [SubmissionStatus, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Permit Number</Label>
              <Input
                value={permitNum}
                onChange={e => setPermitNum(e.target.value)}
                placeholder="Filled in when permit approved"
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          <Button onClick={handleSaveTracking} disabled={trackingMutation.isPending} className="bg-blue-700 hover:bg-blue-800 text-white">
            {trackingMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save Tracking"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProjectTabView({ projectId, onNavigate, onBack }: ProjectTabViewProps) {
  const [, setLocation] = useLocation();
  const { setActiveProjectId } = useProject();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl ?? "overview");

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

  const meResolvedRef = useRef(false);
  const meQuery = trpc.auth.me.useQuery(undefined, {
    staleTime:             5 * 60_000,
    refetchOnWindowFocus:  false,
    refetchOnMount:        false,
    enabled:               !meResolvedRef.current,
  });
  if (meQuery.data && !meResolvedRef.current) {
    meResolvedRef.current = true;
  }

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
    { id: "brief",          label: "Project Brief" },
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
      {activeTab === "brief" && (
        <BriefTab projectId={numericProjectId} />
      )}

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

      {activeTab === "calculations" && me && (
        <CalculationsTab
          projectId={numericProjectId}
          userRole={me.role}
        />
      )}

      {activeTab === "permit_package" && me && (
        <PermitPackageTab
          projectId={numericProjectId}
          userRole={me.role}
          projectName={projectQuery.data?.name ?? ''}
        />
      )}
    </div>
  );
}
