/**
 * Security Middleware & Utilities
 * 
 * Implements:
 * - Rate limiting for public procedures
 * - CSRF protection
 * - Request deduplication
 * - Input validation
 */

import { TRPCError } from '@trpc/server';
import type { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create request list for this identifier
    let requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    requests = requests.filter(time => time > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Rate limiters for different operation types
 */
export const rateLimiters = {
  // Expensive LLM operations: 10 per hour per user
  llm: new RateLimiter(60 * 60 * 1000, 10),
  
  // General API: 100 per 15 minutes per IP
  api: new RateLimiter(15 * 60 * 1000, 100),
  
  // Auth operations: 5 per minute per IP
  auth: new RateLimiter(60 * 1000, 5),
};

/**
 * Rate limiting middleware for Express
 */
export function rateLimitMiddleware(
  limiter: RateLimiter,
  getIdentifier: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = getIdentifier(req);

    if (!limiter.isAllowed(identifier)) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }

    next();
  };
}

/**
 * Check rate limit for tRPC procedures
 */
export function checkRateLimit(
  limiter: RateLimiter,
  identifier: string
): void {
  if (!limiter.isAllowed(identifier)) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }
}

/**
 * CSRF Token Management
 */
class CSRFTokenManager {
  private tokens: Map<string, { token: string; expiresAt: number }> = new Map();
  private tokenTTL = 1 * 60 * 60 * 1000; // 1 hour

  generateToken(sessionId: string): string {
    // Clean up expired tokens
    this.cleanup();

    // Generate random token
    const token = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);

    this.tokens.set(sessionId, {
      token,
      expiresAt: Date.now() + this.tokenTTL,
    });

    return token;
  }

  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);

    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expiresAt) {
      this.tokens.delete(sessionId);
      return false;
    }

    return stored.token === token;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of Array.from(this.tokens.entries())) {
      if (now > value.expiresAt) {
        this.tokens.delete(key);
      }
    }
  }
}

export const csrfTokenManager = new CSRFTokenManager();

/**
 * Request Deduplication
 * Prevents duplicate requests from being processed multiple times
 */
class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // If request is already in progress, return the same promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Execute function and store promise
    const promise = fn()
      .finally(() => {
        // Clean up after completion
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Input Validation Helpers
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic validation: digits, spaces, hyphens, parentheses
  const phoneRegex = /^[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  next();
}

/**
 * Log security events
 */
export function logSecurityEvent(
  eventType: string,
  details: Record<string, any>
): void {
  console.log(`[Security] ${eventType}:`, JSON.stringify(details));
}
