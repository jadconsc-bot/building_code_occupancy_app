/**
 * Project Router
 * 
 * tRPC procedures for project management.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { projectRepository } from '../repositories/ProjectRepository';
import { quotaMiddleware } from '../_core/middleware';

export const projectRouter = router({
  /**
   * Get all projects for current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    console.log('[projectRouter.list] Fetching projects for user:', ctx.user.id);
    const projects = await projectRepository.getUserProjects(ctx.user.id);
    console.log('[projectRouter.list] Found projects:', projects.length, 'projects');
    return projects;
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
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        occupancyCode: z.string().optional(),
        buildingType: z.string().optional(),
      })
    )
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
        name: z.string().optional(),
        description: z.string().optional(),
        occupancyCode: z.string().optional(),
        buildingType: z.string().optional(),
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
