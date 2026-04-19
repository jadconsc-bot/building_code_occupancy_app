import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wind, AlertCircle, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalculatorActions } from "@/components/CalculatorActions";
import { trpc } from "@/lib/trpc";

const SA_BY_ZONE: Record<string, number> = {
  Low: 0.05,
  Intermediate: 0.10,
  High: 0.15,
  "Very High": 0.20,
};

// Map dropdown location values to nearest municipality supported by jurisdiction router
const LOCATION_TO_MUNICIPALITY: Record<string, string> = {
  calgary: "Calgary",
  edmonton: "Edmonton",
  red_deer: "Edmonton",
  lethbridge: "Calgary",
  fort_mcmurray: "Edmonton",
};

export function LateralLoadCalculator() {
  const [buildingHeight, setBuildingHeight] = useState<string>("");
  const [buildingWidth, setBuildingWidth] = useState<string>("");
  const [location, setLocation] = useState<string>("calgary");
  const [terrain, setTerrain] = useState<string>("suburban");
  const [importance, setImportance] = useState<string>("normal");
  const [results, setResults] = useState<any>(null);

  const municipality = LOCATION_TO_MUNICIPALITY[location] ?? "Calgary";

  const { data: seismicZoneData, isLoading: seismicLoading } =
    trpc.jurisdiction.getSeismicZone.useQuery({ municipality });

  const seismicZone = seismicZoneData?.seismicData?.seismicZone ?? "Low";
  const Sa = SA_BY_ZONE[seismicZone] ?? 0.05;

  const locationLabel = useMemo(() => {
    const labels: Record<string, string> = {
      calgary: "Calgary",
      edmonton: "Edmonton",
      red_deer: "Red Deer",
      lethbridge: "Lethbridge",
      fort_mcmurray: "Fort McMurray",
    };
    return labels[location] ?? location;
  }, [location]);

  const calculateLateralLoad = () => {
    const height = parseFloat(buildingHeight);
    const width = parseFloat(buildingWidth);

    if (isNaN(height) || isNaN(width) || height <= 0 || width <= 0) {
      setResults(null);
      return;
    }

    // Wind Load Calculation - NBC 4.1.7
    const windPressures: Record<string, number> = {
      calgary: 0.47,
      edmonton: 0.45,
      red_deer: 0.46,
      lethbridge: 0.55,
      fort_mcmurray: 0.42,
    };

    const q = windPressures[location] ?? 0.47;

    const exposureFactors: Record<string, number> = {
      open: 1.2,
      suburban: 1.0,
      urban: 0.8,
    };

    const Ce = exposureFactors[terrain] ?? 1.0;

    const importanceFactors: Record<string, number> = {
      low: 0.8,
      normal: 1.0,
      high: 1.15,
      post_disaster: 1.25,
    };

    const Iw = importanceFactors[importance] ?? 1.0;

    const Cp = 0.8;
    const Cpi = 0.3;

    const windPressure = q * Ce * Iw * (Cp + Cpi);
    const exposedArea = height * width;
    const windForce = windPressure * exposedArea;

    // Seismic Load Calculation - NBC 4.1.8
    // Sa is derived from server seismic zone data
    const Ie = importanceFactors[importance] ?? 1.0;
    const Rd = 3.0;
    const Ro = 1.7;
    const estimatedWeight = exposedArea * 2.5;
    const seismicForce = (Sa * Ie * estimatedWeight) / (Rd * Ro);

    const governingLoad = Math.max(windForce, seismicForce);
    const governingType = windForce > seismicForce ? "Wind" : "Seismic";

    const requiredShearWallLength = (governingLoad / 10).toFixed(1);
    const overturningMoment = governingLoad * (height / 2);
    const holdDownForce = (overturningMoment / width).toFixed(1);

    setResults({
      windPressure: windPressure.toFixed(2),
      windForce: windForce.toFixed(1),
      seismicForce: seismicForce.toFixed(1),
      governingLoad: governingLoad.toFixed(1),
      governingType,
      requiredShearWallLength,
      holdDownForce,
      exposedArea: exposedArea.toFixed(1),
      overturningMoment: overturningMoment.toFixed(1),
      seismicZone,
      Sa,
      compliant: true,
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Wind className="w-4 h-4 text-primary" /> Lateral Load Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 4.1.7 & 4.1.8 - Wind and seismic load calculations for Alberta
            </CardDescription>
          </div>
          <CalculatorActions
            calculatorId="lateral_load"
            calculatorName="Lateral Load"
            exportData={() => ({
              filename: `Lateral_Load_${new Date().toISOString().split("T")[0]}`,
              sheetName: "Lateral Load",
              data: results
                ? [
                    ["Parameter", "Value"],
                    ["Building Height", `${buildingHeight} m`],
                    ["Building Width", `${buildingWidth} m`],
                    ["Location", locationLabel],
                    ["Terrain", terrain],
                    ["Importance", importance],
                    ["", ""],
                    ["SEISMIC DATA (NBC HAZARD MAPS)", ""],
                    ["Seismic Zone", results.seismicZone],
                    ["Spectral Acceleration (Sa)", results.Sa.toFixed(2)],
                    ["", ""],
                    ["WIND LOAD RESULTS", ""],
                    ["Wind Pressure", `${results.windPressure} kPa`],
                    ["Wind Force", `${results.windForce} kN`],
                    ["", ""],
                    ["SEISMIC LOAD RESULTS", ""],
                    ["Seismic Force", `${results.seismicForce} kN`],
                    ["", ""],
                    ["DESIGN REQUIREMENTS", ""],
                    ["Governing Load Type", results.governingType],
                    ["Governing Load", `${results.governingLoad} kN`],
                    ["Required Shear Wall Length", `${results.requiredShearWallLength} m`],
                    ["Hold-Down Force", `${results.holdDownForce} kN`],
                    ["Overturning Moment", `${results.overturningMoment} kN\u00b7m`],
                    ["", ""],
                    ["NBC References", "4.1.7 (Wind), 4.1.8 (Seismic)"],
                  ]
                : [],
            })}
            currentState={{ buildingHeight, buildingWidth, location, terrain, importance }}
            onLoadPreset={(data) => {
              setBuildingHeight(data.buildingHeight);
              setBuildingWidth(data.buildingWidth);
              setLocation(data.location);
              setTerrain(data.terrain);
              setImportance(data.importance);
            }}
            hasResults={!!results}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="building-height" className="text-sm font-medium">
              Building Height (m) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="building-height"
              type="number"
              placeholder="e.g., 8"
              value={buildingHeight}
              onChange={(e) => setBuildingHeight(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="building-width" className="text-sm font-medium">
              Building Width (m) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="building-width"
              type="number"
              placeholder="e.g., 12"
              value={buildingWidth}
              onChange={(e) => setBuildingWidth(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location <span className="text-destructive">*</span>
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calgary">Calgary (0.47 kPa)</SelectItem>
                <SelectItem value="edmonton">Edmonton (0.45 kPa)</SelectItem>
                <SelectItem value="red_deer">Red Deer (0.46 kPa)</SelectItem>
                <SelectItem value="lethbridge">Lethbridge (0.55 kPa)</SelectItem>
                <SelectItem value="fort_mcmurray">Fort McMurray (0.42 kPa)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terrain" className="text-sm font-medium">
              Terrain Category <span className="text-destructive">*</span>
            </Label>
            <Select value={terrain} onValueChange={setTerrain}>
              <SelectTrigger id="terrain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open (Flat, no obstructions)</SelectItem>
                <SelectItem value="suburban">Suburban (Typical residential)</SelectItem>
                <SelectItem value="urban">Urban (Dense city center)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="importance" className="text-sm font-medium">
              Importance Category <span className="text-destructive">*</span>
            </Label>
            <Select value={importance} onValueChange={setImportance}>
              <SelectTrigger id="importance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Storage, minor)</SelectItem>
                <SelectItem value="normal">Normal (Residential, office)</SelectItem>
                <SelectItem value="high">High (Assembly, school)</SelectItem>
                <SelectItem value="post_disaster">Post-Disaster (Hospital, fire station)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Server-derived seismic zone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Seismic Hazard (NBC Maps)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/50 cursor-default">
                    {seismicLoading ? (
                      <span className="text-sm text-muted-foreground animate-pulse">
                        Loading seismic data...
                      </span>
                    ) : (
                      <>
                        <Badge
                          variant={
                            seismicZone === "Low"
                              ? "secondary"
                              : seismicZone === "Intermediate"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {seismicZone}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Sa = {Sa.toFixed(2)} (per NBC 4.1.8)
                        </span>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Based on NBC seismic hazard maps for {locationLabel}</p>
                  {seismicZoneData?.seismicData?.requirements?.map((req, i) => (
                    <p key={i} className="text-xs mt-1">• {req}</p>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Button
          onClick={calculateLateralLoad}
          className="w-full"
          size="lg"
          disabled={seismicLoading}
        >
          Calculate Lateral Loads
        </Button>

        {results && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Lateral Load Analysis</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wind Pressure</p>
                <p className="text-lg font-bold">{results.windPressure} kPa</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wind Force</p>
                <p className="text-lg font-bold">{results.windForce} kN</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Seismic Force
                  <span className="ml-1 text-xs text-muted-foreground/70">
                    (Zone: {results.seismicZone}, Sa={results.Sa.toFixed(2)})
                  </span>
                </p>
                <p className="text-lg font-bold">{results.seismicForce} kN</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Governing Load</p>
                <p className="text-lg font-bold">{results.governingLoad} kN</p>
                <Badge variant="default" className="mt-1">
                  {results.governingType}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div>
                <p className="text-sm font-medium">Required Shear Wall Length</p>
                <p className="text-2xl font-bold text-primary">
                  {results.requiredShearWallLength} m
                </p>
                <p className="text-xs text-muted-foreground">Minimum total length of shear walls</p>
              </div>

              <div>
                <p className="text-sm font-medium">Hold-Down Force</p>
                <p className="text-2xl font-bold text-primary">{results.holdDownForce} kN</p>
                <p className="text-xs text-muted-foreground">Required at shear wall ends</p>
              </div>

              <div>
                <p className="text-sm font-medium">Overturning Moment</p>
                <p className="text-lg font-bold">{results.overturningMoment} kN·m</p>
              </div>
            </div>

            <div className="pt-4 border-t bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Engineering Review Required
                  </p>
                  <p className="text-amber-800 dark:text-amber-200 mt-1">
                    These are simplified calculations. Professional structural engineering review is
                    required for final design, especially for buildings over 3 storeys or in
                    high-risk areas.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>NBC References:</strong> 4.1.7.1 (Wind Load), 4.1.8.4 (Seismic Load),
                4.1.8.9 (Lateral Load Resisting Systems)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
