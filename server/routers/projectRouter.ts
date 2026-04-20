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
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      occupancyCode: z.string().optional(),
      address: z.string().optional(),
      template: z.string().optional(),
      buildingType: z.string().optional(),
      province: z.string().max(5).optional(),
      climateZone: z.string().max(10).optional(),
      seismicZone: z.string().max(20).optional(),
      stepCodeTier: z.string().max(5).optional(),
      jurisdictionDetected: z.boolean().optional(),
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
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        occupancyCode: z.string().optional(),
        address: z.string().optional(),
        template: z.string().optional(),
        buildingType: z.string().optional(),
        province: z.string().max(5).optional(),
        climateZone: z.string().max(10).optional(),
        seismicZone: z.string().max(20).optional(),
        stepCodeTier: z.string().max(5).optional(),
        jurisdictionDetected: z.boolean().optional(),
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
