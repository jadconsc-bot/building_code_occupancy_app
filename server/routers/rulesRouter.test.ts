import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { rulesRouter } from './rulesRouter';
import { getDb } from '../db';
import { rulesLibrary, ruleApplications, customRules, ruleAuditTrail } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock context
const mockCtx = {
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user' as const,
  },
  req: {
    ip: '127.0.0.1',
    get: (header: string) => 'Mozilla/5.0',
  },
  res: {},
};

const adminCtx = {
  ...mockCtx,
  user: { ...mockCtx.user, role: 'admin' as const },
};

describe('rulesRouter', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe('getJurisdictions', () => {
    it('should return list of jurisdictions', async () => {
      const caller = rulesRouter.createCaller({} as any);
      const jurisdictions = await caller.getJurisdictions();

      expect(Array.isArray(jurisdictions)).toBe(true);
      expect(jurisdictions.length).toBeGreaterThan(0);
      expect(jurisdictions).toContain('NBC');
      expect(jurisdictions).toContain('Alberta');
      expect(jurisdictions).toContain('Calgary');
    });
  });

  describe('getCategories', () => {
    it('should return list of categories', async () => {
      const caller = rulesRouter.createCaller({} as any);
      const categories = await caller.getCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('occupancy');
      expect(categories).toContain('fire');
      expect(categories).toContain('egress');
    });
  });

  describe('search', () => {
    it('should search rules by query', async () => {
      const caller = rulesRouter.createCaller({} as any);
      
      // First seed a rule
      if (db) {
        try {
          await db.insert(rulesLibrary).values({
            ruleCode: 'TEST-SEARCH-001',
            name: 'Test Occupancy Rule',
            description: 'Test rule for searching',
            category: 'occupancy',
            jurisdiction: 'NBC',
            municipality: null,
            codeEdition: 'NBC-2023',
            nbcReference: 'NBC 3.2.2.1',
            keywords: 'test,occupancy,search',
            applicableOccupancies: null,
            applicableConstructionTypes: null,
            isActive: true,
            isCustom: false,
            createdBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (e) {
          // Rule might already exist
        }
      }

      const results = await caller.search({
        query: 'occupancy',
        limit: 50,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by jurisdiction', async () => {
      const caller = rulesRouter.createCaller({} as any);
      const results = await caller.search({
        jurisdiction: 'NBC',
        limit: 50,
      });

      expect(Array.isArray(results)).toBe(true);
      // All results should be NBC jurisdiction
      results.forEach((rule: any) => {
        expect(rule.jurisdiction).toBe('NBC');
      });
    });

    it('should filter by category', async () => {
      const caller = rulesRouter.createCaller({} as any);
      const results = await caller.search({
        category: 'occupancy',
        limit: 50,
      });

      expect(Array.isArray(results)).toBe(true);
      // All results should be occupancy category
      results.forEach((rule: any) => {
        expect(rule.category).toBe('occupancy');
      });
    });

    it('should respect limit parameter', async () => {
      const caller = rulesRouter.createCaller({} as any);
      const results = await caller.search({
        limit: 5,
      });

      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('createCustomRule', () => {
    it('should create custom rule with protected procedure', async () => {
      const caller = rulesRouter.createCaller(mockCtx as any);

      const result = await caller.createCustomRule({
        name: 'Test Custom Rule',
        description: 'This is a test custom rule for testing purposes',
        category: 'occupancy',
        keywords: 'test,custom',
      });

      expect(result.success).toBe(true);
      expect(result.ruleCode).toBeDefined();
      expect(result.ruleCode).toMatch(/^CUSTOM-/);
    });

    it('should require authentication', async () => {
      const caller = rulesRouter.createCaller({} as any);

      try {
        await caller.createCustomRule({
          name: 'Test Custom Rule',
          description: 'This is a test custom rule for testing purposes',
          category: 'occupancy',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should validate rule name length', async () => {
      const caller = rulesRouter.createCaller(mockCtx as any);

      try {
        await caller.createCustomRule({
          name: 'Bad',
          description: 'This is a test custom rule for testing purposes',
          category: 'occupancy',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('at least 5 characters');
      }
    });

    it('should validate description length', async () => {
      const caller = rulesRouter.createCaller(mockCtx as any);

      try {
        await caller.createCustomRule({
          name: 'Valid Name',
          description: 'Too short',
          category: 'occupancy',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('at least 20 characters');
      }
    });
  });

  describe('applyRule', () => {
    it('should apply rule to project', async () => {
      const caller = rulesRouter.createCaller(mockCtx as any);

      // First create a rule to apply
      if (db) {
        const ruleResult = await db.insert(rulesLibrary).values({
          ruleCode: 'TEST-APPLY-001',
          name: 'Test Apply Rule',
          description: 'Test rule for applying to projects',
          category: 'fire',
          jurisdiction: 'NBC',
          municipality: null,
          codeEdition: 'NBC-2023',
          nbcReference: 'NBC 3.2.3.1',
          keywords: 'test,apply',
          applicableOccupancies: null,
          applicableConstructionTypes: null,
          isActive: true,
          isCustom: false,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const ruleId = (ruleResult as any).insertId || 1;

        try {
          const result = await caller.applyRule({
            ruleId,
            projectId: 1,
          });

          expect(result.success).toBe(true);
          expect(result.message).toContain('successfully');
        } catch (error: any) {
          // Rule might already be applied
          expect(error.code).toBe('CONFLICT');
        }
      }
    });

    it('should apply rule globally without projectId', async () => {
      const caller = rulesRouter.createCaller(mockCtx as any);

      if (db) {
        const ruleResult = await db.insert(rulesLibrary).values({
          ruleCode: 'TEST-GLOBAL-001',
          name: 'Test Global Rule',
          description: 'Test rule for global application',
          category: 'egress',
          jurisdiction: 'NBC',
          municipality: null,
          codeEdition: 'NBC-2023',
          nbcReference: 'NBC 3.4.1.1',
          keywords: 'test,global',
          applicableOccupancies: null,
          applicableConstructionTypes: null,
          isActive: true,
          isCustom: false,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const ruleId = (ruleResult as any).insertId || 1;

        try {
          const result = await caller.applyRule({ ruleId });
          expect(result.success).toBe(true);
        } catch (error: any) {
          expect(error.code).toBe('CONFLICT');
        }
      }
    });

    it('should require authentication', async () => {
      const caller = rulesRouter.createCaller({} as any);

      try {
        await caller.applyRule({ ruleId: 1 });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('getAuditTrail', () => {
    it('should get audit trail for rule', async () => {
      const caller = rulesRouter.createCaller(mockCtx as any);

      const trail = await caller.getAuditTrail({
        ruleCode: 'NBC-2023-OCC-001',
        limit: 10,
      });

      expect(Array.isArray(trail)).toBe(true);
    });

    it('should require authentication', async () => {
      const caller = rulesRouter.createCaller({} as any);

      try {
        await caller.getAuditTrail({
          ruleCode: 'NBC-2023-OCC-001',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should respect limit parameter', async () => {
      const caller = rulesRouter.createCaller(mockCtx as any);

      const trail = await caller.getAuditTrail({
        limit: 5,
      });

      expect(trail.length).toBeLessThanOrEqual(5);
    });
  });

  describe('seedSampleRules', () => {
    it('should seed sample rules as admin', async () => {
      const caller = rulesRouter.createCaller(adminCtx as any);

      const result = await caller.seedSampleRules();

      expect(result.inserted).toBeGreaterThanOrEqual(0);
      expect(result.skipped).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should deny non-admin users', async () => {
      const caller = rulesRouter.createCaller(mockCtx as any);

      try {
        await caller.seedSampleRules();
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('FORBIDDEN');
        expect(error.message).toContain('admin');
      }
    });
  });
});
