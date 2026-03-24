/**
 * ImmutabilityGuard Service Tests
 * 
 * Comprehensive test coverage for application-layer immutability enforcement.
 * Verifies that audit trail records cannot be modified or deleted once created.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../db";
import {
  guardAuditUpdate,
  guardAuditDelete,
  verifyImmutability,
  unlockRecord,
  lockRecord,
  ImmutabilityViolationError,
} from "../services/ImmutabilityGuard";
import { complianceAuditTrail } from "../../drizzle/schema";

describe("ImmutabilityGuard Service", () => {
  let testAuditId: number;
  const testUserId = 999;
  const testAnalysisId = 888;

  beforeAll(async () => {
    // Create a test audit record
    const result = await (db as any)
      .insert(complianceAuditTrail)
      .values({
        analysisId: testAnalysisId,
        userId: testUserId,
        action: "TEST_ACTION",
        details: JSON.stringify({ test: "data" }),
        userEmail: "test@example.com",
        userFullName: "Test User",
        ipAddress: "127.0.0.1",
        userAgent: "Test Agent",
        sessionId: "test-session-123",
        isImmutable: true,
      });

    testAuditId = Array.isArray(result) ? result[0].insertId : (result as any).insertId;
  });

  afterAll(async () => {
    // Clean up test record
    try {
      // Unlock first so we can delete
      await unlockRecord("complianceAuditTrail", testAuditId, testUserId, "Test cleanup");
      await (db as any)
        .delete(complianceAuditTrail)
        .where((t: any) => t.id === testAuditId);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("guardAuditUpdate", () => {
    it("should throw ImmutabilityViolationError when trying to update immutable record", async () => {
      expect(async () => {
        await guardAuditUpdate("complianceAuditTrail", testAuditId, testUserId);
      }).rejects.toThrow(ImmutabilityViolationError);
    });

    it("should throw error with correct table and recordId", async () => {
      try {
        await guardAuditUpdate("complianceAuditTrail", testAuditId, testUserId);
        expect.fail("Should have thrown error");
      } catch (error) {
        if (error instanceof ImmutabilityViolationError) {
          expect(error.table).toBe("complianceAuditTrail");
          expect(error.recordId).toBe(testAuditId);
          expect(error.operation).toBe("UPDATE");
          expect(error.userId).toBe(testUserId);
        } else {
          throw error;
        }
      }
    });

    it("should allow UPDATE on mutable record", async () => {
      // Unlock the record
      await unlockRecord("complianceAuditTrail", testAuditId, testUserId, "Test unlock");

      // This should NOT throw
      await expect(
        guardAuditUpdate("complianceAuditTrail", testAuditId, testUserId)
      ).resolves.not.toThrow();

      // Lock it back
      await lockRecord("complianceAuditTrail", testAuditId);
    });
  });

  describe("guardAuditDelete", () => {
    it("should throw ImmutabilityViolationError when trying to delete immutable record", async () => {
      expect(async () => {
        await guardAuditDelete("complianceAuditTrail", testAuditId, testUserId);
      }).rejects.toThrow(ImmutabilityViolationError);
    });

    it("should throw error with correct operation type", async () => {
      try {
        await guardAuditDelete("complianceAuditTrail", testAuditId, testUserId);
        expect.fail("Should have thrown error");
      } catch (error) {
        if (error instanceof ImmutabilityViolationError) {
          expect(error.operation).toBe("DELETE");
        } else {
          throw error;
        }
      }
    });

    it("should allow DELETE on mutable record", async () => {
      // Unlock the record
      await unlockRecord("complianceAuditTrail", testAuditId, testUserId, "Test unlock");

      // This should NOT throw
      await expect(
        guardAuditDelete("complianceAuditTrail", testAuditId, testUserId)
      ).resolves.not.toThrow();

      // Lock it back
      await lockRecord("complianceAuditTrail", testAuditId);
    });
  });

  describe("verifyImmutability", () => {
    it("should return immutability status", async () => {
      const status = await verifyImmutability("complianceAuditTrail", testAuditId);

      expect(status).toHaveProperty("isImmutable");
      expect(status).toHaveProperty("canUpdate");
      expect(status).toHaveProperty("canDelete");
    });

    it("should show record as immutable by default", async () => {
      const status = await verifyImmutability("complianceAuditTrail", testAuditId);

      expect(status.isImmutable).toBe(true);
      expect(status.canUpdate).toBe(false);
      expect(status.canDelete).toBe(false);
    });

    it("should show record as mutable after unlock", async () => {
      // Unlock
      await unlockRecord("complianceAuditTrail", testAuditId, testUserId, "Test unlock");

      const status = await verifyImmutability("complianceAuditTrail", testAuditId);

      expect(status.isImmutable).toBe(false);
      expect(status.canUpdate).toBe(true);
      expect(status.canDelete).toBe(true);

      // Lock back
      await lockRecord("complianceAuditTrail", testAuditId);
    });
  });

  describe("unlockRecord", () => {
    it("should unlock an immutable record", async () => {
      // Verify locked
      let status = await verifyImmutability("complianceAuditTrail", testAuditId);
      expect(status.isImmutable).toBe(true);

      // Unlock
      await unlockRecord("complianceAuditTrail", testAuditId, testUserId, "Test unlock");

      // Verify unlocked
      status = await verifyImmutability("complianceAuditTrail", testAuditId);
      expect(status.isImmutable).toBe(false);

      // Lock back
      await lockRecord("complianceAuditTrail", testAuditId);
    });
  });

  describe("lockRecord", () => {
    it("should lock a mutable record", async () => {
      // Unlock first
      await unlockRecord("complianceAuditTrail", testAuditId, testUserId, "Test unlock");

      // Verify unlocked
      let status = await verifyImmutability("complianceAuditTrail", testAuditId);
      expect(status.isImmutable).toBe(false);

      // Lock
      await lockRecord("complianceAuditTrail", testAuditId);

      // Verify locked
      status = await verifyImmutability("complianceAuditTrail", testAuditId);
      expect(status.isImmutable).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent records gracefully", async () => {
      const fakeId = 999999;

      // Should default to immutable for non-existent records
      const status = await verifyImmutability("complianceAuditTrail", fakeId);
      expect(status.isImmutable).toBe(true);
    });

    it("should throw ImmutabilityViolationError with correct properties", async () => {
      try {
        await guardAuditUpdate("complianceAuditTrail", testAuditId, testUserId);
        expect.fail("Should have thrown error");
      } catch (error) {
        if (error instanceof ImmutabilityViolationError) {
          expect(error.name).toBe("ImmutabilityViolationError");
          expect(error.message).toContain("Immutability violation");
          expect(error.message).toContain("UPDATE");
          expect(error.table).toBe("complianceAuditTrail");
          expect(error.recordId).toBe(testAuditId);
          expect(error.operation).toBe("UPDATE");
          expect(error.userId).toBe(testUserId);
        } else {
          throw error;
        }
      }
    });
  });

  describe("Integration", () => {
    it("should prevent modification of audit trail end-to-end", async () => {
      // 1. Create record (immutable by default)
      const result = await (db as any)
        .insert(complianceAuditTrail)
        .values({
          analysisId: testAnalysisId,
          userId: testUserId,
          action: "INTEGRATION_TEST",
          details: JSON.stringify({ test: "integration" }),
          userEmail: "integration@example.com",
          userFullName: "Integration Test",
          ipAddress: "127.0.0.1",
          userAgent: "Integration Test Agent",
          sessionId: "integration-session-123",
          isImmutable: true,
        });

      const integrationAuditId = Array.isArray(result)
        ? result[0].insertId
        : (result as any).insertId;

      // 2. Verify it's immutable
      const status1 = await verifyImmutability("complianceAuditTrail", integrationAuditId);
      expect(status1.isImmutable).toBe(true);

      // 3. Try to update (should fail)
      await expect(
        guardAuditUpdate("complianceAuditTrail", integrationAuditId, testUserId)
      ).rejects.toThrow(ImmutabilityViolationError);

      // 4. Try to delete (should fail)
      await expect(
        guardAuditDelete("complianceAuditTrail", integrationAuditId, testUserId)
      ).rejects.toThrow(ImmutabilityViolationError);

      // 5. Unlock for cleanup
      await unlockRecord("complianceAuditTrail", integrationAuditId, testUserId, "Integration test cleanup");

      // 6. Verify it's now mutable
      const status2 = await verifyImmutability("complianceAuditTrail", integrationAuditId);
      expect(status2.isImmutable).toBe(false);

      // 7. Clean up
      await (db as any)
        .delete(complianceAuditTrail)
        .where((t: any) => t.id === integrationAuditId);
    });
  });
});
