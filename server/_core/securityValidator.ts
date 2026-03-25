/**
 * Security configuration validator
 * Runs at server startup to catch dangerous misconfigurations
 */

import { ENV } from './env';

/**
 * Validates security-critical settings.
 * Throws immediately if a production environment has unsafe settings enabled.
 */
export function validateSecurityConfig(): void {
  if (ENV.isProduction && ENV.devAuthMode) {
    throw new Error(
      '[SECURITY VIOLATION] DEV_AUTH_MODE is enabled in a production environment. ' +
      'This bypasses all OAuth authentication and exposes every account to unauthorized access. ' +
      'Remove DEV_AUTH_MODE or set it to "false" in your production environment variables before starting the server.'
    );
  }
}
