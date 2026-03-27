import { eq, and, or, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { InsertUser, users, bookmarks, notes, InsertBookmark, InsertNote, clients, InsertClient, Client, projectMembers, InsertProjectMember, ProjectMember, teamRoles, InsertTeamRole, TeamRole, subscriptionPlans, InsertSubscriptionPlan, SubscriptionPlan, userSubscriptions, InsertUserSubscription, UserSubscription, usageMetrics, InsertUsageMetric, UsageMetric, shareLinks, InsertShareLink, ShareLink, verificationTokens, InsertVerificationToken, VerificationToken, calculationVersions, InsertCalculationVersion, CalculationVersion } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Singleton db instance for server-side use
export let db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using onConflict
    try {
      await db.insert(users).values(values).onConflict().doNothing();
    } catch (e) {
      // If insert fails due to conflict, update instead
      if ((e as any).code === '23505') { // unique_violation
        await db.update(users).set(updateSet).where(eq(users.openId, values.openId));
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Bookmarks
export async function getUserBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  return result;
}

export async function addBookmark(data: InsertBookmark) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(bookmarks).values(data);
}

export async function removeBookmark(userId: number, occupancyCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(bookmarks).where(
    and(
      eq(bookmarks.userId, userId),
      eq(bookmarks.occupancyCode, occupancyCode)
    )
  );
}

// Notes
export async function getUserNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(notes).where(eq(notes.userId, userId));
  return result;
}

export async function getUserNoteForCode(userId: number, occupancyCode: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(notes).where(
    and(
      eq(notes.userId, userId),
      eq(notes.occupancyCode, occupancyCode)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertNote(data: InsertNote & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (data.id) {
    // Update existing note
    await db.update(notes)
      .set({ content: data.content, updatedAt: new Date() })
      .where(eq(notes.id, data.id));
  } else {
    // Insert new note
    await db.insert(notes).values(data);
  }
}

export async function deleteNote(userId: number, occupancyCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(notes).where(
    and(
      eq(notes.userId, userId),
      eq(notes.occupancyCode, occupancyCode)
    )
  );
}


/**
 * ============================================================================
 * PHASE 2A: CLIENTS & PROJECT MEMBERS
 * ============================================================================
 */

// Clients
export async function createClient(data: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Use proper null coalescing for optional fields
  const safeData = {
    ...data,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
  };
  
  const result = await db.insert(clients).values(safeData as any);
  
  // PostgreSQL returns result array
  const resultObj = result as any;
  const clientId = resultObj?.[0]?.id;
  
  if (clientId === null || clientId === undefined) {
    throw new Error('Failed to get client ID from insert result');
  }
  
  const created = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!created[0]) {
    throw new Error('Failed to retrieve created client');
  }
  return created[0];
}

export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).where(eq(clients.userId, userId));
}

export async function getClientById(clientId: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateClient(clientId: number, data: Partial<InsertClient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set(data).where(eq(clients.id, clientId));
}

export async function deleteClient(clientId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(clients).where(eq(clients.id, clientId));
}

// Project Members
export async function addProjectMember(data: InsertProjectMember): Promise<ProjectMember> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectMembers).values(data as any);
  const resultObj = result as any;
  const memberId = resultObj?.[0]?.id;
  if (memberId === null || memberId === undefined) throw new Error('Failed to get member ID');
  
  const created = await db.select().from(projectMembers).where(eq(projectMembers.id, memberId)).limit(1);
  return created[0];
}

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projectMembers).where(
    and(
      eq(projectMembers.projectId, projectId),
      isNull(projectMembers.removedAt)
    )
  );
}

export async function getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(projectMembers).where(
    and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId),
      isNull(projectMembers.removedAt)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProjectMemberRole(projectId: number, userId: number, role: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectMembers)
    .set({ role: role as any })
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    );
}

export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectMembers)
    .set({ removedAt: new Date() })
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      )
    );
}

// Team Roles
export async function createTeamRole(data: InsertTeamRole): Promise<TeamRole> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(teamRoles).values(data as any);
  const resultObj = result as any;
  const roleId = resultObj?.[0]?.id;
  if (roleId === null || roleId === undefined) throw new Error('Failed to get role ID');
  
  const created = await db.select().from(teamRoles).where(eq(teamRoles.id, roleId)).limit(1);
  return created[0];
}

export async function getTeamRolesByFirmId(firmId: number): Promise<TeamRole[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(teamRoles).where(eq(teamRoles.firmId, firmId));
}

export async function updateTeamRole(roleId: number, data: Partial<InsertTeamRole>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(teamRoles).set(data).where(eq(teamRoles.id, roleId));
}

/**
 * ============================================================================
 * PHASE 3: SUBSCRIPTIONS & USAGE METRICS
 * ============================================================================
 */

// Subscription Plans
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}

export async function getSubscriptionPlanById(planId: number): Promise<SubscriptionPlan | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// User Subscriptions
export async function getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserSubscription(data: InsertUserSubscription): Promise<UserSubscription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(userSubscriptions).values(data as any);
  const resultObj = result as any;
  const subId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  if (subId === null || subId === undefined) throw new Error('Failed to get subscription ID');
  
  const created = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, subId)).limit(1);
  return created[0];
}

export async function updateUserSubscription(userId: number, data: Partial<InsertUserSubscription>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(userSubscriptions).set(data).where(eq(userSubscriptions.userId, userId));
}

// Usage Metrics
export async function getUsageMetrics(userId: number, month: string): Promise<UsageMetric | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(usageMetrics).where(
    and(
      eq(usageMetrics.userId, userId),
      eq(usageMetrics.month, month)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateUsageMetrics(data: InsertUsageMetric): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUsageMetrics(data.userId, data.month);
  
  if (existing) {
    await db.update(usageMetrics)
      .set(data)
      .where(
        and(
          eq(usageMetrics.userId, data.userId),
          eq(usageMetrics.month, data.month)
        )
      );
  } else {
    await db.insert(usageMetrics).values(data);
  }
}

/**
 * ============================================================================
 * PHASE 2D: SHARING & VERIFICATION
 * ============================================================================
 */

// Share Links
export async function createShareLink(data: InsertShareLink): Promise<ShareLink> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(shareLinks).values(data as any);
  const resultObj = result as any;
  const linkId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  if (linkId === null || linkId === undefined) throw new Error('Failed to get share link ID');
  
  const created = await db.select().from(shareLinks).where(eq(shareLinks.id, linkId)).limit(1);
  return created[0];
}

export async function getShareLinkByToken(token: string): Promise<ShareLink | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(shareLinks).where(eq(shareLinks.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectShareLinks(projectId: number): Promise<ShareLink[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(shareLinks).where(eq(shareLinks.projectId, projectId));
}

export async function getUserShareLinks(userId: number): Promise<ShareLink[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(shareLinks).where(eq(shareLinks.createdBy, userId));
}

export async function updateShareLinkAccessCount(linkId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const link = await db.select().from(shareLinks).where(eq(shareLinks.id, linkId)).limit(1);
  if (link.length > 0) {
    await db.update(shareLinks)
      .set({ accessCount: link[0].accessCount + 1 })
      .where(eq(shareLinks.id, linkId));
  }
}

export async function deactivateShareLink(linkId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(shareLinks).set({ isActive: false }).where(eq(shareLinks.id, linkId));
}

// Verification Tokens
export async function createVerificationToken(data: InsertVerificationToken): Promise<VerificationToken> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(verificationTokens).values(data as any);
  const resultObj = result as any;
  const tokenId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  if (tokenId === null || tokenId === undefined) throw new Error('Failed to get token ID');
  
  const created = await db.select().from(verificationTokens).where(eq(verificationTokens.id, tokenId)).limit(1);
  return created[0];
}

export async function getVerificationTokenByToken(token: string): Promise<VerificationToken | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementVerificationTokenViewCount(tokenId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const token = await db.select().from(verificationTokens).where(eq(verificationTokens.id, tokenId)).limit(1);
  if (token.length > 0) {
    await db.update(verificationTokens)
      .set({ 
        viewCount: token[0].viewCount + 1,
        lastViewedAt: new Date()
      })
      .where(eq(verificationTokens.id, tokenId));
  }
}

/**
 * ============================================================================
 * PHASE 2C: CALCULATION VERSIONING
 * ============================================================================
 */

export async function createCalculationVersion(data: InsertCalculationVersion): Promise<CalculationVersion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(calculationVersions).values(data as any);
  const resultObj = result as any;
  const versionId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  if (versionId === null || versionId === undefined) throw new Error('Failed to get version ID');
  
  const created = await db.select().from(calculationVersions).where(eq(calculationVersions.id, versionId)).limit(1);
  return created[0];
}

export async function getCalculationVersions(calculationResultId: string): Promise<CalculationVersion[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(calculationVersions)
    .where(eq(calculationVersions.calculationResultId, calculationResultId));
}

export async function getCalculationVersion(versionId: string): Promise<CalculationVersion | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(calculationVersions).where(eq(calculationVersions.id, versionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


/**
 * ============================================================================
 * PHASE 2: REPORT PERSISTENCE, SCENARIOS, AND BATCH COMPARISONS
 * ============================================================================
 */

// Import new types
import { reports, InsertReport, Report, scenarios, InsertScenario, Scenario, scenarioHistory, InsertScenarioHistory, ScenarioHistory, batchComparisons, InsertBatchComparison, BatchComparison } from "../drizzle/schema";

// ============================================================================
// REPORTS
// ============================================================================

/**
 * Save a new report to the database
 */
export async function saveReport(data: InsertReport): Promise<Report> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reports).values(data as any);
  const resultObj = result as any;
  const reportId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  
  if (reportId === null || reportId === undefined) {
    throw new Error('Failed to get report ID from insert result');
  }
  
  const created = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!created[0]) {
    throw new Error('Failed to retrieve created report');
  }
  return created[0];
}

/**
 * Get all reports for a user
 */
export async function getUserReports(userId: number): Promise<Report[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(reports).where(eq(reports.userId, userId));
}

/**
 * Get reports for a specific project
 */
export async function getProjectReports(userId: number, projectId: number): Promise<Report[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(reports).where(
    and(
      eq(reports.userId, userId),
      eq(reports.projectId, projectId)
    )
  );
}

/**
 * Get a specific report by ID
 */
export async function getReportById(reportId: number, userId: number): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(reports).where(
    and(
      eq(reports.id, reportId),
      eq(reports.userId, userId)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update a report
 */
export async function updateReport(reportId: number, userId: number, data: Partial<InsertReport>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(reports)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      )
    );
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(reports).where(
    and(
      eq(reports.id, reportId),
      eq(reports.userId, userId)
    )
  );
}

// ============================================================================
// SCENARIOS
// ============================================================================

/**
 * Save a new scenario
 */
export async function saveScenario(data: InsertScenario): Promise<Scenario> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(scenarios).values(data as any);
  const resultObj = result as any;
  const scenarioId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  
  if (scenarioId === null || scenarioId === undefined) {
    throw new Error('Failed to get scenario ID from insert result');
  }
  
  const created = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
  if (!created[0]) {
    throw new Error('Failed to retrieve created scenario');
  }
  return created[0];
}

/**
 * Get all scenarios for a user
 */
export async function getUserScenarios(userId: number): Promise<Scenario[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scenarios).where(eq(scenarios.userId, userId));
}

/**
 * Get scenarios for a specific project
 */
export async function getProjectScenarios(userId: number, projectId: number): Promise<Scenario[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scenarios).where(
    and(
      eq(scenarios.userId, userId),
      eq(scenarios.projectId, projectId)
    )
  );
}

/**
 * Get a specific scenario by ID
 */
export async function getScenarioById(scenarioId: number, userId: number): Promise<Scenario | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(scenarios).where(
    and(
      eq(scenarios.id, scenarioId),
      eq(scenarios.userId, userId)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update a scenario
 */
export async function updateScenario(scenarioId: number, userId: number, data: Partial<InsertScenario>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(scenarios)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(scenarios.id, scenarioId),
        eq(scenarios.userId, userId)
      )
    );
}

/**
 * Delete a scenario
 */
export async function deleteScenario(scenarioId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(scenarios).where(
    and(
      eq(scenarios.id, scenarioId),
      eq(scenarios.userId, userId)
    )
  );
}

// ============================================================================
// SCENARIO HISTORY
// ============================================================================

/**
 * Record a scenario version change
 */
export async function recordScenarioHistory(data: InsertScenarioHistory): Promise<ScenarioHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(scenarioHistory).values(data as any);
  const resultObj = result as any;
  const historyId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  
  if (historyId === null || historyId === undefined) {
    throw new Error('Failed to get history ID from insert result');
  }
  
  const created = await db.select().from(scenarioHistory).where(eq(scenarioHistory.id, historyId)).limit(1);
  if (!created[0]) {
    throw new Error('Failed to retrieve created history record');
  }
  return created[0];
}

/**
 * Get version history for a scenario
 */
export async function getScenarioHistory(scenarioId: number): Promise<ScenarioHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scenarioHistory)
    .where(eq(scenarioHistory.scenarioId, scenarioId));
}

// ============================================================================
// BATCH COMPARISONS
// ============================================================================

/**
 * Save a new batch comparison
 */
export async function saveBatchComparison(data: InsertBatchComparison): Promise<BatchComparison> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(batchComparisons).values(data as any);
  const resultObj = result as any;
  const batchId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  
  if (batchId === null || batchId === undefined) {
    throw new Error('Failed to get batch comparison ID from insert result');
  }
  
  const created = await db.select().from(batchComparisons).where(eq(batchComparisons.id, batchId)).limit(1);
  if (!created[0]) {
    throw new Error('Failed to retrieve created batch comparison');
  }
  return created[0];
}

/**
 * Get all batch comparisons for a user
 */
export async function getUserBatchComparisons(userId: number): Promise<BatchComparison[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(batchComparisons).where(eq(batchComparisons.userId, userId));
}

/**
 * Get batch comparisons for a specific project
 */
export async function getProjectBatchComparisons(userId: number, projectId: number): Promise<BatchComparison[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(batchComparisons).where(
    and(
      eq(batchComparisons.userId, userId),
      eq(batchComparisons.projectId, projectId)
    )
  );
}

/**
 * Get a specific batch comparison by ID
 */
export async function getBatchComparisonById(batchId: number, userId: number): Promise<BatchComparison | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(batchComparisons).where(
    and(
      eq(batchComparisons.id, batchId),
      eq(batchComparisons.userId, userId)
    )
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update a batch comparison
 */
export async function updateBatchComparison(batchId: number, userId: number, data: Partial<InsertBatchComparison>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(batchComparisons)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(batchComparisons.id, batchId),
        eq(batchComparisons.userId, userId)
      )
    );
}

/**
 * Delete a batch comparison
 */
export async function deleteBatchComparison(batchId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(batchComparisons).where(
    and(
      eq(batchComparisons.id, batchId),
      eq(batchComparisons.userId, userId)
    )
  );
}
