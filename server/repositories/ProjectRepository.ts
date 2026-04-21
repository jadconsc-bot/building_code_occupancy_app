/**
 * Project Repository
 *
 * Encapsulates all database queries related to projects.
 * Provides a clean interface for project operations.
 */

import { getDb } from '../db';
import { projects, projectCalculatorResults, projectChecklistItems } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export interface CreateProjectInput {
  userId: number;
  name: string;
  description?: string;
  occupancyCode?: string;
  address?: string;
  template?: string;
  buildingType?: string;
  province?: string;
  climateZone?: string;
  seismicZone?: string;
  stepCodeTier?: string;
  jurisdictionDetected?: boolean;
  projectCode?: string;
}

export interface UpdateProjectInput {
  id: number;
  userId: number;
  name?: string;
  description?: string;
  occupancyCode?: string;
  address?: string;
  template?: string;
  buildingType?: string;
  province?: string;
  climateZone?: string;
  seismicZone?: string;
  stepCodeTier?: string;
  jurisdictionDetected?: boolean;
  projectCode?: string;
}

export class ProjectRepository {
  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      return await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.updatedAt));
    } catch (error) {
      console.error('[ProjectRepository] Failed to fetch user projects:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch projects',
      });
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: number, userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .limit(1);

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return project;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[ProjectRepository] Failed to fetch project:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch project',
      });
    }
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Count existing user projects to generate a sequential number
      const existingProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.userId, input.userId));
      const seq = existingProjects.length + 1;
      const year = new Date().getFullYear();
      const projectNumber = `CC-${year}-${String(seq).padStart(3, '0')}`;

      await db.insert(projects).values({
        userId: input.userId,
        name: input.name,
        occupancyCode: input.occupancyCode || 'A-1',
        notes: input.description || null,
        address: input.address || null,
        template: input.template || null,
        buildingType: input.buildingType || null,
        province: input.province || null,
        climateZone: input.climateZone || null,
        seismicZone: input.seismicZone || null,
        stepCodeTier: input.stepCodeTier || null,
        jurisdictionDetected: input.jurisdictionDetected ?? false,
        projectCode: input.projectCode || null,
        projectNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const [created] = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, input.userId))
        .orderBy(desc(projects.createdAt))
        .limit(1);

      return created;
    } catch (error) {
      console.error('[ProjectRepository] Failed to create project:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create project',
      });
    }
  }

  /**
   * Update a project
   */
  async updateProject(input: UpdateProjectInput) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      await this.getProject(input.id, input.userId);

      const updateData: Record<string, any> = { updatedAt: new Date() };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.notes = input.description;
      if (input.occupancyCode !== undefined) updateData.occupancyCode = input.occupancyCode;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.template !== undefined) updateData.template = input.template;
      if (input.buildingType !== undefined) updateData.buildingType = input.buildingType;
      if (input.province !== undefined) updateData.province = input.province;
      if (input.climateZone !== undefined) updateData.climateZone = input.climateZone;
      if (input.seismicZone !== undefined) updateData.seismicZone = input.seismicZone;
      if (input.stepCodeTier !== undefined) updateData.stepCodeTier = input.stepCodeTier;
      if (input.jurisdictionDetected !== undefined) updateData.jurisdictionDetected = input.jurisdictionDetected;
      if (input.projectCode !== undefined) updateData.projectCode = input.projectCode;

      await db
        .update(projects)
        .set(updateData)
        .where(and(eq(projects.id, input.id), eq(projects.userId, input.userId)));

      const [result] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.id))
        .limit(1);

      return result;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[ProjectRepository] Failed to update project:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update project',
      });
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: number, userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      await this.getProject(id, userId);

      await db.delete(projectCalculatorResults).where(eq(projectCalculatorResults.projectId, id));
      await db.delete(projectChecklistItems).where(eq(projectChecklistItems.projectId, id));
      await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[ProjectRepository] Failed to delete project:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete project',
      });
    }
  }

  /**
   * Get calculation results for a project
   */
  async getProjectCalculations(projectId: number, userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      await this.getProject(projectId, userId);

      return await db
        .select()
        .from(projectCalculatorResults)
        .where(eq(projectCalculatorResults.projectId, projectId))
        .orderBy(desc(projectCalculatorResults.createdAt));
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[ProjectRepository] Failed to get project calculations:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get project calculations',
      });
    }
  }

  async getProjectStats(id: number, userId: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      await this.getProject(id, userId);

      const results = await db
        .select()
        .from(projectCalculatorResults)
        .where(eq(projectCalculatorResults.projectId, id));

      const checklistItems = await db
        .select()
        .from(projectChecklistItems)
        .where(eq(projectChecklistItems.projectId, id));

      const completedItems = checklistItems.filter(item => item.isCompleted === 1).length;

      return {
        totalResults: results.length,
        totalChecklistItems: checklistItems.length,
        completedChecklistItems: completedItems,
        completionPercentage: checklistItems.length > 0
          ? Math.round((completedItems / checklistItems.length) * 100)
          : 0,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[ProjectRepository] Failed to get project stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get project statistics',
      });
    }
  }
}

export const projectRepository = new ProjectRepository();
