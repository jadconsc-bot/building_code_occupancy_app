# Crypto Module Import Audit Report

## Executive Summary

**Total Files with Crypto References:** 41
**Files with Import Statements:** 25
**Files with Incorrect Imports:** 22 ⚠️
**Files with Correct Imports:** 3 ✅

---

## Detailed Findings

### ✅ CORRECT IMPORTS (3 files)

These files have correct crypto imports:

1. **server/auditTrailService.ts** (Line 2)
   ```typescript
   import { createHash } from 'crypto';  // ✅ Named import
   ```

2. **server/calculationEngine.ts** (Line 8)
   ```typescript
   import { createHash, randomUUID } from 'crypto';  // ✅ Named imports
   ```

3. **server/certificationSignatureService.ts** (Line 15)
   ```typescript
   import * as crypto from 'crypto';  // ✅ Namespace import
   ```

4. **server/digitalCertificateManager.ts** (Line 8)
   ```typescript
   import { generateKeyPairSync, randomBytes } from 'crypto';  // ✅ Named imports
   ```

---

### ⚠️ INCORRECT IMPORTS (22 files)

These files use default import which doesn't exist in crypto module:

| File | Line | Current Import | Issue |
|------|------|---|---|
| server/__tests__/encryption.test.ts | 5 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/_core/devAuth.ts | 21 | `import crypto from "crypto"` | Default import doesn't exist |
| server/appendOnlyAuditLog.ts | 11 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/auditTrail.ts | 7 | `import crypto from "crypto"` | Default import doesn't exist |
| server/awsKmsKeyManager.ts | 19 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/calculationBundleBuilder.ts | 16 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/calculatorCodeHasher.ts | 9 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/encryptionService.ts | 15 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/immutableAuditDatabase.ts | 16 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/professionalReviewService.ts | 17 | `import crypto from "crypto"` | Default import doesn't exist |
| server/rfc3161TimestampAuthority.ts | 19 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/routers/phase2to5.ts | 22 | `import crypto from "crypto"` | Default import doesn't exist |
| server/ruleManagementRouter.ts | 12 | `import crypto from "crypto"` | Default import doesn't exist |
| server/signedCalculationBundle.ts | 26 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/timestampAuthority.ts | 9 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/timestampIntegration.ts | 8 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/versionLockingSystem.ts | 19 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/rfc3161TimestampService.ts | 17 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/certificateRevocationService.ts | 15 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/certificateChainValidator.ts | 16 | `import crypto from 'crypto'` | Default import doesn't exist |
| server/calculationRouter.ts | ? | `import crypto from 'crypto'` | Likely incorrect |
| server/calculationsProcedures.ts | ? | `import crypto from 'crypto'` | Likely incorrect |

---

## Fix Strategy

### Option 1: Use Namespace Import (Recommended)
```typescript
import * as crypto from 'crypto';
```
**Pros:** All crypto functions available, minimal code changes
**Cons:** Slightly more verbose

### Option 2: Use Named Imports (Most Specific)
```typescript
import { createHash, randomUUID, createSign, createVerify, ... } from 'crypto';
```
**Pros:** Only imports what's needed, tree-shakeable
**Cons:** Need to identify all used functions in each file

### Option 3: Enable esModuleInterop
Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "esModuleInterop": true
  }
}
```
**Pros:** Allows default import syntax
**Cons:** Not recommended for Node.js native modules

---

## Recommended Action

**Use Option 1 (Namespace Import)** for all 22 incorrect files:
```typescript
import * as crypto from 'crypto';
```

This is the safest, most compatible approach that requires minimal changes to existing code.

---

## Impact Assessment

**Severity:** HIGH
- 22 out of 25 files have incorrect imports
- Will cause TypeScript compilation errors
- Prevents app from building and running

**Fix Effort:** LOW
- Single line change per file
- Can be automated with find/replace
- No logic changes required

**Testing Required:** MEDIUM
- Run full test suite after fixes
- Verify all crypto operations work correctly
- Check dev server starts without errors

---

## Next Steps

1. Fix all 22 files with incorrect imports
2. Run TypeScript compiler to verify no errors
3. Run full test suite
4. Verify dev server starts correctly
5. Test crypto-dependent features (signing, hashing, etc.)

