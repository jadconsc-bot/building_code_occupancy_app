import { eq, and, or, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, bookmarks, notes, InsertBookmark, InsertNote, clients, InsertClient, Client, projectMembers, InsertProjectMember, ProjectMember, teamRoles, InsertTeamRole, TeamRole, subscriptionPlans, InsertSubscriptionPlan, SubscriptionPlan, userSubscriptions, InsertUserSubscription, UserSubscription, usageMetrics, InsertUsageMetric, UsageMetric, shareLinks, InsertShareLink, ShareLink, verificationTokens, InsertVerificationToken, VerificationToken, calculationVersions, InsertCalculationVersion, CalculationVersion } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// Singleton db instance for server-side use
export let db: ReturnType<typeof drizzle> | null = null;

function createPool(): mysql.Pool {
  return mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 60000,
    idleTimeout: 300000,
  });
}

// Lazily create the drizzle instance so local tooling can run without a DB.
// Passes the pool directly so Drizzle acquires a fresh connection on each
// query rather than caching a prepared-statement connection that can go dead.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = createPool();
      _db = drizzle(_pool as any, { mode: 'default', logger: false });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

// Reset the singleton so the next getDb() call creates a fresh pool+drizzle.
async function resetDb(): Promise<void> {
  const oldPool = _pool;
  _db = null;
  _pool = null;
  if (oldPool) {
    try { await oldPool.end(); } catch { /* ignore */ }
  }
}

function isConnectionError(err: any): boolean {
  const code = err?.code ?? err?.cause?.code;
  return (
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === 'ECONNRESET' ||
    err?.cause?.fatal === true ||
    err?.fatal === true ||
    (typeof err?.message === 'string' && (
      err.message.includes('Connection lost') ||
      err.message.includes('ECONNRESET')
    ))
  );
}

/**
 * Retry wrapper for DB operations that may fail due to connection loss.
 *
 * Calls `getDb()` inside each attempt so that after a reset the retry
 * always gets a fresh pool — the closure captures nothing stale.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      if (isConnectionError(err) && attempt < retries) {
        console.warn(`[DB] Connection error on attempt ${attempt}/${retries}, resetting pool and retrying in ${delayMs * attempt}ms...`);
        await resetDb();
        await new Promise(r => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error('DB retry exhausted');
}

/** @deprecated Use withDbRetry instead */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  return withDbRetry(fn, retries, 1000);
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

    await withDbRetry(async () => {
      const freshDb = await getDb();
      if (!freshDb) throw new Error('Database not available after retry');
      await freshDb.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    });
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
  
  // MySQL2 returns result with insertId property
  const resultObj = result as any;
  const clientId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
  
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
  const memberId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
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
  const roleId = resultObj?.insertId ?? resultObj?.[0]?.insertId;
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
