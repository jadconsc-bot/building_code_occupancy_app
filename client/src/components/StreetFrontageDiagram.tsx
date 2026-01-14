import { useState } from "react";

interface StreetFrontageDiagramProps {
  selectedFrontage: string;
  onFrontageChange: (frontage: string) => void;
}

export function StreetFrontageDiagram({ selectedFrontage, onFrontageChange }: StreetFrontageDiagramProps) {
  const [hoveredSide, setHoveredSide] = useState<string | null>(null);
  
  const frontageNum = parseInt(selectedFrontage);
  
  // Determine which sides are streets based on frontage count
  const getStreetSides = (count: number): Set<string> => {
    switch (count) {
      case 1: return new Set(["bottom"]);
      case 2: return new Set(["bottom", "right"]);
      case 3: return new Set(["bottom", "right", "top"]);
      case 4: return new Set(["bottom", "right", "top", "left"]);
      default: return new Set();
    }
  };
  
  const streetSides = getStreetSides(frontageNum);
  
  const toggleSide = (side: string) => {
    const newStreetSides = new Set(streetSides);
    
    if (newStreetSides.has(side)) {
      newStreetSides.delete(side);
    } else {
      newStreetSides.add(side);
    }
    
    onFrontageChange(newStreetSides.size.toString());
  };
  
  const getSideColor = (side: string) => {
    const isStreet = streetSides.has(side);
    const isHovered = hoveredSide === side;
    
    if (isStreet) {
      return isHovered ? "#F59E0B" : "#10B981"; // orange on hover, green for street
    }
    return isHovered ? "#94A3B8" : "#E2E8F0"; // light gray, darker on hover
  };
  
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-center">
        Interactive Street Frontage Selector
      </div>
      
      <svg
        viewBox="0 0 300 300"
        className="w-full max-w-xs mx-auto"
        style={{ maxHeight: "300px" }}
      >
        {/* Building (center rectangle) */}
        <rect
          x="75"
          y="75"
          width="150"
          height="150"
          fill="#1E3A8A"
          stroke="#0F172A"
          strokeWidth="2"
          rx="4"
        />
        
        {/* Building label */}
        <text
          x="150"
          y="155"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
        >
          BUILDING
        </text>
        
        {/* Top side (street) */}
        <rect
          x="75"
          y="10"
          width="150"
          height="50"
          fill={getSideColor("top")}
          stroke="#64748B"
          strokeWidth="2"
          rx="4"
          className="cursor-pointer transition-all"
          onMouseEnter={() => setHoveredSide("top")}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => toggleSide("top")}
        />
        <text
          x="150"
          y="40"
          textAnchor="middle"
          fill="#0F172A"
          fontSize="12"
          fontWeight="600"
          className="pointer-events-none"
        >
          {streetSides.has("top") ? "STREET" : "Property"}
        </text>
        
        {/* Right side (street) */}
        <rect
          x="240"
          y="75"
          width="50"
          height="150"
          fill={getSideColor("right")}
          stroke="#64748B"
          strokeWidth="2"
          rx="4"
          className="cursor-pointer transition-all"
          onMouseEnter={() => setHoveredSide("right")}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => toggleSide("right")}
        />
        <text
          x="265"
          y="145"
          textAnchor="middle"
          fill="#0F172A"
          fontSize="12"
          fontWeight="600"
          transform="rotate(90 265 150)"
          className="pointer-events-none"
        >
          {streetSides.has("right") ? "STREET" : "Property"}
        </text>
        
        {/* Bottom side (street) */}
        <rect
          x="75"
          y="240"
          width="150"
          height="50"
          fill={getSideColor("bottom")}
          stroke="#64748B"
          strokeWidth="2"
          rx="4"
          className="cursor-pointer transition-all"
          onMouseEnter={() => setHoveredSide("bottom")}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => toggleSide("bottom")}
        />
        <text
          x="150"
          y="270"
          textAnchor="middle"
          fill="#0F172A"
          fontSize="12"
          fontWeight="600"
          className="pointer-events-none"
        >
          {streetSides.has("bottom") ? "STREET" : "Property"}
        </text>
        
        {/* Left side (street) */}
        <rect
          x="10"
          y="75"
          width="50"
          height="150"
          fill={getSideColor("left")}
          stroke="#64748B"
          strokeWidth="2"
          rx="4"
          className="cursor-pointer transition-all"
          onMouseEnter={() => setHoveredSide("left")}
          onMouseLeave={() => setHoveredSide(null)}
          onClick={() => toggleSide("left")}
        />
        <text
          x="35"
          y="145"
          textAnchor="middle"
          fill="#0F172A"
          fontSize="12"
          fontWeight="600"
          transform="rotate(-90 35 150)"
          className="pointer-events-none"
        >
          {streetSides.has("left") ? "STREET" : "Property"}
        </text>
      </svg>
      
      <div className="text-xs text-center space-y-2">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-muted-foreground">Street Frontage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-300"></div>
            <span className="text-muted-foreground">Property Line</span>
          </div>
        </div>
        <p className="text-muted-foreground">
          Click on any side to toggle between street and property line
        </p>
        <div className="font-semibold text-primary">
          Current: {frontageNum} Street {frontageNum === 1 ? "Frontage" : "Frontages"}
          {frontageNum > 1 && <span className="text-green-600"> (+{(frontageNum - 1) * 25}% area)</span>}
        </div>
      </div>
    </div>
  );
}
