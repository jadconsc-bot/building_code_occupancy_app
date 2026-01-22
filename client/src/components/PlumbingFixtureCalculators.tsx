import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Users, Info, AlertTriangle, CheckCircle2, Droplets, GlassWater, Bath } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// ============================================
// WATER CLOSET CALCULATOR (NBC 3.7.2.2)
// ============================================

const assemblyTable = [
  { min: 1, max: 25, male: 1, female: 1 },
  { min: 26, max: 50, male: 1, female: 2 },
  { min: 51, max: 75, male: 2, female: 3 },
  { min: 76, max: 100, male: 2, female: 4 },
  { min: 101, max: 125, male: 3, female: 5 },
  { min: 126, max: 150, male: 3, female: 6 },
  { min: 151, max: 175, male: 4, female: 7 },
  { min: 176, max: 200, male: 4, female: 8 },
  { min: 201, max: 250, male: 5, female: 9 },
  { min: 251, max: 300, male: 5, female: 10 },
  { min: 301, max: 350, male: 6, female: 11 },
  { min: 351, max: 400, male: 6, female: 12 },
];

type OccupancyType = 
  | "assembly" 
  | "primary_school" 
  | "daycare" 
  | "worship" 
  | "undertaking" 
  | "business" 
  | "mercantile" 
  | "industrial"
  | "residential";

interface OccupancyConfig {
  name: string;
  description: string;
  wcCodeReference: string;
  lavCodeReference: string;
  dfCodeReference: string;
  maleRatio?: number;
  femaleRatio?: number;
  lavRatio?: number;
  dfRatio?: number;
  dfFloorAreaRatio?: number;
  useAssemblyTable?: boolean;
  allowUrinalSubstitution?: boolean;
  specialNote?: string;
}

const occupancyConfigs: Record<OccupancyType, OccupancyConfig> = {
  assembly: {
    name: "Assembly Occupancy (A-1, A-2, A-3, A-4)",
    description: "Theatres, restaurants, arenas, stadiums, and other assembly spaces",
    wcCodeReference: "NBC 3.7.2.2.(4), Table 3.7.2.2.-A",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    useAssemblyTable: true,
    allowUrinalSubstitution: true,
    lavRatio: 75, // 1 per 75 persons
    dfRatio: 150, // 1 per 150 persons
  },
  primary_school: {
    name: "Primary Schools",
    description: "Elementary schools",
    wcCodeReference: "NBC 3.7.2.2.(5)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    maleRatio: 30,
    femaleRatio: 25,
    allowUrinalSubstitution: false,
    lavRatio: 30, // 1 per 30 persons
    dfRatio: 75, // 1 per 75 persons
    specialNote: "At least one WC for each 30 males and one for each 25 females",
  },
  daycare: {
    name: "Daycare Centres",
    description: "Licensed daycare and childcare facilities",
    wcCodeReference: "NBC 3.7.2.2.(5)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    maleRatio: 30,
    femaleRatio: 25,
    allowUrinalSubstitution: false,
    lavRatio: 30,
    dfRatio: 75,
    specialNote: "At least one WC for each 30 males and one for each 25 females",
  },
  worship: {
    name: "Places of Worship",
    description: "Churches, mosques, temples, synagogues",
    wcCodeReference: "NBC 3.7.2.2.(6)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    maleRatio: 150,
    femaleRatio: 150,
    allowUrinalSubstitution: true,
    lavRatio: 200,
    dfRatio: 500,
    specialNote: "At least one WC for each 150 persons of each sex",
  },
  undertaking: {
    name: "Undertaking Premises",
    description: "Funeral homes and related facilities",
    wcCodeReference: "NBC 3.7.2.2.(6)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    maleRatio: 150,
    femaleRatio: 150,
    allowUrinalSubstitution: true,
    lavRatio: 200,
    dfRatio: 500,
    specialNote: "At least one WC for each 150 persons of each sex",
  },
  business: {
    name: "Business & Personal Services (D)",
    description: "Offices, banks, professional services",
    wcCodeReference: "NBC 3.7.2.2.(8)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    maleRatio: 25,
    femaleRatio: 25,
    allowUrinalSubstitution: true,
    lavRatio: 40,
    dfRatio: 100,
    dfFloorAreaRatio: 500, // 1 per 500 m²
    specialNote: "At least one WC for each 25 persons of each sex",
  },
  mercantile: {
    name: "Mercantile (E)",
    description: "Retail stores, shopping centres, markets",
    wcCodeReference: "NBC 3.7.2.2.(8)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    maleRatio: 25,
    femaleRatio: 25,
    allowUrinalSubstitution: true,
    lavRatio: 40,
    dfRatio: 100,
    dfFloorAreaRatio: 500,
    specialNote: "At least one WC for each 25 persons of each sex",
  },
  industrial: {
    name: "Industrial (F-1, F-2, F-3)",
    description: "Factories, warehouses, manufacturing",
    wcCodeReference: "NBC 3.7.2.2.(8)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    maleRatio: 25,
    femaleRatio: 25,
    allowUrinalSubstitution: true,
    lavRatio: 40,
    dfRatio: 100,
    dfFloorAreaRatio: 500,
    specialNote: "At least one WC for each 25 persons of each sex",
  },
  residential: {
    name: "Residential (C)",
    description: "Apartments, hotels, dormitories",
    wcCodeReference: "NBC 3.7.2.2.(2)",
    lavCodeReference: "NBC 3.7.2.4.(2)",
    dfCodeReference: "NBC 3.7.2.5.(2)",
    allowUrinalSubstitution: false,
    specialNote: "Each dwelling unit requires at least one water closet and lavatory",
  },
};

function calculateAssemblyWC(count: number): number {
  if (count <= 0) return 0;
  for (const row of assemblyTable) {
    if (count >= row.min && count <= row.max) {
      return row.male;
    }
  }
  if (count > 400) {
    const excess = count - 400;
    const additional = Math.ceil(excess / 200);
    return 7 + additional;
  }
  return 1;
}

function calculateAssemblyWCFemale(count: number): number {
  if (count <= 0) return 0;
  for (const row of assemblyTable) {
    if (count >= row.min && count <= row.max) {
      return row.female;
    }
  }
  if (count > 400) {
    const excess = count - 400;
    const additional = Math.ceil(excess / 100);
    return 13 + additional;
  }
  return 1;
}

function calculateRatioWC(count: number, ratio: number): number {
  if (count <= 0 || ratio <= 0) return 0;
  return Math.ceil(count / ratio);
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PlumbingFixtureCalculators() {
  const [occupancyType, setOccupancyType] = useState<OccupancyType>("assembly");
  const [maleCount, setMaleCount] = useState<string>("");
  const [femaleCount, setFemaleCount] = useState<string>("");
  const [floorArea, setFloorArea] = useState<string>("");
  const [useUrinals, setUseUrinals] = useState(false);
  const [urinalCount, setUrinalCount] = useState<string>("");

  const config = occupancyConfigs[occupancyType];

  const results = useMemo(() => {
    const males = parseInt(maleCount) || 0;
    const females = parseInt(femaleCount) || 0;
    const area = parseFloat(floorArea) || 0;
    const urinals = parseInt(urinalCount) || 0;
    const totalOccupants = males + females;

    let maleWC = 0;
    let femaleWC = 0;

    // Calculate Water Closets
    if (config.useAssemblyTable) {
      maleWC = calculateAssemblyWC(males);
      femaleWC = calculateAssemblyWCFemale(females);
    } else if (config.maleRatio && config.femaleRatio) {
      maleWC = calculateRatioWC(males, config.maleRatio);
      femaleWC = calculateRatioWC(females, config.femaleRatio);
    }

    // Calculate urinal substitution (NBC 3.7.2.3)
    // Urinals may substitute for up to 2/3 of male water closets
    let maxUrinalSubstitution = 0;
    let actualUrinalSubstitution = 0;
    let adjustedMaleWC = maleWC;

    if (config.allowUrinalSubstitution && useUrinals && maleWC > 0) {
      maxUrinalSubstitution = Math.floor((maleWC * 2) / 3);
      actualUrinalSubstitution = Math.min(urinals, maxUrinalSubstitution);
      adjustedMaleWC = maleWC - actualUrinalSubstitution;
      // Ensure at least 1 male WC remains
      if (adjustedMaleWC < 1 && maleWC >= 1) {
        adjustedMaleWC = 1;
        actualUrinalSubstitution = maleWC - 1;
      }
    }

    // Calculate Lavatories (NBC 3.7.2.4)
    let lavatories = 0;
    if (config.lavRatio) {
      lavatories = Math.max(1, Math.ceil(totalOccupants / config.lavRatio));
    }

    // Calculate Drinking Fountains (NBC 3.7.2.5)
    let drinkingFountains = 0;
    if (config.dfRatio) {
      const byOccupants = Math.ceil(totalOccupants / config.dfRatio);
      const byArea = config.dfFloorAreaRatio && area > 0 
        ? Math.ceil(area / config.dfFloorAreaRatio) 
        : 0;
      drinkingFountains = Math.max(byOccupants, byArea, totalOccupants > 0 ? 1 : 0);
    }

    return {
      maleWC,
      femaleWC,
      totalWC: maleWC + femaleWC,
      adjustedMaleWC,
      adjustedTotalWC: adjustedMaleWC + femaleWC,
      maxUrinalSubstitution,
      actualUrinalSubstitution,
      urinalsRequired: useUrinals ? urinals : 0,
      lavatories,
      drinkingFountains,
      maleCount: males,
      femaleCount: females,
      totalOccupants,
      floorArea: area,
    };
  }, [maleCount, femaleCount, floorArea, useUrinals, urinalCount, config]);

  const hasInput = results.maleCount > 0 || results.femaleCount > 0;

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-gradient-to-r from-cyan-50 to-blue-50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-600" />
          Plumbing Fixture Calculator
        </CardTitle>
        <CardDescription className="text-sm">
          Calculate minimum plumbing fixture requirements per NBC Section 3.7.2
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Occupancy Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="occupancy-type-plumbing" className="text-sm font-semibold">
            Occupancy Type
          </Label>
          <Select
            value={occupancyType}
            onValueChange={(value) => setOccupancyType(value as OccupancyType)}
          >
            <SelectTrigger id="occupancy-type-plumbing" className="w-full">
              <SelectValue placeholder="Select occupancy type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assembly">Assembly (A-1, A-2, A-3, A-4)</SelectItem>
              <SelectItem value="primary_school">Primary Schools</SelectItem>
              <SelectItem value="daycare">Daycare Centres</SelectItem>
              <SelectItem value="worship">Places of Worship</SelectItem>
              <SelectItem value="undertaking">Undertaking Premises</SelectItem>
              <SelectItem value="business">Business & Personal Services (D)</SelectItem>
              <SelectItem value="mercantile">Mercantile (E)</SelectItem>
              <SelectItem value="industrial">Industrial (F-1, F-2, F-3)</SelectItem>
              <SelectItem value="residential">Residential (C)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>

        {/* Code References */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            WC: {config.wcCodeReference}
          </Badge>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            Lav: {config.lavCodeReference}
          </Badge>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            DF: {config.dfCodeReference}
          </Badge>
        </div>

        {config.specialNote && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-cyan-200 pl-2">
            {config.specialNote}
          </p>
        )}

        {/* Special handling for residential */}
        {occupancyType === "residential" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Residential Requirements</p>
                <p className="text-sm text-amber-700 mt-1">
                  Each dwelling unit requires at least one water closet and one lavatory.
                  For hotels, motels, and dormitories, refer to NBC 3.7.2.2.(2) and (3) for specific requirements.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="male-count-plumbing" className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Number of Males
                </Label>
                <Input
                  id="male-count-plumbing"
                  type="number"
                  min="0"
                  placeholder="Enter count"
                  value={maleCount}
                  onChange={(e) => setMaleCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="female-count-plumbing" className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-pink-600" />
                  Number of Females
                </Label>
                <Input
                  id="female-count-plumbing"
                  type="number"
                  min="0"
                  placeholder="Enter count"
                  value={femaleCount}
                  onChange={(e) => setFemaleCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor-area" className="text-sm font-semibold flex items-center gap-2">
                  <Bath className="w-4 h-4 text-cyan-600" />
                  Floor Area (m²)
                </Label>
                <Input
                  id="floor-area"
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={floorArea}
                  onChange={(e) => setFloorArea(e.target.value)}
                />
              </div>
            </div>

            {/* Urinal Substitution Option */}
            {config.allowUrinalSubstitution && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-urinals"
                    checked={useUrinals}
                    onCheckedChange={(checked) => setUseUrinals(checked as boolean)}
                  />
                  <Label htmlFor="use-urinals" className="text-sm font-medium cursor-pointer">
                    Use urinals to reduce male water closets (NBC 3.7.2.3)
                  </Label>
                </div>
                {useUrinals && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="urinal-count" className="text-xs text-muted-foreground">
                      Number of urinals to install:
                    </Label>
                    <Input
                      id="urinal-count"
                      type="number"
                      min="0"
                      max={results.maxUrinalSubstitution}
                      placeholder="Enter urinal count"
                      value={urinalCount}
                      onChange={(e) => setUrinalCount(e.target.value)}
                      className="w-32"
                    />
                    <p className="text-xs text-blue-700">
                      Max substitution: {results.maxUrinalSubstitution} urinals (2/3 of {results.maleWC} male WC)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {hasInput && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Minimum Fixture Requirements</span>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Water Closets */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-md p-3 border border-blue-200">
                    <div className="flex items-center gap-1 mb-1">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-semibold text-blue-800 uppercase">Water Closets</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Male:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {useUrinals ? results.adjustedMaleWC : results.maleWC}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-pink-700">Female:</span>
                        <span className="text-lg font-bold text-pink-600">{results.femaleWC}</span>
                      </div>
                      <div className="border-t border-blue-200 pt-1 flex justify-between items-center">
                        <span className="text-xs font-semibold text-blue-800">Total:</span>
                        <span className="text-xl font-bold text-blue-700">
                          {useUrinals ? results.adjustedTotalWC : results.totalWC}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Urinals (if applicable) */}
                  {useUrinals && config.allowUrinalSubstitution && (
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-md p-3 border border-indigo-200">
                      <div className="flex items-center gap-1 mb-1">
                        <Bath className="w-4 h-4 text-indigo-600" />
                        <p className="text-xs font-semibold text-indigo-800 uppercase">Urinals</p>
                      </div>
                      <p className="text-3xl font-bold text-indigo-600 text-center my-2">
                        {results.actualUrinalSubstitution}
                      </p>
                      <p className="text-xs text-indigo-700 text-center">
                        substituting for WC
                      </p>
                    </div>
                  )}

                  {/* Lavatories */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-md p-3 border border-green-200">
                    <div className="flex items-center gap-1 mb-1">
                      <Droplets className="w-4 h-4 text-green-600" />
                      <p className="text-xs font-semibold text-green-800 uppercase">Lavatories</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600 text-center my-2">
                      {results.lavatories}
                    </p>
                    <p className="text-xs text-green-700 text-center">
                      {config.lavRatio ? `1 per ${config.lavRatio} persons` : "See code"}
                    </p>
                  </div>

                  {/* Drinking Fountains */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-md p-3 border border-purple-200">
                    <div className="flex items-center gap-1 mb-1">
                      <GlassWater className="w-4 h-4 text-purple-600" />
                      <p className="text-xs font-semibold text-purple-800 uppercase">Drinking Fountains</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600 text-center my-2">
                      {results.drinkingFountains}
                    </p>
                    <p className="text-xs text-purple-700 text-center">
                      {config.dfRatio ? `1 per ${config.dfRatio} persons` : "See code"}
                    </p>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="bg-muted/30 rounded-md p-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fixture Type</TableHead>
                        <TableHead className="text-center">Required</TableHead>
                        <TableHead>Code Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Water Closets (Male)</TableCell>
                        <TableCell className="text-center font-bold text-blue-600">
                          {useUrinals ? results.adjustedMaleWC : results.maleWC}
                        </TableCell>
                        <TableCell className="text-xs">{config.wcCodeReference}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Water Closets (Female)</TableCell>
                        <TableCell className="text-center font-bold text-pink-600">{results.femaleWC}</TableCell>
                        <TableCell className="text-xs">{config.wcCodeReference}</TableCell>
                      </TableRow>
                      {useUrinals && config.allowUrinalSubstitution && (
                        <TableRow>
                          <TableCell className="font-medium">Urinals</TableCell>
                          <TableCell className="text-center font-bold text-indigo-600">
                            {results.actualUrinalSubstitution}
                          </TableCell>
                          <TableCell className="text-xs">NBC 3.7.2.3</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="font-medium">Lavatories (Sinks)</TableCell>
                        <TableCell className="text-center font-bold text-green-600">{results.lavatories}</TableCell>
                        <TableCell className="text-xs">{config.lavCodeReference}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Drinking Fountains</TableCell>
                        <TableCell className="text-center font-bold text-purple-600">{results.drinkingFountains}</TableCell>
                        <TableCell className="text-xs">{config.dfCodeReference}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Notes */}
                <div className="flex items-start gap-2 pt-2 border-t border-border">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    These are minimum requirements per NBC Section 3.7.2. Local authorities may require additional fixtures.
                    Barrier-free fixtures must be provided per NBC 3.8.2.8.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reference Tables */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="wc-table" className="border rounded-md mb-2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                NBC 3.7.2.2 - Water Closet Reference Table
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Persons of Each Sex</TableHead>
                      <TableHead className="font-bold text-center text-blue-600">Male WC</TableHead>
                      <TableHead className="font-bold text-center text-pink-600">Female WC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assemblyTable.map((row, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                        <TableCell className="font-medium">{row.min} - {row.max}</TableCell>
                        <TableCell className="text-center">{row.male}</TableCell>
                        <TableCell className="text-center">{row.female}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-amber-50">
                      <TableCell className="font-medium">Over 400</TableCell>
                      <TableCell className="text-center text-xs">7 + 1 per 200 excess</TableCell>
                      <TableCell className="text-center text-xs">13 + 1 per 100 excess</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Source: National Building Code of Canada, Table 3.7.2.2.-A (Assembly Occupancies)
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="urinal-rules" className="border rounded-md mb-2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                NBC 3.7.2.3 - Urinal Substitution Rules
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              <p className="text-sm">
                Urinals may be substituted for water closets in male washrooms under the following conditions:
              </p>
              <ul className="text-sm space-y-2 list-disc pl-5">
                <li><strong>Maximum 2/3 substitution:</strong> Urinals may replace up to two-thirds of the required male water closets</li>
                <li><strong>Minimum 1 WC:</strong> At least one water closet must always remain in male washrooms</li>
                <li><strong>Applicable occupancies:</strong> Assembly, Business, Mercantile, Industrial, Places of Worship</li>
                <li><strong>Not applicable:</strong> Primary schools, daycare centres, and residential occupancies</li>
              </ul>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Example:</strong> If 6 male WC are required, up to 4 urinals may substitute, leaving minimum 2 WC.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lav-rules" className="border rounded-md mb-2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                NBC 3.7.2.4 - Lavatory Requirements
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              <p className="text-sm">
                Lavatories (wash basins/sinks) shall be provided in accordance with the following:
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Occupancy Type</TableHead>
                    <TableHead>Ratio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Assembly (A)</TableCell>
                    <TableCell>1 per 75 persons</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Primary Schools / Daycare</TableCell>
                    <TableCell>1 per 30 persons</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Business / Mercantile / Industrial</TableCell>
                    <TableCell>1 per 40 persons</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Places of Worship</TableCell>
                    <TableCell>1 per 200 persons</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Residential</TableCell>
                    <TableCell>1 per dwelling unit</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="df-rules" className="border rounded-md">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                NBC 3.7.2.5 - Drinking Fountain Requirements
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              <p className="text-sm">
                Drinking fountains shall be provided based on occupancy and floor area:
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Occupancy Type</TableHead>
                    <TableHead>By Occupants</TableHead>
                    <TableHead>By Floor Area</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Assembly (A)</TableCell>
                    <TableCell>1 per 150 persons</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Primary Schools / Daycare</TableCell>
                    <TableCell>1 per 75 persons</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Business / Mercantile / Industrial</TableCell>
                    <TableCell>1 per 100 persons</TableCell>
                    <TableCell>1 per 500 m²</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Places of Worship</TableCell>
                    <TableCell>1 per 500 persons</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="bg-amber-50 p-3 rounded-md">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> At least one drinking fountain must be barrier-free per NBC 3.8.2.8.
                  Bottle filling stations may count toward requirements.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default PlumbingFixtureCalculators;
