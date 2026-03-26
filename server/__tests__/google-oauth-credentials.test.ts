import { describe, it, expect } from 'vitest';

/**
 * Google OAuth Credentials Validation Test
 * 
 * This test validates that Google OAuth credentials are properly configured
 * and can be used to generate a valid authorization URL.
 */

describe('Google OAuth Credentials', () => {
  it('should have GOOGLE_CLIENT_ID environment variable set', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).toBeTruthy();
    expect(typeof clientId).toBe('string');
  });

  it('should have GOOGLE_CLIENT_SECRET environment variable set', () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).toBeTruthy();
    expect(typeof clientSecret).toBe('string');
  });

  it('should have GOOGLE_REDIRECT_URI environment variable set', () => {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    expect(redirectUri).toBeDefined();
    expect(redirectUri).toBeTruthy();
    expect(typeof redirectUri).toBe('string');
  });

  it('should have valid Google Client ID format', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    // Google Client IDs follow the format: {numeric-id}.apps.googleusercontent.com
    expect(clientId).toMatch(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
  });

  it('should have valid Google Client Secret format', () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // Google Client Secrets typically start with GOCSPX-
    expect(clientSecret).toMatch(/^GOCSPX-/);
  });

  it('should have valid redirect URI format', () => {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    // Redirect URI should be a valid URL
    expect(redirectUri).toMatch(/^https?:\/\/.+\/api\/oauth/);
  });

  it('should be able to generate a valid authorization URL', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId!);
    authUrl.searchParams.set('redirect_uri', redirectUri!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');

    const urlString = authUrl.toString();

    expect(urlString).toContain('accounts.google.com');
    expect(urlString).toContain(`client_id=${encodeURIComponent(clientId!)}`);
    expect(urlString).toContain(`redirect_uri=${encodeURIComponent(redirectUri!)}`);
    expect(urlString).toContain('response_type=code');
    expect(urlString).toContain('scope=openid+profile+email');
  });

  it('should have Client ID and Client Secret as different values', () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Client ID and Secret should never be the same
    expect(clientId).not.toEqual(clientSecret);
  });

  it('should have Client Secret that is not empty or placeholder', () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Ensure it's not a placeholder or empty
    expect(clientSecret).not.toEqual('your-client-secret');
    expect(clientSecret).not.toEqual('');
    expect(clientSecret?.length).toBeGreaterThan(10);
  });
});
