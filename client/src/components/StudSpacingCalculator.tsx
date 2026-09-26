import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Columns, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { SaveButton } from "@/components/CalculatorWithSave";
import { trpc } from "@/lib/trpc";

export function StudSpacingCalculator() {
  const [studSize, setStudSize] = useState<string>("38x140");
  const [wallHeight, setWallHeight] = useState<string>("");
  const [wallType, setWallType] = useState<string>("load-bearing");
  const [species, setSpecies] = useState<string>("spf");
  const [grade, setGrade] = useState<string>("no2");
  const [results, setResults] = useState<any>(null);

  const wallHeightMm = parseFloat(wallHeight);
  const { data: determination } = trpc.calculationsPackage.determineStudSpacing.useQuery({
    studSize: studSize as any, wallHeightMm: Number.isFinite(wallHeightMm) ? wallHeightMm : 0,
    wallType: wallType as any, species: species as any, grade: grade as any,
  }, { enabled: Number.isFinite(wallHeightMm) && wallHeightMm > 0 });
  useEffect(() => {
    if (determination) setResults({ maxSpacing: determination.maxSpacingMm ?? "N/A", compliant: determination.compliant, numStuds: determination.numStudsFor10mWall, gradeNote: determination.gradeNote, studSizeDisplay: studSize.replace("x", " × ") + " mm", wallHeightDisplay: wallHeightMm.toFixed(0) });
    else setResults(null);
  }, [determination, studSize, wallHeightMm]);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Columns className="w-4 h-4 text-primary" /> Stud Spacing Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 9.23.10.1 / Table 9.23.10.1 - Determine maximum stud spacing for wood-frame walls
            </CardDescription>
          </div>
          {results !== null && <SaveButton calculatorType="studSpacing" inputs={{ studSize, wallHeight, wallType, species, grade }} results={results} />}
          <CalculatorActions
            calculatorId="stud_spacing"
            calculatorName="Stud Spacing"
            exportData={() => ({
              filename: `Stud_Spacing_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Stud Spacing",
              data: results ? [
                ["Parameter", "Value"],
                ["Stud Size", results.studSizeDisplay],
                ["Wall Height", `${results.wallHeightDisplay} mm`],
                ["Grade Note", results.gradeNote],
                ["", ""],
                ["Maximum Spacing", typeof results.maxSpacing === 'number' ? `${results.maxSpacing} mm` : results.maxSpacing],
                ["Number of Studs", results.numStuds],
                ["Compliant", results.compliant ? "Yes" : "No"],
                ["", ""],
                ["NBC Reference", "NBC 9.23.10.1 / Table 9.23.10.1 - Size and Spacing of Studs"],
              ] : []
            })}
            currentState={{ studSize, wallHeight }}
            onLoadPreset={(data) => {
              setStudSize(data.studSize);
              setWallHeight(data.wallHeight);
            }}
            hasResults={!!results}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stud-size" className="text-sm font-medium">
              Stud Size <span className="text-destructive">*</span>
            </Label>
            <Select value={studSize} onValueChange={setStudSize}>
              <SelectTrigger id="stud-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="38x89">38 × 89 mm (2×4)</SelectItem>
                <SelectItem value="38x140">38 × 140 mm (2×6)</SelectItem>
                <SelectItem value="38x184">38 × 184 mm (2×8)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wall-height" className="text-sm font-medium">
              Wall Height (mm) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="wall-height"
              type="number"
              placeholder="e.g., 2400"
              value={wallHeight}
              onChange={(e) => setWallHeight(e.target.value)}
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
                <SelectItem value="load-bearing">Load-Bearing (supports roof/floor)</SelectItem>
                <SelectItem value="non-load-bearing">Non-Load-Bearing (partition)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="species" className="text-sm font-medium">
              Species
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="grade" className="text-sm font-medium">
              Grade
            </Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger id="grade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no2">No. 2 or Better (Standard)</SelectItem>
                <SelectItem value="no1">No. 1 (Higher Grade)</SelectItem>
                <SelectItem value="select">Select Structural (Premium)</SelectItem>
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
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-bold text-sm">
                {results.compliant 
                  ? "Code Compliant Configuration" 
                  : "Exceeds Maximum Height - Use Larger Studs or Closer Spacing"}
              </span>
            </div>

            {results.compliant && (
              <>
                <div className="p-4 bg-primary/10 border-2 border-primary rounded">
                  <p className="text-xs text-muted-foreground mb-1">Maximum Stud Spacing</p>
                  <p className="text-3xl font-bold text-primary">{results.maxSpacing} mm</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {results.maxSpacing === 400 ? '16" o.c.' : results.maxSpacing === 600 ? '24" o.c.' : results.maxSpacing === 300 ? '12" o.c.' : ''}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Stud Size</p>
                    <p className="text-lg font-bold text-primary">{results.studSizeDisplay}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Wall Height</p>
                    <p className="text-lg font-bold text-primary">{results.wallHeightDisplay} mm</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded border border-border col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Studs for 10m Wall</p>
                    <p className="text-lg font-bold text-primary">{results.numStuds} studs</p>
                    <p className="text-xs text-muted-foreground mt-1">Including end studs</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">Grade Requirement</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">{results.gradeNote}</p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2">Simplified sizing estimate</p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">This is a simplified sizing estimate for early planning purposes only. It does not implement the complete NBC prescriptive tables, and the selected species and grade are not currently factored into the computed spacing. Final sizing must be confirmed by a qualified designer or, where required by the applicable authority, a professional engineer.</p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2">Additional Requirements (NBC Part 9)</p>
                  <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <li>• Double studs required at openings and corners</li>
                    <li>• Headers required above openings in load-bearing walls</li>
                    <li>• Bottom plate: Single 38mm minimum</li>
                    <li>• Top plate: Double 38mm for load-bearing walls</li>
                    <li>• Blocking or strapping may be required for lateral bracing</li>
                    <li>• Fire blocking required at 3m intervals in concealed spaces</li>
                  </ul>
                </div>
              </>
            )}

            {!results.compliant && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded">
                <p className="text-xs font-bold text-destructive mb-2">Design Alternatives</p>
                <ul className="text-xs text-destructive/90 space-y-1">
                  <li>• Use larger stud size (e.g., 2×6 instead of 2×4)</li>
                  <li>• Reduce stud spacing (e.g., 16" o.c. instead of 24" o.c.)</li>
                  <li>• Add horizontal blocking or strapping for lateral support</li>
                  <li>• Consider engineered lumber (LSL, LVL) for taller walls</li>
                  <li>• Consult structural engineer for walls exceeding table limits</li>
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>NBC Reference:</strong> NBC 9.23.10.1 / Table 9.23.10.1 - Size and Spacing of Studs</p>
              <p><strong>Note:</strong> Values assume standard residential loading. Higher loads may require closer spacing.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
