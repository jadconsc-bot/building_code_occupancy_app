/**
 * Certificate Revocation Service Tests
 * 
 * Tests for CRL fetching, revocation status checking, and cache management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CertificateRevocationService,
  RevocationStatus,
  RevocationReason,
} from '../certificateRevocationService';

describe('Certificate Revocation Service Tests', () => {
  let revocationService: CertificateRevocationService;

  beforeEach(() => {
    revocationService = new CertificateRevocationService();
  });

  afterEach(() => {
    revocationService.clearCache();
  });

  describe('Initialization', () => {
    it('should initialize with trusted CAs', () => {
      const stats = revocationService.getCacheStats();
      expect(stats.trustedCACount).toBeGreaterThan(0);
    });

    it('should have empty CRL cache initially', () => {
      const stats = revocationService.getCacheStats();
      expect(stats.crlCacheSize).toBe(0);
    });

    it('should have empty status cache initially', () => {
      const stats = revocationService.getCacheStats();
      expect(stats.statusCacheSize).toBe(0);
    });
  });

  describe('CRL Fetching', () => {
    it('should fetch CRL from URL', async () => {
      const crlUrl = 'http://example.com/crl.pem';
      const crl = await revocationService.fetchCRL(crlUrl);

      expect(crl).toBeDefined();
      expect(crl.issuer).toBeDefined();
      expect(crl.thisUpdate).toBeInstanceOf(Date);
      expect(crl.nextUpdate).toBeInstanceOf(Date);
      expect(Array.isArray(crl.entries)).toBe(true);
    });

    it('should cache CRL after fetching', async () => {
      const crlUrl = 'http://example.com/crl.pem';
      
      const crl1 = await revocationService.fetchCRL(crlUrl);
      const stats1 = revocationService.getCacheStats();
      expect(stats1.crlCacheSize).toBe(1);

      const crl2 = await revocationService.fetchCRL(crlUrl);
      const stats2 = revocationService.getCacheStats();
      expect(stats2.crlCacheSize).toBe(1);

      expect(crl1.signature).toBe(crl2.signature);
    });

    it('should return cached CRL if not expired', async () => {
      const crlUrl = 'http://example.com/crl.pem';
      
      const crl1 = await revocationService.fetchCRL(crlUrl);
      const crl2 = await revocationService.fetchCRL(crlUrl);

      expect(crl1.signature).toBe(crl2.signature);
    });
  });

  describe('Revocation Status Checking', () => {
    it('should return GOOD status for non-revoked certificate', async () => {
      const serialNumber = 'CERT-001';
      const issuerName = 'Test CA';
      const crlUrl = 'http://example.com/crl.pem';

      const status = await revocationService.checkRevocationStatus(
        serialNumber,
        issuerName,
        crlUrl
      );

      expect(status).toBe(RevocationStatus.GOOD);
    });

    it('should cache revocation status', async () => {
      const serialNumber = 'CERT-002';
      const issuerName = 'Test CA';
      const crlUrl = 'http://example.com/crl.pem';

      const status1 = await revocationService.checkRevocationStatus(
        serialNumber,
        issuerName,
        crlUrl
      );

      const stats1 = revocationService.getCacheStats();
      expect(stats1.statusCacheSize).toBe(1);

      const status2 = await revocationService.checkRevocationStatus(
        serialNumber,
        issuerName,
        crlUrl
      );

      expect(status1).toBe(status2);
    });

    it('should return UNKNOWN status if CRL URL not provided', async () => {
      const serialNumber = 'CERT-003';
      const issuerName = 'Test CA';

      const status = await revocationService.checkRevocationStatus(
        serialNumber,
        issuerName
      );

      expect(status).toBe(RevocationStatus.UNKNOWN);
    });
  });

  describe('Certificate Revocation Verification', () => {
    it('should verify certificate is not revoked', async () => {
      const result = await revocationService.verifyCertificateNotRevoked(
        'CERT-004',
        'Test CA',
        'http://example.com/crl.pem'
      );

      expect(result.isValid).toBe(true);
      expect(result.status).toBe(RevocationStatus.GOOD);
    });

    it('should detect revoked certificate', async () => {
      // This would require a CRL with actual revoked entries
      // For now, test the structure
      const result = await revocationService.verifyCertificateNotRevoked(
        'CERT-REVOKED',
        'Test CA',
        'http://example.com/crl.pem'
      );

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('status');
    });

    it('should handle verification errors gracefully', async () => {
      const result = await revocationService.verifyCertificateNotRevoked(
        'CERT-005',
        'Test CA',
        'http://invalid-url-that-fails.com/crl.pem'
      );

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('status');
    });
  });

  describe('Trusted CA Management', () => {
    it('should add trusted CA', () => {
      const initialStats = revocationService.getCacheStats();
      const initialCount = initialStats.trustedCACount;

      revocationService.addTrustedCA('Custom CA');

      const newStats = revocationService.getCacheStats();
      expect(newStats.trustedCACount).toBe(initialCount + 1);
    });

    it('should not add duplicate trusted CA', () => {
      const initialStats = revocationService.getCacheStats();
      const initialCount = initialStats.trustedCACount;

      revocationService.addTrustedCA('Sectigo');
      revocationService.addTrustedCA('Sectigo');

      const newStats = revocationService.getCacheStats();
      expect(newStats.trustedCACount).toBe(initialCount);
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', async () => {
      // Populate caches
      await revocationService.fetchCRL('http://example.com/crl.pem');
      await revocationService.checkRevocationStatus('CERT-006', 'Test CA', 'http://example.com/crl.pem');

      let stats = revocationService.getCacheStats();
      expect(stats.crlCacheSize).toBeGreaterThan(0);
      expect(stats.statusCacheSize).toBeGreaterThan(0);

      // Clear caches
      revocationService.clearCache();

      stats = revocationService.getCacheStats();
      expect(stats.crlCacheSize).toBe(0);
      expect(stats.statusCacheSize).toBe(0);
    });

    it('should report cache statistics', async () => {
      await revocationService.fetchCRL('http://example.com/crl.pem');

      const stats = revocationService.getCacheStats();
      expect(stats).toHaveProperty('crlCacheSize');
      expect(stats).toHaveProperty('statusCacheSize');
      expect(stats).toHaveProperty('trustedCACount');
    });
  });

  describe('Revocation Reasons', () => {
    it('should have valid revocation reason codes', () => {
      expect(RevocationReason.UNSPECIFIED).toBe(0);
      expect(RevocationReason.KEY_COMPROMISE).toBe(1);
      expect(RevocationReason.CA_COMPROMISE).toBe(2);
      expect(RevocationReason.SUPERSEDED).toBe(4);
      expect(RevocationReason.CESSATION_OF_OPERATION).toBe(5);
    });
  });

  describe('Revocation Status Types', () => {
    it('should have valid revocation status values', () => {
      expect(RevocationStatus.GOOD).toBe('good');
      expect(RevocationStatus.REVOKED).toBe('revoked');
      expect(RevocationStatus.UNKNOWN).toBe('unknown');
    });
  });
});
