import { useState } from "react";
import { SaveButton } from "@/components/CalculatorWithSave";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Download, Info, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { exportOccupantLoadToExcel } from "@/lib/excelExport";
import { 
  CalculatorCard, 
  CalculatorSection, 
  CalculatorRow, 
  CalculatorInputRow,
  CalculatorNotes,
  CalculatorResult 
} from "@/components/CalculatorCard";
import { 
  ComplianceBadge, 
  CodeReference, 
  ClarificationPanel, 
  WhyImportant,
  RelatedRequirements,
  DidYouConsider,
  RegionalNote
} from "@/components/FiveCsComponents";

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
  const areaInFeet = result.areaPerPerson * 10.764;

  return (
    <CalculatorCard
      subtitle="Life Safety Calculations"
      title="Occupant Load Calculator"
      description="Calculate required occupant load for egress design per NBC Part 3.1.17"
    >
      {/* INPUT SECTION */}
      <CalculatorSection title="Job">
        <CalculatorInputRow label="Occupancy Category">
          <Select value={category} onValueChange={(value) => { setCategory(value); setSpaceType(""); }}>
            <SelectTrigger className="w-48 h-8 text-accent font-semibold">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Assembly">Assembly (A)</SelectItem>
              <SelectItem value="Institutional">Institutional (B)</SelectItem>
              <SelectItem value="Residential">Residential (C)</SelectItem>
              <SelectItem value="Business">Business (D)</SelectItem>
              <SelectItem value="Mercantile">Mercantile (E)</SelectItem>
              <SelectItem value="Industrial">Industrial (F)</SelectItem>
            </SelectContent>
          </Select>
        </CalculatorInputRow>

        {category && (
          <CalculatorInputRow label="Space Type">
            <Select value={spaceType} onValueChange={setSpaceType}>
              <SelectTrigger className="w-64 h-8 text-accent font-semibold">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {getSpaceTypes().map((space, index) => (
                  <SelectItem key={index} value={space.description}>
                    {space.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CalculatorInputRow>
        )}

        <CalculatorInputRow label="Floor Area">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={floorArea}
              onChange={(e) => setFloorArea(e.target.value)}
              placeholder="500"
              className="w-24 h-8 px-2 text-right text-accent font-semibold bg-transparent border-b border-border focus:border-accent focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">m²</span>
          </div>
        </CalculatorInputRow>
      </CalculatorSection>

      {/* CALCULATION SECTION */}
      {result.occupantLoad > 0 && (
        <>
          <CalculatorSection title="Calculation">
            <CalculatorRow 
              label="Load Factor" 
              value={result.areaPerPerson} 
              unit="m²/person" 
              highlight 
            />
            <CalculatorRow 
              label="Load Factor (Imperial)" 
              value={areaInFeet.toFixed(1)} 
              unit="ft²/person" 
            />
            <CalculatorRow 
              label="Floor Area" 
              value={floorArea} 
              unit="m²" 
            />
          </CalculatorSection>

          <CalculatorSection title="Result">
            <CalculatorResult 
              label="Occupant Load" 
              value={`${result.occupantLoad} persons`}
              status={result.occupantLoad > 300 ? "warning" : "compliant"}
            />
            <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
              Formula: {floorArea} m² ÷ {result.areaPerPerson} m²/person = {result.occupantLoad} persons (rounded up)
            </div>
          </CalculatorSection>

          {/* Compliance Implications */}
          <CalculatorSection title="Compliance Implications">
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {result.occupantLoad > 60 ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                <span>
                  {result.occupantLoad > 60 
                    ? `Minimum 2 exits required (occupant load > 60)` 
                    : `Single exit may be permitted (occupant load ≤ 60)`}
                </span>
              </div>
              {result.occupantLoad > 300 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span>Assembly occupancy may require sprinkler system (occupant load &gt; 300)</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-accent" />
                <span>Required exit width: {Math.ceil(result.occupantLoad * 6.1)} mm minimum</span>
              </div>
            </div>
          </CalculatorSection>
        </>
      )}

      {/* NOTES SECTION */}
      <CalculatorNotes>
        <p>Occupant load determines required exit capacity and number of exits. For mixed-use spaces, calculate each area separately and sum totals. Fixed seating areas: count actual seats instead of using area method.</p>
      </CalculatorNotes>

      {/* 5 C's COMPONENTS */}
      <div className="p-4 space-y-4 border-t border-border">
        {/* COMPLIANCE */}
        <CodeReference 
          code="NBC 3.1.17"
          title="Occupant Load"
          description="Table 3.1.17.1 - Floor Area per Person"
        />

        {/* CLARIFICATION */}
        <WhyImportant
          reason="Occupant load is the foundation for all life safety calculations - it determines how many exits you need, how wide they must be, and what fire protection systems are required."
          consequences="Underestimating occupant load can result in inadequate exits, leading to dangerous crowding during emergencies."
          example="A 500 m² restaurant with standing areas needs exits for 416 people (500÷1.2), not 109 (500÷4.6 for dining)."
        />

        <ClarificationPanel title="What does this mean?">
          <p><strong>Occupant load</strong> is the maximum number of people a space is designed to safely accommodate. Standing areas pack people more densely than offices, so the code uses different factors.</p>
        </ClarificationPanel>

        {/* CULTURE - Regional Notes */}
        <RegionalNote 
          region="Alberta" 
          note="Alberta Building Code adopts NBC occupant load factors with additional requirements for cannabis retail (minimum 4.6 m²/person) and large assembly venues in Calgary and Edmonton."
        />

        {/* CONNECTION */}
        <RelatedRequirements
          title="What Occupant Load Affects"
          requirements={[
            { title: "Number of Exits", codeRef: "NBC 3.4.2.1", description: "OL > 60 requires min 2 exits" },
            { title: "Exit Width", codeRef: "NBC 3.4.3.2", description: "6.1mm per person minimum" },
            { title: "Plumbing Fixtures", codeRef: "NBC 3.7.2", description: "Washrooms based on OL" },
            { title: "Sprinklers", codeRef: "NBC 3.2.5", description: "OL > 300 in assembly may trigger" }
          ]}
        />

        {/* CHECKBACK */}
        {result.occupantLoad > 0 && (
          <DidYouConsider
            items={[
              "Does this space have multiple use types?",
              "Are there any fixed seats to count instead?",
              "Will actual occupancy exceed this calculated load?",
              "Have you included all floor levels?",
              "Are mezzanines included in the total area?"
            ]}
          />
        )}
      </div>

      {/* Export + Save Buttons */}
      {result.occupantLoad > 0 && (
        <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/20">
          <SaveButton
            calculatorType="occupantLoad"
            inputs={{ category, spaceType, floorArea }}
            results={{ occupantLoad: result.occupantLoad, areaPerPerson: result.areaPerPerson }}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
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
    </CalculatorCard>
  );
}
