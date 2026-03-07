/**
 * Rate Limiting Middleware
 * Protects expensive operations from abuse
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();

  /**
   * Check if request is allowed
   */
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new window
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string, config: RateLimitConfig): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get reset time
   */
  getResetTime(key: string): number | null {
    const entry = this.limits.get(key);
    return entry ? entry.resetTime : null;
  }

  /**
   * Reset specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all limits
   */
  clear(): void {
    this.limits.clear();
  }
}

// Export singleton
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations
 */
export const rateLimitConfigs = {
  // LLM operations (expensive, limited)
  llmAnalysis: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  
  // API operations (moderate limit)
  apiCall: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // General operations (loose limit)
  general: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // Login attempts (strict limit)
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },

  // File upload (moderate limit)
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },

  // Report generation (limited)
  reportGeneration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },

  // Data export (limited)
  dataExport: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 10,
  },
};

/**
 * Create rate limit key for user operation
 */
export function createRateLimitKey(userId: number, operation: string): string {
  return `${userId}:${operation}`;
}

/**
 * Check rate limit and throw error if exceeded
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  errorMessage: string = 'Rate limit exceeded'
): void {
  if (!rateLimiter.isAllowed(key, config)) {
    const resetTime = rateLimiter.getResetTime(key);
    const resetDate = resetTime ? new Date(resetTime).toISOString() : 'unknown';
    
    throw new Error(`${errorMessage}. Reset at: ${resetDate}`);
  }
}
