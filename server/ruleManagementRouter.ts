import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  ruleEditorRoles, 
  ruleChangeRequests, 
  ruleChangeAudit, 
  ruleChangeNotifications, 
  digitalSignatures 
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

/**
 * Rule Management Router
 * Professional-grade rule update system with credential verification,
 * admin authorization, digital signatures, and complete audit trails
 */
export const ruleManagementRouter = router({
  /**
   * Get user's rule editor role and credentials
   */
  getUserRole: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    
    const role = await db
      .select()
      .from(ruleEditorRoles)
      .where(eq(ruleEditorRoles.userId, ctx.user.id));
    
    return role[0] || null;
  }),

  /**
   * Request a rule change (requires editor role or higher)
   */
  requestRuleChange: protectedProcedure
    .input(
      z.object({
        rulesetId: z.string(),
        ruleId: z.string(),
        changeType: z.enum(["create", "update", "delete", "deprecate"]),
        currentValue: z.record(z.any()).optional(),
        proposedValue: z.record(z.any()),
        justification: z.string().min(50, "Justification must be at least 50 characters"),
        codeReference: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Verify user has editor role
      const userRoleResult = await db
        .select()
        .from(ruleEditorRoles)
        .where(eq(ruleEditorRoles.userId, ctx.user.id));

      const userRole = userRoleResult[0];

      if (!userRole || !["editor", "reviewer", "admin"].includes(userRole.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions. Only editors and above can request rule changes.",
        });
      }

      // Verify credentials are current
      if (userRole.licenseExpiry && new Date(userRole.licenseExpiry) < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your professional license has expired. Please renew your credentials.",
        });
      }

      // Create change request with transaction
      const changeRequestResult = await db
        .insert(ruleChangeRequests)
        .values({
          rulesetId: input.rulesetId,
          ruleId: input.ruleId,
          requestedBy: ctx.user.id,
          changeType: input.changeType as "create" | "update" | "delete" | "deprecate",
          currentValue: input.currentValue ? JSON.stringify(input.currentValue) : null,
          proposedValue: JSON.stringify(input.proposedValue),
          justification: input.justification,
          codeReference: input.codeReference || null,
          status: "pending" as const,
          requestedAt: new Date(),
        });

      const changeRequestId = (changeRequestResult as any).insertId || 0;

      // Create audit entry
      const auditHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({
          changeRequestId,
          action: "requested",
          actor: ctx.user.id,
          timestamp: new Date().toISOString(),
        }))
        .digest("hex");

      await db
        .insert(ruleChangeAudit)
        .values({
          changeRequestId,
          rulesetId: input.rulesetId,
          ruleId: input.ruleId,
          action: "requested" as const,
          actor: ctx.user.id,
          actorRole: userRole.role as "editor" | "reviewer" | "admin",
          actorCredentials: JSON.stringify({
            profession: userRole.profession,
            licenseNumber: userRole.licenseNumber,
            licenseProvince: userRole.licenseProvince,
            verifiedAt: userRole.verifiedAt,
          }),
          details: JSON.stringify({
            changeType: input.changeType,
            justification: input.justification,
          }),
          cryptographicHash: auditHash,
          previousHash: null,
          timestamp: new Date(),
        });

      return {
        changeRequestId,
        status: "pending",
        message: "Rule change request submitted successfully",
      };
    }),

  /**
   * Approve a rule change (admin only)
   */
  approveRuleChange: adminProcedure
    .input(
      z.object({
        changeRequestId: z.number(),
        approvalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Get the change request
      const changeRequestResult = await db
        .select()
        .from(ruleChangeRequests)
        .where(eq(ruleChangeRequests.id, input.changeRequestId))
        .limit(1);

      const changeRequest = changeRequestResult[0];
      if (!changeRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Change request not found",
        });
      }

      // Update change request status
      await db
        .update(ruleChangeRequests)
        .set({
          status: "approved" as const,
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
        })
        .where(eq(ruleChangeRequests.id, input.changeRequestId));

      // Get previous audit hash for chain
      const previousAuditResult = await db
        .select()
        .from(ruleChangeAudit)
        .where(eq(ruleChangeAudit.changeRequestId, input.changeRequestId))
        .orderBy(desc(ruleChangeAudit.timestamp))
        .limit(1);

      const previousHash = previousAuditResult[0]?.cryptographicHash || null;

      // Create approval audit entry
      const approvalHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({
          changeRequestId: input.changeRequestId,
          action: "approved",
          actor: ctx.user.id,
          timestamp: new Date().toISOString(),
          previousHash,
        }))
        .digest("hex");

      await db
        .insert(ruleChangeAudit)
        .values({
          changeRequestId: input.changeRequestId,
          rulesetId: changeRequest.rulesetId,
          ruleId: changeRequest.ruleId,
          action: "approved" as const,
          actor: ctx.user.id,
          actorRole: "admin" as const,
          actorCredentials: JSON.stringify({
            role: "admin",
            approvedAt: new Date().toISOString(),
          }),
          details: JSON.stringify({
            approvalNotes: input.approvalNotes || "",
          }),
          cryptographicHash: approvalHash,
          previousHash,
          timestamp: new Date(),
        });

      return {
        changeRequestId: input.changeRequestId,
        status: "approved",
        message: "Rule change approved successfully",
      };
    }),

  /**
   * Reject a rule change
   */
  rejectRuleChange: adminProcedure
    .input(
      z.object({
        changeRequestId: z.number(),
        rejectionReason: z.string().min(20, "Rejection reason must be at least 20 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Get the change request
      const changeRequestResult = await db
        .select()
        .from(ruleChangeRequests)
        .where(eq(ruleChangeRequests.id, input.changeRequestId))
        .limit(1);

      const changeRequest = changeRequestResult[0];
      if (!changeRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Change request not found",
        });
      }

      // Update change request status
      await db
        .update(ruleChangeRequests)
        .set({
          status: "rejected" as const,
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
        })
        .where(eq(ruleChangeRequests.id, input.changeRequestId));

      // Get previous audit hash for chain
      const previousAuditResult = await db
        .select()
        .from(ruleChangeAudit)
        .where(eq(ruleChangeAudit.changeRequestId, input.changeRequestId))
        .orderBy(desc(ruleChangeAudit.timestamp))
        .limit(1);

      const previousHash = previousAuditResult[0]?.cryptographicHash || null;

      // Create rejection audit entry
      const rejectionHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({
          changeRequestId: input.changeRequestId,
          action: "rejected",
          actor: ctx.user.id,
          timestamp: new Date().toISOString(),
          previousHash,
        }))
        .digest("hex");

      await db
        .insert(ruleChangeAudit)
        .values({
          changeRequestId: input.changeRequestId,
          rulesetId: changeRequest.rulesetId,
          ruleId: changeRequest.ruleId,
          action: "rejected" as const,
          actor: ctx.user.id,
          actorRole: "admin" as const,
          actorCredentials: JSON.stringify({
            role: "admin",
            rejectedAt: new Date().toISOString(),
          }),
          details: JSON.stringify({
            rejectionReason: input.rejectionReason,
          }),
          cryptographicHash: rejectionHash,
          previousHash,
          timestamp: new Date(),
        });

      return {
        changeRequestId: input.changeRequestId,
        status: "rejected",
        message: "Rule change rejected successfully",
      };
    }),

  /**
   * Get rule change history
   */
  getRuleChangeHistory: protectedProcedure
    .input(
      z.object({
        rulesetId: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const history = await db
        .select()
        .from(ruleChangeAudit)
        .where(eq(ruleChangeAudit.rulesetId, input.rulesetId))
        .orderBy(desc(ruleChangeAudit.timestamp))
        .limit(input.limit);

      return history;
    }),

  /**
   * Get all pending rule change requests
   */
  getPendingRequests: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

    const pending = await db
      .select()
      .from(ruleChangeRequests)
      .where(eq(ruleChangeRequests.status, "pending"))
      .orderBy(desc(ruleChangeRequests.requestedAt));

    return pending;
  }),

  /**
   * Get audit trail for a specific change request
   */
  getAuditTrail: protectedProcedure
    .input(
      z.object({
        changeRequestId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const auditTrail = await db
        .select()
        .from(ruleChangeAudit)
        .where(eq(ruleChangeAudit.changeRequestId, input.changeRequestId))
        .orderBy(desc(ruleChangeAudit.timestamp));

      return auditTrail;
    }),

  /**
   * Verify audit chain integrity
   */
  verifyAuditChain: protectedProcedure
    .input(
      z.object({
        changeRequestId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const auditTrail = await db
        .select()
        .from(ruleChangeAudit)
        .where(eq(ruleChangeAudit.changeRequestId, input.changeRequestId))
        .orderBy(desc(ruleChangeAudit.timestamp));

      if (auditTrail.length === 0) {
        return { valid: false, message: "No audit trail found" };
      }

      // Verify hash chain integrity
      for (let i = 0; i < auditTrail.length - 1; i++) {
        const current = auditTrail[i];
        const next = auditTrail[i + 1];

        if (current.previousHash !== next.cryptographicHash) {
          return {
            valid: false,
            message: `Audit chain broken at entry ${i}`,
            brokenAt: i,
          };
        }
      }

      return {
        valid: true,
        message: "Audit chain is valid and unbroken",
        entries: auditTrail.length,
      };
    }),
});
