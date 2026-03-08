/**
 * Encrypted Database Queries
 * 
 * Provides transparent encryption/decryption for database operations
 * Automatically encrypts fields on insert/update and decrypts on select
 */

import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, clients, projects, complianceSnapshots } from '../drizzle/schema';
import { decryptDatabaseRecord, decryptRecords, createEncryptedRecord, ENCRYPTED_FIELDS_CONFIG } from './encryptedFieldsHelper';
import { logger } from './logger';

/**
 * Get a user by ID with decrypted fields
 */
export async function getUserDecrypted(userId: number) {
  try {
    if (!db) throw new Error('Database not available');
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (result.length === 0) return null;
    
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.users.fields];
    return decryptDatabaseRecord(result[0], encryptedFields as any);
  } catch (error) {
    logger.error('Failed to get user', { userId, error });
    throw error;
  }
}

/**
 * Get all users with decrypted fields
 */
export async function getAllUsersDecrypted() {
  try {
    if (!db) throw new Error('Database not available');
    const results = await db.select().from(users);
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.users.fields];
    return decryptRecords(results, encryptedFields as any);
  } catch (error) {
    logger.error('Failed to get all users', { error });
    throw error;
  }
}

/**
 * Create a user with encrypted fields
 */
export async function createUserEncrypted(userData: typeof users.$inferInsert) {
  try {
    if (!db) throw new Error('Database not available');
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.users.fields];
    const encrypted = createEncryptedRecord(userData, encryptedFields as any);
    
    await db.insert(users).values(encrypted as any);
    return encrypted;
  } catch (error) {
    logger.error('Failed to create user', { error });
    throw error;
  }
}

/**
 * Get a client by ID with decrypted fields
 */
export async function getClientDecrypted(clientId: number) {
  try {
    if (!db) throw new Error('Database not available');
    const result = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (result.length === 0) return null;
    
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
    return decryptDatabaseRecord(result[0], encryptedFields as any);
  } catch (error) {
    logger.error('Failed to get client', { clientId, error });
    throw error;
  }
}

/**
 * Get all clients for a user with decrypted fields
 */
export async function getClientsByUserDecrypted(userId: number) {
  try {
    if (!db) throw new Error('Database not available');
    const results = await db.select().from(clients).where(eq(clients.userId, userId));
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
    return decryptRecords(results, encryptedFields as any);
  } catch (error) {
    logger.error('Failed to get clients for user', { userId, error });
    throw error;
  }
}

/**
 * Create a client with encrypted fields
 */
export async function createClientEncrypted(clientData: typeof clients.$inferInsert) {
  try {
    if (!db) throw new Error('Database not available');
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
    const encrypted = createEncryptedRecord(clientData, encryptedFields as any);
    
    await db.insert(clients).values(encrypted as any);
    return encrypted;
  } catch (error) {
    logger.error('Failed to create client', { error });
    throw error;
  }
}

/**
 * Get a project by ID with decrypted fields
 */
export async function getProjectDecrypted(projectId: number) {
  try {
    if (!db) throw new Error('Database not available');
    const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (result.length === 0) return null;
    
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
    return decryptDatabaseRecord(result[0], encryptedFields as any);
  } catch (error) {
    logger.error('Failed to get project', { projectId, error });
    throw error;
  }
}

/**
 * Get all projects for a user with decrypted fields
 */
export async function getProjectsByUserDecrypted(userId: number) {
  try {
    if (!db) throw new Error('Database not available');
    const results = await db.select().from(projects).where(eq(projects.userId, userId));
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
    return decryptRecords(results, encryptedFields as any);
  } catch (error) {
    logger.error('Failed to get projects for user', { userId, error });
    throw error;
  }
}

/**
 * Create a project with encrypted fields
 */
export async function createProjectEncrypted(projectData: typeof projects.$inferInsert) {
  try {
    if (!db) throw new Error('Database not available');
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
    const encrypted = createEncryptedRecord(projectData, encryptedFields as any);
    
    await db.insert(projects).values(encrypted as any);
    return encrypted;
  } catch (error) {
    logger.error('Failed to create project', { error });
    throw error;
  }
}

/**
 * Get compliance snapshots with decrypted fields
 */
export async function getComplianceSnapshotsDecrypted(projectId: number) {
  try {
    if (!db) throw new Error('Database not available');
    const results = await db.select().from(complianceSnapshots).where(eq(complianceSnapshots.projectId, projectId));
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.complianceSnapshots.fields];
    return decryptRecords(results, encryptedFields as any);
  } catch (error) {
    logger.error('Failed to get compliance snapshots', { projectId, error });
    throw error;
  }
}

/**
 * Create a compliance snapshot with encrypted fields
 */
export async function createComplianceSnapshotEncrypted(snapshotData: typeof complianceSnapshots.$inferInsert) {
  try {
    if (!db) throw new Error('Database not available');
    const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.complianceSnapshots.fields];
    const encrypted = createEncryptedRecord(snapshotData, encryptedFields as any);
    
    await db.insert(complianceSnapshots).values(encrypted as any);
    return encrypted;
  } catch (error) {
    logger.error('Failed to create compliance snapshot', { error });
    throw error;
  }
}
