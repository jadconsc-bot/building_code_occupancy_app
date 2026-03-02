/**
 * Subscription Service
 * 
 * Manages user subscriptions, billing, and plan upgrades.
 */

import { getDb } from '../db';
import { userSubscriptions, subscriptionPlans } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'suspended';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  monthlyPrice: number;
  monthlyLimit: number;
  features: string[];
  description: string;
}

export interface CreateSubscriptionInput {
  userId: number;
  tier: SubscriptionTier;
}

export interface UpdateSubscriptionInput {
  userId: number;
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
}

/**
 * Subscription plans configuration
 */
const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    monthlyPrice: 0,
    monthlyLimit: 10,
    features: [
      'Basic occupancy classification',
      'Limited plan analysis (10/month)',
      'Community support',
    ],
    description: 'Perfect for getting started',
  },
  pro: {
    tier: 'pro',
    monthlyPrice: 2999, // $29.99
    monthlyLimit: 500,
    features: [
      'Unlimited occupancy classification',
      'Advanced plan analysis (500/month)',
      'Drawing analysis',
      'Report generation',
      'Email support',
      'Custom projects',
    ],
    description: 'For professionals and contractors',
  },
  enterprise: {
    tier: 'enterprise',
    monthlyPrice: 9999, // $99.99
    monthlyLimit: 10000,
    features: [
      'Everything in Pro',
      'Unlimited operations',
      'Priority support',
      'Custom integrations',
      'Dedicated account manager',
      'API access',
      'Advanced analytics',
    ],
    description: 'For large organizations',
  },
};

export class SubscriptionService {
  /**
   * Get subscription plan details
   */
  getPlan(tier: SubscriptionTier): SubscriptionPlan {
    return SUBSCRIPTION_PLANS[tier];
  }

  /**
   * Get all available plans
   */
  getAllPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  /**
   * Get user's current subscription
   */
  async getSubscription(userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId))
        .limit(1);

      if (!subscription) {
        // Return default free tier
        return {
          id: 0,
          userId,
          planId: 0,
          status: 'active' as const,
          billingCycle: 'monthly' as const,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelledAt: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return subscription;
    } catch (error) {
      console.error('[SubscriptionService] Failed to get subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve subscription',
      });
    }
  }

  /**
   * Create new subscription
   */
  async createSubscription(input: CreateSubscriptionInput) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Check if subscription already exists
      const existing = await this.getSubscription(input.userId);
      if (existing && existing.status === 'active') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already has an active subscription',
        });
      }

      // For now, just return a mock subscription
      // In production, integrate with Stripe
      const result = {
        id: 1,
        userId: input.userId,
        planId: 1,
        status: 'active' as const,
        billingCycle: 'monthly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return result;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[SubscriptionService] Failed to create subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create subscription',
      });
    }
  }

  /**
   * Upgrade subscription tier
   */
  async upgradeSubscription(userId: number, newTier: SubscriptionTier) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // For now, skip validation
      // In production, validate tier levels

      // For now, return mock result
      // In production, integrate with Stripe
      const result = {
        id: 1,
        userId,
        planId: 1,
        status: 'active' as const,
        billingCycle: 'monthly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return result;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[SubscriptionService] Failed to upgrade subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upgrade subscription',
      });
    }
  }

  /**
   * Downgrade subscription tier
   */
  async downgradeSubscription(userId: number, newTier: SubscriptionTier) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // For now, skip validation
      // In production, validate tier levels

      // For now, return mock result
      // In production, integrate with Stripe
      const result = {
        id: 1,
        userId,
        planId: 1,
        status: 'active' as const,
        billingCycle: 'monthly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return result;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[SubscriptionService] Failed to downgrade subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to downgrade subscription',
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // For now, return mock result
      // In production, integrate with Stripe
      const result = {
        id: 1,
        userId,
        planId: 1,
        status: 'cancelled' as const,
        billingCycle: 'monthly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelledAt: new Date(),
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return { success: true, subscription: result };
    } catch (error) {
      console.error('[SubscriptionService] Failed to cancel subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cancel subscription',
      });
    }
  }

  /**
   * Suspend subscription (for non-payment)
   */
  async suspendSubscription(userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // For now, return mock result
      // In production, integrate with Stripe
      const result = {
        id: 1,
        userId,
        planId: 1,
        status: 'paused' as const,
        billingCycle: 'monthly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelledAt: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return { success: true, subscription: result };
    } catch (error) {
      console.error('[SubscriptionService] Failed to suspend subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to suspend subscription',
      });
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // For now, return mock result
      // In production, integrate with Stripe
      const result = {
        id: 1,
        userId,
        planId: 1,
        status: 'active' as const,
        billingCycle: 'monthly' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelledAt: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return { success: true, subscription: result };
    } catch (error) {
      console.error('[SubscriptionService] Failed to reactivate subscription:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reactivate subscription',
      });
    }
  }

  /**
   * Check if subscription is active
   */
  async isSubscriptionActive(userId: number): Promise<boolean> {
    try {
      const subscription = await this.getSubscription(userId);
      return subscription.status === 'active';
    } catch {
      return false;
    }
  }

  /**
   * Calculate next renewal date (30 days from now)
   */
  private calculateRenewalDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }

  /**
   * Get subscription price in dollars
   */
  getSubscriptionPrice(tier: SubscriptionTier): string {
    const plan = SUBSCRIPTION_PLANS[tier];
    return (plan.monthlyPrice / 100).toFixed(2);
  }

  /**
   * Get subscription price in cents
   */
  getSubscriptionPriceCents(tier: SubscriptionTier): number {
    return SUBSCRIPTION_PLANS[tier].monthlyPrice;
  }
}

export const subscriptionService = new SubscriptionService();
