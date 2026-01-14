import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Flame, Ruler, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ConstructionTypesDiagram() {
  const constructionTypes = [
    {
      id: "type-i",
      type: "Type I",
      name: "Fire-Resistive",
      description: "Highest fire resistance. Non-combustible construction throughout.",
      color: "bg-red-100 border-red-300 text-red-900",
      headerColor: "bg-red-600 text-white",
      fireRating: "3-4 hours",
      structuralFrame: "3-4 hr",
      bearingWalls: "3-4 hr",
      floors: "2 hr",
      roof: "1.5-2 hr",
      materials: ["Concrete", "Steel with fireproofing", "Masonry"],
      heightLimit: "Unlimited",
      areaLimit: "Unlimited",
      examples: ["High-rise buildings", "Hospitals", "Large assembly buildings"],
      advantages: ["Highest fire resistance", "Unlimited height/area", "Longest evacuation time"],
      limitations: ["Most expensive", "Longest construction time", "Requires skilled labor"],
    },
    {
      id: "type-ii",
      type: "Type II",
      name: "Non-Combustible",
      description: "Non-combustible materials with varying fire resistance ratings.",
      color: "bg-orange-100 border-orange-300 text-orange-900",
      headerColor: "bg-orange-600 text-white",
      fireRating: "0-2 hours",
      structuralFrame: "0-2 hr",
      bearingWalls: "0-2 hr",
      floors: "0-2 hr",
      roof: "0-1 hr",
      materials: ["Unprotected steel", "Concrete block", "Tilt-up concrete"],
      heightLimit: "Variable (typically 4-6 storeys)",
      areaLimit: "Variable by occupancy",
      examples: ["Shopping centers", "Warehouses", "Low-rise offices"],
      advantages: ["Lower cost than Type I", "Non-combustible", "Moderate fire resistance"],
      limitations: ["Height/area restrictions", "Steel can fail in fire", "Limited flexibility"],
    },
    {
      id: "type-iii",
      type: "Type III",
      name: "Ordinary Construction",
      description: "Non-combustible exterior walls, combustible interior construction.",
      color: "bg-yellow-100 border-yellow-300 text-yellow-900",
      headerColor: "bg-yellow-600 text-white",
      fireRating: "0-2 hours",
      structuralFrame: "0-1 hr",
      bearingWalls: "2 hr (exterior), 0-1 hr (interior)",
      floors: "0-1 hr",
      roof: "0-1 hr",
      materials: ["Masonry exterior", "Wood frame interior", "Steel joists"],
      heightLimit: "Typically 3-4 storeys",
      areaLimit: "Moderate",
      examples: ["Mixed-use buildings", "Older urban buildings", "Strip malls"],
      advantages: ["Cost-effective", "Fire-resistant exterior", "Common construction type"],
      limitations: ["Combustible interior", "Height restrictions", "Fire can spread internally"],
    },
    {
      id: "type-iv",
      type: "Type IV",
      name: "Heavy Timber",
      description: "Large dimension wood members with non-combustible exterior walls.",
      color: "bg-amber-100 border-amber-300 text-amber-900",
      headerColor: "bg-amber-700 text-white",
      fireRating: "Heavy Timber (HT)",
      structuralFrame: "HT",
      bearingWalls: "2 hr (exterior), HT (interior)",
      floors: "HT",
      roof: "HT",
      materials: ["Heavy timber (min 140mm)", "Glulam beams", "Masonry exterior"],
      heightLimit: "Typically 3-4 storeys",
      areaLimit: "Moderate",
      examples: ["Historic mills", "Modern mass timber buildings", "Breweries"],
      advantages: ["Aesthetic appeal", "Slow-burning large members", "Sustainable"],
      limitations: ["Combustible", "Size requirements", "Special detailing needed"],
    },
    {
      id: "type-v",
      type: "Type V",
      name: "Wood Frame",
      description: "Combustible wood frame construction throughout.",
      color: "bg-green-100 border-green-300 text-green-900",
      headerColor: "bg-green-600 text-white",
      fireRating: "0-1 hour",
      structuralFrame: "0-1 hr",
      bearingWalls: "0-1 hr",
      floors: "0-1 hr",
      roof: "0-1 hr",
      materials: ["Wood studs", "Wood joists", "Wood sheathing"],
      heightLimit: "Typically 2-3 storeys (up to 6 with sprinklers)",
      areaLimit: "Limited",
      examples: ["Single-family homes", "Low-rise apartments", "Small commercial"],
      advantages: ["Lowest cost", "Fastest construction", "Most common residential type"],
      limitations: ["Combustible", "Strict height/area limits", "Lower fire resistance"],
    },
    {
      id: "type-vi",
      type: "Type VI",
      name: "Mass Timber",
      description: "Engineered mass timber construction (CLT, NLT, Glulam).",
      color: "bg-teal-100 border-teal-300 text-teal-900",
      headerColor: "bg-teal-600 text-white",
      fireRating: "Encapsulated Mass Timber",
      structuralFrame: "EMT",
      bearingWalls: "EMT",
      floors: "EMT",
      roof: "EMT",
      materials: ["Cross-laminated timber (CLT)", "Nail-laminated timber (NLT)", "Glulam"],
      heightLimit: "Up to 12 storeys (NBC 2020+)",
      areaLimit: "Varies by height",
      examples: ["Mid-rise residential", "Modern office buildings", "Institutional"],
      advantages: ["Sustainable", "Aesthetic", "Predictable fire performance", "Fast construction"],
      limitations: ["Newer code provisions", "Requires encapsulation", "Limited availability"],
    },
  ];

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
          <Building2 className="w-5 h-5" />
          Construction Types Visual Guide (NBC Part 3.2.2)
        </CardTitle>
        <CardDescription className="text-purple-800">
          Comprehensive overview of construction types from Type I (Fire-Resistive) to Type VI (Mass Timber) with fire ratings, materials, and limitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="type-i" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            {constructionTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-xs">
                {type.type}
              </TabsTrigger>
            ))}
          </TabsList>

          {constructionTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="space-y-6">
              {/* Header Card */}
              <Card className={`${type.color} border-2`}>
                <CardHeader className={`${type.headerColor} pb-3`}>
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <Building2 className="w-8 h-8" />
                    {type.type}: {type.name}
                  </CardTitle>
                  <CardDescription className="text-white/90 text-base mt-2">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="w-4 h-4" />
                        <span className="font-bold text-sm">Fire Resistance Rating</span>
                      </div>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {type.fireRating}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Ruler className="w-4 h-4" />
                        <span className="font-bold text-sm">Height Limit</span>
                      </div>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {type.heightLimit}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fire Ratings Table */}
              <Card>
                <CardHeader className="pb-3 bg-muted/20">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    Fire-Resistance Ratings by Building Element
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-muted/30 rounded border">
                      <div className="font-bold mb-1">Structural Frame</div>
                      <Badge variant="secondary">{type.structuralFrame}</Badge>
                    </div>
                    <div className="p-3 bg-muted/30 rounded border">
                      <div className="font-bold mb-1">Bearing Walls</div>
                      <Badge variant="secondary">{type.bearingWalls}</Badge>
                    </div>
                    <div className="p-3 bg-muted/30 rounded border">
                      <div className="font-bold mb-1">Floor Construction</div>
                      <Badge variant="secondary">{type.floors}</Badge>
                    </div>
                    <div className="p-3 bg-muted/30 rounded border">
                      <div className="font-bold mb-1">Roof Construction</div>
                      <Badge variant="secondary">{type.roof}</Badge>
                    </div>
                    <div className="p-3 bg-muted/30 rounded border col-span-2">
                      <div className="font-bold mb-1">Area Limit</div>
                      <Badge variant="secondary">{type.areaLimit}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Materials & Examples */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3 bg-muted/20">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">
                      Typical Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {type.materials.map((material, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          {material}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 bg-muted/20">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">
                      Common Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {type.examples.map((example, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Advantages & Limitations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-green-900">
                      ✓ Advantages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ul className="space-y-2">
                      {type.advantages.map((adv, idx) => (
                        <li key={idx} className="text-sm text-green-900 flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Limitations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ul className="space-y-2">
                      {type.limitations.map((lim, idx) => (
                        <li key={idx} className="text-sm text-amber-900 flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          {lim}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Reference Table */}
        <Card className="mt-6 border-2 border-purple-200">
          <CardHeader className="pb-3 bg-purple-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-purple-900">
              Quick Reference: Construction Type Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2 text-left font-bold">Type</th>
                  <th className="border p-2 text-left font-bold">Name</th>
                  <th className="border p-2 text-left font-bold">Fire Rating</th>
                  <th className="border p-2 text-left font-bold">Height Limit</th>
                  <th className="border p-2 text-left font-bold">Primary Use</th>
                </tr>
              </thead>
              <tbody>
                {constructionTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-muted/30">
                    <td className="border p-2 font-bold">{type.type}</td>
                    <td className="border p-2">{type.name}</td>
                    <td className="border p-2">{type.fireRating}</td>
                    <td className="border p-2">{type.heightLimit}</td>
                    <td className="border p-2">{type.examples[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mt-6 border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold mb-2">Important Notes:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Construction type selection depends on occupancy classification, building height, and floor area</li>
                  <li>Sprinkler systems can provide significant trade-offs (increased height/area limits, reduced fire ratings)</li>
                  <li>Type VI (Mass Timber) is a newer construction type introduced in NBC 2020 for mid-rise buildings</li>
                  <li>Fire-resistance ratings refer to the time a building element can withstand standard fire exposure</li>
                  <li>Always verify specific requirements with NBC Part 3 and local Authority Having Jurisdiction (AHJ)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
