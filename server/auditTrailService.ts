import { eq, desc } from 'drizzle-orm';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import { auditLog } from '../drizzle/schema';

/**
 * Audit Trail Service
 * 
 * Logs all significant operations to the auditLog table
 * Supports legal defensibility and compliance tracking
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
   * Log an action to the audit trail
   * 
   * @param userId - User ID performing the action
   * @param action - Action name (e.g., 'legal_disclaimer_acknowledged')
   * @param details - Additional context (JSON)
   * @param projectId - Optional project ID
   * @param snapshotId - Optional snapshot ID
   */
  async log(
    userId: number,
    action: string,
    details?: Record<string, any>,
    projectId?: number,
    snapshotId?: string
  ): Promise<void> {
    await this.initDb();
    if (!this.db) {
      console.error('Database not initialized for audit logging');
      return;
    }

    try {
      await this.db.insert(auditLog).values({
        userId,
        projectId: projectId || null,
        snapshotId: snapshotId || null,
        action,
        details: details ? JSON.stringify(details) : null,
        createdAt: new Date(),
      });
    } catch (e) {
      console.error('Failed to log audit trail entry:', e);
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: number, limit: number = 100): Promise<any[]> {
    await this.initDb();
    if (!this.db) return [];

    try {
      return await this.db.query.auditLog.findMany({
        where: eq(auditLog.userId, userId),
        orderBy: [desc(auditLog.createdAt)],
        limit,
      });
    } catch (e) {
      console.error('Failed to retrieve audit logs:', e);
      return [];
    }
  }

  /**
   * Get audit logs for a specific project
   */
  async getProjectAuditLogs(projectId: number, limit: number = 100): Promise<any[]> {
    await this.initDb();
    if (!this.db) return [];

    try {
      return await this.db.query.auditLog.findMany({
        where: eq(auditLog.projectId, projectId),
        orderBy: [desc(auditLog.createdAt)],
        limit,
      });
    } catch (e) {
      console.error('Failed to retrieve project audit logs:', e);
      return [];
    }
  }

  /**
   * Get audit logs for a specific action
   */
  async getAuditLogsByAction(action: string, limit: number = 100): Promise<any[]> {
    await this.initDb();
    if (!this.db) return [];

    try {
      return await this.db.query.auditLog.findMany({
        where: eq(auditLog.action, action),
        orderBy: [desc(auditLog.createdAt)],
        limit,
      });
    } catch (e) {
      console.error('Failed to retrieve audit logs by action:', e);
      return [];
    }
  }

  /**
   * Get all legal disclaimer acknowledgments
   */
  async getLegalDisclaimerAcknowledgments(limit: number = 100): Promise<any[]> {
    return this.getAuditLogsByAction('legal_disclaimer_acknowledged', limit);
  }
}

// Export singleton instance
export const auditTrailService = new AuditTrailService();
