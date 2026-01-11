import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, AlertCircle, CheckCircle2 } from "lucide-react";

export function LintelSpanCalculator() {
  const [openingWidth, setOpeningWidth] = useState<string>("");
  const [wallType, setWallType] = useState<string>("exterior");
  const [floorsAbove, setFloorsAbove] = useState<string>("0");
  const [roofLoad, setRoofLoad] = useState<string>("yes");
  const [species, setSpecies] = useState<string>("spf");
  const [results, setResults] = useState<any>(null);

  const calculateLintel = () => {
    const width = parseFloat(openingWidth);
    if (isNaN(width) || width <= 0) return;

    const floors = parseInt(floorsAbove);
    const hasRoof = roofLoad === "yes";

    // NBC Part 9 Table 9.23.4.5 - Lintel Spans (simplified)
    // Load calculation: roof + floors above
    let loadFactor = 0;
    if (hasRoof) loadFactor += 1;
    loadFactor += floors;

    // Determine required lintel size based on span and load
    let lintelSize = "";
    let lintelType = "";
    let compliant = true;

    // Simplified lintel sizing (actual NBC tables are more detailed)
    if (width <= 1200) {
      if (loadFactor <= 1) {
        lintelSize = "2 × 38 × 184 mm (2-2×8)";
        lintelType = "Double 2×8";
      } else if (loadFactor <= 2) {
        lintelSize = "2 × 38 × 235 mm (2-2×10)";
        lintelType = "Double 2×10";
      } else {
        lintelSize = "2 × 38 × 286 mm (2-2×12)";
        lintelType = "Double 2×12";
      }
    } else if (width <= 1800) {
      if (loadFactor <= 1) {
        lintelSize = "2 × 38 × 235 mm (2-2×10)";
        lintelType = "Double 2×10";
      } else if (loadFactor <= 2) {
        lintelSize = "2 × 38 × 286 mm (2-2×12)";
        lintelType = "Double 2×12";
      } else {
        lintelSize = "Engineered beam required";
        lintelType = "LVL or Steel";
        compliant = false;
      }
    } else if (width <= 2400) {
      if (loadFactor <= 1) {
        lintelSize = "2 × 38 × 286 mm (2-2×12)";
        lintelType = "Double 2×12";
      } else {
        lintelSize = "Engineered beam required";
        lintelType = "LVL or Steel";
        compliant = false;
      }
    } else {
      lintelSize = "Engineered beam required";
      lintelType = "LVL, Glulam, or Steel";
      compliant = false;
    }

    // Calculate bearing length required (minimum 90mm each end)
    const minBearing = 90; // mm
    const totalLength = width + (2 * minBearing);

    // Estimate weight (for handling)
    let weight = 0;
    if (lintelType.includes("Double")) {
      const depth = parseInt(lintelSize.match(/\d{3}/)?.[0] || "0");
      weight = (totalLength / 1000) * (depth / 1000) * 0.076 * 2 * 9.81; // kg (approximate)
    }

    setResults({
      lintelSize,
      lintelType,
      compliant,
      loadFactor,
      minBearing,
      totalLength: totalLength.toFixed(0),
      weight: weight > 0 ? weight.toFixed(1) : "N/A",
      openingWidth: width.toFixed(0)
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Minus className="w-4 h-4 text-primary" /> Lintel Span Calculator
        </CardTitle>
        <CardDescription className="text-xs">
          NBC Part 9 Table 9.23.4.5 - Determine required lintel size for openings
        </CardDescription>
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

        <Button 
          onClick={calculateLintel} 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!openingWidth}
        >
          Calculate Required Lintel
        </Button>

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

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>NBC Reference:</strong> Table 9.23.4.5 - Lintels Supporting Wood-Frame Construction</p>
              <p><strong>Note:</strong> This calculator provides preliminary sizing. Verify with NBC tables or consult engineer for critical applications.</p>
              <p><strong>Point Loads:</strong> Concentrated loads (beams, posts) require special consideration beyond this calculator.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
