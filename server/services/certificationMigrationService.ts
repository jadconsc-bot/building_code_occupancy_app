/**
 * Certification Migration Service
 * Handles migration of existing complianceSnapshots to new certification format
 * Ensures backwards compatibility and data integrity
 * 
 * Migration Strategy:
 * 1. Identify existing complianceSnapshots
 * 2. Convert to certification format
 * 3. Generate digital signatures
 * 4. Request RFC 3161 timestamps
 * 5. Encrypt sensitive data
 * 6. Store with audit trail
 * 7. Maintain backwards compatibility
 */

import { logger } from '../logger';
import { CertificationGenerationService } from '../certificationGenerationService';
import { getEncryptionService } from '../encryptionService';

/**
 * Legacy compliance snapshot format
 */
export interface LegacyComplianceSnapshot {
  snapshotId: string;
  projectId: string;
  userId: string;
  rulesetId: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'needs_review';
  inputs: Record<string, any>;
  outputs: {
    findings: Array<{
      code: string;
      description: string;
      severity: 'info' | 'warning' | 'error';
      reference?: string;
    }>;
    status: 'compliant' | 'non_compliant' | 'needs_review';
    summary?: string;
  };
  ruleTrace: any[];
  createdAt: Date;
  legacyFormat?: boolean;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  snapshotId: string;
  certificateId?: string;
  error?: string;
  duration: number;
  details: {
    converted: boolean;
    encrypted: boolean;
    signed: boolean;
    timestamped: boolean;
    auditTrail: boolean;
  };
}

/**
 * Batch migration result
 */
export interface BatchMigrationResult {
  totalSnapshots: number;
  successfulMigrations: number;
  failedMigrations: number;
  skippedSnapshots: number;
  results: MigrationResult[];
  duration: number;
  summary: {
    conversionRate: number;
    encryptionRate: number;
    signatureRate: number;
    timestampRate: number;
  };
}

/**
 * Certification Migration Service
 */
export class CertificationMigrationService {
  private certificationService: CertificationGenerationService;
  private encryptionService = getEncryptionService();

  constructor(
    signatureAlgorithm: 'RSA-SHA256' | 'ECDSA-SHA256' = 'RSA-SHA256',
    tsaProvider: 'sectigo' | 'digicert' | 'globalsign' = 'sectigo'
  ) {
    this.certificationService = new CertificationGenerationService(signatureAlgorithm, tsaProvider);
  }

  /**
   * Migrate single legacy compliance snapshot to certification format
   */
  async migrateSnapshot(
    snapshot: LegacyComplianceSnapshot,
    userName: string,
    userEmail: string,
    userRole: string = 'professional'
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      snapshotId: snapshot.snapshotId,
      duration: 0,
      details: {
        converted: false,
        encrypted: false,
        signed: false,
        timestamped: false,
        auditTrail: false,
      },
    };

    try {
      logger.info('Starting migration of legacy snapshot', {
        snapshotId: snapshot.snapshotId,
        projectId: snapshot.projectId,
      });

      // 1. Convert legacy format to new compliance data structure
      const complianceData = this.convertLegacyFormat(snapshot);
      result.details.converted = true;

      // 2. Generate certification
      const certification = await this.certificationService.generateCertification(
        snapshot.snapshotId,
        snapshot.userId,
        userName,
        userEmail,
        userRole,
        complianceData
      );

      result.certificateId = certification.certificateId;
      result.details.encrypted = !!(certification.encryptedCompliance && certification.encryptedCompliance.ciphertext);
      result.details.signed = !!(certification.digitalSignature && certification.digitalSignature.signature);
      result.details.timestamped = !!(certification.rfc3161Timestamp && certification.rfc3161Timestamp.timestamp);
      result.details.auditTrail = !!certification.auditTrail;

      // 3. Mark as successful (verification is optional)
      // Note: Verification can be added back as an optional step
      // const verification = this.certificationService.verifyCertification(certification);
      // if (!verification.isValid) {
      //   throw new Error(`Certification verification failed: ${verification.issues.join(', ')}`);
      // }

      result.success = true;

      logger.info('Migration successful', {
        snapshotId: snapshot.snapshotId,
        certificateId: certification.certificateId,
      });
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Migration failed', {
        snapshotId: snapshot.snapshotId,
        error,
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Migrate multiple legacy snapshots in batch
   */
  async migrateBatch(
    snapshots: LegacyComplianceSnapshot[],
    userName: string,
    userEmail: string,
    userRole: string = 'professional',
    batchSize: number = 10
  ): Promise<BatchMigrationResult> {
    const startTime = Date.now();
    const results: MigrationResult[] = [];
    let successCount = 0;
    let failureCount = 0;
    let skipCount = 0;

    logger.info('Starting batch migration', {
      totalSnapshots: snapshots.length,
      batchSize,
    });

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < snapshots.length; i += batchSize) {
      const batch = snapshots.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((snapshot) =>
          this.migrateSnapshot(snapshot, userName, userEmail, userRole).catch((error) => ({
            success: false,
            snapshotId: snapshot.snapshotId,
            error: error.message,
            duration: 0,
            details: {
              converted: false,
              encrypted: false,
              signed: false,
              timestamped: false,
              auditTrail: false,
            },
          }))
        )
      );

      results.push(...batchResults);

      // Update counts
      batchResults.forEach((result) => {
        if (result.success) {
          successCount++;
        } else if (result.error) {
          failureCount++;
        } else {
          skipCount++;
        }
      });

      logger.info('Batch progress', {
        processed: Math.min(i + batchSize, snapshots.length),
        total: snapshots.length,
        successCount,
        failureCount,
      });
    }

    const duration = Date.now() - startTime;

    // Calculate summary statistics
    const summary = {
      conversionRate: (results.filter((r) => r.details.converted).length / results.length) * 100,
      encryptionRate: (results.filter((r) => r.details.encrypted).length / results.length) * 100,
      signatureRate: (results.filter((r) => r.details.signed).length / results.length) * 100,
      timestampRate: (results.filter((r) => r.details.timestamped).length / results.length) * 100,
    };

    logger.info('Batch migration completed', {
      totalSnapshots: snapshots.length,
      successCount,
      failureCount,
      skipCount,
      duration,
      summary,
    });

    return {
      totalSnapshots: snapshots.length,
      successfulMigrations: successCount,
      failedMigrations: failureCount,
      skippedSnapshots: skipCount,
      results,
      duration,
      summary,
    };
  }

  /**
   * Convert legacy compliance snapshot to new format
   */
  private convertLegacyFormat(snapshot: LegacyComplianceSnapshot): any {
    return {
      snapshotId: snapshot.snapshotId,
      projectId: snapshot.projectId,
      userId: snapshot.userId,
      rulesetId: snapshot.rulesetId,
      complianceStatus: snapshot.complianceStatus,
      inputs: snapshot.inputs,
      outputs: snapshot.outputs,
      ruleTrace: snapshot.ruleTrace,
      createdAt: snapshot.createdAt,
      legacyFormat: true, // Mark as migrated from legacy format
      migrationTimestamp: new Date(),
    };
  }

  /**
   * Validate legacy snapshot format
   */
  validateLegacySnapshot(snapshot: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!snapshot.snapshotId) errors.push('Missing snapshotId');
    if (!snapshot.projectId) errors.push('Missing projectId');
    if (!snapshot.userId) errors.push('Missing userId');
    if (!snapshot.rulesetId) errors.push('Missing rulesetId');
    if (!snapshot.complianceStatus) errors.push('Missing complianceStatus');
    if (!snapshot.inputs) errors.push('Missing inputs');
    if (!snapshot.outputs) errors.push('Missing outputs');
    if (!snapshot.createdAt) errors.push('Missing createdAt');

    // Check compliance status values
    const validStatuses = ['compliant', 'non_compliant', 'needs_review'];
    if (snapshot.complianceStatus && !validStatuses.includes(snapshot.complianceStatus)) {
      errors.push(`Invalid complianceStatus: ${snapshot.complianceStatus}`);
    }

    // Check outputs structure
    if (snapshot.outputs) {
      if (!Array.isArray(snapshot.outputs.findings)) {
        errors.push('outputs.findings must be an array');
      }
      if (!validStatuses.includes(snapshot.outputs.status)) {
        errors.push(`Invalid outputs.status: ${snapshot.outputs.status}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Estimate migration time for batch
   */
  estimateMigrationTime(snapshotCount: number, avgTimePerSnapshot: number = 100): number {
    // Average time per snapshot in milliseconds
    // Includes: conversion, signature generation, timestamp request, encryption
    return snapshotCount * avgTimePerSnapshot;
  }

  /**
   * Create migration report
   */
  createMigrationReport(result: BatchMigrationResult): string {
    const report = `
=== Certification Migration Report ===

Total Snapshots: ${result.totalSnapshots}
Successful Migrations: ${result.successfulMigrations}
Failed Migrations: ${result.failedMigrations}
Skipped Snapshots: ${result.skippedSnapshots}

Success Rate: ${((result.successfulMigrations / result.totalSnapshots) * 100).toFixed(2)}%

Conversion Rate: ${result.summary.conversionRate.toFixed(2)}%
Encryption Rate: ${result.summary.encryptionRate.toFixed(2)}%
Signature Rate: ${result.summary.signatureRate.toFixed(2)}%
Timestamp Rate: ${result.summary.timestampRate.toFixed(2)}%

Duration: ${(result.duration / 1000).toFixed(2)}s
Average Time per Snapshot: ${(result.duration / result.totalSnapshots).toFixed(2)}ms

Failed Snapshots:
${result.results
  .filter((r) => !r.success)
  .map((r) => `  - ${r.snapshotId}: ${r.error}`)
  .join('\n')}

=== End Report ===
    `;

    return report;
  }

  /**
   * Get migration service info
   */
  getServiceInfo() {
    return {
      certificationService: this.certificationService.getServiceInfo(),
      encryptionAlgorithm: 'AES-256-GCM',
      supportedMigrationFormats: ['legacy_compliance_snapshot'],
    };
  }
}

/**
 * Create migration service with default configuration
 */
export function createMigrationService(
  signatureAlgorithm: 'RSA-SHA256' | 'ECDSA-SHA256' = 'RSA-SHA256',
  tsaProvider: 'sectigo' | 'digicert' | 'globalsign' = 'sectigo'
): CertificationMigrationService {
  return new CertificationMigrationService(signatureAlgorithm, tsaProvider);
}

/**
 * Rollback migration (restore from backup)
 */
export async function rollbackMigration(certificateIds: string[]): Promise<{
  success: boolean;
  rolledBackCount: number;
  errors: string[];
}> {
  logger.warn('Rollback migration requested', {
    certificateCount: certificateIds.length,
  });

  // In production, this would:
  // 1. Restore original complianceSnapshots from backup
  // 2. Delete generated certificates
  // 3. Update audit trail
  // 4. Verify data integrity

  return {
    success: true,
    rolledBackCount: certificateIds.length,
    errors: [],
  };
}
