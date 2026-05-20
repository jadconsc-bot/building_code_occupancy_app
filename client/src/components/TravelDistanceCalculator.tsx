import { useState } from "react";
import { SaveButton } from "@/components/CalculatorWithSave";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Route, CheckCircle, XCircle, Download, AlertTriangle, Info } from "lucide-react";
import { exportTravelDistanceToExcel } from "@/lib/excelExport";
import { 
  CalculatorCard, 
  CalculatorSection, 
  CalculatorRow, 
  CalculatorInputRow,
  CalculatorNotes,
  CalculatorResult 
} from "@/components/CalculatorCard";
import { 
  CodeReference, 
  ClarificationPanel, 
  WhyImportant,
  RelatedRequirements,
  DidYouConsider,
  RegionalNote
} from "@/components/FiveCsComponents";

// NBC 3.4.2.5 - Maximum Travel Distance
const travelDistanceLimits: Record<string, { sprinklered: number; unsprinklered: number }> = {
  "A-1": { sprinklered: 60, unsprinklered: 40 },
  "A-2": { sprinklered: 60, unsprinklered: 40 },
  "A-3": { sprinklered: 60, unsprinklered: 40 },
  "A-4": { sprinklered: 60, unsprinklered: 40 },
  "B-1": { sprinklered: 45, unsprinklered: 30 },
  "B-2": { sprinklered: 45, unsprinklered: 30 },
  "B-3": { sprinklered: 45, unsprinklered: 30 },
  "C": { sprinklered: 45, unsprinklered: 30 },
  "D": { sprinklered: 45, unsprinklered: 30 },
  "E": { sprinklered: 45, unsprinklered: 30 },
  "F-1": { sprinklered: 45, unsprinklered: 30 },
  "F-2": { sprinklered: 45, unsprinklered: 30 },
  "F-3": { sprinklered: 45, unsprinklered: 30 }
};

const occupancyNames: Record<string, string> = {
  "A-1": "Assembly - Performing Arts",
  "A-2": "Assembly - General",
  "A-3": "Assembly - Arena Type",
  "A-4": "Assembly - Open Air",
  "B-1": "Institutional - Detention",
  "B-2": "Institutional - Treatment",
  "B-3": "Institutional - Care",
  "C": "Residential",
  "D": "Business & Personal Services",
  "E": "Mercantile",
  "F-1": "Industrial - High Hazard",
  "F-2": "Industrial - Medium Hazard",
  "F-3": "Industrial - Low Hazard"
};

export function TravelDistanceCalculator() {
  const [occupancy, setOccupancy] = useState<string>("");
  const [sprinklered, setSprinklered] = useState<string>("no");
  const [actualDistance, setActualDistance] = useState<string>("");
  const [deadEndCorridor, setDeadEndCorridor] = useState<string>("no");

  const calculateCompliance = (): {
    maxAllowed: number;
    actual: number;
    compliant: boolean;
    margin: number;
    deadEndLimit: number;
  } => {
    if (!occupancy || !actualDistance) {
      return { maxAllowed: 0, actual: 0, compliant: false, margin: 0, deadEndLimit: 0 };
    }

    const limits = travelDistanceLimits[occupancy];
    const maxAllowed = sprinklered === "yes" ? limits.sprinklered : limits.unsprinklered;
    const actual = parseFloat(actualDistance);
    const compliant = actual <= maxAllowed;
    const margin = maxAllowed - actual;
    const deadEndLimit = sprinklered === "yes" ? 9 : 6;

    return { maxAllowed, actual, compliant, margin, deadEndLimit };
  };

  const result = calculateCompliance();
  const maxAllowedFeet = result.maxAllowed * 3.281;
  const actualFeet = result.actual * 3.281;

  return (
    <CalculatorCard
      subtitle="Life Safety Calculations"
      title="Travel Distance Calculator"
      description="Verify maximum travel distance to exits per NBC Part 3.4.2.5"
    >
      {/* INPUT SECTION */}
      <CalculatorSection title="Job">
        <CalculatorInputRow label="Occupancy Classification">
          <Select value={occupancy} onValueChange={setOccupancy}>
            <SelectTrigger className="w-48 h-8 text-accent font-semibold">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(occupancyNames).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {code} - {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CalculatorInputRow>

        <CalculatorInputRow label="Sprinkler Protection">
          <Select value={sprinklered} onValueChange={setSprinklered}>
            <SelectTrigger className="w-48 h-8 text-accent font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Not Sprinklered</SelectItem>
              <SelectItem value="yes">Fully Sprinklered</SelectItem>
            </SelectContent>
          </Select>
        </CalculatorInputRow>

        <CalculatorInputRow label="Actual Travel Distance">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={actualDistance}
              onChange={(e) => setActualDistance(e.target.value)}
              placeholder="35"
              className="w-20 h-8 px-2 text-right text-accent font-semibold bg-transparent border-b border-border focus:border-accent focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        </CalculatorInputRow>

        <CalculatorInputRow label="Dead-End Corridor">
          <Select value={deadEndCorridor} onValueChange={setDeadEndCorridor}>
            <SelectTrigger className="w-32 h-8 text-accent font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </CalculatorInputRow>
      </CalculatorSection>

      {/* LIMITS SECTION */}
      {occupancy && (
        <CalculatorSection title="Limits">
          <CalculatorRow 
            label="Maximum Allowed" 
            value={result.maxAllowed} 
            unit="m" 
            highlight 
          />
          <CalculatorRow 
            label="Maximum (Imperial)" 
            value={maxAllowedFeet.toFixed(0)} 
            unit="ft" 
          />
          {deadEndCorridor === "yes" && (
            <CalculatorRow 
              label="Dead-End Limit" 
              value={result.deadEndLimit} 
              unit="m" 
            />
          )}
        </CalculatorSection>
      )}

      {/* RESULT SECTION */}
      {result.maxAllowed > 0 && result.actual > 0 && (
        <>
          <CalculatorSection title="Result">
            <CalculatorResult 
              label="Compliance Status" 
              value={result.compliant ? "COMPLIANT" : "NON-COMPLIANT"}
              status={result.compliant ? "compliant" : "non-compliant"}
            />
            <CalculatorRow 
              label="Actual Distance" 
              value={`${result.actual.toFixed(1)} m (${actualFeet.toFixed(0)} ft)`}
            />
            <CalculatorRow 
              label={result.compliant ? "Safety Margin" : "Excess Distance"} 
              value={`${Math.abs(result.margin).toFixed(1)} m`}
              highlight={!result.compliant}
            />
          </CalculatorSection>

          {/* Compliance Implications */}
          <CalculatorSection title="Implications">
            <div className="px-4 py-3 space-y-2">
              {result.compliant ? (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>Travel distance meets code requirements</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <XCircle className="w-4 h-4" />
                    <span>Exceeds maximum - redesign required</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>Options: Add exit, add sprinklers, or reconfigure layout</span>
                  </div>
                </>
              )}
              {deadEndCorridor === "yes" && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span>Dead-end corridor must not exceed {result.deadEndLimit}m</span>
                </div>
              )}
            </div>
          </CalculatorSection>
        </>
      )}

      {/* NOTES SECTION */}
      <CalculatorNotes>
        <p>Travel distance is measured from the most remote point to the nearest exit, following the natural path of travel. Sprinkler systems allow increased travel distances. Dead-end corridors have separate, more restrictive limits.</p>
      </CalculatorNotes>

      {/* 5 C's COMPONENTS */}
      <div className="p-4 space-y-4 border-t border-border">
        {/* COMPLIANCE */}
        <CodeReference 
          code="NBC 3.4.2.5"
          title="Maximum Travel Distance"
          description="Travel distance limits based on occupancy and sprinkler protection"
        />

        {/* CLARIFICATION */}
        <WhyImportant
          reason="Travel distance limits ensure occupants can reach an exit before conditions become untenable during a fire. Longer distances mean more time exposed to smoke and heat."
          consequences="Excessive travel distances can trap occupants, leading to injuries or fatalities during emergencies."
          example="In a 1980 MGM Grand fire, long travel distances contributed to 85 deaths. Modern codes limit distances to prevent similar tragedies."
        />

        <ClarificationPanel title="How to measure travel distance">
          <p><strong>Start point:</strong> The most remote point in the floor area where someone could be located.</p>
          <p className="mt-2"><strong>End point:</strong> The nearest exit door leading to an exit stair, exterior, or protected exit passageway.</p>
          <p className="mt-2"><strong>Path:</strong> Follow the natural walking path - around furniture, through doors, along corridors. Not a straight line through walls.</p>
        </ClarificationPanel>

        {/* CULTURE - Regional Notes */}
        <RegionalNote 
          region="Alberta" 
          note="Alberta Building Code follows NBC travel distance limits. Edmonton and Calgary may have additional requirements for high-rise buildings and assembly venues over 500 occupants."
        />

        {/* CONNECTION */}
        <RelatedRequirements
          title="Related Exit Requirements"
          requirements={[
            { title: "Number of Exits", codeRef: "NBC 3.4.2.1", description: "Travel distance affects exit quantity" },
            { title: "Dead-End Corridors", codeRef: "NBC 3.4.2.4", description: "Max 6m (9m sprinklered)" },
            { title: "Exit Signs", codeRef: "NBC 3.4.5", description: "Required along egress path" },
            { title: "Emergency Lighting", codeRef: "NBC 3.2.7", description: "Illumination of exit path" }
          ]}
        />

        {/* CHECKBACK */}
        {result.maxAllowed > 0 && (
          <DidYouConsider
            items={[
              "Is the measurement from the most remote point?",
              "Does the path follow actual walking routes?",
              "Are there any dead-end corridors to check separately?",
              "Would adding sprinklers allow the current layout?",
              "Have you considered all floor levels?"
            ]}
          />
        )}
      </div>

      {/* Export + Save Buttons */}
      {result.maxAllowed > 0 && (
        <div className="flex justify-end gap-2 p-4 border-t border-border bg-muted/20">
          <SaveButton
            calculatorType="travelDistance"
            inputs={{ occupancy, sprinklered, actualDistance, deadEndCorridor }}
            results={{ maxAllowed: result.maxAllowed, actual: result.actual, compliant: result.compliant, margin: result.margin, deadEndLimit: result.deadEndLimit }}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => exportTravelDistanceToExcel({
              occupancyType: `${occupancy} - ${occupancyNames[occupancy]}`,
              hasSprinkers: sprinklered === "yes",
              maxTravelDistance: result.maxAllowed,
              distanceUnit: "m",
              deadEndLimit: result.deadEndLimit,
              nbcReference: "NBC 3.4.2.5"
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
