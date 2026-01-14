import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, ArrowRight, Users, AlertTriangle } from "lucide-react";

export function EgressPathDiagram() {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
          <DoorOpen className="w-5 h-5" />
          Egress Path Analysis
        </CardTitle>
        <CardDescription className="text-blue-800">
          Visual representation of required egress components and travel distances (NBC Part 3.4)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Diagram */}
          <div className="relative bg-white p-8 rounded-lg border-2 border-blue-200">
            {/* Room/Space */}
            <div className="relative border-4 border-gray-800 rounded-lg p-12 bg-gray-50">
              <div className="absolute top-2 left-2 text-xs font-bold text-gray-600">
                OCCUPANCY SPACE
              </div>
              
              {/* Occupants */}
              <div className="absolute top-8 right-8 flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">Occupant Load</span>
              </div>

              {/* Travel Distance Arrow */}
              <div className="relative">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex-1 border-t-4 border-dashed border-red-500 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-100 px-3 py-1 rounded-full whitespace-nowrap">
                      <span className="text-xs font-bold text-red-700">Travel Distance</span>
                    </div>
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </div>

                {/* Exit Door */}
                <div className="flex justify-end">
                  <div className="relative">
                    <div className="w-24 h-32 bg-gradient-to-r from-green-600 to-green-500 rounded-lg shadow-xl flex flex-col items-center justify-center">
                      <DoorOpen className="w-8 h-8 text-white mb-2" />
                      <span className="text-xs font-bold text-white">EXIT</span>
                      <Badge variant="secondary" className="mt-2 text-[10px] bg-white text-green-700">
                        Min 900mm
                      </Badge>
                    </div>
                    {/* Exit Sign */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded text-xs font-bold shadow-lg">
                      EXIT ↓
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Corridor/Hallway */}
            <div className="mt-4 border-4 border-gray-600 rounded-lg p-6 bg-gray-100 relative">
              <div className="absolute top-2 left-2 text-xs font-bold text-gray-600">
                CORRIDOR / HALLWAY
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium">Min Width: 1100mm</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">Dead-End Limit: 6m</span>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Exit Stair */}
            <div className="mt-4 border-4 border-blue-600 rounded-lg p-6 bg-blue-100 relative">
              <div className="absolute top-2 left-2 text-xs font-bold text-blue-700">
                EXIT STAIR / VERTICAL EXIT
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Min Width</div>
                  <div className="text-sm font-bold text-blue-900">1100mm</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Fire Rating</div>
                  <div className="text-sm font-bold text-blue-900">2 hours</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Pressurization</div>
                  <div className="text-sm font-bold text-blue-900">Required*</div>
                </div>
              </div>
            </div>

            {/* Ground Level Exit */}
            <div className="mt-4 border-4 border-green-600 rounded-lg p-4 bg-green-50 relative flex items-center justify-center">
              <div className="absolute top-2 left-2 text-xs font-bold text-green-700">
                EXTERIOR / PUBLIC WAY
              </div>
              <div className="mt-2 text-center">
                <DoorOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-green-900">SAFE ASSEMBLY POINT</div>
                <div className="text-xs text-green-700 mt-1">Open air or public thoroughfare</div>
              </div>
            </div>
          </div>

          {/* Key Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">
                  Travel Distance Limits (NBC 3.4.2.5)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assembly (Sprinklered)</span>
                    <Badge variant="outline">60m</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assembly (Unsprinklered)</span>
                    <Badge variant="outline">40m</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Residential (Sprinklered)</span>
                    <Badge variant="outline">45m</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Residential (Unsprinklered)</span>
                    <Badge variant="outline">30m</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">
                  Exit Width Requirements (NBC 3.4.3)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Minimum Door Width</span>
                    <Badge variant="outline">900mm</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Minimum Corridor Width</span>
                    <Badge variant="outline">1100mm</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Width per Person (Doors)</span>
                    <Badge variant="outline">4.8mm</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Width per Person (Stairs)</span>
                    <Badge variant="outline">6.1mm</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notes */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-xs text-amber-900 leading-relaxed">
                  <p>
                    <strong>Key Egress Principles:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Continuous Path:</strong> Egress path must be continuous from any point in building to exterior</li>
                    <li><strong>Two Exits:</strong> Required when occupant load exceeds 60 persons (NBC 3.4.2.1)</li>
                    <li><strong>Dead-End Corridors:</strong> Limited to 6m unsprinklered, 9m sprinklered (NBC 3.4.2.4)</li>
                    <li><strong>Exit Separation:</strong> Exits must be separated by at least half the diagonal of the area served</li>
                    <li><strong>Stair Pressurization:</strong> Required for buildings over 3 storeys in most occupancies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
