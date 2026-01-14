import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Ruler } from "lucide-react";
import { PresetSelector } from "@/components/PresetSelector";
import { exportBeamSpanToExcel } from "@/lib/excelExport";

// NBC Table 9.23.4.3 - Beam Span Data
// Maximum spans for beams supporting floors (1.9 kPa live load + 0.5 kPa dead load)
const beamSpanData: Record<string, Record<string, Record<string, Record<string, number>>>> = {
  "Douglas Fir - Larch": {
    "Select Structural": {
      "38 x 140 mm": { "One Floor": 2.13, "Two Floors": 1.68 },
      "38 x 184 mm": { "One Floor": 2.80, "Two Floors": 2.21 },
      "38 x 235 mm": { "One Floor": 3.58, "Two Floors": 2.82 },
      "38 x 286 mm": { "One Floor": 4.35, "Two Floors": 3.43 },
      "89 x 140 mm": { "One Floor": 3.20, "Two Floors": 2.52 },
      "89 x 184 mm": { "One Floor": 4.20, "Two Floors": 3.31 },
      "89 x 235 mm": { "One Floor": 5.37, "Two Floors": 4.23 },
      "89 x 286 mm": { "One Floor": 6.53, "Two Floors": 5.14 },
    },
    "No. 1/No. 2": {
      "38 x 140 mm": { "One Floor": 1.93, "Two Floors": 1.52 },
      "38 x 184 mm": { "One Floor": 2.54, "Two Floors": 2.00 },
      "38 x 235 mm": { "One Floor": 3.25, "Two Floors": 2.56 },
      "38 x 286 mm": { "One Floor": 3.95, "Two Floors": 3.11 },
      "89 x 140 mm": { "One Floor": 2.90, "Two Floors": 2.29 },
      "89 x 184 mm": { "One Floor": 3.81, "Two Floors": 3.00 },
      "89 x 235 mm": { "One Floor": 4.88, "Two Floors": 3.84 },
      "89 x 286 mm": { "One Floor": 5.93, "Two Floors": 4.67 },
    },
  },
  "Hem-Fir": {
    "Select Structural": {
      "38 x 140 mm": { "One Floor": 2.03, "Two Floors": 1.60 },
      "38 x 184 mm": { "One Floor": 2.67, "Two Floors": 2.10 },
      "38 x 235 mm": { "One Floor": 3.41, "Two Floors": 2.69 },
      "38 x 286 mm": { "One Floor": 4.15, "Two Floors": 3.27 },
      "89 x 140 mm": { "One Floor": 3.05, "Two Floors": 2.40 },
      "89 x 184 mm": { "One Floor": 4.01, "Two Floors": 3.16 },
      "89 x 235 mm": { "One Floor": 5.12, "Two Floors": 4.04 },
      "89 x 286 mm": { "One Floor": 6.23, "Two Floors": 4.91 },
    },
    "No. 1/No. 2": {
      "38 x 140 mm": { "One Floor": 1.85, "Two Floors": 1.46 },
      "38 x 184 mm": { "One Floor": 2.43, "Two Floors": 1.92 },
      "38 x 235 mm": { "One Floor": 3.11, "Two Floors": 2.45 },
      "38 x 286 mm": { "One Floor": 3.78, "Two Floors": 2.98 },
      "89 x 140 mm": { "One Floor": 2.78, "Two Floors": 2.19 },
      "89 x 184 mm": { "One Floor": 3.65, "Two Floors": 2.88 },
      "89 x 235 mm": { "One Floor": 4.67, "Two Floors": 3.68 },
      "89 x 286 mm": { "One Floor": 5.68, "Two Floors": 4.48 },
    },
  },
  "Spruce-Pine-Fir (S-P-F)": {
    "Select Structural": {
      "38 x 140 mm": { "One Floor": 1.96, "Two Floors": 1.54 },
      "38 x 184 mm": { "One Floor": 2.57, "Two Floors": 2.03 },
      "38 x 235 mm": { "One Floor": 3.29, "Two Floors": 2.59 },
      "38 x 286 mm": { "One Floor": 4.00, "Two Floors": 3.15 },
      "89 x 140 mm": { "One Floor": 2.94, "Two Floors": 2.32 },
      "89 x 184 mm": { "One Floor": 3.86, "Two Floors": 3.04 },
      "89 x 235 mm": { "One Floor": 4.94, "Two Floors": 3.89 },
      "89 x 286 mm": { "One Floor": 6.00, "Two Floors": 4.73 },
    },
    "No. 1/No. 2": {
      "38 x 140 mm": { "One Floor": 1.78, "Two Floors": 1.40 },
      "38 x 184 mm": { "One Floor": 2.34, "Two Floors": 1.84 },
      "38 x 235 mm": { "One Floor": 2.99, "Two Floors": 2.36 },
      "38 x 286 mm": { "One Floor": 3.64, "Two Floors": 2.87 },
      "89 x 140 mm": { "One Floor": 2.67, "Two Floors": 2.10 },
      "89 x 184 mm": { "One Floor": 3.51, "Two Floors": 2.77 },
      "89 x 235 mm": { "One Floor": 4.49, "Two Floors": 3.54 },
      "89 x 286 mm": { "One Floor": 5.46, "Two Floors": 4.30 },
    },
  },
  "Northern Species": {
    "Select Structural": {
      "38 x 140 mm": { "One Floor": 1.83, "Two Floors": 1.44 },
      "38 x 184 mm": { "One Floor": 2.41, "Two Floors": 1.90 },
      "38 x 235 mm": { "One Floor": 3.08, "Two Floors": 2.43 },
      "38 x 286 mm": { "One Floor": 3.74, "Two Floors": 2.95 },
      "89 x 140 mm": { "One Floor": 2.75, "Two Floors": 2.17 },
      "89 x 184 mm": { "One Floor": 3.62, "Two Floors": 2.85 },
      "89 x 235 mm": { "One Floor": 4.62, "Two Floors": 3.64 },
      "89 x 286 mm": { "One Floor": 5.62, "Two Floors": 4.43 },
    },
    "No. 1/No. 2": {
      "38 x 140 mm": { "One Floor": 1.66, "Two Floors": 1.31 },
      "38 x 184 mm": { "One Floor": 2.19, "Two Floors": 1.72 },
      "38 x 235 mm": { "One Floor": 2.80, "Two Floors": 2.21 },
      "38 x 286 mm": { "One Floor": 3.40, "Two Floors": 2.68 },
      "89 x 140 mm": { "One Floor": 2.50, "Two Floors": 1.97 },
      "89 x 184 mm": { "One Floor": 3.28, "Two Floors": 2.59 },
      "89 x 235 mm": { "One Floor": 4.20, "Two Floors": 3.31 },
      "89 x 286 mm": { "One Floor": 5.11, "Two Floors": 4.03 },
    },
  },
};

const species = ["Douglas Fir - Larch", "Hem-Fir", "Spruce-Pine-Fir (S-P-F)", "Northern Species"];
const grades = ["Select Structural", "No. 1/No. 2"];
const beamSizes = [
  "38 x 140 mm",
  "38 x 184 mm",
  "38 x 235 mm",
  "38 x 286 mm",
  "89 x 140 mm",
  "89 x 184 mm",
  "89 x 235 mm",
  "89 x 286 mm",
];
const loadingConditions = ["One Floor", "Two Floors"];

export function BeamSpanCalculator() {
  const [selectedSpecies, setSelectedSpecies] = useState("Douglas Fir - Larch");
  const [selectedGrade, setSelectedGrade] = useState("Select Structural");
  const [selectedSize, setSelectedSize] = useState("89 x 184 mm");
  const [selectedLoading, setSelectedLoading] = useState("One Floor");

  const handleLoadPreset = (parameters: Record<string, string | number>) => {
    if (parameters.species) setSelectedSpecies(String(parameters.species));
    if (parameters.grade) setSelectedGrade(String(parameters.grade));
    if (parameters.size) setSelectedSize(String(parameters.size));
    if (parameters.loading) setSelectedLoading(String(parameters.loading));
  };

  const maxSpan = beamSpanData[selectedSpecies]?.[selectedGrade]?.[selectedSize]?.[selectedLoading] || 0;
  const maxSpanFeet = (maxSpan * 3.28084).toFixed(1);

  const handleExport = () => {
    exportBeamSpanToExcel({
      species: selectedSpecies,
      grade: selectedGrade,
      size: selectedSize,
      loading: selectedLoading,
      spanMeters: maxSpan,
      spanFeet: parseFloat(maxSpanFeet),
    });
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" /> Beam Span Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Calculate maximum spans based on NBC Table 9.23.4.3
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <PresetSelector
              calculatorType="beam"
              currentParameters={{
                species: selectedSpecies,
                grade: selectedGrade,
                size: selectedSize,
                loading: selectedLoading,
              }}
              onLoadPreset={handleLoadPreset}
            />
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
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              Beam Size
            </label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {beamSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Loading Condition
            </label>
            <Select value={selectedLoading} onValueChange={setSelectedLoading}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {loadingConditions.map((loading) => (
                  <SelectItem key={loading} value={loading}>
                    {loading}
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
              <p className="text-4xl font-black text-primary">{maxSpan.toFixed(2)}m</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Imperial</p>
              <p className="text-4xl font-black text-primary">{maxSpanFeet}ft</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-xs text-muted-foreground">
          <p>
            <strong>Important Notes:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Spans assume 1.9 kPa live load + 0.5 kPa dead load</li>
            <li>Based on NBC 2023 Table 9.23.4.3</li>
            <li>"One Floor" = beam supporting one floor above</li>
            <li>"Two Floors" = beam supporting two floors above</li>
            <li>Consult a structural engineer for complex applications</li>
            <li>Local building authority approval may be required</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-none">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Grade Information
          </h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              <strong>Select Structural:</strong> Highest quality, maximum strength, allows for the
              longest spans
            </p>
            <p>
              <strong>No. 1 and No. 2:</strong> High quality, good strength, moderate spans - most
              commonly used
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            <strong>Reference:</strong> National Building Code of Canada 2023, Table 9.23.4.3
            <br />
            Maximum Spans for Beams Supporting Floors
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
