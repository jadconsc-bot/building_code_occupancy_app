export interface BoundingBox {
  x: number;      // pixels from left
  y: number;      // pixels from top
  width: number;  // pixels
  height: number; // pixels
}

export interface DetectedFeature {
  type: 'door' | 'door_fire_rated' | 'window' | 'stair' | 'elevator' |
        'exit_sign' | 'fire_extinguisher' | 'sprinkler_head' |
        'kitchen_sink' | 'stove' | 'toilet' | 'bathroom_sink' |
        'lab_bench' | 'fume_hood' | 'nursing_station' |
        'retail_counter' | 'reception_desk' | 'fixed_seating' |
        'loading_dock' | 'emergency_lighting';
  position: { x: number; y: number };
  confidence: number;
  count?: number;
  metadata?: Record<string, unknown>;
}

export interface DetectedRoom {
  label: string;
  boundingBox: BoundingBox;
  areaSqm: number;
  floorLevel: string;      // "Ground Floor" | "Level 2" | "Basement"
  occupancyGroup: string;  // A|B|C|D|E|F
  occupancyDivision: number | null;
  confidence: number;      // 0-1
  features: DetectedFeature[];
  flags: string[];         // "insufficient_egress" | "fire_separation_required"
}

export interface DrawingMetadata {
  drawingType: 'floor_plan' | 'site_plan' | 'elevation' | 'section' | 'unknown';
  scale: string;
  floorLevel: string;
  totalDetectedArea: number;
  northArrow: boolean;
  dimensionsVisible: boolean;
  language: 'en' | 'fr' | 'mixed';
  drawingQuality: 'cad' | 'hand_drawn' | 'scanned' | 'unknown';
}

export interface RoomDetectionResult {
  rooms: DetectedRoom[];
  metadata: DrawingMetadata;
  pageNumber: number;
  modelVersion: string;
  processingTimeMs: number;
  flaggedForReview: DetectedRoom[];  // confidence < 0.7
}
