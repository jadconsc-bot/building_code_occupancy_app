import { eq, like, and, isNull, desc } from 'drizzle-orm';
import { db } from '../db';
import {
  rulesLibrary,
  ruleApplications,
  customRules,
  ruleAuditTrail,
} from '../../drizzle/schema';

/**
 * RuleRepository - Data access for rules library
 * Handles all queries related to pre-built rules
 */
export class RuleRepository {
  /**
   * Search rules by keyword, jurisdiction, and category
   */
  static async search(
    query?: string,
    jurisdiction?: string,
    category?: string,
    limit: number = 50
  ) {
    let whereConditions = [];

    // Build search conditions
    if (query) {
      const searchPattern = `%${query}%`;
      whereConditions.push(
        or(
          like(rulesLibrary.name, searchPattern),
          like(rulesLibrary.description, searchPattern),
          like(rulesLibrary.keywords, searchPattern),
          like(rulesLibrary.nbcReference, searchPattern)
        )
      );
    }

    if (jurisdiction) {
      whereConditions.push(eq(rulesLibrary.jurisdiction, jurisdiction));
    }

    if (category) {
      whereConditions.push(eq(rulesLibrary.category, category));
    }

    // Execute query
    const results = await db.query.rulesLibrary.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      limit,
    });

    return results;
  }

  /**
   * Get rule by ID
   */
  static async getById(id: number) {
    const result = await db.query.rulesLibrary.findFirst({
      where: eq(rulesLibrary.id, id),
    });
    return result || null;
  }

  /**
   * Get rule by code
   */
  static async getByCode(code: string) {
    const result = await db.query.rulesLibrary.findFirst({
      where: eq(rulesLibrary.code, code),
    });
    return result || null;
  }

  /**
   * Create new rule
   */
  static async create(input: {
    code: string;
    name: string;
    description: string;
    category: string;
    jurisdiction: string;
    keywords?: string;
    nbcReference?: string;
  }) {
    const result = await db
      .insert(rulesLibrary)
      .values({
        code: input.code,
        name: input.name,
        description: input.description,
        category: input.category,
        jurisdiction: input.jurisdiction,
        keywords: input.keywords,
        nbcReference: input.nbcReference,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0] || null;
  }

  /**
   * Get all jurisdictions
   */
  static async getJurisdictions() {
    const results = await db
      .selectDistinct({ jurisdiction: rulesLibrary.jurisdiction })
      .from(rulesLibrary)
      .orderBy(rulesLibrary.jurisdiction);

    return results.map(r => r.jurisdiction).filter(Boolean);
  }

  /**
   * Get all categories
   */
  static async getCategories() {
    const results = await db
      .selectDistinct({ category: rulesLibrary.category })
      .from(rulesLibrary)
      .orderBy(rulesLibrary.category);

    return results.map(r => r.category).filter(Boolean);
  }
}

/**
 * RuleApplicationRepository - Data access for rule applications
 * Handles applying rules to projects and organization-wide
 */
export class RuleApplicationRepository {
  /**
   * Apply rule to project or organization-wide
   */
  static async apply(ruleId: number, userId: number, projectId?: number) {
    const result = await db
      .insert(ruleApplications)
      .values({
        ruleId,
        userId,
        projectId: projectId || null,
        appliedAt: new Date(),
        status: 'active',
      })
      .returning();

    return result[0] || null;
  }

  /**
   * Check if rule already applied
   */
  static async checkExists(ruleId: number, projectId?: number) {
    const result = await db.query.ruleApplications.findFirst({
      where: and(
        eq(ruleApplications.ruleId, ruleId),
        projectId
          ? eq(ruleApplications.projectId, projectId)
          : isNull(ruleApplications.projectId),
        eq(ruleApplications.status, 'active')
      ),
    });

    return !!result;
  }

  /**
   * Get application by ID
   */
  static async getById(id: number) {
    const result = await db.query.ruleApplications.findFirst({
      where: eq(ruleApplications.id, id),
      with: {
        rule: true,
      },
    });

    return result || null;
  }

  /**
   * Get rules applied to specific project
   */
  static async getProjectRules(projectId: number) {
    const results = await db.query.ruleApplications.findMany({
      where: and(
        eq(ruleApplications.projectId, projectId),
        eq(ruleApplications.status, 'active')
      ),
      with: {
        rule: true,
      },
      orderBy: desc(ruleApplications.appliedAt),
    });

    return results;
  }

  /**
   * Get organization-wide rules
   */
  static async getGlobalRules() {
    const results = await db.query.ruleApplications.findMany({
      where: and(
        isNull(ruleApplications.projectId),
        eq(ruleApplications.status, 'active')
      ),
      with: {
        rule: true,
      },
      orderBy: desc(ruleApplications.appliedAt),
    });

    return results;
  }

  /**
   * Deactivate rule application
   */
  static async deactivate(id: number) {
    const result = await db
      .update(ruleApplications)
      .set({
        status: 'inactive',
        updatedAt: new Date(),
      })
      .where(eq(ruleApplications.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Create custom rule
   */
  static async createCustomRule(input: {
    code: string;
    name: string;
    description: string;
    category: string;
    keywords?: string;
    createdBy: string;
    createdByUserId: number;
  }) {
    const result = await db
      .insert(customRules)
      .values({
        code: input.code,
        name: input.name,
        description: input.description,
        category: input.category,
        keywords: input.keywords,
        createdBy: input.createdBy,
        createdByUserId: input.createdByUserId,
        createdAt: new Date(),
      })
      .returning();

    return result[0] || null;
  }
}

/**
 * AuditRepository - Data access for immutable audit trail
 * All operations are INSERT ONLY - never update or delete
 */
export class AuditRepository {
  /**
   * Log action to audit trail (immutable insert only)
   */
  static async logAction(
    action: string,
    ruleCode: string,
    userId: number,
    details: any,
    userName?: string
  ) {
    const result = await db
      .insert(ruleAuditTrail)
      .values({
        action: action as any,
        ruleCode,
        ruleType: 'library',
        userId,
        userName: userName || 'Unknown',
        details: details,
        createdAt: new Date(),
      })
      .returning();

    return result[0] || null;
  }

  /**
   * Get audit trail for a rule (immutable records)
   */
  static async getTrail(ruleCode: string, limit: number = 50) {
    const results = await db.query.ruleAuditTrail.findMany({
      where: eq(ruleAuditTrail.ruleCode, ruleCode),
      orderBy: desc(ruleAuditTrail.createdAt),
      limit,
    });

    return results;
  }

  /**
   * Get all audit records for a user
   */
  static async getUserActions(userId: number, limit: number = 100) {
    const results = await db.query.ruleAuditTrail.findMany({
      where: eq(ruleAuditTrail.userId, userId),
      orderBy: desc(ruleAuditTrail.createdAt),
      limit,
    });

    return results;
  }

  /**
   * Get audit records by action type
   */
  static async getActionsByType(action: string, limit: number = 100) {
    const results = await db.query.ruleAuditTrail.findMany({
      where: eq(ruleAuditTrail.action, action as any),
      orderBy: desc(ruleAuditTrail.createdAt),
      limit,
    });

    return results;
  }

  /**
   * Get recent audit trail (last N records)
   */
  static async getRecent(limit: number = 100) {
    const results = await db.query.ruleAuditTrail.findMany({
      orderBy: desc(ruleAuditTrail.createdAt),
      limit,
    });

    return results;
  }
}

// Helper function for OR conditions
function or(...conditions: any[]) {
  return conditions.reduce((acc, condition) => {
    if (!acc) return condition;
    return { [Symbol.for('or')]: [acc, condition] };
  });
}
