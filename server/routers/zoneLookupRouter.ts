import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { lookupZone } from "../services/zoneLookupService";

export const zoneLookupRouter = router({
  lookup: protectedProcedure
    .input(z.object({
      address:      z.string().min(5),
      municipality: z.string().min(2),
      province:     z.string().default('AB'),
    }))
    .mutation(async ({ input }) => {
      const result = await lookupZone(
        input.address,
        input.municipality,
        input.province,
      );
      return result ?? { error: 'Zone not found for this address' };
    }),

  saveToProject: protectedProcedure
    .input(z.object({
      projectId:     z.number().int().positive(),
      address:       z.string().max(200).trim(),
      municipality:  z.string().max(100).trim(),
      province:      z.string().max(5).trim(),
      zoneCode:      z.string().max(50).trim(),
      zoneName:      z.string().max(200).trim(),
      communityName: z.string().max(200).trim().nullable(),
      lat:           z.number(),
      lng:           z.number(),
      source:        z.string().max(50).trim(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const [project] = await db
        .select({ userId: projects.userId })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }
      if (project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      await db.update(projects)
        .set({
          address:          input.address,
          municipality:     input.municipality,
          province:         input.province,
          zoneCode:         input.zoneCode,
          zoneName:         input.zoneName,
          zoneLookupSource: input.source as any,
          parcelLat:        input.lat.toString(),
          parcelLng:        input.lng.toString(),
          communityName:    input.communityName,
          zoneConfirmedAt:  new Date(),
        })
        .where(eq(projects.id, input.projectId));
      return { success: true };
    }),
});
