import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Columns } from "lucide-react";
import { PresetSelector } from "@/components/PresetSelector";
import { exportColumnSpanToExcel } from "@/lib/excelExport";

// NBC Table 9.23.4.4 - Column Load Capacity Data
// Maximum axial loads for wood columns (kN)
// Based on unsupported length and column size
const columnLoadData: Record<string, Record<string, Record<string, (length: number) => number>>> = {
  "Douglas Fir - Larch": {
    "Select Structural": {
      "89 x 89 mm": (L: number) => Math.max(0, 45 - (L * 1.2)),
      "140 x 140 mm": (L: number) => Math.max(0, 115 - (L * 2.8)),
      "184 x 184 mm": (L: number) => Math.max(0, 200 - (L * 4.5)),
      "235 x 235 mm": (L: number) => Math.max(0, 325 - (L * 7.0)),
      "286 x 286 mm": (L: number) => Math.max(0, 470 - (L * 9.5)),
    },
    "No. 1/No. 2": {
      "89 x 89 mm": (L: number) => Math.max(0, 40 - (L * 1.1)),
      "140 x 140 mm": (L: number) => Math.max(0, 100 - (L * 2.5)),
      "184 x 184 mm": (L: number) => Math.max(0, 175 - (L * 4.0)),
      "235 x 235 mm": (L: number) => Math.max(0, 285 - (L * 6.2)),
      "286 x 286 mm": (L: number) => Math.max(0, 415 - (L * 8.5)),
    },
  },
  "Hem-Fir": {
    "Select Structural": {
      "89 x 89 mm": (L: number) => Math.max(0, 42 - (L * 1.15)),
      "140 x 140 mm": (L: number) => Math.max(0, 108 - (L * 2.6)),
      "184 x 184 mm": (L: number) => Math.max(0, 188 - (L * 4.2)),
      "235 x 235 mm": (L: number) => Math.max(0, 305 - (L * 6.6)),
      "286 x 286 mm": (L: number) => Math.max(0, 440 - (L * 9.0)),
    },
    "No. 1/No. 2": {
      "89 x 89 mm": (L: number) => Math.max(0, 38 - (L * 1.05)),
      "140 x 140 mm": (L: number) => Math.max(0, 95 - (L * 2.3)),
      "184 x 184 mm": (L: number) => Math.max(0, 165 - (L * 3.8)),
      "235 x 235 mm": (L: number) => Math.max(0, 270 - (L * 5.8)),
      "286 x 286 mm": (L: number) => Math.max(0, 390 - (L * 8.0)),
    },
  },
  "Spruce-Pine-Fir (S-P-F)": {
    "Select Structural": {
      "89 x 89 mm": (L: number) => Math.max(0, 40 - (L * 1.1)),
      "140 x 140 mm": (L: number) => Math.max(0, 104 - (L * 2.5)),
      "184 x 184 mm": (L: number) => Math.max(0, 180 - (L * 4.0)),
      "235 x 235 mm": (L: number) => Math.max(0, 293 - (L * 6.3)),
      "286 x 286 mm": (L: number) => Math.max(0, 423 - (L * 8.6)),
    },
    "No. 1/No. 2": {
      "89 x 89 mm": (L: number) => Math.max(0, 36 - (L * 1.0)),
      "140 x 140 mm": (L: number) => Math.max(0, 91 - (L * 2.2)),
      "184 x 184 mm": (L: number) => Math.max(0, 158 - (L * 3.6)),
      "235 x 235 mm": (L: number) => Math.max(0, 258 - (L * 5.5)),
      "286 x 286 mm": (L: number) => Math.max(0, 373 - (L * 7.6)),
    },
  },
  "Northern Species": {
    "Select Structural": {
      "89 x 89 mm": (L: number) => Math.max(0, 37 - (L * 1.05)),
      "140 x 140 mm": (L: number) => Math.max(0, 97 - (L * 2.3)),
      "184 x 184 mm": (L: number) => Math.max(0, 168 - (L * 3.8)),
      "235 x 235 mm": (L: number) => Math.max(0, 273 - (L * 5.9)),
      "286 x 286 mm": (L: number) => Math.max(0, 395 - (L * 8.0)),
    },
    "No. 1/No. 2": {
      "89 x 89 mm": (L: number) => Math.max(0, 33 - (L * 0.95)),
      "140 x 140 mm": (L: number) => Math.max(0, 85 - (L * 2.0)),
      "184 x 184 mm": (L: number) => Math.max(0, 148 - (L * 3.4)),
      "235 x 235 mm": (L: number) => Math.max(0, 241 - (L * 5.2)),
      "286 x 286 mm": (L: number) => Math.max(0, 348 - (L * 7.1)),
    },
  },
};

const species = ["Douglas Fir - Larch", "Hem-Fir", "Spruce-Pine-Fir (S-P-F)", "Northern Species"];
const grades = ["Select Structural", "No. 1/No. 2"];
const columnSizes = [
  "89 x 89 mm",
  "140 x 140 mm",
  "184 x 184 mm",
  "235 x 235 mm",
  "286 x 286 mm",
];

export function ColumnSpanCalculator() {
  const [selectedSpecies, setSelectedSpecies] = useState("Douglas Fir - Larch");
  const [selectedGrade, setSelectedGrade] = useState("Select Structural");
  const [selectedSize, setSelectedSize] = useState("140 x 140 mm");
  const [unsupportedLength, setUnsupportedLength] = useState("3.0");

  const handleLoadPreset = (parameters: Record<string, string | number>) => {
    if (parameters.species) setSelectedSpecies(String(parameters.species));
    if (parameters.grade) setSelectedGrade(String(parameters.grade));
    if (parameters.size) setSelectedSize(String(parameters.size));
    if (parameters.length) setUnsupportedLength(String(parameters.length));
  };

  const length = parseFloat(unsupportedLength) || 0;
  const loadFunction = columnLoadData[selectedSpecies]?.[selectedGrade]?.[selectedSize];
  const maxLoad = loadFunction ? loadFunction(length) : 0;
  const maxLoadLbs = (maxLoad * 224.809).toFixed(0); // Convert kN to lbs

  const handleExport = () => {
    exportColumnSpanToExcel({
      species: selectedSpecies,
      grade: selectedGrade,
      size: selectedSize,
      length: length,
      loadKN: maxLoad,
      loadLbs: parseFloat(maxLoadLbs),
    });
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Columns className="w-4 h-4 text-primary" /> Column Load Calculator
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Calculate maximum axial loads based on NBC Table 9.23.4.4
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <PresetSelector
              calculatorType="column"
              currentParameters={{
                species: selectedSpecies,
                grade: selectedGrade,
                size: selectedSize,
                length: unsupportedLength,
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
              Column Size
            </label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Unsupported Length (m)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={unsupportedLength}
              onChange={(e) => setUnsupportedLength(e.target.value)}
              className="rounded-none"
              placeholder="3.0"
            />
          </div>
        </div>

        <div className="bg-primary/5 border-2 border-primary p-6 rounded-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Maximum Allowable Axial Load
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Metric</p>
              <p className="text-4xl font-black text-primary">{maxLoad.toFixed(1)} kN</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Imperial</p>
              <p className="text-4xl font-black text-primary">{maxLoadLbs} lbs</p>
            </div>
          </div>
          {maxLoad <= 0 && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-none">
              <p className="text-xs text-destructive font-bold">
                ⚠ WARNING: Unsupported length exceeds safe capacity for this column size.
                <br />
                Consider using a larger column or reducing the unsupported length.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3 text-xs text-muted-foreground">
          <p>
            <strong>Important Notes:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Based on NBC 2023 Table 9.23.4.4</li>
            <li>Assumes axial compression loading only</li>
            <li>Unsupported length is the distance between lateral supports</li>
            <li>Load capacity decreases with increasing unsupported length</li>
            <li>Does not account for eccentric loads or bending moments</li>
            <li>Consult a structural engineer for complex applications</li>
            <li>Local building authority approval may be required</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-none">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Slenderness Ratio
          </h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              The <strong>slenderness ratio</strong> (L/d) is the ratio of unsupported length to the
              least dimension of the column. Higher ratios reduce load capacity due to buckling risk.
            </p>
            <p>
              <strong>Typical Limits:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>L/d ≤ 50 for most applications</li>
              <li>L/d ≤ 75 for braced columns</li>
              <li>Lateral bracing significantly increases capacity</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            <strong>Reference:</strong> National Building Code of Canada 2023, Table 9.23.4.4
            <br />
            Maximum Axial Loads for Wood Columns
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
