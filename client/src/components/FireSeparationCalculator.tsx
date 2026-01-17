import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Flame, AlertTriangle } from "lucide-react";

// NBC Table 3.1.3.1 - Fire Separation Requirements
const fireSeparationData: Record<string, Record<string, string>> = {
  "A-1": {
    "A-1": "No separation required",
    "A-2": "No separation required",
    "A-3": "No separation required",
    "A-4": "No separation required",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "A-2": {
    "A-1": "No separation required",
    "A-2": "No separation required",
    "A-3": "No separation required",
    "A-4": "No separation required",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "B-1": {
    "A-1": "2 hours",
    "A-2": "2 hours",
    "B-1": "No separation required",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "2 hours",
    "D": "2 hours",
    "E": "2 hours",
    "F-1": "2 hours",
    "F-2": "2 hours",
    "F-3": "2 hours"
  },
  "B-2": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "1 hour",
    "B-2": "No separation required",
    "B-3": "No separation required",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "B-3": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "1 hour",
    "B-2": "No separation required",
    "B-3": "No separation required",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "C": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "No separation required",
    "D": "No separation required",
    "E": "No separation required",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "No separation required"
  },
  "D": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "No separation required",
    "D": "No separation required",
    "E": "No separation required",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "No separation required"
  },
  "E": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "No separation required",
    "D": "No separation required",
    "E": "No separation required",
    "F-1": "2 hours",
    "F-2": "1 hour",
    "F-3": "No separation required"
  },
  "F-1": {
    "A-1": "2 hours",
    "A-2": "2 hours",
    "B-1": "2 hours",
    "B-2": "2 hours",
    "B-3": "2 hours",
    "C": "2 hours",
    "D": "2 hours",
    "E": "2 hours",
    "F-1": "No separation required",
    "F-2": "1 hour",
    "F-3": "1 hour"
  },
  "F-2": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "1 hour",
    "D": "1 hour",
    "E": "1 hour",
    "F-1": "1 hour",
    "F-2": "No separation required",
    "F-3": "No separation required"
  },
  "F-3": {
    "A-1": "1 hour",
    "A-2": "1 hour",
    "B-1": "2 hours",
    "B-2": "1 hour",
    "B-3": "1 hour",
    "C": "No separation required",
    "D": "No separation required",
    "E": "No separation required",
    "F-1": "1 hour",
    "F-2": "No separation required",
    "F-3": "No separation required"
  }
};

const occupancyNames: Record<string, string> = {
  "A-1": "Assembly - Performing Arts",
  "A-2": "Assembly - General",
  "A-3": "Assembly - Arena Type",
  "A-4": "Assembly - Open Air",
  "B-1": "Institutional - Detention",
  "B-2": "Institutional - Treatment",
  "B-3": "Institutional - Care",
  "C": "Residential",
  "D": "Business & Personal Services",
  "E": "Mercantile",
  "F-1": "Industrial - High Hazard",
  "F-2": "Industrial - Medium Hazard",
  "F-3": "Industrial - Low Hazard"
};

export function FireSeparationCalculator() {
  const [occupancy1, setOccupancy1] = useState<string>("");
  const [occupancy2, setOccupancy2] = useState<string>("");
  const [sprinklered, setSprinklered] = useState<string>("no");

  const calculateSeparation = (): { rating: string; description: string; severity: "low" | "medium" | "high" } => {
    if (!occupancy1 || !occupancy2) {
      return { rating: "Select occupancies", description: "", severity: "low" };
    }

    let baseRating = fireSeparationData[occupancy1]?.[occupancy2] || "Not defined";
    
    // Sprinkler reduction (NBC allows reduction in some cases)
    if (sprinklered === "yes" && baseRating.includes("hour") && !baseRating.includes("2 hours")) {
      const description = `${baseRating} (may be reduced to 45 minutes with sprinklers - verify NBC 3.2.3.7)`;
      return { rating: baseRating, description, severity: "medium" };
    }

    const severity = baseRating === "2 hours" ? "high" : baseRating === "1 hour" ? "medium" : "low";
    
    return { 
      rating: baseRating, 
      description: baseRating === "No separation required" ? "Occupancies are compatible" : "",
      severity 
    };
  };

  const result = calculateSeparation();

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Flame className="w-4 h-4 text-destructive" /> Fire Separation Calculator
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Determine required fire resistance rating between occupancies (NBC Part 3.2.3)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occupancy1" className="text-xs font-medium">
                First Occupancy
              </Label>
              <Select value={occupancy1} onValueChange={setOccupancy1}>
                <SelectTrigger id="occupancy1" className="rounded-none">
                  <SelectValue placeholder="Select occupancy" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(occupancyNames).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupancy2" className="text-xs font-medium">
                Adjacent Occupancy
              </Label>
              <Select value={occupancy2} onValueChange={setOccupancy2}>
                <SelectTrigger id="occupancy2" className="rounded-none">
                  <SelectValue placeholder="Select occupancy" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(occupancyNames).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {code} - {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprinklered" className="text-xs font-medium">
              Building Sprinklered?
            </Label>
            <Select value={sprinklered} onValueChange={setSprinklered}>
              <SelectTrigger id="sprinklered" className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No - Not Sprinklered</SelectItem>
                <SelectItem value="yes">Yes - Fully Sprinklered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Result Display */}
          {/* Visual Diagram - Side by Side Occupancies */}
          {occupancy1 && occupancy2 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-border p-4 mb-4">
              <svg viewBox="0 0 400 200" className="w-full h-auto">
                {/* Floor */}
                <rect x="20" y="160" width="360" height="10" fill="#6b7280" />
                <text x="200" y="185" textAnchor="middle" className="text-[10px] fill-gray-500" style={{fontSize: '10px'}}>FLOOR ASSEMBLY</text>
                
                {/* Left Occupancy Box */}
                <rect x="30" y="40" width="150" height="120" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
                <text x="105" y="70" textAnchor="middle" className="text-sm font-bold fill-blue-700" style={{fontSize: '14px', fontWeight: 'bold'}}>{occupancy1}</text>
                <text x="105" y="90" textAnchor="middle" className="text-[10px] fill-blue-600" style={{fontSize: '10px'}}>{occupancyNames[occupancy1] || ''}</text>
                
                {/* Fire Separation Wall */}
                <rect x="185" y="30" width="30" height="130" fill={result.severity === 'high' ? '#fecaca' : result.severity === 'medium' ? '#fed7aa' : '#d1fae5'} stroke={result.severity === 'high' ? '#dc2626' : result.severity === 'medium' ? '#f97316' : '#10b981'} strokeWidth="3" />
                <text x="200" y="100" textAnchor="middle" className="text-[9px] font-bold" style={{fontSize: '9px', fontWeight: 'bold'}} fill={result.severity === 'high' ? '#dc2626' : result.severity === 'medium' ? '#f97316' : '#10b981'}>
                  {result.rating.includes('hour') ? result.rating.replace(' ', '') : 'NONE'}
                </text>
                <text x="200" y="115" textAnchor="middle" className="text-[8px]" style={{fontSize: '8px'}} fill="#6b7280">FIRE</text>
                <text x="200" y="125" textAnchor="middle" className="text-[8px]" style={{fontSize: '8px'}} fill="#6b7280">SEP.</text>
                
                {/* Right Occupancy Box */}
                <rect x="220" y="40" width="150" height="120" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
                <text x="295" y="70" textAnchor="middle" className="text-sm font-bold fill-amber-700" style={{fontSize: '14px', fontWeight: 'bold'}}>{occupancy2}</text>
                <text x="295" y="90" textAnchor="middle" className="text-[10px] fill-amber-600" style={{fontSize: '10px'}}>{occupancyNames[occupancy2] || ''}</text>
                
                {/* Ceiling/Roof */}
                <rect x="20" y="25" width="360" height="10" fill="#6b7280" />
                <text x="200" y="18" textAnchor="middle" className="text-[10px] fill-gray-500" style={{fontSize: '10px'}}>ROOF/FLOOR ABOVE</text>
                
                {/* Arrows pointing to fire separation */}
                <path d="M 140 130 L 175 130" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                <path d="M 260 130 L 225 130" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                
                {/* Arrow marker definition */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
                  </marker>
                </defs>
              </svg>
            </div>
          )}

          {/* Result Display */}
          {occupancy1 && occupancy2 && (
            <div className={`p-6 border-l-4 ${
              result.severity === "high" ? "border-destructive bg-destructive/5" :
              result.severity === "medium" ? "border-orange-500 bg-orange-500/5" :
              "border-green-500 bg-green-500/5"
            }`}>
              <div className="flex items-start gap-3">
                {result.severity !== "low" && (
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    result.severity === "high" ? "text-destructive" : "text-orange-500"
                  }`} />
                )}
                <div className="flex-1">
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
                    Required Fire Separation
                  </h4>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-primary">{result.rating}</span>
                    {result.rating.includes("hour") && (
                      <Badge variant={result.severity === "high" ? "destructive" : "secondary"}>
                        Fire Resistance Rating
                      </Badge>
                    )}
                  </div>
                  {result.description && (
                    <p className="text-xs text-muted-foreground mt-2">{result.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Important Notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Important Notes
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Fire separations must extend from floor to underside of floor or roof above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Openings in fire separations require fire-rated closures (doors, dampers)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Sprinkler systems may allow reductions per NBC 3.2.3.7</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Verify specific requirements with NBC Table 3.1.3.1 and local amendments</span>
              </li>
            </ul>
          </div>

          {/* Reference */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Reference:</strong> National Building Code of Canada 2025, Part 3.2.3 - Fire Separations,
              Table 3.1.3.1 - Major Occupancy Classifications
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
