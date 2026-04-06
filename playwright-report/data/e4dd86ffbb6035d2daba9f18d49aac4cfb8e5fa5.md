# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clerk-auth.spec.ts >> AUTH-MIGRATE-001: Clerk Authentication E2E >> Mobile Compatibility >> should display auth UI on mobile
- Location: tests/e2e/clerk-auth.spec.ts:288:5

# Error details

```
TypeError: page.content(...).includes is not a function
```

# Page snapshot

```yaml
- paragraph [ref=e6]: Loading application...
```

# Test source

```ts
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
  294 |       
> 295 |       expect(isVisible || await page.content().includes('clerk')).toBe(true);
      |                                                ^ TypeError: page.content(...).includes is not a function
  296 |     });
  297 |   });
  298 | 
  299 |   test.describe('Performance', () => {
  300 |     test('should load page in under 5 seconds', async ({ page }) => {
  301 |       const startTime = Date.now();
  302 |       await page.goto('/');
  303 |       await page.waitForLoadState('networkidle');
  304 |       const loadTime = Date.now() - startTime;
  305 |       
  306 |       expect(loadTime).toBeLessThan(5000);
  307 |     });
  308 | 
  309 |     test('should not have excessive console errors', async ({ page }) => {
  310 |       const errors: string[] = [];
  311 |       page.on('console', msg => {
  312 |         if (msg.type() === 'error') {
  313 |           errors.push(msg.text());
  314 |         }
  315 |       });
  316 | 
  317 |       await page.goto('/');
  318 |       await page.waitForLoadState('networkidle');
  319 | 
  320 |       // Allow some errors but not too many
  321 |       expect(errors.length).toBeLessThan(5);
  322 |     });
  323 |   });
  324 | });
  325 | 
```