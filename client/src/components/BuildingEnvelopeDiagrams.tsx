import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Layers, Home, ArrowDown } from "lucide-react";

export function BuildingEnvelopeDiagrams() {
  return (
    <Card className="rounded-none border-border shadow-sm mb-8">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Home className="w-4 h-4 text-primary" /> Building Envelope Assemblies
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="wall" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="wall">Wall Assembly</TabsTrigger>
            <TabsTrigger value="roof">Roof Assembly</TabsTrigger>
            <TabsTrigger value="foundation">Foundation</TabsTrigger>
          </TabsList>

          <TabsContent value="wall" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-border rounded-none overflow-hidden bg-white">
                <div className="bg-muted/20 p-3 border-b border-border">
                  <h4 className="font-bold text-sm">2x6 Wood Frame Wall (Climate Zone 7A)</h4>
                </div>
                <div className="p-6">
                  <svg viewBox="0 0 400 500" className="w-full">
                    {/* Exterior */}
                    <rect x="50" y="50" width="300" height="30" fill="#8B4513" stroke="#000" strokeWidth="2"/>
                    <text x="200" y="70" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">Vinyl Siding</text>
                    
                    {/* Air space */}
                    <rect x="50" y="80" width="300" height="15" fill="#E8F4F8" stroke="#000" strokeWidth="1" strokeDasharray="3,3"/>
                    <text x="200" y="92" textAnchor="middle" fontSize="10" fill="#333">Air Space (19mm)</text>
                    
                    {/* Sheathing */}
                    <rect x="50" y="95" width="300" height="25" fill="#D2691E" stroke="#000" strokeWidth="2"/>
                    <text x="200" y="112" textAnchor="middle" fontSize="11" fill="#fff">OSB Sheathing (11mm)</text>
                    
                    {/* Insulation */}
                    <rect x="50" y="120" width="300" height="80" fill="#FFE4B5" stroke="#000" strokeWidth="2"/>
                    <pattern id="insulation" patternUnits="userSpaceOnUse" width="20" height="20">
                      <path d="M0,10 Q5,5 10,10 T20,10" stroke="#DDA15E" fill="none" strokeWidth="2"/>
                      <path d="M0,15 Q5,10 10,15 T20,15" stroke="#DDA15E" fill="none" strokeWidth="2"/>
                    </pattern>
                    <rect x="50" y="120" width="300" height="80" fill="url(#insulation)"/>
                    <text x="200" y="165" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#8B4513">R-22 Batt Insulation</text>
                    <text x="200" y="180" textAnchor="middle" fontSize="10" fill="#8B4513">(140mm cavity)</text>
                    
                    {/* Studs */}
                    <rect x="80" y="120" width="15" height="80" fill="#8B4513" stroke="#000" strokeWidth="1"/>
                    <rect x="160" y="120" width="15" height="80" fill="#8B4513" stroke="#000" strokeWidth="1"/>
                    <rect x="240" y="120" width="15" height="80" fill="#8B4513" stroke="#000" strokeWidth="1"/>
                    <rect x="320" y="120" width="15" height="80" fill="#8B4513" stroke="#000" strokeWidth="1"/>
                    <text x="87" y="155" fontSize="8" fill="#fff" transform="rotate(90 87 155)">2x6</text>
                    
                    {/* Vapor barrier */}
                    <rect x="50" y="200" width="300" height="8" fill="#4A90E2" stroke="#000" strokeWidth="2"/>
                    <text x="200" y="207" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">Polyethylene Vapor Barrier (6 mil)</text>
                    
                    {/* Drywall */}
                    <rect x="50" y="208" width="300" height="20" fill="#F5F5DC" stroke="#000" strokeWidth="2"/>
                    <text x="200" y="222" textAnchor="middle" fontSize="11" fill="#333">Gypsum Board (13mm)</text>
                    
                    {/* Interior label */}
                    <text x="200" y="250" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">INTERIOR →</text>
                    
                    {/* Dimensions */}
                    <line x1="360" y1="50" x2="360" y2="228" stroke="#E74C3C" strokeWidth="2" markerEnd="url(#arrowred)"/>
                    <line x1="355" y1="50" x2="365" y2="50" stroke="#E74C3C" strokeWidth="2"/>
                    <line x1="355" y1="228" x2="365" y2="228" stroke="#E74C3C" strokeWidth="2"/>
                    <text x="375" y="140" fontSize="12" fontWeight="bold" fill="#E74C3C">178mm</text>
                    
                    <defs>
                      <marker id="arrowred" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#E74C3C" />
                      </marker>
                    </defs>
                  </svg>
                </div>
                <div className="p-4 bg-muted/10 border-t border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Effective R-Value:</span>
                    <Badge variant="default" className="bg-green-600">RSI 3.87 (R-22)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">NBC 9.36 Requirement:</span>
                    <Badge variant="outline">RSI 3.52 (R-20) min</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Note:</strong> Vapor barrier must be on warm side (interior). Continuous air barrier required.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-border bg-card">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Climate Zone Requirements (NBC 9.36)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 4 (Vancouver)</span>
                      <span>RSI 2.97 (R-17)</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span className="font-medium">Zone 5 (Toronto)</span>
                      <span>RSI 3.34 (R-19)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 6 (Ottawa)</span>
                      <span>RSI 3.52 (R-20)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50">
                      <span className="font-medium">Zone 7A (Edmonton)</span>
                      <span className="font-bold">RSI 3.52 (R-20)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 7B (Yellowknife)</span>
                      <span>RSI 4.23 (R-24)</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span className="font-medium">Zone 8 (Iqaluit)</span>
                      <span>RSI 5.28 (R-30)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-amber-200 bg-amber-50">
                  <h4 className="font-bold text-sm mb-2 text-amber-900">Key Considerations</h4>
                  <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                    <li>Vapor barrier always on warm side (interior in cold climates)</li>
                    <li>Continuous air barrier required for energy efficiency</li>
                    <li>Exterior rigid insulation can improve thermal bridging</li>
                    <li>Window/door rough openings need proper flashing</li>
                    <li>Consider advanced framing (24" OC) to reduce thermal bridging</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roof" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-border rounded-none overflow-hidden bg-white">
                <div className="bg-muted/20 p-3 border-b border-border">
                  <h4 className="font-bold text-sm">Vented Attic Assembly (Climate Zone 7A)</h4>
                </div>
                <div className="p-6">
                  <svg viewBox="0 0 400 450" className="w-full">
                    {/* Shingles */}
                    <path d="M50,80 L200,20 L350,80" fill="#8B0000" stroke="#000" strokeWidth="2"/>
                    <path d="M60,85 L90,75 L90,95 L60,105 Z" fill="#A52A2A" stroke="#000" strokeWidth="1"/>
                    <path d="M95,72 L125,62 L125,82 L95,92 Z" fill="#8B0000" stroke="#000" strokeWidth="1"/>
                    <path d="M130,59 L160,49 L160,69 L130,79 Z" fill="#A52A2A" stroke="#000" strokeWidth="1"/>
                    <text x="200" y="50" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">Asphalt Shingles</text>
                    
                    {/* Underlayment */}
                    <path d="M50,80 L200,20 L350,80 L350,90 L200,30 L50,90 Z" fill="#333" stroke="#000" strokeWidth="1"/>
                    <text x="280" y="70" fontSize="10" fill="#fff">Underlayment</text>
                    
                    {/* Sheathing */}
                    <path d="M50,90 L200,30 L350,90 L350,105 L200,45 L50,105 Z" fill="#D2691E" stroke="#000" strokeWidth="2"/>
                    <text x="280" y="95" fontSize="11" fill="#fff">OSB/Plywood (12mm)</text>
                    
                    {/* Ventilation space */}
                    <path d="M50,105 L200,45 L350,105 L350,125 L200,65 L50,125 Z" fill="#E8F4F8" stroke="#000" strokeWidth="1" strokeDasharray="3,3"/>
                    <text x="280" y="115" fontSize="10" fill="#333">Vent Space (63mm min)</text>
                    <circle cx="100" cy="115" r="3" fill="#4A90E2"/>
                    <circle cx="150" cy="95" r="3" fill="#4A90E2"/>
                    <circle cx="250" cy="95" r="3" fill="#4A90E2"/>
                    <circle cx="300" cy="115" r="3" fill="#4A90E2"/>
                    
                    {/* Rafters */}
                    <rect x="80" y="125" width="15" height="120" fill="#8B4513" stroke="#000" strokeWidth="1" transform="rotate(-25 87 185)"/>
                    <rect x="180" y="65" width="15" height="120" fill="#8B4513" stroke="#000" strokeWidth="1" transform="rotate(-25 187 125)"/>
                    <rect x="280" y="125" width="15" height="120" fill="#8B4513" stroke="#000" strokeWidth="1" transform="rotate(25 287 185)"/>
                    
                    {/* Insulation */}
                    <path d="M50,125 L200,65 L350,125 L350,245 L200,185 L50,245 Z" fill="#FFE4B5" stroke="#000" strokeWidth="2"/>
                    <path d="M50,125 L200,65 L350,125 L350,245 L200,185 L50,245 Z" fill="url(#insulation)"/>
                    <text x="200" y="170" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#8B4513">R-50 Blown Insulation</text>
                    <text x="200" y="190" textAnchor="middle" fontSize="11" fill="#8B4513">(400mm depth)</text>
                    
                    {/* Vapor barrier */}
                    <path d="M50,245 L200,185 L350,245 L350,255 L200,195 L50,255 Z" fill="#4A90E2" stroke="#000" strokeWidth="2"/>
                    <text x="200" y="230" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">Polyethylene Vapor Barrier</text>
                    
                    {/* Drywall ceiling */}
                    <line x1="50" y1="255" x2="350" y2="255" stroke="#000" strokeWidth="3"/>
                    <rect x="50" y="255" width="300" height="15" fill="#F5F5DC" stroke="#000" strokeWidth="2"/>
                    <text x="200" y="267" textAnchor="middle" fontSize="11" fill="#333">Gypsum Ceiling (13mm)</text>
                    
                    {/* Interior label */}
                    <text x="200" y="295" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">INTERIOR (Conditioned Space)</text>
                    
                    {/* Ventilation arrows */}
                    <path d="M30,115 L45,115" stroke="#4A90E2" strokeWidth="2" markerEnd="url(#arrowblue)"/>
                    <path d="M370,115 L355,115" stroke="#4A90E2" strokeWidth="2" markerEnd="url(#arrowblue)"/>
                    <text x="25" y="110" fontSize="9" fill="#4A90E2" fontWeight="bold">Soffit</text>
                    <text x="355" y="110" fontSize="9" fill="#4A90E2" fontWeight="bold" textAnchor="end">Ridge</text>
                    
                    {/* Dimension */}
                    <line x1="360" y1="125" x2="360" y2="245" stroke="#E74C3C" strokeWidth="2"/>
                    <line x1="355" y1="125" x2="365" y2="125" stroke="#E74C3C" strokeWidth="2"/>
                    <line x1="355" y1="245" x2="365" y2="245" stroke="#E74C3C" strokeWidth="2"/>
                    <text x="370" y="190" fontSize="12" fontWeight="bold" fill="#E74C3C">400mm</text>
                    
                    <defs>
                      <marker id="arrowblue" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L9,3 z" fill="#4A90E2" />
                      </marker>
                    </defs>
                  </svg>
                </div>
                <div className="p-4 bg-muted/10 border-t border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Effective R-Value:</span>
                    <Badge variant="default" className="bg-green-600">RSI 8.81 (R-50)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">NBC 9.36 Requirement:</span>
                    <Badge variant="outline">RSI 7.04 (R-40) min</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Note:</strong> Continuous ventilation from soffit to ridge required (1:300 ratio). Baffles at eaves mandatory.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-border bg-card">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Attic Insulation Requirements (NBC 9.36)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 4 (Vancouver)</span>
                      <span>RSI 5.46 (R-31)</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span className="font-medium">Zone 5 (Toronto)</span>
                      <span>RSI 6.69 (R-38)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 6 (Ottawa)</span>
                      <span>RSI 7.04 (R-40)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50">
                      <span className="font-medium">Zone 7A (Edmonton)</span>
                      <span className="font-bold">RSI 7.04 (R-40)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 7B (Yellowknife)</span>
                      <span>RSI 8.81 (R-50)</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span className="font-medium">Zone 8 (Iqaluit)</span>
                      <span>RSI 10.57 (R-60)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-amber-200 bg-amber-50">
                  <h4 className="font-bold text-sm mb-2 text-amber-900">Ventilation Requirements</h4>
                  <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                    <li><strong>Vent ratio:</strong> 1:300 (vent area to ceiling area)</li>
                    <li><strong>Min clearance:</strong> 63mm above insulation</li>
                    <li>Soffit and ridge vents required for cross-ventilation</li>
                    <li>Baffles/chutes at eaves to maintain airflow</li>
                    <li>Seal all penetrations (pot lights, exhaust fans)</li>
                    <li>Attic hatch must be insulated and weather-stripped</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="foundation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-border rounded-none overflow-hidden bg-white">
                <div className="bg-muted/20 p-3 border-b border-border">
                  <h4 className="font-bold text-sm">Basement Foundation (Climate Zone 7A)</h4>
                </div>
                <div className="p-6">
                  <svg viewBox="0 0 400 550" className="w-full">
                    {/* Grade line */}
                    <line x1="0" y1="150" x2="400" y2="150" stroke="#8B4513" strokeWidth="4"/>
                    <text x="10" y="145" fontSize="12" fontWeight="bold" fill="#8B4513">GRADE</text>
                    
                    {/* Above grade wall */}
                    <rect x="100" y="50" width="200" height="100" fill="#F5F5DC" stroke="#000" strokeWidth="2"/>
                    <text x="200" y="105" textAnchor="middle" fontSize="11" fill="#333">Above Grade Wall</text>
                    
                    {/* Concrete foundation wall */}
                    <rect x="100" y="150" width="200" height="250" fill="#808080" stroke="#000" strokeWidth="3"/>
                    <pattern id="concrete" patternUnits="userSpaceOnUse" width="10" height="10">
                      <circle cx="2" cy="2" r="1" fill="#666"/>
                      <circle cx="7" cy="7" r="1" fill="#666"/>
                    </pattern>
                    <rect x="100" y="150" width="200" height="250" fill="url(#concrete)" opacity="0.3"/>
                    <text x="200" y="200" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">200mm Concrete</text>
                    <text x="200" y="215" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">Foundation Wall</text>
                    
                    {/* Exterior rigid insulation */}
                    <rect x="70" y="150" width="30" height="250" fill="#FF69B4" stroke="#000" strokeWidth="2"/>
                    <text x="85" y="270" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff" transform="rotate(-90 85 270)">R-12 XPS (50mm)</text>
                    
                    {/* Dampproofing */}
                    <rect x="65" y="150" width="5" height="250" fill="#000"/>
                    <text x="50" y="275" fontSize="9" fill="#000" transform="rotate(-90 50 275)">Damp-proofing</text>
                    
                    {/* Interior insulation */}
                    <rect x="300" y="150" width="40" height="250" fill="#FFE4B5" stroke="#000" strokeWidth="2"/>
                    <rect x="300" y="150" width="40" height="250" fill="url(#insulation)" opacity="0.7"/>
                    <text x="320" y="270" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8B4513" transform="rotate(-90 320 270)">R-12 Batt (89mm)</text>
                    
                    {/* Studs */}
                    <rect x="305" y="160" width="10" height="230" fill="#8B4513" stroke="#000" strokeWidth="1"/>
                    <rect x="325" y="160" width="10" height="230" fill="#8B4513" stroke="#000" strokeWidth="1"/>
                    
                    {/* Vapor barrier */}
                    <rect x="340" y="150" width="5" height="250" fill="#4A90E2"/>
                    
                    {/* Interior drywall */}
                    <rect x="345" y="150" width="15" height="250" fill="#F5F5DC" stroke="#000" strokeWidth="2"/>
                    <text x="352" y="275" textAnchor="middle" fontSize="10" fill="#333" transform="rotate(-90 352 275)">Drywall</text>
                    
                    {/* Footing */}
                    <rect x="60" y="400" width="280" height="60" fill="#696969" stroke="#000" strokeWidth="3"/>
                    <rect x="60" y="400" width="280" height="60" fill="url(#concrete)" opacity="0.4"/>
                    <text x="200" y="435" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">Concrete Footing</text>
                    
                    {/* Gravel base */}
                    <rect x="50" y="460" width="300" height="40" fill="#D3D3D3" stroke="#000" strokeWidth="2"/>
                    <circle cx="80" cy="475" r="4" fill="#999"/>
                    <circle cx="120" cy="485" r="5" fill="#888"/>
                    <circle cx="160" cy="470" r="4" fill="#999"/>
                    <circle cx="200" cy="480" r="5" fill="#888"/>
                    <circle cx="240" cy="475" r="4" fill="#999"/>
                    <circle cx="280" cy="485" r="5" fill="#888"/>
                    <circle cx="320" cy="470" r="4" fill="#999"/>
                    <text x="200" y="485" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#333">Granular Base (150mm min)</text>
                    
                    {/* Undisturbed soil */}
                    <rect x="0" y="500" width="400" height="50" fill="#8B4513"/>
                    <text x="200" y="530" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">Undisturbed Soil</text>
                    
                    {/* Drainage tile */}
                    <circle cx="60" cy="390" r="8" fill="#FF6347" stroke="#000" strokeWidth="2"/>
                    <text x="30" y="395" fontSize="9" fontWeight="bold" fill="#FF6347">Weeping Tile</text>
                    <line x1="60" y1="398" x2="60" y2="460" stroke="#4A90E2" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrowblue)"/>
                    
                    {/* Dimensions */}
                    <line x1="370" y1="150" x2="370" y2="400" stroke="#E74C3C" strokeWidth="2"/>
                    <line x1="365" y1="150" x2="375" y2="150" stroke="#E74C3C" strokeWidth="2"/>
                    <line x1="365" y1="400" x2="375" y2="400" stroke="#E74C3C" strokeWidth="2"/>
                    <text x="385" y="280" fontSize="12" fontWeight="bold" fill="#E74C3C">2400mm</text>
                    
                    {/* Frost depth indicator */}
                    <line x1="0" y1="350" x2="50" y2="350" stroke="#4169E1" strokeWidth="3" strokeDasharray="5,5"/>
                    <text x="5" y="345" fontSize="10" fontWeight="bold" fill="#4169E1">Frost Depth</text>
                    <text x="5" y="360" fontSize="9" fill="#4169E1">(1800mm typ)</text>
                  </svg>
                </div>
                <div className="p-4 bg-muted/10 border-t border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Total R-Value:</span>
                    <Badge variant="default" className="bg-green-600">RSI 4.23 (R-24)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">NBC 9.36 Requirement:</span>
                    <Badge variant="outline">RSI 2.11 (R-12) min</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Note:</strong> Exterior insulation protects foundation from freeze-thaw. Footing must be below frost depth.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-border bg-card">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Foundation Insulation Requirements (NBC 9.36)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 4 (Vancouver)</span>
                      <span>RSI 1.76 (R-10)</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span className="font-medium">Zone 5 (Toronto)</span>
                      <span>RSI 2.11 (R-12)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 6 (Ottawa)</span>
                      <span>RSI 2.11 (R-12)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50">
                      <span className="font-medium">Zone 7A (Edmonton)</span>
                      <span className="font-bold">RSI 2.11 (R-12)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted/30">
                      <span className="font-medium">Zone 7B (Yellowknife)</span>
                      <span>RSI 2.98 (R-17)</span>
                    </div>
                    <div className="flex justify-between p-2">
                      <span className="font-medium">Zone 8 (Iqaluit)</span>
                      <span>RSI 3.52 (R-20)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-amber-200 bg-amber-50">
                  <h4 className="font-bold text-sm mb-2 text-amber-900">Foundation Best Practices</h4>
                  <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                    <li><strong>Footing depth:</strong> Min 1800mm below grade (Edmonton frost depth)</li>
                    <li><strong>Drainage:</strong> Weeping tile at footing level, sloped to sump or daylight</li>
                    <li><strong>Dampproofing:</strong> Required on exterior below grade</li>
                    <li><strong>Exterior insulation:</strong> XPS or EPS, protected above grade</li>
                    <li><strong>Interior insulation:</strong> Must include vapor barrier on warm side</li>
                    <li><strong>Backfill:</strong> Free-draining granular material recommended</li>
                  </ul>
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50">
                  <h4 className="font-bold text-sm mb-2 text-blue-900 flex items-center gap-2">
                    <ArrowDown className="w-4 h-4" /> Frost Depth by Location
                  </h4>
                  <div className="space-y-1 text-xs text-blue-900">
                    <div className="flex justify-between">
                      <span>Vancouver:</span>
                      <span className="font-bold">450mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calgary:</span>
                      <span className="font-bold">1800mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Edmonton:</span>
                      <span className="font-bold">1800mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Winnipeg:</span>
                      <span className="font-bold">2400mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Toronto:</span>
                      <span className="font-bold">1200mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yellowknife:</span>
                      <span className="font-bold">2700mm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
