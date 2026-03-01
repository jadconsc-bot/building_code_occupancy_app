import { eq, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
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
  
  const result = await db.insert(clients).values(data);
  const clientId = result[0];
  
  const created = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
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
  
  const result = await db.insert(projectMembers).values(data);
  const memberId = result[0];
  
  const created = await db.select().from(projectMembers).where(eq(projectMembers.id, memberId)).limit(1);
  return created[0];
}

export async function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(projectMembers).where(
    and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.removedAt, null)
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
      eq(projectMembers.removedAt, null)
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
  
  const result = await db.insert(teamRoles).values(data);
  const roleId = result[0];
  
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
  
  const result = await db.insert(userSubscriptions).values(data);
  const subId = result[0];
  
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
  
  const result = await db.insert(shareLinks).values(data);
  const linkId = result[0];
  
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
  
  const result = await db.insert(verificationTokens).values(data);
  const tokenId = result[0];
  
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
  
  const result = await db.insert(calculationVersions).values(data);
  const versionId = result[0];
  
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
