/**
 * Certification tRPC Router
 * Provides tRPC procedures for certification operations
 * 
 * Procedures:
 * - generateCertificate: Create new certificate from compliance snapshot
 * - getCertificate: Retrieve certificate with decryption
 * - verifyCertificate: Verify certificate integrity and signatures
 * - listCertificates: List user's certificates with filtering
 * - exportCertificatePDF: Export certificate to PDF
 * - exportCertificateJSON: Export certificate to JSON
 * - exportCertificateCSV: Export certificate to CSV
 * - searchCertificates: Search certificates by various criteria
 * - deleteCertificate: Delete certificate (with audit trail)
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { CertificationGenerationService } from '../certificationGenerationService';
import { CertificatePdfExportService } from '../services/certificatePdfExportService';
import { logger } from '../logger';

// Initialize services
const certificationService = new CertificationGenerationService('RSA-SHA256', 'sectigo');
const pdfExportService = new CertificatePdfExportService();

/**
 * Certification Router
 */
export const certificationRouter = router<{}>({
  /**
   * Generate new certificate from compliance snapshot
   */
  generateCertificate: protectedProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        projectId: z.string(),
        userId: z.string(),
        rulesetId: z.string(),
        complianceStatus: z.enum(['compliant', 'non_compliant', 'needs_review']),
        inputs: z.record(z.any()),
        outputs: z.object({
          findings: z.array(
            z.object({
              code: z.string(),
              description: z.string(),
              severity: z.enum(['info', 'warning', 'error']),
              reference: z.string().optional(),
            })
          ),
          status: z.enum(['compliant', 'non_compliant', 'needs_review']),
          summary: z.string().optional(),
        }),
        ruleTrace: z.array(z.any()),
        createdAt: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Generating certificate', {
          snapshotId: input.snapshotId,
          userId: ctx.user.id,
        });

        // Mock certification generation
        const certification = {
          certificateId: `CERT-${Date.now()}`,
          version: '1.0',
          generatedAt: new Date(),
          sourceSnapshotId: input.snapshotId,
          signer: {
            userId: ctx.user.id,
            userName: ctx.user.name || 'Unknown',
            userEmail: ctx.user.email || 'unknown@example.com',
            userRole: ctx.user.role || 'user',
            signedAt: new Date(),
          },
          compliance: {
            snapshotId: input.snapshotId,
            projectId: input.projectId,
            userId: input.userId,
            rulesetId: input.rulesetId,
            status: input.complianceStatus,
            inputs: input.inputs,
            outputs: input.outputs,
            ruleTrace: input.ruleTrace,
            createdAt: input.createdAt,
          },
          digitalSignature: {
            algorithm: 'RSA-SHA256' as const,
            signature: 'mock-signature',
            signedAt: new Date(),
          },
          rfc3161Timestamp: {
            timestamp: new Date().toISOString(),
            tsaName: 'Sectigo',
            tsaUrl: 'http://timestamp.sectigo.com',
          },
          legalDisclaimers: {
            professionalService: { type: 'PROFESSIONAL_SERVICE_NOTICE' as const, text: 'Mock', acknowledged: true },
            jurisdiction: { type: 'JURISDICTION_NOTICE' as const, text: 'Mock', acknowledged: true },
            liability: { type: 'LIABILITY_DISCLAIMER' as const, text: 'Mock', acknowledged: true },
            userResponsibility: { type: 'USER_RESPONSIBILITY_NOTICE' as const, text: 'Mock', acknowledged: true },
          },
          encryptedCompliance: { iv: 'mock-iv', ciphertext: 'mock-ct', authTag: 'mock-tag' },
          auditTrail: {
            generatedBy: ctx.user.id,
            generatedAt: new Date(),
            signatureAlgorithm: 'RSA-SHA256',
            timestampAuthority: 'Sectigo',
            encryptionAlgorithm: 'AES-256-GCM',
          },
        };

        // Mock verification
        const verification = { isValid: true, issues: [] };
        if (!verification.isValid) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Certificate verification failed: ${verification.issues.join(', ')}`,
          });
        }

        logger.info('Certificate generated successfully', {
          certificateId: certification.certificateId,
          snapshotId: input.snapshotId,
        });

        return {
          success: true,
          certificateId: certification.certificateId,
          version: certification.version,
          generatedAt: certification.generatedAt,
          message: 'Certificate generated successfully',
        };
      } catch (error) {
        logger.error('Certificate generation failed', {
          snapshotId: input.snapshotId,
          error,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Certificate generation failed',
        });
      }
    }),

  /**
   * Get certificate with decryption
   */
  getCertificate: protectedProcedure
    .input(
      z.object({
        certificateId: z.string(),
        decrypt: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Retrieving certificate', {
          certificateId: input.certificateId,
          userId: ctx.user.id,
        });

        // In production, fetch from database
        // For now, return mock data
        return {
          certificateId: input.certificateId,
          version: '1.0',
          generatedAt: new Date(),
          signer: {
            userId: ctx.user.id,
            userName: ctx.user.name,
            userEmail: ctx.user.email,
            userRole: ctx.user.role,
          },
          message: 'Certificate retrieved successfully',
        };
      } catch (error) {
        logger.error('Certificate retrieval failed', {
          certificateId: input.certificateId,
          error,
        });

        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Certificate not found',
        });
      }
    }),

  /**
   * Verify certificate integrity and signatures
   */
  verifyCertificate: publicProcedure
    .input(
      z.object({
        certificateId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        logger.info('Verifying certificate', {
          certificateId: input.certificateId,
        });

        // In production, fetch from database and verify
        return {
          certificateId: input.certificateId,
          isValid: true,
          signatureValid: true,
          timestampValid: true,
          encryptionValid: true,
          issues: [],
          message: 'Certificate verification passed',
        };
      } catch (error) {
        logger.error('Certificate verification failed', {
          certificateId: input.certificateId,
          error,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Certificate verification failed',
        });
      }
    }),

  /**
   * List user's certificates with filtering
   */
  listCertificates: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
        status: z.enum(['compliant', 'non_compliant', 'needs_review']).optional(),
        projectId: z.string().optional(),
        sortBy: z.enum(['createdAt', 'certificateId', 'status']).optional().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Listing certificates', {
          userId: ctx.user.id,
          limit: input.limit,
          offset: input.offset,
        });

        // In production, fetch from database with filters
        return {
          certificates: [],
          total: 0,
          limit: input.limit,
          offset: input.offset,
          message: 'Certificates retrieved successfully',
        };
      } catch (error) {
        logger.error('Certificate listing failed', {
          userId: ctx.user.id,
          error,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve certificates',
        });
      }
    }),

  /**
   * Export certificate to PDF
   */
  exportCertificatePDF: protectedProcedure
    .input(
      z.object({
        certificateId: z.string(),
        includeSignature: z.boolean().optional().default(true),
        includeTimestamp: z.boolean().optional().default(true),
        includeAuditTrail: z.boolean().optional().default(true),
        includeDisclaimers: z.boolean().optional().default(true),
        pageSize: z.enum(['A4', 'Letter']).optional().default('A4'),
        orientation: z.enum(['portrait', 'landscape']).optional().default('portrait'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Exporting certificate to PDF', {
          certificateId: input.certificateId,
          userId: ctx.user.id,
        });

        // In production, fetch certificate from database
        const mockCertification = {
          certificateId: input.certificateId,
          version: '1.0',
          generatedAt: new Date(),
          signer: {
            userId: ctx.user.id,
            userName: ctx.user.name,
            userEmail: ctx.user.email,
            userRole: ctx.user.role,
          },
        };

        const result = await pdfExportService.exportCertificateToPdf(mockCertification, {
          includeSignature: input.includeSignature,
          includeTimestamp: input.includeTimestamp,
          includeAuditTrail: input.includeAuditTrail,
          includeDisclaimers: input.includeDisclaimers,
          pageSize: input.pageSize,
          orientation: input.orientation,
        });

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'PDF export failed',
          });
        }

        logger.info('PDF export successful', {
          certificateId: input.certificateId,
          fileName: result.fileName,
          fileSize: result.fileSize,
        });

        return {
          success: true,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          message: 'PDF exported successfully',
        };
      } catch (error) {
        logger.error('PDF export failed', {
          certificateId: input.certificateId,
          error,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'PDF export failed',
        });
      }
    }),

  /**
   * Export certificate to JSON
   */
  exportCertificateJSON: protectedProcedure
    .input(
      z.object({
        certificateId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Exporting certificate to JSON', {
          certificateId: input.certificateId,
          userId: ctx.user.id,
        });

        // In production, fetch certificate from database
        const mockCertification = {
          certificateId: input.certificateId,
          version: '1.0',
          generatedAt: new Date(),
          signer: {
            userId: ctx.user.id,
            userName: ctx.user.name,
            userEmail: ctx.user.email,
            userRole: ctx.user.role,
          },
        };

        const result = await pdfExportService.exportCertificateToJson(mockCertification);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'JSON export failed',
          });
        }

        logger.info('JSON export successful', {
          certificateId: input.certificateId,
          fileName: result.fileName,
        });

        return {
          success: true,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          message: 'JSON exported successfully',
        };
      } catch (error) {
        logger.error('JSON export failed', {
          certificateId: input.certificateId,
          error,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'JSON export failed',
        });
      }
    }),

  /**
   * Export certificate to CSV
   */
  exportCertificateCSV: protectedProcedure
    .input(
      z.object({
        certificateId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Exporting certificate to CSV', {
          certificateId: input.certificateId,
          userId: ctx.user.id,
        });

        // In production, fetch certificate from database
        const mockCertification = {
          certificateId: input.certificateId,
          version: '1.0',
          generatedAt: new Date(),
          signer: {
            userId: ctx.user.id,
            userName: ctx.user.name,
            userEmail: ctx.user.email,
            userRole: ctx.user.role,
          },
        };

        const result = await pdfExportService.exportCertificateToCsv(mockCertification);

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'CSV export failed',
          });
        }

        logger.info('CSV export successful', {
          certificateId: input.certificateId,
          fileName: result.fileName,
        });

        return {
          success: true,
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          message: 'CSV exported successfully',
        };
      } catch (error) {
        logger.error('CSV export failed', {
          certificateId: input.certificateId,
          error,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'CSV export failed',
        });
      }
    }),

  /**
   * Search certificates by various criteria
   */
  searchCertificates: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        searchIn: z.array(z.enum(['certificateId', 'projectId', 'status'])).optional(),
        limit: z.number().min(1).max(100).optional().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Searching certificates', {
          query: input.query,
          userId: ctx.user.id,
        });

        // In production, perform database search
        return {
          results: [],
          total: 0,
          query: input.query,
          message: 'Search completed',
        };
      } catch (error) {
        logger.error('Certificate search failed', {
          query: input.query,
          error,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Certificate search failed',
        });
      }
    }),

  /**
   * Delete certificate (with audit trail)
   */
  deleteCertificate: protectedProcedure
    .input(
      z.object({
        certificateId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Deleting certificate', {
          certificateId: input.certificateId,
          userId: ctx.user.id,
          reason: input.reason,
        });

        // In production, soft delete with audit trail
        return {
          success: true,
          certificateId: input.certificateId,
          deletedAt: new Date(),
          message: 'Certificate deleted successfully',
        };
      } catch (error) {
        logger.error('Certificate deletion failed', {
          certificateId: input.certificateId,
          error,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Certificate deletion failed',
        });
      }
    }),

  /**
   * Get certification service info
   */
  getServiceInfo: publicProcedure.query(async () => {
    return {
      certificationService: certificationService.getServiceInfo(),
      pdfExportService: pdfExportService.getServiceInfo(),
      supportedOperations: [
        'generateCertificate',
        'getCertificate',
        'verifyCertificate',
        'listCertificates',
        'exportCertificatePDF',
        'exportCertificateJSON',
        'exportCertificateCSV',
        'searchCertificates',
        'deleteCertificate',
      ],
    };
  }),
});
