/**
 * RBAC Middleware
 * 
 * tRPC middleware for enforcing role-based access control
 * Validates user permissions before executing procedures
 */

import { TRPCError } from '@trpc/server';
import { RBACEnforcer } from './rbacEnforcer';

type UserRole = 'admin' | 'architect' | 'consultant' | 'reviewer' | 'user';

/**
 * Create RBAC middleware for tRPC
 */
export function createRBACMiddleware(enforcer: RBACEnforcer) {
  return (resource: string, action: string) => {
    return async ({ ctx, next }: any) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const userRole = (ctx.user.role || 'user') as UserRole;

      // Check permission
      const hasPermission = enforcer.hasPermission(userRole, resource, action);

      if (!hasPermission) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Access denied: ${userRole} cannot ${action} ${resource}`,
        });
      }

      // Log access attempt
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          context: 'RBAC',
          message: 'Access granted',
          userId: ctx.user.id,
          userRole,
          resource,
          action,
        })
      );

      return next({ ctx });
    };
  };
}

/**
 * Require admin role
 */
export function requireAdmin() {
  return async ({ ctx, next }: any) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    return next({ ctx });
  };
}

/**
 * Require specific role or higher
 */
export function requireRole(minimumRole: UserRole) {
  const enforcer = new RBACEnforcer();

  return async ({ ctx, next }: any) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const userRole = (ctx.user.role || 'user') as UserRole;

    if (!enforcer.isRoleHighEnough(userRole, minimumRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `${minimumRole} role or higher required`,
      });
    }

    return next({ ctx });
  };
}

/**
 * Check specific permission
 */
export function checkPermission(resource: string, action: string) {
  const enforcer = new RBACEnforcer();

  return async ({ ctx, next }: any) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const userRole = (ctx.user.role || 'user') as UserRole;

    try {
      enforcer.enforcePermission(userRole, resource, action);
    } catch (error) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: error instanceof Error ? error.message : 'Access denied',
      });
    }

    return next({ ctx });
  };
}

export default {
  createRBACMiddleware,
  requireAdmin,
  requireRole,
  checkPermission,
};
