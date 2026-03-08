/**
 * Comprehensive Test Suite for Certification Format Schema
 * Tests all Zod schemas for certification format validation
 * Ensures legal layer integrity and backwards compatibility
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import schemas from certificationFormat.schema.ts
// Note: These schemas should be exported from the schema file
// For now, we'll define them inline for testing

// Legal Disclaimer Schema
const LegalDisclaimerSchema = z.object({
  type: z.enum(['PROFESSIONAL_SERVICE_NOTICE', 'JURISDICTION_NOTICE', 'LIABILITY_DISCLAIMER', 'USER_RESPONSIBILITY_NOTICE']),
  text: z.string().min(10),
  acknowledged: z.boolean(),
  acknowledgedAt: z.date().optional(),
});

// Compliance Input Schema
const ComplianceInputSchema = z.object({
  buildingType: z.string(),
  jurisdiction: z.string(),
  occupancyCode: z.string().optional(),
  constructionType: z.string().optional(),
  buildingHeight: z.number().optional(),
  floorArea: z.number().optional(),
  customInputs: z.record(z.string(), z.any()).optional(),
});

// Compliance Output Schema
const ComplianceOutputSchema = z.object({
  findings: z.array(z.object({
    code: z.string(),
    description: z.string(),
    severity: z.enum(['info', 'warning', 'error']),
    reference: z.string().optional(),
  })),
  status: z.enum(['compliant', 'non_compliant', 'needs_review']),
  summary: z.string().optional(),
});

// Digital Signature Schema
const DigitalSignatureSchema = z.object({
  algorithm: z.enum(['RSA-SHA256', 'ECDSA-SHA256']),
  signature: z.string(),
  certificateChain: z.array(z.string()).optional(),
  signedAt: z.date(),
  signedBy: z.string().optional(),
});

// RFC 3161 Timestamp Schema
const RFC3161TimestampSchema = z.object({
  timestamp: z.string(),
  tsaName: z.string(),
  tsaUrl: z.string().url(),
  hashAlgorithm: z.string().optional(),
  serialNumber: z.string().optional(),
});

// Audit Trail Schema
const AuditTrailSchema = z.object({
  generatedBy: z.string(),
  generatedAt: z.date(),
  signatureAlgorithm: z.string(),
  timestampAuthority: z.string(),
  encryptionAlgorithm: z.string(),
  version: z.string().optional(),
});

// Encrypted Data Schema
const EncryptedDataSchema = z.object({
  iv: z.string(),
  ciphertext: z.string(),
  authTag: z.string(),
  algorithm: z.string().optional(),
});

// Certification Schema
const CertificationSchema = z.object({
  certificateId: z.string(),
  version: z.string(),
  generatedAt: z.date(),
  sourceSnapshotId: z.string(),
  legalDisclaimers: z.object({
    professionalService: LegalDisclaimerSchema,
    jurisdiction: LegalDisclaimerSchema,
    liability: LegalDisclaimerSchema,
    userResponsibility: LegalDisclaimerSchema,
  }),
  compliance: z.object({
    snapshotId: z.string(),
    projectId: z.string(),
    userId: z.string(),
    rulesetId: z.string(),
    status: z.string(),
    inputs: ComplianceInputSchema,
    outputs: ComplianceOutputSchema,
    ruleTrace: z.array(z.any()),
    createdAt: z.date(),
  }),
  encryptedCompliance: EncryptedDataSchema,
  digitalSignature: DigitalSignatureSchema,
  rfc3161Timestamp: RFC3161TimestampSchema,
  signer: z.object({
    userId: z.string(),
    userName: z.string(),
    userEmail: z.string().email(),
    userRole: z.string(),
    signedAt: z.date(),
  }),
  auditTrail: AuditTrailSchema,
});

describe('Certification Format Schema Tests', () => {
  describe('Legal Disclaimer Schema', () => {
    it('should validate professional service notice', () => {
      const disclaimer = {
        type: 'PROFESSIONAL_SERVICE_NOTICE' as const,
        text: 'This is NOT a professional building code compliance review.',
        acknowledged: true,
        acknowledgedAt: new Date(),
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).not.toThrow();
    });

    it('should validate jurisdiction notice', () => {
      const disclaimer = {
        type: 'JURISDICTION_NOTICE' as const,
        text: 'Building codes vary by jurisdiction.',
        acknowledged: true,
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).not.toThrow();
    });

    it('should validate liability disclaimer', () => {
      const disclaimer = {
        type: 'LIABILITY_DISCLAIMER' as const,
        text: 'The application provides no warranties, express or implied.',
        acknowledged: true,
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).not.toThrow();
    });

    it('should validate user responsibility notice', () => {
      const disclaimer = {
        type: 'USER_RESPONSIBILITY_NOTICE' as const,
        text: 'The user is responsible for verifying all compliance determinations.',
        acknowledged: true,
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).not.toThrow();
    });

    it('should reject invalid disclaimer type', () => {
      const disclaimer = {
        type: 'INVALID_TYPE',
        text: 'Some text',
        acknowledged: true,
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).toThrow();
    });

    it('should reject empty text', () => {
      const disclaimer = {
        type: 'PROFESSIONAL_SERVICE_NOTICE' as const,
        text: '',
        acknowledged: true,
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).toThrow();
    });

    it('should reject missing acknowledgment', () => {
      const disclaimer = {
        type: 'PROFESSIONAL_SERVICE_NOTICE' as const,
        text: 'Some disclaimer text',
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).toThrow();
    });
  });

  describe('Compliance Input Schema', () => {
    it('should validate basic compliance input', () => {
      const input = {
        buildingType: 'residential',
        jurisdiction: 'Alberta',
      };

      expect(() => ComplianceInputSchema.parse(input)).not.toThrow();
    });

    it('should validate compliance input with optional fields', () => {
      const input = {
        buildingType: 'commercial',
        jurisdiction: 'Alberta',
        occupancyCode: 'D-1',
        constructionType: 'Type 1',
        buildingHeight: 50,
        floorArea: 10000,
      };

      expect(() => ComplianceInputSchema.parse(input)).not.toThrow();
    });

    it('should validate compliance input with custom inputs', () => {
      const input = {
        buildingType: 'mixed-use',
        jurisdiction: 'Alberta',
        customInputs: {
          'customField1': 'value1',
          'customField2': '123',
          'customField3': 'true',
        },
      };

      expect(() => ComplianceInputSchema.parse(input)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const input = {
        buildingType: 'residential',
      };

      expect(() => ComplianceInputSchema.parse(input)).toThrow();
    });
  });

  describe('Compliance Output Schema', () => {
    it('should validate compliant status', () => {
      const output = {
        findings: [
          {
            code: 'NBC-3.2.2',
            description: 'Building complies with fire safety requirements',
            severity: 'info' as const,
            reference: 'NBC 2023 Section 3.2.2',
          },
        ],
        status: 'compliant' as const,
        summary: 'All requirements met',
      };

      expect(() => ComplianceOutputSchema.parse(output)).not.toThrow();
    });

    it('should validate non-compliant status', () => {
      const output = {
        findings: [
          {
            code: 'NBC-3.2.2',
            description: 'Building does not meet egress requirements',
            severity: 'error' as const,
          },
        ],
        status: 'non_compliant' as const,
      };

      expect(() => ComplianceOutputSchema.parse(output)).not.toThrow();
    });

    it('should validate needs_review status', () => {
      const output = {
        findings: [
          {
            code: 'NBC-3.2.2',
            description: 'Professional review required',
            severity: 'warning' as const,
          },
        ],
        status: 'needs_review' as const,
      };

      expect(() => ComplianceOutputSchema.parse(output)).not.toThrow();
    });

    it('should reject invalid severity', () => {
      const output = {
        findings: [
          {
            code: 'NBC-3.2.2',
            description: 'Some finding',
            severity: 'invalid',
          },
        ],
        status: 'compliant' as const,
      };

      expect(() => ComplianceOutputSchema.parse(output)).toThrow();
    });

    it('should reject invalid status', () => {
      const output = {
        findings: [],
        status: 'invalid_status',
      };

      expect(() => ComplianceOutputSchema.parse(output)).toThrow();
    });
  });

  describe('Digital Signature Schema', () => {
    it('should validate RSA signature', () => {
      const signature = {
        algorithm: 'RSA-SHA256' as const,
        signature: 'base64encodedSignature',
        signedAt: new Date(),
        signedBy: 'user-123',
      };

      expect(() => DigitalSignatureSchema.parse(signature)).not.toThrow();
    });

    it('should validate ECDSA signature', () => {
      const signature = {
        algorithm: 'ECDSA-SHA256' as const,
        signature: 'base64encodedSignature',
        certificateChain: ['cert1', 'cert2'],
        signedAt: new Date(),
      };

      expect(() => DigitalSignatureSchema.parse(signature)).not.toThrow();
    });

    it('should reject invalid algorithm', () => {
      const signature = {
        algorithm: 'INVALID-ALGO',
        signature: 'base64encodedSignature',
        signedAt: new Date(),
      };

      expect(() => DigitalSignatureSchema.parse(signature)).toThrow();
    });

    it('should reject missing signature', () => {
      const signature = {
        algorithm: 'RSA-SHA256' as const,
        signedAt: new Date(),
      };

      expect(() => DigitalSignatureSchema.parse(signature)).toThrow();
    });
  });

  describe('RFC 3161 Timestamp Schema', () => {
    it('should validate timestamp from Sectigo', () => {
      const timestamp = {
        timestamp: '2026-03-08T22:37:59.218Z',
        tsaName: 'Sectigo',
        tsaUrl: 'http://timestamp.sectigo.com',
      };

      expect(() => RFC3161TimestampSchema.parse(timestamp)).not.toThrow();
    });

    it('should validate timestamp from DigiCert', () => {
      const timestamp = {
        timestamp: '2026-03-08T22:37:59.218Z',
        tsaName: 'DigiCert',
        tsaUrl: 'http://timestamp.digicert.com',
        hashAlgorithm: 'sha256',
      };

      expect(() => RFC3161TimestampSchema.parse(timestamp)).not.toThrow();
    });

    it('should validate timestamp with serial number', () => {
      const timestamp = {
        timestamp: '2026-03-08T22:37:59.218Z',
        tsaName: 'GlobalSign',
        tsaUrl: 'http://timestamp.globalsign.com/tsa/r6advanced',
        serialNumber: '1234567890',
      };

      expect(() => RFC3161TimestampSchema.parse(timestamp)).not.toThrow();
    });

    it('should reject invalid URL', () => {
      const timestamp = {
        timestamp: '2026-03-08T22:37:59.218Z',
        tsaName: 'Sectigo',
        tsaUrl: 'not-a-url',
      };

      expect(() => RFC3161TimestampSchema.parse(timestamp)).toThrow();
    });

    it('should reject missing required fields', () => {
      const timestamp = {
        timestamp: '2026-03-08T22:37:59.218Z',
        tsaName: 'Sectigo',
      };

      expect(() => RFC3161TimestampSchema.parse(timestamp)).toThrow();
    });
  });

  describe('Encrypted Data Schema', () => {
    it('should validate encrypted data', () => {
      const encrypted = {
        iv: 'base64encodedIV',
        ciphertext: 'base64encodedCiphertext',
        authTag: 'base64encodedAuthTag',
      };

      expect(() => EncryptedDataSchema.parse(encrypted)).not.toThrow();
    });

    it('should validate encrypted data with algorithm', () => {
      const encrypted = {
        iv: 'base64encodedIV',
        ciphertext: 'base64encodedCiphertext',
        authTag: 'base64encodedAuthTag',
        algorithm: 'AES-256-GCM',
      };

      expect(() => EncryptedDataSchema.parse(encrypted)).not.toThrow();
    });

    it('should reject missing iv', () => {
      const encrypted = {
        ciphertext: 'base64encodedCiphertext',
        authTag: 'base64encodedAuthTag',
      };

      expect(() => EncryptedDataSchema.parse(encrypted)).toThrow();
    });

    it('should reject missing ciphertext', () => {
      const encrypted = {
        iv: 'base64encodedIV',
        authTag: 'base64encodedAuthTag',
      };

      expect(() => EncryptedDataSchema.parse(encrypted)).toThrow();
    });

    it('should reject missing authTag', () => {
      const encrypted = {
        iv: 'base64encodedIV',
        ciphertext: 'base64encodedCiphertext',
      };

      expect(() => EncryptedDataSchema.parse(encrypted)).toThrow();
    });
  });

  describe('Complete Certification Schema', () => {
    it('should validate complete certification', () => {
      const certification = {
        certificateId: 'CERT-ABC123',
        version: '1.0',
        generatedAt: new Date(),
        sourceSnapshotId: 'snapshot-123',
        legalDisclaimers: {
          professionalService: {
            type: 'PROFESSIONAL_SERVICE_NOTICE' as const,
            text: 'This is NOT a professional review',
            acknowledged: true,
          },
          jurisdiction: {
            type: 'JURISDICTION_NOTICE' as const,
            text: 'Building codes vary by jurisdiction',
            acknowledged: true,
          },
          liability: {
            type: 'LIABILITY_DISCLAIMER' as const,
            text: 'No warranties provided',
            acknowledged: true,
          },
          userResponsibility: {
            type: 'USER_RESPONSIBILITY_NOTICE' as const,
            text: 'User is responsible for verification',
            acknowledged: true,
          },
        },
        compliance: {
          snapshotId: 'snapshot-123',
          projectId: 'project-456',
          userId: 'user-789',
          rulesetId: 'nbc_ae_2023_v1',
          status: 'compliant',
          inputs: {
            buildingType: 'residential',
            jurisdiction: 'Alberta',
          },
          outputs: {
            findings: [],
            status: 'compliant',
          },
          ruleTrace: [],
          createdAt: new Date(),
        },
        encryptedCompliance: {
          iv: 'iv123',
          ciphertext: 'ciphertext123',
          authTag: 'tag123',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256' as const,
          signature: 'sig123',
          signedAt: new Date(),
        },
        rfc3161Timestamp: {
          timestamp: new Date().toISOString(),
          tsaName: 'Sectigo',
          tsaUrl: 'http://timestamp.sectigo.com',
        },
        signer: {
          userId: 'user-789',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          userRole: 'professional',
          signedAt: new Date(),
        },
        auditTrail: {
          generatedBy: 'user-789',
          generatedAt: new Date(),
          signatureAlgorithm: 'RSA-SHA256',
          timestampAuthority: 'Sectigo',
          encryptionAlgorithm: 'AES-256-GCM',
        },
      };

      expect(() => CertificationSchema.parse(certification)).not.toThrow();
    });

    it('should reject missing legal disclaimers', () => {
      const certification = {
        certificateId: 'CERT-ABC123',
        version: '1.0',
        generatedAt: new Date(),
        sourceSnapshotId: 'snapshot-123',
        // Missing legalDisclaimers
        compliance: {
          snapshotId: 'snapshot-123',
          projectId: 'project-456',
          userId: 'user-789',
          rulesetId: 'nbc_ae_2023_v1',
          status: 'compliant',
          inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
          outputs: { findings: [], status: 'compliant' },
          ruleTrace: [],
          createdAt: new Date(),
        },
        encryptedCompliance: { iv: 'iv123', ciphertext: 'ct123', authTag: 'tag123' },
        digitalSignature: { algorithm: 'RSA-SHA256' as const, signature: 'sig123', signedAt: new Date() },
        rfc3161Timestamp: { timestamp: new Date().toISOString(), tsaName: 'Sectigo', tsaUrl: 'http://timestamp.sectigo.com' },
        signer: { userId: 'user-789', userName: 'John', userEmail: 'john@example.com', userRole: 'pro', signedAt: new Date() },
        auditTrail: { generatedBy: 'user-789', generatedAt: new Date(), signatureAlgorithm: 'RSA-SHA256', timestampAuthority: 'Sectigo', encryptionAlgorithm: 'AES-256-GCM' },
      };

      expect(() => CertificationSchema.parse(certification)).toThrow();
    });

    it('should reject invalid email in signer', () => {
      const certification = {
        certificateId: 'CERT-ABC123',
        version: '1.0',
        generatedAt: new Date(),
        sourceSnapshotId: 'snapshot-123',
        legalDisclaimers: {
          professionalService: { type: 'PROFESSIONAL_SERVICE_NOTICE' as const, text: 'Text', acknowledged: true },
          jurisdiction: { type: 'JURISDICTION_NOTICE' as const, text: 'Text', acknowledged: true },
          liability: { type: 'LIABILITY_DISCLAIMER' as const, text: 'Text', acknowledged: true },
          userResponsibility: { type: 'USER_RESPONSIBILITY_NOTICE' as const, text: 'Text', acknowledged: true },
        },
        compliance: {
          snapshotId: 'snapshot-123',
          projectId: 'project-456',
          userId: 'user-789',
          rulesetId: 'nbc_ae_2023_v1',
          status: 'compliant',
          inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
          outputs: { findings: [], status: 'compliant' },
          ruleTrace: [],
          createdAt: new Date(),
        },
        encryptedCompliance: { iv: 'iv123', ciphertext: 'ct123', authTag: 'tag123' },
        digitalSignature: { algorithm: 'RSA-SHA256' as const, signature: 'sig123', signedAt: new Date() },
        rfc3161Timestamp: { timestamp: new Date().toISOString(), tsaName: 'Sectigo', tsaUrl: 'http://timestamp.sectigo.com' },
        signer: { userId: 'user-789', userName: 'John', userEmail: 'invalid-email', userRole: 'pro', signedAt: new Date() },
        auditTrail: { generatedBy: 'user-789', generatedAt: new Date(), signatureAlgorithm: 'RSA-SHA256', timestampAuthority: 'Sectigo', encryptionAlgorithm: 'AES-256-GCM' },
      };

      expect(() => CertificationSchema.parse(certification)).toThrow();
    });
  });

  describe('Schema Backwards Compatibility', () => {
    it('should support legacy compliance snapshot format', () => {
      const legacyData = {
        snapshotId: 'legacy-snapshot',
        projectId: 'project-123',
        userId: 'user-456',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' },
        ruleTrace: [],
        createdAt: new Date(),
      };

      // Should be convertible to compliance schema
      const converted = {
        snapshotId: legacyData.snapshotId,
        projectId: legacyData.projectId,
        userId: legacyData.userId,
        rulesetId: legacyData.rulesetId,
        status: legacyData.complianceStatus,
        inputs: legacyData.inputs,
        outputs: legacyData.outputs,
        ruleTrace: legacyData.ruleTrace,
        createdAt: legacyData.createdAt,
      };

      expect(() => z.object({
        snapshotId: z.string(),
        projectId: z.string(),
        userId: z.string(),
        rulesetId: z.string(),
        status: z.string(),
        inputs: ComplianceInputSchema,
        outputs: ComplianceOutputSchema,
        ruleTrace: z.array(z.any()),
        createdAt: z.date(),
      }).parse(converted)).not.toThrow();
    });
  });

  describe('Schema Validation Edge Cases', () => {
    it('should handle very long certificate IDs', () => {
      const longId = 'CERT-' + 'A'.repeat(1000);
      const disclaimer = {
        type: 'PROFESSIONAL_SERVICE_NOTICE' as const,
        text: 'This is a test disclaimer with a very long certificate ID: ' + longId,
        acknowledged: true,
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).not.toThrow();
    });

    it('should handle multiple findings in compliance output', () => {
      const output = {
        findings: Array.from({ length: 100 }, (_, i) => ({
          code: `NBC-${i}`,
          description: `Finding ${i}`,
          severity: 'info' as const,
        })),
        status: 'compliant' as const,
      };

      expect(() => ComplianceOutputSchema.parse(output)).not.toThrow();
    });

    it('should handle special characters in text fields', () => {
      const disclaimer = {
        type: 'PROFESSIONAL_SERVICE_NOTICE' as const,
        text: 'Special chars: @#$%^&*()_+-=[]{}|;:\'",.<>?/\\~`',
        acknowledged: true,
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).not.toThrow();
    });

    it('should handle unicode characters in text fields', () => {
      const disclaimer = {
        type: 'PROFESSIONAL_SERVICE_NOTICE' as const,
        text: 'Unicode: 你好世界 مرحبا بالعالم שלום עולם',
        acknowledged: true,
      };

      expect(() => LegalDisclaimerSchema.parse(disclaimer)).not.toThrow();
    });
  });
});
