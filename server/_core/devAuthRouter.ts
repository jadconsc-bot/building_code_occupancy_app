/**
 * Development Auth Router
 * 
 * ⚠️ DEVELOPMENT ONLY - REMOVE FOR PRODUCTION
 * 
 * Express router for development authentication endpoints
 * Provides /api/dev-auth/login endpoint for testing
 */

import express, { Router, Request, Response } from 'express';
import { getDevUser, generateDevSessionToken } from './devAuth';
import { ENV } from './env';

const router = Router();

/**
 * POST /api/dev-auth/login
 * 
 * Development login endpoint
 * Accepts email and password, returns session token
 * 
 * ⚠️ DEVELOPMENT ONLY - Not for production use
 */
router.post('/login', (req: Request, res: Response) => {
  // Only allow dev auth if enabled
  if (!ENV.devAuthMode) {
    return res.status(403).json({
      error: 'Dev auth is disabled',
      message: 'Development authentication is not enabled in this environment',
    });
  }

  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Both email and password are required',
    });
  }

  // Find user by password (dev auth uses password as identifier)
  const user = getDevUser(password);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect',
    });
  }

  // Verify email matches
  if (user.email !== email) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect',
    });
  }

  // Generate session token
  const token = generateDevSessionToken(user.id);

  // Return token to client
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * POST /api/dev-auth/logout
 * 
 * Development logout endpoint
 * Clears dev session
 */
router.post('/logout', (req: Request, res: Response) => {
  // Only allow dev auth if enabled
  if (!ENV.devAuthMode) {
    return res.status(403).json({
      error: 'Dev auth is disabled',
      message: 'Development authentication is not enabled in this environment',
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
