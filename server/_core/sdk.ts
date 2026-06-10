import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name?: string;
};

/**
 * AUTH-MIGRATE-001: Removed OAuthService class and Manus OAuth endpoints
 * Clerk handles token exchange via /api/auth/session endpoint in authRoutes.ts
 */

class SDKServer {
  private readonly client: AxiosInstance;

  constructor(client: AxiosInstance = axios.create()) {
    this.client = client;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a Clerk user
   * @example
   * const sessionToken = await sdk.createSessionToken(clerkUserId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId || 'codecomply',
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      // AUTH-LOOP-002: name is cosmetic — identity is openId, tenancy is appId.
      // Requiring a non-empty name permanently blocked users who signed up via
      // email without a display name (name: "" fails isNonEmptyString).
      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId)
      ) {
        console.warn("[Auth] Session payload missing required fields: openId or appId");
        return null;
      }

      return {
        openId,
        appId,
        name: typeof name === 'string' ? name : '',
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * AUTH-MIGRATE-001 Section 6.2: Authenticate request using Clerk session
   * 
   * Verifies session cookie and returns authenticated user.
   * Session cookie is set by /api/auth/session endpoint after Clerk token exchange.
   * 
   * Flow:
   * 1. Parse session cookie from request headers
   * 2. Verify JWT signature and expiration
   * 3. Look up user in database by openId (Clerk user ID)
   * 4. Update last signed in timestamp
   * 5. Return user object
   */
  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    
    // Get user from database
    const user = await db.getUserByOpenId(sessionUserId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    // Update last signed in time - non-critical, don't fail auth if this errors
    try {
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: signedInAt,
      });
    } catch (error) {
      console.warn('[Auth] Failed to update lastSignedIn, continuing:', error);
    }

    return user;
  }
}

export const sdk = new SDKServer();
