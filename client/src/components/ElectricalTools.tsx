import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Activity, Layers } from "lucide-react";

export const ServiceLoadCalculator = () => {
  const [area, setArea] = useState(0);
  const [heating, setHeating] = useState(0);
  const [ac, setAc] = useState(0);
  const [range, setRange] = useState(0);
  const [dryer, setDryer] = useState(0);

  const calculateLoad = () => {
    // Simplified CEC Section 8 Residential Calculation
    // Basic Load: 5000W for first 90m2 + 1000W for each 90m2 over
    let basicLoad = 5000;
    if (area > 90) {
      basicLoad += Math.ceil((area - 90) / 90) * 1000;
    }

    // Major Appliances (simplified)
    // Range: 6000W + 40% of excess over 12kW (assuming standard 12kW range for simplicity = 6000W demand)
    const rangeLoad = range > 0 ? 6000 : 0; 
    
    // Dryer: 25% of rating if > 5kW (standard 5kW = 1250W) - Simplified to 1250W
    const dryerLoad = dryer > 0 ? 1250 : 0;

    // Heating/AC: 100% of larger load
    const hvacLoad = Math.max(heating, ac);

    const totalWatts = basicLoad + rangeLoad + dryerLoad + hvacLoad;
    const amps = totalWatts / 240; // Single phase 240V

    return { watts: totalWatts, amps: amps };
  };

  const result = calculateLoad();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" /> Service Load Estimator (CEC Sec 8)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Living Area (m²)</Label>
            <Input 
              type="number" 
              value={area || ""} 
              onChange={(e) => setArea(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Heating Load (W)</Label>
            <Input 
              type="number" 
              value={heating || ""} 
              onChange={(e) => setHeating(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">AC Load (W)</Label>
            <Input 
              type="number" 
              value={ac || ""} 
              onChange={(e) => setAc(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Electric Range?</Label>
            <Select onValueChange={(v) => setRange(v === "yes" ? 1 : 0)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No (Gas)</SelectItem>
                <SelectItem value="yes">Yes (12kW)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Calculated Load:</span>
            <span className="font-mono font-bold text-lg">{result.amps.toFixed(1)} A</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Min Service Size:</span>
            <span className="font-mono font-bold text-lg text-yellow-600">
              {result.amps <= 60 ? "60 A" : result.amps <= 100 ? "100 A" : "200 A"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const VoltageDropCalculator = () => {
  const [volts, setVolts] = useState(120);
  const [amps, setAmps] = useState(15);
  const [dist, setDist] = useState(0); // meters
  const [gauge, setGauge] = useState(14);

  const calculateDrop = () => {
    // VD = (2 * K * L * I) / CM
    // K (Copper) = 12.9 ohm-cir-mils/ft approx.
    // Simplified formula: VD = (2 * L * R * I) / 1000
    // R values (Ohm/km) for solid copper @ 75C (CEC Table D3 approx)
    const resistanceMap: Record<number, number> = {
      14: 10.1,
      12: 6.4,
      10: 4.0,
      8: 2.5,
      6: 1.6
    };

    const R = resistanceMap[gauge] || 10.1;
    const dropVolts = (2 * (dist / 1000) * R * amps); // 2-wire circuit
    const dropPercent = (dropVolts / volts) * 100;

    return { volts: dropVolts, percent: dropPercent };
  };

  const result = calculateDrop();
  const isOk = result.percent <= 3;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500" /> Voltage Drop (Max 3%)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Distance (m)</Label>
            <Input 
              type="number" 
              value={dist || ""} 
              onChange={(e) => setDist(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Load (Amps)</Label>
            <Input 
              type="number" 
              value={amps || ""} 
              onChange={(e) => setAmps(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Wire Gauge (AWG)</Label>
            <Select onValueChange={(v) => setGauge(parseInt(v))} defaultValue="14">
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">#14 (15A)</SelectItem>
                <SelectItem value="12">#12 (20A)</SelectItem>
                <SelectItem value="10">#10 (30A)</SelectItem>
                <SelectItem value="8">#8 (40A)</SelectItem>
                <SelectItem value="6">#6 (60A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Voltage</Label>
            <Select onValueChange={(v) => setVolts(parseInt(v))} defaultValue="120">
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="120">120V</SelectItem>
                <SelectItem value="240">240V</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Voltage Drop:</span>
            <span className={`font-mono font-bold text-lg ${isOk ? "text-green-600" : "text-red-600"}`}>
              {result.percent.toFixed(2)}%
            </span>
          </div>
          {!isOk && (
            <p className="text-[10px] text-red-500 mt-1 font-bold">
              Exceeds 3% limit! Increase wire size.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ConduitFillCalculator = () => {
  const [conduitSize, setConduitSize] = useState("1/2");
  const [wireType, setWireType] = useState("T90");
  
  // Simplified Table 6 lookup (Max wires for 40% fill)
  // Data is approximate for T90 Nylon (common commercial wire)
  const getFill = (): Record<string, number> => {
    if (wireType !== "T90") return {};
    
    // Map: Conduit Size -> { AWG: count }
    const fillTable: Record<string, Record<string, number>> = {
      "1/2": { "14": 12, "12": 9, "10": 5, "8": 2 },
      "3/4": { "14": 22, "12": 16, "10": 10, "8": 4, "6": 3 },
      "1": { "14": 35, "12": 26, "10": 16, "8": 7, "6": 5 }
    };

    return fillTable[conduitSize] || {};
  };

  const fill = getFill();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-500" /> Conduit Fill (Max 40%)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Conduit Size (EMT)</Label>
            <Select onValueChange={setConduitSize} defaultValue="1/2">
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1/2">1/2" (16mm)</SelectItem>
                <SelectItem value="3/4">3/4" (21mm)</SelectItem>
                <SelectItem value="1">1" (27mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Wire Type</Label>
            <Select onValueChange={setWireType} defaultValue="T90">
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="T90">T90 Nylon (Stranded)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Max # of Conductors:</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-muted p-1 rounded">
              <div className="text-[10px] text-muted-foreground">#14</div>
              <div className="font-bold">{fill["14"] || "-"}</div>
            </div>
            <div className="bg-muted p-1 rounded">
              <div className="text-[10px] text-muted-foreground">#12</div>
              <div className="font-bold">{fill["12"] || "-"}</div>
            </div>
            <div className="bg-muted p-1 rounded">
              <div className="text-[10px] text-muted-foreground">#10</div>
              <div className="font-bold">{fill["10"] || "-"}</div>
            </div>
            <div className="bg-muted p-1 rounded">
              <div className="text-[10px] text-muted-foreground">#8</div>
              <div className="font-bold">{fill["8"] || "-"}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
