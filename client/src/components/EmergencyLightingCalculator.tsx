import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Lightbulb } from "lucide-react";
import { exportEmergencyLightingToExcel } from "@/lib/excelExport";
import { SaveButton } from "@/components/CalculatorWithSave";
import { trpc } from "@/lib/trpc";

const triState = (value: string): boolean | null => value === "yes" ? true : value === "no" ? false : null;

function FlagSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2">
    <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="rounded-none"><SelectValue placeholder="Unknown / not provided" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="unknown">Unknown / not provided</SelectItem>
        <SelectItem value="yes">Yes</SelectItem>
        <SelectItem value="no">No</SelectItem>
      </SelectContent>
    </Select>
  </div>;
}

export function EmergencyLightingCalculator() {
  const [occupancy, setOccupancy] = useState("");
  const [occupantLoad, setOccupantLoad] = useState("");
  const [flags, setFlags] = useState<Record<string, string>>({});
  const setFlag = (key: string) => (value: string) => setFlags(prev => ({ ...prev, [key]: value }));
  const value = (key: string) => flags[key] ?? "unknown";
  const load = parseFloat(occupantLoad);
  const queryEnabled = !!occupancy && occupantLoad.trim() !== "" && Number.isFinite(load);

  const { data: result } = trpc.calculationsPackage.determineEmergencyLighting.useQuery({
    occupancyGroup: occupancy,
    occupantLoad: Number.isFinite(load) ? load : 0,
    hasPublicCorridors: triState(value("publicCorridors")),
    hasTreatmentOccupancySleepingCorridors: triState(value("treatmentCorridors")),
    hasCareOccupancySleepingCorridors: triState(value("careCorridors")),
    hasClassrooms: triState(value("classrooms")),
    hasUndergroundWalkways: triState(value("undergroundWalkways")),
    hasDaycareAreas: triState(value("daycare")),
    hasCommercialKitchen: triState(value("commercialKitchen")),
    hasMultiPersonPublicWashrooms: triState(value("publicWashrooms")),
    hasElectromagneticLockDoors: triState(value("magneticLocks")),
    hasUniversalWashroomOrAccessibleChangeSpace: triState(value("universalSpaces")),
    hasServiceSpace32118: triState(value("serviceSpace")),
    isWithinHighBuildingScope: triState(value("highBuilding")),
    is32251Or60Construction: triState(value("specialConstruction")),
  }, { enabled: queryEnabled });

  const hasResult = queryEnabled && !!result;
  const inputs = { occupancy, occupantLoad, ...flags };
  return <Card className="rounded-none border-border shadow-sm">
    <CardHeader className="pb-4 border-b border-border bg-muted/20">
      <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-600" /> Emergency Lighting Calculator</CardTitle>
      <CardDescription className="text-xs mt-1">Determine emergency lighting requirements per NBC 2020 Articles 3.2.7.3 and 3.2.7.4</CardDescription>
    </CardHeader>
    <CardContent className="pt-6"><div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="emergency-occupancy" className="text-xs font-medium">Occupancy Classification</Label><Select value={occupancy} onValueChange={setOccupancy}><SelectTrigger id="emergency-occupancy" className="rounded-none"><SelectValue placeholder="Select occupancy" /></SelectTrigger><SelectContent>{['A-1','A-2','A-3','A-4','B-1','B-2','B-3','C','D','E','F-1','F-2','F-3'].map(group => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="emergency-occupant-load" className="text-xs font-medium">Occupant Load (persons)</Label><Input id="emergency-occupant-load" type="number" min="0" value={occupantLoad} onChange={e => setOccupantLoad(e.target.value)} placeholder="e.g., 150" className="rounded-none" /></div>
      </div>
      <section className="space-y-4 border rounded-lg p-4"><h3 className="text-xs font-bold uppercase tracking-wider">Corridors and routes</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FlagSelect id="public-corridors" label="Public corridors?" value={value("publicCorridors")} onChange={setFlag("publicCorridors")} />
        <FlagSelect id="treatment-corridors" label="Treatment-occupancy sleeping-room corridors?" value={value("treatmentCorridors")} onChange={setFlag("treatmentCorridors")} />
        <FlagSelect id="care-corridors" label="Care-occupancy sleeping-room corridors?" value={value("careCorridors")} onChange={setFlag("careCorridors")} />
        <FlagSelect id="classrooms" label="Classroom corridors?" value={value("classrooms")} onChange={setFlag("classrooms")} />
        <FlagSelect id="underground-walkways" label="Underground walkways?" value={value("undergroundWalkways")} onChange={setFlag("undergroundWalkways")} />
      </div></section>
      <section className="space-y-4 border rounded-lg p-4"><h3 className="text-xs font-bold uppercase tracking-wider">Special-use areas</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FlagSelect id="daycare" label="Daycare areas where persons are cared for?" value={value("daycare")} onChange={setFlag("daycare")} />
        <FlagSelect id="commercial-kitchen" label="Commercial kitchen food-preparation area?" value={value("commercialKitchen")} onChange={setFlag("commercialKitchen")} />
        <FlagSelect id="public-washrooms" label="Public washrooms serving more than one person?" value={value("publicWashrooms")} onChange={setFlag("publicWashrooms")} />
        <FlagSelect id="magnetic-locks" label="Doors with electromagnetic locks?" value={value("magneticLocks")} onChange={setFlag("magneticLocks")} />
        <FlagSelect id="universal-spaces" label="Required universal washroom, shower room, or accessible change space?" value={value("universalSpaces")} onChange={setFlag("universalSpaces")} />
        <FlagSelect id="service-space" label="Service space under Sentence 3.2.1.1.(8)?" value={value("serviceSpace")} onChange={setFlag("serviceSpace")} />
      </div></section>
      <section className="space-y-4 border rounded-lg p-4"><h3 className="text-xs font-bold uppercase tracking-wider">Emergency-power duration scope</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FlagSelect id="high-building" label="Within Subsection 3.2.6 scope?" value={value("highBuilding")} onChange={setFlag("highBuilding")} />
        <FlagSelect id="special-construction" label="Constructed under Article 3.2.2.51 or 3.2.2.60?" value={value("specialConstruction")} onChange={setFlag("specialConstruction")} />
      </div></section>
      {hasResult && <>
        <div className="p-4 border-l-4 border-yellow-600 bg-yellow-50 dark:bg-yellow-950"><div className="flex items-start gap-3"><Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" /><div><h4 className="font-bold text-sm mb-1">Emergency Lighting Required</h4><p className="text-xs text-muted-foreground">Exits and principal routes are required to have emergency lighting under NBC 3.2.7.3.</p></div></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="p-4 border rounded-lg"><div className="text-xs text-muted-foreground mb-1">Average illumination</div><div className="text-2xl font-bold text-yellow-600">{result.minimumIllumination} lx</div><div className="text-xs text-muted-foreground mt-1">At floor or tread level</div></div><div className="p-4 border rounded-lg"><div className="text-xs text-muted-foreground mb-1">Emergency power duration</div><div className="text-2xl font-bold text-yellow-600">{result.duration === 'verify' ? 'Verify' : `${result.duration} min`}</div><div className="text-xs text-muted-foreground mt-1">Automatic emergency-power period</div></div></div>
        <div className="p-4 border rounded-lg bg-muted/20"><h4 className="text-xs font-bold uppercase tracking-wider mb-3">Areas requiring emergency lighting</h4><ul className="space-y-2">{result.areas.map((area, i) => <li key={i} className="flex items-start gap-2 text-xs"><Lightbulb className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" /><span>{area}</span></li>)}</ul></div>
        <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><div><strong>Review notes:</strong><ul className="list-disc pl-4 mt-1">{result.additionalRequirements.map((item, i) => <li key={i}>{item}</li>)}</ul></div></div>
        <div className="p-3 border rounded-lg bg-primary/5"><h4 className="text-xs font-bold mb-2">NBC References</h4><div className="flex flex-wrap gap-2">{result.nbcReferences.map((ref, i) => <Badge key={i} variant="outline" className="text-[10px] font-mono">{ref}</Badge>)}</div></div>
      </>}
      {hasResult && <div className="flex justify-end gap-2"><SaveButton calculatorType="emergencyLighting" inputs={inputs} results={{ ...result }} /><Button variant="outline" size="sm" className="rounded-none gap-2" onClick={() => exportEmergencyLightingToExcel({ occupancyType: occupancy, floorArea: 0, exitPaths: result.areas.length, emergencyLightingRequired: result.required, minimumIllumination: result.minimumIllumination, batteryDuration: typeof result.duration === 'number' ? result.duration : 0, nbcReference: result.nbcReferences.join(', ') })}><Download className="w-4 h-4" />Export to Excel</Button></div>}
      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t"><p className="font-semibold">Important Notes (NBC 2020 Articles 3.2.7.3 and 3.2.7.4):</p><ul className="list-disc pl-5 space-y-1"><li>Emergency lighting is location/use-based; exits and principal routes are always included.</li><li>Unknown scope inputs remain review notes and are never treated as false.</li><li>Self-contained units must conform to CSA C22.2 No. 141.</li></ul></div>
    </div></CardContent>
  </Card>;
}
