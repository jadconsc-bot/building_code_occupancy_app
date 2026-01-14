import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Flame, AlertTriangle } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { useCalculationHistory } from "@/contexts/CalculationHistoryContext";
import { HistoryPanel } from "@/components/HistoryPanel";

// NBC Table 3.1.3.1 - Fire Separation Requirements
const fireSeparationData: Record<string, Record<string, string>> = {
  "A-1": {
    "A-1": "No separation required",
    "A-2": "No separation required",
    "A-3": "No separation required",
    "A-4": "No separation required",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "A-2": {
    "A-1": "No separation required",
    "A-2": "No separation required",
    "A-3": "No separation required",
    "A-4": "No separation required",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "B-1": {
    "A-1": "2 hours",
    "A-2": "2 hours",
    "B-1": "No separation required",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "2 hours",
    "D": "2 hours",
    "E": "2 hours",
    "F-1": "2 hours",
    "F-2": "2 hours",
    "F-3": "2 hours"
  },
  "B-2": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "1 hour",
    "B-2": "No separation required",
    "B-3": "No separation required",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "B-3": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "1 hour",
    "B-2": "No separation required",
    "B-3": "No separation required",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "C": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "No separation required",
    "D": "No separation required",
    "E": "No separation required",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "No separation required"
  },
  "D": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "No separation required",
    "D": "No separation required",
    "E": "No separation required",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "No separation required"
  },
  "E": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "No separation required",
    "D": "No separation required",
    "E": "No separation required",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "No separation required"
  },
  "F-1": {
    "A-1": "2 hours",
    "A-2": "2 hours",
    "B-1": "2 hours",
    "B-2": "2 hours",
    "B-3": "2 hours",
    "C": "2 hours",
    "D": "2 hours",
    "E": "2 hours",
    "F-1": "No separation required",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "F-2": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "1 hour",
    "F-2": "No separation required",
    "F-3": "No separation required"
  },
  "F-3": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "No separation required",
    "D": "No separation required",
    "E": "No separation required",
    "F-1": "1 hour",
    "F-2": "No separation required",
    "F-3": "No separation required"
  }
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

export function FireSeparationCalculator() {
  const [occupancy1, setOccupancy1] = useState<string>("");
  const [occupancy2, setOccupancy2] = useState<string>("");
  const [sprinklered, setSprinklered] = useState<string>("no");
  const [results, setResults] = useState<any>(null);
  const { addToHistory } = useCalculationHistory();

  const calculateSeparation = (): { rating: string; description: string; severity: "low" | "medium" | "high" } => {
    if (!occupancy1 || !occupancy2) {
      return { rating: "Select occupancies", description: "", severity: "low" };
    }

    let baseRating = fireSeparationData[occupancy1]?.[occupancy2] || "Not defined";
    
    // Sprinkler reduction (NBC allows reduction in some cases)
    if (sprinklered === "yes" && baseRating.includes("hour") && !baseRating.includes("2 hours")) {
      const description = `${baseRating} (may be reduced to 45 minutes with sprinklers - verify NBC 3.2.3.7)`;
      return { rating: baseRating, description, severity: "medium" };
    }

    const severity = baseRating === "2 hours" ? "high" : baseRating === "1 hour" ? "medium" : "low";
    
    return { 
      rating: baseRating, 
      description: baseRating === "No separation required" ? "Occupancies are compatible" : "",
      severity 
    };
  };

  const result = calculateSeparation();

  // Auto-save results when calculation is performed
  useEffect(() => {
    if (result && occupancy1 && occupancy2 && result.rating !== "Select occupancies") {
      setResults(result);
      addToHistory({
        calculatorType: "fire_separation",
        inputs: { occupancy1, occupancy2, sprinklered },
        results: result,
        preview: `Fire Separation: ${occupancyNames[occupancy1]} to ${occupancyNames[occupancy2]} - ${result.rating}`
      });
    }
  }, [occupancy1, occupancy2, sprinklered]);

  // Export function
  const getExportData = () => {
    if (!results) return { filename: "", sheetName: "", data: [] };
    
    const data = [
      ["Parameter", "Value"],
      ["Occupancy 1", `${occupancy1} - ${occupancyNames[occupancy1]}`],
      ["Occupancy 2", `${occupancy2} - ${occupancyNames[occupancy2]}`],
      ["Sprinklered", sprinklered === "yes" ? "Yes" : "No"],
      ["", ""],
      ["Results", ""],
      ["Fire Resistance Rating", results.rating],
      ["Description", results.description || "N/A"],
      ["Severity", results.severity],
      ["", ""],
      ["Code Reference", "NBC Table 3.1.3.1 - Fire Separation Requirements"],
    ];
    
    return {
      filename: `Fire_Separation_${new Date().toISOString().split('T')[0]}`,
      sheetName: "Fire Separation",
      data,
    };
  };

  // Load handlers
  const handleLoadPreset = (data: any) => {
    setOccupancy1(data.occupancy1);
    setOccupancy2(data.occupancy2);
    setSprinklered(data.sprinklered);
  };

  const handleLoadHistory = (item: any) => {
    setOccupancy1(item.inputs.occupancy1);
    setOccupancy2(item.inputs.occupancy2);
    setSprinklered(item.inputs.sprinklered);
    setResults(item.results);
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-destructive" /> Fire Separation Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Determine required fire resistance rating between occupancies (NBC Part 3.2.3)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <HistoryPanel
              calculatorType="fire_separation"
              onLoadHistory={handleLoadHistory}
            />
            <CalculatorActions
              calculatorId="fire_separation"
              calculatorName="Fire Separation"
              exportData={getExportData}
              currentState={{ occupancy1, occupancy2, sprinklered }}
              onLoadPreset={handleLoadPreset}
              hasResults={!!results}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupancy1" className="text-xs font-medium">
                First Occupancy
              </Label>
              <Select value={occupancy1} onValueChange={setOccupancy1}>
                <SelectTrigger id="occupancy1" className="rounded-none">
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
              <Label htmlFor="occupancy2" className="text-xs font-medium">
                Adjacent Occupancy
              </Label>
              <Select value={occupancy2} onValueChange={setOccupancy2}>
                <SelectTrigger id="occupancy2" className="rounded-none">
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

          {/* Result Display */}
          {occupancy1 && occupancy2 && (
            <div className={`p-6 border-l-4 ${
              result.severity === "high" ? "border-destructive bg-destructive/5" :
              result.severity === "medium" ? "border-orange-500 bg-orange-500/5" :
              "border-green-500 bg-green-500/5"
            }`}>
              <div className="flex items-start gap-3">
                {result.severity !== "low" && (
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    result.severity === "high" ? "text-destructive" : "text-orange-500"
                  }`} />
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
                    Required Fire Separation
                  </h4>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-primary">{result.rating}</span>
                    {result.rating.includes("hour") && (
                      <Badge variant={result.severity === "high" ? "destructive" : "secondary"}>
                        Fire Resistance Rating
                      </Badge>
                    )}
                  </div>
                  {result.description && (
                    <p className="text-xs text-muted-foreground mt-2">{result.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Important Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Important Notes
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Fire separations must extend from floor to underside of floor or roof above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Openings in fire separations require fire-rated closures (doors, dampers)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Sprinkler systems may allow reductions per NBC 3.2.3.7</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Verify specific requirements with NBC Table 3.1.3.1 and local amendments</span>
              </li>
            </ul>
          </div>

          {/* Reference */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Reference:</strong> National Building Code of Canada 2025, Part 3.2.3 - Fire Separations,
              Table 3.1.3.1 - Major Occupancy Classifications
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
