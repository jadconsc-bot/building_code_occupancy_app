/**
 * Encrypted Projects Router
 * 
 * Provides tRPC procedures for project management with automatic field-level encryption
 * Encrypts: name, address
 * All operations are transparent - encryption/decryption handled automatically
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { projects } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { createEncryptedRecord, decryptDatabaseRecord, ENCRYPTED_FIELDS_CONFIG } from '../encryptedFieldsHelper';
import { logger } from '../logger';

export const encryptedProjectsRouter = router({
  /**
   * Create a new project with encrypted fields
   * Automatically encrypts: name, address
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      address: z.string().optional(),
      occupancyCode: z.string().min(1),
      template: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(['active', 'completed', 'archived']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Prepare data with userId
        const projectData = {
          userId: ctx.user.id,
          name: input.name,
          address: input.address || null,
          occupancyCode: input.occupancyCode,
          template: input.template || null,
          notes: input.notes,
          status: input.status || 'active',
          overallProgress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Encrypt sensitive fields
        const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
        const encryptedData = createEncryptedRecord(projectData, encryptedFields as any);

        // Insert encrypted data
        const result = await db.insert(projects).values(encryptedData as any);
        const resultObj = result as any;
        const projectId = resultObj?.insertId ?? resultObj?.[0]?.insertId;

        if (!projectId) {
          throw new Error('Failed to get project ID from insert result');
        }

        // Retrieve and decrypt the created project
        const created = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
        if (!created[0]) {
          throw new Error('Failed to retrieve created project');
        }

        // Decrypt before returning
        const decrypted = decryptDatabaseRecord(created[0], encryptedFields as any);
        
        logger.info('Project created with encryption', { 
          projectId, 
          userId: ctx.user.id,
          encryptedFields: encryptedFields.join(', ')
        });

        return decrypted;
      } catch (error) {
        logger.error('Failed to create encrypted project', { error, userId: ctx.user.id });
        throw error;
      }
    }),

  /**
   * Get all projects for the current user with decrypted fields
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) return [];

      const results = await db.select().from(projects).where(eq(projects.userId, ctx.user.id));
      
      // Decrypt all projects
      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
      const decrypted = results.map(project => 
        decryptDatabaseRecord(project, encryptedFields as any)
      );

      logger.info('Projects retrieved with decryption', { 
        userId: ctx.user.id, 
        count: decrypted.length 
      });

      return decrypted;
    } catch (error) {
      logger.error('Failed to list encrypted projects', { error, userId: ctx.user.id });
      throw error;
    }
  }),

  /**
   * Get a specific project with decrypted fields
   */
  get: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return null;

        const result = await db.select().from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!result[0]) {
          return null;
        }

        // Verify ownership
        if (result[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: Project does not belong to current user');
        }

        // Decrypt fields
        const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
        const decrypted = decryptDatabaseRecord(result[0], encryptedFields as any);

        logger.info('Project retrieved with decryption', { 
          projectId: input.projectId, 
          userId: ctx.user.id 
        });

        return decrypted;
      } catch (error) {
        logger.error('Failed to get encrypted project', { error, projectId: input.projectId });
        throw error;
      }
    }),

  /**
   * Update a project with encrypted fields
   */
  update: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().optional(),
      address: z.string().optional(),
      occupancyCode: z.string().optional(),
      template: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(['active', 'completed', 'archived']).optional(),
      overallProgress: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const existing = await db.select().from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!existing[0]) {
          throw new Error('Project not found');
        }

        if (existing[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: Project does not belong to current user');
        }

        // Prepare update data
        const updateData = {
          name: input.name,
          address: input.address,
          occupancyCode: input.occupancyCode,
          template: input.template,
          notes: input.notes,
          status: input.status,
          overallProgress: input.overallProgress,
          updatedAt: new Date(),
        };

        // Remove undefined values
        const cleanData = Object.fromEntries(
          Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        // Encrypt sensitive fields in the update
        const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
        const encryptedData = createEncryptedRecord(cleanData, encryptedFields as any);

        // Update in database
        await db.update(projects)
          .set(encryptedData)
          .where(eq(projects.id, input.projectId));

        // Retrieve and decrypt updated project
        const updated = await db.select().from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!updated[0]) {
          throw new Error('Failed to retrieve updated project');
        }

        const decrypted = decryptDatabaseRecord(updated[0], encryptedFields as any);

        logger.info('Project updated with encryption', { 
          projectId: input.projectId, 
          userId: ctx.user.id,
          updatedFields: Object.keys(cleanData).join(', ')
        });

        return decrypted;
      } catch (error) {
        logger.error('Failed to update encrypted project', { error, projectId: input.projectId });
        throw error;
      }
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const existing = await db.select().from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!existing[0]) {
          throw new Error('Project not found');
        }

        if (existing[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: Project does not belong to current user');
        }

        // Delete project
        await db.delete(projects).where(eq(projects.id, input.projectId));

        logger.info('Project deleted', { 
          projectId: input.projectId, 
          userId: ctx.user.id 
        });

        return { success: true };
      } catch (error) {
        logger.error('Failed to delete project', { error, projectId: input.projectId });
        throw error;
      }
    }),

  /**
   * Search projects by name (searches encrypted field)
   * Note: This searches the encrypted data, so exact matches only
   */
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        // Get all user's projects (encrypted)
        const results = await db.select().from(projects)
          .where(eq(projects.userId, ctx.user.id));

        // Decrypt and filter by name
        const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
        const decrypted = results.map(project => 
          decryptDatabaseRecord(project, encryptedFields as any)
        );

        const filtered = decrypted.filter(project =>
          project.name?.toLowerCase().includes(input.query.toLowerCase()) ||
          project.notes?.toLowerCase().includes(input.query.toLowerCase())
        );

        logger.info('Projects searched', { 
          userId: ctx.user.id, 
          query: input.query,
          resultsCount: filtered.length
        });

        return filtered;
      } catch (error) {
        logger.error('Failed to search encrypted projects', { error, query: input.query });
        throw error;
      }
    }),
});
