/**
 * Professional Review Service Tests
 * Tests for digital signature, professional review, and snapshot verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createProfessionalReviewService } from '../professionalReviewService';

describe('ProfessionalReviewService', () => {
  let reviewService: ReturnType<typeof createProfessionalReviewService>;

  beforeEach(() => {
    reviewService = createProfessionalReviewService();
  });

  describe('submitForReview', () => {
    it('should submit a snapshot for professional review', async () => {
      const result = await reviewService.submitForReview(
        'snapshot-123',
        1,
        '123',
        'Please review this compliance analysis'
      );

      expect(result).toBeDefined();
      expect(result.snapshotId).toBe('snapshot-123');
      expect(result.projectId).toBe(1);
      expect(result.userId).toBe('123');
      expect(result.status).toBe('pending');
      expect(result.submittedAt).toBeDefined();
    });

    it('should create audit entry for submission', () => {
      const auditEntry = reviewService.createAuditEntry(
        'snapshot-123',
        '123',
        'reviewer',
        'submitted_for_review',
        'Please review'
      );

      expect(auditEntry).toBeDefined();
      expect(auditEntry.snapshotId).toBe('snapshot-123');
      expect(auditEntry.reviewerId).toBe('123');
      expect(auditEntry.reviewerRole).toBe('reviewer');
      expect(auditEntry.action).toBe('submitted_for_review');
      expect(auditEntry.timestamp).toBeDefined();
    });
  });

  describe('signSnapshot', () => {
    it('should sign a snapshot with digital signature', async () => {
      const signatureData = Buffer.from('Valid professional architect digital signature data for testing purposes with sufficient length').toString('base64');
      
      const result = await reviewService.signSnapshot(
        'snapshot-123',
        '456',
        'engineer',
        signatureData,
        'compliant',
        'Verified and approved'
      );

      expect(result).toBeDefined();
      expect(result.snapshotId).toBe('snapshot-123');
      expect(result.complianceStatus).toBe('compliant');
      expect(result.signature).toBeDefined();
      expect(result.signature.signatureId).toBeDefined();
      expect(result.signature.timestamp).toBeDefined();
      expect(result.signedAt).toBeDefined();
    });

    it('should validate reviewer credentials', async () => {
      const isAuthorized = await reviewService.validateReviewerCredentials(
        '456',
        'engineer'
      );

      expect(typeof isAuthorized).toBe('boolean');
      expect(isAuthorized).toBe(true);
    });

    it('should create audit entry for signing', () => {
      const auditEntry = reviewService.createAuditEntry(
        'snapshot-123',
        '456',
        'engineer',
        'signed',
        'Verified and approved'
      );

      expect(auditEntry).toBeDefined();
      expect(auditEntry.action).toBe('signed');
      expect(auditEntry.reviewerRole).toBe('engineer');
    });
  });

  describe('getReviewStatus', () => {
    it('should retrieve review status for a snapshot', async () => {
      const status = await reviewService.getReviewStatus('snapshot-123');

      expect(status).toBeDefined();
      expect(status.snapshotId).toBe('snapshot-123');
      expect(status.status).toBeDefined();
      expect(['pending', 'approved', 'rejected', 'in_progress']).toContain(status.status);
    });
  });

  describe('rejectReview', () => {
    it('should reject a review request', async () => {
      const result = await reviewService.rejectReview(
        'snapshot-123',
        '789',
        'Needs additional clarification on fire safety requirements'
      );

      expect(result).toBeDefined();
      expect(result.snapshotId).toBe('snapshot-123');
      expect(result.rejectedBy).toBe('789');
      expect(result.rejectionReason).toBe('Needs additional clarification on fire safety requirements');
      expect(result.rejectedAt).toBeDefined();
    });

    it('should create audit entry for rejection', () => {
      const auditEntry = reviewService.createAuditEntry(
        'snapshot-123',
        '789',
        'reviewer',
        'rejected',
        'Needs additional clarification'
      );

      expect(auditEntry).toBeDefined();
      expect(auditEntry.action).toBe('rejected');
    });
  });

  describe('Audit Trail Integration', () => {
    it('should create immutable audit entries', () => {
      const entry1 = reviewService.createAuditEntry(
        'snapshot-123',
        '123',
        'reviewer',
        'submitted_for_review',
        'Initial submission'
      );

      const entry2 = reviewService.createAuditEntry(
        'snapshot-123',
        '456',
        'engineer',
        'signed',
        'Approved'
      );

      // Verify entries are different
      expect(entry1.auditId).not.toBe(entry2.auditId);
      expect(entry1.timestamp).not.toBe(entry2.timestamp);
    });

    it('should track complete review workflow', async () => {
      // Submit for review
      const submission = await reviewService.submitForReview(
        'snapshot-456',
        2,
        '111',
        'Initial submission'
      );
      expect(submission.status).toBe('pending');

      // Get status
      const status1 = await reviewService.getReviewStatus('snapshot-456');
      expect(status1.snapshotId).toBe('snapshot-456');

      // Sign the snapshot
      const signatureData = Buffer.from('This is a valid digital signature with sufficient length for testing purposes').toString('base64');
      const signature = await reviewService.signSnapshot(
        'snapshot-456',
        '222',
        'architect',
        signatureData,
        'compliant',
        'Approved'
      );
      expect(signature.complianceStatus).toBe('compliant');

      // Get final status
      const status2 = await reviewService.getReviewStatus('snapshot-456');
      expect(status2.snapshotId).toBe('snapshot-456');
    });
  });

  describe('Digital Signature Verification', () => {
    it('should generate unique signature IDs', async () => {
      const sig1Data = Buffer.from('First valid digital signature for testing purposes with sufficient length').toString('base64');
      const sig2Data = Buffer.from('Second valid digital signature for testing purposes with sufficient length').toString('base64');

      const sig1 = await reviewService.signSnapshot(
        'snapshot-1',
        '333',
        'engineer',
        sig1Data,
        'compliant',
        'Approved'
      );

      const sig2 = await reviewService.signSnapshot(
        'snapshot-2',
        '444',
        'architect',
        sig2Data,
        'compliant',
        'Approved'
      );

      expect(sig1.signature.signatureId).not.toBe(sig2.signature.signatureId);
    });

    it('should include timestamp in signature', async () => {
      const signatureData = Buffer.from('This is a valid digital signature with sufficient length for testing purposes').toString('base64');
      const result = await reviewService.signSnapshot(
        'snapshot-789',
        '555',
        'engineer',
        signatureData,
        'non_compliant',
        'Does not meet requirements'
      );

      expect(result.signature.timestamp).toBeDefined();
      expect(typeof result.signature.timestamp).toBe('string');
    });
  });

  describe('Compliance Status Tracking', () => {
    it('should support all compliance statuses', async () => {
      const statuses = ['compliant', 'non_compliant', 'conditional'];

      for (const status of statuses) {
        const signatureData = Buffer.from('Valid professional engineer digital signature data for testing with sufficient length').toString('base64');
        const result = await reviewService.signSnapshot(
          `snapshot-${status}`,
          '666',
          'engineer',
          signatureData,
          status as 'compliant' | 'non_compliant' | 'conditional',
          `Status: ${status}`
        );

        expect(result.complianceStatus).toBe(status);
      }
    });
  });

  describe('Reviewer Role Validation', () => {
    it('should support engineer role', async () => {
      const isValid = await reviewService.validateReviewerCredentials(
        '777',
        'engineer'
      );
      expect(isValid).toBe(true);
    });

    it('should support architect role', async () => {
      const isValid = await reviewService.validateReviewerCredentials(
        '888',
        'architect'
      );
      expect(isValid).toBe(true);
    });

    it('should support reviewer role', async () => {
      const isValid = await reviewService.validateReviewerCredentials(
        '999',
        'reviewer'
      );
      expect(isValid).toBe(true);
    });

    it('should reject empty reviewer ID', async () => {
      const isValid = await reviewService.validateReviewerCredentials(
        '',
        'engineer'
      );
      expect(isValid).toBe(false);
    });
  });

  describe('Certificate Thumbprint Generation', () => {
    it('should generate certificate thumbprint', () => {
      const thumbprint = reviewService.generateCertificateThumbprint('certificate-data');
      expect(thumbprint).toBeDefined();
      expect(typeof thumbprint).toBe('string');
      expect(thumbprint.length).toBe(64); // SHA256 hex is 64 chars
    });

    it('should generate consistent thumbprints', () => {
      const cert = 'same-certificate-data';
      const thumbprint1 = reviewService.generateCertificateThumbprint(cert);
      const thumbprint2 = reviewService.generateCertificateThumbprint(cert);
      expect(thumbprint1).toBe(thumbprint2);
    });
  });
});
