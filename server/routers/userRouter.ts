import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const userRouter = router({
  getAreaUnit: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [user] = await db.select({ areaUnit: users.areaUnit }).from(users).where(eq(users.id, ctx.user.id));
    return { areaUnit: user?.areaUnit ?? "m2" as const };
  }),

  setAreaUnit: protectedProcedure
    .input(z.object({ areaUnit: z.enum(["m2", "ft2"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(users).set({ areaUnit: input.areaUnit }).where(eq(users.id, ctx.user.id));
      return { areaUnit: input.areaUnit };
    }),

  getTrainingConsent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [user] = await db
      .select({
        trainingConsent: users.trainingConsent,
        role: users.role,
        trainingConsentUpdatedAt: users.trainingConsentUpdatedAt,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id));
    return {
      trainingConsent: user?.trainingConsent === 1,
      isExempt: user?.role === "admin",
      updatedAt: user?.trainingConsentUpdatedAt ?? null,
    };
  }),

  setTrainingConsent: protectedProcedure
    .input(z.object({ trainingConsent: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(users)
        .set({
          trainingConsent: input.trainingConsent ? 1 : 0,
          trainingConsentUpdatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));
      return { trainingConsent: input.trainingConsent };
    }),
});
