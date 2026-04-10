import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
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
  RotateCw,
  Save,
  Layers,
  Eye,
  EyeOff,
  Pencil,
  Camera,
  Sparkles,
  Loader2,
  PenTool,
  Minus,
  RectangleHorizontal,
  Pentagon,
  Eraser,
  Undo2,
  Redo2,
  Palette,
  PaintBucket,
  Lock,
  Unlock,
  Circle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DisclaimerGate } from "@/components/DisclaimerGate";
import { ProfessionalReviewPanel } from "@/components/ProfessionalReviewPanel";
import { AnalysisStatusBanner } from "@/components/AnalysisStatusBanner";
import { useAuth } from "@/_core/hooks/useAuth";
import { municipalities, Municipality, ZoneRegulation } from "@/lib/municipalBylawsData";
import { 
  ScaleSystem, 
  ArchitecturalScale, 
  getScalesBySystem, 
  getScaleById,
  imperialScales,
  metricScales,
  calculateRealDistance,
  formatDistance 
} from "@/lib/architecturalScales";

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

// Types for freehand drawing
interface DrawingStroke {
  id: string;
  type: "freehand" | "line" | "rectangle" | "polygon" | "circle";
  points: Point[];
  color: string;
  width: number;
}

type DrawingTool = "pen" | "line" | "rectangle" | "polygon" | "circle" | "eraser";

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

interface DrawingAnalysisProps {
  projectId?: number;
}

export function DrawingAnalysis({ projectId }: DrawingAnalysisProps) {
  // State for drawing upload
  const [drawingImage, setDrawingImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Multi-page PDF state
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [currentPreviewPage, setCurrentPreviewPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [analyzeProgress, setAnalyzeProgress] = useState<string>("");
  
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
  
  // State for scale calibration
  const [scaleSystem, setScaleSystem] = useState<ScaleSystem>("imperial");
  const [selectedScale, setSelectedScale] = useState<ArchitecturalScale>(imperialScales[3]); // Default 1/8" = 1'-0"
  const [pixelsPerDrawingUnit, setPixelsPerDrawingUnit] = useState<number>(0); // Calibrated from reference measurement
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationLine, setCalibrationLine] = useState<{ start: Point; end: Point } | null>(null);
  const [referenceValue, setReferenceValue] = useState<string>(""); // User-editable reference measurement
  const [isEditingReference, setIsEditingReference] = useState(false);
  const [isDraggingDimension, setIsDraggingDimension] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dragCurrentPoint, setDragCurrentPoint] = useState<Point | null>(null);
  
  // State for AI analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<{
    drawingType: string;
    scale: string | null;
    detectedUnit?: string;
    measurements: Array<{
      id: string;
      category: string;
      value: number;
      label: string;
      confidence: string;
      location: string;
      complianceStatus?: string;
      nbcReference?: string | null;
    }>;
    rooms: Array<{
      id: string;
      name: string;
      area: number;
      location: string;
      occupantLoad?: number;
      occupantLoadFactor?: string;
    }>;
    complianceIssues?: Array<{
      id: string;
      severity: string;
      category: string;
      description: string;
      nbcReference?: string;
      recommendation?: string;
    }>;
    safetyFeatures?: Array<{
      type: string;
      location: string;
      compliant: boolean;
    }>;
    notes: string[];
  } | null>(null);
  const [showAiResults, setShowAiResults] = useState(false);
  
  // State to track when image is loaded and ready to draw
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Mobile detection - disable drawing features on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1024; // Consider tablets as mobile for drawing
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()) || (isTouchDevice && isSmallScreen));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // State for unit of measurement
  const [measurementUnit, setMeasurementUnit] = useState<"mm" | "inches" | "feet">("feet");
  
  // State for image rotation (in degrees)
  const [imageRotation, setImageRotation] = useState<number>(0);
  
  // State for mobile canvas lock (prevents page scrolling when drawing)
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  
  // State for freehand drawing mode
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("pen");
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [strokeColor, setStrokeColor] = useState<string>("#1E3A8A"); // Blueprint blue
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [showDrawingLayer, setShowDrawingLayer] = useState(true);
  const [drawingHistory, setDrawingHistory] = useState<DrawingStroke[][]>([[]]); // For undo/redo
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isDrawingStroke, setIsDrawingStroke] = useState(false);
  const [drawingStartPoint, setDrawingStartPoint] = useState<Point | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserSize, setEraserSize] = useState(20); // Eraser radius in pixels
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastTouchPointRef = useRef<Point | null>(null); // For immediate drawing on mobile
  const currentStrokeRef = useRef<DrawingStroke | null>(null); // Ref for current stroke to avoid re-renders during drawing
  const isDrawingRef = useRef(false); // Track drawing state without re-renders
  const isMultiPageAnalysisRef = useRef(false); // Prevent premature setIsAnalyzing(false) during multi-page analysis
  
  // Auth state (PD2.0 §6.1 — authentication required)
  const { isAuthenticated } = useAuth();

  // PD2.0 §6.3 — disclaimer state
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [disclaimerVersion, setDisclaimerVersion] = useState("");

  // PD2.0 §4.3 — analysis status tracking
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<"DRAFT" | "UNDER_REVIEW" | "VALID" | "REJECTED" | null>(null);
  const [ruleEvaluations, setRuleEvaluations] = useState<Array<{
    ruleId: string;
    clause: string;
    description: string;
    category: string;
    severity: string;
    result: string;
    details: string;
  }>>([]);
  const [pdIssues, setPdIssues] = useState<Array<{ severity: string; category: string; description: string; clause: string; recommendation: string }>>([]);
  const [pdRecommendations, setPdRecommendations] = useState<string[]>([]);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [complianceLevel, setComplianceLevel] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(projectId || 0);
  const [analysisType, setAnalysisType] = useState<"structural" | "fire-safety" | "connections" | "comprehensive">("comprehensive");
  
  // Drawing Analysis Persistence (Phase 2)
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [drawingAnalysisHistory, setDrawingAnalysisHistory] = useState<any[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  
  // tRPC mutations for persistence
  const saveDrawingAnalysisMutation = trpc.saveDrawingAnalysis.useMutation();
  const getDrawingAnalysesQuery = trpc.getDrawingAnalyses.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const exportToComplianceMutation = trpc.exportFindingsToCompliance.useMutation();

  // New PD2.0-compliant mutation
  // tRPC utils for query invalidation (Phase 2)
  const utils = trpc.useUtils();

  const pdAnalyzeMutation = trpc.drawingAnalysis.analyze.useMutation({
    onSuccess: async (data) => {
      setAnalysisId(data.analysisId);
      setAnalysisStatus(data.analysisStatus);
      setRuleEvaluations(data.ruleEvaluations as any);
      setPdIssues(data.issues as any);
      setPdRecommendations(data.recommendations);
      setComplianceScore(data.complianceScore);
      setComplianceLevel(data.complianceLevel);
      setAiResults({
        drawingType: data.extractedData.drawingType,
        scale: null,
        measurements: [],
        rooms: [],
        notes: data.recommendations,
      });
      setShowAiResults(true);
      if (!isMultiPageAnalysisRef.current) {
        setIsAnalyzing(false);
      }

      // Auto-save if projectId provided (Phase 2)
      if (!isMultiPageAnalysisRef.current && projectId && drawingImage && fileName) {
        try {
          const infractions = data.issues.map((issue: any, idx: number) => ({
            id: issue.id || `infraction-${idx}`,
            severity: (issue.severity === "critical" ? "critical" : issue.severity === "warning" ? "warning" : "info") as "critical" | "warning" | "info",
            code: issue.clause || issue.category || "NBC",
            title: issue.category || issue.description.slice(0, 50),
            description: issue.description,
            location: issue.location || "See drawing",
            recommendation: issue.recommendation || "",
            x: issue.x || 50,
            y: issue.y || 50,
          }));
          
          const result = await saveDrawingAnalysisMutation.mutateAsync({
            projectId,
            fileName,
            imageUrl: drawingImage,
            occupancyType: "Residential",
            infractions,
            drawingType: data.extractedData.drawingType,
            scale: null,
          });
          
          setSavedAnalysisId(result.id);
        } catch (error) {
          console.error("Failed to auto-save analysis:", error);
        }
      }
    },
    onError: (error) => {
      console.error("PD2.0 analysis error:", error);
      toast.error("Analysis failed: " + error.message);
      if (!isMultiPageAnalysisRef.current) {
        setIsAnalyzing(false);
      }
    },
  });

  // Legacy mutation (kept for backward compat, now unused)
  const analyzeDrawingMutation = trpc.analyzeDrawing.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setAiResults({
          drawingType: data.drawingType || "unknown",
          scale: data.scale || null,
          measurements: data.measurements || [],
          rooms: data.rooms || [],
          notes: data.notes || [],
        });
        setShowAiResults(true);
      } else {
        toast.error(data.error || "Failed to analyze drawing");
      }
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error("AI analysis error:", error);
      toast.error("Failed to analyze drawing. Please try again.");
      setIsAnalyzing(false);
    },
  });

  // Handle export to compliance (Phase 2)
  const handleExportToCompliance = async () => {
    if (!projectId || !savedAnalysisId) {
      toast.error("Please complete an analysis first");
      return;
    }
    
    try {
      const result = await exportToComplianceMutation.mutateAsync({
        projectId,
        drawingAnalysisId: savedAnalysisId,
        rulesetId: "nbc_2023_v1",
      });
      
      // Show success notification
      toast.success(`Findings exported to compliance report. Status: ${result.complianceStatus}`);
      
      // Invalidate queries to refresh ProjectTabView
      await utils.compliance.getProjectSnapshots.invalidate({ projectId });
      await utils.projects.get.invalidate({ id: projectId });
    } catch (error) {
      console.error("Failed to export findings:", error);
      toast.error("Failed to export findings. Please try again.");
    }
  };
  
  // Update history when query data changes (Phase 2)
  useEffect(() => {
    if (getDrawingAnalysesQuery.data) {
      setDrawingAnalysisHistory(getDrawingAnalysesQuery.data);
    }
  }, [getDrawingAnalysesQuery.data]);

  // Get zones for selected municipality
  const municipalityData = municipalities.find(m => m.id === selectedMunicipalityId);
  const availableZones: ZoneRegulation[] = municipalityData?.zones || [];

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    // Reset PDF state on new upload
    setPdfPages([]);
    setSelectedPages([]);
    setTotalPages(0);
    setCurrentPreviewPage(1);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = Math.min(pdf.numPages, 20);
        setTotalPages(pdf.numPages);

        const pages: string[] = [];
        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          pages.push(canvas.toDataURL('image/png'));
        }

        setPdfPages(pages);
        setSelectedPages([1]);
        setDrawingImage(pages[0]);
        setCurrentPreviewPage(1);
      } else {
        // Existing image handling
        const reader = new FileReader();
        reader.onload = (e) => {
          setDrawingImage(e.target?.result as string);
        };
        reader.onerror = () => {
          toast.error("Error loading file. Please try again.");
        };
        reader.readAsDataURL(file);
      }
      // Reset shared state
      setAnnotations([]);
      setAiResults(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } catch (error) {
      console.error('[Drawing] File upload error:', error);
      toast.error('Failed to load file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle camera capture
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(`Camera_${new Date().toISOString().slice(0, 10)}.jpg`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setDrawingImage(result);
      setIsLoading(false);
      setAnnotations([]);
      setAiResults(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.onerror = () => {
      setIsLoading(false);
      toast.error("Error capturing photo. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Compose the image to analyze (merges drawing strokes onto the base image)
  const buildImageToAnalyze = (baseImage: string): string => {
    if (drawingStrokes.length === 0) return baseImage;
    const canvas = canvasRef.current;
    if (!canvas) return baseImage;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx || !imageRef.current) return baseImage;
    tempCtx.drawImage(imageRef.current, 0, 0, imageRef.current.width, imageRef.current.height);
    drawingStrokes.forEach((stroke) => {
      tempCtx.strokeStyle = stroke.color;
      tempCtx.lineWidth = stroke.width;
      tempCtx.lineCap = "round";
      tempCtx.lineJoin = "round";
      if (stroke.type === "freehand" && stroke.points.length >= 2) {
        tempCtx.beginPath();
        tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          tempCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        tempCtx.stroke();
      } else if (stroke.type === "line" && stroke.points.length >= 2) {
        tempCtx.beginPath();
        tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        tempCtx.lineTo(stroke.points[1].x, stroke.points[1].y);
        tempCtx.stroke();
      } else if (stroke.type === "rectangle" && stroke.points.length >= 2) {
        const rectX = Math.min(stroke.points[0].x, stroke.points[1].x);
        const rectY = Math.min(stroke.points[0].y, stroke.points[1].y);
        const rectW = Math.abs(stroke.points[1].x - stroke.points[0].x);
        const rectH = Math.abs(stroke.points[1].y - stroke.points[0].y);
        tempCtx.strokeRect(rectX, rectY, rectW, rectH);
      } else if (stroke.type === "polygon" && stroke.points.length >= 2) {
        tempCtx.beginPath();
        tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          tempCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        if (stroke.points.length > 2) tempCtx.closePath();
        tempCtx.stroke();
      }
    });
    return tempCanvas.toDataURL('image/png');
  };

  // Run AI analysis on the drawing (PD2.0 §4.1 — two-stage pipeline)
  const runAiAnalysis = async () => {
    if (!drawingImage) return;
    if (!disclaimerAcknowledged) {
      toast.error("You must acknowledge the disclaimer before running analysis.");
      return;
    }

    setIsAnalyzing(true);

    // Multi-page PDF path
    if (pdfPages.length > 0 && selectedPages.length > 0) {
      isMultiPageAnalysisRef.current = true;
      const allNotes: string[] = [];
      let lastData: any = null;

      for (let i = 0; i < selectedPages.length; i++) {
        const pageNum = selectedPages[i];
        setAnalyzeProgress(`Analyzing page ${pageNum} of ${selectedPages.length}...`);
        const pageImg = pdfPages[pageNum - 1];
        const base64Data = pageImg.replace(/^data:[^;]+;base64,/, "");
        try {
          const data = await pdAnalyzeMutation.mutateAsync({
            projectId: selectedProjectId > 0 ? selectedProjectId : 1,
            imageBase64: base64Data,
            mimeType: "image/png",
            fileName: `${fileName || "drawing"}_page${pageNum}.png`,
            analysisType,
            disclaimerAcknowledged: true,
            disclaimerVersion,
          });
          allNotes.push(`--- Page ${pageNum} ---`);
          allNotes.push(...((data.recommendations as unknown as string[]) || []));
          lastData = data;
        } catch (error) {
          toast.error(`Failed to analyze page ${pageNum}`);
        }
      }

      isMultiPageAnalysisRef.current = false;

      if (lastData) {
        setAnalysisId(lastData.analysisId);
        setAnalysisStatus(lastData.analysisStatus);
        setRuleEvaluations(lastData.ruleEvaluations as any);
        setPdIssues(lastData.issues as any);
        setPdRecommendations(allNotes);
        setComplianceScore(lastData.complianceScore);
        setComplianceLevel(lastData.complianceLevel);
        setAiResults({
          drawingType: lastData.extractedData.drawingType,
          scale: null,
          measurements: [],
          rooms: [],
          notes: allNotes,
        });
        setShowAiResults(true);
      }

      setAnalyzeProgress("");
      setIsAnalyzing(false);
      return;
    }

    // Single image path (PD2.0 §4.1 — two-stage pipeline)
    const imageToAnalyze = buildImageToAnalyze(drawingImage);
    const base64Data = imageToAnalyze.replace(/^data:[^;]+;base64,/, "");
    const mimeMatch = imageToAnalyze.match(/^data:([^;]+);/);
    const mimeType = (mimeMatch?.[1] ?? "image/png") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    pdAnalyzeMutation.mutate({
      projectId: selectedProjectId > 0 ? selectedProjectId : 1,
      imageBase64: base64Data,
      mimeType,
      fileName: fileName || "drawing.png",
      analysisType,
      disclaimerAcknowledged: true,
      disclaimerVersion,
    });
  };

  // Apply AI results to annotations
  const applyAiResults = () => {
    if (!aiResults) return;
    
    const newAnnotations: Annotation[] = [];
    
    // Convert measurements to dimension annotations
    aiResults.measurements.forEach((m, index) => {
      const category = m.category as DimensionAnnotation["category"];
      if (["lot-width", "lot-depth", "building-width", "building-depth", "setback-front", "setback-rear", "setback-side", "other"].includes(category)) {
        newAnnotations.push({
          id: `ai-dim-${index}`,
          type: "dimension",
          start: { x: 50 + index * 30, y: 50 },
          end: { x: 150 + index * 30, y: 50 },
          value: m.value,
          label: m.label,
          category: category as DimensionAnnotation["category"],
        });
      }
    });
    
    // Convert rooms to label annotations
    aiResults.rooms.forEach((r, index) => {
      newAnnotations.push({
        id: `ai-room-${index}`,
        type: "label",
        position: { x: 100 + index * 50, y: 100 + index * 30 },
        text: `${r.name} (${r.area}m²)`,
        category: "room",
      });
    });
    
    setAnnotations(prev => [...prev, ...newAnnotations]);
    setShowAiResults(false);
  };

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    // Skip if no drawing image set yet
    if (!drawingImage) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image only when loaded and ref is available
    if (imageLoaded && imageRef.current) {
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      
      // Apply rotation around image center
      if (imageRotation !== 0) {
        const imgWidth = imageRef.current.width;
        const imgHeight = imageRef.current.height;
        ctx.translate(imgWidth / 2, imgHeight / 2);
        ctx.rotate((imageRotation * Math.PI) / 180);
        ctx.translate(-imgWidth / 2, -imgHeight / 2);
      }
      
      ctx.drawImage(imageRef.current, 0, 0);
      ctx.restore();
    }

    // Draw freehand drawing strokes if visible (always draw, even while image is loading)
    if (showDrawingLayer && drawingStrokes.length > 0) {
      drawingStrokes.forEach((stroke) => {
        drawStroke(ctx, stroke);
      });
    }

    // Draw current stroke being drawn (always draw for live preview)
    if (currentStroke && currentStroke.points.length > 0) {
      drawStroke(ctx, currentStroke);
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

    // Draw calibration reference line
    if (calibrationLine) {
      ctx.save();
      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(calibrationLine.start.x * zoom + pan.x, calibrationLine.start.y * zoom + pan.y);
      ctx.lineTo(calibrationLine.end.x * zoom + pan.x, calibrationLine.end.y * zoom + pan.y);
      ctx.stroke();
      
      // Draw endpoints
      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(calibrationLine.start.x * zoom + pan.x, calibrationLine.start.y * zoom + pan.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(calibrationLine.end.x * zoom + pan.x, calibrationLine.end.y * zoom + pan.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw drag preview line (for calibration or dimension)
    if (isDraggingDimension && dragStartPoint && dragCurrentPoint) {
      ctx.save();
      ctx.strokeStyle = isCalibrating ? "#10B981" : "#3B82F6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(dragStartPoint.x * zoom + pan.x, dragStartPoint.y * zoom + pan.y);
      ctx.lineTo(dragCurrentPoint.x * zoom + pan.x, dragCurrentPoint.y * zoom + pan.y);
      ctx.stroke();
      
      // Draw endpoints
      ctx.fillStyle = isCalibrating ? "#10B981" : "#3B82F6";
      ctx.beginPath();
      ctx.arc(dragStartPoint.x * zoom + pan.x, dragStartPoint.y * zoom + pan.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dragCurrentPoint.x * zoom + pan.x, dragCurrentPoint.y * zoom + pan.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Show live distance preview
      const pixelDist = Math.sqrt(
        Math.pow(dragCurrentPoint.x - dragStartPoint.x, 2) +
        Math.pow(dragCurrentPoint.y - dragStartPoint.y, 2)
      );
      if (pixelDist > 20 && pixelsPerDrawingUnit > 0) {
        const result = calculateRealDistance(pixelDist, pixelsPerDrawingUnit, selectedScale, scaleSystem);
        const midX = (dragStartPoint.x + dragCurrentPoint.x) / 2 * zoom + pan.x;
        const midY = (dragStartPoint.y + dragCurrentPoint.y) / 2 * zoom + pan.y;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.fillRect(midX - 40, midY - 20, 80, 24);
        ctx.fillStyle = isCalibrating ? "#10B981" : "#3B82F6";
        ctx.fillText(formatDistance(result.value, result.unit), midX, midY - 4);
      }
      ctx.restore();
    }
  }, [drawingImage, imageLoaded, zoom, pan, annotations, selectedAnnotation, showAnnotations, isDrawing, currentPoints, activeTool, isCalibrating, calibrationLine, isDraggingDimension, dragStartPoint, dragCurrentPoint, pixelsPerDrawingUnit, selectedScale, scaleSystem, imageRotation, measurementUnit, showDrawingLayer, drawingStrokes, currentStroke]);

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
    const displayValue = convertToDisplayUnit(annotation.value);
    const labelText = `${displayValue.toFixed(2)} ${getUnitLabel()}`;
    
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
    const displayArea = convertAreaToDisplayUnit(annotation.value);
    const areaLabelText = `${displayArea.toFixed(1)} ${getAreaUnitLabel()}`;
    
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isSelected ? "#EF4444" : "#8B5CF6";
    ctx.fillText(areaLabelText, centroid.x * zoom + pan.x, centroid.y * zoom + pan.y);

    ctx.restore();
  };

  // Draw a single stroke (freehand, line, rectangle, or polygon)
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length === 0) return;

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (stroke.type) {
      case "freehand":
        if (stroke.points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * zoom + pan.x, stroke.points[0].y * zoom + pan.y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * zoom + pan.x, stroke.points[i].y * zoom + pan.y);
        }
        ctx.stroke();
        break;

      case "line":
        if (stroke.points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * zoom + pan.x, stroke.points[0].y * zoom + pan.y);
        ctx.lineTo(stroke.points[1].x * zoom + pan.x, stroke.points[1].y * zoom + pan.y);
        ctx.stroke();
        break;

      case "rectangle":
        if (stroke.points.length < 2) break;
        const rectX = Math.min(stroke.points[0].x, stroke.points[1].x) * zoom + pan.x;
        const rectY = Math.min(stroke.points[0].y, stroke.points[1].y) * zoom + pan.y;
        const rectW = Math.abs(stroke.points[1].x - stroke.points[0].x) * zoom;
        const rectH = Math.abs(stroke.points[1].y - stroke.points[0].y) * zoom;
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        break;

      case "polygon":
        if (stroke.points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * zoom + pan.x, stroke.points[0].y * zoom + pan.y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * zoom + pan.x, stroke.points[i].y * zoom + pan.y);
        }
        if (stroke.points.length > 2) {
          ctx.closePath();
        }
        ctx.stroke();
        break;

      case "circle":
        if (stroke.points.length < 2) break;
        const centerX = stroke.points[0].x * zoom + pan.x;
        const centerY = stroke.points[0].y * zoom + pan.y;
        const radiusX = Math.abs(stroke.points[1].x - stroke.points[0].x) * zoom;
        const radiusY = Math.abs(stroke.points[1].y - stroke.points[0].y) * zoom;
        const radius = Math.sqrt(radiusX * radiusX + radiusY * radiusY);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
    }

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
    
    // Convert from pixels to square meters using calibration
    const pixelArea = Math.abs(area / 2);
    if (pixelsPerDrawingUnit > 0) {
      // Calculate area using calibrated scale
      const drawingUnitsPerPixel = 1 / pixelsPerDrawingUnit;
      const drawingArea = pixelArea * drawingUnitsPerPixel * drawingUnitsPerPixel;
      // Convert to real-world area based on scale
      const realArea = drawingArea * selectedScale.ratio * selectedScale.ratio;
      // Convert to square meters
      if (scaleSystem === "imperial") {
        // Real area is in square inches, convert to square meters
        return realArea * 0.00064516;
      } else {
        // Real area is in square mm, convert to square meters
        return realArea / 1000000;
      }
    }
    // Fallback: assume 100 pixels per meter
    return pixelArea / 10000;
  };

  // Calculate distance between two points (returns meters)
  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (pixelsPerDrawingUnit > 0) {
      // Use calibrated scale
      const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, selectedScale, scaleSystem);
      // Convert to meters for internal storage
      if (scaleSystem === "imperial") {
        return result.unit === "ft" ? result.value * 0.3048 : result.value * 0.0254;
      } else {
        return result.unit === "m" ? result.value : result.unit === "cm" ? result.value / 100 : result.value / 1000;
      }
    }
    // Fallback: assume 100 pixels per meter
    return pixelDistance / 100;
  };

  // Convert meters to display unit
  const convertToDisplayUnit = (meters: number): number => {
    switch (measurementUnit) {
      case "mm":
        return meters * 1000;
      case "inches":
        return meters * 39.3701;
      case "feet":
        return meters * 3.28084;
      default:
        return meters;
    }
  };

  // Convert display unit to meters
  const convertToMeters = (value: number): number => {
    switch (measurementUnit) {
      case "mm":
        return value / 1000;
      case "inches":
        return value / 39.3701;
      case "feet":
        return value / 3.28084;
      default:
        return value;
    }
  };

  // Get unit label for display
  const getUnitLabel = (): string => {
    switch (measurementUnit) {
      case "mm":
        return "mm";
      case "inches":
        return "in";
      case "feet":
        return "ft";
      default:
        return "m";
    }
  };

  // Get area unit label for display
  const getAreaUnitLabel = (): string => {
    switch (measurementUnit) {
      case "mm":
        return "mm²";
      case "inches":
        return "in²";
      case "feet":
        return "ft²";
      default:
        return "m²";
    }
  };

  // Convert square meters to display area unit
  const convertAreaToDisplayUnit = (sqMeters: number): number => {
    switch (measurementUnit) {
      case "mm":
        return sqMeters * 1000000;
      case "inches":
        return sqMeters * 1550.0031;
      case "feet":
        return sqMeters * 10.7639;
      default:
        return sqMeters;
    }
  };

  // Find stroke at a given point (for eraser)
  const findStrokeAtPoint = (point: Point): DrawingStroke | null => {
    const threshold = 10 / zoom; // 10 pixels tolerance
    
    for (let i = drawingStrokes.length - 1; i >= 0; i--) {
      const stroke = drawingStrokes[i];
      
      if (stroke.type === "freehand" || stroke.type === "line" || stroke.type === "polygon") {
        // Check if point is near any segment of the stroke
        for (let j = 0; j < stroke.points.length - 1; j++) {
          const p1 = stroke.points[j];
          const p2 = stroke.points[j + 1];
          const dist = pointToLineDistance(point, p1, p2);
          if (dist < threshold) return stroke;
        }
      } else if (stroke.type === "rectangle" && stroke.points.length >= 2) {
        // Check if point is near rectangle edges
        const [p1, p2] = stroke.points;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        
        // Check all four edges
        const edges = [
          [{ x: minX, y: minY }, { x: maxX, y: minY }],
          [{ x: maxX, y: minY }, { x: maxX, y: maxY }],
          [{ x: maxX, y: maxY }, { x: minX, y: maxY }],
          [{ x: minX, y: maxY }, { x: minX, y: minY }],
        ];
        
        for (const [ep1, ep2] of edges) {
          const dist = pointToLineDistance(point, ep1, ep2);
          if (dist < threshold) return stroke;
        }
      }
    }
    return null;
  };

  // Calculate distance from point to line segment
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

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Partial eraser function - erases parts of strokes within eraser radius
  const eraseAtPoint = (point: Point) => {
    const eraserRadius = eraserSize / zoom;
    let strokesModified = false;
    let newStrokes: DrawingStroke[] = [];
    
    for (const stroke of drawingStrokes) {
      if (stroke.type === "freehand") {
        // For freehand strokes, split at eraser points
        const segments: Point[][] = [];
        let currentSegment: Point[] = [];
        
        for (let i = 0; i < stroke.points.length; i++) {
          const p = stroke.points[i];
          const dist = Math.sqrt(
            Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
          );
          
          if (dist > eraserRadius) {
            currentSegment.push(p);
          } else {
            // Point is within eraser radius, end current segment
            if (currentSegment.length >= 2) {
              segments.push(currentSegment);
            }
            currentSegment = [];
            strokesModified = true;
          }
        }
        
        // Add last segment if it has enough points
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        
        // Create new strokes from remaining segments
        for (const segment of segments) {
          newStrokes.push({
            ...stroke,
            id: `${stroke.id}-${Date.now()}-${Math.random()}`,
            points: segment,
          });
        }
      } else if (stroke.type === "line" && stroke.points.length >= 2) {
        // For lines, check if eraser is near the line
        const dist = pointToLineDistance(point, stroke.points[0], stroke.points[1]);
        if (dist > eraserRadius) {
          newStrokes.push(stroke);
        } else {
          strokesModified = true;
        }
      } else if (stroke.type === "rectangle" && stroke.points.length >= 2) {
        // For rectangles, check if eraser is near any edge
        const [p1, p2] = stroke.points;
        const minX = Math.min(p1.x, p2.x);
        const maxX = Math.max(p1.x, p2.x);
        const minY = Math.min(p1.y, p2.y);
        const maxY = Math.max(p1.y, p2.y);
        
        const edges = [
          [{ x: minX, y: minY }, { x: maxX, y: minY }],
          [{ x: maxX, y: minY }, { x: maxX, y: maxY }],
          [{ x: maxX, y: maxY }, { x: minX, y: maxY }],
          [{ x: minX, y: maxY }, { x: minX, y: minY }],
        ];
        
        let nearEdge = false;
        for (const [ep1, ep2] of edges) {
          if (pointToLineDistance(point, ep1, ep2) < eraserRadius) {
            nearEdge = true;
            break;
          }
        }
        
        if (!nearEdge) {
          newStrokes.push(stroke);
        } else {
          strokesModified = true;
        }
      } else if (stroke.type === "circle" && stroke.points.length >= 2) {
        // For circles, check if eraser is near the circumference
        const center = stroke.points[0];
        const radiusX = Math.abs(stroke.points[1].x - center.x);
        const radiusY = Math.abs(stroke.points[1].y - center.y);
        const radius = Math.sqrt(radiusX * radiusX + radiusY * radiusY);
        
        const distToCenter = Math.sqrt(
          Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
        );
        const distToCircumference = Math.abs(distToCenter - radius);
        
        if (distToCircumference > eraserRadius) {
          newStrokes.push(stroke);
        } else {
          strokesModified = true;
        }
      } else {
        newStrokes.push(stroke);
      }
    }
    
    if (strokesModified) {
      setDrawingStrokes(newStrokes);
      return true;
    }
    return false;
  };

  // Add strokes to history for undo/redo
  const addToHistory = (strokes: DrawingStroke[]) => {
    const newHistory = drawingHistory.slice(0, historyIndex + 1);
    newHistory.push([...strokes]);
    setDrawingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo drawing action
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDrawingStrokes([...drawingHistory[historyIndex - 1]]);
    }
  };

  // Redo drawing action
  const handleRedo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDrawingStrokes([...drawingHistory[historyIndex + 1]]);
    }
  };

  // Clear all drawings
  const handleClearDrawings = () => {
    setDrawingStrokes([]);
    addToHistory([]);
    setCurrentStroke(null);
  };

  // Export drawing with all strokes and annotations as PNG
  const handleExportDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    // Create a temporary canvas at full resolution
    const tempCanvas = document.createElement('canvas');
    const img = imageRef.current;
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw the base image
    tempCtx.drawImage(img, 0, 0);

    // Draw all strokes
    if (showDrawingLayer) {
      drawingStrokes.forEach((stroke) => {
        tempCtx.strokeStyle = stroke.color;
        tempCtx.lineWidth = stroke.width;
        tempCtx.lineCap = "round";
        tempCtx.lineJoin = "round";

        if (stroke.type === "freehand" && stroke.points.length >= 2) {
          tempCtx.beginPath();
          tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            tempCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          tempCtx.stroke();
        } else if (stroke.type === "line" && stroke.points.length >= 2) {
          tempCtx.beginPath();
          tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
          tempCtx.lineTo(stroke.points[1].x, stroke.points[1].y);
          tempCtx.stroke();
        } else if (stroke.type === "rectangle" && stroke.points.length >= 2) {
          const rectX = Math.min(stroke.points[0].x, stroke.points[1].x);
          const rectY = Math.min(stroke.points[0].y, stroke.points[1].y);
          const rectW = Math.abs(stroke.points[1].x - stroke.points[0].x);
          const rectH = Math.abs(stroke.points[1].y - stroke.points[0].y);
          tempCtx.strokeRect(rectX, rectY, rectW, rectH);
        } else if (stroke.type === "polygon" && stroke.points.length >= 2) {
          tempCtx.beginPath();
          tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            tempCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          if (stroke.points.length > 2) tempCtx.closePath();
          tempCtx.stroke();
        }
      });
    }

    // Draw annotations if visible
    if (showAnnotations) {
      annotations.forEach((annotation) => {
        if (annotation.type === "dimension") {
          const dim = annotation as DimensionAnnotation;
          tempCtx.strokeStyle = "#3B82F6";
          tempCtx.lineWidth = 2;
          tempCtx.beginPath();
          tempCtx.moveTo(dim.start.x, dim.start.y);
          tempCtx.lineTo(dim.end.x, dim.end.y);
          tempCtx.stroke();

          // Draw dimension text
          const midX = (dim.start.x + dim.end.x) / 2;
          const midY = (dim.start.y + dim.end.y) / 2;
          const displayValue = convertToDisplayUnit(dim.value);
          const text = `${displayValue.toFixed(2)} ${measurementUnit}`;
          tempCtx.font = "14px sans-serif";
          tempCtx.fillStyle = "#3B82F6";
          tempCtx.fillText(text, midX + 5, midY - 5);
        } else if (annotation.type === "label") {
          const label = annotation as LabelAnnotation;
          tempCtx.font = "14px sans-serif";
          tempCtx.fillStyle = "#8B5CF6";
          tempCtx.fillText(label.text, label.position.x, label.position.y);
        }
      });
    }

    // Download the image
    const link = document.createElement('a');
    link.download = `${fileName || 'drawing'}_export.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  // Handle canvas mouse events
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Middle mouse button (button 1) always enables pan
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Handle drawing mode - use refs to avoid re-renders during drawing
    if (isDrawMode && drawingTool !== "eraser") {
      isDrawingRef.current = true;
      setIsDrawingStroke(true); // Keep state for UI indicators
      setDrawingStartPoint({ x, y });
      lastTouchPointRef.current = { x, y };
      
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}`,
        type: drawingTool === "pen" ? "freehand" : drawingTool,
        points: [{ x, y }],
        color: strokeColor,
        width: strokeWidth,
      };
      currentStrokeRef.current = newStroke;
      // Don't call setCurrentStroke - it triggers re-renders!
      return;
    }

    // Handle eraser in drawing mode - start continuous erasing
    if (isDrawMode && drawingTool === "eraser") {
      setIsErasing(true);
      eraseAtPoint({ x, y });
      return;
    }

    if (activeTool === "pan") {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isCalibrating) {
      // Start calibration line drag
      setDragStartPoint({ x, y });
      setDragCurrentPoint({ x, y });
      setIsDraggingDimension(true);
    } else if (activeTool === "dimension") {
      // Start dimension line drag
      setDragStartPoint({ x, y });
      setDragCurrentPoint({ x, y });
      setIsDraggingDimension(true);
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Continuous erasing while mouse is held down
    if (isErasing && isDrawMode && drawingTool === "eraser") {
      eraseAtPoint({ x, y });
      return;
    }

    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isDrawingRef.current && currentStrokeRef.current && drawingStartPoint) {
      // Use refs to avoid re-renders during drawing
      const canvas = canvasRef.current;
      if (drawingTool === "pen") {
        // IMMEDIATE DRAWING: Draw line segment directly to canvas
        if (canvas && lastTouchPointRef.current) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.save();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(lastTouchPointRef.current.x * zoom + pan.x, lastTouchPointRef.current.y * zoom + pan.y);
            ctx.lineTo(x * zoom + pan.x, y * zoom + pan.y);
            ctx.stroke();
            ctx.restore();
          }
        }
        lastTouchPointRef.current = { x, y };
        currentStrokeRef.current = {
          ...currentStrokeRef.current,
          points: [...currentStrokeRef.current.points, { x, y }],
        };
      } else if (drawingTool === "line" || drawingTool === "rectangle" || drawingTool === "circle") {
        currentStrokeRef.current = {
          ...currentStrokeRef.current,
          points: [drawingStartPoint, { x, y }],
        };
        drawCanvas();
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx && currentStrokeRef.current) {
            drawStroke(ctx, currentStrokeRef.current);
          }
        }
      } else if (drawingTool === "polygon") {
        const points = [...currentStrokeRef.current.points];
        if (points.length > 1) {
          points[points.length - 1] = { x, y };
        } else {
          points.push({ x, y });
        }
        currentStrokeRef.current = {
          ...currentStrokeRef.current,
          points,
        };
        drawCanvas();
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx && currentStrokeRef.current) {
            drawStroke(ctx, currentStrokeRef.current);
          }
        }
      }
    } else if (isDraggingDimension && dragStartPoint) {
      // Update drag current point for live preview
      setDragCurrentPoint({ x, y });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    setIsPanning(false);

    // Stop erasing and save to history
    if (isErasing) {
      setIsErasing(false);
      addToHistory(drawingStrokes);
      return;
    }

    // Handle drawing mode mouse up - commit stroke from ref to state
    if (isDrawingRef.current && currentStrokeRef.current) {
      // Reset refs
      lastTouchPointRef.current = null;
      isDrawingRef.current = false;
      
      const completedStroke = currentStrokeRef.current;
      
      // Only save strokes with at least 2 points
      if (completedStroke.points.length >= 2 || 
          (completedStroke.type === "freehand" && completedStroke.points.length >= 2)) {
        const newStrokes = [...drawingStrokes, completedStroke];
        setDrawingStrokes(newStrokes);
        addToHistory(newStrokes);
      }
      
      // Clear refs and state
      currentStrokeRef.current = null;
      setCurrentStroke(null);
      setIsDrawingStroke(false);
      setDrawingStartPoint(null);
      
      // Redraw canvas
      drawCanvas();
      return;
    }

    if (isDraggingDimension && dragStartPoint) {
      const endPoint = { x, y };
      const pixelDistance = Math.sqrt(
        Math.pow(endPoint.x - dragStartPoint.x, 2) +
        Math.pow(endPoint.y - dragStartPoint.y, 2)
      );

      // Only create if dragged a meaningful distance
      if (pixelDistance > 10) {
        if (isCalibrating) {
          // Set calibration line and prompt for reference value
          setCalibrationLine({ start: dragStartPoint, end: endPoint });
          setIsEditingReference(true);
          setIsCalibrating(false);
        } else if (activeTool === "dimension") {
          // Calculate real distance using calibration
          let distance: number;
          if (pixelsPerDrawingUnit > 0) {
            // Use calibrated scale
            const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, selectedScale, scaleSystem);
            // Convert to meters for storage (internal unit)
            if (scaleSystem === "imperial") {
              distance = result.unit === "ft" ? result.value * 0.3048 : result.value * 0.0254;
            } else {
              distance = result.unit === "m" ? result.value : result.unit === "cm" ? result.value / 100 : result.value / 1000;
            }
          } else {
            // No calibration, use raw pixel distance as placeholder
            distance = pixelDistance / 100; // Assume 100 pixels per meter as default
          }

          const newAnnotation: DimensionAnnotation = {
            id: `dim-${Date.now()}`,
            type: "dimension",
            start: dragStartPoint,
            end: endPoint,
            value: distance,
            label: "",
            category: dimensionCategory
          };
          setAnnotations([...annotations, newAnnotation]);
        }
      }

      setIsDraggingDimension(false);
      setDragStartPoint(null);
      setDragCurrentPoint(null);
    }
  };

  // Handle mouse wheel for zoom (centered on cursor)
  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5); // Limit between 10% and 500%

    // Calculate new pan to keep mouse position fixed
    const scale = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * scale;
    const newPanY = mouseY - (mouseY - pan.y) * scale;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Touch event handlers for mobile support
  const getTouchPoint = (e: React.TouchEvent<HTMLCanvasElement>): { clientX: number; clientY: number } => {
    const touch = e.touches[0] || e.changedTouches[0];
    return { clientX: touch.clientX, clientY: touch.clientY };
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Only prevent default (scrolling) when canvas is locked or in draw mode
    if (isCanvasLocked || isDrawMode) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = getTouchPoint(e);
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left - pan.x) / zoom;
    const y = (touch.clientY - rect.top - pan.y) / zoom;

    // Handle drawing mode - use refs to avoid re-renders during drawing
    if (isDrawMode && drawingTool !== "eraser") {
      // Use refs instead of state to prevent re-renders during drawing
      isDrawingRef.current = true;
      setIsDrawingStroke(true); // Keep state for UI indicators
      setDrawingStartPoint({ x, y });
      
      // Store last touch point for immediate drawing on mobile
      lastTouchPointRef.current = { x, y };
      
      // Create stroke in ref (not state) to avoid triggering drawCanvas
      const newStroke: DrawingStroke = {
        id: `stroke-${Date.now()}`,
        type: drawingTool === "pen" ? "freehand" : drawingTool,
        points: [{ x, y }],
        color: strokeColor,
        width: strokeWidth,
      };
      currentStrokeRef.current = newStroke;
      // Don't call setCurrentStroke here - it triggers re-renders!
      
      // For pen tool, draw initial point immediately to canvas
      if (drawingTool === "pen") {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(x * zoom + pan.x, y * zoom + pan.y);
          ctx.lineTo(x * zoom + pan.x, y * zoom + pan.y);
          ctx.stroke();
          ctx.restore();
        }
      }
      return;
    }

    // Handle eraser in drawing mode - start continuous erasing
    if (isDrawMode && drawingTool === "eraser") {
      setIsErasing(true);
      eraseAtPoint({ x, y });
      return;
    }

    if (activeTool === "pan") {
      setIsPanning(true);
      setLastPanPoint({ x: touch.clientX, y: touch.clientY });
    } else if (isCalibrating) {
      setDragStartPoint({ x, y });
      setDragCurrentPoint({ x, y });
      setIsDraggingDimension(true);
    } else if (activeTool === "dimension") {
      setDragStartPoint({ x, y });
      setDragCurrentPoint({ x, y });
      setIsDraggingDimension(true);
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
        const firstPoint = currentPoints[0];
        const distToFirst = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
        
        if (distToFirst < 20 / zoom && currentPoints.length >= 3) {
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
          setCurrentPoints([...currentPoints, { x, y }]);
        }
      }
    } else if (activeTool === "select") {
      const clickedAnnotation = findAnnotationAtPoint({ x, y });
      setSelectedAnnotation(clickedAnnotation?.id || null);
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Only prevent default when canvas is locked or actively drawing/erasing
    if (isCanvasLocked || isDrawMode || isDrawingStroke || isDraggingDimension || isPanning || isErasing) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = getTouchPoint(e);
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left - pan.x) / zoom;
    const y = (touch.clientY - rect.top - pan.y) / zoom;

    // Continuous erasing while touch is held down
    if (isErasing && isDrawMode && drawingTool === "eraser") {
      eraseAtPoint({ x, y });
      return;
    }

    if (isPanning) {
      const dx = touch.clientX - lastPanPoint.x;
      const dy = touch.clientY - lastPanPoint.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setLastPanPoint({ x: touch.clientX, y: touch.clientY });
    } else if (isDrawingRef.current && currentStrokeRef.current && drawingStartPoint) {
      // Use refs to avoid re-renders during drawing
      if (drawingTool === "pen") {
        // IMMEDIATE DRAWING: Draw line segment directly to canvas for instant mobile feedback
        const ctx = canvas.getContext("2d");
        if (ctx && lastTouchPointRef.current) {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(lastTouchPointRef.current.x * zoom + pan.x, lastTouchPointRef.current.y * zoom + pan.y);
          ctx.lineTo(x * zoom + pan.x, y * zoom + pan.y);
          ctx.stroke();
          ctx.restore();
        }
        // Update last touch point for next segment
        lastTouchPointRef.current = { x, y };
        
        // Update ref (not state!) to track points for persistence
        currentStrokeRef.current = {
          ...currentStrokeRef.current,
          points: [...currentStrokeRef.current.points, { x, y }],
        };
        // NO setCurrentStroke here - that triggers re-renders and clears the canvas!
      } else if (drawingTool === "line" || drawingTool === "rectangle" || drawingTool === "circle") {
        // For shape tools, update ref and redraw preview
        currentStrokeRef.current = {
          ...currentStrokeRef.current,
          points: [drawingStartPoint, { x, y }],
        };
        // Redraw canvas to show shape preview
        drawCanvas();
        // Draw the current shape on top
        const ctx = canvas.getContext("2d");
        if (ctx && currentStrokeRef.current) {
          drawStroke(ctx, currentStrokeRef.current);
        }
      } else if (drawingTool === "polygon") {
        const points = [...currentStrokeRef.current.points];
        if (points.length > 1) {
          points[points.length - 1] = { x, y };
        } else {
          points.push({ x, y });
        }
        currentStrokeRef.current = {
          ...currentStrokeRef.current,
          points,
        };
        drawCanvas();
        const ctx = canvas.getContext("2d");
        if (ctx && currentStrokeRef.current) {
          drawStroke(ctx, currentStrokeRef.current);
        }
      }
    } else if (isDraggingDimension && dragStartPoint) {
      setDragCurrentPoint({ x, y });
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Only prevent default when canvas is locked or was actively drawing/erasing
    if (isCanvasLocked || isDrawMode || isDrawingStroke || isDraggingDimension || isErasing) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = getTouchPoint(e);
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left - pan.x) / zoom;
    const y = (touch.clientY - rect.top - pan.y) / zoom;

    setIsPanning(false);

    // Stop erasing and save to history
    if (isErasing) {
      setIsErasing(false);
      addToHistory(drawingStrokes);
      return;
    }

    // Handle drawing mode touch end - commit stroke from ref to state
    if (isDrawingRef.current && currentStrokeRef.current) {
      // Reset refs
      lastTouchPointRef.current = null;
      isDrawingRef.current = false;
      
      const completedStroke = currentStrokeRef.current;
      
      // Only save strokes with at least 2 points
      if (completedStroke.points.length >= 2 || 
          (completedStroke.type === "freehand" && completedStroke.points.length >= 2)) {
        const newStrokes = [...drawingStrokes, completedStroke];
        setDrawingStrokes(newStrokes);
        addToHistory(newStrokes);
      }
      
      // Clear refs and state
      currentStrokeRef.current = null;
      setCurrentStroke(null);
      setIsDrawingStroke(false);
      setDrawingStartPoint(null);
      
      // Redraw canvas to ensure all strokes are properly rendered
      drawCanvas();
      return;
    }

    if (isDraggingDimension && dragStartPoint) {
      const endPoint = { x, y };
      const pixelDistance = Math.sqrt(
        Math.pow(endPoint.x - dragStartPoint.x, 2) +
        Math.pow(endPoint.y - dragStartPoint.y, 2)
      );

      if (pixelDistance > 10) {
        if (isCalibrating) {
          setCalibrationLine({ start: dragStartPoint, end: endPoint });
          setIsEditingReference(true);
          setIsCalibrating(false);
        } else if (activeTool === "dimension") {
          let distance: number;
          if (pixelsPerDrawingUnit > 0) {
            const result = calculateRealDistance(pixelDistance, pixelsPerDrawingUnit, selectedScale, scaleSystem);
            if (scaleSystem === "imperial") {
              distance = result.unit === "ft" ? result.value * 0.3048 : result.value * 0.0254;
            } else {
              distance = result.unit === "m" ? result.value : result.unit === "cm" ? result.value / 100 : result.value / 1000;
            }
          } else {
            distance = pixelDistance / 100;
          }

          const newAnnotation: DimensionAnnotation = {
            id: `dim-${Date.now()}`,
            type: "dimension",
            start: dragStartPoint,
            end: endPoint,
            value: distance,
            label: "",
            category: dimensionCategory
          };
          setAnnotations([...annotations, newAnnotation]);
        }
      }

      setIsDraggingDimension(false);
      setDragStartPoint(null);
      setDragCurrentPoint(null);
    }
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
      toast.error("Please select a zone to check compliance against.");
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
      setImageLoaded(false);
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
        
        // Mark image as loaded to trigger redraw
        setImageLoaded(true);
      };
      img.src = drawingImage;
    } else {
      setImageLoaded(false);
      imageRef.current = null;
    }
  }, [drawingImage]);

  // Redraw canvas when image is loaded
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      drawCanvas();
    }
  }, [imageLoaded, drawCanvas]);

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

  // PD2.0 §6.3 — Disclaimer gate: must be acknowledged before any analysis
  if (!disclaimerAcknowledged) {
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
            <DisclaimerGate
              onAcknowledged={(_version) => setDisclaimerAcknowledged(true)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show mobile-only message if on mobile device
  if (isMobile) {
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
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Desktop Only Feature</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                The Drawing Analysis tool requires a larger screen and precise mouse control for accurate annotations. 
                Please access this feature from a desktop or laptop computer for the best experience.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What you can do on desktop:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 text-left space-y-1">
                  <li>• Upload and analyze architectural drawings</li>
                  <li>• Add dimension annotations with calibration</li>
                  <li>• Draw freehand sketches and shapes</li>
                  <li>• Use AI to extract measurements automatically</li>
                  <li>• Check compliance against municipal bylaws</li>
                  <li>• Export annotated drawings and reports</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
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
              
              <div className="flex items-center justify-center gap-4">
                <div className="h-px bg-border flex-1" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="h-px bg-border flex-1" />
              </div>
              
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Take Photo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use your device camera to capture a drawing
                </p>
                <p className="text-xs text-muted-foreground">
                  AI will automatically extract dimensions and measurements
                </p>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleCameraCapture}
                />
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <div className="h-px bg-border flex-1" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                onClick={() => {
                  // Create a blank canvas for drawing
                  const canvas = document.createElement('canvas');
                  canvas.width = 1200;
                  canvas.height = 900;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    // White background with grid
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw light grid
                    ctx.strokeStyle = '#E5E7EB';
                    ctx.lineWidth = 1;
                    const gridSize = 50;
                    for (let x = 0; x <= canvas.width; x += gridSize) {
                      ctx.beginPath();
                      ctx.moveTo(x, 0);
                      ctx.lineTo(x, canvas.height);
                      ctx.stroke();
                    }
                    for (let y = 0; y <= canvas.height; y += gridSize) {
                      ctx.beginPath();
                      ctx.moveTo(0, y);
                      ctx.lineTo(canvas.width, y);
                      ctx.stroke();
                    }
                  }
                  setDrawingImage(canvas.toDataURL('image/png'));
                  setFileName('New Drawing');
                  setIsDrawMode(true);
                  setIsCanvasLocked(true); // Lock canvas for mobile drawing
                  setDrawingStrokes([]);
                  setDrawingHistory([[]]);
                  setHistoryIndex(0);
                }}
              >
                <PenTool className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Start Drawing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new floor plan or sketch from scratch
                </p>
                <p className="text-xs text-muted-foreground">
                  Use drawing tools to sketch walls, rooms, and features
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">AI-Powered Analysis</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    After uploading, capturing, or drawing a plan, use the AI Analyze button to automatically extract dimensions, room labels, setbacks, and building measurements. The AI will identify lot sizes, building footprints, and check compliance against municipal bylaws.
                  </p>
                </div>
              </div>
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

                {/* Unit Selector */}
                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Select value={measurementUnit} onValueChange={(v) => setMeasurementUnit(v as "mm" | "inches" | "feet")}>
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="inches">Inches</SelectItem>
                      <SelectItem value="feet">Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rotation Controls */}
                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageRotation((prev) => (prev - 90 + 360) % 360)}
                    title="Rotate Counter-Clockwise"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <span className="text-xs w-10 text-center">{imageRotation}°</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                    title="Rotate Clockwise"
                  >
                    <RotateCw className="w-4 h-4" />
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

                {/* Mobile Canvas Lock - prevents page scrolling when drawing */}
                <div className="flex items-center gap-1 border-r border-border pr-2 md:hidden">
                  <Button
                    variant={isCanvasLocked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsCanvasLocked(!isCanvasLocked)}
                    title={isCanvasLocked ? "Unlock Canvas (allow page scroll)" : "Lock Canvas (enable drawing)"}
                    className={isCanvasLocked ? "bg-amber-600 hover:bg-amber-700" : ""}
                  >
                    {isCanvasLocked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                    {isCanvasLocked ? "Locked" : "Lock"}
                  </Button>
                </div>

                {/* Drawing Mode Toggle */}
                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Button
                    variant={isDrawMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsDrawMode(!isDrawMode);
                      // Auto-lock canvas when entering draw mode on mobile
                      if (!isDrawMode) {
                        setIsCanvasLocked(true);
                      }
                    }}
                    title={isDrawMode ? "Exit Draw Mode" : "Enter Draw Mode"}
                    className={isDrawMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    <PenTool className="w-4 h-4 mr-1" />
                    Draw
                  </Button>
                  {isDrawMode && (
                    <>
                      <Button
                        variant={drawingTool === "pen" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDrawingTool("pen")}
                        title="Freehand Pen"
                      >
                        <PenTool className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={drawingTool === "line" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDrawingTool("line")}
                        title="Straight Line"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={drawingTool === "rectangle" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDrawingTool("rectangle")}
                        title="Rectangle"
                      >
                        <RectangleHorizontal className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={drawingTool === "circle" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDrawingTool("circle")}
                        title="Circle"
                      >
                        <Circle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={drawingTool === "eraser" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setDrawingTool("eraser")}
                        title="Eraser"
                      >
                        <Eraser className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Drawing Options (when in draw mode) */}
                {isDrawMode && (
                  <div className="flex items-center gap-1 border-r border-border pr-2">
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                      title="Stroke Color"
                    />
                    <Select value={strokeWidth.toString()} onValueChange={(v) => setStrokeWidth(parseInt(v))}>
                      <SelectTrigger className="w-16 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Thin</SelectItem>
                        <SelectItem value="3">Medium</SelectItem>
                        <SelectItem value="5">Thick</SelectItem>
                        <SelectItem value="8">Extra</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      title="Undo"
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRedo}
                      disabled={historyIndex >= drawingHistory.length - 1}
                      title="Redo"
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearDrawings}
                      disabled={drawingStrokes.length === 0}
                      title="Clear All Drawings"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={showDrawingLayer ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowDrawingLayer(!showDrawingLayer)}
                      title={showDrawingLayer ? "Hide Drawing Layer" : "Show Drawing Layer"}
                    >
                      <Layers className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Scale System and Calibration */}
                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Select value={scaleSystem} onValueChange={(v) => {
                    const newSystem = v as ScaleSystem;
                    setScaleSystem(newSystem);
                    // Reset to default scale for the new system
                    setSelectedScale(newSystem === "imperial" ? imperialScales[3] : metricScales[5]);
                  }}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imperial">Imperial</SelectItem>
                      <SelectItem value="metric">Metric</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedScale.id} onValueChange={(v) => {
                    const scale = getScaleById(v);
                    if (scale) setSelectedScale(scale);
                  }}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getScalesBySystem(scaleSystem).map(scale => (
                        <SelectItem key={scale.id} value={scale.id}>
                          <span className="font-mono">{scale.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={isCalibrating ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsCalibrating(!isCalibrating);
                      if (!isCalibrating) {
                        setCalibrationLine(null);
                        setReferenceValue("");
                      }
                    }}
                    title="Calibrate scale by drawing a reference line"
                  >
                    <Ruler className="w-4 h-4 mr-1" />
                    {pixelsPerDrawingUnit > 0 ? "Recalibrate" : "Calibrate"}
                  </Button>
                </div>

                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={runAiAnalysis}
                    disabled={isAnalyzing || (pdfPages.length > 0 && selectedPages.length === 0)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    title={pdfPages.length > 0 && selectedPages.length === 0 ? "Select at least one page to analyze" : "AI Analyze Drawing"}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    {isAnalyzing ? (analyzeProgress || "Analyzing...") : "AI Analyze"}
                  </Button>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportDrawing}
                    title="Export drawing with annotations as PNG"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDrawingImage(null);
                      setAnnotations([]);
                      setAiResults(null);
                      setFileName("");
                      setDrawingStrokes([]);
                      setDrawingHistory([[]]);
                      setHistoryIndex(0);
                      setIsDrawMode(false);
                      setPdfPages([]);
                      setSelectedPages([]);
                      setTotalPages(0);
                      setCurrentPreviewPage(1);
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
                  <p className="text-xs text-muted-foreground">Click and drag to measure distance{pixelsPerDrawingUnit === 0 && " (calibrate scale first for accurate measurements)"}</p>
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

              {isCalibrating && (
                <div className="flex items-center gap-4 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Ruler className="w-4 h-4 text-green-600" />
                  <p className="text-sm">
                    Click and drag on the drawing to draw a reference line of known length
                  </p>
                  <Badge variant="secondary">Scale: {selectedScale.label}</Badge>
                  <span className="text-xs text-muted-foreground">({selectedScale.drawingType})</span>
                </div>
              )}

              {isEditingReference && calibrationLine && (
                <div className="flex items-center gap-4 p-2 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Ruler className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-medium">Enter the actual length of the reference line:</p>
                  <Input
                    type="number"
                    value={referenceValue}
                    onChange={(e) => setReferenceValue(e.target.value)}
                    placeholder={scaleSystem === "imperial" ? "feet" : "meters"}
                    className="w-24 h-8"
                    autoFocus
                  />
                  <span className="text-sm text-muted-foreground">
                    {scaleSystem === "imperial" ? "feet" : "meters"}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      const value = parseFloat(referenceValue);
                      if (value > 0 && calibrationLine) {
                        const pixelDistance = Math.sqrt(
                          Math.pow(calibrationLine.end.x - calibrationLine.start.x, 2) +
                          Math.pow(calibrationLine.end.y - calibrationLine.start.y, 2)
                        );
                        // Calculate pixels per drawing unit
                        // For imperial: user enters feet, we need pixels per inch on drawing
                        // For metric: user enters meters, we need pixels per mm on drawing
                        if (scaleSystem === "imperial") {
                          // Convert feet to inches, then divide by scale ratio to get drawing inches
                          const realInches = value * 12;
                          const drawingInches = realInches / selectedScale.ratio;
                          setPixelsPerDrawingUnit(pixelDistance / drawingInches);
                        } else {
                          // Convert meters to mm, then divide by scale ratio to get drawing mm
                          const realMm = value * 1000;
                          const drawingMm = realMm / selectedScale.ratio;
                          setPixelsPerDrawingUnit(pixelDistance / drawingMm);
                        }
                        setIsEditingReference(false);
                        setCalibrationLine(null);
                      }
                    }}
                    disabled={!referenceValue || parseFloat(referenceValue) <= 0}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingReference(false);
                      setCalibrationLine(null);
                      setReferenceValue("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {pixelsPerDrawingUnit > 0 && !isCalibrating && !isEditingReference && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">Scale calibrated:</span>
                  <span>{selectedScale.label}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{selectedScale.drawingType}</span>
                </div>
              )}

              {/* PDF page thumbnail selector */}
              {pdfPages.length > 0 && (
                <div className="mt-2 p-3 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Pages ({pdfPages.length}{totalPages > 20 ? ` of ${totalPages} — first 20 shown` : ''})
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPages(pdfPages.map((_, i) => i + 1))}
                        className="text-xs text-primary underline"
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => setSelectedPages([])}
                        className="text-xs text-muted-foreground underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {pdfPages.map((pageImg, idx) => {
                      const pageNum = idx + 1;
                      const isSelected = selectedPages.includes(pageNum);
                      const isCurrent = currentPreviewPage === pageNum;
                      return (
                        <div
                          key={idx}
                          className={`relative flex-shrink-0 cursor-pointer border-2 rounded ${isCurrent ? 'border-primary' : 'border-transparent'}`}
                          style={{ width: 80 }}
                          onClick={() => {
                            setDrawingImage(pageImg);
                            setCurrentPreviewPage(pageNum);
                          }}
                        >
                          <img src={pageImg} className="w-full rounded" alt={`Page ${pageNum}`} />
                          <div className="absolute top-1 left-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedPages(prev =>
                                  isSelected
                                    ? prev.filter(p => p !== pageNum)
                                    : [...prev, pageNum].sort((a, b) => a - b)
                                );
                              }}
                            />
                          </div>
                          <div className="text-center text-xs mt-1 text-muted-foreground">p.{pageNum}</div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedPages.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedPages.length} page{selectedPages.length > 1 ? 's' : ''} selected for analysis: {selectedPages.join(', ')}
                    </p>
                  )}
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
                    className={`w-full h-full cursor-crosshair ${isCanvasLocked || isDrawMode ? 'touch-none' : 'touch-auto'}`}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onWheel={handleCanvasWheel}
                    onTouchStart={handleCanvasTouchStart}
                    onTouchMove={handleCanvasTouchMove}
                    onTouchEnd={handleCanvasTouchEnd}
                    onContextMenu={(e) => e.preventDefault()}
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

                  {/* Drawing Analysis History Panel (Phase 2) */}
                  {projectId && drawingAnalysisHistory.length > 0 && (
                    <Card className="border-blue-200 dark:border-blue-800">
                      <CardHeader className="py-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 cursor-pointer" onClick={() => setShowHistoryPanel(!showHistoryPanel)}>
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Analysis History ({drawingAnalysisHistory.length})
                          </span>
                          <span className="text-xs text-muted-foreground">{showHistoryPanel ? "▼" : "▶"}</span>
                        </CardTitle>
                      </CardHeader>
                      {showHistoryPanel && (
                        <CardContent className="pt-3">
                          <ScrollArea className="h-48">
                            <div className="space-y-2">
                              {drawingAnalysisHistory.map((analysis: any) => {
                                const resultData = analysis.resultData || {};
                                const criticalCount = resultData.criticalCount || 0;
                                const warningCount = resultData.warningCount || 0;
                                const infoCount = resultData.infoCount || 0;
                                return (
                                  <div key={analysis.id} className="p-2 border border-border rounded hover:bg-muted cursor-pointer transition-colors">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium truncate">{analysis.inputData?.fileName || "Unknown"}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(analysis.createdAt).toLocaleDateString()}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        {criticalCount > 0 && <Badge variant="destructive" className="text-xs">{criticalCount} critical</Badge>}
                                        {warningCount > 0 && <Badge variant="secondary" className="text-xs">{warningCount} warnings</Badge>}
                                        {infoCount > 0 && <Badge variant="outline" className="text-xs">{infoCount} info</Badge>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* AI Analysis Results */}
                  {showAiResults && aiResults && (
                    <Card className="border-purple-200 dark:border-purple-800">
                      <CardHeader className="py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            AI Analysis Results
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => setShowAiResults(false)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <ScrollArea className="h-64">
                          <div className="space-y-4">
                            {/* Drawing Type */}
                            <div className="p-2 rounded bg-muted">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Drawing Type</div>
                              <Badge variant="outline">{aiResults.drawingType}</Badge>
                              {aiResults.scale && (
                                <Badge variant="outline" className="ml-2">Scale: {aiResults.scale}</Badge>
                              )}
                            </div>
                            
                            {/* Extracted Measurements */}
                            {aiResults.measurements.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-2">Extracted Measurements</div>
                                <div className="space-y-1">
                                  {aiResults.measurements.map((m, i) => (
                                    <div key={i} className="p-2 rounded bg-muted text-xs flex items-center justify-between">
                                      <div>
                                        <span className="font-medium">{m.label}</span>
                                        <span className="text-muted-foreground ml-2">({m.category})</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{m.value.toFixed(2)}m</Badge>
                                        <Badge variant={m.confidence === "high" ? "default" : m.confidence === "medium" ? "secondary" : "outline"} className="text-[10px]">
                                          {m.confidence}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Detected Rooms */}
                            {aiResults.rooms.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-2">Detected Rooms</div>
                                <div className="space-y-1">
                                  {aiResults.rooms.map((r, i) => (
                                    <div key={i} className="p-2 rounded bg-muted text-xs flex items-center justify-between">
                                      <span className="font-medium">{r.name}</span>
                                      <Badge variant="secondary">{r.area.toFixed(1)}m²</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Notes */}
                            {aiResults.notes.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-2">Notes</div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {aiResults.notes.map((note, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-primary">•</span>
                                      {note}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Apply Button */}
                            <Button 
                              onClick={applyAiResults} 
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Apply to Annotations
                            </Button>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {/* PD2.0 Professional Review Panel — shown after AI analysis */}
                  {analysisId !== null && analysisStatus !== null && (
                    <ProfessionalReviewPanel
                      analysisId={analysisId}
                      analysisStatus={analysisStatus}
                      complianceScore={complianceScore}
                      complianceLevel={complianceLevel}
                      ruleEvaluations={ruleEvaluations}
                      issues={pdIssues}
                      recommendations={pdRecommendations}
                      onStatusChange={(newStatus) => setAnalysisStatus(newStatus)}
                    />
                  )}
                  
                  {/* Export to Compliance Report Button (Phase 2) */}
                  {projectId && savedAnalysisId && analysisStatus === "VALID" && (
                    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Export to Compliance Report</p>
                            <p className="text-xs text-muted-foreground mt-1">Save findings to project compliance snapshots</p>
                          </div>
                          <Button 
                            onClick={handleExportToCompliance}
                            disabled={exportToComplianceMutation.isPending}
                            className="gap-2"
                          >
                            {exportToComplianceMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Exporting...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Export Report
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
