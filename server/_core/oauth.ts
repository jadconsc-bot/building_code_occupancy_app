import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME, SESSION_DURATION_MS } from "@shared/const";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log("\n[OAuth] ===== CALLBACK RECEIVED =====");
    console.log("[OAuth] Full URL:", req.originalUrl);
    console.log("[OAuth] Query params:", req.query);
    
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    console.log("[OAuth] Code present:", !!code);
    console.log("[OAuth] State present:", !!state);
    console.log("[OAuth] Code value:", code ? code.substring(0, 20) + "..." : "MISSING");
    console.log("[OAuth] State value:", state ? state.substring(0, 20) + "..." : "MISSING");

    if (!code || !state) {
      console.error("[OAuth] FAILED: Missing code or state");
      return res.status(400).json({ 
        error: "code and state are required",
        received: { code: !!code, state: !!state }
      });
    }

    try {
      console.log("[OAuth] Attempting code exchange...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token exchange successful");
      console.log("[OAuth] Token response keys:", Object.keys(tokenResponse));
      
      console.log("[OAuth] Getting user info...");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info retrieved");
      console.log("[OAuth] User info:", {
        openId: userInfo.openId,
        name: userInfo.name,
        email: userInfo.email,
        loginMethod: userInfo.loginMethod
      });

      if (!userInfo.openId) {
        console.error("[OAuth] FAILED: Missing openId in user info");
        return res.status(400).json({ error: "openId missing from user info" });
      }

      console.log("[OAuth] Upserting user to database...");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });
      console.log("[OAuth] User upserted");

      console.log("[OAuth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: SESSION_DURATION_MS,
      });
      console.log("[OAuth] Session token created");
      console.log("[OAuth] Token length:", sessionToken.length);

      console.log("[OAuth] Setting session cookie...");
      const cookieOptions = getSessionCookieOptions(req);
      console.log("[OAuth] Cookie options:", {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: SESSION_DURATION_MS
      });
      
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        maxAge: SESSION_DURATION_MS 
      });
      console.log("[OAuth] Cookie set with name:", COOKIE_NAME);
      console.log("[OAuth] Response headers:", res.getHeaders());

      console.log("[OAuth] SUCCESS! Redirecting to /\n");
      res.redirect(302, "/");
    } catch (error) {
      console.error("\n[OAuth] CALLBACK FAILED");
      console.error("[OAuth] Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("[OAuth] Error message:", error instanceof Error ? error.message : String(error));
      console.error("[OAuth] Full error:", error);
      
      if (error instanceof Error && error.stack) {
        console.error("[OAuth] Stack trace:", error.stack);
      }
      
      res.status(500).json({ 
        error: "OAuth callback failed", 
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });
}
