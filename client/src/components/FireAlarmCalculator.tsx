import { useState } from "react";
import { SaveButton } from "@/components/CalculatorWithSave";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, AlertCircle, Download } from "lucide-react";
import { exportFireAlarmToExcel } from "@/lib/excelExport";
import { trpc } from "@/lib/trpc";

const triState = (value: string): boolean | null => value === "yes" ? true : value === "no" ? false : null;

function FlagSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="rounded-none"><SelectValue placeholder="Unknown / not provided" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="unknown">Unknown / not provided</SelectItem>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// NBC Part 3.2.4.1 — determination is performed by the canonical server rule.
export function FireAlarmCalculator() {
  const [occupancy, setOccupancy] = useState("");
  const [buildingHeight, setBuildingHeight] = useState("");
  const [storeys, setStoreys] = useState("");
  const [floorArea, setFloorArea] = useState("");
  const [occupantLoad, setOccupantLoad] = useState("");
  const [sprinklered, setSprinklered] = useState("unknown");
  const [sprinklerSystemType, setSprinklerSystemType] = useState("unknown");
  const [sprinklerCount, setSprinklerCount] = useState("");
  const [containedUseArea, setContainedUseArea] = useState("unknown");
  const [impededEgressZone, setImpededEgressZone] = useState("unknown");
  const [schoolChildcare, setSchoolChildcare] = useState("unknown");
  const [licensedEstablishment, setLicensedEstablishment] = useState("unknown");
  const [storageGarageOnly, setStorageGarageOnly] = useState("unknown");
  const [suiteCount, setSuiteCount] = useState("");
  const [directExteriorEgress, setDirectExteriorEgress] = useState("unknown");
  const [sleepingCapacity, setSleepingCapacity] = useState("");
  const [bedroomCount, setBedroomCount] = useState("");

  const occupantLoadNum = parseFloat(occupantLoad);
  const storeysNum = parseInt(storeys, 10);
  const sprinklerCountNum = parseFloat(sprinklerCount);
  const suiteCountNum = parseInt(suiteCount, 10);
  const sleepingCapacityNum = parseFloat(sleepingCapacity);
  const bedroomCountNum = parseInt(bedroomCount, 10);
  const queryEnabled = !!occupancy && occupantLoad.trim() !== "" && Number.isFinite(occupantLoadNum);

  const { data: determination } = trpc.calculationsPackage.determineFireAlarm.useQuery({
    occupancyGroup: occupancy,
    occupantLoad: Number.isFinite(occupantLoadNum) ? occupantLoadNum : 0,
    storeys: Number.isFinite(storeysNum) && storeysNum > 0 ? storeysNum : null,
    sprinklered: triState(sprinklered),
    containedUseArea: triState(containedUseArea),
    impededEgressZone: triState(impededEgressZone),
    isSchoolCollegeChildcare: triState(schoolChildcare),
    isLicensedBeverageOrRestaurant: triState(licensedEstablishment),
    isStorageGarageOnly: triState(storageGarageOnly),
    sprinklerSystemType: sprinklerSystemType === "unknown" ? null : sprinklerSystemType as "standard" | "nfpa13d",
    sprinklerCount: Number.isFinite(sprinklerCountNum) ? sprinklerCountNum : null,
    residentialSuiteCount: Number.isFinite(suiteCountNum) && suiteCountNum >= 0 ? suiteCountNum : null,
    residentialDirectExteriorEgress: triState(directExteriorEgress),
    residentialSleepingCapacity: Number.isFinite(sleepingCapacityNum) ? sleepingCapacityNum : null,
    bedroomCount: Number.isFinite(bedroomCountNum) && bedroomCountNum >= 0 ? bedroomCountNum : null,
    // These niche Sentence (4)(e)/(l) inputs remain unknown unless supplied by a future project-level flow.
    occupantLoadAboveBelowFirstStorey: null,
    openAirSeatingBelowLoad: null,
  }, { enabled: queryEnabled });

  const required = determination?.required;
  const systemRequired = required === "required";
  const result = {
    systemRequired,
    systemType: systemRequired ? "Fire alarm system" : "Not required / verify",
    detectionRequired: false,
    voiceCommunication: false,
    requirements: determination ? [determination.reasoning, ...determination.caveats] : [],
    nbcReferences: determination ? [determination.rule] : [],
  };
  const hasResult = queryEnabled && !!determination;

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Bell className="w-4 h-4 text-destructive" /> Fire Alarm System Calculator</CardTitle>
        <CardDescription className="text-xs mt-1">Determine fire alarm requirements from NBC 2020 Article 3.2.4.1</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupancy" className="text-xs font-medium">Occupancy Classification</Label>
              <Select value={occupancy} onValueChange={setOccupancy}><SelectTrigger id="occupancy" className="rounded-none"><SelectValue placeholder="Select occupancy" /></SelectTrigger><SelectContent>
                <SelectItem value="A-1">A-1 - Assembly</SelectItem><SelectItem value="A-2">A-2 - Assembly</SelectItem><SelectItem value="A-3">A-3 - Assembly</SelectItem>
                <SelectItem value="B-1">B-1 - Institutional</SelectItem><SelectItem value="B-2">B-2 - Institutional</SelectItem><SelectItem value="B-3">B-3 - Institutional</SelectItem>
                <SelectItem value="C">C - Residential</SelectItem><SelectItem value="D">D - Business &amp; Personal Services</SelectItem><SelectItem value="E">E - Mercantile</SelectItem>
                <SelectItem value="F-1">F-1 - Industrial (High Hazard)</SelectItem><SelectItem value="F-2">F-2 - Industrial (Medium Hazard)</SelectItem><SelectItem value="F-3">F-3 - Industrial (Low Hazard)</SelectItem>
              </SelectContent></Select>
            </div>
            <div className="space-y-2"><Label htmlFor="occupantLoad" className="text-xs font-medium">Total Occupant Load (persons)</Label><Input id="occupantLoad" type="number" min="0" value={occupantLoad} onChange={(e) => setOccupantLoad(e.target.value)} placeholder="e.g., 250" className="rounded-none" /></div>
            <div className="space-y-2"><Label htmlFor="storeys" className="text-xs font-medium">Storeys</Label><Input id="storeys" type="number" min="1" step="1" value={storeys} onChange={(e) => setStoreys(e.target.value)} placeholder="Required for the >3 storey test" className="rounded-none" /></div>
            <div className="space-y-2"><Label htmlFor="buildingHeight" className="text-xs font-medium">Building Height (m, informational)</Label><Input id="buildingHeight" type="number" min="0" step="0.1" value={buildingHeight} onChange={(e) => setBuildingHeight(e.target.value)} placeholder="Optional" className="rounded-none" /></div>
            <div className="space-y-2"><Label htmlFor="floorArea" className="text-xs font-medium">Floor Area (m², informational)</Label><Input id="floorArea" type="number" min="0" value={floorArea} onChange={(e) => setFloorArea(e.target.value)} placeholder="Optional" className="rounded-none" /></div>
          </div>

          <section className="space-y-4 border rounded-lg p-4"><h3 className="text-xs font-bold uppercase tracking-wider">Sprinkler details</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FlagSelect id="sprinklered" label="Automatic sprinkler system installed throughout?" value={sprinklered} onChange={setSprinklered} />
            <div className="space-y-2"><Label htmlFor="sprinklerSystemType" className="text-xs font-medium">Sprinkler system type</Label><Select value={sprinklerSystemType} onValueChange={setSprinklerSystemType}><SelectTrigger id="sprinklerSystemType" className="rounded-none"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unknown">Unknown / not provided</SelectItem><SelectItem value="standard">Standard / other</SelectItem><SelectItem value="nfpa13d">NFPA 13D</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="sprinklerCount" className="text-xs font-medium">Qualifying sprinkler count</Label><Input id="sprinklerCount" type="number" min="0" value={sprinklerCount} onChange={(e) => setSprinklerCount(e.target.value)} placeholder="Optional" className="rounded-none" /></div>
          </div></section>

          <section className="space-y-4 border rounded-lg p-4"><h3 className="text-xs font-bold uppercase tracking-wider">Occupancy-specific conditions</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FlagSelect id="containedUseArea" label="Contained-use area?" value={containedUseArea} onChange={setContainedUseArea} />
            <FlagSelect id="impededEgressZone" label="Impeded-egress zone?" value={impededEgressZone} onChange={setImpededEgressZone} />
            <FlagSelect id="schoolChildcare" label="School, college, or child-care facility?" value={schoolChildcare} onChange={setSchoolChildcare} />
            <FlagSelect id="licensedEstablishment" label="Licensed beverage establishment or restaurant?" value={licensedEstablishment} onChange={setLicensedEstablishment} />
            <FlagSelect id="storageGarageOnly" label="Storage garage only, with no other occupancy?" value={storageGarageOnly} onChange={setStorageGarageOnly} />
          </div></section>

          {occupancy === "C" && <section className="space-y-4 border rounded-lg p-4"><h3 className="text-xs font-bold uppercase tracking-wider">Residential information</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="sleepingCapacity" className="text-xs font-medium">Sleeping accommodation capacity</Label><Input id="sleepingCapacity" type="number" min="0" value={sleepingCapacity} onChange={(e) => setSleepingCapacity(e.target.value)} placeholder="More than 10 triggers Sentence (4)(j)" className="rounded-none" /></div>
            <div className="space-y-2"><Label htmlFor="bedroomCount" className="text-xs font-medium">Bedroom count fallback</Label><Input id="bedroomCount" type="number" min="0" step="1" value={bedroomCount} onChange={(e) => setBedroomCount(e.target.value)} placeholder="Approximation only" className="rounded-none" /></div>
            <div className="space-y-2"><Label htmlFor="suiteCount" className="text-xs font-medium">Residential suite count</Label><Input id="suiteCount" type="number" min="0" step="1" value={suiteCount} onChange={(e) => setSuiteCount(e.target.value)} placeholder="For Sentence (5)(a)" className="rounded-none" /></div>
            <FlagSelect id="directExteriorEgress" label="Each suite has direct exterior exit to ground level?" value={directExteriorEgress} onChange={setDirectExteriorEgress} />
          </div></section>}

          {hasResult && <><div className={`p-4 border-l-4 ${systemRequired ? "border-destructive bg-destructive/5" : required === "not required" ? "border-muted bg-muted/20" : "border-amber-500 bg-amber-50"}`}><div className="flex items-start gap-3">{systemRequired ? <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" /> : <Bell className="w-5 h-5 text-muted-foreground flex-shrink-0" />}<div className="flex-1"><h4 className="font-bold text-sm mb-1">{systemRequired ? "Fire Alarm System Required" : required === "not required" ? "Fire Alarm System Not Required" : "Fire Alarm Requirement Needs Review"}</h4><p className="text-xs text-muted-foreground">{determination.reasoning}</p></div></div></div>
            {determination.caveats.length > 0 && <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><div><strong>Review notes:</strong><ul className="list-disc pl-4 mt-1">{determination.caveats.map((caveat, index) => <li key={index}>{caveat}</li>)}</ul></div></div>}
            {systemRequired && <div className="p-4 border rounded-lg bg-muted/20"><h4 className="text-xs font-bold uppercase tracking-wider mb-3">Determination</h4><Badge variant="destructive" className="text-sm">Required</Badge></div>}
            <div className="p-3 border rounded-lg bg-primary/5"><h4 className="text-xs font-bold mb-2">NBC Reference</h4><Badge variant="outline" className="text-[10px] font-mono">{determination.rule}</Badge></div></>}

          {systemRequired && <div className="flex justify-end gap-2"><SaveButton calculatorType="fireAlarm" inputs={{ occupancy, buildingHeight, storeys, occupantLoad, sprinklered, sprinklerSystemType, sprinklerCount, containedUseArea, impededEgressZone, schoolChildcare, licensedEstablishment, storageGarageOnly, suiteCount, directExteriorEgress, sleepingCapacity, bedroomCount }} results={result} /><Button variant="outline" size="sm" className="rounded-none gap-2" onClick={() => exportFireAlarmToExcel({ occupancyType: occupancy, buildingHeight: parseFloat(buildingHeight) || 0, floorArea: parseFloat(floorArea) || 0, systemType: result.systemType, detectionRequired: result.detectionRequired, voiceCommunication: result.voiceCommunication, requirements: result.requirements, nbcReferences: result.nbcReferences })}><Download className="w-4 h-4" />Export to Excel</Button></div>}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t"><p className="font-semibold">Important Notes (NBC 2020 Article 3.2.4.1):</p><ul className="list-disc pl-5 space-y-1"><li>Fire alarm determination follows the sprinklered and unsprinklered branches of Sentence 3.2.4.1.</li><li>Unknown inputs remain review notes and are never treated as proof that a condition is false.</li><li>Installation and verification must comply with the applicable referenced standards.</li></ul></div>
        </div>
      </CardContent>
    </Card>
  );
}
