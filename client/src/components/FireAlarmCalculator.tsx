import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Download } from "lucide-react";
import { exportFireAlarmToExcel } from "@/lib/excelExport";

// NBC Part 3.2.4 - Fire Alarm and Detection Systems
export function FireAlarmCalculator() {
  const [occupancy, setOccupancy] = useState<string>("");
  const [buildingHeight, setBuildingHeight] = useState<string>("");
  const [floorArea, setFloorArea] = useState<string>("");
  const [occupantLoad, setOccupantLoad] = useState<string>("");

  const calculateFireAlarmRequirements = (): {
    systemRequired: boolean;
    systemType: string;
    detectionRequired: boolean;
    voiceCommunication: boolean;
    requirements: string[];
    nbcReferences: string[];
  } => {
    const height = parseFloat(buildingHeight) || 0;
    const area = parseFloat(floorArea) || 0;
    const load = parseInt(occupantLoad) || 0;

    let systemRequired = false;
    let systemType = "None";
    let detectionRequired = false;
    let voiceCommunication = false;
    const requirements: string[] = [];
    const nbcReferences: string[] = [];

    // NBC 3.2.4.1 - Fire alarm system requirements
    if (["A-1", "A-2", "A-3"].includes(occupancy)) {
      if (load > 300 || area > 600) {
        systemRequired = true;
        systemType = "Single Stage";
        nbcReferences.push("NBC 3.2.4.1(1)(a)");
        requirements.push("Single-stage fire alarm system required for assembly occupancies");
      }
      if (load > 1000) {
        voiceCommunication = true;
        requirements.push("Voice communication system required for occupant load > 1000");
        nbcReferences.push("NBC 3.2.4.17");
      }
    }

    if (["B-1", "B-2", "B-3"].includes(occupancy)) {
      systemRequired = true;
      systemType = "Two Stage";
      detectionRequired = true;
      nbcReferences.push("NBC 3.2.4.1(1)(b)");
      requirements.push("Two-stage fire alarm system required for institutional occupancies");
      requirements.push("Automatic fire detection required in all areas");
      
      if (occupancy === "B-1") {
        requirements.push("Manual pull stations at exits and staff areas");
        requirements.push("Audible and visual alarm devices in all occupied areas");
      }
    }

    if (occupancy === "C") {
      if (height > 18 || area > 600) {
        systemRequired = true;
        systemType = "Single Stage";
        nbcReferences.push("NBC 3.2.4.1(1)(c)");
        requirements.push("Fire alarm system required for residential buildings over 18m or 600 m²");
      }
      if (height > 18) {
        detectionRequired = true;
        requirements.push("Smoke detectors required in all dwelling units and common areas");
        nbcReferences.push("NBC 3.2.4.20");
      }
    }

    if (["D", "E"].includes(occupancy)) {
      if (area > 600 || height > 18) {
        systemRequired = true;
        systemType = "Single Stage";
        nbcReferences.push("NBC 3.2.4.1(1)(d)");
        requirements.push("Fire alarm system required for business/mercantile over 600 m² or 18m height");
      }
    }

    if (["F-1", "F-2"].includes(occupancy)) {
      if (area > 600) {
        systemRequired = true;
        systemType = "Single Stage";
        nbcReferences.push("NBC 3.2.4.1(1)(e)");
        requirements.push("Fire alarm system required for industrial occupancies over 600 m²");
      }
      if (occupancy === "F-1") {
        detectionRequired = true;
        requirements.push("Automatic fire detection required in high hazard industrial areas");
      }
    }

    // Additional requirements for all systems
    if (systemRequired) {
      requirements.push("Fire alarm control panel (FACP) required at main entrance");
      requirements.push("Manual pull stations at exits (except dwelling units)");
      requirements.push("Audible alarm devices throughout building");
      requirements.push("Connection to fire department (where available)");
      requirements.push("Emergency power supply (batteries or generator)");
      
      if (height > 36) {
        voiceCommunication = true;
        requirements.push("Voice communication system required for buildings over 36m");
        nbcReferences.push("NBC 3.2.4.17");
      }
    }

    return {
      systemRequired,
      systemType,
      detectionRequired,
      voiceCommunication,
      requirements,
      nbcReferences
    };
  };

  const result = calculateFireAlarmRequirements();

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-destructive" /> Fire Alarm System Calculator
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Determine fire alarm and detection requirements per NBC Part 3.2.4
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
                  <SelectItem value="B-1">B-1 - Institutional (Detention)</SelectItem>
                  <SelectItem value="B-2">B-2 - Institutional (Treatment)</SelectItem>
                  <SelectItem value="B-3">B-3 - Institutional (Care)</SelectItem>
                  <SelectItem value="C">C - Residential</SelectItem>
                  <SelectItem value="D">D - Business & Personal Services</SelectItem>
                  <SelectItem value="E">E - Mercantile</SelectItem>
                  <SelectItem value="F-1">F-1 - Industrial (High Hazard)</SelectItem>
                  <SelectItem value="F-2">F-2 - Industrial (Medium Hazard)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buildingHeight" className="text-xs font-medium">
                Building Height (m)
              </Label>
              <Input
                id="buildingHeight"
                type="number"
                value={buildingHeight}
                onChange={(e) => setBuildingHeight(e.target.value)}
                placeholder="e.g., 15"
                className="rounded-none"
                min="0"
                step="0.1"
              />
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
                placeholder="e.g., 800"
                className="rounded-none"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupantLoad" className="text-xs font-medium">
                Occupant Load (persons)
              </Label>
              <Input
                id="occupantLoad"
                type="number"
                value={occupantLoad}
                onChange={(e) => setOccupantLoad(e.target.value)}
                placeholder="e.g., 250"
                className="rounded-none"
                min="0"
              />
            </div>
          </div>

          {/* Result Display */}
          {occupancy && (buildingHeight || floorArea) && (
            <>
              <div className={`p-4 border-l-4 ${result.systemRequired ? 'border-destructive bg-destructive/5' : 'border-muted bg-muted/20'}`}>
                <div className="flex items-start gap-3">
                  {result.systemRequired ? (
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  ) : (
                    <Bell className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">
                      {result.systemRequired ? 'Fire Alarm System Required' : 'Fire Alarm System Not Required'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {result.systemRequired 
                        ? `${result.systemType} fire alarm system must be installed per NBC Part 3.2.4`
                        : 'Building parameters do not trigger fire alarm system requirements'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {result.systemRequired && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">System Type</div>
                      <Badge variant="destructive" className="text-sm">{result.systemType}</Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Automatic Detection</div>
                      <Badge variant={result.detectionRequired ? "destructive" : "outline"} className="text-sm">
                        {result.detectionRequired ? "Required" : "Not Required"}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Voice Communication</div>
                      <Badge variant={result.voiceCommunication ? "destructive" : "outline"} className="text-sm">
                        {result.voiceCommunication ? "Required" : "Not Required"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3">System Requirements</h4>
                    <ul className="space-y-2">
                      {result.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <Bell className="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.nbcReferences.length > 0 && (
                    <div className="p-3 border rounded-lg bg-primary/5">
                      <h4 className="text-xs font-bold mb-2">NBC References</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.nbcReferences.map((ref, index) => (
                          <Badge key={index} variant="outline" className="text-[10px] font-mono">
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Export Button */}
          {result.systemRequired && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none gap-2"
                onClick={() => exportFireAlarmToExcel({
                  occupancyType: occupancy,
                  buildingHeight: parseFloat(buildingHeight) || 0,
                  floorArea: parseFloat(floorArea) || 0,
                  systemType: result.systemType,
                  detectionRequired: result.detectionRequired,
                  voiceCommunication: result.voiceCommunication,
                  requirements: result.requirements,
                  nbcReferences: result.nbcReferences
                })}
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="font-semibold">Important Notes (NBC Part 3.2.4):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fire alarm systems must conform to CAN/ULC-S524 and CAN/ULC-S527</li>
              <li>Single-stage systems activate all alarm devices simultaneously</li>
              <li>Two-stage systems provide alert signal followed by evacuation signal</li>
              <li>Smoke detectors required in sleeping areas per NBC 9.10.19</li>
              <li>Annual inspection and testing required per NBC 3.2.4.22</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
