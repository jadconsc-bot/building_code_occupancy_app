/**
 * Encrypted Fields Helper
 * 
 * Provides utilities for transparent encryption/decryption of database fields
 * Integrates with EncryptionService for AES-256-GCM encryption
 */

import { getEncryptionService, EncryptedData } from './encryptionService';
import { logger } from './logger';

/**
 * Encrypt a single field value
 */
export function encryptField(value: string | null | undefined, fieldName?: string): EncryptedData | null {
  if (!value) return null;

  try {
    const encryptionService = getEncryptionService();
    return encryptionService.encrypt(value, fieldName);
  } catch (error) {
    logger.error(`Failed to encrypt field ${fieldName}`, { error });
    throw error;
  }
}

/**
 * Decrypt a single field value
 */
export function decryptField(encryptedData: EncryptedData | null | undefined, fieldName?: string): string | null {
  if (!encryptedData) return null;

  try {
    const encryptionService = getEncryptionService();
    return encryptionService.decrypt(encryptedData, fieldName);
  } catch (error) {
    logger.error(`Failed to decrypt field ${fieldName}`, { error });
    return null; // Return null if decryption fails to prevent crashes
  }
}

/**
 * Encrypt multiple fields in a database record
 */
export function encryptRecord<T extends Record<string, any>>(
  record: T,
  fieldsToEncrypt: (keyof T)[]
): Partial<T> {
  const encrypted: Partial<T> = {};

  for (const field of fieldsToEncrypt) {
    const value = record[field];
    if (value !== null && value !== undefined) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      encrypted[field] = encryptField(stringValue, String(field)) as any;
    }
  }

  return encrypted;
}

/**
 * Decrypt multiple fields in a database record
 */
export function decryptRecord<T extends Record<string, any>>(
  record: T,
  fieldsToDecrypt: (keyof T)[]
): Partial<T> {
  const decrypted: Partial<T> = {};

  for (const field of fieldsToDecrypt) {
    const value = record[field];
    if (value && typeof value === 'object' && 'ciphertext' in value) {
      const plaintext = decryptField(value as EncryptedData, String(field));
      if (plaintext) {
        decrypted[field] = plaintext as any;
      }
    }
  }

  return decrypted;
}

/**
 * Create a database record with encrypted fields
 * 
 * Usage:
 * const user = {
 *   id: 1,
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'user'
 * };
 * 
 * const recordToInsert = createEncryptedRecord(user, ['name', 'email']);
 * // Returns: { id: 1, name: { ciphertext: '...', iv: '...', authTag: '...' }, email: { ... }, role: 'user' }
 */
export function createEncryptedRecord<T extends Record<string, any>>(
  record: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...record };

  for (const field of fieldsToEncrypt) {
    const value = record[field];
    if (value !== null && value !== undefined) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      encrypted[field] = encryptField(stringValue, String(field)) as any;
    }
  }

  return encrypted;
}

/**
 * Read a database record and decrypt fields
 * 
 * Usage:
 * const user = await db.select().from(users).where(eq(users.id, 1));
 * const decrypted = decryptDatabaseRecord(user[0], ['name', 'email']);
 * // Returns: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' }
 */
export function decryptDatabaseRecord<T extends Record<string, any>>(
  record: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...record };

  for (const field of fieldsToDecrypt) {
    const value = record[field];
    if (value && typeof value === 'object' && 'ciphertext' in value) {
      const plaintext = decryptField(value as EncryptedData, String(field));
      if (plaintext) {
        decrypted[field] = plaintext as any;
      }
    }
  }

  return decrypted;
}

/**
 * Batch decrypt multiple records
 */
export function decryptRecords<T extends Record<string, any>>(
  records: T[],
  fieldsToDecrypt: (keyof T)[]
): T[] {
  return records.map(record => decryptDatabaseRecord(record, fieldsToDecrypt));
}

/**
 * Hash a sensitive field for searching without decryption
 * 
 * Usage:
 * const emailHash = hashSensitiveField('user@example.com');
 * // Can be used to find users by email without storing plaintext
 */
export function hashSensitiveField(value: string): string {
  const encryptionService = getEncryptionService();
  return encryptionService.hashSensitiveData(value);
}

/**
 * Configuration for encrypted fields by table
 */
export const ENCRYPTED_FIELDS_CONFIG = {
  users: {
    table: 'users',
    fields: ['name', 'email'] as const,
  },
  clients: {
    table: 'clients',
    fields: ['name', 'email', 'phone', 'address'] as const,
  },
  projects: {
    table: 'projects',
    fields: ['name', 'address'] as const,
  },
  projectCalculatorResults: {
    table: 'projectCalculatorResults',
    fields: ['resultData'] as const,
  },
  complianceSnapshots: {
    table: 'complianceSnapshots',
    fields: ['projectName', 'projectData'] as const,
  },
  professionalLicenses: {
    table: 'professionalLicenses',
    fields: ['licenseNumber'] as const,
  },
  auditLog: {
    table: 'auditLog',
    fields: ['userAgent', 'ipAddress'] as const,
  },
} as const;

/**
 * Get encrypted fields for a table
 */
export function getEncryptedFieldsForTable(tableName: string): string[] {
  const config = (ENCRYPTED_FIELDS_CONFIG as any)[tableName];
  return config ? [...config.fields] : [];
}
