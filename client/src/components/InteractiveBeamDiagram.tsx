import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BeamType = "simple" | "continuous" | "cantilever";
type LoadType = "point" | "uniform" | "combined";

interface BeamDiagramProps {
  beamLength?: number;
  beamSize?: string;
  loadType?: LoadType;
  beamType?: BeamType;
}

export function InteractiveBeamDiagram({
  beamLength = 4.0,
  beamSize = "89 x 184 mm",
  loadType = "uniform",
  beamType = "simple",
}: BeamDiagramProps) {
  const [selectedBeamType, setSelectedBeamType] = useState<BeamType>(beamType);
  const [selectedLoadType, setSelectedLoadType] = useState<LoadType>(loadType);
  const [activeView, setActiveView] = useState<"elevation" | "shear" | "moment">("elevation");

  // SVG dimensions
  const width = 800;
  const height = 300;
  const margin = 60;
  const beamY = 150;
  const beamWidth = width - 2 * margin;

  // Calculate support positions based on beam type
  const getSupports = () => {
    switch (selectedBeamType) {
      case "simple":
        return [
          { x: margin, type: "pin" },
          { x: width - margin, type: "roller" },
        ];
      case "continuous":
        return [
          { x: margin, type: "pin" },
          { x: width / 2, type: "roller" },
          { x: width - margin, type: "roller" },
        ];
      case "cantilever":
        return [{ x: margin, type: "fixed" }];
      default:
        return [];
    }
  };

  const supports = getSupports();

  // Render support symbols
  const renderSupport = (x: number, type: string) => {
    if (type === "pin") {
      return (
        <g key={`support-${x}`}>
          <circle cx={x} cy={beamY + 10} r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1={x - 12} y1={beamY + 25} x2={x + 12} y2={beamY + 25} stroke="currentColor" strokeWidth="2" />
          <line x1={x - 10} y1={beamY + 25} x2={x - 15} y2={beamY + 35} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x - 3} y1={beamY + 25} x2={x - 8} y2={beamY + 35} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x + 3} y1={beamY + 25} x2={x - 2} y2={beamY + 35} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x + 10} y1={beamY + 25} x2={x + 5} y2={beamY + 35} stroke="currentColor" strokeWidth="1.5" />
        </g>
      );
    } else if (type === "roller") {
      return (
        <g key={`support-${x}`}>
          <circle cx={x - 6} cy={beamY + 15} r="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx={x + 6} cy={beamY + 15} r="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1={x - 12} y1={beamY + 25} x2={x + 12} y2={beamY + 25} stroke="currentColor" strokeWidth="2" />
          <line x1={x - 10} y1={beamY + 25} x2={x - 15} y2={beamY + 35} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x - 3} y1={beamY + 25} x2={x - 8} y2={beamY + 35} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x + 3} y1={beamY + 25} x2={x - 2} y2={beamY + 35} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x + 10} y1={beamY + 25} x2={x + 5} y2={beamY + 35} stroke="currentColor" strokeWidth="1.5" />
        </g>
      );
    } else if (type === "fixed") {
      return (
        <g key={`support-${x}`}>
          <rect x={x - 15} y={beamY - 15} width="30" height="40" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1={x - 15} y1={beamY - 10} x2={x - 20} y2={beamY - 15} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x - 15} y1={beamY} x2={x - 20} y2={beamY - 5} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x - 15} y1={beamY + 10} x2={x - 20} y2={beamY + 5} stroke="currentColor" strokeWidth="1.5" />
          <line x1={x - 15} y1={beamY + 20} x2={x - 20} y2={beamY + 15} stroke="currentColor" strokeWidth="1.5" />
        </g>
      );
    }
    return null;
  };

  // Render load arrows
  const renderLoads = () => {
    if (selectedLoadType === "point") {
      const loadX = margin + beamWidth / 2;
      return (
        <g>
          <line x1={loadX} y1={beamY - 60} x2={loadX} y2={beamY - 15} stroke="#F59E0B" strokeWidth="3" markerEnd="url(#arrowhead)" />
          <text x={loadX} y={beamY - 70} textAnchor="middle" className="text-xs font-bold fill-current">
            P
          </text>
        </g>
      );
    } else if (selectedLoadType === "uniform") {
      const arrows = [];
      for (let i = 0; i < 8; i++) {
        const x = margin + (beamWidth / 8) * (i + 0.5);
        arrows.push(
          <line key={i} x1={x} y1={beamY - 50} x2={x} y2={beamY - 15} stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrowhead)" />
        );
      }
      return (
        <g>
          {arrows}
          <text x={width / 2} y={beamY - 60} textAnchor="middle" className="text-xs font-bold fill-current">
            w (uniform load)
          </text>
        </g>
      );
    } else if (selectedLoadType === "combined") {
      const loadX = margin + beamWidth / 3;
      const arrows = [];
      for (let i = 0; i < 5; i++) {
        const x = margin + beamWidth / 2 + (beamWidth / 10) * (i + 0.5);
        arrows.push(
          <line key={i} x1={x} y1={beamY - 50} x2={x} y2={beamY - 15} stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrowhead)" />
        );
      }
      return (
        <g>
          <line x1={loadX} y1={beamY - 60} x2={loadX} y2={beamY - 15} stroke="#F59E0B" strokeWidth="3" markerEnd="url(#arrowhead)" />
          <text x={loadX} y={beamY - 70} textAnchor="middle" className="text-xs font-bold fill-current">
            P
          </text>
          {arrows}
          <text x={margin + (beamWidth * 3) / 4} y={beamY - 60} textAnchor="middle" className="text-xs font-bold fill-current">
            w
          </text>
        </g>
      );
    }
    return null;
  };

  // Render deflection curve
  const renderDeflection = () => {
    let pathData = "";
    const points = 50;

    for (let i = 0; i <= points; i++) {
      const ratio = i / points;
      const x = margin + beamWidth * ratio;
      let deflection = 0;

      if (selectedBeamType === "simple") {
        // Parabolic deflection for simple beam
        deflection = 20 * Math.sin(Math.PI * ratio);
      } else if (selectedBeamType === "cantilever") {
        // Cubic deflection for cantilever
        deflection = 30 * Math.pow(ratio, 2);
      } else if (selectedBeamType === "continuous") {
        // Multiple curves for continuous beam
        deflection = 15 * Math.sin(2 * Math.PI * ratio);
      }

      const y = beamY + deflection;
      pathData += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    return <path d={pathData} fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" />;
  };

  // Render shear diagram
  const renderShearDiagram = () => {
    const baseY = 200;
    let pathData = "";

    if (selectedBeamType === "simple" && selectedLoadType === "uniform") {
      pathData = `M ${margin} ${baseY - 40} L ${width / 2} ${baseY} L ${width - margin} ${baseY + 40}`;
    } else if (selectedBeamType === "simple" && selectedLoadType === "point") {
      pathData = `M ${margin} ${baseY - 30} L ${width / 2} ${baseY - 30} L ${width / 2} ${baseY + 30} L ${width - margin} ${baseY + 30}`;
    }

    return (
      <g>
        <line x1={margin} y1={baseY} x2={width - margin} y2={baseY} stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
        <path d={pathData} fill="none" stroke="#10B981" strokeWidth="3" />
        <text x={width / 2} y={baseY - 60} textAnchor="middle" className="text-sm font-bold fill-current">
          Shear Force Diagram
        </text>
      </g>
    );
  };

  // Render moment diagram
  const renderMomentDiagram = () => {
    const baseY = 200;
    let pathData = "";
    const points = 50;

    for (let i = 0; i <= points; i++) {
      const ratio = i / points;
      const x = margin + beamWidth * ratio;
      let moment = 0;

      if (selectedBeamType === "simple") {
        moment = -50 * Math.sin(Math.PI * ratio);
      } else if (selectedBeamType === "cantilever") {
        moment = 50 * Math.pow(ratio, 2);
      }

      const y = baseY + moment;
      pathData += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    return (
      <g>
        <line x1={margin} y1={baseY} x2={width - margin} y2={baseY} stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
        <path d={pathData} fill="none" stroke="#DC2626" strokeWidth="3" />
        <text x={width / 2} y={baseY - 60} textAnchor="middle" className="text-sm font-bold fill-current">
          Bending Moment Diagram
        </text>
      </g>
    );
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          Interactive Beam Diagram
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          Visualize beam behavior with support conditions and loading
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Beam Type
            </label>
            <Select value={selectedBeamType} onValueChange={(v) => setSelectedBeamType(v as BeamType)}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple Beam (Pin + Roller)</SelectItem>
                <SelectItem value="continuous">Continuous Beam (Multiple Supports)</SelectItem>
                <SelectItem value="cantilever">Cantilever Beam (Fixed End)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Load Type
            </label>
            <Select value={selectedLoadType} onValueChange={(v) => setSelectedLoadType(v as LoadType)}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="point">Point Load (P)</SelectItem>
                <SelectItem value="uniform">Uniform Load (w)</SelectItem>
                <SelectItem value="combined">Combined (P + w)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none">
            <TabsTrigger value="elevation" className="rounded-none">
              Elevation View
            </TabsTrigger>
            <TabsTrigger value="shear" className="rounded-none">
              Shear Diagram
            </TabsTrigger>
            <TabsTrigger value="moment" className="rounded-none">
              Moment Diagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="elevation" className="mt-4">
            <div className="bg-muted/20 p-4 border border-border rounded-none">
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="text-foreground">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="5"
                    refY="5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 5, 0 10" fill="#F59E0B" />
                  </marker>
                </defs>

                {/* Beam */}
                <rect
                  x={selectedBeamType === "cantilever" ? margin : margin}
                  y={beamY - 10}
                  width={selectedBeamType === "cantilever" ? beamWidth / 1.5 : beamWidth}
                  height="20"
                  fill="currentColor"
                  opacity="0.8"
                />

                {/* Supports */}
                {supports.map((support) => renderSupport(support.x, support.type))}

                {/* Loads */}
                {renderLoads()}

                {/* Deflection curve */}
                {renderDeflection()}

                {/* Dimensions */}
                <line
                  x1={margin}
                  y1={beamY + 50}
                  x2={selectedBeamType === "cantilever" ? margin + beamWidth / 1.5 : width - margin}
                  y2={beamY + 50}
                  stroke="currentColor"
                  strokeWidth="1"
                  markerStart="url(#arrowhead)"
                  markerEnd="url(#arrowhead)"
                />
                <text x={width / 2} y={beamY + 70} textAnchor="middle" className="text-xs fill-current">
                  L = {beamLength.toFixed(1)}m ({(beamLength * 3.28084).toFixed(1)}ft)
                </text>

                {/* Beam size label */}
                <text x={width / 2} y={30} textAnchor="middle" className="text-sm font-bold fill-current">
                  {beamSize}
                </text>
              </svg>
            </div>
          </TabsContent>

          <TabsContent value="shear" className="mt-4">
            <div className="bg-muted/20 p-4 border border-border rounded-none">
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="text-foreground">
                {renderShearDiagram()}
              </svg>
            </div>
          </TabsContent>

          <TabsContent value="moment" className="mt-4">
            <div className="bg-muted/20 p-4 border border-border rounded-none">
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="text-foreground">
                {renderMomentDiagram()}
              </svg>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-none">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Diagram Legend
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <p className="mb-1">
                <span className="inline-block w-4 h-4 bg-current opacity-80 mr-2"></span>
                <strong>Beam:</strong> Structural member
              </p>
              <p className="mb-1">
                <span className="inline-block w-4 h-4 border-2 border-current mr-2"></span>
                <strong>Pin Support:</strong> Prevents translation
              </p>
              <p className="mb-1">
                <span className="inline-block w-4 h-4 border-2 border-current rounded-full mr-2"></span>
                <strong>Roller Support:</strong> Allows horizontal movement
              </p>
            </div>
            <div>
              <p className="mb-1">
                <span className="inline-block w-4 h-1 bg-[#F59E0B] mr-2"></span>
                <strong style={{ color: "#F59E0B" }}>Load:</strong> Applied force
              </p>
              <p className="mb-1">
                <span className="inline-block w-4 h-1 bg-[#3B82F6] mr-2"></span>
                <strong style={{ color: "#3B82F6" }}>Deflection:</strong> Beam deformation
              </p>
              <p className="mb-1">
                <span className="inline-block w-4 h-1 bg-[#10B981] mr-2"></span>
                <strong style={{ color: "#10B981" }}>Shear:</strong> Internal force
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
