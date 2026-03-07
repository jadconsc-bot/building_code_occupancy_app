import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2, AlertTriangle, Check, History, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StreetFrontageDiagram } from "./StreetFrontageDiagram";

// NBC Table 3.2.2.X - Building Area and Height Limits by Construction Type
// Simplified data structure for demonstration
const constructionLimits: Record<string, {
  combustible: { maxStoreys: number; maxArea: number; maxAreaSprinklered: number };
  noncombustible: { maxStoreys: number; maxArea: number; maxAreaSprinklered: number };
}> = {
  "A-1": {
    combustible: { maxStoreys: 3, maxArea: 2400, maxAreaSprinklered: 4800 },
    noncombustible: { maxStoreys: 6, maxArea: 4800, maxAreaSprinklered: 9600 }
  },
  "A-2": {
    combustible: { maxStoreys: 3, maxArea: 2400, maxAreaSprinklered: 4800 },
    noncombustible: { maxStoreys: 6, maxArea: 4800, maxAreaSprinklered: 9600 }
  },
  "A-3": {
    combustible: { maxStoreys: 3, maxArea: 2400, maxAreaSprinklered: 4800 },
    noncombustible: { maxStoreys: 6, maxArea: 4800, maxAreaSprinklered: 9600 }
  },
  "A-4": {
    combustible: { maxStoreys: 2, maxArea: 1800, maxAreaSprinklered: 3600 },
    noncombustible: { maxStoreys: 4, maxArea: 3600, maxAreaSprinklered: 7200 }
  },
  "B-1": {
    combustible: { maxStoreys: 2, maxArea: 1200, maxAreaSprinklered: 2400 },
    noncombustible: { maxStoreys: 4, maxArea: 2400, maxAreaSprinklered: 4800 }
  },
  "B-2": {
    combustible: { maxStoreys: 3, maxArea: 2400, maxAreaSprinklered: 4800 },
    noncombustible: { maxStoreys: 6, maxArea: 4800, maxAreaSprinklered: 9600 }
  },
  "B-3": {
    combustible: { maxStoreys: 3, maxArea: 2400, maxAreaSprinklered: 4800 },
    noncombustible: { maxStoreys: 6, maxArea: 4800, maxAreaSprinklered: 9600 }
  },
  "C": {
    combustible: { maxStoreys: 4, maxArea: 3600, maxAreaSprinklered: 7200 },
    noncombustible: { maxStoreys: 6, maxArea: 7200, maxAreaSprinklered: 14400 }
  },
  "D": {
    combustible: { maxStoreys: 3, maxArea: 3600, maxAreaSprinklered: 7200 },
    noncombustible: { maxStoreys: 6, maxArea: 7200, maxAreaSprinklered: 14400 }
  },
  "E": {
    combustible: { maxStoreys: 3, maxArea: 3600, maxAreaSprinklered: 7200 },
    noncombustible: { maxStoreys: 6, maxArea: 7200, maxAreaSprinklered: 14400 }
  },
  "F-1": {
    combustible: { maxStoreys: 1, maxArea: 600, maxAreaSprinklered: 1200 },
    noncombustible: { maxStoreys: 2, maxArea: 1200, maxAreaSprinklered: 2400 }
  },
  "F-2": {
    combustible: { maxStoreys: 3, maxArea: 2400, maxAreaSprinklered: 4800 },
    noncombustible: { maxStoreys: 6, maxArea: 4800, maxAreaSprinklered: 9600 }
  },
  "F-3": {
    combustible: { maxStoreys: 4, maxArea: 4800, maxAreaSprinklered: 9600 },
    noncombustible: { maxStoreys: 6, maxArea: 9600, maxAreaSprinklered: 19200 }
  }
};

export function ConstructionLimitsCalculator() {
  const [occupancy, setOccupancy] = useState<string>("");
  const [storeys, setStoreys] = useState<string>("");
  const [sprinklered, setSprinklered] = useState<string>("no");
  const [constructionType, setConstructionType] = useState<string>("combustible");
  const [streetFrontage, setStreetFrontage] = useState<string>("1");
  const [result, setResult] = useState<{
    maxArea: number;
    baseArea: number;
    areaIncrease: number;
    compliant: boolean;
    recommendation: string;
  } | null>(null);
  
  const [calculationHistory, setCalculationHistory] = useState<Array<{
    timestamp: string;
    occupancy: string;
    storeys: string;
    constructionType: string;
    sprinklered: string;
    streetFrontage: string;
    maxArea: number;
  }>>([]);
  
  // Load calculation history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('constructionLimitsHistory');
    if (saved) {
      try {
        setCalculationHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load calculation history:', e);
      }
    }
  }, []);
  
  const loadFromHistory = (item: typeof calculationHistory[0]) => {
    setOccupancy(item.occupancy);
    setStoreys(item.storeys);
    setConstructionType(item.constructionType);
    setSprinklered(item.sprinklered);
    setStreetFrontage(item.streetFrontage);
  };

  const calculateMaxArea = () => {
    if (!occupancy || !storeys) {
      return;
    }

    const limits = constructionLimits[occupancy];
    if (!limits) {
      return;
    }

    const storeysNum = parseInt(storeys);
    const isSprinklered = sprinklered === "yes";
    const typeData = constructionType === "combustible" ? limits.combustible : limits.noncombustible;

    let baseArea = isSprinklered ? typeData.maxAreaSprinklered : typeData.maxArea;
    
    // NBC 3.2.2.8 - Street Frontage Increase
    // 1 street: 100% (no increase)
    // 2 streets: 125% (25% increase)
    // 3 streets: 150% (50% increase)  
    // 4 streets: 175% (75% increase)
    const frontageFactors: Record<string, number> = {
      "1": 1.0,
      "2": 1.25,
      "3": 1.50,
      "4": 1.75
    };
    
    const frontageFactor = frontageFactors[streetFrontage] || 1.0;
    const areaIncrease = (frontageFactor - 1.0) * 100;
    let maxArea = Math.floor(baseArea * frontageFactor);
    
    let compliant = storeysNum <= typeData.maxStoreys;
    let recommendation = "";

    if (!compliant) {
      // Suggest upgrading to non-combustible or reducing storeys
      if (constructionType === "combustible") {
        const nonCombLimits = limits.noncombustible;
        if (storeysNum <= nonCombLimits.maxStoreys) {
          recommendation = `Building exceeds ${constructionType} construction limits. Recommend upgrading to non-combustible construction (Type 2 or 3).`;
          maxArea = isSprinklered ? nonCombLimits.maxAreaSprinklered : nonCombLimits.maxArea;
          compliant = true;
        } else {
          recommendation = `Building exceeds maximum allowable storeys for both combustible and non-combustible construction. Consider reducing building height or applying for alternative solution per NBC 3.2.6.`;
        }
      } else {
        recommendation = `Building exceeds maximum allowable storeys for non-combustible construction. Consider reducing building height or applying for alternative solution per NBC 3.2.6.`;
      }
    } else {
          const frontageNote = parseInt(streetFrontage) > 1 ? ` Area increased by ${areaIncrease}% due to ${streetFrontage} street frontages (NBC 3.2.2.8).` : "";
          recommendation = `Building complies with NBC Part 3.2.2 for ${constructionType} construction${isSprinklered ? " with sprinkler protection" : ""}.${frontageNote}`;
    }

    setResult({
      maxArea,
      baseArea,
      areaIncrease,
      compliant,
      recommendation
    });
    
    // Save to calculation history
    const newHistoryItem = {
      timestamp: new Date().toISOString(),
      occupancy,
      storeys,
      constructionType,
      sprinklered,
      streetFrontage,
      maxArea
    };
    
    const updatedHistory = [newHistoryItem, ...calculationHistory].slice(0, 5);
    setCalculationHistory(updatedHistory);
    localStorage.setItem('constructionLimitsHistory', JSON.stringify(updatedHistory));
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" /> Interactive Construction Limits Calculator
        </CardTitle>
        <CardDescription className="text-xs">
          Calculate maximum allowable building area based on NBC Part 3.2.2. <span className="text-orange-600 dark:text-orange-400 font-semibold">* Required fields</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="occupancy" className="text-xs font-semibold flex items-center gap-2">
              Major Occupancy Classification <span className="text-red-500">*</span>
              {occupancy && <Check className="w-4 h-4 text-green-600" />}
            </Label>
            <Select value={occupancy} onValueChange={setOccupancy}>
              <SelectTrigger id="occupancy">
                <SelectValue placeholder="Select occupancy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A-1">A-1 - Assembly (Performing Arts)</SelectItem>
                <SelectItem value="A-2">A-2 - Assembly (General)</SelectItem>
                <SelectItem value="A-3">A-3 - Assembly (Arena)</SelectItem>
                <SelectItem value="A-4">A-4 - Assembly (Open Air)</SelectItem>
                <SelectItem value="B-1">B-1 - Institutional (Detention)</SelectItem>
                <SelectItem value="B-2">B-2 - Institutional (Treatment)</SelectItem>
                <SelectItem value="B-3">B-3 - Institutional (Care)</SelectItem>
                <SelectItem value="C">C - Residential</SelectItem>
                <SelectItem value="D">D - Business & Personal Services</SelectItem>
                <SelectItem value="E">E - Mercantile</SelectItem>
                <SelectItem value="F-1">F-1 - Industrial (High Hazard)</SelectItem>
                <SelectItem value="F-2">F-2 - Industrial (Medium Hazard)</SelectItem>
                <SelectItem value="F-3">F-3 - Industrial (Low Hazard)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeys" className="text-xs font-semibold flex items-center gap-2">
              Number of Storeys <span className="text-red-500">*</span>
              {storeys && <Check className="w-4 h-4 text-green-600" />}
            </Label>
            <Input
              id="storeys"
              type="number"
              min="1"
              max="20"
              placeholder="e.g., 3"
              value={storeys}
              onChange={(e) => setStoreys(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="constructionType" className="text-xs font-semibold">
              Construction Type
            </Label>
            <Select value={constructionType} onValueChange={setConstructionType}>
              <SelectTrigger id="constructionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combustible">Combustible (Wood Frame)</SelectItem>
                <SelectItem value="noncombustible">Non-Combustible (Steel/Concrete)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprinklered" className="text-xs font-semibold">
              Sprinkler Protection
            </Label>
            <Select value={sprinklered} onValueChange={setSprinklered}>
              <SelectTrigger id="sprinklered">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No - Not Sprinklered</SelectItem>
                <SelectItem value="yes">Yes - Fully Sprinklered (NFPA 13)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="streetFrontage" className="text-xs font-semibold">
              Number of Street Frontages
            </Label>
            <Select value={streetFrontage} onValueChange={setStreetFrontage}>
              <SelectTrigger id="streetFrontage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Street (No increase)</SelectItem>
                <SelectItem value="2">2 Streets (+25% area)</SelectItem>
                <SelectItem value="3">3 Streets (+50% area)</SelectItem>
                <SelectItem value="4">4 Streets (+75% area)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Interactive Street Frontage Diagram */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <StreetFrontageDiagram 
            selectedFrontage={streetFrontage}
            onFrontageChange={setStreetFrontage}
          />
        </div>

        {(!occupancy || !storeys) && (
          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Please select <strong>Occupancy Classification</strong> and enter <strong>Number of Storeys</strong> to calculate maximum building area.
            </span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={calculateMaxArea} 
            className="flex-1"
            disabled={!occupancy || !storeys}
          >
            Calculate Maximum Building Area
          </Button>
          {result && (
            <Button
              variant="outline"
              onClick={() => {
                const data = [
                  ['Construction Limits Calculator Results'],
                  [''],
                  ['Input Parameters'],
                  ['Occupancy Classification', occupancy],
                  ['Number of Storeys', storeys],
                  ['Construction Type', constructionType === 'combustible' ? 'Combustible' : 'Non-Combustible'],
                  ['Sprinkler Protection', sprinklered === 'yes' ? 'Yes' : 'No'],
                  ['Street Frontages', streetFrontage],
                  [''],
                  ['Results'],
                  ['Base Area (m²)', result.baseArea.toString()],
                  ['Area Increase (%)', result.areaIncrease.toString()],
                  ['Maximum Building Area (m²)', result.maxArea.toString()],
                  ['Compliance Status', result.compliant ? 'Compliant' : 'Review Required'],
                  [''],
                  ['Recommendation'],
                  [result.recommendation],
                  [''],
                  ['Reference: NBC Part 3.2.2']
                ];
                const csvContent = data.map(row => row.join(',')).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `construction-limits-${occupancy}-${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export
            </Button>
          )}
        </div>

        {result && (
          <div className={`p-4 rounded-lg border-2 ${result.compliant ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-orange-500 bg-orange-50 dark:bg-orange-950'}`}>
            <div className="flex items-start gap-3">
              {result.compliant ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-bold text-sm mb-1">
                    {result.compliant ? 'Building Complies' : 'Review Required'}
                  </h4>
                  <p className="text-xs text-muted-foreground">{result.recommendation}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-3 rounded border space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">{result.maxArea.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">m² maximum building area</span>
                  </div>
                  {result.areaIncrease > 0 && (
                    <div className="text-xs space-y-1 pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base area:</span>
                        <span className="font-medium">{result.baseArea.toLocaleString()} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Street frontage increase:</span>
                        <span className="font-medium text-green-600">+{result.areaIncrease}%</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total allowable area:</span>
                        <span className="text-primary">{result.maxArea.toLocaleString()} m²</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Per NBC Table 3.2.2.X for {occupancy} occupancy
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {constructionType === "combustible" ? "Combustible Construction" : "Non-Combustible Construction"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {sprinklered === "yes" ? "Sprinklered" : "Non-Sprinklered"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {storeys} {parseInt(storeys) === 1 ? "Storey" : "Storeys"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {streetFrontage} Street {parseInt(streetFrontage) === 1 ? "Frontage" : "Frontages"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {calculationHistory.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <History className="w-4 h-4 text-primary" />
              Recent Calculations
            </div>
            <div className="space-y-2">
              {calculationHistory.map((item, index) => {
                const date = new Date(item.timestamp);
                const timeAgo = Math.floor((Date.now() - date.getTime()) / 60000); // minutes ago
                const displayTime = timeAgo < 60 
                  ? `${timeAgo}m ago` 
                  : timeAgo < 1440 
                    ? `${Math.floor(timeAgo / 60)}h ago`
                    : date.toLocaleDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors text-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="font-semibold">{item.occupancy} · {item.storeys} storeys</div>
                        <div className="text-muted-foreground">
                          {item.constructionType === "combustible" ? "Combustible" : "Non-Combustible"} · 
                          {item.sprinklered === "yes" ? "Sprinklered" : "Non-Sprinklered"} · 
                          {item.streetFrontage} street{parseInt(item.streetFrontage) > 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold text-primary">{item.maxArea.toLocaleString()} m²</div>
                        <div className="text-muted-foreground">{displayTime}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="font-semibold">Important Notes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Maximum areas shown are for single building compartments</li>
            <li>Street frontage increases per NBC 3.2.2.8 apply when building faces public streets with minimum 9m width</li>
            <li>Actual limits may vary based on fire separations and building configuration</li>
            <li>Refer to NBC Article 3.2.2 for complete requirements</li>
            <li>Sprinkler protection can significantly increase allowable areas</li>
            <li>Alternative solutions per NBC 3.2.6 may permit variations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
