import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, AlertCircle, CheckCircle2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";

export function FoundationDesignCalculator() {
  const [soilType, setSoilType] = useState<string>("medium");
  const [wallLoad, setWallLoad] = useState<string>("");
  const [wallLength, setWallLength] = useState<string>("");
  const [region, setRegion] = useState<string>("calgary");
  const [foundationType, setFoundationType] = useState<string>("strip");
  const [results, setResults] = useState<any>(null);

  const calculateFoundation = () => {
    const load = parseFloat(wallLoad);
    const length = parseFloat(wallLength);

    if (isNaN(load) || isNaN(length) || load <= 0 || length <= 0) {
      setResults(null);
      return;
    }

    // Soil bearing capacities (kPa) - NBC 9.15.3.2
    const soilCapacities: Record<string, number> = {
      rock: 500,
      gravel: 200,
      medium: 100, // Sand, silt
      clay: 75,
      soft: 50
    };

    const bearingCapacity = soilCapacities[soilType] || 100;

    // Frost depth by region (mm) - NBC 9.12.2.1
    const frostDepths: Record<string, number> = {
      calgary: 1800,
      edmonton: 1800,
      red_deer: 1800,
      lethbridge: 1500,
      fort_mcmurray: 2100
    };

    const frostDepth = frostDepths[region] || 1800;

    // Calculate required footing width
    const totalLoad = load; // kN
    const linearLoad = totalLoad / length; // kN/m
    const requiredArea = (linearLoad / bearingCapacity) * 1000; // m² per meter of wall
    const footingWidth = Math.ceil(requiredArea / 100) * 100; // Round up to nearest 100mm

    // Minimum footing dimensions - NBC 9.15.4.2
    const minWidth = foundationType === "strip" ? 400 : 600;
    const minThickness = 150;
    const actualWidth = Math.max(footingWidth, minWidth);
    const footingThickness = Math.max(Math.ceil(actualWidth / 3), minThickness);

    // Wall thickness - NBC 9.15.3.3
    const wallThickness = actualWidth <= 600 ? 200 : 250;

    // Reinforcement requirements
    const requiresRebar = actualWidth > 600 || footingThickness > 200;
    const rebarSize = requiresRebar ? "15M" : "None";
    const rebarSpacing = requiresRebar ? 400 : 0;

    // Drainage requirements - NBC 9.14
    const drainageRequired = frostDepth > 1200;
    const drainPipeSize = 100; // mm diameter

    // Waterproofing - NBC 9.13.2
    const waterproofing = "Damp-proofing compound or membrane required";

    // Compliance check
    const compliant = actualWidth >= minWidth && 
                     footingThickness >= minThickness && 
                     frostDepth >= 1200;

    setResults({
      footingWidth: actualWidth,
      footingThickness,
      wallThickness,
      frostDepth,
      bearingCapacity,
      bearingPressure: (linearLoad / (actualWidth / 1000)).toFixed(1),
      rebarSize,
      rebarSpacing,
      drainageRequired,
      drainPipeSize,
      waterproofing,
      compliant,
      minDepth: frostDepth + 150, // Add 150mm below frost line
      concreteVolume: ((actualWidth / 1000) * (footingThickness / 1000) * length).toFixed(2)
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" /> Foundation Design Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 9.15 - Strip and spread footing design for residential construction
            </CardDescription>
          </div>
          <CalculatorActions
            calculatorId="foundation_design"
            calculatorName="Foundation Design"
            exportData={() => ({
              filename: `Foundation_Design_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Foundation",
              data: results ? [
                ["Parameter", "Value"],
                ["Soil Type", soilType],
                ["Wall Load", `${wallLoad} kN`],
                ["Wall Length", `${wallLength} m`],
                ["Region", region],
                ["Foundation Type", foundationType],
                ["", ""],
                ["RESULTS", ""],
                ["Footing Width", `${results.footingWidth} mm`],
                ["Footing Thickness", `${results.footingThickness} mm`],
                ["Wall Thickness", `${results.wallThickness} mm`],
                ["Frost Depth", `${results.frostDepth} mm`],
                ["Min Depth Below Grade", `${results.minDepth} mm`],
                ["Bearing Capacity", `${results.bearingCapacity} kPa`],
                ["Bearing Pressure", `${results.bearingPressure} kPa`],
                ["Rebar Size", results.rebarSize],
                ["Rebar Spacing", results.rebarSpacing > 0 ? `${results.rebarSpacing} mm` : "N/A"],
                ["Drainage Required", results.drainageRequired ? "Yes" : "No"],
                ["Drain Pipe Size", `${results.drainPipeSize} mm`],
                ["Waterproofing", results.waterproofing],
                ["Concrete Volume", `${results.concreteVolume} m³`],
                ["", ""],
                ["NBC Reference", "9.15 - Foundation Walls and Footings"],
              ] : []
            })}
            currentState={{ soilType, wallLoad, wallLength, region, foundationType }}
            onLoadPreset={(data) => {
              setSoilType(data.soilType);
              setWallLoad(data.wallLoad);
              setWallLength(data.wallLength);
              setRegion(data.region);
              setFoundationType(data.foundationType);
            }}
            hasResults={!!results}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="soil-type" className="text-sm font-medium">
              Soil Type <span className="text-destructive">*</span>
            </Label>
            <Select value={soilType} onValueChange={setSoilType}>
              <SelectTrigger id="soil-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rock">Rock (500 kPa)</SelectItem>
                <SelectItem value="gravel">Gravel/Coarse Sand (200 kPa)</SelectItem>
                <SelectItem value="medium">Medium Sand/Silt (100 kPa)</SelectItem>
                <SelectItem value="clay">Stiff Clay (75 kPa)</SelectItem>
                <SelectItem value="soft">Soft Clay/Silt (50 kPa)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="foundation-type" className="text-sm font-medium">
              Foundation Type <span className="text-destructive">*</span>
            </Label>
            <Select value={foundationType} onValueChange={setFoundationType}>
              <SelectTrigger id="foundation-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strip">Strip Footing (Continuous)</SelectItem>
                <SelectItem value="spread">Spread Footing (Isolated)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wall-load" className="text-sm font-medium">
              Total Wall Load (kN) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="wall-load"
              type="number"
              placeholder="e.g., 150"
              value={wallLoad}
              onChange={(e) => setWallLoad(e.target.value)}
              min="0"
              step="10"
            />
            <p className="text-xs text-muted-foreground">
              Dead load + live load + snow load
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wall-length" className="text-sm font-medium">
              Wall Length (m) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="wall-length"
              type="number"
              placeholder="e.g., 10"
              value={wallLength}
              onChange={(e) => setWallLength(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region" className="text-sm font-medium">
              Alberta Region <span className="text-destructive">*</span>
            </Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calgary">Calgary (1800mm frost)</SelectItem>
                <SelectItem value="edmonton">Edmonton (1800mm frost)</SelectItem>
                <SelectItem value="red_deer">Red Deer (1800mm frost)</SelectItem>
                <SelectItem value="lethbridge">Lethbridge (1500mm frost)</SelectItem>
                <SelectItem value="fort_mcmurray">Fort McMurray (2100mm frost)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={calculateFoundation} className="w-full" size="lg">
          Calculate Foundation Requirements
        </Button>

        {results && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              {results.compliant ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              <h3 className="font-semibold">
                {results.compliant ? "Design Compliant" : "Review Required"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Footing Width</p>
                <p className="text-lg font-bold">{results.footingWidth} mm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Footing Thickness</p>
                <p className="text-lg font-bold">{results.footingThickness} mm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wall Thickness</p>
                <p className="text-lg font-bold">{results.wallThickness} mm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Min Depth Below Grade</p>
                <p className="text-lg font-bold">{results.minDepth} mm</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bearing Pressure</p>
                <p className="text-lg font-bold">{results.bearingPressure} kPa</p>
                <p className="text-xs text-muted-foreground">
                  Capacity: {results.bearingCapacity} kPa
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concrete Volume</p>
                <p className="text-lg font-bold">{results.concreteVolume} m³</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reinforcement:</span>
                <Badge variant={results.rebarSize !== "None" ? "default" : "secondary"}>
                  {results.rebarSize}
                  {results.rebarSpacing > 0 && ` @ ${results.rebarSpacing}mm o.c.`}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Drainage:</span>
                <Badge variant={results.drainageRequired ? "default" : "secondary"}>
                  {results.drainageRequired ? `${results.drainPipeSize}mm drain required` : "Not required"}
                </Badge>
              </div>
              <div className="text-sm">
                <span className="font-medium">Waterproofing:</span>
                <p className="text-muted-foreground mt-1">{results.waterproofing}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>NBC References:</strong> 9.15.3.2 (Bearing Capacity), 9.15.4.2 (Footing Dimensions), 
                9.12.2.1 (Frost Depth), 9.14 (Drainage), 9.13.2 (Waterproofing)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
