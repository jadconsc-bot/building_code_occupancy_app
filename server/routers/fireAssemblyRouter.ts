import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { fireAssemblies, projects } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const assemblyPointSchema = z.object({ x: z.number(), y: z.number() });

const remediationItemSchema = z.object({
  code: z.string(),
  description: z.string(),
  urgency: z.enum(["immediate", "required", "advisory"]),
});

export const fireAssemblyRouter = router({
  save: protectedProcedure
    .input(z.object({
      drawingAnalysisId: z.number().int().positive(),
      pageId:            z.number().int(),
      projectId:         z.number().int().positive(),
      assemblyType:      z.enum(["none","0.5hr","1hr","1.5hr","2hr","fire_separation"]),
      frrDrawn:          z.number(),
      frrRequired:       z.number().optional(),
      isCompliant:       z.boolean().optional(),
      gap:               z.number().optional(),
      roomAId:           z.number().int().optional(),
      roomBId:           z.number().int().optional(),
      occupancyA:        z.string().max(10).optional(),
      occupancyB:        z.string().max(10).optional(),
      labelA:            z.string().max(100).optional(),
      labelB:            z.string().max(100).optional(),
      lengthPx:          z.number().optional(),
      lengthM:           z.number().optional(),
      wallHeightM:       z.number().optional(),
      pointsJson:        z.array(assemblyPointSchema),
      nbcReference:      z.string().max(50).optional(),
      remediationJson:   z.array(remediationItemSchema).optional(),
      assemblyLabel:     z.string().max(10).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [project] = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, input.projectId));
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const [result] = await db.insert(fireAssemblies).values({
        drawingAnalysisId: input.drawingAnalysisId,
        pageId:            input.pageId,
        projectId:         input.projectId,
        assemblyType:      input.assemblyType,
        frrDrawn:          String(input.frrDrawn),
        frrRequired:       input.frrRequired != null ? String(input.frrRequired) : undefined,
        isCompliant:       input.isCompliant,
        gap:               input.gap != null ? String(input.gap) : undefined,
        roomAId:           input.roomAId,
        roomBId:           input.roomBId,
        occupancyA:        input.occupancyA,
        occupancyB:        input.occupancyB,
        labelA:            input.labelA,
        labelB:            input.labelB,
        lengthPx:          input.lengthPx != null ? String(input.lengthPx) : undefined,
        lengthM:           input.lengthM != null ? String(input.lengthM) : undefined,
        wallHeightM:       input.wallHeightM != null ? String(input.wallHeightM) : undefined,
        pointsJson:        input.pointsJson,
        nbcReference:      input.nbcReference,
        remediationJson:   input.remediationJson,
        assemblyLabel:     input.assemblyLabel,
      });
      return { id: Number((result as any).insertId) };
    }),

  getByProject: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [project] = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, input.projectId));
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db
        .select()
        .from(fireAssemblies)
        .where(eq(fireAssemblies.projectId, input.projectId))
        .orderBy(desc(fireAssemblies.createdAt));
    }),

  deleteAssembly: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), projectId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [project] = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, input.projectId));
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db
        .delete(fireAssemblies)
        .where(and(eq(fireAssemblies.id, input.id), eq(fireAssemblies.projectId, input.projectId)));
      return { success: true };
    }),
});
