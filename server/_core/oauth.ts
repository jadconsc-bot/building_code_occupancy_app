import type { Express, Request, Response } from "express";
import crypto from "crypto";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, SESSION_DURATION_MS } from "@shared/const";
import { SignJWT } from "jose";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !JWT_SECRET) {
  console.warn("[OAuth] WARNING: Google OAuth credentials not fully configured");
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Create a JWT session token
 */
async function createSessionToken(openId: string, name: string): Promise<string> {
  try {
    const jwt = new SignJWT({
      openId,
      name,
      iat: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d");

    return await jwt.sign(new TextEncoder().encode(JWT_SECRET!));
  } catch (error) {
    console.error("[OAuth] Failed to create session token:", error);
    throw new Error("Failed to create session token");
  }
}

/**
 * Exchange Google authorization code for access token
 */
async function exchangeCodeForToken(code: string): Promise<any> {
  try {
    console.log("[OAuth] Exchanging Google authorization code for token...");

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[OAuth] Token exchange failed:", error);
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    const tokens = await response.json();
    console.log("[OAuth] Token exchange successful");
    return tokens;
  } catch (error) {
    console.error("[OAuth] Token exchange error:", error);
    throw error;
  }
}

/**
 * Fetch user profile from Google
 */
async function fetchUserProfile(accessToken: string): Promise<any> {
  try {
    console.log("[OAuth] Fetching user profile from Google...");

    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const profile = await response.json();
    console.log("[OAuth] User profile fetched successfully");
    return profile;
  } catch (error) {
    console.error("[OAuth] User profile fetch error:", error);
    throw error;
  }
}

/**
 * Create or update user in database
 */
async function createOrUpdateUser(userProfile: any): Promise<any> {
  try {
    console.log("[OAuth] Creating or updating user...");

    const dbInstance = await db.getDb();
    if (!dbInstance) {
      throw new Error("Database not available");
    }

    // Check if user exists by email
    const existingUsers = await dbInstance
      .select()
      .from(users)
      .where(eq(users.email, userProfile.email));

    let user;

    if (existingUsers.length > 0) {
      // Update existing user
      console.log("[OAuth] User exists, updating...");
      user = existingUsers[0];
      await dbInstance
        .update(users)
        .set({
          name: userProfile.name || user.name,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, user.id));
    } else {
      // Create new user
      console.log("[OAuth] Creating new user...");
      const openId = `google-${userProfile.id}`;
      const result = await dbInstance.insert(users).values({
        email: userProfile.email,
        name: userProfile.name || null,
        openId,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Fetch the created user
      const createdUsers = await dbInstance
        .select()
        .from(users)
        .where(eq(users.email, userProfile.email));

      user = createdUsers[0];
    }

    console.log("[OAuth] User created/updated successfully");
    return user;
  } catch (error) {
    console.error("[OAuth] User creation/update error:", error);
    throw error;
  }
}

export function registerOAuthRoutes(app: Express) {
  /**
   * Step 1: Redirect to Google login
   * GET /api/oauth/login
   */
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    try {
      console.log("[OAuth] Login initiated");

      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString("hex");

      // Store state in session
      (req as any).session = (req as any).session || {};
      (req as any).session.oauthState = state;

      // Build Google authorization URL
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID!);
      authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI!);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid profile email");
      authUrl.searchParams.set("state", state);

      console.log("[OAuth] Redirecting to Google consent screen");
      res.redirect(authUrl.toString());
    } catch (error) {
      console.error("[OAuth] Login error:", error);
      res.redirect("/login?error=oauth_init_failed");
    }
  });

  /**
   * Step 2: Handle OAuth callback from Google
   * GET /api/oauth/callback
   */
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log("\n[OAuth] ===== CALLBACK RECEIVED =====");
    console.log("[OAuth] Full URL:", req.originalUrl);

    try {
      // Check for OAuth errors from Google
      const error = getQueryParam(req, "error");
      if (error) {
        console.error("[OAuth] OAuth error from Google:", error);
        return res.redirect(`/login?error=${encodeURIComponent(error)}`);
      }

      // Get authorization code and state
      const code = getQueryParam(req, "code");
      const state = getQueryParam(req, "state");

      console.log("[OAuth] Code present:", !!code);
      console.log("[OAuth] State present:", !!state);

      if (!code || !state) {
        console.error("[OAuth] FAILED: Missing code or state");
        return res.redirect("/login?error=missing_code_or_state");
      }

      // Verify state parameter (CSRF protection)
      const storedState = (req as any).session?.oauthState;
      if (state !== storedState) {
        console.error("[OAuth] State mismatch - possible CSRF attack");
        return res.redirect("/login?error=csrf_validation_failed");
      }

      // Exchange code for access token
      console.log("[OAuth] Attempting code exchange...");
      const tokens = await exchangeCodeForToken(code);

      // Fetch user profile from Google
      console.log("[OAuth] Fetching user profile...");
      const userProfile = await fetchUserProfile(tokens.access_token);

      // Create or update user in database
      console.log("[OAuth] Creating/updating user in database...");
      const user = await createOrUpdateUser(userProfile);

      // Create session token
      console.log("[OAuth] Creating session token...");
      const sessionToken = await createSessionToken(user.openId, user.name || "User");

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: SESSION_DURATION_MS,
      });

      console.log("[OAuth] Cookie set successfully");

      // Clear OAuth state from session
      delete (req as any).session?.oauthState;

      console.log("[OAuth] SUCCESS! Redirecting to /\n");
      res.redirect(302, "/");
    } catch (error) {
      console.error("\n[OAuth] CALLBACK FAILED");
      console.error("[OAuth] Error:", error instanceof Error ? error.message : String(error));

      if (error instanceof Error && error.stack) {
        console.error("[OAuth] Stack trace:", error.stack);
      }

      res.redirect("/login?error=oauth_callback_failed");
    }
  });

  /**
   * Logout endpoint
   * POST /api/oauth/logout
   */
  app.post("/api/oauth/logout", (req: Request, res: Response) => {
    try {
      console.log("[OAuth] Logout initiated");
      res.clearCookie(COOKIE_NAME);
      (req as any).session?.destroy((err: any) => {
        if (err) {
          console.error("[OAuth] Session destruction error:", err);
        }
      });
      res.redirect("/login");
    } catch (error) {
      console.error("[OAuth] Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });
}
