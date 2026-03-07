import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, Users, Info, AlertTriangle, CheckCircle2, Droplets, GlassWater, Bath, ShowerHead, Wrench, FileText, Download } from "lucide-react";
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
  | "residential"
  | "care_treatment"
  | "detention";

interface OccupancyConfig {
  name: string;
  description: string;
  wcCodeReference: string;
  lavCodeReference: string;
  dfCodeReference: string;
  showerCodeReference?: string;
  serviceSinkCodeReference?: string;
  maleRatio?: number;
  femaleRatio?: number;
  lavRatio?: number;
  dfRatio?: number;
  dfFloorAreaRatio?: number;
  useAssemblyTable?: boolean;
  allowUrinalSubstitution?: boolean;
  requiresShowers?: boolean;
  showerRatio?: number;
  requiresServiceSink?: boolean;
  serviceSinkFloorAreaRatio?: number;
  specialNote?: string;
}

const occupancyConfigs: Record<OccupancyType, OccupancyConfig> = {
  assembly: {
    name: "Assembly Occupancy (A-1, A-2, A-3, A-4)",
    description: "Theatres, restaurants, arenas, stadiums, and other assembly spaces",
    wcCodeReference: "NBC 3.7.2.2.(4), Table 3.7.2.2.-A",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    useAssemblyTable: true,
    allowUrinalSubstitution: true,
    lavRatio: 75,
    dfRatio: 150,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 500,
  },
  primary_school: {
    name: "Primary Schools",
    description: "Elementary schools",
    wcCodeReference: "NBC 3.7.2.2.(5)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    showerCodeReference: "NBC 3.7.2.6.(2)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 30,
    femaleRatio: 25,
    allowUrinalSubstitution: false,
    lavRatio: 30,
    dfRatio: 75,
    requiresShowers: true,
    showerRatio: 30,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 500,
    specialNote: "At least one WC for each 30 males and one for each 25 females",
  },
  daycare: {
    name: "Daycare Centres",
    description: "Licensed daycare and childcare facilities",
    wcCodeReference: "NBC 3.7.2.2.(5)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 30,
    femaleRatio: 25,
    allowUrinalSubstitution: false,
    lavRatio: 30,
    dfRatio: 75,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 500,
    specialNote: "At least one WC for each 30 males and one for each 25 females",
  },
  worship: {
    name: "Places of Worship",
    description: "Churches, mosques, temples, synagogues",
    wcCodeReference: "NBC 3.7.2.2.(6)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 150,
    femaleRatio: 150,
    allowUrinalSubstitution: true,
    lavRatio: 200,
    dfRatio: 500,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 1000,
    specialNote: "At least one WC for each 150 persons of each sex",
  },
  undertaking: {
    name: "Undertaking Premises",
    description: "Funeral homes and related facilities",
    wcCodeReference: "NBC 3.7.2.2.(6)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 150,
    femaleRatio: 150,
    allowUrinalSubstitution: true,
    lavRatio: 200,
    dfRatio: 500,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 500,
    specialNote: "At least one WC for each 150 persons of each sex",
  },
  business: {
    name: "Business & Personal Services (D)",
    description: "Offices, banks, professional services",
    wcCodeReference: "NBC 3.7.2.2.(8)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 25,
    femaleRatio: 25,
    allowUrinalSubstitution: true,
    lavRatio: 40,
    dfRatio: 100,
    dfFloorAreaRatio: 500,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 500,
    specialNote: "At least one WC for each 25 persons of each sex",
  },
  mercantile: {
    name: "Mercantile (E)",
    description: "Retail stores, shopping centres, markets",
    wcCodeReference: "NBC 3.7.2.2.(8)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 25,
    femaleRatio: 25,
    allowUrinalSubstitution: true,
    lavRatio: 40,
    dfRatio: 100,
    dfFloorAreaRatio: 500,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 500,
    specialNote: "At least one WC for each 25 persons of each sex",
  },
  industrial: {
    name: "Industrial (F-1, F-2, F-3)",
    description: "Factories, warehouses, manufacturing",
    wcCodeReference: "NBC 3.7.2.2.(8)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    showerCodeReference: "NBC 3.7.2.6.(3)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 25,
    femaleRatio: 25,
    allowUrinalSubstitution: true,
    lavRatio: 40,
    dfRatio: 100,
    dfFloorAreaRatio: 500,
    requiresShowers: true,
    showerRatio: 15,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 500,
    specialNote: "At least one WC for each 25 persons of each sex. Showers required where workers are exposed to excessive heat, skin contamination, or physical exertion.",
  },
  residential: {
    name: "Residential (C)",
    description: "Apartments, hotels, dormitories",
    wcCodeReference: "NBC 3.7.2.2.(2)",
    lavCodeReference: "NBC 3.7.2.4.(2)",
    dfCodeReference: "NBC 3.7.2.5.(2)",
    showerCodeReference: "NBC 3.7.2.6.(1)",
    allowUrinalSubstitution: false,
    requiresShowers: true,
    specialNote: "Each dwelling unit requires at least one water closet, lavatory, and bathtub or shower",
  },
  care_treatment: {
    name: "Care & Treatment (B-2)",
    description: "Hospitals, nursing homes, care facilities",
    wcCodeReference: "NBC 3.7.2.2.(7)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    showerCodeReference: "NBC 3.7.2.6.(4)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 10,
    femaleRatio: 10,
    allowUrinalSubstitution: false,
    lavRatio: 10,
    dfRatio: 50,
    requiresShowers: true,
    showerRatio: 20,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 300,
    specialNote: "Based on patient/resident capacity. Fixtures determined by special needs of occupancy.",
  },
  detention: {
    name: "Detention (B-1)",
    description: "Jails, prisons, detention centres",
    wcCodeReference: "NBC 3.7.2.2.(7)",
    lavCodeReference: "NBC 3.7.2.4.(1)",
    dfCodeReference: "NBC 3.7.2.5.(1)",
    showerCodeReference: "NBC 3.7.2.6.(4)",
    serviceSinkCodeReference: "NBC 3.7.2.7",
    maleRatio: 8,
    femaleRatio: 8,
    allowUrinalSubstitution: false,
    lavRatio: 8,
    dfRatio: 25,
    requiresShowers: true,
    showerRatio: 8,
    requiresServiceSink: true,
    serviceSinkFloorAreaRatio: 300,
    specialNote: "Based on inmate capacity. Fixtures determined by special needs of occupancy.",
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
// FIXTURE SCHEDULE PDF GENERATOR
// ============================================

interface FixtureScheduleData {
  projectName: string;
  occupancyType: string;
  maleOccupants: number;
  femaleOccupants: number;
  totalOccupants: number;
  floorArea: number;
  maleWC: number;
  femaleWC: number;
  urinals: number;
  lavatories: number;
  drinkingFountains: number;
  showers: number;
  bathtubs: number;
  serviceSinks: number;
  codeReferences: string[];
}

function generateFixtureSchedulePDF(data: FixtureScheduleData): void {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the fixture schedule PDF');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Plumbing Fixture Schedule - ${data.projectName || 'Project'}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e3a8a;
      margin: 0;
      font-size: 24px;
    }
    .header p {
      color: #666;
      margin: 5px 0 0;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      background: #1e3a8a;
      color: white;
      padding: 8px 15px;
      font-weight: bold;
      margin-bottom: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
    .fixture-row td:first-child {
      font-weight: bold;
    }
    .fixture-count {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      color: #1e3a8a;
    }
    .total-row {
      background: #e8f4f8;
      font-weight: bold;
    }
    .code-refs {
      background: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #1e3a8a;
      margin-top: 20px;
    }
    .code-refs h3 {
      margin: 0 0 10px;
      color: #1e3a8a;
    }
    .code-refs ul {
      margin: 0;
      padding-left: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .stamp-area {
      border: 2px dashed #ccc;
      padding: 40px;
      margin-top: 30px;
      text-align: center;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PLUMBING FIXTURE SCHEDULE</h1>
    <p>National Building Code of Canada - Section 3.7.2</p>
    <p>Generated: ${new Date().toLocaleDateString('en-CA')}</p>
  </div>

  <div class="section">
    <div class="section-title">PROJECT INFORMATION</div>
    <table>
      <tr>
        <th>Project Name</th>
        <td>${data.projectName || 'Not specified'}</td>
      </tr>
      <tr>
        <th>Occupancy Classification</th>
        <td>${data.occupancyType}</td>
      </tr>
      <tr>
        <th>Male Occupants</th>
        <td>${data.maleOccupants}</td>
      </tr>
      <tr>
        <th>Female Occupants</th>
        <td>${data.femaleOccupants}</td>
      </tr>
      <tr>
        <th>Total Occupants</th>
        <td>${data.totalOccupants}</td>
      </tr>
      <tr>
        <th>Floor Area</th>
        <td>${data.floorArea > 0 ? data.floorArea + ' m²' : 'Not specified'}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">REQUIRED PLUMBING FIXTURES</div>
    <table>
      <thead>
        <tr>
          <th>Fixture Type</th>
          <th>Male</th>
          <th>Female</th>
          <th>Total Required</th>
        </tr>
      </thead>
      <tbody>
        <tr class="fixture-row">
          <td>Water Closets</td>
          <td class="fixture-count">${data.maleWC}</td>
          <td class="fixture-count">${data.femaleWC}</td>
          <td class="fixture-count">${data.maleWC + data.femaleWC}</td>
        </tr>
        ${data.urinals > 0 ? `
        <tr class="fixture-row">
          <td>Urinals (substitution)</td>
          <td class="fixture-count">${data.urinals}</td>
          <td class="fixture-count">-</td>
          <td class="fixture-count">${data.urinals}</td>
        </tr>
        ` : ''}
        <tr class="fixture-row">
          <td>Lavatories</td>
          <td class="fixture-count" colspan="2">Shared</td>
          <td class="fixture-count">${data.lavatories}</td>
        </tr>
        <tr class="fixture-row">
          <td>Drinking Fountains</td>
          <td class="fixture-count" colspan="2">Shared</td>
          <td class="fixture-count">${data.drinkingFountains}</td>
        </tr>
        ${data.showers > 0 ? `
        <tr class="fixture-row">
          <td>Showers</td>
          <td class="fixture-count" colspan="2">As required</td>
          <td class="fixture-count">${data.showers}</td>
        </tr>
        ` : ''}
        ${data.bathtubs > 0 ? `
        <tr class="fixture-row">
          <td>Bathtubs</td>
          <td class="fixture-count" colspan="2">Per dwelling unit</td>
          <td class="fixture-count">${data.bathtubs}</td>
        </tr>
        ` : ''}
        ${data.serviceSinks > 0 ? `
        <tr class="fixture-row">
          <td>Service Sinks</td>
          <td class="fixture-count" colspan="2">Per floor/area</td>
          <td class="fixture-count">${data.serviceSinks}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  </div>

  <div class="code-refs">
    <h3>NBC Code References</h3>
    <ul>
      ${data.codeReferences.map(ref => `<li>${ref}</li>`).join('')}
    </ul>
  </div>

  <div class="stamp-area">
    <p>PROFESSIONAL SEAL / STAMP AREA</p>
    <p style="font-size: 10px;">This fixture schedule is for reference only. Final design must be reviewed and stamped by a licensed professional.</p>
  </div>

  <div class="footer">
    <p>Generated by Building Code Occupancy Classifier | Based on National Building Code of Canada</p>
    <p>This document is for reference purposes only. Verify all requirements with local authorities having jurisdiction.</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
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
  const [dwellingUnits, setDwellingUnits] = useState<string>("");
  const [numFloors, setNumFloors] = useState<string>("1");
  const [projectName, setProjectName] = useState<string>("");
  const [requiresShowers, setRequiresShowers] = useState(false);

  const config = occupancyConfigs[occupancyType];

  const results = useMemo(() => {
    const males = parseInt(maleCount) || 0;
    const females = parseInt(femaleCount) || 0;
    const area = parseFloat(floorArea) || 0;
    const urinals = parseInt(urinalCount) || 0;
    const units = parseInt(dwellingUnits) || 0;
    const floors = parseInt(numFloors) || 1;
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
    let maxUrinalSubstitution = 0;
    let actualUrinalSubstitution = 0;
    let adjustedMaleWC = maleWC;

    if (config.allowUrinalSubstitution && useUrinals && maleWC > 0) {
      maxUrinalSubstitution = Math.floor((maleWC * 2) / 3);
      actualUrinalSubstitution = Math.min(urinals, maxUrinalSubstitution);
      adjustedMaleWC = maleWC - actualUrinalSubstitution;
      if (adjustedMaleWC < 1 && maleWC >= 1) {
        adjustedMaleWC = 1;
        actualUrinalSubstitution = maleWC - 1;
      }
    }

    // Calculate Lavatories (NBC 3.7.2.4)
    let lavatories = 0;
    if (config.lavRatio) {
      lavatories = Math.max(1, Math.ceil(totalOccupants / config.lavRatio));
    } else if (occupancyType === "residential") {
      lavatories = units;
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

    // Calculate Showers (NBC 3.7.2.6)
    let showers = 0;
    let bathtubs = 0;
    if (config.requiresShowers) {
      if (occupancyType === "residential") {
        // Each dwelling unit requires at least one bathtub or shower
        bathtubs = units;
        showers = 0; // Or can be showers instead
      } else if (config.showerRatio && requiresShowers) {
        showers = Math.ceil(totalOccupants / config.showerRatio);
      }
    }

    // Calculate Service Sinks (NBC 3.7.2.7)
    let serviceSinks = 0;
    if (config.requiresServiceSink && config.serviceSinkFloorAreaRatio && area > 0) {
      // At least one per floor, plus additional based on floor area
      const byArea = Math.ceil(area / config.serviceSinkFloorAreaRatio);
      serviceSinks = Math.max(floors, byArea);
    } else if (config.requiresServiceSink && floors > 0) {
      serviceSinks = floors; // Minimum one per floor
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
      showers,
      bathtubs,
      serviceSinks,
      maleCount: males,
      femaleCount: females,
      totalOccupants,
      floorArea: area,
      dwellingUnits: units,
      numFloors: floors,
    };
  }, [maleCount, femaleCount, floorArea, useUrinals, urinalCount, dwellingUnits, numFloors, requiresShowers, config, occupancyType]);

  const hasInput = results.maleCount > 0 || results.femaleCount > 0 || results.dwellingUnits > 0;

  const handleGenerateSchedule = () => {
    const codeRefs: string[] = [
      config.wcCodeReference,
      config.lavCodeReference,
      config.dfCodeReference,
    ];
    if (config.showerCodeReference) codeRefs.push(config.showerCodeReference);
    if (config.serviceSinkCodeReference) codeRefs.push(config.serviceSinkCodeReference);
    codeRefs.push("NBC 3.7.2.3 - Urinal Substitution");

    generateFixtureSchedulePDF({
      projectName,
      occupancyType: config.name,
      maleOccupants: results.maleCount,
      femaleOccupants: results.femaleCount,
      totalOccupants: results.totalOccupants,
      floorArea: results.floorArea,
      maleWC: useUrinals ? results.adjustedMaleWC : results.maleWC,
      femaleWC: results.femaleWC,
      urinals: results.actualUrinalSubstitution,
      lavatories: results.lavatories,
      drinkingFountains: results.drinkingFountains,
      showers: results.showers,
      bathtubs: results.bathtubs,
      serviceSinks: results.serviceSinks,
      codeReferences: codeRefs,
    });
  };

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
        {/* Project Name for PDF */}
        <div className="space-y-2">
          <Label htmlFor="project-name-plumbing" className="text-sm font-semibold">
            Project Name (for fixture schedule)
          </Label>
          <Input
            id="project-name-plumbing"
            type="text"
            placeholder="Enter project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

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
              <SelectItem value="care_treatment">Care & Treatment (B-2)</SelectItem>
              <SelectItem value="detention">Detention (B-1)</SelectItem>
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
          {config.showerCodeReference && (
            <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
              Shower: {config.showerCodeReference}
            </Badge>
          )}
          {config.serviceSinkCodeReference && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
              Service: {config.serviceSinkCodeReference}
            </Badge>
          )}
        </div>

        {config.specialNote && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-cyan-200 pl-2">
            {config.specialNote}
          </p>
        )}

        {/* Special handling for residential */}
        {occupancyType === "residential" ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Residential Requirements</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Each dwelling unit requires at least one water closet, one lavatory, and one bathtub or shower.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dwelling-units" className="text-sm font-semibold">
                  Number of Dwelling Units
                </Label>
                <Input
                  id="dwelling-units"
                  type="number"
                  min="1"
                  placeholder="Enter number of units"
                  value={dwellingUnits}
                  onChange={(e) => setDwellingUnits(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num-floors-res" className="text-sm font-semibold">
                  Number of Floors
                </Label>
                <Input
                  id="num-floors-res"
                  type="number"
                  min="1"
                  placeholder="Enter number of floors"
                  value={numFloors}
                  onChange={(e) => setNumFloors(e.target.value)}
                />
              </div>
            </div>
            {results.dwellingUnits > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Required Fixtures per NBC 3.7.2
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-md border">
                    <Droplets className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-2xl font-bold text-blue-600">{results.dwellingUnits}</p>
                    <p className="text-xs text-muted-foreground">Water Closets</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-md border">
                    <GlassWater className="w-6 h-6 mx-auto text-green-600 mb-1" />
                    <p className="text-2xl font-bold text-green-600">{results.lavatories}</p>
                    <p className="text-xs text-muted-foreground">Lavatories</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-md border">
                    <Bath className="w-6 h-6 mx-auto text-cyan-600 mb-1" />
                    <p className="text-2xl font-bold text-cyan-600">{results.bathtubs}</p>
                    <p className="text-xs text-muted-foreground">Bathtubs/Showers</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label htmlFor="floor-area-plumbing" className="text-sm font-semibold">
                  Floor Area (m²)
                </Label>
                <Input
                  id="floor-area-plumbing"
                  type="number"
                  min="0"
                  placeholder="Enter area"
                  value={floorArea}
                  onChange={(e) => setFloorArea(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num-floors" className="text-sm font-semibold">
                  Number of Floors
                </Label>
                <Input
                  id="num-floors"
                  type="number"
                  min="1"
                  placeholder="Enter floors"
                  value={numFloors}
                  onChange={(e) => setNumFloors(e.target.value)}
                />
              </div>
            </div>

            {/* Urinal Substitution Option */}
            {config.allowUrinalSubstitution && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="use-urinals"
                    checked={useUrinals}
                    onCheckedChange={(checked) => setUseUrinals(checked === true)}
                  />
                  <Label htmlFor="use-urinals" className="text-sm font-medium cursor-pointer">
                    Apply urinal substitution (NBC 3.7.2.3)
                  </Label>
                </div>
                {useUrinals && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="urinal-count" className="text-sm">
                      Number of urinals to install
                    </Label>
                    <Input
                      id="urinal-count"
                      type="number"
                      min="0"
                      max={results.maxUrinalSubstitution}
                      placeholder={`Max ${results.maxUrinalSubstitution}`}
                      value={urinalCount}
                      onChange={(e) => setUrinalCount(e.target.value)}
                      className="w-32"
                    />
                    <p className="text-xs text-blue-700">
                      Up to {results.maxUrinalSubstitution} urinals may substitute for male WC
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Shower Requirements Option */}
            {config.requiresShowers && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-md p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="requires-showers"
                    checked={requiresShowers}
                    onCheckedChange={(checked) => setRequiresShowers(checked === true)}
                  />
                  <Label htmlFor="requires-showers" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <ShowerHead className="w-4 h-4 text-cyan-600" />
                    Calculate shower requirements ({config.showerCodeReference})
                  </Label>
                </div>
                {requiresShowers && config.showerRatio && (
                  <p className="text-xs text-cyan-700 pl-6">
                    Showers required at ratio of 1 per {config.showerRatio} occupants for this occupancy type
                  </p>
                )}
              </div>
            )}

            {/* Results */}
            {hasInput && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Required Fixtures per NBC 3.7.2
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                  {/* Male WC */}
                  <div className="text-center p-3 bg-white rounded-md border">
                    <Droplets className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                    <p className="text-xl font-bold text-blue-600">
                      {useUrinals ? results.adjustedMaleWC : results.maleWC}
                    </p>
                    <p className="text-xs text-muted-foreground">Male WC</p>
                  </div>
                  
                  {/* Female WC */}
                  <div className="text-center p-3 bg-white rounded-md border">
                    <Droplets className="w-5 h-5 mx-auto text-pink-600 mb-1" />
                    <p className="text-xl font-bold text-pink-600">{results.femaleWC}</p>
                    <p className="text-xs text-muted-foreground">Female WC</p>
                  </div>
                  
                  {/* Urinals */}
                  {useUrinals && results.actualUrinalSubstitution > 0 && (
                    <div className="text-center p-3 bg-white rounded-md border">
                      <Droplets className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                      <p className="text-xl font-bold text-indigo-600">{results.actualUrinalSubstitution}</p>
                      <p className="text-xs text-muted-foreground">Urinals</p>
                    </div>
                  )}
                  
                  {/* Lavatories */}
                  <div className="text-center p-3 bg-white rounded-md border">
                    <GlassWater className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-xl font-bold text-green-600">{results.lavatories}</p>
                    <p className="text-xs text-muted-foreground">Lavatories</p>
                  </div>
                  
                  {/* Drinking Fountains */}
                  <div className="text-center p-3 bg-white rounded-md border">
                    <GlassWater className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                    <p className="text-xl font-bold text-purple-600">{results.drinkingFountains}</p>
                    <p className="text-xs text-muted-foreground">Drinking Fountains</p>
                  </div>
                  
                  {/* Showers */}
                  {requiresShowers && results.showers > 0 && (
                    <div className="text-center p-3 bg-white rounded-md border">
                      <ShowerHead className="w-5 h-5 mx-auto text-cyan-600 mb-1" />
                      <p className="text-xl font-bold text-cyan-600">{results.showers}</p>
                      <p className="text-xs text-muted-foreground">Showers</p>
                    </div>
                  )}
                  
                  {/* Service Sinks */}
                  {results.serviceSinks > 0 && (
                    <div className="text-center p-3 bg-white rounded-md border">
                      <Wrench className="w-5 h-5 mx-auto text-orange-600 mb-1" />
                      <p className="text-xl font-bold text-orange-600">{results.serviceSinks}</p>
                      <p className="text-xs text-muted-foreground">Service Sinks</p>
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                <div className="bg-white rounded-md border p-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Water Closets:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {useUrinals ? results.adjustedTotalWC : results.totalWC}
                      {useUrinals && results.actualUrinalSubstitution > 0 && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          (+ {results.actualUrinalSubstitution} urinals)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Generate Fixture Schedule Button */}
                <Button
                  onClick={handleGenerateSchedule}
                  className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Printable Fixture Schedule
                </Button>
              </div>
            )}
          </>
        )}

        {/* Generate Schedule for Residential */}
        {occupancyType === "residential" && results.dwellingUnits > 0 && (
          <Button
            onClick={handleGenerateSchedule}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Printable Fixture Schedule
          </Button>
        )}

        {/* NBC Reference Accordion */}
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="assembly-table" className="border rounded-md mb-2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" />
                NBC Table 3.7.2.2.-A - Assembly Occupancy WC Requirements
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
                <li><strong>Not applicable:</strong> Primary schools, daycare centres, residential, care/treatment, and detention occupancies</li>
              </ul>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Example:</strong> If 6 male WC are required, up to 4 urinals may substitute, leaving minimum 2 WC.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="shower-rules" className="border rounded-md mb-2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <ShowerHead className="w-4 h-4" />
                NBC 3.7.2.6 - Shower & Bathtub Requirements
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              <p className="text-sm">
                Showers and bathtubs shall be provided based on occupancy type:
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Occupancy Type</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Code Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Residential (C)</TableCell>
                    <TableCell>1 bathtub or shower per dwelling unit</TableCell>
                    <TableCell>NBC 3.7.2.6.(1)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Primary Schools</TableCell>
                    <TableCell>1 per 30 students (gymnasium/sports facilities)</TableCell>
                    <TableCell>NBC 3.7.2.6.(2)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Industrial (F)</TableCell>
                    <TableCell>1 per 15 workers exposed to heat/contamination</TableCell>
                    <TableCell>NBC 3.7.2.6.(3)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Care/Treatment (B-2)</TableCell>
                    <TableCell>1 per 20 patients/residents</TableCell>
                    <TableCell>NBC 3.7.2.6.(4)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Detention (B-1)</TableCell>
                    <TableCell>1 per 8 inmates</TableCell>
                    <TableCell>NBC 3.7.2.6.(4)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="bg-cyan-50 p-3 rounded-md">
                <p className="text-xs text-cyan-800">
                  <strong>Note:</strong> Showers in industrial occupancies are required where workers are exposed to excessive heat, skin contamination, or physical exertion. At least one shower must be barrier-free per NBC 3.8.2.8.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="service-sink-rules" className="border rounded-md mb-2">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                NBC 3.7.2.7 - Service Sink Requirements
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              <p className="text-sm">
                Service sinks (janitor sinks/mop sinks) shall be provided for building maintenance:
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Occupancy Type</TableHead>
                    <TableHead>Minimum Requirement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Assembly (A)</TableCell>
                    <TableCell>1 per 500 m² or 1 per floor, whichever is greater</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Business (D)</TableCell>
                    <TableCell>1 per 500 m² or 1 per floor, whichever is greater</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mercantile (E)</TableCell>
                    <TableCell>1 per 500 m² or 1 per floor, whichever is greater</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Industrial (F)</TableCell>
                    <TableCell>1 per 500 m² or 1 per floor, whichever is greater</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Care/Treatment (B-2)</TableCell>
                    <TableCell>1 per 300 m² or 1 per floor, whichever is greater</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Places of Worship</TableCell>
                    <TableCell>1 per 1000 m² or 1 per floor, whichever is greater</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="bg-orange-50 p-3 rounded-md">
                <p className="text-xs text-orange-800">
                  <strong>Note:</strong> Service sinks must be located in a janitor's closet or service room with adequate ventilation. Hot and cold water supply required.
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
                    <TableCell>Care / Treatment (B-2)</TableCell>
                    <TableCell>1 per 10 patients</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Detention (B-1)</TableCell>
                    <TableCell>1 per 8 inmates</TableCell>
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
                  <TableRow>
                    <TableCell>Care / Treatment (B-2)</TableCell>
                    <TableCell>1 per 50 persons</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Detention (B-1)</TableCell>
                    <TableCell>1 per 25 inmates</TableCell>
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
