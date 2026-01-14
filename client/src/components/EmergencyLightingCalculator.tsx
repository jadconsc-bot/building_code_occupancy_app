import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle2 } from "lucide-react";

// NBC Part 3.2.7 - Emergency Lighting
export function EmergencyLightingCalculator() {
  const [occupancy, setOccupancy] = useState<string>("");
  const [floorArea, setFloorArea] = useState<string>("");
  const [occupantLoad, setOccupantLoad] = useState<string>("");
  const [buildingHeight, setBuildingHeight] = useState<string>("");

  const calculateEmergencyLighting = (): {
    required: boolean;
    minimumIllumination: number;
    duration: number;
    areas: string[];
    additionalRequirements: string[];
    nbcReferences: string[];
  } => {
    const area = parseFloat(floorArea) || 0;
    const load = parseInt(occupantLoad) || 0;
    const height = parseFloat(buildingHeight) || 0;

    let required = false;
    let minimumIllumination = 0; // lux
    let duration = 0; // minutes
    const areas: string[] = [];
    const additionalRequirements: string[] = [];
    const nbcReferences: string[] = [];

    // NBC 3.2.7.1 - Emergency lighting requirements
    if (["A-1", "A-2", "A-3", "A-4"].includes(occupancy)) {
      if (load > 60 || area > 200) {
        required = true;
        minimumIllumination = 10; // 10 lux minimum
        duration = 30; // 30 minutes minimum
        nbcReferences.push("NBC 3.2.7.1(1)(a)");
        
        areas.push("All exits and exit access corridors");
        areas.push("Exit stairs and ramps");
        areas.push("Assembly floor areas");
        areas.push("Public washrooms");
        
        if (load > 300) {
          duration = 60;
          additionalRequirements.push("60-minute duration required for occupant load > 300");
        }
      }
    }

    if (["B-1", "B-2", "B-3"].includes(occupancy)) {
      required = true;
      minimumIllumination = 10;
      duration = 120; // 2 hours for institutional
      nbcReferences.push("NBC 3.2.7.1(1)(b)");
      
      areas.push("All corridors and exit routes");
      areas.push("Patient/resident rooms");
      areas.push("Treatment areas");
      areas.push("Nursing stations");
      areas.push("All stairways");
      
      additionalRequirements.push("Emergency lighting must remain on continuously in care facilities");
      additionalRequirements.push("Backup generator required for institutional occupancies");
    }

    if (occupancy === "C") {
      if (height > 18 || area > 600) {
        required = true;
        minimumIllumination = 10;
        duration = 30;
        nbcReferences.push("NBC 3.2.7.1(1)(c)");
        
        areas.push("Exit corridors and stairways");
        areas.push("Underground parking areas");
        areas.push("Common areas and lobbies");
        
        if (height > 36) {
          duration = 60;
          additionalRequirements.push("60-minute duration required for buildings over 36m");
        }
      }
    }

    if (["D", "E"].includes(occupancy)) {
      if (area > 300 || height > 18) {
        required = true;
        minimumIllumination = 10;
        duration = 30;
        nbcReferences.push("NBC 3.2.7.1(1)(d)");
        
        areas.push("Exit routes and corridors");
        areas.push("Stairways and ramps");
        areas.push("Public areas");
        areas.push("Washrooms");
      }
    }

    if (["F-1", "F-2", "F-3"].includes(occupancy)) {
      if (area > 300) {
        required = true;
        minimumIllumination = 10;
        duration = 30;
        nbcReferences.push("NBC 3.2.7.1(1)(e)");
        
        areas.push("Exit routes and aisles");
        areas.push("Stairways");
        areas.push("Hazardous work areas");
        
        if (occupancy === "F-1") {
          duration = 60;
          additionalRequirements.push("60-minute duration required for high hazard industrial");
        }
      }
    }

    // Additional requirements for all systems
    if (required) {
      additionalRequirements.push(`Minimum illumination: ${minimumIllumination} lux at floor level`);
      additionalRequirements.push(`Emergency power duration: ${duration} minutes minimum`);
      additionalRequirements.push("Emergency lighting must activate automatically on power failure");
      additionalRequirements.push("Exit signs must be illuminated and connected to emergency power");
      additionalRequirements.push("Battery backup or emergency generator required");
      additionalRequirements.push("Monthly testing and annual inspection required");
    }

    return {
      required,
      minimumIllumination,
      duration,
      areas,
      additionalRequirements,
      nbcReferences
    };
  };

  const result = calculateEmergencyLighting();

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-600" /> Emergency Lighting Calculator
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Determine emergency lighting requirements per NBC Part 3.2.7
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
                  <SelectItem value="A-4">A-4 - Assembly (Open Air)</SelectItem>
                  <SelectItem value="B-1">B-1 - Institutional (Detention)</SelectItem>
                  <SelectItem value="B-2">B-2 - Institutional (Treatment)</SelectItem>
                  <SelectItem value="B-3">B-3 - Institutional (Care)</SelectItem>
                  <SelectItem value="C">C - Residential</SelectItem>
                  <SelectItem value="D">D - Business & Personal Services</SelectItem>
                  <SelectItem value="E">E - Mercantile</SelectItem>
                  <SelectItem value="F-1">F-1 - Industrial (High Hazard)</SelectItem>
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
              <Label htmlFor="occupantLoad" className="text-xs font-medium">
                Occupant Load (persons)
              </Label>
              <Input
                id="occupantLoad"
                type="number"
                value={occupantLoad}
                onChange={(e) => setOccupantLoad(e.target.value)}
                placeholder="e.g., 150"
                className="rounded-none"
                min="0"
              />
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
                placeholder="e.g., 12"
                className="rounded-none"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Result Display */}
          {occupancy && (floorArea || occupantLoad) && (
            <>
              <div className={`p-4 border-l-4 ${result.required ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950' : 'border-muted bg-muted/20'}`}>
                <div className="flex items-start gap-3">
                  {result.required ? (
                    <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">
                      {result.required ? 'Emergency Lighting Required' : 'Emergency Lighting Not Required'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {result.required 
                        ? 'Building must have emergency lighting system per NBC Part 3.2.7'
                        : 'Building parameters do not trigger emergency lighting requirements'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {result.required && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Minimum Illumination</div>
                      <div className="text-2xl font-bold text-yellow-600">{result.minimumIllumination} lux</div>
                      <div className="text-xs text-muted-foreground mt-1">At floor level along exit routes</div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Emergency Power Duration</div>
                      <div className="text-2xl font-bold text-yellow-600">{result.duration} min</div>
                      <div className="text-xs text-muted-foreground mt-1">Minimum battery/generator runtime</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Areas Requiring Emergency Lighting</h4>
                    <ul className="space-y-2">
                      {result.areas.map((area, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <Lightbulb className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
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

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p className="font-semibold">Important Notes (NBC Part 3.2.7):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Emergency lighting must provide uniform illumination along entire exit path</li>
              <li>Exit signs must be illuminated and visible from 30m distance</li>
              <li>Battery units must be maintained and tested monthly</li>
              <li>Emergency lighting fixtures must be CSA or ULC certified</li>
              <li>Photoluminescent exit signs may be used as alternative per NBC 3.4.5.2</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
