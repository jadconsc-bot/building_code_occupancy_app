import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { getDevUserById } from "./devAuth";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // First try OAuth authentication (production)
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // If OAuth fails, try dev authentication (development only)
    // ⚠️ DEVELOPMENT ONLY - REMOVE FOR PRODUCTION
    if (ENV.devAuthMode) {
      try {
        const cookies = parseCookieHeader(opts.req.headers.cookie || "");
        const devSessionCookie = cookies["dev-session"];
        
        if (devSessionCookie) {
          // Parse dev session token format: userId:timestamp:hash
          const parts = devSessionCookie.split(":");
          if (parts.length === 3) {
            const userId = parseInt(parts[0], 10);
            const devUser = getDevUserById(userId);
            
            if (devUser) {
              // Get or create user in database
              let dbUser = await db.getUserByOpenId(devUser.email);
              
              if (!dbUser) {
                // Create user from dev user
                await db.upsertUser({
                  openId: devUser.email,
                  name: devUser.name,
                  email: devUser.email,
                  loginMethod: "dev",
                  lastSignedIn: new Date(),
                });
                dbUser = await db.getUserByOpenId(devUser.email);
              } else {
                // Update last signed in
                await db.upsertUser({
                  openId: devUser.email,
                  lastSignedIn: new Date(),
                });
              }
              
              user = dbUser || null;
            }
          }
        }
      } catch (devError) {
        // Dev auth failed, user remains null
        user = null;
      }
    } else {
      // Authentication is optional for public procedures in production
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
