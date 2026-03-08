import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { auditTrailService } from './auditTrailService';

/**
 * Audit Router - tRPC procedures for audit trail operations
 * 
 * All procedures are protected (require authentication)
 * Used by Compliance.tsx and AuditTrailViewer component
 */
export const auditRouter = router({
  /**
   * Create audit log from compliance evaluation results
   * Called after compliance check is complete
   */
  createAuditLog: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        complianceResults: z.object({
          rule_trace: z.array(
            z.object({
              fired: z.boolean(),
              rule_id: z.string(),
              clause: z.string(),
              conditions_met: z.boolean(),
            })
          ),
          compliance_flags: z.object({
            isCompliant: z.boolean(),
          }),
        }),
        projectData: z.record(z.string(), z.any()),
        projectInfo: z.object({
          name: z.string(),
          engineer: z.string(),
          licenseNumber: z.string().optional(),
          email: z.string().optional(),
          codeVersion: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auditId = await auditTrailService.createAuditLog(
        input.projectId,
        ctx.user.id,
        input.complianceResults,
        input.projectData,
        input.projectInfo
      );

      return {
        success: true,
        auditId,
        message: 'Audit log created successfully',
      };
    }),

  /**
   * Sign audit log with digital signature
   * Called from SignaturePad component
   */
  signAuditLog: protectedProcedure
    .input(
      z.object({
        auditId: z.string(),
        signatureImage: z.string(), // Base64 PNG
      })
    )
    .mutation(async ({ ctx, input }) => {
      await auditTrailService.signAuditLog(
        input.auditId,
        ctx.user.id,
        input.signatureImage
      );

      return {
        success: true,
        message: 'Audit log signed successfully',
      };
    }),

  /**
   * Verify audit integrity
   * Used to show verification badge
   */
  verifyAuditIntegrity: protectedProcedure
    .input(
      z.object({
        auditId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const isValid = await auditTrailService.verifyAuditIntegrity(input.auditId);

      return {
        isValid,
        status: isValid ? 'VERIFIED' : 'INVALID',
      };
    }),

  /**
   * Generate legal defense report
   * Engineers download this for permit submission
   */
  generateDefenseReport: protectedProcedure
    .input(
      z.object({
        auditId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const report = await auditTrailService.generateDefenseReport(input.auditId);

      return {
        success: true,
        report,
        contentType: 'text/plain',
        filename: `audit-report-${input.auditId}.txt`,
      };
    }),

  /**
   * Get all project audits
   * Used by AuditTrailViewer component
   */
  getProjectAudits: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const audits = await auditTrailService.getProjectAudits(input.projectId);

      return {
        success: true,
        audits,
        count: audits.length,
      };
    }),

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
      const auditId = await auditTrailService.createAuditLog(
        0,
        ctx.user.id,
        {
          rule_trace: [],
          compliance_flags: { isCompliant: true },
        },
        {
          acknowledgmentType: input.acknowledgmentType,
          timestamp: input.timestamp.toISOString(),
          userAgent: input.userAgent,
        },
        {
          name: 'Legal Acknowledgment',
          engineer: ctx.user.name || 'Unknown',
        }
      );

      return {
        success: true,
        message: 'Legal acknowledgment recorded',
        auditId,
      };
    }),
});
