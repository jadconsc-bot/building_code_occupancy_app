export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * AUTH-MIGRATE-001: Clerk Authentication
 * 
 * Old Manus OAuth functions (getLoginUrl, getRegistrationUrl) have been removed.
 * Clerk handles all authentication via ClerkProvider and SignIn component.
 * 
 * Frontend login flow:
 * 1. User clicks "Sign In"
 * 2. Clerk SignIn component opens
 * 3. User authenticates with Clerk
 * 4. Clerk token is exchanged at POST /api/auth/session
 * 5. Backend creates session cookie
 * 6. User is authenticated
 */
