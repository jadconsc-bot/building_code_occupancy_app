import { useState, useRef, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  C, TABLE_STYLES,
  drawHeader, drawStatusBanner, drawSectionBar, drawFooters, contentHeight,
} from "@/lib/pdfStyles";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Circle,
  Building,
  Zap,
  FolderOpen,
  ChevronDown,
  FileSearch,
  Check,
  Folder,
  BarChart2,
  FileUp,
  Clock,
  ChevronRight,
  Crop,
  PenLine,
  BookOpen,
  RefreshCw,
  MapPin
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DisclaimerGate } from "@/components/DisclaimerGate";
import { ProfessionalReviewPanel } from "@/components/ProfessionalReviewPanel";
import { AnalysisStatusBanner } from "@/components/AnalysisStatusBanner";
import { SaveCalculatorResultDialog } from "@/components/SaveCalculatorResultDialog";
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

// Worker must be assigned after all imports (ES module parse order requirement)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface TravelDistanceResult {
  roomId: number;
  roomLabel: string;
  centroidX: number;
  centroidY: number;
  nearestExitId: number | null;
  nearestExitLabel: string | null;
  exitCentroidX: number | null;
  exitCentroidY: number | null;
  distancePx: number | null;
  distanceM: number | null;
  limit: number;
  limitUnsprinklered: number;
  limitSprinklered: number;
  limitSource: 'occupancy_specific' | 'default_conservative';
  result: 'pass' | 'fail' | 'unable_to_evaluate' | 'not_applicable';
  nbcClause: '3.4.2.5';
  sprinklered: boolean;
}

type ComplianceLevel = 'critical' | 'major' | 'minor' | 'warning' | 'pass' | 'none';

interface RoomHeatmapEntry {
  level: ComplianceLevel;
  source: 'compliance_engine' | 'travel_distance' | 'both';
}

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

// ─── Bounding-box drag/resize helpers (module-level, no hooks) ───────────────
const BBOX_HANDLE_RADIUS = 5;
type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLE_CURSORS: Record<HandleId, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize',   se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize',
};
function getHandlePositions(screenX: number, screenY: number, screenW: number, screenH: number) {
  return [
    { id: 'nw' as HandleId, x: screenX,              y: screenY               },
    { id: 'n'  as HandleId, x: screenX + screenW / 2, y: screenY               },
    { id: 'ne' as HandleId, x: screenX + screenW,     y: screenY               },
    { id: 'e'  as HandleId, x: screenX + screenW,     y: screenY + screenH / 2 },
    { id: 'se' as HandleId, x: screenX + screenW,     y: screenY + screenH     },
    { id: 's'  as HandleId, x: screenX + screenW / 2, y: screenY + screenH     },
    { id: 'sw' as HandleId, x: screenX,               y: screenY + screenH     },
    { id: 'w'  as HandleId, x: screenX,               y: screenY + screenH / 2 },
  ];
}
// ─────────────────────────────────────────────────────────────────────────────

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
  const [showRoomOverlay, setShowRoomOverlay] = useState(true);
  const [showTravelDistanceOverlay, setShowTravelDistanceOverlay] = useState(false);
  const [showComplianceHeatmap, setShowComplianceHeatmap] = useState(false);
  const [showWallOverlay, setShowWallOverlay] = useState(false);
  const [hoveredRoom, setHoveredRoom] = useState<{ roomId: number; screenX: number; screenY: number } | null>(null);
  const [evalData, setEvalData] = useState<{
    accuracy: number;
    passingRooms: number;
    totalRooms: number;
    missedRooms: string[];
  } | null>(null);
  const [detectedRoomsData, setDetectedRoomsData] = useState<any[]>([]);
  const [analyzedPageDims, setAnalyzedPageDims] = useState<{ width: number; height: number } | null>(null);
  const [roomPollCount, setRoomPollCount] = useState(0);
  const [detectedScale, setDetectedScale] = useState<string | null>(null);
  const [currentPageId, setCurrentPageId] = useState<number | null>(null);
  const [calibrationRestored, setCalibrationRestored] = useState(false);

  // User-defined analysis region (click-and-drag crop)
  const [cropRegionMode, setCropRegionMode] = useState(false);
  const [cropRegionConfirmed, setCropRegionConfirmed] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDraggingCropRegion, setIsDraggingCropRegion] = useState(false);
  const cropDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const cropRegionDraftRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Phase 5B — Admin review mode + correction state
  const [reviewMode, setReviewMode] = useState(false);
  const [selectedRoomForCorrection, setSelectedRoomForCorrection] = useState<any | null>(null);
  const [correctionPopover, setCorrectionPopover] = useState<{ x: number; y: number; room: any } | null>(null);
  const [boundaryRedrawMode, setBoundaryRedrawMode] = useState<'rect' | 'polygon' | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
  const boundaryRectDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const boundaryRectDraftRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // SPEC-BBOX-DRAG-RESIZE — drag/resize state
  const [interactingRoom, setInteractingRoom] = useState<{
    roomId: number;
    mode: 'move' | 'resize';
    handle?: HandleId;
    startMouseX: number;
    startMouseY: number;
    startBbox: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [bboxOverrides, setBboxOverrides] = useState<
    Map<number, { x: number; y: number; width: number; height: number }>
  >(new Map());
  const [originalBboxes, setOriginalBboxes] = useState<
    Map<number, { x: number; y: number; width: number; height: number }>
  >(new Map());

  // SPEC-POLYGON-VERTEX-EDITOR — polygon vertex edit state
  const [polygonEditMode, setPolygonEditMode] = useState<{
    roomId: number;
    vertices: { x: number; y: number }[];
    originalVertices: { x: number; y: number }[] | null;
  } | null>(null);
  const [draggingVertexIdx, setDraggingVertexIdx] = useState<number | null>(null);

  const ROOM_OVERLAY_COLORS = {
    occupancy: {
      A: { fill: 'rgba(83,74,183,0.25)', stroke: 'rgba(83,74,183,0.8)' },
      B: { fill: 'rgba(153,53,86,0.25)', stroke: 'rgba(153,53,86,0.8)' },
      C: { fill: 'rgba(15,110,86,0.25)', stroke: 'rgba(15,110,86,0.8)' },
      D: { fill: 'rgba(24,95,165,0.25)', stroke: 'rgba(24,95,165,0.8)' },
      E: { fill: 'rgba(186,117,23,0.25)', stroke: 'rgba(186,117,23,0.8)' },
      F: { fill: 'rgba(163,45,45,0.25)', stroke: 'rgba(163,45,45,0.8)' },
    },
    confidence: {
      high: 'rgba(34,197,94,0.25)',
      medium: 'rgba(251,191,36,0.25)',
      low: 'rgba(239,68,68,0.25)',
    },
    status: {
      fail: 'rgba(220,38,38,0.9)',
      warning: 'rgba(217,119,6,0.9)',
      flagged: 'rgba(217,119,6,0.6)',
      flaggedFill: 'rgba(234,179,8,0.18)',
    },
  } as const;

  const HEATMAP_COLORS: Record<ComplianceLevel, { fill: string; stroke: string }> = {
    critical: { fill: 'rgba(220,38,38,0.50)', stroke: 'rgba(220,38,38,0.90)' },
    major:    { fill: 'rgba(239,68,68,0.38)',  stroke: 'rgba(239,68,68,0.80)'  },
    minor:    { fill: 'rgba(245,158,11,0.38)', stroke: 'rgba(245,158,11,0.80)' },
    warning:  { fill: 'rgba(245,158,11,0.30)', stroke: 'rgba(245,158,11,0.70)' },
    pass:     { fill: 'rgba(34,197,94,0.35)',  stroke: 'rgba(34,197,94,0.80)'  },
    none:     { fill: '',                       stroke: ''                      },
  };

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

  // State for window measurement tool (BC Step Code WWR)
  const [windowMeasureMode, setWindowMeasureMode] = useState(false);
  const [measuredWindows, setMeasuredWindows] = useState<Array<{
    id: string;
    face: 'N' | 'S' | 'E' | 'W' | 'unknown';
    widthMm: number;
    heightMm: number;
    areaM2: number;
    position: { x: number; y: number };
    pixelWidth: number;
  }>>([]);
  const [windowHeightInput, setWindowHeightInput] = useState<string>('1200');
  const [pendingWindowMeasure, setPendingWindowMeasure] = useState<{
    widthMm: number;
    position: { x: number; y: number };
    pixelWidth: number;
  } | null>(null);
  const [windowFaceInput, setWindowFaceInput] = useState<'N' | 'S' | 'E' | 'W' | 'unknown'>('unknown');
  // WWR multi-storey + wall area state
  const [storeyCount, setStoreyCount] = useState<number>(1);
  const [storeyHeightM, setStoreyHeightM] = useState<number>(2.7);
  const [useFloorMultiplier, setUseFloorMultiplier] = useState<boolean>(false);
  const [wallAreaInputs, setWallAreaInputs] = useState<Partial<Record<'N' | 'S' | 'E' | 'W', number>>>({});
  const [wallLengthInputs, setWallLengthInputs] = useState<Partial<Record<'N' | 'S' | 'E' | 'W', number>>>({});
  // Canvas vertical resize
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [wwrPanelHeight, setWwrPanelHeight] = useState(400);
  const [isDraggingDimension, setIsDraggingDimension] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dragCurrentPoint, setDragCurrentPoint] = useState<Point | null>(null);
  
  // State for AI analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [setContext, setSetContext] = useState<{
    projectName?: string | null;
    projectAddress?: string | null;
    architectFirm?: string | null;
    buildingOccupancy?: string | null;
    numberOfStoreys?: number | null;
    basementPresent?: boolean | null;
    constructionType?: string | null;
    sprinklered?: boolean | null;
    codeEdition?: string | null;
    municipality?: string | null;
    province?: string | null;
    pageInventory?: Array<{ pageNum: number; title: string; type: string }>;
    floorHierarchy?: Array<{ floor: string; pageNum: number }>;
    confirmedScale?: string | null;
    typicalCeilingHeightM?: number | null;
    abbreviations?: Record<string, string>;
    exitLocations?: Array<{ description: string; pageNum: number; direction: string }>;
    stairLocations?: Array<{ pageNum: number; location: string }>;
    currentRevision?: string | null;
    revisionDate?: string | null;
  } | null>(null);
  const [isReadingContext, setIsReadingContext] = useState(false);

  // Zone auto-lookup state
  const [addressInput, setAddressInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [zoneResult, setZoneResult] = useState<{
    zoneCode: string; zoneName: string; communityName: string | null;
    confirmedAddress: string | null; lat: number; lng: number;
    source: 'calgary_arcgis' | 'edmonton_open_data' | 'not_found';
  } | null>(null);
  const [zoneConfirmed, setZoneConfirmed] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [analysisProgress, setAnalysisProgress] = useState<{
    stage: 'idle' | 'uploading' | 'ocr' | 'detecting' | 'polygons' | 'evaluating' | 'complete';
    pct: number;
    label: string;
  }>({ stage: 'idle', pct: 0, label: '' });
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
      const isSmallScreen = window.innerWidth < 640;
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
  const canvasResizeStartRef = useRef<{ y: number; h: number } | null>(null);
  const wwrPanelResizeRef = useRef<{ y: number; h: number } | null>(null);
  const imageJustLoadedRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  
  // Auth state (PD2.0 §6.1 — authentication required)
  const { isAuthenticated, user } = useAuth();

  // PD2.0 §6.3 — disclaimer state
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [disclaimerVersion, setDisclaimerVersion] = useState("");

  // Check if user has already acknowledged the current disclaimer version (persists across sessions)
  const { data: disclaimerStatus } = trpc.drawingAnalysis.checkDisclaimerStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  useEffect(() => {
    if (disclaimerStatus?.hasAcknowledged) {
      setDisclaimerAcknowledged(true);
      setDisclaimerVersion(disclaimerStatus.version);
    }
  }, [disclaimerStatus]);

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

  // Room-level compliance results (Phase B)
  const [roomComplianceData, setRoomComplianceData] = useState<Array<{
    room: { id: number; roomLabel: string; occupancyGroup: string; areaSqm: string };
    compliance: Array<{
      ruleReference: string;
      ruleCategory: string;
      ruleText: string;
      status: string;
      actualValue: string | null;
      requiredValue: string | null;
      remediationSuggestion: string | null;
      severity: string | null;
    }>;
  }>>([]);
  const [complianceLevel, setComplianceLevel] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(projectId || 0);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showNoProjectWarning, setShowNoProjectWarning] = useState(false);
  const [analysisType, setAnalysisType] = useState<"structural" | "fire-safety" | "connections" | "comprehensive">("comprehensive");
  const [analysisQuality, setAnalysisQuality] = useState<"fast" | "standard" | "detailed">("standard");
  const [drawingType, setDrawingType] = useState<string>("auto");
  
  // Drawing Analysis Persistence (Phase 2)
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [drawingAnalysisHistory, setDrawingAnalysisHistory] = useState<any[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showAllFindings, setShowAllFindings] = useState(false);

  // tRPC mutations for persistence
  const saveDrawingAnalysisMutation = trpc.saveDrawingAnalysis.useMutation();
  const getDrawingAnalysesQuery = trpc.getDrawingAnalyses.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const exportToComplianceMutation = trpc.exportFindingsToCompliance.useMutation();
  const projectListQuery = trpc.projects.list.useQuery(undefined, { refetchOnWindowFocus: false });

  // New PD2.0-compliant mutation
  // tRPC utils for query invalidation (Phase 2)
  const utils = trpc.useUtils();
  const extractContextMutation = trpc.drawingSetContext.extractContext.useMutation();
  const zoneLookupMutation = trpc.zoneLookup.lookup.useMutation();
  const saveZoneMutation = trpc.zoneLookup.saveToProject.useMutation();

  const pdAnalyzeMutation = trpc.drawingAnalysis.analyze.useMutation({
    onSuccess: async (data) => {
      console.log('[DrawingAnalysis] Analysis completed successfully:', { analysisId: data.analysisId, status: data.analysisStatus });
      setAnalysisId(data.analysisId);
      setAnalysisStatus(data.analysisStatus);
      setRuleEvaluations(data.ruleEvaluations as any);
      setPdIssues(data.issues as any);
      setPdRecommendations(
        (data.recommendations as Array<{priority: string; clause: string; description: string}>)
          .map(r => `[${r.priority.toUpperCase()}] ${r.clause}: ${r.description}`)
      );
      setComplianceScore(data.complianceScore);
      setComplianceLevel(data.complianceLevel);
      setAiResults({
        drawingType: data.extractedData.drawingType,
        scale: null,
        measurements: [],
        rooms: [],
        notes: (data.recommendations as Array<{priority: string; clause: string; description: string}>)
          .map(r => `[${r.priority.toUpperCase()}] ${r.clause}: ${r.description}`),
      });
      setShowAiResults(true);
      if (!isMultiPageAnalysisRef.current) {
        setIsAnalyzing(false);
        setAnalysisProgress({ stage: 'ocr', pct: 25, label: 'OCR complete, detecting rooms…' });
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
        setAnalysisProgress({ stage: 'idle', pct: 0, label: '' });
      }
    },
  });

  const activeProjectId = selectedProjectId || projectId;

  const { data: recentAnalyses } = trpc.drawingAnalysis.listByProject.useQuery(
    { projectId: activeProjectId! },
    { enabled: !!activeProjectId && !analysisId }
  );


  const waitingForRooms = detectedRoomsData.length === 0 && roomPollCount < 20;
  const hasPolygons = detectedRoomsData.some(r => (r as any).polygonJson != null);
  const waitingForEval = detectedRoomsData.length > 0 && evalData === null && !hasPolygons && roomPollCount < 50;
  const { data: roomsData } = trpc.drawingAnalysis.getRoomsForDrawing.useQuery(
    { drawingId: analysisId ?? 0 },
    {
      enabled: !!analysisId,
      refetchInterval: (waitingForRooms || waitingForEval)
        ? (roomPollCount < 5 ? 2000 : 5000)
        : false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Compute pixelsPerMm from calibration state for travel distance calculation
  const pixelsPerMm = pixelsPerDrawingUnit > 0
    ? (scaleSystem === 'metric'
        ? pixelsPerDrawingUnit / selectedScale.ratio
        : pixelsPerDrawingUnit / (selectedScale.ratio * 25.4))
    : null;

  // Wall segments query — only runs when the overlay is toggled on (admin/professional)
  const canSeeWalls = user?.role === "admin" || user?.role === "rule_editor" || user?.role === "professional";
  const { data: wallSegmentsData } = trpc.wallEngine.getWallSegments.useQuery(
    { pageId: currentPageId ?? 0 },
    { enabled: !!currentPageId && showWallOverlay && canSeeWalls }
  );
  const wallSegmentsList = wallSegmentsData ?? [];

  // Travel distance query — only runs when the overlay is toggled on
  const { data: travelDistanceData } = trpc.drawingAnalysis.getTravelDistances.useQuery(
    { drawingId: analysisId ?? 0, pixelsPerMm },
    { enabled: !!analysisId && showTravelDistanceOverlay }
  );
  const travelDistanceResults: TravelDistanceResult[] = travelDistanceData?.results ?? [];
  const travelSprinklered = travelDistanceData?.sprinklered ?? false;

  const saveCalibrationMutation = trpc.drawingAnalysis.saveCalibration.useMutation();
  const saveCorrectionMutation = trpc.correction.saveCorrection.useMutation({
    onSuccess: () => toast.success('Correction saved and added to training pool.'),
    onError: () => toast.error('Failed to save correction.'),
  });

  // Fetch room-level compliance results once rooms have loaded
  const { data: roomComplianceResults } = trpc.drawingAnalysis.getRoomCompliance.useQuery(
    { drawingId: analysisId ?? 0, projectId: selectedProjectId },
    { enabled: !!analysisId && !!selectedProjectId && detectedRoomsData.length > 0 }
  );

  useEffect(() => {
    if (!roomComplianceResults || roomComplianceResults.length === 0) return;
    setRoomComplianceData(roomComplianceResults as any);

    // Merge room-level results into ruleEvaluations for display in the compliance panel
    const roomRules: typeof ruleEvaluations = [];
    for (const item of roomComplianceResults) {
      for (const c of (item as any).compliance ?? []) {
        if (c.status === 'not_applicable') continue;
        if (roomRules.some(r => r.ruleId === c.ruleReference && r.details?.includes((item as any).room?.roomLabel))) continue;
        roomRules.push({
          ruleId: c.ruleReference,
          clause: c.ruleReference,
          description: (c.ruleText ?? '').substring(0, 120),
          category: c.ruleCategory ?? 'compliance',
          severity: c.severity ?? 'medium',
          result: c.status === 'pass' ? 'PASS'
            : c.status === 'fail' ? 'FAIL'
            : 'CONDITIONAL',
          details: `${(item as any).room?.roomLabel ?? 'Room'}: actual=${c.actualValue ?? '?'} required=${c.requiredValue ?? '?'}`,
        });
      }
    }

    if (roomRules.length > 0) {
      setRuleEvaluations(prev => {
        const existingIds = new Set(prev.map(r => r.ruleId));
        const newRules = roomRules.filter(r => !existingIds.has(r.ruleId));
        return [...prev, ...newRules];
      });
    }
  }, [roomComplianceResults]);

  // Reset poll counter and clear stale overlay when a new analysis begins
  useEffect(() => {
    setRoomPollCount(0);
    setDetectedRoomsData([]);
    setAnalyzedPageDims(null);
    setEvalData(null);
    setRoomComplianceData([]);
    setBboxOverrides(new Map());
    setOriginalBboxes(new Map());
    setInteractingRoom(null);
    setPolygonEditMode(null);
    setDraggingVertexIdx(null);
  }, [analysisId]);

  useEffect(() => {
    if (roomsData !== undefined) {
      setRoomPollCount(c => c + 1);
    }
    if (roomsData?.rooms && roomsData.rooms.length > 0) {
      setDetectedRoomsData(roomsData.rooms);
      const hasPolygonsNow = roomsData.rooms.some((r: any) => r.polygonJson != null);
      setAnalysisProgress(prev => {
        if (prev.stage === 'idle') return prev;
        if (hasPolygonsNow) return { stage: 'evaluating', pct: 75, label: 'Evaluating compliance…' };
        return { stage: 'polygons', pct: 50, label: 'Rooms detected, tracing polygons…' };
      });
    } else if (roomsData !== undefined) {
      setAnalysisProgress(prev =>
        prev.stage === 'idle' ? prev : { stage: 'detecting', pct: 35, label: 'Detecting rooms…' }
      );
    }
    if (roomsData?.pages && roomsData.pages.length > 0) {
      const p = roomsData.pages[0];
      if (p.widthPx > 0 && p.heightPx > 0) {
        setAnalyzedPageDims({ width: p.widthPx, height: p.heightPx });
        console.log('[RoomOverlay] Analyzed page dims:', p.widthPx, 'x', p.heightPx);
      }
      if (p.detectedScale) {
        setDetectedScale(p.detectedScale);
      }
      setCurrentPageId(p.id);
      if (p.calibrationScale && pixelsPerDrawingUnit === 0) {
        setPixelsPerDrawingUnit(parseFloat(p.calibrationScale as unknown as string));
        setCalibrationRestored(true);
      }
      if (p.evalAccuracy != null && p.evalTotalRooms != null) {
        setEvalData({
          accuracy: parseFloat(p.evalAccuracy as unknown as string),
          passingRooms: p.evalPassingRooms ?? 0,
          totalRooms: p.evalTotalRooms,
          missedRooms: p.evalMissedRoomsJson
            ? JSON.parse(p.evalMissedRoomsJson as string)
            : [],
        });
        setAnalysisProgress(prev =>
          prev.stage === 'idle' ? prev : { stage: 'complete', pct: 100, label: 'Analysis complete' }
        );
        setTimeout(() => {
          setAnalysisProgress(prev => prev.stage === 'complete' ? { stage: 'idle', pct: 0, label: '' } : prev);
        }, 2000);
      }
    }
    const pollCapApproaching = roomPollCount >= 16;
    const hasRoomsInData = !!(roomsData?.rooms && roomsData.rooms.length > 0);
    const alreadyComplete = analysisProgress.stage === 'complete' || analysisProgress.stage === 'idle';
    if (pollCapApproaching && hasRoomsInData && !alreadyComplete) {
      setAnalysisProgress({ stage: 'complete', pct: 100, label: 'Analysis complete' });
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(p => p.stage === 'complete' ? { stage: 'idle', pct: 0, label: '' } : p), 2000);
    }
  }, [roomsData]);

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
        setDetectedRoomsData([]);
        setRoomComplianceData([]);
        setAnalysisId(null);
        setShowRoomOverlay(true);
        setShowComplianceHeatmap(false);
        setShowTravelDistanceOverlay(false);
        setAnalyzedPageDims(null);
        setCurrentPreviewPage(1);
      } else {
        // Existing image handling
        const reader = new FileReader();
        reader.onload = (e) => {
          setDrawingImage(e.target?.result as string);
          setDetectedRoomsData([]);
          setRoomComplianceData([]);
          setAnalysisId(null);
          setShowRoomOverlay(true);
          setShowComplianceHeatmap(false);
          setShowTravelDistanceOverlay(false);
          setAnalyzedPageDims(null);
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
      setDetectedRoomsData([]);
      setRoomComplianceData([]);
      setAnalysisId(null);
      setShowRoomOverlay(true);
      setShowComplianceHeatmap(false);
      setShowTravelDistanceOverlay(false);
      setAnalyzedPageDims(null);
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

  // Auto-select first project when list loads and no project is selected
  useEffect(() => {
    if (selectedProjectId === 0 && projectListQuery.data && projectListQuery.data.length > 0) {
      setSelectedProjectId(projectListQuery.data[0].id);
    }
  }, [projectListQuery.data, selectedProjectId]);

  // Persist selected project to localStorage
  useEffect(() => {
    if (selectedProjectId > 0) {
      localStorage.setItem('codecomply_last_project_id', String(selectedProjectId));
    }
  }, [selectedProjectId]);

  // Close project selector dropdown on outside click
  useEffect(() => {
    if (!showProjectSelector) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-project-selector]')) {
        setShowProjectSelector(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProjectSelector]);

  // ── Polygon vertex editor handlers ───────────────────────────────────────

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (polygonEditMode && polygonEditMode.vertices.length > 3) {
      const canvas = canvasRef.current;
      if (!canvas) { e.preventDefault(); return; }
      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const naturalW = imageRef.current?.naturalWidth ?? 0;
      const naturalH = imageRef.current?.naturalHeight ?? 0;
      const peScaleX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
        ? naturalW / analyzedPageDims.width : 1;
      const peScaleY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
        ? naturalH / analyzedPageDims.height : 1;
      const verts = polygonEditMode.vertices;
      for (let i = 0; i < verts.length; i++) {
        const sx = verts[i].x * peScaleX * zoom + pan.x;
        const sy = verts[i].y * peScaleY * zoom + pan.y;
        if (Math.hypot(canvasX - sx, canvasY - sy) <= 10) {
          e.preventDefault();
          setPolygonEditMode(prev => prev
            ? { ...prev, vertices: verts.filter((_, idx) => idx !== i) }
            : null);
          return;
        }
      }
    }
    e.preventDefault();
  };

  const handlePolygonEditCancel = () => {
    setPolygonEditMode(null);
    setDraggingVertexIdx(null);
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
  };

  const handlePolygonEditDone = () => {
    if (!polygonEditMode || !currentPageId) return;
    const room = detectedRoomsData.find(r => r.id === polygonEditMode.roomId);
    if (!room) return;

    const xs = polygonEditMode.vertices.map(v => v.x);
    const ys = polygonEditMode.vertices.map(v => v.y);
    const bbox = {
      x:      Math.min(...xs),
      y:      Math.min(...ys),
      width:  Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };

    saveCorrectionMutation.mutate({
      roomId:         polygonEditMode.roomId,
      pageId:         currentPageId,
      correctionType: 'boundary_redraw',
      previousValue: {
        label:       room.roomLabel,
        boundingBox: room.boundingBox,
        polygon:     (room as any).polygonJson ?? null,
      },
      correctedValue: {
        boundingBox: bbox,
        polygon:     polygonEditMode.vertices,
        vertexCount: polygonEditMode.vertices.length,
        source:      'manual_polygon',
      },
      planType: aiResults?.drawingType ?? 'floor_plan',
    });

    setBboxOverrides(prev => new Map(prev).set(polygonEditMode.roomId, bbox));
    setDetectedRoomsData(prev => prev.map(r =>
      r.id === polygonEditMode.roomId
        ? { ...r, boundingBox: bbox, polygonJson: polygonEditMode.vertices } as any
        : r,
    ));
    setPolygonEditMode(null);
    setDraggingVertexIdx(null);
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
    toast.success(`Polygon saved — ${polygonEditMode.vertices.length} vertices`);
  };

  // ─────────────────────────────────────────────────────────────────────────

  // Converts cropRegionConfirmed (stored in naturalWidth pixel space) to the
  // server's full-image pixel space (analyzedPageDims), which is what Sharp's
  // .extract() and the bounding-box restoration expect.
  const toServerCropRegion = (crop: { x: number; y: number; width: number; height: number } | null | undefined) => {
    if (!crop) return undefined;
    const naturalW = imageRef.current?.naturalWidth ?? 0;
    const naturalH = imageRef.current?.naturalHeight ?? 0;
    const sX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
      ? naturalW / analyzedPageDims.width : 1;
    const sY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
      ? naturalH / analyzedPageDims.height : 1;
    return {
      x: Math.round(crop.x / sX),
      y: Math.round(crop.y / sY),
      width: Math.round(crop.width / sX),
      height: Math.round(crop.height / sY),
    };
  };

  const resizeBase64Image = async (base64: string, targetWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, targetWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.replace(/^data:[^;]+;base64,/, ''));
      };
      img.onerror = reject;
      img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
    });
  };

  const handleReadFullSet = async () => {
    if (!pdfPages.length || !activeProjectId || !analysisId) return;
    setIsReadingContext(true);
    try {
      const thumbnailPages = await Promise.all(
        pdfPages.slice(0, 20).map(async (page, i) => ({
          pageNum: i + 1,
          base64: await resizeBase64Image(page, 400),
        }))
      );
      const result = await extractContextMutation.mutateAsync({
        projectId:         activeProjectId,
        drawingAnalysisId: analysisId ?? 0,
        pages:             thumbnailPages,
      });
      setSetContext(result.context);
      toast.success(
        `Context extracted — ${result.context.projectName ?? 'project'}, ` +
        `${Object.keys(result.context.abbreviations ?? {}).length} abbreviations loaded`
      );
      if (result.context.projectAddress && !addressInput) {
        const extractedAddress = result.context.projectAddress;
        const extractedMun = result.context.municipality ?? '';
        setAddressInput(extractedAddress);
        if (extractedMun) {
          const munLower = extractedMun.toLowerCase();
          if (munLower.includes('calgary')) setSelectedMunicipalityId('calgary');
          else if (munLower.includes('edmonton')) setSelectedMunicipalityId('edmonton');
          // Trigger lookup directly with the known values (avoids stale-closure on selectedMunicipalityId)
          setTimeout(async () => {
            setIsLookingUp(true);
            setLookupError(null);
            setZoneResult(null);
            try {
              const lookupResult = await zoneLookupMutation.mutateAsync({
                address: extractedAddress.trim(),
                municipality: munLower.includes('calgary') ? 'calgary' : 'edmonton',
                province: 'AB',
              });
              if ('error' in lookupResult) {
                setLookupError((lookupResult as any).error);
              } else {
                setZoneResult(lookupResult as any);
              }
            } catch {
              setLookupError('Auto-lookup failed — select zone manually');
            } finally {
              setIsLookingUp(false);
            }
          }, 300);
        }
      }
    } catch {
      toast.error('Context extraction failed');
    } finally {
      setIsReadingContext(false);
    }
  };

  const handleAddressLookup = async () => {
    if (!addressInput.trim() || !selectedMunicipalityId) return;
    setIsLookingUp(true);
    setLookupError(null);
    setZoneResult(null);
    try {
      const result = await zoneLookupMutation.mutateAsync({
        address:      addressInput.trim(),
        municipality: selectedMunicipalityId,
        province:     'AB',
      });
      if ('error' in result) {
        setLookupError((result as any).error);
      } else {
        setZoneResult(result as any);
      }
    } catch {
      setLookupError('Lookup failed — check address and try again');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleApplyZone = async () => {
    if (!zoneResult || !activeProjectId) return;
    setSelectedZone(zoneResult.zoneCode);
    setZoneConfirmed(true);
    try {
      await saveZoneMutation.mutateAsync({
        projectId:     activeProjectId,
        address:       addressInput,
        municipality:  selectedMunicipalityId,
        province:      'AB',
        zoneCode:      zoneResult.zoneCode,
        zoneName:      zoneResult.zoneName,
        communityName: zoneResult.communityName,
        lat:           zoneResult.lat,
        lng:           zoneResult.lng,
        source:        zoneResult.source,
      });
      toast.success(`Zone ${zoneResult.zoneCode} confirmed from city data`);
    } catch {
      toast.error('Failed to save zone to project');
    }
  };

  const handleClearOverlay = () => {
    setDetectedRoomsData([]);
    setEvalData(null);
    setRoomComplianceData([]);
    setBboxOverrides(new Map());
    setOriginalBboxes(new Map());
    setInteractingRoom(null);
    setPolygonEditMode(null);
    setDraggingVertexIdx(null);
    setAiResults(null);
    setShowAiResults(false);
    setRoomPollCount(0);
  };

  const handleStopAnalysis = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsAnalyzing(false);
    setAnalysisProgress({ stage: 'idle', pct: 0, label: '' });
    handleClearOverlay();
  };

  // Core analysis logic — call this only after all guards have passed.
  // effectiveProjectId: uses selectedProjectId if set, otherwise falls back to first
  // available project so the server's positive-int constraint is always satisfied.
  const triggerAnalysis = async () => {
    if (!drawingImage) return;
    const effectiveProjectId = selectedProjectId > 0
      ? selectedProjectId
      : (projectListQuery.data?.[0]?.id ?? 1);

    setIsAnalyzing(true);
    setAnalysisProgress({ stage: 'uploading', pct: 10, label: 'Uploading drawing…' });

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
            projectId: effectiveProjectId,
            imageBase64: base64Data,
            mimeType: "image/png",
            fileName: `${fileName || "drawing"}_page${pageNum}.png`,
            analysisType,
            analysisQuality,
            drawingType: drawingType as any,
            disclaimerAcknowledged: true,
            disclaimerVersion,
            cropRegion: toServerCropRegion(cropRegionConfirmed),
          });
          allNotes.push(`--- Page ${pageNum} ---`);
          const mappedRecs = (data.recommendations as Array<{priority: string; clause: string; description: string}>)
            .map(r => `[${r.priority.toUpperCase()}] ${r.clause}: ${r.description}`);
          allNotes.push(...mappedRecs);
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
      projectId: effectiveProjectId,
      imageBase64: base64Data,
      mimeType,
      fileName: fileName || "drawing.png",
      analysisType,
      analysisQuality,
      drawingType: drawingType as any,
      disclaimerAcknowledged: true,
      disclaimerVersion,
      cropRegion: toServerCropRegion(cropRegionConfirmed),
      drawingSetContext: setContext ?? undefined,
    });
  };

  // Guard function: shows confirmation dialog if no project is selected, otherwise
  // fires immediately. Kept as runAiAnalysis so internal Re-run buttons still work.
  const runAiAnalysis = async () => {
    if (!drawingImage) return;
    if (!disclaimerAcknowledged) {
      toast.error("You must acknowledge the disclaimer before running analysis.");
      return;
    }
    if (selectedProjectId === 0) {
      setShowNoProjectWarning(true);
      return;
    }
    await triggerAnalysis();
  };

  const handleAnalyzeClick = () => { runAiAnalysis(); };

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

    // ===== ROOM OVERLAY LAYER =====
    if (showRoomOverlay && detectedRoomsData?.length) {
      // Compute scale factor: Claude Vision may process images at a lower internal
      // resolution. If we stored the analyzed dimensions (widthPx/heightPx) and the
      // canvas image has different natural dimensions, scale bounding boxes accordingly.
      const naturalW = imageRef.current?.naturalWidth ?? 0;
      const naturalH = imageRef.current?.naturalHeight ?? 0;
      const scaleX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
        ? naturalW / analyzedPageDims.width : 1;
      const scaleY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
        ? naturalH / analyzedPageDims.height : 1;

      // Build per-room worst-case compliance level map
      const severityRank: Record<ComplianceLevel, number> = {
        critical: 5, major: 4, minor: 3, warning: 2, pass: 1, none: 0,
      };
      const heatmapMap = new Map<number, RoomHeatmapEntry>();

      for (const item of roomComplianceData) {
        let worstLevel: ComplianceLevel = 'none';
        for (const c of item.compliance) {
          if (c.status === 'not_applicable') continue;
          let level: ComplianceLevel;
          if (c.status === 'fail') {
            level = c.severity === 'critical' ? 'critical'
                  : c.severity === 'major'    ? 'major'
                  : 'minor';
          } else if (c.status === 'warning') {
            level = 'warning';
          } else {
            level = 'pass';
          }
          if (severityRank[level] > severityRank[worstLevel]) worstLevel = level;
        }
        if (worstLevel !== 'none') {
          heatmapMap.set(item.room.id, { level: worstLevel, source: 'compliance_engine' });
        }
      }

      // Merge travel distance failures (treat as 'major' unless engine already worse)
      for (const r of travelDistanceResults) {
        if (r.result !== 'fail') continue;
        const tdLevel: ComplianceLevel = 'major';
        const existing = heatmapMap.get(r.roomId);
        if (!existing) {
          heatmapMap.set(r.roomId, { level: tdLevel, source: 'travel_distance' });
        } else {
          const newLevel = severityRank[tdLevel] > severityRank[existing.level] ? tdLevel : existing.level;
          const newSource = existing.source === 'travel_distance' ? 'travel_distance' : 'both';
          heatmapMap.set(r.roomId, { level: newLevel, source: newSource });
        }
      }

      for (const room of detectedRoomsData) {
        const geometry = bboxOverrides.get(room.id) ?? room.boundingBox;
        if (!geometry) continue;

        const screenX = geometry.x * scaleX * zoom + pan.x;
        const screenY = geometry.y * scaleY * zoom + pan.y;
        const screenW = geometry.width * scaleX * zoom;
        const screenH = geometry.height * scaleY * zoom;

        const group = room.occupancyGroup ?? 'D';
        const colors = ROOM_OVERLAY_COLORS.occupancy[group as keyof typeof ROOM_OVERLAY_COLORS.occupancy]
          ?? { fill: 'rgba(100,100,100,0.2)', stroke: 'rgba(100,100,100,0.6)' };

        const heatmapEntry = heatmapMap.get(room.id);
        const useHeatmap = showComplianceHeatmap && !!heatmapEntry && heatmapEntry.level !== 'none';

        const fillColor = useHeatmap && heatmapEntry
          ? HEATMAP_COLORS[heatmapEntry.level].fill
          : colors.fill;
        const strokeColor = useHeatmap && heatmapEntry
          ? HEATMAP_COLORS[heatmapEntry.level].stroke
          : (heatmapEntry?.level === 'critical' || heatmapEntry?.level === 'major')
            ? ROOM_OVERLAY_COLORS.status.fail
            : colors.stroke;
        const isSevere = useHeatmap && heatmapEntry &&
          (heatmapEntry.level === 'critical' || heatmapEntry.level === 'major');

        const polygon: { x: number; y: number }[] | null =
          (reviewMode && bboxOverrides.has(room.id))
            ? null
            : (room as any).polygonJson;
        if (polygon && polygon.length >= 4) {
          ctx.beginPath();
          ctx.moveTo(polygon[0].x * scaleX * zoom + pan.x, polygon[0].y * scaleY * zoom + pan.y);
          for (let i = 1; i < polygon.length; i++) {
            ctx.lineTo(polygon[i].x * scaleX * zoom + pan.x, polygon[i].y * scaleY * zoom + pan.y);
          }
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.fill();
          if (room.flaggedForReview) {
            ctx.fillStyle = ROOM_OVERLAY_COLORS.status.flaggedFill;
            ctx.fill();
          }
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isSevere ? 2.5 : 1.5;
          ctx.setLineDash(room.flaggedForReview ? [4, 3] : []);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = fillColor;
          ctx.fillRect(screenX, screenY, screenW, screenH);
          if (room.flaggedForReview) {
            ctx.fillStyle = ROOM_OVERLAY_COLORS.status.flaggedFill;
            ctx.fillRect(screenX, screenY, screenW, screenH);
          }
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isSevere ? 2.5 : 1.5;
          ctx.setLineDash(room.flaggedForReview ? [4, 3] : []);
          ctx.strokeRect(screenX, screenY, screenW, screenH);
          ctx.setLineDash([]);
        }

        if (screenW > 40 && screenH > 20) {
          const fontSize = Math.max(9, Math.min(13, screenW / 8));
          ctx.font = `${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = 'rgba(0,0,0,0.85)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const label = room.roomLabel ?? 'Unknown';
          const shortLabel = label.length > 18 ? label.substring(0, 16) + '…' : label;
          ctx.fillText(shortLabel, screenX + screenW / 2, screenY + screenH / 2 - fontSize / 2);

          ctx.font = `bold ${fontSize - 1}px Inter, sans-serif`;
          ctx.fillStyle = colors.stroke;
          const badge = `Group ${group}${room.occupancyDivision ? '-' + room.occupancyDivision : ''}`;
          ctx.fillText(badge, screenX + screenW / 2, screenY + screenH / 2 + fontSize / 2 + 2);
        }

        if (room.flaggedForReview) {
          ctx.fillStyle = ROOM_OVERLAY_COLORS.status.flagged;
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('⚠', screenX + 4, screenY + 4);
        }

        // ⚠️ Polygon leak badge — amber pill at top-right when flood fill suspected leaky
        if ((room as any).polygonLeakSuspected && screenW > 24) {
          ctx.save();
          const badgeX = screenX + screenW - 29;
          const badgeY = screenY + 2;
          ctx.fillStyle = 'rgba(245,158,11,0.92)';
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, 27, 14, 4);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 8px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚠ poly', badgeX + 13, badgeY + 7);
          ctx.restore();
        }

        // Review mode: interactive handles + corrected/original border
        if (reviewMode) {
          ctx.save();
          const isCorrected = bboxOverrides.has(room.id);
          ctx.strokeStyle = isCorrected ? 'rgba(245, 158, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(screenX, screenY, screenW, screenH);
          ctx.setLineDash([]);
          const handles = getHandlePositions(screenX, screenY, screenW, screenH);
          for (const handle of handles) {
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, BBOX_HANDLE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          if (isCorrected) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
            ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText('✏ corrected', screenX + 2, screenY - 3);
          }
          ctx.restore();
        }
      }
    }
    // ===== END ROOM OVERLAY LAYER =====

    // ===== POLYGON EDIT MODE LAYER =====
    // Phase C integration point: ray-cast polygons from WallSegments render here too.
    // extractRoomPolygonFromWalls() in polygonExtractionService.ts (Phase C) will store
    // vertices in detectedRooms.polygonJson with polygonSource='ray_cast'; admins refine
    // using this same editor without any new rendering path.
    if (polygonEditMode) {
      const naturalW = imageRef.current?.naturalWidth ?? 0;
      const naturalH = imageRef.current?.naturalHeight ?? 0;
      const peScaleX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
        ? naturalW / analyzedPageDims.width : 1;
      const peScaleY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
        ? naturalH / analyzedPageDims.height : 1;
      const verts = polygonEditMode.vertices;

      ctx.save();

      // 1. Filled polygon
      ctx.beginPath();
      ctx.moveTo(verts[0].x * peScaleX * zoom + pan.x, verts[0].y * peScaleY * zoom + pan.y);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x * peScaleX * zoom + pan.x, verts[i].y * peScaleY * zoom + pan.y);
      }
      ctx.closePath();
      ctx.fillStyle   = 'rgba(20, 184, 166, 0.25)';
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.9)';
      ctx.lineWidth   = 2;
      ctx.fill();
      ctx.stroke();

      // 2. Vertex handles
      for (let i = 0; i < verts.length; i++) {
        const sx = verts[i].x * peScaleX * zoom + pan.x;
        const sy = verts[i].y * peScaleY * zoom + pan.y;
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fillStyle   = 'white';
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.9)';
        ctx.lineWidth   = 2;
        ctx.fill();
        ctx.stroke();
      }

      // 3. Midpoint handles (click-to-add-vertex targets)
      for (let i = 0; i < verts.length; i++) {
        const next = (i + 1) % verts.length;
        const mx = ((verts[i].x + verts[next].x) / 2) * peScaleX * zoom + pan.x;
        const my = ((verts[i].y + verts[next].y) / 2) * peScaleY * zoom + pan.y;
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fillStyle   = 'rgba(20, 184, 166, 0.4)';
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.8)';
        ctx.lineWidth   = 1.5;
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
    // ===== END POLYGON EDIT MODE LAYER =====

    // ===== TRAVEL DISTANCE OVERLAY LAYER =====
    if (showTravelDistanceOverlay && travelDistanceResults.length > 0) {
      const naturalW = imageRef.current?.naturalWidth ?? 0;
      const naturalH = imageRef.current?.naturalHeight ?? 0;
      const tdScaleX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
        ? naturalW / analyzedPageDims.width : 1;
      const tdScaleY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
        ? naturalH / analyzedPageDims.height : 1;

      // Build deduplicated exit map before drawing room lines
      const exitMap = new Map<number, { x: number; y: number; label: string }>();
      for (const r of travelDistanceResults) {
        if (r.nearestExitId !== null && r.exitCentroidX !== null && r.exitCentroidY !== null) {
          if (!exitMap.has(r.nearestExitId)) {
            exitMap.set(r.nearestExitId, {
              x: r.exitCentroidX * tdScaleX * zoom + pan.x,
              y: r.exitCentroidY * tdScaleY * zoom + pan.y,
              label: r.nearestExitLabel ?? 'Exit',
            });
          }
        }
      }

      for (const r of travelDistanceResults) {
        if (r.result === 'not_applicable' || r.result === 'unable_to_evaluate') continue;
        if (r.exitCentroidX === null || r.exitCentroidY === null || r.distanceM === null) continue;

        const color = r.result === 'pass' ? '#22c55e' : '#dc2626';
        const sx = r.centroidX * tdScaleX * zoom + pan.x;
        const sy = r.centroidY * tdScaleY * zoom + pan.y;
        const ex = r.exitCentroidX * tdScaleX * zoom + pan.x;
        const ey = r.exitCentroidY * tdScaleY * zoom + pan.y;
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead toward exit
        const angle = Math.atan2(ey - sy, ex - sx);
        const arrowSize = 8;
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize, -arrowSize / 2);
        ctx.lineTo(-arrowSize, arrowSize / 2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();

        // Room centroid dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Two-line margin pill at midpoint
        const margin = r.limit - r.distanceM;
        const line1 = r.result === 'pass'
          ? `${r.distanceM.toFixed(1)}m ✓`
          : `${r.distanceM.toFixed(1)}m ✗`;
        const line2 = r.result === 'pass'
          ? `${margin.toFixed(1)}m leeway`
          : `+${(-margin).toFixed(1)}m over`;
        const muteColor = r.result === 'pass' ? '#16a34a' : '#b91c1c';
        const pad = 3;

        ctx.font = 'bold 11px Inter, sans-serif';
        const tw1 = ctx.measureText(line1).width;
        ctx.font = '9px Inter, sans-serif';
        const tw2 = ctx.measureText(line2).width;
        const pillW = Math.max(tw1, tw2) + pad * 2;
        const pillH = 26;

        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillRect(mx - pillW / 2 - pad, my - pillH / 2 - pad, pillW + pad * 2, pillH + pad * 2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(line1, mx, my - 7);
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = muteColor;
        ctx.fillText(line2, mx, my + 7);

        ctx.restore();
      }

      // Exit node markers (drawn after all room lines so they appear on top)
      ctx.save();
      for (const [, exit] of exitMap) {
        ctx.beginPath();
        ctx.arc(exit.x, exit.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(22,163,74,0.90)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const exitLabelW = ctx.measureText('EXIT').width + 6;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(exit.x - exitLabelW / 2, exit.y + 13, exitLabelW, 13);
        ctx.fillStyle = '#15803d';
        ctx.fillText('EXIT', exit.x, exit.y + 14);

        const shortLabel = exit.label.length > 12 ? exit.label.substring(0, 12) + '…' : exit.label;
        ctx.font = '9px Inter, sans-serif';
        const slW = ctx.measureText(shortLabel).width + 6;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(exit.x - slW / 2, exit.y + 27, slW, 11);
        ctx.fillStyle = '#6b7280';
        ctx.fillText(shortLabel, exit.x, exit.y + 28);
      }
      ctx.restore();
    }
    // ===== END TRAVEL DISTANCE OVERLAY LAYER =====

    // ===== WINDOW MEASUREMENT LAYER =====
    if (measuredWindows.length > 0) {
      for (const win of measuredWindows) {
        const sx = win.position.x * zoom + pan.x;
        const sy = win.position.y * zoom + pan.y;
        const sw = win.pixelWidth * zoom;

        ctx.save();
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + sw, sy);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6);
        ctx.moveTo(sx + sw, sy - 6); ctx.lineTo(sx + sw, sy + 6);
        ctx.stroke();

        ctx.fillStyle = '#7c3aed';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${win.widthMm}×${win.heightMm}mm (${win.face})`, sx + sw / 2, sy - 10);
        ctx.restore();
      }
    }
    // ===== END WINDOW MEASUREMENT LAYER =====

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
      ctx.strokeStyle = isCalibrating ? "#10B981" : windowMeasureMode ? "#7c3aed" : "#3B82F6";
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

    // ===== BOUNDARY REDRAW RECT DRAFT =====
    if (boundaryRedrawMode === 'rect' && boundaryRectDraftRef.current) {
      const { x, y, width, height } = boundaryRectDraftRef.current;
      ctx.save();
      ctx.strokeStyle = 'rgba(239,68,68,0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x * zoom + pan.x, y * zoom + pan.y, width * zoom, height * zoom);
      ctx.setLineDash([]);
      ctx.restore();
    }

    // ===== POLYGON POINT COLLECTION PREVIEW =====
    if (boundaryRedrawMode === 'polygon' && polygonPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239,68,68,0.9)';
      ctx.fillStyle = 'rgba(239,68,68,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      polygonPoints.forEach((pt, i) => {
        const sx = pt.x * zoom + pan.x;
        const sy = pt.y * zoom + pan.y;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      polygonPoints.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x * zoom + pan.x, pt.y * zoom + pan.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // ===== WALL OVERLAY LAYER (admin/professional only) =====
    if (showWallOverlay && wallSegmentsList.length > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      for (const wall of wallSegmentsList) {
        ctx.beginPath();
        ctx.moveTo(wall.startX * zoom + pan.x, wall.startY * zoom + pan.y);
        ctx.lineTo(wall.endX   * zoom + pan.x, wall.endY   * zoom + pan.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ===== CROP REGION LAYER =====
    const cropToDraw = cropRegionDraftRef.current ?? cropRegionConfirmed;
    if (cropToDraw && imageLoaded) {
      const { x, y, width, height } = cropToDraw;
      const sx = x * zoom + pan.x;
      const sy = y * zoom + pan.y;
      const sw = width * zoom;
      const sh = height * zoom;
      const isDraft = !!cropRegionDraftRef.current;

      ctx.save();
      if (!isDraft) {
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(0, 0, canvas.width, sy);
        ctx.fillRect(0, sy + sh, canvas.width, canvas.height - sy - sh);
        ctx.fillRect(0, sy, sx, sh);
        ctx.fillRect(sx + sw, sy, canvas.width - sx - sw, sh);
      }
      ctx.strokeStyle = isDraft ? 'rgba(251,191,36,0.9)' : 'rgba(99,102,241,0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
      ctx.fillStyle = isDraft ? 'rgba(251,191,36,0.9)' : 'rgba(99,102,241,0.9)';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(
        isDraft ? `${width} × ${height} px` : 'Analysis Region',
        sx + 4, sy + 4,
      );
      ctx.restore();
    }
  }, [drawingImage, imageLoaded, zoom, pan, annotations, selectedAnnotation, showAnnotations, isDrawing, currentPoints, activeTool, isCalibrating, calibrationLine, isDraggingDimension, dragStartPoint, dragCurrentPoint, pixelsPerDrawingUnit, selectedScale, scaleSystem, imageRotation, measurementUnit, showDrawingLayer, drawingStrokes, currentStroke, showRoomOverlay, detectedRoomsData, analyzedPageDims, measuredWindows, windowMeasureMode, showTravelDistanceOverlay, travelDistanceResults, showComplianceHeatmap, roomComplianceData, cropRegionConfirmed, reviewMode, boundaryRedrawMode, polygonPoints, showWallOverlay, wallSegmentsList, bboxOverrides, interactingRoom, polygonEditMode, draggingVertexIdx]);

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

    // Boundary redraw — rect mode: start drag
    if (boundaryRedrawMode === 'rect') {
      boundaryRectDragStartRef.current = { x, y };
      boundaryRectDraftRef.current = null;
      return;
    }

    // Boundary redraw — polygon mode: add point or close on double-click
    if (boundaryRedrawMode === 'polygon' && selectedRoomForCorrection) {
      if (e.detail === 2 && polygonPoints.length >= 3) {
        const bbox = {
          x: Math.min(...polygonPoints.map(p => p.x)),
          y: Math.min(...polygonPoints.map(p => p.y)),
          width: Math.max(...polygonPoints.map(p => p.x)) - Math.min(...polygonPoints.map(p => p.x)),
          height: Math.max(...polygonPoints.map(p => p.y)) - Math.min(...polygonPoints.map(p => p.y)),
        };
        saveCorrectionMutation.mutate({
          roomId: selectedRoomForCorrection.id,
          pageId: currentPageId!,
          correctionType: 'boundary_redraw',
          previousValue: {
            label: selectedRoomForCorrection.roomLabel,
            boundingBox: selectedRoomForCorrection.boundingBox,
          },
          correctedValue: { polygon: polygonPoints, boundingBox: bbox },
          planType: aiResults?.drawingType ?? 'floor_plan',
        });
        setBoundaryRedrawMode(null);
        setPolygonPoints([]);
        setSelectedRoomForCorrection(null);
        toast.success('Boundary corrected');
        return;
      }
      setPolygonPoints(prev => [...prev, { x: Math.round(x), y: Math.round(y) }]);
      return;
    }

    // Polygon vertex editor: drag vertex or add vertex via midpoint
    if (polygonEditMode) {
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const naturalW = imageRef.current?.naturalWidth ?? 0;
      const naturalH = imageRef.current?.naturalHeight ?? 0;
      const peScaleX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
        ? naturalW / analyzedPageDims.width : 1;
      const peScaleY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
        ? naturalH / analyzedPageDims.height : 1;
      const verts = polygonEditMode.vertices;

      // Check vertex handles (drag existing vertex)
      for (let i = 0; i < verts.length; i++) {
        const sx = verts[i].x * peScaleX * zoom + pan.x;
        const sy = verts[i].y * peScaleY * zoom + pan.y;
        if (Math.hypot(canvasX - sx, canvasY - sy) <= 10) {
          setDraggingVertexIdx(i);
          return;
        }
      }

      // Check midpoint handles (add new vertex)
      for (let i = 0; i < verts.length; i++) {
        const next = (i + 1) % verts.length;
        const mx = ((verts[i].x + verts[next].x) / 2) * peScaleX * zoom + pan.x;
        const my = ((verts[i].y + verts[next].y) / 2) * peScaleY * zoom + pan.y;
        if (Math.hypot(canvasX - mx, canvasY - my) <= 7) {
          if (verts.length < 32) {
            const imgX = (canvasX - pan.x) / (peScaleX * zoom);
            const imgY = (canvasY - pan.y) / (peScaleY * zoom);
            const newVerts = [...verts];
            newVerts.splice(i + 1, 0, { x: Math.round(imgX), y: Math.round(imgY) });
            setPolygonEditMode(prev => prev ? { ...prev, vertices: newVerts } : null);
            setDraggingVertexIdx(i + 1);
          }
          return;
        }
      }

      return; // block all other interactions in polygon edit mode
    }

    // Review mode: drag/resize bounding boxes
    if (reviewMode && detectedRoomsData.length > 0) {
      const naturalW = imageRef.current?.naturalWidth ?? 0;
      const naturalH = imageRef.current?.naturalHeight ?? 0;
      const sX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
        ? naturalW / analyzedPageDims.width : 1;
      const sY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
        ? naturalH / analyzedPageDims.height : 1;

      // Image-space coords (same space as boundingBox values)
      const imgX = x / sX;
      const imgY = y / sY;
      // Canvas pixel coords (for hit-testing handles in screen space)
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Check handles first (higher priority than room body)
      let foundHandle: { roomId: number; id: HandleId } | null = null;
      for (const room of detectedRoomsData) {
        const g = bboxOverrides.get(room.id) ?? room.boundingBox;
        if (!g) continue;
        const rsx = g.x * sX * zoom + pan.x;
        const rsy = g.y * sY * zoom + pan.y;
        const rsw = g.width * sX * zoom;
        const rsh = g.height * sY * zoom;
        const handles = getHandlePositions(rsx, rsy, rsw, rsh);
        for (const h of handles) {
          if (Math.hypot(canvasX - h.x, canvasY - h.y) <= BBOX_HANDLE_RADIUS + 3) {
            foundHandle = { roomId: room.id, id: h.id };
            break;
          }
        }
        if (foundHandle) break;
      }

      if (foundHandle) {
        const { roomId, id: handleId } = foundHandle;
        if (!originalBboxes.has(roomId)) {
          setOriginalBboxes(prev => new Map(prev).set(
            roomId,
            bboxOverrides.get(roomId) ?? detectedRoomsData.find(r => r.id === roomId)!.boundingBox,
          ));
        }
        setInteractingRoom({
          roomId,
          mode: 'resize',
          handle: handleId,
          startMouseX: imgX,
          startMouseY: imgY,
          startBbox: bboxOverrides.get(roomId) ?? detectedRoomsData.find(r => r.id === roomId)!.boundingBox,
        });
        return;
      }

      // Check room body (move)
      const clickedRoom = detectedRoomsData.find(room => {
        const g = bboxOverrides.get(room.id) ?? room.boundingBox;
        if (!g) return false;
        const rsx = g.x * sX * zoom + pan.x;
        const rsy = g.y * sY * zoom + pan.y;
        const rsw = g.width * sX * zoom;
        const rsh = g.height * sY * zoom;
        return canvasX >= rsx && canvasX <= rsx + rsw && canvasY >= rsy && canvasY <= rsy + rsh;
      });
      if (clickedRoom) {
        if (!originalBboxes.has(clickedRoom.id)) {
          setOriginalBboxes(prev => new Map(prev).set(clickedRoom.id, clickedRoom.boundingBox));
        }
        setInteractingRoom({
          roomId: clickedRoom.id,
          mode: 'move',
          startMouseX: imgX,
          startMouseY: imgY,
          startBbox: bboxOverrides.get(clickedRoom.id) ?? clickedRoom.boundingBox,
        });
        return;
      }

      setCorrectionPopover(null);
      return;
    }

    // Crop region drag: start drawing the selection rectangle
    if (cropRegionMode) {
      cropDragStartRef.current = { x, y };
      cropRegionDraftRef.current = null;
      setIsDraggingCropRegion(true);
      return;
    }

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

    // Polygon vertex editor: live vertex drag + cursor
    if (polygonEditMode) {
      const naturalW = imageRef.current?.naturalWidth ?? 0;
      const naturalH = imageRef.current?.naturalHeight ?? 0;
      const peScaleX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
        ? naturalW / analyzedPageDims.width : 1;
      const peScaleY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
        ? naturalH / analyzedPageDims.height : 1;

      if (draggingVertexIdx !== null) {
        const imgX = (e.clientX - rect.left - pan.x) / (peScaleX * zoom);
        const imgY = (e.clientY - rect.top  - pan.y) / (peScaleY * zoom);
        const newVerts = [...polygonEditMode.vertices];
        newVerts[draggingVertexIdx] = { x: Math.round(imgX), y: Math.round(imgY) };
        setPolygonEditMode(prev => prev ? { ...prev, vertices: newVerts } : null);
        drawCanvas();
        return;
      }

      // Cursor hover
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const verts = polygonEditMode.vertices;
      for (let i = 0; i < verts.length; i++) {
        const sx = verts[i].x * peScaleX * zoom + pan.x;
        const sy = verts[i].y * peScaleY * zoom + pan.y;
        if (Math.hypot(canvasX - sx, canvasY - sy) <= 10) { canvas.style.cursor = 'crosshair'; return; }
        const next = (i + 1) % verts.length;
        const mx = ((verts[i].x + verts[next].x) / 2) * peScaleX * zoom + pan.x;
        const my = ((verts[i].y + verts[next].y) / 2) * peScaleY * zoom + pan.y;
        if (Math.hypot(canvasX - mx, canvasY - my) <= 7) { canvas.style.cursor = 'cell'; return; }
      }
      canvas.style.cursor = 'default';
      return;
    }

    // Review mode: live bbox update during drag/resize
    if (reviewMode) {
      const naturalW = imageRef.current?.naturalWidth ?? 0;
      const naturalH = imageRef.current?.naturalHeight ?? 0;
      const sX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
        ? naturalW / analyzedPageDims.width : 1;
      const sY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
        ? naturalH / analyzedPageDims.height : 1;
      const imgX = x / sX;
      const imgY = y / sY;

      if (interactingRoom) {
        const dx = imgX - interactingRoom.startMouseX;
        const dy = imgY - interactingRoom.startMouseY;
        const s = interactingRoom.startBbox;
        let newBbox = { ...s };

        if (interactingRoom.mode === 'move') {
          newBbox = { x: s.x + dx, y: s.y + dy, width: s.width, height: s.height };
        } else {
          switch (interactingRoom.handle) {
            case 'nw': newBbox = { x: s.x + dx, y: s.y + dy, width: s.width - dx, height: s.height - dy }; break;
            case 'n':  newBbox = { x: s.x,      y: s.y + dy, width: s.width,      height: s.height - dy }; break;
            case 'ne': newBbox = { x: s.x,      y: s.y + dy, width: s.width + dx, height: s.height - dy }; break;
            case 'e':  newBbox = { x: s.x,      y: s.y,      width: s.width + dx, height: s.height      }; break;
            case 'se': newBbox = { x: s.x,      y: s.y,      width: s.width + dx, height: s.height + dy }; break;
            case 's':  newBbox = { x: s.x,      y: s.y,      width: s.width,      height: s.height + dy }; break;
            case 'sw': newBbox = { x: s.x + dx, y: s.y,      width: s.width - dx, height: s.height + dy }; break;
            case 'w':  newBbox = { x: s.x + dx, y: s.y,      width: s.width - dx, height: s.height      }; break;
          }
          newBbox.width  = Math.max(newBbox.width,  30);
          newBbox.height = Math.max(newBbox.height, 20);
        }

        newBbox = {
          x: Math.round(newBbox.x),  y: Math.round(newBbox.y),
          width: Math.round(newBbox.width), height: Math.round(newBbox.height),
        };
        setBboxOverrides(prev => new Map(prev).set(interactingRoom.roomId, newBbox));
        drawCanvas();
        return;
      }

      // Cursor update when not dragging
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      let cursor = 'default';
      outer: for (const room of detectedRoomsData) {
        const g = bboxOverrides.get(room.id) ?? room.boundingBox;
        if (!g) continue;
        const rsx = g.x * sX * zoom + pan.x;
        const rsy = g.y * sY * zoom + pan.y;
        const rsw = g.width * sX * zoom;
        const rsh = g.height * sY * zoom;
        const handles = getHandlePositions(rsx, rsy, rsw, rsh);
        for (const h of handles) {
          if (Math.hypot(canvasX - h.x, canvasY - h.y) <= BBOX_HANDLE_RADIUS + 3) {
            cursor = HANDLE_CURSORS[h.id];
            break outer;
          }
        }
        if (canvasX >= rsx && canvasX <= rsx + rsw && canvasY >= rsy && canvasY <= rsy + rsh) {
          cursor = 'move';
          break;
        }
      }
      canvas.style.cursor = cursor;
    }

    // Boundary redraw rect: update live draft
    if (boundaryRedrawMode === 'rect' && boundaryRectDragStartRef.current) {
      const start = boundaryRectDragStartRef.current;
      boundaryRectDraftRef.current = {
        x: Math.round(Math.min(start.x, x)),
        y: Math.round(Math.min(start.y, y)),
        width: Math.round(Math.abs(x - start.x)),
        height: Math.round(Math.abs(y - start.y)),
      };
      drawCanvas();
      return;
    }

    // Crop region drag: update live draft
    if (isDraggingCropRegion && cropDragStartRef.current) {
      const start = cropDragStartRef.current;
      cropRegionDraftRef.current = {
        x: Math.round(Math.min(start.x, x)),
        y: Math.round(Math.min(start.y, y)),
        width: Math.round(Math.abs(x - start.x)),
        height: Math.round(Math.abs(y - start.y)),
      };
      drawCanvas();
      return;
    }

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

    // Room hover hit-test (for popover) — RAF-throttled to 60fps
    if (showRoomOverlay && detectedRoomsData.length > 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const capturedX = x;
      const capturedY = y;
      const capturedClientX = e.clientX;
      const capturedClientY = e.clientY;
      rafRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const naturalW = imageRef.current?.naturalWidth ?? 0;
        const naturalH = imageRef.current?.naturalHeight ?? 0;
        const hScaleX = (analyzedPageDims && naturalW > 0 && analyzedPageDims.width > 0)
          ? naturalW / analyzedPageDims.width : 1;
        const hScaleY = (analyzedPageDims && naturalH > 0 && analyzedPageDims.height > 0)
          ? naturalH / analyzedPageDims.height : 1;

        let found: { roomId: number; screenX: number; screenY: number } | null = null;
        for (const room of detectedRoomsData) {
          const bbox = room.boundingBox;
          if (!bbox) continue;
          const rx = bbox.x * hScaleX;
          const ry = bbox.y * hScaleY;
          const rw = bbox.width * hScaleX;
          const rh = bbox.height * hScaleY;
          if (capturedX >= rx && capturedX <= rx + rw && capturedY >= ry && capturedY <= ry + rh) {
            found = {
              roomId: room.id,
              screenX: capturedClientX - (canvas?.getBoundingClientRect().left ?? 0),
              screenY: capturedClientY - (canvas?.getBoundingClientRect().top ?? 0),
            };
            break;
          }
        }
        setHoveredRoom(found);
      });
    } else {
      setHoveredRoom(null);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Polygon vertex editor: release vertex drag
    if (polygonEditMode && draggingVertexIdx !== null) {
      setDraggingVertexIdx(null);
      return;
    }

    // Review mode: auto-save correction on drag/resize release
    if (reviewMode && interactingRoom) {
      const correctedBbox = bboxOverrides.get(interactingRoom.roomId);
      const room = detectedRoomsData.find(r => r.id === interactingRoom.roomId);
      const originalBbox = originalBboxes.get(interactingRoom.roomId) ?? room?.boundingBox;

      const didMove = correctedBbox && originalBbox && (
        correctedBbox.x !== originalBbox.x ||
        correctedBbox.y !== originalBbox.y ||
        correctedBbox.width  !== originalBbox.width ||
        correctedBbox.height !== originalBbox.height
      );

      if (!didMove && room) {
        // Short click with no movement — open correction popover
        setCorrectionPopover({ x: e.clientX, y: e.clientY, room });
        setInteractingRoom(null);
        return;
      }

      if (didMove && correctedBbox && originalBbox) {
        saveCorrectionMutation.mutate({
          roomId:         interactingRoom.roomId,
          pageId:         currentPageId!,
          correctionType: 'boundary_redraw',
          previousValue: {
            label:       room?.roomLabel ?? '',
            boundingBox: originalBbox,
          },
          correctedValue: {
            boundingBox: correctedBbox,
            delta: {
              dx: correctedBbox.x      - originalBbox.x,
              dy: correctedBbox.y      - originalBbox.y,
              dw: correctedBbox.width  - originalBbox.width,
              dh: correctedBbox.height - originalBbox.height,
            },
          },
          planType: aiResults?.drawingType ?? 'floor_plan',
        });
      }
      setInteractingRoom(null);
      return;
    }

    // Boundary redraw rect: finalize and save correction
    if (boundaryRedrawMode === 'rect' && selectedRoomForCorrection && boundaryRectDragStartRef.current) {
      const draft = boundaryRectDraftRef.current;
      boundaryRectDragStartRef.current = null;
      boundaryRectDraftRef.current = null;
      if (draft && draft.width > 5 && draft.height > 5) {
        saveCorrectionMutation.mutate({
          roomId: selectedRoomForCorrection.id,
          pageId: currentPageId!,
          correctionType: 'boundary_redraw',
          previousValue: {
            label: selectedRoomForCorrection.roomLabel,
            boundingBox: selectedRoomForCorrection.boundingBox,
          },
          correctedValue: { boundingBox: draft },
          planType: aiResults?.drawingType ?? 'floor_plan',
        });
        toast.success('Boundary corrected');
      }
      setBoundaryRedrawMode(null);
      setSelectedRoomForCorrection(null);
      return;
    }

    // Crop region drag: finalize the selection
    if (isDraggingCropRegion) {
      setIsDraggingCropRegion(false);
      const draft = cropRegionDraftRef.current;
      cropRegionDraftRef.current = null;
      if (draft && draft.width > 10 && draft.height > 10) {
        setCropRegionConfirmed(draft);
        toast.success('Analysis region set — click AI Analyze to re-analyze with this region.', { duration: 4000 });
      }
      setCropRegionMode(false);
      return;
    }

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

    if (windowMeasureMode && isDraggingDimension && dragStartPoint) {
      const pixelDistance = Math.sqrt(
        Math.pow(x - dragStartPoint.x, 2) +
        Math.pow(y - dragStartPoint.y, 2)
      );

      if (pixelDistance > 5 && pixelsPerDrawingUnit > 0) {
        const drawingUnits = pixelDistance / pixelsPerDrawingUnit;
        let widthMm: number;
        if (scaleSystem === 'imperial') {
          const realInches = drawingUnits * selectedScale.ratio;
          widthMm = Math.round(realInches * 25.4);
        } else {
          widthMm = Math.round(drawingUnits * selectedScale.ratio);
        }
        setPendingWindowMeasure({
          widthMm,
          position: { x: dragStartPoint.x, y: dragStartPoint.y },
          pixelWidth: pixelDistance,
        });
        setWindowMeasureMode(false);
      }
      setIsDraggingDimension(false);
      setDragStartPoint(null);
      setDragCurrentPoint(null);
    } else if (isDraggingDimension && dragStartPoint) {
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

  // Canvas vertical resize drag
  const startCanvasResize = (e: React.MouseEvent) => {
    e.preventDefault();
    canvasResizeStartRef.current = { y: e.clientY, h: canvasHeight };
    const onMove = (ev: MouseEvent) => {
      if (!canvasResizeStartRef.current) return;
      const delta = ev.clientY - canvasResizeStartRef.current.y;
      setCanvasHeight(h => Math.min(900, Math.max(300, canvasResizeStartRef.current!.h + delta)));
    };
    const onUp = () => {
      canvasResizeStartRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // WWR panel vertical resize drag
  const startWwrPanelResize = (e: React.MouseEvent) => {
    e.preventDefault();
    wwrPanelResizeRef.current = { y: e.clientY, h: wwrPanelHeight };
    const onMove = (ev: MouseEvent) => {
      if (!wwrPanelResizeRef.current) return;
      const delta = ev.clientY - wwrPanelResizeRef.current.y;
      setWwrPanelHeight(Math.min(900, Math.max(200, wwrPanelResizeRef.current.h + delta)));
    };
    const onUp = () => {
      wwrPanelResizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Handle mouse wheel for zoom (centered on cursor)
  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
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

  // Export compliance report as PDF
  const exportComplianceReport = () => {
    if (!complianceLevel && ruleEvaluations.length === 0 && pdIssues.length === 0) {
      toast.error("Run an analysis first before exporting.");
      return;
    }
    try {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const maxY = contentHeight(doc);
    const today = new Date().toLocaleDateString("en-CA");
    const reportTitle = "Drawing Compliance Report";

    let y = drawHeader(doc, reportTitle, today, analysisId != null ? String(analysisId) : "Drawing Analysis");

    if (complianceLevel) {
      y = drawStatusBanner(
        doc,
        complianceLevel,
        complianceScore !== null
          ? `Score: ${complianceScore} / 100  \xB7  ${complianceLevel.toUpperCase()}`
          : complianceLevel.toUpperCase(),
        y
      );
    }

    // Summary
    y = drawSectionBar(doc, "Summary", y);
    autoTable(doc, {
      startY: y,
      head: [["Field", "Value"]],
      body: [
        ["Drawing Type",     aiResults?.drawingType ?? "—"],
        ["Analysis Status",  analysisStatus ?? "—"],
        ["Compliance Level", complianceLevel ?? "—"],
        ["Compliance Score", complianceScore !== null ? `${complianceScore} / 100` : "—"],
        ["File",             fileName || "—"],
        ["Analysis ID",      analysisId ?? "—"],
      ],
      ...TABLE_STYLES,
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Rule Evaluations
    if (ruleEvaluations.length > 0) {
      if (y > maxY - 40) { doc.addPage(); y = drawHeader(doc, reportTitle, today, analysisId != null ? String(analysisId) : ""); }
      y = drawSectionBar(doc, "Rule Evaluations", y);
      autoTable(doc, {
        startY: y,
        head: [["Rule ID", "Clause", "Result", "Description"]],
        body: ruleEvaluations.map(r => [r.ruleId, r.clause, r.result, r.description]),
        ...TABLE_STYLES,
        styles: { ...TABLE_STYLES.styles, fontSize: 8, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22, halign: "center", fontStyle: "bold" } },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.section === "body") {
            const val = String(data.cell.raw);
            data.cell.styles.textColor = val === "PASS" ? C.green : val === "FAIL" ? C.red : C.amber;
          }
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Issues
    if (pdIssues.length > 0) {
      if (y > maxY - 40) { doc.addPage(); y = drawHeader(doc, reportTitle, today, analysisId != null ? String(analysisId) : ""); }
      y = drawSectionBar(doc, "Issues", y);
      autoTable(doc, {
        startY: y,
        head: [["Severity", "Clause", "Category", "Description", "Recommendation"]],
        body: pdIssues.map(i => [i.severity, i.clause, i.category, i.description, i.recommendation]),
        ...TABLE_STYLES,
        styles: { ...TABLE_STYLES.styles, fontSize: 8, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 18 }, 2: { cellWidth: 25 } },
        didParseCell: (data) => {
          if (data.column.index === 0 && data.section === "body") {
            const val = String(data.cell.raw).toLowerCase();
            data.cell.styles.textColor = val === "critical" ? C.red : val === "warning" ? C.amber : C.textMuted;
          }
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Recommendations
    if (pdRecommendations.length > 0) {
      if (y > maxY - 40) { doc.addPage(); y = drawHeader(doc, reportTitle, today, analysisId != null ? String(analysisId) : ""); }
      y = drawSectionBar(doc, "Recommendations", y);
      autoTable(doc, {
        startY: y,
        head: [["#", "Recommendation"]],
        body: pdRecommendations.map((r, i) => [String(i + 1), typeof r === "string" ? r : JSON.stringify(r)]),
        ...TABLE_STYLES,
        styles: { ...TABLE_STYLES.styles, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 10 }, 1: { overflow: "linebreak" } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Disclaimer section
    if (y > maxY - 30) { doc.addPage(); y = drawHeader(doc, reportTitle, today, analysisId != null ? String(analysisId) : ""); }
    y = drawSectionBar(doc, "Legal Disclaimer", y);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      "This report is generated by CodeComply and must be reviewed by a licensed professional before use in " +
      "construction or permit applications. AI analysis is provided for informational purposes only and does not " +
      "constitute professional engineering advice.",
      14, y, { maxWidth: pw - 28 }
    );

    drawFooters(doc, "CodeComply \xB7 Drawing Analyzer PD2.0 \xB7 NBC(AE) 2023", analysisId != null ? String(analysisId) : "");

    const safeName = (fileName || "drawing").replace(/\.[^/.]+$/, "");
    const idStr = analysisId ? `-${analysisId}` : "";
    doc.save(`drawing-analysis${idStr}-${safeName}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("PDF export failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Resize canvas to match container and recompute zoom/pan.
  // On first load (imageJustLoadedRef = true): resets zoom + pan to fit-and-center.
  // On subsequent calls (container resize): preserves user zoom, shifts pan by delta.
  const fitCanvasToContainer = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !containerRef.current || !img) return;

    const prevW = canvas.width;
    const prevH = canvas.height;

    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;

    if (imageJustLoadedRef.current) {
      const sx = canvas.width / img.width;
      const sy = canvas.height / img.height;
      const initialZoom = Math.min(sx, sy, 1) * 0.9;
      setZoom(initialZoom);
      setPan({
        x: (canvas.width - img.width * initialZoom) / 2,
        y: (canvas.height - img.height * initialZoom) / 2,
      });
      imageJustLoadedRef.current = false;
    } else if (prevW > 0 && prevH > 0) {
      // Shift pan so the image stays visually centred in the resized canvas
      const dx = (canvas.width - prevW) / 2;
      const dy = (canvas.height - prevH) / 2;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    }
  }, []); // stable: only refs + stable React state setters

  // Load image when drawing changes
  useEffect(() => {
    if (drawingImage) {
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        imageJustLoadedRef.current = true;
        fitCanvasToContainer();
        // Mark image as loaded to trigger redraw
        setImageLoaded(true);
      };
      img.src = drawingImage;
    } else {
      setImageLoaded(false);
      imageRef.current = null;
    }
  }, [drawingImage, fitCanvasToContainer]);

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

  // ResizeObserver: refit canvas when the container changes size (e.g. right panel opening).
  // Only active after the image is loaded. Preserves user zoom; shifts pan by size delta.
  useEffect(() => {
    if (!imageLoaded) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      fitCanvasToContainer();
      drawCanvas();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [imageLoaded, fitCanvasToContainer, drawCanvas]);

  // Sync canvas pixel buffer when user drags the resize handle.
  // Only updates canvas dimensions — never resets zoom or pan.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
      drawCanvas();
    }
  }, [canvasHeight, drawCanvas]);

  // Register wheel and touch events directly with { passive: false } so that
  // e.preventDefault() inside the handlers is allowed by the browser.
  // React 17+ attaches synthetic events at the root with passive:true, so any
  // preventDefault() call inside onWheel/onTouch* silently fails and generates
  // "Unable to preventDefault inside passive event listener" console errors.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventWheel = (e: WheelEvent) => e.preventDefault();
    canvas.addEventListener('wheel', preventWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', preventWheel);
  }, []);

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
              onAcknowledged={(version) => {
                setDisclaimerAcknowledged(true);
                setDisclaimerVersion(version);
              }}
            />
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
            // Upload area — two-column entry page
            <div>
              <div className="flex flex-col md:flex-row gap-6">
                {/* LEFT 60%: value statement + project selector + upload zone */}
                <div className="flex-[3] min-w-0 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Analyse a floor plan</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload, photograph, or sketch a plan — AI extracts rooms, dimensions, and travel distances, then checks against the Alberta Building Code.
                    </p>
                  </div>

                  {/* Project selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</Label>
                    <Select
                      value={selectedProjectId > 0 ? String(selectedProjectId) : ''}
                      onValueChange={(v) => setSelectedProjectId(Number(v))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={projectListQuery.isLoading ? 'Loading…' : 'Select a project'} />
                      </SelectTrigger>
                      <SelectContent>
                        {projectListQuery.data?.map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {disclaimerAcknowledged ? (
                    <>
                      {/* Primary upload zone */}
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-accent/40 transition-colors group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileUp className="w-10 h-10 mx-auto text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                        <p className="font-medium mb-1">Upload a drawing</p>
                        <p className="text-sm text-muted-foreground">PDF, PNG, JPG, JPEG · drag &amp; drop or click</p>
                      </div>

                      {/* Hidden file inputs — must stay rendered */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleCameraCapture}
                      />

                      {/* Secondary actions */}
                      <div className="flex items-center gap-5 text-sm">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => cameraInputRef.current?.click()}
                        >
                          <Camera className="w-4 h-4" />
                          Take photo
                        </button>
                        <span className="text-border select-none">·</span>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => {
                            const canvas = document.createElement('canvas');
                            canvas.width = 1200;
                            canvas.height = 900;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.fillStyle = '#FFFFFF';
                              ctx.fillRect(0, 0, canvas.width, canvas.height);
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
                            setDetectedRoomsData([]);
                            setRoomComplianceData([]);
                            setAnalysisId(null);
                            setShowRoomOverlay(true);
                            setShowComplianceHeatmap(false);
                            setShowTravelDistanceOverlay(false);
                            setAnalyzedPageDims(null);
                            setFileName('New Drawing');
                            setIsDrawMode(true);
                            setIsCanvasLocked(true);
                            setDrawingStrokes([]);
                            setDrawingHistory([[]]);
                            setHistoryIndex(0);
                          }}
                        >
                          <PenTool className="w-4 h-4" />
                          Sketch a plan
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg opacity-60">
                      <Lock className="w-8 h-8 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500 text-center">
                        Please accept the disclaimer below to access drawing analysis
                      </p>
                    </div>
                  )}
                </div>

                {/* RIGHT 40%: Recent Analyses */}
                <div className="flex-[2] min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Recent Analyses</span>
                  </div>
                  {!recentAnalyses || recentAnalyses.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No analyses yet for this project
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentAnalyses.slice(0, 5).map((a: any) => {
                        const hasThumbnail = a.drawingUrl?.startsWith('https://');
                        const proj = projectListQuery.data?.find(p => p.id === a.projectId);
                        const dateStr = new Date(a.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
                        const statusColor =
                          a.analysisStatus === 'VALID' ? 'bg-green-100 text-green-700' :
                          a.analysisStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          a.analysisStatus === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600';
                        return (
                          <button
                            key={a.id}
                            type="button"
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left group"
                            onClick={() => {
                              setAnalysisId(a.id);
                              if (a.drawingUrl?.startsWith('https://')) {
                                setDrawingImage(a.drawingUrl);
                                setDetectedRoomsData([]);
                                setRoomComplianceData([]);
                                setShowRoomOverlay(true);
                                setShowComplianceHeatmap(false);
                                setShowTravelDistanceOverlay(false);
                                setAnalyzedPageDims(null);
                              }
                            }}
                          >
                            <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                              {hasThumbnail ? (
                                <img src={a.drawingUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-medium truncate max-w-[120px]">{proj?.name ?? `Project ${a.projectId}`}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}>{a.analysisStatus}</span>
                                {a.complianceScore != null && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{a.complianceScore}%</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">{dateStr}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer strip */}
              <div className="mt-5 pt-4 border-t border-border/50 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">AI-Powered Analysis</span> — After uploading, the AI extracts dimensions, room labels, and travel distances, then checks compliance against the Alberta Building Code. For professional use only; always reviewed by a qualified professional.
                </p>
              </div>
            </div>
          ) : (
            // Drawing workspace
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg">

                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value as typeof analysisType)}
                    className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground h-8"
                    title="Select drawing type before analyzing"
                  >
                    <option value="comprehensive">Floor Plan</option>
                    <option value="structural">Structural / Framing</option>
                  </select>
                </div>

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
                  <button
                    onClick={() => setShowRoomOverlay(!showRoomOverlay)}
                    className={`p-1.5 rounded transition-colors ${
                      showRoomOverlay
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={showRoomOverlay ? 'Hide room overlays' : 'Show room overlays'}
                  >
                    <Layers className={`w-4 h-4 ${showRoomOverlay ? '' : 'opacity-40'}`} />
                  </button>
                  <button
                    onClick={() => setShowTravelDistanceOverlay(!showTravelDistanceOverlay)}
                    className={`p-1.5 rounded transition-colors text-xs font-medium ${
                      showTravelDistanceOverlay
                        ? 'bg-green-100 text-green-700'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={showTravelDistanceOverlay ? 'Hide travel distance overlay' : 'Show travel distance overlay (NBC 3.4.2.5)'}
                  >
                    <Ruler className={`w-4 h-4 ${showTravelDistanceOverlay ? '' : 'opacity-40'}`} />
                  </button>
                  <button
                    onClick={() => roomComplianceData.length > 0 && setShowComplianceHeatmap(!showComplianceHeatmap)}
                    className={`p-1.5 rounded transition-colors text-xs font-medium ${
                      showComplianceHeatmap
                        ? 'bg-red-100 text-red-700'
                        : roomComplianceData.length === 0
                          ? 'text-muted-foreground/40 cursor-not-allowed'
                          : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={
                      roomComplianceData.length === 0
                        ? 'Run compliance check first'
                        : showComplianceHeatmap
                          ? 'Hide compliance heatmap'
                          : 'Show compliance heatmap'
                    }
                  >
                    <BarChart2 className={`w-4 h-4 ${showComplianceHeatmap ? '' : 'opacity-40'}`} />
                  </button>
                  {canSeeWalls && (
                    <button
                      onClick={() => setShowWallOverlay(!showWallOverlay)}
                      className={`p-1.5 rounded transition-colors text-xs font-medium ${
                        showWallOverlay
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={showWallOverlay ? 'Hide wall overlay' : 'Show wall overlay (vector extraction)'}
                    >
                      <svg className={`w-4 h-4 ${showWallOverlay ? '' : 'opacity-40'}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="6" width="12" height="4" rx="0.5" />
                        <line x1="2" y1="2" x2="2" y2="14" />
                        <line x1="14" y1="2" x2="14" y2="14" />
                      </svg>
                    </button>
                  )}
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
                  {detectedScale && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200" title="Scale detected from drawing by AI — verify before calibrating">
                      <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z"/></svg>
                      {detectedScale}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (pixelsPerDrawingUnit === 0) {
                        toast.warning('Please calibrate the drawing scale first before measuring windows.');
                        return;
                      }
                      setWindowMeasureMode(!windowMeasureMode);
                      setIsCalibrating(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                      windowMeasureMode
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : pixelsPerDrawingUnit > 0
                          ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          : 'bg-white text-slate-300 border border-slate-200 cursor-not-allowed'
                    }`}
                    title={pixelsPerDrawingUnit === 0 ? 'Calibrate scale first' : 'Measure window widths for WWR calculation'}
                    disabled={pixelsPerDrawingUnit === 0}
                  >
                    <Square className="w-3.5 h-3.5" />
                    {windowMeasureMode ? 'Cancel Window' : 'Measure Window'}
                  </button>
                </div>

                {/* Project Selector */}
                <div className="relative flex items-center gap-1 border-r border-border pr-2" data-project-selector>
                  <button
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 min-w-[110px] max-w-[160px]"
                    onClick={() => setShowProjectSelector(v => !v)}
                    title="Select project to tie this scan to"
                  >
                    <Folder className="w-3.5 h-3.5 flex-shrink-0 text-purple-500" />
                    <span className="truncate flex-1 text-left">
                      {selectedProjectId > 0
                        ? (projectListQuery.data?.find(p => p.id === selectedProjectId)?.name ?? `Project ${selectedProjectId}`)
                        : 'Select project'}
                    </span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  </button>
                  {showProjectSelector && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white dark:bg-slate-900 border border-border rounded-lg shadow-lg overflow-hidden" data-project-selector>
                      <div className="p-2 border-b border-border">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileSearch className="w-3.5 h-3.5" />
                          <span>Tie scan to project</span>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {projectListQuery.isLoading ? (
                          <div className="p-3 text-xs text-muted-foreground text-center">Loading projects…</div>
                        ) : !projectListQuery.data || projectListQuery.data.length === 0 ? (
                          <div className="p-3 text-xs text-muted-foreground text-center">No projects found. Create a project first.</div>
                        ) : (
                          projectListQuery.data.map(project => (
                            <button
                              key={project.id}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => { setSelectedProjectId(project.id); setShowProjectSelector(false); }}
                            >
                              <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{project.name}</div>
                                {project.projectCode && (
                                  <div className="text-muted-foreground truncate">{project.projectCode}</div>
                                )}
                              </div>
                              {selectedProjectId === project.id && (
                                <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {drawingImage && (
                  <div className="flex items-center gap-1 border-r border-border pr-2">
                    <Button
                      variant={cropRegionMode ? "default" : cropRegionConfirmed ? "outline" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (cropRegionConfirmed) {
                          setCropRegionConfirmed(null);
                          cropRegionDraftRef.current = null;
                          toast.info('Analysis region cleared.');
                        } else {
                          setCropRegionMode(m => !m);
                        }
                      }}
                      title={
                        cropRegionConfirmed ? "Clear analysis region"
                        : cropRegionMode ? "Click and drag on the drawing to define the region"
                        : "Set analysis region by click-and-drag — only this area will be analyzed"
                      }
                      className={cropRegionMode ? "bg-amber-500 hover:bg-amber-600 text-white" : cropRegionConfirmed ? "border-indigo-500 text-indigo-600" : ""}
                    >
                      <Crop className="w-4 h-4 mr-1" />
                      {cropRegionConfirmed ? "Clear Region" : cropRegionMode ? "Drag to select…" : "Set Region"}
                    </Button>
                  </div>
                )}

                {drawingImage && (user?.role === 'admin' || user?.role === 'rule_editor') && (
                  <div className="flex items-center gap-1 border-r border-border pr-2">
                    <Button
                      variant={reviewMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setReviewMode(m => !m);
                        if (reviewMode) {
                          setCorrectionPopover(null);
                          setSelectedRoomForCorrection(null);
                          setBoundaryRedrawMode(null);
                          setPolygonPoints([]);
                          setPolygonEditMode(null);
                          setDraggingVertexIdx(null);
                        }
                      }}
                      title={reviewMode ? "Exit Review Mode" : "Enter Review Mode — click rooms to correct labels, occupancy, or boundaries"}
                      className={reviewMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                    >
                      <PenLine className="w-4 h-4 mr-1" />
                      {reviewMode ? "Reviewing…" : "Review"}
                    </Button>
                    {polygonEditMode && (
                      <div className="flex items-center gap-2 border-r border-border pr-2">
                        <span className="text-xs text-muted-foreground">
                          {polygonEditMode.vertices.length} vertices
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handlePolygonEditCancel}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handlePolygonEditDone}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Save Polygon
                        </Button>
                      </div>
                    )}
                    {reviewMode && boundaryRedrawMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setBoundaryRedrawMode(null); setPolygonPoints([]); }}
                        className="text-red-600 border-red-200 text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}

                {detectedRoomsData.length > 0 && (
                  <div className="flex items-center gap-1 border-r border-border pr-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearOverlay}
                      title="Clear detected rooms overlay"
                    >
                      <Eraser className="w-4 h-4 mr-1" />
                      Clear Overlay
                    </Button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex items-center gap-1 border-r border-border pr-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStopAnalysis}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      title="Stop analysis"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-1 border-r border-border pr-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAnalyzeClick}
                    disabled={isAnalyzing || !disclaimerAcknowledged || (pdfPages.length > 0 && selectedPages.length === 0)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    title={!disclaimerAcknowledged ? "Please accept disclaimer first" : pdfPages.length > 0 && selectedPages.length === 0 ? "Select at least one page to analyze" : "AI Analyze Drawing"}
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
                      // Reset all overlay and analysis state
                      setDetectedRoomsData([]);
                      setAnalyzedPageDims(null);
                      setRoomPollCount(0);
                      setEvalData(null);
                      setDetectedScale(null);
                      setShowRoomOverlay(true);
                      setShowTravelDistanceOverlay(false);
                      setShowComplianceHeatmap(false);
                      setShowCompliancePanel(false);
                      setComplianceResults([]);
                      setRuleEvaluations([]);
                      setRoomComplianceData([]);
                      setAnalysisId(null);
                      setAnalysisStatus(null);
                      setCurrentPageId(null);
                      setCalibrationRestored(false);
                      setPixelsPerDrawingUnit(0);
                      setIsCalibrating(false);
                      setCalibrationLine(null);
                      setReferenceValue("");
                      setMeasuredWindows([]);
                      setWindowMeasureMode(false);
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
                        let newPixelsPerUnit: number;
                        if (scaleSystem === "imperial") {
                          // Convert feet to inches, then divide by scale ratio to get drawing inches
                          const realInches = value * 12;
                          const drawingInches = realInches / selectedScale.ratio;
                          newPixelsPerUnit = pixelDistance / drawingInches;
                        } else {
                          // Convert meters to mm, then divide by scale ratio to get drawing mm
                          const realMm = value * 1000;
                          const drawingMm = realMm / selectedScale.ratio;
                          newPixelsPerUnit = pixelDistance / drawingMm;
                        }
                        setPixelsPerDrawingUnit(newPixelsPerUnit);
                        setCalibrationRestored(false);
                        if (currentPageId) {
                          saveCalibrationMutation.mutate({ pageId: currentPageId, calibrationScale: newPixelsPerUnit });
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
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {calibrationRestored ? '✓ Calibration restored' : 'Scale calibrated:'}
                  </span>
                  <span>{selectedScale.label}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{selectedScale.drawingType}</span>
                </div>
              )}

              {/* Part 4: Window height + face input after width is dragged */}
              {pendingWindowMeasure && (
                <div className="flex items-center gap-3 p-2 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200">
                  <Square className="w-4 h-4 text-purple-600" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-purple-700">Window measured:</span>
                    <span className="font-bold">{pendingWindowMeasure.widthMm}mm wide</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Height:</span>
                  <Input
                    type="number"
                    value={windowHeightInput}
                    onChange={(e) => setWindowHeightInput(e.target.value)}
                    placeholder="1200"
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                  <span className="text-sm text-muted-foreground">Face:</span>
                  <select
                    value={windowFaceInput}
                    onChange={(e) => setWindowFaceInput(e.target.value as 'N' | 'S' | 'E' | 'W' | 'unknown')}
                    className="h-8 text-xs border rounded px-2"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="N">North</option>
                    <option value="S">South</option>
                    <option value="E">East</option>
                    <option value="W">West</option>
                  </select>
                  <Button
                    size="sm"
                    onClick={() => {
                      const heightMm = parseFloat(windowHeightInput);
                      if (heightMm > 0 && pendingWindowMeasure) {
                        const areaM2 = Math.round(
                          (pendingWindowMeasure.widthMm / 1000) * (heightMm / 1000) * 100
                        ) / 100;
                        setMeasuredWindows(prev => [...prev, {
                          id: `win-${Date.now()}`,
                          face: windowFaceInput,
                          widthMm: pendingWindowMeasure.widthMm,
                          heightMm: Math.round(heightMm),
                          areaM2,
                          position: pendingWindowMeasure.position,
                          pixelWidth: pendingWindowMeasure.pixelWidth,
                        }]);
                        setPendingWindowMeasure(null);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Add Window
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingWindowMeasure(null)}>
                    Discard
                  </Button>
                </div>
              )}

              {/* WWR Summary panel — multi-storey + Step Code */}
              {measuredWindows.length > 0 && (
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="grid grid-cols-5 gap-4">

                    {/* LEFT — measurements (col-span-3) */}
                    <div className="col-span-3 space-y-2 overflow-y-auto" style={{ maxHeight: wwrPanelHeight }}>

                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">
                          Window Inventory ({measuredWindows.length} window{measuredWindows.length !== 1 ? 's' : ''})
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6"
                          onClick={() => { setMeasuredWindows([]); setWallLengthInputs({}); setWallAreaInputs({}); }}
                        >
                          Clear all
                        </Button>
                      </div>

                      {/* Window inventory table */}
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b">
                            <th className="text-left pb-1">Face</th>
                            <th className="text-right pb-1">Width</th>
                            <th className="text-right pb-1">Height</th>
                            <th className="text-right pb-1">Area</th>
                            <th className="text-right pb-1"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {measuredWindows.map((w) => (
                            <tr key={w.id} className="border-b border-slate-100">
                              <td className="py-1">
                                <span className={`font-bold ${
                                  w.face === 'S' ? 'text-amber-600' :
                                  w.face === 'W' ? 'text-red-600' :
                                  w.face === 'N' ? 'text-blue-600' :
                                  w.face === 'E' ? 'text-green-600' :
                                  'text-slate-400'
                                }`}>{w.face}</span>
                              </td>
                              <td className="text-right py-1">{w.widthMm}mm</td>
                              <td className="text-right py-1">{w.heightMm}mm</td>
                              <td className="text-right py-1 font-medium">{w.areaM2}m²</td>
                              <td className="text-right py-1">
                                <button
                                  onClick={() => setMeasuredWindows(prev => prev.filter(x => x.id !== w.id))}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                >✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Building Configuration */}
                      <div className="pt-2 pb-2 border-b border-slate-200 space-y-2">
                        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          Building Configuration
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">Above-grade storeys:</label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              defaultValue={storeyCount}
                              onBlur={(e) => {
                                const v = parseInt(e.target.value) || 1;
                                if (v !== storeyCount) setStoreyCount(v);
                              }}
                              className="w-14 h-6 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">Storey height:</label>
                            <Input
                              type="number"
                              step={0.1}
                              defaultValue={storeyHeightM}
                              onBlur={(e) => {
                                const v = parseFloat(e.target.value) || 2.7;
                                if (v !== storeyHeightM) setStoreyHeightM(v);
                              }}
                              className="w-16 h-6 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">m</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100">
                          <input
                            type="checkbox"
                            id="floorMultiplier"
                            checked={useFloorMultiplier}
                            onChange={(e) => setUseFloorMultiplier(e.target.checked)}
                            className="w-3.5 h-3.5"
                          />
                          <label htmlFor="floorMultiplier" className="text-xs text-blue-700 cursor-pointer">
                            All floors have identical window layout — multiply current measurements × {storeyCount} storey{storeyCount !== 1 ? 's' : ''}
                          </label>
                        </div>
                        {useFloorMultiplier && storeyCount > 1 && (
                          <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                            ✓ Glazing totals multiplied by {storeyCount}×. Measure windows on ONE floor only.
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground italic">
                          Measure windows on ALL floor plans before calculating WWR.
                          Enter total gross wall area for all above-grade storeys combined.
                        </p>
                      </div>

                      {/* Per-face glazing + wall length inputs */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-slate-600">
                          Glazing by Orientation — enter wall length for WWR:
                        </p>
                        {(['N', 'S', 'E', 'W'] as const).map(face => {
                          const faceWindows = measuredWindows.filter(w => w.face === face);
                          const totalGlazing = faceWindows.reduce((s, w) => s + w.areaM2, 0)
                            * (useFloorMultiplier ? storeyCount : 1);
                          if (faceWindows.length === 0) return null;
                          const wallArea = wallAreaInputs[face] ?? 0;
                          const wwr = wallArea > 0 ? Math.round(totalGlazing / wallArea * 1000) / 10 : null;
                          return (
                            <div key={face} className="space-y-0.5">
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className={`font-bold w-4 ${
                                  face === 'S' ? 'text-amber-600' :
                                  face === 'W' ? 'text-red-600' :
                                  face === 'N' ? 'text-blue-600' : 'text-green-600'
                                }`}>{face}</span>
                                <span>{faceWindows.length} win</span>
                                <span className="font-medium">{Math.round(totalGlazing * 100) / 100}m² glazing</span>
                                {/* Wall length → auto-compute gross wall area */}
                                <div className="flex items-center gap-1 ml-auto">
                                  <Input
                                    type="number"
                                    placeholder="wall m"
                                    className="w-16 h-6 text-xs"
                                    value={wallLengthInputs[face] ?? ''}
                                    onChange={(e) => {
                                      const len = parseFloat(e.target.value) || 0;
                                      setWallLengthInputs(prev => ({ ...prev, [face]: len || undefined }));
                                      const gross = Math.round(len * storeyHeightM * storeyCount * 100) / 100;
                                      setWallAreaInputs(prev => ({ ...prev, [face]: gross || undefined }));
                                    }}
                                  />
                                  <span className="text-xs text-muted-foreground">m ×</span>
                                  <span className="text-xs font-medium text-slate-600">
                                    {storeyHeightM}×{storeyCount}=
                                  </span>
                                  <span className="text-xs font-bold text-slate-700">
                                    {wallArea ? `${wallArea}m²` : '—'}
                                  </span>
                                </div>
                                {wwr !== null && (
                                  <span className={`font-bold text-xs px-1 rounded ${
                                    wwr > 40 ? 'text-red-700 bg-red-50' :
                                    wwr > 35 ? 'text-amber-700 bg-amber-50' :
                                    'text-green-700 bg-green-50'
                                  }`}>
                                    WWR {wwr}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Total row */}
                        <div className="flex items-center gap-2 text-xs pt-1 border-t">
                          <span className="font-bold text-slate-600">TOTAL</span>
                          <span className="font-medium">
                            {Math.round(measuredWindows.reduce((s, w) => s + w.areaM2, 0)
                              * (useFloorMultiplier ? storeyCount : 1) * 100) / 100}m² total glazing
                          </span>
                          {useFloorMultiplier && storeyCount > 1 && (
                            <span className="text-xs text-blue-600 ml-1">
                              ({Math.round(measuredWindows.reduce((s, w) => s + w.areaM2, 0) * 100) / 100}m² × {storeyCount} floors)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vertical divider */}
                    <div className="border-l border-slate-200" />

                    {/* RIGHT — Step Code results (col-span-2) */}
                    <div className="col-span-2 space-y-2 overflow-y-auto" style={{ maxHeight: wwrPanelHeight }}>
                      {(['N', 'S', 'E', 'W'] as const).some(f => (wallAreaInputs[f] ?? 0) > 0) ? (
                        <>
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            BC Energy Step Code — WWR Compliance
                          </p>

                          {[3, 4, 5].map(step => {
                            const limit = step === 3 ? 40 : step === 4 ? 35 : 30;
                            const ref = `BC Building Code 2024 Table 9.36.2.3.A — Step ${step}`;

                            const faceResults = (['N', 'S', 'E', 'W'] as const).map(face => {
                              const faceWindows = measuredWindows.filter(w => w.face === face);
                              if (faceWindows.length === 0) return null;
                              const wallArea = wallAreaInputs[face] ?? 0;
                              if (wallArea === 0) return null;
                              const glazing = faceWindows.reduce((s, w) => s + w.areaM2, 0)
                                * (useFloorMultiplier ? storeyCount : 1);
                              const wwr = (glazing / wallArea) * 100;
                              const passes = wwr <= limit;
                              const leeway = limit - wwr;
                              const maxAdditionalGlazingM2 = passes
                                ? Math.round((leeway / 100 * wallArea) * 100) / 100
                                : null;
                              const reductionNeededM2 = !passes
                                ? Math.round((glazing - (limit / 100 * wallArea)) * 100) / 100
                                : null;
                              const utilizationPct = Math.round(wwr / limit * 100);
                              return { face, wwr, passes, leeway, glazing, wallArea,
                                maxAdditionalGlazingM2, reductionNeededM2, utilizationPct, limit };
                            }).filter(Boolean) as NonNullable<{
                              face: 'N'|'S'|'E'|'W'; wwr: number; passes: boolean; leeway: number;
                              glazing: number; wallArea: number; maxAdditionalGlazingM2: number | null;
                              reductionNeededM2: number | null; utilizationPct: number; limit: number;
                            }>[];

                            if (faceResults.length === 0) return null;
                            const failingFaces = faceResults.filter(f => !f.passes);
                            const passingFaces = faceResults.filter(f => f.passes);
                            const allPass = failingFaces.length === 0;

                            return (
                              <div key={step} className={`rounded border p-2 space-y-1.5 ${
                                allPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                  <span className={`text-xs font-bold ${allPass ? 'text-green-700' : 'text-red-700'}`}>
                                    Step {step} — {allPass ? '✅ PASS' : '❌ FAIL'}
                                    <span className="font-normal text-muted-foreground ml-1">(max {limit}% WWR any face)</span>
                                  </span>
                                  <span className="text-xs text-muted-foreground italic">{ref}</span>
                                </div>

                                {failingFaces.map(f => (
                                  <div key={f.face} className="text-xs bg-white rounded p-1.5 border border-red-100 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`font-bold w-4 ${
                                        f.face==='W' ? 'text-red-600' : f.face==='S' ? 'text-amber-600' :
                                        f.face==='E' ? 'text-green-700' : 'text-blue-600'
                                      }`}>{f.face}</span>
                                      <span className="font-bold text-red-700">{Math.round(f.wwr * 10) / 10}% WWR</span>
                                      <span className="text-red-600">exceeds {limit}% by {Math.round((f.wwr - limit) * 10) / 10}%</span>
                                    </div>
                                    <p className="text-slate-500 pl-5">
                                      <span className="font-medium">Rule: </span>
                                      {ref} — No single above-grade wall face shall exceed {limit}% WWR for Step {step}.
                                    </p>
                                    <p className="text-red-700 pl-5">
                                      <span className="font-medium">To pass Step {step}: </span>
                                      Reduce {f.face}-facing glazing by{' '}
                                      <span className="font-bold">{f.reductionNeededM2}m²</span>
                                      {' '}(from {Math.round(f.glazing * 100) / 100}m² to{' '}
                                      {Math.round((f.glazing - f.reductionNeededM2!) * 100) / 100}m²).
                                    </p>
                                    <p className="text-slate-500 pl-5">
                                      <span className="font-medium">Alternatives: </span>
                                      Eliminate ~{Math.ceil(f.reductionNeededM2! / 1.5)} standard window(s) (~1.5m² each)
                                      or add opaque wall area on the {f.face} face.
                                    </p>
                                  </div>
                                ))}

                                {passingFaces.map(f => (
                                  <div key={f.face} className="text-xs bg-white rounded p-1.5 border border-green-100 space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`font-bold w-4 ${
                                        f.face==='W' ? 'text-red-600' : f.face==='S' ? 'text-amber-600' :
                                        f.face==='E' ? 'text-green-700' : 'text-blue-600'
                                      }`}>{f.face}</span>
                                      <span className="font-bold text-green-700">{Math.round(f.wwr * 10) / 10}% WWR</span>
                                      <span className="text-green-600">✓ {Math.round(f.leeway * 10) / 10}% below Step {step} limit</span>
                                      <div className="flex-1 max-w-20 bg-slate-200 rounded-full h-1.5">
                                        <div
                                          className={`h-1.5 rounded-full ${
                                            f.utilizationPct > 85 ? 'bg-amber-400' :
                                            f.utilizationPct > 60 ? 'bg-green-400' : 'bg-green-300'
                                          }`}
                                          style={{ width: `${Math.min(f.utilizationPct, 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-muted-foreground">{f.utilizationPct}% of limit used</span>
                                    </div>
                                    <p className="text-green-700 pl-5">
                                      <span className="font-medium">Leeway: </span>
                                      Up to <span className="font-bold">{f.maxAdditionalGlazingM2}m²</span> additional
                                      {f.face}-facing glazing still permitted.
                                      {f.utilizationPct > 85 && (
                                        <span className="text-amber-600 ml-1">⚠ Approaching limit — verify with energy model.</span>
                                      )}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            );
                          })}

                          <p className="text-xs text-muted-foreground italic pt-1 border-t">
                            Disclaimer: WWR calculated from measured glazing and entered wall dimensions.
                            Window heights estimated unless elevation drawings used.
                            Final Step Code compliance requires a HOT2000 energy model.
                          </p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground py-8 space-y-2">
                          <Zap className="w-6 h-6 text-slate-300" />
                          <p>Enter wall lengths on the left to see Step Code compliance results.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WWR panel resize handle */}
                  <div
                    className="mt-2 h-2 cursor-ns-resize bg-slate-100 hover:bg-purple-100 border-t border-slate-200 flex items-center justify-center transition-colors group rounded-b"
                    onMouseDown={startWwrPanelResize}
                  >
                    <div className="w-8 h-0.5 bg-slate-300 group-hover:bg-purple-400 rounded-full" />
                  </div>
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
                            setDetectedRoomsData([]);
                            setRoomComplianceData([]);
                            setAnalysisId(null);
                            setShowRoomOverlay(true);
                            setShowComplianceHeatmap(false);
                            setShowTravelDistanceOverlay(false);
                            setAnalyzedPageDims(null);
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
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Canvas column — user-resizable */}
                <div className="flex flex-col flex-1 min-w-0 relative">
                  <div
                    ref={containerRef}
                    className="w-full border border-border rounded-t-lg overflow-hidden bg-gray-100 dark:bg-gray-900 relative"
                    style={{ height: canvasHeight }}
                  >
                    {analysisProgress.stage !== 'idle' && (
                      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                          style={{ width: `${analysisProgress.pct}%` }}
                        />
                      </div>
                    )}
                    <canvas
                      ref={canvasRef}
                      className={`w-full h-full cursor-crosshair ${isCanvasLocked || isDrawMode ? 'touch-none' : 'touch-auto'}`}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={() => { handleCanvasMouseUp({ clientX: 0, clientY: 0 } as any); setHoveredRoom(null); }}
                      onWheel={handleCanvasWheel}
                      onTouchStart={handleCanvasTouchStart}
                      onTouchMove={handleCanvasTouchMove}
                      onTouchEnd={handleCanvasTouchEnd}
                      onContextMenu={handleCanvasContextMenu}
                    />
                  </div>
                  {/* Drag handle — resize canvas height */}
                  <div
                    onMouseDown={startCanvasResize}
                    className="h-2.5 rounded-b-lg border border-t-0 border-border bg-slate-100 hover:bg-purple-100 cursor-row-resize flex items-center justify-center group transition-colors select-none"
                    title="Drag to resize canvas"
                  >
                    <div className="w-10 h-0.5 rounded-full bg-slate-300 group-hover:bg-purple-400 transition-colors" />
                  </div>

                  {/* Compliance heatmap legend — shown when heatmap is active */}
                  {showComplianceHeatmap && (
                    <div className="mt-1 px-3 py-1.5 rounded bg-muted/60 border border-border text-[10px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium text-foreground">Compliance Heatmap:</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(220,38,38,0.65)' }} />Critical</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(239,68,68,0.55)' }} />Major</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(245,158,11,0.55)' }} />Minor / Warning</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(34,197,94,0.55)' }} />Pass</span>
                    </div>
                  )}

                  {/* Travel distance caveat + Save to Project — shown when overlay is active */}
                  {showTravelDistanceOverlay && (
                    <div className="mt-1 space-y-1">
                      <div className="px-3 py-1.5 rounded bg-muted/60 border border-border text-[10px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#22c55e' }} />
                          Pass
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#dc2626' }} />
                          Fail
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full inline-block border-2 border-white" style={{ background: 'rgba(22,163,74,0.90)', boxShadow: '0 0 0 1px #15803d' }} />
                          Exit node
                        </span>
                      </div>
                      <div className="px-3 py-1.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>
                          Travel distances are straight-line estimates. Actual path of travel may be longer.
                          Verify manually per NBC 3.4.2.5.
                        </span>
                      </div>
                      {(() => {
                        const worstFail = travelDistanceResults
                          .filter(r => r.result === 'fail' && r.distanceM !== null)
                          .sort((a, b) => (b.distanceM ?? 0) - (a.distanceM ?? 0))[0] ?? null;
                        if (!worstFail) return null;
                        const proj = projectListQuery.data?.find(p => p.id === selectedProjectId);
                        const sprinkVal = proj?.sprinklersRequired ? 'yes' : 'no';
                        // Map single-letter group back to a full occupancy code for the calculator
                        const occGroup = worstFail.roomLabel ? (
                          detectedRoomsData.find(r => r.id === worstFail.roomId)?.occupancyGroup ?? ''
                        ) : '';
                        // The calculator uses codes like "D", "C", "A-1" etc.; use group letter as fallback
                        const occCode = occGroup || 'D';
                        return (
                          <div className="flex justify-end">
                            <SaveCalculatorResultDialog
                              calculatorType="travelDistance"
                              inputData={{
                                occupancy: occCode,
                                sprinklered: sprinkVal,
                                actualDistance: worstFail.distanceM?.toFixed(1) ?? '',
                                deadEndCorridor: 'no',
                                source: 'drawing_overlay',
                                roomLabel: worstFail.roomLabel,
                              }}
                              resultData={{
                                maxAllowed: worstFail.limit,
                                actual: worstFail.distanceM,
                                compliant: false,
                                margin: worstFail.limit - (worstFail.distanceM ?? 0),
                                deadEndLimit: travelSprinklered ? 9 : 6,
                                limitSource: worstFail.limitSource,
                              }}
                            >
                              <button className="px-2 py-1 rounded text-xs font-medium bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1">
                                <Save className="w-3 h-3" />
                                Save worst-case to project
                              </button>
                            </SaveCalculatorResultDialog>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Room hover popover */}
                  {hoveredRoom && showRoomOverlay && (() => {
                    const room = detectedRoomsData.find(r => r.id === hoveredRoom.roomId);
                    if (!room) return null;
                    const tdResult = showTravelDistanceOverlay
                      ? travelDistanceResults.find(r => r.roomId === hoveredRoom.roomId)
                      : null;
                    return (
                      <div
                        className="absolute z-50 pointer-events-none bg-popover border border-border rounded-md shadow-lg p-3 text-xs w-56"
                        style={{ left: hoveredRoom.screenX + 12, top: hoveredRoom.screenY - 8 }}
                      >
                        <div className="font-semibold text-sm mb-1">{room.roomLabel ?? 'Unknown'}</div>
                        <div className="space-y-0.5 text-muted-foreground">
                          {room.occupancyGroup && (
                            <div>Occupancy: Group {room.occupancyGroup}{room.occupancyDivision ? `-${room.occupancyDivision}` : ''}</div>
                          )}
                          {room.areaSqm && (
                            <div>Area: {Number(room.areaSqm).toFixed(1)} m²</div>
                          )}
                          {room.floorLevel && <div>Level: {room.floorLevel}</div>}
                        </div>
                        {tdResult && tdResult.result !== 'not_applicable' && (
                          <>
                            <div className="my-2 border-t border-border" />
                            <div className="font-medium text-foreground mb-1">Travel Distance (Est.)</div>
                            <div className="space-y-0.5 text-muted-foreground">
                              {tdResult.result === 'unable_to_evaluate' ? (
                                <div className="text-amber-600 space-y-0.5">
                                  {tdResult.distanceM !== null ? (
                                    <>
                                      <div>Measured: {tdResult.distanceM.toFixed(1)} m</div>
                                      <div>Limit: {tdResult.limit} m (conservative default — occupancy unknown)</div>
                                      {tdResult.nearestExitLabel && <div>Nearest exit: {tdResult.nearestExitLabel}</div>}
                                    </>
                                  ) : (
                                    <div>Unable to evaluate — {pixelsPerMm === null ? 'calibrate scale first' : 'no exits detected'}</div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <div>Measured: {tdResult.distanceM?.toFixed(1)} m</div>
                                  <div>
                                    Limit (NBC 3.4.2.5): {tdResult.limit} m{travelSprinklered ? ' (sprinklered)' : ''}
                                    {tdResult.limitSource === 'default_conservative' && (
                                      <span className="text-amber-600"> *default</span>
                                    )}
                                  </div>
                                  {tdResult.nearestExitLabel && <div>Nearest exit: {tdResult.nearestExitLabel}</div>}
                                  {tdResult.result === 'pass' && tdResult.distanceM !== null ? (
                                    <div className="mt-1 text-green-700">
                                      <div className="font-semibold">✓ PASS</div>
                                      <div>{(tdResult.limit - tdResult.distanceM).toFixed(1)}m within limit ({((tdResult.distanceM / tdResult.limit) * 100).toFixed(0)}% of limit used)</div>
                                      <div>Up to {(tdResult.limit - tdResult.distanceM).toFixed(1)}m additional travel permitted</div>
                                    </div>
                                  ) : tdResult.result === 'fail' && tdResult.distanceM !== null ? (
                                    <div className="mt-1 text-red-700">
                                      <div className="font-semibold">✗ FAIL</div>
                                      <div>Exceeds limit by {(tdResult.distanceM - tdResult.limit).toFixed(1)}m</div>
                                      <div>Reduce travel path or add exit access</div>
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Phase 5B — Correction Popover (admin/rule_editor) */}
                  {correctionPopover && (
                    <div
                      className="fixed z-[60] bg-popover border border-border rounded-lg shadow-xl p-4 w-72 text-sm"
                      style={{ left: correctionPopover.x + 8, top: correctionPopover.y - 8 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Correct Room</span>
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => { setCorrectionPopover(null); setSelectedRoomForCorrection(null); }}
                        >✕</button>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3 font-medium truncate">
                        {correctionPopover.room.roomLabel} · Group {correctionPopover.room.occupancyGroup}
                        {correctionPopover.room.polygonLeakSuspected && (
                          <span className="ml-2 text-amber-600">⚠ leak suspected</span>
                        )}
                      </div>
                      <div className="space-y-3">
                        {/* Label rename */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Rename label</label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              defaultValue={correctionPopover.room.roomLabel}
                              id="correction-label-input"
                              className="flex-1 text-xs border rounded px-2 py-1 bg-background"
                              placeholder="New label…"
                            />
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                const el = document.getElementById('correction-label-input') as HTMLInputElement;
                                const newLabel = el?.value?.trim();
                                if (!newLabel || !currentPageId) return;
                                saveCorrectionMutation.mutate({
                                  roomId: correctionPopover.room.id,
                                  pageId: currentPageId,
                                  correctionType: 'label_rename',
                                  previousValue: { label: correctionPopover.room.roomLabel },
                                  correctedValue: { label: newLabel },
                                  planType: aiResults?.drawingType ?? 'floor_plan',
                                });
                                setCorrectionPopover(null);
                                setSelectedRoomForCorrection(null);
                              }}
                              disabled={saveCorrectionMutation.isPending}
                            >
                              Save
                            </Button>
                          </div>
                        </div>

                        {/* Occupancy change */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Change occupancy group</label>
                          <div className="flex gap-1">
                            <select
                              id="correction-occ-select"
                              defaultValue={correctionPopover.room.occupancyGroup ?? 'D'}
                              className="flex-1 text-xs border rounded px-2 py-1 bg-background"
                            >
                              {['A', 'B', 'C', 'D', 'E', 'F'].map(g => (
                                <option key={g} value={g}>Group {g}</option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                const el = document.getElementById('correction-occ-select') as HTMLSelectElement;
                                const newGroup = el?.value;
                                if (!newGroup || !currentPageId) return;
                                saveCorrectionMutation.mutate({
                                  roomId: correctionPopover.room.id,
                                  pageId: currentPageId,
                                  correctionType: 'occupancy_change',
                                  previousValue: { label: correctionPopover.room.roomLabel, occupancyGroup: correctionPopover.room.occupancyGroup },
                                  correctedValue: { occupancyGroup: newGroup },
                                  planType: aiResults?.drawingType ?? 'floor_plan',
                                });
                                setCorrectionPopover(null);
                                setSelectedRoomForCorrection(null);
                              }}
                              disabled={saveCorrectionMutation.isPending}
                            >
                              Save
                            </Button>
                          </div>
                        </div>

                        {/* Boundary redraw */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Redraw boundary</label>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs"
                              onClick={() => {
                                setBoundaryRedrawMode('rect');
                                setCorrectionPopover(null);
                                toast.info('Drag a rectangle over the correct room boundary', { duration: 3000 });
                              }}
                            >
                              Rect
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs"
                              onClick={() => {
                                setBoundaryRedrawMode('polygon');
                                setPolygonPoints([]);
                                setCorrectionPopover(null);
                                toast.info('Click to add vertices — double-click to close polygon', { duration: 4000 });
                              }}
                            >
                              Polygon
                            </Button>
                          </div>
                        </div>

                        {/* Edit Polygon */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs"
                          onClick={() => {
                            const existingPolygon = (correctionPopover.room as any).polygonJson;
                            const bbox = correctionPopover.room.boundingBox;
                            const vertices = existingPolygon && existingPolygon.length >= 3
                              ? existingPolygon
                              : [
                                  { x: bbox.x,              y: bbox.y               },
                                  { x: bbox.x + bbox.width, y: bbox.y               },
                                  { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
                                  { x: bbox.x,              y: bbox.y + bbox.height },
                                ];
                            setPolygonEditMode({
                              roomId:           correctionPopover.room.id,
                              vertices,
                              originalVertices: vertices,
                            });
                            setCorrectionPopover(null);
                          }}
                        >
                          <Pentagon className="w-3 h-3 mr-1" />
                          Edit Polygon
                        </Button>

                        {/* Delete false positive */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            if (!currentPageId) return;
                            saveCorrectionMutation.mutate({
                              roomId: correctionPopover.room.id,
                              pageId: currentPageId,
                              correctionType: 'false_positive_delete',
                              previousValue: { label: correctionPopover.room.roomLabel, boundingBox: correctionPopover.room.boundingBox },
                              correctedValue: { deleted: true },
                              planType: aiResults?.drawingType ?? 'floor_plan',
                            });
                            setCorrectionPopover(null);
                            setSelectedRoomForCorrection(null);
                          }}
                          disabled={saveCorrectionMutation.isPending}
                        >
                          Mark as false positive
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Side panel */}
                <div className="w-full lg:w-80 space-y-4">

                  {/* Drawing Set Context — shown when PDF has multiple pages */}
                  {pdfPages.length > 1 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-blue-800">Drawing Set Context</p>
                          {setContext ? (
                            <p className="text-xs text-blue-600 mt-0.5 truncate">
                              {setContext.projectName ?? 'Project'} · {setContext.buildingOccupancy ?? 'Unknown type'} · {setContext.confirmedScale ?? 'Scale unknown'}
                            </p>
                          ) : (
                            <p className="text-xs text-blue-500 mt-0.5">Read all pages to improve detection accuracy</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={setContext ? "outline" : "default"}
                          onClick={handleReadFullSet}
                          disabled={isReadingContext || pdfPages.length === 0}
                          className="text-xs shrink-0"
                        >
                          {isReadingContext ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Reading…</>
                          ) : setContext ? (
                            <><RefreshCw className="w-3 h-3 mr-1" />Re-read</>
                          ) : (
                            <><BookOpen className="w-3 h-3 mr-1" />Read Full Set</>
                          )}
                        </Button>
                      </div>
                      {setContext && (
                        <div className="mt-2 pt-2 border-t border-blue-200 grid grid-cols-2 gap-1 text-xs">
                          {setContext.municipality && (
                            <span className="text-blue-700">📍 {setContext.municipality}</span>
                          )}
                          {setContext.codeEdition && (
                            <span className="text-blue-700">📋 {setContext.codeEdition}</span>
                          )}
                          {setContext.numberOfStoreys && (
                            <span className="text-blue-700">🏠 {setContext.numberOfStoreys} storeys{setContext.basementPresent ? ' + bsmt' : ''}</span>
                          )}
                          {setContext.confirmedScale && (
                            <span className="text-blue-700">📐 {setContext.confirmedScale}</span>
                          )}
                          {Object.keys(setContext.abbreviations ?? {}).length > 0 && (
                            <span className="text-blue-700 col-span-2">
                              🔤 {Object.keys(setContext.abbreviations!).length} abbreviations loaded
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Municipality/Zone selection */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Compliance Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Address → Zone auto-lookup */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Project Address</Label>
                        <div className="flex gap-1.5">
                          <Input
                            value={addressInput}
                            onChange={e => setAddressInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddressLookup()}
                            placeholder="109 Silverhorn Terrace SW"
                            className="text-sm h-8 flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddressLookup}
                            disabled={isLookingUp || !addressInput.trim()}
                            className="h-8 px-2 shrink-0"
                            title="Look up zone for this address"
                          >
                            {isLookingUp
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <MapPin className="w-3.5 h-3.5" />
                            }
                          </Button>
                        </div>
                        {zoneResult && (
                          <div className="rounded-md bg-green-50 border border-green-200 p-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-green-800">{zoneResult.zoneCode}</p>
                                <p className="text-xs text-green-700 mt-0.5">{zoneResult.zoneName}</p>
                                {zoneResult.communityName && (
                                  <p className="text-xs text-green-600 mt-0.5">{zoneResult.communityName}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleApplyZone}
                                className="text-xs h-6 border-green-400 text-green-700 hover:bg-green-100 shrink-0"
                              >
                                Apply
                              </Button>
                            </div>
                            <p className="text-xs text-green-500 mt-1">
                              Source: {zoneResult.source === 'calgary_arcgis'
                                ? 'City of Calgary Land Use Viewer'
                                : 'City of Edmonton Open Data'}
                            </p>
                          </div>
                        )}
                        {lookupError && (
                          <p className="text-xs text-amber-600">⚠ {lookupError} — select zone manually below</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs">Municipality</Label>
                        <Select value={selectedMunicipalityId} onValueChange={(v) => {
                          setSelectedMunicipalityId(v);
                          setSelectedZone("");
                          setZoneConfirmed(false);
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
                        <Label className="text-xs">
                          Zone
                          {zoneConfirmed && (
                            <span className="ml-1.5 text-green-600 font-normal text-[10px]">✓ confirmed from city data</span>
                          )}
                        </Label>
                        <Select value={selectedZone} onValueChange={v => { setSelectedZone(v); setZoneConfirmed(false); }}>
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

                      {/* Analysis Quality selector */}
                      <div>
                        <Label className="text-xs">Analysis Quality</Label>
                        <div className="mt-1 space-y-1">
                          {(
                            [
                              { value: "fast",     label: "Fast",     desc: "Quick overview — compressed images, faster results", time: "~10–15 sec" },
                              { value: "standard", label: "Standard", desc: "Balanced — good for most floor plans",                time: "~20–30 sec" },
                              { value: "detailed", label: "Detailed", desc: "Maximum detail — best for complex structural drawings", time: "~45–60 sec" },
                            ] as const
                          ).map(({ value, label, desc, time }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setAnalysisQuality(value)}
                              className={`w-full text-left px-2 py-1.5 rounded border text-xs transition-colors ${
                                analysisQuality === value
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              <span className="font-medium text-foreground">{label}</span>
                              <span className="ml-1 text-[10px] text-muted-foreground">{time}</span>
                              <br />
                              <span className="text-[10px] leading-tight">{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sprinkler System — read from project settings */}
                      {selectedProjectId > 0 && (() => {
                        const proj = projectListQuery.data?.find(p => p.id === selectedProjectId);
                        const isSprinklered = !!proj?.sprinklersRequired;
                        return (
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-muted-foreground">Sprinkler System</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-medium ${isSprinklered ? 'text-green-700' : 'text-muted-foreground'}`}>
                                {isSprinklered ? 'Yes (45m limit)' : 'No (25m limit)'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Drawing Type selector */}
                      <div>
                        <Label className="text-xs">Drawing Type</Label>
                        <Select value={drawingType} onValueChange={setDrawingType}>
                          <SelectTrigger className="h-8 text-xs mt-1">
                            <SelectValue placeholder="Auto-detect" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-detect</SelectItem>
                            <SelectItem value="residential_multi_unit">Residential — Multi-Unit</SelectItem>
                            <SelectItem value="residential_single_family">Residential — Single Family</SelectItem>
                            <SelectItem value="commercial_office">Commercial — Office</SelectItem>
                            <SelectItem value="institutional">Institutional</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="mixed_use">Mixed Use</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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

                  {/* Compliance Findings Panel — NBC 3.4.2.5 */}
                  {travelDistanceResults.some(r => r.result === 'pass' || r.result === 'fail') && (() => {
                    const tdPass = travelDistanceResults.filter(r => r.result === 'pass').length;
                    const tdFail = travelDistanceResults.filter(r => r.result === 'fail').length;
                    const tdUnable = travelDistanceResults.filter(r => r.result === 'unable_to_evaluate').length;
                    const worstCase = [...travelDistanceResults]
                      .filter(r => r.result === 'fail')
                      .sort((a, b) => (b.distanceM ?? 0) - (a.distanceM ?? 0))[0] ?? null;
                    const sortedFindings = [...travelDistanceResults]
                      .filter(r => r.result === 'pass' || r.result === 'fail')
                      .sort((a, b) => {
                        if (a.result === 'fail' && b.result !== 'fail') return -1;
                        if (a.result !== 'fail' && b.result === 'fail') return 1;
                        return (b.distanceM ?? 0) - (a.distanceM ?? 0);
                      });
                    const visibleFindings = showAllFindings ? sortedFindings : sortedFindings.slice(0, 5);
                    const jurisdictionLabel = selectedMunicipalityId.charAt(0).toUpperCase() + selectedMunicipalityId.slice(1);
                    return (
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-primary" />
                            Compliance Findings
                          </CardTitle>
                          <CardDescription className="text-xs">NBC 3.4.2.5 · Travel Distance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">

                          {/* Badge summary */}
                          <div className="flex flex-wrap gap-1.5">
                            {tdPass > 0 && (
                              <Badge className="text-[10px] bg-green-100 text-green-800 hover:bg-green-100 border-0">
                                ✓ {tdPass} Pass{tdPass !== 1 ? 'es' : ''}
                              </Badge>
                            )}
                            {tdFail > 0 && (
                              <Badge className="text-[10px] bg-red-100 text-red-800 hover:bg-red-100 border-0">
                                ✗ {tdFail} Fail{tdFail !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {tdUnable > 0 && (
                              <Badge className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">
                                ? {tdUnable} Unable to evaluate
                              </Badge>
                            )}
                          </div>

                          {/* Worst-case finding */}
                          {worstCase && (() => {
                            const wcRoom = detectedRoomsData.find((r: any) => r.id === worstCase.roomId);
                            const wcOccupancy: string | null = wcRoom?.occupancyGroup ?? null;
                            return (
                              <div className="rounded border border-red-200 bg-red-50 p-2.5 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    EGR-{String(worstCase.roomId).padStart(3, '0')}
                                  </span>
                                  <Badge className="text-[10px] bg-red-600 text-white hover:bg-red-600 border-0">✗ FAIL</Badge>
                                </div>
                                <p className="font-semibold text-foreground truncate">{worstCase.roomLabel}</p>
                                <div className="space-y-0.5 text-muted-foreground">
                                  <p><span className="font-medium text-foreground">Measured:</span> {(worstCase.distanceM ?? 0).toFixed(1)} m</p>
                                  <p><span className="font-medium text-foreground">Limit:</span> {worstCase.limit} m (NBC 3.4.2.5)</p>
                                  {worstCase.nearestExitLabel && (
                                    <p><span className="font-medium text-foreground">Exit:</span> {worstCase.nearestExitLabel}</p>
                                  )}
                                  {wcOccupancy && (
                                    <p><span className="font-medium text-foreground">Occupancy:</span> Group {wcOccupancy.charAt(0)}</p>
                                  )}
                                  <p>
                                    <span className="font-medium text-foreground">Limit source:</span>{' '}
                                    {worstCase.limitSource === 'occupancy_specific' ? 'Occupancy-specific' : 'Conservative default'}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* All findings list */}
                          <div className="space-y-1">
                            {visibleFindings.map(r => (
                              <div key={r.roomId} className="flex items-center justify-between text-xs py-0.5">
                                <span className="truncate flex-1 mr-2 text-muted-foreground">{r.roomLabel}</span>
                                <span className="text-muted-foreground mr-2 shrink-0">
                                  {r.distanceM != null ? `${r.distanceM.toFixed(1)} m` : '—'}
                                </span>
                                {r.result === 'pass' ? (
                                  <Badge className="text-[10px] bg-green-100 text-green-800 hover:bg-green-100 border-0 shrink-0">PASS</Badge>
                                ) : (
                                  <Badge className="text-[10px] bg-red-100 text-red-800 hover:bg-red-100 border-0 shrink-0">FAIL</Badge>
                                )}
                              </div>
                            ))}
                            {sortedFindings.length > 5 && (
                              <button
                                type="button"
                                className="text-[10px] text-primary hover:underline"
                                onClick={() => setShowAllFindings(v => !v)}
                              >
                                {showAllFindings ? 'Show fewer' : `Show all ${sortedFindings.length} findings`}
                              </button>
                            )}
                          </div>

                          {/* Assumptions */}
                          <div className="rounded bg-amber-50 border border-amber-200 p-2 space-y-0.5 text-[10px] text-amber-800">
                            <p className="font-semibold flex items-center gap-1 mb-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Assumptions
                            </p>
                            <p>· Scale: {selectedScale.label} (user-calibrated)</p>
                            <p>· Method: Straight-line (Euclidean)</p>
                            <p>· Sprinklered: {travelSprinklered ? 'Yes' : 'No'}</p>
                            <p>· Exits identified by: room label match</p>
                            <p>· Path of travel not yet traced — verify along centerline manually</p>
                          </div>

                          {/* NBC Reference */}
                          <p className="text-[10px] text-muted-foreground font-mono">
                            NBC 3.4.2.5.(1) · {jurisdictionLabel} Edition
                          </p>

                          {/* Overlay toggle */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              {showTravelDistanceOverlay ? (
                                <span className="text-[10px] text-green-700 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                  Overlay active
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="text-[10px] text-primary hover:underline"
                                  onClick={() => setShowTravelDistanceOverlay(true)}
                                >
                                  Show on drawing ↗
                                </button>
                              )}
                            </div>
                            <div>
                              {showComplianceHeatmap ? (
                                <span className="text-[10px] text-red-700 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                  Heatmap active
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={`text-[10px] ${roomComplianceData.length > 0 ? 'text-primary hover:underline' : 'text-muted-foreground/50 cursor-not-allowed'}`}
                                  onClick={() => roomComplianceData.length > 0 && setShowComplianceHeatmap(true)}
                                  title={roomComplianceData.length === 0 ? 'Run compliance check first' : undefined}
                                >
                                  Show heatmap ↗
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Save to Project */}
                          {projectId && tdFail > 0 && worstCase && (
                            <SaveCalculatorResultDialog
                              calculatorType="travelDistance"
                              inputData={{
                                source: 'drawing_analysis',
                                drawingId: analysisId,
                                scale: selectedScale.label,
                                sprinklered: travelSprinklered,
                                municipality: selectedMunicipalityId,
                              }}
                              resultData={{
                                worstCaseRoomId: worstCase.roomId,
                                worstCaseRoomLabel: worstCase.roomLabel,
                                worstCaseDistanceM: worstCase.distanceM,
                                worstCaseLimit: worstCase.limit,
                                worstCaseExitLabel: worstCase.nearestExitLabel,
                                passCount: tdPass,
                                failCount: tdFail,
                                unableCount: tdUnable,
                                nbcClause: '3.4.2.5',
                              }}
                            >
                              <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                                <Save className="w-3.5 h-3.5" />
                                Save Findings to Project
                              </Button>
                            </SaveCalculatorResultDialog>
                          )}

                        </CardContent>
                      </Card>
                    );
                  })()}

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

              {/* No-rooms polling exhausted banner */}
              {detectedRoomsData.length === 0 && roomPollCount >= 40 && analysisId !== null && (
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground border-t">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  No rooms detected — try re-running with a different drawing type selected
                </div>
              )}

              {/* Room detection status + quality panel */}
              {detectedRoomsData.length > 0 && (
                <div className="border-t bg-muted/30 rounded-b-lg -mt-1 text-xs">
                  {/* Basic count row */}
                  <div className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>{detectedRoomsData.length} room(s) detected</span>
                    {detectedRoomsData.filter((r: any) => r.flaggedForReview).length > 0 && (
                      <span className="text-amber-600">
                        · {detectedRoomsData.filter((r: any) => r.flaggedForReview).length} flagged for review
                      </span>
                    )}
                    {!evalData && (
                      <span className="ml-auto text-muted-foreground/60 italic">evaluating accuracy…</span>
                    )}
                  </div>

                  {/* Quality panel — shown once eval data arrives */}
                  {evalData && (() => {
                    const pct = Math.round(evalData.accuracy * 100);
                    const color = pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-amber-500' : 'text-red-500';
                    const barColor = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-500';
                    const lowAccuracy = pct < 80;
                    return (
                      <div className="px-3 pb-2.5 space-y-1.5 border-t border-dashed border-border/50 pt-2">
                        {/* Accuracy bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground shrink-0">Detection quality</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`font-semibold tabular-nums shrink-0 ${color}`}>{pct}%</span>
                          <span className="text-muted-foreground shrink-0">{evalData.passingRooms}/{evalData.totalRooms} verified</span>
                        </div>

                        {/* Missed rooms */}
                        {evalData.missedRooms.length > 0 && (
                          <div className="text-amber-600">
                            <span className="font-medium">Possibly missed: </span>
                            {evalData.missedRooms.slice(0, 4).join(', ')}
                            {evalData.missedRooms.length > 4 && ` +${evalData.missedRooms.length - 4} more`}
                          </div>
                        )}

                        {/* Re-run suggestion */}
                        {lowAccuracy && (
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="text-muted-foreground">
                              ⚠ Some rooms may be missing. Re-running may improve accuracy.
                            </span>
                            <button
                              onClick={runAiAnalysis}
                              disabled={isAnalyzing}
                              className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              Re-run
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* AI Analysis Results — full width below canvas */}
              {showAiResults && aiResults && (
                <Card className="border-purple-200 dark:border-purple-800 mt-4" data-results-panel>
                  <CardHeader className="py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2 flex-wrap">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI Analysis Results
                        {selectedProjectId > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-normal">
                            <Folder className="w-3 h-3" />
                            {projectListQuery.data?.find(p => p.id === selectedProjectId)?.name ?? `Project ${selectedProjectId}`}
                          </span>
                        )}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setShowAiResults(false)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </div>

                    {/* Notes — full width */}
                    {aiResults.notes.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Notes</div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-muted-foreground">
                          {aiResults.notes.map((note, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={applyAiResults}
                      className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Apply to Annotations
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* PD2.0 Professional Review Panel — full width below canvas */}
              {analysisId !== null && analysisStatus !== null && (
                <div className="mt-4">
                  <ProfessionalReviewPanel
                    analysisId={analysisId}
                    analysisStatus={analysisStatus}
                    complianceScore={complianceScore}
                    complianceLevel={complianceLevel}
                    ruleEvaluations={ruleEvaluations as any}
                    issues={pdIssues}
                    recommendations={pdRecommendations}
                    onStatusChange={(newStatus) => setAnalysisStatus(newStatus)}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* No-project confirmation dialog */}
      <AlertDialog open={showNoProjectWarning} onOpenChange={setShowNoProjectWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-500" />
              No Project Selected
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This analysis will not be linked to any project.
                Results will be saved as a standalone scan and may
                be harder to find later.
              </p>
              <p className="text-amber-600 font-medium">
                We recommend linking analyses to a project for
                organized compliance tracking and professional review.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowNoProjectWarning(false);
                setShowProjectSelector(true);
              }}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Select Project
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowNoProjectWarning(false);
                triggerAnalysis();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Continue Without Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DrawingAnalysis;
