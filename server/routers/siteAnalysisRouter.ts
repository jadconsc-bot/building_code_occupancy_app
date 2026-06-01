import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteAnalyses, projects } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const siteAnalysisInput = z.object({
  projectId:       z.number().int().positive(),
  lotWidthM:       z.number(),
  lotDepthM:       z.number(),
  lotAreaSqm:      z.number(),
  buildingWidthM:  z.number(),
  buildingDepthM:  z.number(),
  buildingHeightM: z.number(),
  frontSetbackM:   z.number(),
  rearSetbackM:    z.number(),
  sideSetbackM:    z.number(),
  siteCoveragePct: z.number(),
  isCompliant:          z.boolean(),
  zoneCode:             z.string().optional(),
  municipality:         z.string().optional(),
  accessoryWidthM:      z.number().optional(),
  accessoryDepthM:      z.number().optional(),
  accessoryHeightM:     z.number().optional(),
  accessoryAreaSqm:     z.number().optional(),
  accessoryIsCompliant: z.boolean().optional(),
  source:               z.enum(['manual', 'drawing_analyzer']).optional(),
});

export const siteAnalysisRouter = router({
  save: protectedProcedure
    .input(siteAnalysisInput)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify project belongs to the caller
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
        .limit(1);

      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

      const toDecimal = (n: number) => n.toString();

      await db.insert(siteAnalyses).values({
        projectId:       input.projectId,
        lotWidthM:       toDecimal(input.lotWidthM),
        lotDepthM:       toDecimal(input.lotDepthM),
        lotAreaSqm:      toDecimal(input.lotAreaSqm),
        buildingWidthM:  toDecimal(input.buildingWidthM),
        buildingDepthM:  toDecimal(input.buildingDepthM),
        buildingHeightM: toDecimal(input.buildingHeightM),
        frontSetbackM:   toDecimal(input.frontSetbackM),
        rearSetbackM:    toDecimal(input.rearSetbackM),
        sideSetbackM:    toDecimal(input.sideSetbackM),
        siteCoveragePct: toDecimal(input.siteCoveragePct),
        isCompliant:          input.isCompliant,
        zoneCode:             input.zoneCode,
        municipality:         input.municipality,
        accessoryWidthM:      input.accessoryWidthM !== undefined ? toDecimal(input.accessoryWidthM) : undefined,
        accessoryDepthM:      input.accessoryDepthM !== undefined ? toDecimal(input.accessoryDepthM) : undefined,
        accessoryHeightM:     input.accessoryHeightM !== undefined ? toDecimal(input.accessoryHeightM) : undefined,
        accessoryAreaSqm:     input.accessoryAreaSqm !== undefined ? toDecimal(input.accessoryAreaSqm) : undefined,
        accessoryIsCompliant: input.accessoryIsCompliant,
        source:               input.source ?? 'manual',
      });

      return { success: true };
    }),

  getByProject: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify ownership
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
        .limit(1);

      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

      const [latest] = await db
        .select()
        .from(siteAnalyses)
        .where(eq(siteAnalyses.projectId, input.projectId))
        .orderBy(desc(siteAnalyses.createdAt))
        .limit(1);

      return latest ?? null;
    }),
});
