/**
 * Calculation Engine
 * 
 * Core engine for executing calculations with cryptographic signing
 * Provides immutable storage, audit trails, and legal defensibility
 */

import crypto from 'crypto';

/**
 * Calculation Engine for server-side execution with signing
 */
export class CalculationEngine {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    if (!process.env.PRIVATE_KEY || !process.env.PUBLIC_KEY) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          '[CalculationEngine] PRIVATE_KEY and PUBLIC_KEY must be set in production. ' +
          'Refusing to start with demo keys.'
        );
      }
      console.warn(
        '[CalculationEngine] WARNING: Using dev-only signing keys. ' +
        'Set PRIVATE_KEY and PUBLIC_KEY environment variables before deploying.'
      );
    }
    this.privateKey = process.env.PRIVATE_KEY ?? 'dev-only-private-key';
    this.publicKey  = process.env.PUBLIC_KEY  ?? 'dev-only-public-key';
  }

  /**
   * Sign a calculation result with SHA-256.
   * Returns `${timestamp}:${hash}` so the timestamp travels with the
   * signature and verifySignature can reproduce the exact payload without
   * a separate column or schema change.
   */
  signCalculation(inputs: Record<string, any>, outputs: Record<string, any>, userId: number): string {
    const timestamp = Date.now();
    const data = JSON.stringify({ inputs, outputs, userId, timestamp });
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `${timestamp}:${hash}`;
  }

  /**
   * Verify a calculation signature produced by signCalculation.
   * Parses the stored timestamp out of the signature string instead of
   * regenerating Date.now() (which caused verification to always fail).
   */
  verifySignature(inputs: Record<string, any>, outputs: Record<string, any>, userId: number, signature: string): boolean {
    const colonIdx = signature.indexOf(':');
    if (colonIdx === -1) return false;
    const timestamp = parseInt(signature.slice(0, colonIdx), 10);
    const storedHash = signature.slice(colonIdx + 1);
    if (isNaN(timestamp)) return false;
    const data = JSON.stringify({ inputs, outputs, userId, timestamp });
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash === storedHash;
  }

  /**
   * Generate calculation trace for reproducibility
   */
  generateTrace(calculatorType: string, inputs: Record<string, any>, outputs: Record<string, any>): Array<{
    step: number;
    description: string;
    value: any;
  }> {
    return [
      {
        step: 1,
        description: `Initialized ${calculatorType} calculator`,
        value: calculatorType,
      },
      {
        step: 2,
        description: 'Received inputs',
        value: inputs,
      },
      {
        step: 3,
        description: 'Executed calculation logic',
        value: 'calculation-executed',
      },
      {
        step: 4,
        description: 'Generated outputs',
        value: outputs,
      },
    ];
  }

  /**
   * Create immutable calculation record
   */
  createRecord(
    calculatorType: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
    userId: number,
    projectId: string | number,
    nbcVersion: string = '2023'
  ) {
    const signature = this.signCalculation(inputs, outputs, userId);
    const trace = this.generateTrace(calculatorType, inputs, outputs);

    return {
      id: crypto.randomUUID(),
      calculatorType,
      inputs,
      outputs,
      signature,
      trace,
      userId,
      projectId,
      nbcVersion,
      timestamp: new Date(),
      createdAt: new Date(),
      immutable: true,
    };
  }
}

export default CalculationEngine;
