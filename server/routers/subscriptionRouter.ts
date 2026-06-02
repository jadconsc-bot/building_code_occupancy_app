/**
 * Subscription Router
 * 
 * tRPC procedures for subscription and billing management.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { subscriptionService } from '../services/SubscriptionService';
import { monetizationService } from '../services/MonetizationService';
import { getDb } from '../db';
import { userSubscriptions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { createStripeClient } from '../services/stripeService';
import {
  STRIPE_PRO_MONTHLY_PRICE_ID,
  STRIPE_PRO_ANNUAL_PRICE_ID,
  STRIPE_TEAM_PRICE_ID,
} from '../_core/stripeEnv';

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

  createCheckoutSession: protectedProcedure
    .input(z.object({
      planType: z.enum(["pro_monthly", "pro_annual", "team"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const PRICE_MAP: Record<string, string> = {
        pro_monthly: STRIPE_PRO_MONTHLY_PRICE_ID,
        pro_annual:  STRIPE_PRO_ANNUAL_PRICE_ID,
        team:        STRIPE_TEAM_PRICE_ID,
      };
      const priceId = PRICE_MAP[input.planType];
      if (!priceId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Price not configured for plan: ${input.planType}` });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Retrieve existing Stripe customer ID if any
      const [existingSub] = await db
        .select({ stripeCustomerId: userSubscriptions.stripeCustomerId })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, ctx.user.id))
        .limit(1);

      let stripeCustomerId = existingSub?.stripeCustomerId ?? null;

      const stripe = createStripeClient();

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email ?? undefined,
          name: ctx.user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        stripeCustomerId = customer.id;

        const now = new Date();
        const billingCycle = input.planType === "pro_annual" ? "yearly" : "monthly";
        await db.insert(userSubscriptions)
          .values({
            userId:             ctx.user.id,
            planId:             0,
            stripeCustomerId,
            status:             "active" as any,
            billingCycle:       billingCycle as any,
            currentPeriodStart: now,
            currentPeriodEnd:   new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          })
          .onDuplicateKeyUpdate({ set: { stripeCustomerId } });
      }

      const appRoot = "https://buildingcodeoccupancyapp-production-4adf.up.railway.app";
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${appRoot}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appRoot}/billing`,
        subscription_data: { metadata: { userId: String(ctx.user.id) } },
      });

      return { checkoutUrl: session.url! };
    }),
});
