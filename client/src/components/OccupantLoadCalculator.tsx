import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calculator, Download } from "lucide-react";
import { exportOccupantLoadToExcel } from "@/lib/excelExport";

// NBC Table 3.1.17.1 - Occupant Load
interface OccupantLoadData {
  area: number; // m² per person
  description: string;
}

const occupantLoadTable: Record<string, OccupantLoadData[]> = {
  "Assembly": [
    { area: 0.75, description: "Assembly areas with fixed seats" },
    { area: 1.2, description: "Standing space, waiting areas" },
    { area: 1.4, description: "Assembly areas without fixed seats, stages" },
    { area: 4.6, description: "Exhibit halls, museums, libraries" },
    { area: 9.3, description: "Skating rinks, swimming pools (deck area)" }
  ],
  "Institutional": [
    { area: 10.0, description: "Treatment or care areas" },
    { area: 4.6, description: "Sleeping areas" },
    { area: 1.9, description: "Dining areas, lounges" }
  ],
  "Residential": [
    { area: 18.6, description: "Dwelling units" },
    { area: 9.3, description: "Sleeping areas (hotels, dormitories)" },
    { area: 1.9, description: "Kitchens, dining areas" }
  ],
  "Business": [
    { area: 9.3, description: "Offices, banks, professional services" },
    { area: 4.6, description: "Retail sales areas, personal services" },
    { area: 1.9, description: "Dining areas, food courts" }
  ],
  "Mercantile": [
    { area: 3.7, description: "Sales areas (main floor)" },
    { area: 5.6, description: "Sales areas (other floors)" },
    { area: 18.6, description: "Storage areas, warehouses" }
  ],
  "Industrial": [
    { area: 9.3, description: "Industrial work areas" },
    { area: 18.6, description: "Storage areas, warehouses" }
  ]
};

export function OccupantLoadCalculator() {
  const [category, setCategory] = useState<string>("");
  const [spaceType, setSpaceType] = useState<string>("");
  const [floorArea, setFloorArea] = useState<string>("");

  const getSpaceTypes = (): OccupantLoadData[] => {
    return occupantLoadTable[category] || [];
  };

  const calculateOccupantLoad = (): { occupantLoad: number; areaPerPerson: number } => {
    if (!floorArea || !spaceType) {
      return { occupantLoad: 0, areaPerPerson: 0 };
    }

    const area = parseFloat(floorArea);
    const spaceData = getSpaceTypes().find(s => s.description === spaceType);
    
    if (!spaceData || isNaN(area)) {
      return { occupantLoad: 0, areaPerPerson: 0 };
    }

    const occupantLoad = Math.ceil(area / spaceData.area);
    return { occupantLoad, areaPerPerson: spaceData.area };
  };

  const result = calculateOccupantLoad();
  const areaInFeet = result.areaPerPerson * 10.764; // Convert m² to ft²

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Occupant Load Calculator
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Calculate required occupant load for egress design (NBC Part 3.1.17, Table 3.1.17.1)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-medium">
                Occupancy Category
              </Label>
              <Select value={category} onValueChange={(value) => { setCategory(value); setSpaceType(""); }}>
                <SelectTrigger id="category" className="rounded-none">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assembly">Assembly (A)</SelectItem>
                  <SelectItem value="Institutional">Institutional (B)</SelectItem>
                  <SelectItem value="Residential">Residential (C)</SelectItem>
                  <SelectItem value="Business">Business & Personal Services (D)</SelectItem>
                  <SelectItem value="Mercantile">Mercantile (E)</SelectItem>
                  <SelectItem value="Industrial">Industrial (F)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category && (
              <div className="space-y-2">
                <Label htmlFor="spaceType" className="text-xs font-medium">
                  Space Type
                </Label>
                <Select value={spaceType} onValueChange={setSpaceType}>
                  <SelectTrigger id="spaceType" className="rounded-none">
                    <SelectValue placeholder="Select space type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSpaceTypes().map((space, index) => (
                      <SelectItem key={index} value={space.description}>
                        {space.description} ({space.area} m²/person)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <NumericInput
                id="floorArea"
                label="Floor Area"
                value={floorArea}
                onChange={(e) => setFloorArea(e.target.value)}
                placeholder="e.g., 500"
                className="rounded-none"
                min="1"
                max="100000"
                unit="m²"
                showValidation={true}
              />
            </div>
          </div>

          {/* Result Display */}
          {result.occupantLoad > 0 && (
            <>
              <div className="p-6 border-l-4 border-primary bg-primary/5">
                <div className="flex items-start gap-3">
                  <Calculator className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-3">
                      Calculated Occupant Load
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Occupant Load</p>
                        <p className="text-4xl font-bold text-primary">{result.occupantLoad}</p>
                        <Badge variant="secondary" className="mt-2">persons</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Area per Person</p>
                        <p className="text-2xl font-bold text-primary">{result.areaPerPerson} m²</p>
                        <p className="text-sm text-muted-foreground mt-1">({areaInFeet.toFixed(1)} ft²)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Breakdown */}
              <div className="p-4 bg-muted/30 border border-border rounded-none">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                  Calculation Method
                </h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <strong>Formula:</strong> Occupant Load = Floor Area ÷ Area per Person
                  </p>
                  <p>
                    <strong>Calculation:</strong> {floorArea} m² ÷ {result.areaPerPerson} m²/person = {result.occupantLoad} persons
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-2">
                    * Rounded up to nearest whole number per NBC requirements
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
                <span>Occupant load determines required exit capacity and number of exits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>For mixed-use spaces, calculate each area separately and sum totals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Fixed seating areas: count actual number of seats instead of using area method</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Building official may require higher occupant load based on actual use</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Storage areas and service rooms may be excluded from occupant load calculations</span>
              </li>
            </ul>
          </div>

          {/* Export Button */}
          {result.occupantLoad > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-none gap-2"
                onClick={() => exportOccupantLoadToExcel({
                  occupancyType: `${category} - ${spaceType}`,
                  floorArea: parseFloat(floorArea),
                  areaUnit: "m²",
                  loadFactor: result.areaPerPerson,
                  occupantLoad: result.occupantLoad,
                  nbcReference: "NBC Table 3.1.17.1"
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
              <strong>Reference:</strong> National Building Code of Canada 2025, Part 3.1.17 - Occupant Load,
              Table 3.1.17.1 - Floor Area per Person for Occupant Load Determination
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
