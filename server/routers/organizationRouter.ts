import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { organizations, users, roomCorrections, trainingExamples } from "../../drizzle/schema";
import { eq, and, isNull, count } from "drizzle-orm";

export const organizationRouter = router({

  getMyOrg: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [userRow] = await db
        .select({ orgId: users.orgId })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userRow?.orgId) return null;

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, userRow.orgId))
        .limit(1);

      return org ?? null;
    }),

  createOrg: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.insert(organizations).values({
        name: input.name,
        slug: input.slug,
        planTier: "professional",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { id: result[0].insertId };
    }),

  assignUserToOrg: protectedProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      orgId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(users)
        .set({ orgId: input.orgId })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  getOrgTrainingStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [userRow] = await db
        .select({ orgId: users.orgId })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userRow?.orgId) return { count: 0, byPlanType: [] };

      const stats = await db
        .select({
          planType: trainingExamples.planType,
          count: count(),
        })
        .from(trainingExamples)
        .where(
          and(
            eq(trainingExamples.orgId, userRow.orgId),
            eq(trainingExamples.isActive, 1),
          )
        )
        .groupBy(trainingExamples.planType);

      return {
        count: stats.reduce((sum, s) => sum + Number(s.count), 0),
        byPlanType: stats,
      };
    }),

  exportOrgTrainingData: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [userRow] = await db
        .select({ orgId: users.orgId })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userRow?.orgId) return { corrections: [], examples: [] };

      const corrections = await db
        .select()
        .from(roomCorrections)
        .where(eq(roomCorrections.orgId, userRow.orgId));

      const examples = await db
        .select()
        .from(trainingExamples)
        .where(eq(trainingExamples.orgId, userRow.orgId));

      return { corrections, examples };
    }),
});
