import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Ruler, 
  Square, 
  Type, 
  Trash2, 
  Download, 
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Layers,
  Eye,
  EyeOff,
  Pencil
} from "lucide-react";
import { municipalities, Municipality, ZoneRegulation } from "@/lib/municipalBylawsData";

// Types for annotations
interface Point {
  x: number;
  y: number;
}

interface DimensionAnnotation {
  id: string;
  type: "dimension";
  start: Point;
  end: Point;
  value: number; // in meters
  label: string;
  category: "setback-front" | "setback-rear" | "setback-side" | "building-width" | "building-depth" | "lot-width" | "lot-depth" | "other";
}

interface LabelAnnotation {
  id: string;
  type: "label";
  position: Point;
  text: string;
  category: "room" | "area" | "note";
}

interface AreaAnnotation {
  id: string;
  type: "area";
  points: Point[];
  value: number; // in square meters
  label: string;
  category: "building-footprint" | "lot-area" | "other";
}

type Annotation = DimensionAnnotation | LabelAnnotation | AreaAnnotation;

interface ComplianceResult {
  rule: string;
  required: string;
  actual: string;
  status: "pass" | "fail" | "warning" | "unknown";
  nbcReference?: string;
}

interface DrawingProject {
  id: string;
  name: string;
  imageData: string;
  annotations: Annotation[];
  municipality: Municipality;
  zoneType: string;
  createdAt: Date;
  updatedAt: Date;
}

export function DrawingAnalysis() {
  // State for drawing upload
  const [drawingImage, setDrawingImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // State for canvas interaction
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  
  // State for annotation tools
  const [activeTool, setActiveTool] = useState<"select" | "dimension" | "label" | "area" | "pan">("select");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  
  // State for dimension input
  const [dimensionValue, setDimensionValue] = useState<string>("");
  const [dimensionCategory, setDimensionCategory] = useState<DimensionAnnotation["category"]>("other");
  const [labelText, setLabelText] = useState<string>("");
  
  // State for compliance checking
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string>("edmonton");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>([]);
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  
  // State for scale
  const [scaleValue, setScaleValue] = useState<number>(1); // pixels per meter
  const [isSettingScale, setIsSettingScale] = useState(false);
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [knownDistance, setKnownDistance] = useState<string>("1");
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Get zones for selected municipality
  const municipalityData = municipalities.find(m => m.id === selectedMunicipalityId);
  const availableZones: ZoneRegulation[] = municipalityData?.zones || [];

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setDrawingImage(result);
      setIsLoading(false);
      setAnnotations([]);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.onerror = () => {
      setIsLoading(false);
      alert("Error loading file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !drawingImage) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    if (imageRef.current) {
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      ctx.drawImage(imageRef.current, 0, 0);
      ctx.restore();
    }

    // Draw annotations if visible
    if (showAnnotations) {
      annotations.forEach((annotation) => {
        const isSelected = annotation.id === selectedAnnotation;
        
        if (annotation.type === "dimension") {
          drawDimensionAnnotation(ctx, annotation, isSelected);
        } else if (annotation.type === "label") {
          drawLabelAnnotation(ctx, annotation, isSelected);
        } else if (annotation.type === "area") {
          drawAreaAnnotation(ctx, annotation, isSelected);
        }
      });
    }

    // Draw current drawing in progress
    if (isDrawing && currentPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (activeTool === "dimension" && currentPoints.length === 1) {
        // Draw line from first point to current mouse position
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x * zoom + pan.x, currentPoints[0].y * zoom + pan.y);
        // Will be updated on mouse move
      } else if (activeTool === "area" && currentPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x * zoom + pan.x, currentPoints[0].y * zoom + pan.y);
        currentPoints.forEach((point, i) => {
          if (i > 0) {
            ctx.lineTo(point.x * zoom + pan.x, point.y * zoom + pan.y);
          }
        });
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Draw scale reference line if setting scale
    if (isSettingScale && scalePoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      
      if (scalePoints.length === 2) {
        ctx.beginPath();
        ctx.moveTo(scalePoints[0].x * zoom + pan.x, scalePoints[0].y * zoom + pan.y);
        ctx.lineTo(scalePoints[1].x * zoom + pan.x, scalePoints[1].y * zoom + pan.y);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }, [drawingImage, zoom, pan, annotations, selectedAnnotation, showAnnotations, isDrawing, currentPoints, activeTool, isSettingScale, scalePoints]);

  // Draw dimension annotation
  const drawDimensionAnnotation = (ctx: CanvasRenderingContext2D, annotation: DimensionAnnotation, isSelected: boolean) => {
    const startX = annotation.start.x * zoom + pan.x;
    const startY = annotation.start.y * zoom + pan.y;
    const endX = annotation.end.x * zoom + pan.x;
    const endY = annotation.end.y * zoom + pan.y;

    ctx.save();
    ctx.strokeStyle = isSelected ? "#EF4444" : getCategoryColor(annotation.category);
    ctx.fillStyle = isSelected ? "#EF4444" : getCategoryColor(annotation.category);
    ctx.lineWidth = isSelected ? 3 : 2;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw end caps
    const angle = Math.atan2(endY - startY, endX - startX);
    const capLength = 10;
    
    ctx.beginPath();
    ctx.moveTo(startX - capLength * Math.sin(angle), startY + capLength * Math.cos(angle));
    ctx.lineTo(startX + capLength * Math.sin(angle), startY - capLength * Math.cos(angle));
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(endX - capLength * Math.sin(angle), endY + capLength * Math.cos(angle));
    ctx.lineTo(endX + capLength * Math.sin(angle), endY - capLength * Math.cos(angle));
    ctx.stroke();

    // Draw label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const labelText = `${annotation.value.toFixed(2)}m`;
    
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Background for label
    const textWidth = ctx.measureText(labelText).width;
    ctx.fillStyle = "white";
    ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 20);
    
    ctx.fillStyle = isSelected ? "#EF4444" : getCategoryColor(annotation.category);
    ctx.fillText(labelText, midX, midY);

    ctx.restore();
  };

  // Draw label annotation
  const drawLabelAnnotation = (ctx: CanvasRenderingContext2D, annotation: LabelAnnotation, isSelected: boolean) => {
    const x = annotation.position.x * zoom + pan.x;
    const y = annotation.position.y * zoom + pan.y;

    ctx.save();
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(annotation.text).width;
    
    // Background
    ctx.fillStyle = isSelected ? "#FEE2E2" : "#F3F4F6";
    ctx.strokeStyle = isSelected ? "#EF4444" : "#6B7280";
    ctx.lineWidth = isSelected ? 2 : 1;
    
    const padding = 6;
    ctx.beginPath();
    ctx.roundRect(x - textWidth / 2 - padding, y - 10, textWidth + padding * 2, 20, 4);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = isSelected ? "#EF4444" : "#374151";
    ctx.fillText(annotation.text, x, y);

    ctx.restore();
  };

  // Draw area annotation
  const drawAreaAnnotation = (ctx: CanvasRenderingContext2D, annotation: AreaAnnotation, isSelected: boolean) => {
    if (annotation.points.length < 3) return;

    ctx.save();
    ctx.strokeStyle = isSelected ? "#EF4444" : "#8B5CF6";
    ctx.fillStyle = isSelected ? "rgba(239, 68, 68, 0.2)" : "rgba(139, 92, 246, 0.2)";
    ctx.lineWidth = isSelected ? 3 : 2;

    ctx.beginPath();
    const firstPoint = annotation.points[0];
    ctx.moveTo(firstPoint.x * zoom + pan.x, firstPoint.y * zoom + pan.y);
    
    annotation.points.forEach((point, i) => {
      if (i > 0) {
        ctx.lineTo(point.x * zoom + pan.x, point.y * zoom + pan.y);
      }
    });
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw area label
    const centroid = calculateCentroid(annotation.points);
    const labelText = `${annotation.value.toFixed(1)} m²`;
    
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isSelected ? "#EF4444" : "#8B5CF6";
    ctx.fillText(labelText, centroid.x * zoom + pan.x, centroid.y * zoom + pan.y);

    ctx.restore();
  };

  // Get color for dimension category
  const getCategoryColor = (category: DimensionAnnotation["category"]): string => {
    switch (category) {
      case "setback-front": return "#EF4444"; // Red
      case "setback-rear": return "#F97316"; // Orange
      case "setback-side": return "#EAB308"; // Yellow
      case "building-width": return "#22C55E"; // Green
      case "building-depth": return "#14B8A6"; // Teal
      case "lot-width": return "#3B82F6"; // Blue
      case "lot-depth": return "#6366F1"; // Indigo
      default: return "#6B7280"; // Gray
    }
  };

  // Calculate centroid of polygon
  const calculateCentroid = (points: Point[]): Point => {
    let x = 0, y = 0;
    points.forEach(p => { x += p.x; y += p.y; });
    return { x: x / points.length, y: y / points.length };
  };

  // Calculate polygon area using Shoelace formula
  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    // Convert from pixels to square meters using scale
    return Math.abs(area / 2) / (scaleValue * scaleValue);
  };

  // Calculate distance between two points
  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy) / scaleValue;
  };

  // Handle canvas mouse events
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (activeTool === "pan") {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isSettingScale) {
      if (scalePoints.length === 0) {
        setScalePoints([{ x, y }]);
      } else if (scalePoints.length === 1) {
        const newScalePoints = [...scalePoints, { x, y }];
        setScalePoints(newScalePoints);
        
        // Calculate scale
        const pixelDistance = Math.sqrt(
          Math.pow(newScalePoints[1].x - newScalePoints[0].x, 2) +
          Math.pow(newScalePoints[1].y - newScalePoints[0].y, 2)
        );
        const meterDistance = parseFloat(knownDistance) || 1;
        setScaleValue(pixelDistance / meterDistance);
        setIsSettingScale(false);
        setScalePoints([]);
      }
    } else if (activeTool === "dimension") {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentPoints([{ x, y }]);
      } else {
        // Complete dimension
        const distance = calculateDistance(currentPoints[0], { x, y });
        const newAnnotation: DimensionAnnotation = {
          id: `dim-${Date.now()}`,
          type: "dimension",
          start: currentPoints[0],
          end: { x, y },
          value: distance,
          label: "",
          category: dimensionCategory
        };
        setAnnotations([...annotations, newAnnotation]);
        setIsDrawing(false);
        setCurrentPoints([]);
      }
    } else if (activeTool === "label") {
      if (labelText.trim()) {
        const newAnnotation: LabelAnnotation = {
          id: `label-${Date.now()}`,
          type: "label",
          position: { x, y },
          text: labelText,
          category: "note"
        };
        setAnnotations([...annotations, newAnnotation]);
      }
    } else if (activeTool === "area") {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentPoints([{ x, y }]);
      } else {
        // Check if clicking near first point to close
        const firstPoint = currentPoints[0];
        const distToFirst = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
        
        if (distToFirst < 20 / zoom && currentPoints.length >= 3) {
          // Close the polygon
          const area = calculatePolygonArea(currentPoints);
          const newAnnotation: AreaAnnotation = {
            id: `area-${Date.now()}`,
            type: "area",
            points: currentPoints,
            value: area,
            label: "",
            category: "building-footprint"
          };
          setAnnotations([...annotations, newAnnotation]);
          setIsDrawing(false);
          setCurrentPoints([]);
        } else {
          // Add point
          setCurrentPoints([...currentPoints, { x, y }]);
        }
      }
    } else if (activeTool === "select") {
      // Check if clicking on an annotation
      const clickedAnnotation = findAnnotationAtPoint({ x, y });
      setSelectedAnnotation(clickedAnnotation?.id || null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  // Find annotation at point
  const findAnnotationAtPoint = (point: Point): Annotation | null => {
    for (const annotation of annotations) {
      if (annotation.type === "dimension") {
        const dist = pointToLineDistance(point, annotation.start, annotation.end);
        if (dist < 10 / zoom) return annotation;
      } else if (annotation.type === "label") {
        const dist = Math.sqrt(
          Math.pow(point.x - annotation.position.x, 2) +
          Math.pow(point.y - annotation.position.y, 2)
        );
        if (dist < 30 / zoom) return annotation;
      } else if (annotation.type === "area") {
        if (isPointInPolygon(point, annotation.points)) return annotation;
      }
    }
    return null;
  };

  // Point to line distance
  const pointToLineDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    return Math.sqrt(Math.pow(point.x - xx, 2) + Math.pow(point.y - yy, 2));
  };

  // Point in polygon test
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Delete selected annotation
  const deleteSelectedAnnotation = () => {
    if (selectedAnnotation) {
      setAnnotations(annotations.filter(a => a.id !== selectedAnnotation));
      setSelectedAnnotation(null);
    }
  };

  // Run compliance check
  const runComplianceCheck = () => {
    if (!selectedZone) {
      alert("Please select a zone to check compliance against.");
      return;
    }

    const zone = availableZones.find(z => z.zoneCode === selectedZone);
    if (!zone) return;

    const results: ComplianceResult[] = [];

    // Get dimensions from annotations
    const frontSetback = annotations.find(a => a.type === "dimension" && a.category === "setback-front") as DimensionAnnotation | undefined;
    const rearSetback = annotations.find(a => a.type === "dimension" && a.category === "setback-rear") as DimensionAnnotation | undefined;
    const sideSetback = annotations.find(a => a.type === "dimension" && a.category === "setback-side") as DimensionAnnotation | undefined;
    const lotWidth = annotations.find(a => a.type === "dimension" && a.category === "lot-width") as DimensionAnnotation | undefined;
    const lotDepth = annotations.find(a => a.type === "dimension" && a.category === "lot-depth") as DimensionAnnotation | undefined;
    const buildingFootprint = annotations.find(a => a.type === "area" && a.category === "building-footprint") as AreaAnnotation | undefined;

    // Check front setback
    if (frontSetback) {
      const required = zone.setbacks.front;
      results.push({
        rule: "Front Setback",
        required: `${required}m minimum`,
        actual: `${frontSetback.value.toFixed(2)}m`,
        status: frontSetback.value >= required ? "pass" : "fail",
        nbcReference: `${municipalityData?.name} Bylaw ${zone.zoneCode}`
      });
    } else {
      results.push({
        rule: "Front Setback",
        required: `${zone.setbacks.front}m minimum`,
        actual: "Not measured",
        status: "unknown"
      });
    }

    // Check rear setback
    if (rearSetback) {
      const required = zone.setbacks.rear;
      results.push({
        rule: "Rear Setback",
        required: `${required}m minimum`,
        actual: `${rearSetback.value.toFixed(2)}m`,
        status: rearSetback.value >= required ? "pass" : "fail",
        nbcReference: `${municipalityData?.name} Bylaw ${zone.zoneCode}`
      });
    } else {
      results.push({
        rule: "Rear Setback",
        required: `${zone.setbacks.rear}m minimum`,
        actual: "Not measured",
        status: "unknown"
      });
    }

    // Check side setback
    if (sideSetback) {
      const required = zone.setbacks.sideInterior;
      results.push({
        rule: "Side Setback",
        required: `${required}m minimum`,
        actual: `${sideSetback.value.toFixed(2)}m`,
        status: sideSetback.value >= required ? "pass" : "fail",
        nbcReference: `${municipalityData?.name} Bylaw ${zone.zoneCode}`
      });
    } else {
      results.push({
        rule: "Side Setback",
        required: `${zone.setbacks.sideInterior}m minimum`,
        actual: "Not measured",
        status: "unknown"
      });
    }

    // Check lot width
    if (lotWidth && zone.lotRequirements.minWidth) {
      results.push({
        rule: "Minimum Lot Width",
        required: `${zone.lotRequirements.minWidth}m minimum`,
        actual: `${lotWidth.value.toFixed(2)}m`,
        status: lotWidth.value >= zone.lotRequirements.minWidth ? "pass" : "fail",
        nbcReference: `${municipalityData?.name} Bylaw ${zone.zoneCode}`
      });
    }

    // Check site coverage
    if (buildingFootprint && lotWidth && lotDepth) {
      const lotArea = lotWidth.value * lotDepth.value;
      const coverage = (buildingFootprint.value / lotArea) * 100;
      const maxCoverage = zone.coverage.maxSiteCoverage;
      
      results.push({
        rule: "Site Coverage",
        required: `${maxCoverage}% maximum`,
        actual: `${coverage.toFixed(1)}%`,
        status: coverage <= maxCoverage ? "pass" : "fail",
        nbcReference: `${municipalityData?.name} Bylaw ${zone.zoneCode}`
      });
    }

    setComplianceResults(results);
    setShowCompliancePanel(true);
  };

  // Export compliance report
  const exportComplianceReport = () => {
    const zone = availableZones.find(z => z.zoneCode === selectedZone);
    
    let report = `DRAWING COMPLIANCE REPORT\n`;
    report += `========================\n\n`;
    report += `File: ${fileName}\n`;
    report += `Municipality: ${municipalityData?.name || "N/A"}\n`;
    report += `Zone: ${zone?.zoneName || "N/A"} (${selectedZone})\n`;
    report += `Date: ${new Date().toLocaleDateString()}\n\n`;
    report += `COMPLIANCE RESULTS\n`;
    report += `------------------\n\n`;

    complianceResults.forEach(result => {
      const statusIcon = result.status === "pass" ? "✓" : result.status === "fail" ? "✗" : "?";
      report += `${statusIcon} ${result.rule}\n`;
      report += `  Required: ${result.required}\n`;
      report += `  Actual: ${result.actual}\n`;
      report += `  Status: ${result.status.toUpperCase()}\n`;
      if (result.nbcReference) {
        report += `  Reference: ${result.nbcReference}\n`;
      }
      report += `\n`;
    });

    report += `\nANNOTATIONS SUMMARY\n`;
    report += `-------------------\n\n`;
    
    annotations.forEach(annotation => {
      if (annotation.type === "dimension") {
        report += `Dimension (${annotation.category}): ${annotation.value.toFixed(2)}m\n`;
      } else if (annotation.type === "area") {
        report += `Area (${annotation.category}): ${annotation.value.toFixed(2)} m²\n`;
      } else if (annotation.type === "label") {
        report += `Label: ${annotation.text}\n`;
      }
    });

    report += `\n\nDISCLAIMER\n`;
    report += `----------\n`;
    report += `This report is generated based on manual annotations and should be verified by a qualified professional.\n`;
    report += `Always consult the official municipal bylaws and building codes for authoritative requirements.\n`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${fileName.replace(/\.[^/.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load image when drawing changes
  useEffect(() => {
    if (drawingImage) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        
        // Set canvas size
        const canvas = canvasRef.current;
        if (canvas && containerRef.current) {
          canvas.width = containerRef.current.clientWidth;
          canvas.height = containerRef.current.clientHeight;
          
          // Calculate initial zoom to fit image
          const scaleX = canvas.width / img.width;
          const scaleY = canvas.height / img.height;
          const initialZoom = Math.min(scaleX, scaleY, 1) * 0.9;
          setZoom(initialZoom);
          
          // Center image
          setPan({
            x: (canvas.width - img.width * initialZoom) / 2,
            y: (canvas.height - img.height * initialZoom) / 2
          });
        }
        
        drawCanvas();
      };
      img.src = drawingImage;
    }
  }, [drawingImage]);

  // Redraw canvas when state changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
        drawCanvas();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Drawing Analysis Tool
          </CardTitle>
          <CardDescription>
            Upload architectural drawings, add annotations, and check compliance against municipal bylaws
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!drawingImage ? (
            // Upload area
            <div 
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Drawing</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to upload PDF or image files
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, PNG, JPG, JPEG
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            // Drawing workspace
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Button
                    variant={activeTool === "select" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTool("select")}
                    title="Select"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === "pan" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTool("pan")}
                    title="Pan"
                  >
                    <Move className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Button
                    variant={activeTool === "dimension" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTool("dimension")}
                    title="Add Dimension"
                  >
                    <Ruler className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === "area" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTool("area")}
                    title="Draw Area"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === "label" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTool("label")}
                    title="Add Label"
                  >
                    <Type className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(zoom * 1.2, 5))}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.max(zoom / 1.2, 0.1))}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Button
                    variant={showAnnotations ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    title={showAnnotations ? "Hide Annotations" : "Show Annotations"}
                  >
                    {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteSelectedAnnotation}
                    disabled={!selectedAnnotation}
                    title="Delete Selected"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant={isSettingScale ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsSettingScale(!isSettingScale);
                      setScalePoints([]);
                    }}
                  >
                    Set Scale
                  </Button>
                  {isSettingScale && (
                    <Input
                      type="number"
                      value={knownDistance}
                      onChange={(e) => setKnownDistance(e.target.value)}
                      className="w-20 h-8"
                      placeholder="meters"
                    />
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDrawingImage(null);
                      setAnnotations([]);
                      setFileName("");
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    New
                  </Button>
                </div>
              </div>

              {/* Tool options */}
              {activeTool === "dimension" && (
                <div className="flex items-center gap-4 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Label className="text-sm">Dimension Type:</Label>
                  <Select value={dimensionCategory} onValueChange={(v) => setDimensionCategory(v as DimensionAnnotation["category"])}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="setback-front">Front Setback</SelectItem>
                      <SelectItem value="setback-rear">Rear Setback</SelectItem>
                      <SelectItem value="setback-side">Side Setback</SelectItem>
                      <SelectItem value="building-width">Building Width</SelectItem>
                      <SelectItem value="building-depth">Building Depth</SelectItem>
                      <SelectItem value="lot-width">Lot Width</SelectItem>
                      <SelectItem value="lot-depth">Lot Depth</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Click two points to measure distance</p>
                </div>
              )}

              {activeTool === "label" && (
                <div className="flex items-center gap-4 p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Label className="text-sm">Label Text:</Label>
                  <Input
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    placeholder="Enter label text"
                    className="w-48"
                  />
                  <p className="text-xs text-muted-foreground">Click on drawing to place label</p>
                </div>
              )}

              {activeTool === "area" && (
                <div className="flex items-center gap-4 p-2 bg-violet-50 dark:bg-violet-950 rounded-lg">
                  <p className="text-sm">Click to add points, click near first point to close polygon</p>
                  {isDrawing && (
                    <Badge variant="secondary">{currentPoints.length} points</Badge>
                  )}
                </div>
              )}

              {isSettingScale && (
                <div className="flex items-center gap-4 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm">
                    {scalePoints.length === 0 
                      ? "Click the first point of a known distance" 
                      : "Click the second point to set scale"}
                  </p>
                  <Badge variant="secondary">Known distance: {knownDistance}m</Badge>
                </div>
              )}

              {/* Canvas and side panel */}
              <div className="flex gap-4">
                {/* Canvas */}
                <div 
                  ref={containerRef}
                  className="flex-1 border border-border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900"
                  style={{ height: "500px" }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                </div>

                {/* Side panel */}
                <div className="w-80 space-y-4">
                  {/* Municipality/Zone selection */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Compliance Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Municipality</Label>
                        <Select value={selectedMunicipalityId} onValueChange={(v) => {
                          setSelectedMunicipalityId(v);
                          setSelectedZone("");
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="edmonton">Edmonton</SelectItem>
                            <SelectItem value="calgary">Calgary</SelectItem>
                            <SelectItem value="airdrie">Airdrie</SelectItem>
                            <SelectItem value="lethbridge">Lethbridge</SelectItem>
                            <SelectItem value="vancouver">Vancouver</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Zone</Label>
                        <Select value={selectedZone} onValueChange={setSelectedZone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableZones.map(zone => (
                              <SelectItem key={zone.zoneCode} value={zone.zoneCode}>
                                {zone.zoneCode} - {zone.zoneName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={runComplianceCheck}
                        disabled={!selectedZone || annotations.length === 0}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Check Compliance
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Annotations list */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Annotations ({annotations.length})</span>
                        <Layers className="w-4 h-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        {annotations.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            No annotations yet. Use the tools above to add measurements.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {annotations.map(annotation => (
                              <div
                                key={annotation.id}
                                className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                                  selectedAnnotation === annotation.id 
                                    ? "bg-primary/10 border border-primary" 
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                                onClick={() => setSelectedAnnotation(annotation.id)}
                              >
                                {annotation.type === "dimension" && (
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      <Ruler className="w-3 h-3" />
                                      {annotation.category.replace("-", " ")}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {annotation.value.toFixed(2)}m
                                    </Badge>
                                  </div>
                                )}
                                {annotation.type === "area" && (
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      <Square className="w-3 h-3" />
                                      {annotation.category.replace("-", " ")}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {annotation.value.toFixed(1)} m²
                                    </Badge>
                                  </div>
                                )}
                                {annotation.type === "label" && (
                                  <div className="flex items-center gap-1">
                                    <Type className="w-3 h-3" />
                                    {annotation.text}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Compliance results */}
                  {showCompliancePanel && complianceResults.length > 0 && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Compliance Results</span>
                          <Button variant="ghost" size="sm" onClick={exportComplianceReport}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {complianceResults.map((result, i) => (
                              <div key={i} className="p-2 rounded bg-muted text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{result.rule}</span>
                                  {result.status === "pass" && (
                                    <Badge className="bg-green-500 text-[10px]">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Pass
                                    </Badge>
                                  )}
                                  {result.status === "fail" && (
                                    <Badge className="bg-red-500 text-[10px]">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Fail
                                    </Badge>
                                  )}
                                  {result.status === "warning" && (
                                    <Badge className="bg-yellow-500 text-[10px]">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Warning
                                    </Badge>
                                  )}
                                  {result.status === "unknown" && (
                                    <Badge variant="outline" className="text-[10px]">
                                      Unknown
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  Required: {result.required}
                                </div>
                                <div className="text-muted-foreground">
                                  Actual: {result.actual}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DrawingAnalysis;
