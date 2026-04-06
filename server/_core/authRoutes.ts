import type { Express, Request, Response } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import * as db from '../db';
import { sdk } from './sdk';
import { COOKIE_NAME, SESSION_DURATION_MS } from '@shared/const';
import { getSessionCookieOptions } from './cookies';
import { ENV } from './env';

const clerkClient = createClerkClient({ secretKey: ENV.clerkSecretKey });

/**
 * AUTH-MIGRATE-001 Section 6.3: Register Clerk auth routes
 * Replaces /api/oauth/callback with /api/auth/session
 * Verifies Clerk token and issues CodeComply JWT cookie
 */
export function registerAuthRoutes(app: Express) {
  app.post('/api/auth/session', async (req: Request, res: Response) => {
    const { clerkToken } = req.body;
    
    if (!clerkToken) {
      return res.status(400).json({ error: 'clerkToken required' });
    }

    try {
      // Verify Clerk token using the verifyToken function from @clerk/backend
      const payload = await verifyToken(clerkToken, {
        secretKey: ENV.clerkSecretKey,
      });
      const userId = payload.sub;

      if (!userId) {
        return res.status(401).json({ error: 'Invalid Clerk token: no user ID' });
      }

      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
      const name = [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(' ');
      const loginMethod = clerkUser.externalAccounts[0]?.provider ?? 'email';

      // Upsert user in database
      await db.upsertUser({
        openId: userId,
        name: name || null,
        email,
        loginMethod,
        lastSignedIn: new Date(),
      });

      // Create CodeComply JWT session token
      const sessionToken = await sdk.createSessionToken(userId, {
        name,
        email: email ?? undefined,
        loginMethod,
        expiresInMs: SESSION_DURATION_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: SESSION_DURATION_MS,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('[Auth] Session creation failed:', error);
      res.status(401).json({ error: 'Invalid Clerk token' });
    }
  });
}
