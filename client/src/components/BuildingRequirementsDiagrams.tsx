import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AllowableOpeningsDiagram() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Allowable Openings in Fire-Rated Assemblies</CardTitle>
        <CardDescription>Maximum opening sizes and closure requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 600 400" className="w-full h-auto">
          {/* 1-Hour Fire Wall */}
          <g>
            <rect x="50" y="50" width="200" height="300" fill="#f5f5f5" stroke="#333" strokeWidth="3"/>
            <text x="150" y="30" textAnchor="middle" className="text-xs font-bold fill-foreground">1-Hour Fire Wall</text>
            
            {/* Door Opening */}
            <rect x="100" y="150" width="100" height="150" fill="#fff" stroke="#e74c3c" strokeWidth="2" strokeDasharray="5,5"/>
            <text x="150" y="230" textAnchor="middle" className="text-[10px] fill-destructive font-semibold">Door Opening</text>
            <text x="150" y="245" textAnchor="middle" className="text-[9px] fill-muted-foreground">≤ 25% wall area</text>
            <text x="150" y="260" textAnchor="middle" className="text-[9px] fill-muted-foreground">45-min closure</text>
          </g>

          {/* 2-Hour Fire Wall */}
          <g>
            <rect x="350" y="50" width="200" height="300" fill="#f5f5f5" stroke="#333" strokeWidth="4"/>
            <text x="450" y="30" textAnchor="middle" className="text-xs font-bold fill-foreground">2-Hour Fire Wall</text>
            
            {/* Smaller Door Opening */}
            <rect x="410" y="180" width="80" height="120" fill="#fff" stroke="#e74c3c" strokeWidth="2" strokeDasharray="5,5"/>
            <text x="450" y="245" textAnchor="middle" className="text-[10px] fill-destructive font-semibold">Door Opening</text>
            <text x="450" y="260" textAnchor="middle" className="text-[9px] fill-muted-foreground">≤ 25% wall area</text>
            <text x="450" y="275" textAnchor="middle" className="text-[9px] fill-muted-foreground">1.5-hr closure</text>
          </g>

          {/* Legend */}
          <g transform="translate(50, 370)">
            <rect x="0" y="0" width="15" height="15" fill="#fff" stroke="#e74c3c" strokeWidth="2" strokeDasharray="3,3"/>
            <text x="20" y="12" className="text-[10px] fill-muted-foreground">Allowable Opening</text>
            
            <rect x="150" y="0" width="15" height="15" fill="#f5f5f5" stroke="#333" strokeWidth="2"/>
            <text x="170" y="12" className="text-[10px] fill-muted-foreground">Fire-Rated Assembly</text>
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}

export function StairErgonomicsDiagram() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Stair & Handrail Ergonomics</CardTitle>
        <CardDescription>Code-compliant dimensions for safe stair design</CardDescription>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 600 400" className="w-full h-auto">
          {/* Stair Profile */}
          <g>
            {/* Steps */}
            <path d="M 50 350 L 50 280 L 150 280 L 150 210 L 250 210 L 250 140 L 350 140 L 350 70" 
                  fill="none" stroke="#333" strokeWidth="3"/>
            
            {/* Step 1 */}
            <rect x="50" y="280" width="100" height="70" fill="#e8e8e8" stroke="#333" strokeWidth="2"/>
            <line x1="50" y1="280" x2="150" y2="280" stroke="#2563eb" strokeWidth="2"/>
            <text x="100" y="320" textAnchor="middle" className="text-[10px] fill-primary font-bold">Tread ≥ 235mm</text>
            
            {/* Riser dimension */}
            <line x1="160" y1="280" x2="160" y2="350" stroke="#e74c3c" strokeWidth="2"/>
            <line x1="155" y1="280" x2="165" y2="280" stroke="#e74c3c" strokeWidth="2"/>
            <line x1="155" y1="350" x2="165" y2="350" stroke="#e74c3c" strokeWidth="2"/>
            <text x="180" y="315" className="text-[10px] fill-destructive font-bold">Riser</text>
            <text x="180" y="330" className="text-[9px] fill-destructive">125-200mm</text>
            
            {/* Step 2 */}
            <rect x="150" y="210" width="100" height="70" fill="#e8e8e8" stroke="#333" strokeWidth="2"/>
            
            {/* Step 3 */}
            <rect x="250" y="140" width="100" height="70" fill="#e8e8e8" stroke="#333" strokeWidth="2"/>
            
            {/* Handrail */}
            <line x1="70" y1="340" x2="170" y2="270" stroke="#8b4513" strokeWidth="6" strokeLinecap="round"/>
            <line x1="170" y1="270" x2="270" y2="200" stroke="#8b4513" strokeWidth="6" strokeLinecap="round"/>
            <line x1="270" y1="200" x2="370" y2="130" stroke="#8b4513" strokeWidth="6" strokeLinecap="round"/>
            
            {/* Handrail height dimension */}
            <line x1="150" y1="280" x2="150" y2="250" stroke="#16a34a" strokeWidth="2" strokeDasharray="3,3"/>
            <line x1="145" y1="280" x2="155" y2="280" stroke="#16a34a" strokeWidth="2"/>
            <line x1="145" y1="250" x2="155" y2="250" stroke="#16a34a" strokeWidth="2"/>
            <text x="130" y="265" textAnchor="end" className="text-[9px] fill-green-600 font-bold">865-965mm</text>
          </g>

          {/* Guardrail Detail */}
          <g transform="translate(400, 50)">
            <text x="0" y="0" className="text-xs font-bold fill-foreground">Guardrail Detail</text>
            
            {/* Deck */}
            <rect x="0" y="20" width="180" height="15" fill="#d4a574" stroke="#333" strokeWidth="2"/>
            
            {/* Guardrail posts */}
            <rect x="10" y="5" width="8" height="30" fill="#8b4513" stroke="#333" strokeWidth="1"/>
            <rect x="90" y="5" width="8" height="30" fill="#8b4513" stroke="#333" strokeWidth="1"/>
            <rect x="170" y="5" width="8" height="30" fill="#8b4513" stroke="#333" strokeWidth="1"/>
            
            {/* Top rail */}
            <rect x="0" y="5" width="180" height="6" fill="#8b4513" stroke="#333" strokeWidth="1"/>
            
            {/* Height dimension */}
            <line x1="-10" y1="35" x2="-10" y2="11" stroke="#16a34a" strokeWidth="2"/>
            <line x1="-15" y1="35" x2="-5" y2="35" stroke="#16a34a" strokeWidth="2"/>
            <line x1="-15" y1="11" x2="-5" y2="11" stroke="#16a34a" strokeWidth="2"/>
            <text x="-20" y="25" textAnchor="end" className="text-[9px] fill-green-600 font-bold">≥920mm</text>
            <text x="-20" y="35" textAnchor="end" className="text-[8px] fill-muted-foreground">(residential)</text>
            
            {/* Spacing dimension */}
            <circle cx="50" cy="20" r="12" fill="none" stroke="#e74c3c" strokeWidth="2" strokeDasharray="2,2"/>
            <text x="50" y="55" textAnchor="middle" className="text-[9px] fill-destructive font-bold">≤100mm sphere</text>
            <text x="50" y="65" textAnchor="middle" className="text-[8px] fill-muted-foreground">(no entrapment)</text>
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}

export function AccessibilityDiagram() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Accessibility Clearances</CardTitle>
        <CardDescription>Barrier-free design requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 600 400" className="w-full h-auto">
          {/* Corridor */}
          <g>
            <text x="150" y="30" textAnchor="middle" className="text-xs font-bold fill-foreground">Corridor Width</text>
            <rect x="50" y="50" width="200" height="100" fill="#f0f0f0" stroke="#333" strokeWidth="2"/>
            
            {/* Width dimension */}
            <line x1="50" y1="170" x2="250" y2="170" stroke="#2563eb" strokeWidth="2"/>
            <line x1="50" y1="165" x2="50" y2="175" stroke="#2563eb" strokeWidth="2"/>
            <line x1="250" y1="165" x2="250" y2="175" stroke="#2563eb" strokeWidth="2"/>
            <text x="150" y="190" textAnchor="middle" className="text-sm fill-primary font-bold">≥ 1100 mm</text>
          </g>

          {/* Turning Circle */}
          <g transform="translate(400, 100)">
            <text x="0" y="-20" textAnchor="middle" className="text-xs font-bold fill-foreground">Turning Circle</text>
            <circle cx="0" cy="0" r="75" fill="none" stroke="#16a34a" strokeWidth="3" strokeDasharray="10,5"/>
            
            {/* Wheelchair icon */}
            <circle cx="0" cy="-10" r="8" fill="#16a34a"/>
            <rect x="-12" y="0" width="24" height="20" rx="3" fill="#16a34a"/>
            <circle cx="-10" cy="25" r="8" fill="none" stroke="#16a34a" strokeWidth="2"/>
            <circle cx="10" cy="25" r="8" fill="none" stroke="#16a34a" strokeWidth="2"/>
            
            {/* Diameter dimension */}
            <line x1="-75" y1="85" x2="75" y2="85" stroke="#16a34a" strokeWidth="2"/>
            <line x1="-75" y1="80" x2="-75" y2="90" stroke="#16a34a" strokeWidth="2"/>
            <line x1="75" y1="80" x2="75" y2="90" stroke="#16a34a" strokeWidth="2"/>
            <text x="0" y="105" textAnchor="middle" className="text-sm fill-green-600 font-bold">≥ 1500 mm ⌀</text>
          </g>

          {/* Door Clearance */}
          <g transform="translate(50, 250)">
            <text x="100" y="-10" textAnchor="middle" className="text-xs font-bold fill-foreground">Door Clear Width</text>
            
            {/* Door frame */}
            <rect x="0" y="0" width="10" height="120" fill="#8b4513" stroke="#333" strokeWidth="1"/>
            <rect x="190" y="0" width="10" height="120" fill="#8b4513" stroke="#333" strokeWidth="1"/>
            
            {/* Door */}
            <rect x="10" y="0" width="80" height="120" fill="#d4a574" stroke="#333" strokeWidth="2"/>
            <circle cx="20" cy="60" r="4" fill="#333"/>
            
            {/* Clear width dimension */}
            <line x1="90" y1="140" x2="190" y2="140" stroke="#2563eb" strokeWidth="2"/>
            <line x1="90" y1="135" x2="90" y2="145" stroke="#2563eb" strokeWidth="2"/>
            <line x1="190" y1="135" x2="190" y2="145" stroke="#2563eb" strokeWidth="2"/>
            <text x="140" y="160" textAnchor="middle" className="text-sm fill-primary font-bold">≥ 810 mm</text>
            
            {/* Threshold */}
            <rect x="0" y="120" width="200" height="5" fill="#666" stroke="#333" strokeWidth="1"/>
            <line x1="220" y1="120" x2="220" y2="125" stroke="#e74c3c" strokeWidth="2"/>
            <line x1="215" y1="120" x2="225" y2="120" stroke="#e74c3c" strokeWidth="2"/>
            <line x1="215" y1="125" x2="225" y2="125" stroke="#e74c3c" strokeWidth="2"/>
            <text x="240" y="125" className="text-[9px] fill-destructive font-bold">≤13mm</text>
          </g>
        </svg>
      </CardContent>
    </Card>
  );
}
