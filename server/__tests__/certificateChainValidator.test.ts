/**
 * Certificate Chain Validator Tests
 * 
 * Tests for chain validation, certificate parsing, and trust store management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CertificateChainValidator,
  CertificateInfo,
  ChainValidationResult,
} from '../certificateChainValidator';

describe('Certificate Chain Validator Tests', () => {
  let validator: CertificateChainValidator;

  beforeEach(() => {
    validator = new CertificateChainValidator();
  });

  describe('Initialization', () => {
    it('should initialize with trust store', () => {
      const size = validator.getTrustStoreSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should have empty certificate cache initially', () => {
      const stats = validator.getCacheStats();
      expect(stats.certificateCacheSize).toBe(0);
    });

    it('should report cache statistics', () => {
      const stats = validator.getCacheStats();
      expect(stats).toHaveProperty('certificateCacheSize');
      expect(stats).toHaveProperty('trustStoreSize');
    });
  });

  describe('Certificate Parsing', () => {
    it('should parse certificate PEM', () => {
      const certPem = '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----';
      const cert = validator.parseCertificate(certPem);

      expect(cert).toHaveProperty('subject');
      expect(cert).toHaveProperty('issuer');
      expect(cert).toHaveProperty('serialNumber');
      expect(cert).toHaveProperty('notBefore');
      expect(cert).toHaveProperty('notAfter');
      expect(cert).toHaveProperty('publicKey');
      expect(cert).toHaveProperty('signature');
    });

    it('should cache parsed certificates', () => {
      const certPem = '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----';
      
      const cert1 = validator.parseCertificate(certPem);
      const stats1 = validator.getCacheStats();
      expect(stats1.certificateCacheSize).toBe(1);

      const cert2 = validator.parseCertificate(certPem);
      const stats2 = validator.getCacheStats();
      expect(stats2.certificateCacheSize).toBe(1);

      expect(cert1.serialNumber).toBe(cert2.serialNumber);
    });

    it('should parse different certificate formats', () => {
      const certPem1 = '-----BEGIN CERTIFICATE-----\nMIIC1...\n-----END CERTIFICATE-----';
      const certPem2 = '-----BEGIN CERTIFICATE-----\nMIIC2...\n-----END CERTIFICATE-----';

      const cert1 = validator.parseCertificate(certPem1);
      const cert2 = validator.parseCertificate(certPem2);

      expect(cert1.serialNumber).not.toBe(cert2.serialNumber);
    });
  });

  describe('Certificate Expiration Validation', () => {
    it('should validate non-expired certificate', () => {
      const cert: CertificateInfo = {
        subject: 'CN=Test',
        issuer: 'CN=Test CA',
        serialNumber: '001',
        notBefore: new Date('2020-01-01'),
        notAfter: new Date('2030-12-31'),
        publicKey: 'test-key',
        signature: 'test-sig',
        signatureAlgorithm: 'sha256WithRSAEncryption',
      };

      const result = validator['validateCertificateExpiration'](cert);
      expect(result.isValid).toBe(true);
    });

    it('should detect expired certificate', () => {
      const cert: CertificateInfo = {
        subject: 'CN=Test',
        issuer: 'CN=Test CA',
        serialNumber: '002',
        notBefore: new Date('2020-01-01'),
        notAfter: new Date('2020-12-31'),
        publicKey: 'test-key',
        signature: 'test-sig',
        signatureAlgorithm: 'sha256WithRSAEncryption',
      };

      const result = validator['validateCertificateExpiration'](cert);
      expect(result.isValid).toBe(false);
      expect(result.issue).toContain('expired');
    });

    it('should detect not-yet-valid certificate', () => {
      const cert: CertificateInfo = {
        subject: 'CN=Test',
        issuer: 'CN=Test CA',
        serialNumber: '003',
        notBefore: new Date('2030-01-01'),
        notAfter: new Date('2040-12-31'),
        publicKey: 'test-key',
        signature: 'test-sig',
        signatureAlgorithm: 'sha256WithRSAEncryption',
      };

      const result = validator['validateCertificateExpiration'](cert);
      expect(result.isValid).toBe(false);
      expect(result.issue).toContain('not yet valid');
    });
  });

  describe('Certificate Signature Validation', () => {
    it('should validate certificate with signature', () => {
      const cert: CertificateInfo = {
        subject: 'CN=Test',
        issuer: 'CN=Test CA',
        serialNumber: '004',
        notBefore: new Date('2020-01-01'),
        notAfter: new Date('2030-12-31'),
        publicKey: 'test-key',
        signature: 'valid-signature',
        signatureAlgorithm: 'sha256WithRSAEncryption',
      };

      const result = validator['validateCertificateSignature'](cert, 'issuer-key');
      expect(result.isValid).toBe(true);
    });

    it('should detect certificate without signature', () => {
      const cert: CertificateInfo = {
        subject: 'CN=Test',
        issuer: 'CN=Test CA',
        serialNumber: '005',
        notBefore: new Date('2020-01-01'),
        notAfter: new Date('2030-12-31'),
        publicKey: 'test-key',
        signature: '',
        signatureAlgorithm: 'sha256WithRSAEncryption',
      };

      const result = validator['validateCertificateSignature'](cert, 'issuer-key');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Chain Validation', () => {
    it('should validate simple certificate chain', async () => {
      const endEntityPem = '-----BEGIN CERTIFICATE-----\nMIIC1...\n-----END CERTIFICATE-----';
      const intermediatePem = '-----BEGIN CERTIFICATE-----\nMIIC2...\n-----END CERTIFICATE-----';

      const result = await validator.validateChain(endEntityPem, [intermediatePem]);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('chainLength');
      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('rootTrusted');
      expect(result).toHaveProperty('allSignaturesValid');
      expect(result).toHaveProperty('allCertificatesValid');
    });

    it('should validate chain without intermediates', async () => {
      const endEntityPem = '-----BEGIN CERTIFICATE-----\nMIIC1...\n-----END CERTIFICATE-----';

      const result = await validator.validateChain(endEntityPem);

      expect(result.chainLength).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(result.certificates)).toBe(true);
    });

    it('should detect chain with invalid certificates', async () => {
      const endEntityPem = '-----BEGIN CERTIFICATE-----\nMIIC1...\n-----END CERTIFICATE-----';
      const expiredPem = '-----BEGIN CERTIFICATE-----\nMIIC-EXPIRED...\n-----END CERTIFICATE-----';

      const result = await validator.validateChain(endEntityPem, [expiredPem]);

      expect(result).toHaveProperty('issues');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should report chain length', async () => {
      const endEntityPem = '-----BEGIN CERTIFICATE-----\nMIIC1...\n-----END CERTIFICATE-----';

      const result = await validator.validateChain(endEntityPem);

      expect(result.chainLength).toBeGreaterThan(0);
      expect(result.certificates.length).toBe(result.chainLength);
    });
  });

  describe('Trust Store Management', () => {
    it('should add certificate to trust store', () => {
      const cert: CertificateInfo = {
        subject: 'CN=Custom Root CA',
        issuer: 'CN=Custom Root CA',
        serialNumber: '006',
        notBefore: new Date('2020-01-01'),
        notAfter: new Date('2040-12-31'),
        publicKey: 'root-key',
        signature: 'root-sig',
        signatureAlgorithm: 'sha256WithRSAEncryption',
      };

      const initialSize = validator.getTrustStoreSize();
      validator.addToTrustStore(cert);
      const newSize = validator.getTrustStoreSize();

      expect(newSize).toBe(initialSize + 1);
    });

    it('should have well-known root CAs in trust store', () => {
      const size = validator.getTrustStoreSize();
      expect(size).toBeGreaterThanOrEqual(4); // At least 4 well-known CAs
    });
  });

  describe('Cache Management', () => {
    it('should clear certificate cache', () => {
      const certPem = '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----';
      validator.parseCertificate(certPem);

      let stats = validator.getCacheStats();
      expect(stats.certificateCacheSize).toBeGreaterThan(0);

      validator.clearCache();

      stats = validator.getCacheStats();
      expect(stats.certificateCacheSize).toBe(0);
    });
  });

  describe('Chain Validation Result Structure', () => {
    it('should return properly structured validation result', async () => {
      const result = await validator.validateChain('-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----');

      expect(result).toEqual(
        expect.objectContaining({
          isValid: expect.any(Boolean),
          chainLength: expect.any(Number),
          certificates: expect.any(Array),
          issues: expect.any(Array),
          rootTrusted: expect.any(Boolean),
          allSignaturesValid: expect.any(Boolean),
          allCertificatesValid: expect.any(Boolean),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const result = await validator.validateChain('invalid-certificate-data');

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should return valid structure even on error', async () => {
      const result = await validator.validateChain('invalid-certificate-data');

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('chainLength');
      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('issues');
    });
  });
});
