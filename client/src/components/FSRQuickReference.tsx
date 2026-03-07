import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Flame, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Quick reference data for common building materials
interface MaterialFSR {
  material: string;
  fsr: number;
  sdr: number;
  class: "A" | "B" | "C" | "D";
  category: string;
}

const commonMaterials: MaterialFSR[] = [
  // Class A Materials (FSR 0-25)
  { material: "Brick", fsr: 0, sdr: 0, class: "A", category: "Masonry" },
  { material: "Concrete", fsr: 0, sdr: 0, class: "A", category: "Masonry" },
  { material: "Stone", fsr: 0, sdr: 0, class: "A", category: "Masonry" },
  { material: "Ceramic Tile", fsr: 0, sdr: 0, class: "A", category: "Masonry" },
  { material: "Glass", fsr: 0, sdr: 0, class: "A", category: "Glass" },
  { material: "Steel", fsr: 0, sdr: 0, class: "A", category: "Metal" },
  { material: "Aluminum", fsr: 0, sdr: 0, class: "A", category: "Metal" },
  { material: "Gypsum Board (Type X)", fsr: 10, sdr: 25, class: "A", category: "Drywall" },
  { material: "Gypsum Board (Regular)", fsr: 15, sdr: 30, class: "A", category: "Drywall" },
  { material: "Cement Board", fsr: 0, sdr: 0, class: "A", category: "Board" },
  { material: "Mineral Fiber Ceiling", fsr: 15, sdr: 10, class: "A", category: "Ceiling" },
  
  // Class B Materials (FSR 26-75)
  { material: "Oak (Red)", fsr: 100, sdr: 100, class: "C", category: "Wood" },
  { material: "Oak (White)", fsr: 100, sdr: 100, class: "C", category: "Wood" },
  { material: "Maple", fsr: 104, sdr: 100, class: "C", category: "Wood" },
  { material: "Birch", fsr: 105, sdr: 100, class: "C", category: "Wood" },
  { material: "Fire-Retardant Plywood", fsr: 25, sdr: 50, class: "A", category: "Wood" },
  { material: "FR Treated Lumber", fsr: 25, sdr: 25, class: "A", category: "Wood" },
  { material: "Fiber Cement Siding", fsr: 0, sdr: 0, class: "A", category: "Siding" },
  
  // Class C Materials (FSR 76-200)
  { material: "Douglas Fir Plywood", fsr: 100, sdr: 100, class: "C", category: "Wood" },
  { material: "Southern Pine", fsr: 130, sdr: 100, class: "C", category: "Wood" },
  { material: "Spruce", fsr: 65, sdr: 100, class: "B", category: "Wood" },
  { material: "Cedar (Western Red)", fsr: 70, sdr: 100, class: "B", category: "Wood" },
  { material: "Pine (Ponderosa)", fsr: 105, sdr: 100, class: "C", category: "Wood" },
  { material: "Particleboard", fsr: 116, sdr: 200, class: "C", category: "Composite" },
  { material: "MDF", fsr: 167, sdr: 200, class: "C", category: "Composite" },
  { material: "OSB", fsr: 150, sdr: 200, class: "C", category: "Composite" },
  { material: "Hardboard", fsr: 100, sdr: 150, class: "C", category: "Composite" },
  
  // Insulation
  { material: "Fiberglass Insulation", fsr: 25, sdr: 50, class: "A", category: "Insulation" },
  { material: "Mineral Wool", fsr: 0, sdr: 0, class: "A", category: "Insulation" },
  { material: "Spray Foam (Closed Cell)", fsr: 25, sdr: 350, class: "A", category: "Insulation" },
  { material: "EPS Foam (Faced)", fsr: 25, sdr: 450, class: "A", category: "Insulation" },
  { material: "XPS Foam (Unfaced)", fsr: 75, sdr: 450, class: "B", category: "Insulation" },
  
  // Finishes
  { material: "Latex Paint on Gypsum", fsr: 15, sdr: 30, class: "A", category: "Paint" },
  { material: "Oil Paint on Gypsum", fsr: 20, sdr: 50, class: "A", category: "Paint" },
  { material: "Vinyl Wallcovering", fsr: 25, sdr: 100, class: "A", category: "Wallcovering" },
  { material: "Paper Wallcovering", fsr: 50, sdr: 100, class: "B", category: "Wallcovering" },
  { material: "Fabric Wallcovering", fsr: 75, sdr: 200, class: "B", category: "Wallcovering" },
  
  // Flooring
  { material: "Carpet (Wool)", fsr: 75, sdr: 200, class: "B", category: "Flooring" },
  { material: "Carpet (Nylon)", fsr: 100, sdr: 400, class: "C", category: "Flooring" },
  { material: "Vinyl Flooring", fsr: 25, sdr: 100, class: "A", category: "Flooring" },
  { material: "Hardwood Flooring", fsr: 100, sdr: 100, class: "C", category: "Flooring" },
  { material: "Laminate Flooring", fsr: 75, sdr: 200, class: "B", category: "Flooring" },
  
  // Plastics
  { material: "ABS Plastic", fsr: 200, sdr: 450, class: "C", category: "Plastic" },
  { material: "PVC (Rigid)", fsr: 25, sdr: 200, class: "A", category: "Plastic" },
  { material: "Polycarbonate", fsr: 150, sdr: 300, class: "C", category: "Plastic" },
  { material: "Acrylic (PMMA)", fsr: 200, sdr: 450, class: "C", category: "Plastic" },
  { material: "FRP Panel", fsr: 25, sdr: 200, class: "A", category: "Plastic" },
];

const classColors: Record<string, string> = {
  "A": "bg-green-100 text-green-800 border-green-300",
  "B": "bg-blue-100 text-blue-800 border-blue-300",
  "C": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "D": "bg-red-100 text-red-800 border-red-300",
};

interface FSRQuickReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FSRQuickReference({ isOpen, onClose }: FSRQuickReferenceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(commonMaterials.map(m => m.category)))];

  const filteredMaterials = commonMaterials.filter(m => {
    const matchesSearch = m.material.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg shadow-xl">
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-600" />
              FSR Quick Reference Card
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Common building materials flame spread ratings (NBC 3.1.13 / ASTM E84)
          </p>
        </CardHeader>
        <CardContent className="p-4">
          {/* Search and Filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Class Legend */}
          <div className="flex flex-wrap gap-2 mb-4 p-2 bg-muted/50 rounded-md">
            <span className="text-xs font-medium text-muted-foreground mr-2">Classes:</span>
            <Badge className={`${classColors["A"]} text-[10px]`}>A: 0-25</Badge>
            <Badge className={`${classColors["B"]} text-[10px]`}>B: 26-75</Badge>
            <Badge className={`${classColors["C"]} text-[10px]`}>C: 76-200</Badge>
            <Badge className={`${classColors["D"]} text-[10px]`}>D: &gt;200</Badge>
          </div>

          {/* Materials Table */}
          <div className="overflow-y-auto max-h-[45vh] border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">Material</th>
                  <th className="text-center p-2 font-medium w-16">FSR</th>
                  <th className="text-center p-2 font-medium w-16">SDR</th>
                  <th className="text-center p-2 font-medium w-16">Class</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((m, idx) => (
                  <tr key={idx} className="border-t hover:bg-muted/30">
                    <td className="p-2">
                      <span className="font-medium">{m.material}</span>
                      <span className="text-xs text-muted-foreground ml-2">({m.category})</span>
                    </td>
                    <td className="text-center p-2 font-mono">{m.fsr}</td>
                    <td className="text-center p-2 font-mono">{m.sdr}</td>
                    <td className="text-center p-2">
                      <Badge className={`${classColors[m.class]} text-[10px] px-2`}>
                        {m.class}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filteredMaterials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-muted-foreground">
                      No materials found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            FSR = Flame Spread Rating | SDR = Smoke Developed Rating | Values per ASTM E84 / ULC S102
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default FSRQuickReference;
