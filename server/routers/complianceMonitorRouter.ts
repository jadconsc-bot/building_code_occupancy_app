import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { complianceNotifications } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { runComplianceMonitor } from '../services/complianceMonitorService';

export const complianceMonitorRouter = router({

  getNotifications: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'reviewed', 'actioned', 'dismissed', 'all']).default('all'),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.status === 'all') {
        return db
          .select()
          .from(complianceNotifications)
          .orderBy(desc(complianceNotifications.createdAt))
          .limit(50);
      }

      return db
        .select()
        .from(complianceNotifications)
        .where(eq(complianceNotifications.status, input.status))
        .orderBy(desc(complianceNotifications.createdAt))
        .limit(50);
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['reviewed', 'actioned', 'dismissed']),
      reviewNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(complianceNotifications)
        .set({
          status: input.status,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes ?? null,
        })
        .where(eq(complianceNotifications.id, input.id));

      return { success: true };
    }),

  triggerRun: protectedProcedure
    .mutation(async () => {
      return runComplianceMonitor();
    }),

  getPendingCount: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { count: 0 };

      const rows = await db
        .select({ id: complianceNotifications.id })
        .from(complianceNotifications)
        .where(eq(complianceNotifications.status, 'pending'));

      return { count: rows.length };
    }),
});
