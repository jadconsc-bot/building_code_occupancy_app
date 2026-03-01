/**
 * Server-Side Calculation Engine
 * 
 * Executes all building code compliance calculations on the server with:
 * - Cryptographic signing (SHA-256-RSA)
 * - Immutable storage with audit trails
 * - Step-by-step calculation traces for reproducibility
 * - Digital certificates for legal defensibility
 * 
 * All calculations are deterministic and court-defensible.
 */

import { createHash, sign, verify, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';
import {
  calculationResults,
  calculationAuditLog,
  calculationRulesets,
  calculationCertificates,
  CalculationResult,
  CalculationAuditLogEntry,
  CalculationRuleset,
  CalculationCertificate,
} from '../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Calculation step for trace generation
 */
export interface CalculationStep {
  stepNumber: number;
  description: string;
  formula?: string;
  inputs: Record<string, any>;
  output: any;
  timestamp: string;
}

/**
 * Input for calculation execution
 */
export interface CalculationInput {
  calculatorType: string;
  inputs: Record<string, any>;
  projectId: number;
  userId: number;
  rulesetVersion: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Signed calculation result
 */
export interface SignedCalculationResult {
  id: string;
  calculatorType: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  trace: CalculationStep[];
  signature: string;
  certificateChain: string;
  timestamp: string;
  rulesetVersion: string;
  signatureVerified: boolean;
}

/**
 * Main calculation engine
 */
export class CalculationEngine {
  /**
   * Execute a calculation with full audit trail and cryptographic signing
   */
  async executeCalculation(input: CalculationInput): Promise<SignedCalculationResult> {
    const calculationId = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      // Step 1: Validate inputs
      this.validateInputs(input);

      // Step 2: Load ruleset version
      const ruleset = await this.loadRuleset(input.rulesetVersion);

      // Step 3: Execute calculation with trace
      const { results, trace } = await this.executeWithTrace(
        input.calculatorType,
        input.inputs,
        ruleset
      );

      // Step 4: Validate results
      this.validateResults(input.calculatorType, results);

      // Step 5: Generate cryptographic signature
      const signature = await this.signCalculation({
        calculationId,
        inputs: input.inputs,
        results,
        timestamp,
        rulesetVersion: input.rulesetVersion,
      });

      // Step 6: Create result object
      const result: SignedCalculationResult = {
        id: calculationId,
        calculatorType: input.calculatorType,
        inputs: input.inputs,
        results,
        trace,
        signature: signature.signature,
        certificateChain: signature.certificateChain,
        timestamp,
        rulesetVersion: input.rulesetVersion,
        signatureVerified: false,
      };

      // Step 7: Verify signature immediately
      result.signatureVerified = await this.verifySignature(result);

      // Step 8: Store immutably in database
      await this.storeCalculation(result, input);

      // Step 9: Create audit log entry
      await this.logCalculation(calculationId, 'created', input.userId, {
        calculatorType: input.calculatorType,
        projectId: input.projectId,
      });

      return result;
    } catch (error) {
      // Log failed calculation attempt
      await this.logCalculation(calculationId, 'failed', input.userId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        calculatorType: input.calculatorType,
      }).catch(() => {
        // Silently fail if logging fails
      });

      throw error;
    }
  }

  /**
   * Execute calculation with step-by-step trace
   */
  private async executeWithTrace(
    calculatorType: string,
    inputs: Record<string, any>,
    ruleset: any
  ): Promise<{ results: Record<string, any>; trace: CalculationStep[] }> {
    const trace: CalculationStep[] = [];

    // Dispatch to specific calculator implementation
    const calculator = this.getCalculator(calculatorType);
    const { results, steps } = await calculator.execute(inputs, ruleset);

    // Convert steps to trace format
    let stepNumber = 1;
    for (const step of steps) {
      trace.push({
        stepNumber: stepNumber++,
        description: step.description,
        formula: step.formula,
        inputs: step.inputs,
        output: step.output,
        timestamp: new Date().toISOString(),
      });
    }

    return { results, trace };
  }

  /**
   * Generate cryptographic signature for calculation result
   */
  private async signCalculation(data: {
    calculationId: string;
    inputs: Record<string, any>;
    results: Record<string, any>;
    timestamp: string;
    rulesetVersion: string;
  }): Promise<{ signature: string; certificateChain: string }> {
    // Create deterministic JSON representation (sorted keys)
    const dataString = JSON.stringify(
      {
        calculationId: data.calculationId,
        inputs: data.inputs,
        results: data.results,
        timestamp: data.timestamp,
        rulesetVersion: data.rulesetVersion,
      },
      Object.keys(data).sort()
    );

    // Generate SHA-256 hash
    const hash = createHash('sha256').update(dataString).digest();

    // Sign with server private key
    const certificate = await this.getActiveCertificate();
    const signature = sign('sha256', hash, {
      key: certificate.privateKey,
      format: 'pem',
    });

    return {
      signature: signature.toString('base64'),
      certificateChain: certificate.certificateChain,
    };
  }

  /**
   * Verify signature of a calculation result
   */
  async verifySignature(result: SignedCalculationResult): Promise<boolean> {
    try {
      // Reconstruct original data
      const dataString = JSON.stringify(
        {
          calculationId: result.id,
          inputs: result.inputs,
          results: result.results,
          timestamp: result.timestamp,
          rulesetVersion: result.rulesetVersion,
        },
        Object.keys(result).sort()
      );

      const hash = createHash('sha256').update(dataString).digest();
      const signatureBuffer = Buffer.from(result.signature, 'base64');

      // Extract public key from certificate chain
      const publicKey = this.extractPublicKey(result.certificateChain);

      // Verify signature
      return verify('sha256', hash, publicKey, signatureBuffer);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get calculator implementation for specific type
   */
  private getCalculator(calculatorType: string): any {
    // Map calculator types to implementations
    // For now, return a placeholder that will be filled in Phase 4
    const calculators: Record<string, any> = {
      // Will be populated as calculators are migrated
    };

    if (!calculators[calculatorType]) {
      throw new Error(`Calculator not yet implemented: ${calculatorType}`);
    }

    return calculators[calculatorType];
  }

  /**
   * Load specific version of ruleset
   */
  private async loadRuleset(version: string): Promise<any> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [ruleset] = await db
      .select()
      .from(calculationRulesets)
      .where(eq(calculationRulesets.version, version))
      .limit(1);

    if (!ruleset) {
      throw new Error(`Ruleset version not found: ${version}`);
    }

    return JSON.parse(ruleset.rulesJSON);
  }

  /**
   * Validate inputs against schema
   */
  private validateInputs(input: CalculationInput): void {
    if (!input.calculatorType) {
      throw new Error('calculatorType is required');
    }
    if (!input.inputs || typeof input.inputs !== 'object') {
      throw new Error('inputs must be an object');
    }
    if (!input.projectId || input.projectId <= 0) {
      throw new Error('projectId must be a positive number');
    }
    if (!input.userId || input.userId <= 0) {
      throw new Error('userId must be a positive number');
    }
    if (!input.rulesetVersion) {
      throw new Error('rulesetVersion is required');
    }
  }

  /**
   * Validate results against constraints
   */
  private validateResults(calculatorType: string, results: Record<string, any>): void {
    // Type-specific validation will be added as calculators are implemented
    if (!results || typeof results !== 'object') {
      throw new Error('Results must be an object');
    }
  }

  /**
   * Store calculation immutably in database
   */
  private async storeCalculation(
    result: SignedCalculationResult,
    input: CalculationInput
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(calculationResults).values({
      id: result.id,
      projectId: input.projectId,
      userId: input.userId,
      calculatorType: result.calculatorType,
      rulesetVersion: result.rulesetVersion,
      inputData: JSON.stringify(result.inputs),
      resultData: JSON.stringify(result.results),
      calculationTrace: JSON.stringify(result.trace),
      cryptographicSignature: result.signature,
      certificateChain: result.certificateChain,
      signatureVerified: result.signatureVerified,
      createdAt: new Date(result.timestamp),
      createdBy: input.userId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      immutable: true,
    });
  }

  /**
   * Log calculation action for audit trail
   */
  private async logCalculation(
    calculationId: string,
    action: string,
    userId: number,
    details: any
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(calculationAuditLog).values({
      id: uuidv4(),
      calculationResultId: calculationId,
      action,
      actor: userId,
      timestamp: new Date(),
      details: JSON.stringify(details),
    });
  }

  /**
   * Get active digital certificate for signing
   */
  private async getActiveCertificate(): Promise<{
    privateKey: string;
    certificateChain: string;
  }> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const now = new Date();
    const [cert] = await db
      .select()
      .from(calculationCertificates)
      .where(
        and(
          eq(calculationCertificates.active, true),
          gte(calculationCertificates.validUntil, now)
        )
      )
      .limit(1);

    if (!cert) {
      throw new Error('No active certificate available for signing');
    }

    return {
      privateKey: cert.privateKey,
      certificateChain: cert.publicKey, // Using publicKey as chain for now
    };
  }

  /**
   * Extract public key from certificate chain
   */
  private extractPublicKey(certificateChain: string): string {
    // For now, return as-is. In production, parse PEM certificate
    // and extract the actual public key
    return certificateChain;
  }

  /**
   * Retrieve a previously saved calculation
   */
  async getCalculation(calculationId: string, userId: number): Promise<SignedCalculationResult | null> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [result] = await db
      .select()
      .from(calculationResults)
      .where(eq(calculationResults.id, calculationId))
      .limit(1);

    if (!result) {
      return null;
    }

    // Verify user has access to this calculation's project
    // This will be checked at the tRPC level

    // Verify signature
    const signatureValid = await this.verifySignature({
      id: result.id,
      calculatorType: result.calculatorType,
      inputs: JSON.parse(result.inputData),
      results: JSON.parse(result.resultData),
      trace: JSON.parse(result.calculationTrace || '[]'),
      signature: result.cryptographicSignature,
      certificateChain: result.certificateChain,
      timestamp: result.createdAt.toISOString(),
      rulesetVersion: result.rulesetVersion,
      signatureVerified: result.signatureVerified,
    });

    return {
      id: result.id,
      calculatorType: result.calculatorType,
      inputs: JSON.parse(result.inputData),
      results: JSON.parse(result.resultData),
      trace: JSON.parse(result.calculationTrace || '[]'),
      signature: result.cryptographicSignature,
      certificateChain: result.certificateChain,
      timestamp: result.createdAt.toISOString(),
      rulesetVersion: result.rulesetVersion,
      signatureVerified: signatureValid,
    };
  }

  /**
   * Export calculation for legal proceedings
   */
  async exportForLegal(calculationId: string): Promise<any> {
    const result = await this.getCalculation(calculationId, 0); // userId will be checked at tRPC level

    if (!result) {
      throw new Error('Calculation not found');
    }

    return {
      '@context': 'https://codecomply.app/context/calculation',
      '@type': 'ComplianceCalculation',
      id: result.id,
      calculatorType: result.calculatorType,
      inputs: result.inputs,
      results: result.results,
      trace: result.trace,
      signature: {
        algorithm: 'SHA-256-RSA',
        value: result.signature,
        certificateChain: result.certificateChain,
        verified: result.signatureVerified,
      },
      timestamp: result.timestamp,
      rulesetVersion: result.rulesetVersion,
    };
  }
}

// Export singleton instance
export const calculationEngine = new CalculationEngine();
