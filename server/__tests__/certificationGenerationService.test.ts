/**
 * Comprehensive Test Suite for Certification Generation Service
 * Tests all Phase 3 components:
 * - CertificationGenerationService
 * - CertificateSignatureService
 * - RFC3161TimestampService
 * - Integration with EncryptionService
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  CertificationGenerationService,
  createCertificationGenerationService,
  initializeCertificationServiceDev,
} from '../certificationGenerationService';
import { CertificateSignatureService, generateRSAKeyPair, generateECDSAKeyPair } from '../certificationSignatureService';
import { RFC3161TimestampService, createRFC3161TimestampService } from '../rfc3161TimestampService';
import { getEncryptionService } from '../encryptionService';

describe('Phase 3: Certification Generation Service Tests', () => {
  let certService: CertificationGenerationService;
  let signatureService: CertificateSignatureService;
  let timestampService: RFC3161TimestampService;
  let encryptionService: any;

  beforeAll(() => {
    // Initialize all services
    certService = initializeCertificationServiceDev();
    signatureService = new CertificateSignatureService('RSA-SHA256');
    timestampService = createRFC3161TimestampService('sectigo');
    encryptionService = getEncryptionService();
  });

  describe('CertificationGenerationService Initialization', () => {
    it('should initialize with default configuration', () => {
      const service = createCertificationGenerationService();
      expect(service).toBeDefined();
      expect(service.getServiceInfo()).toBeDefined();
    });

    it('should initialize with RSA-SHA256 signature algorithm', () => {
      const service = new CertificationGenerationService('RSA-SHA256', 'sectigo');
      expect(service).toBeDefined();
    });

    it('should initialize with ECDSA-SHA256 signature algorithm', () => {
      const service = new CertificationGenerationService('ECDSA-SHA256', 'digicert');
      expect(service).toBeDefined();
    });

    it('should initialize with different TSA providers', () => {
      const providers = ['sectigo', 'digicert', 'globalsign'] as const;
      providers.forEach((provider) => {
        const service = new CertificationGenerationService('RSA-SHA256', provider);
        expect(service).toBeDefined();
      });
    });

    it('should initialize with generated RSA keys', () => {
      const service = initializeCertificationServiceDev();
      const info = service.getServiceInfo();
      expect(info.signatureAlgorithm).toBe('RSA-SHA256');
      expect(info.encryptionAlgorithm).toBe('AES-256-GCM');
    });
  });

  describe('Certificate Generation', () => {
    it('should generate complete certification with all components', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(certification).toBeDefined();
      expect(certification.certificateId).toBeDefined();
      expect(certification.certificateId).toMatch(/^CERT-/);
      expect(certification.version).toBe('1.0');
      expect(certification.generatedAt).toBeInstanceOf(Date);
      expect(certification.sourceSnapshotId).toBe('snapshot-123');
    });

    it('should include legal disclaimers in certificate', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(certification.legalDisclaimers).toBeDefined();
      expect(certification.legalDisclaimers.professionalService).toBeDefined();
      expect(certification.legalDisclaimers.jurisdiction).toBeDefined();
      expect(certification.legalDisclaimers.liability).toBeDefined();
      expect(certification.legalDisclaimers.userResponsibility).toBeDefined();

      // Verify legal layer is intact
      expect(certification.legalDisclaimers.professionalService.type).toBe('PROFESSIONAL_SERVICE_NOTICE');
      expect(certification.legalDisclaimers.professionalService.acknowledged).toBe(true);
      expect(certification.legalDisclaimers.jurisdiction.type).toBe('JURISDICTION_NOTICE');
      expect(certification.legalDisclaimers.liability.type).toBe('LIABILITY_DISCLAIMER');
      expect(certification.legalDisclaimers.userResponsibility.type).toBe('USER_RESPONSIBILITY_NOTICE');
    });

    it('should include digital signature in certificate', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(certification.digitalSignature).toBeDefined();
      expect(certification.digitalSignature.algorithm).toBeDefined();
      expect(certification.digitalSignature.signature).toBeDefined();
      expect(certification.digitalSignature.certificateChain).toBeDefined();
      expect(certification.digitalSignature.signedAt).toBeInstanceOf(Date);
    });

    it('should include RFC 3161 timestamp in certificate', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(certification.rfc3161Timestamp).toBeDefined();
      expect(certification.rfc3161Timestamp.timestamp).toBeDefined();
      expect(certification.rfc3161Timestamp.tsaName).toBeDefined();
      expect(certification.rfc3161Timestamp.tsaUrl).toBeDefined();
    });

    it('should include encrypted compliance data', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(certification.encryptedCompliance).toBeDefined();
      expect(certification.encryptedCompliance.iv).toBeDefined();
      expect(certification.encryptedCompliance.ciphertext).toBeDefined();
      expect(certification.encryptedCompliance.authTag).toBeDefined();
    });

    it('should include signer information', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(certification.signer).toBeDefined();
      expect(certification.signer.userId).toBe('user-456');
      expect(certification.signer.userName).toBe('John Doe');
      expect(certification.signer.userEmail).toBe('john@example.com');
      expect(certification.signer.userRole).toBe('professional');
      expect(certification.signer.signedAt).toBeInstanceOf(Date);
    });

    it('should include audit trail', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(certification.auditTrail).toBeDefined();
      expect(certification.auditTrail.generatedBy).toBe('user-456');
      expect(certification.auditTrail.generatedAt).toBeInstanceOf(Date);
      expect(certification.auditTrail.signatureAlgorithm).toBeDefined();
      expect(certification.auditTrail.timestampAuthority).toBeDefined();
      expect(certification.auditTrail.encryptionAlgorithm).toBe('AES-256-GCM');
    });

    it('should generate unique certificate IDs', async () => {
      const cert1 = await certService.generateCertification(
        'snapshot-1',
        'user-1',
        'User 1',
        'user1@example.com',
        'professional'
      );

      const cert2 = await certService.generateCertification(
        'snapshot-2',
        'user-2',
        'User 2',
        'user2@example.com',
        'professional'
      );

      expect(cert1.certificateId).not.toBe(cert2.certificateId);
    });

    it('should accept custom compliance data', async () => {
      const customData = {
        snapshotId: 'custom-snapshot',
        projectId: 'project-123',
        userId: 'user-456',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: { buildingType: 'commercial', jurisdiction: 'Alberta' },
        outputs: { findings: ['Finding 1'], status: 'compliant' },
        ruleTrace: ['Rule 1', 'Rule 2'],
        createdAt: new Date(),
      };

      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional',
        customData
      );

      expect(certification.compliance).toBeDefined();
      expect(certification.compliance.inputs.buildingType).toBe('commercial');
    });
  });

  describe('Certificate Verification', () => {
    it('should verify valid certificate', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      const verification = certService.verifyCertification(certification);

      expect(verification).toBeDefined();
      expect(verification.isValid).toBe(true);
      expect(verification.signatureValid).toBe(true);
      expect(verification.timestampValid).toBe(true);
      expect(verification.issues).toHaveLength(0);
    });

    it('should detect missing legal disclaimers', () => {
      const invalidCert = {
        version: '1.0',
        certificateId: 'CERT-invalid',
        generatedAt: new Date(),
        sourceSnapshotId: 'snapshot-123',
        // Missing legalDisclaimers
        encryptedCompliance: { iv: 'test', ciphertext: 'test', authTag: 'test' },
        digitalSignature: { algorithm: 'RSA-SHA256', signature: 'test' },
        rfc3161Timestamp: { timestamp: 'test', tsaName: 'sectigo' },
        signer: { userId: 'user-456', userName: 'John' },
      };

      const verification = certService.verifyCertification(invalidCert);

      expect(verification.isValid).toBe(false);
      expect(verification.issues.some((issue) => issue.includes('Legal disclaimers'))).toBe(true);
    });

    it('should detect missing encrypted compliance data', () => {
      const invalidCert = {
        version: '1.0',
        certificateId: 'CERT-invalid',
        generatedAt: new Date(),
        sourceSnapshotId: 'snapshot-123',
        legalDisclaimers: { professionalService: { type: 'PROFESSIONAL_SERVICE_NOTICE' } },
        // Missing encryptedCompliance
        digitalSignature: { algorithm: 'RSA-SHA256', signature: 'test' },
        rfc3161Timestamp: { timestamp: 'test', tsaName: 'sectigo' },
        signer: { userId: 'user-456', userName: 'John' },
      };

      const verification = certService.verifyCertification(invalidCert);
      expect(verification.isValid).toBe(false);
      expect(verification.issues.some((issue) => issue.includes('compliance data'))).toBe(true);
    });

    it('should return verification report with all fields', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      const verification = certService.verifyCertification(certification);

      expect(verification).toHaveProperty('isValid');
      expect(verification).toHaveProperty('signatureValid');
      expect(verification).toHaveProperty('timestampValid');
      expect(verification).toHaveProperty('issues');
      expect(Array.isArray(verification.issues)).toBe(true);
    });
  });

  describe('CertificateSignatureService Integration', () => {
    it('should generate RSA signature', () => {
      const { publicKey, privateKey } = generateRSAKeyPair();
      const service = new CertificateSignatureService('RSA-SHA256');
      service.initializeWithKeyPair(privateKey, publicKey);

      const data = { test: 'data' };
      const signature = service.generateSignature(data, 'user-1', 'John', 'john@example.com', 'professional');

      expect(signature).toBeDefined();
      expect(signature.algorithm).toBe('RSA-SHA256');
      expect(signature.signature).toBeDefined();
      expect(signature.signedAt).toBeInstanceOf(Date);
    });

    it('should generate ECDSA signature', () => {
      const { publicKey, privateKey } = generateECDSAKeyPair();
      const service = new CertificateSignatureService('ECDSA-SHA256');
      service.initializeWithKeyPair(privateKey, publicKey);

      const data = { test: 'data' };
      const signature = service.generateSignature(data, 'user-1', 'John', 'john@example.com', 'professional');

      expect(signature).toBeDefined();
      expect(signature.algorithm).toBe('ECDSA-SHA256');
      expect(signature.signature).toBeDefined();
    });

    it('should verify RSA signature', () => {
      const { publicKey, privateKey } = generateRSAKeyPair();
      const service = new CertificateSignatureService('RSA-SHA256');
      service.initializeWithKeyPair(privateKey, publicKey);

      const data = { test: 'data' };
      const signature = service.generateSignature(data, 'user-1', 'John', 'john@example.com', 'professional');
      const isValid = service.verifySignature(data, signature);

      expect(isValid).toBe(true);
    });

    it('should detect tampered signature', () => {
      const { publicKey, privateKey } = generateRSAKeyPair();
      const service = new CertificateSignatureService('RSA-SHA256');
      service.initializeWithKeyPair(privateKey, publicKey);

      const data = { test: 'data' };
      const signature = service.generateSignature(data, 'user-1', 'John', 'john@example.com', 'professional');

      // Tamper with data
      const tamperedData = { test: 'tampered' };
      const isValid = service.verifySignature(tamperedData, signature);

      expect(isValid).toBe(false);
    });
  });

  describe('RFC3161TimestampService Integration', () => {
    it('should request timestamp from Sectigo', async () => {
      const service = createRFC3161TimestampService('sectigo');
      const timestamp = await service.requestTimestamp('test data');

      expect(timestamp).toBeDefined();
      expect(timestamp.timestamp).toBeDefined();
      expect(timestamp.tsaName).toBe('Sectigo');
      expect(timestamp.tsaUrl).toBeDefined();
    });

    it('should request timestamp from DigiCert', async () => {
      const service = createRFC3161TimestampService('digicert');
      const timestamp = await service.requestTimestamp('test data');

      expect(timestamp).toBeDefined();
      expect(timestamp.timestamp).toBeDefined();
      expect(timestamp.tsaName).toBe('DigiCert');
    });

    it('should request timestamp from GlobalSign', async () => {
      const service = createRFC3161TimestampService('globalsign');
      const timestamp = await service.requestTimestamp('test data');

      expect(timestamp).toBeDefined();
      expect(timestamp.timestamp).toBeDefined();
      expect(timestamp.tsaName).toBe('GlobalSign');
    });

    it('should verify timestamp', async () => {
      const service = createRFC3161TimestampService('sectigo');
      const timestamp = await service.requestTimestamp('test data');
      const isValid = service.verifyTimestamp(timestamp);

      expect(isValid).toBe(true);
    });
  });

  describe('EncryptionService Integration', () => {
    it('should encrypt and decrypt compliance data', () => {
      const data = JSON.stringify({
        inputs: { buildingType: 'residential' },
        outputs: { findings: [] },
      });

      const encrypted = encryptionService.encrypt(data);

      expect(encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(data);
    });

    it('should handle encryption with additional authenticated data', () => {
      const data = JSON.stringify({ test: 'data' });
      const aad = 'certificate-123';

      const encrypted = encryptionService.encrypt(data, aad);
      const decrypted = encryptionService.decrypt(encrypted, aad);

      expect(decrypted).toBe(data);
    });

    it('should detect tampering with encrypted data', () => {
      const data = JSON.stringify({ test: 'data' });
      const encrypted = encryptionService.encrypt(data);

      // Tamper with ciphertext
      encrypted.ciphertext = 'tampered' + encrypted.ciphertext.slice(8);

      expect(() => {
        encryptionService.decrypt(encrypted);
      }).toThrow();
    });
  });

  describe('End-to-End Certification Workflow', () => {
    it('should complete full certification generation and verification', async () => {
      // 1. Generate certification
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        'John Doe',
        'john@example.com',
        'professional'
      );

      // 2. Verify all components are present
      expect(certification.certificateId).toBeDefined();
      expect(certification.legalDisclaimers).toBeDefined();
      expect(certification.digitalSignature).toBeDefined();
      expect(certification.rfc3161Timestamp).toBeDefined();
      expect(certification.encryptedCompliance).toBeDefined();
      expect(certification.signer).toBeDefined();
      expect(certification.auditTrail).toBeDefined();

      // 3. Verify certificate integrity
      const verification = certService.verifyCertification(certification);
      expect(verification.isValid).toBe(true);

      // 4. Decrypt compliance data
      const decrypted = encryptionService.decrypt(certification.encryptedCompliance);
      expect(decrypted).toBeDefined();
      const complianceData = JSON.parse(decrypted);
      expect(complianceData.snapshotId).toBe('snapshot-123');
    });

    it('should handle multiple concurrent certifications', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        certService.generateCertification(
          `snapshot-${i}`,
          `user-${i}`,
          `User ${i}`,
          `user${i}@example.com`,
          'professional'
        )
      );

      const certifications = await Promise.all(promises);

      expect(certifications).toHaveLength(5);
      certifications.forEach((cert, i) => {
        expect(cert.sourceSnapshotId).toBe(`snapshot-${i}`);
        expect(cert.signer.userId).toBe(`user-${i}`);
      });
    });

    it('should maintain backwards compatibility with complianceSnapshots', async () => {
      const legacyData = {
        snapshotId: 'legacy-snapshot-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: { buildingType: 'residential' },
        outputs: { findings: [] },
        ruleTrace: [],
        createdAt: new Date(),
      };

      const certification = await certService.generateCertification(
        'legacy-snapshot-123',
        'user-789',
        'John Doe',
        'john@example.com',
        'professional',
        legacyData
      );

      expect(certification.sourceSnapshotId).toBe('legacy-snapshot-123');
      // Note: compliance data is encrypted, so we just verify the structure exists
      expect(certification.encryptedCompliance).toBeDefined();
      expect(certification.encryptedCompliance.iv).toBeDefined();
      expect(certification.encryptedCompliance.ciphertext).toBeDefined();
    });
  });

  describe('Service Info and Metadata', () => {
    it('should return service info', () => {
      const info = certService.getServiceInfo();

      expect(info).toBeDefined();
      expect(info.signatureAlgorithm).toBeDefined();
      expect(info.timestampAuthority).toBeDefined();
      expect(info.encryptionAlgorithm).toBe('AES-256-GCM');
    });

    it('should return consistent service info across multiple calls', () => {
      const info1 = certService.getServiceInfo();
      const info2 = certService.getServiceInfo();

      expect(info1).toEqual(info2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user information gracefully', async () => {
      const certification = await certService.generateCertification(
        'snapshot-123',
        'user-456',
        '',
        '',
        'professional'
      );

      expect(certification).toBeDefined();
      expect(certification.signer.userId).toBe('user-456');
    });

    it('should handle verification of corrupted certificate', () => {
      const corruptedCert = {
        version: '1.0',
        certificateId: 'CERT-corrupted',
        generatedAt: new Date(),
        // Missing required fields
      };

      const verification = certService.verifyCertification(corruptedCert as any);

      expect(verification.isValid).toBe(false);
      expect(verification.issues.length).toBeGreaterThan(0);
    });
  });
});
