/**
 * Project Router
 *
 * tRPC procedures for project management.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { projectRepository } from '../repositories/ProjectRepository';
import { geocodeAddress as geocodeAddressService } from '../services/geocodingService';
import { getDb } from '../db';
import { projects } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { editionForProvince } from '../rules/overlays/index';

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
        stackSeparationsJson: z.array(z.object({
          from: z.string(),
          to: z.string(),
          frr: z.string(),
          hours: z.number(),
          nbcRef: z.string(),
        })).optional(),
        stackWingsJson: z.array(z.object({
          id: z.string(),
          label: z.string(),
          floors: z.array(z.object({
            zones: z.array(z.object({
              code: z.string(),
              area_m2: z.number(),
            })),
          })),
        })).optional(),
        stackConfirmedAt: z.date().optional(),
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

  /**
   * Geocode a Canadian address and optionally persist results to a project.
   */
  geocodeAddress: protectedProcedure
    .input(z.object({
      address: z.string().min(5).max(500),
      projectId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await geocodeAddressService(input.address);

      if (input.projectId && 'latitude' in result) {
        const db = await getDb();
        if (db) {
          const [project] = await db
            .select({ id: projects.id })
            .from(projects)
            .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));

          if (project) {
            await db.update(projects).set({
              address: result.address,
              parcelLat: result.latitude.toString(),
              parcelLng: result.longitude.toString(),
              province: result.province,
              municipality: result.municipality,
              jurisdictionSource: 'geocoded',
              geocodedAt: new Date(),
            }).where(eq(projects.id, input.projectId));
          }
        }
      }

      return result;
    }),

  /**
   * Get the resolved jurisdiction for a project (geocoded or manual).
   */
  getProjectJurisdiction: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const [project] = await db
        .select({
          address: projects.address,
          latitude: projects.parcelLat,
          longitude: projects.parcelLng,
          province: projects.province,
          municipality: projects.municipality,
          jurisdictionSource: projects.jurisdictionSource,
          geocodedAt: projects.geocodedAt,
        })
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)));

      if (!project) return null;

      return {
        ...project,
        codeEdition: editionForProvince(project.province ?? ''),
      };
    }),
});
