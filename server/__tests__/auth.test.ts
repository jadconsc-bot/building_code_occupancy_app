/**
 * Authentication Tests
 * 
 * Tests for auth procedures and middleware.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { authMiddleware, adminMiddleware, subscriptionMiddleware } from '../_core/middleware';

describe('Authentication Middleware', () => {
  describe('authMiddleware', () => {
    it('should throw UNAUTHORIZED if user is not authenticated', async () => {
      const middleware = authMiddleware();
      const ctx = { user: null };

      try {
        await middleware({ ctx, next: () => Promise.resolve(null) });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('UNAUTHORIZED');
      }
    });

    it('should allow authenticated users', async () => {
      const middleware = authMiddleware();
      const ctx = { user: { id: 1, email: 'test@example.com', role: 'user' } };
      const next = vi.fn().mockResolvedValue('success');

      const result = await middleware({ ctx, next });

      expect(next).toHaveBeenCalled();
      expect(result).toBe('success');
    });
  });

  describe('adminMiddleware', () => {
    it('should throw UNAUTHORIZED if user is not authenticated', async () => {
      const middleware = adminMiddleware();
      const ctx = { user: null };

      try {
        await middleware({ ctx, next: () => Promise.resolve(null) });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('UNAUTHORIZED');
      }
    });

    it('should throw FORBIDDEN if user is not admin', async () => {
      const middleware = adminMiddleware();
      const ctx = { user: { id: 1, email: 'test@example.com', role: 'user' } };

      try {
        await middleware({ ctx, next: () => Promise.resolve(null) });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('FORBIDDEN');
      }
    });

    it('should allow admin users', async () => {
      const middleware = adminMiddleware();
      const ctx = { user: { id: 1, email: 'admin@example.com', role: 'admin' } };
      const next = vi.fn().mockResolvedValue('success');

      const result = await middleware({ ctx, next });

      expect(next).toHaveBeenCalled();
      expect(result).toBe('success');
    });
  });
});

describe('Error Handling', () => {
  it('should properly format TRPCError', () => {
    const error = new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Please login (10001)',
    });

    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Please login (10001)');
  });

  it('should handle validation errors', () => {
    const error = new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid input',
    });

    expect(error.code).toBe('BAD_REQUEST');
  });

  it('should handle not found errors', () => {
    const error = new TRPCError({
      code: 'NOT_FOUND',
      message: 'Resource not found',
    });

    expect(error.code).toBe('NOT_FOUND');
  });

  it('should handle internal server errors', () => {
    const error = new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    });

    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
