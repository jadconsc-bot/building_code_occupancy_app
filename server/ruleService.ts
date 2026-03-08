import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { rulesDatabase } from "../drizzle/schema";

/**
 * RuleService - Manages building code rules from database
 * Enables rule versioning, updates without code changes, and rule management
 */

export interface RuleDefinition {
  id: number;
  ruleCode: string;
  codeVersion: string;
  jurisdiction: string;
  title: string;
  description?: string;
  category: string;
  nbcReference: string;
  ruleData: Record<string, unknown>;
  isActive: boolean;
  version: number;
}

export class RuleService {
  /**
   * Get all active rules for a specific code version
   * Used by ComplianceEngine to load rules for evaluation
   */
  static async getRulesForVersion(codeVersion: string, jurisdiction = "Canada"): Promise<RuleDefinition[]> {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const rules = await db
        .select()
        .from(rulesDatabase)
        .where(
          and(
            eq(rulesDatabase.codeVersion, codeVersion),
            eq(rulesDatabase.jurisdiction, jurisdiction),
            eq(rulesDatabase.isActive, true)
          )
        );

      return rules.map((rule: any) => ({
        id: rule.id,
        ruleCode: rule.ruleCode,
        codeVersion: rule.codeVersion,
        jurisdiction: rule.jurisdiction,
        title: rule.title,
        description: rule.description || undefined,
        category: rule.category || "",
        nbcReference: rule.nbcReference || "",
        ruleData: typeof rule.ruleData === "string" ? JSON.parse(rule.ruleData) : rule.ruleData,
        isActive: rule.isActive,
        version: rule.version,
      }));
    } catch (error) {
      console.error("Error fetching rules for version:", error);
      return [];
    }
  }

  /**
   * Get a specific rule by code
   */
  static async getRuleByCode(ruleCode: string): Promise<RuleDefinition | null> {
    try {
      const db = await getDb();
      if (!db) return null;
      
      const rule = await db
        .select()
        .from(rulesDatabase)
        .where(eq(rulesDatabase.ruleCode, ruleCode))
        .limit(1);

      if (!rule.length) return null;

      const r = rule[0] as any;
      return {
        id: r.id,
        ruleCode: r.ruleCode,
        codeVersion: r.codeVersion,
        jurisdiction: r.jurisdiction,
        title: r.title,
        description: r.description || undefined,
        category: r.category || "",
        nbcReference: r.nbcReference || "",
        ruleData: typeof r.ruleData === "string" ? JSON.parse(r.ruleData) : r.ruleData,
        isActive: r.isActive,
        version: r.version,
      };
    } catch (error) {
      console.error("Error fetching rule:", error);
      return null;
    }
  }

  /**
   * Get all rules by category
   */
  static async getRulesByCategory(
    category: string,
    codeVersion: string,
    jurisdiction = "Canada"
  ): Promise<RuleDefinition[]> {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const rules = await db
        .select()
        .from(rulesDatabase)
        .where(
          and(
            eq(rulesDatabase.category, category),
            eq(rulesDatabase.codeVersion, codeVersion),
            eq(rulesDatabase.jurisdiction, jurisdiction),
            eq(rulesDatabase.isActive, true)
          )
        );

      return rules.map((rule: any) => ({
        id: rule.id,
        ruleCode: rule.ruleCode,
        codeVersion: rule.codeVersion,
        jurisdiction: rule.jurisdiction,
        title: rule.title,
        description: rule.description || undefined,
        category: rule.category || "",
        nbcReference: rule.nbcReference || "",
        ruleData: typeof rule.ruleData === "string" ? JSON.parse(rule.ruleData) : rule.ruleData,
        isActive: rule.isActive,
        version: rule.version,
      }));
    } catch (error) {
      console.error("Error fetching rules by category:", error);
      return [];
    }
  }

  /**
   * Get all available code versions
   */
  static async getAvailableCodeVersions(): Promise<string[]> {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const versions = await db
        .selectDistinct({ codeVersion: rulesDatabase.codeVersion })
        .from(rulesDatabase)
        .where(eq(rulesDatabase.isActive, true));

      return versions.map((v: any) => v.codeVersion);
    } catch (error) {
      console.error("Error fetching code versions:", error);
      return [];
    }
  }

  /**
   * Get rule history (all versions of a rule)
   */
  static async getRuleHistory(ruleCode: string): Promise<RuleDefinition[]> {
    try {
      const db = await getDb();
      if (!db) return [];
      
      const rules = await db
        .select()
        .from(rulesDatabase)
        .where(eq(rulesDatabase.ruleCode, ruleCode));

      return rules.map((rule: any) => ({
        id: rule.id,
        ruleCode: rule.ruleCode,
        codeVersion: rule.codeVersion,
        jurisdiction: rule.jurisdiction,
        title: rule.title,
        description: rule.description || undefined,
        category: rule.category || "",
        nbcReference: rule.nbcReference || "",
        ruleData: typeof rule.ruleData === "string" ? JSON.parse(rule.ruleData) : rule.ruleData,
        isActive: rule.isActive,
        version: rule.version,
      }));
    } catch (error) {
      console.error("Error fetching rule history:", error);
      return [];
    }
  }

  /**
   * Create a new rule (admin only)
   */
  static async createRule(
    ruleCode: string,
    codeVersion: string,
    title: string,
    category: string,
    nbcReference: string,
    ruleData: Record<string, unknown>,
    createdBy: number,
    jurisdiction = "Canada"
  ): Promise<RuleDefinition | null> {
    try {
      const db = await getDb();
      if (!db) return null;
      
      await db.insert(rulesDatabase).values({
        ruleCode,
        codeVersion,
        jurisdiction,
        title,
        category,
        nbcReference,
        ruleData: JSON.stringify(ruleData),
        isActive: true,
        effectiveDate: new Date(),
        createdBy,
        version: 1,
      });

      return {
        id: 0,
        ruleCode,
        codeVersion,
        jurisdiction,
        title,
        category,
        nbcReference,
        ruleData,
        isActive: true,
        version: 1,
      };
    } catch (error) {
      console.error("Error creating rule:", error);
      return null;
    }
  }

  /**
   * Update an existing rule (admin only)
   */
  static async updateRule(
    ruleCode: string,
    updates: Partial<{
      title: string;
      description: string;
      category: string;
      nbcReference: string;
      ruleData: Record<string, unknown>;
      isActive: boolean;
    }>,
    updatedBy: number
  ): Promise<RuleDefinition | null> {
    try {
      const db = await getDb();
      if (!db) return null;
      
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedBy,
        updatedAt: new Date(),
      };

      if (updates.ruleData) {
        updateData.ruleData = JSON.stringify(updates.ruleData);
      }

      await db
        .update(rulesDatabase)
        .set(updateData)
        .where(eq(rulesDatabase.ruleCode, ruleCode));

      return this.getRuleByCode(ruleCode);
    } catch (error) {
      console.error("Error updating rule:", error);
      return null;
    }
  }

  /**
   * Deprecate a rule (mark as inactive)
   */
  static async deprecateRule(ruleCode: string, updatedBy: number): Promise<boolean> {
    try {
      const db = await getDb();
      if (!db) return false;
      
      await db
        .update(rulesDatabase)
        .set({
          isActive: false,
          deprecatedDate: new Date(),
          updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(rulesDatabase.ruleCode, ruleCode));

      return true;
    } catch (error) {
      console.error("Error deprecating rule:", error);
      return false;
    }
  }
}
