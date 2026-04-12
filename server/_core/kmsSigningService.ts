import crypto from "crypto";
import { createHmac } from "crypto";

/**
 * AWS KMS Signing Service
 * 
 * Provides cryptographic signing for professional engineer seals
 * Implements HMAC-SHA256 for immutable compliance determinations
 * 
 * PD2.0 Compliance:
 * - Deterministic signatures (same input = same signature)
 * - Immutable audit trail (signature verification proves original data)
 * - Infrastructure logging (timestamp, user, IP)
 * - No external API calls (local HMAC implementation)
 * 
 * Usage:
 * 1. Sign analysis data: const sig = signAnalysisData(data, secret)
 * 2. Verify signature: const valid = verifySignature(data, sig, secret)
 * 3. Generate seal: const seal = generateProfessionalSeal(engineerInfo, sig)
 */

export interface AnalysisData {
  projectId: number;
  userId: number;
  analysisType: "stepCode" | "nbc" | "seismic" | "energy";
  tierTarget?: string;
  tediTarget?: number;
  teuiTarget?: number;
  airtightnessTarget?: number;
  mechEfficiencyTarget?: number;
  overallCompliant: boolean;
  timestamp: number;
}

export interface ProfessionalSeal {
  engineerName: string;
  licenseNumber: string;
  association: string; // PEO, APEGGA, Engineers Canada
  sealDate: string;
  signatureHash: string;
  verificationUrl: string;
}

export interface SignatureVerificationResult {
  valid: boolean;
  timestamp: number;
  engineerName?: string;
  licenseNumber?: string;
  association?: string;
  dataHash?: string;
}

/**
 * Sign analysis data with HMAC-SHA256
 * 
 * @param data - Analysis data to sign
 * @param jwtSecret - Secret key for HMAC (from environment)
 * @returns Hex-encoded HMAC signature
 */
export function signAnalysisData(data: AnalysisData, jwtSecret: string): string {
  // Create deterministic JSON string (sorted keys for consistency)
  const dataString = JSON.stringify(data, Object.keys(data).sort());

  // Generate HMAC-SHA256 signature
  const signature = createHmac("sha256", jwtSecret)
    .update(dataString)
    .digest("hex");

  return signature;
}

/**
 * Verify analysis data signature
 * 
 * @param data - Original analysis data
 * @param signature - Signature to verify
 * @param jwtSecret - Secret key for HMAC
 * @returns true if signature is valid, false otherwise
 */
export function verifySignature(
  data: AnalysisData,
  signature: string,
  jwtSecret: string
): boolean {
  const expectedSignature = signAnalysisData(data, jwtSecret);
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

/**
 * Generate professional engineer seal
 * 
 * @param engineerName - Name of the professional engineer
 * @param licenseNumber - PEO/APEGGA license number
 * @param association - Professional association (PEO, APEGGA, etc.)
 * @param signature - Cryptographic signature of analysis
 * @returns Professional seal object with verification URL
 */
export function generateProfessionalSeal(
  engineerName: string,
  licenseNumber: string,
  association: string,
  signature: string
): ProfessionalSeal {
  const sealDate = new Date().toISOString().split("T")[0];
  
  // Generate verification URL (can be used to verify seal authenticity)
  const verificationUrl = `/api/verify-seal/${Buffer.from(signature).toString("base64").substring(0, 32)}`;

  return {
    engineerName,
    licenseNumber,
    association,
    sealDate,
    signatureHash: signature.substring(0, 16), // First 16 chars of signature
    verificationUrl,
  };
}

/**
 * Create audit trail entry for signed analysis
 * 
 * @param analysisId - ID of the analysis
 * @param engineerName - Name of the engineer
 * @param licenseNumber - License number
 * @param signature - Cryptographic signature
 * @param ipAddress - User's IP address
 * @param userAgent - User's browser user agent
 * @returns Audit trail entry
 */
export function createAuditTrailEntry(
  analysisId: string,
  engineerName: string,
  licenseNumber: string,
  signature: string,
  ipAddress: string | null,
  userAgent: string | null
) {
  return {
    analysisId,
    action: "PROFESSIONAL_SIGNED",
    engineerName,
    licenseNumber,
    signatureHash: signature.substring(0, 32),
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate engineer credentials
 * 
 * @param licenseNumber - PEO/APEGGA license number
 * @param association - Professional association
 * @returns true if license format is valid
 */
export function validateEngineerCredentials(
  licenseNumber: string,
  association: string
): boolean {
  // PEO format: 6-7 digits (e.g., "1234567")
  // APEGGA format: "PE" + 6 digits (e.g., "PE123456")
  // Engineers Canada: Various formats
  
  if (association === "PEO") {
    return /^\d{6,7}$/.test(licenseNumber);
  } else if (association === "APEGGA") {
    return /^PE\d{6}$/.test(licenseNumber);
  } else if (association === "Engineers Canada") {
    return licenseNumber.length >= 6;
  }
  
  return false;
}

/**
 * Generate compliance determination certificate
 * 
 * Combines analysis results with professional seal
 * Creates immutable record of compliance determination
 * 
 * @param analysisData - Analysis data
 * @param seal - Professional seal
 * @param signature - Cryptographic signature
 * @returns Certificate object
 */
export function generateComplianceCertificate(
  analysisData: AnalysisData,
  seal: ProfessionalSeal,
  signature: string
) {
  return {
    certificateId: crypto.randomUUID(),
    analysisType: analysisData.analysisType,
    projectId: analysisData.projectId,
    complianceStatus: analysisData.overallCompliant ? "COMPLIANT" : "NON_COMPLIANT",
    professionalSeal: seal,
    cryptographicSignature: signature,
    issuedDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    disclaimer:
      "This compliance determination is based on the information provided and must be verified by the professional engineer. " +
      "The engineer assumes full responsibility for the accuracy of this determination.",
  };
}

/**
 * Hash analysis data for integrity verification
 * 
 * @param data - Analysis data
 * @returns SHA-256 hash of the data
 */
export function hashAnalysisData(data: AnalysisData): string {
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

/**
 * Create tamper-proof seal record
 * 
 * Combines all signing information into a tamper-proof record
 * Can be embedded in PDF or stored in database
 * 
 * @param analysisData - Analysis data
 * @param seal - Professional seal
 * @param signature - Cryptographic signature
 * @param dataHash - Hash of analysis data
 * @returns Tamper-proof seal record
 */
export function createTamperProofSealRecord(
  analysisData: AnalysisData,
  seal: ProfessionalSeal,
  signature: string,
  dataHash: string
) {
  return {
    sealType: "PROFESSIONAL_ENGINEER_SEAL",
    analysisType: analysisData.analysisType,
    engineerName: seal.engineerName,
    licenseNumber: seal.licenseNumber,
    association: seal.association,
    sealDate: seal.sealDate,
    dataHash,
    signatureHash: signature.substring(0, 32),
    fullSignature: signature,
    verificationUrl: seal.verificationUrl,
    createdAt: new Date().toISOString(),
    // Metadata for verification
    metadata: {
      analysisId: analysisData.projectId,
      userId: analysisData.userId,
      timestamp: analysisData.timestamp,
      complianceStatus: analysisData.overallCompliant ? "PASS" : "FAIL",
    },
  };
}
