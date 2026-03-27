/**
 * Google OAuth 2 Router for CodeComply
 * 
 * Implements the Authorization Code Flow for secure Google authentication.
 * All sensitive operations (token exchange) happen on the backend.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getSessionCookieOptions } from '../_core/cookies';
import { SignJWT } from 'jose';

const router = Router();

// Environment variables (validated at startup)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !JWT_SECRET) {
  throw new Error('Missing required Google OAuth environment variables');
}

/**
 * Step 1: Redirect user to Google consent screen
 * GET /api/oauth/google/login
 */
router.get('/google/login', (req: Request, res: Response) => {
  try {
    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session for verification
    (req as any).session = (req as any).session || {};
    (req as any).session.oauthState = state;

    // Build Google authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('state', state);

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('OAuth login error:', error);
    res.redirect('/login?error=oauth_init_failed');
  }
});

/**
 * Step 2: Handle OAuth callback from Google
 * GET /api/oauth/google/callback
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    // Check for OAuth errors from Google
    const error = req.query.error as string;
    if (error) {
      console.error('OAuth error from Google:', error);
      return res.redirect(`/login?error=${encodeURIComponent(error)}`);
    }

    // Verify state parameter (CSRF protection)
    const state = req.query.state as string;
    const storedState = (req as any).session?.oauthState;
    
    if (!state || state !== storedState) {
      console.error('State mismatch - possible CSRF attack');
      return res.redirect('/login?error=csrf_validation_failed');
    }

    // Get authorization code
    const code = req.query.code as string;
    if (!code) {
      return res.redirect('/login?error=no_authorization_code');
    }

    // Exchange code for access token
    const tokens = await exchangeCodeForToken(code);

    // Fetch user profile from Google
    const userProfile = await fetchUserProfile(tokens.access_token);

    // Create or update user in database
    const user = await createOrUpdateUser(userProfile);

    // Create JWT session token
    const sessionToken = await createJWT(
      { userId: user.id, email: user.email },
      JWT_SECRET
    );

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie('session', sessionToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Clear OAuth state from session
    delete (req as any).session?.oauthState;

    // Redirect to dashboard
    res.redirect('/');

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/login?error=oauth_callback_failed');
  }
});

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Token exchange error:', error);
    throw new Error('Failed to exchange authorization code for token');
  }
}

/**
 * Fetch user profile from Google
 */
async function fetchUserProfile(accessToken: string) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('User profile fetch error:', error);
    throw new Error('Failed to fetch user profile from Google');
  }
}

/**
 * Create or update user in database
 */
async function createOrUpdateUser(userProfile: any) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Check if user exists by email
    const existingUsers = await db.select().from(users).where(eq(users.email, userProfile.email));

    if (existingUsers.length > 0) {
      // Update existing user
      const user = existingUsers[0];
      await db.update(users)
        .set({ name: userProfile.name })
        .where(eq(users.id, user.id));
      return { id: user.id, email: user.email, name: userProfile.name };
    } else {
      // Create new user
      const result = await db.insert(users).values({
        email: userProfile.email,
        name: userProfile.name,
        openId: `google-${userProfile.id}`,
        loginMethod: 'google',
      });
      
      return { 
        id: (result as any)[0]?.id || 0, 
        email: userProfile.email, 
        name: userProfile.name 
      };
    }
  } catch (error) {
    console.error('User creation/update error:', error);
    throw new Error('Failed to create or update user');
  }
}

/**
 * Create JWT token
 */
async function createJWT(payload: any, secret: string): Promise<string> {
  try {
    const jwt = new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d');
    
    return await jwt.sign(new TextEncoder().encode(secret));
  } catch (error) {
    console.error('JWT creation error:', error);
    throw new Error('Failed to create session token');
  }
}

/**
 * Logout endpoint
 * POST /api/oauth/logout
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('session');
  (req as any).session?.destroy((err: any) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/login');
  });
});

export default router;
