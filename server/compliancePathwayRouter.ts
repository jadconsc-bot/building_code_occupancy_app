import { CompliancePathwayGenerator } from './compliancePathwayGenerator';
import { protectedProcedure, router } from './_core/trpc';
import { ReportGenerator } from './reportGenerator';
import { z } from 'zod';
import { getDb } from './db';
import { hydrateFootprintInput } from './services/projectFootprintHydration';

export const compliancePathwayRouter = router({
  // Generate compliance pathway
  generatePathway: protectedProcedure
    .input(
      z.object({
        complianceResult: z.record(z.string(), z.any()),
        inputs: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const projectId = typeof input.inputs.projectId === 'number' ? input.inputs.projectId : undefined;
      const hydratedInputs = await hydrateFootprintInput(db, ctx.user.id, projectId, input.inputs);
      console.log('[CompliancePathwayRouter] hydrated pathway inputs', { projectId, footprint_m2: hydratedInputs.footprint_m2 });
      return CompliancePathwayGenerator.generatePathway(
        input.complianceResult,
        hydratedInputs,
      );
    }),

  // Generate calculator report
  generateReport: protectedProcedure
    .input(
      z.object({
        calculationResult: z.record(z.string(), z.any()),
        projectInfo: z.object({
          name: z.string().optional(),
          engineer: z.string().optional(),
          jurisdiction: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(({ input }) => {
      return ReportGenerator.generateCalculatorReport(
        input.calculationResult,
        input.projectInfo,
      );
    }),

  // Generate compliance report
  generateComplianceReport: protectedProcedure
    .input(
      z.object({
        complianceResult: z.record(z.string(), z.any()),
        inputs: z.record(z.string(), z.any()),
        projectInfo: z.object({
          name: z.string().optional(),
          engineer: z.string().optional(),
          location: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(({ input }) => {
      return ReportGenerator.generateComplianceReport(
        input.complianceResult,
        input.inputs,
        input.projectInfo,
      );
    }),
});
