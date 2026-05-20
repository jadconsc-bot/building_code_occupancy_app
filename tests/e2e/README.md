# AUTH-MIGRATE-001: Playwright E2E Testing

Comprehensive end-to-end tests for Clerk authentication migration using Playwright.

## Overview

This test suite verifies the complete AUTH-MIGRATE-001 migration from Manus OAuth to Clerk authentication. Tests cover:

- Application loading and initialization
- Clerk authentication UI rendering
- API endpoint functionality
- Session management and persistence
- Error handling and edge cases
- Production deployment verification
- Browser and mobile compatibility
- Performance metrics

## Prerequisites

### Installation

```bash
# Install Playwright and dependencies
pnpm add -D @playwright/test

# Install Playwright browsers
pnpm exec playwright install
```

### Environment Setup

Create `.env.test` file with:

```env
# Base URL for tests (local dev or production)
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# For production testing
# PLAYWRIGHT_TEST_BASE_URL=https://buildingcodeoccupancyapp-production-4adf.up.railway.app

# Clerk test credentials (optional, for authenticated tests)
CLERK_TEST_EMAIL=test@example.com
CLERK_TEST_PASSWORD=TestPassword123!
```

## Running Tests

### Run all tests

```bash
pnpm exec playwright test
```

### Run specific test file

```bash
pnpm exec playwright test tests/e2e/clerk-auth.spec.ts
```

### Run tests in headed mode (see browser)

```bash
pnpm exec playwright test --headed
```

### Run tests in debug mode

```bash
pnpm exec playwright test --debug
```

### Run tests against production

```bash
PLAYWRIGHT_TEST_BASE_URL=https://buildingcodeoccupancyapp-production-4adf.up.railway.app pnpm exec playwright test
```

### Run tests in specific browser

```bash
# Chromium only
pnpm exec playwright test --project=chromium

# Firefox only
pnpm exec playwright test --project=firefox

# WebKit only
pnpm exec playwright test --project=webkit

# Mobile Chrome
pnpm exec playwright test --project="Mobile Chrome"

# Mobile Safari
pnpm exec playwright test --project="Mobile Safari"
```

## Test Structure

### Test Suites

1. **Application Loading**
   - Page loads successfully
   - ClerkProvider is initialized
   - No critical errors

2. **Authentication UI**
   - Sign in button visible
   - Clerk modal renders
   - Proper styling applied

3. **API Endpoints**
   - POST /api/auth/session exists
   - Invalid tokens rejected
   - Required parameters validated

4. **Session Management**
   - Unauthenticated state handled
   - Secure cookies set
   - Sensitive data not in localStorage

5. **Error Handling**
   - Network errors handled gracefully
   - Error messages displayed
   - No sensitive data exposed

6. **Production Deployment**
   - Production URL accessible
   - SSL certificate valid
   - Clerk loaded from CDN

7. **Browser Compatibility**
   - Chromium support
   - Firefox support
   - WebKit support

8. **Mobile Compatibility**
   - Mobile viewport loading
   - Auth UI on mobile
   - Touch interactions

9. **Performance**
   - Page loads in < 5 seconds
   - Reasonable console errors
   - Network efficiency

## Test Results

### Viewing Results

After tests complete, view HTML report:

```bash
pnpm exec playwright show-report
```

### CI/CD Integration

Tests automatically run in GitHub Actions on:
- Pull requests
- Commits to main branch
- Manual workflow dispatch

Results are available in:
- GitHub Actions logs
- HTML report artifacts
- JUnit XML for integration

## Troubleshooting

### Tests timeout

Increase timeout in `playwright.config.ts`:

```typescript
timeout: 60 * 1000, // 60 seconds
```

### Clerk authentication issues

1. Verify Clerk is properly configured in `client/src/main.tsx`
2. Check `VITE_CLERK_PUBLISHABLE_KEY` is set correctly
3. Ensure Clerk test mode is enabled if using test credentials

### Network errors

1. Verify dev server is running: `pnpm dev`
2. Check base URL in `.env.test`
3. Verify firewall/proxy not blocking requests

### Mobile test failures

1. Ensure viewport sizes match device specifications
2. Check touch event handling in components
3. Verify responsive design works correctly

## Best Practices

1. **Keep tests independent** - Each test should work standalone
2. **Use fixtures** - Reuse common setup with Playwright fixtures
3. **Avoid hardcoding** - Use environment variables for URLs/credentials
4. **Handle timeouts** - Use appropriate wait strategies
5. **Clean up** - Ensure tests don't leave side effects
6. **Document** - Add comments explaining complex test logic

## Performance Targets

- Page load: < 5 seconds
- API response: < 1 second
- Console errors: < 5 per test
- Memory usage: < 100MB per browser instance

## Related Documentation

- [Playwright Documentation](https://playwright.dev)
- [AUTH-MIGRATE-001 Implementation](../../server/__tests__/auth-migrate-001.test.ts)
- [Clerk Documentation](https://clerk.com/docs)
- [Test Results](../../test-results/)

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive test names
3. Add comments for complex logic
4. Verify tests pass locally
5. Run against both local and production URLs
6. Update this README if adding new test categories

## Contact

For issues or questions about these tests, refer to the AUTH-MIGRATE-001 implementation documentation.
