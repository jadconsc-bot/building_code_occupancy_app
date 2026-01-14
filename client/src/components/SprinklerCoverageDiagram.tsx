import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SprinklerCoverageDiagram() {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
          <Droplets className="w-5 h-5" />
          Sprinkler System Coverage & Requirements
        </CardTitle>
        <CardDescription className="text-blue-800">
          Visual guide to sprinkler coverage zones, spacing requirements, and system types (NBC Part 3.2.5)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="coverage" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="coverage">Coverage Zones</TabsTrigger>
            <TabsTrigger value="types">System Types</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          {/* Coverage Zones Tab */}
          <TabsContent value="coverage" className="space-y-6">
            <div className="bg-white p-8 rounded-lg border-2 border-blue-200">
              <div className="text-center mb-6">
                <h3 className="font-bold text-sm text-gray-700 mb-2">Standard Spray Sprinkler Coverage Pattern</h3>
                <p className="text-xs text-muted-foreground">Light Hazard Occupancy (Residential, Office)</p>
              </div>

              {/* Grid Pattern */}
              <div className="relative aspect-[4/3] bg-gray-100 rounded-lg p-8">
                {/* Ceiling indication */}
                <div className="absolute top-2 left-2 text-[10px] font-bold text-gray-500">CEILING VIEW</div>
                
                {/* 3x3 Grid of Sprinkler Heads */}
                {[...Array(3)].map((_, row) => (
                  <div key={row} className="flex justify-around mb-12 last:mb-0">
                    {[...Array(3)].map((_, col) => (
                      <div key={col} className="relative">
                        {/* Coverage Circle */}
                        <div className="w-24 h-24 rounded-full bg-blue-200/40 border-2 border-blue-400 border-dashed flex items-center justify-center relative">
                          {/* Sprinkler Head */}
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg z-10">
                            <Droplets className="w-4 h-4 text-white" />
                          </div>
                          {/* Water Spray Pattern */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {[...Array(8)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-1 h-8 bg-blue-400/50"
                                style={{
                                  transform: `rotate(${i * 45}deg)`,
                                  transformOrigin: 'center',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        {/* Spacing Labels */}
                        {col === 0 && row === 0 && (
                          <>
                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-600">
                              ← 4.6m →
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 text-[10px] font-bold text-red-600">
                              4.6m
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <Droplets className="w-3 h-3 text-white" />
                  </div>
                  <span>Sprinkler Head</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-dashed bg-blue-200/40"></div>
                  <span>Coverage Area</span>
                </div>
              </div>
            </div>

            {/* Spacing Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3 bg-green-50">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-900">
                    Light Hazard
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Spacing</span>
                      <Badge variant="outline">4.6m</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Area</span>
                      <Badge variant="outline">21m²</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Distance</span>
                      <Badge variant="outline">1.8m</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Residential, offices, schools
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 bg-yellow-50">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-yellow-900">
                    Ordinary Hazard
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Spacing</span>
                      <Badge variant="outline">4.6m</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Area</span>
                      <Badge variant="outline">12m²</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Distance</span>
                      <Badge variant="outline">1.8m</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Retail, light manufacturing
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 bg-red-50">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-900">
                    High Hazard
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Spacing</span>
                      <Badge variant="outline">3.7m</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Area</span>
                      <Badge variant="outline">9m²</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Distance</span>
                      <Badge variant="outline">1.8m</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Warehouses, industrial
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Types Tab */}
          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Wet Pipe System (Most Common)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Pipes are constantly filled with water under pressure. When a sprinkler head activates, water immediately discharges.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-bold text-green-700 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Advantages
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Simple and reliable</li>
                        <li>Lowest installation cost</li>
                        <li>Immediate water discharge</li>
                        <li>Easy maintenance</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-bold text-red-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Limitations
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Cannot be used where freezing occurs</li>
                        <li>Risk of water damage from leaks</li>
                        <li>Corrosion in pipes over time</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-orange-600" />
                  Dry Pipe System
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Pipes filled with pressurized air or nitrogen. Water enters pipes only when sprinkler activates and air pressure drops.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-bold text-green-700 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Advantages
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Suitable for unheated spaces</li>
                        <li>Protects against freezing</li>
                        <li>Ideal for parkades, warehouses</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-bold text-red-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Limitations
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Delayed water discharge (30-60s)</li>
                        <li>Higher installation cost</li>
                        <li>More complex maintenance</li>
                        <li>Requires air compressor</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-purple-600" />
                  Pre-Action System
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Pipes are dry until fire detection system activates a valve. Requires both detection activation AND sprinkler head activation.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-bold text-green-700 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Advantages
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Double interlock prevents accidental discharge</li>
                        <li>Protects water-sensitive areas</li>
                        <li>Early warning from detection system</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-bold text-red-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Limitations
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Most expensive system</li>
                        <li>Complex installation</li>
                        <li>Requires fire detection system</li>
                        <li>Higher maintenance requirements</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-blue-900 bg-blue-50 p-2 rounded border border-blue-200">
                    <strong>Typical Use:</strong> Data centers, museums, libraries, archives, server rooms
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-4">
            <Card>
              <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  When Sprinklers Are Required (NBC 3.2.5.3)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-red-900 mb-1">High-Rise Buildings</div>
                      <p className="text-xs text-red-800">Required in all buildings over 18m in building height (typically 6+ storeys)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-orange-900 mb-1">Large Area Buildings</div>
                      <p className="text-xs text-orange-800">Required when building area exceeds limits in NBC Table 3.2.2.50 for the occupancy type</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-yellow-900 mb-1">Specific Occupancies</div>
                      <ul className="text-xs text-yellow-800 list-disc pl-4 mt-1 space-y-1">
                        <li>Assembly occupancies with occupant load &gt; 300</li>
                        <li>Care or detention occupancies (Group B)</li>
                        <li>Residential buildings &gt; 3 storeys</li>
                        <li>Underground parking garages</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">
                  Design Criteria
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-bold mb-2">Water Supply Requirements</div>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex justify-between">
                        <span>Light Hazard:</span>
                        <Badge variant="outline">0.1 gpm/ft²</Badge>
                      </li>
                      <li className="flex justify-between">
                        <span>Ordinary Hazard:</span>
                        <Badge variant="outline">0.15-0.20 gpm/ft²</Badge>
                      </li>
                      <li className="flex justify-between">
                        <span>High Hazard:</span>
                        <Badge variant="outline">0.30+ gpm/ft²</Badge>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="font-bold mb-2">System Components</div>
                    <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
                      <li>Water supply (municipal or tank)</li>
                      <li>Fire pump (if required)</li>
                      <li>Alarm valve or dry pipe valve</li>
                      <li>Sprinkler heads (various types)</li>
                      <li>Piping network</li>
                      <li>Flow and tamper switches</li>
                      <li>Fire department connection</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <p className="font-bold mb-2">Important Notes:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Sprinkler systems must be designed by qualified professionals and comply with NFPA 13 or ULC-S513</li>
                      <li>Regular inspection and maintenance required (annual, quarterly, monthly checks)</li>
                      <li>Sprinkler system installation can provide significant code trade-offs (increased travel distance, reduced fire ratings, larger building areas)</li>
                      <li>Always verify specific requirements with local Authority Having Jurisdiction (AHJ)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
