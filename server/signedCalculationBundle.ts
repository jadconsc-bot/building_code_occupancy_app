/**
 * Signed Calculation Bundle Generator
 * 
 * This is the MOST IMPORTANT OBJECT in the entire system.
 * 
 * Every calculation generates a complete, self-contained bundle that includes:
 * - Input parameters
 * - Output results
 * - NBC version used
 * - Calculator version
 * - Engine version
 * - User ID and project ID
 * - Timestamp token from RFC-3161 authority
 * - Previous hash (for chain)
 * - Digital signature
 * 
 * This bundle becomes the LEGAL ARTIFACT that can be defended in court.
 * It proves:
 * - WHAT was calculated
 * - WHEN it was calculated
 * - WHO calculated it
 * - WHICH rules were used
 * - HOW it was signed
 */

import * as crypto from 'crypto';
import { logger } from './logger';
import { timestampAuthority } from './rfc3161TimestampAuthority';
import { kmsKeyManager } from './awsKmsKeyManager';

/**
 * Complete signed calculation bundle
 * This is the immutable legal artifact
 */
export interface SignedCalculationBundle {
  // Metadata
  bundleId: string;
  calculationId: string;
  userId: string;
  projectId: string;
  timestamp: Date;

  // Calculation details
  calculationType: string; // e.g., 'occupantLoad', 'fireExit', 'stairDesign'
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;

  // Version information (CRITICAL for reproducibility)
  nbcVersion: string; // e.g., 'NBC-2023-v1.0'
  calculatorVersion: string; // e.g., 'occupantLoadCalculator@2.1.3'
  engineVersion: string; // e.g., 'engine@1.4.0'

  // Cryptographic proof
  timestampToken: {
    token: string;
    timestamp: Date;
    tsa: string; // Which TSA issued this
  };
  signature: string; // RSA-2048 signature
  previousHash: string; // Hash of previous bundle (creates chain)
  bundleHash: string; // SHA-256 of entire bundle

  // Audit trail
  auditTrailId: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Signed Calculation Bundle Generator
 * Creates legally-defensible calculation artifacts
 */
export class SignedCalculationBundleGenerator {
  /**
   * Create a signed calculation bundle
   * This is the primary operation that creates legal artifacts
   * 
   * @param params - Calculation parameters
   * @returns Signed bundle
   */
  async createBundle(params: {
    calculationId: string;
    userId: string;
    projectId: string;
    calculationType: string;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    nbcVersion: string;
    calculatorVersion: string;
    engineVersion: string;
    previousHash?: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<SignedCalculationBundle> {
    try {
      logger.info('Creating signed calculation bundle', {
        calculationId: params.calculationId,
        calculationType: params.calculationType,
        nbcVersion: params.nbcVersion,
      });

      // Generate unique bundle ID
      const bundleId = `bundle-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

      // Get timestamp from RFC-3161 authority
      const resultHash = crypto.createHash('sha256').update(JSON.stringify(params.outputs)).digest('hex');
      const timestampToken = await timestampAuthority.requestTimestamp({
        dataHash: resultHash,
        hashAlgorithm: 'SHA-256',
        nonce: bundleId,
      });

      // Create bundle object
      const bundle: SignedCalculationBundle = {
        bundleId,
        calculationId: params.calculationId,
        userId: params.userId,
        projectId: params.projectId,
        timestamp: new Date(),
        calculationType: params.calculationType,
        inputs: params.inputs,
        outputs: params.outputs,
        nbcVersion: params.nbcVersion,
        calculatorVersion: params.calculatorVersion,
        engineVersion: params.engineVersion,
        timestampToken: timestampToken as any, // Type compatibility
        signature: '', // Will be filled below
        previousHash: params.previousHash || '',
        bundleHash: '', // Will be filled below
        auditTrailId: `audit-${bundleId}`,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      };

      // Calculate bundle hash (without signature)
      const bundleDataForHash = JSON.stringify({
        bundleId: bundle.bundleId,
        calculationId: bundle.calculationId,
        userId: bundle.userId,
        projectId: bundle.projectId,
        timestamp: bundle.timestamp,
        calculationType: bundle.calculationType,
        inputs: bundle.inputs,
        outputs: bundle.outputs,
        nbcVersion: bundle.nbcVersion,
        calculatorVersion: bundle.calculatorVersion,
        engineVersion: bundle.engineVersion,
        timestampToken: bundle.timestampToken,
        previousHash: bundle.previousHash,
      });

      const bundleHash = crypto.createHash('sha256').update(bundleDataForHash).digest('hex');
      bundle.bundleHash = bundleHash;

      // Sign bundle with hardware-protected key
      const bundleHashBuffer = Buffer.from(bundleHash, 'hex');
      const signature = await kmsKeyManager.sign(bundleHashBuffer);
      bundle.signature = signature.toString('base64');

      logger.info('Signed calculation bundle created', {
        bundleId,
        bundleHash: bundleHash.substring(0, 16),
        calculationType: params.calculationType,
      });

      return bundle;
    } catch (error) {
      logger.error('Failed to create signed calculation bundle', {
        calculationId: params.calculationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verify a signed calculation bundle
   * Used when retrieving historical calculations
   * 
   * @param bundle - Bundle to verify
   * @returns Verification result
   */
  async verifyBundle(bundle: SignedCalculationBundle): Promise<{
    isValid: boolean;
    signatureValid: boolean;
    timestampValid: boolean;
    hashValid: boolean;
    errors: string[];
  }> {
    try {
      logger.info('Verifying signed calculation bundle', {
        bundleId: bundle.bundleId,
      });

      const errors: string[] = [];

      // Verify signature
      let signatureValid = false;
      try {
        const bundleHashBuffer = Buffer.from(bundle.bundleHash, 'hex');
        const signatureBuffer = Buffer.from(bundle.signature, 'base64');
        signatureValid = await kmsKeyManager.verify(bundleHashBuffer, signatureBuffer);

        if (!signatureValid) {
          errors.push('Bundle signature verification failed');
        }
      } catch (error) {
        errors.push(`Signature verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      // Verify timestamp
      let timestampValid = false;
      try {
        timestampValid = await timestampAuthority.verifyTimestamp(bundle.timestampToken as any);
        if (!timestampValid) {
          errors.push('Timestamp verification failed');
        }
      } catch (error) {
        errors.push(`Timestamp verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      // Verify hash (recalculate and compare)
      let hashValid = false;
      try {
        const bundleDataForHash = JSON.stringify({
          bundleId: bundle.bundleId,
          calculationId: bundle.calculationId,
          userId: bundle.userId,
          projectId: bundle.projectId,
          timestamp: bundle.timestamp,
          calculationType: bundle.calculationType,
          inputs: bundle.inputs,
          outputs: bundle.outputs,
          nbcVersion: bundle.nbcVersion,
          calculatorVersion: bundle.calculatorVersion,
          engineVersion: bundle.engineVersion,
          timestampToken: bundle.timestampToken,
          previousHash: bundle.previousHash,
        });

        const recalculatedHash = crypto.createHash('sha256').update(bundleDataForHash).digest('hex');
        hashValid = recalculatedHash === bundle.bundleHash;

        if (!hashValid) {
          errors.push(`Hash mismatch: expected ${bundle.bundleHash}, got ${recalculatedHash}`);
        }
      } catch (error) {
        errors.push(`Hash verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      const isValid = signatureValid && timestampValid && hashValid;

      logger.info('Bundle verification complete', {
        bundleId: bundle.bundleId,
        isValid,
        signatureValid,
        timestampValid,
        hashValid,
        errorCount: errors.length,
      });

      return {
        isValid,
        signatureValid,
        timestampValid,
        hashValid,
        errors,
      };
    } catch (error) {
      logger.error('Bundle verification failed', {
        bundleId: bundle.bundleId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        isValid: false,
        signatureValid: false,
        timestampValid: false,
        hashValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Export bundle for legal/compliance purposes
   * Creates a tamper-evident export format
   * 
   * @param bundle - Bundle to export
   * @returns JSON export
   */
  exportBundleForCompliance(bundle: SignedCalculationBundle): string {
    try {
      logger.info('Exporting bundle for compliance', {
        bundleId: bundle.bundleId,
      });

      // Create export with all metadata
      const export_ = {
        bundleId: bundle.bundleId,
        calculationId: bundle.calculationId,
        userId: bundle.userId,
        projectId: bundle.projectId,
        timestamp: bundle.timestamp,
        calculationType: bundle.calculationType,
        inputs: bundle.inputs,
        outputs: bundle.outputs,
        nbcVersion: bundle.nbcVersion,
        calculatorVersion: bundle.calculatorVersion,
        engineVersion: bundle.engineVersion,
        timestampToken: bundle.timestampToken,
        signature: bundle.signature,
        bundleHash: bundle.bundleHash,
        previousHash: bundle.previousHash,
        auditTrailId: bundle.auditTrailId,
        exportedAt: new Date(),
        exportSignature: crypto.createHash('sha256').update(JSON.stringify(bundle)).digest('hex'),
      };

      return JSON.stringify(export_, null, 2);
    } catch (error) {
      logger.error('Failed to export bundle', {
        bundleId: bundle.bundleId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create bundle chain verification report
   * Proves continuity of calculations
   * 
   * @param bundles - Bundles to verify chain
   * @returns Chain verification report
   */
  verifyBundleChain(bundles: SignedCalculationBundle[]): {
    isChainValid: boolean;
    bundleCount: number;
    errors: string[];
  } {
    try {
      logger.info('Verifying bundle chain', {
        bundleCount: bundles.length,
      });

      const errors: string[] = [];

      // Sort by timestamp
      const sortedBundles = [...bundles].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Verify each bundle's previousHash
      for (let i = 1; i < sortedBundles.length; i++) {
        const current = sortedBundles[i];
        const previous = sortedBundles[i - 1];

        if (current.previousHash !== previous.bundleHash) {
          errors.push(
            `Chain broken at bundle ${i}: expected previousHash ${previous.bundleHash}, got ${current.previousHash}`
          );
        }
      }

      const isChainValid = errors.length === 0;

      logger.info('Bundle chain verification complete', {
        bundleCount: bundles.length,
        isChainValid,
        errorCount: errors.length,
      });

      return {
        isChainValid,
        bundleCount: bundles.length,
        errors,
      };
    } catch (error) {
      logger.error('Bundle chain verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        isChainValid: false,
        bundleCount: bundles.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}

/**
 * Create and export singleton instance
 */
export const bundleGenerator = new SignedCalculationBundleGenerator();
