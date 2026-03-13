/**
 * Audit Trail System
 * Implements immutable audit trails with cryptographic integrity verification
 * for legal defensibility and professional liability protection
 */

import * as crypto from "crypto";

interface AuditEntry {
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  integrityHash: string;
  previousHash?: string;
}

/**
 * Generate cryptographic hash for audit entry
 * Creates tamper-evident record of audit trail
 */
export function generateIntegrityHash(
  entry: Omit<AuditEntry, "integrityHash">,
  previousHash?: string
): string {
  const hashInput = JSON.stringify({
    timestamp: entry.timestamp.toISOString(),
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    changes: entry.changes,
    previousHash: previousHash || "GENESIS",
  });

  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

/**
 * Verify integrity of audit entry
 * Ensures audit trail has not been tampered with
 */
export function verifyIntegrity(entry: AuditEntry, previousHash?: string): boolean {
  const expectedHash = generateIntegrityHash(
    {
      timestamp: entry.timestamp,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      changes: entry.changes,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      previousHash: previousHash,
    },
    previousHash
  );

  return entry.integrityHash === expectedHash;
}

/**
 * Create audit entry for compliance snapshot
 */
export function createComplianceAuditEntry(
  userId: string,
  snapshotId: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  rulesetId: string,
  mode: "strict" | "soft",
  previousHash?: string
): AuditEntry {
  const timestamp = new Date();

  const entry: Omit<AuditEntry, "integrityHash"> = {
    timestamp,
    userId,
    action: "COMPLIANCE_ANALYSIS",
    resourceType: "ComplianceSnapshot",
    resourceId: snapshotId,
    changes: {
      snapshotId,
      rulesetId,
      mode,
      inputCount: Object.keys(inputs).length,
      outputCount: Object.keys(outputs).length,
    },
    previousHash,
  };

  const integrityHash = generateIntegrityHash(entry, previousHash);

  return {
    ...entry,
    integrityHash,
  };
}

/**
 * Create audit entry for rule change
 */
export function createRuleChangeAuditEntry(
  userId: string,
  rulesetId: string,
  changeType: "added" | "modified" | "deprecated" | "removed",
  ruleId: string,
  clause: string,
  description: string,
  previousHash?: string
): AuditEntry {
  const timestamp = new Date();

  const entry: Omit<AuditEntry, "integrityHash"> = {
    timestamp,
    userId,
    action: "RULE_CHANGE",
    resourceType: "Ruleset",
    resourceId: rulesetId,
    changes: {
      changeType,
      ruleId,
      clause,
      description,
    },
    previousHash,
  };

  const integrityHash = generateIntegrityHash(entry, previousHash);

  return {
    ...entry,
    integrityHash,
  };
}

/**
 * Create audit entry for snapshot verification
 */
export function createVerificationAuditEntry(
  userId: string,
  snapshotId: string,
  verified: boolean,
  verificationNotes?: string,
  previousHash?: string
): AuditEntry {
  const timestamp = new Date();

  const entry: Omit<AuditEntry, "integrityHash"> = {
    timestamp,
    userId,
    action: "SNAPSHOT_VERIFICATION",
    resourceType: "ComplianceSnapshot",
    resourceId: snapshotId,
    changes: {
      verified,
      verificationNotes,
    },
    previousHash,
  };

  const integrityHash = generateIntegrityHash(entry, previousHash);

  return {
    ...entry,
    integrityHash,
  };
}

/**
 * Generate audit trail report for legal discovery
 */
export function generateAuditReport(entries: AuditEntry[]): string {
  const report: string[] = [];

  report.push("=".repeat(80));
  report.push("AUDIT TRAIL REPORT - LEGAL DISCOVERY");
  report.push("=".repeat(80));
  report.push("");
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push(`Total Entries: ${entries.length}`);
  report.push("");

  // Verify chain of custody
  let previousHash: string | undefined;
  let chainValid = true;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isValid = verifyIntegrity(entry, previousHash);

    if (!isValid) {
      chainValid = false;
    }

    report.push("-".repeat(80));
    report.push(`Entry ${i + 1}`);
    report.push(`Timestamp: ${entry.timestamp.toISOString()}`);
    report.push(`User: ${entry.userId}`);
    report.push(`Action: ${entry.action}`);
    report.push(`Resource: ${entry.resourceType}/${entry.resourceId}`);
    report.push(`Integrity Hash: ${entry.integrityHash}`);
    report.push(`Integrity Valid: ${isValid ? "✓ YES" : "✗ NO"}`);
    report.push(`Changes: ${JSON.stringify(entry.changes, null, 2)}`);
    report.push("");

    previousHash = entry.integrityHash;
  }

  report.push("=".repeat(80));
  report.push(`AUDIT TRAIL INTEGRITY: ${chainValid ? "✓ VALID" : "✗ COMPROMISED"}`);
  report.push("=".repeat(80));

  return report.join("\n");
}

/**
 * Export audit trail for legal proceedings
 */
export function exportAuditTrail(entries: AuditEntry[]): {
  report: string;
  json: string;
  csv: string;
} {
  const report = generateAuditReport(entries);

  const json = JSON.stringify(entries, null, 2);

  const csv = [
    "Timestamp,User,Action,Resource Type,Resource ID,Integrity Hash,Valid",
    ...entries.map((e) => {
      const isValid = verifyIntegrity(e);
      return `"${e.timestamp.toISOString()}","${e.userId}","${e.action}","${e.resourceType}","${e.resourceId}","${e.integrityHash}","${isValid ? "YES" : "NO"}"`;
    }),
  ].join("\n");

  return { report, json, csv };
}
