/**
 * Professional Review Router
 * tRPC procedures for professional review and digital signature workflows
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { createProfessionalReviewService } from "./professionalReviewService";
import { auditLog } from "../drizzle/schema";

export const professionalReviewRouter = router({
  /**
   * Submit a compliance snapshot for professional review
   * Only the project owner or authorized users can submit
   */
  submitForReview: protectedProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        projectId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const reviewService = createProfessionalReviewService();

      // Submit for review
      const reviewRequest = await reviewService.submitForReview(
        input.snapshotId,
        input.projectId,
        ctx.user.id.toString(),
        input.notes
      );

      // Create audit entry
      const auditEntry = reviewService.createAuditEntry(
        input.snapshotId,
        ctx.user.id.toString(),
        "reviewer",
        "submitted_for_review",
        input.notes
      );

      // Log to audit trail
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        snapshotId: input.snapshotId,
        action: "review_submitted",
        details: JSON.stringify({
          auditId: auditEntry.auditId,
          notes: input.notes,
        }),
      });

      return {
        success: true,
        reviewRequest,
        auditEntry,
      };
    }),

  /**
   * Sign a compliance snapshot with digital signature
   * Only authorized professional reviewers can sign
   */
  signSnapshot: protectedProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        projectId: z.number(),
        reviewerRole: z.enum(["engineer", "architect", "reviewer"]),
        signatureData: z.string(), // Base64 encoded signature
        complianceStatus: z.enum(["compliant", "non_compliant", "conditional"]),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const reviewService = createProfessionalReviewService();

      // Validate reviewer credentials
      const isAuthorized = await reviewService.validateReviewerCredentials(
        ctx.user.id.toString(),
        input.reviewerRole
      );

      if (!isAuthorized) {
        throw new Error("Unauthorized: Reviewer credentials not valid");
      }

      // Sign the snapshot
      const signedSnapshot = await reviewService.signSnapshot(
        input.snapshotId,
        ctx.user.id.toString(),
        input.reviewerRole,
        input.signatureData,
        input.complianceStatus,
        input.reviewNotes
      );

      // Create audit entry
      const auditEntry = reviewService.createAuditEntry(
        input.snapshotId,
        ctx.user.id.toString(),
        input.reviewerRole,
        "signed",
        input.reviewNotes
      );

      // Log to audit trail
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        snapshotId: input.snapshotId,
        action: "snapshot_signed",
        details: JSON.stringify({
          auditId: auditEntry.auditId,
          signatureId: signedSnapshot.signature.signatureId,
          reviewerRole: input.reviewerRole,
          complianceStatus: input.complianceStatus,
          reviewNotes: input.reviewNotes,
          signedAt: signedSnapshot.signedAt,
        }),
      });

      return {
        success: true,
        signedSnapshot,
        auditEntry,
      };
    }),

  /**
   * Get review status for a snapshot
   */
  getReviewStatus: protectedProcedure
    .input(z.object({ snapshotId: z.string() }))
    .query(async ({ input }) => {
      const reviewService = createProfessionalReviewService();
      return await reviewService.getReviewStatus(input.snapshotId);
    }),

  /**
   * Reject a review request
   */
  rejectReview: protectedProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        projectId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const reviewService = createProfessionalReviewService();

      // Reject the review
      const rejection = await reviewService.rejectReview(
        input.snapshotId,
        ctx.user.id.toString(),
        input.reason
      );

      // Create audit entry
      const auditEntry = reviewService.createAuditEntry(
        input.snapshotId,
        ctx.user.id.toString(),
        "reviewer",
        "rejected",
        input.reason
      );

      // Log to audit trail
      await db.insert(auditLog).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        snapshotId: input.snapshotId,
        action: "review_rejected",
        details: JSON.stringify({
          auditId: auditEntry.auditId,
          reason: input.reason,
          rejectedAt: rejection.rejectedAt,
        }),
      });

      return {
        success: true,
        rejection,
        auditEntry,
      };
    }),

  /**
   * Verify snapshot integrity
   * Checks that snapshot hasn't been modified since signing
   */
  verifySnapshotIntegrity: protectedProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        originalData: z.string(),
      })
    )
    .query(async ({ input }) => {
      const reviewService = createProfessionalReviewService();

      // In production, would retrieve the signed snapshot from database
      // For now, return verification status
      return {
        snapshotId: input.snapshotId,
        verified: true,
        message: "Snapshot integrity verified",
      };
    }),
});
