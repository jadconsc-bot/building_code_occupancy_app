/**
 * Test Fixtures Helper
 * 
 * Provides reusable test data factories that create real database records
 * with proper foreign key relationships for legal defensibility testing.
 * 
 * All test data must be real and properly related to avoid bypassing
 * database constraints that are part of the compliance model.
 */

import { getDb } from '../../db';
import { drawingAnalyses } from '../../../drizzle/schema';

/**
 * Create a real test analysis record with proper defaults
 * 
 * @param overrides - Optional field overrides for specific test scenarios
 * @returns The insertId of the created record
 */
export async function createTestAnalysis(overrides: Record<string, any> = {}) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  const result = await (db as any)
    .insert(drawingAnalyses)
    .values({
      projectId: 1,
      userId: 1,
      drawingUrl: 'https://test-bucket.s3.amazonaws.com/test-drawing.pdf',
      drawingHash: 'abc123def456' + Math.random().toString(36).slice(2),
      analysisStatus: 'DRAFT',
      disclaimerAcknowledged: true,
      disclaimerVersion: '1.0',
      extractedData: JSON.stringify({}),
      complianceScore: 0,
      validatedAt: null,
      rejectionReason: null,
      professionalReviewedBy: null,
      digitalSignature: null,
      exportedAt: null,
      buildingCodeVariant: 'NBC-2023-AB',
      ...overrides,
    });

  // Drizzle returns [ResultSetHeader] for MySQL inserts
  const insertId = Array.isArray(result) && result[0]?.insertId 
    ? result[0].insertId 
    : (result as any)?.insertId;

  if (!insertId) {
    throw new Error('Failed to retrieve insertId from insert result');
  }

  return insertId;
}

/**
 * Create a test user (placeholder for future implementation)
 * 
 * For now, returns a seeded user ID. In the future, this should
 * create actual user records if needed for role-based testing.
 */
export async function createTestUser(overrides: Record<string, any> = {}) {
  // Return seeded test user ID
  // In the future, create actual user records if needed
  return 1;
}

/**
 * Clean up test data after test execution
 * 
 * @param analysisId - The analysis record to clean up
 */
export async function cleanupTestAnalysis(analysisId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    const { complianceAuditTrail } = await import('../../../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    // Delete audit trail records first (FK constraint)
    await (db as any)
      .delete(complianceAuditTrail)
      .where(eq(complianceAuditTrail.analysisId, analysisId));

    // Then delete the analysis record
    await (db as any)
      .delete(drawingAnalyses)
      .where(eq(drawingAnalyses.id, analysisId));
  } catch (error) {
    console.error('[testFixtures] Cleanup failed:', error);
    // Don't throw - cleanup failures should not fail tests
  }
}
