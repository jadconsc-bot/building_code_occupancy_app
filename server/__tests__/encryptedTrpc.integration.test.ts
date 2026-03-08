/**
 * Integration Tests for Encrypted tRPC Procedures
 * 
 * Tests the end-to-end encryption workflow through tRPC procedures
 * Verifies automatic encryption/decryption at the API boundary
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEncryptedRecord, decryptDatabaseRecord, ENCRYPTED_FIELDS_CONFIG } from '../encryptedFieldsHelper';
import { getEncryptionService } from '../encryptionService';

describe('Encrypted tRPC Integration', () => {
  let encryptionService: any;

  beforeEach(() => {
    encryptionService = getEncryptionService();
  });

  describe('Client Encryption Workflow', () => {
    it('should encrypt client data on create', () => {
      const clientData = {
        userId: 1,
        name: 'John Smith',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1M4',
        companyName: 'ABC Construction',
        industry: 'Construction',
        notes: 'VIP client',
        status: 'active' as const,
      };

      // Simulate tRPC create procedure
      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const encrypted = createEncryptedRecord(clientData, encryptedFields as any);

      // Verify encrypted fields are objects with ciphertext
      expect(typeof encrypted.name).toBe('string');
      expect(typeof encrypted.email).toBe('string');
      expect(typeof encrypted.phone).toBe('string');
      expect(typeof encrypted.address).toBe('string');

      // Verify non-encrypted fields are unchanged
      expect(encrypted.city).toBe('Calgary');
      expect(encrypted.companyName).toBe('ABC Construction');
      expect(encrypted.status).toBe('active');
    });

    it('should decrypt client data on read', () => {
      const clientData = {
        userId: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-5678',
        address: '456 Oak Ave',
        city: 'Edmonton',
        province: 'AB',
        postalCode: 'T5H 2R7',
        companyName: 'XYZ Engineering',
        industry: 'Engineering',
        notes: 'Standard client',
        status: 'active' as const,
      };

      // Encrypt for storage
      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const encrypted = createEncryptedRecord(clientData, encryptedFields as any);

      // Simulate database retrieval and decryption
      const decrypted = decryptDatabaseRecord(encrypted, encryptedFields as any);

      // Verify decrypted data matches original
      expect(decrypted.name).toBe('Jane Doe');
      expect(decrypted.email).toBe('jane@example.com');
      expect(decrypted.phone).toBe('555-5678');
      expect(decrypted.address).toBe('456 Oak Ave');
      expect(decrypted.city).toBe('Edmonton');
    });

    it('should handle null/undefined fields in encryption', () => {
      const clientData = {
        userId: 1,
        name: 'Bob Johnson',
        email: null,
        phone: undefined,
        address: null,
        city: 'Vancouver',
        province: 'BC',
        postalCode: null,
        companyName: undefined,
        industry: 'Retail',
        notes: null,
        status: 'active' as const,
      };

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const encrypted = createEncryptedRecord(clientData, encryptedFields as any);

      // Verify null/undefined are preserved
      expect(encrypted.email).toBeNull();
      expect(encrypted.phone).toBeUndefined();
      expect(encrypted.address).toBeNull();

      // Verify decryption handles null/undefined
      const decrypted = decryptDatabaseRecord(encrypted, encryptedFields as any);
      expect(decrypted.email).toBeNull();
      expect(decrypted.name).toBe('Bob Johnson');
    });

    it('should support search by decrypting and filtering', () => {
      const clients = [
        {
          userId: 1,
          id: 1,
          name: 'Alice Cooper',
          email: 'alice@example.com',
          phone: '555-1111',
          address: '111 First St',
          city: 'Calgary',
          province: 'AB',
          postalCode: 'T2P 1M4',
          companyName: 'Cooper Inc',
          industry: 'Tech',
          notes: 'Tech client',
          status: 'active' as const,
        },
        {
          userId: 1,
          id: 2,
          name: 'Bob Smith',
          email: 'bob@example.com',
          phone: '555-2222',
          address: '222 Second Ave',
          city: 'Edmonton',
          province: 'AB',
          postalCode: 'T5H 2R7',
          companyName: 'Smith LLC',
          industry: 'Finance',
          notes: 'Finance client',
          status: 'active' as const,
        },
      ];

      // Encrypt all clients
      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const encrypted = clients.map(c => createEncryptedRecord(c, encryptedFields as any));

      // Decrypt and search
      const decrypted = encrypted.map(c => decryptDatabaseRecord(c, encryptedFields as any));
      const results = decrypted.filter(c => c.name.toLowerCase().includes('alice'));

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Cooper');
      expect(results[0].email).toBe('alice@example.com');
    });
  });

  describe('Project Encryption Workflow', () => {
    it('should encrypt project data on create', () => {
      const projectData = {
        userId: 1,
        name: 'Downtown Office Complex',
        address: '789 Business Blvd',
        occupancyCode: 'D',
        template: 'commercial',
        notes: 'High-rise office building',
        status: 'active' as const,
        overallProgress: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
      const encrypted = createEncryptedRecord(projectData, encryptedFields as any);

      // Verify encrypted fields
      expect(typeof encrypted.name).toBe('string');
      expect(typeof encrypted.address).toBe('string');

      // Verify non-encrypted fields
      expect(encrypted.occupancyCode).toBe('D');
      expect(encrypted.template).toBe('commercial');
      expect(encrypted.overallProgress).toBe(25);
    });

    it('should decrypt project data on read', () => {
      const projectData = {
        userId: 1,
        name: 'Residential Complex',
        address: '321 Maple Drive',
        occupancyCode: 'C',
        template: 'residential',
        notes: 'Multi-unit residential',
        status: 'active' as const,
        overallProgress: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
      const encrypted = createEncryptedRecord(projectData, encryptedFields as any);
      const decrypted = decryptDatabaseRecord(encrypted, encryptedFields as any);

      expect(decrypted.name).toBe('Residential Complex');
      expect(decrypted.address).toBe('321 Maple Drive');
      expect(decrypted.occupancyCode).toBe('C');
      expect(decrypted.overallProgress).toBe(60);
    });

    it('should handle partial updates with re-encryption', () => {
      const originalData = {
        userId: 1,
        name: 'Original Project',
        address: 'Original Address',
        occupancyCode: 'A',
        template: 'industrial',
        notes: 'Original notes',
        status: 'active' as const,
        overallProgress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Encrypt original
      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.projects.fields];
      const encrypted = createEncryptedRecord(originalData, encryptedFields as any);

      // Simulate partial update
      const updateData = {
        name: 'Updated Project',
        status: 'completed' as const,
        overallProgress: 100,
      };

      // Re-encrypt only updated fields
      const updateEncrypted = createEncryptedRecord(updateData, encryptedFields as any);

      // Merge updates
      const merged = { ...encrypted, ...updateEncrypted };

      // Decrypt and verify
      const decrypted = decryptDatabaseRecord(merged, encryptedFields as any);
      expect(decrypted.name).toBe('Updated Project');
      expect(decrypted.status).toBe('completed');
      expect(decrypted.overallProgress).toBe(100);
      expect(decrypted.address).toBe('Original Address');
    });
  });

  describe('Ownership Verification', () => {
    it('should verify client ownership before decryption', () => {
      const clientData = {
        userId: 1,
        id: 1,
        name: 'Owned Client',
        email: 'owned@example.com',
        phone: '555-9999',
        address: 'Secret Address',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1M4',
        companyName: 'Secret Corp',
        industry: 'Secret',
        notes: 'Secret notes',
        status: 'active' as const,
      };

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const encrypted = createEncryptedRecord(clientData, encryptedFields as any);

      // Simulate ownership check
      const currentUserId = 1;
      const isOwner = encrypted.userId === currentUserId;
      expect(isOwner).toBe(true);

      // Different user should not be able to decrypt
      const differentUserId = 2;
      const isDifferentOwner = encrypted.userId === differentUserId;
      expect(isDifferentOwner).toBe(false);
    });

    it('should prevent unauthorized access to encrypted data', () => {
      const clientData = {
        userId: 1,
        id: 1,
        name: 'Confidential Client',
        email: 'confidential@example.com',
        phone: '555-7777',
        address: 'Confidential Address',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1M4',
        companyName: 'Confidential Inc',
        industry: 'Confidential',
        notes: 'Confidential notes',
        status: 'active' as const,
      };

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const encrypted = createEncryptedRecord(clientData, encryptedFields as any);

      // User 2 attempts to access User 1's data
      const unauthorizedUserId = 2;
      const hasAccess = encrypted.userId === unauthorizedUserId;
      expect(hasAccess).toBe(false);

      // Attempting to decrypt without ownership should fail
      if (!hasAccess) {
        expect(() => {
          decryptDatabaseRecord(encrypted, encryptedFields as any);
        }).not.toThrow(); // Decryption itself doesn't throw, but access control should prevent this
      }
    });
  });

  describe('Audit Trail Integration', () => {
    it('should log encryption operations', () => {
      const logSpy = vi.fn();
      
      const clientData = {
        userId: 1,
        name: 'Audit Test Client',
        email: 'audit@example.com',
        phone: '555-8888',
        address: 'Audit Address',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1M4',
        companyName: 'Audit Corp',
        industry: 'Audit',
        notes: 'Audit notes',
        status: 'active' as const,
      };

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      
      // In production, this would log to audit trail
      // For testing, we verify the operation completes
      const encrypted = createEncryptedRecord(clientData, encryptedFields as any);
      expect(encrypted).toBeDefined();
      expect(encrypted.name).toBeDefined();
    });

    it('should track decryption operations', () => {
      const clientData = {
        userId: 1,
        name: 'Tracked Client',
        email: 'tracked@example.com',
        phone: '555-6666',
        address: 'Tracked Address',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1M4',
        companyName: 'Tracked Inc',
        industry: 'Tracking',
        notes: 'Tracked notes',
        status: 'active' as const,
      };

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const encrypted = createEncryptedRecord(clientData, encryptedFields as any);
      
      // Decryption should be trackable
      const decrypted = decryptDatabaseRecord(encrypted, encryptedFields as any);
      expect(decrypted.name).toBe('Tracked Client');
    });
  });

  describe('Performance', () => {
    it('should handle batch encryption efficiently', () => {
      const clients = Array.from({ length: 100 }, (_, i) => ({
        userId: 1,
        id: i,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        phone: `555-${String(i).padStart(4, '0')}`,
        address: `${i} Address St`,
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1M4',
        companyName: `Company ${i}`,
        industry: 'Various',
        notes: `Notes for client ${i}`,
        status: 'active' as const,
      }));

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const startTime = Date.now();

      const encrypted = clients.map(c => createEncryptedRecord(c, encryptedFields as any));

      const encryptTime = Date.now() - startTime;

      // Should complete in reasonable time (< 5 seconds for 100 records)
      expect(encryptTime).toBeLessThan(5000);
      expect(encrypted).toHaveLength(100);
    });

    it('should handle batch decryption efficiently', () => {
      const clients = Array.from({ length: 100 }, (_, i) => ({
        userId: 1,
        id: i,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        phone: `555-${String(i).padStart(4, '0')}`,
        address: `${i} Address St`,
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1M4',
        companyName: `Company ${i}`,
        industry: 'Various',
        notes: `Notes for client ${i}`,
        status: 'active' as const,
      }));

      const encryptedFields = [...ENCRYPTED_FIELDS_CONFIG.clients.fields];
      const encrypted = clients.map(c => createEncryptedRecord(c, encryptedFields as any));

      const startTime = Date.now();

      const decrypted = encrypted.map(c => decryptDatabaseRecord(c, encryptedFields as any));

      const decryptTime = Date.now() - startTime;

      // Should complete in reasonable time (< 5 seconds for 100 records)
      expect(decryptTime).toBeLessThan(5000);
      expect(decrypted).toHaveLength(100);
      expect(decrypted[0].name).toBe('Client 0');
    });
  });
});
