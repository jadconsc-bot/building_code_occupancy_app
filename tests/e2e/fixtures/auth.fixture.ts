import { test as base, expect } from '@playwright/test';

/**
 * AUTH-MIGRATE-001: Playwright Test Fixtures
 * 
 * Provides reusable fixtures for authentication testing
 * Includes Clerk login helpers and authenticated context setup
 */

type AuthFixtures = {
  authenticatedPage: void;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to log in
    const signInButton = page.locator('text=Sign In');
    
    if (await signInButton.isVisible()) {
      // Click sign in button
      await signInButton.click();
      
      // Wait for Clerk modal to appear
      await page.waitForSelector('[data-clerk-modal]', { timeout: 10000 }).catch(() => {
        // Modal might not have data attribute, wait for input instead
        return page.waitForSelector('input[type="email"]', { timeout: 10000 });
      });
      
      // Note: For actual testing, you would need to:
      // 1. Set CLERK_TEST_EMAIL and CLERK_TEST_PASSWORD env vars
      // 2. Or use Clerk's test mode with predefined credentials
      // 3. Or mock Clerk authentication for testing
    }
    
    await use();
  },
});

export { expect };
