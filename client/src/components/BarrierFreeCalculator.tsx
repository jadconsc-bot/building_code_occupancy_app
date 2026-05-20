import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accessibility, CheckCircle2, Download } from "lucide-react";
import { exportBarrierFreeToExcel } from "@/lib/excelExport";
import { SaveButton } from "@/components/CalculatorWithSave";

// NBC Part 3.8 - Barrier-Free Design Requirements
export function BarrierFreeCalculator() {
  const [occupancy, setOccupancy] = useState<string>("");
  const [floorArea, setFloorArea] = useState<string>("");
  const [numWashrooms, setNumWashrooms] = useState<string>("");
  const [numParkingSpaces, setNumParkingSpaces] = useState<string>("");

  const calculateBarrierFreeRequirements = (): {
    accessRequired: boolean;
    minAccessibleWashrooms: number;
    minAccessibleParking: number;
    additionalRequirements: string[];
  } => {
    const area = parseFloat(floorArea) || 0;
    const washrooms = parseInt(numWashrooms) || 0;
    const parking = parseInt(numParkingSpaces) || 0;

    // NBC 3.8.2.1 - Buildings requiring barrier-free access
    const accessRequired = area > 300 || ["B-2", "B-3", "A-1", "A-2", "D", "E"].includes(occupancy);

    // NBC 3.8.2.9 - Accessible washrooms
    let minAccessibleWashrooms = 0;
    if (accessRequired && washrooms > 0) {
      if (washrooms <= 2) {
        minAccessibleWashrooms = 1;
      } else if (washrooms <= 4) {
        minAccessibleWashrooms = 2;
      } else {
        minAccessibleWashrooms = Math.ceil(washrooms * 0.5);
      }
    }

    // NBC 3.8.2.11 - Accessible parking
    let minAccessibleParking = 0;
    if (accessRequired && parking > 0) {
      if (parking <= 12) {
        minAccessibleParking = 1;
      } else if (parking <= 100) {
        minAccessibleParking = Math.ceil(parking * 0.04); // 4%
      } else if (parking <= 200) {
        minAccessibleParking = 4 + Math.ceil((parking - 100) * 0.03); // 4 + 3% of excess
      } else {
        minAccessibleParking = 7 + Math.ceil((parking - 200) * 0.02); // 7 + 2% of excess
      }
    }

    const additionalRequirements: string[] = [];
    if (accessRequired) {
      additionalRequirements.push("Barrier-free path of travel from entrance to all floors");
      additionalRequirements.push("Accessible entrance with level or ramped access (max 1:12 slope)");
      
      if (["A-1", "A-2", "A-3", "D", "E"].includes(occupancy)) {
        additionalRequirements.push("Accessible service counter (max 865mm height)");
      }
      
      if (["B-2", "B-3", "C"].includes(occupancy)) {
        additionalRequirements.push("Accessible dwelling units or patient rooms (min 10% of total)");
      }

      if (area > 600) {
        additionalRequirements.push("Elevator required for multi-storey buildings");
      }

      additionalRequirements.push("Door opening width minimum 800mm clear");
      additionalRequirements.push("Accessible signage with tactile characters");
    }

    return {
      accessRequired,
      minAccessibleWashrooms,
      minAccessibleParking,
      additionalRequirements
    };
  };

  const result = calculateBarrierFreeRequirements();

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-primary" /> Barrier-Free Design Calculator
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Determine accessibility requirements per NBC Part 3.8
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupancy" className="text-xs font-medium">
                Occupancy Classification
              </Label>
              <Select value={occupancy} onValueChange={setOccupancy}>
                <SelectTrigger id="occupancy" className="rounded-none">
                  <SelectValue placeholder="Select occupancy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A-1">A-1 - Assembly (Performing Arts)</SelectItem>
                  <SelectItem value="A-2">A-2 - Assembly (General)</SelectItem>
                  <SelectItem value="A-3">A-3 - Assembly (Arena)</SelectItem>
                  <SelectItem value="B-2">B-2 - Institutional (Treatment)</SelectItem>
                  <SelectItem value="B-3">B-3 - Institutional (Care)</SelectItem>
                  <SelectItem value="C">C - Residential</SelectItem>
                  <SelectItem value="D">D - Business & Personal Services</SelectItem>
                  <SelectItem value="E">E - Mercantile</SelectItem>
                  <SelectItem value="F-2">F-2 - Industrial (Medium Hazard)</SelectItem>
                  <SelectItem value="F-3">F-3 - Industrial (Low Hazard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floorArea" className="text-xs font-medium">
                Total Floor Area (m²)
              </Label>
              <Input
                id="floorArea"
                type="number"
                value={floorArea}
                onChange={(e) => setFloorArea(e.target.value)}
                placeholder="e.g., 500"
                className="rounded-none"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numWashrooms" className="text-xs font-medium">
                Number of Washrooms
              </Label>
              <Input
                id="numWashrooms"
                type="number"
                value={numWashrooms}
                onChange={(e) => setNumWashrooms(e.target.value)}
                placeholder="e.g., 4"
                className="rounded-none"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numParkingSpaces" className="text-xs font-medium">
                Number of Parking Spaces
              </Label>
              <Input
                id="numParkingSpaces"
                type="number"
                value={numParkingSpaces}
                onChange={(e) => setNumParkingSpaces(e.target.value)}
                placeholder="e.g., 50"
                className="rounded-none"
                min="0"
              />
            </div>
          </div>

          {/* Result Display */}
          {occupancy && floorArea && (
            <>
              <div className={`p-4 border-l-4 ${result.accessRequired ? 'border-primary bg-primary/5' : 'border-muted bg-muted/20'}`}>
                <div className="flex items-start gap-3">
                  {result.accessRequired ? (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">
                      {result.accessRequired ? 'Barrier-Free Access Required' : 'Barrier-Free Access Not Required'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {result.accessRequired 
                        ? 'Building must comply with NBC Part 3.8 accessibility requirements'
                        : 'Building area is less than 300 m² and occupancy type does not require barrier-free access'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {result.accessRequired && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Accessible Washrooms Required</div>
                      <div className="text-2xl font-bold text-primary">{result.minAccessibleWashrooms}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Out of {numWashrooms} total washrooms
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Accessible Parking Spaces Required</div>
                      <div className="text-2xl font-bold text-primary">{result.minAccessibleParking}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Out of {numParkingSpaces} total spaces ({((result.minAccessibleParking / parseInt(numParkingSpaces)) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Additional Requirements</h4>
                    <ul className="space-y-2">
                      {result.additionalRequirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Export Button */}
          {result.accessRequired && (
            <div className="flex justify-end gap-2">
              <SaveButton
                calculatorType="barrierFree"
                inputs={{ occupancy, floorArea, numWashrooms, numParkingSpaces }}
                results={{ accessRequired: result.accessRequired, minAccessibleWashrooms: result.minAccessibleWashrooms, minAccessibleParking: result.minAccessibleParking, additionalRequirements: result.additionalRequirements }}
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-none gap-2"
                onClick={() => exportBarrierFreeToExcel({
                  occupancyType: occupancy,
                  floorArea: parseFloat(floorArea) || 0,
                  totalWashrooms: parseInt(numWashrooms) || 0,
                  totalParkingSpaces: parseInt(numParkingSpaces) || 0,
                  accessibleWashroomsRequired: result.minAccessibleWashrooms,
                  accessibleParkingRequired: result.minAccessibleParking,
                  requirements: result.additionalRequirements
                })}
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="font-semibold">Important Notes (NBC Part 3.8):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Barrier-free path of travel must be provided from public way to building entrance</li>
              <li>Accessible washrooms must include grab bars, clear floor space, and accessible fixtures</li>
              <li>Accessible parking spaces must be 3.4m wide with 1.5m access aisle</li>
              <li>Elevators required for buildings over 600 m² with multiple storeys</li>
              <li>Refer to NBC Article 3.8 for complete barrier-free design requirements</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
