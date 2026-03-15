import { TRPCError } from '@trpc/server';
import { RuleRepository, RuleApplicationRepository, AuditRepository } from '../repositories/RuleRepository';
import { cacheManager as cache } from '../_core/cache';
import { monitoring } from '../_core/monitoring';
import { db } from '../db';
import { ruleApplications, ruleAuditTrail } from '../../drizzle/schema';

/**
 * RuleService - Business logic for Rules Management System
 * 
 * Responsibilities:
 * - Orchestrate rule operations across repositories
 * - Handle caching and cache invalidation
 * - Manage transactions for atomic operations
 * - Log all operations for audit trail
 * - Enforce business rules and validation
 */
export class RuleService {
  /**
   * Search rules with caching
   * Supports filtering by keyword, jurisdiction, and category
   */
  static async searchRules(
    query?: string,
    jurisdiction?: string,
    category?: string,
    limit: number = 50,
    userId?: number
  ) {
    const cacheKey = `rules:search:${query || 'all'}:${jurisdiction || 'all'}:${category || 'all'}`;
    
    try {
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached) {
        monitoring.log('info', 'rules.search', 'Cache hit', { query, jurisdiction, category, userId });
        return cached;
      }

      // Query database
      const results = await RuleRepository.search(query, jurisdiction, category, limit);
      
      // Cache results for 1 hour
      cache.set(cacheKey, results, 3600);
      
      monitoring.log('info', 'rules.search', 'Search successful', {
        query,
        jurisdiction,
        category,
        resultCount: results.length,
        userId,
      });
      
      return results;
    } catch (error) {
      monitoring.log('error', 'rules.search', 'Search failed', {
        query,
        jurisdiction,
        category,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      }, error instanceof Error ? error : undefined);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search rules',
      });
    }
  }

  /**
   * Get all available jurisdictions
   */
  static async getJurisdictions() {
    const cacheKey = 'rules:jurisdictions';
    
    try {
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached) {
        monitoring.log('info', 'rules.getJurisdictions', 'Cache hit', {});
        return cached;
      }

      // Query database
      const jurisdictions = await RuleRepository.getJurisdictions();
      
      // Cache for 24 hours
      cache.set(cacheKey, jurisdictions, 86400);
      
      monitoring.log('info', 'rules.getJurisdictions', 'Success', {
        count: jurisdictions.length,
      });
      
      return jurisdictions;
    } catch (error) {
      monitoring.log('error', 'rules.getJurisdictions', 'Failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get jurisdictions',
      });
    }
  }

  /**
   * Get all available categories
   */
  static async getCategories() {
    const cacheKey = 'rules:categories';
    
    try {
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached) {
        monitoring.log('info', 'rules.getCategories', 'Cache hit', {});
        return cached;
      }

      // Query database
      const categories = await RuleRepository.getCategories();
      
      // Cache for 24 hours
      cache.set(cacheKey, categories, 86400);
      
      monitoring.log('info', 'rules.getCategories', 'Success', {
        count: categories.length,
      });
      
      return categories;
    } catch (error) {
      monitoring.log('error', 'rules.getCategories', 'Failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get categories',
      });
    }
  }

  /**
   * Apply rule to project or organization-wide
   * Uses transaction to ensure atomic operation
   */
  static async applyRule(
    ruleId: number,
    userId: number,
    projectId?: number
  ) {
    monitoring.log('info', 'rules.applyRule', 'Starting', { ruleId, projectId, userId });

    try {
      // Validate inputs
      if (!ruleId || ruleId <= 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid rule ID',
        });
      }

      // Check if rule exists
      const rule = await RuleRepository.getById(ruleId);
      if (!rule) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rule not found',
        });
      }

      // Check if already applied
      const existing = await RuleApplicationRepository.checkExists(ruleId, projectId);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Rule already applied to this project',
        });
      }

      // Apply rule in transaction
      const result = await RuleApplicationRepository.apply(ruleId, userId, projectId);

      // Log to audit trail
      await AuditRepository.logAction(
        'APPLY',
        rule.code,
        userId,
        { ruleId, projectId }
      );

      // Invalidate relevant caches
      this.invalidateProjectRulesCaches(projectId);

      monitoring.log('info', 'rules.applyRule', 'Success', {
        ruleId,
        projectId,
        userId,
        applicationId: result.id,
      });

      return result;
    } catch (error) {
      monitoring.log('error', 'rules.applyRule', 'Failed', {
        ruleId,
        projectId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Get rules applied to a specific project
   */
  static async getProjectRules(projectId: number, userId?: number) {
    const cacheKey = `rules:project:${projectId}`;

    try {
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached) {
        monitoring.log('info', 'rules.getProjectRules', 'Cache hit', { projectId, userId });
        return cached;
      }

      // Query database
      const rules = await RuleApplicationRepository.getProjectRules(projectId);

      // Cache for 30 minutes
      cache.set(cacheKey, rules, 1800);

      monitoring.log('info', 'rules.getProjectRules', 'Success', {
        projectId,
        ruleCount: rules.length,
        userId,
      });

      return rules;
    } catch (error) {
      monitoring.log('error', 'rules.getProjectRules', 'Failed', {
        projectId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get project rules',
      });
    }
  }

  /**
   * Get organization-wide rules
   */
  static async getGlobalRules(userId?: number) {
    const cacheKey = 'rules:global';

    try {
      // Check cache
      const cached = cache.get(cacheKey);
      if (cached) {
        monitoring.log('info', 'rules.getGlobalRules', 'Cache hit', { userId });
        return cached;
      }

      // Query database
      const rules = await RuleApplicationRepository.getGlobalRules();

      // Cache for 1 hour
      cache.set(cacheKey, rules, 3600);

      monitoring.log('info', 'rules.getGlobalRules', 'Success', {
        ruleCount: rules.length,
        userId,
      });

      return rules;
    } catch (error) {
      monitoring.log('error', 'rules.getGlobalRules', 'Failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get global rules',
      });
    }
  }

  /**
   * Deactivate rule application
   */
  static async deactivateRule(
    applicationId: number,
    userId: number,
    projectId?: number
  ) {
    monitoring.log('info', 'rules.deactivateRule', 'Starting', { applicationId, projectId, userId });

    try {
      // Validate inputs
      if (!applicationId || applicationId <= 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid application ID',
        });
      }

      // Get application to find rule code
      const application = await RuleApplicationRepository.getById(applicationId);
      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rule application not found',
        });
      }

      // Deactivate in database
      const result = await RuleApplicationRepository.deactivate(applicationId);

      // Log to audit trail
      await AuditRepository.logAction(
        'DEACTIVATE',
        application.rule.code,
        userId,
        { applicationId, projectId }
      );

      // Invalidate caches
      this.invalidateProjectRulesCaches(projectId);

      monitoring.log('info', 'rules.deactivateRule', 'Success', {
        applicationId,
        projectId,
        userId,
      });

      return result;
    } catch (error) {
      monitoring.log('error', 'rules.deactivateRule', 'Failed', {
        applicationId,
        projectId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Create custom rule with credentials tracking
   */
  static async createCustomRule(
    input: {
      name: string;
      description: string;
      category: string;
      keywords?: string;
    },
    userId: number,
    userName: string
  ) {
    monitoring.log('info', 'rules.createCustomRule', 'Starting', { userId, category: input.category });

    try {
      // Validate inputs
      if (!input.name || input.name.length < 5) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Rule name must be at least 5 characters',
        });
      }

      if (!input.description || input.description.length < 20) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Rule description must be at least 20 characters',
        });
      }

      if (!input.category) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Category is required',
        });
      }

      // Generate rule code
      const ruleCode = `CUSTOM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create custom rule in transaction
      const result = await RuleApplicationRepository.createCustomRule(
        {
          code: ruleCode,
          name: input.name,
          description: input.description,
          category: input.category,
          keywords: input.keywords,
          createdBy: userName,
          createdByUserId: userId,
        }
      );

      // Log to audit trail
      await AuditRepository.logAction(
        'CREATE_CUSTOM',
        ruleCode,
        userId,
        {
          name: input.name,
          category: input.category,
          createdBy: userName,
        }
      );

      // Invalidate category cache
      cache.delete('rules:categories');

      monitoring.log('info', 'rules.createCustomRule', 'Success', {
        ruleCode,
        userId,
        userName,
        category: input.category,
      });

      return result;
    } catch (error) {
      monitoring.log('error', 'rules.createCustomRule', 'Failed', {
        userId,
        userName,
        category: input.category,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Get immutable audit trail for a rule
   */
  static async getAuditTrail(ruleCode: string, limit: number = 50, userId?: number) {
    monitoring.log('info', 'rules.getAuditTrail', 'Starting', { ruleCode, limit, userId });

    try {
      // Validate inputs
      if (!ruleCode) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Rule code is required',
        });
      }

      // Query audit trail (immutable records)
      const trail = await AuditRepository.getTrail(ruleCode, limit);

      monitoring.log('info', 'rules.getAuditTrail', 'Success', {
        ruleCode,
        recordCount: trail.length,
        userId,
      });

      return trail;
    } catch (error) {
      monitoring.log('error', 'rules.getAuditTrail', 'Failed', {
        ruleCode,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get audit trail',
      });
    }
  }

  /**
   * Invalidate project-related caches
   */
  private static invalidateProjectRulesCaches(projectId?: number) {
    if (projectId) {
      cache.delete(`rules:project:${projectId}`);
    }
    cache.delete('rules:global');
  }

  /**
   * Seed sample rules (admin only)
   */
  static async seedRules() {
      monitoring.log('info', 'rules.seed', 'Starting', {});

    try {
      const sampleRules = [
        {
          code: 'NBC-2023-OCC-001',
          name: 'Occupancy Load Calculation',
          description: 'Calculate occupancy load based on floor area and occupancy type',
          category: 'occupancy',
          jurisdiction: 'NBC',
          keywords: 'occupancy, load, calculation, area',
        },
        {
          code: 'NBC-2023-FIRE-001',
          name: 'Fire Separation Requirements',
          description: 'Determine required fire separation ratings between occupancies',
          category: 'fire',
          jurisdiction: 'NBC',
          keywords: 'fire, separation, rating, protection',
        },
        {
          code: 'NBC-2023-EGRESS-001',
          name: 'Exit Door Width Requirements',
          description: 'Calculate minimum exit door widths based on occupant load',
          category: 'egress',
          jurisdiction: 'NBC',
          keywords: 'egress, exit, door, width',
        },
        {
          code: 'AB-2023-OCC-001',
          name: 'Alberta Occupancy Load',
          description: 'Alberta-specific occupancy load requirements',
          category: 'occupancy',
          jurisdiction: 'Alberta',
          keywords: 'occupancy, alberta, load',
        },
        {
          code: 'CALGARY-2023-FIRE-001',
          name: 'Calgary Fire Separation',
          description: 'Calgary municipal fire separation requirements',
          category: 'fire',
          jurisdiction: 'Calgary',
          keywords: 'fire, calgary, separation',
        },
      ];

      for (const rule of sampleRules) {
        // Check if already exists
        const existing = await RuleRepository.getByCode(rule.code);
        if (!existing) {
          await RuleRepository.create(rule);
        }
      }

      monitoring.log('info', 'rules.seed', 'Success', { count: sampleRules.length });
      return { success: true, count: sampleRules.length };
    } catch (error) {
      monitoring.log('error', 'rules.seed', 'Failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      }, error instanceof Error ? error : undefined);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to seed rules',
      });
    }
  }
}
