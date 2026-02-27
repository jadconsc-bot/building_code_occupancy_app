import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Activity, Layers, Save } from "lucide-react";
import { SaveCalculatorResultDialog } from "./SaveCalculatorResultDialog";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

export const ServiceLoadCalculatorWithSave = () => {
  const { activeProjectId } = useProject();
  const [area, setArea] = useState(0);
  const [heating, setHeating] = useState(0);
  const [ac, setAc] = useState(0);
  const [range, setRange] = useState(0);
  const [dryer, setDryer] = useState(0);

  const calculateLoad = () => {
    let basicLoad = 5000;
    if (area > 90) {
      basicLoad += Math.ceil((area - 90) / 90) * 1000;
    }

    const rangeLoad = range > 0 ? 6000 : 0;
    const dryerLoad = dryer > 0 ? 1250 : 0;
    const hvacLoad = Math.max(heating, ac);

    const totalWatts = basicLoad + rangeLoad + dryerLoad + hvacLoad;
    const amps = totalWatts / 240;

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

        {/* Save Button */}
        {activeProjectId ? (
          <div className="pt-4 border-t border-border">
            <SaveCalculatorResultDialog
              calculatorType="service-load"
              inputData={{
                area,
                heating,
                ac,
                range: range === 1 ? "Yes" : "No",
                dryer: dryer === 1 ? "Yes" : "No",
              }}
              resultData={{
                totalWatts: result.watts,
                amps: result.amps.toFixed(1),
                serviceSize: result.amps <= 60 ? "60 A" : result.amps <= 100 ? "100 A" : "200 A",
              }}
            >
              <Button className="w-full gap-2">
                <Save size={16} />
                Save Calculation
              </Button>
            </SaveCalculatorResultDialog>
          </div>
        ) : (
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => toast.info("Please select or create a project first")}
            >
              <Save size={16} />
              Save Calculation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const VoltageDropCalculatorWithSave = () => {
  const { activeProjectId } = useProject();
  const [volts, setVolts] = useState(120);
  const [amps, setAmps] = useState(15);
  const [dist, setDist] = useState(0);
  const [gauge, setGauge] = useState(14);

  const calculateDrop = () => {
    const resistanceMap: Record<number, number> = {
      14: 10.1,
      12: 6.4,
      10: 4.0,
      8: 2.5,
      6: 1.6,
      4: 1.0,
      2: 0.63,
      1: 0.5,
    };

    const resistance = resistanceMap[gauge] || 10.1;
    const drop = (2 * dist * amps * resistance) / 1000;
    const percent = (drop / volts) * 100;

    return {
      drop,
      percent,
      acceptable: percent <= 3,
    };
  };

  const result = calculateDrop();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" /> Voltage Drop Calculator (CEC Sec 4)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Voltage (V)</Label>
            <Input
              type="number"
              value={volts || ""}
              onChange={(e) => setVolts(parseInt(e.target.value) || 120)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Current (A)</Label>
            <Input
              type="number"
              value={amps || ""}
              onChange={(e) => setAmps(parseInt(e.target.value) || 15)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Distance (m)</Label>
            <Input
              type="number"
              value={dist || ""}
              onChange={(e) => setDist(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Wire Gauge (AWG)</Label>
            <Select onValueChange={(v) => setGauge(parseInt(v))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select gauge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14 AWG</SelectItem>
                <SelectItem value="12">12 AWG</SelectItem>
                <SelectItem value="10">10 AWG</SelectItem>
                <SelectItem value="8">8 AWG</SelectItem>
                <SelectItem value="6">6 AWG</SelectItem>
                <SelectItem value="4">4 AWG</SelectItem>
                <SelectItem value="2">2 AWG</SelectItem>
                <SelectItem value="1">1 AWG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Voltage Drop:</span>
            <span className="font-mono font-bold text-lg">{result.drop.toFixed(2)} V</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Percentage:</span>
            <span
              className={`font-mono font-bold text-lg ${
                result.acceptable ? "text-green-600" : "text-red-600"
              }`}
            >
              {result.percent.toFixed(2)}% {result.acceptable ? "✓" : "✗"}
            </span>
          </div>
        </div>

        {/* Save Button */}
        {activeProjectId ? (
          <div className="pt-4 border-t border-border">
            <SaveCalculatorResultDialog
              calculatorType="voltage-drop"
              inputData={{
                volts,
                amps,
                distance: dist,
                gauge,
              }}
              resultData={{
                voltageDrop: result.drop.toFixed(2),
                percentageDrop: result.percent.toFixed(2),
                acceptable: result.acceptable,
              }}
            >
              <Button className="w-full gap-2">
                <Save size={16} />
                Save Calculation
              </Button>
            </SaveCalculatorResultDialog>
          </div>
        ) : (
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => toast.info("Please select or create a project first")}
            >
              <Save size={16} />
              Save Calculation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ConduitFillCalculatorWithSave = () => {
  const { activeProjectId } = useProject();
  const [wireGauge, setWireGauge] = useState(14);
  const [wireCount, setWireCount] = useState(1);
  const [conduitSize, setConduitSize] = useState("0.5");

  const wireAreas: Record<number, number> = {
    14: 2.08,
    12: 3.31,
    10: 5.26,
    8: 8.37,
    6: 13.3,
    4: 21.15,
    2: 33.31,
    1: 42.41,
  };

  const conduitAreas: Record<string, number> = {
    "0.5": 0.196,
    "0.75": 0.442,
    1: 0.785,
    "1.25": 1.227,
    "1.5": 1.767,
    2: 3.142,
  };

  const totalWireArea = (wireAreas[wireGauge] || 2.08) * wireCount;
  const conduitArea = conduitAreas[conduitSize] || 0.785;
  const fillPercentage = (totalWireArea / conduitArea) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-500" /> Conduit Fill Calculator (CEC Table D2)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Wire Gauge</Label>
            <Select onValueChange={(v) => setWireGauge(parseInt(v))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select gauge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14">14 AWG</SelectItem>
                <SelectItem value="12">12 AWG</SelectItem>
                <SelectItem value="10">10 AWG</SelectItem>
                <SelectItem value="8">8 AWG</SelectItem>
                <SelectItem value="6">6 AWG</SelectItem>
                <SelectItem value="4">4 AWG</SelectItem>
                <SelectItem value="2">2 AWG</SelectItem>
                <SelectItem value="1">1 AWG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Number of Wires</Label>
            <Input
              type="number"
              value={wireCount || ""}
              onChange={(e) => setWireCount(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label className="text-xs">Conduit Size (inches)</Label>
            <Select onValueChange={setConduitSize}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">1/2"</SelectItem>
                <SelectItem value="0.75">3/4"</SelectItem>
                <SelectItem value="1">1"</SelectItem>
                <SelectItem value="1.25">1 1/4"</SelectItem>
                <SelectItem value="1.5">1 1/2"</SelectItem>
                <SelectItem value="2">2"</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fill Percentage:</span>
            <span
              className={`font-mono font-bold text-lg ${
                fillPercentage <= 40 ? "text-green-600" : "text-red-600"
              }`}
            >
              {fillPercentage.toFixed(1)}% {fillPercentage <= 40 ? "✓" : "✗"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {fillPercentage <= 40
              ? "Conduit fill is acceptable (≤40%)"
              : "Conduit fill exceeds 40% limit"}
          </p>
        </div>

        {/* Save Button */}
        {activeProjectId ? (
          <div className="pt-4 border-t border-border">
            <SaveCalculatorResultDialog
              calculatorType="conduit-fill"
              inputData={{
                wireGauge,
                wireCount,
                conduitSize,
              }}
              resultData={{
                fillPercentage: fillPercentage.toFixed(1),
                acceptable: fillPercentage <= 40,
              }}
            >
              <Button className="w-full gap-2">
                <Save size={16} />
                Save Calculation
              </Button>
            </SaveCalculatorResultDialog>
          </div>
        ) : (
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => toast.info("Please select or create a project first")}
            >
              <Save size={16} />
              Save Calculation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
