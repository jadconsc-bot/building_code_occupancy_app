import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { 
  rulesLibrary, 
  ruleApplications, 
  customRules, 
  ruleAuditTrail 
} from "../../drizzle/schema";
import { eq, and, or, like, desc, isNull } from "drizzle-orm";
import * as crypto from "crypto";

// Sample rules for seeding
const SAMPLE_RULES = [
  {
    ruleCode: 'NBC-2023-OCC-001',
    name: 'Occupancy Load Calculation - Residential',
    description: 'Calculate occupancy load for residential buildings based on floor area and occupancy type',
    category: 'occupancy',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.2.2.1',
    keywords: 'occupancy,load,residential,calculation',
  },
  {
    ruleCode: 'NBC-2023-FIRE-001',
    name: 'Fire Separation Requirements',
    description: 'Minimum fire separation distances between buildings',
    category: 'fire',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.2.3.1',
    keywords: 'fire,separation,distance,safety',
  },
  {
    ruleCode: 'NBC-2023-EGRESS-001',
    name: 'Exit Door Width Requirements',
    description: 'Minimum exit door widths based on occupancy load and building classification',
    category: 'egress',
    jurisdiction: 'NBC',
    municipality: null,
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.4.1.1',
    keywords: 'egress,exit,door,width,minimum',
  },
  {
    ruleCode: 'AB-2023-OCC-001',
    name: 'Alberta Occupancy Load - Residential',
    description: 'Alberta-specific occupancy load requirements for residential buildings',
    category: 'occupancy',
    jurisdiction: 'Alberta',
    municipality: null,
    codeEdition: 'AE-2023',
    nbcReference: 'NBC 3.2.2.1 (AB Amendment)',
    keywords: 'occupancy,load,residential,alberta',
  },
  {
    ruleCode: 'CALGARY-2023-FIRE-001',
    name: 'Calgary Fire Separation - Enhanced',
    description: 'Calgary municipal requirements for enhanced fire separation between buildings',
    category: 'fire',
    jurisdiction: 'Calgary',
    municipality: 'Calgary',
    codeEdition: 'NBC-2023',
    nbcReference: 'NBC 3.2.3.1 (Calgary Amendment)',
    keywords: 'fire,separation,calgary,municipal',
  },
];

/**
 * Rules Router - Comprehensive rules management system
 * Handles: searching rules, applying rules to projects, creating custom rules
 * Full audit trail for legal defensibility
 */
export const rulesRouter = router({
  /**
   * Search rules by keyword, jurisdiction, category
   * Public procedure - available to all users
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        jurisdiction: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().default(50).pipe(z.number().max(500)),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      let whereConditions = [eq(rulesLibrary.isActive, true)];

      // Keyword search in name, description, keywords
      if (input.query) {
        const searchTerm = `%${input.query}%`;
        whereConditions.push(
          or(
            like(rulesLibrary.name, searchTerm),
            like(rulesLibrary.description, searchTerm),
            like(rulesLibrary.keywords, searchTerm),
            like(rulesLibrary.nbcReference, searchTerm)
          ) as any
        );
      }

      // Filter by jurisdiction
      if (input.jurisdiction) {
        whereConditions.push(eq(rulesLibrary.jurisdiction, input.jurisdiction));
      }

      // Filter by category
      if (input.category) {
        whereConditions.push(eq(rulesLibrary.category, input.category));
      }

      const rules = await db
        .select()
        .from(rulesLibrary)
        .where(and(...whereConditions))
        .orderBy(desc(rulesLibrary.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rules;
    }),

  /**
   * Get all available jurisdictions
   * Public procedure
   */
  getJurisdictions: publicProcedure.query(async () => {
    return [
      "NBC",
      "Alberta",
      "BC",
      "Ontario",
      "Calgary",
      "Edmonton",
      "Toronto",
      "Lethbridge",
      "Airdrie",
    ];
  }),

  /**
   * Get all available categories
   * Public procedure
   */
  getCategories: publicProcedure.query(async () => {
    return [
      "occupancy",
      "egress",
      "fire",
      "structural",
      "electrical",
      "plumbing",
      "hvac",
      "accessibility",
      "energy",
      "other",
    ];
  }),

  /**
   * Apply a rule to a project (or globally if projectId is null)
   * Protected procedure - requires authentication
   */
  applyRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.number(),
        projectId: z.number().optional(), // null = organization-wide (global)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Verify rule exists
      const rule = await db
        .select()
        .from(rulesLibrary)
        .where(eq(rulesLibrary.id, input.ruleId));

      if (!rule.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
      }

      // Check if already applied
      const existing = await db
        .select()
        .from(ruleApplications)
        .where(
          and(
            eq(ruleApplications.ruleId, input.ruleId),
            input.projectId
              ? eq(ruleApplications.projectId, input.projectId)
              : isNull(ruleApplications.projectId),
            eq(ruleApplications.status, "active")
          )
        );

      if (existing.length) {
        throw new TRPCError({ code: "CONFLICT", message: "Rule already applied" });
      }

      // Apply rule
      const result = await db.insert(ruleApplications).values({
        ruleId: input.ruleId,
        projectId: input.projectId || null,
        userId: ctx.user.id,
        appliedAt: new Date(),
        status: "active",
        isCompliant: null,
        complianceNotes: null,
      });

      // Log to audit trail
      await db.insert(ruleAuditTrail).values({
        action: "APPLIED",
        ruleId: input.ruleId,
        ruleCode: rule[0].ruleCode,
        ruleType: "library",
        projectId: input.projectId || null,
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        userCredentials: JSON.stringify({ role: ctx.user.role }),
        details: {
          projectId: input.projectId || "global",
          timestamp: new Date().toISOString(),
        },
        ipAddress: ctx.req?.ip || "unknown",
        userAgent: ctx.req?.get("user-agent") || "unknown",
      });

      return { success: true, message: "Rule applied successfully" };
    }),

  /**
   * Get rules applied to a specific project
   * Protected procedure
   */
  getProjectRules: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const rules = await db
        .select({
          id: ruleApplications.id,
          ruleId: ruleApplications.ruleId,
          ruleName: rulesLibrary.name,
          ruleCode: rulesLibrary.ruleCode,
          category: rulesLibrary.category,
          jurisdiction: rulesLibrary.jurisdiction,
          nbcReference: rulesLibrary.nbcReference,
          appliedAt: ruleApplications.appliedAt,
          status: ruleApplications.status,
          isCompliant: ruleApplications.isCompliant,
          complianceNotes: ruleApplications.complianceNotes,
        })
        .from(ruleApplications)
        .innerJoin(rulesLibrary, eq(ruleApplications.ruleId, rulesLibrary.id))
        .where(
          and(
            eq(ruleApplications.projectId, input.projectId),
            eq(ruleApplications.status, "active")
          )
        )
        .orderBy(desc(ruleApplications.appliedAt));

      return rules;
    }),

  /**
   * Get global (organization-wide) rules
   * Protected procedure
   */
  getGlobalRules: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

    const rules = await db
      .select({
        id: ruleApplications.id,
        ruleId: ruleApplications.ruleId,
        ruleName: rulesLibrary.name,
        ruleCode: rulesLibrary.ruleCode,
        category: rulesLibrary.category,
        jurisdiction: rulesLibrary.jurisdiction,
        nbcReference: rulesLibrary.nbcReference,
        appliedAt: ruleApplications.appliedAt,
        status: ruleApplications.status,
      })
      .from(ruleApplications)
      .innerJoin(rulesLibrary, eq(ruleApplications.ruleId, rulesLibrary.id))
      .where(
        and(
          isNull(ruleApplications.projectId),
          eq(ruleApplications.status, "active")
        )
      )
      .orderBy(desc(ruleApplications.appliedAt));

    return rules;
  }),

  /**
   * Deactivate a rule application
   * Protected procedure
   */
  deactivateRule: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Get the application to log it
      const app = await db
        .select()
        .from(ruleApplications)
        .where(eq(ruleApplications.id, input.applicationId));

      if (!app.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule application not found" });
      }

      // Get the rule for audit trail
      const rule = await db
        .select()
        .from(rulesLibrary)
        .where(eq(rulesLibrary.id, app[0].ruleId));

      // Deactivate
      await db
        .update(ruleApplications)
        .set({ status: "inactive", updatedAt: new Date() })
        .where(eq(ruleApplications.id, input.applicationId));

      // Log to audit trail
      await db.insert(ruleAuditTrail).values({
        action: "DEACTIVATED",
        ruleId: app[0].ruleId,
        ruleCode: rule[0]?.ruleCode || "unknown",
        ruleType: "library",
        projectId: app[0].projectId,
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        userCredentials: JSON.stringify({ role: ctx.user.role }),
        details: {
          applicationId: input.applicationId,
          timestamp: new Date().toISOString(),
        },
        ipAddress: ctx.req?.ip || "unknown",
        userAgent: ctx.req?.get("user-agent") || "unknown",
      });

      return { success: true, message: "Rule deactivated successfully" };
    }),

  /**
   * Create a custom rule
   * Protected procedure - requires authentication
   */
  createCustomRule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(5, "Name must be at least 5 characters"),
        description: z.string().min(20, "Description must be at least 20 characters"),
        category: z.string(),
        jurisdiction: z.string().optional(),
        keywords: z.string().optional(),
        creatorCredentials: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      // Generate unique rule code
      const ruleCode = `CUSTOM-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      // Create custom rule
      const result = await db.insert(customRules).values({
        ruleCode,
        name: input.name,
        description: input.description,
        category: input.category,
        jurisdiction: input.jurisdiction || null,
        keywords: input.keywords || null,
        creatorId: ctx.user.id,
        creatorName: ctx.user.name || "Unknown",
        creatorCredentials: JSON.stringify(input.creatorCredentials || {}),
        authorizedBy: null,
        authorizedAt: null,
        isActive: true,
      });

      // Log to audit trail
      await db.insert(ruleAuditTrail).values({
        action: "CREATED",
        ruleId: (result as any).insertId,
        ruleCode,
        ruleType: "custom",
        projectId: null,
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        userCredentials: JSON.stringify({ role: ctx.user.role }),
        details: {
          name: input.name,
          category: input.category,
          timestamp: new Date().toISOString(),
        },
        ipAddress: ctx.req?.ip || "unknown",
        userAgent: ctx.req?.get("user-agent") || "unknown",
      });

      return {
        success: true,
        message: "Custom rule created successfully",
        ruleCode,
      };
    }),

  /**
   * Seed sample rules (admin only)
   * Protected procedure
   */
  seedSampleRules: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

    // Only allow admin users
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can seed rules" });
    }

    let inserted = 0;
    let skipped = 0;

    for (const rule of SAMPLE_RULES) {
      try {
        await db.insert(rulesLibrary).values({
          ruleCode: rule.ruleCode,
          name: rule.name,
          description: rule.description,
          category: rule.category,
          jurisdiction: rule.jurisdiction,
          municipality: rule.municipality,
          codeEdition: rule.codeEdition,
          nbcReference: rule.nbcReference,
          keywords: rule.keywords,
          applicableOccupancies: null,
          applicableConstructionTypes: null,
          isActive: true,
          isCustom: false,
          createdBy: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        inserted++;
      } catch (error: any) {
        if (error.message?.includes("Duplicate entry")) {
          skipped++;
        } else {
          throw error;
        }
      }
    }

    return { inserted, skipped, total: SAMPLE_RULES.length };
  }),

  /**
   * Get audit trail for a rule
   * Protected procedure
   */
  getAuditTrail: protectedProcedure
    .input(
      z.object({
        ruleCode: z.string().optional(),
        projectId: z.number().optional(),
        limit: z.number().default(100).pipe(z.number().max(500)),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      let whereConditions = [];

      if (input.ruleCode) {
        whereConditions.push(eq(ruleAuditTrail.ruleCode, input.ruleCode));
      }

      if (input.projectId) {
        whereConditions.push(eq(ruleAuditTrail.projectId, input.projectId));
      }

      const trail = await db
        .select()
        .from(ruleAuditTrail)
        .where(whereConditions.length ? and(...whereConditions) : undefined)
        .orderBy(desc(ruleAuditTrail.createdAt))
        .limit(input.limit);

      return trail;
    }),
});
