import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, AlertTriangle, CheckCircle2, TrendingDown, Download, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface StepCodeCalculatorProps {
  projectId: number;
  municipality?: string;
  climateZone?: string;
  buildingType?: "part9_single_family" | "part3_commercial";
  onResultReady?: (result: StepCodeResult) => void;
}

interface StepCodeResult {
  compliant: boolean;
  tierTarget: string;
  tierAchieved?: string;
  recommendations: string[];
}

const KNOWN_CITIES: Array<{ pattern: string; name: string }> = [
  { pattern: "calgary", name: "Calgary" },
  { pattern: "edmonton", name: "Edmonton" },
  { pattern: "red deer", name: "Red Deer" },
  { pattern: "lethbridge", name: "Lethbridge" },
  { pattern: "fort mcmurray", name: "Fort McMurray" },
  { pattern: "vancouver", name: "Vancouver" },
  { pattern: "victoria", name: "Victoria" },
  { pattern: "kelowna", name: "Kelowna" },
  { pattern: "prince george", name: "Prince George" },
];

function extractMunicipality(address: string): string {
  const lower = address.toLowerCase();
  for (const city of KNOWN_CITIES) {
    if (lower.includes(city.pattern)) return city.name;
  }
  return "Calgary";
}

const MUNICIPALITY_OPTIONS = [
  "Calgary", "Edmonton", "Red Deer", "Lethbridge", "Fort McMurray",
  "Vancouver", "Victoria", "Kelowna", "Prince George",
];

// Map project buildingType to the two StepCode categories
function mapBuildingType(bt: string | null | undefined): "part9_single_family" | "part3_commercial" {
  if (!bt) return "part9_single_family";
  if (bt === "part9_single_family" || bt === "part9_multiplex") return "part9_single_family";
  return "part3_commercial";
}

export function StepCodeCalculator({
  projectId,
  municipality: municipalityProp = "Calgary",
  climateZone: climateZoneProp = "4",
  buildingType: buildingTypeProp = "part9_single_family",
  onResultReady,
}: StepCodeCalculatorProps) {
  const [selectedTier, setSelectedTier] = useState("3");
  const [buildingArea, setBuildingArea] = useState(150);
  const [buildingVolume, setBuildingVolume] = useState(450);
  const [windowWallRatio, setWindowWallRatio] = useState(0.35);
  const [tediModelled, setTediModelled] = useState(35);
  const [teuiModelled, setTeuiModelled] = useState(95);
  const [airtightnessModelled, setAirtightnessModelled] = useState(2.0);
  const [result, setResult] = useState<StepCodeResult | null>(null);
  const [lastAnalysisId, setLastAnalysisId] = useState<string | null>(null);
  const [municipalityOverride, setMunicipalityOverride] = useState<string | null>(null);
  const [buildingTypeOverride, setBuildingTypeOverride] = useState<"part9_single_family" | "part3_commercial" | null>(null);
  const [climateZoneOverride, setClimateZoneOverride] = useState<string | null>(null);
  const [occupancyType, setOccupancyType] = useState<"residential" | "non-residential">("residential");
  // Track which fields were pre-populated from the project
  const [prepopulated, setPrepopulated] = useState<Set<string>>(new Set());

  const { data: project } = trpc.projects.get.useQuery({ id: projectId });
  const p = project as any;

  // Pre-populate from project data when it loads
  useEffect(() => {
    if (!p) return;
    const populated: string[] = [];

    if (p.grossFloorArea) {
      const area = parseFloat(p.grossFloorArea);
      if (!isNaN(area) && area > 0) {
        setBuildingArea(area);
        setBuildingVolume(Math.round(area * 2.7)); // default 2.7m ceiling
        populated.push("buildingArea", "buildingVolume");
      }
    }
    if (p.climateZone) {
      setClimateZoneOverride(String(p.climateZone));
      populated.push("climateZone");
    }
    if (p.buildingType) {
      setBuildingTypeOverride(mapBuildingType(p.buildingType));
      populated.push("buildingType");
    }
    if (p.occupancyCode) {
      const part3Types = ["part3_residential", "part3_commercial", "part3_industrial"];
      setBuildingTypeOverride(part3Types.includes(p.buildingType ?? "") ? "part3_commercial" : "part9_single_family");
      setOccupancyType(p.occupancyCode.startsWith("C") ? "residential" : "non-residential");
      populated.push("occupancyType");
    }
    if (populated.length > 0) {
      setPrepopulated(new Set(populated));
    }
  }, [p?.id]); // only re-run when project ID changes

  const detectedMunicipality = useMemo(() => {
    if (p?.address) return extractMunicipality(p.address);
    return municipalityProp;
  }, [p?.address, municipalityProp]);

  const effectiveMunicipality = municipalityOverride ?? detectedMunicipality;
  const effectiveClimateZone  = climateZoneOverride ?? climateZoneProp;
  const effectiveBuildingType = buildingTypeOverride ?? buildingTypeProp;

  const { data: tiersData } = trpc.stepCode.getTiers.useQuery({
    buildingType: effectiveBuildingType,
    climateZone:  effectiveClimateZone,
  });

  const tierData = useMemo(
    () => tiersData?.find((t) => t.tier === selectedTier) ?? null,
    [tiersData, selectedTier]
  );

  const checkCompliance = trpc.stepCode.check.useMutation({
    onSuccess: (data) => {
      const mapped: StepCodeResult = {
        compliant: data.compliant,
        tierTarget: data.tierTarget,
        tierAchieved: data.tierAchieved,
        recommendations: data.recommendations,
      };
      setResult(mapped);
      setLastAnalysisId(data.analysisId);
      onResultReady?.(mapped);
    },
  });

  const generateReport = trpc.stepCode.generateReport.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
  });

  const tediGaugeValue = useMemo(() => {
    if (!tierData) return 0;
    return Math.min((tediModelled / tierData.tediTarget) * 100, 150);
  }, [tediModelled, tierData]);

  const teuiGaugeValue = useMemo(() => {
    if (!tierData) return 0;
    return Math.min((teuiModelled / tierData.teuiTarget) * 100, 150);
  }, [teuiModelled, tierData]);

  const getGaugeBgColor = (pct: number) => {
    if (pct <= 100) return "bg-green-500";
    if (pct <= 110) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getComplianceStatus = (pct: number) => {
    if (pct <= 100) return "PASS";
    if (pct <= 110) return "MARGINAL";
    return "FAIL";
  };

  const handleCheckCompliance = async () => {
    await checkCompliance.mutateAsync({
      projectId,
      energyFeaturesId: 0,
      stepCodeTierId: tierData?.id ?? 0,
      tediModelled,
      teuiModelled,
      airtightnessModelled,
    });
  };

  const handleGenerateReport = async () => {
    if (!result) return;
    await generateReport.mutateAsync({
      projectId,
      analysisId: lastAnalysisId ?? undefined,
      reportType: "stepCode",
      format: "pdf",
    });
  };

  const FromProject = () => (
    <span className="ml-2 text-xs text-blue-600 font-medium">from project</span>
  );

  return (
    <div className="space-y-6">
      {/* Project info banner */}
      {p && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
          <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-primary">{p.name}</span>
            {(p.projectNumber || p.projectCode) && (
              <span className="ml-2 text-muted-foreground">· {p.projectNumber ?? p.projectCode}</span>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {p.occupancyCode && (
                <Badge variant="outline" className="text-xs">Occupancy {p.occupancyCode}</Badge>
              )}
              {p.province && (
                <Badge variant="outline" className="text-xs">{p.province}</Badge>
              )}
              {p.climateZone && (
                <Badge variant="outline" className="text-xs">Climate Zone {p.climateZone}</Badge>
              )}
              {p.grossFloorArea && (
                <Badge variant="outline" className="text-xs">{p.grossFloorArea} m²</Badge>
              )}
            </div>
          </div>
          {prepopulated.size > 0 && (
            <span className="text-xs text-blue-600 shrink-0">
              {prepopulated.size} field{prepopulated.size !== 1 ? 's' : ''} pre-populated
            </span>
          )}
        </div>
      )}

      {p?.province && p.province !== "BC" && p.province !== "British Columbia" && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Step Code applies to BC buildings only. This project is in{" "}
            <strong>{p.province}</strong>.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Step Code Calculator</CardTitle>
          <CardDescription>
            Enter building parameters to calculate TEDI/TEUI compliance for{" "}
            {effectiveMunicipality}, Climate Zone {effectiveClimateZone}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Municipality */}
          <div className="space-y-2">
            <Label>Municipality</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Auto-detected from project</p>
                <Badge variant="secondary">{detectedMunicipality}</Badge>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Manual override</p>
                <Select
                  value={municipalityOverride ?? ""}
                  onValueChange={(v) => setMunicipalityOverride(v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Use detected" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUNICIPALITY_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Building Type, Climate Zone, Tier */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>
                Building Type
                {prepopulated.has("buildingType") && <FromProject />}
              </Label>
              <Select
                value={effectiveBuildingType}
                onValueChange={(v) => setBuildingTypeOverride(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="part9_single_family">Part 9 — Single Family</SelectItem>
                  <SelectItem value="part3_commercial">Part 3 — Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                Climate Zone
                {prepopulated.has("climateZone") && <FromProject />}
              </Label>
              <Select
                value={effectiveClimateZone}
                onValueChange={(v) => setClimateZoneOverride(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">Zone 4</SelectItem>
                  <SelectItem value="5">Zone 5</SelectItem>
                  <SelectItem value="6">Zone 6</SelectItem>
                  <SelectItem value="7">Zone 7</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Step Code Tier Target</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tier 1</SelectItem>
                  <SelectItem value="2">Tier 2</SelectItem>
                  <SelectItem value="3">Tier 3</SelectItem>
                  <SelectItem value="4">Tier 4</SelectItem>
                  <SelectItem value="5">Tier 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Building Parameters */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>
                Building Area (m²)
                {prepopulated.has("buildingArea") && <FromProject />}
              </Label>
              <Input
                type="number"
                value={buildingArea}
                onChange={(e) => setBuildingArea(parseFloat(e.target.value))}
                className={prepopulated.has("buildingArea") ? "border-blue-300" : ""}
              />
            </div>
            <div>
              <Label>
                Building Volume (m³)
                {prepopulated.has("buildingVolume") && <FromProject />}
              </Label>
              <Input
                type="number"
                value={buildingVolume}
                onChange={(e) => setBuildingVolume(parseFloat(e.target.value))}
                className={prepopulated.has("buildingVolume") ? "border-blue-300" : ""}
              />
            </div>
            <div>
              <Label>Window-Wall Ratio</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={windowWallRatio}
                onChange={(e) => setWindowWallRatio(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Performance Inputs */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>TEDI Modelled (kWh/m²/yr)</Label>
              <Input
                type="number"
                value={tediModelled}
                onChange={(e) => setTediModelled(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>TEUI Modelled (kWh/m²/yr)</Label>
              <Input
                type="number"
                value={teuiModelled}
                onChange={(e) => setTeuiModelled(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Airtightness (ACH₅₀)</Label>
              <Input
                type="number"
                step="0.1"
                value={airtightnessModelled}
                onChange={(e) => setAirtightnessModelled(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <Button
            onClick={handleCheckCompliance}
            disabled={checkCompliance.isPending || !tierData}
            className="w-full"
          >
            {checkCompliance.isPending ? "Checking…" : "Check Compliance"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          <Card className={result.compliant ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.compliant ? (
                  <><CheckCircle2 className="w-6 h-6 text-green-600" /><span className="text-green-900">Compliant</span></>
                ) : (
                  <><AlertCircle className="w-6 h-6 text-red-600" /><span className="text-red-900">Non-Compliant</span></>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Target: <strong>Tier {result.tierTarget}</strong> | Achieved:{" "}
                <strong>Tier {result.tierAchieved ?? "—"}</strong>
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">TEDI Performance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Target: {tierData?.tediTarget} kWh/m²/yr</span>
                  <span className="font-bold">{tediModelled} kWh/m²/yr</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${getGaugeBgColor(tediGaugeValue)}`}
                    style={{ width: `${Math.min(tediGaugeValue, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Gap: {(tediModelled - (tierData?.tediTarget ?? 0)).toFixed(1)} kWh/m²/yr
                  </span>
                  <Badge className={getComplianceStatus(tediGaugeValue) === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {getComplianceStatus(tediGaugeValue)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">TEUI Performance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Target: {tierData?.teuiTarget} kWh/m²/yr</span>
                  <span className="font-bold">{teuiModelled} kWh/m²/yr</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${getGaugeBgColor(teuiGaugeValue)}`}
                    style={{ width: `${Math.min(teuiGaugeValue, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Gap: {(teuiModelled - (tierData?.teuiTarget ?? 0)).toFixed(1)} kWh/m²/yr
                  </span>
                  <Badge className={getComplianceStatus(teuiGaugeValue) === "PASS" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {getComplianceStatus(teuiGaugeValue)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2">
                      <TrendingDown className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleGenerateReport}
            disabled={generateReport.isPending}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {generateReport.isPending ? "Generating…" : "Generate PDF Report"}
          </Button>
        </>
      )}
    </div>
  );
}
