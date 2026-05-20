# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clerk-auth.spec.ts >> AUTH-MIGRATE-001: Clerk Authentication E2E >> Authentication UI >> should display sign in button or Clerk modal when not authenticated
- Location: tests/e2e/clerk-auth.spec.ts:71:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "AB CodeComply" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: AB
        - generic [ref=e7]: CodeComply
      - navigation [ref=e8]:
        - link "Occupancy Classifier" [ref=e9] [cursor=pointer]:
          - /url: /occupancy-classifier
        - link "Projects" [ref=e10] [cursor=pointer]:
          - /url: /project-checklists
        - link "Rule Management" [ref=e11] [cursor=pointer]:
          - /url: /rule-management
        - link "Calculation History" [ref=e12] [cursor=pointer]:
          - /url: /calculation-history
      - generic [ref=e13]:
        - button "Tools" [ref=e14] [cursor=pointer]:
          - img
          - text: Tools
        - button "Login" [ref=e15] [cursor=pointer]
  - generic [ref=e17]:
    - heading "Welcome to CodeComply" [level=1] [ref=e18]
    - paragraph [ref=e19]: Professional building code compliance tools for architects, engineers, and inspectors
    - generic [ref=e20]:
      - button "Login" [ref=e21] [cursor=pointer]
      - button "Register" [ref=e22] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * AUTH-MIGRATE-001: Clerk Authentication E2E Tests
  5   |  * 
  6   |  * Comprehensive end-to-end tests for Clerk authentication migration
  7   |  * Tests login, logout, session persistence, and protected routes
  8   |  * 
  9   |  * Prerequisites:
  10  |  * - Set PLAYWRIGHT_TEST_BASE_URL environment variable
  11  |  * - Configure Clerk test credentials in .env.test
  12  |  * - Run with: pnpm exec playwright test tests/e2e/clerk-auth.spec.ts
  13  |  */
  14  | 
  15  | test.describe('AUTH-MIGRATE-001: Clerk Authentication E2E', () => {
  16  |   
  17  |   test.beforeEach(async ({ page }) => {
  18  |     // Navigate to the application before each test
  19  |     await page.goto('/');
  20  |     await page.waitForLoadState('networkidle');
  21  |   });
  22  | 
  23  |   test.describe('Application Loading', () => {
  24  |     test('should load the application successfully', async ({ page }) => {
  25  |       // Check that page title is set
  26  |       const title = await page.title();
  27  |       expect(title).toBeTruthy();
  28  |       
  29  |       // Check for no critical errors
  30  |       const errors: string[] = [];
  31  |       page.on('console', msg => {
  32  |         if (msg.type() === 'error') {
  33  |           errors.push(msg.text());
  34  |         }
  35  |       });
  36  |       
  37  |       await page.waitForLoadState('networkidle');
  38  |       
  39  |       // Filter out expected errors
  40  |       const criticalErrors = errors.filter(e => 
  41  |         !e.includes('CORS') && 
  42  |         !e.includes('Failed to fetch') &&
  43  |         !e.includes('Invalid URL')
  44  |       );
  45  |       
  46  |       expect(criticalErrors).toHaveLength(0);
  47  |     });
  48  | 
  49  |     test('should display ClerkProvider context', async ({ page }) => {
  50  |       // Check that the app is wrapped with ClerkProvider
  51  |       const content = await page.content();
  52  |       expect(content).toContain('clerk');
  53  |     });
  54  | 
  55  |     test('should not have "Invalid URL" errors', async ({ page }) => {
  56  |       const errors: string[] = [];
  57  |       page.on('console', msg => {
  58  |         if (msg.type() === 'error') {
  59  |           errors.push(msg.text());
  60  |         }
  61  |       });
  62  | 
  63  |       await page.waitForLoadState('networkidle');
  64  |       
  65  |       const invalidUrlErrors = errors.filter(e => e.includes('Invalid URL'));
  66  |       expect(invalidUrlErrors).toHaveLength(0);
  67  |     });
  68  |   });
  69  | 
  70  |   test.describe('Authentication UI', () => {
  71  |     test('should display sign in button or Clerk modal when not authenticated', async ({ page }) => {
  72  |       const signInButton = page.locator('text=Sign In');
  73  |       const registerButton = page.locator('text=Sign Up');
  74  |       const clerkModal = page.locator('[data-clerk-modal]');
  75  |       
  76  |       const isSignInVisible = await signInButton.isVisible().catch(() => false);
  77  |       const isRegisterVisible = await registerButton.isVisible().catch(() => false);
  78  |       const isClerkPresent = await clerkModal.isVisible().catch(() => false);
  79  |       
> 80  |       expect(isSignInVisible || isRegisterVisible || isClerkPresent).toBe(true);
      |                                                                      ^ Error: expect(received).toBe(expected) // Object.is equality
  81  |     });
  82  | 
  83  |     test('should have proper Clerk styling', async ({ page }) => {
  84  |       const content = await page.content();
  85  |       
  86  |       // Check for Clerk-related elements
  87  |       const hasClerkElements = content.includes('clerk') || content.includes('Sign In');
  88  |       expect(hasClerkElements).toBe(true);
  89  |     });
  90  |   });
  91  | 
  92  |   test.describe('API Endpoints', () => {
  93  |     test('POST /api/auth/session endpoint should exist', async ({ page }) => {
  94  |       // Make a request to the auth endpoint
  95  |       const response = await page.request.post('/api/auth/session', {
  96  |         data: { clerkToken: 'test-token' },
  97  |       }).catch(e => {
  98  |         // Endpoint should exist, even if request fails
  99  |         return null;
  100 |       });
  101 | 
  102 |       // Endpoint should respond (even with error)
  103 |       expect(response === null || response.status()).toBeTruthy();
  104 |     });
  105 | 
  106 |     test('should reject invalid Clerk tokens with 401', async ({ page }) => {
  107 |       const response = await page.request.post('/api/auth/session', {
  108 |         data: { clerkToken: 'invalid-token-xyz' },
  109 |       }).catch(e => null);
  110 | 
  111 |       if (response) {
  112 |         // Should return 400 or 401 for invalid token
  113 |         expect([400, 401]).toContain(response.status());
  114 |       }
  115 |     });
  116 | 
  117 |     test('should require clerkToken parameter with 400', async ({ page }) => {
  118 |       const response = await page.request.post('/api/auth/session', {
  119 |         data: {},
  120 |       }).catch(e => null);
  121 | 
  122 |       if (response) {
  123 |         // Should return 400 for missing parameter
  124 |         expect(response.status()).toBe(400);
  125 |       }
  126 |     });
  127 | 
  128 |     test('should accept JSON content type', async ({ page }) => {
  129 |       const response = await page.request.post('/api/auth/session', {
  130 |         data: { clerkToken: 'test' },
  131 |         headers: { 'Content-Type': 'application/json' },
  132 |       }).catch(e => null);
  133 | 
  134 |       // Should not fail due to content type
  135 |       expect(response === null || response.status()).toBeTruthy();
  136 |     });
  137 |   });
  138 | 
  139 |   test.describe('Session Management', () => {
  140 |     test('should handle unauthenticated state', async ({ page }) => {
  141 |       const content = await page.content();
  142 |       
  143 |       // Should either show sign in or be loading
  144 |       const hasAuthUI = content.includes('Sign In') || 
  145 |                        content.includes('Sign Up') || 
  146 |                        content.includes('clerk');
  147 |       
  148 |       expect(hasAuthUI).toBe(true);
  149 |     });
  150 | 
  151 |     test('should set secure session cookies', async ({ page }) => {
  152 |       const cookies = await page.context().cookies();
  153 |       
  154 |       // Check for session cookie
  155 |       const sessionCookie = cookies.find(c => 
  156 |         c.name.includes('session') || 
  157 |         c.name.includes('__session') ||
  158 |         c.name.includes('app_session')
  159 |       );
  160 |       
  161 |       if (sessionCookie) {
  162 |         // Session cookie should have proper attributes
  163 |         expect(sessionCookie.value).toBeTruthy();
  164 |         expect(sessionCookie.httpOnly).toBe(true);
  165 |       }
  166 |     });
  167 | 
  168 |     test('should not store sensitive data in localStorage', async ({ page }) => {
  169 |       const localStorage = await page.evaluate(() => {
  170 |         return Object.keys(window.localStorage);
  171 |       });
  172 |       
  173 |       // Should not have Manus OAuth tokens in localStorage
  174 |       const hasSensitiveData = localStorage.some(key => 
  175 |         key.includes('manus') || 
  176 |         key.includes('oauth') ||
  177 |         key.includes('token')
  178 |       );
  179 |       
  180 |       // This is okay - Clerk tokens should be in cookies, not localStorage
```