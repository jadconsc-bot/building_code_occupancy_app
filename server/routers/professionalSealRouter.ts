import { eq } from "drizzle-orm";
import { z } from "zod";
import { professionalSeals } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const sealInput = z.object({
  engineerName: z.string().min(1).max(255),
  licenseNumber: z.string().min(1).max(100),
  association: z.string().min(1).max(100),
  associationProvince: z.string().max(50).optional().nullable(),
  licenseExpiry: z.string().optional().nullable(),
});

export const professionalSealRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [seal] = await db.select().from(professionalSeals).where(eq(professionalSeals.userId, ctx.user.id)).limit(1);
    return seal ?? null;
  }),

  upsert: protectedProcedure.input(sealInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const values = { ...input, licenseExpiry: input.licenseExpiry ? new Date(`${input.licenseExpiry}T00:00:00`) : null };
    const [existing] = await db.select({ id: professionalSeals.id }).from(professionalSeals).where(eq(professionalSeals.userId, ctx.user.id)).limit(1);
    if (existing) {
      await db.update(professionalSeals).set({ ...values, isActive: true }).where(eq(professionalSeals.id, existing.id));
      return { id: existing.id };
    }
    const [created] = await db.insert(professionalSeals).values({ ...values, userId: ctx.user.id, isActive: true }).$returningId();
    return { id: created.id };
  }),
});
