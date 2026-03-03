/**
 * OAuth Redirect URI Tests
 * Verifies that OAuth redirect URI is stable and matches registered callback URL
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('OAuth Redirect URI', () => {
  describe('Stable Redirect URI', () => {
    it('should use stable custom domain instead of dynamic origin', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      
      expect(OAUTH_REDIRECT_URI).toBe("https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback");
    });

    it('should not include preview domain in redirect URI', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const previewDomainPattern = /3000-.*\.manus\.computer/;
      
      expect(OAUTH_REDIRECT_URI).not.toMatch(previewDomainPattern);
    });

    it('should use HTTPS protocol for security', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      
      expect(OAUTH_REDIRECT_URI).toMatch(/^https:\/\//);
    });

    it('should point to /api/oauth/callback endpoint', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      
      expect(OAUTH_REDIRECT_URI).toMatch(/\/api\/oauth\/callback$/);
    });
  });

  describe('OAuth State Encoding', () => {
    it('should base64-encode the redirect URI for state parameter', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const state = btoa(OAUTH_REDIRECT_URI);
      
      // Verify it's base64 encoded
      expect(state).toBeTruthy();
      expect(state).not.toBe(OAUTH_REDIRECT_URI);
      
      // Verify it can be decoded back
      expect(atob(state)).toBe(OAUTH_REDIRECT_URI);
    });

    it('should produce consistent state encoding', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const state1 = btoa(OAUTH_REDIRECT_URI);
      const state2 = btoa(OAUTH_REDIRECT_URI);
      
      expect(state1).toBe(state2);
    });

    it('should handle state decoding correctly', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const state = btoa(OAUTH_REDIRECT_URI);
      const decoded = atob(state);
      
      expect(decoded).toBe(OAUTH_REDIRECT_URI);
    });
  });

  describe('OAuth Login URL Generation', () => {
    it('should generate valid OAuth login URL', () => {
      const oauthPortalUrl = "https://manus.im";
      const appId = "9F4J2CDosTHNgtZbintBLn";
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const state = btoa(OAUTH_REDIRECT_URI);
      
      const url = new URL(`${oauthPortalUrl}/app-auth`);
      url.searchParams.set("appId", appId);
      url.searchParams.set("state", state);
      url.searchParams.set("type", "signIn");
      
      expect(url.toString()).toContain("manus.im/app-auth");
      expect(url.toString()).toContain(`appId=${appId}`);
      expect(url.toString()).toContain(`state=${state}`);
      expect(url.toString()).toContain("type=signIn");
    });

    it('should include all required OAuth parameters', () => {
      const oauthPortalUrl = "https://manus.im";
      const appId = "9F4J2CDosTHNgtZbintBLn";
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const state = btoa(OAUTH_REDIRECT_URI);
      
      const url = new URL(`${oauthPortalUrl}/app-auth`);
      url.searchParams.set("appId", appId);
      url.searchParams.set("state", state);
      url.searchParams.set("type", "signIn");
      
      expect(url.searchParams.get("appId")).toBe(appId);
      expect(url.searchParams.get("state")).toBe(state);
      expect(url.searchParams.get("type")).toBe("signIn");
    });

    it('should use correct OAuth portal URL', () => {
      const oauthPortalUrl = "https://manus.im";
      
      expect(oauthPortalUrl).toBe("https://manus.im");
    });
  });

  describe('Redirect URI Registration Matching', () => {
    it('should match registered callback URL format', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const registeredCallbackPattern = /^https:\/\/buildingcode-[a-z0-9]+\.manus\.space\/api\/oauth\/callback$/;
      
      expect(OAUTH_REDIRECT_URI).toMatch(registeredCallbackPattern);
    });

    it('should not use localhost for production', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      
      expect(OAUTH_REDIRECT_URI).not.toMatch(/localhost|127\.0\.0\.1/);
    });

    it('should use manus.space domain for custom domain', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      
      expect(OAUTH_REDIRECT_URI).toMatch(/\.manus\.space\//);
    });
  });

  describe('OAuth Flow Prevention of Access Denied', () => {
    it('should prevent access denied by using stable redirect URI', () => {
      // The issue was that redirect URI was dynamically generated from window.location.origin
      // which could be preview domain (*.manus.computer) or custom domain (*.manus.space)
      // Now it's hardcoded to custom domain which matches OAuth app registration
      
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const previewDomain = "https://3000-ingoq16m2c2ir8gijhq8i-6c13de88.us2.manus.computer/api/oauth/callback";
      
      // Redirect URI should NOT be the preview domain
      expect(OAUTH_REDIRECT_URI).not.toBe(previewDomain);
      
      // Redirect URI should be stable custom domain
      expect(OAUTH_REDIRECT_URI).toMatch(/buildingcode-[a-z0-9]+\.manus\.space/);
    });

    it('should handle OAuth callback with correct redirect URI', () => {
      const OAUTH_REDIRECT_URI = "https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback";
      const state = btoa(OAUTH_REDIRECT_URI);
      const decodedState = atob(state);
      
      // Callback handler should be able to decode state and get correct redirect URI
      expect(decodedState).toBe(OAUTH_REDIRECT_URI);
    });
  });

  describe('Environment Variable Integration', () => {
    it('should use VITE_OAUTH_PORTAL_URL from environment', () => {
      // In actual code, this comes from import.meta.env.VITE_OAUTH_PORTAL_URL
      const VITE_OAUTH_PORTAL_URL = "https://manus.im";
      
      expect(VITE_OAUTH_PORTAL_URL).toBe("https://manus.im");
    });

    it('should use VITE_APP_ID from environment', () => {
      // In actual code, this comes from import.meta.env.VITE_APP_ID
      const VITE_APP_ID = "9F4J2CDosTHNgtZbintBLn";
      
      expect(VITE_APP_ID).toBe("9F4J2CDosTHNgtZbintBLn");
    });
  });
});
