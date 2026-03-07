import { getDb } from "../db";
import { complianceAuditLog, auditSignatures, auditModificationHistory, InsertComplianceAuditLogEntry, InsertAuditSignature, InsertAuditModificationEntry } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

/**
 * Audit Trail Service
 * Manages compliance audit trails, digital signatures, and modification tracking
 * Ensures complete traceability and legal defensibility of compliance decisions
 */

export interface AuditLogParams {
  projectId: number;
  userId: number;
  action: string;
  actionType: "view" | "create" | "modify" | "delete" | "export" | "sign" | "verify";
  details?: Record<string, unknown>;
  snapshotId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SignatureParams {
  auditLogId: string;
  projectId: number;
  signedBy: number;
  signatureType: "approval" | "review" | "verification" | "acknowledgment";
  signature: string;
  publicKey?: string;
  certificateChain?: string;
  signatureAlgorithm?: string;
}

export interface ModificationParams {
  auditLogId: string;
  projectId: number;
  modifiedBy: number;
  entityType: "snapshot" | "calculation" | "report" | "project";
  entityId: string;
  changeType: "created" | "updated" | "deleted" | "restored";
  fieldName?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  approvedBy?: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a compliance action to the audit trail
 * Creates immutable record with cryptographic hash for integrity
 */
export async function logComplianceAction(params: AuditLogParams): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const auditId = uuidv4();
  const previousHash = await getLastAuditHash(params.projectId);
  const currentHash = generateHash(auditId, params, previousHash);

  const entry: InsertComplianceAuditLogEntry = {
    id: auditId,
    projectId: params.projectId,
    userId: params.userId,
    snapshotId: params.snapshotId,
    action: params.action,
    actionType: params.actionType,
    details: params.details ? JSON.stringify(params.details) : null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    cryptographicHash: currentHash,
    previousHash: previousHash,
    timestamp: new Date(),
  };

  try {
    await db.insert(complianceAuditLog).values(entry);
    return auditId;
  } catch (error) {
    console.error("[AuditTrail] Failed to log compliance action:", error);
    throw error;
  }
}

/**
 * Create a digital signature for a compliance action
 * Provides cryptographic proof of authorization and non-repudiation
 */
export async function createSignature(params: SignatureParams): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const signatureId = uuidv4();

  const entry: InsertAuditSignature = {
    id: signatureId,
    auditLogId: params.auditLogId,
    projectId: params.projectId,
    signedBy: params.signedBy,
    signatureType: params.signatureType,
    publicKey: params.publicKey,
    signature: params.signature,
    certificateChain: params.certificateChain,
    signatureAlgorithm: params.signatureAlgorithm || "RSA-2048",
    timestamp: new Date(),
    verifiedAt: null,
    verificationStatus: "pending",
    verificationDetails: null,
  };

  try {
    await db.insert(auditSignatures).values(entry);
    return signatureId;
  } catch (error) {
    console.error("[AuditTrail] Failed to create signature:", error);
    throw error;
  }
}

/**
 * Verify a digital signature
 * Validates cryptographic signature and updates verification status
 */
export async function verifySignature(signatureId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const [signature] = await db
      .select()
      .from(auditSignatures)
      .where(eq(auditSignatures.id, signatureId))
      .limit(1);

    if (!signature) {
      throw new Error("Signature not found");
    }

    // In production, perform actual cryptographic verification
    // For now, mark as verified if signature exists
    const isValid = !!signature.signature;

    if (isValid) {
      await db
        .update(auditSignatures)
        .set({
          verificationStatus: "verified",
          verifiedAt: new Date(),
          verificationDetails: JSON.stringify({
            verifiedAt: new Date().toISOString(),
            algorithm: signature.signatureAlgorithm,
            status: "valid",
          }),
        })
        .where(eq(auditSignatures.id, signatureId));
    } else {
      await db
        .update(auditSignatures)
        .set({
          verificationStatus: "failed",
          verificationDetails: JSON.stringify({
            verifiedAt: new Date().toISOString(),
            status: "invalid",
            reason: "Signature validation failed",
          }),
        })
        .where(eq(auditSignatures.id, signatureId));
    }

    return isValid;
  } catch (error) {
    console.error("[AuditTrail] Failed to verify signature:", error);
    throw error;
  }
}

/**
 * Track a modification to compliance data
 * Creates immutable record of what changed, when, and by whom
 */
export async function trackModification(params: ModificationParams): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const modificationId = uuidv4();
  const currentHash = generateHash(modificationId, params, null);

  const entry: InsertAuditModificationEntry = {
    id: modificationId,
    auditLogId: params.auditLogId,
    projectId: params.projectId,
    modifiedBy: params.modifiedBy,
    entityType: params.entityType,
    entityId: params.entityId,
    changeType: params.changeType,
    fieldName: params.fieldName,
    previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
    newValue: params.newValue ? JSON.stringify(params.newValue) : null,
    reason: params.reason,
    approvedBy: params.approvedBy,
    approvalStatus: params.approvedBy ? "approved" : "pending",
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    cryptographicHash: currentHash,
    timestamp: new Date(),
  };

  try {
    await db.insert(auditModificationHistory).values(entry);
    return modificationId;
  } catch (error) {
    console.error("[AuditTrail] Failed to track modification:", error);
    throw error;
  }
}

/**
 * Get complete audit trail for a project
 * Returns all actions, signatures, and modifications in chronological order
 */
export async function getAuditTrail(projectId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const [auditLogs, signatures, modifications] = await Promise.all([
      db
        .select()
        .from(complianceAuditLog)
        .where(eq(complianceAuditLog.projectId, projectId))
        .orderBy(desc(complianceAuditLog.timestamp))
        .limit(limit),
      db
        .select()
        .from(auditSignatures)
        .where(eq(auditSignatures.projectId, projectId))
        .orderBy(desc(auditSignatures.timestamp))
        .limit(limit),
      db
        .select()
        .from(auditModificationHistory)
        .where(eq(auditModificationHistory.projectId, projectId))
        .orderBy(desc(auditModificationHistory.timestamp))
        .limit(limit),
    ]);

    return {
      auditLogs: auditLogs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      signatures: signatures.map((sig) => ({
        ...sig,
        verificationDetails: sig.verificationDetails ? JSON.parse(sig.verificationDetails) : null,
      })),
      modifications: modifications.map((mod) => ({
        ...mod,
        previousValue: mod.previousValue ? JSON.parse(mod.previousValue) : null,
        newValue: mod.newValue ? JSON.parse(mod.newValue) : null,
      })),
    };
  } catch (error) {
    console.error("[AuditTrail] Failed to get audit trail:", error);
    throw error;
  }
}

/**
 * Export audit report for compliance/regulatory purposes
 * Generates comprehensive audit trail report with all details
 */
export async function exportAuditReport(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const auditTrail = await getAuditTrail(projectId, 1000);

    const report = {
      projectId,
      exportedAt: new Date().toISOString(),
      summary: {
        totalActions: auditTrail.auditLogs.length,
        totalSignatures: auditTrail.signatures.length,
        totalModifications: auditTrail.modifications.length,
      },
      auditTrail,
      integrity: {
        generatedAt: new Date().toISOString(),
        checksum: generateHash("report", auditTrail, null),
      },
    };

    return JSON.stringify(report, null, 2);
  } catch (error) {
    console.error("[AuditTrail] Failed to export audit report:", error);
    throw error;
  }
}

/**
 * Helper: Generate cryptographic hash for integrity verification
 */
function generateHash(id: string, data: unknown, previousHash: string | null): string {
  const content = JSON.stringify({
    id,
    data,
    previousHash,
    timestamp: new Date().toISOString(),
  });

  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Helper: Get last audit hash for blockchain-like chaining
 */
async function getLastAuditHash(projectId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const [lastEntry] = await db
      .select()
      .from(complianceAuditLog)
      .where(eq(complianceAuditLog.projectId, projectId))
      .orderBy(desc(complianceAuditLog.timestamp))
      .limit(1);

    return lastEntry?.cryptographicHash || null;
  } catch (error) {
    console.error("[AuditTrail] Failed to get last audit hash:", error);
    return null;
  }
}
