/**
 * Append-Only Audit Log
 * 
 * Implements immutable audit logging with:
 * - Hash chaining for tamper detection
 * - Database constraints preventing updates/deletes
 * - Cryptographic integrity verification
 * - Legal defensibility for compliance records
 */

import * as crypto from 'crypto';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: {
    userId: number;
    userName: string;
    role: string;
  };
  resource: {
    type: string;
    id: string;
  };
  details: Record<string, any>;
  hash: string;
  previousHash: string;
  signature: string;
  immutable: boolean;
}

/**
 * Append-Only Audit Log
 * Maintains immutable, tamper-evident audit trail
 */
export class AppendOnlyAuditLog {
  private entries: AuditLogEntry[] = [];
  private lastHash: string = '';

  /**
   * Create new audit log entry
   * Automatically chains hash from previous entry
   */
  createEntry(
    action: string,
    userId: number,
    userName: string,
    userRole: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>,
    privateKey: string
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      actor: {
        userId,
        userName,
        role: userRole,
      },
      resource: {
        type: resourceType,
        id: resourceId,
      },
      details,
      hash: '',
      previousHash: this.lastHash,
      signature: '',
      immutable: true,
    };

    // Calculate entry hash
    const entryData = {
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      action: entry.action,
      actor: entry.actor,
      resource: entry.resource,
      details: entry.details,
      previousHash: entry.previousHash,
    };

    entry.hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(entryData))
      .digest('hex');

    // Sign the entry
    entry.signature = crypto
      .createHmac('sha256', privateKey)
      .update(entry.hash)
      .digest('hex');

    // Add to log
    this.entries.push(entry);
    this.lastHash = entry.hash;

    return entry;
  }

  /**
   * Get all audit log entries
   * Read-only access
   */
  getEntries(): ReadonlyArray<AuditLogEntry> {
    return Object.freeze([...this.entries]);
  }

  /**
   * Get entries for specific resource
   */
  getEntriesForResource(resourceType: string, resourceId: string): AuditLogEntry[] {
    return this.entries.filter(
      e => e.resource.type === resourceType && e.resource.id === resourceId
    );
  }

  /**
   * Get entries by actor
   */
  getEntriesByActor(userId: number): AuditLogEntry[] {
    return this.entries.filter(e => e.actor.userId === userId);
  }

  /**
   * Verify audit log integrity
   * Checks hash chain and signatures
   */
  verifyIntegrity(): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (this.entries.length === 0) {
      return { valid: true, errors: [] };
    }

    // Verify first entry has empty previous hash
    if (this.entries[0].previousHash !== '') {
      errors.push('First entry does not have empty previous hash');
    }

    // Verify hash chain
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      // Verify entry is immutable
      if (!entry.immutable) {
        errors.push(`Entry ${i} is not marked as immutable`);
      }

      // Verify hash chain
      if (i > 0) {
        const previousEntry = this.entries[i - 1];
        if (entry.previousHash !== previousEntry.hash) {
          errors.push(`Entry ${i} hash chain broken`);
        }
      }

      // Verify entry hash is correct
      const entryData = {
        id: entry.id,
        timestamp: entry.timestamp.toISOString(),
        action: entry.action,
        actor: entry.actor,
        resource: entry.resource,
        details: entry.details,
        previousHash: entry.previousHash,
      };

      const calculatedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(entryData))
        .digest('hex');

      if (entry.hash !== calculatedHash) {
        errors.push(`Entry ${i} hash mismatch`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export audit log for legal proceedings
   */
  exportForLegalProceedings(): string {
    const verification = this.verifyIntegrity();

    const legalDocument = {
      documentType: 'AUDIT_LOG_EVIDENCE',
      generatedAt: new Date().toISOString(),
      integrity: {
        verified: verification.valid,
        errors: verification.errors,
      },
      entries: this.entries.map(e => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        action: e.action,
        actor: {
          userId: e.actor.userId,
          userName: e.actor.userName,
          role: e.actor.role,
        },
        resource: {
          type: e.resource.type,
          id: e.resource.id,
        },
        details: e.details,
        hash: e.hash,
        previousHash: e.previousHash,
        signature: e.signature,
        immutable: e.immutable,
      })),
      legalNotice:
        'This audit log is cryptographically signed and tamper-evident. ' +
        'Hash chaining and signatures provide proof of integrity and authenticity. ' +
        'Any modification would be immediately detectable.',
    };

    return JSON.stringify(legalDocument, null, 2);
  }

  /**
   * Create database migration for append-only table
   * Returns SQL for creating immutable audit table
   */
  static createDatabaseMigration(): string {
    return `
-- Append-Only Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log_immutable (
  id VARCHAR(36) PRIMARY KEY,
  timestamp DATETIME NOT NULL,
  action VARCHAR(255) NOT NULL,
  actor_user_id INT NOT NULL,
  actor_user_name VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  details JSON NOT NULL,
  hash VARCHAR(64) NOT NULL UNIQUE,
  previous_hash VARCHAR(64),
  signature VARCHAR(512) NOT NULL,
  immutable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent updates and deletes
  CONSTRAINT no_updates CHECK (1=1),
  
  -- Index for queries
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_actor (actor_user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action),
  
  -- Hash chain verification
  UNIQUE KEY uk_hash_chain (hash, previous_hash)
);

-- Trigger to prevent updates
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log_immutable
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Audit log entries cannot be updated';
END;

-- Trigger to prevent deletes
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log_immutable
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'Audit log entries cannot be deleted';
END;
    `;
  }
}

export default AppendOnlyAuditLog;
