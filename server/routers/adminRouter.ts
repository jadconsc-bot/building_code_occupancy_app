/**
 * Admin Router
 * Provides system administration procedures.
 * All procedures require the 'admin' role.
 */

import { z } from 'zod';
import { adminProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { users, auditLog } from '../../drizzle/schema';
import { eq, desc, and, like, sql } from 'drizzle-orm';
import { logger } from '../logger';

export const adminRouter = router({
  /**
   * Edit a user's name or role.
   * Cannot remove your own admin role.
   */
  editUser: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        role: z.enum(['user', 'admin']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.role !== undefined) updateData.role = input.role;

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No fields to update' });
      }

      if (input.userId === ctx.user.id && input.role === 'user') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot remove your own admin role',
        });
      }

      const [target] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      await db.update(users).set(updateData).where(eq(users.id, input.userId));

      logger.info(`[Admin] User ${input.userId} updated by admin ${ctx.user.id}`, {
        fields: Object.keys(updateData),
      });

      return { success: true };
    }),

  /**
   * Export system audit logs as structured data.
   * Returns up to 500 entries ordered by most recent first.
   */
  exportSystemLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(1000).default(500),
        action: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      }

      const conditions = [];
      if (input.action) {
        conditions.push(like(auditLog.action, `%${input.action}%`));
      }

      const logs = await db
        .select({
          id: auditLog.id,
          userId: auditLog.userId,
          projectId: auditLog.projectId,
          snapshotId: auditLog.snapshotId,
          action: auditLog.action,
          details: auditLog.details,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit);

      logger.info(`[Admin] System logs exported: ${logs.length} entries`);

      return {
        success: true,
        logs,
        count: logs.length,
        exportedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get the system audit trail with optional filters.
   * Supports filtering by userId and action, with pagination.
   */
  getAuditTrail: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive().optional(),
        action: z.string().optional(),
        limit: z.number().int().positive().max(500).default(100),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      }

      const conditions = [];
      if (input.userId !== undefined) {
        conditions.push(eq(auditLog.userId, input.userId));
      }
      if (input.action !== undefined) {
        conditions.push(like(auditLog.action, `%${input.action}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const logs = await db
        .select({
          id: auditLog.id,
          userId: auditLog.userId,
          projectId: auditLog.projectId,
          snapshotId: auditLog.snapshotId,
          action: auditLog.action,
          details: auditLog.details,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .where(whereClause)
        .orderBy(desc(auditLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(auditLog)
        .where(whereClause);

      return {
        logs,
        total: countResult?.count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * List all users with pagination and optional search.
   */
  listUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(200).default(50),
        offset: z.number().int().nonnegative().default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      }

      const conditions = [];
      if (input.search) {
        conditions.push(
          sql`(${users.name} LIKE ${`%${input.search}%`} OR ${users.email} LIKE ${`%${input.search}%`})`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const userList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          loginMethod: users.loginMethod,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.lastSignedIn))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(whereClause);

      return {
        users: userList,
        total: countResult?.count || 0,
      };
    }),
});
