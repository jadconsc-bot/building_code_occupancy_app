# Production Deletion Checklist

**⚠️ CRITICAL: All items in this checklist MUST be completed before production deployment.**

This document tracks all temporary development-only code, files, and configurations that must be removed before going live.

---

## Files to Delete (Development Only)

### ✅ Dev Auth Files

- [ ] `server/_core/devAuth.ts` - Mock authentication service
- [ ] `server/_core/devOAuthRoutes.ts` - Dev login routes
- [ ] `server/_core/devTestDashboard.ts` - Interactive testing dashboard
- [ ] `server/__tests__/devAuth.test.ts` - Dev auth unit tests
- [ ] `test-dev-auth-encryption.sh` - Bash testing script
- [ ] `test-e2e-comprehensive.sh` - Comprehensive E2E test script
- [ ] `DEV_AUTH_REMOVAL_GUIDE.md` - Dev auth removal documentation
- [ ] `PRODUCTION_DELETION_CHECKLIST.md` - This file

**Deletion Command:**
```bash
rm -f server/_core/devAuth.ts
rm -f server/_core/devOAuthRoutes.ts
rm -f server/_core/devTestDashboard.ts
rm -f server/__tests__/devAuth.test.ts
rm -f test-dev-auth-encryption.sh
rm -f test-e2e-comprehensive.sh
rm -f DEV_AUTH_REMOVAL_GUIDE.md
rm -f PRODUCTION_DELETION_CHECKLIST.md
```

---

## Code Changes to Revert (Remove Dev Auth Code)

### ✅ `server/_core/env.ts`

**Lines to Remove:**
- `DEV_AUTH_MODE: z.string().default('false'),` (line ~20)
- `devAuthMode: validatedEnv.DEV_AUTH_MODE === 'true',` (line ~58)
- Dev auth mode logging block (lines ~72-74)

**Verification:** No references to `DEV_AUTH_MODE` or `devAuthMode` should remain

### ✅ `server/_core/context.ts`

**Lines to Remove:**
- Import: `import { ENV } from "./env";` (if only used for dev auth)
- Import: `import { verifyDevSessionToken, getDevUser } from "./devAuth";`
- Entire dev auth mode block (lines ~20-32)

**Verification:** Only OAuth authentication should remain

### ✅ `server/_core/index.ts`

**Lines to Remove:**
- Import: `import { registerDevOAuthRoutes } from "./devOAuthRoutes";`
- Import: `import { ENV } from "./env";` (if only used for dev auth)
- Route registration: `registerDevOAuthRoutes(app);`
- Comment: `// Development OAuth routes (if DEV_AUTH_MODE enabled) - MUST be before Vite`

**Verification:** Only OAuth routes should be registered

### ✅ `server/_core/vite.ts`

**Lines to Remove:**
- API route skip logic (lines ~24-32):
```typescript
// Don't serve HTML for API routes - let them pass through
if (url.startsWith("/api/")) {
  return next();
}
```

**Verification:** Vite middleware should serve HTML for all routes

### ✅ `client/src/const.ts`

**Lines to Remove:**
- `isDevAuthMode()` function (lines ~3-9)
- `getDevLoginUrl()` function (lines ~11-13)
- `getDevLogoutUrl()` function (lines ~15-17)
- Dev auth check in `getLoginUrl()` (lines ~26-28)

**Verification:** Only OAuth login URL should be returned

---

## Environment Variables to Remove

### ✅ `DEV_AUTH_MODE`

**Current Value:** `true` (development)

**Action:** Remove entirely from:
- `.env.development` (if present)
- Environment variable configuration
- Docker/deployment configuration
- CI/CD pipeline

**Verification:** No references to `DEV_AUTH_MODE` in production environment

---

## Testing to Perform After Deletion

- [ ] OAuth login works correctly
- [ ] Dev login routes return 404 (not found)
- [ ] No TypeScript errors after deletion
- [ ] All tests pass (excluding dev auth tests)
- [ ] Application builds successfully
- [ ] No console warnings about dev auth
- [ ] Production OAuth redirect URI configured
- [ ] No references to deleted files in codebase

---

## Automated Cleanup Script

```bash
#!/bin/bash
# Production Cleanup - Remove All Dev Auth Code

echo "🗑️  Removing development-only files..."

# Remove dev auth files
rm -f server/_core/devAuth.ts
rm -f server/_core/devOAuthRoutes.ts
rm -f server/_core/devTestDashboard.ts
rm -f server/__tests__/devAuth.test.ts
rm -f test-dev-auth-encryption.sh
rm -f test-e2e-comprehensive.sh
rm -f DEV_AUTH_REMOVAL_GUIDE.md
rm -f PRODUCTION_DELETION_CHECKLIST.md

echo "✓ Dev auth files removed"
echo ""
echo "⚠️  Manual edits required in:"
echo "  - server/_core/env.ts (remove DEV_AUTH_MODE)"
echo "  - server/_core/context.ts (remove dev auth block)"
echo "  - server/_core/index.ts (remove dev route registration)"
echo "  - server/_core/vite.ts (remove API route skip)"
echo "  - client/src/const.ts (remove dev auth functions)"
echo ""
echo "Run: npm run build && npm test"
```

---

## Pre-Production Verification Checklist

Before deploying to production, verify:

- [ ] All dev auth files deleted
- [ ] All dev auth code removed from modified files
- [ ] DEV_AUTH_MODE environment variable removed
- [ ] TypeScript compilation clean (no errors)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] No console warnings or errors
- [ ] OAuth configuration verified
- [ ] OAuth redirect URI configured
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] Load testing completed

---

## Rollback Procedure (If Needed)

If issues arise after deletion, rollback to previous checkpoint:

```bash
# View available checkpoints
git log --oneline | head -20

# Rollback to specific checkpoint
git reset --hard <commit-hash>
```

---

## Post-Deletion Verification

After completing all deletions and edits:

```bash
# Check for remaining references
grep -r "devAuth" server/ client/ --include="*.ts" --include="*.tsx"
grep -r "DEV_AUTH_MODE" . --include="*.ts" --include="*.tsx" --include=".env*"
grep -r "dev-session" . --include="*.ts" --include="*.tsx"

# These should return NO results
```

---

## Timeline

- **Development Phase:** Dev auth enabled
- **Testing Phase:** Comprehensive E2E testing with dev auth
- **Pre-Production:** All dev auth code removed
- **Production:** OAuth only, no dev auth

---

## Summary

**Total Items to Delete:**
- 8 files to delete entirely
- 5 files to edit (remove dev auth code)
- 1 environment variable to remove

**Estimated Time:** 20-30 minutes

**Risk Level:** Low - All dev auth code is isolated and clearly marked

**Impact:** None - Production will use OAuth instead of dev auth

---

## Sign-Off

- [ ] Development team reviewed deletion checklist
- [ ] QA team verified all tests pass after deletion
- [ ] Security team approved production configuration
- [ ] DevOps team configured production environment
- [ ] Project manager approved production deployment

---

**Last Updated:** 2026-03-08
**Status:** Ready for Production Deletion
**Priority:** HIGH - Must complete before deployment
