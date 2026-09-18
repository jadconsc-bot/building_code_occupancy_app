/**
 * Phase 2-5 tRPC Routers
 * Professional Workflow, Monetization, and Enterprise Features
 * 
 * Implements items 6-16 from the definitive commercialization recipe:
 * - Phase 2A: Projects, Clients, Members
 * - Phase 2B: Professional PDF Reports
 * - Phase 2C: Recalculation & Versioning
 * - Phase 2D: Reviewer Access & Share Links
 * - Phase 3: Subscriptions & Pricing
 * - Phase 3B: Usage Metrics
 * - Phase 4A: RBAC
 * - Phase 4B: Verification Portal
 * - Phase 4C: Reproducibility
 * - Phase 4D: Structured Logging
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { shareLinks } from "../../drizzle/schema";
import { assertProjectMemberAccess, assertProjectRoleManager } from "../services/projectAuthorization";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

/**
 * ============================================================================
 * PHASE 2A: CLIENTS & PROJECT MEMBERS ROUTER
 * ============================================================================
 */

export const clientsRouter = router({
  /**
   * Create a new client for the consultant
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.createClient({
        userId: ctx.user.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode,
        companyName: input.companyName,
        industry: input.industry,
        notes: input.notes,
        status: "active",
      });
    }),

  /**
   * Get all clients for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getClientsByUserId(ctx.user.id);
  }),

  /**
   * Get a specific client
   */
  get: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await db.getClientById(input.clientId);
    }),

  /**
   * Update a client
   */
  update: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["active", "inactive", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateClient(input.clientId, {
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode,
        companyName: input.companyName,
        industry: input.industry,
        notes: input.notes,
        status: input.status as any,
      });
      return await db.getClientById(input.clientId);
    }),

  /**
   * Delete a client
   */
  delete: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteClient(input.clientId);
      return { success: true };
    }),
});

/**
 * Project Members Router
 */
export const projectMembersRouter = router({
  /**
   * Add a member to a project
   */
  add: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      role: z.enum(["owner", "editor", "reviewer", "viewer"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectRoleManager(ctx.user, input.projectId);
      return await db.addProjectMember({
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
        addedBy: ctx.user.id,
      });
    }),

  /**
   * Get all members of a project
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertProjectMemberAccess(ctx.user, input.projectId);
      return await db.getProjectMembers(input.projectId);
    }),

  /**
   * Update a member's role
   */
  updateRole: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
      role: z.enum(["owner", "editor", "reviewer", "viewer"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectRoleManager(ctx.user, input.projectId);
      await db.updateProjectMemberRole(input.projectId, input.userId, input.role);
      return { success: true };
    }),

  /**
   * Remove a member from a project
   */
  remove: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectRoleManager(ctx.user, input.projectId);
      await db.removeProjectMember(input.projectId, input.userId);
      return { success: true };
    }),
});

/**
 * ============================================================================
 * PHASE 3: SUBSCRIPTIONS & PRICING ROUTER
 * ============================================================================
 */

export const subscriptionsRouter = router({
  /**
   * Get all available subscription plans
   */
  listPlans: publicProcedure.query(async () => {
    return await db.getSubscriptionPlans();
  }),

  /**
   * Get current user's subscription
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await db.getUserSubscription(ctx.user.id);
    if (!subscription) return null;

    const plan = await db.getSubscriptionPlanById(subscription.planId);
    return { subscription, plan };
  }),

  /**
   * Create a new subscription (after Stripe payment)
   */
  create: protectedProcedure
    .input(z.object({
      planId: z.number(),
      billingCycle: z.enum(["monthly", "yearly"]),
      stripeSubscriptionId: z.string(),
      stripeCustomerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const endDate = new Date();
      if (input.billingCycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      return await db.createUserSubscription({
        userId: ctx.user.id,
        planId: input.planId,
        status: "active",
        billingCycle: input.billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        stripeSubscriptionId: input.stripeSubscriptionId,
        stripeCustomerId: input.stripeCustomerId,
      });
    }),

  /**
   * Cancel a subscription
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    await db.updateUserSubscription(ctx.user.id, {
      status: "cancelled",
      cancelledAt: new Date(),
    });
    return { success: true };
  }),
});

/**
 * ============================================================================
 * PHASE 3B: USAGE METRICS ROUTER
 * ============================================================================
 */

export const usageMetricsRouter = router({
  /**
   * Get usage metrics for current month
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return await db.getUsageMetrics(ctx.user.id, month);
  }),

  /**
   * Update usage metrics (called by calculation engine)
   */
  recordCalculation: protectedProcedure.mutation(async ({ ctx }) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const current = await db.getUsageMetrics(ctx.user.id, month);

    await db.createOrUpdateUsageMetrics({
      userId: ctx.user.id,
      month,
      projectsCreated: current?.projectsCreated ?? 0,
      calculationsRun: (current?.calculationsRun ?? 0) + 1,
      reportsGenerated: current?.reportsGenerated ?? 0,
      projectsShared: current?.projectsShared ?? 0,
      hoursEstimatedSaved: current?.hoursEstimatedSaved ?? "0",
      riskReductionScore: current?.riskReductionScore ?? "0",
    });
    return { success: true };
  }),
});

/**
 * ============================================================================
 * PHASE 2D: SHARING & VERIFICATION ROUTER
 * ============================================================================
 */

export const sharingRouter = router({
  /**
   * Create a share link for a project
   */
  createShareLink: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      accessLevel: z.enum(["view_only", "comment", "download"]),
      expiresAt: z.date().optional(),
      maxAccessCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertProjectRoleManager(ctx.user, input.projectId);
      const token = crypto.randomBytes(32).toString("hex");
      return await db.createShareLink({
        id: uuidv4(),
        projectId: input.projectId,
        createdBy: ctx.user.id,
        token,
        accessLevel: input.accessLevel,
        expiresAt: input.expiresAt,
        maxAccessCount: input.maxAccessCount,
        isActive: true,
      });
    }),

  /**
   * Get share links for a project
   */
  listShareLinks: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertProjectMemberAccess(ctx.user, input.projectId);
      return await db.getProjectShareLinks(input.projectId);
    }),

  /**
   * Access a shared project (public)
   */
  accessSharedProject: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const link = await db.getShareLinkByToken(input.token);
      if (!link) throw new Error("Invalid share link");
      if (!link.isActive) throw new Error("Share link is inactive");
      if (link.expiresAt && new Date() > link.expiresAt) throw new Error("Share link has expired");
      if (link.maxAccessCount && link.accessCount >= link.maxAccessCount) {
        throw new Error("Share link access limit reached");
      }

      await db.updateShareLinkAccessCount(link.id);
      return { projectId: link.projectId, accessLevel: link.accessLevel };
    }),

  /**
   * Deactivate a share link
   */
  deactivateShareLink: protectedProcedure
    .input(z.object({ linkId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const [link] = await database
        .select({ projectId: shareLinks.projectId })
        .from(shareLinks)
        .where(eq(shareLinks.id, input.linkId))
        .limit(1);
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found" });
      await assertProjectRoleManager(ctx.user, link.projectId);
      await db.deactivateShareLink(input.linkId);
      return { success: true };
    }),
});

/**
 * ============================================================================
 * PHASE 4B: VERIFICATION PORTAL ROUTER
 * ============================================================================
 */

export const verificationRouter = router({
  /**
   * Create a verification token for a calculation
   */
  createToken: protectedProcedure
    .input(z.object({
      calculationResultId: z.string(),
      isPublic: z.boolean(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const token = crypto.randomBytes(32).toString("hex");
      return await db.createVerificationToken({
        id: uuidv4(),
        calculationResultId: input.calculationResultId,
        token,
        isPublic: input.isPublic,
        expiresAt: input.expiresAt,
      });
    }),

  /**
   * Verify a calculation (public)
   */
  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async () => {
      return {
        valid: false,
        status: 'verification_unavailable' as const,
        message:
          'Report verification is not yet implemented. ' +
          'Do not rely on this for compliance or legal ' +
          'purposes. Hash-based tamper detection is ' +
          'planned for a future release.',
      };
    }),
});

/**
 * ============================================================================
 * PHASE 2C: CALCULATION VERSIONING ROUTER
 * ============================================================================
 */

export const calculationVersioningRouter = router({
  /**
   * Create a new version of a calculation
   */
  createVersion: protectedProcedure
    .input(z.object({
      calculationResultId: z.string(),
      inputData: z.record(z.string(), z.unknown()),
      resultData: z.record(z.string(), z.unknown()),
      changeReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const versions = await db.getCalculationVersions(input.calculationResultId);
      const versionNumber = (versions.length ?? 0) + 1;
      const parentVersionId = versions.length > 0 ? versions[versions.length - 1].id : undefined;

      return await db.createCalculationVersion({
        id: uuidv4(),
        calculationResultId: input.calculationResultId,
        versionNumber,
        parentVersionId,
        inputData: JSON.stringify(input.inputData),
        resultData: JSON.stringify(input.resultData),
        changeReason: input.changeReason,
        changedBy: ctx.user.id,
      });
    }),

  /**
   * Get all versions of a calculation
   */
  listVersions: protectedProcedure
    .input(z.object({ calculationResultId: z.string() }))
    .query(async ({ input }) => {
      return await db.getCalculationVersions(input.calculationResultId);
    }),

  /**
   * Get a specific version
   */
  getVersion: protectedProcedure
    .input(z.object({ versionId: z.string() }))
    .query(async ({ input }) => {
      return await db.getCalculationVersion(input.versionId);
    }),
});
