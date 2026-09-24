import { useState } from "react";
import { SaveButton } from "@/components/CalculatorWithSave";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DoorOpen, AlertCircle, Download } from "lucide-react";
import { exportExitRequirementsToExcel } from "@/lib/excelExport";
import {
  ComplianceBadge,
  CodeReference,
  ClarificationPanel,
  WhyImportant,
  RelatedRequirements,
  DidYouConsider,
  CheckbackPrompt
} from "@/components/FiveCsComponents";

export function ExitRequirementsCalculator() {
  const [occupantLoad, setOccupantLoad] = useState<string>("");
  const [occupancyGroup, setOccupancyGroup] = useState<string>("D");
  const [buildingHeight, setBuildingHeight] = useState<string>("1-3");
  const [sprinklered, setSprinklered] = useState<string>("no");

  const calculateExitRequirements = (): {
    numExits: number;
    minWidthPerExit: number;
    totalExitWidth: number;
    widthPerPerson: number;
    reasoning: string;
    singleExitCaveat: string;
  } => {
    const load = parseInt(occupantLoad) || 0;

    if (load === 0) {
      return { numExits: 0, minWidthPerExit: 0, totalExitWidth: 0, widthPerPerson: 0, reasoning: "", singleExitCaveat: "" };
    }

    // NBC 3.4.2.1.(1): default is 2 exits for any occupied floor area.
    // NBC 3.4.2.1.(2): single-exit exception applies only when occupant load ≤ 60 AND
    // floor area ≤ table limit AND travel distance ≤ table limit AND storeys ≤ 2.
    // Floor area and travel distance are not collected here — exception cannot be fully
    // verified. Conservative default of 2 exits applied whenever OL > 60.
    let numExits = load > 60 ? 2 : 1;
    let singleExitCaveat = "";
    if (load <= 60) {
      singleExitCaveat =
        "NBC 3.4.2.1.(2): single exit may be permitted for OL ≤ 60, but requires " +
        "floor area and travel distance within Table 3.4.2.1-A/B limits and building " +
        "≤ 2 storeys — verify manually before relying on 1 exit.";
    }

    // NBC 3.4.3.2.(1): exit width per person by occupancy.
    // Group B (care/treatment/detention): 18.4 mm/person.
    // All others: 6.1 mm/person (doorway/corridor default).
    // Stair-specific rates (8/9.2 mm) require exit-facility-type input not collected here.
    const isGroupB = occupancyGroup === "B";
    const widthPerPersonMm = isGroupB ? 18.4 : 6.1;

    // Calculate total required exit width (in metres for display consistency)
    const totalExitWidthM = (load * widthPerPersonMm) / 1000;

    // NBC 3.4.3.2.(7): when 2+ exits required, each exit contributes ≤50% of total.
    // Minimum per exit = totalWidth / 2 (not / numExits). When only 1 exit required,
    // that exit carries the full required width.
    let minWidthPerExitM = numExits >= 2 ? totalExitWidthM / 2 : totalExitWidthM;

    // NBC 3.4.3.1: minimum exit facility width 900mm
    minWidthPerExitM = Math.max(0.9, minWidthPerExitM);

    // Round up to nearest 50mm increment for practical door sizes
    minWidthPerExitM = Math.ceil(minWidthPerExitM * 20) / 20;

    // Generate reasoning
    let reasoning = "";
    if (load <= 60) {
      reasoning = "One exit may be permitted for occupant load ≤ 60 persons (NBC 3.4.2.1.(2) — verify Table conditions manually)";
    } else {
      reasoning = "Two exits required for occupant load > 60 persons (NBC 3.4.2.1.(1))";
    }

    return {
      numExits,
      minWidthPerExit: minWidthPerExitM,
      totalExitWidth: totalExitWidthM,
      widthPerPerson: widthPerPersonMm / 1000, // keep metres for downstream display
      reasoning,
      singleExitCaveat,
    };
  };

  const result = calculateExitRequirements();
  const minWidthInches = result.minWidthPerExit * 39.37; // Convert metres to inches
  const totalWidthInches = result.totalExitWidth * 39.37;

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-primary" /> Exit Requirements Calculator
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Calculate number and width of required exits (NBC Part 3.4.2, 3.4.3)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="space-y-4">
            <div>
              <NumericInput
                id="occupantLoad"
                label="Occupant Load"
                value={occupantLoad}
                onChange={(e) => setOccupantLoad(e.target.value)}
                placeholder="e.g., 150"
                className="rounded-none"
                min="1"
                max="10000"
                unit="persons"
                showValidation={true}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Use the Occupant Load Calculator to determine this value
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupancyGroup" className="text-xs font-medium">
                Occupancy Group
              </Label>
              <Select value={occupancyGroup} onValueChange={setOccupancyGroup}>
                <SelectTrigger id="occupancyGroup" className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Assembly (A)</SelectItem>
                  <SelectItem value="B">Institutional — Care/Treatment/Detention (B)</SelectItem>
                  <SelectItem value="C">Residential (C)</SelectItem>
                  <SelectItem value="D">Business &amp; Personal Services (D)</SelectItem>
                  <SelectItem value="E">Mercantile (E)</SelectItem>
                  <SelectItem value="F">Industrial (F)</SelectItem>
                </SelectContent>
              </Select>
              {occupancyGroup === "B" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  Group B applies 18.4 mm/person (NBC 3.4.3.2.(1)(b)) — significantly larger than other groups.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buildingHeight" className="text-xs font-medium">
                Building Height (Storeys)
              </Label>
              <Select value={buildingHeight} onValueChange={setBuildingHeight}>
                <SelectTrigger id="buildingHeight" className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1-3 Storeys</SelectItem>
                  <SelectItem value="4-6">4-6 Storeys</SelectItem>
                  <SelectItem value="7+">7+ Storeys</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprinklered" className="text-xs font-medium">
                Building Sprinklered?
              </Label>
              <Select value={sprinklered} onValueChange={setSprinklered}>
                <SelectTrigger id="sprinklered" className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No - Not Sprinklered</SelectItem>
                  <SelectItem value="yes">Yes - Fully Sprinklered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result Display */}
          {result.numExits > 0 && (
            <>
              <div className="p-6 border-l-4 border-primary bg-primary/5">
                <div className="flex items-start gap-3">
                  <DoorOpen className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-3">
                      Required Exit Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Number of Exits</p>
                        <p className="text-4xl font-bold text-primary">{result.numExits}</p>
                        <Badge variant="secondary" className="mt-2">exits required</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Min Width per Exit</p>
                        <p className="text-2xl font-bold text-primary">{result.minWidthPerExit.toFixed(2)} m</p>
                        <p className="text-sm text-muted-foreground mt-1">({minWidthInches.toFixed(0)}")</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Exit Width</p>
                        <p className="text-2xl font-bold text-primary">{result.totalExitWidth.toFixed(2)} m</p>
                        <p className="text-sm text-muted-foreground mt-1">({totalWidthInches.toFixed(0)}")</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="p-4 bg-muted/30 border border-border rounded-none">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                      Code Requirement Basis
                    </h4>
                    <p className="text-xs text-muted-foreground">{result.reasoning}</p>
                    {result.singleExitCaveat && (
                      <p className="text-xs text-amber-700 mt-2 italic">{result.singleExitCaveat}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculation Details */}
              <div className="p-4 bg-muted/30 border border-border rounded-none">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                  Calculation Method
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <strong>Width per Person:</strong> {(result.widthPerPerson * 1000).toFixed(1)} mm/person (NBC 3.4.3.2.(1) doorway/corridor rate{occupancyGroup === "B" ? " — Group B override" : ""})
                  </p>
                  <p>
                    <strong>Total Width Required:</strong> {occupantLoad} persons × {(result.widthPerPerson * 1000).toFixed(1)} mm = {(result.totalExitWidth * 1000).toFixed(0)} mm
                  </p>
                  <p>
                    <strong>Width per Exit:</strong> {(result.totalExitWidth * 1000).toFixed(0)} mm ÷ 2 = {(result.minWidthPerExit * 1000).toFixed(0)} mm
                    {result.numExits >= 2 ? " (NBC 3.4.3.2.(7) half-width cap — each exit ≤ 50% of total)" : " (single exit carries full required width)"}
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-2">
                    * Stair-specific rates (8 mm/person standard stairs, 9.2 mm/person steeper) require knowing exit facility type — not collected here. Doorway rate applied as conservative default.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    * Minimum exit facility clear width is stated here as 900 mm (NBC 3.4.3.1) — unverified against primary source; a related but distinct value (850 mm) appears elsewhere in this codebase for a door-width check. Confirm the correct clause and value before relying on this for permit submission.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Important Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Important Notes
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Exits must be remotely located from each other (NBC 3.4.2.3)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>NBC 3.4.3.2.(1) rates: 6.1 mm/person for doorways, corridors, ramps ≤1-in-8; 8 mm/person for standard stairs (rise ≤180mm, run ≥280mm); 9.2 mm/person for steeper exits; 18.4 mm/person for any exit serving Group B (care/treatment/detention). This calculator uses the doorway rate by default.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Minimum exit facility clear width is 900 mm per NBC 3.4.3.1</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Exit doors must swing in direction of egress when serving &gt; 60 persons</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>High buildings (&gt; 18m) have additional exit requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Verify travel distance to exits complies with NBC 3.4.2.5</span>
              </li>
            </ul>
          </div>

          {/* Export + Save Buttons */}
          {result.numExits > 0 && (
            <div className="flex justify-end gap-2">
              <SaveButton
                calculatorType="exitRequirements"
                inputs={{ occupantLoad, occupancyGroup, buildingHeight, sprinklered }}
                results={{ numExits: result.numExits, minWidthPerExit: result.minWidthPerExit, totalExitWidth: result.totalExitWidth, reasoning: result.reasoning }}
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-none gap-2"
                onClick={() => exportExitRequirementsToExcel({
                  occupantLoad: parseInt(occupantLoad),
                  requiredExits: result.numExits,
                  totalExitWidth: result.totalExitWidth * 1000,
                  widthUnit: "mm",
                  travelDistance: buildingHeight === "7+" ? 25 : buildingHeight === "4-6" ? 30 : 45,
                  distanceUnit: "m",
                  nbcReference: "NBC Part 3.4.2, 3.4.3"
                })}
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>
          )}

          {/* 5 C's: COMPLIANCE - Code Reference */}
          <CodeReference
            code="NBC 3.4.2, 3.4.3"
            title="Exit Requirements"
            description="Number of exits and width/capacity requirements for means of egress"
          />

          {/* 5 C's: CLARIFICATION - Why Important */}
          <WhyImportant
            reason="Adequate exits are the last line of defense in an emergency. Properly sized and located exits allow all occupants to evacuate safely before conditions become untenable."
            consequences="Insufficient exits or inadequate exit width can cause fatal bottlenecks during evacuation, as tragically demonstrated in historical fire disasters."
            example="The Station Nightclub fire (2003) killed 100 people partly because exits were inadequate for the 462 occupants - a stark reminder of why these calculations matter."
          />

          {/* 5 C's: CLARIFICATION - Plain Language Explanation */}
          <ClarificationPanel title="What does this mean in practice?">
            <p>
              <strong>Number of exits:</strong> More people means more exits. This ensures that if one exit is blocked by fire or smoke, occupants have alternative escape routes.
            </p>
            <p className="mt-2">
              <strong>Exit width:</strong> Wider exits allow more people to pass through quickly. The code calculates this based on how fast people can move through doorways and stairs.
            </p>
            <p className="mt-2">
              <strong>Remote location:</strong> Exits must be separated so that a single fire can't block all escape routes. Generally, exits should be at least half the diagonal distance of the floor apart.
            </p>
          </ClarificationPanel>

          {/* 5 C's: CONNECTION - Related Requirements */}
          <RelatedRequirements
            title="Related Exit Requirements"
            requirements={[
              {
                title: "Travel Distance",
                codeRef: "NBC 3.4.2.5",
                description: "Maximum distance from any point to nearest exit"
              },
              {
                title: "Exit Signs",
                codeRef: "NBC 3.4.5",
                description: "Illuminated exit signs required at all exits"
              },
              {
                title: "Emergency Lighting",
                codeRef: "NBC 3.2.7",
                description: "Emergency lighting in exit paths for power failures"
              },
              {
                title: "Panic Hardware",
                codeRef: "NBC 3.4.6.15",
                description: "Required on exit doors serving > 100 persons in assembly"
              }
            ]}
          />

          {/* 5 C's: CHECKBACK - Did You Consider */}
          {result.numExits > 0 && (
            <DidYouConsider
              items={[
                "Are exits located remotely from each other (at least 1/2 diagonal distance apart)?",
                "Do exit doors swing in the direction of travel when serving > 60 persons?",
                "Is there a clear, unobstructed path to each exit?",
                "Are exit stairs enclosed with fire-rated construction?",
                "Have you checked travel distance from the most remote point?"
              ]}
            />
          )}

          {/* Reference */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Reference:</strong> National Building Code of Canada 2025, Part 3.4.2 - Number of Exits,
              Part 3.4.3 - Width and Capacity of Exits
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
