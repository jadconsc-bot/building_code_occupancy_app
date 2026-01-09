import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, CheckCircle2 } from "lucide-react";

interface ConstructionOption {
  type: string;
  maxHeight: string;
  maxStoreys: number | string;
  maxArea: string;
  sprinklerRequired: boolean;
  notes: string;
}

// Simplified NBC 3.2.2 construction type requirements
const constructionOptions: Record<string, ConstructionOption[]> = {
  "A": [ // Assembly
    { type: "Noncombustible", maxHeight: "Any", maxStoreys: "Any", maxArea: "Any", sprinklerRequired: true, notes: "Full sprinkler protection required" },
    { type: "Combustible", maxHeight: "18m", maxStoreys: 3, maxArea: "2400 m²", sprinklerRequired: true, notes: "Limited to 3 storeys with sprinklers" },
    { type: "Heavy Timber", maxHeight: "18m", maxStoreys: 6, maxArea: "Varies", sprinklerRequired: true, notes: "Specific construction requirements" }
  ],
  "B": [ // Institutional
    { type: "Noncombustible", maxHeight: "Any", maxStoreys: "Any", maxArea: "Any", sprinklerRequired: true, notes: "Full sprinkler protection required" },
    { type: "Combustible", maxHeight: "14m", maxStoreys: 2, maxArea: "1200 m²", sprinklerRequired: true, notes: "Very limited - verify specific requirements" }
  ],
  "C": [ // Residential
    { type: "Noncombustible", maxHeight: "Any", maxStoreys: "Any", maxArea: "Any", sprinklerRequired: true, notes: "Full sprinkler protection required" },
    { type: "Combustible", maxHeight: "18m", maxStoreys: 6, maxArea: "6000 m²", sprinklerRequired: true, notes: "6 storeys max with sprinklers" },
    { type: "Combustible", maxHeight: "11m", maxStoreys: 3, maxArea: "1500 m²", sprinklerRequired: false, notes: "3 storeys without sprinklers" }
  ],
  "D": [ // Business
    { type: "Noncombustible", maxHeight: "Any", maxStoreys: "Any", maxArea: "Any", sprinklerRequired: true, notes: "Full sprinkler protection required" },
    { type: "Combustible", maxHeight: "18m", maxStoreys: 6, maxArea: "4800 m²", sprinklerRequired: true, notes: "6 storeys max with sprinklers" },
    { type: "Combustible", maxHeight: "11m", maxStoreys: 3, maxArea: "2400 m²", sprinklerRequired: false, notes: "3 storeys without sprinklers" }
  ],
  "E": [ // Mercantile
    { type: "Noncombustible", maxHeight: "Any", maxStoreys: "Any", maxArea: "Any", sprinklerRequired: true, notes: "Full sprinkler protection required" },
    { type: "Combustible", maxHeight: "18m", maxStoreys: 6, maxArea: "4800 m²", sprinklerRequired: true, notes: "6 storeys max with sprinklers" },
    { type: "Combustible", maxHeight: "11m", maxStoreys: 3, maxArea: "2400 m²", sprinklerRequired: false, notes: "3 storeys without sprinklers" }
  ],
  "F": [ // Industrial
    { type: "Noncombustible", maxHeight: "Any", maxStoreys: "Any", maxArea: "Any", sprinklerRequired: true, notes: "Full sprinkler protection required" },
    { type: "Combustible", maxHeight: "18m", maxStoreys: 6, maxArea: "7200 m²", sprinklerRequired: true, notes: "F-3 only, 6 storeys max" },
    { type: "Combustible", maxHeight: "11m", maxStoreys: 2, maxArea: "2400 m²", sprinklerRequired: false, notes: "F-2 and F-3, limited height" }
  ]
};

const occupancyNames: Record<string, string> = {
  "A": "Assembly",
  "B": "Institutional",
  "C": "Residential",
  "D": "Business & Personal Services",
  "E": "Mercantile",
  "F": "Industrial"
};

export function ConstructionTypeSelector() {
  const [occupancy, setOccupancy] = useState<string>("");
  const [buildingHeight, setBuildingHeight] = useState<string>("");
  const [numStoreys, setNumStoreys] = useState<string>("");
  const [buildingArea, setBuildingArea] = useState<string>("");
  const [sprinklered, setSprinklered] = useState<string>("yes");

  const getCompatibleOptions = (): ConstructionOption[] => {
    if (!occupancy) return [];

    const options = constructionOptions[occupancy] || [];
    const height = parseFloat(buildingHeight) || 0;
    const storeys = parseInt(numStoreys) || 0;
    const area = parseFloat(buildingArea) || 0;

    return options.filter(option => {
      // Check sprinkler requirement
      if (option.sprinklerRequired && sprinklered === "no") return false;

      // Check height
      if (option.maxHeight !== "Any") {
        const maxH = parseFloat(option.maxHeight);
        if (height > maxH) return false;
      }

      // Check storeys
      if (option.maxStoreys !== "Any") {
        const maxS = typeof option.maxStoreys === "number" ? option.maxStoreys : 999;
        if (storeys > maxS) return false;
      }

      // Check area (simplified - actual code has complex area calculations)
      if (option.maxArea !== "Any" && option.maxArea !== "Varies") {
        const maxA = parseFloat(option.maxArea);
        if (area > maxA) return false;
      }

      return true;
    });
  };

  const compatibleOptions = getCompatibleOptions();

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Construction Type Selector
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Determine allowable construction types for your project (NBC Part 3.2.2)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupancy" className="text-xs font-medium">
                Major Occupancy
              </Label>
              <Select value={occupancy} onValueChange={setOccupancy}>
                <SelectTrigger id="occupancy" className="rounded-none">
                  <SelectValue placeholder="Select occupancy" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(occupancyNames).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprinklered" className="text-xs font-medium">
                Sprinkler Protection
              </Label>
              <Select value={sprinklered} onValueChange={setSprinklered}>
                <SelectTrigger id="sprinklered" className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Fully Sprinklered</SelectItem>
                  <SelectItem value="no">No - Not Sprinklered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buildingHeight" className="text-xs font-medium">
                Building Height (meters)
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
              <Label htmlFor="numStoreys" className="text-xs font-medium">
                Number of Storeys
              </Label>
              <Input
                id="numStoreys"
                type="number"
                value={numStoreys}
                onChange={(e) => setNumStoreys(e.target.value)}
                placeholder="e.g., 4"
                className="rounded-none"
                min="1"
                step="1"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="buildingArea" className="text-xs font-medium">
                Building Area (m²)
              </Label>
              <Input
                id="buildingArea"
                type="number"
                value={buildingArea}
                onChange={(e) => setBuildingArea(e.target.value)}
                placeholder="e.g., 3000"
                className="rounded-none"
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Results */}
          {occupancy && (
            <>
              {compatibleOptions.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-500/10 border-l-4 border-green-500">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <h4 className="text-sm font-bold">
                        {compatibleOptions.length} Compatible Construction {compatibleOptions.length === 1 ? "Type" : "Types"} Found
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        The following construction types are permitted for your project parameters
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-bold uppercase">Construction Type</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Max Height</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Max Storeys</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Max Area</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Sprinklers</TableHead>
                          <TableHead className="text-xs font-bold uppercase">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compatibleOptions.map((option, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{option.type}</TableCell>
                            <TableCell>{option.maxHeight}</TableCell>
                            <TableCell>{option.maxStoreys}</TableCell>
                            <TableCell>{option.maxArea}</TableCell>
                            <TableCell>
                              <Badge variant={option.sprinklerRequired ? "destructive" : "secondary"}>
                                {option.sprinklerRequired ? "Required" : "Optional"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{option.notes}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-destructive/10 border-l-4 border-destructive">
                  <h4 className="text-sm font-bold text-destructive mb-2">
                    No Compatible Construction Types
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Your project parameters exceed the limits for all construction types. Consider:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>• Adding full sprinkler protection</li>
                    <li>• Reducing building height or number of storeys</li>
                    <li>• Reducing building area</li>
                    <li>• Using noncombustible construction</li>
                    <li>• Consulting with a structural engineer</li>
                  </ul>
                </div>
              )}
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
                <span>This is a simplified selector - actual NBC requirements are more complex</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Building area may be increased with street frontage and spatial separations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Mezzanines and certain areas may be excluded from area calculations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Mixed occupancies require special consideration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Fire resistance ratings vary by construction type and occupancy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Always verify with NBC 3.2.2 and consult with building officials</span>
              </li>
            </ul>
          </div>

          {/* Reference */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Reference:</strong> National Building Code of Canada 2025, Part 3.2.2 - Building Height and Area,
              Tables 3.2.2.X - Building Height and Area Limits by Occupancy and Construction Type
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
