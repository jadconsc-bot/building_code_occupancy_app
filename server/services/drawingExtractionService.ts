/**
 * Drawing Extraction Service — Stage 1 of the Two-Stage Analysis Pipeline
 *
 * ============================================================================
 * PRIME DIRECTIVE 2.0 §4.1 — LLM BOUNDARY RULE (CRITICAL)
 * ============================================================================
 * This service is the ONLY place where the LLM is invoked.
 * The LLM's role is STRICTLY LIMITED to:
 *   - Reading the drawing image
 *   - Extracting observable measurements, dimensions, materials, and features
 *   - Pointing to relevant NBC clauses that APPLY to what was observed
 *   - Returning structured JSON data validated by Zod
 *
 * The LLM MUST NOT:
 *   - Make pass/fail compliance decisions
 *   - Calculate compliance scores
 *   - Determine if a drawing meets code requirements
 *   - Generate recommendations or issues
 *
 * All compliance evaluation is handled exclusively by drawingComplianceEngine.ts
 * ============================================================================
 */

import { z } from "zod";
import sharp from "sharp";
import { callAnthropicVision } from "./anthropicVisionService";

const ANTHROPIC_IMAGE_LIMIT_BYTES = 4 * 1024 * 1024; // 4MB — safe margin under API's 5MB limit

/**
 * Quality settings per analysis tier.
 * maxTokens controls LLM response budget; jpegQuality controls initial
 * compression when the image exceeds the API size limit.
 */
const QUALITY_SETTINGS = {
  fast:     { jpegQuality: 60, maxTokens: 4096  },
  standard: { jpegQuality: 85, maxTokens: 8192  },
  detailed: { jpegQuality: 95, maxTokens: 16000 },
} as const;

/**
 * Compresses imageBase64 to JPEG when it exceeds the Anthropic 4 MB limit.
 *
 * @param startQuality - Initial JPEG quality (60–95). Decremented by 10 each
 *   iteration until the image fits. Floor is 30 to avoid unreadable output.
 */
async function compressImageIfNeeded(
  imageBase64: string,
  mimeType: string,
  startQuality: number = 85,
): Promise<{ imageBase64: string; mimeType: string }> {
  const byteSize = Math.ceil(imageBase64.length * 0.75);
  if (byteSize <= ANTHROPIC_IMAGE_LIMIT_BYTES) {
    return { imageBase64, mimeType };
  }

  console.log(`[DrawingExtraction] Image too large (${byteSize} bytes), compressing to JPEG (startQuality=${startQuality})...`);
  const inputBuffer = Buffer.from(imageBase64, "base64");

  let quality = startQuality;
  let outputBuffer: Buffer;
  do {
    outputBuffer = await sharp(inputBuffer)
      .jpeg({ quality })
      .toBuffer();
    quality -= 10;
  } while (outputBuffer.length > ANTHROPIC_IMAGE_LIMIT_BYTES && quality >= 30);

  console.log(`[DrawingExtraction] Compressed to ${outputBuffer.length} bytes at quality ${quality + 10}`);
  return {
    imageBase64: outputBuffer.toString("base64"),
    mimeType: "image/jpeg",
  };
}

/** Current prompt version — increment when prompt logic changes (PD2.0 §3.2) */
export const EXTRACTION_PROMPT_VERSION = "2.1.0";

/**
 * Zod schema for LLM-extracted structural data.
 * These are OBSERVATIONS only — no pass/fail judgments.
 */
export const ExtractedStructuralDataSchema = z.object({
  memberSizes: z.array(z.object({
    label: z.string().describe("Member label or identifier from drawing"),
    dimension: z.string().describe("Observed dimension (e.g., '38x89mm', '2x4')"),
    material: z.string().optional().describe("Material if labeled"),
    location: z.string().optional().describe("Location in drawing"),
  })).default([]).describe("Structural member sizes observed in the drawing"),
  connectionTypes: z.array(z.object({
    type: z.string().describe("Connection type observed (e.g., 'nail plate', 'bolt', 'weld')"),
    location: z.string().optional(),
    specification: z.string().optional().describe("Specification if labeled"),
  })).default([]).describe("Connection types observed"),
  loadPaths: z.array(z.string()).default([]).describe("Described load paths if visible"),

  openingHeaders: z.array(z.object({
    location: z.string(),
    span: z.string().optional(),
    headerSize: z.string().optional(),
    supportCondition: z.string().optional(),
  })).default([]),

  foundationElements: z.array(z.object({
    type: z.string(),
    dimension: z.string().optional(),
    depth: z.string().optional(),
    location: z.string().optional(),
  })).default([]),

  floorSystemType: z.string().optional(),
  wallSystemType: z.string().optional(),

  materials: z.array(z.object({
    material: z.string(),
    grade: z.string().optional(),
    location: z.string().optional(),
  })).default([]).describe("Materials identified in the drawing"),
  relevantNbcClauses: z.array(z.object({
    clause: z.string().describe("NBC clause number (e.g., '9.23.3.2')"),
    reason: z.string().describe("Why this clause is relevant to what was observed"),
  })).default([]).describe("NBC clauses relevant to the observed structural elements"),
  observationNotes: z.string().optional().describe("Additional observations from the drawing"),
  drawingScale: z.string().optional().describe("Drawing scale if indicated"),
  drawingTitle: z.string().optional().describe("Drawing title if present"),
  confidence: z.number().min(0).max(1).describe("Extraction confidence 0-1"),
});

export const ExtractedFireSafetyDataSchema = z.object({
  exitWidths: z.array(z.object({
    location: z.string(),
    width: z.string().describe("Observed width measurement"),
    doorType: z.string().optional(),
  })).default([]).describe("Exit widths observed"),
  corridorWidths: z.array(z.object({
    location: z.string(),
    width: z.string(),
  })).default([]).describe("Corridor widths observed"),
  fireSeparations: z.array(z.object({
    location: z.string(),
    rating: z.string().optional().describe("Fire rating if labeled (e.g., '45 min')"),
    construction: z.string().optional(),
  })).default([]).describe("Fire separations observed"),

  fireRatedOpenings: z.array(z.object({
    location: z.string(),
    openingType: z.string(),
    openingWidth: z.string().optional(),
    openingHeight: z.string().optional(),
    closureRating: z.string().optional(),
    wallRating: z.string().optional(),
    hasClosureDevice: z.boolean().nullable().optional(),
    percentageOfWall: z.string().optional(),
  })).default([]),

  occupancySeparations: z.array(z.object({
    location: z.string(),
    separatingOccupancies: z.string(),
    rating: z.string().optional(),
    construction: z.string().optional(),
  })).default([]),

  exitDoorHardware: z.array(z.object({
    location: z.string(),
    hasPanicHardware: z.boolean().nullable().optional(),
    hasSelfCloser: z.boolean().nullable().optional(),
    hasDelayedEgress: z.boolean().nullable().optional(),
    swingDirection: z.string().optional(),
  })).default([]),

  smokeCompartments: z.array(z.object({
    location: z.string(),
    estimatedArea: z.string().optional(),
    smokeSeparationRating: z.string().optional(),
  })).default([]),

  travelDistances: z.array(z.object({
    from: z.string(),
    to: z.string(),
    observedDistance: z.string().optional(),
    pathDescription: z.string().optional(),
  })).default([]),

  meanOfEgress: z.object({
    numberOfExits: z.number().nullable().optional(),
    exitStairwells: z.number().nullable().optional(),
    rampPresent: z.boolean().nullable().optional(),
    exitSignsIndicated: z.boolean().nullable().optional(),
  }).optional(),

  sprinklerSystem: z.object({
    present: z.boolean().nullable().describe("Whether sprinkler system is indicated (null if unclear)"),
    type: z.string().optional(),
    coverage: z.string().optional(),
  }).optional(),
  smokeDetectors: z.object({
    indicated: z.boolean().nullable(),
    locations: z.array(z.string()).optional(),
  }).optional(),
  relevantNbcClauses: z.array(z.object({
    clause: z.string(),
    reason: z.string(),
  })).default([]).describe("NBC clauses relevant to observed fire safety elements"),
  observationNotes: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const ExtractedConnectionDataSchema = z.object({
  fastenerTypes: z.array(z.object({
    type: z.string().describe("Fastener type (e.g., 'common nail', 'lag bolt', 'joist hanger')"),
    size: z.string().optional(),
    spacing: z.string().optional(),
    location: z.string().optional(),
    quantity: z.string().optional(),
  })).default([]).describe("Fasteners and connectors observed"),
  connectionDetails: z.array(z.object({
    description: z.string(),
    location: z.string().optional(),
    hardwareSpec: z.string().optional(),
  })).default([]).describe("Connection details observed"),
  csaStandards: z.array(z.object({
    standard: z.string().describe("CSA standard referenced (e.g., 'CSA O86')"),
    location: z.string().optional(),
  })).default([]).describe("CSA standards referenced in the drawing"),
  relevantNbcClauses: z.array(z.object({
    clause: z.string(),
    reason: z.string(),
  })).default([]),
  observationNotes: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

/** Union schema for all extraction types */
export const DrawingExtractionResultSchema = z.object({
  analysisType: z.enum(["structural", "fire-safety", "connections", "comprehensive"]),
  structural: ExtractedStructuralDataSchema.optional(),
  fireSafety: ExtractedFireSafetyDataSchema.optional(),
  connections: ExtractedConnectionDataSchema.optional(),
  drawingType: z.string().describe("Type of drawing identified (e.g., 'floor plan', 'section', 'detail')"),
  jurisdiction: z.string().optional().describe("Jurisdiction if indicated on drawing"),
  extractionModel: z.string().describe("LLM model that performed extraction — from response.model"),
  extractionPromptVersion: z.string(),
});

export type DrawingExtractionResult = z.infer<typeof DrawingExtractionResultSchema>;

/** System prompt for the LLM extractor — extraction ONLY, no compliance judgments */
const buildExtractionSystemPrompt = (
  analysisType: string,
  projectContext?: { occupancyCode?: string; province?: string },
): string => {
  const contextLines = projectContext
    ? [
        projectContext.occupancyCode
          ? `- Occupancy classification: ${projectContext.occupancyCode} (NBC Group ${projectContext.occupancyCode.charAt(0)})`
          : null,
        projectContext.province
          ? `- Jurisdiction / province: ${projectContext.province}`
          : null,
      ].filter(Boolean)
    : [];

  const contextBlock = contextLines.length > 0
    ? `\nProject context (use to focus clause identification):\n${contextLines.join('\n')}\n`
    : '';

  const typeSpecificGuidance: Record<string, string> = {
    "fire-safety": `
FIRE SAFETY EXTRACTION TARGETS:
1. FIRE-RATED WALL OPENINGS (NBC 3.1.8): Every door/window/duct/pipe in a rated wall. Measure width x height. Note closure rating labels (45 min, 90 min). Note wall rating labels (1 hr, 2 hr). Check for self-closer symbols. Flag if opening appears to exceed 25% of wall area.
2. EXIT WIDTHS (NBC 3.3.1.13.(1)(a)): Every exit door — min clear width 850mm. Corridors — min 1100mm. Stairs — min 900mm clear. Note all dimension labels.
3. TRAVEL DISTANCES (NBC 3.4.2): Trace longest path from occupied space to nearest exit. Note dimension strings along egress paths.
4. EXIT DOOR HARDWARE: Panic hardware symbols. Self-closing devices. Door swing direction relative to egress travel. Delayed egress devices.
5. FIRE SEPARATIONS (NBC 3.1.3): Walls with rating labels. Occupancy separation walls. Exit enclosures. Construction type (concrete, masonry, gypsum).
6. SPRINKLER/ALARM: Sprinkler head symbols. Branch line indicators. Smoke detector symbols. Pull station locations.`,
    "structural": `
STRUCTURAL EXTRACTION TARGETS:
1. MEMBER SIZES (NBC 9.23): All labeled lumber dimensions. Engineered lumber (LVL/LSL/PSL) with sizes. Steel member designations. Species/grade if labeled.
2. SPANS (NBC 9.23.4): Floor joist spans. Roof rafter spans. Beam spans. Header spans over openings.
3. FOUNDATION (NBC 9.12/9.15): Footing dimensions. Foundation wall thickness. Depth below grade. Frost wall depth. Reinforcement if shown.
4. LOAD PATHS: Column/post locations and sizes. Bearing wall indicators. Cantilever conditions.
5. CONNECTIONS (NBC 9.23.3): Joist hanger types. Beam-to-column connections. Hold-down anchors. Shear wall indicators.`,
    "connections": `
CONNECTION EXTRACTION TARGETS:
1. FASTENERS (NBC 9.23.3/CSA O86): Nail sizes and types. Nail spacing in shear walls. Bolt sizes and spacing. Screw types and sizes.
2. CONNECTORS: Joist hanger models. Post caps and bases. Hurricane/rafter ties. Tension ties and hold-downs. Seismic straps.
3. CSA REFERENCES: CSA O86, CSA S16, CSA A23.3. Any callout referencing a CSA standard.
4. WELDS: Weld type, size, and location.`,
    "comprehensive": `
Extract ALL of the following:
FIRE SAFETY: Fire-rated wall openings with dimensions and closure ratings, exit widths, corridor widths, travel distances, door hardware, fire separations, sprinkler/alarm indicators, occupancy separations, smoke compartments.
STRUCTURAL: Member sizes, spans, foundation elements, load paths, connections, opening headers, floor/wall system types.
CONNECTIONS: Fastener types/sizes/spacing, connector hardware, CSA standard references, weld symbols.
ACCESSIBILITY (NBC 3.8): Barrier-free path width (min 1500mm per NBC 3.8.3.3.(1)), turning circle (min 1500mm), accessible door clear width (min 850mm per NBC 3.8.3.8.(1)), ramp slope (max 1:12), grab bar locations, counter heights.`,
  };

  const guidance = typeSpecificGuidance[analysisType] || typeSpecificGuidance["comprehensive"];

  return `
You are a technical drawing data extractor for a building code compliance system.

YOUR ROLE IS STRICTLY LIMITED TO:
1. Reading the provided architectural/structural drawing image
2. Extracting observable measurements, dimensions, materials, and features
3. Identifying which NBC (National Building Code of Canada) clauses are RELEVANT to what you observe
4. Returning structured JSON data

YOU MUST NOT:
- Make pass/fail compliance decisions
- State whether anything "meets code" or "violates code"
- Calculate compliance scores
- Generate recommendations
- Determine if requirements are satisfied

${guidance}
${contextBlock}
Extract only what is VISIBLE in the drawing. If something is not clearly visible, omit it or mark as uncertain.
Set confidence between 0 and 1 based on drawing clarity and completeness.

Return valid JSON matching the requested schema. Do not add commentary outside the JSON.
`.trim();
};

function buildUserPrompt(analysisType: string): string {
  const prompts: Record<string, string> = {
    "fire-safety": `Analyze this drawing for fire safety elements. Extract every opening in fire-rated walls with dimensions and closure ratings. Extract all exit door widths, corridor widths, travel distances, door hardware, fire separations, and sprinkler/alarm indicators. Return structured JSON only.`,
    "structural": `Analyze this drawing for structural elements. Extract all member sizes with dimensions, spans, foundation elements, load paths, and connection types. Note all labeled dimensions and material specifications. Return structured JSON only.`,
    "connections": `Analyze this drawing for connection details. Extract all fastener types, sizes, and spacing. Note all connector hardware, CSA standard references, and weld symbols. Return structured JSON only.`,
    "comprehensive": `Perform a comprehensive extraction of this drawing. Extract all fire safety elements (openings in rated walls, exit widths, travel distances, door hardware, separations), structural elements (member sizes, spans, foundations, load paths), connection details (fasteners, connectors, standards), and accessibility features (barrier-free paths, ramps, door widths). Return structured JSON only.`,
  };
  return prompts[analysisType] || prompts["comprehensive"];
}

/**
 * Stage 1: Extract structured data from a drawing image using the LLM.
 *
 * @param imageBase64 - Base64-encoded drawing image (PD2.0 §3.2: always base64, never URLs)
 * @param mimeType - Image MIME type
 * @param analysisType - Type of analysis to perform
 * @returns Validated extraction result with model version from response.model
 */
export async function extractDrawingData(
  imageBase64: string,
  mimeType: string,
  analysisType: "structural" | "fire-safety" | "connections" | "comprehensive",
  analysisQuality: "fast" | "standard" | "detailed" = "standard",
  projectContext?: { occupancyCode?: string; province?: string },
): Promise<{ data: DrawingExtractionResult; modelVersion: string }> {
  const { jpegQuality, maxTokens } = QUALITY_SETTINGS[analysisQuality];
  const systemPrompt = buildExtractionSystemPrompt(analysisType, projectContext);

  // Build the JSON schema for the response based on analysis type
  const schemaProperties: Record<string, unknown> = {
    analysisType: { type: "string", enum: ["structural", "fire-safety", "connections", "comprehensive"] },
    drawingType: { type: "string" },
    jurisdiction: { type: "string" },
    extractionModel: { type: "string" },
    extractionPromptVersion: { type: "string" },
  };

  if (analysisType === "structural" || analysisType === "comprehensive") {
    schemaProperties.structural = {
      type: "object",
      properties: {
        memberSizes: { type: "array", items: { type: "object", properties: { label: { type: "string" }, dimension: { type: "string" }, material: { type: "string" }, location: { type: "string" } }, required: ["label", "dimension"] } },
        connectionTypes: { type: "array", items: { type: "object", properties: { type: { type: "string" }, location: { type: "string" }, specification: { type: "string" } }, required: ["type"] } },
        loadPaths: { type: "array", items: { type: "string" } },
        openingHeaders: { type: "array", items: { type: "object", properties: { location: { type: "string" }, span: { type: "string" }, headerSize: { type: "string" }, supportCondition: { type: "string" } }, required: ["location"] } },
        foundationElements: { type: "array", items: { type: "object", properties: { type: { type: "string" }, dimension: { type: "string" }, depth: { type: "string" }, location: { type: "string" } }, required: ["type"] } },
        floorSystemType: { type: "string" },
        wallSystemType: { type: "string" },
        materials: { type: "array", items: { type: "object", properties: { material: { type: "string" }, grade: { type: "string" }, location: { type: "string" } }, required: ["material"] } },
        relevantNbcClauses: { type: "array", items: { type: "object", properties: { clause: { type: "string" }, reason: { type: "string" } }, required: ["clause", "reason"] } },
        observationNotes: { type: "string" },
        drawingScale: { type: "string" },
        drawingTitle: { type: "string" },
        confidence: { type: "number" },
      },
      required: ["memberSizes", "relevantNbcClauses", "confidence"],
    };
  }

  if (analysisType === "fire-safety" || analysisType === "comprehensive") {
    schemaProperties.fireSafety = {
      type: "object",
      properties: {
        exitWidths: { type: "array", items: { type: "object", properties: { location: { type: "string" }, width: { type: "string" }, doorType: { type: "string" } }, required: ["location", "width"] } },
        corridorWidths: { type: "array", items: { type: "object", properties: { location: { type: "string" }, width: { type: "string" } }, required: ["location", "width"] } },
        fireSeparations: { type: "array", items: { type: "object", properties: { location: { type: "string" }, rating: { type: "string" }, construction: { type: "string" } }, required: ["location"] } },
        fireRatedOpenings: { type: "array", items: { type: "object", properties: { location: { type: "string" }, openingType: { type: "string" }, openingWidth: { type: "string" }, openingHeight: { type: "string" }, closureRating: { type: "string" }, wallRating: { type: "string" }, hasClosureDevice: { type: "boolean" }, percentageOfWall: { type: "string" } }, required: ["location", "openingType"] } },
        occupancySeparations: { type: "array", items: { type: "object", properties: { location: { type: "string" }, separatingOccupancies: { type: "string" }, rating: { type: "string" }, construction: { type: "string" } }, required: ["location", "separatingOccupancies"] } },
        exitDoorHardware: { type: "array", items: { type: "object", properties: { location: { type: "string" }, hasPanicHardware: { type: "boolean" }, hasSelfCloser: { type: "boolean" }, hasDelayedEgress: { type: "boolean" }, swingDirection: { type: "string" } }, required: ["location"] } },
        smokeCompartments: { type: "array", items: { type: "object", properties: { location: { type: "string" }, estimatedArea: { type: "string" }, smokeSeparationRating: { type: "string" } }, required: ["location"] } },
        travelDistances: { type: "array", items: { type: "object", properties: { from: { type: "string" }, to: { type: "string" }, observedDistance: { type: "string" }, pathDescription: { type: "string" } }, required: ["from", "to"] } },
        meanOfEgress: { type: "object", properties: { numberOfExits: { type: "number" }, exitStairwells: { type: "number" }, rampPresent: { type: "boolean" }, exitSignsIndicated: { type: "boolean" } } },
        relevantNbcClauses: { type: "array", items: { type: "object", properties: { clause: { type: "string" }, reason: { type: "string" } }, required: ["clause", "reason"] } },
        observationNotes: { type: "string" },
        confidence: { type: "number" },
      },
      required: ["exitWidths", "relevantNbcClauses", "confidence"],
    };
  }

  if (analysisType === "connections" || analysisType === "comprehensive") {
    schemaProperties.connections = {
      type: "object",
      properties: {
        fastenerTypes: { type: "array", items: { type: "object", properties: { type: { type: "string" }, size: { type: "string" }, spacing: { type: "string" }, location: { type: "string" }, quantity: { type: "string" } }, required: ["type"] } },
        connectionDetails: { type: "array", items: { type: "object", properties: { description: { type: "string" }, location: { type: "string" }, hardwareSpec: { type: "string" } }, required: ["description"] } },
        csaStandards: { type: "array", items: { type: "object", properties: { standard: { type: "string" }, location: { type: "string" } }, required: ["standard"] } },
        relevantNbcClauses: { type: "array", items: { type: "object", properties: { clause: { type: "string" }, reason: { type: "string" } }, required: ["clause", "reason"] } },
        observationNotes: { type: "string" },
        confidence: { type: "number" },
      },
      required: ["fastenerTypes", "relevantNbcClauses", "confidence"],
    };
  }

  const { imageBase64: compressedImage, mimeType: compressedMime } =
    await compressImageIfNeeded(imageBase64, mimeType, jpegQuality);

  const { parsed, modelVersion } = await callAnthropicVision({
    imageBase64: compressedImage,
    mimeType: compressedMime,
    systemPrompt,
    userPrompt: buildUserPrompt(analysisType),
    jsonSchema: {
      type: "object",
      properties: schemaProperties,
      required: ["analysisType", "drawingType", "extractionModel", "extractionPromptVersion"],
    },
    maxTokens,
  });

  // Inject metadata that LLM cannot self-report accurately
  const parsedObj = parsed as Record<string, unknown>;
  parsedObj.analysisType = analysisType;
  parsedObj.extractionModel = modelVersion;
  parsedObj.extractionPromptVersion = EXTRACTION_PROMPT_VERSION;

  // Validate with Zod (PD2.0 §4.1: LLM output must be Zod-validated before passing to engine)
  const validated = DrawingExtractionResultSchema.parse(parsedObj);

  return { data: validated, modelVersion };
}
