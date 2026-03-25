/**
 * Security validator — Manus-integrated
 *
 * Handles three deployment environments:
 *   local       — developer machine, no Manus markers
 *   manus_sandbox — Manus sandbox (MANUS_ENVIRONMENT=sandbox or MANUS_API_KEY present)
 *   production  — live deployment (MANUS_ENVIRONMENT=production or NODE_ENV=production)
 *
 * DEV_AUTH_MODE rules:
 *   local       → allowed (enables passwordless local testing)
 *   manus_sandbox → blocked (Manus OAuth must be used)
 *   production  → blocked (hard security violation)
 */

import { logger } from '../logger';

export interface SecurityCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  environment: 'local' | 'manus_sandbox' | 'production';
}

/**
 * Detect current runtime environment based on Manus environment markers.
 * Exported so tests can assert detection logic directly.
 */
export function detectEnvironment(): 'local' | 'manus_sandbox' | 'production' {
  // Explicit Manus production marker takes highest priority
  if (process.env.MANUS_ENVIRONMENT === 'production') {
    return 'production';
  }

  // NODE_ENV=production also means production
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  // Manus sandbox: explicit marker OR Manus API key present (any environment)
  // If MANUS_API_KEY is set, Manus OAuth must be used — DEV_AUTH_MODE is not allowed
  if (process.env.MANUS_ENVIRONMENT === 'sandbox' || process.env.MANUS_API_KEY) {
    return 'manus_sandbox';
  }

  return 'local';
}

/**
 * Returns true only when DEV_AUTH_MODE is safe to use.
 * Safe only on a local developer machine with no Manus markers.
 */
export function isDevAuthModeAllowed(): boolean {
  const env = detectEnvironment();

  if (env === 'production') {
    logger.error('🚨 [Security] DEV_AUTH_MODE attempted in PRODUCTION — blocking');
    return false;
  }

  if (env === 'manus_sandbox') {
    if (process.env.DEV_AUTH_MODE === 'true') {
      logger.warn(
        '⚠️  [Security] DEV_AUTH_MODE is set in Manus Sandbox — use Manus OAuth instead. Blocking.'
      );
    }
    return false;
  }

  // local
  return process.env.DEV_AUTH_MODE === 'true';
}

/**
 * Comprehensive async validation with per-environment checks.
 * Use in tests or health-check endpoints to get a full picture.
 */
export async function validateSecuritySettings(): Promise<SecurityCheckResult> {
  const env = detectEnvironment();
  const errors: string[] = [];
  const warnings: string[] = [];

  logger.info(`🔐 [Security] Validating for environment: ${env}`);

  if (env === 'production') {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET not configured in production');
    }
    if (process.env.DEV_AUTH_MODE === 'true') {
      errors.push('CRITICAL: DEV_AUTH_MODE enabled in production');
    }
    if (!process.env.MANUS_API_KEY && !process.env.OAUTH_SERVER_URL) {
      warnings.push('Manus OAuth not fully configured — verify MANUS_API_KEY or OAUTH_SERVER_URL');
    }
  } else if (env === 'manus_sandbox') {
    if (!process.env.MANUS_API_KEY) {
      errors.push('MANUS_API_KEY not set in sandbox environment');
    }
    if (process.env.DEV_AUTH_MODE === 'true') {
      warnings.push(
        'DEV_AUTH_MODE is set in Manus Sandbox — recommend using Manus OAuth for testing'
      );
    }
    if (!process.env.OAUTH_SERVER_URL) {
      logger.info('[Security] OAUTH_SERVER_URL not set — expecting Manus auto-injection');
    }
  } else {
    // local
    if (process.env.DEV_AUTH_MODE === 'true') {
      logger.info('✅ [Security] DEV_AUTH_MODE enabled for local testing');
    } else if (!process.env.OAUTH_SERVER_URL) {
      warnings.push(
        'No OAuth configured locally — set DEV_AUTH_MODE=true or OAUTH_SERVER_URL for local testing'
      );
    }
  }

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL not configured');
  }

  const passed = errors.length === 0;

  if (passed) {
    logger.info(`✅ [Security] All checks passed for ${env} environment`);
  } else {
    logger.error(`🚨 [Security] ${errors.length} error(s) found`, { errors });
  }

  if (warnings.length > 0) {
    logger.warn(`⚠️  [Security] ${warnings.length} warning(s)`, { warnings });
  }

  return { passed, errors, warnings, environment: env };
}

/**
 * Throws if security validation fails.
 * Called from server startup for a hard boot-time gate.
 */
export async function requireSecurityValidation(): Promise<void> {
  const result = await validateSecuritySettings();
  if (!result.passed) {
    throw new Error(`SECURITY VALIDATION FAILED:\n${result.errors.join('\n')}`);
  }
}

/**
 * Synchronous startup guard — called by server/index.ts before the event loop starts.
 * For the Manus-aware production check we can read process.env synchronously.
 */
export function validateSecurityConfig(): void {
  const env = detectEnvironment();

  if (env === 'production' && process.env.DEV_AUTH_MODE === 'true') {
    throw new Error(
      '[SECURITY VIOLATION] DEV_AUTH_MODE cannot be enabled in production. ' +
        'This bypasses all OAuth authentication. ' +
        'Remove DEV_AUTH_MODE from your production environment variables.'
    );
  }

  if (env === 'manus_sandbox' && process.env.DEV_AUTH_MODE === 'true') {
    logger.warn(
      '⚠️  [Security] DEV_AUTH_MODE is set in Manus Sandbox — ignoring. Use Manus OAuth.'
    );
  }
}

/**
 * Returns environment metadata suitable for logging (no secrets).
 */
export function getEnvironmentInfo() {
  const env = detectEnvironment();
  return {
    environment: env,
    isProduction: env === 'production',
    isManusSandbox: env === 'manus_sandbox',
    isLocal: env === 'local',
    devAuthEnabled: process.env.DEV_AUTH_MODE === 'true',
    oauthConfigured: !!process.env.OAUTH_SERVER_URL,
    manusConfigured: !!process.env.MANUS_API_KEY,
  };
}
