/**
 * Ruleset Version Manager
 * 
 * Manages NBC ruleset versions and ensures calculations are tied to specific rule versions
 * Provides legal defensibility by proving which rules were used for each calculation
 */

interface RulesetVersion {
  id: string;
  version: string;
  nbcYear: number;
  releaseDate: Date;
  description: string;
  rules: Record<string, any>;
  hash: string;
  signature: string;
  active: boolean;
}

interface RulesetSnapshot {
  rulesetVersion: string;
  nbcYear: number;
  releaseDate: Date;
  rulesHash: string;
  calculatorVersions: Record<string, string>;
}

/**
 * Ruleset Version Manager
 * Tracks and manages ruleset versions for legal defensibility
 */
export class RulesetVersionManager {
  private versions: Map<string, RulesetVersion> = new Map();
  private currentVersion: string = 'NBC-2023-v1.0';

  constructor() {
    this.initializeDefaultVersions();
  }

  /**
   * Initialize default NBC versions
   */
  private initializeDefaultVersions(): void {
    // NBC 2023 Version 1.0
    this.versions.set('NBC-2023-v1.0', {
      id: 'nbc-2023-v1-0',
      version: 'NBC-2023-v1.0',
      nbcYear: 2023,
      releaseDate: new Date('2023-01-01'),
      description: 'National Building Code of Canada 2023 - Initial Release',
      rules: {
        occupancyClassifications: 'A-1 through F-3',
        fireExit: 'Part 3.4',
        plumbing: 'Part 3.6',
        electrical: 'Part 3.7',
        accessibility: 'Part 3.8',
      },
      hash: 'abc123def456', // Would be actual hash
      signature: 'sig-nbc-2023-v1-0',
      active: true,
    });

    // NBC 2023 Version 1.1 (hypothetical update)
    this.versions.set('NBC-2023-v1.1', {
      id: 'nbc-2023-v1-1',
      version: 'NBC-2023-v1.1',
      nbcYear: 2023,
      releaseDate: new Date('2023-06-15'),
      description: 'National Building Code of Canada 2023 - Amendment 1',
      rules: {
        occupancyClassifications: 'A-1 through F-3',
        fireExit: 'Part 3.4 (updated)',
        plumbing: 'Part 3.6',
        electrical: 'Part 3.7 (updated)',
        accessibility: 'Part 3.8',
      },
      hash: 'def456ghi789', // Would be actual hash
      signature: 'sig-nbc-2023-v1-1',
      active: false,
    });
  }

  /**
   * Get current active ruleset version
   */
  getCurrentVersion(): RulesetVersion | null {
    return this.versions.get(this.currentVersion) || null;
  }

  /**
   * Get specific ruleset version
   */
  getVersion(versionId: string): RulesetVersion | null {
    return this.versions.get(versionId) || null;
  }

  /**
   * List all available versions
   */
  listVersions(): RulesetVersion[] {
    return Array.from(this.versions.values());
  }

  /**
   * Set active version
   */
  setActiveVersion(versionId: string): boolean {
    if (!this.versions.has(versionId)) {
      return false;
    }

    // Mark all as inactive
    this.versions.forEach(v => (v.active = false));

    // Mark selected as active
    const version = this.versions.get(versionId);
    if (version) {
      version.active = true;
      this.currentVersion = versionId;
      return true;
    }

    return false;
  }

  /**
   * Register a new ruleset version
   */
  registerVersion(version: RulesetVersion): boolean {
    if (this.versions.has(version.version)) {
      return false; // Version already exists
    }

    this.versions.set(version.version, version);
    return true;
  }

  /**
   * Create a snapshot of current ruleset state
   * Used to lock calculations to specific ruleset versions
   */
  createSnapshot(): RulesetSnapshot {
    const currentVersion = this.getCurrentVersion();

    if (!currentVersion) {
      throw new Error('No active ruleset version');
    }

    return {
      rulesetVersion: currentVersion.version,
      nbcYear: currentVersion.nbcYear,
      releaseDate: currentVersion.releaseDate,
      rulesHash: currentVersion.hash,
      calculatorVersions: {
        occupantLoad: '1.0',
        fireExit: '1.0',
        plumbing: '1.0',
        electrical: '1.0',
        stairDesign: '1.0',
      },
    };
  }

  /**
   * Verify a calculation was performed with a specific ruleset version
   */
  verifyRulesetVersion(
    rulesetVersion: string,
    calculationData: Record<string, any>
  ): boolean {
    const version = this.getVersion(rulesetVersion);

    if (!version) {
      return false; // Version doesn't exist
    }

    // Verify the calculation contains the ruleset version
    if (calculationData.rulesetVersion !== rulesetVersion) {
      return false;
    }

    // Verify the version was active at the time of calculation
    // (In production, would check timestamp against version release date)

    return true;
  }

  /**
   * Get ruleset change history
   */
  getChangeHistory(): Array<{
    version: string;
    date: Date;
    changes: string[];
  }> {
    return Array.from(this.versions.values()).map(v => ({
      version: v.version,
      date: v.releaseDate,
      changes: Object.entries(v.rules)
        .filter(([key]) => key.includes('updated'))
        .map(([key]) => key),
    }));
  }

  /**
   * Create audit trail entry for ruleset version
   */
  createAuditEntry(
    rulesetVersion: string,
    action: string,
    details: Record<string, any>
  ): {
    timestamp: Date;
    version: string;
    action: string;
    details: Record<string, any>;
    hash: string;
  } {
    const entry = {
      timestamp: new Date(),
      version: rulesetVersion,
      action,
      details,
      hash: '', // Would be actual hash
    };

    // Create hash of entry
    const entryString = JSON.stringify(entry);
    const crypto = require('crypto');
    entry.hash = crypto.createHash('sha256').update(entryString).digest('hex');

    return entry;
  }
}

export default RulesetVersionManager;
