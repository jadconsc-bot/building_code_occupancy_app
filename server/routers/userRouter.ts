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
});
