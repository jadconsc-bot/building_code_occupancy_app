/**
 * ImmutabilityGuard Service
 * 
 * Enforces immutability of audit trail records at the application layer.
 * This ensures legal defensibility by preventing modification or deletion of audit events.
 * 
 * Why Application-Layer Enforcement?
 * - Works on ANY database (MySQL, TiDB, PostgreSQL, SQLite)
 * - Fully auditable in version control
 * - Unit testable with comprehensive coverage
 * - Rich error logging and context
 * - Legally defensible with code proof
 */

import { logger } from "../logger";
import { db } from "../db";
import { complianceAuditTrail, disclaimerAcknowledgments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Error thrown when attempting to modify an immutable record
 */
export class ImmutabilityViolationError extends Error {
  constructor(
    public readonly table: string,
    public readonly recordId: number,
    public readonly operation: "UPDATE" | "DELETE",
    public readonly userId: number,
    public readonly reason: string
  ) {
    super(
      `Immutability violation: Cannot ${operation} ${table} record #${recordId}. ${reason}`
    );
    this.name = "ImmutabilityViolationError";
  }
}

/**
 * Check if a record is immutable
 * Returns true if record is locked, false if it can be modified
 */
async function checkImmutability(
  table: "complianceAuditTrail" | "disclaimerAcknowledgments",
  recordId: number
): Promise<boolean> {
  try {
    if (table === "complianceAuditTrail") {
      const record = await (db as any).query.complianceAuditTrail.findFirst({
        where: eq(complianceAuditTrail.id, recordId),
      });
      return record?.isImmutable ?? true; // Default to immutable if not found
    } else if (table === "disclaimerAcknowledgments") {
      const record = await (db as any).query.disclaimerAcknowledgments.findFirst({
        where: eq(disclaimerAcknowledgments.id, recordId),
      });
      return record?.isImmutable ?? true; // Default to immutable if not found
    }
    return true; // Default to immutable
  } catch (error) {
    logger.error("❌ [ImmutabilityGuard] Failed to check immutability", {
      table,
      recordId,
      error: error instanceof Error ? error.message : String(error),
    });
    // On error, assume immutable (fail-safe)
    return true;
  }
}

/**
 * Guard UPDATE operations on audit trail
 * Throws ImmutabilityViolationError if record is immutable
 */
export async function guardAuditUpdate(
  table: "complianceAuditTrail" | "disclaimerAcknowledgments",
  recordId: number,
  userId: number
): Promise<void> {
  const isImmutable = await checkImmutability(table, recordId);

  if (isImmutable) {
    logger.warn("🔒 [ImmutabilityGuard] UPDATE blocked on immutable record", {
      table,
      recordId,
      userId,
      operation: "UPDATE",
    });

    throw new ImmutabilityViolationError(
      table,
      recordId,
      "UPDATE",
      userId,
      "Audit trail records are immutable and cannot be modified"
    );
  }

  logger.info("✅ [ImmutabilityGuard] UPDATE allowed on mutable record", {
    table,
    recordId,
    userId,
  });
}

/**
 * Guard DELETE operations on audit trail
 * Throws ImmutabilityViolationError if record is immutable
 */
export async function guardAuditDelete(
  table: "complianceAuditTrail" | "disclaimerAcknowledgments",
  recordId: number,
  userId: number
): Promise<void> {
  const isImmutable = await checkImmutability(table, recordId);

  if (isImmutable) {
    logger.warn("🔒 [ImmutabilityGuard] DELETE blocked on immutable record", {
      table,
      recordId,
      userId,
      operation: "DELETE",
    });

    throw new ImmutabilityViolationError(
      table,
      recordId,
      "DELETE",
      userId,
      "Audit trail records are immutable and cannot be deleted"
    );
  }

  logger.info("✅ [ImmutabilityGuard] DELETE allowed on mutable record", {
    table,
    recordId,
    userId,
  });
}

/**
 * Verify immutability is enforced
 * Used for testing and verification
 */
export async function verifyImmutability(
  table: "complianceAuditTrail" | "disclaimerAcknowledgments",
  recordId: number
): Promise<{
  isImmutable: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}> {
  const isImmutable = await checkImmutability(table, recordId);

  return {
    isImmutable,
    canUpdate: !isImmutable,
    canDelete: !isImmutable,
  };
}

/**
 * Make a record mutable (admin only - for corrections)
 * This should only be called in exceptional circumstances
 */
export async function unlockRecord(
  table: "complianceAuditTrail" | "disclaimerAcknowledgments",
  recordId: number,
  adminUserId: number,
  reason: string
): Promise<void> {
  logger.warn("⚠️ [ImmutabilityGuard] UNLOCKING immutable record", {
    table,
    recordId,
    adminUserId,
    reason,
  });

  try {
    if (table === "complianceAuditTrail") {
      await (db as any)
        .update(complianceAuditTrail)
        .set({ isImmutable: false })
        .where(eq(complianceAuditTrail.id, recordId));
    } else if (table === "disclaimerAcknowledgments") {
      await (db as any)
        .update(disclaimerAcknowledgments)
        .set({ isImmutable: false })
        .where(eq(disclaimerAcknowledgments.id, recordId));
    }

    logger.info("✅ [ImmutabilityGuard] Record unlocked", {
      table,
      recordId,
      adminUserId,
      reason,
    });
  } catch (error) {
    logger.error("❌ [ImmutabilityGuard] Failed to unlock record", {
      table,
      recordId,
      adminUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Lock a record as immutable (should be default, but can be explicit)
 */
export async function lockRecord(
  table: "complianceAuditTrail" | "disclaimerAcknowledgments",
  recordId: number
): Promise<void> {
  try {
    if (table === "complianceAuditTrail") {
      await (db as any)
        .update(complianceAuditTrail)
        .set({ isImmutable: true })
        .where(eq(complianceAuditTrail.id, recordId));
    } else if (table === "disclaimerAcknowledgments") {
      await (db as any)
        .update(disclaimerAcknowledgments)
        .set({ isImmutable: true })
        .where(eq(disclaimerAcknowledgments.id, recordId));
    }

    logger.info("🔒 [ImmutabilityGuard] Record locked", {
      table,
      recordId,
    });
  } catch (error) {
    logger.error("❌ [ImmutabilityGuard] Failed to lock record", {
      table,
      recordId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
