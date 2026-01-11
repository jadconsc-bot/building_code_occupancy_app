import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";

export function GuardHandrailCalculator() {
  const [occupancyType, setOccupancyType] = useState<string>("residential");
  const [location, setLocation] = useState<string>("deck");
  const [height, setHeight] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  const calculateRequirements = () => {
    const heightVal = parseFloat(height);
    if (isNaN(heightVal) || heightVal < 0) return;

    // NBC 3.4.6.5 - Guard height requirements
    let minGuardHeight = 0;
    let maxOpeningSize = 100; // 100mm sphere rule (NBC 3.4.6.6)
    let loadRequirement = "0.5 kN/m";

    if (occupancyType === "residential") {
      minGuardHeight = 900; // 900mm for residential
      if (location === "deck" && heightVal < 600) {
        minGuardHeight = 0; // No guard required if less than 600mm
      }
    } else if (occupancyType === "assembly") {
      minGuardHeight = 1070; // 1070mm for assembly
      loadRequirement = "1.0 kN/m";
    } else {
      minGuardHeight = 1070; // 1070mm for commercial/industrial
      loadRequirement = "1.0 kN/m";
    }

    const guardRequired = heightVal >= 600;
    const compliant = !guardRequired || heightVal >= minGuardHeight;

    // Handrail requirements (NBC 3.4.6.7)
    const handrailRequired = location === "stair";
    const handrailHeight = occupancyType === "residential" ? "865-965mm" : "865-920mm";

    setResults({
      guardRequired,
      minGuardHeight,
      maxOpeningSize,
      loadRequirement,
      handrailRequired,
      handrailHeight,
      compliant,
      heightVal
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" /> Guard & Handrail Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 3.4.6.5-3.4.6.8 - Determine guard and handrail requirements
            </CardDescription>
          </div>
          <CalculatorActions
            calculatorId="guard_handrail"
            calculatorName="Guard & Handrail"
            exportData={() => ({
              filename: `Guard_Handrail_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Guard & Handrail",
              data: results ? [
                ["Parameter", "Value"],
                ["Occupancy Type", occupancyType === "residential" ? "Residential (Group C)" : occupancyType === "assembly" ? "Assembly (Group A)" : "Commercial/Industrial"],
                ["Location", location],
                ["Height/Drop", `${height} mm`],
                ["Guard Required", results.guardRequired ? "Yes" : "No"],
                ["Min Guard Height", `${results.minGuardHeight} mm`],
                ["Max Opening Size", `${results.maxOpeningSize} mm`],
                ["Load Requirement", results.loadRequirement],
                ["Handrail Required", results.handrailRequired ? "Yes" : "No"],
                ["Handrail Height", results.handrailHeight],
                ["Compliant", results.compliant ? "Yes" : "No"],
                ["", ""],
                ["NBC Reference", "3.4.6.5 - Guards"],
              ] : []
            })}
            currentState={{ occupancyType, location, height }}
            onLoadPreset={(data) => {
              setOccupancyType(data.occupancyType);
              setLocation(data.location);
              setHeight(data.height);
            }}
            hasResults={!!results}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="occupancy-type" className="text-sm font-medium">
              Occupancy Type <span className="text-destructive">*</span>
            </Label>
            <Select value={occupancyType} onValueChange={setOccupancyType}>
              <SelectTrigger id="occupancy-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential (Group C)</SelectItem>
                <SelectItem value="assembly">Assembly (Group A)</SelectItem>
                <SelectItem value="commercial">Commercial/Industrial (D, E, F)</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="deck">Deck/Balcony</SelectItem>
                <SelectItem value="stair">Stairway</SelectItem>
                <SelectItem value="landing">Landing</SelectItem>
                <SelectItem value="ramp">Ramp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm font-medium">
              Height/Drop (mm) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="e.g., 1200"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={calculateRequirements} 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!height}
        >
          Calculate Requirements
        </Button>

        {results && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              {results.compliant ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-bold text-sm">
                {results.guardRequired ? "Guard Required" : "No Guard Required"}
              </span>
            </div>

            {results.guardRequired && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Min Guard Height</p>
                    <p className="text-lg font-bold text-primary">{results.minGuardHeight} mm</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Max Opening</p>
                    <p className="text-lg font-bold text-primary">{results.maxOpeningSize} mm</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Load Requirement</p>
                    <p className="text-lg font-bold text-primary">{results.loadRequirement}</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2">Guard Requirements (NBC 3.4.6.5-3.4.6.6)</p>
                  <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <li>• Minimum height: {results.minGuardHeight}mm above finished floor</li>
                    <li>• 100mm sphere rule: No opening shall permit passage of 100mm diameter sphere</li>
                    <li>• Load capacity: {results.loadRequirement} horizontal concentrated load</li>
                    <li>• Top rail: Smooth, graspable surface required</li>
                    <li>• Intermediate rails: Maximum 100mm spacing</li>
                  </ul>
                </div>
              </div>
            )}

            {results.handrailRequired && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
                <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">Handrail Requirements (NBC 3.4.6.7)</p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Height: {results.handrailHeight}</li>
                  <li>• Clearance: 50mm minimum from wall</li>
                  <li>• Graspable diameter: 30-43mm</li>
                  <li>• Continuous: Must be continuous along full length</li>
                  <li>• Returns: Must return to wall or post at ends</li>
                  <li>• Both sides required if stair width &gt; 1100mm</li>
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>NBC Reference:</strong> 3.4.6.5 - Guards</p>
              <p><strong>Trigger Height:</strong> 600mm (guards required above this height)</p>
              <p><strong>100mm Sphere Rule:</strong> Prevents child entrapment (NBC 3.4.6.6)</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
