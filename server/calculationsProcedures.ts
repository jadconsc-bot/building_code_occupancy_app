/**
 * Additional Calculation Procedures
 * 
 * Procedures for saving calculation results to projects
 * Handles project-calculator association and result persistence
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { calculationResults, calculationAuditLog } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { CalculationEngine } from './calculationEngine';
import { certificateManager } from './digitalCertificateManager';
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
      inputs: z.record(z.string(), z.any()),
      outputs: z.record(z.string(), z.any()),
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

    try {
      const cert = await certificateManager.getOrCreateActiveCertificate();
      const createdAt = new Date();
      const engine = new CalculationEngine();
      const signature = engine.signCalculation(input.inputs, input.outputs, ctx.user.id, createdAt.getTime(), cert.privateKey);
      const verifiedNow = engine.verifySignature(input.inputs, input.outputs, ctx.user.id, createdAt.getTime(), signature, cert.publicKey);
      const id = randomUUID();

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
        certificateChain: cert.id,
        signatureVerified: verifiedNow,
        createdAt,
        createdBy: ctx.user.id,
        ipAddress: ctx.req.ip || 'unknown',
        userAgent: ctx.req.headers['user-agent'] || 'unknown',
        immutable: true,
      });

      // Create audit log entry
      await db.insert(calculationAuditLog).values({
        id: randomUUID(),
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
        createdAt,
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

