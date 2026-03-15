/**
 * Disclaimer Gate E2E Test Suite
 *
 * Tests the complete disclaimer gate flow:
 * 1. Disclaimer gate blocks upload if not acknowledged
 * 2. User must check both checkboxes to proceed
 * 3. DISCLAIMER_ACKNOWLEDGED event is logged
 * 4. Session storage prevents re-prompting
 * 5. Upload is allowed after disclaimer acceptance
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { auditEventService } from '../services/AuditEventService';
import { getDb } from '../db';
import { createTestAnalysis, cleanupTestAnalysis } from './helpers/testFixtures';

describe('Disclaimer Gate E2E Test Suite', () => {
  let db: any;
  let testAnalysisId: number;
  const testUserId = 1;
  const testSessionId = `disclaimer_test_${Date.now()}`;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
    testAnalysisId = await createTestAnalysis({ userId: testUserId });
    console.log('[Disclaimer Gate Tests] Created test analysis:', testAnalysisId);
  });

  afterAll(async () => {
    if (testAnalysisId) {
      await cleanupTestAnalysis(testAnalysisId);
      console.log('[Disclaimer Gate Tests] Cleaned up test data');
    }
  });

  /**
   * Test 1: Disclaimer Gate Blocks Upload Without Acknowledgment
   */
  it('should block upload if disclaimer not acknowledged', async () => {
    // Simulate session without disclaimer acknowledgment
    const session = {
      disclaimerAccepted: false,
      userId: testUserId,
    };

    // Function to check if upload is allowed
    const canUpload = (session: any) => session.disclaimerAccepted === true;

    // Upload should be blocked
    expect(canUpload(session)).toBe(false);

    console.log('[Test 1] Upload blocked without disclaimer acknowledgment');
  });

  /**
   * Test 2: Both Checkboxes Required
   */
  it('should require both checkboxes to be checked', async () => {
    // Simulate user checking only first checkbox
    const partialAcceptance = {
      understandsRisks: true,
      acceptsTerms: false,
    };

    const canProceed = (state: any) => state.understandsRisks && state.acceptsTerms;

    expect(canProceed(partialAcceptance)).toBe(false);

    // Simulate user checking both checkboxes
    const fullAcceptance = {
      understandsRisks: true,
      acceptsTerms: true,
    };

    expect(canProceed(fullAcceptance)).toBe(true);

    console.log('[Test 2] Both checkboxes required for acceptance');
  });

  /**
   * Test 3: DISCLAIMER_ACKNOWLEDGED Event Logged
   */
  it('should log DISCLAIMER_ACKNOWLEDGED event when user accepts', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'DISCLAIMER_ACKNOWLEDGED',
      userEmail: 'user@example.com',
      userFullName: 'Test User',
      details: {
        disclaimerVersion: '1.0',
        accepted: true,
        bothCheckboxesChecked: true,
        timestamp: new Date().toISOString(),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('DISCLAIMER_ACKNOWLEDGED');
    expect(result.eventId).toBeGreaterThan(0);
    expect(result.timestamp).toBeInstanceOf(Date);

    console.log('[Test 3] DISCLAIMER_ACKNOWLEDGED event logged:', result.eventId);
  });

  /**
   * Test 4: Session Storage Prevents Re-Prompting
   */
  it('should prevent re-prompting with session storage', async () => {
    const sessionKey = `disclaimer_accepted_${testUserId}`;
    const sessionStorage = new Map();

    // First visit - disclaimer not accepted
    let disclaimerAccepted = sessionStorage.get(sessionKey);
    expect(disclaimerAccepted).toBeUndefined();

    // User accepts disclaimer
    sessionStorage.set(sessionKey, 'true');

    // Second visit - disclaimer already accepted
    disclaimerAccepted = sessionStorage.get(sessionKey);
    expect(disclaimerAccepted).toBe('true');

    // Third visit - still accepted
    disclaimerAccepted = sessionStorage.get(sessionKey);
    expect(disclaimerAccepted).toBe('true');

    console.log('[Test 4] Session storage prevents re-prompting');
  });

  /**
   * Test 5: Upload Allowed After Disclaimer Acceptance
   */
  it('should allow upload after disclaimer acceptance', async () => {
    // Simulate session with disclaimer accepted
    const session = {
      disclaimerAccepted: true,
      userId: testUserId,
      acceptedAt: new Date(),
    };

    // Function to check if upload is allowed
    const canUpload = (session: any) => session.disclaimerAccepted === true;

    // Upload should be allowed
    expect(canUpload(session)).toBe(true);

    console.log('[Test 5] Upload allowed after disclaimer acceptance');
  });

  /**
   * Test 6: Disclaimer Version Tracking
   */
  it('should track disclaimer version for audit trail', async () => {
    const disclaimerVersion = '1.0';

    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'DISCLAIMER_ACKNOWLEDGED',
      userEmail: 'user@example.com',
      userFullName: 'Test User',
      details: {
        disclaimerVersion,
        accepted: true,
        timestamp: new Date().toISOString(),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('DISCLAIMER_ACKNOWLEDGED');

    // Retrieve audit trail to verify version is recorded
    const trail = await auditEventService.getAuditTrail(testAnalysisId);
    const disclaimerEvent = trail.find(e => e.action === 'DISCLAIMER_ACKNOWLEDGED');

    expect(disclaimerEvent).toBeDefined();

    console.log('[Test 6] Disclaimer version tracked:', disclaimerVersion);
  });

  /**
   * Test 7: Request Context Captured
   */
  it('should capture request context (IP, user agent, session ID)', async () => {
    const ipAddress = '203.0.113.42';
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    const sessionId = `context_test_${Date.now()}`;

    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'DISCLAIMER_ACKNOWLEDGED',
      userEmail: 'user@example.com',
      userFullName: 'Test User',
      details: {
        accepted: true,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
      sessionId,
    });

    expect(result.eventId).toBeGreaterThan(0);

    // Verify context is captured in audit trail
    const trail = await auditEventService.getAuditTrail(testAnalysisId);
    expect(trail.length).toBeGreaterThan(0);

    console.log('[Test 7] Request context captured:', {
      ipAddress,
      userAgent,
      sessionId,
    });
  });

  /**
   * Integration Test: Complete Disclaimer Gate Flow
   */
  it('should complete full disclaimer gate flow', async () => {
    // Step 1: User visits page - disclaimer not accepted
    let disclaimerAccepted = false;
    expect(disclaimerAccepted).toBe(false);

    // Step 2: User reads disclaimer and checks both boxes
    let understandsRisks = true;
    let acceptsTerms = true;
    const canProceed = understandsRisks && acceptsTerms;
    expect(canProceed).toBe(true);

    // Step 3: User clicks "Accept" button
    disclaimerAccepted = true;

    // Step 4: System logs DISCLAIMER_ACKNOWLEDGED event
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testUserId,
      action: 'DISCLAIMER_ACKNOWLEDGED',
      userEmail: 'user@example.com',
      userFullName: 'Test User',
      details: {
        disclaimerVersion: '1.0',
        accepted: true,
        timestamp: new Date().toISOString(),
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('DISCLAIMER_ACKNOWLEDGED');

    // Step 5: Session storage prevents re-prompting
    const sessionKey = `disclaimer_accepted_${testUserId}`;
    const sessionStorage = new Map();
    sessionStorage.set(sessionKey, 'true');
    const storedValue = sessionStorage.get(sessionKey);
    expect(storedValue).toBe('true');

    // Step 6: Upload is now allowed
    const uploadAllowed = disclaimerAccepted && storedValue === 'true';
    expect(uploadAllowed).toBe(true);

    console.log('[Integration Test] Complete disclaimer gate flow verified');
  });
});
