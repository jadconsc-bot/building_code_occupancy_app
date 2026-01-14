import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Route, CheckCircle, XCircle } from "lucide-react";

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
    
    // Dead-end corridor limit (NBC 3.4.2.4) - typically 6m unsprinklered, 9m sprinklered
    const deadEndLimit = sprinklered === "yes" ? 9 : 6;

    return { maxAllowed, actual, compliant, margin, deadEndLimit };
  };

  const result = calculateCompliance();
  const maxAllowedFeet = result.maxAllowed * 3.281; // Convert meters to feet
  const actualFeet = result.actual * 3.281;
  const marginFeet = result.margin * 3.281;

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Route className="w-4 h-4 text-primary" /> Travel Distance Calculator
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Verify maximum travel distance to exits (NBC Part 3.4.2.5)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="occupancy" className="text-xs font-medium">
                Occupancy Classification
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

            <div className="space-y-2">
              <Label htmlFor="actualDistance" className="text-xs font-medium">
                Actual Travel Distance (meters)
              </Label>
              <Input
                id="actualDistance"
                type="number"
                value={actualDistance}
                onChange={(e) => setActualDistance(e.target.value)}
                placeholder="e.g., 35"
                className="rounded-none"
                min="0"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">
                Measure from most remote point to nearest exit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadEndCorridor" className="text-xs font-medium">
                Dead-End Corridor Present?
              </Label>
              <Select value={deadEndCorridor} onValueChange={setDeadEndCorridor}>
                <SelectTrigger id="deadEndCorridor" className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result Display */}
          {result.maxAllowed > 0 && (
            <>
              <div className={`p-6 border-l-4 ${
                result.compliant 
                  ? "border-green-500 bg-green-500/5" 
                  : "border-destructive bg-destructive/5"
              }`}>
                <div className="flex items-start gap-3">
                  {result.compliant ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-3">
                      {result.compliant ? "Compliant" : "Non-Compliant"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Maximum Allowed</p>
                        <p className="text-3xl font-bold text-primary">{result.maxAllowed} m</p>
                        <p className="text-sm text-muted-foreground mt-1">({maxAllowedFeet.toFixed(0)} ft)</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Actual Distance</p>
                        <p className={`text-3xl font-bold ${result.compliant ? "text-green-500" : "text-destructive"}`}>
                          {result.actual.toFixed(1)} m
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">({actualFeet.toFixed(0)} ft)</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {result.compliant ? "Margin" : "Excess"}
                        </p>
                        <p className={`text-3xl font-bold ${result.compliant ? "text-green-500" : "text-destructive"}`}>
                          {Math.abs(result.margin).toFixed(1)} m
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">({Math.abs(marginFeet).toFixed(0)} ft)</p>
                      </div>
                    </div>
                    {!result.compliant && (
                      <Badge variant="destructive" className="mt-4">
                        Exceeds maximum travel distance - redesign required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Dead-End Corridor Check */}
              {deadEndCorridor === "yes" && (
                <div className="p-4 bg-orange-500/10 border-l-4 border-orange-500">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-2">
                    Dead-End Corridor Limit
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Maximum dead-end corridor length: <strong>{result.deadEndLimit} m ({(result.deadEndLimit * 3.281).toFixed(0)} ft)</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dead-end corridors must not exceed this length (NBC 3.4.2.4)
                  </p>
                </div>
              )}

              {/* Code Reference */}
              <div className="p-4 bg-muted/30 border border-border rounded-none">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                  Code Requirement
                </h4>
                <p className="text-xs text-muted-foreground">
                  <strong>Occupancy {occupancy}:</strong> Maximum travel distance is {result.maxAllowed} meters 
                  ({sprinklered === "yes" ? "with" : "without"} sprinklers)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Travel distance is measured along the path of egress travel from the most remote point 
                  in a floor area to an exit, measured in a straight line or along the centerline of the 
                  natural path of travel.
                </p>
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
                <span>Travel distance is measured from most remote point to nearest exit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Measurement follows the natural path of travel (not through walls or obstructions)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Sprinkler systems allow increased travel distances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Dead-end corridors have separate, more restrictive limits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Assembly occupancies (A) generally allow longer travel distances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>High buildings and special occupancies may have additional requirements</span>
              </li>
            </ul>
          </div>

          {/* Reference */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Reference:</strong> National Building Code of Canada 2025, Part 3.4.2.5 - Maximum Travel Distance to Exits,
              Part 3.4.2.4 - Dead-End Corridors
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
