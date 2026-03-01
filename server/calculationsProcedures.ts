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
    const engine = new CalculationEngine();

    try {
      // Create calculation signature
      const signature = engine.signCalculation(input.inputs, input.outputs, ctx.user.id);

      // Save to database
      const result = await db
        .insert(calculationResults)
        .values({
          projectId: input.projectId,
          userId: ctx.user.id,
          calculatorType: input.calculatorType,
          inputs: JSON.stringify(input.inputs),
          outputs: JSON.stringify(input.outputs),
          signature,
          timestamp: Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!result[0]) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save calculation' });
      }

      // Create audit log entry
      await db.insert(calculationAuditLog).values({
        calculationId: result[0].id,
        userId: ctx.user.id,
        action: 'CREATE',
        details: `Calculation saved for project ${input.projectId}`,
        timestamp: Date.now(),
        createdAt: new Date(),
      });

      return {
        id: result[0].id,
        projectId: result[0].projectId,
        calculatorType: result[0].calculatorType,
        inputs: input.inputs,
        outputs: input.outputs,
        signature: result[0].signature,
        timestamp: result[0].timestamp,
        createdAt: result[0].createdAt,
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

    try {
      const results = await db
        .select()
        .from(calculationResults)
        .where((t) => t.projectId === input.projectId && t.userId === ctx.user.id);

      return results.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        calculatorType: r.calculatorType,
        inputs: JSON.parse(r.inputs),
        outputs: JSON.parse(r.outputs),
        signature: r.signature,
        timestamp: r.timestamp,
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
