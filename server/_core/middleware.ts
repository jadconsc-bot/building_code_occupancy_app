/**
 * tRPC Middleware
 * 
 * Implements authentication, authorization, and request handling middleware.
 */

import { TRPCError } from '@trpc/server';
import type { TrpcContext } from './context';
import { checkRateLimit, rateLimiters } from './security';
import { subscriptionService } from '../services/SubscriptionService';
import { monetizationService } from '../services/MonetizationService';

/**
 * Middleware to enforce authentication
 */
export function authMiddleware() {
  return async ({ ctx, next }: { ctx: TrpcContext; next: () => Promise<any> }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Please login (10001)',
      });
    }

    return next();
  };
}

/**
 * Middleware to enforce admin role
 */
export function adminMiddleware() {
  return async ({ ctx, next }: { ctx: TrpcContext; next: () => Promise<any> }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Please login (10001)',
      });
    }

    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have required permission (10002)',
      });
    }

    return next();
  };
}

/**
 * Middleware to enforce active subscription
 */
export function subscriptionMiddleware() {
  return async ({ ctx, next }: { ctx: TrpcContext; next: () => Promise<any> }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Please login (10001)',
      });
    }

    const isActive = await subscriptionService.isSubscriptionActive(ctx.user.id);

    if (!isActive) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Active subscription required for this operation',
      });
    }

    return next();
  };
}

/**
 * Middleware to enforce quota for expensive operations
 */
export function quotaMiddleware(operation: string) {
  return async ({ ctx, next }: { ctx: TrpcContext; next: () => Promise<any> }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Please login (10001)',
      });
    }

    // Check rate limit
    try {
      checkRateLimit(rateLimiters.llm, `user:${ctx.user.id}:${operation}`);
    } catch (error) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }

    // Check subscription quota
    await monetizationService.enforceSubscription(ctx.user.id, operation);

    // Track usage after successful execution
    const result = await next();

    // Track the usage
    await monetizationService.trackUsage({
      userId: ctx.user.id,
      operation,
      cost: monetizationService.getOperationCost(operation),
      metadata: { timestamp: new Date().toISOString() },
    });

    return result;
  };
}

/**
 * Middleware to log operations
 */
export function loggingMiddleware() {
  return async ({ ctx, path, next }: { ctx: TrpcContext; path: string; next: () => Promise<any> }) => {
    const startTime = Date.now();

    try {
      const result = await next();
      const duration = Date.now() - startTime;

      console.log(`[tRPC] ${path} - ${duration}ms - User: ${ctx.user?.id || 'anonymous'}`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(
        `[tRPC] ${path} - ${duration}ms - Error:`,
        error instanceof Error ? error.message : error
      );

      throw error;
    }
  };
}

/**
 * Middleware to handle validation errors
 */
export function validationErrorMiddleware() {
  return async ({ next }: { next: () => Promise<any> }) => {
    try {
      return await next();
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      throw error;
    }
  };
}

/**
 * Middleware to handle database errors
 */
export function databaseErrorMiddleware() {
  return async ({ next }: { next: () => Promise<any> }) => {
    try {
      return await next();
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('connection') || message.includes('timeout')) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection error. Please try again later.',
          });
        }

        if (message.includes('duplicate') || message.includes('unique')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This record already exists.',
          });
        }

        if (message.includes('not found') || message.includes('no rows')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Record not found.',
          });
        }
      }

      throw error;
    }
  };
}

/**
 * Middleware to enforce request deduplication
 */
export function deduplicationMiddleware() {
  return async ({ ctx, path, next }: { ctx: TrpcContext; path: string; next: () => Promise<any> }) => {
    // Create deduplication key from user, path, and timestamp (1 second window)
    const timestamp = Math.floor(Date.now() / 1000);
    const deduplicationKey = `${ctx.user?.id}:${path}:${timestamp}`;

    // For now, just pass through
    // In production, use requestDeduplicator from security.ts
    return next();
  };
}

/**
 * Combine multiple middleware
 */
export function combineMiddleware(...middlewares: Array<(opts: any) => Promise<any>>) {
  return async (opts: any) => {
    let result = opts.next;

    for (const middleware of middlewares.reverse()) {
      const currentNext = result;
      result = () => middleware({ ...opts, next: currentNext });
    }

    return result();
  };
}
