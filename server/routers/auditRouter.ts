import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  logComplianceAction,
  createSignature,
  verifySignature,
  getAuditTrail,
  exportAuditReport,
  trackModification,
} from "../services/auditTrailService";
import { TRPCError } from "@trpc/server";

/**
 * Audit Router
 * tRPC procedures for audit trail management
 * All procedures require authentication (protectedProcedure)
 */

export const auditRouter = router({
  /**
   * Log a compliance action to the audit trail
   * Requires: projectId, action, actionType
   * Returns: auditLogId
   */
  logAction: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        action: z.string().min(1).max(100),
        actionType: z.enum(["view", "create", "modify", "delete", "export", "sign", "verify"]),
        details: z.record(z.string(), z.unknown()).optional(),
        snapshotId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const auditLogId = await logComplianceAction({
          projectId: input.projectId,
          userId: ctx.user.id,
          action: input.action,
          actionType: input.actionType,
          details: input.details,
          snapshotId: input.snapshotId,
          ipAddress: (ctx.req as any)?.ip || undefined,
          userAgent: (ctx.req as any)?.headers?.["user-agent"] || undefined,
        });

        return {
          success: true,
          auditLogId,
        };
      } catch (error) {
        console.error("[AuditRouter] Failed to log action:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to log compliance action",
        });
      }
    }),

  /**
   * Create a digital signature for a compliance action
   * Requires: auditLogId, projectId, signatureType, signature
   * Returns: signatureId
   */
  createSignature: protectedProcedure
    .input(
      z.object({
        auditLogId: z.string().uuid(),
        projectId: z.number().int().positive(),
        signatureType: z.enum(["approval", "review", "verification", "acknowledgment"]),
        signature: z.string().min(1),
        publicKey: z.string().optional(),
        certificateChain: z.string().optional(),
        signatureAlgorithm: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const signatureId = await createSignature({
          auditLogId: input.auditLogId,
          projectId: input.projectId,
          signedBy: ctx.user.id,
          signatureType: input.signatureType,
          signature: input.signature,
          publicKey: input.publicKey,
          certificateChain: input.certificateChain,
          signatureAlgorithm: input.signatureAlgorithm,
        });

        return {
          success: true,
          signatureId,
        };
      } catch (error) {
        console.error("[AuditRouter] Failed to create signature:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create digital signature",
        });
      }
    }),

  /**
   * Verify a digital signature
   * Requires: signatureId
   * Returns: verification status
   */
  verifySignature: protectedProcedure
    .input(
      z.object({
        signatureId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const isValid = await verifySignature(input.signatureId);

        return {
          success: true,
          isValid,
          verifiedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error("[AuditRouter] Failed to verify signature:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify digital signature",
        });
      }
    }),

  /**
   * Track a modification to compliance data
   * Requires: auditLogId, projectId, entityType, entityId, changeType
   * Returns: modificationId
   */
  trackModification: protectedProcedure
    .input(
      z.object({
        auditLogId: z.string().uuid(),
        projectId: z.number().int().positive(),
        entityType: z.enum(["snapshot", "calculation", "report", "project"]),
        entityId: z.string().min(1),
        changeType: z.enum(["created", "updated", "deleted", "restored"]),
        fieldName: z.string().optional(),
        previousValue: z.record(z.string(), z.unknown()).optional(),
        newValue: z.record(z.string(), z.unknown()).optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const modificationId = await trackModification({
          auditLogId: input.auditLogId,
          projectId: input.projectId,
          modifiedBy: ctx.user.id,
          entityType: input.entityType,
          entityId: input.entityId,
          changeType: input.changeType,
          fieldName: input.fieldName,
          previousValue: input.previousValue,
          newValue: input.newValue,
          reason: input.reason,
          ipAddress: (ctx.req as any)?.ip || undefined,
          userAgent: (ctx.req as any)?.headers?.["user-agent"] || undefined,
        });

        return {
          success: true,
          modificationId,
        };
      } catch (error) {
        console.error("[AuditRouter] Failed to track modification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to track modification",
        });
      }
    }),

  /**
   * Get complete audit trail for a project
   * Requires: projectId
   * Returns: auditLogs, signatures, modifications
   */
  getAuditTrail: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        limit: z.number().int().positive().max(1000).optional().default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const auditTrail = await getAuditTrail(input.projectId, input.limit);

        return {
          success: true,
          auditLogs: auditTrail.auditLogs,
          signatures: auditTrail.signatures,
          modifications: auditTrail.modifications,
        };
      } catch (error) {
        console.error("[AuditRouter] Failed to get audit trail:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve audit trail",
        });
      }
    }),

  /**
   * Export audit report for compliance purposes
   * Requires: projectId
   * Returns: audit report as JSON string
   */
  exportAuditReport: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      try {
        const report = await exportAuditReport(input.projectId);

        return {
          success: true,
          report: report,
          exportedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error("[AuditRouter] Failed to export audit report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export audit report",
        });
      }
    }),
});
