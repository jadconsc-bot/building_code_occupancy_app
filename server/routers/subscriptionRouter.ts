/**
 * Subscription Router
 * 
 * tRPC procedures for subscription and billing management.
 */

import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { subscriptionService } from '../services/SubscriptionService';
import { monetizationService } from '../services/MonetizationService';

export const subscriptionRouter = router({
  /**
   * Get current subscription info
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    return subscriptionService.getSubscription(ctx.user.id);
  }),

  /**
   * Get all available plans
   */
  getPlans: publicProcedure.query(async () => {
    return subscriptionService.getAllPlans();
  }),

  /**
   * Upgrade subscription
   */
  upgrade: protectedProcedure
    .input(z.object({ tier: z.enum(['pro', 'enterprise']) }))
    .mutation(async ({ ctx, input }) => {
      return subscriptionService.upgradeSubscription(ctx.user.id, input.tier);
    }),

  /**
   * Downgrade subscription
   */
  downgrade: protectedProcedure
    .input(z.object({ tier: z.enum(['free', 'pro']) }))
    .mutation(async ({ ctx, input }) => {
      return subscriptionService.downgradeSubscription(ctx.user.id, input.tier);
    }),

  /**
   * Cancel subscription
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    return subscriptionService.cancelSubscription(ctx.user.id);
  }),

  /**
   * Reactivate subscription
   */
  reactivate: protectedProcedure.mutation(async ({ ctx }) => {
    return subscriptionService.reactivateSubscription(ctx.user.id);
  }),

  /**
   * Get usage statistics
   */
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const subscriptionInfo = await monetizationService.getSubscriptionInfo(ctx.user.id);
    const monthlySpending = await monetizationService.getMonthlySpending(ctx.user.id);
    const usageBreakdown = await monetizationService.getUsageBreakdown(ctx.user.id);

    return {
      subscriptionInfo,
      monthlySpending: (monthlySpending / 100).toFixed(2),
      usageBreakdown,
    };
  }),

  /**
   * Get monthly spending
   */
  getMonthlySpending: protectedProcedure.query(async ({ ctx }) => {
    const spending = await monetizationService.getMonthlySpending(ctx.user.id);
    return {
      amountCents: spending,
      amountDollars: (spending / 100).toFixed(2),
    };
  }),

  /**
   * Get usage breakdown by operation
   */
  getUsageBreakdown: protectedProcedure.query(async ({ ctx }) => {
    return monetizationService.getUsageBreakdown(ctx.user.id);
  }),

  /**
   * Check if user has quota for operation
   */
  checkQuota: protectedProcedure
    .input(z.object({ operation: z.string() }))
    .query(async ({ ctx, input }) => {
      const hasQuota = await monetizationService.checkQuota(ctx.user.id, input.operation);
      const subscriptionInfo = await monetizationService.getSubscriptionInfo(ctx.user.id);

      return {
        hasQuota,
        remainingQuota: subscriptionInfo.remainingQuota,
        monthlyLimit: subscriptionInfo.monthlyLimit,
        monthlyUsage: subscriptionInfo.monthlyUsage,
      };
    }),
});
