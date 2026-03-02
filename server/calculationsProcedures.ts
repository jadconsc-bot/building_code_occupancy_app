/**
 * Additional Calculation Procedures
 * 
 * Procedures for saving calculation results to projects
 * Handles project-calculator association and result persistence
 */

import { z } from 'zod';
import { protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { calculationResults, calculationAuditLog } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { CalculationEngine } from './calculationEngine';
import { TRPCError } from '@trpc/server';

/**
 * Save calculation result to project
 * Automatically signs the result and creates audit log entry
 */
export const saveCalculationResult = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      calculatorType: z.string(),
      inputs: z.record(z.any()),
      outputs: z.record(z.any()),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });
    }

    const engine = new CalculationEngine();

    try {
      // Create calculation signature
      const signature = engine.signCalculation(input.inputs, input.outputs, ctx.user.id);
      
      // Generate unique ID
      const id = `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Save to database
      await db.insert(calculationResults).values({
        id,
        projectId: parseInt(input.projectId),
        userId: ctx.user.id,
        calculatorType: input.calculatorType,
        rulesetVersion: '1.0',
        inputData: JSON.stringify(input.inputs),
        resultData: JSON.stringify(input.outputs),
        calculationTrace: JSON.stringify({ inputs: input.inputs, outputs: input.outputs }),
        cryptographicSignature: signature,
        signatureVerified: true,
        createdAt: new Date(),
        createdBy: ctx.user.id,
        ipAddress: ctx.req.ip || 'unknown',
        userAgent: ctx.req.headers['user-agent'] || 'unknown',
        immutable: true,
      });

      // Create audit log entry
      await db.insert(calculationAuditLog).values({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        calculationResultId: id,
        action: 'CREATE',
        actor: ctx.user.id,
        timestamp: new Date(),
        details: `Calculation saved for project ${input.projectId}`,
        ipAddress: ctx.req.ip || 'unknown',
      });

      return {
        id,
        projectId: parseInt(input.projectId),
        calculatorType: input.calculatorType,
        inputs: input.inputs,
        outputs: input.outputs,
        signature,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error saving calculation result:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save calculation result',
      });
    }
  });

/**
 * Get calculations for a specific project
 */
export const getProjectCalculations = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });
    }

    try {
      const results = await db
        .select()
        .from(calculationResults)
        .where(
          and(
            eq(calculationResults.projectId, parseInt(input.projectId)),
            eq(calculationResults.userId, ctx.user.id)
          )
        );

      return results.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        calculatorType: r.calculatorType,
        inputs: JSON.parse(r.inputData),
        outputs: JSON.parse(r.resultData),
        signature: r.cryptographicSignature,
        createdAt: r.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching project calculations:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch project calculations',
      });
    }
  });

/**
 * Verify calculation signature
 */
export const verifyCalculationSignature = protectedProcedure
  .input(z.object({ calculationId: z.string() }))
  .query(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection failed',
      });
    }

    try {
      const result = await db
        .select()
        .from(calculationResults)
        .where(
          and(
            eq(calculationResults.id, input.calculationId),
            eq(calculationResults.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Calculation not found',
        });
      }

      const engine = new CalculationEngine();
      const inputs = JSON.parse(result[0].inputData);
      const outputs = JSON.parse(result[0].resultData);
      
      const isValid = engine.verifyCalculation(
        inputs,
        outputs,
        result[0].cryptographicSignature,
        result[0].createdBy
      );

      return {
        id: result[0].id,
        isValid,
        signatureVerified: result[0].signatureVerified,
        createdAt: result[0].createdAt,
      };
    } catch (error) {
      console.error('Error verifying calculation signature:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify calculation signature',
      });
    }
  });
