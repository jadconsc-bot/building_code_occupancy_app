import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "yesno";
  options?: { value: string; label: string }[];
  unit?: string;
  min?: number;
  max?: number;
  helpText?: string;
  showIf?: (answers: Record<string, unknown>) => boolean;
  required?: boolean;
}

const COMMON_FIELDS: FieldConfig[] = [
  {
    key: "province",
    label: "Province",
    type: "select",
    options: [
      { value: "AB", label: "Alberta" },
      { value: "BC", label: "British Columbia" },
      { value: "ON", label: "Ontario" },
    ],
    required: true,
  },
  { key: "municipality", label: "Municipality / City", type: "text" },
];

const QUESTIONS: Record<string, FieldConfig[]> = {
  secondary_suite: [
    ...COMMON_FIELDS,
    { key: "yearBuilt", label: "Year building was built", type: "number", min: 1850, max: 2026 },
    {
      key: "suiteLocation",
      label: "Suite location",
      type: "select",
      options: [
        { value: "basement", label: "Basement" },
        { value: "above_grade", label: "Above grade" },
        { value: "attached_garage", label: "Attached garage" },
      ],
      required: true,
    },
    { key: "suiteAreaSqFt", label: "Suite floor area", type: "number", unit: "sq ft" },
    { key: "ceilingHeightFt", label: "Ceiling height", type: "number", unit: "ft", min: 4, max: 20, required: true },
    { key: "separateEntrance", label: "Separate exterior entrance?", type: "yesno", required: true },
    { key: "egressWindows", label: "Egress windows in sleeping areas?", type: "yesno", required: true, helpText: "Min 0.35m² operable opening" },
    {
      key: "egressWindowAreaM2",
      label: "Egress window opening size",
      type: "number",
      unit: "m²",
      showIf: (a) => a.egressWindows === "yes",
    },
    { key: "smokeAlarms", label: "Interconnected smoke alarms?", type: "yesno", required: true },
    { key: "coDetectors", label: "CO detectors?", type: "yesno", required: true },
    { key: "fireSeparation", label: "Fire separation from main dwelling?", type: "yesno", required: true },
    { key: "sprinklerSystem", label: "Sprinkler system?", type: "yesno", required: true },
    { key: "parking", label: "Parking space for suite?", type: "yesno", required: true },
    { key: "fullBathroom", label: "Full bathroom in suite?", type: "yesno", required: true },
    { key: "kitchen", label: "Kitchen in suite?", type: "yesno", required: true },
  ],
  deck_patio: [
    ...COMMON_FIELDS,
    { key: "attachedToHouse", label: "Attached to the house?", type: "yesno", required: true },
    { key: "heightAboveGradeFt", label: "Maximum height above grade", type: "number", unit: "ft", min: 0, required: true },
    { key: "deckAreaSqFt", label: "Deck area", type: "number", unit: "sq ft" },
    {
      key: "ledgerAttachment",
      label: "Ledger board bolted to house framing?",
      type: "yesno",
      showIf: (a) => a.attachedToHouse === "yes",
    },
    {
      key: "footingType",
      label: "Footing type",
      type: "select",
      options: [
        { value: "concrete", label: "Concrete piers (below frost line)" },
        { value: "helical", label: "Helical / screw piles" },
        { value: "surface", label: "Surface / floating (deck blocks)" },
      ],
      required: true,
    },
    { key: "joistSpanFt", label: "Joist span", type: "number", unit: "ft", min: 1, required: true },
    { key: "beamSpanFt", label: "Beam span (post-to-post)", type: "number", unit: "ft", min: 1, required: true },
    { key: "postHeightFt", label: "Post height", type: "number", unit: "ft", min: 0 },
    { key: "guardRail", label: "Guard rail present or planned?", type: "yesno", required: true },
    {
      key: "guardRailHeightFt",
      label: "Guard rail height",
      type: "number",
      unit: "ft",
      showIf: (a) => a.guardRail === "yes",
    },
  ],
  basement_development: [
    ...COMMON_FIELDS,
    { key: "ceilingHeightFt", label: "Ceiling height", type: "number", unit: "ft", min: 4, max: 20, required: true },
    { key: "egressWindows", label: "Egress windows?", type: "yesno", required: true },
    { key: "bedroomCount", label: "Bedroom count", type: "number", min: 0, max: 10, required: true },
    { key: "fullBathroom", label: "Bathroom planned?", type: "yesno", required: true },
    { key: "smokeAlarms", label: "Smoke alarms?", type: "yesno", required: true },
    { key: "separateEntrance", label: "Separate exterior entrance?", type: "yesno", required: true },
    { key: "insulation", label: "Insulation planned?", type: "yesno", required: true },
    {
      key: "insulationRValue",
      label: "Insulation R-value",
      type: "number",
      min: 1,
      showIf: (a) => a.insulation === "yes",
    },
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
      .filter((f) => f.required !== false && !answers[f.key] && answers[f.key] !== 0)
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

      // Store paymentIntentId + clientSecret for Stripe Elements on the preview page
      sessionStorage.setItem("cc_home_pi", result.paymentIntentId);
      sessionStorage.setItem("cc_home_cs", result.clientSecret);
      setLocation(`/home/preview?pi=${result.paymentIntentId}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong — please try again");
    }
  }

  const isLoading = createReport.isPending;

  return (
    <div className="max-w-xl mx-auto px-4 pt-10 pb-20">
      <button onClick={() => setLocation("/home")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> All project types
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{PROJECT_TYPE_LABELS[projectType] ?? projectType}</h1>
      <p className="text-sm text-gray-500 mb-8">Answer the questions below — we'll check your project against the building code.</p>

      {step === "email" ? (
        <form onSubmit={(e) => { e.preventDefault(); if (!email.includes("@")) { toast.error("Enter a valid email"); return; } setStep("form"); }} className="space-y-4">
          <div>
            <Label htmlFor="email">Your email address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" required />
            <p className="text-xs text-gray-400 mt-1">Your report PDF will be sent here after payment.</p>
          </div>
          <Button type="submit" className="w-full">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </form>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {visibleFields.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {field.label}
                {field.required !== false && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              {field.helpText && <p className="text-xs text-gray-400 mt-0.5 mb-1">{field.helpText}</p>}

              {field.type === "yesno" && (
                <div className="flex gap-3 mt-1">
                  {(["yes", "no"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setValue(field.key, v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${answers[field.key] === v ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                      {v === "yes" ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              )}

              {field.type === "select" && (
                <Select onValueChange={(v) => setValue(field.key, v)} value={answers[field.key] as string ?? ""}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(field.type === "text" || field.type === "number") && (
                <div className="relative mt-1">
                  <Input id={field.key} type={field.type} min={field.min} max={field.max}
                    step={field.type === "number" ? "any" : undefined}
                    value={answers[field.key] as string ?? ""}
                    onChange={(e) => setValue(field.key, field.type === "number" ? (parseFloat(e.target.value) || "") : e.target.value)}
                    className={field.unit ? "pr-14" : ""} />
                  {field.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">{field.unit}</span>}
                </div>
              )}
            </div>
          ))}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking code…</> : <>See compliance results <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </form>
      )}
    </div>
  );
}
