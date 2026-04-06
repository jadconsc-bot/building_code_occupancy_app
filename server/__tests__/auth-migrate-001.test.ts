/**
 * AUTH-MIGRATE-001 Verification Test Suite
 * 
 * Verifies that all senior developer requirements for Clerk authentication migration are met:
 * 1. Backend: authRoutes.ts with POST /api/auth/session endpoint
 * 2. Backend: sdk.ts OAuthService removed, authenticateRequest rewritten
 * 3. Backend: env.ts CLERK_SECRET_KEY configured, OAUTH_SERVER_URL removed
 * 4. Backend: index.ts registerAuthRoutes() called
 * 5. Frontend: Clerk SignIn component in use
 * 6. Frontend: useAuth hook using Clerk's useUser()
 * 7. Frontend: ClerkProvider wrapping app
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('AUTH-MIGRATE-001: Clerk Authentication Migration', () => {
  const projectRoot = path.resolve(__dirname, '../../');
  
  describe('Backend Requirements', () => {
    describe('1. authRoutes.ts - POST /api/auth/session endpoint', () => {
      it('should have authRoutes.ts file', () => {
        const filePath = path.join(projectRoot, 'server/_core/authRoutes.ts');
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it('should export registerAuthRoutes function', () => {
        const filePath = path.join(projectRoot, 'server/_core/authRoutes.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('export function registerAuthRoutes');
      });

      it('should register POST /api/auth/session endpoint', () => {
        const filePath = path.join(projectRoot, 'server/_core/authRoutes.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain("app.post('/api/auth/session'");
      });

      it('should verify Clerk token using verifyToken from @clerk/backend', () => {
        const filePath = path.join(projectRoot, 'server/_core/authRoutes.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('verifyToken');
      });

      it('should call db.upsertUser() to persist user', () => {
        const filePath = path.join(projectRoot, 'server/_core/authRoutes.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('db.upsertUser');
      });

      it('should call sdk.createSessionToken() to create backend session', () => {
        const filePath = path.join(projectRoot, 'server/_core/authRoutes.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('sdk.createSessionToken');
      });

      it('should set session cookie in response', () => {
        const filePath = path.join(projectRoot, 'server/_core/authRoutes.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('res.cookie');
      });
    });

    describe('2. sdk.ts - OAuthService removed, authenticateRequest rewritten', () => {
      it('should have sdk.ts file', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it('should NOT contain OAuthService class', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('class OAuthService');
      });

      it('should NOT contain exchangeCodeForToken method', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('exchangeCodeForToken');
      });

      it('should NOT contain getUserInfo method', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('async getUserInfo(');
      });

      it('should NOT contain getUserInfoWithJwt method', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('getUserInfoWithJwt');
      });

      it('should NOT contain Manus OAuth endpoint constants', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('EXCHANGE_TOKEN_PATH');
        expect(content).not.toContain('GET_USER_INFO_PATH');
        expect(content).not.toContain('GET_USER_INFO_WITH_JWT_PATH');
      });

      it('should have simplified authenticateRequest for Clerk', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('async authenticateRequest(req: Request): Promise<User>');
      });

      it('should call verifySession() in authenticateRequest', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        const authenticateSection = content.substring(
          content.indexOf('async authenticateRequest'),
          content.indexOf('async authenticateRequest') + 1000
        );
        expect(authenticateSection).toContain('verifySession');
      });

      it('should call db.getUserByOpenId() in authenticateRequest', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        const authenticateSection = content.substring(
          content.indexOf('async authenticateRequest'),
          content.indexOf('async authenticateRequest') + 1000
        );
        expect(authenticateSection).toContain('getUserByOpenId');
      });

      it('should NOT sync user from OAuth server in authenticateRequest', () => {
        const filePath = path.join(projectRoot, 'server/_core/sdk.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        const authenticateSection = content.substring(
          content.indexOf('async authenticateRequest'),
          content.lastIndexOf('async authenticateRequest') + 2000
        );
        expect(authenticateSection).not.toContain('getUserInfoWithJwt');
      });
    });

    describe('3. env.ts - CLERK_SECRET_KEY configured, OAUTH_SERVER_URL removed', () => {
      it('should have env.ts file', () => {
        const filePath = path.join(projectRoot, 'server/_core/env.ts');
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it('should have CLERK_SECRET_KEY in Zod schema', () => {
        const filePath = path.join(projectRoot, 'server/_core/env.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('CLERK_SECRET_KEY');
      });

      it('should NOT have OAUTH_SERVER_URL in Zod schema', () => {
        const filePath = path.join(projectRoot, 'server/_core/env.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('OAUTH_SERVER_URL');
      });

      it('should export ENV.clerkSecretKey', () => {
        const filePath = path.join(projectRoot, 'server/_core/env.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('clerkSecretKey');
      });

      it('should NOT export ENV.oAuthServerUrl', () => {
        const filePath = path.join(projectRoot, 'server/_core/env.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('oAuthServerUrl');
      });
    });

    describe('4. index.ts - registerAuthRoutes() called', () => {
      it('should have index.ts file', () => {
        const filePath = path.join(projectRoot, 'server/_core/index.ts');
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it('should import registerAuthRoutes from authRoutes', () => {
        const filePath = path.join(projectRoot, 'server/_core/index.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/import\s*{\s*registerAuthRoutes\s*}\s*from\s*['"].*authRoutes['"]/);
      });

      it('should call registerAuthRoutes(app)', () => {
        const filePath = path.join(projectRoot, 'server/_core/index.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('registerAuthRoutes(app)');
      });

      it('should NOT import registerOAuthRoutes', () => {
        const filePath = path.join(projectRoot, 'server/_core/index.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain('registerOAuthRoutes');
      });
    });

    describe('5. @clerk/backend package installed', () => {
      it('should have @clerk/backend in package.json dependencies', () => {
        const filePath = path.join(projectRoot, 'package.json');
        const content = fs.readFileSync(filePath, 'utf-8');
        const pkg = JSON.parse(content);
        expect(pkg.dependencies['@clerk/backend']).toBeDefined();
      });
    });
  });

  describe('Frontend Requirements', () => {
    describe('6. useAuth hook using Clerk useUser()', () => {
      it('should have useAuth.ts file', () => {
        const filePath = path.join(projectRoot, 'client/src/_core/hooks/useAuth.ts');
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it('should import useUser from @clerk/clerk-react', () => {
        const filePath = path.join(projectRoot, 'client/src/_core/hooks/useAuth.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/import\s*{\s*useUser\s*}\s*from\s*['"]@clerk\/clerk-react['"]/);
      });

      it('should use useUser() hook', () => {
        const filePath = path.join(projectRoot, 'client/src/_core/hooks/useAuth.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('const { user: clerkUser, isLoaded: clerkLoaded } = useUser()');
      });

      it('should NOT import getLoginUrl from @/const', () => {
        const filePath = path.join(projectRoot, 'client/src/_core/hooks/useAuth.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain("import { getLoginUrl }");
      });

      it('should query backend with trpc.auth.me only when Clerk user is loaded', () => {
        const filePath = path.join(projectRoot, 'client/src/_core/hooks/useAuth.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('enabled: clerkLoaded && !!clerkUser');
      });
    });

    describe('7. ClerkProvider wrapping app in main.tsx', () => {
      it('should have main.tsx file', () => {
        const filePath = path.join(projectRoot, 'client/src/main.tsx');
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it('should import ClerkProvider from @clerk/clerk-react', () => {
        const filePath = path.join(projectRoot, 'client/src/main.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain("import { ClerkProvider } from '@clerk/clerk-react'");
      });

      it('should get VITE_CLERK_PUBLISHABLE_KEY from import.meta.env', () => {
        const filePath = path.join(projectRoot, 'client/src/main.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('import.meta.env.VITE_CLERK_PUBLISHABLE_KEY');
      });

      it('should wrap app with ClerkProvider', () => {
        const filePath = path.join(projectRoot, 'client/src/main.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>');
      });

      it('should NOT import getLoginUrl', () => {
        const filePath = path.join(projectRoot, 'client/src/main.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toContain("import { getLoginUrl }");
      });
    });

    describe('8. SignIn component in Home.tsx', () => {
      it('should have Home.tsx file', () => {
        const filePath = path.join(projectRoot, 'client/src/pages/Home.tsx');
        expect(fs.existsSync(filePath)).toBe(true);
      });

      it('should import SignIn from @clerk/clerk-react', () => {
        const filePath = path.join(projectRoot, 'client/src/pages/Home.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/import\s*{\s*SignIn\s*}\s*from\s*['"]@clerk\/clerk-react['"]/);
      });

      it('should use SignIn component', () => {
        const filePath = path.join(projectRoot, 'client/src/pages/Home.tsx');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('<SignIn />');
      });
    });
  });

  describe('Integration Verification', () => {
    it('should have no references to VITE_OAUTH_PORTAL_URL in client code', () => {
      const clientDir = path.join(projectRoot, 'client/src');
      const files = fs.readdirSync(clientDir, { recursive: true });
      
      for (const file of files) {
        if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
          const filePath = path.join(clientDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content).not.toContain('VITE_OAUTH_PORTAL_URL');
        }
      }
    });

    it('should have @clerk/backend and @clerk/clerk-react installed', () => {
      const filePath = path.join(projectRoot, 'package.json');
      const content = fs.readFileSync(filePath, 'utf-8');
      const pkg = JSON.parse(content);
      expect(pkg.dependencies['@clerk/backend']).toBeDefined();
      expect(pkg.dependencies['@clerk/clerk-react']).toBeDefined();
    });
  });
});
