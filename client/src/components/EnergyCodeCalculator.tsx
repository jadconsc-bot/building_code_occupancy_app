import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";

export function EnergyCodeCalculator() {
  const [climateZone, setClimateZone] = useState<string>("7B");
  const [buildingType, setBuildingType] = useState<string>("residential");
  const [floorArea, setFloorArea] = useState<string>("");
  const [wallRSI, setWallRSI] = useState<string>("");
  const [roofRSI, setRoofRSI] = useState<string>("");
  const [windowArea, setWindowArea] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  const calculateEnergyCompliance = () => {
    const area = parseFloat(floorArea);
    const wallR = parseFloat(wallRSI);
    const roofR = parseFloat(roofRSI);
    const windowA = parseFloat(windowArea);

    if (isNaN(area) || isNaN(wallR) || isNaN(roofR) || isNaN(windowA)) {
      setResults(null);
      return;
    }

    // Minimum RSI requirements - NBC 9.36.2.4 (Zone 7)
    const requirements: Record<string, { wall: number; roof: number; foundation: number; window: number }> = {
      "7A": { wall: 3.34, roof: 8.81, foundation: 2.11, window: 0.35 },
      "7B": { wall: 2.97, roof: 7.24, foundation: 1.76, window: 0.32 },
      "8": { wall: 3.87, roof: 10.57, foundation: 2.46, window: 0.40 }
    };

    const req = requirements[climateZone] || requirements["7B"];

    // Check compliance
    const wallCompliant = wallR >= req.wall;
    const roofCompliant = roofR >= req.roof;
    
    // Window-to-wall ratio check (max 17% for residential)
    const maxWindowRatio = buildingType === "residential" ? 0.17 : 0.40;
    const estimatedWallArea = area * 0.4; // Rough estimate
    const windowRatio = windowA / estimatedWallArea;
    const windowCompliant = windowRatio <= maxWindowRatio;

    // Air leakage requirement - NBC 9.36.5.2
    const maxAirLeakage = 2.5; // L/(s·m²) @ 50 Pa

    // Ventilation - NBC 9.36.3
    const minVentilation = buildingType === "residential" ? 0.3 : 0.5; // ACH

    // Energy Performance
    const wallDeficiency = Math.max(0, req.wall - wallR);
    const roofDeficiency = Math.max(0, req.roof - roofR);
    
    // Simplified energy loss calculation (W/K)
    const wallLoss = estimatedWallArea * (1 / wallR);
    const roofLoss = area * (1 / roofR);
    const windowLoss = windowA * (1 / 0.35); // Assume U-0.35 windows
    const totalLoss = wallLoss + roofLoss + windowLoss;

    // Annual heating degree days (Calgary ~5000, Edmonton ~5500)
    const hdd = climateZone === "7A" ? 5500 : climateZone === "7B" ? 5000 : 6000;
    
    // Estimated annual heating energy (GJ)
    const annualEnergy = (totalLoss * hdd * 24 * 3600) / 1000000;

    const overallCompliant = wallCompliant && roofCompliant && windowCompliant;

    setResults({
      wallCompliant,
      roofCompliant,
      windowCompliant,
      overallCompliant,
      wallDeficiency: wallDeficiency.toFixed(2),
      roofDeficiency: roofDeficiency.toFixed(2),
      windowRatio: (windowRatio * 100).toFixed(1),
      maxWindowRatio: (maxWindowRatio * 100).toFixed(0),
      requiredWallRSI: req.wall.toFixed(2),
      requiredRoofRSI: req.roof.toFixed(2),
      requiredWindowRSI: req.window.toFixed(2),
      maxAirLeakage,
      minVentilation,
      totalHeatLoss: totalLoss.toFixed(1),
      annualEnergy: annualEnergy.toFixed(1)
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Energy Code Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC Part 9.36 - Energy efficiency compliance for residential buildings
            </CardDescription>
          </div>
          <CalculatorActions
            calculatorId="energy_code"
            calculatorName="Energy Code"
            exportData={() => ({
              filename: `Energy_Code_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Energy Code",
              data: results ? [
                ["Parameter", "Value"],
                ["Climate Zone", climateZone],
                ["Building Type", buildingType],
                ["Floor Area", `${floorArea} m\u00b2`],
                ["Wall RSI", `${wallRSI} m\u00b2\u00b7K/W`],
                ["Roof RSI", `${roofRSI} m\u00b2\u00b7K/W`],
                ["Window Area", `${windowArea} m\u00b2`],
                ["", ""],
                ["REQUIREMENTS", ""],
                ["Required Wall RSI", `${results.requiredWallRSI} m\u00b2\u00b7K/W`],
                ["Required Roof RSI", `${results.requiredRoofRSI} m\u00b2\u00b7K/W`],
                ["Required Window RSI", `${results.requiredWindowRSI} m\u00b2\u00b7K/W`],
                ["Max Window Ratio", `${results.maxWindowRatio}%`],
                ["Max Air Leakage", `${results.maxAirLeakage} L/(s\u00b7m\u00b2)`],
                ["Min Ventilation", `${results.minVentilation} ACH`],
                ["", ""],
                ["COMPLIANCE", ""],
                ["Wall Compliant", results.wallCompliant ? "Yes" : "No"],
                ["Roof Compliant", results.roofCompliant ? "Yes" : "No"],
                ["Window Ratio Compliant", results.windowCompliant ? "Yes" : "No"],
                ["Overall Compliant", results.overallCompliant ? "Yes" : "No"],
                ["", ""],
                ["PERFORMANCE", ""],
                ["Total Heat Loss", `${results.totalHeatLoss} W/K`],
                ["Annual Heating Energy", `${results.annualEnergy} GJ`],
                ["", ""],
                ["NBC Reference", "Part 9.36 - Energy Efficiency"],
              ] : []
            })}
            currentState={{ climateZone, buildingType, floorArea, wallRSI, roofRSI, windowArea }}
            onLoadPreset={(data) => {
              setClimateZone(data.climateZone);
              setBuildingType(data.buildingType);
              setFloorArea(data.floorArea);
              setWallRSI(data.wallRSI);
              setRoofRSI(data.roofRSI);
              setWindowArea(data.windowArea);
            }}
            hasResults={!!results}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="climate-zone" className="text-sm font-medium">
              Climate Zone <span className="text-destructive">*</span>
            </Label>
            <Select value={climateZone} onValueChange={setClimateZone}>
              <SelectTrigger id="climate-zone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7A">Zone 7A (Edmonton, North AB)</SelectItem>
                <SelectItem value="7B">Zone 7B (Calgary, Central AB)</SelectItem>
                <SelectItem value="8">Zone 8 (Fort McMurray, Far North)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="building-type" className="text-sm font-medium">
              Building Type <span className="text-destructive">*</span>
            </Label>
            <Select value={buildingType} onValueChange={setBuildingType}>
              <SelectTrigger id="building-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential (House, Apartment)</SelectItem>
                <SelectItem value="commercial">Commercial (Office, Retail)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor-area" className="text-sm font-medium">
              Floor Area (m²) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="floor-area"
              type="number"
              placeholder="e.g., 150"
              value={floorArea}
              onChange={(e) => setFloorArea(e.target.value)}
              min="0"
              step="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="window-area" className="text-sm font-medium">
              Window Area (m²) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="window-area"
              type="number"
              placeholder="e.g., 18"
              value={windowArea}
              onChange={(e) => setWindowArea(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wall-rsi" className="text-sm font-medium">
              Wall RSI (m²·K/W) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="wall-rsi"
              type="number"
              placeholder="e.g., 3.5"
              value={wallRSI}
              onChange={(e) => setWallRSI(e.target.value)}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              R-20 = 3.52 RSI, R-24 = 4.23 RSI
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roof-rsi" className="text-sm font-medium">
              Roof/Ceiling RSI (m²·K/W) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="roof-rsi"
              type="number"
              placeholder="e.g., 7.5"
              value={roofRSI}
              onChange={(e) => setRoofRSI(e.target.value)}
              min="0"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">
              R-40 = 7.04 RSI, R-50 = 8.81 RSI
            </p>
          </div>
        </div>

        <Button onClick={calculateEnergyCompliance} className="w-full" size="lg">
          Check Energy Compliance
        </Button>

        {results && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              {results.overallCompliant ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              <h3 className="font-semibold">
                {results.overallCompliant ? "Energy Code Compliant" : "Compliance Issues Found"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded bg-background border">
                <p className="text-xs font-medium text-muted-foreground">Wall Insulation</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-bold">RSI {wallRSI}</p>
                  {results.wallCompliant ? (
                    <Badge variant="default" className="bg-green-600">✓ Pass</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Fail</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Required: {results.requiredWallRSI}
                </p>
              </div>

              <div className="p-3 rounded bg-background border">
                <p className="text-xs font-medium text-muted-foreground">Roof Insulation</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-bold">RSI {roofRSI}</p>
                  {results.roofCompliant ? (
                    <Badge variant="default" className="bg-green-600">✓ Pass</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Fail</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Required: {results.requiredRoofRSI}
                </p>
              </div>

              <div className="p-3 rounded bg-background border">
                <p className="text-xs font-medium text-muted-foreground">Window Ratio</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-bold">{results.windowRatio}%</p>
                  {results.windowCompliant ? (
                    <Badge variant="default" className="bg-green-600">✓ Pass</Badge>
                  ) : (
                    <Badge variant="destructive">✗ Fail</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Max: {results.maxWindowRatio}%
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div>
                <p className="text-sm font-medium">Total Heat Loss</p>
                <p className="text-2xl font-bold text-primary">{results.totalHeatLoss} W/K</p>
                <p className="text-xs text-muted-foreground">Building envelope heat loss coefficient</p>
              </div>

              <div>
                <p className="text-sm font-medium">Estimated Annual Heating Energy</p>
                <p className="text-2xl font-bold text-primary">{results.annualEnergy} GJ</p>
                <p className="text-xs text-muted-foreground">Based on climate zone heating degree days</p>
              </div>
            </div>

            {!results.overallCompliant && (
              <div className="pt-4 border-t bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Improvements Needed</p>
                    {!results.wallCompliant && (
                      <p className="text-amber-800 dark:text-amber-200 mt-1">
                        • Wall insulation: Add {results.wallDeficiency} RSI
                      </p>
                    )}
                    {!results.roofCompliant && (
                      <p className="text-amber-800 dark:text-amber-200 mt-1">
                        • Roof insulation: Add {results.roofDeficiency} RSI
                      </p>
                    )}
                    {!results.windowCompliant && (
                      <p className="text-amber-800 dark:text-amber-200 mt-1">
                        • Reduce window area or improve wall insulation
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs font-medium mb-2">Additional Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Air leakage: Max {results.maxAirLeakage} L/(s·m²) @ 50 Pa (requires blower door test)</li>
                <li>• Ventilation: Min {results.minVentilation} ACH (mechanical ventilation required)</li>
                <li>• Windows: Min RSI {results.requiredWindowRSI} (typically triple-pane in Zone 7)</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>NBC Reference:</strong> 9.36.2.4 (Thermal Resistance), 9.36.2.6 (Fenestration), 
                9.36.3 (Ventilation), 9.36.5 (Air Leakage)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
