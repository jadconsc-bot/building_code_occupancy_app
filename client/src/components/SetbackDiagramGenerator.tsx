import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, Download, RefreshCw, Maximize2, Building2, Ruler, Info, Save, Loader2 } from "lucide-react";
import { municipalities, getMunicipalityById, getZoneByCode, ZoneRegulation } from "@shared/municipalBylawsData";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { toast } from "sonner";

interface LotDimensions {
  width: number;
  depth: number;
}

interface BuildingDimensions {
  width: number;
  depth: number;
  height: number;
}

interface ProposedSetbacks {
  front: number;
  rear: number;
  left: number;
  right: number;
}

export function SetbackDiagramGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { activeProjectId } = useProject();
  const saveAnalysisMutation = trpc.siteAnalysis.save.useMutation();
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string>("edmonton");
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<ZoneRegulation | null>(null);
  
  const [lotDimensions, setLotDimensions] = useState<LotDimensions>({
    width: 15,
    depth: 35,
  });
  
  const [buildingDimensions, setBuildingDimensions] = useState<BuildingDimensions>({
    width: 10,
    depth: 15,
    height: 8,
  });
  
  const [proposedSetbacks, setProposedSetbacks] = useState<ProposedSetbacks>({
    front: 6,
    rear: 7.5,
    left: 1.2,
    right: 1.2,
  });
  
  const [isCornerLot, setIsCornerLot] = useState(false);
  const [showBuildingEnvelope, setShowBuildingEnvelope] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [complianceResults, setComplianceResults] = useState<{
    compliant: boolean;
    violations: string[];
    warnings: string[];
  }>({ compliant: true, violations: [], warnings: [] });

  // Accessory building state
  const [showAccessoryBuilding, setShowAccessoryBuilding] = useState(false);
  const [accessoryDimensions, setAccessoryDimensions] = useState({ width: 5.0, depth: 6.0, height: 3.8 });
  const [accessoryLocation, setAccessoryLocation] = useState<'rear' | 'side'>('rear');
  const [accessorySetbacks, setAccessorySetbacks] = useState({ rear: 0.6, side: 0.6, fromMain: 1.5 });

  // Get available zones for selected municipality
  const availableZones = selectedMunicipalityId 
    ? getMunicipalityById(selectedMunicipalityId)?.zones || []
    : [];

  // Update selected zone when zone code changes
  useEffect(() => {
    if (selectedMunicipalityId && selectedZoneCode) {
      const zone = getZoneByCode(selectedMunicipalityId, selectedZoneCode);
      setSelectedZone(zone || null);
      
      // Auto-fill setbacks from zone requirements
      if (zone) {
        setProposedSetbacks({
          front: zone.setbacks.front,
          rear: zone.setbacks.rear,
          left: zone.setbacks.sideInterior,
          right: isCornerLot ? (zone.setbacks.sideCorner || zone.setbacks.sideInterior) : zone.setbacks.sideInterior,
        });
      }
    }
  }, [selectedMunicipalityId, selectedZoneCode, isCornerLot]);

  // Check compliance
  useEffect(() => {
    if (!selectedZone) {
      setComplianceResults({ compliant: true, violations: [], warnings: [] });
      return;
    }

    const violations: string[] = [];
    const warnings: string[] = [];
    const required = selectedZone.setbacks;

    // Check setbacks
    if (proposedSetbacks.front < required.front) {
      violations.push(`Front setback (${proposedSetbacks.front}m) is less than required (${required.front}m)`);
    }
    if (proposedSetbacks.rear < required.rear) {
      violations.push(`Rear setback (${proposedSetbacks.rear}m) is less than required (${required.rear}m)`);
    }
    if (proposedSetbacks.left < required.sideInterior) {
      violations.push(`Left side setback (${proposedSetbacks.left}m) is less than required (${required.sideInterior}m)`);
    }
    
    const rightRequired = isCornerLot 
      ? (required.sideCorner || required.sideInterior) 
      : required.sideInterior;
    if (proposedSetbacks.right < rightRequired) {
      violations.push(`Right side setback (${proposedSetbacks.right}m) is less than required (${rightRequired}m)`);
    }

    // Check building fits within lot
    const maxBuildingWidth = lotDimensions.width - proposedSetbacks.left - proposedSetbacks.right;
    const maxBuildingDepth = lotDimensions.depth - proposedSetbacks.front - proposedSetbacks.rear;

    if (buildingDimensions.width > maxBuildingWidth) {
      violations.push(`Building width (${buildingDimensions.width}m) exceeds available space (${maxBuildingWidth.toFixed(1)}m)`);
    }
    if (buildingDimensions.depth > maxBuildingDepth) {
      violations.push(`Building depth (${buildingDimensions.depth}m) exceeds available space (${maxBuildingDepth.toFixed(1)}m)`);
    }

    // Check height
    if (selectedZone.height.maxHeight && buildingDimensions.height > selectedZone.height.maxHeight) {
      violations.push(`Building height (${buildingDimensions.height}m) exceeds maximum (${selectedZone.height.maxHeight}m)`);
    }

    // Check site coverage
    const buildingArea = buildingDimensions.width * buildingDimensions.depth;
    const lotArea = lotDimensions.width * lotDimensions.depth;
    const coverage = (buildingArea / lotArea) * 100;
    
    if (selectedZone.coverage.maxSiteCoverage && coverage > selectedZone.coverage.maxSiteCoverage) {
      violations.push(`Site coverage (${coverage.toFixed(1)}%) exceeds maximum (${selectedZone.coverage.maxSiteCoverage}%)`);
    }

    // Check lot requirements
    if (selectedZone.lotRequirements) {
      if (selectedZone.lotRequirements.minArea && lotArea < selectedZone.lotRequirements.minArea) {
        warnings.push(`Lot area (${lotArea}m²) is below minimum (${selectedZone.lotRequirements.minArea}m²)`);
      }
      if (selectedZone.lotRequirements.minWidth && lotDimensions.width < selectedZone.lotRequirements.minWidth) {
        warnings.push(`Lot width (${lotDimensions.width}m) is below minimum (${selectedZone.lotRequirements.minWidth}m)`);
      }
    }

    setComplianceResults({
      compliant: violations.length === 0,
      violations,
      warnings,
    });
  }, [selectedZone, proposedSetbacks, buildingDimensions, lotDimensions, isCornerLot]);

  // Draw diagram
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const canvasWidth = 600;
    const canvasHeight = 500;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scale to fit lot in canvas with padding
    const padding = 60;
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;
    const scaleX = availableWidth / lotDimensions.width;
    const scaleY = availableHeight / lotDimensions.depth;
    const scale = Math.min(scaleX, scaleY);

    // Center the lot
    const lotWidth = lotDimensions.width * scale;
    const lotHeight = lotDimensions.depth * scale;
    const offsetX = (canvasWidth - lotWidth) / 2;
    const offsetY = (canvasHeight - lotHeight) / 2;

    // Draw lot boundary
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(offsetX, offsetY, lotWidth, lotHeight);
    ctx.strokeRect(offsetX, offsetY, lotWidth, lotHeight);

    // Draw setback lines (dashed)
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;

    const frontSetbackY = offsetY + proposedSetbacks.front * scale;
    const rearSetbackY = offsetY + lotHeight - proposedSetbacks.rear * scale;
    const leftSetbackX = offsetX + proposedSetbacks.left * scale;
    const rightSetbackX = offsetX + lotWidth - proposedSetbacks.right * scale;

    // Front setback line
    ctx.beginPath();
    ctx.moveTo(offsetX, frontSetbackY);
    ctx.lineTo(offsetX + lotWidth, frontSetbackY);
    ctx.stroke();

    // Rear setback line
    ctx.beginPath();
    ctx.moveTo(offsetX, rearSetbackY);
    ctx.lineTo(offsetX + lotWidth, rearSetbackY);
    ctx.stroke();

    // Left setback line
    ctx.beginPath();
    ctx.moveTo(leftSetbackX, offsetY);
    ctx.lineTo(leftSetbackX, offsetY + lotHeight);
    ctx.stroke();

    // Right setback line
    ctx.beginPath();
    ctx.moveTo(rightSetbackX, offsetY);
    ctx.lineTo(rightSetbackX, offsetY + lotHeight);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw building envelope if enabled
    if (showBuildingEnvelope) {
      ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      
      const envelopeX = leftSetbackX;
      const envelopeY = frontSetbackY;
      const envelopeWidth = rightSetbackX - leftSetbackX;
      const envelopeHeight = rearSetbackY - frontSetbackY;
      
      if (envelopeWidth > 0 && envelopeHeight > 0) {
        ctx.fillRect(envelopeX, envelopeY, envelopeWidth, envelopeHeight);
        ctx.strokeRect(envelopeX, envelopeY, envelopeWidth, envelopeHeight);
      }
      ctx.setLineDash([]);
    }

    // Draw proposed building
    const buildingX = leftSetbackX;
    const buildingY = frontSetbackY;
    const buildingWidth = buildingDimensions.width * scale;
    const buildingHeight = buildingDimensions.depth * scale;

    // Check if building fits within setback envelope
    const buildingFits =
      buildingDimensions.width <= (lotDimensions.width - proposedSetbacks.left - proposedSetbacks.right) &&
      buildingDimensions.depth <= (lotDimensions.depth - proposedSetbacks.front - proposedSetbacks.rear);

    // Combined coverage check when accessory building is shown
    const accAreaForCanvas = showAccessoryBuilding
      ? accessoryDimensions.width * accessoryDimensions.depth
      : 0;
    const combinedCovForCanvas =
      ((buildingDimensions.width * buildingDimensions.depth + accAreaForCanvas) /
        (lotDimensions.width * lotDimensions.depth)) * 100;
    const maxCovForCanvas = selectedZone?.coverage.maxSiteCoverage;
    const combinedExceedsMax =
      showAccessoryBuilding &&
      maxCovForCanvas !== undefined &&
      combinedCovForCanvas > maxCovForCanvas;

    let mainFill = buildingFits ? "rgba(59, 130, 246, 0.6)" : "rgba(239, 68, 68, 0.6)";
    let mainStroke = buildingFits ? "#2563eb" : "#dc2626";
    if (combinedExceedsMax) {
      mainFill = "rgba(239, 68, 68, 0.6)";
      mainStroke = "#dc2626";
    }

    ctx.fillStyle = mainFill;
    ctx.strokeStyle = mainStroke;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);

    if (buildingWidth > 0 && buildingHeight > 0) {
      ctx.fillRect(buildingX, buildingY, buildingWidth, buildingHeight);
      ctx.strokeRect(buildingX, buildingY, buildingWidth, buildingHeight);
    }

    // Draw accessory building in rear yard
    if (showAccessoryBuilding) {
      const accCanvasW = accessoryDimensions.width * scale;
      const accCanvasH = accessoryDimensions.depth * scale;
      const accCanvasX = offsetX + (lotWidth - accCanvasW) / 2;
      const accCanvasY = offsetY + lotHeight - accessorySetbacks.rear * scale - accCanvasH;

      const accFill = combinedExceedsMax ? "rgba(239, 68, 68, 0.6)" : "rgba(251, 146, 60, 0.4)";
      const accStroke = combinedExceedsMax ? "#dc2626" : "#f97316";
      const accTextColor = combinedExceedsMax ? "#991b1b" : "#7c2d12";

      ctx.fillStyle = accFill;
      ctx.strokeStyle = accStroke;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      if (accCanvasW > 0 && accCanvasH > 0) {
        ctx.fillRect(accCanvasX, accCanvasY, accCanvasW, accCanvasH);
        ctx.strokeRect(accCanvasX, accCanvasY, accCanvasW, accCanvasH);

        if (showDimensions) {
          ctx.font = "10px Inter, system-ui, sans-serif";
          ctx.fillStyle = accTextColor;
          ctx.textAlign = "center";
          ctx.fillText(
            `${accessoryDimensions.width}×${accessoryDimensions.depth}m`,
            accCanvasX + accCanvasW / 2,
            accCanvasY + accCanvasH / 2 - 5,
          );
          ctx.fillText(
            "ACCESSORY",
            accCanvasX + accCanvasW / 2,
            accCanvasY + accCanvasH / 2 + 8,
          );
        }
      }
    }

    // Draw dimensions if enabled
    if (showDimensions) {
      ctx.font = "bold 12px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "center";

      // Lot width (top)
      ctx.fillText(`${lotDimensions.width}m`, canvasWidth / 2, offsetY - 15);
      
      // Lot depth (left)
      ctx.save();
      ctx.translate(offsetX - 25, canvasHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${lotDimensions.depth}m`, 0, 0);
      ctx.restore();

      // Setback dimensions
      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#3b82f6";

      // Front setback
      ctx.fillText(`${proposedSetbacks.front}m`, canvasWidth / 2, frontSetbackY - 5);
      
      // Rear setback
      ctx.fillText(`${proposedSetbacks.rear}m`, canvasWidth / 2, rearSetbackY + 15);
      
      // Left setback
      ctx.fillText(`${proposedSetbacks.left}m`, leftSetbackX - 15, canvasHeight / 2);
      
      // Right setback
      ctx.fillText(`${proposedSetbacks.right}m`, rightSetbackX + 15, canvasHeight / 2);

      // Building dimensions
      if (buildingWidth > 0 && buildingHeight > 0) {
        ctx.fillStyle = "#2563eb";
        ctx.fillText(
          `${buildingDimensions.width}m × ${buildingDimensions.depth}m`,
          buildingX + buildingWidth / 2,
          buildingY + buildingHeight / 2
        );
      }
    }

    // Draw legend
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    
    const legendY = canvasHeight - 25;
    
    // Lot boundary
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(10, legendY - 8, 15, 15);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, legendY - 8, 15, 15);
    ctx.fillText("Lot Boundary", 30, legendY + 3);
    
    // Setback lines
    ctx.setLineDash([4, 2]);
    ctx.strokeStyle = "#3b82f6";
    ctx.beginPath();
    ctx.moveTo(130, legendY);
    ctx.lineTo(155, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#3b82f6";
    ctx.fillText("Setback Lines", 160, legendY + 3);
    
    // Building
    ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
    ctx.fillRect(270, legendY - 8, 15, 15);
    ctx.fillStyle = "#2563eb";
    ctx.fillText("Proposed Building", 290, legendY + 3);

    // Building envelope
    if (showBuildingEnvelope) {
      ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      ctx.fillRect(420, legendY - 8, 15, 15);
      ctx.strokeStyle = "#22c55e";
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(420, legendY - 8, 15, 15);
      ctx.setLineDash([]);
      ctx.fillStyle = "#22c55e";
      ctx.fillText("Building Envelope", 440, legendY + 3);
    }

    // Accessory building legend (second row)
    if (showAccessoryBuilding) {
      const accLegendY = legendY - 20;
      ctx.fillStyle = "rgba(251, 146, 60, 0.4)";
      ctx.fillRect(10, accLegendY - 8, 15, 15);
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.strokeRect(10, accLegendY - 8, 15, 15);
      ctx.fillStyle = "#f97316";
      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Accessory Building", 30, accLegendY + 3);
    }

    // Draw street label
    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.fillText("STREET (FRONT)", canvasWidth / 2, offsetY + lotHeight + 35);
    
    if (isCornerLot) {
      ctx.save();
      ctx.translate(offsetX + lotWidth + 35, canvasHeight / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText("STREET (SIDE)", 0, 0);
      ctx.restore();
    }

  }, [lotDimensions, buildingDimensions, proposedSetbacks, showBuildingEnvelope, showDimensions, isCornerLot,
      showAccessoryBuilding, accessoryDimensions, accessorySetbacks, selectedZone]);

  // Download diagram as PNG
  const downloadDiagram = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = showAccessoryBuilding
      ? `setback-diagram-${selectedMunicipalityId}-${selectedZoneCode || "custom"}-with-accessory.png`
      : `setback-diagram-${selectedMunicipalityId}-${selectedZoneCode || "custom"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Save site analysis to active project
  const handleSaveToProject = async () => {
    if (!activeProjectId || activeProjectId <= 0) {
      toast.error("No active project — open a project first");
      return;
    }
    const sideSetback = Math.min(proposedSetbacks.left, proposedSetbacks.right);
    try {
      await saveAnalysisMutation.mutateAsync({
        projectId:       activeProjectId,
        lotWidthM:       lotDimensions.width,
        lotDepthM:       lotDimensions.depth,
        lotAreaSqm:      lotArea,
        buildingWidthM:  buildingDimensions.width,
        buildingDepthM:  buildingDimensions.depth,
        buildingHeightM: buildingDimensions.height,
        frontSetbackM:   proposedSetbacks.front,
        rearSetbackM:    proposedSetbacks.rear,
        sideSetbackM:    sideSetback,
        siteCoveragePct:      siteCoverage,
        isCompliant:          complianceResults.compliant,
        zoneCode:             selectedZoneCode || undefined,
        municipality:         selectedMunicipalityId || undefined,
        ...(showAccessoryBuilding ? {
          accessoryWidthM:      accessoryDimensions.width,
          accessoryDepthM:      accessoryDimensions.depth,
          accessoryHeightM:     accessoryDimensions.height,
          accessoryAreaSqm:     accessoryArea,
          accessoryIsCompliant: accIsCompliant,
        } : {}),
      });
      toast.success("Site analysis saved to project");
    } catch {
      toast.error("Failed to save site analysis");
    }
  };

  // Calculate site statistics
  const lotArea = lotDimensions.width * lotDimensions.depth;
  const buildingArea = buildingDimensions.width * buildingDimensions.depth;
  const siteCoverage = (buildingArea / lotArea) * 100;
  const buildableArea = (lotDimensions.width - proposedSetbacks.left - proposedSetbacks.right) *
                        (lotDimensions.depth - proposedSetbacks.front - proposedSetbacks.rear);

  // Accessory building compliance
  const accessoryArea = accessoryDimensions.width * accessoryDimensions.depth;
  const combinedCoverage = ((buildingArea + accessoryArea) / lotArea) * 100;
  const munData = getMunicipalityById(selectedMunicipalityId);
  const maxAccessoryArea   = munData?.generalRegulations?.accessoryBuildingMaxArea   ?? 65;
  const maxAccessoryHeight = munData?.generalRegulations?.accessoryBuildingMaxHeight ?? 4.5;
  const accAreaOk        = accessoryArea <= maxAccessoryArea;
  const accHeightOk      = accessoryDimensions.height <= maxAccessoryHeight;
  const accRearOk        = accessorySetbacks.rear >= 0.6;
  const accSideOk        = accessorySetbacks.side >= 0.6;
  const accFromMainOk    = accessorySetbacks.fromMain >= 1.5;
  const accCombinedOk    = !selectedZone || combinedCoverage <= selectedZone.coverage.maxSiteCoverage;
  const accRequiresPermit = accessoryArea > 10;
  const accIsCompliant   = accAreaOk && accHeightOk && accRearOk && accSideOk && accFromMainOk && accCombinedOk;

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ruler className="w-5 h-5 text-primary" />
          Visual Setback Diagram Generator
        </CardTitle>
        <CardDescription>
          Create interactive setback diagrams based on municipal zoning requirements. Visualize building placement and check compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Controls */}
          <div className="space-y-6">
            {/* Municipality and Zone Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Municipality</Label>
                <Select value={selectedMunicipalityId} onValueChange={setSelectedMunicipalityId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select municipality" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Zone</Label>
                <Select value={selectedZoneCode} onValueChange={setSelectedZoneCode}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableZones.map((z) => (
                      <SelectItem key={z.zoneCode} value={z.zoneCode}>
                        {z.zoneCode} - {z.zoneName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Zone Info */}
            {selectedZone && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedZone.zoneName}</span>
                </div>
                <p className="text-muted-foreground text-xs">{selectedZone.description}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>Max Height: <span className="font-medium">{selectedZone.height.maxHeight}m</span></div>
                  <div>Max Coverage: <span className="font-medium">{selectedZone.coverage.maxSiteCoverage}%</span></div>
                </div>
              </div>
            )}

            <Tabs defaultValue="lot" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="lot">Lot</TabsTrigger>
                <TabsTrigger value="building">Building</TabsTrigger>
                <TabsTrigger value="setbacks">Setbacks</TabsTrigger>
              </TabsList>

              <TabsContent value="lot" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Lot Width (m)</Label>
                    <Input
                      type="number"
                      value={lotDimensions.width}
                      onChange={(e) => setLotDimensions({ ...lotDimensions, width: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.5}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Lot Depth (m)</Label>
                    <Input
                      type="number"
                      value={lotDimensions.depth}
                      onChange={(e) => setLotDimensions({ ...lotDimensions, depth: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.5}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cornerLot"
                    checked={isCornerLot}
                    onChange={(e) => setIsCornerLot(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="cornerLot" className="text-xs cursor-pointer">Corner Lot (increased side setback)</Label>
                </div>
              </TabsContent>

              <TabsContent value="building" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Building Width (m)</Label>
                    <Input
                      type="number"
                      value={buildingDimensions.width}
                      onChange={(e) => setBuildingDimensions({ ...buildingDimensions, width: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.5}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Building Depth (m)</Label>
                    <Input
                      type="number"
                      value={buildingDimensions.depth}
                      onChange={(e) => setBuildingDimensions({ ...buildingDimensions, depth: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.5}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Building Height (m)</Label>
                  <Input
                    type="number"
                    value={buildingDimensions.height}
                    onChange={(e) => setBuildingDimensions({ ...buildingDimensions, height: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.5}
                    className="mt-1"
                  />
                </div>
              </TabsContent>

              <TabsContent value="setbacks" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Front Setback (m)</Label>
                    <Input
                      type="number"
                      value={proposedSetbacks.front}
                      onChange={(e) => setProposedSetbacks({ ...proposedSetbacks, front: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Rear Setback (m)</Label>
                    <Input
                      type="number"
                      value={proposedSetbacks.rear}
                      onChange={(e) => setProposedSetbacks({ ...proposedSetbacks, rear: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Left Side Setback (m)</Label>
                    <Input
                      type="number"
                      value={proposedSetbacks.left}
                      onChange={(e) => setProposedSetbacks({ ...proposedSetbacks, left: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Right Side Setback (m){isCornerLot && " (Corner)"}</Label>
                    <Input
                      type="number"
                      value={proposedSetbacks.right}
                      onChange={(e) => setProposedSetbacks({ ...proposedSetbacks, right: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Accessory Building */}
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAccessory"
                  checked={showAccessoryBuilding}
                  onChange={(e) => setShowAccessoryBuilding(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="showAccessory" className="text-xs cursor-pointer font-medium">
                  Include Accessory Building (garage, shed, workshop)
                </Label>
              </div>

              {showAccessoryBuilding && (
                <div className="space-y-3 pl-1 border-l-2 border-orange-200 ml-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Width (m)</Label>
                      <Input
                        type="number"
                        value={accessoryDimensions.width}
                        onChange={(e) => setAccessoryDimensions({ ...accessoryDimensions, width: parseFloat(e.target.value) || 0 })}
                        min={0} step={0.1} className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Depth (m)</Label>
                      <Input
                        type="number"
                        value={accessoryDimensions.depth}
                        onChange={(e) => setAccessoryDimensions({ ...accessoryDimensions, depth: parseFloat(e.target.value) || 0 })}
                        min={0} step={0.1} className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height (m)</Label>
                      <Input
                        type="number"
                        value={accessoryDimensions.height}
                        onChange={(e) => setAccessoryDimensions({ ...accessoryDimensions, height: parseFloat(e.target.value) || 0 })}
                        min={0} step={0.1} className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Location</Label>
                    <Select value={accessoryLocation} onValueChange={(v) => setAccessoryLocation(v as 'rear' | 'side')}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rear">Rear Yard</SelectItem>
                        <SelectItem value="side">Side Yard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Rear setback (m)</Label>
                      <Input
                        type="number"
                        value={accessorySetbacks.rear}
                        onChange={(e) => setAccessorySetbacks({ ...accessorySetbacks, rear: parseFloat(e.target.value) || 0 })}
                        min={0} step={0.1} className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Side setback (m)</Label>
                      <Input
                        type="number"
                        value={accessorySetbacks.side}
                        onChange={(e) => setAccessorySetbacks({ ...accessorySetbacks, side: parseFloat(e.target.value) || 0 })}
                        min={0} step={0.1} className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">From main (m)</Label>
                      <Input
                        type="number"
                        value={accessorySetbacks.fromMain}
                        onChange={(e) => setAccessorySetbacks({ ...accessorySetbacks, fromMain: parseFloat(e.target.value) || 0 })}
                        min={0} step={0.1} className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Display Options */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showEnvelope"
                  checked={showBuildingEnvelope}
                  onChange={(e) => setShowBuildingEnvelope(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="showEnvelope" className="text-xs cursor-pointer">Show Building Envelope</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showDimensions"
                  checked={showDimensions}
                  onChange={(e) => setShowDimensions(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="showDimensions" className="text-xs cursor-pointer">Show Dimensions</Label>
              </div>
            </div>

            {/* Site Statistics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Lot Area</div>
                <div className="font-bold">{lotArea.toFixed(1)} m²</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Building Area</div>
                <div className="font-bold">{buildingArea.toFixed(1)} m²</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Site Coverage</div>
                <div className={`font-bold ${selectedZone && siteCoverage > selectedZone.coverage.maxSiteCoverage ? 'text-red-600' : 'text-green-600'}`}>
                  {siteCoverage.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Buildable Area</div>
                <div className="font-bold">{buildableArea.toFixed(1)} m²</div>
              </div>
            </div>

            {/* Compliance Results */}
            <div className={`p-3 rounded-lg ${complianceResults.compliant ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {complianceResults.compliant ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Compliant</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">Non-Compliant</span>
                  </>
                )}
              </div>
              {complianceResults.violations.length > 0 && (
                <ul className="text-xs text-red-700 space-y-1">
                  {complianceResults.violations.map((v, i) => (
                    <li key={i}>• {v}</li>
                  ))}
                </ul>
              )}
              {complianceResults.warnings.length > 0 && (
                <ul className="text-xs text-amber-700 space-y-1 mt-2">
                  {complianceResults.warnings.map((w, i) => (
                    <li key={i}>⚠ {w}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Accessory Building Compliance Table */}
            {showAccessoryBuilding && (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 space-y-2">
                <div className="text-sm font-medium text-orange-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Accessory Building Compliance
                  <Badge variant="outline" className={`ml-auto text-xs ${accIsCompliant ? 'text-green-700 border-green-300' : 'text-red-700 border-red-300'}`}>
                    {accIsCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-orange-800 border-b border-orange-200">
                        <th className="pb-1 pr-2">Check</th>
                        <th className="pb-1 pr-2">Proposed</th>
                        <th className="pb-1 pr-2">Max / Min</th>
                        <th className="pb-1">Status</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      {[
                        {
                          label: 'Footprint area',
                          proposed: `${accessoryArea.toFixed(1)} m²`,
                          limit: `≤ ${maxAccessoryArea} m²`,
                          ok: accAreaOk,
                        },
                        {
                          label: 'Height',
                          proposed: `${accessoryDimensions.height} m`,
                          limit: `≤ ${maxAccessoryHeight} m`,
                          ok: accHeightOk,
                        },
                        {
                          label: 'Rear setback',
                          proposed: `${accessorySetbacks.rear} m`,
                          limit: '≥ 0.6 m',
                          ok: accRearOk,
                        },
                        {
                          label: 'Side setback',
                          proposed: `${accessorySetbacks.side} m`,
                          limit: '≥ 0.6 m',
                          ok: accSideOk,
                        },
                        {
                          label: 'From main building',
                          proposed: `${accessorySetbacks.fromMain} m`,
                          limit: '≥ 1.5 m',
                          ok: accFromMainOk,
                        },
                        {
                          label: 'Combined site coverage',
                          proposed: `${combinedCoverage.toFixed(1)}%`,
                          limit: selectedZone ? `≤ ${selectedZone.coverage.maxSiteCoverage}%` : '—',
                          ok: accCombinedOk,
                        },
                      ].map((row) => (
                        <tr key={row.label} className="border-b border-orange-100">
                          <td className="py-1 pr-2 text-orange-900">{row.label}</td>
                          <td className="py-1 pr-2">{row.proposed}</td>
                          <td className="py-1 pr-2 text-muted-foreground">{row.limit}</td>
                          <td className="py-1">
                            <span className={`font-medium ${row.ok ? 'text-green-700' : 'text-red-700'}`}>
                              {row.ok ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="py-1 pr-2 text-orange-900">Permit required</td>
                        <td className="py-1 pr-2">{accessoryArea.toFixed(1)} m²</td>
                        <td className="py-1 pr-2 text-muted-foreground">&gt; 10 m²</td>
                        <td className="py-1">
                          {accRequiresPermit ? (
                            <span className="text-amber-700 font-medium">⚠ Permit req'd</span>
                          ) : (
                            <span className="text-green-700 font-medium">No permit</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Diagram */}
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden bg-white">
              <canvas 
                ref={canvasRef} 
                className="w-full"
                style={{ maxHeight: "500px" }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadDiagram} variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button
                onClick={handleSaveToProject}
                disabled={saveAnalysisMutation.isPending || !activeProjectId}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {saveAnalysisMutation.isPending
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Save className="w-4 h-4 mr-2" />}
                Save to Project
              </Button>
              <Button
                onClick={() => {
                  setLotDimensions({ width: 15, depth: 35 });
                  setBuildingDimensions({ width: 10, depth: 15, height: 8 });
                  setProposedSetbacks({ front: 6, rear: 7.5, left: 1.2, right: 1.2 });
                }}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
