/**
 * ⚠️ DEVELOPMENT ONLY - REMOVE FOR PRODUCTION
 * 
 * Development Authentication Service
 * 
 * Provides mock authentication for development testing without OAuth.
 * Contains hardcoded dev users for testing purposes only.
 * 
 * REMOVAL INSTRUCTIONS:
 * 1. Delete this entire file: rm server/_core/devAuth.ts
 * 2. Remove all imports of this file from other files
 * 3. Remove dev auth logic from context.ts
 * 4. See DEV_AUTH_REMOVAL_GUIDE.md for complete removal steps
 * 
 * PRODUCTION IMPACT: None - Dev auth removed, OAuth used instead
 * 
 * Created: 2026-03-08
 * Status: Development Only
 */

import * as crypto from "crypto";

/**
 * Development user interface
 */
interface DevUser {
  id: number;
  email: string;
  password: string;
  name: string;
}

/**
 * Hardcoded development users for testing
 * ⚠️ DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION
 */
const DEV_USERS: DevUser[] = [
  {
    id: 1,
    email: "jadconsc@gmail.com",
    password: "De3251ab",
    name: "Senior Developer",
  },
  {
    id: 2,
    email: "admin@dev.local",
    password: "admin123",
    name: "Admin User",
  },
  {
    id: 3,
    email: "user1@dev.local",
    password: "user123",
    name: "Test User 1",
  },
  {
    id: 4,
    email: "user2@dev.local",
    password: "user456",
    name: "Test User 2",
  },
];

/**
 * Get dev user by password
 * Returns user if password matches, null otherwise
 */
export function getDevUser(password: string): DevUser | null {
  const user = DEV_USERS.find((u) => u.password === password);
  return user || null;
}

/**
 * Get dev user by ID
 */
export function getDevUserById(userId: number): DevUser | null {
  return DEV_USERS.find((u) => u.id === userId) || null;
}

/**
 * Generate dev session token
 * Simple token format: userId:timestamp:hash
 */
export function generateDevSessionToken(userId: number): string {
  const timestamp = Date.now();
  const data = `${userId}:${timestamp}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return `${data}:${hash}`;
}

/**
 * Verify dev session token
 * Returns userId if token is valid, null otherwise
 */
export function verifyDevSessionToken(token: string): number | null {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return null;

    const [userIdStr, timestamp, hash] = parts;
    const userId = parseInt(userIdStr);

    // Verify token hasn't expired (7 days)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (tokenAge > maxAge) return null;

    // Verify hash
    const data = `${userId}:${timestamp}`;
    const expectedHash = crypto.createHash("sha256").update(data).digest("hex");
    if (hash !== expectedHash) return null;

    // Verify user exists
    if (!getDevUserById(userId)) return null;

    return userId;
  } catch {
    return null;
  }
}

/**
 * Get all dev users (for testing/debugging)
 * ⚠️ DEVELOPMENT ONLY
 */
export function getAllDevUsers(): DevUser[] {
  return DEV_USERS.map((u) => ({
    ...u,
    password: "***", // Don't expose passwords
  }));
}
