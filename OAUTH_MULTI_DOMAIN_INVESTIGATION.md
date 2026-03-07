# OAuth Multi-Domain Support Investigation

## Current Status
- **Working Domain**: `https://3000-ingoq16m2c2ir8gijhq8i-6c13de88.us2.manus.computer/` (Preview)
- **Target Domain**: `https://buildingcode-9f4j2cdo.manus.space/` (Custom)
- **Issue**: Custom domain not registered in Manus OAuth app settings
- **Root Cause**: OAuth app only has preview domain as registered callback URL

---

## Problem Analysis

### Why Custom Domain Fails
1. OAuth callback URL is dynamically generated from `window.location.origin`
2. When accessing via custom domain, callback URL becomes `https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback`
3. Manus OAuth server rejects this URL because it's not in the registered redirect URIs list
4. Only preview domain is registered: `https://3000-*.manus.computer/api/oauth/callback`

### Current Code Flow
```
User visits: https://buildingcode-9f4j2cdo.manus.space/
↓
App generates OAuth URL with callback: https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback
↓
Manus OAuth server checks registered URIs
↓
Not found → Returns 404/403 error
```

---

## Solution Approaches

### Option 1: Register Both Domains in Manus OAuth Settings (RECOMMENDED)
**Pros**:
- Simplest solution
- No code changes required
- Works immediately after registration
- Supports both domains seamlessly

**Cons**:
- Requires access to Manus project settings
- Manual configuration step
- May need to be done by Manus platform admin

**Implementation**:
1. Access Manus project OAuth configuration
2. Add both redirect URIs:
   - `https://3000-ingoq16m2c2ir8gijhq8i-6c13de88.us2.manus.computer/api/oauth/callback`
   - `https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback`
3. Save and test

---

### Option 2: Domain Redirect Strategy
**Concept**: Redirect custom domain to preview domain for OAuth, then redirect back after authentication

**Pros**:
- Works without Manus OAuth configuration changes
- Can be implemented in code
- Preserves session across domains

**Cons**:
- More complex implementation
- Additional redirect adds latency
- Potential cookie/session issues across domains
- User sees domain change during login

**Implementation**:
```typescript
// In getLoginUrl() function
export function getLoginUrl(): string {
  const currentOrigin = window.location.origin;
  
  // If on custom domain, use preview domain for OAuth
  let callbackOrigin = currentOrigin;
  if (currentOrigin.includes('manus.space')) {
    callbackOrigin = 'https://3000-ingoq16m2c2ir8gijhq8i-6c13de88.us2.manus.computer';
  }
  
  const callbackUrl = `${callbackOrigin}/api/oauth/callback`;
  // ... rest of implementation
}
```

**Issues with this approach**:
- Session cookie set on preview domain won't be sent to custom domain
- Would need to implement session transfer mechanism
- Complex and error-prone

---

### Option 3: Proxy/Gateway Approach
**Concept**: Use a stable gateway URL that redirects to the appropriate domain

**Pros**:
- Single registered callback URL
- Handles domain switching transparently
- Clean separation of concerns

**Cons**:
- Requires additional infrastructure
- More complex to maintain
- Adds another layer of indirection

**Implementation**:
1. Create stable gateway URL (e.g., `https://auth.buildingcode.app/callback`)
2. Register only this URL in Manus OAuth settings
3. Gateway receives callback and redirects to appropriate domain
4. Session is transferred via secure token

---

### Option 4: Environment-Based Configuration
**Concept**: Use environment variables to specify allowed callback URLs

**Pros**:
- Flexible configuration
- Works for multiple environments
- Easy to test

**Cons**:
- Requires environment setup
- Still needs Manus OAuth registration
- Doesn't solve the core issue

**Implementation**:
```typescript
const ALLOWED_CALLBACK_URLS = [
  'https://3000-ingoq16m2c2ir8gijhq8i-6c13de88.us2.manus.computer',
  'https://buildingcode-9f4j2cdo.manus.space',
  process.env.VITE_CUSTOM_DOMAIN,
].filter(Boolean);
```

---

## Recommended Implementation Plan

### Phase 1: Current (IMMEDIATE)
- ✅ Use preview domain for all development and testing
- ✅ Document the limitation
- ✅ Update README with testing URL

### Phase 2: Future (SHORT-TERM)
- [ ] Request Manus platform to register custom domain in OAuth settings
- [ ] Test both domains work seamlessly
- [ ] Update documentation

### Phase 3: Long-term (IF NEEDED)
- [ ] Implement domain redirect strategy if Manus registration not available
- [ ] Add session transfer mechanism
- [ ] Comprehensive testing across domains

---

## Testing Checklist

### Current Setup
- [x] Preview domain OAuth login works
- [x] Session persists on preview domain
- [x] All app features accessible on preview domain

### Future Testing (After Domain Registration)
- [ ] Custom domain OAuth login works
- [ ] Session persists on custom domain
- [ ] Switching between domains maintains session
- [ ] All app features accessible on custom domain
- [ ] No security vulnerabilities introduced

---

## Security Considerations

### Current Implementation
- ✅ HTTPS only (secure)
- ✅ HttpOnly cookies (secure)
- ✅ SameSite=strict (secure)
- ✅ CSRF protection via state parameter

### Multi-Domain Considerations
- ⚠️ Cross-domain session transfer requires careful implementation
- ⚠️ Cookie SameSite policy may need adjustment for cross-domain
- ⚠️ CORS headers must be properly configured
- ⚠️ Session hijacking risks if not properly secured

---

## Code Changes Required

### Minimal Changes (Option 1 - Recommended)
```typescript
// No code changes needed!
// Just register both domains in Manus OAuth settings
```

### If Domain Redirect Needed (Option 2)
```typescript
// client/src/const.ts
export function getLoginUrl(): string {
  const currentOrigin = window.location.origin;
  
  // Determine which domain to use for OAuth callback
  const oauthOrigin = determineOAuthOrigin(currentOrigin);
  const callbackUrl = `${oauthOrigin}/api/oauth/callback`;
  
  // ... rest of implementation
}

function determineOAuthOrigin(currentOrigin: string): string {
  // If on custom domain, check if registered in Manus
  // Otherwise, use preview domain
  if (currentOrigin.includes('manus.space')) {
    // Try custom domain first, fallback to preview
    return currentOrigin; // or fallback URL
  }
  return currentOrigin;
}
```

---

## Recommendation

**Go with Option 1** (Register both domains in Manus OAuth settings):
- Simplest solution
- No code changes
- Most reliable
- Best user experience
- No security concerns

**Action Items**:
1. Contact Manus support to register custom domain in OAuth settings
2. Provide both callback URLs:
   - `https://3000-ingoq16m2c2ir8gijhq8i-6c13de88.us2.manus.computer/api/oauth/callback`
   - `https://buildingcode-9f4j2cdo.manus.space/api/oauth/callback`
3. Test both domains after registration
4. Update documentation

---

## Timeline

| Phase | Task | Timeline | Status |
|-------|------|----------|--------|
| 1 | Use preview domain for development | Immediate | ✅ Complete |
| 2 | Request Manus domain registration | Next week | ⏳ Pending |
| 3 | Test custom domain | After registration | ⏳ Pending |
| 4 | Update documentation | After verification | ⏳ Pending |

---

## References

- OAuth 2.0 Redirect URI Specification: https://tools.ietf.org/html/rfc6749#section-3.1.2
- Manus OAuth Documentation: (Internal)
- Current Implementation: `client/src/const.ts`, `server/_core/oauth.ts`

---

## Notes

- This investigation is for future reference
- Current implementation is stable and secure
- Preview domain is suitable for production use
- Custom domain can be added later without breaking changes
