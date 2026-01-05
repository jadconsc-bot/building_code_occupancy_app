import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Info, AlertTriangle, CheckCircle2, Building2, Ruler, DoorOpen, Flame, Zap, Droplets, Camera, MapPin, ShieldAlert, Calculator, Activity, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { occupancyData, OccupancyGroup } from "@/lib/occupancyData";
import { constructionLimits, separationMatrix } from "@/lib/constructionData";
import { electricalChecklists } from "@/lib/electricalData";
import { plumbingChecklists } from "@/lib/plumbingData";
import { additionsData } from "@/lib/additionsData";
import { WetVentingDiagram, FixtureUnitCalculator, GasLineCalculator } from "@/components/PlumbingTools";
import { ServiceLoadCalculator, VoltageDropCalculator, ConduitFillCalculator } from "@/components/ElectricalTools";
import { FireSeparationDiagram, EgressWindowDiagram, GFCIZoneDiagram, SetbackDiagram, DeckCrossSectionDiagram } from "@/components/CodeDiagrams";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<OccupancyGroup | null>(null);

  const filteredData = useMemo(() => {
    if (!searchQuery) return occupancyData;
    
    const lowerQuery = searchQuery.toLowerCase();
    return occupancyData.filter(group => 
      group.code.toLowerCase().includes(lowerQuery) ||
      group.name.toLowerCase().includes(lowerQuery) ||
      group.description.toLowerCase().includes(lowerQuery) ||
      group.examples.some(ex => ex.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar / Search Area */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r border-border bg-sidebar flex flex-col h-screen z-10">
        <div className="p-6 border-b border-border bg-sidebar">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              AB
            </div>
            <h1 className="font-bold text-lg tracking-tight text-sidebar-foreground leading-tight">
              Building Code<br/>Occupancy Classifier
            </h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input 
              type="text"
              placeholder="Search building type..." 
              className="pl-9 bg-background border-input focus-visible:ring-1 rounded-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Try "Restaurant", "Hospital", "Warehouse"
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No results found.</p>
              </div>
            ) : (
              filteredData.map((group) => (
                <div 
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`
                    group cursor-pointer p-4 border transition-all duration-200
                    ${selectedGroup?.id === group.id 
                      ? "bg-primary text-primary-foreground border-primary shadow-md" 
                      : "bg-card hover:bg-accent hover:text-accent-foreground border-border hover:border-accent-foreground/20"}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-mono font-bold text-lg ${selectedGroup?.id === group.id ? "text-white" : "text-primary"}`}>
                      {group.code}
                    </span>
                    {group.division && (
                      <span className={`text-[10px] uppercase tracking-wider ${selectedGroup?.id === group.id ? "text-white/80" : "text-muted-foreground"}`}>
                        {group.division}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm leading-tight mb-2">{group.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {group.examples.slice(0, 2).map((ex, i) => (
                      <span 
                        key={i} 
                        className={`text-[10px] px-1.5 py-0.5 border ${selectedGroup?.id === group.id ? "border-white/30 bg-white/10" : "border-border bg-muted"}`}
                      >
                        {ex}
                      </span>
                    ))}
                    {group.examples.length > 2 && (
                      <span className={`text-[10px] px-1.5 py-0.5 ${selectedGroup?.id === group.id ? "text-white/70" : "text-muted-foreground"}`}>
                        +{group.examples.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-border text-[10px] text-muted-foreground bg-sidebar">
          Based on National Building Code - 2023 Alberta Edition
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-screen overflow-y-auto bg-background p-6 md:p-10 lg:p-16">
        {selectedGroup ? (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-baseline gap-4 mb-2 border-b-4 border-primary pb-4">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-primary font-mono">
                {selectedGroup.code}
              </h1>
              <div className="flex flex-col">
                <span className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                  {selectedGroup.division || "General"}
                </span>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {selectedGroup.name}
                  </h2>
                  {selectedGroup.albertaContrast && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-help border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors gap-1.5 py-1 px-2">
                            <MapPin className="w-3 h-3" /> AB Code
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-4 bg-blue-950 text-white border-blue-800">
                          <p className="font-bold mb-1 text-blue-200">{selectedGroup.albertaContrast.title}</p>
                          <p className="text-xs leading-relaxed">{selectedGroup.albertaContrast.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>

            <Tabs defaultValue="building" className="mt-8">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto mb-8">
                <TabsTrigger 
                  value="building" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Building2 className="w-4 h-4 mr-2" /> Building Code
                </TabsTrigger>
                <TabsTrigger 
                  value="plumbing" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Droplets className="w-4 h-4 mr-2" /> Plumbing
                </TabsTrigger>
                <TabsTrigger 
                  value="electrical" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Zap className="w-4 h-4 mr-2" /> Electrical
                </TabsTrigger>
                <TabsTrigger 
                  value="additions" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-sm font-bold uppercase tracking-wider"
                >
                  <Ruler className="w-4 h-4 mr-2" /> Additions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="building" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {selectedGroup.id === "C-2" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="overflow-hidden border-border shadow-sm">
                      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Ruler className="h-4 w-4" /> Fire Separation Detail
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 bg-white">
                        <FireSeparationDiagram />
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                          Continuous smoke-tight barrier (min 12.7mm gypsum) required on underside of floor framing.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="overflow-hidden border-border shadow-sm">
                      <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <DoorOpen className="h-4 w-4" /> Bedroom Egress Window
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 bg-white">
                        <EgressWindowDiagram />
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                          Must provide unobstructed opening of min 0.35 m², with no dimension less than 380 mm.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Description & Examples */}
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Definition
                      </h3>
                      <p className="text-lg leading-relaxed border-l-2 border-accent pl-4">
                        {selectedGroup.description}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Common Examples
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedGroup.examples.map((ex, i) => (
                          <Badge 
                            key={i} 
                            variant="secondary" 
                            className="rounded-none px-3 py-1.5 text-sm font-normal border border-border bg-secondary/50 hover:bg-secondary"
                          >
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </section>

                    <section className="bg-muted/30 p-6 border border-border">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-destructive mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Key Compliance Notes
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                        {selectedGroup.compliance.notes}
                      </p>
                    </section>
                  </div>

                  {/* Right Column: Compliance Data */}
                  <div className="space-y-6">
                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Flame className="w-4 h-4 text-destructive" /> Fire Safety
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Fire Resistance</span>
                          <p className="text-sm font-medium">{selectedGroup.compliance.fireResistance}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Sprinklers</span>
                          <p className="text-sm font-medium">{selectedGroup.compliance.sprinklers}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <DoorOpen className="w-4 h-4 text-primary" /> Egress
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Occupant Load</span>
                          <p className="text-sm font-medium">{selectedGroup.compliance.occupantLoad}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground uppercase block mb-1">Exits</span>
                      <p className="text-sm font-medium">{selectedGroup.compliance.exits}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-primary" /> Construction
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium">{selectedGroup.compliance.construction}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="plumbing" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Droplets className="w-4 h-4" /> Fixture Requirements
                      </h3>
                      <p className="text-lg leading-relaxed border-l-2 border-accent pl-4">
                        {selectedGroup.plumbing?.fixtures || "Standard fixture requirements apply based on occupant load."}
                      </p>
                    </section>

                    <section className="bg-muted/30 p-6 border border-border">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Drainage & Systems
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                        {selectedGroup.plumbing?.drainage || "Standard drainage requirements apply."}
                      </p>
                    </section>

                    {(selectedGroup.code.startsWith("C") || selectedGroup.code.startsWith("A-2")) && (
                      <div className="border-t border-border pt-8 mt-8">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" /> Rough-In Checklist
                        </h3>
                        <Tabs defaultValue="kitchen" className="w-full">
                          <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 h-auto flex-wrap">
                            {plumbingChecklists.map((room) => (
                              <TabsTrigger key={room.id} value={room.id} className="flex-1 min-w-[100px]">
                                {room.name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {plumbingChecklists.map((room) => (
                            <TabsContent key={room.id} value={room.id} className="space-y-3 mt-0">
                              {room.items.map((item) => (
                                <div key={item.id} className="flex items-start space-x-3 p-4 rounded-none border border-border bg-card hover:bg-accent/50 transition-colors group">
                                  <Checkbox id={item.id} className="mt-1" />
                                  <div className="grid gap-1.5 leading-none w-full">
                                    <div className="flex items-center justify-between gap-2">
                                      <Label
                                        htmlFor={item.id}
                                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {item.label}
                                      </Label>
                                      <Badge variant="outline" className="font-mono text-[10px] h-5 bg-muted text-muted-foreground whitespace-nowrap">
                                        {item.codeRef}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}


                  </div>

                  <div className="space-y-6">
                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" /> Special Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium">{selectedGroup.plumbing?.notes || "No special notes."}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="additions" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Zoning & Setbacks (Municipal)
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="rounded-none border-border shadow-sm overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border bg-muted/20">
                          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" /> Typical Setback Rules
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="aspect-[4/3] w-full bg-white">
                            <SetbackDiagram />
                          </div>
                          <div className="p-4 bg-muted/10 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              <strong>Disclaimer:</strong> Setbacks (Front, Rear, Side) are determined by your local Land Use Bylaw, NOT the Building Code. Always check your Real Property Report (RPR) and city zoning maps.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg">
                          <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Key Definitions
                          </h4>
                          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                            <li><strong>Principal Building:</strong> The main house. Additions (sunrooms, attached garages) become part of this and must meet full setbacks.</li>
                            <li><strong>Accessory Building:</strong> Detached structures (garages, sheds). Often allowed closer to property lines (e.g., 0.6m or 1.2m).</li>
                            <li><strong>Permitted Projections:</strong> Some items (eaves, cantilevers, low decks) may project into setbacks. Check local rules.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Building Code Requirements
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {additionsData.map((type) => (
                        <Card key={type.id} className="rounded-none border-border shadow-sm">
                          <CardHeader className="pb-2 border-b border-border bg-muted/20">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-bold flex items-center gap-2">
                                {type.name}
                              </CardTitle>
                              <Badge variant="outline" className="bg-background">{type.id === 'deck' ? 'Part 9.8' : 'Part 9'}</Badge>
                            </div>
                            <CardDescription>{type.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-2 space-y-4">
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                  <div>
                                    <strong>Zoning Note:</strong> {type.zoningNotes}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {type.requirements.map((req) => (
                                    <div key={req.id} className="p-3 border border-border rounded bg-card hover:bg-muted/50 transition-colors">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm">{req.title}</span>
                                        {req.codeRef && <Badge variant="secondary" className="text-[10px] h-5">{req.codeRef}</Badge>}
                                      </div>
                                      <p className="text-xs text-muted-foreground">{req.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {type.id === 'deck' && (
                                <div className="border border-border rounded overflow-hidden">
                                  <div className="bg-muted/20 p-2 border-b border-border text-xs font-bold text-center uppercase">Cross Section</div>
                                  <div className="aspect-[3/4] bg-white">
                                    <DeckCrossSectionDiagram />
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="electrical" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Emergency Power
                      </h3>
                      <p className="text-lg leading-relaxed border-l-2 border-accent pl-4">
                        {selectedGroup.electrical?.emergencyPower || "Standard emergency lighting requirements apply."}
                      </p>
                    </section>

                    <section className="bg-muted/30 p-6 border border-border">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Lighting & Distribution
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                        {selectedGroup.electrical?.lighting || "Standard lighting requirements apply."}
                      </p>
                    </section>

                    {(selectedGroup.code.startsWith("C") || selectedGroup.code.startsWith("A-2")) && (
                      <div className="border-t border-border pt-8 mt-8">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" /> Rough-In Checklist
                        </h3>
                        <Tabs defaultValue="kitchen" className="w-full">
                          <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 h-auto flex-wrap">
                            {electricalChecklists.map((room) => (
                              <TabsTrigger key={room.id} value={room.id} className="flex-1 min-w-[100px]">
                                {room.name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {electricalChecklists.map((room) => (
                            <TabsContent key={room.id} value={room.id} className="space-y-3 mt-0">
                              {room.items.map((item) => (
                                <div key={item.id} className="flex items-start space-x-3 p-4 rounded-none border border-border bg-card hover:bg-accent/50 transition-colors group">
                                  <Checkbox id={item.id} className="mt-1" />
                                  <div className="grid gap-1.5 leading-none w-full">
                                    <div className="flex items-center justify-between gap-2">
                                      <Label
                                        htmlFor={item.id}
                                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {item.label}
                                      </Label>
                                      <Badge variant="outline" className="font-mono text-[10px] h-5 bg-muted text-muted-foreground whitespace-nowrap">
                                        {item.codeRef}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    )}


                  </div>

                  <div className="space-y-6">
                    <Card className="rounded-none border-border shadow-sm">
                      <CardHeader className="pb-2 border-b border-border bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" /> Special Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium">{selectedGroup.electrical?.notes || "No special notes."}</p>
                      </CardContent>
                    </Card>

                    {(selectedGroup.code.startsWith("C") || selectedGroup.code.startsWith("A-2")) && (
                      <Card className="rounded-none border-border shadow-sm overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border bg-muted/20">
                          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-destructive" /> GFCI Zone (1.5m)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="aspect-[4/3] w-full bg-white">
                            <GFCIZoneDiagram />
                          </div>
                          <div className="p-4 bg-muted/10 border-t border-border">
                            <p className="text-xs text-muted-foreground text-center">
                              Receptacles within 1.5m of sinks/washbasins require Class A GFCI protection (CEC 26-700).
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                          <Zap className="w-4 h-4" /> Load Calculation
                        </h3>
                        <ServiceLoadCalculator />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Voltage Drop
                        </h3>
                        <VoltageDropCalculator />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                          <Layers className="w-4 h-4" /> Conduit Fill
                        </h3>
                        <ConduitFillCalculator />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="construction" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Construction Limits (Part 3.2.2)
                    </h3>
                    <div className="rounded-md border border-border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/20">
                          <TableRow>
                            <TableHead className="font-bold">Article</TableHead>
                            <TableHead className="font-bold">Max Height</TableHead>
                            <TableHead className="font-bold">Max Area</TableHead>
                            <TableHead className="font-bold">Sprinklers</TableHead>
                            <TableHead className="font-bold">Construction</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {constructionLimits[selectedGroup.code.split(' ')[0]]?.map((limit, index) => (
                            <TableRow key={index} className="hover:bg-muted/10">
                              <TableCell className="font-mono text-xs text-primary">{limit.article}</TableCell>
                              <TableCell>{limit.maxHeight}</TableCell>
                              <TableCell>{limit.maxArea}</TableCell>
                              <TableCell>
                                {limit.sprinklered ? (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Required</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Optional</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {limit.constructionType.map(type => (
                                    <Badge key={type} variant="outline" className="text-[10px] border-border">
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )) || (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No specific construction limits found for this group.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-destructive mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Fire Separation Matrix (Table 3.1.3.1)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 border-l-2 border-destructive/20 pl-3">
                      Required fire-resistance rating (in hours) between <strong>{selectedGroup.code}</strong> and adjacent major occupancies.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {Object.entries(separationMatrix[selectedGroup.code.split(' ')[0]] || {}).map(([adjCode, rating]) => (
                        <div key={adjCode} className="flex items-center justify-between p-3 rounded border border-border bg-card hover:shadow-sm transition-shadow">
                          <span className="font-mono font-bold text-sm">{adjCode}</span>
                          <Badge 
                            variant={rating === '-' ? 'outline' : 'destructive'} 
                            className={rating === '-' ? 'text-muted-foreground border-dashed' : ''}
                          >
                            {rating === '-' ? 'None' : `${rating} h`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-40">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Select a Building Type</h2>
            <p className="text-muted-foreground">
              Search for a building type in the sidebar or select an occupancy group to view detailed compliance requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
