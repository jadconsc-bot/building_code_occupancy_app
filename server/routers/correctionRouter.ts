import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { roomCorrections, trainingExamples, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { saveCorrection } from "../services/correctionService";

const CORRECTION_ROLES = ["admin", "rule_editor"] as const;

export const correctionRouter = router({

  saveCorrection: protectedProcedure
    .input(z.object({
      roomId: z.number().int().positive(),
      pageId: z.number().int().positive(),
      correctionType: z.enum([
        "label_rename",
        "occupancy_change",
        "boundary_redraw",
        "false_positive_delete",
        "missing_room_add",
      ]),
      previousValue: z.record(z.string(), z.unknown()),
      correctedValue: z.record(z.string(), z.unknown()),
      planType: z.string().default("floor_plan"),
      notes: z.string().optional(),
      conventionType: z.enum([
        'label_convention',
        'symbol_convention',
        'layout_convention',
        'equipment_convention',
        'occupancy_convention',
        'correction',
      ]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!CORRECTION_ROLES.includes(ctx.user.role as any)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin or rule_editor only" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [userRow] = await db
        .select({ orgId: users.orgId })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const correctionId = await saveCorrection({
        ...input,
        correctedBy: ctx.user.id,
        orgId: userRow?.orgId ?? null,
      });

      return { success: true, correctionId };
    }),

  getPageCorrections: protectedProcedure
    .input(z.object({ pageId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      if (!CORRECTION_ROLES.includes(ctx.user.role as any)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db
        .select()
        .from(roomCorrections)
        .where(eq(roomCorrections.pageId, input.pageId))
        .orderBy(desc(roomCorrections.correctedAt));
    }),

  getTrainingExamples: protectedProcedure
    .input(z.object({ planType: z.string() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db
        .select()
        .from(trainingExamples)
        .where(eq(trainingExamples.planType, input.planType))
        .orderBy(desc(trainingExamples.createdAt));
    }),

  getAllTrainingExamples: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return db
        .select()
        .from(trainingExamples)
        .orderBy(desc(trainingExamples.createdAt));
    }),

  toggleTrainingExample: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(trainingExamples)
        .set({ isActive: input.isActive ? 1 : 0 })
        .where(eq(trainingExamples.id, input.id));

      return { success: true };
    }),
});
