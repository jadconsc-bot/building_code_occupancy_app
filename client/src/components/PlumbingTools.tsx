import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Droplets, Flame } from "lucide-react";

export const WetVentingDiagram = () => {
  const [activePart, setActivePart] = useState<string | null>(null);

  const parts = {
    stack: {
      title: "Soil or Waste Stack",
      desc: "Vertical pipe that carries discharge from fixtures. Must be sized to handle total fixture units.",
      limit: "Min 3\" (75mm) if carrying WC."
    },
    wetVent: {
      title: "Wet Vent",
      desc: "Portion of pipe acting as both a drain for the lavatory and a vent for the WC/Tub.",
      limit: "Max 2 bathroom groups. Min 2\" (50mm) for 3\" stack."
    },
    lav: {
      title: "Lavatory (Basin)",
      desc: "Most upstream fixture. Its dry vent protects the entire wet vented group.",
      limit: "Trap arm max 1.2m (1-1/4\") or 1.5m (1-1/2\")."
    },
    wc: {
      title: "Water Closet (Toilet)",
      desc: "Must be the most downstream fixture in the wet vented group.",
      limit: "Max 3m (10ft) from stack connection."
    },
    tub: {
      title: "Bathtub / Shower",
      desc: "Connects to the wet vent system between the Lav and WC, or directly to the wet vent.",
      limit: "Trap arm max 1.5m (1-1/2\") or 2.4m (2\")."
    }
  };

  return (
    <div className="relative">
      <svg viewBox="0 0 400 300" className="w-full h-auto bg-white rounded-lg border border-border select-none">
        <defs>
          <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
        </defs>
        
        {/* Main Stack */}
        <g 
          onClick={() => setActivePart("stack")} 
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <rect x="300" y="20" width="20" height="260" fill={activePart === "stack" ? "#93c5fd" : "#e5e7eb"} stroke="#374151" />
          <text x="310" y="290" textAnchor="middle" className="text-[10px] font-bold">STACK</text>
        </g>
        
        {/* Wet Vent Section */}
        <g 
          onClick={() => setActivePart("wetVent")} 
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <rect x="300" y="100" width="20" height="100" fill={activePart === "wetVent" ? "#60a5fa" : "#dbeafe"} stroke="#3b82f6" strokeWidth="2" />
          <text x="340" y="150" className="text-[10px] fill-blue-600 font-bold">WET VENT</text>
        </g>
        
        {/* Lavatory Branch */}
        <g 
          onClick={() => setActivePart("lav")} 
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <path d="M 300 100 L 200 100 L 200 80" fill="none" stroke={activePart === "lav" ? "#3b82f6" : "#374151"} strokeWidth="4" />
          <circle cx="200" cy="70" r="15" fill={activePart === "lav" ? "#dbeafe" : "white"} stroke="#374151" />
          <text x="200" y="75" textAnchor="middle" className="text-[10px]">LAV</text>
        </g>
        
        {/* Toilet Branch */}
        <g 
          onClick={() => setActivePart("wc")} 
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <path d="M 300 200 L 100 200 L 100 180" fill="none" stroke={activePart === "wc" ? "#3b82f6" : "#374151"} strokeWidth="6" />
          <rect x="80" y="150" width="40" height="30" fill={activePart === "wc" ? "#dbeafe" : "white"} stroke="#374151" />
          <text x="100" y="170" textAnchor="middle" className="text-[10px]">WC</text>
        </g>
        
        {/* Bathtub Branch */}
        <g 
          onClick={() => setActivePart("tub")} 
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <path d="M 200 200 L 200 180" fill="none" stroke={activePart === "tub" ? "#3b82f6" : "#374151"} strokeWidth="4" />
          <rect x="170" y="160" width="60" height="20" fill={activePart === "tub" ? "#dbeafe" : "white"} stroke="#374151" />
          <text x="200" y="175" textAnchor="middle" className="text-[10px]">TUB</text>
        </g>
        
        {/* Instructions */}
        <text x="20" y="30" className="text-xs font-bold fill-blue-800">Tap components for details</text>
      </svg>

      {activePart && (
        <div className="absolute top-2 left-2 right-2 bg-white/95 backdrop-blur border border-blue-200 p-3 rounded shadow-lg text-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-blue-700">{parts[activePart as keyof typeof parts].title}</h4>
            <button 
              onClick={(e) => { e.stopPropagation(); setActivePart(null); }}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-slate-600 mb-2">{parts[activePart as keyof typeof parts].desc}</p>
          <div className="text-xs font-mono bg-slate-100 p-1 rounded text-slate-700 border border-slate-200">
            {parts[activePart as keyof typeof parts].limit}
          </div>
        </div>
      )}
    </div>
  );
};

export const FixtureUnitCalculator = () => {
  const [fixtures, setFixtures] = useState({
    bathroomGroups: 0,
    kitchenSinks: 0,
    laundry: 0,
    toilets: 0,
    showers: 0
  });

  const calculateFU = () => {
    // NPC Table 2.6.3.2.A
    return (
      fixtures.bathroomGroups * 3.6 + // Tank type WC
      fixtures.kitchenSinks * 1.4 +
      fixtures.laundry * 1.4 +
      fixtures.toilets * 2.2 + // Private use
      fixtures.showers * 1.4
    );
  };

  const totalFU = calculateFU();
  
  // Simplified sizing logic based on NPC Table 2.6.3.4
  const getPipeSize = (fu: number) => {
    if (fu <= 7) return '1/2" (15mm)'; // Very conservative
    if (fu <= 16) return '3/4" (20mm)';
    if (fu <= 31) return '1" (25mm)';
    return '> 1" (Consult Table)';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500" /> Water Service Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Bathroom Groups (3pc)</Label>
            <Input 
              type="number" 
              min="0"
              value={fixtures.bathroomGroups} 
              onChange={(e) => setFixtures({...fixtures, bathroomGroups: parseInt(e.target.value) || 0})} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Kitchen Sinks</Label>
            <Input 
              type="number" 
              min="0"
              value={fixtures.kitchenSinks} 
              onChange={(e) => setFixtures({...fixtures, kitchenSinks: parseInt(e.target.value) || 0})} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Laundry Tubs/Machines</Label>
            <Input 
              type="number" 
              min="0"
              value={fixtures.laundry} 
              onChange={(e) => setFixtures({...fixtures, laundry: parseInt(e.target.value) || 0})} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Extra Toilets</Label>
            <Input 
              type="number" 
              min="0"
              value={fixtures.toilets} 
              onChange={(e) => setFixtures({...fixtures, toilets: parseInt(e.target.value) || 0})} 
            />
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Total Fixture Units:</span>
            <span className="font-mono font-bold text-lg">{totalFU.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Est. Service Size:</span>
            <span className="font-mono font-bold text-lg text-blue-600">{getPipeSize(totalFU)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            *Estimate based on NPC Table 2.6.3.4. Does not account for pressure loss or length.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const GasLineCalculator = () => {
  const [btu, setBtu] = useState(0);
  const [length, setLength] = useState(0);

  // Simplified logic based on B149.1 Table A.1 (Natural Gas, < 2psi)
  const getGasPipeSize = (btu: number, len: number) => {
    if (btu === 0 || len === 0) return "-";
    
    // Very simplified lookup for demonstration
    // Real implementation would need full table data
    const kBTU = btu / 1000;
    
    if (len <= 20) {
      if (kBTU < 90) return '1/2"';
      if (kBTU < 200) return '3/4"';
      if (kBTU < 360) return '1"';
    } else if (len <= 50) {
      if (kBTU < 50) return '1/2"';
      if (kBTU < 110) return '3/4"';
      if (kBTU < 210) return '1"';
    } else {
      if (kBTU < 30) return '1/2"';
      if (kBTU < 70) return '3/4"';
      if (kBTU < 130) return '1"';
    }
    return '> 1"';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" /> Gas Line Sizer (B149.1)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Total Load (BTU/h)</Label>
          <Input 
            type="number" 
            placeholder="e.g. 100000"
            value={btu || ""} 
            onChange={(e) => setBtu(parseInt(e.target.value) || 0)} 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Longest Run (ft)</Label>
          <Input 
            type="number" 
            placeholder="e.g. 50"
            value={length || ""} 
            onChange={(e) => setLength(parseInt(e.target.value) || 0)} 
          />
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Min Pipe Size:</span>
            <span className="font-mono font-bold text-lg text-orange-600">{getGasPipeSize(btu, length)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            *Natural Gas, System Pressure &lt; 2 psig, Pressure Drop 0.5" w.c.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
