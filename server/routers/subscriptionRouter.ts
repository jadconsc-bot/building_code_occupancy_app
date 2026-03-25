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
   * Get current subscription info, including computed tier for the client.
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const sub = await subscriptionService.getSubscription(ctx.user.id);
    // Compute tier from planId: 0 = free (default), 1 = pro, 2+ = enterprise
    const tier: 'free' | 'pro' | 'enterprise' =
      sub.planId === 0 ? 'free' : sub.planId === 1 ? 'pro' : 'enterprise';
    return { ...sub, tier };
  }),

  /**
   * Get all available plans, shaped for the client (id, name, tier, price).
   */
  getPlans: publicProcedure.query(async () => {
    return subscriptionService.getAllPlans().map((p, i) => ({
      id: i + 1,
      tier: p.tier,
      name: p.tier.charAt(0).toUpperCase() + p.tier.slice(1),
      price: (p.monthlyPrice / 100).toFixed(2),
      monthlyLimit: p.monthlyLimit,
      features: p.features,
      description: p.description,
    }));
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
