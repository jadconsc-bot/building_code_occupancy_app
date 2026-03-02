# Complete Login Flow Documentation
**Building Code Occupancy Classification Application**

---

## Overview

The login system uses **OAuth 2.0** with Manus as the identity provider. The flow involves three main parts:

1. **Frontend:** Redirects user to OAuth provider
2. **OAuth Provider:** Authenticates user and returns authorization code
3. **Backend:** Exchanges code for token, creates session, stores user in database

---

## Step-by-Step Login Flow

### **STEP 1: User Clicks "Login" Button**

**File:** `client/src/pages/Home.tsx` or any page with login

```typescript
import { getLoginUrl } from "@/const";

// In component:
const loginUrl = getLoginUrl();
// User clicks link or button that navigates to loginUrl
window.location.href = loginUrl;
```

---

### **STEP 2: Generate OAuth Login URL**

**File:** `client/src/const.ts`

```typescript
export const getLoginUrl = () => {
  // 1. Get OAuth configuration from environment
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // 2. Build redirect URI (where OAuth will send user back)
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // 3. Encode redirect URI in state (security measure)
  const state = btoa(redirectUri); // Base64 encode
  
  // 4. Build OAuth login URL
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  
  return url.toString();
};
```

**Example URL Generated:**
```
https://oauth.manus.im/app-auth?appId=abc123&state=aHR0cHM6Ly9sb2NhbGhvc3Q6MzAwMC9hcGkvb2F1dGgvY2FsbGJhY2s%3D&type=signIn
```

**Environment Variables Required:**
- `VITE_OAUTH_PORTAL_URL` - OAuth provider URL (e.g., `https://oauth.manus.im`)
- `VITE_APP_ID` - Your application ID registered with OAuth provider

---

### **STEP 3: User Authenticates with OAuth Provider**

**What Happens:**
1. User is redirected to OAuth provider login page
2. User enters credentials (email/password, or uses social login)
3. OAuth provider verifies credentials
4. OAuth provider generates authorization code

**OAuth Provider Returns:**
```
https://yourapp.com/api/oauth/callback?code=AUTH_CODE_HERE&state=ENCODED_STATE
```

---

### **STEP 4: Backend Receives OAuth Callback**

**File:** `server/_core/oauth.ts`

```typescript
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    // 1. Extract code and state from query parameters
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    if (!code || !state) {
      return res.status(400).json({ error: "Missing code or state" });
    }
    
    try {
      // 2. Exchange authorization code for access token
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token exchange successful");
      
      // 3. Get user information from OAuth provider
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info retrieved - openId:", userInfo.openId);
      
      // 4. Upsert user in database
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });
      
      // 5. Create session token (JWT)
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS, // 365 days
      });
      
      // 6. Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });
      
      // 7. Redirect to home page
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed:", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
```

**Key Actions:**
1. ✅ Exchange code for token
2. ✅ Retrieve user information
3. ✅ Create/update user in database
4. ✅ Generate session token (JWT)
5. ✅ Set session cookie
6. ✅ Redirect to home

---

### **STEP 5: Exchange Authorization Code for Token**

**File:** `server/_core/sdk.ts`

```typescript
async exchangeCodeForToken(code: string, state: string): Promise<ExchangeTokenResponse> {
  const payload: ExchangeTokenRequest = {
    clientId: ENV.appId,
    grantType: "authorization_code",
    code,
    redirectUri: this.decodeState(state), // Decode state to get redirect URI
  };
  
  // POST to OAuth server
  const { data } = await this.client.post<ExchangeTokenResponse>(
    `/webdev.v1.WebDevAuthPublicService/ExchangeToken`,
    payload
  );
  
  return data; // Contains: { accessToken, refreshToken, expiresIn }
}
```

---

### **STEP 6: Get User Information**

**File:** `server/_core/sdk.ts`

```typescript
async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
  // POST to OAuth server with access token
  const { data } = await this.client.post<GetUserInfoResponse>(
    `/webdev.v1.WebDevAuthPublicService/GetUserInfo`,
    { accessToken }
  );
  
  return data; // Contains: { openId, name, email, platforms, ... }
}
```

**Response Example:**
```json
{
  "openId": "user_12345",
  "name": "John Doe",
  "email": "john@example.com",
  "platforms": ["REGISTERED_PLATFORM_EMAIL"],
  "platform": "email"
}
```

---

### **STEP 7: Create/Update User in Database**

**File:** `server/db.ts`

```typescript
export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  
  await db.insert(users).values({
    openId: user.openId,
    name: user.name || null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: new Date(),
    role: user.openId === ENV.ownerOpenId ? 'admin' : 'user', // Owner is admin
  }).onDuplicateKeyUpdate({
    set: {
      name: user.name || null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      lastSignedIn: new Date(),
    },
  });
}
```

**Database Table:** `users`
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  loginMethod VARCHAR(50),
  role ENUM('user', 'admin') DEFAULT 'user',
  lastSignedIn DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

### **STEP 8: Create Session Token (JWT)**

**File:** `server/_core/sdk.ts`

```typescript
async createSessionToken(
  openId: string,
  options: { expiresInMs?: number; name?: string } = {}
): Promise<string> {
  return this.signSession(
    {
      openId,
      appId: ENV.appId,
      name: options.name || "",
    },
    options
  );
}

async signSession(
  payload: SessionPayload,
  options: { expiresInMs?: number } = {}
): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = this.getSessionSecret(); // From JWT_SECRET env var
  
  // Create JWT with HS256 algorithm
  return new SignJWT({
    openId: payload.openId,
    appId: payload.appId,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}
```

**JWT Payload Example:**
```json
{
  "openId": "user_12345",
  "appId": "my_app_id",
  "name": "John Doe",
  "iat": 1700000000,
  "exp": 1731536000
}
```

**Environment Variable Required:**
- `JWT_SECRET` - Secret key for signing JWTs (used for HS256 algorithm)

---

### **STEP 9: Set Session Cookie**

**File:** `server/_core/oauth.ts`

```typescript
const cookieOptions = getSessionCookieOptions(req);
res.cookie(COOKIE_NAME, sessionToken, {
  ...cookieOptions,
  maxAge: ONE_YEAR_MS, // 365 days in milliseconds
});
```

**Cookie Configuration:** `server/_core/cookies.ts`

```typescript
export function getSessionCookieOptions(req: Request) {
  const isSecure = isSecureRequest(req);
  
  return {
    httpOnly: true,        // Not accessible from JavaScript (security)
    path: "/",             // Available to all routes
    sameSite: isSecure ? "none" : "lax", // CSRF protection
    secure: isSecure,      // Only sent over HTTPS in production
  };
}
```

**Cookie Details:**
- **Name:** `app_session_id` (from `COOKIE_NAME`)
- **Value:** JWT token
- **Max Age:** 365 days
- **HttpOnly:** Yes (prevents XSS attacks)
- **Secure:** Yes (only over HTTPS in production)
- **SameSite:** Lax/None (CSRF protection)

---

### **STEP 10: Redirect to Home Page**

```typescript
res.redirect(302, "/");
```

Browser redirects to home page with session cookie set.

---

## Subsequent Requests: How Authentication Works

### **When User Loads App After Login**

**File:** `client/src/_core/hooks/useAuth.ts`

```typescript
export function useAuth(options?: UseAuthOptions) {
  // Query current user via tRPC
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  return {
    user: meQuery.data ?? null,
    loading: meQuery.isLoading,
    error: meQuery.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
    logout,
  };
}
```

### **tRPC Request Flow**

**File:** `client/src/main.tsx`

```typescript
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include", // Send cookies with request
        });
      },
    }),
  ],
});
```

**Network Request:**
```
POST /api/trpc?batch=1&input=...
Cookie: app_session_id=eyJhbGc...
```

### **Server Receives tRPC Request**

**File:** `server/_core/index.ts`

```typescript
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext, // Creates context with user
  })
);
```

### **Context Creation**

**File:** `server/_core/context.ts`

```typescript
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  
  try {
    // Authenticate request using session cookie
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null; // Public procedures don't require auth
  }
  
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
```

### **Authenticate Request**

**File:** `server/_core/sdk.ts`

```typescript
async authenticateRequest(req: Request): Promise<User> {
  // 1. Extract session cookie
  const cookies = this.parseCookies(req.headers.cookie);
  const sessionCookie = cookies.get(COOKIE_NAME);
  
  // 2. Verify JWT signature and expiration
  const session = await this.verifySession(sessionCookie);
  
  if (!session) {
    throw ForbiddenError("Invalid session cookie");
  }
  
  // 3. Get user from database
  let user = await db.getUserByOpenId(session.openId);
  
  // 4. If user not found, sync from OAuth server
  if (!user) {
    const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });
    user = await db.getUserByOpenId(userInfo.openId);
  }
  
  // 5. Update last signed in time
  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: new Date(),
  });
  
  return user;
}
```

### **Verify Session (JWT)**

**File:** `server/_core/sdk.ts`

```typescript
async verifySession(
  cookieValue: string | undefined | null
): Promise<{ openId: string; appId: string; name: string } | null> {
  if (!cookieValue) {
    console.warn("[Auth] Missing session cookie");
    return null;
  }
  
  try {
    const secretKey = this.getSessionSecret(); // From JWT_SECRET
    
    // Verify JWT signature and expiration
    const { payload } = await jwtVerify(cookieValue, secretKey, {
      algorithms: ["HS256"],
    });
    
    const { openId, appId, name } = payload as Record<string, unknown>;
    
    if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) {
      console.warn("[Auth] Session payload missing required fields");
      return null;
    }
    
    return { openId, appId, name };
  } catch (error) {
    console.warn("[Auth] Session verification failed", String(error));
    return null;
  }
}
```

### **Execute tRPC Procedure**

**File:** `server/routers.ts`

```typescript
auth: router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
})
```

**Response:**
```json
{
  "id": 123,
  "openId": "user_12345",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "lastSignedIn": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Logout Flow

### **User Clicks Logout**

**File:** `client/src/_core/hooks/useAuth.ts`

```typescript
const logout = useCallback(async () => {
  try {
    // Call logout mutation
    await logoutMutation.mutateAsync();
  } catch (error) {
    // Handle error
  } finally {
    // Clear user from cache
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }
}, [logoutMutation, utils]);
```

### **Backend Clears Cookie**

**File:** `server/routers.ts`

```typescript
logout: publicProcedure.mutation(({ ctx }) => {
  const cookieOptions = getSessionCookieOptions(ctx.req);
  
  // Clear session cookie
  ctx.res.clearCookie(COOKIE_NAME, {
    ...cookieOptions,
    maxAge: -1, // Negative maxAge deletes the cookie
  });
  
  return { success: true };
})
```

### **Frontend Redirects to Login**

```typescript
window.location.href = getLoginUrl();
```

---

## Environment Variables Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_OAUTH_PORTAL_URL` | OAuth provider URL | `https://oauth.manus.im` |
| `VITE_APP_ID` | Application ID | `abc123def456` |
| `OAUTH_SERVER_URL` | OAuth server API URL | `https://api.manus.im` |
| `JWT_SECRET` | Secret for signing JWTs | `your-secret-key-here` |
| `DATABASE_URL` | Database connection | `mysql://user:pass@host/db` |
| `OWNER_OPEN_ID` | Owner's OpenID (admin) | `owner_12345` |

---

## Security Features

1. **HTTPS Only:** Cookies only sent over HTTPS in production
2. **HttpOnly Cookies:** Session cookie not accessible from JavaScript
3. **JWT Signature:** Session token signed with HS256 algorithm
4. **JWT Expiration:** Session expires after 365 days
5. **CSRF Protection:** SameSite cookie attribute set
6. **State Parameter:** OAuth state encoded to prevent CSRF
7. **Database Sync:** User synced from OAuth server if missing
8. **Role-Based Access:** Admin role determined by OWNER_OPEN_ID

---

## Troubleshooting

### **User Not Logging In**

1. Check `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` are set
2. Verify redirect URI is registered in OAuth app settings
3. Check browser console for errors
4. Check server logs for OAuth errors

### **Session Cookie Not Set**

1. Verify `JWT_SECRET` environment variable is set
2. Check cookie options in `server/_core/cookies.ts`
3. Verify HTTPS in production (secure cookie requirement)
4. Check browser cookie settings

### **User Not Found After Login**

1. Verify `DATABASE_URL` is set and database is running
2. Check `users` table exists in database
3. Verify `OWNER_OPEN_ID` is set correctly for admin role
4. Check database logs for upsert errors

### **tRPC auth.me Returns Null**

1. Verify session cookie is being sent (check Network tab)
2. Verify JWT signature is valid
3. Check user exists in database
4. Verify `JWT_SECRET` matches between signing and verification

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Clicks Login                                            │
│    getLoginUrl() → OAuth Portal                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. OAuth Provider                                               │
│    User authenticates → Returns authorization code              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend: /api/oauth/callback                                 │
│    - Exchange code for token                                    │
│    - Get user info from OAuth server                            │
│    - Upsert user in database                                    │
│    - Create JWT session token                                   │
│    - Set session cookie (HttpOnly, Secure)                      │
│    - Redirect to home page                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Frontend: Home Page                                          │
│    - useAuth() hook queries trpc.auth.me                        │
│    - Browser sends session cookie with request                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Backend: tRPC Context                                        │
│    - Extract session cookie                                     │
│    - Verify JWT signature                                       │
│    - Get user from database                                     │
│    - Return user object                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Frontend: Render Authenticated UI                            │
│    - useAuth() returns user object                              │
│    - Component renders dashboard                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

The login system is a complete OAuth 2.0 implementation with:
- ✅ Secure session management using JWT
- ✅ Database user persistence
- ✅ Role-based access control
- ✅ Automatic user sync from OAuth server
- ✅ HttpOnly, Secure cookies
- ✅ JWT signature verification
- ✅ Automatic logout on session expiration

