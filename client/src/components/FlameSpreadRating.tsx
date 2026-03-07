import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Flame, AlertTriangle, Info, CheckCircle2, Shield, Layers, Building2 } from "lucide-react";

// ============================================
// FLAME SPREAD RATING DATA (NBC 3.1.13)
// ============================================

interface FSRClassification {
  class: string;
  fsrRange: string;
  sdrRange: string;
  description: string;
  typicalMaterials: string[];
}

const fsrClassifications: FSRClassification[] = [
  {
    class: "A",
    fsrRange: "0 - 25",
    sdrRange: "0 - 50",
    description: "Lowest flame spread, highest fire resistance",
    typicalMaterials: [
      "Brick, concrete, stone",
      "Cement board",
      "Gypsum board (Type X)",
      "Mineral fiber ceiling tiles",
      "Glass, ceramic tile",
      "Metal (steel, aluminum)"
    ]
  },
  {
    class: "B",
    fsrRange: "26 - 75",
    sdrRange: "0 - 100",
    description: "Low flame spread, good fire resistance",
    typicalMaterials: [
      "Fire-retardant treated wood",
      "Some hardwoods (oak, maple)",
      "Gypsum board (regular)",
      "Fiber cement siding",
      "Some composite materials"
    ]
  },
  {
    class: "C",
    fsrRange: "76 - 200",
    sdrRange: "0 - 300",
    description: "Moderate flame spread",
    typicalMaterials: [
      "Plywood (untreated)",
      "Oriented strand board (OSB)",
      "Most softwoods (pine, spruce, fir)",
      "Some hardboard products",
      "Particleboard"
    ]
  },
  {
    class: "D",
    fsrRange: "201 - 500",
    sdrRange: "0 - 500",
    description: "High flame spread, limited use",
    typicalMaterials: [
      "Some foam plastics (with barriers)",
      "Certain composite panels",
      "Some synthetic materials"
    ]
  },
  {
    class: "Not Classified",
    fsrRange: "> 500",
    sdrRange: "> 500",
    description: "Not permitted in most applications",
    typicalMaterials: [
      "Unprotected foam plastics",
      "Highly combustible materials"
    ]
  }
];

// FSR Requirements by Location (NBC 3.1.13)
interface LocationRequirement {
  location: string;
  maxFSR: string;
  maxSDR: string;
  codeReference: string;
  notes: string;
}

const locationRequirements: LocationRequirement[] = [
  {
    location: "Exit Stairways",
    maxFSR: "25 (Class A)",
    maxSDR: "50",
    codeReference: "NBC 3.1.13.2.(1)",
    notes: "Walls, ceilings, and soffits within exit stairways"
  },
  {
    location: "Exit Corridors",
    maxFSR: "25 (Class A)",
    maxSDR: "50",
    codeReference: "NBC 3.1.13.2.(1)",
    notes: "Walls and ceilings of exit corridors"
  },
  {
    location: "Lobbies (Assembly A-1)",
    maxFSR: "75 (Class B)",
    maxSDR: "100",
    codeReference: "NBC 3.1.13.2.(2)",
    notes: "Lobbies serving assembly occupancies"
  },
  {
    location: "Corridors (Non-Exit)",
    maxFSR: "75 (Class B)",
    maxSDR: "100",
    codeReference: "NBC 3.1.13.2.(3)",
    notes: "Public corridors not serving as exits"
  },
  {
    location: "Rooms/Spaces (Assembly)",
    maxFSR: "150",
    maxSDR: "300",
    codeReference: "NBC 3.1.13.2.(4)",
    notes: "Assembly rooms with occupant load > 60"
  },
  {
    location: "Rooms/Spaces (Care/Detention)",
    maxFSR: "75 (Class B)",
    maxSDR: "100",
    codeReference: "NBC 3.1.13.2.(5)",
    notes: "Patient/resident rooms in Group B occupancies"
  },
  {
    location: "Vertical Service Spaces",
    maxFSR: "25 (Class A)",
    maxSDR: "50",
    codeReference: "NBC 3.1.13.3",
    notes: "Shafts, chutes, and vertical service spaces"
  },
  {
    location: "Concealed Spaces",
    maxFSR: "25 (Class A)",
    maxSDR: "50",
    codeReference: "NBC 3.1.13.4",
    notes: "Above suspended ceilings and within floor/ceiling assemblies"
  },
  {
    location: "Exterior Walls (Combustible)",
    maxFSR: "25 (Class A)",
    maxSDR: "50",
    codeReference: "NBC 3.1.5.5",
    notes: "Cladding on buildings > 3 storeys"
  },
  {
    location: "Attic/Roof Spaces",
    maxFSR: "25 (Class A)",
    maxSDR: "50",
    codeReference: "NBC 3.1.13.5",
    notes: "Exposed surfaces in attic and roof spaces"
  }
];

// Common Building Materials FSR Values
interface MaterialFSR {
  material: string;
  fsr: string;
  sdr: string;
  class: string;
  notes: string;
}

const commonMaterials: MaterialFSR[] = [
  { material: "Gypsum Board (Type X)", fsr: "10-15", sdr: "0-10", class: "A", notes: "Fire-rated drywall" },
  { material: "Gypsum Board (Regular)", fsr: "15-25", sdr: "0-15", class: "A", notes: "Standard drywall" },
  { material: "Concrete/Masonry", fsr: "0", sdr: "0", class: "A", notes: "Non-combustible" },
  { material: "Brick", fsr: "0", sdr: "0", class: "A", notes: "Non-combustible" },
  { material: "Glass", fsr: "0", sdr: "0", class: "A", notes: "Non-combustible" },
  { material: "Steel (uncoated)", fsr: "0", sdr: "0", class: "A", notes: "Non-combustible" },
  { material: "Aluminum", fsr: "5-10", sdr: "0-5", class: "A", notes: "Low combustibility" },
  { material: "Cement Board", fsr: "0", sdr: "0", class: "A", notes: "Non-combustible" },
  { material: "Mineral Fiber Tiles", fsr: "0-25", sdr: "0-25", class: "A", notes: "Ceiling tiles" },
  { material: "Fire-Retardant Wood", fsr: "25-50", sdr: "0-50", class: "A-B", notes: "Treated lumber" },
  { material: "Red Oak", fsr: "100", sdr: "100", class: "C", notes: "Hardwood" },
  { material: "Maple", fsr: "104", sdr: "50-100", class: "C", notes: "Hardwood" },
  { material: "Douglas Fir", fsr: "70-100", sdr: "0-100", class: "B-C", notes: "Softwood" },
  { material: "Southern Pine", fsr: "130-195", sdr: "100-200", class: "C", notes: "Softwood" },
  { material: "Spruce/Pine/Fir (SPF)", fsr: "65-100", sdr: "50-100", class: "B-C", notes: "Common framing lumber" },
  { material: "Plywood (Untreated)", fsr: "75-200", sdr: "50-200", class: "B-C", notes: "Varies by species" },
  { material: "OSB", fsr: "150-200", sdr: "100-200", class: "C", notes: "Oriented strand board" },
  { material: "Particleboard", fsr: "100-200", sdr: "50-200", class: "C", notes: "Varies by density" },
  { material: "MDF", fsr: "100-175", sdr: "50-150", class: "C", notes: "Medium density fiberboard" },
  { material: "Vinyl Siding", fsr: "25-75", sdr: "50-200", class: "A-B", notes: "Exterior cladding" },
  { material: "Fiber Cement Siding", fsr: "0-25", sdr: "0-25", class: "A", notes: "Exterior cladding" },
  { material: "EIFS", fsr: "25-75", sdr: "50-450", class: "A-B", notes: "Exterior insulation finish system" },
  { material: "Polyurethane Foam (exposed)", fsr: "> 500", sdr: "> 500", class: "Not Classified", notes: "Requires thermal barrier" },
  { material: "Polystyrene (EPS/XPS)", fsr: "> 500", sdr: "> 500", class: "Not Classified", notes: "Requires thermal barrier" },
  { material: "Spray Foam (with barrier)", fsr: "25-75", sdr: "50-450", class: "A-B", notes: "With 15-min thermal barrier" },
  { material: "Carpet (wool)", fsr: "25-75", sdr: "50-100", class: "A-B", notes: "Natural fiber" },
  { material: "Carpet (synthetic)", fsr: "75-200", sdr: "100-300", class: "B-C", notes: "Nylon, polyester" },
  { material: "Acoustic Panels", fsr: "25-200", sdr: "25-300", class: "A-C", notes: "Varies by type" }
];

// Occupancy-specific FSR requirements
interface OccupancyFSR {
  occupancy: string;
  code: string;
  exitRoutes: string;
  corridors: string;
  rooms: string;
  codeReference: string;
}

const occupancyFSRRequirements: OccupancyFSR[] = [
  {
    occupancy: "Assembly (A-1, A-2)",
    code: "A-1/A-2",
    exitRoutes: "25 (Class A)",
    corridors: "75 (Class B)",
    rooms: "150 (OL > 60)",
    codeReference: "NBC 3.1.13.2"
  },
  {
    occupancy: "Assembly (A-3, A-4)",
    code: "A-3/A-4",
    exitRoutes: "25 (Class A)",
    corridors: "75 (Class B)",
    rooms: "150 (OL > 60)",
    codeReference: "NBC 3.1.13.2"
  },
  {
    occupancy: "Care/Treatment (B-2)",
    code: "B-2",
    exitRoutes: "25 (Class A)",
    corridors: "75 (Class B)",
    rooms: "75 (Class B)",
    codeReference: "NBC 3.1.13.2.(5)"
  },
  {
    occupancy: "Detention (B-1)",
    code: "B-1",
    exitRoutes: "25 (Class A)",
    corridors: "75 (Class B)",
    rooms: "75 (Class B)",
    codeReference: "NBC 3.1.13.2.(5)"
  },
  {
    occupancy: "Residential (C)",
    code: "C",
    exitRoutes: "25 (Class A)",
    corridors: "75 (Class B)",
    rooms: "No limit*",
    codeReference: "NBC 3.1.13.2"
  },
  {
    occupancy: "Business (D)",
    code: "D",
    exitRoutes: "25 (Class A)",
    corridors: "75 (Class B)",
    rooms: "No limit*",
    codeReference: "NBC 3.1.13.2"
  },
  {
    occupancy: "Mercantile (E)",
    code: "E",
    exitRoutes: "25 (Class A)",
    corridors: "75 (Class B)",
    rooms: "No limit*",
    codeReference: "NBC 3.1.13.2"
  },
  {
    occupancy: "Industrial (F)",
    code: "F",
    exitRoutes: "25 (Class A)",
    corridors: "75 (Class B)",
    rooms: "No limit*",
    codeReference: "NBC 3.1.13.2"
  }
];

export function FlameSpreadRatingSection() {
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const filteredLocationRequirements = locationRequirements.filter(req => {
    if (selectedLocation === "all") return true;
    return req.location.toLowerCase().includes(selectedLocation.toLowerCase());
  });

  return (
    <Card className="rounded-none border-border shadow-sm" id="flame-spread-rating">
      <CardHeader className="pb-4 border-b border-border bg-gradient-to-r from-red-50 to-orange-50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-600" />
          Flame Spread Rating (FSR) Requirements
        </CardTitle>
        <CardDescription className="text-sm">
          Interior finish and material requirements per NBC Section 3.1.13
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Introduction */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">What is Flame Spread Rating?</p>
              <p className="text-sm text-amber-700 mt-1">
                Flame Spread Rating (FSR) measures how quickly fire spreads across a material's surface. 
                The rating is determined by ASTM E84 or CAN/ULC-S102 tunnel test, comparing materials to 
                red oak (FSR = 100) and cement board (FSR = 0). Lower numbers indicate better fire performance.
              </p>
            </div>
          </div>
        </div>

        {/* FSR Classifications */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            FSR Classifications (NBC 3.1.13.1)
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Class</TableHead>
                  <TableHead className="font-bold">FSR Range</TableHead>
                  <TableHead className="font-bold">SDR Range</TableHead>
                  <TableHead className="font-bold">Description</TableHead>
                  <TableHead className="font-bold">Typical Materials</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fsrClassifications.map((cls, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          cls.class === "A" ? "bg-green-100 text-green-800 border-green-300" :
                          cls.class === "B" ? "bg-blue-100 text-blue-800 border-blue-300" :
                          cls.class === "C" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                          cls.class === "D" ? "bg-orange-100 text-orange-800 border-orange-300" :
                          "bg-red-100 text-red-800 border-red-300"
                        }
                      >
                        {cls.class}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{cls.fsrRange}</TableCell>
                    <TableCell className="font-mono">{cls.sdrRange}</TableCell>
                    <TableCell className="text-sm">{cls.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cls.typicalMaterials.slice(0, 3).join(", ")}
                      {cls.typicalMaterials.length > 3 && "..."}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground italic">
            SDR = Smoke Developed Rating. Both FSR and SDR must meet requirements.
          </p>
        </div>

        {/* Requirements by Location */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            FSR Requirements by Location
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Location</TableHead>
                  <TableHead className="font-bold">Max FSR</TableHead>
                  <TableHead className="font-bold">Max SDR</TableHead>
                  <TableHead className="font-bold">Code Reference</TableHead>
                  <TableHead className="font-bold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocationRequirements.map((req, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <TableCell className="font-medium">{req.location}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        ≤ {req.maxFSR}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        ≤ {req.maxSDR}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{req.codeReference}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{req.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Requirements by Occupancy */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            FSR Requirements by Occupancy Classification
          </h3>
          <div className="space-y-2">
            <Label htmlFor="occupancy-filter" className="text-sm">Filter by Occupancy</Label>
            <Select value={selectedOccupancy} onValueChange={setSelectedOccupancy}>
              <SelectTrigger id="occupancy-filter" className="w-full max-w-xs">
                <SelectValue placeholder="Select occupancy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Occupancies</SelectItem>
                <SelectItem value="A">Assembly (A)</SelectItem>
                <SelectItem value="B">Institutional (B)</SelectItem>
                <SelectItem value="C">Residential (C)</SelectItem>
                <SelectItem value="D">Business (D)</SelectItem>
                <SelectItem value="E">Mercantile (E)</SelectItem>
                <SelectItem value="F">Industrial (F)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Occupancy</TableHead>
                  <TableHead className="font-bold">Exit Routes</TableHead>
                  <TableHead className="font-bold">Corridors</TableHead>
                  <TableHead className="font-bold">Rooms/Spaces</TableHead>
                  <TableHead className="font-bold">Code Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occupancyFSRRequirements
                  .filter(req => selectedOccupancy === "all" || req.code.startsWith(selectedOccupancy))
                  .map((req, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <TableCell className="font-medium">{req.occupancy}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        {req.exitRoutes}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        {req.corridors}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                        {req.rooms}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{req.codeReference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground italic">
            * "No limit" means FSR is not restricted by NBC 3.1.13, but other code sections may apply.
            OL = Occupant Load.
          </p>
        </div>

        {/* Accordions for detailed information */}
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="common-materials" className="border rounded-md mb-2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                Common Building Materials - FSR Reference Table
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Material</TableHead>
                      <TableHead className="font-bold">FSR</TableHead>
                      <TableHead className="font-bold">SDR</TableHead>
                      <TableHead className="font-bold">Class</TableHead>
                      <TableHead className="font-bold">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commonMaterials.map((mat, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                        <TableCell className="font-medium">{mat.material}</TableCell>
                        <TableCell className="font-mono text-sm">{mat.fsr}</TableCell>
                        <TableCell className="font-mono text-sm">{mat.sdr}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              mat.class === "A" ? "bg-green-100 text-green-800 border-green-300" :
                              mat.class === "A-B" ? "bg-teal-100 text-teal-800 border-teal-300" :
                              mat.class === "B" ? "bg-blue-100 text-blue-800 border-blue-300" :
                              mat.class === "B-C" ? "bg-cyan-100 text-cyan-800 border-cyan-300" :
                              mat.class === "C" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                              "bg-red-100 text-red-800 border-red-300"
                            }
                          >
                            {mat.class}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{mat.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Note: FSR values are approximate and can vary by manufacturer, treatment, and testing conditions.
                Always verify with manufacturer's test reports.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="special-requirements" className="border rounded-md mb-2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Special Requirements & Exceptions
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Foam Plastic Insulation (NBC 3.1.5.12)</h4>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Must be protected by a <strong>thermal barrier</strong> with 15-minute fire resistance</li>
                  <li>Acceptable barriers: 12.7mm gypsum board, 38mm concrete/masonry</li>
                  <li>Spray foam in attics requires ignition barrier (NBC 3.1.5.12.(3))</li>
                  <li>Exceptions for certain factory-assembled products with fire testing</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Exterior Cladding (NBC 3.1.5.5)</h4>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Buildings &gt; 3 storeys: cladding must have FSR ≤ 25 or be non-combustible</li>
                  <li>Combustible cladding may be permitted with fire stops and sprinklers</li>
                  <li>EIFS systems require specific testing per CAN/ULC-S134</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Sprinklered Buildings (NBC 3.1.13.7)</h4>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>FSR limits may be increased by 25 in sprinklered buildings</li>
                  <li>Does not apply to exit stairways and vertical shafts</li>
                  <li>Smoke developed rating limits remain unchanged</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Fire-Retardant Treated Wood (NBC 3.1.13.6)</h4>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Must be pressure-treated per CSA O80 Series</li>
                  <li>Surface treatments alone do not qualify</li>
                  <li>Must maintain FSR ≤ 25 after exposure to weather/humidity</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="testing-standards" className="border rounded-md">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Testing Standards & Documentation
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Accepted Test Standards</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Standard</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">CAN/ULC-S102</TableCell>
                      <TableCell>Surface Burning Characteristics of Building Materials</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">ASTM E84</TableCell>
                      <TableCell>Standard Test Method for Surface Burning (Steiner Tunnel)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">CAN/ULC-S102.2</TableCell>
                      <TableCell>Surface Burning of Flooring Materials</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">CAN/ULC-S134</TableCell>
                      <TableCell>Fire Test of Exterior Wall Assemblies</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Documentation Required:</strong> Manufacturers must provide test reports from 
                  accredited laboratories (e.g., ULC, Intertek, QAI) showing FSR and SDR values. 
                  Generic material classifications are not acceptable for permit applications.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Code Reference Footer */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-4">
          <p className="text-xs text-gray-600">
            <strong>Primary Code References:</strong> NBC 3.1.13 (Interior Finish), NBC 3.1.5.5 (Exterior Cladding), 
            NBC 3.1.5.12 (Foam Plastics), NBC 9.10.15 (Part 9 Buildings). 
            Always verify requirements with the applicable edition of the National Building Code and local amendments.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default FlameSpreadRatingSection;
