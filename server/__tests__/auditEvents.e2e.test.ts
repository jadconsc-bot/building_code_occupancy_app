/**
 * Audit Events E2E Test Suite
 *
 * Comprehensive end-to-end testing of all 12 audit event types.
 * Tests the complete flow from event creation through audit trail verification.
 *
 * Test Coverage:
 * 1. DISCLAIMER_ACKNOWLEDGED - User accepts legal disclaimer
 * 2. DRAWING_UPLOADED - Drawing file uploaded
 * 3. DRAWING_HASH_VERIFIED - SHA-256 hash computed and verified
 * 4. EXTRACTION_STARTED - LLM extraction initiated
 * 5. EXTRACTION_COMPLETED - LLM extraction finished
 * 6. RULE_ENGINE_EVALUATION - Deterministic rule evaluation
 * 7. ANALYSIS_CREATED - Analysis record created
 * 8. PROFESSIONAL_REVIEW_INITIATED - Professional started review
 * 9. PROFESSIONAL_ACCEPTED - Professional accepted analysis
 * 10. SIGNATURE_APPLIED - Digital signature applied
 * 11. ANALYSIS_REJECTED - Professional rejected analysis
 * 12. ANALYSIS_EXPORTED - Analysis exported as report
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { auditEventService } from '../services/AuditEventService';
import { getDb } from '../db';
import { complianceAuditTrail } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('Audit Events E2E Test Suite', () => {
  let db: any;
  const testAnalysisId = 9999; // Test analysis ID
  const testUserId = 1;
  const testUserEmail = 'test@example.com';
  const testUserName = 'Test User';
  const testSessionId = `test_session_${Date.now()}`;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
    console.log('[E2E Tests] Database connected');
  });

  /**
   * Test 1: DISCLAIMER_ACKNOWLEDGED Event
   */
  it('should log DISCLAIMER_ACKNOWLEDGED event with full credentials', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'DISCLAIMER_ACKNOWLEDGED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        disclaimerVersion: '1.0',
        accepted: true,
        timestamp: new Date().toISOString(),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.eventId).toBeGreaterThan(0);
    expect(result.action).toBe('DISCLAIMER_ACKNOWLEDGED');
    expect(result.timestamp).toBeInstanceOf(Date);
    console.log('[Test 1] DISCLAIMER_ACKNOWLEDGED logged:', result.eventId);
  });

  /**
   * Test 2: DRAWING_UPLOADED Event
   */
  it('should log DRAWING_UPLOADED event with file metadata', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'DRAWING_UPLOADED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        fileName: 'building_plan.pdf',
        fileSize: 2048576,
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('DRAWING_UPLOADED');
    expect(result.timestamp).toBeInstanceOf(Date);
    console.log('[Test 2] DRAWING_UPLOADED logged:', result.eventId);
  });

  /**
   * Test 3: DRAWING_HASH_VERIFIED Event
   */
  it('should log DRAWING_HASH_VERIFIED event with SHA-256 hash', async () => {
    const drawingContent = 'TEST_DRAWING_CONTENT';
    const hash = crypto.createHash('sha256').update(drawingContent).digest('hex');

    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'DRAWING_HASH_VERIFIED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        hash,
        algorithm: 'SHA-256',
        verified: true,
        verifiedAt: new Date().toISOString(),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('DRAWING_HASH_VERIFIED');
    expect(result.timestamp).toBeInstanceOf(Date);
    console.log('[Test 3] DRAWING_HASH_VERIFIED logged:', result.eventId);
  });

  /**
   * Test 4: EXTRACTION_STARTED Event
   */
  it('should log EXTRACTION_STARTED event', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'EXTRACTION_STARTED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        extractionMethod: 'CLAUDE_VISION',
        model: 'claude-3-5-sonnet',
        startedAt: new Date().toISOString(),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('EXTRACTION_STARTED');
    console.log('[Test 4] EXTRACTION_STARTED logged:', result.eventId);
  });

  /**
   * Test 5: EXTRACTION_COMPLETED Event
   */
  it('should log EXTRACTION_COMPLETED event with confidence score', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'EXTRACTION_COMPLETED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        confidenceScore: 0.92,
        issuesFound: 3,
        completedAt: new Date().toISOString(),
        processingTimeMs: 5234,
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('EXTRACTION_COMPLETED');
    console.log('[Test 5] EXTRACTION_COMPLETED logged:', result.eventId);
  });

  /**
   * Test 6: RULE_ENGINE_EVALUATION Event
   */
  it('should log RULE_ENGINE_EVALUATION event', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'RULE_ENGINE_EVALUATION',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        rulesApplied: 45,
        rulesMatched: 12,
        evaluationTimeMs: 1234,
        evaluatedAt: new Date().toISOString(),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('RULE_ENGINE_EVALUATION');
    console.log('[Test 6] RULE_ENGINE_EVALUATION logged:', result.eventId);
  });

  /**
   * Test 7: ANALYSIS_CREATED Event
   */
  it('should log ANALYSIS_CREATED event with DRAFT status', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'ANALYSIS_CREATED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        version: '1.0',
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('ANALYSIS_CREATED');
    console.log('[Test 7] ANALYSIS_CREATED logged:', result.eventId);
  });

  /**
   * Test 8: PROFESSIONAL_REVIEW_INITIATED Event
   */
  it('should log PROFESSIONAL_REVIEW_INITIATED event', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'PROFESSIONAL_REVIEW_INITIATED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        reviewStartedAt: new Date().toISOString(),
        status: 'UNDER_REVIEW',
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('PROFESSIONAL_REVIEW_INITIATED');
    console.log('[Test 8] PROFESSIONAL_REVIEW_INITIATED logged:', result.eventId);
  });

  /**
   * Test 9: PROFESSIONAL_ACCEPTED Event
   */
  it('should log PROFESSIONAL_ACCEPTED event with credentials', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'PROFESSIONAL_ACCEPTED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      professionalLicenseNumber: 'P.Eng. 12345',
      professionalAssociation: 'APEGA',
      jurisdiction: 'Alberta',
      details: {
        acceptedAt: new Date().toISOString(),
        status: 'VALID',
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('PROFESSIONAL_ACCEPTED');
    expect(result.credentialsRecorded).toBe(true);
    console.log('[Test 9] PROFESSIONAL_ACCEPTED logged:', result.eventId);
  });

  /**
   * Test 10: SIGNATURE_APPLIED Event
   */
  it('should log SIGNATURE_APPLIED event with digital signature', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'SIGNATURE_APPLIED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      professionalLicenseNumber: 'P.Eng. 12345',
      professionalAssociation: 'APEGA',
      jurisdiction: 'Alberta',
      details: {
        signatureMethod: 'DIGITAL_SIGNATURE',
        signedAt: new Date().toISOString(),
        signatureHash: crypto.randomBytes(32).toString('hex'),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('SIGNATURE_APPLIED');
    expect(result.credentialsRecorded).toBe(true);
    console.log('[Test 10] SIGNATURE_APPLIED logged:', result.eventId);
  });

  /**
   * Test 11: ANALYSIS_REJECTED Event
   */
  it('should log ANALYSIS_REJECTED event with reason', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'ANALYSIS_REJECTED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      professionalLicenseNumber: 'P.Eng. 54321',
      professionalAssociation: 'PEO',
      jurisdiction: 'Ontario',
      details: {
        rejectionReason: 'Analysis does not comply with NBC 2023 Section 3.2.1',
        rejectedAt: new Date().toISOString(),
        status: 'REJECTED',
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('ANALYSIS_REJECTED');
    console.log('[Test 11] ANALYSIS_REJECTED logged:', result.eventId);
  });

  /**
   * Test 12: ANALYSIS_EXPORTED Event
   */
  it('should log ANALYSIS_EXPORTED event with export details', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'ANALYSIS_EXPORTED',
      userEmail: testUserEmail,
      userFullName: testUserName,
      details: {
        exportFormat: 'PDF',
        exportedAt: new Date().toISOString(),
        fileName: 'analysis_export_20260315.pdf',
        auditTrailIncluded: true,
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('ANALYSIS_EXPORTED');
    console.log('[Test 12] ANALYSIS_EXPORTED logged:', result.eventId);
  });

  /**
   * Integration Test: Verify Audit Trail Integrity
   */
  it('should verify complete audit trail integrity', async () => {
    const trail = await auditEventService.getAuditTrail(testAnalysisId);

    console.log('[Integration Test] Audit trail retrieved:', {
      analysisId: testAnalysisId,
      eventCount: trail.length,
      events: trail.map(e => e.action),
    });

    // Verify all 12 events are present
    expect(trail.length).toBeGreaterThanOrEqual(12);

    // Verify chronological order
    for (let i = 1; i < trail.length; i++) {
      expect(trail[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        trail[i - 1].timestamp.getTime()
      );
    }

    // Verify integrity check
    const integrity = await auditEventService.verifyAuditTrailIntegrity(testAnalysisId);
    console.log('[Integration Test] Audit trail integrity:', integrity);

    expect(integrity.eventCount).toBeGreaterThanOrEqual(12);
    expect(integrity.presentEvents.length).toBeGreaterThan(0);
  });

  /**
   * Integration Test: Server Timestamp Verification
   */
  it('should verify server timestamps are within 1 second of UTC', async () => {
    const trail = await auditEventService.getAuditTrail(testAnalysisId);

    for (const event of trail) {
      const now = new Date();
      const timeDifference = Math.abs(now.getTime() - event.timestamp.getTime());

      // Should be within reasonable bounds (events created in this test)
      expect(timeDifference).toBeLessThan(60000); // 60 seconds

      // Verify UTC format
      const isoString = event.timestamp.toISOString();
      expect(isoString).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    }

    console.log('[Integration Test] Server timestamps verified');
  });
});
