/**
 * Caching Layer
 * Implements in-memory caching with TTL support
 * In production, replace with Redis for distributed caching
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });

    // Set auto-delete timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  /**
   * Delete key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get or compute value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await compute();
    this.set(key, value, ttlSeconds);
    return value;
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache key generators
 */
export const cacheKeys = {
  userProjects: (userId: number) => `projects:user:${userId}`,
  userSubscription: (userId: number) => `subscription:user:${userId}`,
  projectDetails: (projectId: number) => `project:${projectId}`,
  occupancyCode: (code: string) => `occupancy:${code}`,
  usageMetrics: (userId: number, month: string) => `usage:${userId}:${month}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const cacheTTL = {
  userProjects: 5 * 60, // 5 minutes
  userSubscription: 60 * 60, // 1 hour
  projectDetails: 10 * 60, // 10 minutes
  occupancyCode: 24 * 60 * 60, // 24 hours
  usageMetrics: 30 * 60, // 30 minutes
};
