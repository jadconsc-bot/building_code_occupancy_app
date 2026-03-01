import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bookmarks, notes, InsertBookmark, InsertNote } from "../drizzle/schema";
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
