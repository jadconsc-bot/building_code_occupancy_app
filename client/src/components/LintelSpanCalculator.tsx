import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { SaveButton } from "@/components/CalculatorWithSave";
import { trpc } from "@/lib/trpc";

export function LintelSpanCalculator() {
  const [openingWidth, setOpeningWidth] = useState<string>("");
  const [wallType, setWallType] = useState<string>("exterior");
  const [floorsAbove, setFloorsAbove] = useState<string>("0");
  const [roofLoad, setRoofLoad] = useState<string>("yes");
  const [species, setSpecies] = useState<string>("spf");
  const [results, setResults] = useState<any>(null);

  const openingWidthMm = parseFloat(openingWidth);
  const { data: determination } = trpc.calculationsPackage.determineLintelSpan.useQuery({
    openingWidthMm: Number.isFinite(openingWidthMm) ? openingWidthMm : 0,
    wallType: wallType as any, floorsAbove: Number(floorsAbove) as 0 | 1 | 2,
    supportsRoof: roofLoad === "yes", species: species as any,
  }, { enabled: Number.isFinite(openingWidthMm) && openingWidthMm > 0 });
  useEffect(() => {
    if (determination) setResults({ ...determination, totalLength: determination.totalLengthMm.toFixed(0), minBearing: determination.minBearingMm, weight: determination.weightKg == null ? "N/A" : determination.weightKg.toFixed(1), openingWidth: openingWidthMm.toFixed(0) });
    else setResults(null);
  }, [determination, openingWidthMm]);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Minus className="w-4 h-4 text-primary" /> Lintel Span Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC Span Tables 9.23.12.3.-A to -D - Determine required lintel size for openings
            </CardDescription>
          </div>
          {results !== null && <SaveButton calculatorType="lintelSpan" inputs={{ openingWidth, wallType, floorsAbove, roofLoad, species }} results={results} />}
          <CalculatorActions
            calculatorId="lintel_span"
            calculatorName="Lintel Span"
            exportData={() => ({
              filename: `Lintel_Span_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Lintel Span",
              data: results ? [
                ["Parameter", "Value"],
                ["Opening Width", `${results.openingWidth} mm`],
                ["Floors Above", floorsAbove],
                ["Roof Load", roofLoad === "yes" ? "Yes" : "No"],
                ["", ""],
                ["Required Lintel Size", results.lintelSize],
                ["Load Factor", results.loadFactor],
                ["Minimum Bearing", `${results.minBearing} mm`],
                ["Total Length", `${results.totalLength} mm`],
                ["Approximate Weight", results.weight !== "N/A" ? `${results.weight} kg` : "N/A"],
                ["", ""],
                ["NBC Reference", "NBC Span Tables 9.23.12.3.-A to -D"],
              ] : []
            })}
            currentState={{ openingWidth, wallType, floorsAbove, roofLoad, species }}
            onLoadPreset={(data) => {
              setOpeningWidth(data.openingWidth);
              setWallType(data.wallType);
              setFloorsAbove(data.floorsAbove);
              setRoofLoad(data.roofLoad);
              setSpecies(data.species);
            }}
            hasResults={!!results}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="opening-width" className="text-sm font-medium">
              Opening Width (mm) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="opening-width"
              type="number"
              placeholder="e.g., 1200"
              value={openingWidth}
              onChange={(e) => setOpeningWidth(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wall-type" className="text-sm font-medium">
              Wall Type <span className="text-destructive">*</span>
            </Label>
            <Select value={wallType} onValueChange={setWallType}>
              <SelectTrigger id="wall-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exterior">Exterior Load-Bearing</SelectItem>
                <SelectItem value="interior">Interior Load-Bearing</SelectItem>
                <SelectItem value="partition">Non-Load-Bearing Partition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {wallType !== "partition" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="floors-above" className="text-sm font-medium">
                  Floors Above <span className="text-destructive">*</span>
                </Label>
                <Select value={floorsAbove} onValueChange={setFloorsAbove}>
                  <SelectTrigger id="floors-above">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (Roof only)</SelectItem>
                    <SelectItem value="1">1 Floor + Roof</SelectItem>
                    <SelectItem value="2">2 Floors + Roof</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roof-load" className="text-sm font-medium">
                  Supports Roof? <span className="text-destructive">*</span>
                </Label>
                <Select value={roofLoad} onValueChange={setRoofLoad}>
                  <SelectTrigger id="roof-load">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="species" className="text-sm font-medium">
              Lumber Species
            </Label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger id="species">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spf">Spruce-Pine-Fir (S-P-F)</SelectItem>
                <SelectItem value="hem-fir">Hem-Fir</SelectItem>
                <SelectItem value="d-fir">Douglas Fir-Larch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {results && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              {results.compliant ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="font-bold text-sm">
                {results.compliant 
                  ? "Standard Lumber Lintel Suitable" 
                  : "Engineered Beam Required - Consult Engineer"}
              </span>
            </div>

            <div className="p-4 bg-primary/10 border-2 border-primary rounded">
              <p className="text-xs text-muted-foreground mb-1">Required Lintel Size</p>
              <p className="text-2xl font-bold text-primary">{results.lintelSize}</p>
              <p className="text-xs text-muted-foreground mt-1">{results.lintelType}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Opening Width</p>
                <p className="text-lg font-bold text-primary">{results.openingWidth} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Length</p>
                <p className="text-lg font-bold text-primary">{results.totalLength} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Min Bearing</p>
                <p className="text-lg font-bold text-primary">{results.minBearing} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Load Factor</p>
                <p className="text-lg font-bold text-primary">{results.loadFactor}</p>
              </div>
              {results.weight !== "N/A" && (
                <div className="p-3 bg-muted/50 rounded border border-border col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Approx. Weight</p>
                  <p className="text-lg font-bold text-primary">{results.weight} kg</p>
                  <p className="text-xs text-muted-foreground mt-1">Requires 2+ people to install</p>
                </div>
              )}
            </div>

            {results.compliant && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
                <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">Installation Requirements (NBC Part 9)</p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Minimum bearing: {results.minBearing}mm each end on solid support</li>
                  <li>• Grade: No. 2 or better for load-bearing applications</li>
                  <li>• Fastening: Nail through top plate into lintel (3-76mm nails per stud)</li>
                  <li>• Jack studs: Full-height studs required under each end</li>
                  <li>• King studs: Full-height studs required outside jack studs</li>
                  <li>• Cripple studs: Above and below opening at same spacing as wall studs</li>
                </ul>
              </div>
            )}

            {!results.compliant && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2">Engineered Beam Options</p>
                <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• <strong>LVL (Laminated Veneer Lumber):</strong> Common for residential, available in various depths</li>
                  <li>• <strong>Glulam (Glued Laminated Timber):</strong> For larger spans, architectural appearance</li>
                  <li>• <strong>Steel I-Beam:</strong> Maximum strength, requires structural calculations</li>
                  <li>• <strong>Flitch Beam:</strong> Steel plate sandwiched between wood members</li>
                  <li>• Requires structural engineer's design and stamped drawings</li>
                  <li>• Building permit will require engineered drawings for approval</li>
                </ul>
              </div>
            )}

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2">Simplified sizing estimate</p>
              <p className="text-xs text-amber-800 dark:text-amber-200">This is a simplified sizing estimate for early planning purposes only. It does not implement the complete NBC prescriptive tables and does not account for actual tributary loads or point-load cases outside the assumed scenario. Final sizing must be confirmed by a qualified designer or, where required by the applicable authority, a professional engineer.</p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>NBC Reference:</strong> NBC Span Tables 9.23.12.3.-A to -D</p>
              <p><strong>Note:</strong> This calculator provides preliminary sizing. Verify with NBC tables or consult engineer for critical applications.</p>
              <p><strong>Point Loads:</strong> Concentrated loads (beams, posts) require special consideration beyond this calculator.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
