import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, AlertTriangle, Info, Bot, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { occupancyData } from "@/lib/occupancyData";
import { OccupancyAdvisor } from "@/components/OccupancyAdvisor";
import { getChecklistForOccupancy } from "@/lib/inspectorChecklistData";
import { useProject } from "@/contexts/ProjectContext";

interface ProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (projectId: number) => void;
}

type Province = "AB" | "BC" | "ON" | "OTHER";

const BUILDING_TYPES = [
  { value: "part9_single_family", label: "Part 9 — Single Family Residential" },
  { value: "part9_multiplex", label: "Part 9 — Multi-Family / Townhouse" },
  { value: "part3_residential", label: "Part 3 — Residential (4+ storeys)" },
  { value: "part3_commercial", label: "Part 3 — Commercial / Office" },
  { value: "part3_industrial", label: "Part 3 — Industrial" },
];

const CONSTRUCTION_TYPES = [
  { value: "Combustible", label: "Combustible", desc: "Wood-frame, typical Part 9" },
  { value: "Non-Combustible", label: "Non-Combustible", desc: "Steel/concrete, typical Part 3" },
  { value: "Heavy Timber", label: "Heavy Timber", desc: "Large-dimension wood members" },
  { value: "Encapsulated Mass Timber", label: "Encapsulated Mass Timber", desc: "CLT/glulam with fire protection" },
];

const ZONING_CATEGORIES = ["Residential", "Commercial", "Industrial", "Institutional", "Mixed-Use"];

const SITE_CONSTRAINTS = [
  { value: "fire_access", label: "Fire access route constraints" },
  { value: "spatial_separation", label: "Spatial separation concerns (adjacent buildings)" },
  { value: "heritage", label: "Heritage designation" },
  { value: "flood_plain", label: "Flood plain / environmental overlay" },
  { value: "steep_grade", label: "Steep grade / slope concerns" },
];

const CODE_EDITIONS: Record<string, string> = {
  AB: "NBC(AE) 2023",
  BC: "BCBC 2024",
  ON: "OBC 2024",
  OTHER: "NBC 2020",
};

const PROVINCE_CODE_MAP: Record<string, Province> = {
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Ontario': 'ON',
  'Quebec': 'OTHER',
  'Manitoba': 'OTHER',
  'Saskatchewan': 'OTHER',
  'Nova Scotia': 'OTHER',
  'New Brunswick': 'OTHER',
  'Prince Edward Island': 'OTHER',
  'Newfoundland and Labrador': 'OTHER',
  'Northwest Territories': 'OTHER',
  'Nunavut': 'OTHER',
  'Yukon': 'OTHER',
};

const STEP_LABELS = ["Project Identity", "Pre-Design", "Code Strategy", "Jurisdiction", "Risk Summary", "Confirm & Create"];

type RiskSeverity = "critical" | "warning" | "info";
interface RiskFlag {
  severity: RiskSeverity;
  message: string;
}

function extractMunicipality(address: string): string {
  const known = ["Vancouver", "Victoria", "Kelowna", "Prince George", "Calgary", "Edmonton", "Toronto", "Ottawa"];
  const lower = address.toLowerCase();
  return known.find(city => lower.includes(city.toLowerCase())) ?? "";
}

function determinePart(storeys: number, area: number, occupancyCode: string): string {
  if (storeys <= 3 && area <= 600 && occupancyCode.startsWith("C")) return "Part 9";
  if (storeys <= 3 && area <= 600) return "Part 9";
  return "Part 3";
}

function suggestConstruction(part3Det: string): string {
  return part3Det === "Part 9" ? "Combustible" : "Non-Combustible";
}

function calcSprinklersRequired(part3Det: string, area: number, storeys: number, occupancyCode: string): boolean {
  const isPart3 = part3Det === "Part 3";
  if (isPart3 && (area > 1200 || storeys > 3)) return true;
  if (occupancyCode.startsWith("A") || occupancyCode.startsWith("B")) return true;
  if (occupancyCode === "F-1") return true;
  return false;
}

function generateRiskFlags(
  sprinklersRequired: boolean,
  part3Det: string,
  constructionType: string,
  storeys: number,
  occupancyCode: string,
  province: Province | "",
  siteConstraints: string[],
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (sprinklersRequired) {
    flags.push({ severity: "critical", message: "Sprinkler system required — coordinate with mechanical early" });
  }
  if (part3Det === "Part 3" && constructionType === "Combustible") {
    flags.push({ severity: "warning", message: "Combustible construction in Part 3 — verify area/height limits" });
  }
  if (storeys > 6) {
    flags.push({ severity: "warning", message: "High-rise provisions may apply — verify NBC Section 3.2.6" });
  }
  if (occupancyCode.startsWith("A") || occupancyCode.startsWith("B")) {
    flags.push({ severity: "info", message: "Assembly/Institutional occupancy — enhanced egress requirements apply" });
  }
  if (province === "BC") {
    flags.push({ severity: "info", message: "BC Energy Step Code applies — coordinate energy modeling early" });
  }
  if (siteConstraints.includes("spatial_separation")) {
    flags.push({ severity: "warning", message: "Spatial separation constraints detected — calculate exposure early" });
  }
  return flags;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6 flex-wrap">
      {Array.from({ length: total }, (_, i) => i + 1).map(step => (
        <div key={step} className="flex items-center gap-1.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step < current
                ? "bg-green-600 text-white"
                : step === current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step < current ? <CheckCircle2 className="w-4 h-4" /> : step}
          </div>
          {step < total && (
            <div className={`h-px w-6 ${step < current ? "bg-green-600" : "bg-border"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm text-muted-foreground font-medium">
        {STEP_LABELS[current - 1]}
      </span>
    </div>
  );
}

function RiskFlagCard({ flag }: { flag: RiskFlag }) {
  if (flag.severity === "critical") {
    return (
      <div className="flex items-start gap-2 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{flag.message}</span>
      </div>
    );
  }
  if (flag.severity === "warning") {
    return (
      <div className="flex items-start gap-2 p-3 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{flag.message}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 p-3 rounded bg-blue-50 border border-blue-200 text-blue-800 text-sm">
      <Info className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{flag.message}</span>
    </div>
  );
}

export function ProjectWizard({ open, onOpenChange, onSuccess }: ProjectWizardProps) {
  const [, setLocation] = useLocation();
  const { setActiveProjectId } = useProject();
  const [step, setStep] = useState(1);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  // Step 1
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [address, setAddress] = useState("");
  const [addressGeocoded, setAddressGeocoded] = useState(false);
  const [notes, setNotes] = useState("");
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [province, setProvince] = useState<Province | "">("");
  const [codeEdition, setCodeEdition] = useState("");
  const [codeEditionOverride, setCodeEditionOverride] = useState(false);
  const [zoningCategory, setZoningCategory] = useState("");
  const [siteConstraints, setSiteConstraints] = useState<string[]>([]);

  // Step 3
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [occupancyCode, setOccupancyCode] = useState("A-1");
  const [grossFloorArea, setGrossFloorArea] = useState<number | undefined>(undefined);
  const [buildingFootprintM2, setBuildingFootprintM2] = useState<number | undefined>(undefined);
  const [storeys, setStoreys] = useState<number | undefined>(undefined);
  const [buildingHeight, setBuildingHeight] = useState<number | undefined>(undefined);
  const [part3Determination, setPart3Determination] = useState("");
  const [part3Override, setPart3Override] = useState(false);
  const [constructionType, setConstructionType] = useState("");
  const [sprinklersRequired, setSprinklersRequired] = useState(false);
  const [sprinklersOverride, setSprinklersOverride] = useState<boolean | null>(null);
  const [buildingType, setBuildingType] = useState("");

  // Step 4 — jurisdiction
  const [climateZone, setClimateZone] = useState("");
  const [seismicZone, setSeismicZone] = useState("");
  const [stepCodeTier, setStepCodeTier] = useState("");
  const [jurisdictionDetected, setJurisdictionDetected] = useState(false);
  const [detectError, setDetectError] = useState("");
  const [manualOverride, setManualOverride] = useState(false);

  // Auto-set code edition when province changes
  useEffect(() => {
    if (province && !codeEditionOverride) {
      setCodeEdition(CODE_EDITIONS[province] ?? "NBC 2020");
    }
  }, [province, codeEditionOverride]);

  // Load Google Maps Places script once
  useEffect(() => {
    if ((window as any).google?.maps?.places) return;
    const existing = document.querySelector('script[data-gm-places]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.setAttribute('data-gm-places', '1');
    document.head.appendChild(script);
  }, []);

  // Attach Places Autocomplete to address input once Maps is ready
  useEffect(() => {
    if (!addressInputRef.current) return;
    let attached = false;
    function attach() {
      if (attached || !(window as any).google?.maps?.places) return;
      attached = true;
      const autocomplete = new (window as any).google.maps.places.Autocomplete(
        addressInputRef.current!,
        { componentRestrictions: { country: 'ca' }, fields: ['address_components', 'formatted_address', 'geometry'], types: ['address'] }
      );
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;
        const comps: any[] = place.address_components ?? [];
        const provinceComp = comps.find((c: any) => c.types.includes('administrative_area_level_1'));
        const cityComp = comps.find((c: any) => c.types.includes('locality') || c.types.includes('sublocality'));
        const provinceCode = PROVINCE_CODE_MAP[provinceComp?.long_name ?? ''];
        if (provinceCode) {
          setProvince(provinceCode);
          setAddressGeocoded(true);
        }
        // municipality is set via extractMunicipality from address in handleSubmit; store it if needed
        setAddress(place.formatted_address ?? '');
      });
    }
    // If already loaded, attach immediately; otherwise wait for script onload
    if ((window as any).google?.maps?.places) {
      attach();
    } else {
      const script = document.querySelector('script[data-gm-places]');
      if (script) script.addEventListener('load', attach);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const determinationQuery = trpc.occupancyAdvisor.determinePart.useQuery({
    footprintM2: buildingFootprintM2 ?? null,
    storeys: storeys ?? null,
    occupancyGroup: occupancyCode || null,
  }, { enabled: buildingFootprintM2 !== undefined && storeys !== undefined && occupancyCode !== "" });

  // Server-authoritative Part 3/9 determination and derived construction default.
  useEffect(() => {
    if (determinationQuery.data) {
      setPart3Determination(determinationQuery.data.determination);
      if (determinationQuery.data.determination === "Part 9") setBuildingType("part9_single_family");
      if (determinationQuery.data.determination === "Part 3") setBuildingType("part3_residential");
      if (!constructionType && determinationQuery.data.determination !== "needs_review") {
        setConstructionType(suggestConstruction(determinationQuery.data.determination));
      }
    }
  }, [determinationQuery.data, constructionType]);

  useEffect(() => {
    if (part3Determination && grossFloorArea && storeys && sprinklersOverride === null) {
      setSprinklersRequired(calcSprinklersRequired(part3Determination, grossFloorArea, storeys, occupancyCode));
    } else if (sprinklersOverride !== null) {
      setSprinklersRequired(sprinklersOverride);
    }
  }, [part3Determination, grossFloorArea, storeys, occupancyCode, sprinklersOverride]);

  const detectMutation = trpc.jurisdiction.detect.useMutation({
    onSuccess: (data) => {
      if (data.success && data.jurisdiction) {
        setClimateZone(data.jurisdiction.climateZone);
        setSeismicZone(data.jurisdiction.seismicZone);
        setStepCodeTier(data.jurisdiction.currentStepCodeTier ?? "");
        setJurisdictionDetected(true);
        setDetectError("");
      } else {
        setDetectError(data.error ?? "Jurisdiction not found for this address.");
        setManualOverride(true);
      }
    },
    onError: () => {
      setDetectError("Detection failed. Please enter jurisdiction details manually.");
      setManualOverride(true);
    },
  });

  const bulkSaveChecklist = trpc.projectsLegacy.checklistItems.bulkSave.useMutation({
    onError: (err) => {
      toast.error(`Checklist could not be saved. ${err.message ?? 'Please try again.'}`);
    },
  });

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created successfully!");
      if (data?.id) {
        // Register the new project immediately so every project entry point
        // (including Project Brief) reflects it before the wizard is closed.
        setActiveProjectId(data.id);
        const phases = getChecklistForOccupancy(occupancyCode);
        bulkSaveChecklist.mutate({
          projectId: data.id,
          items: phases.flatMap(phase =>
            phase.items.map(item => ({
              phase: phase.phase,
              itemId: item.id,
              itemText: item.description,
            }))
          ),
        });
        onSuccess?.(data.id);
        setCreatedProjectId(data.id);
        setStep(7);
      }
    },
    onError: (err) => {
      toast.error("Failed to create project: " + err.message);
    },
  });

  function resetForm() {
    setStep(1);
    setCreatedProjectId(null);
    setName(""); setProjectCode(""); setAddress(""); setAddressGeocoded(false); setNotes("");
    setProvince(""); setCodeEdition(""); setCodeEditionOverride(false);
    setZoningCategory(""); setSiteConstraints([]);
    setShowAdvisor(false);
    setOccupancyCode("A-1"); setGrossFloorArea(undefined); setBuildingFootprintM2(undefined); setStoreys(undefined);
    setBuildingHeight(undefined); setPart3Determination(""); setPart3Override(false);
    setConstructionType(""); setSprinklersRequired(false); setSprinklersOverride(null);
    setBuildingType("");
    setClimateZone(""); setSeismicZone(""); setStepCodeTier("");
    setJurisdictionDetected(false); setDetectError(""); setManualOverride(false);
  }

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  function toggleSiteConstraint(value: string) {
    setSiteConstraints(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  }

  function handleNextFromStep3() {
    setStep(4);
    setClimateZone(""); setSeismicZone(""); setStepCodeTier("");
    setJurisdictionDetected(false); setDetectError(""); setManualOverride(false);

    if (province === "OTHER" || province === "") {
      setManualOverride(true);
      return;
    }

    const municipality = extractMunicipality(address);
    const detectionProvince = province as "AB" | "BC";

    if (municipality && (province === "AB" || province === "BC")) {
      detectMutation.mutate({ municipality, province: detectionProvince, address });
    } else {
      setDetectError("Could not detect municipality from address. Please enter jurisdiction details manually.");
      setManualOverride(true);
    }
  }

  function handleCreate() {
    createMutation.mutate({
      name: name.trim(),
      description: notes.trim() || undefined,
      occupancyCode: occupancyCode || undefined,
      address: address.trim() || undefined,
      buildingType: buildingType || undefined,
      province: province === "OTHER" || province === "" ? undefined : province,
      climateZone: climateZone || undefined,
      seismicZone: seismicZone || undefined,
      stepCodeTier: stepCodeTier || undefined,
      jurisdictionDetected,
      projectCode: projectCode.trim() || undefined,
      grossFloorArea: grossFloorArea || undefined,
      buildingFootprintJson: buildingFootprintM2 !== undefined ? { value: buildingFootprintM2, confirmed: true, source: "user-entered" } : undefined,
      zoningCategory: zoningCategory || undefined,
      siteConstraints: siteConstraints.length > 0 ? JSON.stringify(siteConstraints) : undefined,
      storeys: storeys || undefined,
      buildingHeight: buildingHeight || undefined,
      constructionType: constructionType || undefined,
      sprinklersRequired,
      part3Determination: part3Determination || undefined,
      codeEdition: codeEdition || undefined,
    });
  }

  const step1Valid = name.trim().length > 0 && address.trim().length > 0;
  const step2Valid = province !== "" && zoningCategory !== "";
  const step3Valid = occupancyCode !== "" && buildingType !== "" && !!grossFloorArea && !!buildingFootprintM2 && !!storeys && constructionType !== "" && part3Determination !== "needs_review";

  const selectedOccupancy = occupancyData.find(o => o.code === occupancyCode);

  const riskFlags = generateRiskFlags(
    sprinklersRequired,
    part3Determination,
    constructionType,
    storeys ?? 0,
    occupancyCode,
    province,
    siteConstraints,
  );

  const detectedProvince = province === "AB" ? "Alberta" : province === "BC" ? "British Columbia" : province === "ON" ? "Ontario" : province === "OTHER" ? "Other" : "—";

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        {step <= 6 && <StepIndicator current={step} total={6} />}

        {/* ── Step 1: Project Identity ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wiz-name">Project Name *</Label>
              <Input
                id="wiz-name"
                placeholder="e.g., Downtown Office Tower Renovation"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-code">Project Code (optional)</Label>
              <Input
                id="wiz-code"
                placeholder="e.g. CCC21, ABC-2024 — leave blank to auto-generate"
                value={projectCode}
                onChange={e => setProjectCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Auto-generated as CC-{new Date().getFullYear()}-001 if left blank</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-address">Building Address *</Label>
              <div className="relative">
                <input
                  ref={addressInputRef}
                  id="wiz-address"
                  type="text"
                  placeholder="Start typing a Canadian address..."
                  value={address}
                  onChange={e => { setAddress(e.target.value); setAddressGeocoded(false); }}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {addressGeocoded && (
                  <span className="absolute right-3 top-2.5 text-green-600 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Jurisdiction detected
                  </span>
                )}
              </div>
              {addressGeocoded && (
                <p className="text-xs text-muted-foreground">
                  ✓ Province auto-set from address.{' '}
                  <button type="button" className="underline text-primary" onClick={() => setAddressGeocoded(false)}>
                    Edit manually
                  </button>
                </p>
              )}
              {!addressGeocoded && address.length === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Enter address to auto-detect province, or set it manually on the next step.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-notes">Notes (optional)</Label>
              <Textarea
                id="wiz-notes"
                placeholder="Project scope, client notes, special considerations..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Pre-Design / Due Diligence ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wiz-province">Province *</Label>
              <select
                id="wiz-province"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={province}
                onChange={e => setProvince(e.target.value as Province | "")}
              >
                <option value="">Select province...</option>
                <option value="AB">Alberta</option>
                <option value="BC">British Columbia</option>
                <option value="ON">Ontario</option>
                <option value="OTHER">Other Province / Territory</option>
              </select>
            </div>

            {province && (
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Code Edition</span>
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() => setCodeEditionOverride(v => !v)}
                  >
                    {codeEditionOverride ? "Use default" : "Override"}
                  </button>
                </Label>
                {codeEditionOverride ? (
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={codeEdition}
                    onChange={e => setCodeEdition(e.target.value)}
                  >
                    <option value="NBC(AE) 2023">NBC(AE) 2023 — Alberta</option>
                    <option value="BCBC 2024">BCBC 2024 — British Columbia</option>
                    <option value="OBC 2024">OBC 2024 — Ontario</option>
                    <option value="NBC 2020">NBC 2020 — Other</option>
                    <option value="NBC 2025" disabled>NBC 2025 — Coming Soon</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">{codeEdition}</Badge>
                    <span className="text-xs text-muted-foreground">auto-selected for {detectedProvince}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="wiz-zoning">Zoning Category *</Label>
              <select
                id="wiz-zoning"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={zoningCategory}
                onChange={e => setZoningCategory(e.target.value)}
              >
                <option value="">Select zoning category...</option>
                {ZONING_CATEGORIES.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Site Constraints (optional)</Label>
              <div className="space-y-2">
                {SITE_CONSTRAINTS.map(sc => (
                  <label key={sc.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteConstraints.includes(sc.value)}
                      onChange={() => toggleSiteConstraint(sc.value)}
                      className="rounded"
                    />
                    {sc.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Code Strategy ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="wiz-occ">Occupancy Classification *</Label>
              <select
                id="wiz-occ"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={occupancyCode}
                onChange={e => setOccupancyCode(e.target.value)}
              >
                {occupancyData.map(occ => (
                  <option key={occ.code} value={occ.code}>
                    {occ.code} — {occ.name}
                  </option>
                ))}
              </select>
              {selectedOccupancy?.compliance && (
                <div className="mt-2 p-3 bg-muted/40 rounded-md border border-border text-xs space-y-1">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] mb-2">Compliance Preview</p>
                  {selectedOccupancy.compliance.fireResistance && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fire Resistance</span>
                      <span className="font-medium">{selectedOccupancy.compliance.fireResistance}</span>
                    </div>
                  )}
                  {selectedOccupancy.compliance.sprinklers && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sprinklers</span>
                      <span className="font-medium">{selectedOccupancy.compliance.sprinklers}</span>
                    </div>
                  )}
                  {selectedOccupancy.compliance.construction && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Construction</span>
                      <span className="font-medium">{selectedOccupancy.compliance.construction}</span>
                    </div>
                  )}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowAdvisor(true)}
              >
                <Bot className="w-3.5 h-3.5" />
                Get AI Help with Classification
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="wiz-area">Total/Gross Floor Area m² *</Label>
                <Input
                  id="wiz-area"
                  type="number"
                  placeholder="e.g. 1200"
                  value={grossFloorArea ?? ""}
                  onChange={e => setGrossFloorArea(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wiz-footprint">Building Footprint at Grade m² *</Label>
                <Input
                  id="wiz-footprint"
                  type="number"
                  min="0"
                  placeholder="e.g. 418"
                  value={buildingFootprintM2 ?? ""}
                  onChange={e => setBuildingFootprintM2(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
                <p className="text-xs text-muted-foreground">Ground-floor footprint, not total floor area across storeys.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wiz-storeys">Storeys *</Label>
                <Input
                  id="wiz-storeys"
                  type="number"
                  placeholder="e.g. 4"
                  min="1"
                  value={storeys ?? ""}
                  onChange={e => setStoreys(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wiz-height">Building Height m (optional)</Label>
              <Input
                id="wiz-height"
                type="number"
                placeholder="e.g. 12.5"
                value={buildingHeight ?? ""}
                onChange={e => setBuildingHeight(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>

            {/* Part 3 / Part 9 Determination */}
            {part3Determination && (
              <div className="space-y-2">
                <Label>Part 3 / Part 9 Determination</Label>
                <div className="flex items-center gap-2">
                    <Badge className={part3Determination === "Part 9" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                      {part3Determination}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {part3Determination === "Part 9" ? "≤3 storeys, ≤600 m²" : ">3 storeys or >600 m²"}
                    </span>
                </div>
              </div>
            )}

            {/* Construction Type */}
            <div className="space-y-2">
              <Label>Construction Type *</Label>
              <div className="grid grid-cols-1 gap-2">
                {CONSTRUCTION_TYPES.map(ct => (
                  <label
                    key={ct.value}
                    className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                      constructionType === ct.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="constructionType"
                      value={ct.value}
                      checked={constructionType === ct.value}
                      onChange={() => setConstructionType(ct.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium">{ct.label}</p>
                      <p className="text-xs text-muted-foreground">{ct.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Sprinkler Requirement */}
            {part3Determination && grossFloorArea && storeys && (
              <div className="space-y-2">
                <div className={`p-3 rounded-md border ${sprinklersRequired ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {sprinklersRequired ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      <span className={`text-sm font-semibold ${sprinklersRequired ? "text-red-700" : "text-green-700"}`}>
                        {sprinklersRequired ? "Sprinklers Required by NBC" : "Sprinklers Not Required"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-primary underline"
                      onClick={() => {
                        if (sprinklersOverride !== null) {
                          setSprinklersOverride(null);
                        } else {
                          setSprinklersOverride(!sprinklersRequired);
                        }
                      }}
                    >
                      {sprinklersOverride !== null ? "Use auto" : "Override"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Building Type */}
            <div className="space-y-2">
              <Label htmlFor="wiz-btype">Building Type *</Label>
              <select
                id="wiz-btype"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={buildingType}
                onChange={e => setBuildingType(e.target.value)}
                disabled
              >
                <option value="">Select building type...</option>
                {BUILDING_TYPES.map(bt => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 4: Jurisdiction Detection ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-semibold">Province:</span> {detectedProvince}</p>
              <p><span className="font-semibold">Address:</span> {address}</p>
              <p><span className="font-semibold">Code Edition:</span> <span className="font-mono text-xs">{codeEdition}</span></p>
            </div>

            {detectMutation.isPending && (
              <div className="flex items-center gap-3 py-4 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Detecting jurisdiction data...</span>
              </div>
            )}

            {!detectMutation.isPending && jurisdictionDetected && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Jurisdiction detected</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded p-3">
                    <p className="text-xs text-muted-foreground mb-1">Climate Zone</p>
                    <p className="font-bold text-lg">{climateZone || "—"}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-xs text-muted-foreground mb-1">Seismic Zone</p>
                    <p className="font-bold text-lg">{seismicZone || "—"}</p>
                  </div>
                  {province === "BC" && (
                    <div className="border rounded p-3 col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Step Code Tier (BC)</p>
                      <p className="font-bold text-lg">{stepCodeTier ? `Tier ${stepCodeTier}` : "Not required"}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setManualOverride(true)}
                >
                  Override detected values
                </button>
              </div>
            )}

            {!detectMutation.isPending && detectError && !manualOverride && (
              <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{detectError}</p>
              </div>
            )}

            {!detectMutation.isPending && manualOverride && (
              <div className="space-y-3 border-t pt-3">
                <p className="text-sm font-semibold">Manual Entry</p>
                <div className="space-y-2">
                  <Label htmlFor="wiz-cz">Climate Zone</Label>
                  <select
                    id="wiz-cz"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={climateZone}
                    onChange={e => setClimateZone(e.target.value)}
                  >
                    <option value="">Not available</option>
                    {["4", "5", "6", "7A", "7B", "8"].map(z => (
                      <option key={z} value={z}>Zone {z}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wiz-sz">Seismic Zone</Label>
                  <select
                    id="wiz-sz"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={seismicZone}
                    onChange={e => setSeismicZone(e.target.value)}
                  >
                    <option value="">Not available</option>
                    {["Low", "Intermediate", "High", "Very High"].map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
                {province === "BC" && (
                  <div className="space-y-2">
                    <Label htmlFor="wiz-sct">Step Code Tier (BC)</Label>
                    <select
                      id="wiz-sct"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      value={stepCodeTier}
                      onChange={e => setStepCodeTier(e.target.value)}
                    >
                      <option value="">Not required</option>
                      {["1", "2", "3", "4", "5"].map(t => (
                        <option key={t} value={t}>Tier {t}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Risk Summary ── */}
        {step === 5 && (
          <div className="space-y-4">
            {/* Compliance Readiness */}
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Compliance Readiness</p>
              {[
                { label: "Code Edition confirmed", done: !!codeEdition },
                { label: "Occupancy classified", done: !!occupancyCode },
                { label: "Construction type determined", done: !!constructionType },
                { label: "Sprinkler requirement assessed", done: part3Determination !== "" },
                { label: "Jurisdiction detected", done: jurisdictionDetected || !!climateZone },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done
                    ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                  <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Risk Flags */}
            {riskFlags.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Flags</p>
                {riskFlags.map((flag, i) => (
                  <RiskFlagCard key={i} flag={flag} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded bg-green-50 border border-green-200 text-green-800 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>No risk flags — project parameters look straightforward.</span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 6: Confirm & Create ── */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="border rounded-lg divide-y text-sm">
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Project Name</span>
                <span className="font-semibold">{name}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Project Code</span>
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {projectCode.trim() || `CC-${new Date().getFullYear()}-### (auto)`}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Address</span>
                <span className="font-semibold text-right max-w-[60%]">{address}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Province</span>
                <span className="font-semibold">{detectedProvince}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Code Edition</span>
                <span className="font-mono text-xs">{codeEdition}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Zoning</span>
                <span className="font-semibold">{zoningCategory || "—"}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Occupancy</span>
                <span className="font-semibold">{occupancyCode}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Building Type</span>
                <span className="font-semibold text-right max-w-[60%]">
                  {BUILDING_TYPES.find(b => b.value === buildingType)?.label ?? "—"}
                </span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Area / Storeys</span>
                <span className="font-semibold">{grossFloorArea ? `${grossFloorArea} m²` : "—"} / {storeys ?? "—"}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Determination</span>
                <Badge className={part3Determination === "Part 9" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                  {part3Determination || "—"}
                </Badge>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Construction</span>
                <span className="font-semibold">{constructionType || "—"}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Sprinklers</span>
                <Badge className={sprinklersRequired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                  {sprinklersRequired ? "Required" : "Not Required"}
                </Badge>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Climate Zone</span>
                <span className="font-semibold">{climateZone || "Not available"}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-muted-foreground">Seismic Zone</span>
                <span className="font-semibold">{seismicZone || "Not available"}</span>
              </div>
              {province === "BC" && (
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-muted-foreground">Step Code Tier</span>
                  <span className="font-semibold">{stepCodeTier ? `Tier ${stepCodeTier}` : "Not required"}</span>
                </div>
              )}
              {siteConstraints.length > 0 && (
                <div className="px-4 py-3">
                  <span className="text-muted-foreground block mb-1">Site Constraints</span>
                  <div className="flex flex-wrap gap-1">
                    {siteConstraints.map(c => (
                      <Badge key={c} variant="outline" className="text-xs">
                        {SITE_CONSTRAINTS.find(sc => sc.value === c)?.label ?? c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {notes && (
                <div className="px-4 py-3">
                  <span className="text-muted-foreground block mb-1">Notes</span>
                  <span className="text-xs">{notes}</span>
                </div>
              )}
            </div>

            {jurisdictionDetected && (
              <Badge className="bg-green-100 text-green-800 text-xs">Jurisdiction auto-detected</Badge>
            )}

            {riskFlags.filter(f => f.severity === "critical").length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{riskFlags.filter(f => f.severity === "critical").length} critical flag(s) — review Step 5 before proceeding</span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 7: Success ── */}
        {step === 7 && (
          <div className="space-y-6 py-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
              <h3 className="text-lg font-semibold">Project Created!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                <strong>{name}</strong> has been created with a full inspection checklist based on occupancy {occupancyCode}.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                  if (createdProjectId) setLocation(`/project/${createdProjectId}`);
                }}
                className="w-full"
              >
                Go to Project
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (createdProjectId) setActiveProjectId(createdProjectId);
                  resetForm();
                  onOpenChange(false);
                  setLocation('/project-checklists');
                }}
              >
                View Checklist
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => { resetForm(); onOpenChange(false); }}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        {step < 7 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <Button
              variant="ghost"
              onClick={() => step === 1 ? onOpenChange(false) : setStep(s => s - 1)}
              disabled={createMutation.isPending}
            >
              {step === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>}
            </Button>

            {step < 6 ? (
              <Button
                onClick={() => {
                  if (step === 3) handleNextFromStep3();
                  else setStep(s => s + 1);
                }}
                disabled={
                  (step === 1 && !step1Valid) ||
                  (step === 2 && !step2Valid) ||
                  (step === 3 && !step3Valid) ||
                  (step === 4 && detectMutation.isPending)
                }
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    <OccupancyAdvisor
      open={showAdvisor}
      onOpenChange={setShowAdvisor}
      province={province !== "OTHER" ? province : ""}
      initialArea={grossFloorArea}
      initialStoreys={storeys}
      onConfirm={(code) => {
        setOccupancyCode(code);
        setShowAdvisor(false);
      }}
    />
    </>
  );
}
