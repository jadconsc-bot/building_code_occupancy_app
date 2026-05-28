/**
 * Wall Engine Orchestrator — Phase B5
 *
 * Full pipeline:
 *   1. extractVectorPaths(pdfBase64, pageNumber)
 *   2. If pathCount == 0: mark source='none', return early (raster PDF)
 *   3. Batch insert raw paths to vectorPaths table (cap at 2000)
 *   4. detectWalls(paths, ...) -> WallSegment[]
 *   5. Batch insert wall segments to wallSegments table
 *   6. Update drawingPages: vectorExtracted=1, wallSegmentCount, vectorExtractionSource
 */

import { getDb } from "../db";
import { vectorPaths, wallSegments as wallSegmentsTable, drawingPages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { extractVectorPaths } from "./vectorExtractionService";
import { detectWalls } from "./wallDetectionService";
import type { RawPath } from "./vectorExtractionService";

const MAX_VECTOR_PATHS = 2000;

export async function runWallEngine(
  pdfBase64: string,
  pageNumber: number,
  pageId: number,
  drawingAnalysisId: number,
  imageWidthPx: number,
  imageHeightPx: number,
  cropRegion: { x: number; y: number; width: number; height: number } | null,
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[WallEngine] DB unavailable — skipping page", pageId);
    return;
  }

  let extraction;
  try {
    extraction = await extractVectorPaths(pdfBase64, pageNumber);
  } catch (err) {
    console.error("[WallEngine] Vector extraction failed for page", pageId, (err as Error)?.message);
    // Mark as none so we don't retry indefinitely
    await db.update(drawingPages)
      .set({ vectorExtracted: 1, vectorExtractedAt: new Date(), vectorExtractionSource: "none" })
      .where(eq(drawingPages.id, pageId))
      .catch(() => {});
    return;
  }

  const { paths, pageWidthPts, pageHeightPts, pathCount } = extraction;
  console.log(`[WallEngine] Page ${pageNumber} (pageId=${pageId}): extracted ${pathCount} paths (${Math.round(pageWidthPts)}×${Math.round(pageHeightPts)} pts)`);

  // Raster PDF — no vector content
  if (pathCount === 0) {
    await db.update(drawingPages)
      .set({ vectorExtracted: 1, vectorExtractedAt: new Date(), wallSegmentCount: 0, vectorExtractionSource: "none" })
      .where(eq(drawingPages.id, pageId));
    return;
  }

  // ── Batch insert raw paths (cap at MAX_VECTOR_PATHS) ───────────────────────
  const pathsToInsert: RawPath[] = paths.slice(0, MAX_VECTOR_PATHS);
  const BATCH = 200;
  for (let i = 0; i < pathsToInsert.length; i += BATCH) {
    const chunk = pathsToInsert.slice(i, i + BATCH);
    await db.insert(vectorPaths).values(
      chunk.map(p => ({
        pageId,
        drawingAnalysisId,
        pathType: p.pathType,
        strokeWidth: p.strokeWidth.toString(),
        strokeColor: p.strokeColor,
        fillColor:   p.fillColor === "none" ? null : p.fillColor,
        pathDataJson:    p.points,
        boundingBoxJson: p.boundingBox,
        pdfSpaceWidth:   pageWidthPts.toString(),
        pdfSpaceHeight:  pageHeightPts.toString(),
      })),
    );
  }

  // ── Detect walls ────────────────────────────────────────────────────────────
  const walls = detectWalls(paths, {
    pageWidthPts,
    pageHeightPts,
    imageWidthPx:  imageWidthPx  > 0 ? imageWidthPx  : 1000,
    imageHeightPx: imageHeightPx > 0 ? imageHeightPx : 1000,
    cropRegion,
  });

  const coverageRatio = pathCount > 0 ? (walls.length / pathCount).toFixed(3) : "0";
  console.log(`[WallEngine] Detected ${walls.length} wall segments (coverage ratio: ${coverageRatio})`);

  // ── Batch insert wall segments ────────────────────────────────────────────
  if (walls.length > 0) {
    for (let i = 0; i < walls.length; i += BATCH) {
      const chunk = walls.slice(i, i + BATCH);
      await db.insert(wallSegmentsTable).values(
        chunk.map(w => ({
          pageId,
          drawingAnalysisId,
          startX:      w.startX.toString(),
          startY:      w.startY.toString(),
          endX:        w.endX.toString(),
          endY:        w.endY.toString(),
          thicknessPx: w.thicknessPx.toString(),
          lengthPx:    w.lengthPx.toString(),
          orientation: w.orientation,
          confidence:  w.confidence.toString(),
          source:      w.source,
        })),
      );
    }
  }

  // ── Update drawingPages ───────────────────────────────────────────────────
  await db.update(drawingPages)
    .set({
      vectorExtracted: 1,
      vectorExtractedAt: new Date(),
      wallSegmentCount: walls.length,
      vectorExtractionSource: "pdf_paths",
    })
    .where(eq(drawingPages.id, pageId));
}
