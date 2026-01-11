import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Thermometer, AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";

interface Layer {
  id: string;
  material: string;
  thickness: number;
  rValue: number;
}

export function ThermalResistanceCalculator() {
  const [climateZone, setClimateZone] = useState<string>("7A");
  const [assemblyType, setAssemblyType] = useState<string>("wall");
  const [layers, setLayers] = useState<Layer[]>([
    { id: "1", material: "Gypsum Board (12.7mm)", thickness: 12.7, rValue: 0.08 }
  ]);
  const [results, setResults] = useState<any>(null);

  // Common material R-values per mm (NBC 5.3)
  const materialRValues: Record<string, number> = {
    "Gypsum Board (12.7mm)": 0.08,
    "OSB Sheathing (11mm)": 0.14,
    "Fiberglass Batt (per 25mm)": 0.55,
    "Mineral Wool (per 25mm)": 0.60,
    "Spray Foam (closed cell, per 25mm)": 1.0,
    "Spray Foam (open cell, per 25mm)": 0.60,
    "XPS Foam (per 25mm)": 0.88,
    "EPS Foam (per 25mm)": 0.70,
    "Polyiso Foam (per 25mm)": 1.05,
    "Concrete (per 100mm)": 0.08,
    "Wood Siding (19mm)": 0.14,
    "Brick Veneer (90mm)": 0.08,
    "Air Space (20-90mm)": 0.17
  };

  // NBC 5.3 minimum requirements (RSI values)
  const minimumRequirements: Record<string, Record<string, number>> = {
    "7A": { wall: 3.34, roof: 5.46, floor: 4.67 },
    "7B": { wall: 3.52, roof: 5.81, floor: 4.93 },
    "8": { wall: 3.87, roof: 6.69, floor: 5.46 }
  };

  const addLayer = () => {
    const newId = (layers.length + 1).toString();
    setLayers([...layers, { id: newId, material: "Fiberglass Batt (per 25mm)", thickness: 140, rValue: 3.08 }]);
  };

  const removeLayer = (id: string) => {
    setLayers(layers.filter(layer => layer.id !== id));
  };

  const updateLayer = (id: string, field: string, value: any) => {
    setLayers(layers.map(layer => {
      if (layer.id === id) {
        if (field === "material") {
          const baseRValue = materialRValues[value] || 0;
          return { ...layer, material: value, rValue: baseRValue };
        } else if (field === "thickness") {
          const thickness = parseFloat(value) || 0;
          const materialName = layer.material;
          let rValue = 0;
          
          if (materialName.includes("per 25mm")) {
            rValue = (thickness / 25) * materialRValues[materialName];
          } else if (materialName.includes("per 100mm")) {
            rValue = (thickness / 100) * materialRValues[materialName];
          } else {
            rValue = materialRValues[materialName] || 0;
          }
          
          return { ...layer, thickness, rValue };
        }
      }
      return layer;
    }));
  };

  const calculateThermalResistance = () => {
    // Sum all layer R-values
    const totalRSI = layers.reduce((sum, layer) => sum + layer.rValue, 0);
    
    // Add surface resistances (NBC 5.3.1.2)
    const interiorSurfaceR = 0.12; // RSI
    const exteriorSurfaceR = 0.03; // RSI
    const effectiveRSI = totalRSI + interiorSurfaceR + exteriorSurfaceR;

    // Apply thermal bridging factor (typically 0.75-0.85 for wood framing)
    const thermalBridgingFactor = 0.80;
    const effectiveRSIWithBridging = effectiveRSI * thermalBridgingFactor;

    // Get minimum requirement
    const minRequired = minimumRequirements[climateZone][assemblyType];
    const compliant = effectiveRSIWithBridging >= minRequired;
    const margin = effectiveRSIWithBridging - minRequired;

    // Convert to R-value (imperial)
    const rValueImperial = effectiveRSIWithBridging * 5.678;

    setResults({
      totalRSI: totalRSI.toFixed(2),
      effectiveRSI: effectiveRSI.toFixed(2),
      effectiveRSIWithBridging: effectiveRSIWithBridging.toFixed(2),
      rValueImperial: rValueImperial.toFixed(1),
      minRequired: minRequired.toFixed(2),
      compliant,
      margin: margin.toFixed(2),
      thermalBridgingFactor: (thermalBridgingFactor * 100).toFixed(0)
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-primary" /> Thermal Resistance (RSI) Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NBC 5.3 - Calculate effective thermal resistance for building assemblies
            </CardDescription>
          </div>
          <CalculatorActions
            calculatorId="thermal_resistance"
            calculatorName="Thermal Resistance"
            exportData={() => ({
              filename: `Thermal_Resistance_${new Date().toISOString().split('T')[0]}`,
              sheetName: "Thermal Resistance",
              data: results ? [
                ["Parameter", "Value"],
                ["Climate Zone", climateZone],
                ["Assembly Type", assemblyType],
                ["", ""],
                ["Layer Details", ""],
                ...layers.map((layer, idx) => [`Layer ${idx + 1}`, `${layer.material} - ${layer.thickness}mm - RSI ${layer.rValue.toFixed(2)}`]),
                ["", ""],
                ["Total RSI (Nominal)", results.totalRSI],
                ["Effective RSI", results.effectiveRSI],
                ["Minimum Required", results.minRequired],
                ["Compliant", results.compliant ? "Yes" : "No"],
                ["Margin", `${results.margin} RSI`],
                ["", ""],
                ["NBC Reference", "5.3 - Thermal Insulation"],
              ] : []
            })}
            currentState={{ climateZone, assemblyType, layers }}
            onLoadPreset={(data) => {
              setClimateZone(data.climateZone);
              setAssemblyType(data.assemblyType);
              setLayers(data.layers);
            }}
            hasResults={!!results}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="climate-zone" className="text-sm font-medium">
              Climate Zone (Alberta) <span className="text-destructive">*</span>
            </Label>
            <Select value={climateZone} onValueChange={setClimateZone}>
              <SelectTrigger id="climate-zone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7A">Zone 7A (Calgary, Lethbridge)</SelectItem>
                <SelectItem value="7B">Zone 7B (Edmonton, Red Deer)</SelectItem>
                <SelectItem value="8">Zone 8 (Fort McMurray, Grande Prairie)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assembly-type" className="text-sm font-medium">
              Assembly Type <span className="text-destructive">*</span>
            </Label>
            <Select value={assemblyType} onValueChange={setAssemblyType}>
              <SelectTrigger id="assembly-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wall">Above-Grade Wall</SelectItem>
                <SelectItem value="roof">Ceiling/Roof</SelectItem>
                <SelectItem value="floor">Exposed Floor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Assembly Layers (Inside to Outside)</Label>
            <Button onClick={addLayer} size="sm" variant="outline" className="h-8">
              <Plus className="w-3 h-3 mr-1" /> Add Layer
            </Button>
          </div>

          {layers.map((layer, index) => (
            <div key={layer.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/30 rounded border border-border">
              <div className="col-span-6 space-y-1">
                <Label className="text-xs">Material</Label>
                <Select value={layer.material} onValueChange={(val) => updateLayer(layer.id, "material", val)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(materialRValues).map(mat => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Thickness (mm)</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={layer.thickness}
                  onChange={(e) => updateLayer(layer.id, "thickness", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">RSI</Label>
                <div className="h-9 flex items-center justify-center bg-primary/10 rounded px-2 font-bold text-sm text-primary">
                  {layer.rValue.toFixed(2)}
                </div>
              </div>
              <div className="col-span-1 flex items-end">
                <Button
                  onClick={() => removeLayer(layer.id)}
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={layers.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={calculateThermalResistance} 
          className="w-full bg-primary hover:bg-primary/90"
        >
          Calculate Thermal Resistance
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
                {results.compliant 
                  ? `Exceeds Minimum by ${results.margin} RSI` 
                  : `Below Minimum by ${Math.abs(parseFloat(results.margin)).toFixed(2)} RSI`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 border-2 border-primary rounded">
                <p className="text-xs text-muted-foreground mb-1">Effective RSI (with bridging)</p>
                <p className="text-3xl font-bold text-primary">{results.effectiveRSIWithBridging}</p>
                <p className="text-xs text-muted-foreground mt-1">R-{results.rValueImperial} (imperial)</p>
              </div>
              <div className="p-4 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Minimum Required</p>
                <p className="text-3xl font-bold text-primary">{results.minRequired}</p>
                <p className="text-xs text-muted-foreground mt-1">NBC 5.3 for Zone {climateZone}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Nominal RSI</p>
                <p className="text-lg font-bold text-primary">{results.totalRSI}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">With Surfaces</p>
                <p className="text-lg font-bold text-primary">{results.effectiveRSI}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded border border-border">
                <p className="text-xs text-muted-foreground mb-1">Bridging Factor</p>
                <p className="text-lg font-bold text-primary">{results.thermalBridgingFactor}%</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2">Thermal Bridging (NBC 5.3.1.2)</p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Wood framing creates thermal bridges that reduce effective insulation. This calculator applies an 80% factor for typical 16" o.c. framing. Steel framing requires lower factors (60-70%).
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p><strong>NBC Reference:</strong> 5.3.1.1 - Minimum Thermal Resistance</p>
              <p><strong>Surface Resistances:</strong> Interior 0.12 RSI, Exterior 0.03 RSI</p>
              <p><strong>Note:</strong> Continuous insulation can improve effective RSI by reducing thermal bridging</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
