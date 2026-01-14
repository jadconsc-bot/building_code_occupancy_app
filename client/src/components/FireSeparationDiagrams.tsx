import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Flame, Building2, ShoppingBag, Users, Home, Briefcase, Factory, Hospital, Car } from "lucide-react";

interface SeparationExample {
  id: string;
  title: string;
  occupancy1: {
    code: string;
    name: string;
    color: string;
    icon: any;
  };
  occupancy2: {
    code: string;
    name: string;
    color: string;
    icon: any;
  };
  rating: string;
  description: string;
  notes: string[];
}

const examples: SeparationExample[] = [
  {
    id: "residential-commercial",
    title: "Residential Above Commercial",
    occupancy1: {
      code: "C",
      name: "Residential",
      color: "#3b82f6",
      icon: Home
    },
    occupancy2: {
      code: "D",
      name: "Business/Mercantile",
      color: "#8b5cf6",
      icon: ShoppingBag
    },
    rating: "1 hour",
    description: "Common scenario: Apartments above retail shops or offices",
    notes: [
      "Floor assembly must provide 1-hour fire resistance",
      "Includes protection of structural members",
      "Penetrations must be fire-stopped",
      "Applies to both sprinklered and non-sprinklered buildings"
    ]
  },
  {
    id: "assembly-business",
    title: "Assembly Adjacent to Business",
    occupancy1: {
      code: "A-2",
      name: "Assembly (Restaurant)",
      color: "#ef4444",
      icon: Users
    },
    occupancy2: {
      code: "D",
      name: "Business Office",
      color: "#8b5cf6",
      icon: Briefcase
    },
    rating: "1 hour",
    description: "Restaurant next to office space in mixed-use building",
    notes: [
      "Vertical separation: 1-hour fire-rated wall",
      "Doors in separation must be 45-min fire-rated",
      "Ductwork penetrations require fire dampers",
      "Each occupancy may have separate exit requirements"
    ]
  },
  {
    id: "residential-assembly",
    title: "Residential Above Assembly",
    occupancy1: {
      code: "C",
      name: "Residential",
      color: "#3b82f6",
      icon: Home
    },
    occupancy2: {
      code: "A-2",
      name: "Assembly (Restaurant)",
      color: "#ef4444",
      icon: Users
    },
    rating: "2 hours",
    description: "Apartments above restaurant or entertainment venue",
    notes: [
      "Higher rating due to life safety concerns",
      "2-hour floor assembly required",
      "Often requires sprinkler system throughout",
      "Sound insulation also typically required (STC rating)",
      "Separate exits for each occupancy mandatory"
    ]
  },
  {
    id: "mercantile-storage",
    title: "Mercantile with Storage",
    occupancy1: {
      code: "E",
      name: "Mercantile",
      color: "#10b981",
      icon: ShoppingBag
    },
    occupancy2: {
      code: "F-2",
      name: "Low Hazard Storage",
      color: "#f59e0b",
      icon: Building2
    },
    rating: "1 hour",
    description: "Retail store with back-of-house storage area",
    notes: [
      "1-hour separation wall required",
      "Storage area may have different sprinkler requirements",
      "Fire-rated doors with self-closers required",
      "Storage height restrictions may apply"
    ]
  },
  {
    id: "industrial-residential",
    title: "Industrial & Residential",
    occupancy1: {
      code: "F-2",
      name: "Industrial - Medium Hazard",
      color: "#f97316",
      icon: Factory
    },
    occupancy2: {
      code: "C",
      name: "Residential",
      color: "#3b82f6",
      icon: Home
    },
    rating: "2 hours",
    description: "Light manufacturing or warehouse adjacent to residential units",
    notes: [
      "2-hour fire-resistance rated wall required between occupancies",
      "Higher hazard industrial uses require stricter separation",
      "Consider noise, vibration, and air quality impacts on residents",
      "Separate HVAC systems typically required to prevent cross-contamination",
      "Loading docks and truck access should be separated from residential areas"
    ]
  },
  {
    id: "healthcare-business",
    title: "Healthcare & Business",
    occupancy1: {
      code: "B-2",
      name: "Institutional - Treatment/Care",
      color: "#dc2626",
      icon: Hospital
    },
    occupancy2: {
      code: "D",
      name: "Business & Personal Services",
      color: "#8b5cf6",
      icon: Briefcase
    },
    rating: "1 hour",
    description: "Medical clinic or care facility with adjacent office space",
    notes: [
      "1-hour fire-resistance rated separation required",
      "May be reduced to 45 minutes if fully sprinklered (verify NBC 3.2.3.7)",
      "Maintain separate egress paths for healthcare occupants",
      "Consider infection control and patient privacy requirements",
      "Emergency power requirements may differ between occupancies"
    ]
  },
  {
    id: "parking-residential",
    title: "Parking & Residential",
    occupancy1: {
      code: "F-3",
      name: "Parking Garage (Low Hazard)",
      color: "#6b7280",
      icon: Car
    },
    occupancy2: {
      code: "C",
      name: "Residential",
      color: "#3b82f6",
      icon: Home
    },
    rating: "1 hour",
    description: "Underground or podium parking below residential tower",
    notes: [
      "1-hour fire-resistance rated floor/ceiling assembly required",
      "Parking garage must have adequate ventilation (natural or mechanical)",
      "Carbon monoxide detection required in enclosed parking areas",
      "Sprinklers typically required in parking garage",
      "Drainage system must prevent fuel spills from reaching residential areas"
    ]
  }
];

export function FireSeparationDiagrams() {
  const [selectedExample, setSelectedExample] = useState<SeparationExample>(examples[0]);

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-red-900">
            <Flame className="w-5 h-5" />
            Fire Separation Between Occupancies
          </CardTitle>
          <CardDescription className="text-red-800">
            Visual examples of fire-resistance ratings required between different major occupancy classifications (NBC Table 3.1.3.1)
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue={examples[0].id} onValueChange={(id) => {
        const example = examples.find(e => e.id === id);
        if (example) setSelectedExample(example);
      }}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 h-auto">
          {examples.map((ex) => (
            <TabsTrigger key={ex.id} value={ex.id} className="flex-col h-auto py-3 px-2">
              <span className="text-xs font-bold">{ex.title}</span>
              <Badge variant="destructive" className="mt-1 text-[10px]">
                {ex.rating}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {examples.map((example) => (
          <TabsContent key={example.id} value={example.id} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Visual Diagram */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2 bg-muted/20">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">
                    Visual Representation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                    {/* Occupancy 1 */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(to right, ${example.occupancy1.color}20 0%, ${example.occupancy1.color}40 45%, transparent 50%)`,
                      }}
                    >
                      <div className="absolute left-8 top-1/2 -translate-y-1/2 text-center">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-lg"
                          style={{ backgroundColor: example.occupancy1.color }}
                        >
                          <example.occupancy1.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="font-bold text-sm" style={{ color: example.occupancy1.color }}>
                          {example.occupancy1.code}
                        </div>
                        <div className="text-xs text-gray-700 max-w-[100px]">
                          {example.occupancy1.name}
                        </div>
                      </div>
                    </div>

                    {/* Fire Separation */}
                    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-8 bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-xl">
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Flame className="w-5 h-5 text-white mb-1 animate-pulse" />
                        <div className="writing-mode-vertical text-white font-bold text-xs tracking-wider transform rotate-180">
                          {example.rating.toUpperCase()}
                        </div>
                        <Flame className="w-5 h-5 text-white mt-1 animate-pulse" />
                      </div>
                      {/* Fire resistance pattern */}
                      <div className="absolute inset-0 opacity-20">
                        {[...Array(10)].map((_, i) => (
                          <div 
                            key={i} 
                            className="h-[10%] border-t border-white"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Occupancy 2 */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(to left, ${example.occupancy2.color}20 0%, ${example.occupancy2.color}40 45%, transparent 50%)`,
                      }}
                    >
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 text-center">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-lg"
                          style={{ backgroundColor: example.occupancy2.color }}
                        >
                          <example.occupancy2.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="font-bold text-sm" style={{ color: example.occupancy2.color }}>
                          {example.occupancy2.code}
                        </div>
                        <div className="text-xs text-gray-700 max-w-[100px]">
                          {example.occupancy2.name}
                        </div>
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg">
                      <div className="text-xs font-bold text-gray-700 text-center">
                        Fire-Resistance Rating: <span className="text-red-600">{example.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs font-bold mb-2 text-muted-foreground">Legend:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded"></div>
                        <span>Fire-rated assembly</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="w-3 h-3 text-red-600" />
                        <span>Fire protection</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3 bg-muted/20">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">
                      Scenario Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm leading-relaxed mb-4">
                      {example.description}
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Flame className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-red-900 mb-1">Required Rating</div>
                        <div className="text-lg font-bold text-red-600">{example.rating}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 bg-muted/20">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">
                      Key Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {example.notes.map((note, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0"></div>
                          <span className="text-muted-foreground leading-relaxed">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <div className="text-amber-600 font-bold text-xs">⚠️</div>
                      <div className="text-xs text-amber-900 leading-relaxed">
                        <strong>Important:</strong> These are general requirements from NBC Table 3.1.3.1. 
                        Actual requirements may vary based on building height, area, sprinkler protection, 
                        and specific Alberta Building Code amendments. Always verify with current code provisions.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Reference Table */}
      <Card>
        <CardHeader className="pb-3 bg-muted/20">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Common Fire Separation Requirements (Hours)
          </CardTitle>
          <CardDescription className="text-xs">
            Quick reference for typical occupancy combinations (NBC Table 3.1.3.1)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 px-3 font-bold text-xs uppercase">From / To</th>
                  <th className="text-center py-2 px-3 font-bold text-xs">A (Assembly)</th>
                  <th className="text-center py-2 px-3 font-bold text-xs">C (Residential)</th>
                  <th className="text-center py-2 px-3 font-bold text-xs">D (Business)</th>
                  <th className="text-center py-2 px-3 font-bold text-xs">E (Mercantile)</th>
                  <th className="text-center py-2 px-3 font-bold text-xs">F (Industrial)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-3 font-bold">A (Assembly)</td>
                  <td className="text-center py-2 px-3">-</td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">2h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">2h</Badge></td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-3 font-bold">C (Residential)</td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">2h</Badge></td>
                  <td className="text-center py-2 px-3">-</td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">2h</Badge></td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-3 font-bold">D (Business)</td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3">-</td>
                  <td className="text-center py-2 px-3"><Badge variant="outline">None</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="py-2 px-3 font-bold">E (Mercantile)</td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="outline">None</Badge></td>
                  <td className="text-center py-2 px-3">-</td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="py-2 px-3 font-bold">F (Industrial)</td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">2h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">2h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3"><Badge variant="destructive">1h</Badge></td>
                  <td className="text-center py-2 px-3">-</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Note: These are simplified general requirements. Actual ratings depend on building classification, 
            sprinkler protection, and specific occupancy sub-classifications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
