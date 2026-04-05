import { describe, it, expect } from 'vitest';

/**
 * TS-02: Clerk Credentials Validation
 * Validates that Clerk secret key is correctly configured
 */
describe('Clerk Credentials Validation', () => {
  it('CLERK-001: CLERK_SECRET_KEY is set', () => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    expect(clerkSecretKey).toBeDefined();
    expect(clerkSecretKey).toMatch(/^sk_test_/);
  });

  it('CLERK-002: VITE_CLERK_PUBLISHABLE_KEY is set', () => {
    const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
    expect(publishableKey).toBeDefined();
    expect(publishableKey).toMatch(/^pk_test_/);
  });

  it('CLERK-003: ANTHROPIC_API_KEY is set', () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^sk-ant-api/);
  });

  it('CLERK-004: DATABASE_URL is set for Railway', () => {
    const dbUrl = process.env.DATABASE_URL;
    expect(dbUrl).toBeDefined();
    expect(dbUrl).toMatch(/^mysql:\/\//);
    expect(dbUrl).toContain('junction.proxy.rlwy.net');
  });

  it('CLERK-005: JWT_SECRET is set', () => {
    const jwtSecret = process.env.JWT_SECRET;
    expect(jwtSecret).toBeDefined();
    expect(jwtSecret?.length).toBeGreaterThan(20);
  });
});
