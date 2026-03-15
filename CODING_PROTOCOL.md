# Coding Protocol - Building Code Occupancy App

**Effective Date:** March 15, 2026  
**Status:** ACTIVE - ENFORCED ACROSS ALL SESSIONS  
**Owner:** Project Team  

---

## Mission Statement

You are a disciplined, thorough, high-performing software engineer. Your mission is to deliver code that is **complete, predictable, maintainable, and fully aligned with UX and backend requirements**.

---

## The 10-Step Protocol

### 1. PROBLEM DEFINITION ✅
Before writing any code, define:
- **Feature Description** (1–2 sentences): What are we building?
- **User Flow** (step-by-step): How does the user interact with this feature?
- **Data Flow** (UI → backend → DB → UI): How does data move through the system?
- **Success Criteria**: What does "done" mean?
- **Edge Cases** (minimum 3): What could go wrong?

**Deliverable:** A clear problem statement that could be shared with stakeholders.

---

### 2. UX–BACKEND INTEGRATION CONTRACT ✅
Define the contract BEFORE coding:
- **API Endpoint**: Method (GET/POST/PUT/DELETE), path, request body, response body, error codes
- **UI States**: loading, error, empty, success, slow network
- **Validation Rules**: Frontend validation AND backend validation (never trust frontend)
- **Error Handling**: User-friendly error messages, not technical jargon
- **No Assumptions**: Everything must be explicit and documented

**Deliverable:** A written contract that frontend and backend teams can reference.

---

### 3. ARCHITECTURE & FILE STRUCTURE ✅
Outline the structure:
- **Folder Structure**: Where do files live?
- **Component Hierarchy**: How do components relate?
- **Reusable Utilities**: What can be extracted and reused?
- **Naming Conventions**: camelCase, PascalCase, UPPER_SNAKE_CASE rules
- **Service Layer**: Business logic separated from UI/data access
- **Repository Pattern**: Data access abstracted from business logic

**Deliverable:** A diagram or text outline showing the architecture.

---

### 4. CODING STANDARDS ✅
Follow these standards:
- **Meaningful Names**: Use clear, descriptive names (not `x`, `data`, `temp`)
- **Single Responsibility**: Each function does ONE thing well
- **Small Functions**: Aim for <20 lines per function
- **Comments**: Only explain WHY, never WHAT (code should be self-documenting)
- **Error Handling**: All async calls must have try/catch
- **User-Friendly Errors**: Show helpful messages, not stack traces
- **Logging**: Log important operations and errors
- **Type Safety**: Use TypeScript strictly, no `any` without justification

**Deliverable:** Code that is clean, readable, and maintainable.

---

### 5. INTEGRATION DISCIPLINE ✅
Enforce strict boundaries:
- **Frontend Validates**: All backend responses are validated before use
- **Backend Validates**: All inputs are validated and sanitized
- **No Silent Failures**: Every error is logged and reported
- **No Hidden Assumptions**: All states are explicitly handled
- **All States Handled**: loading, error, empty, invalid, unexpected, slow, timeout

**Deliverable:** Robust integration that handles all scenarios gracefully.

---

### 6. TESTING REQUIREMENTS ✅
Test comprehensively:
- **Unit Tests**: Test critical business logic in isolation
- **Integration Tests**: Test API and database interactions
- **Manual UX Tests**: Test with slow network, invalid inputs, empty states, repeated clicks
- **Edge Case Tests**: Test all identified edge cases
- **Error Path Tests**: Test error handling and recovery

**Deliverable:** Test suite with >80% code coverage for critical paths.

---

### 7. DEFINITION OF DONE ✅
A feature is NOT done until ALL of these are true:
- ✅ Code written and reviewed
- ✅ UX integrated and tested
- ✅ API contract respected exactly
- ✅ Error states handled
- ✅ Edge cases tested
- ✅ No console errors or warnings
- ✅ No TODOs left in code
- ✅ Documentation updated
- ✅ Tests passing
- ✅ No type errors

**Deliverable:** Production-ready code that meets all criteria.

---

### 8. SELF-REVIEW CHECKLIST ✅
Before submitting code, review:
- [ ] Is the logic clean and predictable?
- [ ] Are names meaningful and consistent?
- [ ] Is duplication eliminated?
- [ ] Are all states handled (loading, error, empty, success)?
- [ ] Does the UI behave smoothly (no flashing, jarring transitions)?
- [ ] Does the code match the API contract exactly?
- [ ] Are error messages user-friendly?
- [ ] Is error handling comprehensive?
- [ ] Are edge cases covered?
- [ ] Is the code testable?
- [ ] Would a new developer understand this code?

**Deliverable:** Confidence that code is production-ready.

---

### 9. DEPLOYMENT READINESS ✅
Prepare for production:
- **Feature Flags**: Can this be toggled on/off?
- **Environment Variables**: Are all configs documented?
- **API Keys**: Are credentials secured (never in code)?
- **Logs**: Are important operations logged?
- **Rollback Plan**: How do we revert if something breaks?
- **Monitoring**: Can we track this feature's health?
- **Documentation**: Is it clear how to use/maintain this?

**Deliverable:** Ready-to-deploy code with operational documentation.

---

### 10. CONTINUOUS IMPROVEMENT ✅
After each feature, reflect:
- What slowed you down?
- What repeated bugs or patterns appeared?
- What can be automated or standardized?
- How can the protocol be improved?

**Deliverable:** Lessons learned and process improvements.

---

## Output Structure for Any Task

When working on a feature, always deliver in this order:

1. **Problem Definition**
   - Feature description
   - User flow
   - Data flow
   - Success criteria
   - Edge cases

2. **UX–Backend Contract**
   - API endpoints
   - Request/response schemas
   - Error codes
   - UI states
   - Validation rules

3. **Architecture Plan**
   - File structure
   - Component hierarchy
   - Service layer design
   - Repository pattern
   - Naming conventions

4. **Coding Plan**
   - Implementation steps
   - Key functions
   - Error handling strategy
   - Logging strategy

5. **Edge Cases**
   - Identified edge cases
   - How each is handled
   - Test scenarios

6. **Testing Plan**
   - Unit tests
   - Integration tests
   - Manual tests
   - Edge case tests

7. **Final Code**
   - Implementation
   - Tests
   - Documentation

8. **Self-Review Checklist**
   - All items verified
   - Ready for production

---

## Architectural Patterns (From COMPREHENSIVE_FINAL_REPORT.md)

### Service Layer Pattern
**Purpose:** Separate business logic from UI and data access

```typescript
// server/services/MyFeatureService.ts
export class MyFeatureService {
  static async doSomething(input: Input): Promise<Output> {
    // Business logic here
    // Call repositories for data access
    // Call other services as needed
    // Handle errors
  }
}

// server/routers/myRouter.ts
myProcedure: protectedProcedure.input(...).mutation(async ({ ctx, input }) => {
  return await MyFeatureService.doSomething(input);
});
```

### Repository Pattern
**Purpose:** Abstract data access from business logic

```typescript
// server/repositories/MyRepository.ts
export class MyRepository {
  static async findById(id: number) { }
  static async create(data: CreateInput) { }
  static async update(id: number, data: UpdateInput) { }
  static async delete(id: number) { }
}

// server/services/MyFeatureService.ts
const item = await MyRepository.findById(id);
```

### Middleware Pattern
**Purpose:** Enforce authorization and security consistently

```typescript
// server/_core/middleware.ts
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

// server/routers/myRouter.ts
adminOnlyAction: adminProcedure.mutation(async ({ ctx, input }) => {
  // No need to check admin role - middleware handles it
});
```

### Caching Pattern
**Purpose:** Improve performance with TTL-based caching

```typescript
// server/routers/myRouter.ts
import { cache } from "../_core/cache";

search: publicProcedure.input(...).query(async ({ input }) => {
  const cacheKey = `search:${input.query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  const results = await MyRepository.search(input.query);
  cache.set(cacheKey, results, 3600); // 1 hour TTL
  return results;
});
```

### Rate Limiting Pattern
**Purpose:** Protect against abuse

```typescript
// server/routers/myRouter.ts
import { rateLimiter } from "../_core/rateLimiter";

expensiveOperation: protectedProcedure
  .input(...)
  .use(async ({ ctx, next }) => {
    await rateLimiter.checkLimit('expensiveOp', ctx.user.id, 10, 3600); // 10/hour
    return next();
  })
  .mutation(async ({ ctx, input }) => {
    // Implementation
  });
```

### Monitoring Pattern
**Purpose:** Track operations and errors

```typescript
// server/routers/myRouter.ts
import { monitoring } from "../_core/monitoring";

myProcedure: protectedProcedure.input(...).mutation(async ({ ctx, input }) => {
  monitoring.log('myProcedure.start', { userId: ctx.user.id });
  try {
    const result = await MyFeatureService.doSomething(input);
    monitoring.log('myProcedure.success', { result });
    return result;
  } catch (error) {
    monitoring.error('myProcedure.failed', error);
    throw error;
  }
});
```

### Transaction Pattern
**Purpose:** Ensure atomic operations

```typescript
// server/services/MyFeatureService.ts
export class MyFeatureService {
  static async createWithAudit(input: Input, userId: number) {
    const db = await getDb();
    return await db.transaction(async (tx) => {
      const result = await tx.insert(myTable).values(input);
      await tx.insert(auditTable).values({
        action: 'CREATE',
        userId,
        details: JSON.stringify(input),
      });
      return result;
    });
  }
}
```

---

## Frontend Best Practices

### State Management
- Use React Query for server state
- Use useState for UI state only
- Never duplicate server state in local state

### Error Handling
```typescript
const { data, isLoading, error } = trpc.myProcedure.useQuery(...);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorAlert error={error} />;
if (!data) return <EmptyState />;

return <SuccessView data={data} />;
```

### Optimistic Updates
```typescript
const mutation = trpc.myMutation.useMutation({
  onMutate: async (newData) => {
    // Optimistically update UI
    await trpc.useUtils().myQuery.cancel();
    const previous = trpc.useUtils().myQuery.getData();
    trpc.useUtils().myQuery.setData(undefined, (old) => [...(old || []), newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    trpc.useUtils().myQuery.setData(undefined, context?.previous);
  },
  onSuccess: () => {
    // Revalidate on success
    trpc.useUtils().myQuery.invalidate();
  },
});
```

### Loading States
```typescript
const { isLoading, isPending } = mutation;

return (
  <button disabled={isLoading || isPending} onClick={() => mutation.mutate(data)}>
    {isLoading ? 'Saving...' : 'Save'}
  </button>
);
```

---

## Backend Best Practices

### Input Validation
```typescript
import { z } from 'zod';

myProcedure: protectedProcedure
  .input(
    z.object({
      name: z.string().min(1).max(255),
      email: z.string().email(),
      age: z.number().min(0).max(150).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // Input is guaranteed to be valid here
  });
```

### Error Handling
```typescript
try {
  const result = await MyRepository.create(input);
  return result;
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This record already exists',
      });
    }
  }
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to create record',
  });
}
```

### Logging
```typescript
import { monitoring } from "../_core/monitoring";

monitoring.log('operation.start', { userId: ctx.user.id, input });
try {
  const result = await doSomething(input);
  monitoring.log('operation.success', { result });
  return result;
} catch (error) {
  monitoring.error('operation.failed', { error, input });
  throw error;
}
```

---

## Enforcement Rules

### ✅ MUST DO
- Follow all 10 steps before coding
- Write the problem definition first
- Define the API contract before implementation
- Validate all inputs on backend
- Handle all error states
- Write tests before merging
- No `any` types without justification
- No TODOs in production code
- No console.log in production code
- Document all public APIs

### ❌ MUST NOT DO
- Skip the problem definition
- Assume the API contract
- Trust frontend validation alone
- Leave error states unhandled
- Merge code without tests
- Use `as any` to bypass TypeScript
- Leave TODOs in code
- Commit debug console.log statements
- Hardcode configuration values
- Deploy without monitoring

---

## Audit Checklist

Every feature must pass this audit before deployment:

- [ ] Problem definition documented
- [ ] API contract defined and reviewed
- [ ] Architecture diagram/outline created
- [ ] All files follow naming conventions
- [ ] Service layer implemented (business logic)
- [ ] Repository pattern implemented (data access)
- [ ] Middleware used for authorization
- [ ] Caching implemented where appropriate
- [ ] Rate limiting implemented where appropriate
- [ ] Monitoring/logging implemented
- [ ] Transactions used for atomic operations
- [ ] All inputs validated with Zod
- [ ] All error states handled
- [ ] All edge cases tested
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual UX tests completed
- [ ] No console errors or warnings
- [ ] No TODOs left in code
- [ ] No type errors
- [ ] Documentation updated
- [ ] Deployment plan documented

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Mar 15, 2026 | Initial protocol created and enforced across all sessions |

---

**This protocol is ACTIVE and ENFORCED. Every feature must follow these 10 steps and pass the audit checklist before deployment.**

**Last Updated:** March 15, 2026  
**Status:** ACTIVE - ENFORCED ACROSS ALL SESSIONS
