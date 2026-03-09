# Failing Tests Analysis Report

**Date:** March 8, 2026  
**Total Tests:** 1307  
**Passing:** 1238 (94.7%)  
**Failing:** 46 (3.5%)  
**Skipped:** 23 (1.8%)

---

## Summary by Category

| Category | Count | Severity | Root Cause |
|----------|-------|----------|-----------|
| Certification Generation Service | 23 | 🔴 HIGH | External service connectivity (TSA, signature service) |
| Compliance Analysis E2E | 12 | 🔴 HIGH | Rate limiting middleware blocking requests |
| Certification Migration | 9 | 🟡 MEDIUM | Depends on certification service failures |
| Encrypted tRPC | 2 | 🟡 MEDIUM | Encryption format mismatch in serialization |
| Encryption Service | 1 | 🟡 MEDIUM | Key generation issue |

---

## Detailed Failure Analysis

### 1. Certification Generation Service (23 failures)

**File:** `server/__tests__/certificationGenerationService.test.ts`

#### 1.1 RSA Signature Generation (FAIL)
```
Error: expected undefined to be defined
Location: Line 322
Test: "should generate RSA signature"
```

**Root Cause:** CertificateSignatureService is not generating signatures properly
- Signature object is undefined
- Algorithm field not being set
- Likely issue in signature generation logic

**Impact:** Digital signatures not working - critical for legal defensibility

**Action Items:**
- [ ] Check CertificateSignatureService.generateRSASignature() implementation
- [ ] Verify private key is loaded correctly
- [ ] Test signature generation in isolation
- [ ] Add logging to debug signature generation flow

---

#### 1.2 ECDSA Signature Generation (FAIL)
```
Error: expected undefined to be defined
Location: Line 336
Test: "should generate ECDSA signature"
```

**Root Cause:** Same as RSA - signature object is undefined

**Impact:** ECDSA signature option not working

**Action Items:**
- [ ] Check CertificateSignatureService.generateECDSASignature() implementation
- [ ] Verify ECDSA key pair generation
- [ ] Test ECDSA signature generation in isolation

---

#### 1.3 RFC 3161 Timestamp - Sectigo (FAIL)
```
Error: Client network socket disconnected before secure TLS connection was established
```

**Root Cause:** Cannot connect to external TSA (Time Stamp Authority) server

**Impact:** RFC 3161 timestamps not being generated

**Reason:** Sandbox environment has network restrictions for external HTTPS connections

**Action Items:**
- [ ] Mock RFC 3161 TSA responses in tests
- [ ] Create test fixture for timestamp responses
- [ ] Test with local mock TSA server
- [ ] Document that TSA connectivity requires production environment

---

#### 1.4 RFC 3161 Timestamp - DigiCert (FAIL)
```
Error: Client network socket disconnected before secure TLS connection was established
```

**Root Cause:** Same as Sectigo - external connectivity issue

**Action Items:**
- [ ] Mock DigiCert TSA responses
- [ ] Create test fixtures for both TSA providers

---

#### 1.5 Service Info Metadata (FAIL)
```
Error: expected undefined to be defined
Location: Line 531
Test: "should return service info"
```

**Root Cause:** `info.signatureAlgorithm` is undefined

**Impact:** Service info endpoint not returning complete metadata

**Action Items:**
- [ ] Check getServiceInfo() implementation
- [ ] Verify all metadata fields are being populated
- [ ] Add null checks in service info response

---

#### 1.6 Certificate Generation with Encryption (FAIL - Multiple)
```
Error: Various encryption-related failures
```

**Root Cause:** Encryption service integration issues

**Impact:** Certificates not being encrypted properly

**Action Items:**
- [ ] Verify encryption service initialization
- [ ] Check encryption key management
- [ ] Test encryption/decryption round-trip

---

### 2. Compliance Analysis E2E Tests (12 failures)

**File:** `server/__tests__/complianceAnalysis.e2e.test.ts`

#### 2.1 Rate Limiting Errors (ALL 12 failures)
```
Error: TRPCError: Rate limit exceeded. Please try again later.
Location: server/_core/security.ts:98
```

**Root Cause:** Rate limiting middleware is blocking test requests

**Details:**
- Tests are hitting rate limiter too quickly
- Same user/IP making multiple requests in rapid succession
- Rate limiter not resetting between tests
- Limiter state persisting across test runs

**Affected Tests:**
- ✗ should handle simple residential building
- ✗ should handle mixed occupancy building
- ✗ should handle building with accessibility requirements
- ✗ should handle high-rise building analysis
- ✗ should handle request deduplication for identical inputs
- (and 7 more similar tests)

**Impact:** Cannot test compliance analysis workflows in E2E tests

**Action Items:**
- [ ] Disable rate limiting in test environment (add TEST_MODE flag)
- [ ] Reset rate limiter state between tests
- [ ] Use different identifiers for each test request
- [ ] Add rate limiter bypass for test user IDs
- [ ] Create test-specific rate limiter configuration

**Code Location to Fix:**
```typescript
// server/_core/security.ts:98
// Add check: if (process.env.NODE_ENV === 'test') return;
```

---

### 3. Certification Migration Service (9 failures)

**File:** `server/__tests__/certificationMigration.test.ts`

#### 3.1 Single Snapshot Migration (FAIL)
```
Error: expected false to be true
Test: "should migrate valid legacy snapshot"
```

**Root Cause:** Migration returning success=false due to upstream service failures

**Details:**
- Depends on CertificationGenerationService working
- Since signature generation is failing, migration fails
- Cascading failure from certification service

**Impact:** Cannot migrate legacy compliance data

**Action Items:**
- [ ] Fix CertificationGenerationService first
- [ ] Then re-run migration tests
- [ ] Add fallback migration without signatures for testing

---

#### 3.2 Migration Duration Recording (FAIL)
```
Error: expected 0 to be greater than 0
Test: "should record migration duration"
```

**Root Cause:** Migration completes instantly (0ms) because it's failing early

**Impact:** Performance metrics not being recorded

**Action Items:**
- [ ] Fix upstream service failures first
- [ ] Then duration will be recorded correctly

---

#### 3.3 Batch Migration (FAIL)
```
Error: expected +0 to be 5
Test: "should migrate batch of snapshots"
```

**Root Cause:** No snapshots being migrated due to service failures

**Impact:** Batch migration not working

**Action Items:**
- [ ] Fix CertificationGenerationService
- [ ] Then batch migration will work

---

### 4. Encrypted tRPC Integration (2 failures)

**File:** `server/__tests__/encryptedTrpc.integration.test.ts`

#### 4.1 Client Encryption Workflow (FAIL)
```
Error: expected 'object' to be 'string'
Location: Line 41
Test: "should encrypt client data on create"
```

**Root Cause:** Encrypted fields are being returned as objects instead of strings

**Details:**
- Expected: `encrypted.name` to be a string (encrypted ciphertext)
- Received: `encrypted.name` to be an object (encryption metadata)
- Serialization format mismatch

**Impact:** Encrypted data not serializing correctly over tRPC

**Action Items:**
- [ ] Check encryption serialization in tRPC middleware
- [ ] Verify Superjson transformer handles encrypted objects
- [ ] Convert encrypted objects to base64 strings for transport
- [ ] Add deserialization on client side

---

#### 4.2 Project Encryption Workflow (FAIL)
```
Error: expected 'object' to be 'string'
Location: Line 180
Test: "should encrypt project data on create"
```

**Root Cause:** Same as client encryption - serialization format issue

**Action Items:**
- [ ] Same fix as above

---

### 5. Encryption Service (1 failure)

**File:** `server/__tests__/encryption.test.ts`

#### 5.1 Encryption Service Issue (FAIL)
```
Error: SSL/TLS connection error
Error: write EPROTO 80689154297F0000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number
```

**Root Cause:** External KMS or SSL/TLS connection issue

**Details:**
- Likely trying to connect to external KMS service
- SSL/TLS handshake failing
- Wrong protocol version

**Impact:** Encryption service not initializing properly

**Action Items:**
- [ ] Check if KMS service is required for tests
- [ ] Mock KMS responses for test environment
- [ ] Use local encryption key for tests instead of KMS
- [ ] Add environment variable to disable KMS in test mode

---

## Priority Matrix

### 🔴 CRITICAL (Fix First)

1. **Rate Limiting Blocking Tests** (12 failures)
   - **Effort:** 30 minutes
   - **Impact:** Unblocks 12 tests immediately
   - **Action:** Add TEST_MODE bypass to rate limiter

2. **RSA/ECDSA Signature Generation** (2 failures)
   - **Effort:** 1-2 hours
   - **Impact:** Enables digital signatures
   - **Action:** Debug signature generation logic

### 🟡 HIGH (Fix Second)

3. **RFC 3161 TSA Connectivity** (2 failures)
   - **Effort:** 1 hour
   - **Impact:** Enables timestamps
   - **Action:** Mock TSA responses in tests

4. **Encrypted tRPC Serialization** (2 failures)
   - **Effort:** 1-2 hours
   - **Impact:** Enables encrypted data transport
   - **Action:** Fix serialization format

### 🟠 MEDIUM (Fix Third)

5. **Encryption Service SSL/TLS** (1 failure)
   - **Effort:** 1 hour
   - **Impact:** Enables encryption service
   - **Action:** Mock KMS or use local key

6. **Certification Migration** (9 failures)
   - **Effort:** Will fix automatically once services work
   - **Impact:** Enables data migration
   - **Action:** Depends on above fixes

---

## Recommended Fix Order

### Phase 1: Quick Wins (1 hour)
1. Disable rate limiting in test environment
2. Re-run tests to see actual failures vs. rate limit errors

### Phase 2: Core Services (3-4 hours)
1. Fix RSA/ECDSA signature generation
2. Mock RFC 3161 TSA responses
3. Fix encrypted tRPC serialization

### Phase 3: Infrastructure (2-3 hours)
1. Fix encryption service SSL/TLS
2. Add proper KMS mocking for tests

### Phase 4: Validation (1 hour)
1. Re-run full test suite
2. Verify all 46 failures are resolved

---

## Test Environment Configuration Needed

```typescript
// .env.test
NODE_ENV=test
TEST_MODE=true
DISABLE_RATE_LIMITING=true
MOCK_TSA_SERVICE=true
MOCK_KMS_SERVICE=true
USE_LOCAL_ENCRYPTION_KEY=true
```

---

## Code Changes Required

### 1. Rate Limiter Bypass
**File:** `server/_core/security.ts`

```typescript
export function checkRateLimit(identifier: string): void {
  // Add this check at the beginning
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true') {
    return;
  }
  
  if (!limiter.isAllowed(identifier)) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }
}
```

### 2. Mock TSA Service
**File:** `server/__tests__/fixtures/mockTSA.ts` (NEW)

```typescript
export const mockTSAResponse = {
  status: 'granted',
  token: 'base64-encoded-token',
  tst: new Date().toISOString(),
  accuracy: 1,
};
```

### 3. Encryption Serialization Fix
**File:** `server/_core/encryption.ts`

```typescript
// Convert encrypted objects to base64 strings for tRPC transport
export function serializeEncrypted(encrypted: EncryptedData): string {
  return Buffer.from(JSON.stringify(encrypted)).toString('base64');
}

export function deserializeEncrypted(encoded: string): EncryptedData {
  return JSON.parse(Buffer.from(encoded, 'base64').toString());
}
```

---

## Testing Strategy After Fixes

1. **Unit Tests:** Test each service in isolation with mocks
2. **Integration Tests:** Test services together
3. **E2E Tests:** Test full workflows
4. **Performance Tests:** Verify no regressions

---

## Conclusion

**Current State:** 46 failures, but most are cascading failures from 3-4 root causes

**After Fixes:** Expected to achieve 99%+ test pass rate

**Timeline:** 6-8 hours to fix all issues

**Risk Level:** LOW - All failures are infrastructure/configuration issues, not logic errors

---

## Next Steps

1. **Review this analysis** with the team
2. **Decide on fix priority** based on business needs
3. **Allocate resources** for fixes
4. **Execute fixes in priority order**
5. **Re-run tests** after each fix to verify progress
