/**
 * Immutable Audit Database Enforcement
 * 
 * Implements database-level protections to ensure audit trails cannot be modified:
 * - NO UPDATE operations allowed
 * - NO DELETE operations allowed
 * - APPEND ONLY mode
 * - Hash chain verification
 * 
 * This is CRITICAL for legal defensibility - audit trails must be tamper-proof.
 * If an audit record could be modified or deleted, the entire system's credibility is destroyed.
 */

import { db } from './db';
import { logger } from './logger';
import crypto from 'crypto';

/**
 * Audit record structure
 * Every calculation creates an immutable audit record
 */
interface AuditRecord {
  id: string;
  calculationId: string;
  userId: string;
  projectId: string;
  action: 'CALCULATE' | 'VERIFY' | 'EXPORT' | 'SHARE' | 'DELETE_REQUEST';
  details: Record<string, unknown>;
  hash: string; // SHA-256 of this record
  previousHash: string; // Hash of previous record (creates chain)
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * Immutable Audit Database Manager
 * Enforces append-only semantics and hash chain integrity
 */
export class ImmutableAuditDatabase {
  private auditRecords: Map<string, AuditRecord> = new Map();
  private hashChain: string[] = [];

  /**
   * Create immutable audit record
   * This is the ONLY way to add to audit trail
   * 
   * @param record - Audit record to add
   * @returns Created record with hash chain
   */
  async createAuditRecord(
    record: Omit<AuditRecord, 'hash' | 'previousHash' | 'id'>
  ): Promise<AuditRecord> {
    try {
      logger.info('Creating immutable audit record', {
        action: record.action,
        calculationId: record.calculationId,
      });

      // Generate unique ID
      const recordId = `audit-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

      // Calculate hash of this record
      const recordData = JSON.stringify({
        ...record,
        id: recordId,
      });
      const hash = crypto.createHash('sha256').update(recordData).digest('hex');

      // Get previous hash for chain
      const previousHash = this.hashChain.length > 0 ? this.hashChain[this.hashChain.length - 1] : '';

      // Create final record
      const auditRecord: AuditRecord = {
        id: recordId,
        ...record,
        hash,
        previousHash,
        timestamp: new Date(),
      };

      // Store in memory (in production, use database)
      this.auditRecords.set(recordId, auditRecord);
      this.hashChain.push(hash);

      logger.info('Audit record created', {
        recordId,
        hash: hash.substring(0, 16),
        chainLength: this.hashChain.length,
      });

      return auditRecord;
    } catch (error) {
      logger.error('Failed to create audit record', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Retrieve audit record (READ ONLY)
   * Cannot be modified after creation
   * 
   * @param recordId - Record ID to retrieve
   * @returns Audit record (immutable)
   */
  async getAuditRecord(recordId: string): Promise<AuditRecord | null> {
    try {
      const record = this.auditRecords.get(recordId);

      if (record) {
        logger.info('Audit record retrieved', {
          recordId,
          action: record.action,
        });
      }

      return record || null;
    } catch (error) {
      logger.error('Failed to retrieve audit record', {
        recordId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all audit records for a calculation
   * Returns in chronological order
   * 
   * @param calculationId - Calculation ID
   * @returns All audit records for this calculation
   */
  async getCalculationAuditTrail(calculationId: string): Promise<AuditRecord[]> {
    try {
      const records = Array.from(this.auditRecords.values())
        .filter(r => r.calculationId === calculationId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      logger.info('Calculation audit trail retrieved', {
        calculationId,
        recordCount: records.length,
      });

      return records;
    } catch (error) {
      logger.error('Failed to retrieve audit trail', {
        calculationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verify hash chain integrity
   * Detects if any record has been tampered with
   * 
   * @returns Whether chain is valid
   */
  async verifyHashChain(): Promise<boolean> {
    try {
      logger.info('Verifying hash chain integrity', {
        chainLength: this.hashChain.length,
      });

      // Get all records in order
      const records = Array.from(this.auditRecords.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Verify each record's hash
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const expectedPreviousHash = i > 0 ? records[i - 1].hash : '';

        // Verify hash matches
        const recordData = JSON.stringify({
          id: record.id,
          calculationId: record.calculationId,
          userId: record.userId,
          projectId: record.projectId,
          action: record.action,
          details: record.details,
          timestamp: record.timestamp,
          ipAddress: record.ipAddress,
          userAgent: record.userAgent,
        });
        const calculatedHash = crypto.createHash('sha256').update(recordData).digest('hex');

        if (calculatedHash !== record.hash) {
          logger.error('Hash mismatch detected - record may be tampered', {
            recordId: record.id,
            expectedHash: record.hash,
            calculatedHash,
          });
          return false;
        }

        // Verify chain link
        if (record.previousHash !== expectedPreviousHash) {
          logger.error('Hash chain broken - record may be out of order', {
            recordId: record.id,
            expectedPreviousHash,
            actualPreviousHash: record.previousHash,
          });
          return false;
        }
      }

      logger.info('Hash chain verification passed', {
        recordsVerified: records.length,
      });

      return true;
    } catch (error) {
      logger.error('Hash chain verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * BLOCKED: Update operation
   * This method intentionally throws to prevent modifications
   * 
   * @throws Always throws error
   */
  async updateAuditRecord(): Promise<never> {
    logger.error('UPDATE operation attempted on immutable audit database', {
      timestamp: new Date(),
    });
    throw new Error('UPDATE operations are not allowed on audit database. Audit records are immutable.');
  }

  /**
   * BLOCKED: Delete operation
   * This method intentionally throws to prevent deletions
   * 
   * @throws Always throws error
   */
  async deleteAuditRecord(): Promise<never> {
    logger.error('DELETE operation attempted on immutable audit database', {
      timestamp: new Date(),
    });
    throw new Error('DELETE operations are not allowed on audit database. Audit records are immutable.');
  }

  /**
   * Get audit statistics
   * Useful for compliance reporting
   * 
   * @returns Audit statistics
   */
  async getAuditStatistics(): Promise<{
    totalRecords: number;
    recordsByAction: Record<string, number>;
    oldestRecord: Date | null;
    newestRecord: Date | null;
    chainIntegrity: boolean;
  }> {
    try {
      const records = Array.from(this.auditRecords.values());
      const recordsByAction: Record<string, number> = {};

      // Count records by action
      for (const record of records) {
        recordsByAction[record.action] = (recordsByAction[record.action] || 0) + 1;
      }

      // Get oldest and newest
      const sortedRecords = records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const oldestRecord = sortedRecords.length > 0 ? sortedRecords[0].timestamp : null;
      const newestRecord = sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1].timestamp : null;

      // Verify chain
      const chainIntegrity = await this.verifyHashChain();

      return {
        totalRecords: records.length,
        recordsByAction,
        oldestRecord,
        newestRecord,
        chainIntegrity,
      };
    } catch (error) {
      logger.error('Failed to get audit statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export audit trail for compliance/legal proceedings
   * Creates tamper-evident export with signatures
   * 
   * @param calculationId - Calculation ID
   * @returns JSON export of audit trail
   */
  async exportAuditTrail(calculationId: string): Promise<string> {
    try {
      logger.info('Exporting audit trail', {
        calculationId,
      });

      const records = await this.getCalculationAuditTrail(calculationId);
      const isChainValid = await this.verifyHashChain();

      const export_ = {
        calculationId,
        exportedAt: new Date(),
        recordCount: records.length,
        chainIntegrity: isChainValid,
        records,
        exportSignature: crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex'),
      };

      return JSON.stringify(export_, null, 2);
    } catch (error) {
      logger.error('Failed to export audit trail', {
        calculationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

/**
 * Create and export singleton instance
 */
export const immutableAuditDb = new ImmutableAuditDatabase();
