import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calculator, Users, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

// NBC Table 3.7.2.2.-A - Water Closets for Assembly Occupancy
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
  codeReference: string;
  maleRatio?: number;
  femaleRatio?: number;
  useAssemblyTable?: boolean;
  specialNote?: string;
}

const occupancyConfigs: Record<OccupancyType, OccupancyConfig> = {
  assembly: {
    name: "Assembly Occupancy (A-1, A-2, A-3, A-4)",
    description: "Theatres, restaurants, arenas, stadiums, and other assembly spaces",
    codeReference: "NBC 3.7.2.2.(4), Table 3.7.2.2.-A",
    useAssemblyTable: true,
  },
  primary_school: {
    name: "Primary Schools & Daycare Centres",
    description: "Elementary schools and licensed daycare facilities",
    codeReference: "NBC 3.7.2.2.(5)",
    maleRatio: 30,
    femaleRatio: 25,
    specialNote: "At least one for each 30 males and one for each 25 females",
  },
  daycare: {
    name: "Daycare Centres",
    description: "Licensed daycare and childcare facilities",
    codeReference: "NBC 3.7.2.2.(5)",
    maleRatio: 30,
    femaleRatio: 25,
    specialNote: "At least one for each 30 males and one for each 25 females",
  },
  worship: {
    name: "Places of Worship",
    description: "Churches, mosques, temples, synagogues, and other religious facilities",
    codeReference: "NBC 3.7.2.2.(6)",
    maleRatio: 150,
    femaleRatio: 150,
    specialNote: "At least one for each 150 persons of each sex",
  },
  undertaking: {
    name: "Undertaking Premises",
    description: "Funeral homes and related facilities",
    codeReference: "NBC 3.7.2.2.(6)",
    maleRatio: 150,
    femaleRatio: 150,
    specialNote: "At least one for each 150 persons of each sex",
  },
  business: {
    name: "Business & Personal Services (D)",
    description: "Offices, banks, professional services",
    codeReference: "NBC 3.7.2.2.(8)",
    maleRatio: 25,
    femaleRatio: 25,
    specialNote: "At least one for each 25 persons of each sex",
  },
  mercantile: {
    name: "Mercantile (E)",
    description: "Retail stores, shopping centres, markets",
    codeReference: "NBC 3.7.2.2.(8)",
    maleRatio: 25,
    femaleRatio: 25,
    specialNote: "At least one for each 25 persons of each sex",
  },
  industrial: {
    name: "Industrial (F-1, F-2, F-3)",
    description: "Factories, warehouses, manufacturing facilities",
    codeReference: "NBC 3.7.2.2.(8)",
    maleRatio: 25,
    femaleRatio: 25,
    specialNote: "At least one for each 25 persons of each sex",
  },
  residential: {
    name: "Residential (C)",
    description: "Apartments, hotels, dormitories",
    codeReference: "NBC 3.7.2.2.(2)",
    specialNote: "Each dwelling unit requires at least one water closet. For hotels/dormitories, see specific requirements.",
  },
};

function calculateAssemblyWC(count: number): number {
  if (count <= 0) return 0;
  
  // Find matching range in table
  for (const row of assemblyTable) {
    if (count >= row.min && count <= row.max) {
      return row.male; // Will be used for male calculation
    }
  }
  
  // Over 400: 7 + 1 for each additional 200 males
  if (count > 400) {
    const excess = count - 400;
    const additional = Math.ceil(excess / 200);
    return 7 + additional;
  }
  
  return 1;
}

function calculateAssemblyWCFemale(count: number): number {
  if (count <= 0) return 0;
  
  // Find matching range in table
  for (const row of assemblyTable) {
    if (count >= row.min && count <= row.max) {
      return row.female;
    }
  }
  
  // Over 400: 13 + 1 for each additional 100 females
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

export function WaterClosetCalculator() {
  const [occupancyType, setOccupancyType] = useState<OccupancyType>("assembly");
  const [maleCount, setMaleCount] = useState<string>("");
  const [femaleCount, setFemaleCount] = useState<string>("");
  const [showTable, setShowTable] = useState(false);

  const config = occupancyConfigs[occupancyType];

  const results = useMemo(() => {
    const males = parseInt(maleCount) || 0;
    const females = parseInt(femaleCount) || 0;

    let maleWC = 0;
    let femaleWC = 0;

    if (config.useAssemblyTable) {
      maleWC = calculateAssemblyWC(males);
      femaleWC = calculateAssemblyWCFemale(females);
    } else if (config.maleRatio && config.femaleRatio) {
      maleWC = calculateRatioWC(males, config.maleRatio);
      femaleWC = calculateRatioWC(females, config.femaleRatio);
    }

    return {
      maleWC,
      femaleWC,
      totalWC: maleWC + femaleWC,
      maleCount: males,
      femaleCount: females,
      totalOccupants: males + females,
    };
  }, [maleCount, femaleCount, config]);

  const hasInput = results.maleCount > 0 || results.femaleCount > 0;

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-gradient-to-r from-cyan-50 to-blue-50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-600" />
          Water Closet Calculator
        </CardTitle>
        <CardDescription className="text-sm">
          Calculate minimum water closet requirements per NBC 3.7.2.2
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Occupancy Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="occupancy-type" className="text-sm font-semibold">
            Occupancy Type
          </Label>
          <Select
            value={occupancyType}
            onValueChange={(value) => setOccupancyType(value as OccupancyType)}
          >
            <SelectTrigger id="occupancy-type" className="w-full">
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

        {/* Code Reference Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {config.codeReference}
          </Badge>
          {config.specialNote && (
            <span className="text-xs text-muted-foreground italic">{config.specialNote}</span>
          )}
        </div>

        {/* Special handling for residential */}
        {occupancyType === "residential" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Residential Requirements</p>
                <p className="text-sm text-amber-700 mt-1">
                  Each dwelling unit requires at least one water closet. For hotels, motels, and dormitories,
                  refer to NBC 3.7.2.2.(2) and (3) for specific requirements based on the number of sleeping rooms.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Input Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="male-count" className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Number of Males
                </Label>
                <Input
                  id="male-count"
                  type="number"
                  min="0"
                  placeholder="Enter count"
                  value={maleCount}
                  onChange={(e) => setMaleCount(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="female-count" className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-pink-600" />
                  Number of Females
                </Label>
                <Input
                  id="female-count"
                  type="number"
                  min="0"
                  placeholder="Enter count"
                  value={femaleCount}
                  onChange={(e) => setFemaleCount(e.target.value)}
                  className="text-lg"
                />
              </div>
            </div>

            {/* Results */}
            {hasInput && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Minimum Water Closet Requirements</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-md p-3 border border-green-100 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Male WC</p>
                    <p className="text-3xl font-bold text-blue-600">{results.maleWC}</p>
                    <p className="text-xs text-muted-foreground mt-1">for {results.maleCount} males</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border border-green-100 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Female WC</p>
                    <p className="text-3xl font-bold text-pink-600">{results.femaleWC}</p>
                    <p className="text-xs text-muted-foreground mt-1">for {results.femaleCount} females</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border border-green-100 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total WC</p>
                    <p className="text-3xl font-bold text-green-600">{results.totalWC}</p>
                    <p className="text-xs text-muted-foreground mt-1">minimum required</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-green-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    These are minimum requirements. Local authorities may require additional fixtures.
                    Urinals may substitute for up to 2/3 of male water closets in some occupancies.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reference Table for Assembly */}
        {config.useAssemblyTable && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="table" className="border rounded-md">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  View Table 3.7.2.2.-A Reference
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-bold">Number of Persons of Each Sex</TableHead>
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
                        <TableCell className="text-center text-xs">
                          7, plus 1 for each additional 200 males
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          13, plus 1 for each additional 100 females
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Source: National Building Code of Canada 2020/2025, Table 3.7.2.2.-A
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Additional Notes */}
        <div className="bg-muted/30 rounded-md p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Notes</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Treatment or detention occupancies (B-1, B-2) shall be determined based on special needs</li>
            <li>Urinals may be substituted for up to 2/3 of male water closets in assembly, business, mercantile, and industrial occupancies</li>
            <li>Barrier-free water closets must be provided per NBC 3.8.2.8</li>
            <li>For mixed-use buildings, calculate requirements for each occupancy separately</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default WaterClosetCalculator;
