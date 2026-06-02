import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Thermometer, AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { SaveButton } from "@/components/CalculatorWithSave";

// ─── Layer colour palette ──────────────────────────────────────────────────────
function layerColor(material: string): string {
  const m = material.toLowerCase();
  if (m.includes("gypsum") || m.includes("drywall") || m.includes("gwb")) return "#e2e8f0";
  if (m.includes("osb") || m.includes("sheathing") || m.includes("plywood")) return "#d97706";
  if (m.includes("fiberglass") || m.includes("mineral wool") || m.includes("batt")) return "#86efac";
  if (m.includes("spray foam") || m.includes("xps") || m.includes("eps") || m.includes("polyiso")) return "#6ee7b7";
  if (m.includes("vapour") || m.includes("vapor") || m.includes("barrier")) return "#fbbf24";
  if (m.includes("siding") || m.includes("brick") || m.includes("veneer") || m.includes("cladding")) return "#94a3b8";
  if (m.includes("air")) return "#bfdbfe";
  if (m.includes("concrete") || m.includes("masonry") || m.includes("block")) return "#9ca3af";
  if (m.includes("stud") || m.includes("framing") || m.includes("lumber")) return "#92400e";
  return "#cbd5e1";
}

// ─── Wall Assembly Cross-Section Diagram ──────────────────────────────────────
function WallAssemblyDiagram({
  layers,
  climateZone,
  assemblyType,
  minimumRequirements,
}: {
  layers: Layer[];
  climateZone: string;
  assemblyType: string;
  minimumRequirements: Record<string, Record<string, number>>;
}) {
  if (layers.length === 0) return null;

  const BAND_LEFT  = 40;
  const BAND_RIGHT = 560;
  const BAND_W     = BAND_RIGHT - BAND_LEFT; // 520
  const BAND_TOP   = 32;
  const BAND_BOT   = 142;
  const BAND_H     = BAND_BOT - BAND_TOP;   // 110
  const MIN_BW     = 20;

  const totalThicknessMm = layers.reduce((s, l) => s + l.thickness, 0);
  const nominalRSI       = layers.reduce((s, l) => s + l.rValue, 0);
  const effectiveRSI     = (nominalRSI + 0.15) * 0.80;
  const requiredRSI      = minimumRequirements[climateZone]?.[assemblyType] ?? 0;
  const statusColor      = effectiveRSI >= requiredRSI * 1.05
    ? "#16a34a" : effectiveRSI >= requiredRSI ? "#3b82f6" : "#dc2626";

  // Compute proportional widths with minimum floor
  const rawWidths = layers.map(l =>
    totalThicknessMm > 0
      ? Math.max((l.thickness / totalThicknessMm) * BAND_W, MIN_BW)
      : BAND_W / layers.length
  );
  const totalRaw  = rawWidths.reduce((s, w) => s + w, 0);
  const scaledW   = rawWidths.map(w => (w / totalRaw) * BAND_W);

  // x start positions
  const xs: number[] = [];
  let cx = BAND_LEFT;
  for (const w of scaledW) { xs.push(cx); cx += w; }

  const midY = (BAND_TOP + BAND_BOT) / 2;

  // Truncate material names for rotated labels inside band
  function shortName(mat: string): string {
    return mat.replace(/\s*\(.*?\)/g, "").trim();
  }

  return (
    <svg viewBox="0 0 600 205" className="w-full rounded border bg-white" style={{ maxHeight: 230 }}>
      {/* Code reference bar */}
      <text x="300" y="11" textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="sans-serif">
        {assemblyType.charAt(0).toUpperCase() + assemblyType.slice(1)} Assembly
        {" · Zone " + climateZone}
        {requiredRSI > 0 ? ` · NBC 9.36 min RSI ${requiredRSI.toFixed(2)}` : ""}
      </text>

      {/* Heat flow indicator */}
      <text x="557" y="26" fontSize="8" fill="#9ca3af" fontFamily="sans-serif" textAnchor="end">
        ← heat loss
      </text>
      <line x1="558" y1="23" x2="566" y2="23" stroke="#9ca3af" strokeWidth="1" markerEnd="url(#arrowL)" />

      {/* INTERIOR / EXTERIOR labels */}
      <text
        x="18" y={midY} textAnchor="middle" fontSize="8" fill="#374151"
        fontFamily="sans-serif" fontWeight="bold"
        transform={`rotate(-90,18,${midY})`}
      >INTERIOR</text>
      <text
        x="583" y={midY} textAnchor="middle" fontSize="8" fill="#374151"
        fontFamily="sans-serif" fontWeight="bold"
        transform={`rotate(-90,583,${midY})`}
      >EXTERIOR</text>

      {/* Layer bands */}
      {layers.map((layer, i) => {
        const bx = xs[i];
        const bw = scaledW[i];
        const color = layerColor(layer.material);
        const label = shortName(layer.material);
        const fontSize = bw > 35 ? 8 : 7;

        return (
          <g key={layer.id}>
            <rect x={bx} y={BAND_TOP} width={bw} height={BAND_H}
              fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1} />
            {bw >= 14 && (
              <text
                x={bx + bw / 2} y={midY}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={fontSize} fill="#1f2937" fontFamily="sans-serif"
                transform={`rotate(-90,${bx + bw / 2},${midY})`}
              >
                {label.length * (fontSize * 0.55) > BAND_H
                  ? label.slice(0, Math.floor(BAND_H / (fontSize * 0.6))) + "…"
                  : label}
              </text>
            )}
            {/* RSI below band */}
            <text x={bx + bw / 2} y={BAND_BOT + 11}
              textAnchor="middle" fontSize="7" fill="#4b5563" fontFamily="sans-serif">
              {layer.rValue.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Separator lines */}
      <line x1={BAND_LEFT} y1={BAND_TOP} x2={BAND_LEFT} y2={BAND_BOT} stroke="#9ca3af" strokeWidth="1" />
      <line x1={BAND_RIGHT} y1={BAND_TOP} x2={BAND_RIGHT} y2={BAND_BOT} stroke="#9ca3af" strokeWidth="1" />
      <line x1={BAND_LEFT} y1={BAND_BOT} x2={BAND_RIGHT} y2={BAND_BOT} stroke="#d1d5db" strokeWidth="1" />

      {/* RSI axis label */}
      <text x={BAND_LEFT} y={BAND_BOT + 11} textAnchor="start" fontSize="7" fill="#9ca3af" fontFamily="sans-serif">RSI:</text>

      {/* Summary line */}
      <text x="300" y="175" textAnchor="middle" fontSize="9"
        fill={statusColor} fontFamily="sans-serif" fontWeight="bold">
        {`Total Assembly RSI: ${effectiveRSI.toFixed(2)}`}
        {requiredRSI > 0
          ? effectiveRSI >= requiredRSI
            ? ` ✓ MEETS NBC 9.36 (min ${requiredRSI.toFixed(2)})`
            : ` ✗ BELOW REQUIRED — min ${requiredRSI.toFixed(2)}`
          : ""}
      </text>
      <text x="300" y="188" textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="sans-serif">
        {`Effective R-${(effectiveRSI * 5.678).toFixed(1)} (imperial) · nominal RSI ${nominalRSI.toFixed(2)} · 80% bridging factor applied`}
      </text>
    </svg>
  );
}

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
      // Fields used by permit package PDF (getCalc parses resultData)
      totalRSI:      parseFloat(effectiveRSIWithBridging.toFixed(2)),
      effectiveRValue: parseFloat(rValueImperial.toFixed(1)),
      requiredRSI:   parseFloat(minRequired.toFixed(2)),
      meetsCode:     compliant,
      margin:        parseFloat(margin.toFixed(2)),
      assemblyType,
      layers: layers.map((l, idx) => ({
        layerNum:    idx + 1,
        material:    l.material,
        thicknessMm: l.thickness,
        rsi:         parseFloat(l.rValue.toFixed(2)),
        rValue:      parseFloat((l.rValue * 5.678).toFixed(1)),
      })),
      // Display-only fields
      nominalRSI:              parseFloat(totalRSI.toFixed(2)),
      effectiveRSI:            parseFloat(effectiveRSI.toFixed(2)),
      effectiveRSIWithBridging: parseFloat(effectiveRSIWithBridging.toFixed(2)),
      rValueImperial:          parseFloat(rValueImperial.toFixed(1)),
      minRequired:             parseFloat(minRequired.toFixed(2)),
      compliant,
      thermalBridgingFactor:   parseFloat((thermalBridgingFactor * 100).toFixed(0)),
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
          <div className="flex items-center gap-2">
            {results !== null && (
              <SaveButton
                calculatorType="thermalResistance"
                inputs={{ climateZone, assemblyType, layers }}
                results={results}
              />
            )}
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
                ["Total RSI (Nominal)", results.nominalRSI],
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

        {/* Real-time wall assembly cross-section diagram */}
        <WallAssemblyDiagram
          layers={layers}
          climateZone={climateZone}
          assemblyType={assemblyType}
          minimumRequirements={minimumRequirements}
        />

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
                <p className="text-lg font-bold text-primary">{results.nominalRSI}</p>
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
