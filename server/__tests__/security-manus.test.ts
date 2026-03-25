import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isDevAuthModeAllowed,
  detectEnvironment,
  validateSecuritySettings,
} from '../_core/securityValidator';

describe('Security: Manus-Integrated DEV_AUTH_MODE', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MANUS_API_KEY;
    delete process.env.MANUS_ENVIRONMENT;
    delete process.env.DEV_AUTH_MODE;
    delete process.env.NODE_ENV;
    delete process.env.OAUTH_SERVER_URL;
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ─── Environment Detection ────────────────────────────────────────────────

  describe('detectEnvironment()', () => {
    it('returns "local" when no Manus markers and NODE_ENV=development', () => {
      process.env.NODE_ENV = 'development';
      expect(detectEnvironment()).toBe('local');
    });

    it('returns "local" when no env vars set at all', () => {
      expect(detectEnvironment()).toBe('local');
    });

    it('returns "production" when NODE_ENV=production', () => {
      process.env.NODE_ENV = 'production';
      expect(detectEnvironment()).toBe('production');
    });

    it('returns "production" when MANUS_ENVIRONMENT=production', () => {
      process.env.MANUS_ENVIRONMENT = 'production';
      expect(detectEnvironment()).toBe('production');
    });

    it('MANUS_ENVIRONMENT=production overrides NODE_ENV=development', () => {
      process.env.NODE_ENV = 'development';
      process.env.MANUS_ENVIRONMENT = 'production';
      expect(detectEnvironment()).toBe('production');
    });

    it('returns "manus_sandbox" when MANUS_ENVIRONMENT=sandbox', () => {
      process.env.MANUS_ENVIRONMENT = 'sandbox';
      process.env.MANUS_API_KEY = 'sandbox-key';
      expect(detectEnvironment()).toBe('manus_sandbox');
    });

    it('returns "manus_sandbox" when MANUS_API_KEY is set outside dev', () => {
      process.env.MANUS_API_KEY = 'some-key';
      process.env.NODE_ENV = 'test';
      expect(detectEnvironment()).toBe('manus_sandbox');
    });
  });

  // ─── Local Development ────────────────────────────────────────────────────

  describe('Local Development Environment', () => {
    it('allows DEV_AUTH_MODE when NODE_ENV=development and no Manus markers', () => {
      process.env.NODE_ENV = 'development';
      process.env.DEV_AUTH_MODE = 'true';
      expect(isDevAuthModeAllowed()).toBe(true);
    });

    it('rejects DEV_AUTH_MODE when Manus API key is present', () => {
      process.env.NODE_ENV = 'development';
      process.env.DEV_AUTH_MODE = 'true';
      process.env.MANUS_API_KEY = 'some-key';
      // Manus key present → treated as manus_sandbox → blocked
      expect(isDevAuthModeAllowed()).toBe(false);
    });

    it('returns false when DEV_AUTH_MODE is not set', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevAuthModeAllowed()).toBe(false);
    });
  });

  // ─── Manus Sandbox ───────────────────────────────────────────────────────

  describe('Manus Sandbox Environment', () => {
    it('blocks DEV_AUTH_MODE in Manus Sandbox', () => {
      process.env.MANUS_ENVIRONMENT = 'sandbox';
      process.env.MANUS_API_KEY = 'sandbox-key';
      process.env.DEV_AUTH_MODE = 'true';
      expect(isDevAuthModeAllowed()).toBe(false);
    });

    it('passes validation with Manus OAuth configured in sandbox', async () => {
      process.env.MANUS_ENVIRONMENT = 'sandbox';
      process.env.MANUS_API_KEY = 'sandbox-key';
      process.env.OAUTH_SERVER_URL = 'https://oauth.manus.im';
      process.env.DATABASE_URL = 'mysql://user:pass@localhost/db';

      const result = await validateSecuritySettings();
      expect(result.passed).toBe(true);
      expect(result.environment).toBe('manus_sandbox');
    });

    it('fails validation when MANUS_API_KEY is missing in sandbox', async () => {
      process.env.MANUS_ENVIRONMENT = 'sandbox';
      delete process.env.MANUS_API_KEY;
      process.env.DATABASE_URL = 'mysql://user:pass@localhost/db';

      const result = await validateSecuritySettings();
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('MANUS_API_KEY'))).toBe(true);
    });
  });

  // ─── Production ───────────────────────────────────────────────────────────

  describe('Production Environment (Manus-Protected)', () => {
    it('blocks DEV_AUTH_MODE in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.MANUS_ENVIRONMENT = 'production';
      process.env.DEV_AUTH_MODE = 'true';
      expect(isDevAuthModeAllowed()).toBe(false);
    });

    it('fails validation when DEV_AUTH_MODE is set in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MANUS_ENVIRONMENT = 'production';
      process.env.DEV_AUTH_MODE = 'true';
      process.env.JWT_SECRET = 'secret-key-32-chars-minimum-here';
      process.env.DATABASE_URL = 'mysql://user:pass@prod-db/db';
      process.env.MANUS_API_KEY = 'production-manus-key';

      const result = await validateSecuritySettings();
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('DEV_AUTH_MODE'))).toBe(true);
    });

    it('passes validation with Manus OAuth only — no DEV_AUTH_MODE', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MANUS_ENVIRONMENT = 'production';
      delete process.env.DEV_AUTH_MODE;
      process.env.JWT_SECRET = 'secret-key-32-chars-minimum-here';
      process.env.DATABASE_URL = 'mysql://user:pass@prod-db/db';
      process.env.MANUS_API_KEY = 'production-manus-key';

      const result = await validateSecuritySettings();
      expect(result.passed).toBe(true);
      expect(result.environment).toBe('production');
    });

    it('fails validation when JWT_SECRET is missing in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.MANUS_ENVIRONMENT = 'production';
      delete process.env.JWT_SECRET;
      process.env.DATABASE_URL = 'mysql://user:pass@prod-db/db';
      process.env.MANUS_API_KEY = 'production-manus-key';

      const result = await validateSecuritySettings();
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('JWT_SECRET'))).toBe(true);
    });
  });
});
