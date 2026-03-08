import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { auditTrailService } from './auditTrailService';

/**
 * Audit Router - tRPC procedures for audit trail operations
 * 
 * All procedures are protected (require authentication)
 * Used for compliance tracking and legal defensibility
 */
export const auditRouter = router({
  /**
   * Log legal disclaimer acknowledgment
   * Called from RequiredLegalAcknowledgment component
   * Records when user accepts legal terms
   */
  logAcknowledgment: protectedProcedure
    .input(
      z.object({
        acknowledgmentType: z.enum(['LEGAL_DISCLAIMER']),
        timestamp: z.date(),
        userAgent: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auditTrailService.log(
          ctx.user.id,
          'legal_disclaimer_acknowledged',
          {
            acknowledgmentType: input.acknowledgmentType,
            timestamp: input.timestamp.toISOString(),
            userAgent: input.userAgent,
            userName: ctx.user.name || 'Unknown',
            userEmail: ctx.user.email || 'Unknown',
          }
        );

        return {
          success: true,
          message: 'Legal acknowledgment recorded in audit trail',
        };
      } catch (error) {
        console.error('Failed to log acknowledgment:', error);
        return {
          success: false,
          message: 'Failed to record acknowledgment',
        };
      }
    }),

  /**
   * Get legal disclaimer acknowledgments for current user
   * Used to verify user has acknowledged terms
   */
  getUserAcknowledgments: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const logs = await auditTrailService.getUserAuditLogs(ctx.user.id);
        const acknowledgments = logs.filter(
          log => log.action === 'legal_disclaimer_acknowledged'
        );

        return {
          success: true,
          acknowledgments,
          hasAcknowledged: acknowledgments.length > 0,
          lastAcknowledgedAt: acknowledgments[0]?.createdAt || null,
        };
      } catch (error) {
        console.error('Failed to retrieve acknowledgments:', error);
        return {
          success: false,
          acknowledgments: [],
          hasAcknowledged: false,
        };
      }
    }),

  /**
   * Get all legal disclaimer acknowledgments (admin only)
   * Used for compliance audits
   */
  getAllAcknowledgments: protectedProcedure
    .query(async ({ ctx }) => {
      // Only admins can view all acknowledgments
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      try {
        const acknowledgments = await auditTrailService.getLegalDisclaimerAcknowledgments(1000);

        return {
          success: true,
          acknowledgments,
          count: acknowledgments.length,
        };
      } catch (error) {
        console.error('Failed to retrieve all acknowledgments:', error);
        return {
          success: false,
          acknowledgments: [],
          count: 0,
        };
      }
    }),

  /**
   * Get project audits - placeholder for future implementation
   */
  getProjectAudits: protectedProcedure
    .input(
      z.object({ projectId: z.number() })
    )
    .query(async ({ input }) => {
      // Placeholder - will be implemented in Phase 2
      return {
        audits: [],
        count: 0,
      };
    }),

  /**
   * Verify audit integrity - placeholder for future implementation
   */
  verifyAuditIntegrity: protectedProcedure
    .input(
      z.object({ auditId: z.string() })
    )
    .query(async ({ input }) => {
      // Placeholder - will be implemented in Phase 2
      return {
        isValid: true,
        message: 'Audit integrity verification coming in Phase 2',
      };
    }),

  /**
   * Generate defense report - placeholder for future implementation
   */
  generateDefenseReport: protectedProcedure
    .input(
      z.object({ auditId: z.string() })
    )
    .query(async ({ input }) => {
      // Placeholder - will be implemented in Phase 2
      return {
        report: 'Defense report generation coming in Phase 2',
        filename: 'defense-report.txt',
      };
    }),

  /**
   * Create audit log - placeholder for future implementation
   */
  createAuditLog: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        complianceResults: z.any(),
        projectData: z.any(),
        projectInfo: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      // Placeholder - will be implemented in Phase 2
      return {
        auditId: 'audit-' + Date.now(),
        success: true,
        message: 'Audit log creation coming in Phase 2',
      };
    }),
});
