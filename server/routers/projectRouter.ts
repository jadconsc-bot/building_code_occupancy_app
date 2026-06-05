/**
 * Project Router
 *
 * tRPC procedures for project management.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { projectRepository } from '../repositories/ProjectRepository';

export const projectRouter = router({
  /**
   * Get all projects for current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return projectRepository.getUserProjects(ctx.user.id);
  }),

  /**
   * Get a single project
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return projectRepository.getProject(input.id, ctx.user.id);
    }),

  /**
   * Create a new project
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255).trim(),
      description: z.string().max(2000).trim().optional(),
      occupancyCode: z.string().max(50).trim().optional(),
      address: z.string().max(200).trim().optional(),
      template: z.string().max(100).trim().optional(),
      buildingType: z.string().max(100).trim().optional(),
      province: z.string().max(5).optional(),
      climateZone: z.string().max(10).optional(),
      seismicZone: z.string().max(20).optional(),
      stepCodeTier: z.string().max(5).optional(),
      jurisdictionDetected: z.boolean().optional(),
      projectCode: z.string().max(50).optional(),
      grossFloorArea: z.number().positive().optional(),
      zoningCategory: z.string().max(50).optional(),
      siteConstraints: z.string().max(2000).trim().optional(),
      storeys: z.number().int().positive().optional(),
      buildingHeight: z.number().positive().optional(),
      constructionType: z.string().max(50).optional(),
      sprinklersRequired: z.boolean().optional(),
      part3Determination: z.string().max(20).optional(),
      codeEdition: z.string().max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return projectRepository.createProject({
        userId: ctx.user.id,
        ...input,
      });
    }),

  /**
   * Update a project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).trim().optional(),
        description: z.string().max(2000).trim().optional(),
        occupancyCode: z.string().max(50).trim().optional(),
        address: z.string().max(200).trim().optional(),
        template: z.string().max(100).trim().optional(),
        buildingType: z.string().max(100).trim().optional(),
        province: z.string().max(5).optional(),
        climateZone: z.string().max(10).optional(),
        seismicZone: z.string().max(20).optional(),
        stepCodeTier: z.string().max(5).optional(),
        jurisdictionDetected: z.boolean().optional(),
        projectCode: z.string().max(50).optional(),
        grossFloorArea: z.number().positive().optional(),
        zoningCategory: z.string().max(50).optional(),
        siteConstraints: z.string().max(2000).trim().optional(),
        storeys: z.number().int().positive().optional(),
        buildingHeight: z.number().positive().optional(),
        constructionType: z.string().max(50).optional(),
        sprinklersRequired: z.boolean().optional(),
        part3Determination: z.string().max(20).optional(),
        codeEdition: z.string().max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return projectRepository.updateProject({
        userId: ctx.user.id,
        ...input,
      });
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return projectRepository.deleteProject(input.id, ctx.user.id);
    }),

  /**
   * Get project statistics
   */
  stats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return projectRepository.getProjectStats(input.id, ctx.user.id);
    }),
});
