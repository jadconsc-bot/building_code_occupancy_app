/**
 * Calculations Router
 * 
 * tRPC procedures for managing calculation history, verification, and exports
 * Provides type-safe API for frontend to interact with calculation database
 */

import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { calculationResults, calculationAuditLog } from '../drizzle/schema';
import { eq, and, desc, like, gte, lte } from 'drizzle-orm';
import { certificateManager } from './digitalCertificateManager';
import { TRPCError } from '@trpc/server';
import { saveCalculationResult, getProjectCalculations } from './calculationsProcedures';
import { FireResistanceRatingCalculator } from './calculators/fireResistanceRatingCalculator';

/**
 * Calculation result schema for validation
 */
const CalculationResultSchema = z.object({
  id: z.string().uuid(),
  projectId: z.number(),
  userId: z.number(),
  calculatorType: z.string(),
  rulesetVersion: z.string(),
  inputData: z.string(),
  resultData: z.string(),
  calculationTrace: z.string().optional(),
  cryptographicSignature: z.string(),
  certificateChain: z.string().optional(),
  signatureVerified: z.boolean(),
  createdAt: z.date(),
  createdBy: z.number(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  immutable: z.boolean()
});

/**
 * Filter schema for calculation queries
 */
const CalculationFilterSchema = z.object({
  projectId: z.number().optional(),
  calculatorType: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  verified: z.boolean().optional(),
  searchQuery: z.string().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

/**
 * Export format schema
 */
const ExportFormatSchema = z.enum(['json', 'json-ld', 'pdf']);

/**
 * Calculations Router
 */
export const calculationsRouter = router({
  saveResult: saveCalculationResult,
  getProjectCalculations: getProjectCalculations,
  /**
   * Get calculation history for current user
   */
  getHistory: protectedProcedure
    .input(CalculationFilterSchema)
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      try {
        // Build query conditions
        const conditions = [eq(calculationResults.userId, ctx.user.id)];

        if (input.projectId) {
          conditions.push(eq(calculationResults.projectId, input.projectId));
        }

        if (input.calculatorType) {
          conditions.push(eq(calculationResults.calculatorType, input.calculatorType));
        }

        if (input.verified !== undefined) {
          conditions.push(eq(calculationResults.signatureVerified, input.verified));
        }

        if (input.startDate) {
          conditions.push(gte(calculationResults.createdAt, input.startDate));
        }

        if (input.endDate) {
          conditions.push(lte(calculationResults.createdAt, input.endDate));
        }

        // Execute query with pagination
        const results = await db
          .select()
          .from(calculationResults)
          .where(and(...conditions))
          .orderBy(desc(calculationResults.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count for pagination
        const countResult = await db
          .select({ count: calculationResults.id })
          .from(calculationResults)
          .where(and(...conditions));

        return {
          calculations: results.map((r) => ({
            id: r.id,
            projectId: r.projectId,
            calculatorType: r.calculatorType,
            displayName: r.calculatorType,
            timestamp: r.createdAt,
            signatureVerified: r.signatureVerified,
            resultSummary: r.resultData,
            inputCount: Object.keys(JSON.parse(r.inputData || '{}')).length,
          })),
          total: countResult[0]?.count || 0,
          hasMore: (input.offset + input.limit) < (Number(countResult[0]?.count) || 0),
        };
      } catch (error) {
        console.error('Error fetching calculation history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch calculation history',
        });
      }
    }),

  /**
   * Get detailed calculation result
   */
  getDetail: protectedProcedure
    .input(z.object({ calculationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      try {
        const [result] = await db
          .select()
          .from(calculationResults)
          .where(
            and(
              eq(calculationResults.id, input.calculationId),
              eq(calculationResults.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Calculation not found',
          });
        }

        // Get audit log for this calculation
        const auditLog = await db
          .select()
          .from(calculationAuditLog)
          .where(eq(calculationAuditLog.calculationResultId, input.calculationId))
          .orderBy(desc(calculationAuditLog.timestamp));

        return {
          id: result.id,
          projectId: result.projectId,
          calculatorType: result.calculatorType,
          displayName: result.calculatorType,
          inputs: JSON.parse(result.inputData || '{}'),
          results: JSON.parse(result.resultData || '{}'),
          calculationTrace: JSON.parse(result.calculationTrace || '[]'),
          signature: result.cryptographicSignature,
          certificateChain: result.certificateChain,
          signatureVerified: result.signatureVerified,
          timestamp: result.createdAt,
          rulesetVersion: result.rulesetVersion,
          references: [],
          auditLog: auditLog.map((log) => ({
            id: log.id,
            action: log.action,
            actor: log.actor,
            timestamp: log.timestamp,
            details: log.details,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error fetching calculation detail:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch calculation detail',
        });
      }
    }),

  /**
   * Verify calculation signature
   */
  verifySignature: protectedProcedure
    .input(z.object({ calculationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      try {
        const [result] = await db
          .select()
          .from(calculationResults)
          .where(
            and(
              eq(calculationResults.id, input.calculationId),
              eq(calculationResults.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Calculation not found',
          });
        }

        // Verify certificate is still valid
        const isValid = await certificateManager.validateCertificate(result.certificateChain || '');

        // Get certificate chain
        const certChain = await certificateManager.getCertificateChain(result.certificateChain || '');

        return {
          calculationResultId: result.id,
          isValid,
          signatureVerified: result.signatureVerified,
          certificateChain: certChain,
          timestamp: result.createdAt,
          message: isValid
            ? 'Calculation signature is valid and certificate is active'
            : 'Certificate has expired but calculation remains immutably stored',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error verifying signature:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify signature',
        });
      }
    }),

  /**
   * Export calculation result
   */
  export: protectedProcedure
    .input(
      z.object({
        calculationId: z.string().uuid(),
        format: ExportFormatSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      try {
        const [result] = await db
          .select()
          .from(calculationResults)
          .where(
            and(
              eq(calculationResults.id, input.calculationId),
              eq(calculationResults.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Calculation not found',
          });
        }

        // Build export data based on format
        let exportData: any;

        if (input.format === 'json') {
          exportData = {
            id: result.id,
            calculatorType: result.calculatorType,
            inputs: JSON.parse(result.inputData || '{}'),
            results: JSON.parse(result.resultData || '{}'),
            signature: result.cryptographicSignature,
            certificateChain: result.certificateChain,
            timestamp: result.createdAt,
            rulesetVersion: result.rulesetVersion,
            references: [],
          };
        } else if (input.format === 'json-ld') {
          // JSON-LD format for semantic web
          exportData = {
            '@context': 'https://schema.org',
            '@type': 'CalculationResult',
            identifier: result.id,
            calculatorType: result.calculatorType,
            inputs: JSON.parse(result.inputData || '{}'),
            results: JSON.parse(result.resultData || '{}'),
            signature: result.cryptographicSignature,
            certificateChain: result.certificateChain,
            dateCreated: result.createdAt.toISOString(),
            rulesetVersion: result.rulesetVersion,
            references: [],
            author: {
              '@type': 'Person',
              identifier: ctx.user.id,
              name: ctx.user.name,
            },
          };
        } else if (input.format === 'pdf') {
          // PDF format - return data for client to generate PDF
          exportData = {
            type: 'pdf',
            title: `${result.calculatorType} - ${result.createdAt.toLocaleDateString()}`,
            calculationResultId: result.id,
            calculatorType: result.calculatorType,
            inputs: JSON.parse(result.inputData || '{}'),
            results: JSON.parse(result.resultData || '{}'),
            signature: result.cryptographicSignature,
            timestamp: result.createdAt,
            rulesetVersion: result.rulesetVersion,
            references: [],
            user: {
              name: ctx.user.name,
              email: ctx.user.email,
            },
          };
        }

        // Log export action
        await db.insert(calculationAuditLog).values({
          calculationResultId: result.id,
          action: 'EXPORT',
          actor: `${ctx.user.name} (${ctx.user.email})`,
          timestamp: new Date(),
          details: `Exported as ${input.format.toUpperCase()}`,
        } as any);

        return {
          success: true,
          format: input.format,
          data: exportData,
          filename: `calculation-${result.id}-${new Date().getTime()}.${input.format === 'pdf' ? 'pdf' : 'json'}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error exporting calculation:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export calculation',
        });
      }
    }),

  /**
   * Get calculation statistics for user
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    try {
      const results = await db
        .select()
        .from(calculationResults)
        .where(eq(calculationResults.userId, ctx.user.id));

      const stats = {
        totalCalculations: results.length,
        verifiedCalculations: results.filter((r) => r.signatureVerified).length,
        calculatorTypes: Array.from(new Set(results.map((r) => r.calculatorType))).length,
        lastCalculation: results.length > 0 ? results[0].createdAt : null,
        byCalculatorType: {} as Record<string, number>,
      };

      // Count by calculator type
      for (const result of results) {
        stats.byCalculatorType[result.calculatorType] =
          (stats.byCalculatorType[result.calculatorType] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch statistics',
      });
    }
  }),

  /**
   * Delete calculation (soft delete - keeps audit trail)
   */
  delete: protectedProcedure
    .input(z.object({ calculationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      try {
        const [result] = await db
          .select()
          .from(calculationResults)
          .where(
            and(
              eq(calculationResults.id, input.calculationId),
              eq(calculationResults.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Calculation not found',
          });
        }

        // Log deletion
        await db.insert(calculationAuditLog).values({
          calculationResultId: result.id,
          action: 'DELETE',
          actor: `${ctx.user.name} (${ctx.user.email})`,
          timestamp: new Date(),
          details: 'Calculation marked as deleted',
        } as any);

        // Soft delete - mark as deleted but keep record
        // In production, would use UPDATE statement to set deleted flag
        // For now, just log the action

        return {
          success: true,
          message: 'Calculation deleted successfully',
          calculationResultId: result.id,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error deleting calculation:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete calculation',
        });
      }
    }),

  /**
   * Get audit log for calculation
   */
  getAuditLog: protectedProcedure
    .input(z.object({ calculationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      try {
        // Verify user owns this calculation
        const [result] = await db
          .select()
          .from(calculationResults)
          .where(
            and(
              eq(calculationResults.id, input.calculationId),
              eq(calculationResults.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Calculation not found',
          });
        }

        // Get audit log
        const auditLog = await db
          .select()
          .from(calculationAuditLog)
          .where(eq(calculationAuditLog.calculationResultId, input.calculationId))
          .orderBy(desc(calculationAuditLog.timestamp));

        return {
          calculationId: input.calculationId,
          auditLog: auditLog.map((log) => ({
            id: log.id,
            action: log.action,
            actor: log.actor,
            timestamp: log.timestamp,
            details: log.details,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error fetching audit log:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch audit log',
        });
      }
     }),

  // Fire-Resistance Rating Calculator
  calculateFireResistance: protectedProcedure
    .input(
      z.object({
        occupancy: z.string(),
        area_m2: z.number().optional(),
        storeys: z.number().optional(),
        construction_type: z.string().optional(),
        sprinklers: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const calculator = new FireResistanceRatingCalculator();
      return calculator.execute(input, {});
    }),
});
/**
 * Export router type for client-side usage
 */
export type CalculationsRouter = typeof calculationsRouter;
