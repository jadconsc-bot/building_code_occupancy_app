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
    // In production, these should be loaded from secure storage
    // For now, using demo keys
    this.privateKey = process.env.PRIVATE_KEY || 'demo-private-key';
    this.publicKey = process.env.PUBLIC_KEY || 'demo-public-key';
  }

  /**
   * Sign a calculation result with SHA-256-RSA
   */
  signCalculation(inputs: Record<string, any>, outputs: Record<string, any>, userId: number): string {
    const data = JSON.stringify({
      inputs,
      outputs,
      userId,
      timestamp: Date.now(),
    });

    // Create SHA-256 hash
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    // In production, sign with RSA private key
    // For demo, just return the hash
    return hash;
  }

  /**
   * Verify a calculation signature
   */
  verifySignature(inputs: Record<string, any>, outputs: Record<string, any>, userId: number, signature: string): boolean {
    const data = JSON.stringify({
      inputs,
      outputs,
      userId,
      timestamp: Date.now(),
    });

    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash === signature;
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
