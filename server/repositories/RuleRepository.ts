import { getDb } from '../db';
import {
  rulesLibrary,
  ruleApplications,
  customRules,
  ruleAuditTrail,
} from '../../drizzle/schema';
import {
  and,
  or,
  eq,
  like,
  desc,
  isNull,
  isNotNull,
  inArray,
} from 'drizzle-orm';

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
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let whereConditions: any[] = [];

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
    const results = await db
      .select()
      .from(rulesLibrary)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(limit);

    return results;
  }

  /**
   * Get rule by ID
   */
  static async getById(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(rulesLibrary)
      .where(eq(rulesLibrary.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get rule by code
   */
  static async getByCode(code: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(rulesLibrary)
      .where(eq(rulesLibrary.ruleCode, code))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Create new rule
   * Uses insert().values() and returns the inserted record
   */
  static async create(input: {
    ruleCode: string;
    name: string;
    description: string;
    category: string;
    jurisdiction: string;
    keywords?: string;
    nbcReference?: string;
    createdBy: number;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    await db.insert(rulesLibrary).values({
      ruleCode: input.ruleCode,
      name: input.name,
      description: input.description,
      category: input.category,
      jurisdiction: input.jurisdiction,
      keywords: input.keywords,
      nbcReference: input.nbcReference,
      createdBy: input.createdBy,
      isActive: true,
      isCustom: false,
      codeEdition: 'NBC-2023',
      createdAt: now,
      updatedAt: now,
    });

    // Fetch and return the created record
    return this.getByCode(input.ruleCode);
  }

  /**
   * Get all jurisdictions
   */
  static async getJurisdictions() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

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
    const db = await getDb();
    if (!db) throw new Error("Database not available");

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
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    await db.insert(ruleApplications).values({
      ruleId,
      userId,
      projectId: projectId || null,
      appliedAt: now,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // Fetch the last inserted record
    const result = await db
      .select()
      .from(ruleApplications)
      .where(
        and(
          eq(ruleApplications.ruleId, ruleId),
          eq(ruleApplications.userId, userId),
          projectId ? eq(ruleApplications.projectId, projectId) : isNull(ruleApplications.projectId)
        )
      )
      .orderBy(desc(ruleApplications.appliedAt))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Check if rule already applied
   */
  static async checkExists(ruleId: number, projectId?: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(ruleApplications)
      .where(
        and(
          eq(ruleApplications.ruleId, ruleId),
          projectId
            ? eq(ruleApplications.projectId, projectId)
            : isNull(ruleApplications.projectId),
          eq(ruleApplications.status, 'active')
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get application by ID
   */
  static async getById(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(ruleApplications)
      .where(eq(ruleApplications.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get rules applied to specific project
   */
  static async getProjectRules(projectId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select()
      .from(ruleApplications)
      .where(
        and(
          eq(ruleApplications.projectId, projectId),
          eq(ruleApplications.status, 'active')
        )
      )
      .orderBy(desc(ruleApplications.appliedAt));

    return results;
  }

  /**
   * Get organization-wide rules
   */
  static async getGlobalRules() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select()
      .from(ruleApplications)
      .where(
        and(
          isNull(ruleApplications.projectId),
          eq(ruleApplications.status, 'active')
        )
      )
      .orderBy(desc(ruleApplications.appliedAt));

    return results;
  }

  /**
   * Deactivate rule application
   */
  static async deactivate(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(ruleApplications)
      .set({
        status: 'inactive',
        updatedAt: new Date(),
      })
      .where(eq(ruleApplications.id, id));

    return this.getById(id);
  }

  /**
   * Create custom rule
   */
  static async createCustomRule(input: {
    ruleCode: string;
    name: string;
    description: string;
    category: string;
    keywords?: string;
    creatorId: number;
    creatorName: string;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    await db.insert(customRules).values({
      ruleCode: input.ruleCode,
      name: input.name,
      description: input.description,
      category: input.category,
      keywords: input.keywords,
      creatorId: input.creatorId,
      creatorName: input.creatorName,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Fetch and return the created record
    return this.getCustomRuleByCode(input.ruleCode);
  }

  /**
   * Get custom rule by ID
   */
  static async getCustomRuleById(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(customRules)
      .where(eq(customRules.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get custom rule by code
   */
  static async getCustomRuleByCode(code: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(customRules)
      .where(eq(customRules.ruleCode, code))
      .limit(1);

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
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    await db.insert(ruleAuditTrail).values({
      action: action as any,
      ruleCode,
      ruleType: 'library',
      userId,
      userName: userName || 'Unknown',
      details: details,
      createdAt: now,
    });

    // Fetch the last inserted record
    const result = await db
      .select()
      .from(ruleAuditTrail)
      .where(
        and(
          eq(ruleAuditTrail.ruleCode, ruleCode),
          eq(ruleAuditTrail.userId, userId)
        )
      )
      .orderBy(desc(ruleAuditTrail.createdAt))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get audit trail for a rule (immutable records)
   */
  static async getTrail(ruleCode: string, limit: number = 50) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select()
      .from(ruleAuditTrail)
      .where(eq(ruleAuditTrail.ruleCode, ruleCode))
      .orderBy(desc(ruleAuditTrail.createdAt))
      .limit(limit);

    return results;
  }

  /**
   * Get all audit records for a user
   */
  static async getUserActions(userId: number, limit: number = 100) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select()
      .from(ruleAuditTrail)
      .where(eq(ruleAuditTrail.userId, userId))
      .orderBy(desc(ruleAuditTrail.createdAt))
      .limit(limit);

    return results;
  }

  /**
   * Get audit records by action type
   */
  static async getActionsByType(action: string, limit: number = 100) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select()
      .from(ruleAuditTrail)
      .where(eq(ruleAuditTrail.action, action as any))
      .orderBy(desc(ruleAuditTrail.createdAt))
      .limit(limit);

    return results;
  }

  /**
   * Get audit record by ID
   */
  static async getById(id: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(ruleAuditTrail)
      .where(eq(ruleAuditTrail.id, id))
      .limit(1);

    return result[0] || null;
  }
}
