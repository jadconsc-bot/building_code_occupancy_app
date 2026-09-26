import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Home } from "lucide-react";
import { CalculatorActions } from "@/components/CalculatorActions";
import { SaveButton } from "@/components/CalculatorWithSave";
import { trpc } from "@/lib/trpc";

type FoundationType = "strip" | "spread" | "pier" | "helical";

export function FoundationDesignCalculator() {
  const [soilType, setSoilType] = useState("medium");
  const [foundationType, setFoundationType] = useState<FoundationType>("strip");
  const [wallLoad, setWallLoad] = useState("");
  const [wallLength, setWallLength] = useState("");
  const [pointLoad, setPointLoad] = useState("");
  const [region, setRegion] = useState("calgary");
  const enabled = foundationType === "helical" || (foundationType === "strip" ? Number(wallLoad) > 0 && Number(wallLength) > 0 : Number(pointLoad) > 0);
  const query = trpc.calculationsPackage.determineFoundationDesign.useQuery({
    soilType: soilType as "rock" | "gravel" | "medium" | "clay" | "soft",
    region: region as "calgary" | "edmonton" | "red_deer" | "lethbridge" | "fort_mcmurray",
    foundationType,
    wallLoadKn: foundationType === "strip" ? Number(wallLoad) : undefined,
    wallLengthM: foundationType === "strip" ? Number(wallLength) : undefined,
    pointLoadKn: foundationType === "spread" || foundationType === "pier" ? Number(pointLoad) : undefined,
  }, { enabled });
  const results = query.data;
  const exportData = () => ({
    filename: `Foundation_Design_${new Date().toISOString().split("T")[0]}`,
    sheetName: "Foundation",
    data: results ? [
      ["Parameter", "Value"],
      ["Soil Type", soilType], ["Region", region], ["Foundation Type", foundationType],
      ...(foundationType === "strip" ? [["Wall Load", `${wallLoad} kN`], ["Wall Length", `${wallLength} m`]] : foundationType === "helical" ? [] : [["Point Load", `${pointLoad} kN`]]),
      ["Footing", results.footingShape === "square" ? `${results.footingWidth}mm × ${results.footingWidth}mm` : results.footingShape === "circular" ? `Ø${results.footingWidth}mm` : `${results.footingWidth}mm`],
      ["Footing Thickness", results.footingThickness != null ? `${results.footingThickness} mm` : "N/A"],
      ["Wall Thickness", results.wallThickness != null ? `${results.wallThickness} mm` : "N/A"],
      ["Frost Depth", `${results.frostDepth} mm`], ["Minimum Depth", `${results.minDepth} mm`],
      ["Bearing Capacity", `${results.bearingCapacity} kPa`], ["Bearing Pressure", results.bearingPressure != null ? `${results.bearingPressure.toFixed(1)} kPa` : "N/A"],
      ["Rebar Size", results.rebarSize ?? "N/A"], ["Rebar Spacing", results.rebarSpacing ? `${results.rebarSpacing} mm` : "N/A"],
      ["Drainage Required", results.drainageRequired ? "Yes" : "No"], ["Drain Pipe Size", `${results.drainPipeSize} mm`],
      ["Dampproofing", results.dampproofing], ["Concrete Volume", results.concreteVolume != null ? `${results.concreteVolume.toFixed(2)} m³` : "N/A"],
      ["Caveats", results.caveats.join(" ")],
    ] : []
  });
  const inputs = { soilType, foundationType, wallLoad, wallLength, pointLoad, region };
  return <Card className="border-border shadow-sm">
    <CardHeader className="pb-2 bg-muted/30 border-b border-border/50"><div className="flex items-start justify-between"><div><CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Home className="w-4 h-4 text-primary" /> Foundation Design Calculator</CardTitle><CardDescription className="text-xs mt-1">NBC 9.15 foundation sizing estimate with generic, site-unverified soil capacity</CardDescription></div><div className="flex gap-2"><SaveButton calculatorType="foundationDesign" inputs={inputs} results={(results ?? {}) as Record<string, unknown>} /><CalculatorActions calculatorId="foundation_design" calculatorName="Foundation Design" exportData={exportData} currentState={inputs} onLoadPreset={(data) => { setSoilType(data.soilType ?? "medium"); setFoundationType(data.foundationType ?? "strip"); setWallLoad(data.wallLoad ?? ""); setWallLength(data.wallLength ?? ""); setPointLoad(data.pointLoad ?? ""); setRegion(data.region ?? "calgary"); }} hasResults={!!results} /></div></div></CardHeader>
    <CardContent className="pt-4 space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2"><Label>Soil Type</Label><Select value={soilType} onValueChange={setSoilType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rock">Rock (500 kPa)</SelectItem><SelectItem value="gravel">Gravel/coarse sand (200 kPa)</SelectItem><SelectItem value="medium">Medium sand/silt (100 kPa)</SelectItem><SelectItem value="clay">Stiff clay (75 kPa)</SelectItem><SelectItem value="soft">Soft clay/silt (50 kPa)</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>Foundation Type</Label><Select value={foundationType} onValueChange={(v) => setFoundationType(v as FoundationType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="strip">Strip Footing (Continuous)</SelectItem><SelectItem value="spread">Spread/Pad Footing</SelectItem><SelectItem value="pier">Pier/Sonotube</SelectItem><SelectItem value="helical">Helical/Screw Pile</SelectItem></SelectContent></Select></div>
      {foundationType === "strip" && <><div className="space-y-2"><Label>Wall Load (kN)</Label><Input type="number" value={wallLoad} onChange={e => setWallLoad(e.target.value)} /></div><div className="space-y-2"><Label>Wall Length (m)</Label><Input type="number" value={wallLength} onChange={e => setWallLength(e.target.value)} /></div></>}
      {(foundationType === "spread" || foundationType === "pier") && <div className="space-y-2"><Label>Point Load (kN)</Label><Input type="number" value={pointLoad} onChange={e => setPointLoad(e.target.value)} /></div>}
      <div className="space-y-2"><Label>Alberta Region</Label><Select value={region} onValueChange={setRegion}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="calgary">Calgary</SelectItem><SelectItem value="edmonton">Edmonton</SelectItem><SelectItem value="red_deer">Red Deer</SelectItem><SelectItem value="lethbridge">Lethbridge</SelectItem><SelectItem value="fort_mcmurray">Fort McMurray</SelectItem></SelectContent></Select></div>
    </div>
    <p className="text-xs text-muted-foreground">Simplified sizing estimate for early planning only; soil capacity and frost depth require site verification.</p>
    {results && !results.computable && <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{results.caveats.join(" ")}</div>}
    {results?.computable && <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">{[["Footing", results.footingShape === "square" ? `${results.footingWidth} × ${results.footingWidth} mm` : results.footingShape === "circular" ? `Ø${results.footingWidth} mm` : `${results.footingWidth} mm`], ["Thickness", `${results.footingThickness} mm`], ["Wall thickness", `${results.wallThickness} mm`], ["Concrete volume", `${results.concreteVolume?.toFixed(2)} m³`], ["Frost depth", `${results.frostDepth} mm`], ["Min depth", `${results.minDepth} mm`], ["Bearing", `${results.bearingCapacity} kPa`], ["Rebar", results.rebarSize ?? "N/A"], ["Rebar spacing", results.rebarSpacing ? `${results.rebarSpacing} mm` : "N/A"], ["Drainage", results.drainageRequired ? "Required" : "Not required"], ["Drain pipe", `${results.drainPipeSize} mm`], ["Status", results.compliant ? "Compliant" : "Review"]].map(([label, value]) => <div key={label} className="rounded border p-2"><div className="text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>)}</div>
      <p className="text-sm"><span className="font-semibold">Dampproofing:</span> {results.dampproofing}</p>
    </>}
    {results?.computable && <Badge variant={results.compliant ? "default" : "destructive"}>{results.compliant ? "Sizing checks passed" : "Review required"}</Badge>}
    <p className="text-xs text-muted-foreground border-t pt-3">NBC 9.15.3.2 (substrate; soil capacity is generic/unverified), 9.15.3.3-9.15.3.7 (footing width/area), 9.15.4.2 (foundation wall thickness), 9.12.2.2 / Table 9.12.2.2 (foundation depth), 9.14.2.1 and 9.14.3.2 (drainage), 9.13.2.1 (dampproofing). Spread and pier sizing use the same 9.15.3.3-9.15.3.7 area-based approach as strip footings.</p>
    </CardContent></Card>;
}
