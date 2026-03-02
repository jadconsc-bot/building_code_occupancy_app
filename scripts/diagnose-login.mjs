#!/usr/bin/env node

/**
 * Login Configuration Diagnostic Script
 * 
 * This script checks all environment variables and configuration required for OAuth login.
 * Run with: node scripts/diagnose-login.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bold');
  console.log('='.repeat(70));
}

function checkMark(condition) {
  return condition ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
}

// Read .env files
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        env[key] = valueParts.join('=');
      }
    });
    return env;
  } catch (error) {
    return null;
  }
}

// Check if value looks valid
function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidAppId(value) {
  return value && value.length > 0 && !value.includes('?');
}

function isValidSecret(value) {
  return value && value.length >= 8;
}

function isValidDatabaseUrl(value) {
  return value && (value.startsWith('mysql://') || value.startsWith('postgres://'));
}

// Main diagnostic
async function diagnose() {
  log('\n🔍 LOGIN CONFIGURATION DIAGNOSTIC TOOL\n', 'cyan');
  log(`Project Root: ${projectRoot}\n`, 'blue');

  // ===== FRONTEND ENV =====
  section('FRONTEND ENVIRONMENT (.env.local or .env)');

  const frontendEnvPaths = [
    path.join(projectRoot, 'client', '.env.local'),
    path.join(projectRoot, 'client', '.env'),
  ];

  let frontendEnv = null;
  let frontendEnvPath = null;

  for (const envPath of frontendEnvPaths) {
    const env = loadEnvFile(envPath);
    if (env) {
      frontendEnv = env;
      frontendEnvPath = envPath;
      break;
    }
  }

  if (!frontendEnv) {
    log(`${checkMark(false)} No frontend .env file found`, 'red');
    log('   Expected: client/.env.local or client/.env\n', 'yellow');
  } else {
    log(`${checkMark(true)} Found: ${frontendEnvPath}\n`, 'green');
  }

  // Check frontend variables
  const frontendVars = [
    {
      name: 'VITE_OAUTH_PORTAL_URL',
      description: 'OAuth provider portal URL',
      example: 'https://oauth.manus.im',
      validator: isValidUrl,
      required: true,
    },
    {
      name: 'VITE_APP_ID',
      description: 'Application ID from OAuth provider',
      example: 'abc123def456',
      validator: isValidAppId,
      required: true,
    },
  ];

  let frontendValid = true;
  frontendVars.forEach(varConfig => {
    const value = frontendEnv?.[varConfig.name];
    const isValid = value && varConfig.validator(value);
    const status = checkMark(isValid);

    log(`${status} ${varConfig.name}`, isValid ? 'green' : 'red');

    if (!value) {
      log(`   ❌ NOT SET`, 'red');
      log(`   Expected: ${varConfig.example}`, 'yellow');
      frontendValid = false;
    } else if (!isValid) {
      log(`   ❌ INVALID VALUE: "${value}"`, 'red');
      log(`   Expected format: ${varConfig.example}`, 'yellow');
      frontendValid = false;
    } else {
      log(`   ✓ Value: ${value}`, 'green');
    }
    console.log();
  });

  // ===== BACKEND ENV =====
  section('BACKEND ENVIRONMENT (.env)');

  const backendEnvPath = path.join(projectRoot, '.env');
  const backendEnv = loadEnvFile(backendEnvPath);

  if (!backendEnv) {
    log(`${checkMark(false)} No backend .env file found`, 'red');
    log('   Expected: .env in project root\n', 'yellow');
  } else {
    log(`${checkMark(true)} Found: ${backendEnvPath}\n`, 'green');
  }

  // Check backend variables
  const backendVars = [
    {
      name: 'OAUTH_SERVER_URL',
      description: 'OAuth server API URL',
      example: 'https://api.manus.im',
      validator: isValidUrl,
      required: true,
    },
    {
      name: 'JWT_SECRET',
      description: 'Secret key for signing JWTs',
      example: 'your-secret-key-min-8-chars',
      validator: isValidSecret,
      required: true,
    },
    {
      name: 'DATABASE_URL',
      description: 'Database connection string',
      example: 'mysql://user:password@localhost:3306/dbname',
      validator: isValidDatabaseUrl,
      required: true,
    },
    {
      name: 'OWNER_OPEN_ID',
      description: 'Owner OpenID (for admin role)',
      example: 'owner_12345',
      validator: (v) => v && v.length > 0,
      required: false,
    },
    {
      name: 'NODE_ENV',
      description: 'Node environment',
      example: 'development',
      validator: (v) => ['development', 'production'].includes(v),
      required: false,
    },
  ];

  let backendValid = true;
  backendVars.forEach(varConfig => {
    const value = backendEnv?.[varConfig.name];
    const isValid = value && varConfig.validator(value);
    const status = checkMark(isValid);
    const required = varConfig.required ? '(REQUIRED)' : '(optional)';

    log(`${status} ${varConfig.name} ${required}`, isValid ? 'green' : 'red');

    if (!value) {
      log(`   ❌ NOT SET`, 'red');
      log(`   Expected: ${varConfig.example}`, 'yellow');
      if (varConfig.required) backendValid = false;
    } else if (!isValid) {
      log(`   ❌ INVALID VALUE: "${value}"`, 'red');
      log(`   Expected format: ${varConfig.example}`, 'yellow');
      if (varConfig.required) backendValid = false;
    } else {
      // Mask sensitive values
      if (['JWT_SECRET', 'DATABASE_URL'].includes(varConfig.name)) {
        log(`   ✓ Value: ${value.substring(0, 10)}...${value.substring(value.length - 5)}`, 'green');
      } else {
        log(`   ✓ Value: ${value}`, 'green');
      }
    }
    console.log();
  });

  // ===== OAUTH CALLBACK CONFIGURATION =====
  section('OAUTH CALLBACK CONFIGURATION');

  const expectedRedirectUri = 'http://localhost:3000/api/oauth/callback';
  log(`Expected Redirect URI: ${expectedRedirectUri}\n`, 'cyan');
  log('This must be registered in your Manus OAuth app settings.\n', 'yellow');
  log('Steps to verify:\n', 'blue');
  log('1. Go to Manus OAuth app settings', 'blue');
  log('2. Find "Redirect URIs" or "Authorized redirect URIs"', 'blue');
  log('3. Verify this URI is listed:', 'blue');
  log(`   ${expectedRedirectUri}\n`, 'yellow');

  // ===== DATABASE CHECK =====
  section('DATABASE CONNECTIVITY');

  if (backendEnv?.DATABASE_URL) {
    log(`${checkMark(true)} DATABASE_URL is set\n`, 'green');
    
    // Try to parse the connection string
    try {
      const url = new URL(backendEnv.DATABASE_URL.replace(/^mysql:\/\//, 'http://'));
      log(`Database Type: ${backendEnv.DATABASE_URL.startsWith('mysql') ? 'MySQL' : 'PostgreSQL'}`, 'cyan');
      log(`Host: ${url.hostname}`, 'cyan');
      log(`Port: ${url.port || 'default'}`, 'cyan');
      log(`Database: ${url.pathname.replace('/', '')}`, 'cyan');
      log(`Username: ${url.username}`, 'cyan');
      console.log();
      log('Note: Database connectivity will be tested when server starts.\n', 'yellow');
    } catch (error) {
      log('Could not parse DATABASE_URL format', 'yellow');
    }
  } else {
    log(`${checkMark(false)} DATABASE_URL not set\n`, 'red');
  }

  // ===== SUMMARY =====
  section('DIAGNOSTIC SUMMARY');

  const allValid = frontendValid && backendValid;

  if (allValid) {
    log('✓ All required environment variables are configured!\n', 'green');
    log('Next steps:', 'blue');
    log('1. Verify Manus OAuth app settings (redirect URI)', 'blue');
    log('2. Start the development server: pnpm dev', 'blue');
    log('3. Try logging in and check browser Network tab', 'blue');
    log('4. Check server logs for OAuth errors\n', 'blue');
  } else {
    log('✗ Some required environment variables are missing or invalid.\n', 'red');
    log('Please fix the issues above before attempting to log in.\n', 'red');
    
    if (!frontendValid) {
      log('Frontend issues found. Update client/.env.local:', 'yellow');
      log('  VITE_OAUTH_PORTAL_URL=https://oauth.manus.im', 'yellow');
      log('  VITE_APP_ID=your_app_id_here\n', 'yellow');
    }
    
    if (!backendValid) {
      log('Backend issues found. Update .env:', 'yellow');
      log('  OAUTH_SERVER_URL=https://api.manus.im', 'yellow');
      log('  JWT_SECRET=your-secret-key-here', 'yellow');
      log('  DATABASE_URL=mysql://user:pass@localhost:3306/dbname', 'yellow');
      log('  OWNER_OPEN_ID=owner_id_here\n', 'yellow');
    }
  }

  // ===== TROUBLESHOOTING =====
  section('TROUBLESHOOTING');

  log('If login still fails after fixing environment variables:\n', 'cyan');

  log('1. Check Backend Logs:', 'blue');
  log('   Look for [OAuth] messages in server console', 'yellow');
  log('   Example: [OAuth] Callback received, [OAuth] Token exchange successful\n', 'yellow');

  log('2. Check Browser Network Tab:', 'blue');
  log('   When you click login, look for request to:', 'yellow');
  log('   ${VITE_OAUTH_PORTAL_URL}/app-auth?appId=...&state=...&type=signIn\n', 'yellow');

  log('3. Check Browser Console:', 'blue');
  log('   Look for any JavaScript errors', 'yellow');
  log('   Check if getLoginUrl() is generating correct URL\n', 'yellow');

  log('4. Verify Redirect URI:', 'blue');
  log('   After OAuth login, browser should redirect to:', 'yellow');
  log('   http://localhost:3000/api/oauth/callback?code=...&state=...\n', 'yellow');

  log('5. Check Database Connection:', 'blue');
  log('   Verify database is running and accessible', 'yellow');
  log('   Check users table exists in database\n', 'yellow');

  // ===== FILES TO REVIEW =====
  section('KEY FILES TO REVIEW');

  const files = [
    {
      path: 'client/src/const.ts',
      description: 'getLoginUrl() function - generates OAuth URL',
    },
    {
      path: 'server/_core/oauth.ts',
      description: 'OAuth callback handler - receives code and creates session',
    },
    {
      path: 'server/_core/sdk.ts',
      description: 'OAuth service - exchanges code for token',
    },
    {
      path: 'server/_core/context.ts',
      description: 'tRPC context - authenticates requests',
    },
    {
      path: 'client/src/_core/hooks/useAuth.ts',
      description: 'useAuth hook - queries current user',
    },
  ];

  files.forEach(file => {
    log(`${file.path}`, 'cyan');
    log(`  → ${file.description}\n`, 'yellow');
  });

  // Exit code
  process.exit(allValid ? 0 : 1);
}

// Run diagnostic
diagnose().catch(error => {
  log(`\nDiagnostic error: ${error.message}`, 'red');
  process.exit(1);
});
