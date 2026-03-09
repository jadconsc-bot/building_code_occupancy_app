import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { EncryptionService } from '../_core/encryption/EncryptionService';
import { EncryptedFieldsHelper, ENCRYPTED_FIELDS_CONFIG } from '../_core/encryption/EncryptedFieldsHelper';
import { decryptDatabaseRecord, decryptRecords, createEncryptedRecord } from '../encryptedFieldsHelper';
import crypto from 'crypto';

// Skip encryption tests in MVP - will be fully tested in Phase 2
const skipEncryptionTests = process.env.VERIFY_CERTIFICATES === 'false';

describe('EncryptionService', () => {
  // Skip in MVP (VERIFY_CERTIFICATES=false), will be fully tested in Phase 2
  const skipTests = skipEncryptionTests;
  const describeTest = skipTests ? describe.skip : describe;
  let encryptionService: EncryptionService;
  const testData = 'sensitive-data-12345';
  const testAad = 'additional-authenticated-data';

  beforeAll(() => {
    encryptionService = new EncryptionService();
  });

  describe('Key Management', () => {
    it('should generate a valid encryption key', () => {
      const key = encryptionService.generateKey();
      expect(key).toBeDefined();
      expect(key.length).toBe(32); // 256 bits = 32 bytes
    });

    it('should derive a key from a password', () => {
      const password = 'test-password-123';
      const salt = crypto.randomBytes(16);
      const key = encryptionService.deriveKeyFromPassword(password, salt);
      
      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });

    it('should derive consistent keys from same password and salt', () => {
      const password = 'test-password-123';
      const salt = crypto.randomBytes(16);
      
      const key1 = encryptionService.deriveKeyFromPassword(password, salt);
      const key2 = encryptionService.deriveKeyFromPassword(password, salt);
      
      expect(key1.toString('hex')).toBe(key2.toString('hex'));
    });

    it('should derive different keys from different passwords', () => {
      const salt = crypto.randomBytes(16);
      const key1 = encryptionService.deriveKeyFromPassword('password1', salt);
      const key2 = encryptionService.deriveKeyFromPassword('password2', salt);
      
      expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt data successfully', () => {
      const key = encryptionService.generateKey();
      const encrypted = encryptionService.encrypt(testData, key);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      
      const decrypted = encryptionService.decrypt(encrypted, key);
      expect(decrypted).toBe(testData);
    });

    it('should encrypt and decrypt with AAD (Additional Authenticated Data)', () => {
      const key = encryptionService.generateKey();
      const encrypted = encryptionService.encrypt(testData, key, testAad);
      
      const decrypted = encryptionService.decrypt(encrypted, key, testAad);
      expect(decrypted).toBe(testData);
    });

    it('should fail to decrypt with wrong key', () => {
      const key1 = encryptionService.generateKey();
      const key2 = encryptionService.generateKey();
      const encrypted = encryptionService.encrypt(testData, key1);
      
      expect(() => {
        encryptionService.decrypt(encrypted, key2);
      }).toThrow();
    });

    it('should fail to decrypt with wrong AAD', () => {
      const key = encryptionService.generateKey();
      const encrypted = encryptionService.encrypt(testData, key, testAad);
      
      expect(() => {
        encryptionService.decrypt(encrypted, key, 'wrong-aad');
      }).toThrow();
    });

    it('should produce different ciphertexts for same plaintext (due to random IV)', () => {
      const key = encryptionService.generateKey();
      const encrypted1 = encryptionService.encrypt(testData, key);
      const encrypted2 = encryptionService.encrypt(testData, key);
      
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should handle empty strings', () => {
      const key = encryptionService.generateKey();
      const encrypted = encryptionService.encrypt('', key);
      const decrypted = encryptionService.decrypt(encrypted, key);
      
      expect(decrypted).toBe('');
    });

    it('should handle long strings', () => {
      const key = encryptionService.generateKey();
      const longData = 'x'.repeat(10000);
      const encrypted = encryptionService.encrypt(longData, key);
      const decrypted = encryptionService.decrypt(encrypted, key);
      
      expect(decrypted).toBe(longData);
    });

    it('should handle special characters and unicode', () => {
      const key = encryptionService.generateKey();
      const specialData = '你好世界 🌍 !@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encryptionService.encrypt(specialData, key);
      const decrypted = encryptionService.decrypt(encrypted, key);
      
      expect(decrypted).toBe(specialData);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize encrypted data', () => {
      const key = encryptionService.generateKey();
      const encrypted = encryptionService.encrypt(testData, key);
      
      const serialized = encryptionService.serializeEncrypted(encrypted);
      expect(typeof serialized).toBe('string');
      
      const deserialized = encryptionService.deserializeEncrypted(serialized);
      expect(deserialized.ciphertext).toBe(encrypted.ciphertext);
      expect(deserialized.iv).toBe(encrypted.iv);
      expect(deserialized.authTag).toBe(encrypted.authTag);
    });

    it('should handle base64 encoding/decoding', () => {
      const key = encryptionService.generateKey();
      const encrypted = encryptionService.encrypt(testData, key);
      
      const base64 = encryptionService.toBase64(encrypted);
      expect(typeof base64).toBe('string');
      
      const fromBase64 = encryptionService.fromBase64(base64);
      const decrypted = encryptionService.decrypt(fromBase64, key);
      expect(decrypted).toBe(testData);
    });
  });
});

describe('EncryptedFieldsHelper', () => {
  let encryptionService: EncryptionService;
  const testKey = crypto.randomBytes(32);

  beforeAll(() => {
    encryptionService = new EncryptionService();
  });

  describe('Field Configuration', () => {
    it('should have users configuration', () => {
      expect(ENCRYPTED_FIELDS_CONFIG.users).toBeDefined();
      expect(ENCRYPTED_FIELDS_CONFIG.users.fields).toContain('name');
      expect(ENCRYPTED_FIELDS_CONFIG.users.fields).toContain('email');
    });

    it('should have clients configuration', () => {
      expect(ENCRYPTED_FIELDS_CONFIG.clients).toBeDefined();
      expect(ENCRYPTED_FIELDS_CONFIG.clients.fields).toContain('name');
      expect(ENCRYPTED_FIELDS_CONFIG.clients.fields).toContain('email');
      expect(ENCRYPTED_FIELDS_CONFIG.clients.fields).toContain('phone');
      expect(ENCRYPTED_FIELDS_CONFIG.clients.fields).toContain('address');
    });

    it('should have projects configuration', () => {
      expect(ENCRYPTED_FIELDS_CONFIG.projects).toBeDefined();
      expect(ENCRYPTED_FIELDS_CONFIG.projects.fields).toContain('projectName');
      expect(ENCRYPTED_FIELDS_CONFIG.projects.fields).toContain('projectData');
    });

    it('should have complianceSnapshots configuration', () => {
      expect(ENCRYPTED_FIELDS_CONFIG.complianceSnapshots).toBeDefined();
      expect(ENCRYPTED_FIELDS_CONFIG.complianceSnapshots.fields).toContain('snapshotData');
    });
  });

  describe('Record Encryption/Decryption', () => {
    it('should encrypt specified fields in a record', () => {
      const record = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      };

      const encrypted = createEncryptedRecord(record, ['name', 'email']);
      
      expect(encrypted.id).toBe(record.id);
      expect(encrypted.name).not.toBe(record.name);
      expect(encrypted.email).not.toBe(record.email);
      expect(encrypted.createdAt).toEqual(record.createdAt);
    });

    it('should decrypt specified fields in a record', () => {
      const originalRecord = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      };

      const encrypted = createEncryptedRecord(originalRecord, ['name', 'email']);
      const decrypted = decryptDatabaseRecord(encrypted, ['name', 'email']);
      
      expect(decrypted.id).toBe(originalRecord.id);
      expect(decrypted.name).toBe(originalRecord.name);
      expect(decrypted.email).toBe(originalRecord.email);
      expect(decrypted.createdAt).toEqual(originalRecord.createdAt);
    });

    it('should handle records with null values', () => {
      const record = {
        id: 1,
        name: 'John Doe',
        email: null,
        phone: undefined,
      };

      const encrypted = createEncryptedRecord(record, ['name', 'email', 'phone']);
      const decrypted = decryptDatabaseRecord(encrypted, ['name', 'email', 'phone']);
      
      expect(decrypted.name).toBe(record.name);
      expect(decrypted.email).toBeNull();
      expect(decrypted.phone).toBeUndefined();
    });

    it('should handle arrays of records', () => {
      const records = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
      ];

      const encrypted = records.map(r => createEncryptedRecord(r, ['name', 'email']));
      const decrypted = decryptRecords(encrypted, ['name', 'email']);
      
      expect(decrypted).toHaveLength(3);
      expect(decrypted[0].name).toBe(records[0].name);
      expect(decrypted[1].email).toBe(records[1].email);
      expect(decrypted[2].name).toBe(records[2].name);
    });
  });

  describe('Field Validation', () => {
    it('should validate that encrypted fields are strings', () => {
      const record = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      const encrypted = createEncryptedRecord(record, ['name', 'email']);
      
      expect(typeof encrypted.name).toBe('string');
      expect(typeof encrypted.email).toBe('string');
    });

    it('should preserve non-encrypted fields as-is', () => {
      const record = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
        createdAt: new Date(),
      };

      const encrypted = createEncryptedRecord(record, ['name', 'email']);
      
      expect(encrypted.id).toBe(record.id);
      expect(encrypted.age).toBe(record.age);
      expect(encrypted.active).toBe(record.active);
      expect(encrypted.createdAt).toEqual(record.createdAt);
    });
  });

  describe('Complex Data Types', () => {
    it('should handle JSON objects in encrypted fields', () => {
      const record = {
        id: 1,
        projectData: JSON.stringify({ 
          type: 'residential',
          floors: 3,
          squareFeet: 5000 
        }),
      };

      const encrypted = createEncryptedRecord(record, ['projectData']);
      const decrypted = decryptDatabaseRecord(encrypted, ['projectData']);
      
      expect(decrypted.projectData).toBe(record.projectData);
      const parsed = JSON.parse(decrypted.projectData);
      expect(parsed.type).toBe('residential');
      expect(parsed.floors).toBe(3);
    });

    it('should handle dates in encrypted fields', () => {
      const now = new Date();
      const record = {
        id: 1,
        dateField: now.toISOString(),
      };

      const encrypted = createEncryptedRecord(record, ['dateField']);
      const decrypted = decryptDatabaseRecord(encrypted, ['dateField']);
      
      expect(decrypted.dateField).toBe(record.dateField);
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt 100 records efficiently', () => {
      const records = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const start = Date.now();
      const encrypted = records.map(r => createEncryptedRecord(r, ['name', 'email']));
      const encryptTime = Date.now() - start;

      const decryptStart = Date.now();
      const decrypted = decryptRecords(encrypted, ['name', 'email']);
      const decryptTime = Date.now() - decryptStart;

      expect(decrypted).toHaveLength(100);
      expect(encryptTime).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(decryptTime).toBeLessThan(5000);
    });
  });
});

describe('Integration: Encryption with Database Queries', () => {
  it('should demonstrate end-to-end encryption workflow', () => {
    // Simulate creating a user with encrypted fields
    const userData = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
    };

    // Encrypt before storing
    const encryptedUser = createEncryptedRecord(userData, ['name', 'email']);
    
    // Verify encrypted data is different
    expect(encryptedUser.name).not.toBe(userData.name);
    expect(encryptedUser.email).not.toBe(userData.email);

    // Decrypt when retrieving
    const decryptedUser = decryptDatabaseRecord(encryptedUser, ['name', 'email']);
    
    // Verify decrypted data matches original
    expect(decryptedUser.name).toBe(userData.name);
    expect(decryptedUser.email).toBe(userData.email);
    expect(decryptedUser.id).toBe(userData.id);
  });

  it('should handle multiple records with different encryption states', () => {
    const users = [
      { id: 1, name: 'User 1', email: 'user1@example.com' },
      { id: 2, name: 'User 2', email: 'user2@example.com' },
    ];

    // Encrypt all users
    const encrypted = users.map(u => createEncryptedRecord(u, ['name', 'email']));
    
    // Simulate partial retrieval and decryption
    const decrypted = decryptRecords(encrypted, ['name', 'email']);
    
    expect(decrypted[0].name).toBe(users[0].name);
    expect(decrypted[1].email).toBe(users[1].email);
  });
});
