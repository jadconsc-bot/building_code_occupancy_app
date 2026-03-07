/**
 * Test Utilities
 * Provides test data seeding, fixtures, and cleanup utilities
 */

import { getDb } from '../db';
import { users, projects, userSubscriptions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate unique test data to avoid conflicts
 */
export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a test user with unique data
 */
export async function createTestUser(overrides?: {
  openId?: string;
  email?: string;
  name?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const testId = generateTestId('test-user');
  const openId = overrides?.openId || testId;
  
  await db
    .insert(users)
    .values({
      openId,
      email: overrides?.email || `${testId}@example.com`,
      name: overrides?.name || `Test User ${testId}`,
      role: 'user',
    });

  // Fetch the created user
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

/**
 * Create a test project for a user
 */
export async function createTestProject(userId: number, overrides?: {
  name?: string;
  occupancyCode?: string;
  buildingType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const testId = generateTestId('test-project');
  const projectName = overrides?.name || `Test Project ${testId}`;

  await db
    .insert(projects)
    .values({
      userId,
      name: projectName,
      occupancyCode: overrides?.occupancyCode || 'A-1',
      template: overrides?.buildingType || 'Residential',
      status: 'active',
    });

  // Fetch the created project
  const result = await db.select().from(projects).where(eq(projects.name, projectName)).limit(1);
  return result[0];
}

/**
 * Clean up specific user and all their related data
 */
export async function cleanupTestUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  try {
    // Delete projects for this user
    await db.delete(projects).where(eq(projects.userId, userId));

    // Delete subscriptions for this user
    await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, userId));

    // Delete the user
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    console.error(`Error cleaning up test user ${userId}:`, error);
  }
}

/**
 * Clean up multiple test users
 */
export async function cleanupTestUsers(userIds: number[]) {
  for (const userId of userIds) {
    await cleanupTestUser(userId);
  }
}

/**
 * Get or create a test user by openId
 */
export async function getOrCreateTestUser(openId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  let user = result[0];

  if (!user) {
    user = await createTestUser({ openId });
  }

  return user;
}
