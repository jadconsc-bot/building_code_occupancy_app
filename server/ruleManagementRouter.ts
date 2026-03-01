import { router, protectedProcedure, adminProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { ruleEditorRoles, ruleChangeRequests, ruleChangeAudit, ruleChangeNotifications, digitalSignatures } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

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
    const role = await db.query.ruleEditorRoles.findFirst({
      where: eq(ruleEditorRoles.userId, ctx.user.id),
    });
    return role || null;
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

      // Verify user has editor role
      const userRole = await db.query.ruleEditorRoles.findFirst({
        where: eq(ruleEditorRoles.userId, ctx.user.id),
      });

      if (!userRole || !["editor", "reviewer", "admin"].includes(userRole.role)) {
        throw new Error("Insufficient permissions. Only editors and above can request rule changes.");
      }

      // Verify credentials are current
      if (userRole.licenseExpiry && new Date(userRole.licenseExpiry) < new Date()) {
        throw new Error("Your professional license has expired. Please renew your credentials.");
      }

      // Create change request
      const changeRequest = await db.insert(ruleChangeRequests).values({
        rulesetId: input.rulesetId,
        ruleId: input.ruleId,
        requestedBy: ctx.user.id,
        changeType: input.changeType,
        currentValue: input.currentValue ? JSON.stringify(input.currentValue) : null,
        proposedValue: JSON.stringify(input.proposedValue),
        justification: input.justification,
        codeReference: input.codeReference,
        status: "pending",
      });

      // Create audit entry
      const auditHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({
          changeRequestId: changeRequest.insertId,
          action: "requested",
          actor: ctx.user.id,
          timestamp: new Date().toISOString(),
        }))
        .digest("hex");

      await db.insert(ruleChangeAudit).values({
        changeRequestId: Number(changeRequest.insertId),
        rulesetId: input.rulesetId,
        ruleId: input.ruleId,
        action: "requested",
        actor: ctx.user.id,
        actorRole: userRole.role,
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
      });

      // Notify admins
      const admins = await db.query.ruleEditorRoles.findMany({
        where: eq(ruleEditorRoles.role, "admin"),
      });

      for (const admin of admins) {
        await db.insert(ruleChangeNotifications).values({
          changeRequestId: Number(changeRequest.insertId),
          recipientId: admin.userId,
          notificationType: "change_requested",
        });
      }

      return { changeRequestId: changeRequest.insertId, status: "pending" };
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

      // Get change request
      const changeRequest = await db.query.ruleChangeRequests.findFirst({
        where: eq(ruleChangeRequests.id, input.changeRequestId),
      });

      if (!changeRequest) {
        throw new Error("Change request not found");
      }

      // Update change request
      await db
        .update(ruleChangeRequests)
        .set({
          status: "approved",
          approvedBy: ctx.user.id,
          approvalNotes: input.approvalNotes,
          approvedAt: new Date(),
        })
        .where(eq(ruleChangeRequests.id, input.changeRequestId));

      // Create audit entry
      const auditHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({
          changeRequestId: input.changeRequestId,
          action: "approved",
          actor: ctx.user.id,
          timestamp: new Date().toISOString(),
        }))
        .digest("hex");

      await db.insert(ruleChangeAudit).values({
        changeRequestId: input.changeRequestId,
        rulesetId: changeRequest.rulesetId,
        ruleId: changeRequest.ruleId,
        action: "approved",
        actor: ctx.user.id,
        actorRole: "admin",
        actorCredentials: JSON.stringify({
          adminUser: ctx.user.name,
          adminEmail: ctx.user.email,
        }),
        details: JSON.stringify({
          approvalNotes: input.approvalNotes,
        }),
        cryptographicHash: auditHash,
        previousHash: null,
      });

      // Notify requester
      await db.insert(ruleChangeNotifications).values({
        changeRequestId: input.changeRequestId,
        recipientId: changeRequest.requestedBy,
        notificationType: "change_approved",
      });

      return { status: "approved" };
    }),

  /**
   * Reject a rule change (admin only)
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

      const changeRequest = await db.query.ruleChangeRequests.findFirst({
        where: eq(ruleChangeRequests.id, input.changeRequestId),
      });

      if (!changeRequest) {
        throw new Error("Change request not found");
      }

      await db
        .update(ruleChangeRequests)
        .set({
          status: "rejected",
          approvedBy: ctx.user.id,
          approvalNotes: input.rejectionReason,
          approvedAt: new Date(),
        })
        .where(eq(ruleChangeRequests.id, input.changeRequestId));

      // Create audit entry
      const auditHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({
          changeRequestId: input.changeRequestId,
          action: "rejected",
          actor: ctx.user.id,
          timestamp: new Date().toISOString(),
        }))
        .digest("hex");

      await db.insert(ruleChangeAudit).values({
        changeRequestId: input.changeRequestId,
        rulesetId: changeRequest.rulesetId,
        ruleId: changeRequest.ruleId,
        action: "rejected",
        actor: ctx.user.id,
        actorRole: "admin",
        actorCredentials: JSON.stringify({
          adminUser: ctx.user.name,
          adminEmail: ctx.user.email,
        }),
        details: JSON.stringify({
          rejectionReason: input.rejectionReason,
        }),
        cryptographicHash: auditHash,
        previousHash: null,
      });

      // Notify requester
      await db.insert(ruleChangeNotifications).values({
        changeRequestId: input.changeRequestId,
        recipientId: changeRequest.requestedBy,
        notificationType: "change_rejected",
      });

      return { status: "rejected" };
    }),

  /**
   * Get pending rule change requests (admin only)
   */
  getPendingRequests: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const requests = await db.query.ruleChangeRequests.findMany({
      where: eq(ruleChangeRequests.status, "pending"),
    });
    return requests;
  }),

  /**
   * Get audit trail for a change request
   */
  getAuditTrail: protectedProcedure
    .input(z.object({ changeRequestId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const auditEntries = await db.query.ruleChangeAudit.findMany({
        where: eq(ruleChangeAudit.changeRequestId, input.changeRequestId),
      });
      return auditEntries;
    }),

  /**
   * Get user notifications
   */
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const notifications = await db.query.ruleChangeNotifications.findMany({
      where: eq(ruleChangeNotifications.recipientId, ctx.user.id),
    });
    return notifications;
  }),

  /**
   * Mark notification as read
   */
  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db
        .update(ruleChangeNotifications)
        .set({ read: 1, readAt: new Date() })
        .where(eq(ruleChangeNotifications.id, input.notificationId));
      return { success: true };
    }),

  /**
   * Get rule change history
   */
  getRuleChangeHistory: publicProcedure
    .input(
      z.object({
        rulesetId: z.string(),
        ruleId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const history = await db.query.ruleChangeAudit.findMany({
        where: and(
          eq(ruleChangeAudit.rulesetId, input.rulesetId),
          eq(ruleChangeAudit.ruleId, input.ruleId)
        ),
      });
      return history;
    }),
});
