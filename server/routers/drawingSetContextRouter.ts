import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { drawingSetContexts } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { extractDrawingSetContext } from "../services/drawingSetContextService";
import { assertProjectMemberAccess, assertProjectRoleManager } from "../services/projectAuthorization";

export const drawingSetContextRouter = router({
  extractContext: protectedProcedure
    .input(z.object({
      projectId:         z.number().int().positive(),
      drawingAnalysisId: z.number().int().min(0),
      pages: z.array(z.object({
        pageNum: z.number().int().positive(),
        base64:  z.string().min(1),
      })).min(1).max(20),
    }))
    .mutation(async ({ input, ctx }) => {
      await assertProjectRoleManager(ctx.user, input.projectId);
      const result = await extractDrawingSetContext(
        input.pages,
        input.projectId,
        input.drawingAnalysisId,
        ctx.user.id,
      );
      return { success: true, context: result };
    }),

  getContext: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertProjectMemberAccess(ctx.user, input.projectId);
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(drawingSetContexts)
        .where(eq(drawingSetContexts.projectId, input.projectId))
        .orderBy(desc(drawingSetContexts.extractedAt))
        .limit(1);
      return rows[0] ?? null;
    }),

  updateContext: protectedProcedure
    .input(z.object({
      contextId:     z.number().int().positive(),
      municipality:  z.string().max(100).optional(),
      codeEdition:   z.string().max(50).optional(),
      sprinklered:   z.boolean().optional(),
      abbreviations: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const [context] = await db
        .select({ projectId: drawingSetContexts.projectId })
        .from(drawingSetContexts)
        .where(eq(drawingSetContexts.id, input.contextId))
        .limit(1);
      if (!context) throw new TRPCError({ code: "NOT_FOUND", message: "Drawing set context not found" });
      await assertProjectRoleManager(ctx.user, context.projectId);
      const { contextId, ...updates } = input;
      const dbUpdates: Record<string, unknown> = {};
      if (updates.municipality !== undefined) dbUpdates.municipality = updates.municipality;
      if (updates.codeEdition !== undefined)  dbUpdates.codeEdition  = updates.codeEdition;
      if (updates.sprinklered !== undefined)  dbUpdates.sprinklered  = updates.sprinklered ? 1 : 0;
      if (updates.abbreviations !== undefined) dbUpdates.abbreviationsJson = updates.abbreviations;
      if (Object.keys(dbUpdates).length > 0) {
        await db.update(drawingSetContexts)
          .set(dbUpdates as any)
          .where(eq(drawingSetContexts.id, contextId));
      }
      return { success: true };
    }),
});
