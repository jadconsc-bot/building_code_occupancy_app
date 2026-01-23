import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DoorOpen, AlertCircle, Download } from "lucide-react";
import { exportExitRequirementsToExcel } from "@/lib/excelExport";

export function ExitRequirementsCalculator() {
  const [occupantLoad, setOccupantLoad] = useState<string>("");
  const [buildingHeight, setBuildingHeight] = useState<string>("1-3");
  const [sprinklered, setSprinklered] = useState<string>("no");

  const calculateExitRequirements = (): {
    numExits: number;
    minWidthPerExit: number;
    totalExitWidth: number;
    widthPerPerson: number;
    reasoning: string;
  } => {
    const load = parseInt(occupantLoad) || 0;
    
    if (load === 0) {
      return { numExits: 0, minWidthPerExit: 0, totalExitWidth: 0, widthPerPerson: 0, reasoning: "" };
    }

    // Determine number of exits required (NBC 3.4.2.1)
    let numExits = 1;
    if (load > 60) numExits = 2;
    if (load > 500) numExits = 3;
    if (load > 1000) numExits = 4;

    // Width per person (NBC 3.4.3.2)
    // Stairs: 6.1mm per person, Doors/Ramps: 4.8mm per person
    // Using door width as base calculation
    const widthPerPerson = 0.0048; // meters per person (4.8mm)
    
    // Calculate total required exit width
    const totalExitWidth = load * widthPerPerson;
    
    // Minimum width per exit (distribute evenly, but not less than 900mm)
    let minWidthPerExit = Math.max(0.9, totalExitWidth / numExits);
    
    // Round up to nearest 50mm increment for practical door sizes
    minWidthPerExit = Math.ceil(minWidthPerExit * 20) / 20;

    // Generate reasoning
    let reasoning = "";
    if (load <= 60) {
      reasoning = "Single exit permitted for occupant load ≤ 60 persons (NBC 3.4.2.1)";
    } else if (load <= 500) {
      reasoning = "Two exits required for occupant load > 60 persons (NBC 3.4.2.1)";
    } else if (load <= 1000) {
      reasoning = "Three exits required for occupant load > 500 persons (NBC 3.4.2.1)";
    } else {
      reasoning = "Four exits required for occupant load > 1000 persons (NBC 3.4.2.1)";
    }

    return {
      numExits,
      minWidthPerExit,
      totalExitWidth,
      widthPerPerson,
      reasoning
    };
  };

  const result = calculateExitRequirements();
  const minWidthInches = result.minWidthPerExit * 39.37; // Convert meters to inches
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
                    <strong>Width per Person:</strong> {(result.widthPerPerson * 1000).toFixed(1)} mm/person (doors and ramps)
                  </p>
                  <p>
                    <strong>Total Width Required:</strong> {occupantLoad} persons × {(result.widthPerPerson * 1000).toFixed(1)} mm = {(result.totalExitWidth * 1000).toFixed(0)} mm
                  </p>
                  <p>
                    <strong>Width per Exit:</strong> {(result.totalExitWidth * 1000).toFixed(0)} mm ÷ {result.numExits} exits = {(result.minWidthPerExit * 1000).toFixed(0)} mm
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-2">
                    * Minimum exit width is 900mm per NBC 3.4.3.1
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
                <span>Stairs require 6.1mm per person; doors and ramps require 4.8mm per person</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Minimum clear width for exits is 900mm (36 inches)</span>
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

          {/* Export Button */}
          {result.numExits > 0 && (
            <div className="flex justify-end">
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
