/**
 * Dev Auth Mode Verification Test
 * 
 * Tests that dev auth mode is properly configured and working
 * This test validates that the DEV_AUTH_MODE environment variable
 * is set and that dev users can be authenticated
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getDevUser, getDevUserById, generateDevSessionToken, verifyDevSessionToken } from '../_core/devAuth';
import { ENV } from '../_core/env';

describe('Dev Auth Mode Configuration', () => {
  it('should have DEV_AUTH_MODE enabled', () => {
    expect(ENV.devAuthMode).toBe(true);
  });

  it('should find dev user by password', () => {
    const user = getDevUser('De3251ab');
    expect(user).toBeDefined();
    expect(user?.email).toBe('jadconsc@gmail.com');
    expect(user?.name).toBe('Senior Developer');
  });

  it('should find dev user by ID', () => {
    const user = getDevUserById(1);
    expect(user).toBeDefined();
    expect(user?.email).toBe('jadconsc@gmail.com');
    expect(user?.password).toBe('De3251ab');
  });

  it('should generate valid dev session token', () => {
    const token = generateDevSessionToken(1);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split(':').length).toBe(3); // userId:timestamp:hash
  });

  it('should verify valid dev session token', () => {
    const token = generateDevSessionToken(1);
    const isValid = verifyDevSessionToken(token);
    expect(isValid).toBe(true);
  });

  it('should reject invalid dev session token', () => {
    const isValid = verifyDevSessionToken('invalid:token:hash');
    expect(isValid).toBe(false);
  });

  it('should have correct dev user credentials', () => {
    const user = getDevUser('De3251ab');
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
    expect(user?.email).toBe('jadconsc@gmail.com');
    expect(user?.name).toBe('Senior Developer');
  });

  it('should return null for non-existent password', () => {
    const user = getDevUser('wrongpassword');
    expect(user).toBeNull();
  });

  it('should return null for non-existent user ID', () => {
    const user = getDevUserById(999);
    expect(user).toBeNull();
  });
});

describe('Dev Auth Integration', () => {
  it('should allow login with dev credentials', () => {
    const user = getDevUser('De3251ab');
    expect(user).toBeDefined();
    expect(user?.email).toBe('jadconsc@gmail.com');
  });

  it('should create session token for authenticated user', () => {
    const user = getDevUser('De3251ab');
    if (user) {
      const token = generateDevSessionToken(user.id);
      expect(token).toBeDefined();
      expect(verifyDevSessionToken(token)).toBe(true);
    }
  });

  it('should maintain user data through session', () => {
    const user = getDevUserById(1);
    expect(user?.email).toBe('jadconsc@gmail.com');
    expect(user?.name).toBe('Senior Developer');
    
    const token = generateDevSessionToken(user!.id);
    const isValid = verifyDevSessionToken(token);
    expect(isValid).toBe(true);
  });
});
