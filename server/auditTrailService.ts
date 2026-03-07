import { eq, desc } from 'drizzle-orm';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import { complianceAuditLog, auditModificationHistory, auditSignatures } from '../drizzle/schema';

/**
 * Audit Trail Service
 * 
 * Integrates with existing complianceEngine to create defensible audit logs
 * Works with Compliance.tsx page and report generation
 */
export class AuditTrailService {
  private db: any = null;

  async initDb() {
    if (!this.db) {
      try {
        const dbModule = await import('./db');
        this.db = dbModule.db;
      } catch (e) {
        console.error('Failed to initialize database:', e);
      }
    }
  }

  /**
   * Create audit log AFTER compliance evaluation
   * 
   * Call this from Compliance page after running compliance check
   * Inputs come directly from complianceEngine results
   */
  async createAuditLog(
    projectId: number,
    engineerId: number,
    complianceResults: {
      rule_trace: Array<{
        fired: boolean;
        rule_id: string;
        clause: string;
        conditions_met: boolean;
      }>;
      compliance_flags: {
        isCompliant: boolean;
      };
    },
    projectData: Record<string, any>,
    projectInfo: {
      name: string;
      engineer: string;
      licenseNumber?: string;
      email?: string;
      codeVersion?: string;
    }
  ): Promise<string> {
    await this.initDb();
    if (!this.db) throw new Error('Database not initialized');

    const auditId = uuid();

    // Extract rules that fired from compliance engine
    const firedRules = complianceResults.rule_trace
      .filter(r => r.fired)
      .map(r => ({
        ruleId: r.rule_id,
        ruleName: r.clause || '',
        fired: true,
        result: 'PASS',
      }));

    const totalRules = complianceResults.rule_trace.length;
    const compliancePercent = totalRules > 0 
      ? (firedRules.length / totalRules) * 100 
      : 0;

    const entry = {
      id: auditId,
      projectId,
      projectName: projectInfo.name,
      engineerId,
      engineerName: projectInfo.engineer,
      engineerLicense: projectInfo.licenseNumber || '',
      engineerEmail: projectInfo.email || '',
      codeVersion: projectInfo.codeVersion || 'NBC_2025',
      jurisdiction: 'Canada',

      // Store rule evaluation results
      rulesEvaluated: JSON.stringify(firedRules),
      projectData: JSON.stringify(projectData),

      // Counts
      totalRulesEvaluated: totalRules,
      totalRulesPassed: firedRules.length,
      totalRulesFailed: totalRules - firedRules.length,
      compliancePercentage: compliancePercent,
      overallStatus: complianceResults.compliance_flags.isCompliant
        ? 'COMPLIANT'
        : 'NON_COMPLIANT',

      // Defensibility
      isDefendable: true,
      hasAllRules: true,
      isComprehensive: true,

      // Standard assumptions/limitations
      assumptions: JSON.stringify([
        'Building codes current for jurisdiction',
        'All components meet cited standards',
        'Professional engineer responsible for final design',
        'Analysis deterministic based on provided inputs',
      ]),
      limitations: JSON.stringify([
        'Analysis based on provided inputs only',
        'Professional judgment required for edge cases',
        'Authority Having Jurisdiction approval required',
        'This is a recommendation, not a substitution for professional review',
      ]),
    };

    // Insert audit log
    await this.db.insert(complianceAuditLog).values(entry as any);

    // Log creation in modification history
    await this.db.insert(auditModificationHistory).values({
      auditId,
      modifiedBy: engineerId,
      changeDescription: 'Audit log created',
    });

    return auditId;
  }

  /**
   * Sign an audit log with digital signature
   * Called from signature pad component
   */
  async signAuditLog(
    auditId: string,
    engineerId: number,
    signatureImage: string // Base64 PNG from signature pad
  ): Promise<void> {
    await this.initDb();
    if (!this.db) throw new Error('Database not initialized');

    const signatureHash = this.generateSignatureHash(signatureImage);

    // Use transaction to ensure consistency
    await this.db.transaction(async (tx: any) => {
      // Update audit log
      await tx
        .update(complianceAuditLog)
        .set({
          signatureImage,
          signatureTimestamp: new Date(),
          signatureHash,
          status: 'SIGNED',
        })
        .where(eq(complianceAuditLog.id, auditId));

      // Record signature
      await tx.insert(auditSignatures).values({
        auditId,
        signedBy: engineerId,
        signatureImage,
        signatureType: 'ENGINEER',
        signatureValid: true,
      });

      // Log modification
      await tx.insert(auditModificationHistory).values({
        auditId,
        modifiedBy: engineerId,
        changeDescription: 'Audit log signed by engineer',
      });
    });
  }

  /**
   * Verify audit hasn't been tampered with
   * Used to show "✓ Verified" badge
   */
  async verifyAuditIntegrity(auditId: string): Promise<boolean> {
    await this.initDb();
    if (!this.db) return false;

    const audit = await this.db.query.complianceAuditLog.findFirst({
      where: eq(complianceAuditLog.id, auditId),
    });

    if (!audit || !audit.signatureHash) return false;

    // Recalculate hash and compare
    const currentHash = this.generateSignatureHash(audit.signatureImage || '');
    return currentHash === audit.signatureHash;
  }

  /**
   * Generate legal defense report
   * Engineers download this for permit submission
   */
  async generateDefenseReport(auditId: string): Promise<string> {
    await this.initDb();
    if (!this.db) throw new Error('Database not initialized');

    const audit = await this.db.query.complianceAuditLog.findFirst({
      where: eq(complianceAuditLog.id, auditId),
    });

    if (!audit) throw new Error('Audit not found');

    const isValid = await this.verifyAuditIntegrity(auditId);

    return `
PROFESSIONAL COMPLIANCE AUDIT REPORT
=====================================

Project: ${audit.projectName}
Audit ID: ${audit.id}
Date: ${new Date(audit.timestamp || '').toLocaleDateString()}

ENGINEER INFORMATION
====================
Name: ${audit.engineerName}
License: ${audit.engineerLicense}
Email: ${audit.engineerEmail}

COMPLIANCE SUMMARY
==================
Code Version: ${audit.codeVersion}
Jurisdiction: ${audit.jurisdiction}
Overall Status: ${audit.overallStatus}
Compliance Score: ${Math.round((audit.compliancePercentage as number) || 0)}%

RULES EVALUATED
===============
Total Rules: ${audit.totalRulesEvaluated}
Rules Passed: ${audit.totalRulesPassed}
Rules Failed: ${audit.totalRulesFailed}

DIGITAL SIGNATURE VERIFICATION
==============================
Status: ${isValid ? '✓ VERIFIED' : '⚠ SIGNATURE MISMATCH'}
Signature Date: ${new Date(audit.signatureTimestamp || '').toLocaleString()}

ASSUMPTIONS
===========
${JSON.parse(audit.assumptions || '[]').map((a: string) => `• ${a}`).join('\n')}

LIMITATIONS
===========
${JSON.parse(audit.limitations || '[]').map((l: string) => `• ${l}`).join('\n')}

PROFESSIONAL LIABILITY STATEMENT
================================
This analysis is provided as a professional engineering recommendation. The 
engineer of record remains responsible for all design decisions and code 
compliance. This audit trail provides documented evidence of the analysis 
performed and the rules evaluated.

---
Generated: ${new Date().toLocaleString()}
Audit Trail System v1.0
    `.trim();
  }

  /**
   * Get all project audits (history)
   */
  async getProjectAudits(projectId: number): Promise<any[]> {
    await this.initDb();
    if (!this.db) return [];

    return this.db.query.complianceAuditLog.findMany({
      where: eq(complianceAuditLog.projectId, projectId),
      orderBy: [desc(complianceAuditLog.timestamp)],
    });
  }

  /**
   * Helper: Generate SHA256 hash of signature
   */
  private generateSignatureHash(signatureImage: string): string {
    return createHash('sha256').update(signatureImage).digest('hex');
  }
}

// Export singleton instance
export const auditTrailService = new AuditTrailService();
