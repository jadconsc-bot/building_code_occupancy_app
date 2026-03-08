/**
 * Compliance Certification Format Schema
 * 
 * Defines the structure for PDF + JSON compliance certificates
 * with digital signatures, RFC 3161 timestamps, and legal defensibility
 * 
 * ⚠️ LEGAL LAYER INTACT
 * All certificates include legal disclaimers, jurisdiction notices, and liability disclaimers
 * 
 * Backwards Compatible: Supports existing complianceSnapshots
 * Code Integrity: All fields immutable after certification generation
 * Revision Control: Version tracking for schema changes
 */

import { z } from 'zod';

/**
 * Legal Disclaimer Schema
 * Embedded in every certificate for legal defensibility
 */
export const LegalDisclaimerSchema = z.object({
  disclaimerType: z.enum(['PROFESSIONAL_SERVICE', 'JURISDICTION_NOTICE', 'LIABILITY_DISCLAIMER', 'USER_RESPONSIBILITY'] as const),
  title: z.string(),
  content: z.string(),
  version: z.string(), // e.g., "1.0.0"
  effectiveDate: z.date(),
  acknowledgedAt: z.date().optional(),
  acknowledgedBy: z.number().optional(), // User ID
});

export type LegalDisclaimer = z.infer<typeof LegalDisclaimerSchema>;

/**
 * Compliance Input Schema
 * All inputs that led to the compliance determination
 */
export const ComplianceInputSchema = z.object({
  projectId: z.number(),
  projectName: z.string(),
  projectAddress: z.string().optional(),
  occupancyCode: z.string(),
  occupancyName: z.string(),
  buildingType: z.string().optional(),
  constructionType: z.string().optional(),
  storyHeight: z.number().optional(),
  occupantLoad: z.number().optional(),
  customInputs: z.record(z.string(), z.any()).optional(), // Additional user inputs
});

export type ComplianceInput = z.infer<typeof ComplianceInputSchema>;

/**
 * Compliance Output Schema
 * Results of the compliance analysis
 */
export const ComplianceOutputSchema = z.object({
  complianceStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'CONDITIONAL'] as const),
  overallScore: z.number().min(0).max(100), // Percentage
  findings: z.array(z.object({
    ruleId: z.string(),
    clause: z.string(), // e.g., "3.2.2.47"
    status: z.enum(['PASS', 'FAIL', 'WARNING', 'INFO'] as const),
    description: z.string(),
    remediation: z.string().optional(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const),
  })),
  summaryText: z.string(),
  detailedAnalysis: z.string().optional(),
});

export type ComplianceOutput = z.infer<typeof ComplianceOutputSchema>;

/**
 * Ruleset Reference Schema
 * Immutable reference to the ruleset used for analysis
 */
export const RulesetReferenceSchema = z.object({
  rulesetId: z.string(), // e.g., "nbc_ae_2023_v1"
  code: z.string(), // e.g., "NBC(AE)"
  edition: z.string(), // e.g., "2023"
  amendment: z.string().optional(), // e.g., "2023-12"
  version: z.string(), // e.g., "1.0.0"
  effectiveDate: z.date(),
  rulesApplied: z.number(), // Count of rules evaluated
});

export type RulesetReference = z.infer<typeof RulesetReferenceSchema>;

/**
 * Digital Signature Schema
 * Cryptographic proof of certificate integrity
 */
export const DigitalSignatureSchema = z.object({
  algorithm: z.enum(['RSA-SHA256', 'ECDSA-SHA256'] as const), // Signature algorithm
  signatureValue: z.string(), // Base64-encoded signature
  certificateChain: z.array(z.string()), // Base64-encoded certificates
  signedAt: z.date(),
  signedBy: z.object({
    userId: z.number(),
    userName: z.string(),
    userEmail: z.string(),
    userRole: z.enum(['user', 'admin', 'professional_reviewer'] as const),
  }),
  publicKeyHash: z.string(), // SHA-256 hash of public key
});

export type DigitalSignature = z.infer<typeof DigitalSignatureSchema>;

/**
 * RFC 3161 Timestamp Schema
 * Legal timestamp from trusted authority
 */
export const RFC3161TimestampSchema = z.object({
  timestampValue: z.string(), // Base64-encoded timestamp token
  timestampAuthority: z.string(), // TSA URL (e.g., http://timestamp.authority.com)
  serialNumber: z.string(), // TSA serial number
  hashAlgorithm: z.enum(['SHA-256', 'SHA-512'] as const),
  hashValue: z.string(), // Hash of the certificate data
  receivedTime: z.date(), // When TSA received the request
  genTime: z.date(), // When TSA generated the timestamp
  accuracy: z.object({
    seconds: z.number().optional(),
    millis: z.number().optional(),
    micros: z.number().optional(),
  }).optional(),
  ordering: z.boolean().optional(), // Whether ordering is guaranteed
});

export type RFC3161Timestamp = z.infer<typeof RFC3161TimestampSchema>;

/**
 * Audit Trail Entry Schema
 * Immutable record of certificate lifecycle
 */
export const AuditTrailEntrySchema = z.object({
  timestamp: z.date(),
  action: z.enum(['GENERATED', 'SIGNED', 'TIMESTAMPED', 'EXPORTED', 'VERIFIED', 'REVOKED'] as const),
  actor: z.object({
    userId: z.number(),
    userName: z.string(),
    userEmail: z.string(),
    ipAddress: z.string(),
    userAgent: z.string(),
  }),
  details: z.record(z.string(), z.any()).optional(),
  hash: z.string(), // SHA-256 hash of this entry + previous entry
});

export type AuditTrailEntry = z.infer<typeof AuditTrailEntrySchema>;

/**
 * Main Compliance Certificate Schema
 * Complete certificate with all required components
 */
export const ComplianceCertificateSchema = z.object({
  // Certificate Metadata
  certificateId: z.string(), // UUID
  version: z.string(), // Schema version (e.g., "1.0.0")
  generatedAt: z.date(),
  expiresAt: z.date().optional(), // Optional expiration
  status: z.enum(['ACTIVE', 'SUPERSEDED', 'REVOKED', 'EXPIRED'] as const).default('ACTIVE'),

  // Legal Layer (INTACT)
  legalDisclaimers: z.array(LegalDisclaimerSchema),
  jurisdictionNotice: z.object({
    jurisdiction: z.string(), // e.g., "Alberta"
    buildingCodeReference: z.string(), // e.g., "National Building Code of Canada"
    localAmendments: z.string().optional(),
  }),
  liabilityDisclaimer: z.string(),
  professionalReviewNotice: z.string(),

  // Compliance Data
  inputs: ComplianceInputSchema,
  outputs: ComplianceOutputSchema,
  rulesetReference: RulesetReferenceSchema,

  // Integrity & Security
  digitalSignature: DigitalSignatureSchema,
  rfc3161Timestamp: RFC3161TimestampSchema,
  
  // Audit Trail
  auditTrail: z.array(AuditTrailEntrySchema),

  // Backwards Compatibility
  sourceSnapshotId: z.string().optional(), // Reference to original complianceSnapshot
  legacyFormat: z.boolean().default(false), // Whether converted from legacy format

  // Encryption (for sensitive data)
  encryptionMetadata: z.object({
    algorithm: z.string(), // e.g., "AES-256-GCM"
    encryptedFields: z.array(z.string()), // Which fields are encrypted
    keyId: z.string(), // Reference to encryption key
  }).optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  customMetadata: z.record(z.string(), z.any()).optional(),
});

export type ComplianceCertificate = z.infer<typeof ComplianceCertificateSchema>;

/**
 * PDF Certificate Template Schema
 * Layout and styling for PDF export
 */
export const PDFCertificateTemplateSchema = z.object({
  templateId: z.string(),
  templateVersion: z.string(),
  paperSize: z.enum(['A4', 'LETTER']).default('A4'),
  orientation: z.enum(['PORTRAIT', 'LANDSCAPE']).default('PORTRAIT'),
  
  // Header
  headerLogo: z.string().optional(), // URL to logo
  headerTitle: z.string(),
  headerSubtitle: z.string().optional(),
  
  // Sections
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(), // HTML/Markdown content
    order: z.number(),
    pageBreakBefore: z.boolean().optional(),
    pageBreakAfter: z.boolean().optional(),
  })),
  
  // Footer
  footerText: z.string().optional(),
  footerPageNumbers: z.boolean().default(true),
  
  // Styling
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    text: z.string(),
    background: z.string(),
  }).optional(),
  
  fonts: z.object({
    body: z.string(),
    heading: z.string(),
    mono: z.string(),
  }).optional(),
});

export type PDFCertificateTemplate = z.infer<typeof PDFCertificateTemplateSchema>;

/**
 * Certification Export Format
 * Combined JSON + PDF export
 */
export const CertificationExportSchema = z.object({
  format: z.enum(['JSON', 'PDF', 'JSON_PDF_BUNDLE'] as const),
  certificate: ComplianceCertificateSchema,
  pdfUrl: z.string().optional(), // S3 URL to PDF
  jsonUrl: z.string().optional(), // S3 URL to JSON
  bundleUrl: z.string().optional(), // S3 URL to combined bundle
  generatedAt: z.date(),
  expiresAt: z.date().optional(),
});

export type CertificationExport = z.infer<typeof CertificationExportSchema>;

/**
 * Certification Verification Schema
 * For verifying certificate integrity
 */
export const CertificationVerificationSchema = z.object({
  certificateId: z.string(),
  verificationTime: z.date(),
  signatureValid: z.boolean(),
  timestampValid: z.boolean(),
  dataIntegrity: z.boolean(),
  certificateStatus: z.enum(['VALID', 'INVALID', 'EXPIRED', 'REVOKED'] as const),
  verificationDetails: z.object({
    signatureVerification: z.object({
      valid: z.boolean(),
      algorithm: z.string(),
      issuer: z.string(),
    }),
    timestampVerification: z.object({
      valid: z.boolean(),
      authority: z.string(),
      time: z.date(),
    }),
    dataHashVerification: z.object({
      valid: z.boolean(),
      expectedHash: z.string(),
      actualHash: z.string(),
    }),
  }),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
});

export type CertificationVerification = z.infer<typeof CertificationVerificationSchema>;

/**
 * Default Legal Disclaimers
 * Embedded in every certificate
 */
export const DEFAULT_LEGAL_DISCLAIMERS = {
  PROFESSIONAL_SERVICE: {
    title: 'NOT A PROFESSIONAL ENGINEER SERVICE',
    content: `This tool is NOT a substitute for professional engineering review, consultation, or licensed professional services. All analyses are informational only. You are solely responsible for:
    • Conducting independent verification of all outputs
    • Exercising professional judgment and responsibility
    • Obtaining professional engineering review
    • Compliance with professional standards and codes of ethics
    • Taking full responsibility for any professional opinions`,
  },
  JURISDICTION_NOTICE: {
    title: 'BUILDING CODES VARY BY JURISDICTION',
    content: `This analysis is based on the National Building Code of Canada (NBC). However, building codes vary by province, city, and jurisdiction. Local amendments, variations, and exceptions may apply. The Authority Having Jurisdiction (building official) has final authority.`,
  },
  LIABILITY_DISCLAIMER: {
    title: 'NO WARRANTIES',
    content: `This service is provided AS-IS without any warranties. The company specifically disclaims:
    • Any implied warranty of merchantability
    • Any implied warranty of fitness for a particular purpose
    • Any warranty regarding accuracy or completeness
    • Any warranty regarding uninterrupted availability`,
  },
  USER_RESPONSIBILITY: {
    title: 'USER RESPONSIBILITY',
    content: `You are solely responsible for:
    • Verifying all outputs independently
    • Ensuring compliance with applicable codes and standards
    • Obtaining necessary professional reviews and approvals
    • Understanding the limitations of this tool
    • Taking full responsibility for any decisions based on this analysis`,
  },
};
