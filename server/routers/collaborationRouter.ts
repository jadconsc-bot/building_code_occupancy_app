/**
 * Collaboration Router
 * 
 * Handles user-to-user project sharing and collaboration audit trail
 * All procedures require authentication and validate user ownership
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { projectShares, collaborationAuditLog, projects, users } from '../../drizzle/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

export const collaborationRouter = {
  /**
   * Share a project with another user
   * Only the project owner can share
   * Creates audit log entry
   */
  shareProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive('Project ID must be positive'),
        sharedWithUserId: z.number().int().positive('User ID must be positive'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed',
        });
      }

      try {
        // Verify project exists and user is owner
        const project = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
          .limit(1);

        if (!project || project.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found or you do not have permission to share it',
          });
        }

        // Verify recipient user exists
        const recipient = await db
          .select()
          .from(users)
          .where(eq(users.id, input.sharedWithUserId))
          .limit(1);

        if (!recipient || recipient.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Recipient user not found',
          });
        }

        // Prevent self-sharing
        if (input.sharedWithUserId === ctx.user.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot share a project with yourself',
          });
        }

        // Check if already shared (active share)
        const existingShare = await db
          .select()
          .from(projectShares)
          .where(
            and(
              eq(projectShares.projectId, input.projectId),
              eq(projectShares.sharedWithUserId, input.sharedWithUserId),
              isNull(projectShares.revokedAt)
            )
          )
          .limit(1);

        if (existingShare && existingShare.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Project is already shared with this user',
          });
        }

        // Create share record
        const share = await db.insert(projectShares).values({
          projectId: input.projectId,
          sharedByUserId: ctx.user.id,
          sharedWithUserId: input.sharedWithUserId,
        });

        // Create audit log entry
        await db.insert(collaborationAuditLog).values({
          projectId: input.projectId,
          action: 'SHARED',
          sharedByUserId: ctx.user.id,
          sharedWithUserId: input.sharedWithUserId,
          details: {
            projectName: project[0].name,
            recipientName: recipient[0].name,
          },
          ipAddress: null,
          userAgent: null,
        });

        return {
          success: true,
          message: `Project shared with ${recipient[0].name}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('[Collaboration] Share error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to share project',
        });
      }
    }),

  /**
   * Revoke project access from a user
   * Only the project owner can revoke
   * Soft-deletes the share record and creates audit log
   */
  unshareProject: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive('Project ID must be positive'),
        sharedWithUserId: z.number().int().positive('User ID must be positive'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed',
        });
      }

      try {
        // Verify project exists and user is owner
        const project = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
          .limit(1);

        if (!project || project.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found or you do not have permission to revoke access',
          });
        }

        // Find active share
        const share = await db
          .select()
          .from(projectShares)
          .where(
            and(
              eq(projectShares.projectId, input.projectId),
              eq(projectShares.sharedWithUserId, input.sharedWithUserId),
              isNull(projectShares.revokedAt)
            )
          )
          .limit(1);

        if (!share || share.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No active share found for this user',
          });
        }

        // Soft-delete: set revokedAt timestamp
        await db
          .update(projectShares)
          .set({ revokedAt: new Date() })
          .where(eq(projectShares.id, share[0].id));

        // Get recipient info for audit log
        const recipient = await db
          .select()
          .from(users)
          .where(eq(users.id, input.sharedWithUserId))
          .limit(1);

        // Create audit log entry
        await db.insert(collaborationAuditLog).values({
          projectId: input.projectId,
          action: 'UNSHARED',
          sharedByUserId: ctx.user.id,
          sharedWithUserId: input.sharedWithUserId,
          details: {
            projectName: project[0].name,
            recipientName: recipient?.[0]?.name || 'Unknown',
            reason: 'Access revoked by owner',
          },
          ipAddress: null,
          userAgent: null,
        });

        return {
          success: true,
          message: `Access revoked for ${recipient?.[0]?.name || 'user'}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('[Collaboration] Unshare error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to revoke access',
        });
      }
    }),

  /**
   * List all projects shared with the current user
   * Returns projects owned by others and shared with current user
   */
  listSharedWithMe: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });
    }

    try {
      const sharedProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          occupancyCode: projects.occupancyCode,
          status: projects.status,
          sharedByUserId: projectShares.sharedByUserId,
          sharedByName: users.name,
          sharedByEmail: users.email,
          sharedAt: projectShares.createdAt,
          overallProgress: projects.overallProgress,
        })
        .from(projectShares)
        .innerJoin(projects, eq(projectShares.projectId, projects.id))
        .innerJoin(users, eq(projectShares.sharedByUserId, users.id))
        .where(
          and(
            eq(projectShares.sharedWithUserId, ctx.user.id),
            isNull(projectShares.revokedAt)
          )
        )
        .orderBy(desc(projectShares.createdAt));

      return sharedProjects;
    } catch (error) {
      console.error('[Collaboration] List shared error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch shared projects',
      });
    }
  }),

  /**
   * List all users a project is shared with
   * Only the project owner can view this
   */
  listProjectShares: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed',
        });
      }

      try {
        // Verify project exists and user is owner
        const project = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
          .limit(1);

        if (!project || project.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found or you do not have permission to view shares',
          });
        }

        // Get all shares (active and revoked)
        const shares = await db
          .select({
            id: projectShares.id,
            userId: projectShares.sharedWithUserId,
            name: users.name,
            email: users.email,
            sharedAt: projectShares.createdAt,
            revokedAt: projectShares.revokedAt,
            isActive: isNull(projectShares.revokedAt),
          })
          .from(projectShares)
          .innerJoin(users, eq(projectShares.sharedWithUserId, users.id))
          .where(eq(projectShares.projectId, input.projectId))
          .orderBy(desc(projectShares.createdAt));

        return shares;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('[Collaboration] List shares error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project shares',
        });
      }
    }),

  /**
   * Get collaboration audit log for a project
   * Only the project owner can view the audit log
   */
  getAuditLog: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection failed',
        });
      }

      try {
        // Verify project exists and user is owner
        const project = await db
          .select()
          .from(projects)
          .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
          .limit(1);

        if (!project || project.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found or you do not have permission to view audit log',
          });
        }

        // Get audit log entries
        const logs = await db
          .select({
            id: collaborationAuditLog.id,
            action: collaborationAuditLog.action,
            sharedByName: sql<string>`COALESCE(${users.name}, 'System')`.as('sharedByName'),
            sharedWithName: sql<string>`COALESCE(u2.name, 'Unknown')`.as('sharedWithName'),
            details: collaborationAuditLog.details,
            createdAt: collaborationAuditLog.createdAt,
            ipAddress: collaborationAuditLog.ipAddress,
          })
          .from(collaborationAuditLog)
          .leftJoin(users, eq(collaborationAuditLog.sharedByUserId, users.id))
          .where(eq(collaborationAuditLog.projectId, input.projectId))
          .orderBy(desc(collaborationAuditLog.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count
        const countResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(collaborationAuditLog)
          .where(eq(collaborationAuditLog.projectId, input.projectId));

        return {
          logs,
          total: countResult[0]?.count || 0,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('[Collaboration] Get audit log error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch audit log',
        });
      }
    }),

  /**
   * Get collaboration statistics for current user
   * Shows how many projects they own, share, and have received
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });
    }

    try {
      // Count projects owned by user
      const ownedResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(projects)
        .where(eq(projects.userId, ctx.user.id));

      // Count active shares user has created
      const sharedResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(projectShares)
        .where(
          and(
            eq(projectShares.sharedByUserId, ctx.user.id),
            isNull(projectShares.revokedAt)
          )
        );

      // Count active shares user has received
      const receivedResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(projectShares)
        .where(
          and(
            eq(projectShares.sharedWithUserId, ctx.user.id),
            isNull(projectShares.revokedAt)
          )
        );

      return {
        projectsOwned: ownedResult[0]?.count || 0,
        projectsSharedByMe: sharedResult[0]?.count || 0,
        projectsSharedWithMe: receivedResult[0]?.count || 0,
      };
    } catch (error) {
      console.error('[Collaboration] Get stats error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch collaboration statistics',
      });
    }
  }),
};
