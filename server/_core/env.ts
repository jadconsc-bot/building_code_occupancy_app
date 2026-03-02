import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  OAUTH_SERVER_URL: z.string().url('OAUTH_SERVER_URL must be a valid URL'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  DATABASE_URL: z.string().refine(
    (url) => url.startsWith('mysql://') || url.startsWith('postgres://'),
    'DATABASE_URL must be a valid MySQL or PostgreSQL connection string'
  ),
  OWNER_OPEN_ID: z.string().optional(),
  OWNER_NAME: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BUILT_IN_FORGE_API_URL: z.string().url().optional(),
  BUILT_IN_FORGE_API_KEY: z.string().optional(),
  VITE_APP_ID: z.string().optional(),
  VITE_OAUTH_PORTAL_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      
      throw new Error(
        `Environment variable validation failed:\n${issues}\n\n` +
        'Required variables: OAUTH_SERVER_URL, JWT_SECRET, DATABASE_URL'
      );
    }
    throw error;
  }
}

// Validate on module load
const validatedEnv = validateEnv();

export const ENV = {
  appId: validatedEnv.VITE_APP_ID ?? "",
  cookieSecret: validatedEnv.JWT_SECRET,
  databaseUrl: validatedEnv.DATABASE_URL,
  oAuthServerUrl: validatedEnv.OAUTH_SERVER_URL,
  ownerOpenId: validatedEnv.OWNER_OPEN_ID ?? "",
  isProduction: validatedEnv.NODE_ENV === "production",
  forgeApiUrl: validatedEnv.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: validatedEnv.BUILT_IN_FORGE_API_KEY ?? "",
};

/**
 * Log environment status (safe - doesn't log secrets)
 */
export function logEnvStatus(): void {
  console.log('[Env] Environment validation passed');
  console.log(`[Env] NODE_ENV: ${validatedEnv.NODE_ENV}`);
  console.log(`[Env] OAuth Server: ${validatedEnv.OAUTH_SERVER_URL}`);
  console.log(`[Env] Database: ${validatedEnv.DATABASE_URL.substring(0, 20)}...`);
  if (validatedEnv.OWNER_OPEN_ID) {
    console.log(`[Env] Owner: ${validatedEnv.OWNER_NAME || validatedEnv.OWNER_OPEN_ID}`);
  }
}
