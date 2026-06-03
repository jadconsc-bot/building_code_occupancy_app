import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Ruler } from "lucide-react";
import { SaveButton } from "@/components/CalculatorWithSave";

// ─── Pure computation ─────────────────────────────────────────────────────────

interface SpatialInput {
  limitingDistanceM: number;
  exposingFaceAreaM2: number;
  totalOpeningAreaM2: number;
  occupancyGroup: string;
  isSprinklered: boolean;
  facesStreet: boolean;
  isRural: boolean;
}

interface SpatialResult {
  maxAllowedOpeningM2: number;
  isUnlimited: boolean;
  effectiveLd: number;
  isCompliant: boolean;
  requiresFireRatedClosures: boolean;
  notes: string[];
  excess: number;
}

function computeSpatialSeparation(inp: SpatialInput): SpatialResult {
  let ld = inp.limitingDistanceM;
  const rural = inp.isRural && !inp.isSprinklered;
  if (rural) ld = ld / 2;

  if (inp.facesStreet && ld >= 9) {
    return {
      maxAllowedOpeningM2: Infinity,
      isUnlimited: true,
      effectiveLd: ld,
      isCompliant: true,
      requiresFireRatedClosures: false,
      notes: ["Street-facing face at grade with LD ≥ 9m — unlimited openings permitted (NBC 9.10.14)"],
      excess: 0,
    };
  }

  if (ld < 1.2) {
    const compliant = inp.totalOpeningAreaM2 === 0;
    return {
      maxAllowedOpeningM2: 0,
      isUnlimited: false,
      effectiveLd: ld,
      isCompliant: compliant,
      requiresFireRatedClosures: true,
      notes: [
        `Limiting distance ${ld.toFixed(2)}m < 1.2m`,
        "No unprotected openings permitted on this face",
        "All openings must be fire-rated closures (NBC 9.10.14.4(2))",
      ],
      excess: inp.totalOpeningAreaM2,
    };
  }

  const isHigherHazard = ["E", "F-2", "F-1"].includes(inp.occupancyGroup);
  const effectiveLdForCalc = isHigherHazard ? ld / 2 : ld;
  let maxArea = effectiveLdForCalc * effectiveLdForCalc;
  if (inp.isSprinklered) maxArea *= 2;
  maxArea = Math.min(maxArea, inp.exposingFaceAreaM2);

  const isCompliant = inp.totalOpeningAreaM2 <= maxArea;
  const excess = Math.max(0, inp.totalOpeningAreaM2 - maxArea);

  const notes: string[] = [
    `Effective LD: ${ld.toFixed(2)}m${rural ? " (halved — rural fire response)" : ""}`,
    `Formula: ${isHigherHazard ? "(LD/2)²" : "LD²"}${inp.isSprinklered ? " × 2 (sprinklered)" : ""} = ${maxArea.toFixed(2)} m²`,
    `Provided: ${inp.totalOpeningAreaM2.toFixed(2)} m² | Maximum: ${maxArea.toFixed(2)} m²`,
  ];
  if (!isCompliant) {
    notes.push(
      `Exceeds maximum by ${excess.toFixed(2)} m²`,
      "Options: reduce openings, increase LD, add fire-rated glazing, or sprinkle",
      "NBC 9.10.14.4(3)",
    );
  }

  return { maxAllowedOpeningM2: maxArea, isUnlimited: false, effectiveLd: ld, isCompliant, requiresFireRatedClosures: false, notes, excess };
}

// ─── Component ────────────────────────────────────────────────────────────────

const OCCUPANCY_GROUPS = [
  { value: "C",   label: "Group C — Residential" },
  { value: "D",   label: "Group D — Business / Office" },
  { value: "F-3", label: "Group F-3 — Low-Hazard Industrial" },
  { value: "E",   label: "Group E — Mercantile (stricter)" },
  { value: "F-2", label: "Group F-2 — Medium-Hazard (stricter)" },
  { value: "F-1", label: "Group F-1 — High-Hazard (stricter)" },
];

export function SpatialSeparationCalculator() {
  const [ld, setLd] = useState(3.0);
  const [faceArea, setFaceArea] = useState(20);
  const [openingArea, setOpeningArea] = useState(4.0);
  const [occupancyGroup, setOccupancyGroup] = useState("C");
  const [isSprinklered, setIsSprinklered] = useState(false);
  const [facesStreet, setFacesStreet] = useState(false);
  const [isRural, setIsRural] = useState(false);

  const result = useMemo(() =>
    computeSpatialSeparation({
      limitingDistanceM: ld,
      exposingFaceAreaM2: faceArea,
      totalOpeningAreaM2: openingArea,
      occupancyGroup,
      isSprinklered,
      facesStreet,
      isRural,
    }),
    [ld, faceArea, openingArea, occupancyGroup, isSprinklered, facesStreet, isRural],
  );

  // Bar visualisation
  const barMax = result.isUnlimited
    ? openingArea * 1.5
    : Math.max(result.maxAllowedOpeningM2, openingArea) * 1.2 || 1;
  const providedPct = Math.min((openingArea / barMax) * 100, 100);
  const maxLinePct = result.isUnlimited ? 100 : Math.min((result.maxAllowedOpeningM2 / barMax) * 100, 100);

  const inputs = { limitingDistanceM: ld, exposingFaceAreaM2: faceArea, totalOpeningAreaM2: openingArea, occupancyGroup, isSprinklered, facesStreet, isRural };
  const results = {
    maxAllowedOpeningM2: result.isUnlimited ? null : result.maxAllowedOpeningM2,
    isUnlimited: result.isUnlimited,
    providedOpeningM2: openingArea,
    isCompliant: result.isCompliant,
    requiresFireRatedClosures: result.requiresFireRatedClosures,
    effectiveLimitingDistanceM: result.effectiveLd,
    excess: result.excess,
    notes: result.notes,
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" /> Spatial Separation Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 9.10.14 — Maximum unprotected opening area based on limiting distance
            </CardDescription>
          </div>
          <SaveButton calculatorType="spatialSeparation" inputs={inputs} results={results} />
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Limiting distance */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-medium">
              Limiting Distance (LD) — <span className="text-primary font-bold">{ld.toFixed(1)} m</span>
            </Label>
            <Slider
              min={0.6} max={15} step={0.1}
              value={[ld]}
              onValueChange={([v]) => setLd(v)}
            />
            <p className="text-xs text-muted-foreground">
              Distance from exposed building face to property line or centreline of adjacent street/lane.
              A 1.5m setback → max {(1.5 * 1.5).toFixed(2)} m² of openings on that face.
            </p>
          </div>

          {/* Occupancy group */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Occupancy Group</Label>
            <Select value={occupancyGroup} onValueChange={setOccupancyGroup}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OCCUPANCY_GROUPS.map(g => (
                  <SelectItem key={g.value} value={g.value} className="text-xs">{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Face area */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Exposing Face Area (m²)</Label>
            <Input
              type="number" min={1} step={0.5}
              value={faceArea}
              onChange={e => setFaceArea(Math.max(1, Number(e.target.value)))}
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">Total area of the building face (wall + openings)</p>
          </div>

          {/* Opening area */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-medium">Total Opening Area — windows + doors (m²)</Label>
            <Input
              type="number" min={0} step={0.1}
              value={openingArea}
              onChange={e => setOpeningArea(Math.max(0, Number(e.target.value)))}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <Checkbox checked={isSprinklered} onCheckedChange={c => setIsSprinklered(!!c)} />
            Sprinklered building <span className="text-muted-foreground">(doubles allowance)</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <Checkbox checked={facesStreet} onCheckedChange={c => setFacesStreet(!!c)} />
            Street-facing face at grade
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <Checkbox checked={isRural} onCheckedChange={c => setIsRural(!!c)} />
            Rural (&gt;10 min fire response) <span className="text-muted-foreground">— halves LD</span>
          </label>
        </div>

        {/* Visual bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Provided: <strong className={result.isCompliant ? "" : "text-red-600"}>{openingArea.toFixed(2)} m²</strong></span>
            <span>Maximum: <strong className="text-green-700">{result.isUnlimited ? "Unlimited" : result.maxAllowedOpeningM2.toFixed(2) + " m²"}</strong></span>
          </div>
          <div className="relative h-5 bg-muted rounded overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded transition-all duration-300 ${
                result.requiresFireRatedClosures ? "bg-red-500" :
                result.isCompliant ? "bg-blue-500" : "bg-red-500"
              }`}
              style={{ width: `${providedPct}%` }}
            />
            {!result.isUnlimited && (
              <div
                className="absolute inset-y-0 w-0.5 bg-green-600 z-10"
                style={{ left: `${maxLinePct}%` }}
              />
            )}
          </div>
          {!result.isUnlimited && (
            <div className="flex" style={{ paddingLeft: `${Math.min(maxLinePct, 95)}%` }}>
              <span className="text-xs text-green-700 -translate-x-1/2">▲ max</span>
            </div>
          )}
        </div>

        {/* Result notes */}
        <div className={`flex items-start gap-2 p-3 rounded border text-xs ${
          result.requiresFireRatedClosures || !result.isCompliant
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-green-50 border-green-200 text-green-800"
        }`}>
          {result.isCompliant
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          }
          <div className="space-y-0.5">
            {result.notes.map((n, i) => <p key={i}>{n}</p>)}
          </div>
        </div>

        {/* Status badge + NBC ref */}
        <div className="flex items-center justify-between">
          <Badge
            className={
              result.requiresFireRatedClosures || !result.isCompliant
                ? "bg-red-100 text-red-800 border border-red-300"
                : "bg-green-100 text-green-800 border border-green-300"
            }
          >
            {result.requiresFireRatedClosures
              ? "Fire-Rated Closures Required"
              : result.isCompliant
              ? "COMPLIANT"
              : `FAIL — reduce by ${result.excess.toFixed(2)} m²`}
          </Badge>
          <span className="text-xs text-muted-foreground">NBC 9.10.14 — Spatial Separation</span>
        </div>
      </CardContent>
    </Card>
  );
}
