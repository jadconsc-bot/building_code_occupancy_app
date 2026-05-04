import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accessibility, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { SaveButton } from "@/components/CalculatorWithSave";

export function AccessibilityRampCalculator() {
  const [rise, setRise] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  const calculateRamp = () => {
    const riseVal = parseFloat(rise);
    if (isNaN(riseVal) || riseVal <= 0) return;

    // NBC 3.8.3.3 - Maximum slope 1:12 for barrier-free ramps
    const maxSlope = 1 / 12;
    const minRun = riseVal / maxSlope;

    // NBC 3.8.3.4 - Maximum rise per run is 9000mm (9m)
    const maxRisePerRun = 9000;
    const numRuns = Math.ceil(riseVal / maxRisePerRun);
    const actualRisePerRun = riseVal / numRuns;
    const runLengthPerSection = actualRisePerRun / maxSlope;

    // NBC 3.8.3.5 - Landing requirements
    // - Minimum 1500mm x 1500mm at top and bottom
    // - Intermediate landings every 9m of rise
    const numLandings = numRuns + 1; // Top, bottom, and intermediate
    const landingLength = 1500; // mm
    const totalLandingLength = numLandings * landingLength;

    // Total horizontal distance
    const totalHorizontal = minRun + totalLandingLength;

    // NBC 3.8.3.7 - Handrail requirements
    const handrailHeight = "865-965mm";
    const handrailExtension = "300mm beyond top and bottom";

    // NBC 3.8.3.8 - Edge protection
    const edgeProtection = "75mm high curb or barrier";

    // Check compliance
    const compliant = actualRisePerRun <= maxRisePerRun;

    setResults({
      minRun: minRun.toFixed(0),
      numRuns,
      actualRisePerRun: actualRisePerRun.toFixed(0),
      runLengthPerSection: runLengthPerSection.toFixed(0),
      numLandings,
      totalHorizontal: totalHorizontal.toFixed(0),
      handrailHeight,
      handrailExtension,
      edgeProtection,
      compliant,
      slope: "1:12"
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-primary" /> Accessibility Ramp Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 3.8.3 - Calculate barrier-free ramp dimensions and landing requirements
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {results !== null && (
              <SaveButton
                calculatorType="accessibilityRamp"
                inputs={{ rise }}
                results={results}
              />
            )}
            <CalculatorActions
              calculatorId="accessibility_ramp"
              calculatorName="Accessibility Ramp"
              exportData={() => ({
                filename: `Accessibility_Ramp_${new Date().toISOString().split('T')[0]}`,
                sheetName: "Accessibility Ramp",
                data: results ? [
                  ["Parameter", "Value"],
                  ["Total Rise", `${rise} mm`],
                  ["Maximum Slope", results.slope],
                  ["Minimum Run", `${results.minRun} mm`],
                  ["Number of Runs", results.numRuns],
                  ["Rise Per Section", `${results.actualRisePerRun} mm`],
                  ["Run Length Per Section", `${results.runLengthPerSection} mm`],
                  ["Number of Landings", results.numLandings],
                  ["Total Horizontal Distance", `${results.totalHorizontal} mm`],
                  ["Handrail Height", results.handrailHeight],
                  ["Handrail Extension", results.handrailExtension],
                  ["Edge Protection", results.edgeProtection],
                  ["Compliant", results.compliant ? "Yes" : "No"],
                  ["", ""],
                  ["NBC Reference", "3.8.3 - Barrier-Free Ramps"],
                ] : []
              })}
              currentState={{ rise }}
              onLoadPreset={(data) => setRise(data.rise)}
              hasResults={!!results}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rise" className="text-sm font-medium">
            Total Rise (mm) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rise"
            type="number"
            placeholder="e.g., 600"
            value={rise}
            onChange={(e) => setRise(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Vertical height difference to be overcome by the ramp
          </p>
        </div>

        <Button 
          onClick={calculateRamp} 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!rise}
        >
          Calculate Ramp Requirements
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
                {results.compliant ? "Code Compliant Design" : "Requires Multiple Runs"}
              </span>
            </div>

            <div className="p-4 bg-primary/10 border-2 border-primary rounded">
              <p className="text-xs text-muted-foreground mb-1">Total Horizontal Distance</p>
              <p className="text-3xl font-bold text-primary">{results.totalHorizontal} mm</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(parseFloat(results.totalHorizontal) / 1000).toFixed(2)} meters
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Maximum Slope</p>
                <p className="text-lg font-bold text-primary">{results.slope}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Number of Runs</p>
                <p className="text-lg font-bold text-primary">{results.numRuns}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Run Length Each</p>
                <p className="text-lg font-bold text-primary">{results.runLengthPerSection} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Rise Per Run</p>
                <p className="text-lg font-bold text-primary">{results.actualRisePerRun} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Number of Landings</p>
                <p className="text-lg font-bold text-primary">{results.numLandings}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Min Ramp Run</p>
                <p className="text-lg font-bold text-primary">{results.minRun} mm</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">Landing Requirements (NBC 3.8.3.5)</p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Minimum size: 1500mm x 1500mm</li>
                <li>• Required at top and bottom of each run</li>
                <li>• Maximum rise between landings: 9000mm (9m)</li>
                <li>• Level surface (max slope 1:50)</li>
                <li>• Clear of door swing if adjacent to doorway</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2">Handrail & Edge Protection (NBC 3.8.3.7-3.8.3.8)</p>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <li>• Handrail height: {results.handrailHeight}</li>
                <li>• Extension: {results.handrailExtension}</li>
                <li>• Both sides required</li>
                <li>• Graspable diameter: 30-43mm</li>
                <li>• Edge protection: {results.edgeProtection}</li>
                <li>• Minimum clear width: 920mm between handrails</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>NBC Reference:</strong> 3.8.3.3 - Ramp Slope (Maximum 1:12)</p>
              <p><strong>Note:</strong> Steeper slopes (up to 1:8) permitted for short rises under specific conditions (NBC 3.8.3.3)</p>
              <p><strong>Surface:</strong> Slip-resistant, firm, and stable surface required</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
