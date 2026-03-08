/**
 * Certification Router Integration Tests
 * Tests certification services and PDF export functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { CertificationGenerationService } from '../certificationGenerationService';
import { CertificatePdfExportService } from '../services/certificatePdfExportService';

describe('Certification Router Integration Tests', () => {
  let certService: CertificationGenerationService;
  let pdfService: CertificatePdfExportService;

  beforeAll(() => {
    // Initialize services
    certService = new CertificationGenerationService('RSA-SHA256', 'sectigo');
    pdfService = new CertificatePdfExportService();
  });

  describe('Service Initialization', () => {
    it('should initialize certification service', () => {
      expect(certService).toBeDefined();
    });

    it('should initialize PDF export service', () => {
      expect(pdfService).toBeDefined();
    });

    it('should have certification service info', () => {
      const info = certService.getServiceInfo();
      expect(info).toBeDefined();
      expect(info.supportedAlgorithms).toBeDefined();
      expect(info.supportedTSAs).toBeDefined();
    });

    it('should have PDF export service info', () => {
      const info = pdfService.getServiceInfo();
      expect(info).toBeDefined();
      expect(info.supportedFormats).toBeDefined();
      expect(info.features).toBeDefined();
    });
  });

  describe('Certification Service Configuration', () => {
    it('should support RSA-SHA256 algorithm', () => {
      const info = certService.getServiceInfo();
      expect(info.supportedAlgorithms).toContain('RSA-SHA256');
    });

    it('should support ECDSA-SHA256 algorithm', () => {
      const info = certService.getServiceInfo();
      expect(info.supportedAlgorithms).toContain('ECDSA-SHA256');
    });

    it('should support Sectigo TSA', () => {
      const info = certService.getServiceInfo();
      expect(info.supportedTSAs).toContain('sectigo');
    });

    it('should support DigiCert TSA', () => {
      const info = certService.getServiceInfo();
      expect(info.supportedTSAs).toContain('digicert');
    });

    it('should support GlobalSign TSA', () => {
      const info = certService.getServiceInfo();
      expect(info.supportedTSAs).toContain('globalsign');
    });
  });

  describe('PDF Export Service Configuration', () => {
    it('should support PDF format', () => {
      const info = pdfService.getServiceInfo();
      expect(info.supportedFormats).toContain('pdf');
    });

    it('should support JSON format', () => {
      const info = pdfService.getServiceInfo();
      expect(info.supportedFormats).toContain('json');
    });

    it('should support CSV format', () => {
      const info = pdfService.getServiceInfo();
      expect(info.supportedFormats).toContain('csv');
    });

    it('should have digital signature feature', () => {
      const info = pdfService.getServiceInfo();
      expect(info.features.digitalSignatures).toBe(true);
    });

    it('should have timestamp feature', () => {
      const info = pdfService.getServiceInfo();
      expect(info.features.timestamps).toBe(true);
    });

    it('should have audit trail feature', () => {
      const info = pdfService.getServiceInfo();
      expect(info.features.auditTrails).toBe(true);
    });

    it('should have legal disclaimer feature', () => {
      const info = pdfService.getServiceInfo();
      expect(info.features.legalDisclaimers).toBe(true);
    });

    it('should have watermark feature', () => {
      const info = pdfService.getServiceInfo();
      expect(info.features.watermarks).toBe(true);
    });
  });

  describe('PDF Export Operations', () => {
    it('should export to PDF format', async () => {
      const mockCert = {
        certificateId: 'CERT-TEST-001',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToPdf(mockCert);

      // Should generate PDF
      expect(result).toBeDefined();
      expect(result.mimeType).toBe('application/pdf');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.fileName).toContain('CERT-TEST-001');
    });

    it('should export to JSON format', async () => {
      const mockCert = {
        certificateId: 'CERT-TEST-002',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToJson(mockCert);

      // Should generate JSON
      expect(result).toBeDefined();
      expect(result.mimeType).toBe('application/json');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.fileName).toContain('CERT-TEST-002');
    });

    it('should export to CSV format', async () => {
      const mockCert = {
        certificateId: 'CERT-TEST-003',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
        compliance: {
          projectId: 'project-123',
          status: 'compliant',
          outputs: {
            findings: [
              {
                code: 'NBC-3.2.2',
                description: 'Compliant',
                severity: 'info',
                reference: 'NBC 2023',
              },
            ],
          },
        },
      };

      const result = await pdfService.exportCertificateToCsv(mockCert);

      // Should generate CSV
      expect(result).toBeDefined();
      expect(result.mimeType).toBe('text/csv');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.fileName).toContain('CERT-TEST-003');
    });
  });


  describe('Export Options', () => {
    it('should export PDF with all sections', async () => {
      const mockCert = {
        certificateId: 'CERT-FULL',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToPdf(mockCert, {
        includeSignature: true,
        includeTimestamp: true,
        includeAuditTrail: true,
        includeDisclaimers: true,
      });

      // Should generate output with all sections
      expect(result).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should export PDF with selective sections', async () => {
      const mockCert = {
        certificateId: 'CERT-PARTIAL',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToPdf(mockCert, {
        includeSignature: false,
        includeTimestamp: false,
        includeAuditTrail: false,
        includeDisclaimers: false,
      });

      // Should generate output with selective sections
      expect(result).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should support A4 page size', async () => {
      const mockCert = {
        certificateId: 'CERT-A4',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToPdf(mockCert, {
        pageSize: 'A4',
      });

      // A4 page size should be supported
      expect(result).toBeDefined();
      expect(result.certificateId).toBe('CERT-A4');
    });

    it('should support Letter page size', async () => {
      const mockCert = {
        certificateId: 'CERT-LETTER',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToPdf(mockCert, {
        pageSize: 'Letter',
      });

      // Letter page size should be supported
      expect(result).toBeDefined();
      expect(result.certificateId).toBe('CERT-LETTER');
    });
  });

  describe('Export Metadata', () => {
    it('should include metadata in PDF export', async () => {
      const mockCert = {
        certificateId: 'CERT-META',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToPdf(mockCert);

      // Metadata should be present
      expect(result.metadata).toBeDefined();
      expect(result.metadata.generatedAt).toBeDefined();
      expect(result.metadata.encryptionAlgorithm).toBe('AES-256-GCM');
    });

    it('should include metadata in JSON export', async () => {
      const mockCert = {
        certificateId: 'CERT-JSON-META',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-456',
          userName: 'Another User',
          userEmail: 'another@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'ECDSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToJson(mockCert);

      // Metadata should be present
      expect(result.metadata).toBeDefined();
      expect(result.metadata.encryptionAlgorithm).toBe('AES-256-GCM');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing certificate ID gracefully', async () => {
      const result = await pdfService.exportCertificateToPdf(null as any);

      // Should handle error gracefully
      expect(result).toBeDefined();
      expect(result.error).toBeDefined();
    });

    it('should handle missing signer information gracefully', async () => {
      const mockCert = {
        certificateId: 'CERT-NO-SIGNER',
        version: '1.0',
        generatedAt: new Date(),
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const result = await pdfService.exportCertificateToPdf(mockCert as any);

      // Should still generate output even with missing signer
      expect(result).toBeDefined();
      expect(result.certificateId).toBe('CERT-NO-SIGNER');
    });
  });

  describe('Performance', () => {
    it('should export PDF within reasonable time', async () => {
      const mockCert = {
        certificateId: 'CERT-PERF',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const startTime = Date.now();
      await pdfService.exportCertificateToPdf(mockCert);
      const duration = Date.now() - startTime;

      // Should complete reasonably quickly
      expect(duration).toBeLessThan(10000);
    });

    it('should export JSON quickly', async () => {
      const mockCert = {
        certificateId: 'CERT-JSON-PERF',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const startTime = Date.now();
      await pdfService.exportCertificateToJson(mockCert);
      const duration = Date.now() - startTime;

      // Should be very fast
      expect(duration).toBeLessThan(5000);
    });

    it('should export CSV quickly', async () => {
      const mockCert = {
        certificateId: 'CERT-CSV-PERF',
        version: '1.0',
        generatedAt: new Date(),
        signer: {
          userId: 'user-123',
          userName: 'Test User',
          userEmail: 'test@example.com',
          userRole: 'professional',
        },
        digitalSignature: {
          algorithm: 'RSA-SHA256',
          signature: 'mock-signature',
          signedAt: new Date(),
        },
      };

      const startTime = Date.now();
      await pdfService.exportCertificateToCsv(mockCert);
      const duration = Date.now() - startTime;

      // Should be very fast
      expect(duration).toBeLessThan(5000);
    });
  });
});
