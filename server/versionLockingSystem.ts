/**
 * Version Locking System
 * 
 * Ensures that calculations are ALWAYS reproducible.
 * 
 * The problem: Building codes change. If we use the latest rules, an old calculation
 * becomes impossible to reproduce. This destroys legal defensibility.
 * 
 * The solution: Lock the EXACT versions of:
 * - NBC ruleset version (e.g., NBC-2023-v1.0)
 * - Calculator code version (e.g., occupantLoadCalculator@2.1.3)
 * - Engine version (e.g., engine@1.4.0)
 * 
 * With these locked, we can ALWAYS reproduce the exact same result.
 * This is CRITICAL for legal defensibility.
 */

import { logger } from './logger';
import crypto from 'crypto';

/**
 * Version information for a calculation
 */
export interface VersionLock {
  nbcVersion: string; // e.g., 'NBC-2023-v1.0'
  nbcVersionHash: string; // SHA-256 of ruleset
  calculatorVersion: string; // e.g., 'occupantLoadCalculator@2.1.3'
  calculatorCodeHash: string; // SHA-256 of calculator code
  engineVersion: string; // e.g., 'engine@1.4.0'
  engineCodeHash: string; // SHA-256 of engine code
  lockedAt: Date;
  lockedBy: string; // User ID
}

/**
 * Version Registry
 * Maintains immutable record of all versions ever used
 */
interface VersionRegistry {
  id: string;
  version: string;
  type: 'nbc' | 'calculator' | 'engine';
  codeHash: string;
  releaseDate: Date;
  deprecated: boolean;
  deprecatedDate?: Date;
  metadata: Record<string, unknown>;
}

/**
 * Version Locking System
 * Ensures reproducibility of calculations
 */
export class VersionLockingSystem {
  private versionRegistry: Map<string, VersionRegistry> = new Map();
  private calculationVersionLocks: Map<string, VersionLock> = new Map();

  /**
   * Register a new version
   * This creates an immutable record that can never be changed
   * 
   * @param version - Version info
   * @returns Registered version
   */
  async registerVersion(version: Omit<VersionRegistry, 'id'>): Promise<VersionRegistry> {
    try {
      logger.info('Registering new version', {
        version: version.version,
        type: version.type,
      });

      // Generate unique ID
      const id = `version-${version.type}-${version.version}-${Date.now()}`;

      // Create registry entry
      const registryEntry: VersionRegistry = {
        id,
        ...version,
      };

      // Store in registry (immutable)
      this.versionRegistry.set(id, registryEntry);

      logger.info('Version registered', {
        id,
        version: version.version,
        type: version.type,
        codeHash: version.codeHash.substring(0, 16),
      });

      return registryEntry;
    } catch (error) {
      logger.error('Failed to register version', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a specific version from registry
   * Returns exact version that was used for a calculation
   * 
   * @param type - Version type
   * @param version - Version string
   * @returns Version registry entry
   */
  async getVersion(type: 'nbc' | 'calculator' | 'engine', version: string): Promise<VersionRegistry | null> {
    try {
      // Find version in registry
      for (const entry of Array.from(this.versionRegistry.values())) {
        if (entry.type === type && entry.version === version && !entry.deprecated) {
          logger.info('Version retrieved', {
            type,
            version,
            codeHash: entry.codeHash.substring(0, 16),
          });
          return entry;
        }
      }

      logger.warn('Version not found', {
        type,
        version,
      });

      return null;
    } catch (error) {
      logger.error('Failed to get version', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Lock versions for a calculation
   * Creates immutable record of which versions were used
   * 
   * @param params - Version lock parameters
   * @returns Version lock
   */
  async lockVersions(params: {
    calculationId: string;
    nbcVersion: string;
    nbcVersionHash: string;
    calculatorVersion: string;
    calculatorCodeHash: string;
    engineVersion: string;
    engineCodeHash: string;
    userId: string;
  }): Promise<VersionLock> {
    try {
      logger.info('Locking versions for calculation', {
        calculationId: params.calculationId,
        nbcVersion: params.nbcVersion,
        calculatorVersion: params.calculatorVersion,
        engineVersion: params.engineVersion,
      });

      // Create version lock
      const versionLock: VersionLock = {
        nbcVersion: params.nbcVersion,
        nbcVersionHash: params.nbcVersionHash,
        calculatorVersion: params.calculatorVersion,
        calculatorCodeHash: params.calculatorCodeHash,
        engineVersion: params.engineVersion,
        engineCodeHash: params.engineCodeHash,
        lockedAt: new Date(),
        lockedBy: params.userId,
      };

      // Store lock (immutable)
      this.calculationVersionLocks.set(params.calculationId, versionLock);

      logger.info('Versions locked for calculation', {
        calculationId: params.calculationId,
        nbcVersionHash: params.nbcVersionHash.substring(0, 16),
        calculatorCodeHash: params.calculatorCodeHash.substring(0, 16),
        engineCodeHash: params.engineCodeHash.substring(0, 16),
      });

      return versionLock;
    } catch (error) {
      logger.error('Failed to lock versions', {
        calculationId: params.calculationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get version lock for a calculation
   * Shows exactly which versions were used
   * 
   * @param calculationId - Calculation ID
   * @returns Version lock
   */
  async getVersionLock(calculationId: string): Promise<VersionLock | null> {
    try {
      const lock = this.calculationVersionLocks.get(calculationId);

      if (lock) {
        logger.info('Version lock retrieved', {
          calculationId,
          nbcVersion: lock.nbcVersion,
          calculatorVersion: lock.calculatorVersion,
          engineVersion: lock.engineVersion,
        });
      }

      return lock || null;
    } catch (error) {
      logger.error('Failed to get version lock', {
        calculationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Deprecate a version
   * Marks a version as no longer available for new calculations
   * Old calculations using this version can still be reproduced
   * 
   * @param type - Version type
   * @param version - Version string
   * @returns Updated version registry entry
   */
  async deprecateVersion(type: 'nbc' | 'calculator' | 'engine', version: string): Promise<VersionRegistry | null> {
    try {
      logger.warn('Deprecating version', {
        type,
        version,
      });

      // Find and mark as deprecated
      for (const entry of Array.from(this.versionRegistry.values())) {
        if (entry.type === type && entry.version === version) {
          entry.deprecated = true;
          entry.deprecatedDate = new Date();

          logger.info('Version deprecated', {
            type,
            version,
            deprecatedDate: entry.deprecatedDate,
          });

          return entry;
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to deprecate version', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all available versions of a type
   * Shows which versions can be used for new calculations
   * 
   * @param type - Version type
   * @returns Available versions
   */
  async getAvailableVersions(type: 'nbc' | 'calculator' | 'engine'): Promise<VersionRegistry[]> {
    try {
      const versions = Array.from(this.versionRegistry.values())
        .filter(v => v.type === type && !v.deprecated)
        .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());

      logger.info('Available versions retrieved', {
        type,
        count: versions.length,
      });

      return versions;
    } catch (error) {
      logger.error('Failed to get available versions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verify version lock integrity
   * Ensures versions haven't been tampered with
   * 
   * @param calculationId - Calculation ID
   * @returns Verification result
   */
  async verifyVersionLock(calculationId: string): Promise<{
    isValid: boolean;
    nbcVersionValid: boolean;
    calculatorCodeValid: boolean;
    engineCodeValid: boolean;
    errors: string[];
  }> {
    try {
      logger.info('Verifying version lock', {
        calculationId,
      });

      const errors: string[] = [];
      const lock = this.calculationVersionLocks.get(calculationId);

      if (!lock) {
        errors.push('Version lock not found');
        return {
          isValid: false,
          nbcVersionValid: false,
          calculatorCodeValid: false,
          engineCodeValid: false,
          errors,
        };
      }

      // Verify NBC version
      let nbcVersionValid = false;
      try {
        const nbcVersion = await this.getVersion('nbc', lock.nbcVersion);
        if (nbcVersion && nbcVersion.codeHash === lock.nbcVersionHash) {
          nbcVersionValid = true;
        } else {
          errors.push(`NBC version hash mismatch for ${lock.nbcVersion}`);
        }
      } catch (error) {
        errors.push(`NBC version verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      // Verify calculator code
      let calculatorCodeValid = false;
      try {
        const calculatorVersion = await this.getVersion('calculator', lock.calculatorVersion);
        if (calculatorVersion && calculatorVersion.codeHash === lock.calculatorCodeHash) {
          calculatorCodeValid = true;
        } else {
          errors.push(`Calculator code hash mismatch for ${lock.calculatorVersion}`);
        }
      } catch (error) {
        errors.push(`Calculator code verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      // Verify engine code
      let engineCodeValid = false;
      try {
        const engineVersion = await this.getVersion('engine', lock.engineVersion);
        if (engineVersion && engineVersion.codeHash === lock.engineCodeHash) {
          engineCodeValid = true;
        } else {
          errors.push(`Engine code hash mismatch for ${lock.engineVersion}`);
        }
      } catch (error) {
        errors.push(`Engine code verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      const isValid = nbcVersionValid && calculatorCodeValid && engineCodeValid;

      logger.info('Version lock verification complete', {
        calculationId,
        isValid,
        nbcVersionValid,
        calculatorCodeValid,
        engineCodeValid,
        errorCount: errors.length,
      });

      return {
        isValid,
        nbcVersionValid,
        calculatorCodeValid,
        engineCodeValid,
        errors,
      };
    } catch (error) {
      logger.error('Version lock verification failed', {
        calculationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        isValid: false,
        nbcVersionValid: false,
        calculatorCodeValid: false,
        engineCodeValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get version history for a calculation
   * Shows all versions that have been used
   * 
   * @returns Version history
   */
  async getVersionHistory(): Promise<{
    nbcVersions: VersionRegistry[];
    calculatorVersions: VersionRegistry[];
    engineVersions: VersionRegistry[];
  }> {
    try {
      const nbcVersions = Array.from(this.versionRegistry.values()).filter(v => v.type === 'nbc');
      const calculatorVersions = Array.from(this.versionRegistry.values()).filter(v => v.type === 'calculator');
      const engineVersions = Array.from(this.versionRegistry.values()).filter(v => v.type === 'engine');

      logger.info('Version history retrieved', {
        nbcCount: nbcVersions.length,
        calculatorCount: calculatorVersions.length,
        engineCount: engineVersions.length,
      });

      return {
        nbcVersions,
        calculatorVersions,
        engineVersions,
      };
    } catch (error) {
      logger.error('Failed to get version history', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

/**
 * Create and export singleton instance
 */
export const versionLockingSystem = new VersionLockingSystem();
