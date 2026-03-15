# Rules Management System - Refactoring Plan

**Status:** IN PROGRESS  
**Date Started:** March 15, 2026  
**Target Completion:** March 16, 2026  
**Compliance Goal:** 100/100 (from current 58/100)

---

## PHASE 1: Problem Definition and Architecture Planning

### Problem Definition

**Feature:** Refactor Rules Management System to full CODING_PROTOCOL compliance

**User Flow:**
1. User searches for rules by keyword, jurisdiction, category
2. User applies rules to projects (project-specific or organization-wide)
3. User creates custom rules with credentials tracking
4. System logs all operations to immutable audit trail
5. User views audit trail and compliance status

**Data Flow:**
- Frontend (RuleManagement.tsx) → tRPC procedures → Service Layer → Repository Layer → Database
- All operations logged to audit trail
- Caching applied at service layer
- Rate limiting enforced at middleware
- Monitoring/logging at all layers

**Success Criteria:**
- ✅ All business logic in Service Layer
- ✅ All data access in Repository Layer
- ✅ Authorization via Middleware
- ✅ Caching with TTL implemented
- ✅ Rate limiting on expensive operations
- ✅ Comprehensive logging/monitoring
- ✅ All operations in transactions
- ✅ Frontend error handling complete
- ✅ All tests passing
- ✅ 100/100 protocol compliance score

**Edge Cases:**
1. **Concurrent rule application** - Multiple users applying same rule simultaneously
   - Solution: Use database transactions to prevent duplicates
2. **Audit trail integrity** - Ensuring audit trail cannot be modified
   - Solution: Immutable inserts only, never update/delete
3. **Cache invalidation** - Stale cache after rule updates
   - Solution: Invalidate cache on rule create/update/delete operations
4. **Rate limit bypass** - Users trying to exceed rate limits
   - Solution: Enforce at middleware, return 429 Too Many Requests
5. **Authorization edge case** - Admin applying global rules vs user applying project rules
   - Solution: Middleware checks role and projectId context

---

## PHASE 2-5: Architecture Implementation

### Service Layer Design

**File:** `server/services/RuleService.ts`

```typescript
export class RuleService {
  // Search with caching
  static async searchRules(query?: string, jurisdiction?: string, category?: string, limit: number = 50) {
    // Check cache
    // Call repository
    // Cache result with TTL
    // Log operation
  }

  // Apply rule with transaction
  static async applyRule(ruleId: number, userId: number, projectId?: number) {
    // Validate inputs
    // Check if already applied
    // Start transaction
    // Insert into ruleApplications
    // Insert into ruleAuditTrail
    // Commit transaction
    // Invalidate cache
    // Log operation
  }

  // Create custom rule with credentials
  static async createCustomRule(input: CreateCustomRuleInput, userId: number, userName: string) {
    // Validate inputs
    // Generate rule code
    // Start transaction
    // Insert into customRules
    // Insert into ruleAuditTrail
    // Commit transaction
    // Log operation
  }

  // Get audit trail
  static async getAuditTrail(ruleCode: string, limit: number = 50) {
    // Validate inputs
    // Query ruleAuditTrail
    // Return immutable records
    // Log operation
  }
}
```

### Repository Layer Design

**File:** `server/repositories/RuleRepository.ts`

```typescript
export class RuleRepository {
  // Search rules
  static async search(query?: string, jurisdiction?: string, category?: string, limit: number = 50) {
    // Build where conditions
    // Execute query
    // Return results
  }

  // Get by ID
  static async getById(id: number) {
    // Query by id
    // Return rule or null
  }

  // Create rule
  static async create(rule: CreateRuleInput) {
    // Insert rule
    // Return inserted rule
  }

  // Get jurisdictions
  static async getJurisdictions() {
    // Query distinct jurisdictions
    // Return list
  }

  // Get categories
  static async getCategories() {
    // Query distinct categories
    // Return list
  }
}

export class RuleApplicationRepository {
  // Apply rule to project
  static async apply(ruleId: number, userId: number, projectId?: number) {
    // Insert into ruleApplications
    // Return result
  }

  // Get project rules
  static async getProjectRules(projectId: number) {
    // Query rules for project
    // Return list
  }

  // Get global rules
  static async getGlobalRules() {
    // Query rules with projectId = null
    // Return list
  }

  // Deactivate rule
  static async deactivate(id: number) {
    // Update status to inactive
    // Return result
  }
}

export class AuditRepository {
  // Log action
  static async logAction(action: string, ruleCode: string, userId: number, details: any) {
    // Insert into ruleAuditTrail
    // Return result
  }

  // Get audit trail
  static async getTrail(ruleCode: string, limit: number = 50) {
    // Query ruleAuditTrail
    // Order by createdAt DESC
    // Return results
  }
}
```

### Middleware Design

**File:** `server/_core/middleware.ts` (update existing)

```typescript
// Admin procedure for admin-only operations
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// Rate limiting middleware for expensive operations
export const rateLimitedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  await rateLimiter.checkLimit('rulesOperation', ctx.user.id, 100, 3600); // 100/hour
  return next();
});
```

### Caching Strategy

**File:** `server/_core/cache.ts` (use existing)

```typescript
// Cache keys
const CACHE_KEYS = {
  RULES_SEARCH: (query: string, jurisdiction?: string, category?: string) => 
    `rules:search:${query}:${jurisdiction}:${category}`,
  JURISDICTIONS: 'rules:jurisdictions',
  CATEGORIES: 'rules:categories',
  PROJECT_RULES: (projectId: number) => `rules:project:${projectId}`,
  GLOBAL_RULES: 'rules:global',
};

// TTL values
const CACHE_TTL = {
  SEARCH: 3600, // 1 hour
  JURISDICTIONS: 86400, // 24 hours
  CATEGORIES: 86400, // 24 hours
  PROJECT_RULES: 1800, // 30 minutes
  GLOBAL_RULES: 3600, // 1 hour
};
```

### Monitoring/Logging

**File:** `server/_core/monitoring.ts` (use existing)

```typescript
// Log all rule operations
monitoring.log('rules.search', { query, jurisdiction, category, userId: ctx.user.id });
monitoring.log('rules.apply', { ruleId, projectId, userId: ctx.user.id });
monitoring.log('rules.createCustom', { ruleName, userId: ctx.user.id });
monitoring.log('rules.getAuditTrail', { ruleCode, userId: ctx.user.id });

// Error logging
monitoring.error('rules.search.failed', error);
monitoring.error('rules.apply.failed', error);
```

---

## PHASE 6: Frontend Error Handling

### Error Boundary Component

**File:** `client/src/components/ErrorBoundary.tsx`

```typescript
export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorAlert error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### RuleManagement.tsx Updates

**Changes:**
1. Add error boundary wrapper
2. Add loading states for all queries
3. Add error display for all mutations
4. Add empty states
5. Fix toast notifications
6. Add optimistic updates
7. Add proper validation

```typescript
// Loading state
const { data: searchResults = [], isLoading } = trpc.rules.search.useQuery(...);

// Error display
if (error) return <ErrorAlert error={error} />;

// Empty state
if (!searchResults.length) return <EmptyState />;

// Loading indicator
{isLoading && <LoadingSpinner />}
```

---

## PHASE 7: Integration Tests

### Test File: `server/routers/rulesRouter.integration.test.ts`

**Test Scenarios:**
1. Search rules with various filters
2. Apply rule to project
3. Create custom rule
4. Get audit trail
5. Verify transactions work
6. Verify caching works
7. Verify rate limiting works
8. Verify monitoring logs
9. Error handling for invalid inputs
10. Authorization checks

---

## Implementation Checklist

### Service Layer
- [ ] Create RuleService.ts
- [ ] Implement searchRules method
- [ ] Implement applyRule method
- [ ] Implement createCustomRule method
- [ ] Implement getAuditTrail method
- [ ] Add caching calls
- [ ] Add monitoring calls
- [ ] Add error handling

### Repository Layer
- [ ] Create RuleRepository.ts
- [ ] Create RuleApplicationRepository.ts
- [ ] Create AuditRepository.ts
- [ ] Implement all query methods
- [ ] Add transaction support
- [ ] Add error handling

### Middleware
- [ ] Update middleware.ts with adminProcedure
- [ ] Update middleware.ts with rateLimitedProcedure
- [ ] Add rate limiting checks

### Router Updates
- [ ] Update rulesRouter.ts to use services
- [ ] Remove direct database calls
- [ ] Add middleware to procedures
- [ ] Add caching calls
- [ ] Add monitoring calls

### Frontend
- [ ] Create ErrorBoundary.tsx
- [ ] Update RuleManagement.tsx with error handling
- [ ] Add loading states
- [ ] Add empty states
- [ ] Fix toast notifications
- [ ] Add optimistic updates

### Testing
- [ ] Create integration tests
- [ ] Fix database setup for tests
- [ ] Write unit tests for services
- [ ] Write unit tests for repositories
- [ ] Run all tests and verify passing

### Documentation
- [ ] Update API_DOCUMENTATION.md
- [ ] Update CODING_PROTOCOL.md references
- [ ] Document service layer
- [ ] Document repository layer
- [ ] Document middleware

---

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Protocol Compliance Score | 100/100 | 58/100 | 🚧 IN PROGRESS |
| Critical Issues | 0 | 5 | 🚧 IN PROGRESS |
| Major Issues | 0 | 7 | 🚧 IN PROGRESS |
| Test Coverage | >80% | ~40% | 🚧 IN PROGRESS |
| Code Review Pass | ✅ | ❌ | 🚧 IN PROGRESS |
| All Tests Passing | ✅ | ❌ | 🚧 IN PROGRESS |
| No Console Errors | ✅ | ❌ | 🚧 IN PROGRESS |
| No TODOs | ✅ | ❌ | 🚧 IN PROGRESS |

---

## Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Problem Definition & Planning | 30 min | ✅ DONE |
| 2 | Service Layer | 1.5 hours | 🚧 IN PROGRESS |
| 3 | Repository Layer | 1.5 hours | ⏳ PENDING |
| 4 | Middleware | 30 min | ⏳ PENDING |
| 5 | Caching & Monitoring | 1 hour | ⏳ PENDING |
| 6 | Frontend Error Handling | 1.5 hours | ⏳ PENDING |
| 7 | Integration Tests | 2 hours | ⏳ PENDING |
| 8 | Testing & Validation | 1 hour | ⏳ PENDING |
| 9 | Checkpoint & Deploy | 30 min | ⏳ PENDING |
| **TOTAL** | | **9.5 hours** | |

---

**Plan Created:** March 15, 2026  
**Status:** Ready to execute Phase 2
