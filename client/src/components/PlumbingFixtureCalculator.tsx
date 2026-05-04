import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplet, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { SaveButton } from "@/components/CalculatorWithSave";

export function PlumbingFixtureCalculator() {
  const [toilets, setToilets] = useState<string>("0");
  const [sinks, setSinks] = useState<string>("0");
  const [showers, setShowers] = useState<string>("0");
  const [bathtubs, setBathtubs] = useState<string>("0");
  const [washingMachines, setWashingMachines] = useState<string>("0");
  const [dishwashers, setDishwashers] = useState<string>("0");
  const [buildingType, setBuildingType] = useState<string>("residential");
  const [results, setResults] = useState<any>(null);

  const calculatePlumbing = () => {
    const numToilets = parseInt(toilets) || 0;
    const numSinks = parseInt(sinks) || 0;
    const numShowers = parseInt(showers) || 0;
    const numBathtubs = parseInt(bathtubs) || 0;
    const numWashers = parseInt(washingMachines) || 0;
    const numDishwashers = parseInt(dishwashers) || 0;

    if (numToilets + numSinks + numShowers + numBathtubs + numWashers + numDishwashers === 0) {
      setResults(null);
      return;
    }

    // Fixture Units (FU) - NBC 7.2.2.2 Table 7.2.2.2
    const fixtureUnits: Record<string, number> = {
      toilet: 4,
      sink: 1,
      shower: 2,
      bathtub: 2,
      washer: 2,
      dishwasher: 1
    };

    const totalFU = 
      (numToilets * fixtureUnits.toilet) +
      (numSinks * fixtureUnits.sink) +
      (numShowers * fixtureUnits.shower) +
      (numBathtubs * fixtureUnits.bathtub) +
      (numWashers * fixtureUnits.washer) +
      (numDishwashers * fixtureUnits.dishwasher);

    // Drain pipe sizing - NBC 7.2.2.2
    let drainSize = "50mm";
    if (totalFU <= 3) drainSize = "50mm";
    else if (totalFU <= 6) drainSize = "75mm";
    else if (totalFU <= 12) drainSize = "100mm";
    else if (totalFU <= 20) drainSize = "125mm";
    else drainSize = "150mm";

    // Vent pipe sizing - NBC 7.2.5.3
    let ventSize = "38mm";
    if (totalFU <= 8) ventSize = "38mm";
    else if (totalFU <= 24) ventSize = "50mm";
    else if (totalFU <= 48) ventSize = "75mm";
    else ventSize = "100mm";

    // Water supply sizing - NBC 7.2.3
    // Fixture supply pipe sizes
    const supplyPipes = {
      toilet: "13mm",
      sink: "13mm",
      shower: "13mm",
      bathtub: "13mm",
      washer: "13mm",
      dishwasher: "13mm"
    };

    // Main water supply - based on total flow demand
    let mainSupplySize = "19mm";
    if (totalFU <= 6) mainSupplySize = "19mm";
    else if (totalFU <= 12) mainSupplySize = "25mm";
    else if (totalFU <= 20) mainSupplySize = "32mm";
    else mainSupplySize = "38mm";

    // Peak flow rate (L/min) - simplified
    const peakFlow = Math.sqrt(totalFU) * 15;

    // Hot water demand (L/day) - residential
    const hotWaterDemand = buildingType === "residential" 
      ? (numToilets * 0 + numSinks * 20 + numShowers * 60 + numBathtubs * 80 + numWashers * 40 + numDishwashers * 15)
      : 0;

    // Recommended water heater size
    let heaterSize = "40 gal";
    if (hotWaterDemand <= 150) heaterSize = "40 gal (150L)";
    else if (hotWaterDemand <= 200) heaterSize = "50 gal (190L)";
    else if (hotWaterDemand <= 250) heaterSize = "60 gal (230L)";
    else heaterSize = "80+ gal (300L+)";

    // Trap requirements - NBC 7.2.4
    const trapsRequired = numToilets + numSinks + numShowers + numBathtubs + numWashers + numDishwashers;

    setResults({
      totalFU,
      drainSize,
      ventSize,
      mainSupplySize,
      peakFlow: peakFlow.toFixed(1),
      hotWaterDemand: hotWaterDemand.toFixed(0),
      heaterSize,
      trapsRequired,
      compliant: true,
      breakdown: {
        toilets: numToilets,
        sinks: numSinks,
        showers: numShowers,
        bathtubs: numBathtubs,
        washers: numWashers,
        dishwashers: numDishwashers
      }
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Droplet className="w-4 h-4 text-primary" /> Plumbing Fixture Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 7.2 - Drainage, vent, and water supply pipe sizing
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {results !== null && (
              <SaveButton
                calculatorType="plumbingFixture"
                inputs={{ toilets, sinks, showers, bathtubs, washingMachines, dishwashers, buildingType }}
                results={results}
              />
            )}
            <CalculatorActions
            calculatorId="plumbing_fixture"
            calculatorName="Plumbing Fixture"
            exportData={() => ({
              filename: `Plumbing_Fixture_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Plumbing",
              data: results ? [
                ["Fixture Type", "Quantity", "Fixture Units"],
                ["Toilets", results.breakdown.toilets, results.breakdown.toilets * 4],
                ["Sinks", results.breakdown.sinks, results.breakdown.sinks * 1],
                ["Showers", results.breakdown.showers, results.breakdown.showers * 2],
                ["Bathtubs", results.breakdown.bathtubs, results.breakdown.bathtubs * 2],
                ["Washing Machines", results.breakdown.washers, results.breakdown.washers * 2],
                ["Dishwashers", results.breakdown.dishwashers, results.breakdown.dishwashers * 1],
                ["", "", ""],
                ["TOTAL FIXTURE UNITS", "", results.totalFU],
                ["", "", ""],
                ["PIPE SIZING", "", ""],
                ["Drain Pipe Size", results.drainSize, ""],
                ["Vent Pipe Size", results.ventSize, ""],
                ["Main Supply Size", results.mainSupplySize, ""],
                ["", "", ""],
                ["WATER DEMAND", "", ""],
                ["Peak Flow Rate", `${results.peakFlow} L/min`, ""],
                ["Hot Water Demand", `${results.hotWaterDemand} L/day`, ""],
                ["Recommended Heater", results.heaterSize, ""],
                ["", "", ""],
                ["Traps Required", results.trapsRequired, ""],
                ["", "", ""],
                ["NBC References", "7.2.2.2 (Drainage), 7.2.5.3 (Vents), 7.2.3 (Supply)", ""],
              ] : []
            })}
            currentState={{ toilets, sinks, showers, bathtubs, washingMachines, dishwashers, buildingType }}
            onLoadPreset={(data) => {
              setToilets(data.toilets);
              setSinks(data.sinks);
              setShowers(data.showers);
              setBathtubs(data.bathtubs);
              setWashingMachines(data.washingMachines);
              setDishwashers(data.dishwashers);
              setBuildingType(data.buildingType);
            }}
            hasResults={!!results}
          />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
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
              <SelectItem value="commercial">Commercial (Office, Restaurant)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="toilets" className="text-sm font-medium">
              Toilets (4 FU)
            </Label>
            <Input
              id="toilets"
              type="number"
              placeholder="0"
              value={toilets}
              onChange={(e) => setToilets(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sinks" className="text-sm font-medium">
              Sinks (1 FU)
            </Label>
            <Input
              id="sinks"
              type="number"
              placeholder="0"
              value={sinks}
              onChange={(e) => setSinks(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="showers" className="text-sm font-medium">
              Showers (2 FU)
            </Label>
            <Input
              id="showers"
              type="number"
              placeholder="0"
              value={showers}
              onChange={(e) => setShowers(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathtubs" className="text-sm font-medium">
              Bathtubs (2 FU)
            </Label>
            <Input
              id="bathtubs"
              type="number"
              placeholder="0"
              value={bathtubs}
              onChange={(e) => setBathtubs(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="washers" className="text-sm font-medium">
              Washing Machines (2 FU)
            </Label>
            <Input
              id="washers"
              type="number"
              placeholder="0"
              value={washingMachines}
              onChange={(e) => setWashingMachines(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dishwashers" className="text-sm font-medium">
              Dishwashers (1 FU)
            </Label>
            <Input
              id="dishwashers"
              type="number"
              placeholder="0"
              value={dishwashers}
              onChange={(e) => setDishwashers(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <Button onClick={calculatePlumbing} className="w-full" size="lg">
          Calculate Plumbing Requirements
        </Button>

        {results && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Plumbing System Design</h3>
            </div>

            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Total Fixture Units</p>
              <p className="text-3xl font-bold text-primary">{results.totalFU} FU</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded bg-background border">
                <p className="text-xs font-medium text-muted-foreground">Drain Pipe Size</p>
                <p className="text-xl font-bold mt-1">{results.drainSize}</p>
                <p className="text-xs text-muted-foreground mt-1">Main building drain</p>
              </div>

              <div className="p-3 rounded bg-background border">
                <p className="text-xs font-medium text-muted-foreground">Vent Pipe Size</p>
                <p className="text-xl font-bold mt-1">{results.ventSize}</p>
                <p className="text-xs text-muted-foreground mt-1">Main vent stack</p>
              </div>

              <div className="p-3 rounded bg-background border">
                <p className="text-xs font-medium text-muted-foreground">Water Supply Size</p>
                <p className="text-xl font-bold mt-1">{results.mainSupplySize}</p>
                <p className="text-xs text-muted-foreground mt-1">Main supply line</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Peak Flow Rate</p>
                  <p className="text-2xl font-bold text-primary">{results.peakFlow} L/min</p>
                  <p className="text-xs text-muted-foreground">Maximum simultaneous demand</p>
                </div>

                {buildingType === "residential" && (
                  <div>
                    <p className="text-sm font-medium">Hot Water Demand</p>
                    <p className="text-2xl font-bold text-primary">{results.hotWaterDemand} L/day</p>
                    <p className="text-xs text-muted-foreground">Daily hot water usage</p>
                  </div>
                )}
              </div>

              {buildingType === "residential" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                  <p className="text-sm font-medium">Recommended Water Heater</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {results.heaterSize}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Traps Required</p>
                <p className="text-lg font-bold">{results.trapsRequired}</p>
                <p className="text-xs text-muted-foreground">One trap per fixture</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs font-medium mb-2">Individual Fixture Requirements:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Toilets:</span>
                  <span className="font-medium">13mm supply, 100mm drain</span>
                </div>
                <div className="flex justify-between">
                  <span>Sinks:</span>
                  <span className="font-medium">13mm supply, 38mm drain</span>
                </div>
                <div className="flex justify-between">
                  <span>Showers:</span>
                  <span className="font-medium">13mm supply, 50mm drain</span>
                </div>
                <div className="flex justify-between">
                  <span>Bathtubs:</span>
                  <span className="font-medium">13mm supply, 50mm drain</span>
                </div>
                <div className="flex justify-between">
                  <span>Washers:</span>
                  <span className="font-medium">13mm supply, 50mm drain</span>
                </div>
                <div className="flex justify-between">
                  <span>Dishwashers:</span>
                  <span className="font-medium">13mm supply, 38mm drain</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>NBC References:</strong> 7.2.2.2 (Fixture Units & Drainage), 7.2.5.3 (Vents), 
                7.2.3 (Water Supply), 7.2.4 (Traps)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
