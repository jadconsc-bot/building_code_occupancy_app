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
import { foundingMemberCounter, userSubscriptions, teamWaitlist } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { createStripeClient } from '../services/stripeService';
import {
  STRIPE_PRO_MONTHLY_PRICE_ID,
  STRIPE_PRO_ANNUAL_PRICE_ID,
  STRIPE_TEAM_PRICE_ID,
  STRIPE_FOUNDING_PRICE_ID,
  STRIPE_CONTRACTOR_SUB_PRICE_ID,
  STRIPE_CONTRACTOR_PACK_PRICE_ID,
} from '../_core/stripeEnv';

const contractorSessionBucket = new Map<string, number[]>();

function contractorRateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 60_000;
  const max = 5;
  const hits = (contractorSessionBucket.get(ip) ?? []).filter(t => now - t < window);
  if (hits.length >= max) return true;
  hits.push(now);
  contractorSessionBucket.set(ip, hits);
  return false;
}

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

  getFoundingCounter: publicProcedure
    .query(async () => {
      const db = await getDb();
      const [row] = db
        ? await db.select().from(foundingMemberCounter).limit(1)
        : [];
      return {
        claimed:   row?.claimed   ?? 247,
        cap:       row?.cap       ?? 1000,
        remaining: (row?.cap ?? 1000) - (row?.claimed ?? 247),
        isSoldOut: (row?.claimed ?? 247) >= (row?.cap ?? 1000),
      };
    }),

  createCheckoutSession: protectedProcedure
    .input(z.object({
      planType: z.enum(["pro_monthly", "pro_annual", "team"]).optional(),
      priceId:  z.string().optional(),
    }).refine(d => d.planType || d.priceId, { message: "planType or priceId required" }))
    .mutation(async ({ input, ctx }) => {
      const PRICE_MAP: Record<string, string> = {
        pro_monthly: STRIPE_PRO_MONTHLY_PRICE_ID,
        pro_annual:  STRIPE_PRO_ANNUAL_PRICE_ID,
        team:        STRIPE_TEAM_PRICE_ID,
      };

      const priceId = input.priceId ?? (input.planType ? PRICE_MAP[input.planType] : "");
      if (!priceId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Price not configured for this plan" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Founding member: validate price ID and check slots
      const isFoundingPurchase = STRIPE_FOUNDING_PRICE_ID && priceId === STRIPE_FOUNDING_PRICE_ID;
      if (isFoundingPurchase) {
        const [counter] = await db.select().from(foundingMemberCounter).limit(1);
        if (counter && counter.claimed >= counter.cap) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Founding offer sold out" });
        }
      } else if (!Object.values(PRICE_MAP).includes(priceId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unrecognized price ID" });
      }

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
      const subscriptionMeta: Record<string, string> = { userId: String(ctx.user.id) };
      if (isFoundingPurchase) subscriptionMeta.foundingMember = "true";

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${appRoot}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appRoot}/billing`,
        subscription_data: { metadata: subscriptionMeta },
      });

      return { checkoutUrl: session.url! };
    }),

  joinTeamWaitlist: publicProcedure
    .input(z.object({
      email: z.string().email(),
      source: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.insert(teamWaitlist)
        .values({ email: input.email, source: input.source ?? "billing_page" })
        .onDuplicateKeyUpdate({ set: { source: input.source ?? "billing_page" } });

      return { success: true };
    }),

  createPortalSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [sub] = await db
        .select({ stripeCustomerId: userSubscriptions.stripeCustomerId })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, ctx.user.id))
        .limit(1);

      if (!sub?.stripeCustomerId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No billing account found. Please subscribe first." });
      }

      const stripe = createStripeClient();
      const appRoot = "https://buildingcodeoccupancyapp-production-4adf.up.railway.app";
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${appRoot}/billing`,
        configuration: "bpc_1TdwD2AqM4TPeb3egS1ndTNg",
      });

      return { url: portalSession.url };
    }),

  getContractorStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { packPurchased: false };

    const [sub] = await db
      .select({
        contractorPackPurchased: userSubscriptions.contractorPackPurchased,
        contractorPackPurchasedAt: userSubscriptions.contractorPackPurchasedAt,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, ctx.user.id))
      .limit(1);

    return {
      packPurchased: sub?.contractorPackPurchased ?? false,
      purchasedAt: sub?.contractorPackPurchasedAt ?? null,
    };
  }),

  createContractorSession: publicProcedure
    .input(z.object({
      type:  z.enum(['subscription', 'pack']),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = (ctx as any).req?.ip ?? 'unknown';
      if (contractorRateLimited(ip)) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' });
      }
      const stripe = createStripeClient();
      const priceId = input.type === 'subscription'
        ? STRIPE_CONTRACTOR_SUB_PRICE_ID
        : STRIPE_CONTRACTOR_PACK_PRICE_ID;

      if (!priceId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Contractor pricing not configured' });
      }

      const appRoot = 'https://buildingcodeoccupancyapp-production-4adf.up.railway.app';
      const session = await stripe.checkout.sessions.create({
        mode: input.type === 'subscription' ? 'subscription' : 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appRoot}/contractor?activated=true`,
        cancel_url:  `${appRoot}/contractor`,
        customer_email: input.email,
        metadata: { product: 'contractor' },
      });

      return { checkoutUrl: session.url! };
    }),
});
