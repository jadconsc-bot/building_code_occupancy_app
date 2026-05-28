import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { wallSegments, vectorPaths, drawingPages, drawingAnalyses } from "../../drizzle/schema";
import { runWallEngine } from "../services/wallEngineOrchestrator";
import { wallEngineQueue } from "../services/wallEngineQueue";

export const wallEngineRouter = router({

  // ── getWallSegments ────────────────────────────────────────────────────────
  getWallSegments: protectedProcedure
    .input(z.object({ pageId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const segments = await db
        .select()
        .from(wallSegments)
        .where(eq(wallSegments.pageId, input.pageId))
        .orderBy(wallSegments.id);

      return segments.map(s => ({
        id:          s.id,
        pageId:      s.pageId,
        startX:      Number(s.startX),
        startY:      Number(s.startY),
        endX:        Number(s.endX),
        endY:        Number(s.endY),
        thicknessPx: s.thicknessPx ? Number(s.thicknessPx) : null,
        lengthPx:    s.lengthPx    ? Number(s.lengthPx)    : null,
        orientation: s.orientation,
        confidence:  s.confidence  ? Number(s.confidence)  : 1.0,
        source:      s.source,
      }));
    }),

  // ── getVectorStatus ────────────────────────────────────────────────────────
  getVectorStatus: protectedProcedure
    .input(z.object({ drawingAnalysisId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const pages = await db
        .select({
          id:                     drawingPages.id,
          pageNumber:             drawingPages.pageNumber,
          widthPx:                drawingPages.widthPx,
          heightPx:               drawingPages.heightPx,
          vectorExtracted:        drawingPages.vectorExtracted,
          vectorExtractedAt:      drawingPages.vectorExtractedAt,
          wallSegmentCount:       drawingPages.wallSegmentCount,
          vectorExtractionSource: drawingPages.vectorExtractionSource,
        })
        .from(drawingPages)
        .where(eq(drawingPages.drawingId, input.drawingAnalysisId))
        .orderBy(drawingPages.pageNumber);

      return pages.map(p => ({
        pageId:                 p.id,
        pageNumber:             p.pageNumber,
        widthPx:                p.widthPx,
        heightPx:               p.heightPx,
        vectorExtracted:        Boolean(p.vectorExtracted),
        vectorExtractedAt:      p.vectorExtractedAt,
        wallSegmentCount:       p.wallSegmentCount ?? 0,
        vectorExtractionSource: p.vectorExtractionSource ?? "none",
      }));
    }),

  // ── reExtractWalls ─────────────────────────────────────────────────────────
  reExtractWalls: protectedProcedure
    .input(z.object({ pageId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "rule_editor") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [page] = await db
        .select()
        .from(drawingPages)
        .where(eq(drawingPages.id, input.pageId))
        .limit(1);

      if (!page) throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });

      // Need the analysis to get the PDF base64
      const [analysis] = await db
        .select({ id: drawingAnalyses.id, drawingUrl: drawingAnalyses.drawingUrl })
        .from(drawingAnalyses)
        .where(eq(drawingAnalyses.id, page.drawingId))
        .limit(1);

      if (!analysis) throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found" });
      if (!analysis.drawingUrl) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No drawing URL stored — cannot re-extract" });

      // Delete existing wall segments for this page
      await db.delete(wallSegments).where(eq(wallSegments.pageId, input.pageId));
      await db.delete(vectorPaths).where(eq(vectorPaths.pageId, input.pageId));

      // Queue re-extraction (non-blocking return)
      wallEngineQueue.add(async () => {
        await runWallEngine(
          analysis.drawingUrl!,
          page.pageNumber,
          page.id,
          page.drawingId,
          page.widthPx,
          page.heightPx,
          page.cropRegionJson as any ?? null,
        );
      }).catch(err => console.error("[WallEngine] Re-extraction queue error:", err));

      return { queued: true, pageId: input.pageId };
    }),
});
