import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Droplets, Flame } from "lucide-react";

export const WetVentingDiagram = () => (
  <svg viewBox="0 0 400 300" className="w-full h-auto bg-white rounded-lg border border-border">
    <defs>
      <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
      </marker>
    </defs>
    
    {/* Main Stack */}
    <rect x="300" y="20" width="20" height="260" fill="#e5e7eb" stroke="#374151" />
    <text x="310" y="290" textAnchor="middle" className="text-[10px] font-bold">STACK</text>
    
    {/* Wet Vent Section */}
    <rect x="300" y="100" width="20" height="100" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
    <text x="340" y="150" className="text-[10px] fill-blue-600 font-bold">WET VENT</text>
    
    {/* Lavatory Branch */}
    <path d="M 300 100 L 200 100 L 200 80" fill="none" stroke="#374151" strokeWidth="4" />
    <circle cx="200" cy="70" r="15" fill="white" stroke="#374151" />
    <text x="200" y="75" textAnchor="middle" className="text-[10px]">LAV</text>
    
    {/* Toilet Branch */}
    <path d="M 300 200 L 100 200 L 100 180" fill="none" stroke="#374151" strokeWidth="6" />
    <rect x="80" y="150" width="40" height="30" fill="white" stroke="#374151" />
    <text x="100" y="170" textAnchor="middle" className="text-[10px]">WC</text>
    
    {/* Bathtub Branch */}
    <path d="M 200 200 L 200 180" fill="none" stroke="#374151" strokeWidth="4" />
    <rect x="170" y="160" width="60" height="20" fill="white" stroke="#374151" />
    <text x="200" y="175" textAnchor="middle" className="text-[10px]">TUB</text>
    
    {/* Labels */}
    <text x="20" y="30" className="text-xs font-bold fill-blue-800">Wet Venting Rules (NPC 2.5.8):</text>
    <text x="20" y="50" className="text-[10px] fill-muted-foreground">1. Wet vent extends from LAV connection</text>
    <text x="20" y="65" className="text-[10px] fill-muted-foreground">   down to WC connection.</text>
    <text x="20" y="80" className="text-[10px] fill-muted-foreground">2. Max 2 bathroom groups.</text>
    <text x="20" y="95" className="text-[10px] fill-muted-foreground">3. WC must be downstream of all others.</text>
  </svg>
);

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
