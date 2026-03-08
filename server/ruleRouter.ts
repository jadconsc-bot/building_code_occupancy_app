import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { RuleService } from "./ruleService";

/**
 * Rule Router - tRPC procedures for rule management
 * Exposes RuleService methods as tRPC endpoints
 */

export const ruleRouter = router({
  /**
   * Get all active rules for a specific code version
   * Public procedure - available to all users
   */
  getRulesForVersion: publicProcedure
    .input(
      z.object({
        codeVersion: z.string().default("NBC_2025"),
        jurisdiction: z.string().default("Canada"),
      })
    )
    .query(async ({ input }: any) => {
      return await RuleService.getRulesForVersion(input.codeVersion, input.jurisdiction);
    }),

  /**
   * Get a specific rule by code
   * Public procedure
   */
  getRuleByCode: publicProcedure
    .input(z.object({ ruleCode: z.string() }))
    .query(async ({ input }: any) => {
      return await RuleService.getRuleByCode(input.ruleCode);
    }),

  /**
   * Get all rules by category
   * Public procedure
   */
  getRulesByCategory: publicProcedure
    .input(
      z.object({
        category: z.string(),
        codeVersion: z.string().default("NBC_2025"),
        jurisdiction: z.string().default("Canada"),
      })
    )
    .query(async ({ input }: any) => {
      return await RuleService.getRulesByCategory(
        input.category,
        input.codeVersion,
        input.jurisdiction
      );
    }),

  /**
   * Get all available code versions
   * Public procedure
   */
  getAvailableCodeVersions: publicProcedure.query(async () => {
    return await RuleService.getAvailableCodeVersions();
  }),

  /**
   * Get rule history (all versions of a rule)
   * Public procedure
   */
  getRuleHistory: publicProcedure
    .input(z.object({ ruleCode: z.string() }))
    .query(async ({ input }: any) => {
      return await RuleService.getRuleHistory(input.ruleCode);
    }),

  /**
   * Create a new rule (admin only)
   * Protected procedure - requires admin role
   */
  createRule: protectedProcedure
    .input(
      z.object({
        ruleCode: z.string(),
        codeVersion: z.string(),
        title: z.string(),
        category: z.string(),
        nbcReference: z.string(),
        ruleData: z.record(z.string(), z.unknown()),
        jurisdiction: z.string().default("Canada"),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      // Only admins can create rules
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can create rules");
      }

      return await RuleService.createRule(
        input.ruleCode,
        input.codeVersion,
        input.title,
        input.category,
        input.nbcReference,
        input.ruleData,
        ctx.user.id,
        input.jurisdiction
      );
    }),

  /**
   * Update an existing rule (admin only)
   * Protected procedure - requires admin role
   */
  updateRule: protectedProcedure
    .input(
      z.object({
        ruleCode: z.string(),
        updates: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          nbcReference: z.string().optional(),
          ruleData: z.record(z.string(), z.unknown()).optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      // Only admins can update rules
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can update rules");
      }

      return await RuleService.updateRule(input.ruleCode, input.updates, ctx.user.id);
    }),

  /**
   * Deprecate a rule (mark as inactive) - admin only
   * Protected procedure - requires admin role
   */
  deprecateRule: protectedProcedure
    .input(z.object({ ruleCode: z.string() }))
    .mutation(async ({ input, ctx }: any) => {
      // Only admins can deprecate rules
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can deprecate rules");
      }

      return await RuleService.deprecateRule(input.ruleCode, ctx.user.id);
    }),
});
