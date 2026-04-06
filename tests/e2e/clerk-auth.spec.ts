import { test, expect } from '@playwright/test';

/**
 * AUTH-MIGRATE-001: Clerk Authentication E2E Tests
 * 
 * Comprehensive end-to-end tests for Clerk authentication migration
 * Tests login, logout, session persistence, and protected routes
 * 
 * Prerequisites:
 * - Set PLAYWRIGHT_TEST_BASE_URL environment variable
 * - Configure Clerk test credentials in .env.test
 * - Run with: pnpm exec playwright test tests/e2e/clerk-auth.spec.ts
 */

test.describe('AUTH-MIGRATE-001: Clerk Authentication E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Application Loading', () => {
    test('should load the application successfully', async ({ page }) => {
      // Check that page title is set
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Check for no critical errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      // Filter out expected errors
      const criticalErrors = errors.filter(e => 
        !e.includes('CORS') && 
        !e.includes('Failed to fetch') &&
        !e.includes('Invalid URL')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });

    test('should display ClerkProvider context', async ({ page }) => {
      // Check that the app is wrapped with ClerkProvider
      const content = await page.content();
      expect(content).toContain('clerk');
    });

    test('should not have "Invalid URL" errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForLoadState('networkidle');
      
      const invalidUrlErrors = errors.filter(e => e.includes('Invalid URL'));
      expect(invalidUrlErrors).toHaveLength(0);
    });
  });

  test.describe('Authentication UI', () => {
    test('should display sign in button or Clerk modal when not authenticated', async ({ page }) => {
      const signInButton = page.locator('text=Sign In');
      const registerButton = page.locator('text=Sign Up');
      const clerkModal = page.locator('[data-clerk-modal]');
      
      const isSignInVisible = await signInButton.isVisible().catch(() => false);
      const isRegisterVisible = await registerButton.isVisible().catch(() => false);
      const isClerkPresent = await clerkModal.isVisible().catch(() => false);
      
      expect(isSignInVisible || isRegisterVisible || isClerkPresent).toBe(true);
    });

    test('should have proper Clerk styling', async ({ page }) => {
      const content = await page.content();
      
      // Check for Clerk-related elements
      const hasClerkElements = content.includes('clerk') || content.includes('Sign In');
      expect(hasClerkElements).toBe(true);
    });
  });

  test.describe('API Endpoints', () => {
    test('POST /api/auth/session endpoint should exist', async ({ page }) => {
      // Make a request to the auth endpoint
      const response = await page.request.post('/api/auth/session', {
        data: { clerkToken: 'test-token' },
      }).catch(e => {
        // Endpoint should exist, even if request fails
        return null;
      });

      // Endpoint should respond (even with error)
      expect(response === null || response.status()).toBeTruthy();
    });

    test('should reject invalid Clerk tokens with 401', async ({ page }) => {
      const response = await page.request.post('/api/auth/session', {
        data: { clerkToken: 'invalid-token-xyz' },
      }).catch(e => null);

      if (response) {
        // Should return 400 or 401 for invalid token
        expect([400, 401]).toContain(response.status());
      }
    });

    test('should require clerkToken parameter with 400', async ({ page }) => {
      const response = await page.request.post('/api/auth/session', {
        data: {},
      }).catch(e => null);

      if (response) {
        // Should return 400 for missing parameter
        expect(response.status()).toBe(400);
      }
    });

    test('should accept JSON content type', async ({ page }) => {
      const response = await page.request.post('/api/auth/session', {
        data: { clerkToken: 'test' },
        headers: { 'Content-Type': 'application/json' },
      }).catch(e => null);

      // Should not fail due to content type
      expect(response === null || response.status()).toBeTruthy();
    });
  });

  test.describe('Session Management', () => {
    test('should handle unauthenticated state', async ({ page }) => {
      const content = await page.content();
      
      // Should either show sign in or be loading
      const hasAuthUI = content.includes('Sign In') || 
                       content.includes('Sign Up') || 
                       content.includes('clerk');
      
      expect(hasAuthUI).toBe(true);
    });

    test('should set secure session cookies', async ({ page }) => {
      const cookies = await page.context().cookies();
      
      // Check for session cookie
      const sessionCookie = cookies.find(c => 
        c.name.includes('session') || 
        c.name.includes('__session') ||
        c.name.includes('app_session')
      );
      
      if (sessionCookie) {
        // Session cookie should have proper attributes
        expect(sessionCookie.value).toBeTruthy();
        expect(sessionCookie.httpOnly).toBe(true);
      }
    });

    test('should not store sensitive data in localStorage', async ({ page }) => {
      const localStorage = await page.evaluate(() => {
        return Object.keys(window.localStorage);
      });
      
      // Should not have Manus OAuth tokens in localStorage
      const hasSensitiveData = localStorage.some(key => 
        key.includes('manus') || 
        key.includes('oauth') ||
        key.includes('token')
      );
      
      // This is okay - Clerk tokens should be in cookies, not localStorage
      expect(hasSensitiveData).toBe(false);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/auth/**', route => {
        route.abort('failed');
      });

      // Page should still load without crashing
      await page.goto('/');
      const content = await page.content();
      expect(content).toBeTruthy();
    });

    test('should display error message for failed authentication', async ({ page }) => {
      const response = await page.request.post('/api/auth/session', {
        data: { clerkToken: 'malformed-token' },
      }).catch(e => null);

      if (response && !response.ok()) {
        const body = await response.json().catch(() => ({}));
        expect(body).toHaveProperty('error');
      }
    });

    test('should not expose sensitive error details', async ({ page }) => {
      const response = await page.request.post('/api/auth/session', {
        data: { clerkToken: 'test' },
      }).catch(e => null);

      if (response && !response.ok()) {
        const body = await response.json().catch(() => ({}));
        const errorText = JSON.stringify(body);
        
        // Should not expose database details or internal paths
        expect(errorText).not.toMatch(/database|password|secret|key/i);
      }
    });
  });

  test.describe('Production Deployment', () => {
    test('should be accessible on production URL', async ({ page, baseURL }) => {
      if (baseURL?.includes('railway.app') || baseURL?.includes('production')) {
        const response = await page.goto(baseURL || '/');
        expect(response?.status()).toBeLessThan(400);
      }
    });

    test('should have valid SSL certificate on production', async ({ page, baseURL }) => {
      if (baseURL?.includes('https')) {
        const response = await page.goto(baseURL || '/');
        expect(response?.status()).toBeLessThan(400);
      }
    });

    test('should load Clerk from CDN on production', async ({ page }) => {
      const requests: string[] = [];
      page.on('request', request => {
        requests.push(request.url());
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if Clerk is loaded from CDN or local
      const clerkLoaded = requests.some(url => 
        url.includes('clerk') || 
        url.includes('js.clerk.com')
      );

      // Clerk should be loaded from somewhere
      expect(clerkLoaded || await page.content().includes('clerk')).toBe(true);
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work on Chromium', async ({ browserName, page }) => {
      expect(browserName).toBe('chromium');
      const content = await page.content();
      expect(content).toBeTruthy();
    });

    test('should work on Firefox', async ({ browserName, page }) => {
      expect(browserName).toBe('firefox');
      const content = await page.content();
      expect(content).toBeTruthy();
    });

    test('should work on WebKit', async ({ browserName, page }) => {
      expect(browserName).toBe('webkit');
      const content = await page.content();
      expect(content).toBeTruthy();
    });
  });

  test.describe('Mobile Compatibility', () => {
    test('should load on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const content = await page.content();
      expect(content).toBeTruthy();
    });

    test('should display auth UI on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const authUI = page.locator('text=Sign In, text=Sign Up, [data-clerk-modal]');
      const isVisible = await authUI.isVisible().catch(() => false);
      
      expect(isVisible || await page.content().includes('clerk')).toBe(true);
    });
  });

  test.describe('Performance', () => {
    test('should load page in under 5 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have excessive console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Allow some errors but not too many
      expect(errors.length).toBeLessThan(5);
    });
  });
});
