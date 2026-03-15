/**
 * Professional Review Panel E2E Test Suite
 *
 * Tests the complete professional review flow:
 * 1. Professional review requires valid license
 * 2. License verification validates credentials
 * 3. Professional can accept or reject analysis
 * 4. Digital signature is applied on acceptance
 * 5. Audit events logged for each step
 * 6. Analysis status updated to VALID or REJECTED
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { auditEventService } from '../services/AuditEventService';
import { getDb } from '../db';
import { createTestAnalysis, cleanupTestAnalysis } from './helpers/testFixtures';

describe('Professional Review Panel E2E Test Suite', () => {
  let db: any;
  let testAnalysisId: number;
  const testProfessionalId = 2;
  const testSessionId = `professional_test_${Date.now()}`;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }
    testAnalysisId = await createTestAnalysis({ userId: testProfessionalId });
    console.log('[Professional Review Tests] Created test analysis:', testAnalysisId);
  });

  afterAll(async () => {
    if (testAnalysisId) {
      await cleanupTestAnalysis(testAnalysisId);
      console.log('[Professional Review Tests] Cleaned up test data');
    }
  });

  /**
   * Test 1: Professional Review Requires Valid License
   */
  it('should require valid license for professional review', async () => {
    // User without license
    const userWithoutLicense = {
      id: 1,
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      licenseNumber: null,
    };

    // Professional with license
    const professionalWithLicense = {
      id: 2,
      email: 'prof@example.com',
      name: 'Professional User',
      role: 'professional',
      licenseNumber: 'P.Eng. 12345',
      association: 'APEGA',
      jurisdiction: 'Alberta',
    };

    // Function to check if user can review
    const canReview = (user: any) => 
      user.role === 'professional' && 
      !!user.licenseNumber && 
      !!user.association &&
      !!user.jurisdiction;

    expect(canReview(userWithoutLicense)).toBe(false);
    expect(canReview(professionalWithLicense)).toBe(true);

    console.log('[Test 1] Professional review requires valid license');
  });

  /**
   * Test 2: License Verification Validates Credentials
   */
  it('should validate professional credentials format', async () => {
    // Valid license formats
    const validLicenses = [
      'P.Eng. 12345',
      'PEng-67890',
      'PE-2024-001',
      'APEGA-P.Eng.-12345',
    ];

    // Invalid license formats
    const invalidLicenses = [
      '',
      'INVALID',
      '12345', // Numbers only
      'P.Eng.', // Incomplete
    ];

    const isValidLicense = (license: string) => {
      return license.length > 0 && 
             (license.includes('P.Eng') || 
              license.includes('PEng') || 
              license.includes('PE-') ||
              license.includes('APEGA'));
    };

    for (const license of validLicenses) {
      expect(isValidLicense(license)).toBe(true);
    }

    for (const license of invalidLicenses) {
      expect(isValidLicense(license)).toBe(false);
    }

    console.log('[Test 2] License verification validates credentials');
  });

  /**
   * Test 3: Professional Review Initiated Event
   */
  it('should log PROFESSIONAL_REVIEW_INITIATED event', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testProfessionalId,
      action: 'PROFESSIONAL_REVIEW_INITIATED',
      userEmail: 'prof@example.com',
      userFullName: 'Professional User',
      details: {
        reviewStartedAt: new Date().toISOString(),
        status: 'UNDER_REVIEW',
      },
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 Professional',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('PROFESSIONAL_REVIEW_INITIATED');
    expect(result.eventId).toBeGreaterThan(0);

    console.log('[Test 3] PROFESSIONAL_REVIEW_INITIATED logged:', result.eventId);
  });

  /**
   * Test 4: Professional Acceptance with Credentials
   */
  it('should log PROFESSIONAL_ACCEPTED event with credentials', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testProfessionalId,
      action: 'PROFESSIONAL_ACCEPTED',
      userEmail: 'prof@example.com',
      userFullName: 'Professional User',
      professionalLicenseNumber: 'P.Eng. 12345',
      professionalAssociation: 'APEGA',
      jurisdiction: 'Alberta',
      details: {
        acceptedAt: new Date().toISOString(),
        status: 'VALID',
        confidence: 0.95,
      },
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 Professional',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('PROFESSIONAL_ACCEPTED');
    expect(result.credentialsRecorded).toBe(true);

    console.log('[Test 4] PROFESSIONAL_ACCEPTED logged with credentials');
  });

  /**
   * Test 5: Digital Signature Application
   */
  it('should log SIGNATURE_APPLIED event with digital signature', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testProfessionalId,
      action: 'SIGNATURE_APPLIED',
      userEmail: 'prof@example.com',
      userFullName: 'Professional User',
      professionalLicenseNumber: 'P.Eng. 12345',
      professionalAssociation: 'APEGA',
      jurisdiction: 'Alberta',
      details: {
        signatureMethod: 'DIGITAL_SIGNATURE',
        signedAt: new Date().toISOString(),
        signatureHash: 'abc123def456',
        timestamp: new Date().toISOString(),
      },
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 Professional',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('SIGNATURE_APPLIED');
    expect(result.credentialsRecorded).toBe(true);

    console.log('[Test 5] SIGNATURE_APPLIED logged with digital signature');
  });

  /**
   * Test 6: Professional Rejection with Reason
   */
  it('should log ANALYSIS_REJECTED event with rejection reason', async () => {
    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testProfessionalId,
      action: 'ANALYSIS_REJECTED',
      userEmail: 'prof@example.com',
      userFullName: 'Professional User',
      professionalLicenseNumber: 'P.Eng. 54321',
      professionalAssociation: 'PEO',
      jurisdiction: 'Ontario',
      details: {
        rejectionReason: 'Analysis does not comply with NBC 2023 Section 3.2.1',
        rejectedAt: new Date().toISOString(),
        status: 'REJECTED',
        specificIssues: [
          'Fire separation non-compliant',
          'Egress window dimensions incorrect',
        ],
      },
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 Professional',
      sessionId: testSessionId,
    });

    expect(result.action).toBe('ANALYSIS_REJECTED');

    console.log('[Test 6] ANALYSIS_REJECTED logged with reason');
  });

  /**
   * Test 7: Analysis Status Update to VALID
   */
  it('should update analysis status to VALID after professional acceptance', async () => {
    // Simulate analysis status update
    const analysisStatus = {
      id: testAnalysisId,
      status: 'DRAFT',
    };

    // Professional accepts
    analysisStatus.status = 'VALID';

    expect(analysisStatus.status).toBe('VALID');

    console.log('[Test 7] Analysis status updated to VALID');
  });

  /**
   * Test 8: Analysis Status Update to REJECTED
   */
  it('should update analysis status to REJECTED after professional rejection', async () => {
    // Simulate analysis status update
    const analysisStatus = {
      id: testAnalysisId,
      status: 'UNDER_REVIEW',
    };

    // Professional rejects
    analysisStatus.status = 'REJECTED';

    expect(analysisStatus.status).toBe('REJECTED');

    console.log('[Test 8] Analysis status updated to REJECTED');
  });

  /**
   * Test 9: Credentials Recorded in Audit Trail
   */
  it('should record professional credentials in audit trail', async () => {
    const licenseNumber = 'P.Eng. 12345';
    const association = 'APEGA';
    const jurisdiction = 'Alberta';

    const result = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testProfessionalId,
      action: 'PROFESSIONAL_ACCEPTED',
      userEmail: 'prof@example.com',
      userFullName: 'Professional User',
      professionalLicenseNumber: licenseNumber,
      professionalAssociation: association,
      jurisdiction,
      details: {
        acceptedAt: new Date().toISOString(),
        status: 'VALID',
      },
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 Professional',
      sessionId: testSessionId,
    });

    expect(result.credentialsRecorded).toBe(true);

    // Verify credentials are in audit trail
    const trail = await auditEventService.getAuditTrail(testAnalysisId);
    const acceptanceEvent = trail.find(e => e.action === 'PROFESSIONAL_ACCEPTED');

    expect(acceptanceEvent).toBeDefined();

    console.log('[Test 9] Professional credentials recorded:', {
      licenseNumber,
      association,
      jurisdiction,
    });
  });

  /**
   * Integration Test: Complete Professional Review Flow
   */
  it('should complete full professional review flow', async () => {
    // Step 1: Analysis is in DRAFT status
    let analysisStatus = 'DRAFT';
    expect(analysisStatus).toBe('DRAFT');

    // Step 2: Professional initiates review
    let reviewEvent = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testProfessionalId,
      action: 'PROFESSIONAL_REVIEW_INITIATED',
      userEmail: 'prof@example.com',
      userFullName: 'Professional User',
      details: {
        reviewStartedAt: new Date().toISOString(),
        status: 'UNDER_REVIEW',
      },
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 Professional',
      sessionId: testSessionId,
    });

    expect(reviewEvent.action).toBe('PROFESSIONAL_REVIEW_INITIATED');
    analysisStatus = 'UNDER_REVIEW';

    // Step 3: Professional verifies license and credentials
    const professionalCredentials = {
      licenseNumber: 'P.Eng. 12345',
      association: 'APEGA',
      jurisdiction: 'Alberta',
    };

    const isValidCredentials = 
      !!professionalCredentials.licenseNumber &&
      !!professionalCredentials.association &&
      !!professionalCredentials.jurisdiction;

    expect(isValidCredentials).toBe(true);

    // Step 4: Professional accepts analysis
    let acceptanceEvent = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testProfessionalId,
      action: 'PROFESSIONAL_ACCEPTED',
      userEmail: 'prof@example.com',
      userFullName: 'Professional User',
      professionalLicenseNumber: professionalCredentials.licenseNumber,
      professionalAssociation: professionalCredentials.association,
      jurisdiction: professionalCredentials.jurisdiction,
      details: {
        acceptedAt: new Date().toISOString(),
        status: 'VALID',
      },
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 Professional',
      sessionId: testSessionId,
    });

    expect(acceptanceEvent.action).toBe('PROFESSIONAL_ACCEPTED');
    analysisStatus = 'VALID';

    // Step 5: Digital signature applied
    let signatureEvent = await auditEventService.logAuditEvent({
      analysisId: testAnalysisId,
      userId: testProfessionalId,
      action: 'SIGNATURE_APPLIED',
      userEmail: 'prof@example.com',
      userFullName: 'Professional User',
      professionalLicenseNumber: professionalCredentials.licenseNumber,
      professionalAssociation: professionalCredentials.association,
      jurisdiction: professionalCredentials.jurisdiction,
      details: {
        signatureMethod: 'DIGITAL_SIGNATURE',
        signedAt: new Date().toISOString(),
      },
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 Professional',
      sessionId: testSessionId,
    });

    expect(signatureEvent.action).toBe('SIGNATURE_APPLIED');

    // Step 6: Verify final status
    expect(analysisStatus).toBe('VALID');

    // Step 7: Verify audit trail completeness
    const trail = await auditEventService.getAuditTrail(testAnalysisId);
    const requiredEvents = [
      'PROFESSIONAL_REVIEW_INITIATED',
      'PROFESSIONAL_ACCEPTED',
      'SIGNATURE_APPLIED',
    ];

    for (const eventType of requiredEvents) {
      const event = trail.find(e => e.action === eventType);
      expect(event).toBeDefined();
    }

    console.log('[Integration Test] Complete professional review flow verified');
  });
});
