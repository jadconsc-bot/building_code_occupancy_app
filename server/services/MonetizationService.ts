/**
 * Monetization Service
 * 
 * Handles:
 * - Usage tracking and metering
 * - Subscription enforcement
 * - Cost calculation
 * - Usage limits
 */

import { getDb } from '../db';
import { usageMetrics, userSubscriptions } from '../../drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export interface UsageOperation {
  userId: number;
  operation: string;
  cost: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionInfo {
  userId: number;
  status: 'active' | 'inactive' | 'cancelled';
  tier: 'free' | 'pro' | 'enterprise';
  monthlyLimit: number;
  monthlyUsage: number;
  remainingQuota: number;
}

/**
 * Operation costs (in cents)
 */
const OPERATION_COSTS = {
  'plan_analysis': 50, // $0.50
  'drawing_analysis': 75, // $0.75
  'code_search': 10, // $0.10
  'report_generation': 100, // $1.00
  'api_call': 1, // $0.01
};

/**
 * Subscription tier limits (operations per month)
 */
const TIER_LIMITS = {
  'free': 10,
  'pro': 500,
  'enterprise': 10000,
};

export class MonetizationService {
  /**
   * Track a usage event
   */
  async trackUsage(input: UsageOperation): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Track usage in usageMetrics table
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Get or create monthly record
      const [existing] = await db
        .select()
        .from(usageMetrics)
        .where(and(
          eq(usageMetrics.userId, input.userId),
          eq(usageMetrics.month, month)
        ))
        .limit(1);

      if (existing) {
        // Update existing record
        await db
          .update(usageMetrics)
          .set({
            calculationsRun: existing.calculationsRun + 1,
            updatedAt: new Date(),
          })
          .where(eq(usageMetrics.id, existing.id));
      } else {
        // Create new record
        await db.insert(usageMetrics).values({
          userId: input.userId,
          month,
          projectsCreated: 0,
          calculationsRun: 1,
          reportsGenerated: 0,
          projectsShared: 0,
          hoursEstimatedSaved: '0',
          riskReductionScore: '0',
        });
      }
    } catch (error) {
      console.error('[MonetizationService] Failed to track usage:', error);
      // Don't throw - usage tracking failure shouldn't block operations
    }
  }

  /**
   * Get current subscription info for user
   */
  async getSubscriptionInfo(userId: number): Promise<SubscriptionInfo> {
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
        // Default to free tier
        return {
          userId,
          status: 'inactive' as const,
          tier: 'free' as const,
          monthlyLimit: TIER_LIMITS.free,
          monthlyUsage: 0,
          remainingQuota: TIER_LIMITS.free,
        };
      }

      // Get monthly usage
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyUsage = await db
        .select()
        .from(usageMetrics)
        .where(
          and(
            eq(usageMetrics.userId, userId),
            gte(usageMetrics.createdAt, monthStart)
          )
        );

      const monthlyOperationCount = monthlyUsage.length;
      // Map planId to tier (1=free, 2=pro, 3=enterprise)
      const tierMap: Record<number, 'free' | 'pro' | 'enterprise'> = {
        1: 'free',
        2: 'pro',
        3: 'enterprise',
      };
      const tier = tierMap[subscription.planId] || 'free';
      const limit = TIER_LIMITS[tier];

      return {
        userId,
        status: subscription.status === 'active' ? 'active' : 'inactive',
        tier,
        monthlyLimit: limit,
        monthlyUsage: monthlyOperationCount,
        remainingQuota: Math.max(0, limit - monthlyOperationCount),
      };
    } catch (error) {
      console.error('[MonetizationService] Failed to get subscription info:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve subscription information',
      });
    }
  }

  /**
   * Check if user has quota for operation
   */
  async checkQuota(userId: number, operation: string): Promise<boolean> {
    const subscriptionInfo = await this.getSubscriptionInfo(userId);

    // Free tier users have limited operations
    if (subscriptionInfo.tier === 'free' && subscriptionInfo.monthlyUsage >= subscriptionInfo.monthlyLimit) {
      return false;
    }

    // Inactive subscriptions can't use paid features
    if (subscriptionInfo.status !== 'active' && operation !== 'api_call') {
      return false;
    }

    return true;
  }

  /**
   * Enforce subscription requirement
   */
  async enforceSubscription(userId: number, operation: string): Promise<void> {
    const hasQuota = await this.checkQuota(userId, operation);

    if (!hasQuota) {
      const subscriptionInfo = await this.getSubscriptionInfo(userId);

      if (subscriptionInfo.status !== 'active') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Active subscription required for this operation',
        });
      }

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Monthly quota exceeded. Upgrade your subscription for more operations.`,
      });
    }
  }

  /**
   * Get usage cost for operation
   */
  getOperationCost(operation: string): number {
    return OPERATION_COSTS[operation as keyof typeof OPERATION_COSTS] || 0;
  }

  /**
   * Get user's monthly spending
   */
  async getMonthlySpending(userId: number): Promise<number> {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyUsage = await db
        .select()
        .from(usageMetrics)
        .where(
          and(
            eq(usageMetrics.userId, userId),
            gte(usageMetrics.createdAt, monthStart)
          )
        );

      // Calculate estimated cost (no cost field in usageMetrics)
      return 0;
    } catch (error) {
      console.error('[MonetizationService] Failed to get monthly spending:', error);
      return 0;
    }
  }

  /**
   * Get usage breakdown by operation
   */
  async getUsageBreakdown(userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyUsage = await db
        .select()
        .from(usageMetrics)
        .where(
          and(
            eq(usageMetrics.userId, userId),
            gte(usageMetrics.createdAt, monthStart)
          )
        );

      const breakdown: Record<string, { count: number; cost: number }> = {};

      // usageMetrics doesn't have operation/cost fields
      // Track by month instead
      const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      if (monthlyUsage.length > 0) {
        const metrics = monthlyUsage[0];
        breakdown['projectsCreated'] = { count: metrics.projectsCreated, cost: 0 };
        breakdown['calculationsRun'] = { count: metrics.calculationsRun, cost: 0 };
        breakdown['reportsGenerated'] = { count: metrics.reportsGenerated, cost: 0 };
        breakdown['projectsShared'] = { count: metrics.projectsShared, cost: 0 };
      }

      return breakdown;
    } catch (error) {
      console.error('[MonetizationService] Failed to get usage breakdown:', error);
      return {};
    }
  }
}

export const monetizationService = new MonetizationService();
