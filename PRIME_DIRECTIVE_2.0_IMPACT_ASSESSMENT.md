# Prime Directive 2.0 Refactoring Impact Assessment

**Date:** March 15, 2026  
**Project:** Building Code Occupancy Classifier  
**Assessment Status:** COMPLETE  
**Prepared For:** Jose (Project Lead)

---

## Executive Summary

Prime Directive 2.0 introduces **5 critical compliance requirements** that conflict with or require enhancement to the current implementation. This assessment estimates **45-60 working hours** to achieve full compliance across **3 major system areas**.

**Current Status:** 95/100 CodeComply compliance → **Target: 100/100 Prime Directive 2.0 compliance**

---

## 1. Critical Findings

### 1.1 Compliance Status Matrix

| Requirement | Current State | Status | Impact |
|-------------|---------------|--------|--------|
| React 18.3.1 | ✅ Already compliant | PASS | No action needed |
| Claude Model (claude-sonnet-4-6) | ✅ Already compliant | PASS | No action needed |
| Vite dedupe config | ❌ Missing | FAIL | Must add |
| Audit trail atomicity | ⚠️ Partial | NEEDS WORK | Must refactor |
| API-layer disclaimer enforcement | ⚠️ Frontend only | NEEDS WORK | Must add |

### 1.2 Good News

✅ **React Version:** Already at 18.3.1 (no downgrade needed)  
✅ **Claude Model:** Already using claude-sonnet-4-6  
✅ **No core dependency conflicts**

---

## 2. Detailed Impact Analysis

### 2.1 Task 1: Add Vite Dedupe Configuration

**Requirement:** `resolve.dedupe: ['react', 'react-dom']` in vite.config.ts

**Current State:**
```typescript
resolve: {
  alias: {
    "@": path.resolve(...),
    "@shared": path.resolve(...),
  },
}
```

**Required Change:**
```typescript
resolve: {
  alias: { ... },
  dedupe: ['react', 'react-dom'],  // ADD THIS
}
```

**Affected Systems:**
- vite.config.ts (1 file)

**Scope:** Minimal  
**Working Time Estimate:** **0.5 hours**  
**Risk Level:** LOW (configuration-only change)

**Files to Modify:**
1. `vite.config.ts` - Add dedupe array

**Testing:**
- Verify build completes without peer dependency warnings
- Verify dev server starts without errors
- Check for duplicate React instances in bundle

---

### 2.2 Task 2: Implement Atomic Transactions for Professional Review

**Requirement:** PROFESSIONAL_ACCEPTED and SIGNATURE_APPLIED must be written atomically (if one fails, neither is written)

**Current State:**
- Two separate INSERT statements in AuditEventService
- No transaction wrapper
- Risk: If second insert fails, first is already committed

**Required Implementation:**
- Wrap both events in a database transaction
- Use MySQL transaction (BEGIN, COMMIT, ROLLBACK)
- Verify atomicity with test case

**Affected Systems:**
- `server/services/AuditEventService.ts` - Add transaction wrapper
- `server/routers/professionalRouter.ts` - Call transactional method
- `server/__tests__/professionalReview.e2e.test.ts` - Add atomicity test

**Scope:** Medium  
**Working Time Estimate:** **3-4 hours**

**Files to Modify:**
1. `server/services/AuditEventService.ts` - Add `logProfessionalReviewAtomic()` method
2. `server/routers/professionalRouter.ts` - Use atomic method instead of separate calls
3. `server/__tests__/professionalReview.e2e.test.ts` - Add atomicity failure test

**Implementation Steps:**
1. Create new method: `async logProfessionalReviewAtomic(acceptanceData, signatureData)`
2. Wrap in MySQL transaction: `BEGIN → INSERT both → COMMIT`
3. Handle rollback on error
4. Add test: "Verify PROFESSIONAL_ACCEPTED and SIGNATURE_APPLIED are atomic"

**Testing:**
- Happy path: Both events written
- Failure path: Simulate second insert failure → verify first is rolled back
- Verify no orphaned PROFESSIONAL_ACCEPTED without SIGNATURE_APPLIED

---

### 2.3 Task 3: Enforce Disclaimer at API Layer

**Requirement:** "Disclaimer check: enforced at API layer, not frontend only"

**Current State:**
- DisclaimerGate.tsx enforces at frontend (session storage)
- No API-layer validation
- Risk: Bypass via direct API call

**Required Implementation:**
- Add `disclaimerAcknowledged` field to drawing upload request
- Validate at tRPC procedure level (before processing)
- Return 400 BAD_REQUEST if false
- Log DISCLAIMER_ACKNOWLEDGED event only if validation passes

**Affected Systems:**
- `server/routers/drawingRouter.ts` - Add validation middleware
- `client/src/components/DisclaimerGate.tsx` - Pass flag in upload payload
- `server/__tests__/disclaimerGate.e2e.test.ts` - Add API validation test

**Scope:** Medium  
**Working Time Estimate:** **2-3 hours**

**Files to Modify:**
1. `server/routers/drawingRouter.ts` - Add disclaimer validation
2. `client/src/components/DisclaimerGate.tsx` - Include flag in upload
3. `server/__tests__/disclaimerGate.e2e.test.ts` - Add API test

**Implementation Steps:**
1. Add `disclaimerAcknowledged: boolean` to upload input schema
2. Add validation: `if (!input.disclaimerAcknowledged) throw new TRPCError({ code: 'BAD_REQUEST' })`
3. Log event only after validation passes
4. Add test case: "Verify upload API rejects if disclaimerAcknowledged is false"

**Testing:**
- Happy path: disclaimerAcknowledged=true → upload succeeds
- Failure path: disclaimerAcknowledged=false → returns 400
- Verify DISCLAIMER_ACKNOWLEDGED event only logged on success

---

### 2.4 Task 4: Implement Mandatory Test Scenarios

**Requirement:** All 10 mandatory test scenarios must pass (Section 10.1-10.3)

**Current State:**
- 49 E2E tests created
- Not all mandatory scenarios explicitly tested
- Missing: Some boundary tests, atomicity tests, model version verification

**Required Implementation:**
- Add 8-12 new test cases to cover all mandatory scenarios
- Organize tests with clear names matching Prime Directive 2.0 Section 10
- Output test results in required format (table)

**Affected Systems:**
- `server/__tests__/` - Multiple test files
- New file: `server/__tests__/primeDirective2.0.mandatory.test.ts`

**Scope:** Large  
**Working Time Estimate:** **4-6 hours**

**Files to Modify/Create:**
1. `server/__tests__/primeDirective2.0.mandatory.test.ts` - New comprehensive test suite
2. `server/__tests__/auditEvents.e2e.test.ts` - Add atomicity test
3. `server/__tests__/disclaimerGate.e2e.test.ts` - Add API validation test

**Test Scenarios to Add:**
1. ✅ Happy path: Feature works as specified
2. ✅ Auth boundary: Unauthenticated request rejected (401)
3. ✅ Permission boundary: User without credentials rejected (403)
4. ✅ Validation boundary: Malformed input rejected (400)
5. ✅ Retry logic: 429 retried, 401/403 not retried
6. ✅ Audit events: All required fields populated
7. ✅ Timestamp: Server-generated, within 2 seconds of UTC
8. ✅ UPDATE/DELETE: Rejected at DB layer
9. ✅ Atomicity: PROFESSIONAL_ACCEPTED and SIGNATURE_APPLIED atomic
10. ✅ Drawing analysis: DRAFT cannot export, hash matches, license required, disclaimer blocks, model version recorded

**Testing:**
- Run full test suite
- Generate test results table (as per Section 10.4)
- Verify all scenarios PASS

---

### 2.5 Task 5: Documentation & Compliance Verification

**Requirement:** Document all changes, verify compliance, prepare for review

**Affected Systems:**
- Project documentation
- .env.example file
- Compliance checklist

**Scope:** Small  
**Working Time Estimate:** **1-2 hours**

**Files to Modify/Create:**
1. `.env.example` - Document new env vars (if any)
2. `PRIME_DIRECTIVE_2.0_COMPLIANCE.md` - Compliance checklist
3. `todo.md` - Update completion status

---

## 3. Total Refactoring Effort

### 3.1 Time Breakdown

| Task | Hours | Risk |
|------|-------|------|
| 1. Vite dedupe config | 0.5 | LOW |
| 2. Atomic transactions | 3-4 | MEDIUM |
| 3. API disclaimer enforcement | 2-3 | MEDIUM |
| 4. Mandatory test scenarios | 4-6 | MEDIUM |
| 5. Documentation & verification | 1-2 | LOW |
| **TOTAL** | **11-15.5 hours** | **MEDIUM** |

### 3.2 Detailed Timeline

**Session 1 (Tomorrow):**
- Task 1: Vite dedupe config (0.5h)
- Task 3: API disclaimer enforcement (2-3h)
- Task 5: Documentation (0.5h)
- **Subtotal: 3-4 hours**

**Session 2:**
- Task 2: Atomic transactions (3-4h)
- Task 4: Mandatory tests (4-6h)
- **Subtotal: 7-10 hours**

**Total: 11-15.5 hours across 2 sessions**

---

## 4. Affected Systems & Components

### 4.1 Frontend Components (270 files)

**Impact: LOW**
- DisclaimerGate.tsx - Add disclaimerAcknowledged flag to upload payload
- No other component changes needed
- React 18.3.1 already in use

### 4.2 Backend Services (144 files)

**Impact: MEDIUM**
- AuditEventService.ts - Add atomic transaction method
- drawingRouter.ts - Add disclaimer validation
- professionalRouter.ts - Use atomic method
- Multiple test files - Add mandatory test scenarios

### 4.3 Database Layer

**Impact: LOW**
- No schema changes needed
- Existing complianceAuditTrail table already immutable
- Transaction support already available in MySQL

### 4.4 Configuration Files

**Impact: LOW**
- vite.config.ts - Add dedupe config
- .env.example - Document any new vars (if needed)

### 4.5 Test Suite (49 existing tests)

**Impact: MEDIUM**
- Add 8-12 new mandatory test scenarios
- Reorganize tests to match Prime Directive 2.0 structure
- Output test results in required table format

---

## 5. Risk Assessment

### 5.1 Low Risk Items
- ✅ Vite dedupe config (configuration-only)
- ✅ Documentation updates
- ✅ Test additions (non-breaking)

### 5.2 Medium Risk Items
- ⚠️ Atomic transactions (requires transaction handling)
- ⚠️ API disclaimer enforcement (changes upload flow)

### 5.3 Mitigation Strategies
1. **Create checkpoint before each task** - Easy rollback if issues arise
2. **Test thoroughly** - Run full test suite after each change
3. **Incremental deployment** - Deploy one task at a time
4. **Code review** - Review changes against Prime Directive 2.0 before committing

---

## 6. Escalation Triggers (Per Prime Directive 2.0 Section 11.2)

**None detected.** All requirements can be implemented without:
- Upgrading core dependencies
- Adding new npm packages
- Modifying complianceAuditTrail structure
- Changing LLM/rule engine boundary
- Changing disclaimer text
- Changing analysisStatus enum

---

## 7. Recommendations

### 7.1 Immediate Actions (Tomorrow)
1. **Approve refactoring plan** - Confirm scope and timeline
2. **Start with Task 1** - Vite dedupe (quick win, low risk)
3. **Proceed to Task 3** - API disclaimer enforcement
4. **Document changes** - Update compliance checklist

### 7.2 Next Session
1. **Implement Task 2** - Atomic transactions
2. **Implement Task 4** - Mandatory test scenarios
3. **Run full test suite** - Verify all scenarios pass
4. **Final checkpoint** - Prepare for production

### 7.3 Pre-Deployment Checklist
- [ ] All 5 tasks completed
- [ ] All mandatory test scenarios pass
- [ ] Test results table output
- [ ] Code review complete
- [ ] No hardcoded secrets
- [ ] All env vars documented
- [ ] File change manifest verified

---

## 8. Conclusion

Prime Directive 2.0 compliance requires **11-15.5 hours** of focused refactoring across **3 major areas** (configuration, transactions, API validation, testing). The work is **low-to-medium risk** with no core dependency conflicts.

**Current Status:** 95/100 CodeComply compliance  
**Target Status:** 100/100 Prime Directive 2.0 compliance  
**Estimated Completion:** 2 sessions (tomorrow + next session)

**Ready to proceed?**

---

## Appendix A: File Change Manifest

### Files to Modify
1. `vite.config.ts` - Add dedupe config
2. `server/services/AuditEventService.ts` - Add atomic transaction method
3. `server/routers/drawingRouter.ts` - Add disclaimer validation
4. `server/routers/professionalRouter.ts` - Use atomic method
5. `client/src/components/DisclaimerGate.tsx` - Pass disclaimerAcknowledged flag
6. `.env.example` - Document env vars (if needed)

### Files to Create
1. `server/__tests__/primeDirective2.0.mandatory.test.ts` - Comprehensive test suite
2. `PRIME_DIRECTIVE_2.0_COMPLIANCE.md` - Compliance checklist

### Files to Update
1. `todo.md` - Add Prime Directive 2.0 tasks
2. `server/__tests__/auditEvents.e2e.test.ts` - Add atomicity test
3. `server/__tests__/disclaimerGate.e2e.test.ts` - Add API validation test

**Total Files: 11 modified/created**

---

**Report Prepared By:** Manus AI Agent  
**Date:** March 15, 2026  
**Classification:** Technical Assessment  
**Status:** READY FOR REVIEW
