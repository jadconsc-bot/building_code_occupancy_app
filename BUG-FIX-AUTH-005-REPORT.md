# BUG-FIX-AUTH-005: Clear Stale Session Cookie Before Issuing New Clerk Session

## Problem

After Clerk login, `ctx.user.id` resolved to `1` (old Manus OAuth user) instead of `34590001` (correct Clerk user). This caused the `acknowledgeDisclaimer` mutation to insert with `userId=1`, producing incorrect audit records.

## Root Cause

The old Manus OAuth session cookie (`app_session_id`) containing `openId = "XqXMedtRuww4d9HErPhwqT"` (user id=1) persisted in the browser after Clerk login. When `POST /api/auth/session` set the new cookie, the browser may have retained the old cookie value due to cookie attribute mismatches. The `authenticateRequest` function in `sdk.ts` then resolved the stale `openId` to user id=1 instead of the Clerk user id=34590001.

## Database State (3 rows for jadconsc@gmail.com)

| id | openId | email | role | name |
|---|---|---|---|---|
| 1 | `XqXMedtRuww4d9HErPhwqT` | jadconsc@gmail.com | admin | Jose Acevedo |
| 31860007 | `jadconsc@gmail.com` | jadconsc@gmail.com | user | Senior Developer |
| 34590001 | `user_3Bzbbig1Aot40dhTwFtdUPV5kX3` | jadconsc@gmail.com | user | Jose Acevedo |

## Fix Applied

**File modified:** `server/_core/authRoutes.ts`

**Changes:**

1. Added `res.clearCookie(COOKIE_NAME, { path: '/' })` immediately before setting the new session cookie. This ensures any stale session cookie from a previous Manus OAuth login (or any prior session) is explicitly cleared before the new Clerk-based cookie is set.

2. Removed three `[AUTH-DEBUG]` console.log statements that were added in commit `9860ed7` (DEBUG-AUTH-001) since they are no longer needed.

3. Updated JSDoc comment to document the BUG-FIX-AUTH-005 behavior.

## Files NOT Modified (per instructions)

- `client/index.html`
- `server/_core/env.ts`
- `client/src/main.tsx`
- `client/src/_core/hooks/useAuth.ts`
- `server/_core/sdk.ts`
- `server/_core/context.ts`

## Verification

- **Build:** `pnpm build` succeeds with no errors.
- **Tests:** 1374 passed, 61 failed, 11 skipped (1446 total). The 61 failures are **pre-existing** and unrelated to this change (confirmed by running tests on the previous commit `9860ed7` which shows the same 61 failures). These failures are in `integration.test.ts` (DB-dependent tests) and `security.test.ts` (JWT validation test).

## Expected Result

Each Clerk login now explicitly clears any existing `app_session_id` cookie before setting the new one. This ensures `authenticateRequest` always uses the correct Clerk `openId` (`user_3Bzbbig1Aot40dhTwFtdUPV5kX3` for the current user), resolving to user id=34590001 instead of the stale id=1.

## Testing Instructions

1. Clear browser cookies for the Railway domain
2. Log in via Clerk (Google OAuth)
3. Navigate to Drawing Analyzer
4. Accept the disclaimer
5. Verify the disclaimer acknowledgment is recorded with the correct `userId` (34590001, not 1)
