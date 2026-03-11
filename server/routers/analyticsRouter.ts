/**
 * Analytics Router
 * 
 * tRPC procedures for project analytics, calculations, and compliance data.
 * Fetches verified calculations and compliance status for a specific project.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { calculationResults, complianceAuditLog, projects, users } from '../../drizzle/schema';
import { TRPCError } from '@trpc/server';

export const analyticsRouter = router({
  /**
   * Get project analytics with all calculations and compliance data
   * Fetches verified calculations and compliance status for a specific project
   */
  getProjectAnalytics: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Verify project ownership
        const project = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.id, input.projectId),
              eq(projects.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!project || project.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        const projectData = project[0];

        // Fetch all calculations for this project
        const calculations = await db
          .select()
          .from(calculationResults)
          .where(eq(calculationResults.projectId, input.projectId))
          .orderBy(desc(calculationResults.createdAt));

        // Fetch compliance audit logs for this project
        const complianceRecords = await db
          .select()
          .from(complianceAuditLog)
          .where(eq(complianceAuditLog.projectId, input.projectId))
          .orderBy(desc(complianceAuditLog.timestamp));

        // Get creator user info for each calculation
        const creatorIdsSet = new Set(calculations.map(c => c.createdBy));
        const creatorIds = Array.from(creatorIdsSet);
        const creators = creatorIds.length > 0
          ? await db
              .select()
              .from(users)
              .where(inArray(users.id, creatorIds))
          : [];

        const creatorMap = new Map(creators.map((u) => [u.id, u]));

        // Transform calculations to include creator info and compliance status
        const enrichedCalculations = calculations.map((calc) => {
          const creator = creatorMap.get(calc.createdBy);
          
          // Parse result data
          let resultData;
          try {
            resultData = JSON.parse(calc.resultData);
          } catch {
            resultData = { error: 'Failed to parse result data' };
          }

          // Determine compliance status based on calculation type and results
          let complianceStatus: 'compliant' | 'non-compliant' | 'pending' = 'pending';
          if (calc.signatureVerified) {
            // If signature is verified, consider it compliant unless marked otherwise
            complianceStatus = 'compliant';
          }

          return {
            id: calc.id,
            type: calc.calculatorType,
            name: `${calc.calculatorType} Calculation`,
            description: `Calculation performed using ${calc.calculatorType} calculator`,
            createdAt: calc.createdAt,
            createdBy: creator?.name || 'Unknown',
            verified: calc.signatureVerified,
            compliant: calc.signatureVerified,
            complianceStatus,
            result: {
              value: resultData?.value || resultData?.result || 'N/A',
              unit: resultData?.unit || '',
              notes: resultData?.notes || '',
            },
            signature: calc.cryptographicSignature ? 'sig_verified' : undefined,
            auditTrail: calc.id,
          };
        });

        // Calculate statistics
        const stats = {
          total: enrichedCalculations.length,
          verified: enrichedCalculations.filter(c => c.verified).length,
          compliant: enrichedCalculations.filter(c => c.compliant).length,
          nonCompliant: enrichedCalculations.filter(c => !c.compliant).length,
          pending: enrichedCalculations.filter(c => c.complianceStatus === 'pending').length,
        };

        // Get latest compliance audit
        const latestCompliance = complianceRecords.length > 0 ? complianceRecords[0] : null;

        return {
          project: {
            id: projectData.id,
            name: projectData.name,
            address: projectData.address || '',
            occupancyCode: projectData.occupancyCode,
            occupancyName: projectData.occupancyCode, // TODO: Map to full name
            createdDate: projectData.createdAt,
            lastModified: projectData.updatedAt,
          },
          calculations: enrichedCalculations,
          compliance: latestCompliance
            ? {
                status: latestCompliance.overallStatus,
                percentage: latestCompliance.compliancePercentage,
                rulesEvaluated: latestCompliance.totalRulesEvaluated,
                rulesPassed: latestCompliance.totalRulesPassed,
                rulesFailed: latestCompliance.totalRulesFailed,
                timestamp: latestCompliance.timestamp,
              }
            : null,
          stats,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('[Analytics] Error fetching project analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project analytics',
        });
      }
    }),

  /**
   * Get calculations for a specific project
   */
  getProjectCalculations: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Verify project ownership
        const project = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.id, input.projectId),
              eq(projects.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!project || project.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Fetch all calculations
        const calculations = await db
          .select()
          .from(calculationResults)
          .where(eq(calculationResults.projectId, input.projectId))
          .orderBy(desc(calculationResults.createdAt));

        return calculations.map(calc => ({
          id: calc.id,
          type: calc.calculatorType,
          createdAt: calc.createdAt,
          verified: calc.signatureVerified,
          resultData: calc.resultData,
        }));
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('[Analytics] Error fetching calculations:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch calculations',
        });
      }
    }),

  /**
   * Get detailed information about a specific calculation
   */
  getCalculationDetails: protectedProcedure
    .input(z.object({ calculationId: z.string(), projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Verify project ownership
        const project = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.id, input.projectId),
              eq(projects.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!project || project.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Fetch the specific calculation
        const calculation = await db
          .select()
          .from(calculationResults)
          .where(
            and(
              eq(calculationResults.id, input.calculationId),
              eq(calculationResults.projectId, input.projectId)
            )
          )
          .limit(1);

        if (!calculation || calculation.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Calculation not found',
          });
        }

        const calc = calculation[0];
        const creator = await db
          .select()
          .from(users)
          .where(eq(users.id, calc.createdBy))
          .limit(1);

        // Parse result data
        let resultData;
        try {
          resultData = JSON.parse(calc.resultData);
        } catch {
          resultData = { error: 'Failed to parse result data' };
        }

        return {
          id: calc.id,
          type: calc.calculatorType,
          name: `${calc.calculatorType} Calculation`,
          description: `Calculation performed using ${calc.calculatorType} calculator`,
          createdAt: calc.createdAt,
          createdBy: creator[0]?.name || 'Unknown',
          verified: calc.signatureVerified,
          signature: calc.cryptographicSignature || null,
          resultData,
          calculationTrace: calc.calculationTrace || '',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('[Analytics] Error fetching calculation details:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch calculation details',
        });
      }
    }),

  /**
   * Get compliance status for a project
   */
  getProjectCompliance: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Verify project ownership
        const project = await db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.id, input.projectId),
              eq(projects.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (!project || project.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Fetch compliance audit logs
        const complianceRecords = await db
          .select()
          .from(complianceAuditLog)
          .where(eq(complianceAuditLog.projectId, input.projectId))
          .orderBy(desc(complianceAuditLog.timestamp));

        return complianceRecords.map(record => ({
          id: record.id,
          timestamp: record.timestamp,
          status: record.overallStatus,
          percentage: record.compliancePercentage,
          rulesEvaluated: record.totalRulesEvaluated,
          rulesPassed: record.totalRulesPassed,
          rulesFailed: record.totalRulesFailed,
          engineerName: record.engineerName,
          isDefendable: record.isDefendable,
        }));
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('[Analytics] Error fetching compliance:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch compliance data',
        });
      }
    }),
});
