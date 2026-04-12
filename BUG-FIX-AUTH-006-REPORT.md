# BUG-FIX-AUTH-006: Rename Session Cookie to Force Old Sessions to Expire

## Problem

`res.clearCookie` in BUG-FIX-AUTH-005 was not clearing the old `app_session_id` cookie due to attribute mismatches (httpOnly, secure, domain). The old Manus OAuth cookie persisted and `authenticateRequest` kept resolving to user id=1 instead of the correct Clerk user id=34590001.

## Root Cause

Browser cookie clearing requires exact attribute matching (path, domain, secure, httpOnly). The `res.clearCookie(COOKIE_NAME, { path: '/' })` call did not match the exact attributes of the original cookie, so the browser ignored the clear instruction and the stale cookie persisted.

## Fix Applied

Renamed the session cookie from `app_session_id` to `cc_session_v2` in `shared/const.ts`. This single change causes the server to ignore all existing `app_session_id` cookies (wrong name) and creates new `cc_session_v2` cookies with the correct Clerk user ID on fresh login.

## Files Modified

| File | Change |
|---|---|
| `shared/const.ts` | `COOKIE_NAME` changed from `"app_session_id"` to `"cc_session_v2"` |
| `tests/api/security.test.ts` | Updated 4 hardcoded `app_session_id` references to `cc_session_v2` |
| `tests/e2e/auth.spec.ts` | Updated 2 hardcoded `app_session_id` references to `cc_session_v2` |
| `tests/e2e/oauth.spec.ts` | Updated 1 hardcoded `app_session_id` reference to `cc_session_v2` |
| `server/auth.me.test.ts` | Updated 3 hardcoded `app_session_id` references to `cc_session_v2` |

## Files NOT Modified (per instructions)

- `client/index.html`
- `server/_core/env.ts`
- `client/src/main.tsx`
- `client/src/_core/hooks/useAuth.ts`
- `server/_core/sdk.ts`
- `server/_core/context.ts`

## No Other Code Changes Needed

All application code references `COOKIE_NAME` from `shared/const.ts` consistently:
- `server/_core/authRoutes.ts` — uses `COOKIE_NAME` for setting cookie
- `server/_core/sdk.ts` — uses `COOKIE_NAME` for reading cookie
- `server/routers.ts` — uses `COOKIE_NAME` for clearing cookie on logout

## Verification

- **Build:** `pnpm build` succeeds with no errors.
- **Tests:** 1374 passed, 61 failed, 11 skipped (1446 total). The 61 failures are **pre-existing** and unrelated to this change (same count as before the change). These are in `integration.test.ts` (DB-dependent tests) and `security.test.ts` (JWT validation edge case).

## Expected Result

All users are effectively logged out on next visit (old `app_session_id` cookie is ignored by the server). Fresh logins create `cc_session_v2` cookies with the correct Clerk user `openId`, ensuring `authenticateRequest` resolves to the correct user.

## Testing Instructions

1. Visit the Railway deployment — you should be logged out (old cookie ignored)
2. Log in via Clerk (Google OAuth)
3. Check browser DevTools > Application > Cookies — should see `cc_session_v2`, no `app_session_id`
4. Navigate to Drawing Analyzer and verify `ctx.user.id` is 34590001 (not 1)
