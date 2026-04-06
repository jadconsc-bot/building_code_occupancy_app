# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clerk-auth.spec.ts >> AUTH-MIGRATE-001: Clerk Authentication E2E >> Error Handling >> should handle network errors gracefully
- Location: tests/e2e/clerk-auth.spec.ts:186:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://buildingcodeoccupancyapp-production-4adf.up.railway.app/", waiting until "load"

```

# Test source

```ts
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
  181 |       expect(hasSensitiveData).toBe(false);
  182 |     });
  183 |   });
  184 | 
  185 |   test.describe('Error Handling', () => {
  186 |     test('should handle network errors gracefully', async ({ page }) => {
  187 |       // Simulate network error
  188 |       await page.route('**/api/auth/**', route => {
  189 |         route.abort('failed');
  190 |       });
  191 | 
  192 |       // Page should still load without crashing
> 193 |       await page.goto('/');
      |                  ^ Error: page.goto: Test timeout of 30000ms exceeded.
  194 |       const content = await page.content();
  195 |       expect(content).toBeTruthy();
  196 |     });
  197 | 
  198 |     test('should display error message for failed authentication', async ({ page }) => {
  199 |       const response = await page.request.post('/api/auth/session', {
  200 |         data: { clerkToken: 'malformed-token' },
  201 |       }).catch(e => null);
  202 | 
  203 |       if (response && !response.ok()) {
  204 |         const body = await response.json().catch(() => ({}));
  205 |         expect(body).toHaveProperty('error');
  206 |       }
  207 |     });
  208 | 
  209 |     test('should not expose sensitive error details', async ({ page }) => {
  210 |       const response = await page.request.post('/api/auth/session', {
  211 |         data: { clerkToken: 'test' },
  212 |       }).catch(e => null);
  213 | 
  214 |       if (response && !response.ok()) {
  215 |         const body = await response.json().catch(() => ({}));
  216 |         const errorText = JSON.stringify(body);
  217 |         
  218 |         // Should not expose database details or internal paths
  219 |         expect(errorText).not.toMatch(/database|password|secret|key/i);
  220 |       }
  221 |     });
  222 |   });
  223 | 
  224 |   test.describe('Production Deployment', () => {
  225 |     test('should be accessible on production URL', async ({ page, baseURL }) => {
  226 |       if (baseURL?.includes('railway.app') || baseURL?.includes('production')) {
  227 |         const response = await page.goto(baseURL || '/');
  228 |         expect(response?.status()).toBeLessThan(400);
  229 |       }
  230 |     });
  231 | 
  232 |     test('should have valid SSL certificate on production', async ({ page, baseURL }) => {
  233 |       if (baseURL?.includes('https')) {
  234 |         const response = await page.goto(baseURL || '/');
  235 |         expect(response?.status()).toBeLessThan(400);
  236 |       }
  237 |     });
  238 | 
  239 |     test('should load Clerk from CDN on production', async ({ page }) => {
  240 |       const requests: string[] = [];
  241 |       page.on('request', request => {
  242 |         requests.push(request.url());
  243 |       });
  244 | 
  245 |       await page.goto('/');
  246 |       await page.waitForLoadState('networkidle');
  247 | 
  248 |       // Check if Clerk is loaded from CDN or local
  249 |       const clerkLoaded = requests.some(url => 
  250 |         url.includes('clerk') || 
  251 |         url.includes('js.clerk.com')
  252 |       );
  253 | 
  254 |       // Clerk should be loaded from somewhere
  255 |       expect(clerkLoaded || await page.content().includes('clerk')).toBe(true);
  256 |     });
  257 |   });
  258 | 
  259 |   test.describe('Browser Compatibility', () => {
  260 |     test('should work on Chromium', async ({ browserName, page }) => {
  261 |       expect(browserName).toBe('chromium');
  262 |       const content = await page.content();
  263 |       expect(content).toBeTruthy();
  264 |     });
  265 | 
  266 |     test('should work on Firefox', async ({ browserName, page }) => {
  267 |       expect(browserName).toBe('firefox');
  268 |       const content = await page.content();
  269 |       expect(content).toBeTruthy();
  270 |     });
  271 | 
  272 |     test('should work on WebKit', async ({ browserName, page }) => {
  273 |       expect(browserName).toBe('webkit');
  274 |       const content = await page.content();
  275 |       expect(content).toBeTruthy();
  276 |     });
  277 |   });
  278 | 
  279 |   test.describe('Mobile Compatibility', () => {
  280 |     test('should load on mobile viewport', async ({ page }) => {
  281 |       await page.setViewportSize({ width: 375, height: 667 });
  282 |       await page.goto('/');
  283 |       
  284 |       const content = await page.content();
  285 |       expect(content).toBeTruthy();
  286 |     });
  287 | 
  288 |     test('should display auth UI on mobile', async ({ page }) => {
  289 |       await page.setViewportSize({ width: 375, height: 667 });
  290 |       await page.goto('/');
  291 |       
  292 |       const authUI = page.locator('text=Sign In, text=Sign Up, [data-clerk-modal]');
  293 |       const isVisible = await authUI.isVisible().catch(() => false);
```