# Phase C — Room Polygon Detection & Compliance Overlays
## CodeComply Drawing Analyzer
## Spec Date: June 6, 2026
## Status: READY FOR IMPLEMENTATION

---

## OBJECTIVE

Replace the failed sharp flood-fill approach (ratio=0.006 always failing)
with DDA (Digital Differential Analyzer) ray casting for accurate room 
polygon detection from scanned PDF floor plans. This enables Archistar-quality
compliance overlays rendered directly on the drawing canvas.

---

## CONTEXT — WHY PHASE C MATTERS

Archistar's core differentiator is pixel-perfect compliance overlays rendered
on top of submitted drawings. Their advantage: they work from BIM (structured
geometry). CodeComply's input is scanned PDFs — Phase C closes this gap by
building room polygon detection from raw pixels using ray casting.

Phase 3 (already shipped) has:
  ✅ Travel distance overlay (NBC 3.4.2.5)
  ✅ Compliance heatmap (severity-driven room fill)
  ✅ Exit route visualization with arrowheads
  ✅ Findings panel with Issue IDs + NBC clauses
  ✅ Canvas ResizeObserver

Phase C adds:
  → Accurate room boundary polygons from raw pixel data
  → Wall segment detection
  → Door/window location tagging
  → Per-room compliance overlays (egress, fire, spatial separation)

---

## VALIDATED ARCHITECTURE (May 29, 2026)

### Why flood-fill failed
Sharp flood fill with ratio=0.006 always fails because:
- Scanned PDFs have JPEG artifacts creating gray pixels along walls
- Walls are not 100% black — they vary from 50-255 gray
- Flood fill bleeds through thin walls via artifact pixels
- ratio threshold can never be tuned to work reliably

### DDA Ray Casting — the correct approach

```
ALGORITHM:
  1. Seed point = OCR label centroid (from Azure Doc Intelligence)
     e.g. "BEDROOM 1" label → centroid at (x=420, y=380)
     
  2. Ignore radius = ~25px around seed point
     Filters label text pixels from being treated as walls
     
  3. User draws lines across door openings with Draw tool
     These strokes are composited onto the canvas as dark pixel barriers
     BEFORE ray casting runs
     
  4. getImageData() captures drawing + annotations + user strokes in ONE pass
     
  5. Cast 360 rays from seed point at 1° increments
     Each ray walks pixel-by-pixel using DDA until it hits a dark pixel (wall)
     Dark pixel threshold: luminance < 80 (captures gray walls from JPEG)
     
  6. Ray endpoints form the room polygon boundary
     360 points → convex/concave hull → room polygon
     
  7. User refines polygon vertices after auto-detection
     Drag individual vertices to correct misdetections
     
  8. Polygon saved to detectedRooms table in DB
```

### DDA Ray Walking Code Pattern

```typescript
function castRay(
  imageData: ImageData,
  originX: number,
  originY: number,
  angleDeg: number,
  maxDistance: number,
  ignoreRadius: number,
  darkThreshold: number = 80
): { x: number; y: number; distance: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);
  
  let x = originX;
  let y = originY;
  
  for (let d = 0; d < maxDistance; d++) {
    x += dx;
    y += dy;
    
    const px = Math.round(x);
    const py = Math.round(y);
    
    if (px < 0 || py < 0 || px >= imageData.width || py >= imageData.height) {
      return { x: px, y: py, distance: d };
    }
    
    // Skip ignore radius around seed point
    const distFromOrigin = Math.sqrt(
      (px - originX) ** 2 + (py - originY) ** 2
    );
    if (distFromOrigin < ignoreRadius) continue;
    
    // Check pixel luminance
    const idx = (py * imageData.width + px) * 4;
    const r = imageData.data[idx];
    const g = imageData.data[idx + 1];
    const b = imageData.data[idx + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    if (luminance < darkThreshold) {
      return { x: px, y: py, distance: d };
    }
  }
  
  return { x: Math.round(x), y: Math.round(y), distance: maxDistance };
}
```

---

## IMPLEMENTATION SPEC

### STEP 1 — Door Barrier Draw Tool

**File: client/src/components/DrawingAnalysis.tsx**

Add a "Door Barriers" mode to the existing toolbar:

```
Toolbar modes (existing + new):
  [Pan] [Zoom] [Fire Assembly] [Travel Distance] [Door Barriers] [Select Room]
```

Door Barriers mode behavior:
- User clicks and drags across a door opening
- Stroke rendered as a 4px dark line (rgba(0,0,0,255)) on an overlay canvas
- These strokes persist per drawing page (saved to DB as JSON array)
- Applied to imageData BEFORE ray casting runs

State:
```typescript
const [doorBarriers, setDoorBarriers] = useState<
  Array<{ x1: number; y1: number; x2: number; y2: number }>
>([]);
```

Draw handler:
```typescript
// On mousedown in door barrier mode
const startBarrier = (e: MouseEvent) => {
  barrierStart.current = canvasToImageCoords(e.clientX, e.clientY);
};

// On mouseup in door barrier mode  
const endBarrier = (e: MouseEvent) => {
  const end = canvasToImageCoords(e.clientX, e.clientY);
  setDoorBarriers(prev => [...prev, {
    x1: barrierStart.current.x,
    y1: barrierStart.current.y,
    x2: end.x,
    y2: end.y,
  }]);
};
```

Visual: Render barriers as red dashed lines on overlay canvas
with a small door symbol (arc) at midpoint.

---

### STEP 2 — Select Room Mode + Ray Cast Trigger

**File: client/src/components/DrawingAnalysis.tsx**

Add "Select Room" toolbar mode.

When user clicks a room area (where an OCR label exists):
1. Find nearest OCR label centroid within 50px of click
2. Use that centroid as the ray cast seed point
3. Run DDA ray casting → generate polygon
4. Render polygon as semi-transparent overlay
5. Show vertex handles for manual refinement

```typescript
const detectRoomPolygon = async (
  seedX: number,
  seedY: number,
  roomLabel: string
): Promise<Array<{ x: number; y: number }>> => {
  // Get canvas imageData with barriers composited
  const canvas = mainCanvasRef.current;
  const ctx = canvas.getContext('2d')!;
  
  // Draw door barriers onto a temp canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.drawImage(canvas, 0, 0);
  
  // Draw door barriers as black lines
  tempCtx.strokeStyle = 'rgba(0,0,0,255)';
  tempCtx.lineWidth = 4;
  for (const barrier of doorBarriers) {
    tempCtx.beginPath();
    tempCtx.moveTo(barrier.x1, barrier.y1);
    tempCtx.lineTo(barrier.x2, barrier.y2);
    tempCtx.stroke();
  }
  
  const imageData = tempCtx.getImageData(
    0, 0, tempCanvas.width, tempCanvas.height
  );
  
  // Cast 360 rays at 1° increments
  const IGNORE_RADIUS = 25;
  const MAX_DISTANCE = 2000;
  const points: Array<{ x: number; y: number }> = [];
  
  for (let angle = 0; angle < 360; angle++) {
    const hit = castRay(
      imageData, seedX, seedY, angle,
      MAX_DISTANCE, IGNORE_RADIUS
    );
    points.push({ x: hit.x, y: hit.y });
  }
  
  return points;
};
```

---

### STEP 3 — Polygon Vertex Refinement UI

After ray casting, render the polygon with draggable vertices:

```typescript
// Render polygon overlay
const renderPolygon = (
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  label: string
) => {
  // Fill
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.fillStyle = color + '33'; // 20% opacity
  ctx.fill();
  
  // Stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Label
  const centroid = getCentroid(points);
  ctx.fillStyle = color;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, centroid.x, centroid.y);
  
  // Vertex handles (shown when room is selected)
  // Simplify to every 10th point for handles
  const handles = points.filter((_, i) => i % 10 === 0);
  for (const h of handles) {
    ctx.beginPath();
    ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};
```

Vertex drag: allow user to drag vertex handles to refine boundary.
On drag, update the corresponding point in the polygon array.
On mouseup, re-run compliance check for that room.

---

### STEP 4 — Compliance Overlays Per Room

Once polygon is confirmed, calculate compliance for that room:

```typescript
interface RoomComplianceResult {
  roomId: string;
  roomLabel: string;
  polygon: Array<{ x: number; y: number }>;
  areaM2: number;
  
  // Per-rule results
  egress: {
    hasEgressWindow: boolean;
    windowAreaM2: number;
    compliant: boolean;
    nbcRef: string;
  };
  travelDistance: {
    distancePx: number;
    distanceM: number;
    maxAllowedM: number;
    compliant: boolean;
    pathPoints: Array<{ x: number; y: number }>;
  };
  fireSeparation: {
    requiredFRR: string;
    adjacentRooms: string[];
    compliant: boolean;
  };
  spatialSeparation: {
    limitingDistanceM: number;
    maxOpeningM2: number;
    actualOpeningM2: number;
    compliant: boolean;
  };
  
  // Visual
  fillColor: string; // green/amber/red based on worst result
  severity: 'pass' | 'conditional' | 'fail';
}
```

Overlay color logic:
```typescript
const getOverlayColor = (result: RoomComplianceResult): string => {
  if (result.severity === 'fail') return '#EF4444';       // red
  if (result.severity === 'conditional') return '#F59E0B'; // amber
  return '#22C55E';                                        // green
};
```

---

### STEP 5 — Save Polygons to DB

**File: server/routers/drawingAnalysisRouter.ts**

Add saveRoomPolygon mutation:

```typescript
saveRoomPolygon: protectedProcedure
  .input(z.object({
    drawingPageId: z.number(),
    roomLabel: z.string().max(100),
    polygonPoints: z.array(z.object({
      x: z.number(),
      y: z.number(),
    })).max(720), // max 2 points per degree
    areaM2: z.number().optional(),
    seedX: z.number(),
    seedY: z.number(),
    doorBarriers: z.array(z.object({
      x1: z.number(), y1: z.number(),
      x2: z.number(), y2: z.number(),
    })).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // verify ownership of drawingPage
    // insert into detectedRooms table
    // return roomId
  }),
```

**DB: detectedRooms table** (already exists from Phase 2 migration):
```sql
-- Confirm columns exist:
-- id, drawingPageId, roomLabel, polygonPoints (JSON),
-- areaM2, seedX, seedY, detectionMethod, createdAt
```

---

### STEP 6 — Wall Segment Detection

After room polygons are established, detect wall segments between rooms:

```typescript
const detectWallSegments = (
  rooms: RoomComplianceResult[]
): Array<{
  wallId: string;
  room1Id: string;
  room2Id: string;
  sharedEdge: Array<{ x: number; y: number }>;
  requiredFRR: string;
  actualFRR: string | null;
  compliant: boolean;
}> => {
  // For each pair of adjacent rooms:
  // 1. Find polygon edges within 10px of each other (shared wall)
  // 2. Classify required FRR based on occupancy types on each side
  //    (from NBC Table 3.1.3.4)
  // 3. Return wall segments with compliance status
};
```

Render wall segments as colored lines:
```
🔴 Red line   = fire separation FAIL (FRR insufficient)
🟢 Green line = fire separation PASS
🟡 Amber line = fire separation CONDITIONAL
```

---

### STEP 7 — Egress Window Overlay

For each room identified as a sleeping room:

```typescript
const detectEgressWindows = (
  room: RoomComplianceResult,
  ocrFindings: OCRResult[]
): {
  windowLocations: Array<{ x: number; y: number; width: number }>;
  totalAreaM2: number;
  compliant: boolean;
} => {
  // Look for window symbols in OCR output near room polygon boundary
  // Check against NBC 9.10.7 minimums:
  //   area >= 0.35m²
  //   height >= 380mm
  //   width >= 380mm
  //   sill <= 900mm AFF
};
```

Render:
- Green rectangle overlay on compliant egress windows
- Red rectangle overlay on non-compliant windows
- "0.35m² min" tooltip on hover

---

### STEP 8 — Phase C Findings Panel Integration

Extend the existing findings panel to include polygon-based findings:

```typescript
interface PhaseCSFinding {
  issueId: string;       // e.g. "PC-001"
  roomLabel: string;     // "BEDROOM 1"
  ruleId: string;        // "NBC-9.10.7"
  finding: string;       // "Egress window area 0.28m² < 0.35m² minimum"
  severity: 'fail' | 'conditional' | 'pass';
  polygonId: string;     // link to highlighted polygon
  nbcRef: string;
  confidence: number;    // 0-1 based on detection quality
  assumption: string;    // "Scale: 1:100 assumed from scale bar detection"
}
```

When user clicks a finding → canvas pans/zooms to the affected room polygon
and pulses the overlay highlight.

---

## FILES TO CREATE/MODIFY

```
MODIFY:
  client/src/components/DrawingAnalysis.tsx
    + Door barrier draw tool (toolbar mode)
    + Select room click handler
    + DDA ray casting algorithm (castRay function)
    + detectRoomPolygon function
    + renderPolygon with vertex handles
    + Vertex drag refinement
    + Per-room compliance overlay rendering
    + Phase C findings panel extension

CREATE:
  client/src/lib/ddaRayCasting.ts
    castRay()
    detectRoomPolygon()
    getCentroid()
    getPolygonArea()
    simplifyPolygon() (Ramer-Douglas-Peucker)
    detectSharedWalls()

  client/src/lib/roomComplianceCalculator.ts
    calculateEgressCompliance()
    calculateTravelDistance()
    calculateFireSeparation()
    calculateSpatialSeparation()
    getOverlayColor()

MODIFY:
  server/routers/drawingAnalysisRouter.ts
    + saveRoomPolygon mutation
    + getRoomPolygons query
    + saveDoorBarriers mutation

MODIFY:
  server/db/schema.ts (if detectedRooms needs new columns)
    + polygonPoints JSON column (if not exists)
    + doorBarriers JSON column
    + detectionMethod VARCHAR
```

---

## SUCCESS CRITERIA

```
Phase C is complete when:

1. User can draw door barriers across openings ✓
2. User clicks a room label → polygon auto-detected ✓
3. Polygon renders as colored overlay on canvas ✓
4. User can drag vertices to refine polygon ✓
5. Egress compliance shown per room (green/amber/red) ✓
6. Fire separation shown per wall segment ✓
7. Travel distance path drawn from room to exit ✓
8. Findings panel shows room-level issues ✓
9. Polygons saved to DB (persist across sessions) ✓
10. Scale-aware: pixel distances → metres ✓
```

---

## KNOWN CONSTRAINTS

```
- getImageData() is same-origin only — drawing image must be
  served from same domain or converted to blob URL first
  
- Canvas size limit: browsers cap at ~16,384px per dimension
  Large drawings may need tile-based processing
  
- Performance: 360 rays × 2000px max = 720,000 pixel checks per room
  Should complete in <100ms on modern hardware
  Use requestAnimationFrame for non-blocking rendering
  
- JPEG artifacts: threshold 80 may need tuning per drawing
  Consider user-adjustable threshold slider
  
- Scale detection: must be calibrated before pixel→metre conversion
  Use existing calibrationScale from drawingPages table
```

---

## PRIORITY ORDER

```
Sprint 1 (1 week):
  Step 1: Door barrier draw tool
  Step 2: Select room + ray cast trigger
  Step 3: Polygon vertex refinement UI

Sprint 2 (1 week):
  Step 4: Per-room compliance overlays
  Step 5: Save polygons to DB

Sprint 3 (1 week):
  Step 6: Wall segment detection
  Step 7: Egress window overlay
  Step 8: Findings panel integration
```

---

## NBC COMPLIANCE RULES DRIVING OVERLAYS

```
Per-room overlays map to:

  Sleeping rooms:
    NBC 9.10.7  → egress window size/sill height
    NBC 9.9.10  → window well if below grade
    
  Suite/dwelling separation:
    NBC 9.10.9  → 30-min fire separation
    NBC 3.1.3.4 → fire resistance rating table
    
  Corridors/exits:
    NBC 3.4.2.5 → travel distance limits
    NBC 3.4.3   → exit width requirements
    
  Exterior walls:
    NBC 9.10.14 → spatial separation (LD² formula)
    
  All rooms:
    NBC 9.10.19 → smoke alarm placement
    NBC 9.7.2   → ceiling height minimums
```

