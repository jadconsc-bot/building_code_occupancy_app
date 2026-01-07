import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Triangle } from "lucide-react";
import { exportRoofRafterSpanToExcel } from "@/lib/excelExport";

// NBC Part 9 Roof Rafter Span Data
// Maximum spans for roof rafters (2.0 kPa snow load typical for Calgary/Edmonton)
// Spans adjusted by roof pitch factor
const baseRafterSpanData: Record<string, Record<string, Record<string, Record<string, number>>>> = {
  "Douglas Fir - Larch": {
    "Select Structural": {
      "38 x 89 mm": { "300mm": 2.45, "400mm": 2.23, "600mm": 1.95 },
      "38 x 140 mm": { "300mm": 3.85, "400mm": 3.50, "600mm": 3.07 },
      "38 x 184 mm": { "300mm": 5.06, "400mm": 4.60, "600mm": 4.03 },
      "38 x 235 mm": { "300mm": 6.47, "400mm": 5.88, "600mm": 5.15 },
      "38 x 286 mm": { "300mm": 7.87, "400mm": 7.15, "600mm": 6.27 },
    },
    "No. 1/No. 2": {
      "38 x 89 mm": { "300mm": 2.22, "400mm": 2.02, "600mm": 1.77 },
      "38 x 140 mm": { "300mm": 3.49, "400mm": 3.17, "600mm": 2.78 },
      "38 x 184 mm": { "300mm": 4.59, "400mm": 4.17, "600mm": 3.66 },
      "38 x 235 mm": { "300mm": 5.87, "400mm": 5.33, "600mm": 4.68 },
      "38 x 286 mm": { "300mm": 7.14, "400mm": 6.49, "600mm": 5.69 },
    },
  },
  "Hem-Fir": {
    "Select Structural": {
      "38 x 89 mm": { "300mm": 2.34, "400mm": 2.13, "600mm": 1.86 },
      "38 x 140 mm": { "300mm": 3.67, "400mm": 3.34, "600mm": 2.93 },
      "38 x 184 mm": { "300mm": 4.83, "400mm": 4.39, "600mm": 3.85 },
      "38 x 235 mm": { "300mm": 6.17, "400mm": 5.61, "600mm": 4.92 },
      "38 x 286 mm": { "300mm": 7.51, "400mm": 6.82, "600mm": 5.98 },
    },
    "No. 1/No. 2": {
      "38 x 89 mm": { "300mm": 2.13, "400mm": 1.93, "600mm": 1.69 },
      "38 x 140 mm": { "300mm": 3.34, "400mm": 3.03, "600mm": 2.66 },
      "38 x 184 mm": { "300mm": 4.39, "400mm": 3.99, "600mm": 3.50 },
      "38 x 235 mm": { "300mm": 5.61, "400mm": 5.10, "600mm": 4.47 },
      "38 x 286 mm": { "300mm": 6.82, "400mm": 6.20, "600mm": 5.44 },
    },
  },
  "Spruce-Pine-Fir (S-P-F)": {
    "Select Structural": {
      "38 x 89 mm": { "300mm": 2.26, "400mm": 2.05, "600mm": 1.80 },
      "38 x 140 mm": { "300mm": 3.54, "400mm": 3.22, "600mm": 2.82 },
      "38 x 184 mm": { "300mm": 4.66, "400mm": 4.23, "600mm": 3.71 },
      "38 x 235 mm": { "300mm": 5.95, "400mm": 5.41, "600mm": 4.74 },
      "38 x 286 mm": { "300mm": 7.24, "400mm": 6.58, "600mm": 5.77 },
    },
    "No. 1/No. 2": {
      "38 x 89 mm": { "300mm": 2.05, "400mm": 1.86, "600mm": 1.63 },
      "38 x 140 mm": { "300mm": 3.22, "400mm": 2.92, "600mm": 2.56 },
      "38 x 184 mm": { "300mm": 4.23, "400mm": 3.84, "600mm": 3.37 },
      "38 x 235 mm": { "300mm": 5.41, "400mm": 4.91, "600mm": 4.31 },
      "38 x 286 mm": { "300mm": 6.58, "400mm": 5.98, "600mm": 5.24 },
    },
  },
  "Northern Species": {
    "Select Structural": {
      "38 x 89 mm": { "300mm": 2.11, "400mm": 1.92, "600mm": 1.68 },
      "38 x 140 mm": { "300mm": 3.31, "400mm": 3.01, "600mm": 2.64 },
      "38 x 184 mm": { "300mm": 4.36, "400mm": 3.96, "600mm": 3.47 },
      "38 x 235 mm": { "300mm": 5.57, "400mm": 5.06, "600mm": 4.44 },
      "38 x 286 mm": { "300mm": 6.77, "400mm": 6.15, "600mm": 5.39 },
    },
    "No. 1/No. 2": {
      "38 x 89 mm": { "300mm": 1.92, "400mm": 1.74, "600mm": 1.53 },
      "38 x 140 mm": { "300mm": 3.01, "400mm": 2.73, "600mm": 2.40 },
      "38 x 184 mm": { "300mm": 3.96, "400mm": 3.60, "600mm": 3.16 },
      "38 x 235 mm": { "300mm": 5.06, "400mm": 4.60, "600mm": 4.03 },
      "38 x 286 mm": { "300mm": 6.15, "400mm": 5.59, "600mm": 4.90 },
    },
  },
};

// Roof pitch adjustment factors (higher pitch = better load distribution)
const pitchFactors: Record<string, number> = {
  "3:12": 0.85,
  "4:12": 0.90,
  "5:12": 0.95,
  "6:12": 1.00,
  "8:12": 1.05,
  "10:12": 1.08,
  "12:12": 1.10,
};

const species = ["Douglas Fir - Larch", "Hem-Fir", "Spruce-Pine-Fir (S-P-F)", "Northern Species"];
const grades = ["Select Structural", "No. 1/No. 2"];
const rafterSizes = [
  "38 x 89 mm",
  "38 x 140 mm",
  "38 x 184 mm",
  "38 x 235 mm",
  "38 x 286 mm",
];
const spacings = [
  { value: "300mm", label: '12" (300mm)' },
  { value: "400mm", label: '16" (400mm)' },
  { value: "600mm", label: '24" (600mm)' },
];
const pitches = ["3:12", "4:12", "5:12", "6:12", "8:12", "10:12", "12:12"];
const snowLoads = [
  { value: "2.0", label: "2.0 kPa (Calgary/Edmonton)" },
  { value: "1.5", label: "1.5 kPa (Lower regions)" },
  { value: "2.5", label: "2.5 kPa (Higher regions)" },
  { value: "3.0", label: "3.0 kPa (Mountain areas)" },
];

export function RoofRafterSpanCalculator() {
  const [selectedSpecies, setSelectedSpecies] = useState("Douglas Fir - Larch");
  const [selectedGrade, setSelectedGrade] = useState("Select Structural");
  const [selectedSize, setSelectedSize] = useState("38 x 140 mm");
  const [selectedSpacing, setSelectedSpacing] = useState("400mm");
  const [selectedPitch, setSelectedPitch] = useState("6:12");
  const [selectedSnowLoad, setSelectedSnowLoad] = useState("2.0");

  // Calculate adjusted span based on pitch and snow load
  const baseSpan = baseRafterSpanData[selectedSpecies]?.[selectedGrade]?.[selectedSize]?.[selectedSpacing] || 0;
  const pitchFactor = pitchFactors[selectedPitch] || 1.0;
  const snowLoadFactor = 2.0 / parseFloat(selectedSnowLoad); // Adjust for snow load (base is 2.0 kPa)
  const adjustedSpan = baseSpan * pitchFactor * Math.sqrt(snowLoadFactor);
  const adjustedSpanFeet = (adjustedSpan * 3.28084).toFixed(1);

  const handleExport = () => {
    const spacingLabel = spacings.find(s => s.value === selectedSpacing)?.label || selectedSpacing;
    const snowLoadLabel = snowLoads.find(s => s.value === selectedSnowLoad)?.label || selectedSnowLoad;
    
    exportRoofRafterSpanToExcel({
      species: selectedSpecies,
      grade: selectedGrade,
      size: selectedSize,
      spacing: spacingLabel,
      pitch: selectedPitch,
      snowLoad: snowLoadLabel,
      spanMeters: adjustedSpan,
      spanFeet: parseFloat(adjustedSpanFeet),
    });
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Triangle className="w-4 h-4 text-primary" /> Roof Rafter Span Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Calculate maximum spans based on NBC Part 9 Span Tables
            </CardDescription>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Species
            </label>
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {species.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Grade
            </label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Rafter Size
            </label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rafterSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Rafter Spacing
            </label>
            <Select value={selectedSpacing} onValueChange={setSelectedSpacing}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spacings.map((spacing) => (
                  <SelectItem key={spacing.value} value={spacing.value}>
                    {spacing.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Roof Pitch
            </label>
            <Select value={selectedPitch} onValueChange={setSelectedPitch}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pitches.map((pitch) => (
                  <SelectItem key={pitch} value={pitch}>
                    {pitch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Snow Load
            </label>
            <Select value={selectedSnowLoad} onValueChange={setSelectedSnowLoad}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {snowLoads.map((load) => (
                  <SelectItem key={load.value} value={load.value}>
                    {load.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-primary/5 border-2 border-primary p-6 rounded-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Maximum Allowable Span
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Metric</p>
              <p className="text-4xl font-black text-primary">{adjustedSpan.toFixed(2)}m</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Imperial</p>
              <p className="text-4xl font-black text-primary">{adjustedSpanFeet}ft</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              <strong>Pitch Factor:</strong> {pitchFactor.toFixed(2)}x | 
              <strong className="ml-2">Snow Load Factor:</strong> {snowLoadFactor.toFixed(2)}x
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-xs text-muted-foreground">
          <p>
            <strong>Important Notes:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Spans based on NBC 2023 Part 9 Span Tables</li>
            <li>Base calculations assume 2.0 kPa snow load (Calgary/Edmonton typical)</li>
            <li>Pitch factor adjusts for improved load distribution at steeper pitches</li>
            <li>Snow load factor adjusts span capacity based on regional requirements</li>
            <li>Spans assume standard roof dead load (shingles, sheathing, etc.)</li>
            <li>Consult a structural engineer for complex roof designs</li>
            <li>Local building authority approval may be required</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-none">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Roof Pitch Guide
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <p><strong>3:12 to 4:12:</strong> Low slope, minimal pitch factor</p>
              <p><strong>5:12 to 6:12:</strong> Standard residential pitch</p>
            </div>
            <div>
              <p><strong>8:12 to 10:12:</strong> Steep pitch, better load distribution</p>
              <p><strong>12:12:</strong> Very steep (45°), maximum pitch benefit</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            <strong>Reference:</strong> National Building Code of Canada 2023, Part 9 Span Tables
            <br />
            Maximum Spans for Roof Rafters
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
