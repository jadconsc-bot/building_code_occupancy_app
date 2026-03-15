/**
 * Audit Router
 *
 * tRPC procedures for audit event logging and retrieval.
 *
 * All audit events are immutable and append-only.
 * Server-side timestamps are enforced (never client-side).
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { auditEventService, AuditEventInputSchema, AUDIT_EVENT_TYPES } from '../services/AuditEventService';
import { TRPCError } from '@trpc/server';

export const auditRouter = router({
  /**
   * Log an audit event
   *
   * Validates all input, enforces server-side timestamp, and stores immutably.
   *
   * @param input Audit event input with full credentials
   * @returns Audit event result with server-generated timestamp
   */
  logEvent: protectedProcedure
    .input(AuditEventInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          });
        }

        // Log the audit event
        const result = await auditEventService.logAuditEvent(input);

        console.log('[auditRouter] Audit event logged:', {
          eventId: result.eventId,
          action: result.action,
          userId: input.userId,
          analysisId: input.analysisId,
          timestamp: result.timestamp.toISOString(),
        });

        return result;
      } catch (error) {
        console.error('[auditRouter] Failed to log audit event:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to log audit event',
        });
      }
    }),

  /**
   * Get audit trail for an analysis
   *
   * Returns all audit events for an analysis in chronological order.
   *
   * @param analysisId Analysis ID
   * @returns Array of audit events
   */
  getTrail: protectedProcedure
    .input(z.object({ analysisId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          });
        }

        const trail = await auditEventService.getAuditTrail(input.analysisId);

        console.log('[auditRouter] Audit trail retrieved:', {
          analysisId: input.analysisId,
          eventCount: trail.length,
          userId: ctx.user.id,
        });

        return trail;
      } catch (error) {
        console.error('[auditRouter] Failed to retrieve audit trail:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve audit trail',
        });
      }
    }),

  /**
   * Verify audit trail integrity
   *
   * Checks that all required audit events are present and in correct order.
   *
   * @param analysisId Analysis ID
   * @returns Integrity check result
   */
  verifyIntegrity: protectedProcedure
    .input(z.object({ analysisId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          });
        }

        const integrity = await auditEventService.verifyAuditTrailIntegrity(input.analysisId);

        console.log('[auditRouter] Audit trail integrity verified:', {
          analysisId: input.analysisId,
          isValid: integrity.isValid,
          eventCount: integrity.eventCount,
          missingEvents: integrity.missingEvents,
          userId: ctx.user.id,
        });

        return integrity;
      } catch (error) {
        console.error('[auditRouter] Failed to verify audit trail integrity:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify audit trail integrity',
        });
      }
    }),

  /**
   * Get available audit event types
   *
   * Returns list of all valid audit event types for reference.
   *
   * @returns Object with all audit event type constants
   */
  getEventTypes: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User authentication required',
      });
    }

    return AUDIT_EVENT_TYPES;
  }),
});
