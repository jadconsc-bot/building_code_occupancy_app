import { useState, useEffect } from "react";
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
import { Loader2, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { occupancyData } from "@/lib/occupancyData";
import { getChecklistForOccupancy } from "@/lib/inspectorChecklistData";
import { useProject } from "@/contexts/ProjectContext";

interface ProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (projectId: number) => void;
}

type Province = "AB" | "BC" | "OTHER";

const BUILDING_TYPES = [
  { value: "part9_single_family", label: "Part 9 — Single Family Residential" },
  { value: "part9_multiplex", label: "Part 9 — Multi-Family / Townhouse" },
  { value: "part3_residential", label: "Part 3 — Residential (4+ storeys)" },
  { value: "part3_commercial", label: "Part 3 — Commercial / Office" },
  { value: "part3_industrial", label: "Part 3 — Industrial" },
];

const STEP_LABELS = ["Project Details", "Building Type", "Jurisdiction", "Confirm & Create", "Done"];

function extractMunicipality(address: string): string {
  const known = ["Vancouver", "Victoria", "Kelowna", "Prince George", "Calgary", "Edmonton"];
  const lower = address.toLowerCase();
  return known.find(city => lower.includes(city.toLowerCase())) ?? "";
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map(step => (
        <div key={step} className="flex items-center gap-2">
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
            <div className={`h-px w-8 ${step < current ? "bg-green-600" : "bg-border"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm text-muted-foreground font-medium">
        {STEP_LABELS[current - 1]}
      </span>
    </div>
  );
}

export function ProjectWizard({ open, onOpenChange, onSuccess }: ProjectWizardProps) {
  const [, setLocation] = useLocation();
  const { setActiveProjectId } = useProject();
  const [step, setStep] = useState(1);
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  // Step 1 fields
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2 fields
  const [province, setProvince] = useState<Province | "">("");
  const [occupancyCode, setOccupancyCode] = useState("A-1");
  const [buildingType, setBuildingType] = useState("");

  // Step 3 detection results
  const [climateZone, setClimateZone] = useState("");
  const [seismicZone, setSeismicZone] = useState("");
  const [stepCodeTier, setStepCodeTier] = useState("");
  const [jurisdictionDetected, setJurisdictionDetected] = useState(false);
  const [detectError, setDetectError] = useState("");
  const [manualOverride, setManualOverride] = useState(false);

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

  const bulkSaveChecklist = trpc.projectsLegacy.checklistItems.bulkSave.useMutation();

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created successfully!");
      if (data?.id) {
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
        setStep(5);
      }
    },
    onError: (err) => {
      toast.error("Failed to create project: " + err.message);
    },
  });

  function resetForm() {
    setStep(1);
    setCreatedProjectId(null);
    setName(""); setProjectCode(""); setAddress(""); setNotes("");
    setProvince(""); setOccupancyCode("A-1"); setBuildingType("");
    setClimateZone(""); setSeismicZone(""); setStepCodeTier("");
    setJurisdictionDetected(false); setDetectError(""); setManualOverride(false);
  }

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  function handleNextFromStep2() {
    setStep(3);
    setClimateZone(""); setSeismicZone(""); setStepCodeTier("");
    setJurisdictionDetected(false); setDetectError(""); setManualOverride(false);

    if (province === "OTHER") {
      setManualOverride(true);
      return;
    }

    const municipality = extractMunicipality(address);
    const detectionProvince = province === "AB" ? "AB" as const : "BC" as const;

    if (municipality) {
      detectMutation.mutate({ municipality, province: detectionProvince });
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
    });
  }

  const step1Valid = name.trim().length > 0 && address.trim().length > 0;
  const step2Valid = occupancyCode !== "" && buildingType !== "";

  const detectedProvince = province === "AB" ? "Alberta" : province === "BC" ? "British Columbia" : province === "OTHER" ? "Other" : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        <StepIndicator current={step} total={5} />

        {/* ── Step 1: Project Details ── */}
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
              <Input
                id="wiz-address"
                placeholder="e.g., 123 Main St, Calgary, AB"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
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

        {/* ── Step 2: Building Type ── */}
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
                <option value="OTHER">Other</option>
              </select>
            </div>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="wiz-btype">Building Type *</Label>
              <select
                id="wiz-btype"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={buildingType}
                onChange={e => setBuildingType(e.target.value)}
              >
                <option value="">Select building type...</option>
                {BUILDING_TYPES.map(bt => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 3: Jurisdiction Detection ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-semibold">Province:</span> {detectedProvince}</p>
              <p><span className="font-semibold">Address:</span> {address}</p>
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

            {(!detectMutation.isPending && manualOverride) && (
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

        {/* ── Step 4: Confirm & Create ── */}
        {step === 4 && (
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
              {notes && (
                <div className="px-4 py-3">
                  <span className="text-muted-foreground block mb-1">Notes</span>
                  <span className="text-xs">{notes}</span>
                </div>
              )}
            </div>

            {jurisdictionDetected && (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 text-xs">Jurisdiction auto-detected</Badge>
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Success ── */}
        {step === 5 && (
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
        {step < 5 && (
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? onOpenChange(false) : setStep(s => s - 1)}
            disabled={createMutation.isPending}
          >
            {step === 1 ? "Cancel" : <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>}
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => {
                if (step === 2) handleNextFromStep2();
                else setStep(s => s + 1);
              }}
              disabled={
                (step === 1 && !step1Valid) ||
                (step === 2 && (!step2Valid || province === "")) ||
                (step === 3 && detectMutation.isPending)
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
  );
}
