import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudSnow, AlertCircle } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { SaveButton } from "@/components/CalculatorWithSave";

export function SnowLoadCalculator() {
  const [location, setLocation] = useState<string>("calgary");
  const [roofType, setRoofType] = useState<string>("sloped");
  const [roofSlope, setRoofSlope] = useState<string>("");
  const [importance, setImportance] = useState<string>("normal");
  const [exposure, setExposure] = useState<string>("normal");
  const [results, setResults] = useState<any>(null);

  const calculateSnowLoad = () => {
    // Ground snow load Ss (kPa) - NBC 4.1.6.2
    const groundSnowLoads: Record<string, number> = {
      calgary: 1.1,
      edmonton: 1.7,
      "red-deer": 1.8,
      lethbridge: 1.2,
      "fort-mcmurray": 1.5,
      "grande-prairie": 2.2
    };

    const associatedRainLoads: Record<string, number> = {
      calgary: 0.1,
      edmonton: 0.1,
      "red-deer": 0.1,
      lethbridge: 0.1,
      "fort-mcmurray": 0.1,
      "grande-prairie": 0.1,
    };

    const Ss = groundSnowLoads[location] || 1.5;

    // Importance factor Is (NBC 4.1.6.2.(1), Table 4.1.6.2.-A)
    const importanceFactors: Record<string, number> = {
      low: 0.8,
      normal: 1.0,
      high: 1.15,
      "post-disaster": 1.25
    };
    const Is = importanceFactors[importance];

    // Roof slope factor Cs (NBC 4.1.6.2)
    let Cs = 1.0;
    const slope = parseFloat(roofSlope);
    if (!isNaN(slope)) {
      if (roofType === "sloped") {
        if (slope <= 30) {
          Cs = 1.0;
        } else if (slope <= 70) {
          Cs = (70 - slope) / 40;
        } else {
          Cs = 0;
        }
      }
    }

    // Wind exposure factor Cw (NBC 4.1.6.2)
    const Cw = importance === "low" || importance === "normal"
      ? (exposure === "exposed" ? 0.75 : 1.0)
      : 1.0;

    // Associated rain load Sr (NBC 4.1.6.2.(1), Appendix C Table C-2)
    const Sr = associatedRainLoads[location] ?? 0.1;

    const Cb = 1.0;
    const Ca = 1.0;

    // Total specified load
    const roofSnowLoad = Is * Ss * (Cb * Cw * Cs * Ca);
    const totalLoad = roofSnowLoad + Is * Sr;
    const additionalRequirements = [
      "Cb = 1.0 is assumed (NBC 4.1.6.2.(2)(c), low-profile-roof case). For roofs that do not meet this height condition, Cb must be determined from Table 4.1.6.2.-B; this calculator does not implement that table.",
      "Ca = 1.0 (uniform snow load) is assumed. This does not account for drifting, roof projections, valleys, gable/curved/dome roof shapes, sliding, or meltwater accumulation (NBC 4.1.6.2.(8)/(9), Articles 4.1.6.5-4.1.6.12).",
      "The steeper Sentence 4.1.6.2.(6) reduction for qualifying unobstructed slippery roofs is not modeled.",
    ];
    if (Cw === 0.75) additionalRequirements.push(
      "The 0.75 wind-exposure reduction (NBC 4.1.6.2.(4)) requires full exposure on all sides, no significant roof obstructions, and no drifting accumulation from adjacent surfaces — confirm these conditions apply before relying on this reduction."
    );

    setResults({
      Ss: Ss.toFixed(2),
      Is: Is.toFixed(2),
      Cs: Cs.toFixed(2),
      Cw: Cw.toFixed(2),
      Cb: Cb.toFixed(2),
      Ca: Ca.toFixed(2),
      Sr: Sr.toFixed(2),
      rainLoad: Sr.toFixed(2),
      roofSnowLoad: roofSnowLoad.toFixed(2),
      totalLoad: totalLoad.toFixed(2),
      additionalRequirements,
      location: location.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <CloudSnow className="w-4 h-4 text-primary" /> Snow Load Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 4.1.6 - Calculate design snow load for roof structures
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {results !== null && (
              <SaveButton
                calculatorType="snowLoad"
                inputs={{ location, roofType, roofSlope, importance, exposure }}
                results={results}
              />
            )}
            <CalculatorActions
            calculatorId="snow_load"
            calculatorName="Snow Load"
            exportData={() => ({
              filename: `Snow_Load_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Snow Load",
              data: results ? [
                ["Parameter", "Value"],
                ["Location", results.location],
                ["Roof Type", roofType === "sloped" ? "Sloped Roof" : "Flat Roof"],
                ["Roof Slope", `${roofSlope} degrees`],
                ["Importance Category", importance],
                ["Wind Exposure", exposure],
                ["", ""],
                ["Ground Snow Load (Ss)", `${results.Ss} kPa`],
                ["Importance Factor (Is)", results.Is],
                ["Slope Factor (Cs)", results.Cs],
                ["Wind Exposure Factor (Cw)", results.Cw],
                ["Calculated Roof Snow Load", `${results.roofSnowLoad} kPa`],
                ["Associated Rain Load (Sr)", `${results.Sr} kPa`],
                ["Rain Load", `${results.rainLoad} kPa`],
                ["Total Design Load", `${results.totalLoad} kPa`],
                ["", ""],
                ["NBC Reference", "NBC 4.1.6.2.(1)-(8), Appendix C Table C-2"],
              ] : []
            })}
            currentState={{ location, roofType, roofSlope, importance, exposure }}
            onLoadPreset={(data) => {
              setLocation(data.location);
              setRoofType(data.roofType);
              setRoofSlope(data.roofSlope);
              setImportance(data.importance);
              setExposure(data.exposure);
            }}
            hasResults={!!results}
          />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location <span className="text-destructive">*</span>
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calgary">Calgary</SelectItem>
                <SelectItem value="edmonton">Edmonton</SelectItem>
                <SelectItem value="red-deer">Red Deer</SelectItem>
                <SelectItem value="lethbridge">Lethbridge</SelectItem>
                <SelectItem value="fort-mcmurray">Fort McMurray</SelectItem>
                <SelectItem value="grande-prairie">Grande Prairie</SelectItem>
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
                <SelectItem value="low">Low (Is = 0.8)</SelectItem>
                <SelectItem value="normal">Normal (Is = 1.0)</SelectItem>
                <SelectItem value="high">High (Is = 1.15)</SelectItem>
                <SelectItem value="post-disaster">Post-Disaster (Is = 1.25)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="roof-type" className="text-sm font-medium">
              Roof Type <span className="text-destructive">*</span>
            </Label>
            <Select value={roofType} onValueChange={setRoofType}>
              <SelectTrigger id="roof-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sloped">Sloped Roof</SelectItem>
                <SelectItem value="flat">Flat Roof</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {roofType === "sloped" && (
            <div className="space-y-2">
              <Label htmlFor="roof-slope" className="text-sm font-medium">
                Roof Slope (degrees) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="roof-slope"
                type="number"
                placeholder="e.g., 18.4 (4:12 pitch)"
                value={roofSlope}
                onChange={(e) => setRoofSlope(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="exposure" className="text-sm font-medium">
              Wind Exposure <span className="text-destructive">*</span>
            </Label>
            <Select value={exposure} onValueChange={setExposure}>
              <SelectTrigger id="exposure">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sheltered">Sheltered (Cw = 1.0)</SelectItem>
                <SelectItem value="normal">Normal (Cw = 1.0)</SelectItem>
                <SelectItem value="exposed">Exposed (Cw = 0.75)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={calculateSnowLoad} 
          className="w-full bg-primary hover:bg-primary/90"
        >
          Calculate Snow Load
        </Button>

        {results && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-primary/10 border-2 border-primary rounded">
              <p className="text-xs text-muted-foreground mb-1">Design Snow Load (S)</p>
              <p className="text-3xl font-bold text-primary">{results.totalLoad} kPa</p>
              <p className="text-xs text-muted-foreground mt-1">Including rain load</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Ground Snow (Ss)</p>
                <p className="text-lg font-bold text-primary">{results.Ss} kPa</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Importance (Is)</p>
                <p className="text-lg font-bold text-primary">{results.Is}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Slope Factor (Cs)</p>
                <p className="text-lg font-bold text-primary">{results.Cs}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Wind Factor (Cw)</p>
                <p className="text-lg font-bold text-primary">{results.Cw}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Roof Factor (Cb)</p>
                <p className="text-lg font-bold text-primary">{results.Cb}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Accumulation (Ca)</p>
                <p className="text-lg font-bold text-primary">{results.Ca}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Calculated Roof Snow</p>
                <p className="text-lg font-bold text-primary">{results.roofSnowLoad} kPa</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Rain Load</p>
                <p className="text-lg font-bold text-primary">{results.rainLoad} kPa</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">Calculation Formula (NBC 4.1.6.2)</p>
              <p className="text-xs text-blue-800 dark:text-blue-200 font-mono">
                S = Is × [Ss × (Cb × Cw × Cs × Ca) + Sr]
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 mt-2">
                <li>• <strong>Is:</strong> Importance factor (Table 4.1.6.2.-A)</li>
                <li>• <strong>Ss:</strong> Ground snow load for {results.location}</li>
                <li>• <strong>Cs:</strong> Roof slope factor (1.0 for slopes ≤30°)</li>
                <li>• <strong>Cw:</strong> Conditional wind exposure factor (Sentence 4.1.6.2.(3)/(4))</li>
                <li>• <strong>Cb/Ca:</strong> Assumed 1.0 for this simplified estimate</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2">Additional NBC checks required</p>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                {results.additionalRequirements.map((requirement: string) => <li key={requirement}>• {requirement}</li>)}
              </ul>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>NBC Reference:</strong> 4.1.6.2.(1)-(8), Appendix C Table C-2</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
