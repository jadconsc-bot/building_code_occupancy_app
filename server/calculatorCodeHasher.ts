/**
 * Calculator Code Hasher
 * 
 * Generates and verifies hashes of calculator source code
 * Ensures calculation code hasn't changed since execution
 * Provides legal defensibility by proving which code version was used
 */

import * as crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface CodeHash {
  calculatorType: string;
  version: string;
  hash: string;
  timestamp: Date;
  algorithm: string;
  fileSize: number;
  lineCount: number;
}

/**
 * Calculator Code Hasher
 * Manages code integrity verification
 */
export class CalculatorCodeHasher {
  private hashes: Map<string, CodeHash> = new Map();
  private calculatorsPath: string;

  constructor(calculatorsPath: string = './server/calculators') {
    this.calculatorsPath = calculatorsPath;
    this.initializeHashes();
  }

  /**
   * Initialize hashes for all calculator files
   */
  private initializeHashes(): void {
    const calculators = [
      'occupantLoadCalculator',
      'fireExitCalculator',
      'plumbingFixtureUnitsCalculator',
      'electricalServiceLoadCalculator',
      'stairDesignCalculator',
    ];

    calculators.forEach(calc => {
      const filePath = path.join(this.calculatorsPath, `${calc}.ts`);
      try {
        if (fs.existsSync(filePath)) {
          const hash = this.hashFile(filePath);
          this.hashes.set(calc, hash);
        }
      } catch (error) {
        console.warn(`Could not hash ${calc}:`, error);
      }
    });
  }

  /**
   * Hash a calculator file
   */
  private hashFile(filePath: string): CodeHash {
    const source = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    const lineCount = source.split('\n').length;

    const hash = crypto
      .createHash('sha256')
      .update(source)
      .digest('hex');

    const calculatorName = path.basename(filePath, '.ts');

    return {
      calculatorType: calculatorName,
      version: '1.0',
      hash,
      timestamp: new Date(),
      algorithm: 'SHA-256',
      fileSize: stats.size,
      lineCount,
    };
  }

  /**
   * Get hash for a specific calculator
   */
  getHash(calculatorType: string): CodeHash | null {
    return this.hashes.get(calculatorType) || null;
  }

  /**
   * Verify a calculator's code hash
   */
  verifyHash(calculatorType: string, expectedHash: string): boolean {
    const hash = this.getHash(calculatorType);
    if (!hash) {
      return false;
    }
    return hash.hash === expectedHash;
  }

  /**
   * Get all calculator hashes
   */
  getAllHashes(): CodeHash[] {
    return Array.from(this.hashes.values());
  }

  /**
   * Create a code integrity report
   */
  createIntegrityReport(): {
    timestamp: Date;
    calculators: CodeHash[];
    overallHash: string;
  } {
    const calculators = this.getAllHashes();

    // Create overall hash of all calculator hashes
    const allHashesString = calculators
      .map(c => `${c.calculatorType}:${c.hash}`)
      .join('|');

    const overallHash = crypto
      .createHash('sha256')
      .update(allHashesString)
      .digest('hex');

    return {
      timestamp: new Date(),
      calculators,
      overallHash,
    };
  }

  /**
   * Verify code hasn't changed since calculation
   */
  verifyCodeIntegrity(
    calculatorType: string,
    codeHashAtCalculationTime: string
  ): {
    valid: boolean;
    message: string;
    currentHash: string;
    expectedHash: string;
  } {
    const currentHash = this.getHash(calculatorType);

    if (!currentHash) {
      return {
        valid: false,
        message: `Calculator ${calculatorType} not found`,
        currentHash: '',
        expectedHash: codeHashAtCalculationTime,
      };
    }

    const valid = currentHash.hash === codeHashAtCalculationTime;

    return {
      valid,
      message: valid
        ? `Code integrity verified for ${calculatorType}`
        : `Code mismatch for ${calculatorType} - code may have been modified`,
      currentHash: currentHash.hash,
      expectedHash: codeHashAtCalculationTime,
    };
  }

  /**
   * Export code integrity proof
   */
  exportIntegrityProof(): string {
    const report = this.createIntegrityReport();

    const proof = {
      documentType: 'CODE_INTEGRITY_PROOF',
      generatedAt: new Date().toISOString(),
      timestamp: report.timestamp.toISOString(),
      calculators: report.calculators.map(c => ({
        name: c.calculatorType,
        version: c.version,
        hash: c.hash,
        algorithm: c.algorithm,
        fileSize: c.fileSize,
        lineCount: c.lineCount,
      })),
      overallHash: report.overallHash,
      legalNotice:
        'These code hashes provide cryptographic proof of which calculator code was used for calculations. ' +
        'Any modification to the code would result in a different hash, proving tampering.',
    };

    return JSON.stringify(proof, null, 2);
  }

  /**
   * Create audit entry for code verification
   */
  createAuditEntry(
    calculatorType: string,
    action: string,
    verified: boolean
  ): {
    timestamp: Date;
    calculator: string;
    action: string;
    verified: boolean;
    hash: string;
    auditHash: string;
  } {
    const codeHash = this.getHash(calculatorType);

    const entry = {
      timestamp: new Date(),
      calculator: calculatorType,
      action,
      verified,
      hash: codeHash?.hash || '',
      auditHash: '',
    };

    // Create hash of audit entry
    entry.auditHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(entry))
      .digest('hex');

    return entry;
  }
}

export default CalculatorCodeHasher;
