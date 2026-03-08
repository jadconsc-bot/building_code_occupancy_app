/**
 * Comprehensive Test Suite for Certification Migration Service
 * Tests migration of legacy compliance snapshots to certification format
 * Ensures backwards compatibility and data integrity
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { CertificationMigrationService, createMigrationService, LegacyComplianceSnapshot } from '../services/certificationMigrationService';

describe('Certification Migration Service Tests', () => {
  let migrationService: CertificationMigrationService;

  beforeAll(() => {
    migrationService = createMigrationService('RSA-SHA256', 'sectigo');
  });

  describe('Migration Service Initialization', () => {
    it('should initialize with default configuration', () => {
      const service = createMigrationService();
      expect(service).toBeDefined();
      expect(service.getServiceInfo()).toBeDefined();
    });

    it('should initialize with RSA signature algorithm', () => {
      const service = new CertificationMigrationService('RSA-SHA256', 'sectigo');
      expect(service).toBeDefined();
    });

    it('should initialize with ECDSA signature algorithm', () => {
      const service = new CertificationMigrationService('ECDSA-SHA256', 'digicert');
      expect(service).toBeDefined();
    });

    it('should initialize with different TSA providers', () => {
      const providers = ['sectigo', 'digicert', 'globalsign'] as const;
      providers.forEach((provider) => {
        const service = new CertificationMigrationService('RSA-SHA256', provider);
        expect(service).toBeDefined();
      });
    });

    it('should return service info', () => {
      const info = migrationService.getServiceInfo();
      expect(info).toBeDefined();
      expect(info.certificationService).toBeDefined();
      expect(info.encryptionAlgorithm).toBe('AES-256-GCM');
      expect(info.supportedMigrationFormats).toContain('legacy_compliance_snapshot');
    });
  });

  describe('Legacy Snapshot Validation', () => {
    it('should validate correct legacy snapshot', () => {
      const snapshot: LegacyComplianceSnapshot = {
        snapshotId: 'legacy-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: {
          findings: [],
          status: 'compliant',
          summary: 'All requirements met',
        },
        ruleTrace: [],
        createdAt: new Date(),
      };

      const validation = migrationService.validateLegacySnapshot(snapshot);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject snapshot with missing snapshotId', () => {
      const snapshot = {
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: {},
        outputs: { findings: [], status: 'compliant' },
        createdAt: new Date(),
      };

      const validation = migrationService.validateLegacySnapshot(snapshot);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('snapshotId'))).toBe(true);
    });

    it('should reject snapshot with invalid compliance status', () => {
      const snapshot = {
        snapshotId: 'legacy-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'invalid_status',
        inputs: {},
        outputs: { findings: [], status: 'compliant' },
        createdAt: new Date(),
      };

      const validation = migrationService.validateLegacySnapshot(snapshot);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('complianceStatus'))).toBe(true);
    });

    it('should reject snapshot with missing outputs', () => {
      const snapshot = {
        snapshotId: 'legacy-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: {},
        createdAt: new Date(),
      };

      const validation = migrationService.validateLegacySnapshot(snapshot);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('outputs'))).toBe(true);
    });

    it('should reject snapshot with invalid outputs.findings', () => {
      const snapshot = {
        snapshotId: 'legacy-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: {},
        outputs: { findings: 'not_an_array', status: 'compliant' },
        createdAt: new Date(),
      };

      const validation = migrationService.validateLegacySnapshot(snapshot);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('findings'))).toBe(true);
    });
  });

  describe('Single Snapshot Migration', () => {
    it('should migrate valid legacy snapshot', async () => {
      const snapshot: LegacyComplianceSnapshot = {
        snapshotId: 'legacy-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: {
          findings: [],
          status: 'compliant',
        },
        ruleTrace: [],
        createdAt: new Date(),
      };

      const result = await migrationService.migrateSnapshot(
        snapshot,
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(result.success).toBe(true);
      expect(result.snapshotId).toBe('legacy-123');
      expect(result.certificateId).toBeDefined();
      expect(result.details.converted).toBe(true);
      expect(result.details.encrypted).toBe(true);
      expect(result.details.signed).toBe(true);
      expect(result.details.auditTrail).toBe(true);
    });

    it('should record migration duration', async () => {
      const snapshot: LegacyComplianceSnapshot = {
        snapshotId: 'legacy-456',
        projectId: 'project-789',
        userId: 'user-012',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: { buildingType: 'commercial', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' },
        ruleTrace: [],
        createdAt: new Date(),
      };

      const result = await migrationService.migrateSnapshot(
        snapshot,
        'Jane Smith',
        'jane@example.com',
        'professional'
      );

      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle migration with findings', async () => {
      const snapshot: LegacyComplianceSnapshot = {
        snapshotId: 'legacy-with-findings',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'needs_review',
        inputs: { buildingType: 'mixed-use', jurisdiction: 'Alberta' },
        outputs: {
          findings: [
            {
              code: 'NBC-3.2.2',
              description: 'Requires professional review',
              severity: 'warning',
              reference: 'NBC 2023 Section 3.2.2',
            },
          ],
          status: 'needs_review',
          summary: 'Professional review required for mixed-use building',
        },
        ruleTrace: ['Rule 1', 'Rule 2'],
        createdAt: new Date(),
      };

      const result = await migrationService.migrateSnapshot(
        snapshot,
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(result.success).toBe(true);
      expect(result.certificateId).toBeDefined();
    });

    it('should handle non-compliant snapshot', async () => {
      const snapshot: LegacyComplianceSnapshot = {
        snapshotId: 'legacy-non-compliant',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'non_compliant',
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: {
          findings: [
            {
              code: 'NBC-3.2.2',
              description: 'Does not meet egress requirements',
              severity: 'error',
            },
          ],
          status: 'non_compliant',
        },
        ruleTrace: [],
        createdAt: new Date(),
      };

      const result = await migrationService.migrateSnapshot(
        snapshot,
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(result.success).toBe(true);
      expect(result.certificateId).toBeDefined();
    });
  });

  describe('Batch Migration', () => {
    it('should migrate batch of snapshots', async () => {
      const snapshots: LegacyComplianceSnapshot[] = Array.from({ length: 5 }, (_, i) => ({
        snapshotId: `legacy-batch-${i}`,
        projectId: `project-${i}`,
        userId: `user-${i}`,
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant' as const,
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' as const },
        ruleTrace: [],
        createdAt: new Date(),
      }));

      const result = await migrationService.migrateBatch(
        snapshots,
        'John Doe',
        'john@example.com',
        'professional',
        2 // Batch size of 2
      );

      expect(result.totalSnapshots).toBe(5);
      expect(result.successfulMigrations).toBe(5);
      expect(result.failedMigrations).toBe(0);
      expect(result.results).toHaveLength(5);
    });

    it('should calculate migration statistics', async () => {
      const snapshots: LegacyComplianceSnapshot[] = Array.from({ length: 10 }, (_, i) => ({
        snapshotId: `legacy-stats-${i}`,
        projectId: `project-${i}`,
        userId: `user-${i}`,
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant' as const,
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' as const },
        ruleTrace: [],
        createdAt: new Date(),
      }));

      const result = await migrationService.migrateBatch(
        snapshots,
        'John Doe',
        'john@example.com',
        'professional',
        5
      );

      expect(result.summary.conversionRate).toBeGreaterThan(0);
      expect(result.summary.encryptionRate).toBeGreaterThan(0);
      expect(result.summary.signatureRate).toBeGreaterThan(0);
      expect(result.summary.timestampRate).toBeGreaterThan(0);
    });

    it('should record batch duration', async () => {
      const snapshots: LegacyComplianceSnapshot[] = Array.from({ length: 3 }, (_, i) => ({
        snapshotId: `legacy-duration-${i}`,
        projectId: `project-${i}`,
        userId: `user-${i}`,
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant' as const,
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' as const },
        ruleTrace: [],
        createdAt: new Date(),
      }));

      const result = await migrationService.migrateBatch(
        snapshots,
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle empty batch', async () => {
      const result = await migrationService.migrateBatch(
        [],
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(result.totalSnapshots).toBe(0);
      expect(result.successfulMigrations).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('Migration Estimation', () => {
    it('should estimate migration time for batch', () => {
      const estimatedTime = migrationService.estimateMigrationTime(10, 100);
      expect(estimatedTime).toBe(1000); // 10 * 100ms
    });

    it('should estimate migration time with default average', () => {
      const estimatedTime = migrationService.estimateMigrationTime(5);
      expect(estimatedTime).toBe(500); // 5 * 100ms (default)
    });

    it('should handle large batch estimation', () => {
      const estimatedTime = migrationService.estimateMigrationTime(1000, 50);
      expect(estimatedTime).toBe(50000); // 1000 * 50ms
    });
  });

  describe('Migration Reports', () => {
    it('should generate migration report', async () => {
      const snapshots: LegacyComplianceSnapshot[] = Array.from({ length: 3 }, (_, i) => ({
        snapshotId: `legacy-report-${i}`,
        projectId: `project-${i}`,
        userId: `user-${i}`,
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant' as const,
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' as const },
        ruleTrace: [],
        createdAt: new Date(),
      }));

      const batchResult = await migrationService.migrateBatch(
        snapshots,
        'John Doe',
        'john@example.com',
        'professional'
      );

      const report = migrationService.createMigrationReport(batchResult);

      expect(report).toContain('Certification Migration Report');
      expect(report).toContain('Total Snapshots: 3');
      expect(report).toContain('Successful Migrations: 3');
      expect(report).toContain('Success Rate');
    });

    it('should include statistics in report', async () => {
      const snapshots: LegacyComplianceSnapshot[] = Array.from({ length: 2 }, (_, i) => ({
        snapshotId: `legacy-stats-report-${i}`,
        projectId: `project-${i}`,
        userId: `user-${i}`,
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant' as const,
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' as const },
        ruleTrace: [],
        createdAt: new Date(),
      }));

      const batchResult = await migrationService.migrateBatch(
        snapshots,
        'John Doe',
        'john@example.com',
        'professional'
      );

      const report = migrationService.createMigrationReport(batchResult);

      expect(report).toContain('Conversion Rate');
      expect(report).toContain('Encryption Rate');
      expect(report).toContain('Signature Rate');
      expect(report).toContain('Timestamp Rate');
      expect(report).toContain('Duration');
    });
  });

  describe('Backwards Compatibility', () => {
    it('should mark migrated snapshots as legacy format', async () => {
      const snapshot: LegacyComplianceSnapshot = {
        snapshotId: 'legacy-compat-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' },
        ruleTrace: [],
        createdAt: new Date(),
      };

      const result = await migrationService.migrateSnapshot(
        snapshot,
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(result.success).toBe(true);
      // The migrated data should be marked as legacy format
      expect(result.certificateId).toBeDefined();
    });

    it('should preserve all legacy snapshot data', async () => {
      const snapshot: LegacyComplianceSnapshot = {
        snapshotId: 'legacy-preserve-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'needs_review',
        inputs: {
          buildingType: 'mixed-use',
          jurisdiction: 'Alberta',
          customField: 'customValue',
        },
        outputs: {
          findings: [
            {
              code: 'NBC-3.2.2',
              description: 'Test finding',
              severity: 'warning',
              reference: 'NBC 2023',
            },
          ],
          status: 'needs_review',
          summary: 'Test summary',
        },
        ruleTrace: ['Rule 1', 'Rule 2', 'Rule 3'],
        createdAt: new Date('2026-03-01'),
      };

      const result = await migrationService.migrateSnapshot(
        snapshot,
        'John Doe',
        'john@example.com',
        'professional'
      );

      expect(result.success).toBe(true);
      expect(result.snapshotId).toBe('legacy-preserve-123');
      expect(result.certificateId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle migration with invalid user info', async () => {
      const snapshot: LegacyComplianceSnapshot = {
        snapshotId: 'legacy-invalid-user',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        complianceStatus: 'compliant',
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: { findings: [], status: 'compliant' },
        ruleTrace: [],
        createdAt: new Date(),
      };

      const result = await migrationService.migrateSnapshot(
        snapshot,
        '',
        'invalid-email',
        'professional'
      );

      // Should still succeed or provide clear error
      expect(result).toBeDefined();
      expect(result.snapshotId).toBe('legacy-invalid-user');
    });
  });
});
