import { CompliancePathwayGenerator } from './compliancePathwayGenerator';
import { protectedProcedure, router } from './_core/trpc';
import { ReportGenerator } from './reportGenerator';
import { z } from 'zod';

export const compliancePathwayRouter = router({
  // Generate compliance pathway
  generatePathway: protectedProcedure
    .input(
      z.object({
        complianceResult: z.record(z.string(), z.any()),
        inputs: z.record(z.string(), z.any()),
      })
    )
    .mutation(({ input }) => {
      return CompliancePathwayGenerator.generatePathway(
        input.complianceResult,
        input.inputs,
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
