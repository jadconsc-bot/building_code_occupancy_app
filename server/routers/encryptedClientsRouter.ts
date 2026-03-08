/**
 * Encrypted Clients Router
 * 
 * Provides tRPC procedures for client management with automatic field-level encryption
 * Encrypts: name, email, phone, address
 * All operations are transparent - encryption/decryption handled automatically
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { clients } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { createEncryptedRecord, decryptDatabaseRecord, ENCRYPTED_FIELDS_CONFIG } from '../encryptedFieldsHelper';
import { logger } from '../logger';

export const encryptedClientsRouter = router({
  /**
   * Create a new client with encrypted fields
   * Automatically encrypts: name, email, phone, address
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Prepare data with userId
        const clientData = {
          userId: ctx.user.id,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          address: input.address || null,
          city: input.city,
          province: input.province,
          postalCode: input.postalCode,
          companyName: input.companyName,
          industry: input.industry,
          notes: input.notes,
          status: 'active' as const,
        };

        // Encrypt sensitive fields
        const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
        const encryptedData = createEncryptedRecord(clientData, encryptedFields as any);

        // Insert encrypted data
        const result = await db.insert(clients).values(encryptedData as any);
        const resultObj = result as any;
        const clientId = resultObj?.insertId ?? resultObj?.[0]?.insertId;

        if (!clientId) {
          throw new Error('Failed to get client ID from insert result');
        }

        // Retrieve and decrypt the created client
        const created = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
        if (!created[0]) {
          throw new Error('Failed to retrieve created client');
        }

        // Decrypt before returning
        const decrypted = decryptDatabaseRecord(created[0], encryptedFields as any);
        
        logger.info('Client created with encryption', { 
          clientId, 
          userId: ctx.user.id,
          encryptedFields: encryptedFields.join(', ')
        });

        return decrypted;
      } catch (error) {
        logger.error('Failed to create encrypted client', { error, userId: ctx.user.id });
        throw error;
      }
    }),

  /**
   * Get all clients for the current user with decrypted fields
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) return [];

      const results = await db.select().from(clients).where(eq(clients.userId, ctx.user.id));
      
      // Decrypt all clients
      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const decrypted = results.map(client => 
        decryptDatabaseRecord(client, encryptedFields as any)
      );

      logger.info('Clients retrieved with decryption', { 
        userId: ctx.user.id, 
        count: decrypted.length 
      });

      return decrypted;
    } catch (error) {
      logger.error('Failed to list encrypted clients', { error, userId: ctx.user.id });
      throw error;
    }
  }),

  /**
   * Get a specific client with decrypted fields
   */
  get: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return null;

        const result = await db.select().from(clients)
          .where(eq(clients.id, input.clientId))
          .limit(1);

        if (!result[0]) {
          return null;
        }

        // Verify ownership
        if (result[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: Client does not belong to current user');
        }

        // Decrypt fields
        const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
        const decrypted = decryptDatabaseRecord(result[0], encryptedFields as any);

        logger.info('Client retrieved with decryption', { 
          clientId: input.clientId, 
          userId: ctx.user.id 
        });

        return decrypted;
      } catch (error) {
        logger.error('Failed to get encrypted client', { error, clientId: input.clientId });
        throw error;
      }
    }),

  /**
   * Update a client with encrypted fields
   */
  update: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(['active', 'inactive', 'archived']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const existing = await db.select().from(clients)
          .where(eq(clients.id, input.clientId))
          .limit(1);

        if (!existing[0]) {
          throw new Error('Client not found');
        }

        if (existing[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: Client does not belong to current user');
        }

        // Prepare update data
        const updateData = {
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          city: input.city,
          province: input.province,
          postalCode: input.postalCode,
          companyName: input.companyName,
          industry: input.industry,
          notes: input.notes,
          status: input.status,
        };

        // Remove undefined values
        const cleanData = Object.fromEntries(
          Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        // Encrypt sensitive fields in the update
        const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
        const encryptedData = createEncryptedRecord(cleanData, encryptedFields as any);

        // Update in database
        await db.update(clients)
          .set(encryptedData)
          .where(eq(clients.id, input.clientId));

        // Retrieve and decrypt updated client
        const updated = await db.select().from(clients)
          .where(eq(clients.id, input.clientId))
          .limit(1);

        if (!updated[0]) {
          throw new Error('Failed to retrieve updated client');
        }

        const decrypted = decryptDatabaseRecord(updated[0], encryptedFields as any);

        logger.info('Client updated with encryption', { 
          clientId: input.clientId, 
          userId: ctx.user.id,
          updatedFields: Object.keys(cleanData).join(', ')
        });

        return decrypted;
      } catch (error) {
        logger.error('Failed to update encrypted client', { error, clientId: input.clientId });
        throw error;
      }
    }),

  /**
   * Delete a client
   */
  delete: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const existing = await db.select().from(clients)
          .where(eq(clients.id, input.clientId))
          .limit(1);

        if (!existing[0]) {
          throw new Error('Client not found');
        }

        if (existing[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: Client does not belong to current user');
        }

        // Delete client
        await db.delete(clients).where(eq(clients.id, input.clientId));

        logger.info('Client deleted', { 
          clientId: input.clientId, 
          userId: ctx.user.id 
        });

        return { success: true };
      } catch (error) {
        logger.error('Failed to delete client', { error, clientId: input.clientId });
        throw error;
      }
    }),

  /**
   * Search clients by name (searches encrypted field)
   * Note: This searches the encrypted data, so exact matches only
   */
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        // Get all user's clients (encrypted)
        const results = await db.select().from(clients)
          .where(eq(clients.userId, ctx.user.id));

        // Decrypt and filter by name
        const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
        const decrypted = results.map(client => 
          decryptDatabaseRecord(client, encryptedFields as any)
        );

        const filtered = decrypted.filter(client =>
          client.name?.toLowerCase().includes(input.query.toLowerCase()) ||
          client.email?.toLowerCase().includes(input.query.toLowerCase()) ||
          client.companyName?.toLowerCase().includes(input.query.toLowerCase())
        );

        logger.info('Clients searched', { 
          userId: ctx.user.id, 
          query: input.query,
          resultsCount: filtered.length
        });

        return filtered;
      } catch (error) {
        logger.error('Failed to search encrypted clients', { error, query: input.query });
        throw error;
      }
    }),
});
