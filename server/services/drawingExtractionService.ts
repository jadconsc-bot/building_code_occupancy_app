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
export const EXTRACTION_PROMPT_VERSION = "2.0.0";

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
const buildExtractionSystemPrompt = (analysisType: string): string => `
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

For analysis type: ${analysisType}

Extract only what is VISIBLE in the drawing. If something is not clearly visible, omit it or mark as uncertain.
Set confidence between 0 and 1 based on drawing clarity and completeness.

Return valid JSON matching the requested schema. Do not add commentary outside the JSON.
`.trim();

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
): Promise<{ data: DrawingExtractionResult; modelVersion: string }> {
  const { jpegQuality, maxTokens } = QUALITY_SETTINGS[analysisQuality];
  const systemPrompt = buildExtractionSystemPrompt(analysisType);

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
    userPrompt: `Extract all observable data from this ${analysisType} drawing. Return structured JSON only.`,
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
