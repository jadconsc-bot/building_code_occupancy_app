import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, Ruler, AlertCircle, FileSpreadsheet } from "lucide-react";
import { PresetSelector } from "@/components/PresetSelector";
import { Button } from "@/components/ui/button";
import { exportFloorJoistCalculatorToExcel } from "@/lib/excelExport";
import {
  speciesOptions,
  gradeOptions,
  joistSizeOptions,
  spacingOptions,
  getFloorJoistSpan
} from "@/lib/floorJoistSpanData";

export function FloorJoistSpanCalculator() {
  const [species, setSpecies] = useState<string>(speciesOptions[0]);
  const [grade, setGrade] = useState<string>(gradeOptions[0]);
  const [joistSize, setJoistSize] = useState<string>(joistSizeOptions[0]);
  const [spacing, setSpacing] = useState<string>("400");

  const handleLoadPreset = (parameters: Record<string, string | number>) => {
    if (parameters.species) setSpecies(String(parameters.species));
    if (parameters.grade) setGrade(String(parameters.grade));
    if (parameters.joistSize) setJoistSize(String(parameters.joistSize));
    if (parameters.spacing) setSpacing(String(parameters.spacing));
  };

  const maxSpan = getFloorJoistSpan(species, grade, joistSize, spacing);
  const maxSpanFeet = maxSpan ? (maxSpan * 3.28084).toFixed(1) : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>Floor Joist Span Calculator</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Calculate maximum spans based on NBC Table 9.23.4.2-A
            </CardDescription>
          </div>
          <PresetSelector
            calculatorType="floor-joist"
            currentParameters={{
              species,
              grade,
              joistSize,
              spacing,
            }}
            onLoadPreset={handleLoadPreset}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Species</label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {speciesOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Grade</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Joist Size</label>
            <Select value={joistSize} onValueChange={setJoistSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {joistSizeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option} mm
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Joist Spacing</label>
            <Select value={spacing} onValueChange={setSpacing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spacingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Result Display */}
        {maxSpan && (
          <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Ruler className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">Maximum Allowable Span</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Metric</p>
                <p className="text-4xl font-bold text-primary">{maxSpan.toFixed(2)}m</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Imperial</p>
                <p className="text-4xl font-bold text-primary">{maxSpanFeet}ft</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-primary/20 space-y-4">
              <Button
                onClick={() => exportFloorJoistCalculatorToExcel({ species, grade, joistSize: joistSize, spacing, maxSpan })}
                className="w-full"
                variant="outline"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
              
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>Important Notes:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Spans assume 1.9 kPa live load + 0.5 kPa dead load</li>
                    <li>Based on NBC 2023 Table 9.23.4.2-A</li>
                    <li>Consult a structural engineer for complex applications</li>
                    <li>Local building authority approval may be required</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grade Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Grade Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Badge variant="secondary" className="mt-0.5">Select Structural</Badge>
              <p className="text-xs text-muted-foreground">
                Highest quality, maximum strength, allows for the longest spans
              </p>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Badge variant="secondary" className="mt-0.5">No. 1 and No. 2</Badge>
              <p className="text-xs text-muted-foreground">
                High quality, good strength, moderate spans - most commonly used
              </p>
            </div>
          </div>
        </div>

        {/* Reference */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p><strong>Reference:</strong> National Building Code of Canada 2023, Table 9.23.4.2-A</p>
          <p className="mt-1">Maximum Spans for Floor Joists - General Capacity</p>
        </div>
      </CardContent>
    </Card>
  );
}
