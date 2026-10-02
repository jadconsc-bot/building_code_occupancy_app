import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { professionalSeals, projectConstraintOverrides } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const createInput = z.object({
  projectId: z.number(),
  snapshotId: z.string().min(1),
  constraintId: z.string().min(1),
  assertedValue: z.string().min(1).max(2000),
  justification: z.string().min(20).max(10000),
});

export function professionalSealIsUsable(seal: { isActive: boolean; licenseExpiry: Date | string | null }, now = new Date()): boolean {
  if (!seal.isActive) return false;
  if (!seal.licenseExpiry) return true;
  return new Date(seal.licenseExpiry) > now;
}

export const projectOverridesRouter = router({
  create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [seal] = await db.select().from(professionalSeals).where(eq(professionalSeals.userId, ctx.user.id)).limit(1);
    if (!seal) throw new TRPCError({ code: "FORBIDDEN", message: "You need a professional seal on file to add an override." });
    if (!professionalSealIsUsable(seal)) {
      const message = seal.isActive ? "Your professional seal has expired. Update it in Settings before adding an override." : "Your professional seal is inactive. Update it in Settings before adding an override.";
      throw new TRPCError({ code: "FORBIDDEN", message });
    }
    const [created] = await db.insert(projectConstraintOverrides).values({
      ...input,
      createdByUserId: ctx.user.id,
      credentialEngineerName: seal.engineerName,
      credentialLicenseNumber: seal.licenseNumber,
      credentialAssociation: seal.association,
      credentialAssociationProvince: seal.associationProvince ?? null,
    }).$returningId();
    return { id: created.id };
  }),

  listForSnapshot: protectedProcedure.input(z.object({ snapshotId: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(projectConstraintOverrides)
      .where(eq(projectConstraintOverrides.snapshotId, input.snapshotId))
      .orderBy(desc(projectConstraintOverrides.createdAt), desc(projectConstraintOverrides.id));
  }),
});
