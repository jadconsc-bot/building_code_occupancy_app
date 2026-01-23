import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Info, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { exportPermitFeeToExcel } from "@/lib/excelExport";

// Alberta municipal permit fee structures (2024 estimates)
const municipalityRates = {
  calgary: {
    name: "Calgary",
    baseFee: 150,
    rate: 0.0075, // 0.75% of project value
    minFee: 150,
    maxFee: 15000,
  },
  edmonton: {
    name: "Edmonton",
    baseFee: 125,
    rate: 0.008, // 0.8% of project value
    minFee: 125,
    maxFee: 12000,
  },
  redDeer: {
    name: "Red Deer",
    baseFee: 100,
    rate: 0.007, // 0.7% of project value
    minFee: 100,
    maxFee: 10000,
  },
  lethbridge: {
    name: "Lethbridge",
    baseFee: 100,
    rate: 0.0065, // 0.65% of project value
    minFee: 100,
    maxFee: 8000,
  },
  other: {
    name: "Other Municipality",
    baseFee: 100,
    rate: 0.007, // Average rate
    minFee: 100,
    maxFee: 10000,
  },
};

export function PermitFeeCalculator() {
  const [projectValue, setProjectValue] = useState("");
  const [municipality, setMunicipality] = useState<keyof typeof municipalityRates>("calgary");
  const [permitFee, setPermitFee] = useState<number | null>(null);

  const calculateFee = (value: string, muni: keyof typeof municipalityRates) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (isNaN(numValue) || numValue <= 0) {
      setPermitFee(null);
      return;
    }

    const rates = municipalityRates[muni];
    let fee = rates.baseFee + numValue * rates.rate;
    
    // Apply min/max limits
    fee = Math.max(rates.minFee, Math.min(fee, rates.maxFee));
    
    setPermitFee(Math.round(fee));
  };

  const handleValueChange = (value: string) => {
    setProjectValue(value);
    calculateFee(value, municipality);
  };

  const handleMunicipalityChange = (value: string) => {
    const muni = value as keyof typeof municipalityRates;
    setMunicipality(muni);
    if (projectValue) {
      calculateFee(projectValue, muni);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> Permit Fee Estimator
        </CardTitle>
        <CardDescription className="text-xs">
          Estimate municipal building permit fees based on project value
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="municipality" className="text-xs font-bold uppercase text-muted-foreground">
            Municipality
          </Label>
          <Select value={municipality} onValueChange={handleMunicipalityChange}>
            <SelectTrigger id="municipality" className="rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(municipalityRates).map(([key, data]) => (
                <SelectItem key={key} value={key}>
                  {data.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="projectValue" className="text-xs font-bold uppercase text-muted-foreground">
              Project Value
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Total construction cost including materials, labor, and contractor fees. 
                    This is typically the value declared on your permit application.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="projectValue"
              type="text"
              placeholder="e.g., 50000"
              value={projectValue}
              onChange={(e) => handleValueChange(e.target.value)}
              className="pl-9 rounded-none font-mono"
            />
          </div>
        </div>

        {permitFee !== null && (
          <div className="mt-6 p-4 bg-primary/5 border-2 border-primary rounded-none">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estimated Permit Fee
              </span>
              <Badge variant="outline" className="text-[10px] border-primary text-primary">
                {municipalityRates[municipality].name}
              </Badge>
            </div>
            <div className="text-3xl font-black text-primary font-mono">
              {formatCurrency(permitFee)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              <strong>Note:</strong> This is an estimate only. Actual fees may vary based on specific project details, 
              occupancy type, and additional inspections. Contact your local building department for exact fees.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Fee Structure</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted/30 rounded-none">
              <span className="text-muted-foreground block">Base Fee</span>
              <span className="font-bold">{formatCurrency(municipalityRates[municipality].baseFee)}</span>
            </div>
            <div className="p-2 bg-muted/30 rounded-none">
              <span className="text-muted-foreground block">Rate</span>
              <span className="font-bold">{(municipalityRates[municipality].rate * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        {permitFee !== null && (
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none gap-2"
              onClick={() => exportPermitFeeToExcel({
                municipality: municipalityRates[municipality].name,
                projectValue: parseFloat(projectValue.replace(/[^0-9.]/g, "")) || 0,
                baseFee: municipalityRates[municipality].baseFee,
                rate: municipalityRates[municipality].rate,
                estimatedFee: permitFee
              })}
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
