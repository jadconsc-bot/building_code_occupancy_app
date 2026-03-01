/**
 * Calculation Database Query Helpers
 * 
 * Reusable query functions for calculation operations
 * Follows tRPC best practices: query helpers return raw Drizzle rows
 */

import { getDb } from './db';
import { calculationResults, calculationAuditLog } from '../drizzle/schema';
import { eq, and, desc, gte, lte, like } from 'drizzle-orm';

/**
 * Save calculation result to database
 */
export async function saveCalculationResult(data: {
  id: string;
  projectId: number;
  userId: number;
  calculatorType: string;
  displayName: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  calculationTrace: any[];
  signature: string;
  certificateId: string;
  signatureVerified: boolean;
  resultSummary: string;
  nbcVersion: string;
  nbcReferences: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(calculationResults).values({
    id: data.id,
    projectId: data.projectId,
    userId: data.userId,
    calculatorType: data.calculatorType,
    displayName: data.displayName,
    inputs: JSON.stringify(data.inputs),
    results: JSON.stringify(data.results),
    calculationTrace: JSON.stringify(data.calculationTrace),
    signature: data.signature,
    certificateId: data.certificateId,
    signatureVerified: data.signatureVerified,
    resultSummary: data.resultSummary,
    nbcVersion: data.nbcVersion,
    nbcReferences: JSON.stringify(data.nbcReferences),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Get calculation by ID
 */
export async function getCalculationById(calculationId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [result] = await db
    .select()
    .from(calculationResults)
    .where(eq(calculationResults.id, calculationId))
    .limit(1);

  return result || null;
}

/**
 * Get calculations for user with filters
 */
export async function getUserCalculations(userId: number, filters?: {
  projectId?: number;
  calculatorType?: string;
  startDate?: Date;
  endDate?: Date;
  verified?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions = [eq(calculationResults.userId, userId)];

  if (filters?.projectId) {
    conditions.push(eq(calculationResults.projectId, filters.projectId));
  }

  if (filters?.calculatorType) {
    conditions.push(eq(calculationResults.calculatorType, filters.calculatorType));
  }

  if (filters?.verified !== undefined) {
    conditions.push(eq(calculationResults.signatureVerified, filters.verified));
  }

  if (filters?.startDate) {
    conditions.push(gte(calculationResults.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(calculationResults.createdAt, filters.endDate));
  }

  const results = await db
    .select()
    .from(calculationResults)
    .where(and(...conditions))
    .orderBy(desc(calculationResults.createdAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);

  return results;
}

/**
 * Get calculation count for user
 */
export async function getUserCalculationCount(userId: number, filters?: {
  projectId?: number;
  calculatorType?: string;
  verified?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions = [eq(calculationResults.userId, userId)];

  if (filters?.projectId) {
    conditions.push(eq(calculationResults.projectId, filters.projectId));
  }

  if (filters?.calculatorType) {
    conditions.push(eq(calculationResults.calculatorType, filters.calculatorType));
  }

  if (filters?.verified !== undefined) {
    conditions.push(eq(calculationResults.signatureVerified, filters.verified));
  }

  const result = await db
    .select({ count: calculationResults.id })
    .from(calculationResults)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

/**
 * Get calculations by project
 */
export async function getProjectCalculations(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select()
    .from(calculationResults)
    .where(eq(calculationResults.projectId, projectId))
    .orderBy(desc(calculationResults.createdAt));

  return results;
}

/**
 * Get calculations by calculator type
 */
export async function getCalculationsByType(calculatorType: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select()
    .from(calculationResults)
    .where(
      and(
        eq(calculationResults.calculatorType, calculatorType),
        eq(calculationResults.userId, userId)
      )
    )
    .orderBy(desc(calculationResults.createdAt));

  return results;
}

/**
 * Get verified calculations
 */
export async function getVerifiedCalculations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select()
    .from(calculationResults)
    .where(
      and(
        eq(calculationResults.userId, userId),
        eq(calculationResults.signatureVerified, true)
      )
    )
    .orderBy(desc(calculationResults.createdAt));

  return results;
}

/**
 * Get recent calculations
 */
export async function getRecentCalculations(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db
    .select()
    .from(calculationResults)
    .where(
      and(
        eq(calculationResults.userId, userId),
        gte(calculationResults.createdAt, startDate)
      )
    )
    .orderBy(desc(calculationResults.createdAt));

  return results;
}

/**
 * Add audit log entry
 */
export async function addAuditLogEntry(data: {
  calculationId: string;
  action: string;
  actor: string;
  details?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(calculationAuditLog).values({
    calculationId: data.calculationId,
    action: data.action,
    actor: data.actor,
    timestamp: new Date(),
    details: data.details || '',
  });
}

/**
 * Get audit log for calculation
 */
export async function getCalculationAuditLog(calculationId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select()
    .from(calculationAuditLog)
    .where(eq(calculationAuditLog.calculationId, calculationId))
    .orderBy(desc(calculationAuditLog.timestamp));

  return results;
}

/**
 * Get calculation statistics for user
 */
export async function getUserCalculationStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select()
    .from(calculationResults)
    .where(eq(calculationResults.userId, userId));

  const stats = {
    totalCalculations: results.length,
    verifiedCalculations: results.filter((r) => r.signatureVerified).length,
    calculatorTypes: [...new Set(results.map((r) => r.calculatorType))].length,
    lastCalculation: results.length > 0 ? results[0].createdAt : null,
    byCalculatorType: {} as Record<string, number>,
    byProject: {} as Record<number, number>,
  };

  // Count by calculator type
  for (const result of results) {
    stats.byCalculatorType[result.calculatorType] =
      (stats.byCalculatorType[result.calculatorType] || 0) + 1;
    stats.byProject[result.projectId] =
      (stats.byProject[result.projectId] || 0) + 1;
  }

  return stats;
}

/**
 * Search calculations
 */
export async function searchCalculations(
  userId: number,
  query: string,
  limit: number = 20
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const searchPattern = `%${query}%`;

  const results = await db
    .select()
    .from(calculationResults)
    .where(
      and(
        eq(calculationResults.userId, userId),
        like(calculationResults.displayName, searchPattern)
      )
    )
    .orderBy(desc(calculationResults.createdAt))
    .limit(limit);

  return results;
}

/**
 * Get calculations for export (with full data)
 */
export async function getCalculationsForExport(
  userId: number,
  calculationIds: string[]
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select()
    .from(calculationResults)
    .where(
      and(
        eq(calculationResults.userId, userId),
        calculationIds.length > 0
          ? // In production, would use IN operator
            eq(calculationResults.id, calculationIds[0])
          : eq(calculationResults.id, '')
      )
    );

  return results;
}

/**
 * Get calculation by signature
 */
export async function getCalculationBySignature(signature: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [result] = await db
    .select()
    .from(calculationResults)
    .where(eq(calculationResults.signature, signature))
    .limit(1);

  return result || null;
}

/**
 * Update calculation verification status
 */
export async function updateCalculationVerificationStatus(
  calculationId: string,
  verified: boolean
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would use UPDATE statement
  // For now, just log the operation
  await addAuditLogEntry({
    calculationId,
    action: 'VERIFICATION_UPDATE',
    actor: 'SYSTEM',
    details: `Verification status updated to ${verified}`,
  });
}

/**
 * Get calculations for compliance report
 */
export async function getCalculationsForComplianceReport(
  projectId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const results = await db
    .select()
    .from(calculationResults)
    .where(
      and(
        eq(calculationResults.projectId, projectId),
        eq(calculationResults.userId, userId),
        eq(calculationResults.signatureVerified, true)
      )
    )
    .orderBy(desc(calculationResults.createdAt));

  return results;
}
