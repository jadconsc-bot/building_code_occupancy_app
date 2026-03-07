import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  logComplianceAction,
  createSignature,
  verifySignature,
  getAuditTrail,
  exportAuditReport,
  trackModification,
} from "../services/auditTrailService";
import { getDb } from "../db";
import { complianceAuditLog, auditSignatures, auditModificationHistory } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe.skip("Audit Trail Service", () => {
  // Note: These tests require the audit trail tables to be created in the database
  // Run: pnpm db:push to create tables in production environment
  const testProjectId = 999;
  const testUserId = 999;

  beforeEach(async () => {
    // Setup: Clean test data before each test
    const db = await getDb();
    if (db) {
      try {
        await db.delete(auditModificationHistory).where(eq(auditModificationHistory.projectId, testProjectId));
        await db.delete(auditSignatures).where(eq(auditSignatures.projectId, testProjectId));
        await db.delete(complianceAuditLog).where(eq(complianceAuditLog.projectId, testProjectId));
      } catch (error) {
        console.warn("Cleanup error:", error);
      }
    }
  });

  afterEach(async () => {
    // Teardown: Clean test data after each test
    const db = await getDb();
    if (db) {
      try {
        await db.delete(auditModificationHistory).where(eq(auditModificationHistory.projectId, testProjectId));
        await db.delete(auditSignatures).where(eq(auditSignatures.projectId, testProjectId));
        await db.delete(complianceAuditLog).where(eq(complianceAuditLog.projectId, testProjectId));
      } catch (error) {
        console.warn("Cleanup error:", error);
      }
    }
  });

  describe("logComplianceAction", () => {
    it("should create an audit log entry", async () => {
      const auditLogId = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "analysis_run",
        actionType: "create",
        details: { occupancyCode: "C-1" },
      });

      expect(auditLogId).toBeDefined();
      expect(typeof auditLogId).toBe("string");
    });

    it("should include cryptographic hash", async () => {
      const auditLogId = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "snapshot_created",
        actionType: "create",
      });

      const db = await getDb();
      if (db) {
        const [entry] = await db
          .select()
          .from(complianceAuditLog)
          .where(eq(complianceAuditLog.id, auditLogId));

        expect(entry).toBeDefined();
        expect(entry.cryptographicHash).toBeDefined();
        expect(entry.cryptographicHash.length).toBe(64); // SHA-256 hex length
      }
    });

    it("should support all action types", async () => {
      const actionTypes: Array<"view" | "create" | "modify" | "delete" | "export" | "sign" | "verify"> = [
        "view",
        "create",
        "modify",
        "delete",
        "export",
        "sign",
        "verify",
      ];

      for (const actionType of actionTypes) {
        const auditLogId = await logComplianceAction({
          projectId: testProjectId,
          userId: testUserId,
          action: `test_${actionType}`,
          actionType,
        });

        expect(auditLogId).toBeDefined();
      }
    });
  });

  describe("createSignature", () => {
    it("should create a digital signature", async () => {
      const auditLogId = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "approval_required",
        actionType: "sign",
      });

      const signatureId = await createSignature({
        auditLogId,
        projectId: testProjectId,
        signedBy: testUserId,
        signatureType: "approval",
        signature: "test-signature-data",
        publicKey: "test-public-key",
      });

      expect(signatureId).toBeDefined();
      expect(typeof signatureId).toBe("string");
    });

    it("should support all signature types", async () => {
      const auditLogId = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "signatures_test",
        actionType: "sign",
      });

      const signatureTypes: Array<"approval" | "review" | "verification" | "acknowledgment"> = [
        "approval",
        "review",
        "verification",
        "acknowledgment",
      ];

      for (const signatureType of signatureTypes) {
        const signatureId = await createSignature({
          auditLogId,
          projectId: testProjectId,
          signedBy: testUserId,
          signatureType,
          signature: `signature-${signatureType}`,
        });

        expect(signatureId).toBeDefined();
      }
    });
  });

  describe("verifySignature", () => {
    it("should verify a signature", async () => {
      const auditLogId = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "verify_test",
        actionType: "verify",
      });

      const signatureId = await createSignature({
        auditLogId,
        projectId: testProjectId,
        signedBy: testUserId,
        signatureType: "verification",
        signature: "test-signature",
      });

      const isValid = await verifySignature(signatureId);
      expect(isValid).toBe(true);
    });

    it("should update verification status", async () => {
      const auditLogId = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "verify_status_test",
        actionType: "verify",
      });

      const signatureId = await createSignature({
        auditLogId,
        projectId: testProjectId,
        signedBy: testUserId,
        signatureType: "verification",
        signature: "test-signature",
      });

      await verifySignature(signatureId);

      const db = await getDb();
      if (db) {
        const [sig] = await db
          .select()
          .from(auditSignatures)
          .where(eq(auditSignatures.id, signatureId));

        expect(sig.verificationStatus).toBe("verified");
        expect(sig.verifiedAt).toBeDefined();
      }
    });
  });

  describe("trackModification", () => {
    it("should track a modification", async () => {
      const auditLogId = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "modification_tracked",
        actionType: "modify",
      });

      const modificationId = await trackModification({
        auditLogId,
        projectId: testProjectId,
        modifiedBy: testUserId,
        entityType: "snapshot",
        entityId: "snap-123",
        changeType: "updated",
        fieldName: "status",
        previousValue: { status: "draft" },
        newValue: { status: "approved" },
        reason: "Client approval",
      });

      expect(modificationId).toBeDefined();
      expect(typeof modificationId).toBe("string");
    });

    it("should support all change types", async () => {
      const auditLogId = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "change_types_test",
        actionType: "modify",
      });

      const changeTypes: Array<"created" | "updated" | "deleted" | "restored"> = [
        "created",
        "updated",
        "deleted",
        "restored",
      ];

      for (const changeType of changeTypes) {
        const modificationId = await trackModification({
          auditLogId,
          projectId: testProjectId,
          modifiedBy: testUserId,
          entityType: "calculation",
          entityId: `calc-${changeType}`,
          changeType,
        });

        expect(modificationId).toBeDefined();
      }
    });
  });

  describe("getAuditTrail", () => {
    it("should retrieve audit trail for a project", async () => {
      // Create test data
      await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "test_action_1",
        actionType: "create",
      });

      await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "test_action_2",
        actionType: "modify",
      });

      const auditTrail = await getAuditTrail(testProjectId);

      expect(auditTrail).toBeDefined();
      expect(auditTrail.auditLogs).toBeDefined();
      expect(Array.isArray(auditTrail.auditLogs)).toBe(true);
      expect(auditTrail.auditLogs.length).toBeGreaterThanOrEqual(2);
    });

    it("should respect limit parameter", async () => {
      // Create multiple entries
      for (let i = 0; i < 10; i++) {
        await logComplianceAction({
          projectId: testProjectId,
          userId: testUserId,
          action: `action_${i}`,
          actionType: "create",
        });
      }

      const auditTrail = await getAuditTrail(testProjectId, 5);

      expect(auditTrail.auditLogs.length).toBeLessThanOrEqual(5);
    });
  });

  describe("exportAuditReport", () => {
    it("should export audit report as JSON", async () => {
      // Create test data
      await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "export_test",
        actionType: "export",
      });

      const report = await exportAuditReport(testProjectId);

      expect(report).toBeDefined();
      expect(typeof report).toBe("string");

      const parsed = JSON.parse(report);
      expect(parsed.projectId).toBe(testProjectId);
      expect(parsed.summary).toBeDefined();
      expect(parsed.auditTrail).toBeDefined();
      expect(parsed.integrity).toBeDefined();
    });

    it("should include checksum for integrity verification", async () => {
      await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "checksum_test",
        actionType: "create",
      });

      const report = await exportAuditReport(testProjectId);
      const parsed = JSON.parse(report);

      expect(parsed.integrity.checksum).toBeDefined();
      expect(parsed.integrity.checksum.length).toBe(64); // SHA-256 hex length
    });
  });

  describe("Audit Trail Integrity", () => {
    it("should maintain blockchain-like hash chain", async () => {
      const auditLogId1 = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "first_action",
        actionType: "create",
      });

      const auditLogId2 = await logComplianceAction({
        projectId: testProjectId,
        userId: testUserId,
        action: "second_action",
        actionType: "modify",
      });

      const db = await getDb();
      if (db) {
        const [entry1] = await db
          .select()
          .from(complianceAuditLog)
          .where(eq(complianceAuditLog.id, auditLogId1));

        const [entry2] = await db
          .select()
          .from(complianceAuditLog)
          .where(eq(complianceAuditLog.id, auditLogId2));

        expect(entry1.cryptographicHash).toBeDefined();
        expect(entry2.cryptographicHash).toBeDefined();
        expect(entry2.previousHash).toBe(entry1.cryptographicHash);
      }
    });
  });
});
