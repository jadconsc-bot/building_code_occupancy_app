import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wind, AlertCircle } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { SaveButton } from "@/components/CalculatorWithSave";

export function VentilationRateCalculator() {
  const [occupancyType, setOccupancyType] = useState<string>("residential");
  const [floorArea, setFloorArea] = useState<string>("");
  const [numOccupants, setNumOccupants] = useState<string>("");
  const [ceilingHeight, setCeilingHeight] = useState<string>("2.4");
  const [results, setResults] = useState<any>(null);

  const calculateVentilation = () => {
    const area = parseFloat(floorArea);
    const occupants = parseFloat(numOccupants);
    const height = parseFloat(ceilingHeight);

    if (isNaN(area) || area <= 0) return;

    // ASHRAE 62.1 (incorporated by reference under NBC Part 6) - Ventilation rates — UNVERIFIED values, see warning banner
    let ventilationRate = 0; // L/s
    let perPersonRate = 0;
    let perAreaRate = 0;
    let description = "";

    switch (occupancyType) {
      case "residential":
        // NBC 9.32.3.2 - Residential ventilation
        // 0.3 L/s per m² of floor area
        perAreaRate = 0.3;
        ventilationRate = area * perAreaRate;
        description = "Continuous mechanical ventilation required";
        break;
      
      case "office":
        // ASHRAE 62.1 - Office spaces (via NBC Part 6 reference)
        // 10 L/s per person + 0.3 L/s per m²
        perPersonRate = 10;
        perAreaRate = 0.3;
        ventilationRate = (occupants * perPersonRate) + (area * perAreaRate);
        description = "Office and administrative spaces";
        break;
      
      case "classroom":
        // ASHRAE 62.1 - Educational spaces (via NBC Part 6 reference)
        // 8 L/s per person
        perPersonRate = 8;
        ventilationRate = occupants * perPersonRate;
        description = "Classrooms and lecture halls";
        break;
      
      case "retail":
        // ASHRAE 62.1 - Retail spaces (via NBC Part 6 reference)
        // 10 L/s per person
        perPersonRate = 10;
        ventilationRate = occupants * perPersonRate;
        description = "Retail and sales areas";
        break;
      
      case "restaurant":
        // ASHRAE 62.1 - Dining spaces (via NBC Part 6 reference)
        // 10 L/s per person + 0.9 L/s per m²
        perPersonRate = 10;
        perAreaRate = 0.9;
        ventilationRate = (occupants * perPersonRate) + (area * perAreaRate);
        description = "Restaurants and dining areas";
        break;
      
      case "gym":
        // ASHRAE 62.1 - Exercise spaces (via NBC Part 6 reference)
        // 20 L/s per person
        perPersonRate = 20;
        ventilationRate = occupants * perPersonRate;
        description = "Gymnasiums and exercise facilities";
        break;
    }

    // Calculate volume and air changes per hour (ACH)
    const volume = area * height; // m³
    const ventilationM3h = ventilationRate * 3.6; // Convert L/s to m³/h
    const ach = ventilationM3h / volume;

    // Calculate CFM (cubic feet per minute) for imperial
    const cfm = ventilationRate * 2.119;

    setResults({
      ventilationRate: ventilationRate.toFixed(1),
      cfm: cfm.toFixed(0),
      ach: ach.toFixed(2),
      perPersonRate: perPersonRate.toFixed(1),
      perAreaRate: perAreaRate.toFixed(1),
      description,
      volume: volume.toFixed(1)
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Wind className="w-4 h-4 text-primary" /> Ventilation Rate Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 6.2 - Calculate required mechanical ventilation rates
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {results !== null && (
              <SaveButton
                calculatorType="ventilationRate"
                inputs={{ occupancyType, floorArea, numOccupants, ceilingHeight }}
                results={results}
              />
            )}
            <CalculatorActions
            calculatorId="ventilation_rate"
            calculatorName="Ventilation Rate"
            exportData={() => ({
              filename: `Ventilation_Rate_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Ventilation Rate",
              data: results ? [
                ["Parameter", "Value"],
                ["Occupancy Type", results.description],
                ["Floor Area", `${floorArea} m²`],
                ["Ceiling Height", `${ceilingHeight} m`],
                ["Volume", `${results.volume} m³`],
                ["Occupants", results.occupants],
                ["", ""],
                ["Ventilation Rate", `${results.ventilationRate} L/s`],
                ["Air Changes Per Hour", `${results.ach} ACH`],
                ["Per Person Rate", `${results.perPersonRate} L/s/person`],
                ["Per Area Rate", `${results.perAreaRate} L/s/m²`],
                ["", ""],
                ["Reference", "ASHRAE 62.1, incorporated by reference under NBC Part 6 — values unverified"],
              ] : []
            })}
            currentState={{ occupancyType, floorArea, ceilingHeight }}
            onLoadPreset={(data) => {
              setOccupancyType(data.occupancyType);
              setFloorArea(data.floorArea);
              setCeilingHeight(data.ceilingHeight);
            }}
            hasResults={!!results}
          />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Unverified:</strong> the per-person/per-area ventilation rates shown here are
            drawn from ASHRAE 62.1 (incorporated by reference under NBC Part 6) but have not been
            confirmed against the primary ASHRAE 62.1 table. Do not rely on this for permit
            submission until verified.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="occupancy-type" className="text-sm font-medium">
              Occupancy Type <span className="text-destructive">*</span>
            </Label>
            <Select value={occupancyType} onValueChange={setOccupancyType}>
              <SelectTrigger id="occupancy-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential (Dwelling Units)</SelectItem>
                <SelectItem value="office">Office Spaces</SelectItem>
                <SelectItem value="classroom">Classrooms</SelectItem>
                <SelectItem value="retail">Retail Stores</SelectItem>
                <SelectItem value="restaurant">Restaurants</SelectItem>
                <SelectItem value="gym">Gymnasiums</SelectItem>
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
              placeholder="e.g., 100"
              value={floorArea}
              onChange={(e) => setFloorArea(e.target.value)}
            />
          </div>

          {occupancyType !== "residential" && (
            <div className="space-y-2">
              <Label htmlFor="num-occupants" className="text-sm font-medium">
                Number of Occupants <span className="text-destructive">*</span>
              </Label>
              <Input
                id="num-occupants"
                type="number"
                placeholder="e.g., 20"
                value={numOccupants}
                onChange={(e) => setNumOccupants(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ceiling-height" className="text-sm font-medium">
              Ceiling Height (m)
            </Label>
            <Input
              id="ceiling-height"
              type="number"
              step="0.1"
              placeholder="e.g., 2.4"
              value={ceilingHeight}
              onChange={(e) => setCeilingHeight(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={calculateVentilation} 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!floorArea || (occupancyType !== "residential" && !numOccupants)}
        >
          Calculate Ventilation Requirements
        </Button>

        {results && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-primary/10 border-2 border-primary rounded">
              <p className="text-xs text-muted-foreground mb-1">Required Ventilation Rate</p>
              <p className="text-3xl font-bold text-primary">{results.ventilationRate} L/s</p>
              <p className="text-xs text-muted-foreground mt-1">{results.cfm} CFM (imperial)</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Air Changes/Hour</p>
                <p className="text-lg font-bold text-primary">{results.ach} ACH</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Room Volume</p>
                <p className="text-lg font-bold text-primary">{results.volume} m³</p>
              </div>
              {parseFloat(results.perPersonRate) > 0 && (
                <div className="p-3 bg-muted/50 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Per Person</p>
                  <p className="text-lg font-bold text-primary">{results.perPersonRate} L/s</p>
                </div>
              )}
              {parseFloat(results.perAreaRate) > 0 && (
                <div className="p-3 bg-muted/50 rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Per Area</p>
                  <p className="text-lg font-bold text-primary">{results.perAreaRate} L/s/m²</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">Application: {results.description}</p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Mechanical ventilation system required</li>
                <li>• Fresh outdoor air must be supplied continuously</li>
                <li>• System must be capable of maintaining design flow rates</li>
                <li>• Heat recovery ventilator (HRV) or energy recovery ventilator (ERV) recommended for energy efficiency</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2">Additional Requirements (NBC 6.2)</p>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Exhaust ventilation required for bathrooms, kitchens, and utility rooms</li>
                <li>• Bathroom exhaust: 25 L/s (50 CFM) minimum</li>
                <li>• Kitchen exhaust: 50 L/s (100 CFM) minimum for range hood</li>
                <li>• Makeup air required if exhaust exceeds 150 L/s (300 CFM)</li>
                <li>• Ventilation system must be balanced (supply ≈ exhaust)</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>Reference:</strong> ASHRAE 62.1, incorporated by reference under NBC Part 6</p>
              <p><strong>Note:</strong> Higher rates may be required for special occupancies or contamination sources</p>
              <p><strong>Energy Code:</strong> NBC Part 10 requires energy recovery for systems &gt; 1500 L/s</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
