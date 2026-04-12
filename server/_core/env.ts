import { z } from 'zod';

/**
 * AUTH-MIGRATE-001: Environment schema for Clerk + Railway
 * Replaces Manus OAuth with Clerk, removes Manus-specific variables
 */
const envSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  DATABASE_URL: z.string().refine(
    (url) => url.startsWith('mysql://') || url.startsWith('postgres://'),
    'DATABASE_URL must be a valid MySQL or PostgreSQL connection string'
  ),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANTHROPIC_API_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Extended ENV object type (includes non-validated vars)
export type ExtendedEnv = Env & {
  forgeApiUrl?: string;
  forgeApiKey?: string;
};

/**
 * Validate environment variables at startup
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      
      throw new Error(
        `Environment variable validation failed:\n${issues}\n\n` +
        'Required variables: CLERK_SECRET_KEY, JWT_SECRET, DATABASE_URL'
      );
    }
    throw error;
  }
}

// Validate on module load
const validatedEnv = validateEnv();

export const ENV = {
  clerkSecretKey: validatedEnv.CLERK_SECRET_KEY,
  cookieSecret: validatedEnv.JWT_SECRET,
  databaseUrl: validatedEnv.DATABASE_URL,
  isProduction: validatedEnv.NODE_ENV === 'production',
  anthropicApiKey: validatedEnv.ANTHROPIC_API_KEY ?? '',
  awsAccessKeyId: validatedEnv.AWS_ACCESS_KEY_ID ?? '',
  awsSecretAccessKey: validatedEnv.AWS_SECRET_ACCESS_KEY ?? '',
  awsS3Bucket: validatedEnv.AWS_S3_BUCKET ?? '',
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? '',
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? '',
  appId: process.env.APP_ID ?? '',
  ownerOpenId: process.env.OWNER_OPEN_ID ?? '',
};

/**
 * Log environment status (safe - doesn't log secrets)
 */
export function logEnvStatus(): void {
  console.log('[Env] Environment validation passed');
  console.log(`[Env] NODE_ENV: ${validatedEnv.NODE_ENV}`);
  console.log(`[Env] Clerk: Configured`);
  console.log(`[Env] Database: ${validatedEnv.DATABASE_URL.substring(0, 20)}...`);
}
