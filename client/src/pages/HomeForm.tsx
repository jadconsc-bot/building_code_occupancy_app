import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Info } from "lucide-react";

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "yesno" | "section";
  col?: "full" | "half";
  options?: { value: string; label: string }[];
  unit?: string;
  min?: number;
  max?: number;
  helpText?: string;
  showIf?: (answers: Record<string, unknown>) => boolean;
  required?: boolean;
}

// ─── Shared field blocks ──────────────────────────────────────────────────────

const PROPERTY_FIELDS: FieldConfig[] = [
  { key: "_s_property", label: "Property", type: "section" },
  {
    key: "province",
    label: "Province",
    type: "select",
    col: "half",
    options: [
      { value: "AB", label: "Alberta" },
      { value: "BC", label: "British Columbia" },
      { value: "ON", label: "Ontario" },
    ],
    required: true,
  },
  { key: "municipality", label: "Municipality / City", type: "text", col: "half" },
];

const EGRESS_DETAIL_FIELDS: FieldConfig[] = [
  { key: "egressWindowAreaM2", label: "Opening area", type: "number", unit: "m²", col: "half", showIf: (a) => a.egressWindows === "yes" },
  {
    key: "egressWindowHeightMm",
    label: "Clear height",
    type: "number",
    unit: "mm",
    col: "half",
    helpText: "Min 380 mm clear",
    showIf: (a) => a.egressWindows === "yes",
  },
  {
    key: "egressWindowWidthMm",
    label: "Clear width",
    type: "number",
    unit: "mm",
    col: "half",
    helpText: "Min 380 mm clear",
    showIf: (a) => a.egressWindows === "yes",
  },
  {
    key: "egressWindowSillMm",
    label: "Sill height",
    type: "number",
    unit: "mm",
    col: "half",
    helpText: "Max 900 mm above finished floor",
    showIf: (a) => a.egressWindows === "yes",
  },
];

const WINDOW_WELL_FIELDS: FieldConfig[] = [
  { key: "_s_well", label: "Window Well", type: "section" },
  {
    key: "isBelowGradeBedroom",
    label: "Below-grade bedroom?",
    type: "yesno",
    col: "full",
    helpText: "Any bedroom fully or partially below finished grade",
  },
  {
    key: "windowWellProjectionMm",
    label: "Well projection",
    type: "number",
    unit: "mm",
    col: "half",
    helpText: "Min 760 mm from window face to well wall",
    showIf: (a) => a.isBelowGradeBedroom === "yes",
  },
  {
    key: "windowWellDepthMm",
    label: "Well depth",
    type: "number",
    unit: "mm",
    col: "half",
    showIf: (a) => a.isBelowGradeBedroom === "yes",
  },
  {
    key: "windowSwingType",
    label: "Window opening type",
    type: "select",
    col: "half",
    options: [
      { value: "inswing", label: "Inswing (casement in)" },
      { value: "outswing", label: "Outswing (casement out)" },
      { value: "slider", label: "Horizontal slider" },
      { value: "double_hung", label: "Double hung" },
    ],
    showIf: (a) => a.isBelowGradeBedroom === "yes",
  },
  {
    key: "windowWellSashDepthMm",
    label: "Open sash depth",
    type: "number",
    unit: "mm",
    col: "half",
    helpText: "Outswing sash reduces clear projection",
    showIf: (a) => a.isBelowGradeBedroom === "yes" && a.windowSwingType === "outswing",
  },
  {
    key: "windowWellHasCover",
    label: "Window well cover?",
    type: "yesno",
    col: "half",
    showIf: (a) => a.isBelowGradeBedroom === "yes",
  },
  {
    key: "windowWellCoverOpensInside",
    label: "Cover opens from inside?",
    type: "yesno",
    col: "half",
    showIf: (a) => a.isBelowGradeBedroom === "yes" && a.windowWellHasCover === "yes",
  },
  {
    key: "windowWellHasLadder",
    label: "Permanent ladder / steps?",
    type: "yesno",
    col: "half",
    showIf: (a) => a.isBelowGradeBedroom === "yes",
  },
];

const SPATIAL_SEPARATION_FIELDS: FieldConfig[] = [
  { key: "_s_spatial", label: "Spatial Separation (NBC 9.10.14)", type: "section" },
  {
    key: "limitingDistanceM",
    label: "Limiting distance",
    type: "number",
    unit: "m",
    col: "half",
    helpText: "Distance from building face to property line",
  },
  { key: "facesStreet", label: "Street-facing face?", type: "yesno", col: "half" },
  { key: "fireResponseOver10Min", label: "Rural fire response (>10 min)?", type: "yesno", col: "half" },
  {
    key: "exposingFaceAreaM2",
    label: "Exposing face area",
    type: "number",
    unit: "m²",
    col: "half",
    showIf: (a) => !!a.limitingDistanceM,
  },
  {
    key: "totalOpeningAreaM2",
    label: "Total opening area",
    type: "number",
    unit: "m²",
    col: "half",
    showIf: (a) => !!a.limitingDistanceM,
  },
];

const ELECTRICAL_FIELDS: FieldConfig[] = [
  { key: "_s_electrical", label: "Electrical", type: "section" },
  { key: "hasSubPanel", label: "Dedicated sub-panel?", type: "yesno", col: "half" },
  {
    key: "serviceAmps",
    label: "Panel amperage",
    type: "number",
    unit: "A",
    col: "half",
    showIf: (a) => a.hasSubPanel === "yes",
  },
  {
    key: "hasKitchenGFCI",
    label: "Kitchen GFCI outlets?",
    type: "yesno",
    col: "half",
    helpText: "Required within 1.5 m of sink (CEC 26-700)",
    showIf: (a) => a.kitchen === "yes",
  },
  {
    key: "hasBathroomGFCI",
    label: "Bathroom GFCI outlets?",
    type: "yesno",
    col: "half",
    showIf: (a) => a.fullBathroom === "yes",
  },
  {
    key: "hasBedroomAFCI",
    label: "Bedroom AFCI breakers?",
    type: "yesno",
    col: "half",
    helpText: "Arc-fault breakers on bedroom circuits (CEC 26-656)",
    showIf: (a) => Number(a.bedroomCount) > 0,
  },
];

const PLUMBING_FIELDS: FieldConfig[] = [
  { key: "_s_suite_plumbing", label: "Suite Plumbing", type: "section" },
  {
    key: "hasBackwaterValve",
    label: "Backwater valve?",
    type: "yesno",
    col: "full",
    helpText: "Sewage check valve — required for below-grade plumbing (NBC 7.4.4)",
  },
  { key: "suiteToilets",  label: "Toilets in suite",           type: "number", min: 0, col: "half", helpText: "Fixtures in the NEW suite only" },
  { key: "suiteSinks",    label: "Sinks in suite",             type: "number", min: 0, col: "half", helpText: "Fixtures in the NEW suite only" },
  { key: "suiteShowers",  label: "Showers in suite",           type: "number", min: 0, col: "half" },
  { key: "suiteBathtubs", label: "Bathtubs in suite",          type: "number", min: 0, col: "half" },
  { key: "suiteWashers",  label: "Washing machines in suite",  type: "number", min: 0, col: "half" },
  {
    key: "hasSuiteFloorDrain",
    label: "Floor drain in laundry?",
    type: "yesno",
    col: "half",
    showIf: (a) => Number(a.suiteWashers) > 0,
  },
  { key: "_s_whole_property", label: "Whole Property", type: "section" },
  {
    key: "propertyToilets",
    label: "Total toilets (whole property)",
    type: "number", min: 0, col: "half",
    helpText: "Existing + new suite combined",
  },
  {
    key: "propertySinks",
    label: "Total sinks (all floors)",
    type: "number", min: 0, col: "half",
  },
  {
    key: "propertyShowers",
    label: "Total showers",
    type: "number", min: 0, col: "half",
  },
  {
    key: "propertyBathtubs",
    label: "Total bathtubs",
    type: "number", min: 0, col: "half",
  },
  {
    key: "propertyWashers",
    label: "Total washing machines",
    type: "number", min: 0, col: "half",
  },
  {
    key: "propertyDishwashers",
    label: "Total dishwashers",
    type: "number", min: 0, col: "half",
  },
  {
    key: "existingDrainSizeMm",
    label: "Existing main drain size",
    type: "select",
    col: "full",
    options: [
      { value: "50",  label: "50 mm (2″)" },
      { value: "75",  label: "75 mm (3″) — common pre-1980" },
      { value: "100", label: "100 mm (4″) — common post-1990" },
      { value: "125", label: "125 mm (5″)" },
      { value: "150", label: "150 mm (6″)" },
    ],
    helpText:
      "Check the drain pipe where it exits the foundation — usually stamped on the pipe. " +
      "Most pre-1980 homes have 75 mm (3 inch). Post-1990 typically 100 mm.",
  },
];

// ─── Per-project-type field lists ─────────────────────────────────────────────

const QUESTIONS: Record<string, FieldConfig[]> = {
  secondary_suite: [
    ...PROPERTY_FIELDS,
    { key: "yearBuilt",     label: "Year built",        type: "number", min: 1850, max: 2026, col: "half" },
    {
      key: "suiteLocation",
      label: "Suite location",
      type: "select",
      col: "half",
      options: [
        { value: "basement",        label: "Basement" },
        { value: "above_grade",     label: "Above grade" },
        { value: "attached_garage", label: "Attached garage" },
      ],
      required: true,
    },

    // Structure
    { key: "_s_structure", label: "Space & Structure", type: "section" },
    { key: "suiteAreaSqFt",    label: "Suite floor area",   type: "number", unit: "sq ft", col: "half" },
    { key: "ceilingHeightFt",  label: "Ceiling height",     type: "number", unit: "ft", min: 4, max: 20, col: "half", required: true },
    { key: "bedroomCount",     label: "Bedrooms",           type: "number", min: 0, max: 10,             col: "half", required: true },
    { key: "separateEntrance", label: "Separate entrance?", type: "yesno", col: "half", required: true },
    { key: "parking",          label: "Parking space?",     type: "yesno", col: "half", required: true },
    { key: "kitchen",          label: "Kitchen?",           type: "yesno", col: "half", required: true },
    { key: "fullBathroom",     label: "Full bathroom?",     type: "yesno", col: "half", required: true },

    // Egress
    { key: "_s_egress", label: "Egress Windows", type: "section" },
    {
      key: "egressWindows",
      label: "Egress windows in sleeping areas?",
      type: "yesno",
      col: "full",
      required: true,
      helpText: "Min 0.35 m² operable opening, 380×380 mm clear, sill ≤900 mm above floor",
    },
    ...EGRESS_DETAIL_FIELDS,

    // Window well
    ...WINDOW_WELL_FIELDS,

    // Fire & safety
    { key: "_s_fire", label: "Fire & Safety", type: "section" },
    { key: "smokeAlarms",   label: "Interconnected smoke alarms?",  type: "yesno", col: "half", required: true },
    {
      key: "smokeAlarmType",
      label: "Alarm type",
      type: "select",
      col: "half",
      options: [
        { value: "hardwired", label: "Hardwired (required for new)" },
        { value: "battery",   label: "Battery-only" },
        { value: "unknown",   label: "Not sure" },
      ],
      showIf: (a) => a.smokeAlarms === "yes",
    },
    { key: "coDetectors",    label: "CO detectors?",                       type: "yesno", col: "half", required: true },
    { key: "fireSeparation", label: "Fire separation from main dwelling?",  type: "yesno", col: "half", required: true },
    { key: "sprinklerSystem",label: "Sprinkler system?",                   type: "yesno", col: "half", required: true },

    // Spatial separation
    ...SPATIAL_SEPARATION_FIELDS,

    // Electrical
    ...ELECTRICAL_FIELDS,

    // Plumbing
    ...PLUMBING_FIELDS,
  ],

  deck_patio: [
    ...PROPERTY_FIELDS,

    { key: "_s_deck", label: "Deck Details", type: "section" },
    { key: "attachedToHouse",   label: "Attached to the house?",        type: "yesno", col: "half", required: true },
    { key: "heightAboveGradeFt",label: "Max height above grade",        type: "number", unit: "ft", min: 0, col: "half", required: true },
    { key: "deckAreaSqFt",      label: "Deck area",                     type: "number", unit: "sq ft", col: "half" },
    {
      key: "ledgerAttachment",
      label: "Ledger bolted to house framing?",
      type: "yesno",
      col: "half",
      showIf: (a) => a.attachedToHouse === "yes",
    },

    { key: "_s_structure", label: "Structure", type: "section" },
    {
      key: "footingType",
      label: "Footing type",
      type: "select",
      col: "full",
      options: [
        { value: "concrete", label: "Concrete piers (below frost line)" },
        { value: "helical",  label: "Helical / screw piles" },
        { value: "surface",  label: "Surface / floating (deck blocks)" },
      ],
      required: true,
    },
    { key: "joistSpanFt",  label: "Joist span",          type: "number", unit: "ft", min: 1, col: "half", required: true },
    { key: "beamSpanFt",   label: "Beam span (post-to-post)", type: "number", unit: "ft", min: 1, col: "half", required: true },
    { key: "postHeightFt", label: "Post height",          type: "number", unit: "ft", min: 0, col: "half" },
    { key: "guardRail",    label: "Guard rail present?",  type: "yesno", col: "half", required: true },
    {
      key: "guardRailHeightFt",
      label: "Guard rail height",
      type: "number",
      unit: "ft",
      col: "half",
      showIf: (a) => a.guardRail === "yes",
    },
  ],

  basement_development: [
    ...PROPERTY_FIELDS,
    { key: "yearBuilt", label: "Year built", type: "number", min: 1850, max: 2026, col: "half" },

    { key: "_s_structure", label: "Space & Structure", type: "section" },
    { key: "ceilingHeightFt", label: "Ceiling height",  type: "number", unit: "ft", min: 4, max: 20, col: "half", required: true },
    { key: "bedroomCount",    label: "Bedrooms",         type: "number", min: 0, max: 10,             col: "half", required: true },
    { key: "fullBathroom",    label: "Bathroom planned?",type: "yesno", col: "half", required: true },
    { key: "kitchen",         label: "Kitchen planned?", type: "yesno", col: "half" },
    { key: "insulation",      label: "Insulation?",      type: "yesno", col: "half", required: true },
    {
      key: "insulationRValue",
      label: "Insulation R-value",
      type: "number",
      min: 1,
      col: "half",
      showIf: (a) => a.insulation === "yes",
    },
    { key: "separateEntrance", label: "Separate entrance?", type: "yesno", col: "half" },

    { key: "_s_egress", label: "Egress Windows", type: "section" },
    {
      key: "egressWindows",
      label: "Egress windows in sleeping areas?",
      type: "yesno",
      col: "full",
      required: true,
      helpText: "Min 0.35 m² operable opening, 380×380 mm clear, sill ≤900 mm above floor",
    },
    ...EGRESS_DETAIL_FIELDS,

    ...WINDOW_WELL_FIELDS,

    { key: "_s_fire", label: "Fire & Safety", type: "section" },
    { key: "smokeAlarms", label: "Smoke alarms?", type: "yesno", col: "half", required: true },
    {
      key: "smokeAlarmType",
      label: "Alarm type",
      type: "select",
      col: "half",
      options: [
        { value: "hardwired", label: "Hardwired (required for new)" },
        { value: "battery",   label: "Battery-only" },
        { value: "unknown",   label: "Not sure" },
      ],
      showIf: (a) => a.smokeAlarms === "yes",
    },
    { key: "coDetectors",    label: "CO detectors?",    type: "yesno", col: "half" },
    { key: "sprinklerSystem",label: "Sprinkler system?",type: "yesno", col: "half" },

    ...SPATIAL_SEPARATION_FIELDS,
    ...ELECTRICAL_FIELDS,
    ...PLUMBING_FIELDS,
  ],
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  secondary_suite: "Secondary Suite",
  deck_patio: "Deck / Patio",
  basement_development: "Basement Development",
};

export default function HomeForm({ params }: { params?: { projectType?: string } }) {
  const projectType = params?.projectType ?? "";
  const [, setLocation] = useLocation();

  const fields = QUESTIONS[projectType];
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [step, setStep] = useState<"email" | "form">("email");

  const createReport = trpc.home.createReport.useMutation();

  if (!fields) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <p className="text-gray-500">Unknown project type. <a href="/home" className="text-blue-600 underline">Go back</a></p>
      </div>
    );
  }

  const visibleFields = fields.filter((f) => !f.showIf || f.showIf(answers));

  function setValue(key: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();

    const missing = visibleFields
      .filter((f) => f.type !== "section" && f.required === true && !answers[f.key] && answers[f.key] !== 0)
      .map((f) => f.label);

    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`);
      return;
    }

    try {
      const result = await createReport.mutateAsync({
        email,
        formAnswers: { projectType, ...answers } as any,
      });

      if (result.foundingMemberReport && result.reportToken) {
        setLocation(`/home/report/${result.reportToken}`);
        return;
      }

      sessionStorage.setItem("cc_home_pi", result.paymentIntentId ?? "");
      sessionStorage.setItem("cc_home_cs", result.clientSecret ?? "");
      setLocation(`/home/preview?pi=${result.paymentIntentId}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong — please try again");
    }
  }

  const isLoading = createReport.isPending;

  const sectionNames = fields.filter((f) => f.type === "section").map((f) => f.label);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-20">
      <button
        onClick={() => setLocation("/home")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> All project types
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {PROJECT_TYPE_LABELS[projectType] ?? projectType}
      </h1>
      <p className="text-sm text-gray-500 mb-4">Answer the questions below — we'll check your project against the building code.</p>

      {step === "form" && sectionNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6 p-2 bg-muted/30 rounded-lg border border-border/50">
          {sectionNames.map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}

      {step === "email" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
            setStep("form");
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="email">Your email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Your report PDF will be sent here after payment.</p>
          </div>
          <Button type="submit" className="w-full">
            Continue <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            {visibleFields.map((field) => {
              const isSection = field.type === "section";
              const isHalf = !isSection && field.col === "half";

              return (
                <div
                  key={field.key}
                  className={isSection || !isHalf ? "col-span-1 sm:col-span-2" : "col-span-1"}
                >
                  {/* Section header */}
                  {isSection && (
                    <div className="flex items-center gap-3 pt-4 mt-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        {field.label}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {/* Regular field */}
                  {!isSection && (
                    <>
                      <Label htmlFor={field.key} className="flex items-center gap-1">
                        {field.label}
                        {field.required === true && <span className="text-red-500">*</span>}
                      </Label>

                      {field.helpText && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 mb-1">
                          <Info className="w-3 h-3 shrink-0" />
                          {field.helpText}
                        </p>
                      )}

                      {field.type === "yesno" && (
                        <div className="flex gap-2 mt-1">
                          {(["yes", "no"] as const).map((v) => (
                            <Button
                              key={v}
                              type="button"
                              variant={answers[field.key] === v ? "default" : "outline"}
                              size="sm"
                              className={`flex-1 ${answers[field.key] === v ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : ""}`}
                              onClick={() => setValue(field.key, v)}
                            >
                              {v === "yes" ? "Yes" : "No"}
                            </Button>
                          ))}
                        </div>
                      )}

                      {field.type === "select" && (
                        <Select
                          onValueChange={(v) => setValue(field.key, v)}
                          value={(answers[field.key] as string) ?? ""}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {(field.type === "text" || field.type === "number") && (
                        <div className="relative mt-1">
                          <Input
                            id={field.key}
                            type={field.type}
                            min={field.min}
                            max={field.max}
                            step={field.type === "number" ? "any" : undefined}
                            value={(answers[field.key] as string) ?? ""}
                            onChange={(e) =>
                              setValue(
                                field.key,
                                field.type === "number" ? (parseFloat(e.target.value) || "") : e.target.value,
                              )
                            }
                            className={field.unit ? "pr-14" : ""}
                          />
                          {field.unit && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                              {field.unit}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <Button type="submit" className="w-full mt-8" disabled={isLoading}>
            {isLoading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking code…</>
              : <>See compliance results <ArrowRight className="w-4 h-4 ml-1" /></>
            }
          </Button>
        </form>
      )}
    </div>
  );
}
