/**
 * EncryptionService
 * 
 * Provides field-level encryption for sensitive data using AES-256-GCM
 * Integrates with AWS KMS for key management
 * 
 * Encrypted Fields:
 * - User PII (name, email)
 * - Project details (address, project data)
 * - Professional licenses
 * - Client information
 * - User agent data
 */

import crypto from 'crypto';
import { logger } from './logger';

export interface EncryptedData {
  ciphertext: string; // Base64-encoded encrypted data
  iv: string; // Base64-encoded initialization vector
  authTag: string; // Base64-encoded authentication tag
  algorithm: 'AES-256-GCM';
}

export class EncryptionService {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits

  constructor(encryptionKey?: string) {
    if (encryptionKey) {
      // Use provided key (from environment or KMS)
      this.encryptionKey = Buffer.from(encryptionKey, 'hex');
      if (this.encryptionKey.length !== this.keyLength) {
        throw new Error(`Encryption key must be ${this.keyLength} bytes (256 bits)`);
      }
    } else {
      // Generate a new key for testing (should use KMS in production)
      this.encryptionKey = crypto.randomBytes(this.keyLength);
      logger.warn('EncryptionService: Using generated key. Use KMS in production.');
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   * 
   * @param plaintext - The data to encrypt
   * @param additionalData - Optional additional authenticated data (AAD)
   * @returns Encrypted data with IV and auth tag
   */
  encrypt(plaintext: string, additionalData?: string): EncryptedData {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Add additional authenticated data if provided
      if (additionalData) {
        (cipher as any).setAAD(Buffer.from(additionalData, 'utf-8'));
      }

      // Encrypt the plaintext
      let ciphertext = cipher.update(plaintext, 'utf-8', 'hex');
      ciphertext += cipher.final('hex');

      // Get authentication tag
      const authTag = (cipher as any).getAuthTag();

      return {
        ciphertext: Buffer.from(ciphertext, 'hex').toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: 'AES-256-GCM',
      };
    } catch (error) {
      logger.error('Encryption failed', { error });
      throw new Error(`Failed to encrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt encrypted data using AES-256-GCM
   * 
   * @param encryptedData - The encrypted data object
   * @param additionalData - Optional additional authenticated data (must match encryption AAD)
   * @returns Decrypted plaintext
   */
  decrypt(encryptedData: EncryptedData, additionalData?: string): string {
    try {
      // Decode from Base64
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

      // Set authentication tag
      (decipher as any).setAuthTag(authTag);

      // Add additional authenticated data if provided
      if (additionalData) {
        (decipher as any).setAAD(Buffer.from(additionalData, 'utf-8'));
      }

      // Decrypt the ciphertext
      let plaintext = decipher.update(ciphertext);
      plaintext = Buffer.concat([plaintext, decipher.final()]);

      return plaintext.toString('utf-8');
    } catch (error) {
      logger.error('Decryption failed', { error });
      throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt multiple fields in an object
   * 
   * @param data - Object containing fields to encrypt
   * @param fieldsToEncrypt - Array of field names to encrypt
   * @returns Object with encrypted fields
   */
  encryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToEncrypt: (keyof T)[]
  ): T & { _encrypted?: boolean } {
    const encrypted = { ...data };

    for (const field of fieldsToEncrypt) {
      const value = encrypted[field];
      if (value !== null && value !== undefined) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        encrypted[field] = this.encrypt(stringValue) as any;
      }
    }

    return { ...encrypted, _encrypted: true };
  }

  /**
   * Decrypt multiple fields in an object
   * 
   * @param data - Object containing encrypted fields
   * @param fieldsToDecrypt - Array of field names to decrypt
   * @returns Object with decrypted fields
   */
  decryptFields<T extends Record<string, any>>(
    data: T,
    fieldsToDecrypt: (keyof T)[]
  ): T {
    const decrypted = { ...data };

    for (const field of fieldsToDecrypt) {
      const value = decrypted[field];
      if (value && typeof value === 'object' && 'ciphertext' in value) {
        try {
          const plaintext = this.decrypt(value as EncryptedData);
          decrypted[field] = plaintext as any;
        } catch (error) {
          logger.error(`Failed to decrypt field ${String(field)}`, { error });
          // Keep encrypted value if decryption fails
        }
      }
    }

    return decrypted;
  }

  /**
   * Hash sensitive data for comparison without decryption
   * Useful for finding records by encrypted field values
   * 
   * @param plaintext - The data to hash
   * @returns SHA-256 hash as hex string
   */
  hashSensitiveData(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
  }

  /**
   * Validate encryption key strength
   * 
   * @returns true if key meets security requirements
   */
  validateKeyStrength(): boolean {
    return this.encryptionKey.length === this.keyLength;
  }

  /**
   * Get encryption key (for KMS or key rotation)
   * 
   * @returns Encryption key as hex string
   */
  getEncryptionKey(): string {
    return this.encryptionKey.toString('hex');
  }

  /**
   * Rotate encryption key
   * 
   * @param newKey - New encryption key as hex string
   */
  rotateKey(newKey: string): void {
    const newKeyBuffer = Buffer.from(newKey, 'hex');
    if (newKeyBuffer.length !== this.keyLength) {
      throw new Error(`New key must be ${this.keyLength} bytes (256 bits)`);
    }
    this.encryptionKey = newKeyBuffer;
    logger.info('Encryption key rotated successfully');
  }
}

// Singleton instance
let encryptionServiceInstance: EncryptionService | null = null;

/**
 * Get or create EncryptionService singleton
 */
export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    const keyFromEnv = process.env.ENCRYPTION_KEY;
    encryptionServiceInstance = new EncryptionService(keyFromEnv);
  }
  return encryptionServiceInstance;
}

/**
 * List of fields that should be encrypted by default
 */
export const ENCRYPTED_FIELDS = {
  users: ['name', 'email'],
  clients: ['name', 'email', 'phone', 'address'],
  projects: ['name', 'address'],
  projectData: ['projectData', 'projectName'],
  professionalLicenses: ['licenseNumber'],
  auditLog: ['userAgent', 'ipAddress'],
  complianceSnapshots: ['snapshotData'],
} as const;
