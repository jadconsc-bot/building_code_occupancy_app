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

import { getLoadFactorsForOccupancy } from "@shared/occupantLoadFactors";
import type { OccupantLoadFactor } from "@shared/occupantLoadFactors";
import { trpc } from "@/lib/trpc";

const CATEGORY_TO_GROUP: Record<string, string> = {
  Assembly: "A",
  Institutional: "B",
  Residential: "C",
  Business: "D",
  Mercantile: "E",
  Industrial: "F",
};

export function OccupantLoadCalculator() {
  const [category, setCategory] = useState<string>("");
  const [loadFactorId, setLoadFactorId] = useState<string>("");
  const [floorArea, setFloorArea] = useState<string>("");
  const [seatCount, setSeatCount] = useState<string>("");
  const [bedroomCount, setBedroomCount] = useState<string>("");

  const getSpaceTypes = (): OccupantLoadFactor[] => {
    const group = CATEGORY_TO_GROUP[category];
    return group ? getLoadFactorsForOccupancy(group) : [];
  };

  const selectedFactor = getSpaceTypes().find((factor) => factor.id === loadFactorId);
  const isClauseBased = selectedFactor?.areaPerPerson == null && !!selectedFactor;
  const isBedroomCase = category === "Residential";
  const isSeatCase = isClauseBased && !isBedroomCase;
  const areaNum = parseFloat(floorArea);
  const seatNum = parseFloat(seatCount);
  const bedroomNum = parseFloat(bedroomCount);
  const queryEnabled =
    !!category && !!loadFactorId &&
    (
      (isSeatCase && seatCount.trim() !== "" && Number.isFinite(seatNum)) ||
      (isBedroomCase && bedroomCount.trim() !== "" && Number.isFinite(bedroomNum)) ||
      (!isClauseBased && floorArea.trim() !== "" && Number.isFinite(areaNum))
    );

  const { data: determination } = trpc.calculationsPackage.determineOccupantLoad.useQuery(
    {
      occupancyGroup: CATEGORY_TO_GROUP[category] ?? "",
      loadFactorId: loadFactorId || null,
      areaM2: Number.isFinite(areaNum) ? areaNum : null,
      seatCount: isSeatCase && Number.isFinite(seatNum) ? seatNum : null,
      bedroomCount: isBedroomCase && Number.isFinite(bedroomNum) ? bedroomNum : null,
    },
    { enabled: queryEnabled }
  );

  const result = determination ?? {
    occupantLoad: 0,
    method: "area_factor" as const,
    areaPerPerson: 0,
    seatCount: null,
    bedroomCount: null,
    needsReview: !!category && !!loadFactorId && isClauseBased,
    reasoning: "",
    citation: "",
  };
  const areaInFeet = (result.areaPerPerson ?? 0) * 10.764;

  return (
    <CalculatorCard
      subtitle="Life Safety Calculations"
      title="Occupant Load Calculator"
      description="Calculate required occupant load for egress design per NBC Part 3.1.17"
    >
      {/* INPUT SECTION */}
      <CalculatorSection title="Job">
        <CalculatorInputRow label="Occupancy Category">
          <Select value={category} onValueChange={(value) => { setCategory(value); setLoadFactorId(""); }}>
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
            <Select value={loadFactorId} onValueChange={setLoadFactorId}>
              <SelectTrigger className="w-64 h-8 text-accent font-semibold">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {getSpaceTypes().map((factor) => (
                  <SelectItem key={factor.id} value={factor.id}>
                    {factor.useType} {factor.areaPerPerson != null ? `(${factor.areaPerPerson} m²/person)` : "(count required)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CalculatorInputRow>
        )}

        {isSeatCase && (
          <CalculatorInputRow label="Number of Seats">
            <input
              type="number"
              min="0"
              step="1"
              value={seatCount}
              onChange={(e) => setSeatCount(e.target.value)}
              placeholder="Enter seat count"
              className="w-32 h-8 px-2 text-right text-accent font-semibold bg-transparent border-b border-border focus:border-accent focus:outline-none"
            />
          </CalculatorInputRow>
        )}

        {category === "Residential" && (
          <CalculatorInputRow label="Bedroom Count">
            <input
              type="number"
              min="0"
              step="1"
              value={bedroomCount}
              onChange={(e) => setBedroomCount(e.target.value)}
              placeholder="Total bedrooms"
              className="w-32 h-8 px-2 text-right text-accent font-semibold bg-transparent border-b border-border focus:border-accent focus:outline-none"
            />
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

        {result.needsReview && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
{result.reasoning}
            </span>
          </div>
        )}
      </CalculatorSection>

      {/* CALCULATION SECTION */}
      {result.occupantLoad > 0 && (
        <>
          <CalculatorSection title="Calculation">
            {result.method === "area_factor" ? (
              <>
                <CalculatorRow
                  label="Load Factor"
                  value={result.areaPerPerson ?? 0}
                  unit="m²/person"
                  highlight
                />
                <CalculatorRow
                  label="Load Factor (Imperial)"
                  value={areaInFeet.toFixed(1)}
                  unit="ft²/person"
                />
              </>
            ) : (
              <CalculatorRow
                label={result.method === "fixed_seats" ? "Seats Counted" : "Bedrooms × 2"}
                value={result.method === "fixed_seats" ? result.seatCount ?? 0 : `${result.bedroomCount ?? 0} × 2`}
                unit={result.method === "fixed_seats" ? "persons" : "persons"}
                highlight
              />
            )}
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
              {result.method === "fixed_seats"
                ? `Formula: ${result.seatCount ?? 0} fixed seats = ${result.occupantLoad} persons`
                : result.method === "bedroom_count"
                  ? `Formula: ${result.bedroomCount ?? 0} bedrooms × 2 persons = ${result.occupantLoad} persons (minimum 2)`
                  : `Formula: ${floorArea} m² ÷ ${result.areaPerPerson} m²/person = ${result.occupantLoad} persons (rounded up)`}
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
                <span>Required exit width: {Math.ceil(result.occupantLoad * (category === "Institutional" ? 18.4 : 6.1))} mm minimum ({category === "Institutional" ? "18.4" : "6.1"} mm/person × {result.occupantLoad} persons, NBC 3.4.3.2.(1))</span>
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
            inputs={{ category, loadFactorId, floorArea, seatCount, bedroomCount }}
            results={{ occupantLoad: result.occupantLoad, areaPerPerson: result.areaPerPerson, method: result.method }}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => exportOccupantLoadToExcel({
              occupancyType: `${category} - ${selectedFactor?.useType ?? ""}`,
              floorArea: parseFloat(floorArea),
              areaUnit: "m²",
              loadFactor: result.areaPerPerson ?? 0,
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
