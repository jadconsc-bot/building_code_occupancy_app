import { useState } from "react";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CategoryCard } from "@/components/ui/category-card";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { useCalculationHistory } from "@/contexts/CalculationHistoryContext";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useEffect } from "react";

export function StairDesignCalculator() {
  const [stairType, setStairType] = useState<string>("private-residential");
  const [totalRise, setTotalRise] = useState<string>("");
  const [results, setResults] = useState<any>(null);
  const { addToHistory } = useCalculationHistory();

  const calculateStairs = () => {
    const rise = parseFloat(totalRise);
    if (isNaN(rise) || rise <= 0) return;

    // NBC 3.4.6 requirements for different stair types
    let requirements;
    let stairDescription;
    let minWidth;
    
    switch (stairType) {
      case "private-residential":
        // Private stairs within dwelling units (NBC 3.4.6.4)
        requirements = { minTread: 235, maxRiser: 200, minRiser: 125, minHeadroom: 1950 };
        stairDescription = "Private Residential (within dwelling unit)";
        minWidth = 860; // mm
        break;
      case "exit-group-c":
        // Exit stairs serving Group C occupancies (NBC 3.4.6.4)
        requirements = { minTread: 280, maxRiser: 180, minRiser: 125, minHeadroom: 2050 };
        stairDescription = "Exit Stair - Group C (residential common areas)";
        minWidth = 1100; // mm minimum for exit stairs
        break;
      case "exit-public":
        // Exit stairs serving other occupancies (NBC 3.4.6.4)
        requirements = { minTread: 280, maxRiser: 180, minRiser: 125, minHeadroom: 2050 };
        stairDescription = "Exit Stair - Public/Commercial/Assembly";
        minWidth = 1100; // mm minimum for exit stairs
        break;
      default:
        requirements = { minTread: 280, maxRiser: 180, minRiser: 125, minHeadroom: 2050 };
        stairDescription = "Commercial/Assembly";
        minWidth = 1100;
    }

    // Calculate number of risers (round up)
    const numRisers = Math.ceil(rise / requirements.maxRiser);
    
    // Calculate actual riser height
    const actualRiser = rise / numRisers;
    
    // Number of treads is one less than risers
    const numTreads = numRisers - 1;
    
    // Calculate total run
    const totalRun = numTreads * requirements.minTread;
    
    // Handrail height (NBC 3.4.6.5)
    const handrailHeight = stairType === "private-residential" ? "865-965mm" : "865-920mm";
    
    // Guard height (NBC 3.3.4.7)
    const guardHeight = stairType === "private-residential" ? 900 : 1070; // mm

    // Check compliance
    const compliant = actualRiser >= requirements.minRiser && actualRiser <= requirements.maxRiser;

    const calculationResults = {
      numRisers,
      actualRiser: actualRiser.toFixed(1),
      numTreads,
      treadDepth: requirements.minTread,
      totalRun: totalRun.toFixed(0),
      headroom: requirements.minHeadroom,
      handrailHeight,
      guardHeight,
      minWidth,
      stairDescription,
      compliant,
      requirements
    };

    setResults(calculationResults);

    // Add to history
    addToHistory({
      calculatorType: "stair_design",
      inputs: { stairType, totalRise },
      results: calculationResults,
      preview: `${stairDescription} - ${totalRise}mm rise → ${numRisers} risers`
    });
  };

  const getExportData = () => {
    if (!results) return { filename: "", sheetName: "", data: [] };
    
    return {
      filename: `Stair_Design_${new Date().toISOString().split('T')[0]}`,
      sheetName: "Stair Design",
      data: [
        ["Parameter", "Value"],
        ["Stair Type", results.stairDescription],
        ["Total Rise", `${totalRise} mm`],
        ["Number of Risers", results.numRisers],
        ["Riser Height", `${results.actualRiser} mm`],
        ["Number of Treads", results.numTreads],
        ["Tread Depth", `${results.treadDepth} mm`],
        ["Total Run", `${results.totalRun} mm`],
        ["Min Headroom", `${results.headroom} mm`],
        ["Handrail Height", results.handrailHeight],
        ["Guard Height", `${results.guardHeight} mm`],
        ["Min Width", `${results.minWidth} mm`],
        ["Code Compliant", results.compliant ? "Yes" : "No"],
        ["", ""],
        ["NBC Reference", "3.4.6.4 - Risers and Treads"],
        ["Max Riser", `${results.requirements.maxRiser} mm`],
        ["Min Tread", `${results.requirements.minTread} mm`],
      ],
    };
  };

  const handleLoadPreset = (data: any) => {
    setStairType(data.stairType);
    setTotalRise(data.totalRise);
  };

  const handleLoadHistory = (item: any) => {
    setStairType(item.inputs.stairType);
    setTotalRise(item.inputs.totalRise);
    setResults(item.results);
  };

  return (
    <CategoryCard calculatorId="stair_design" className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" /> Stair Design Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 3.4.6 - Calculate stair dimensions and verify code compliance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <HistoryPanel
              calculatorType="stair_design"
              onLoadHistory={handleLoadHistory}
            />
            <CalculatorActions
              calculatorId="stair_design"
              calculatorName="Stair Design"
              exportData={getExportData}
              currentState={{ stairType, totalRise }}
              onLoadPreset={handleLoadPreset}
              hasResults={!!results}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stair-type" className="text-sm font-medium">
              Stair Type <span className="text-destructive">*</span>
            </Label>
            <Select value={stairType} onValueChange={setStairType}>
              <SelectTrigger id="stair-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private-residential">Private Residential (within dwelling unit)</SelectItem>
                <SelectItem value="exit-group-c">Exit Stair - Group C (residential common areas)</SelectItem>
                <SelectItem value="exit-public">Exit Stair - Public/Commercial/Assembly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <NumericInput
              id="total-rise"
              label="Total Rise"
              placeholder="e.g., 2700"
              value={totalRise}
              onChange={(e) => setTotalRise(e.target.value)}
              min="1000"
              max="10000"
              unit="mm"
              showValidation={true}
            />
          </div>
        </div>

        <Button 
          onClick={calculateStairs} 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!totalRise}
        >
          Calculate Stair Dimensions
        </Button>

        {results && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              {results.compliant ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              <span className="font-bold text-sm">
                {results.compliant ? "Code Compliant" : "Non-Compliant - Adjust Design"}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Number of Risers</p>
                <p className="text-lg font-bold text-primary">{results.numRisers}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Riser Height</p>
                <p className="text-lg font-bold text-primary">{results.actualRiser} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Number of Treads</p>
                <p className="text-lg font-bold text-primary">{results.numTreads}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Tread Depth (min)</p>
                <p className="text-lg font-bold text-primary">{results.treadDepth} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Total Run</p>
                <p className="text-lg font-bold text-primary">{results.totalRun} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Min Headroom</p>
                <p className="text-lg font-bold text-primary">{results.headroom} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Min Width</p>
                <p className="text-lg font-bold text-primary">{results.minWidth} mm</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Guard Height</p>
                <p className="text-lg font-bold text-primary">{results.guardHeight} mm</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded">
              <p className="text-xs font-bold text-green-900 dark:text-green-100 mb-2">Stair Classification</p>
              <p className="text-sm text-green-800 dark:text-green-200">{results.stairDescription}</p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">Handrail Requirements (NBC 3.4.6.5)</p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Height: {results.handrailHeight}</li>
                <li>• Clearance: 50mm min from wall</li>
                <li>• Graspable diameter: 30-43mm</li>
                <li>• Required: Both sides if width &gt; 1100mm</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>NBC Reference:</strong> 3.4.6.4 - Risers and Treads</p>
              <p><strong>Max Riser:</strong> {results.requirements.maxRiser}mm</p>
              <p><strong>Min Tread:</strong> {results.requirements.minTread}mm</p>
              <p><strong>Tolerance:</strong> ±5mm between consecutive risers/treads</p>
            </div>
          </div>
        )}
      </CardContent>
    </CategoryCard>
  );
}
