/**
 * Comprehensive Test Suite for Certificate PDF Export Service
 * Tests PDF, JSON, and CSV export functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { CertificatePdfExportService, createPdfExportService, PdfExportOptions } from '../services/certificatePdfExportService';

describe('Certificate PDF Export Service Tests', () => {
  let exportService: CertificatePdfExportService;
  let mockCertification: any;

  beforeAll(() => {
    exportService = createPdfExportService();

    // Create mock certification
    mockCertification = {
      certificateId: 'CERT-TEST-001',
      version: '1.0',
      generatedAt: new Date(),
      sourceSnapshotId: 'snapshot-123',
      legalDisclaimers: {
        professionalService: {
          type: 'PROFESSIONAL_SERVICE_NOTICE',
          text: 'This is NOT a professional building code compliance review.',
          acknowledged: true,
        },
        jurisdiction: {
          type: 'JURISDICTION_NOTICE',
          text: 'Building codes vary by jurisdiction.',
          acknowledged: true,
        },
        liability: {
          type: 'LIABILITY_DISCLAIMER',
          text: 'No warranties provided.',
          acknowledged: true,
        },
        userResponsibility: {
          type: 'USER_RESPONSIBILITY_NOTICE',
          text: 'User is responsible for verification.',
          acknowledged: true,
        },
      },
      compliance: {
        snapshotId: 'snapshot-123',
        projectId: 'project-456',
        userId: 'user-789',
        rulesetId: 'nbc_ae_2023_v1',
        status: 'compliant',
        inputs: { buildingType: 'residential', jurisdiction: 'Alberta' },
        outputs: {
          findings: [
            {
              code: 'NBC-3.2.2',
              description: 'Building complies with fire safety',
              severity: 'info',
              reference: 'NBC 2023 Section 3.2.2',
            },
          ],
          status: 'compliant',
          summary: 'All requirements met',
        },
        ruleTrace: [],
        createdAt: new Date(),
      },
      digitalSignature: {
        algorithm: 'RSA-SHA256',
        signature: 'base64encodedSignature123456789',
        signedAt: new Date(),
        signedBy: 'user-789',
      },
      rfc3161Timestamp: {
        timestamp: new Date().toISOString(),
        tsaName: 'Sectigo',
        tsaUrl: 'http://timestamp.sectigo.com',
      },
      signer: {
        userId: 'user-789',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        userRole: 'professional',
        signedAt: new Date(),
      },
      auditTrail: {
        generatedBy: 'user-789',
        generatedAt: new Date(),
        signatureAlgorithm: 'RSA-SHA256',
        timestampAuthority: 'Sectigo',
        encryptionAlgorithm: 'AES-256-GCM',
      },
    };
  });

  describe('Service Initialization', () => {
    it('should initialize PDF export service', () => {
      const service = createPdfExportService();
      expect(service).toBeDefined();
    });

    it('should return service info', () => {
      const info = exportService.getServiceInfo();
      expect(info).toBeDefined();
      expect(info.supportedFormats).toContain('pdf');
      expect(info.supportedFormats).toContain('json');
      expect(info.supportedFormats).toContain('csv');
    });

    it('should have default export options', () => {
      const info = exportService.getServiceInfo();
      expect(info.defaultOptions).toBeDefined();
      expect(info.defaultOptions.includeSignature).toBe(true);
      expect(info.defaultOptions.includeTimestamp).toBe(true);
      expect(info.defaultOptions.includeAuditTrail).toBe(true);
      expect(info.defaultOptions.includeDisclaimers).toBe(true);
    });

    it('should have all features enabled', () => {
      const info = exportService.getServiceInfo();
      expect(info.features.digitalSignatures).toBe(true);
      expect(info.features.timestamps).toBe(true);
      expect(info.features.auditTrails).toBe(true);
      expect(info.features.legalDisclaimers).toBe(true);
      expect(info.features.watermarks).toBe(true);
    });
  });

  describe('PDF Export', () => {
    it('should export certificate to PDF', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.success).toBe(true);
      expect(result.certificateId).toBe('CERT-TEST-001');
      expect(result.fileName).toContain('certificate-CERT-TEST-001.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.buffer).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should include all sections in PDF by default', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('CERTIFICATE INFORMATION');
      expect(content).toContain('LEGAL DISCLAIMERS');
      expect(content).toContain('COMPLIANCE INFORMATION');
      expect(content).toContain('DIGITAL SIGNATURE');
      expect(content).toContain('RFC 3161 TIMESTAMP');
      expect(content).toContain('AUDIT TRAIL');
    });

    it('should exclude sections based on options', async () => {
      const options: Partial<PdfExportOptions> = {
        includeDisclaimers: false,
        includeSignature: false,
        includeTimestamp: false,
        includeAuditTrail: false,
      };

      const result = await exportService.exportCertificateToPdf(mockCertification, options);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('CERTIFICATE INFORMATION');
      expect(content).toContain('COMPLIANCE INFORMATION');
      expect(content).not.toContain('LEGAL DISCLAIMERS');
      expect(content).not.toContain('DIGITAL SIGNATURE');
      expect(content).not.toContain('RFC 3161 TIMESTAMP');
      expect(content).not.toContain('AUDIT TRAIL');
    });

    it('should include certificate ID in PDF', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('CERT-TEST-001');
    });

    it('should include signer information in PDF', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('John Doe');
      expect(content).toContain('john@example.com');
      expect(content).toContain('professional');
    });

    it('should include compliance findings in PDF', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('NBC-3.2.2');
      expect(content).toContain('Building complies with fire safety');
    });

    it('should handle missing certification ID', async () => {
      const invalidCert = { ...mockCertification };
      delete invalidCert.certificateId;

      const result = await exportService.exportCertificateToPdf(invalidCert);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should set correct MIME type', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.mimeType).toBe('application/pdf');
    });

    it('should set correct file name format', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.fileName).toMatch(/^certificate-CERT-TEST-001\.pdf$/);
    });

    it('should include metadata in result', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.generatedAt).toBeDefined();
      expect(result.metadata.generatedBy).toBe('user-789');
      expect(result.metadata.signatureAlgorithm).toBe('RSA-SHA256');
      expect(result.metadata.encryptionAlgorithm).toBe('AES-256-GCM');
    });
  });

  describe('JSON Export', () => {
    it('should export certificate to JSON', async () => {
      const result = await exportService.exportCertificateToJson(mockCertification);

      expect(result.success).toBe(true);
      expect(result.certificateId).toBe('CERT-TEST-001');
      expect(result.fileName).toContain('certificate-CERT-TEST-001.json');
      expect(result.mimeType).toBe('application/json');
      expect(result.buffer).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should include all certification data in JSON', async () => {
      const result = await exportService.exportCertificateToJson(mockCertification);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      const parsed = JSON.parse(content);

      expect(parsed.certificateId).toBe('CERT-TEST-001');
      expect(parsed.signer).toBeDefined();
      expect(parsed.compliance).toBeDefined();
      expect(parsed.digitalSignature).toBeDefined();
    });

    it('should set correct MIME type for JSON', async () => {
      const result = await exportService.exportCertificateToJson(mockCertification);

      expect(result.mimeType).toBe('application/json');
    });

    it('should set correct file name format for JSON', async () => {
      const result = await exportService.exportCertificateToJson(mockCertification);

      expect(result.fileName).toMatch(/^certificate-CERT-TEST-001\.json$/);
    });
  });

  describe('CSV Export', () => {
    it('should export certificate to CSV', async () => {
      const result = await exportService.exportCertificateToCsv(mockCertification);

      expect(result.success).toBe(true);
      expect(result.certificateId).toBe('CERT-TEST-001');
      expect(result.fileName).toContain('certificate-CERT-TEST-001.csv');
      expect(result.mimeType).toBe('text/csv');
      expect(result.buffer).toBeDefined();
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should include certificate information in CSV', async () => {
      const result = await exportService.exportCertificateToCsv(mockCertification);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('Certificate Information');
      expect(content).toContain('CERT-TEST-001');
    });

    it('should include signer information in CSV', async () => {
      const result = await exportService.exportCertificateToCsv(mockCertification);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('Signer Information');
      expect(content).toContain('John Doe');
      expect(content).toContain('john@example.com');
    });

    it('should include findings in CSV', async () => {
      const result = await exportService.exportCertificateToCsv(mockCertification);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('Findings');
      expect(content).toContain('NBC-3.2.2');
    });

    it('should set correct MIME type for CSV', async () => {
      const result = await exportService.exportCertificateToCsv(mockCertification);

      expect(result.mimeType).toBe('text/csv');
    });

    it('should set correct file name format for CSV', async () => {
      const result = await exportService.exportCertificateToCsv(mockCertification);

      expect(result.fileName).toMatch(/^certificate-CERT-TEST-001\.csv$/);
    });
  });

  describe('Export Metadata', () => {
    it('should include metadata in all exports', async () => {
      const pdfResult = await exportService.exportCertificateToPdf(mockCertification);
      const jsonResult = await exportService.exportCertificateToJson(mockCertification);
      const csvResult = await exportService.exportCertificateToCsv(mockCertification);

      [pdfResult, jsonResult, csvResult].forEach((result) => {
        expect(result.metadata).toBeDefined();
        expect(result.metadata.generatedAt).toBeDefined();
        expect(result.metadata.generatedBy).toBe('user-789');
        expect(result.metadata.signatureAlgorithm).toBe('RSA-SHA256');
        expect(result.metadata.encryptionAlgorithm).toBe('AES-256-GCM');
      });
    });

    it('should record file size in metadata', async () => {
      const result = await exportService.exportCertificateToPdf(mockCertification);

      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.fileSize).toBe(result.buffer?.length || 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle export with missing signer', async () => {
      const invalidCert = { ...mockCertification };
      delete invalidCert.signer;

      const result = await exportService.exportCertificateToPdf(invalidCert);

      // Should still succeed but with error handling
      expect(result).toBeDefined();
      expect(result.certificateId).toBe('CERT-TEST-001');
    });

    it('should handle export with missing compliance data', async () => {
      const invalidCert = { ...mockCertification };
      delete invalidCert.compliance;

      const result = await exportService.exportCertificateToPdf(invalidCert);

      expect(result.success).toBe(true);
      const content = result.buffer?.toString('utf-8') || '';
      expect(content).toContain('CERTIFICATE INFORMATION');
    });

    it('should handle null certification gracefully', async () => {
      const result = await exportService.exportCertificateToPdf(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Export Options', () => {
    it('should support A4 page size', async () => {
      const options: Partial<PdfExportOptions> = {
        pageSize: 'A4',
      };

      const result = await exportService.exportCertificateToPdf(mockCertification, options);

      expect(result.success).toBe(true);
    });

    it('should support Letter page size', async () => {
      const options: Partial<PdfExportOptions> = {
        pageSize: 'Letter',
      };

      const result = await exportService.exportCertificateToPdf(mockCertification, options);

      expect(result.success).toBe(true);
    });

    it('should support portrait orientation', async () => {
      const options: Partial<PdfExportOptions> = {
        orientation: 'portrait',
      };

      const result = await exportService.exportCertificateToPdf(mockCertification, options);

      expect(result.success).toBe(true);
    });

    it('should support landscape orientation', async () => {
      const options: Partial<PdfExportOptions> = {
        orientation: 'landscape',
      };

      const result = await exportService.exportCertificateToPdf(mockCertification, options);

      expect(result.success).toBe(true);
    });

    it('should support custom watermark', async () => {
      const options: Partial<PdfExportOptions> = {
        watermark: 'CONFIDENTIAL',
      };

      const result = await exportService.exportCertificateToPdf(mockCertification, options);

      expect(result.success).toBe(true);
    });
  });

  describe('Export Performance', () => {
    it('should export PDF within reasonable time', async () => {
      const startTime = Date.now();
      await exportService.exportCertificateToPdf(mockCertification);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    it('should export JSON quickly', async () => {
      const startTime = Date.now();
      await exportService.exportCertificateToJson(mockCertification);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should export CSV quickly', async () => {
      const startTime = Date.now();
      await exportService.exportCertificateToCsv(mockCertification);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
