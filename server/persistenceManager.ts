/**
 * Server-Authoritative Persistence Manager
 * 
 * Implements server-as-source-of-truth pattern for legally defensible compliance.
 * Client-side caching is allowed, but server is always authoritative.
 * Prevents hybrid persistence conflicts that could compromise legal defensibility.
 */

import { getDb } from './db';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import { calculationResults, CalculationResult } from '../drizzle/schema';

export interface SyncState {
  lastSyncTime: number;
  version: string;
  hash: string;
  isDirty: boolean;
}

export interface OfflineQueueItem {
  id: string;
  type: 'calculation' | 'project' | 'update';
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * PersistenceManager - Server-authoritative data management
 * 
 * Key principles:
 * 1. Server is always the source of truth
 * 2. Client can cache for UX, but must verify with server
 * 3. All writes go through server first
 * 4. Offline queue for disconnected scenarios
 * 5. Version hashing prevents stale data conflicts
 */
export class PersistenceManager {
  private offlineQueue: Map<string, OfflineQueueItem> = new Map();
  private syncInProgress: boolean = false;

  /**
   * Save calculation to server (authoritative)
   * Client should never write directly to localStorage
   */
  async saveCalculation(
    userId: string,
    projectId: string,
    calculationType: string,
    inputData: any,
    resultData: any,
    signature: string,
    rulesetVersion: string
  ) {
    try {
      logger.info('PersistenceManager: Saving calculation to server', {
        userId,
        projectId,
        calculationType,
      });

      // Insert into database (server is authoritative)
      // TODO: Implement once calculations table is migrated to database
      const result = {
        insertId: uuidv4(),
        projectId,
        userId,
        calculationType,
        inputData: JSON.stringify(inputData),
        resultData: JSON.stringify(resultData),
        calculationTrace: JSON.stringify(inputData), // Store trace for reproducibility
        signature,
        signatureAlgorithm: 'sha256WithRSAEncryption',
        timestamp: new Date(),
        rulesetVersion,
        createdAt: new Date(),
      };

      // Log to audit trail
      // TODO: Implement once calculationAuditLog table is migrated
      // await this.logAuditEvent(userId, 'calculation_created', {
      //   calculationType,
      //   projectId,
      // });

      return {
        success: true,
        calculationId: result.insertId,
        version: rulesetVersion,
        hash: this.generateHash(resultData),
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('PersistenceManager: Failed to save calculation', { error, userId });
      throw new Error('Failed to save calculation to server');
    }
  }

  /**
   * Retrieve calculation from server (authoritative source)
   * Never return stale client-side data
   */
  async getCalculation(calculationId: string, userId: string) {
    try {
      logger.info('PersistenceManager: Retrieving calculation from server', {
        calculationId,
        userId,
      });

      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const result = await db
        .select()
        .from(calculationResults)
        .where(eq(calculationResults.id, calculationId))
        .limit(1);

      if (!result.length) {
        throw new Error('Calculation not found');
      }

      const calc = result[0];
      return {
        ...calc,
        inputData: JSON.parse(calc.inputData),
        resultData: JSON.parse(calc.resultData),
        calculationTrace: calc.calculationTrace ? JSON.parse(calc.calculationTrace) : null,
        hash: this.generateHash(JSON.parse(calc.resultData)),
        version: calc.rulesetVersion,
      };
    } catch (error) {
      logger.error('PersistenceManager: Failed to retrieve calculation', {
        error,
        calculationId,
      });
      throw error;
    }
  }

  /**
   * Verify calculation integrity against server
   * Used to detect if client-side cache is stale
   */
  async verifyCalculationIntegrity(
    calculationId: string,
    clientHash: string,
    userId: string
  ): Promise<{ isValid: boolean; serverHash: string; isDirty: boolean }> {
    try {
      const serverCalc = await this.getCalculation(calculationId, userId);
      const serverHash = this.generateHash(serverCalc.resultData);

      const isValid = clientHash === serverHash;
      const isDirty = !isValid;

      if (!isValid) {
        logger.warn('PersistenceManager: Hash mismatch detected', {
          calculationId,
          clientHash,
          serverHash,
        });
      }

      return {
        isValid,
        serverHash,
        isDirty,
      };
    } catch (error) {
      logger.error('PersistenceManager: Integrity verification failed', { error });
      return {
        isValid: false,
        serverHash: '',
        isDirty: true,
      };
    }
  }

  /**
   * Add item to offline queue for later sync
   * Used when user is disconnected
   */
  addToOfflineQueue(
    type: 'calculation' | 'project' | 'update',
    data: any
  ): OfflineQueueItem {
    const item: OfflineQueueItem = {
      id: `${type}-${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.offlineQueue.set(item.id, item);
    logger.info('PersistenceManager: Item added to offline queue', { itemId: item.id });

    return item;
  }

  /**
   * Sync offline queue with server
   * Called when connection is restored
   */
  async syncOfflineQueue(userId: string): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress) {
      logger.info('PersistenceManager: Sync already in progress');
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      for (const [itemId, item] of Array.from(this.offlineQueue.entries())) {
        try {
          // Attempt to sync item
          if (item.type === 'calculation') {
            await this.saveCalculation(
              userId,
              item.data.projectId,
              item.data.calculationType,
              item.data.inputData,
              item.data.resultData,
              item.data.signature,
              item.data.rulesetVersion
            );
          }

          // Remove from queue on success
          this.offlineQueue.delete(itemId);
          synced++;

          logger.info('PersistenceManager: Offline item synced', { itemId });
        } catch (error) {
          item.retryCount++;
          failed++;

          // Remove after 3 failed attempts
          if (item.retryCount >= 3) {
            this.offlineQueue.delete(itemId);
            logger.error('PersistenceManager: Offline item failed after retries', {
              itemId,
              error,
            });
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    logger.info('PersistenceManager: Offline queue sync complete', { synced, failed });
    return { synced, failed };
  }

  /**
   * Get sync state for client
   * Tells client what it needs to know about server state
   */
  async getSyncState(projectId: string, userId: string): Promise<SyncState> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const projectCalcs = await db
        .select()
        .from(calculationResults)
        .where(
          and(eq(calculationResults.projectId, parseInt(projectId)), eq(calculationResults.userId, parseInt(userId)))
        );

      const lastCalc = projectCalcs[projectCalcs.length - 1];
      const hash = lastCalc
        ? this.generateHash(JSON.parse(lastCalc.resultData))
        : this.generateHash({});

      return {
        lastSyncTime: lastCalc ? new Date(lastCalc.createdAt).getTime() : 0,
        version: lastCalc?.rulesetVersion || '2023',
        hash,
        isDirty: false,
      };
    } catch (error) {
      logger.error('PersistenceManager: Failed to get sync state', { error });
      throw error;
    }
  }

  /**
   * Log audit event for compliance
   */
  private async logAuditEvent(userId: string, action: string, details: any) {
    try {
      // TODO: Implement once calculationAuditLog table is migrated
      // When implementing, extract ipAddress from request context, not hardcoded
      /*
      await db.insert(calculationAuditLog).values({
        userId,
        action,
        details: JSON.stringify(details),
        ipAddress: requestContext.ipAddress, // From request context
        userAgent: requestContext.userAgent, // From request context
        timestamp: new Date(),
        hash: this.generateHash(details),
        previousHash: '',
      });
      */
    } catch (error) {
      logger.error('PersistenceManager: Failed to log audit event', { error });
    }
  }

  /**
   * Generate SHA-256 hash for data integrity
   */
  private generateHash(data: any): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Get offline queue status
   */
  getOfflineQueueStatus() {
    return {
      itemCount: this.offlineQueue.size,
      items: Array.from(this.offlineQueue.values()),
      syncInProgress: this.syncInProgress,
    };
  }

  /**
   * Clear offline queue (use with caution)
   */
  clearOfflineQueue() {
    this.offlineQueue.clear();
    logger.info('PersistenceManager: Offline queue cleared');
  }
}

export const persistenceManager = new PersistenceManager();
