import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { fireAssemblies, projects } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  generateWallCode,
  generateStackedCodes,
  detectStackedAssembly,
  ULC_DESIGNS,
  type WallCodeFormat,
} from "../services/wallNamingService";
import { getRequiredFRR, computeRemediation } from "../services/fireSeparationService";

const assemblyPointSchema = z.object({ x: z.number(), y: z.number() });

const remediationItemSchema = z.object({
  code: z.string(),
  description: z.string(),
  urgency: z.enum(["immediate", "required", "advisory"]),
});

export const fireAssemblyRouter = router({
  save: protectedProcedure
    .input(z.object({
      drawingAnalysisId: z.number().int().nonnegative(),
      pageId:            z.number().int(),
      projectId:         z.number().int().positive(),
      assemblyType:      z.enum(["none","0.5hr","1hr","1.5hr","2hr","fire_separation"]),
      frrDrawn:          z.number(),
      occupancyA:        z.string().max(10).optional(),
      occupancyB:        z.string().max(10).optional(),
      labelA:            z.string().max(100).optional(),
      labelB:            z.string().max(100).optional(),
      lengthPx:          z.number().optional(),
      lengthM:           z.number().optional(),
      wallHeightM:       z.number().optional(),
      pointsJson:        z.array(assemblyPointSchema),
      nbcReference:      z.string().max(50).optional(),
      roomAId:           z.number().int().optional(),
      roomBId:           z.number().int().optional(),
      wallCodeFormat:    z.enum(["FW","W","CUSTOM"]).optional(),
      wallCodePrefix:    z.string().optional(),
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

      const existing = await db
        .select()
        .from(fireAssemblies)
        .where(eq(fireAssemblies.projectId, input.projectId))
        .orderBy(desc(fireAssemblies.sequenceNum));

      const nextSeq = existing.length > 0 ? (existing[0].sequenceNum ?? 0) + 1 : 1;
      const format: WallCodeFormat = (input.wallCodeFormat as WallCodeFormat) ?? "FW";
      const frr = input.frrDrawn;

      const stackMatch = detectStackedAssembly(
        { points: input.pointsJson, frrDrawn: frr },
        existing.map(e => ({
          id:          e.id,
          pointsJson:  e.pointsJson,
          frrDrawn:    Number(e.frrDrawn),
          isStacked:   e.isStacked ?? 0,
          sequenceNum: e.sequenceNum ?? 1,
        })),
      );

      let wallCode: string;
      let isStacked = 0;
      let stackedWithId: number | null = null;
      let stackSuffix: string | null = null;
      let effectiveFrr: number | null = null;
      let sequenceNum = nextSeq;

      if (stackMatch) {
        sequenceNum = stackMatch.matched.sequenceNum ?? nextSeq;
        const baseCode = generateWallCode(sequenceNum, frr, format, input.wallCodePrefix);
        const { codeA, codeB } = generateStackedCodes(baseCode);

        await db.update(fireAssemblies).set({
          isStacked:    1,
          stackSuffix:  "a",
          wallCode:     codeA,
          effectiveFrr: String(stackMatch.effectiveFrr),
        }).where(eq(fireAssemblies.id, stackMatch.matched.id));

        wallCode      = codeB;
        isStacked     = 1;
        stackedWithId = stackMatch.matched.id;
        stackSuffix   = "b";
        effectiveFrr  = stackMatch.effectiveFrr;
      } else {
        wallCode = generateWallCode(nextSeq, frr, format, input.wallCodePrefix);
      }

      const frrReq = input.occupancyA && input.occupancyB
        ? getRequiredFRR(input.occupancyA, input.occupancyB)
        : null;
      const checkFrr = effectiveFrr ?? frr;
      const isCompliant = frrReq !== null ? checkFrr >= frrReq : null;
      const gap         = frrReq !== null ? +(frrReq - checkFrr).toFixed(1) : null;
      const remediation = frrReq !== null && isCompliant === false
        ? computeRemediation(checkFrr, frrReq, input.occupancyA ?? "D", input.occupancyB ?? "D")
        : null;

      const ulcKey  = frr.toFixed(1);
      const ulcInfo = ULC_DESIGNS[ulcKey];
      const wallName = stackMatch
        ? `${input.labelA ?? "Space A"} / ${input.labelB ?? "Space B"} (Layer B)`
        : `${input.labelA ?? "Space A"} / ${input.labelB ?? "Space B"}`;

      const [result] = await db.insert(fireAssemblies).values({
        drawingAnalysisId: input.drawingAnalysisId,
        pageId:            input.pageId,
        projectId:         input.projectId,
        assemblyType:      input.assemblyType,
        frrDrawn:          String(frr),
        frrRequired:       frrReq !== null ? String(frrReq) : undefined,
        isCompliant:       isCompliant ?? undefined,
        gap:               gap !== null && gap > 0 ? String(gap) : undefined,
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
        nbcReference:      input.nbcReference ?? "NBC Table 3.1.3.4",
        remediationJson:   remediation ?? undefined,
        assemblyLabel:     wallCode,
        wallCode,
        wallName,
        sequenceNum,
        isStacked,
        stackedWithId:     stackedWithId ?? undefined,
        stackSuffix:       stackSuffix ?? undefined,
        effectiveFrr:      effectiveFrr != null ? String(effectiveFrr) : undefined,
        wallCodeFormat:    format,
        ulcDesign:         ulcInfo?.design,
        assemblyDesc:      ulcInfo?.desc,
      });

      return {
        id:           Number((result as any).insertId),
        wallCode,
        wallName,
        isCompliant,
        frrRequired:  frrReq,
        effectiveFrr,
        isStacked:    isStacked === 1,
        stackedWithId,
        stackMatch: stackMatch
          ? {
              matchedId:    stackMatch.matched.id,
              effectiveFrr: stackMatch.effectiveFrr,
              codeA:        generateStackedCodes(
                generateWallCode(sequenceNum, frr, format, input.wallCodePrefix)
              ).codeA,
              codeB:        wallCode,
            }
          : null,
      };
    }),

  renameWall: protectedProcedure
    .input(z.object({
      id:       z.number().int().positive(),
      projectId:z.number().int().positive(),
      wallName: z.string().max(200),
      wallCode: z.string().max(30).optional(),
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
      await db.update(fireAssemblies).set({
        wallName: input.wallName,
        ...(input.wallCode ? { wallCode: input.wallCode, assemblyLabel: input.wallCode } : {}),
      }).where(and(eq(fireAssemblies.id, input.id), eq(fireAssemblies.projectId, input.projectId)));
      return { success: true };
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
        .orderBy(fireAssemblies.sequenceNum, fireAssemblies.stackSuffix);
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
      await db.delete(fireAssemblies).where(
        and(eq(fireAssemblies.id, input.id), eq(fireAssemblies.projectId, input.projectId))
      );
      return { success: true };
    }),
});
