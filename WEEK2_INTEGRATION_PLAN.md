# Week 2 Integration Plan - Safe Extension Points

**Status:** Analysis Complete  
**Purpose:** Define exact integration points for Week 2 features without breaking existing functionality

---

## Decision 1: Deterministic Rule Engine Implementation

### Current State (LLM-Based)
```
ComplianceAnalysisService (uses invokeLLM)
    ├─→ Sends scenario to LLM
    ├─→ LLM generates compliance analysis
    └─→ Returns unstructured text
```

### New State (Hybrid Approach)
```
DeterministicComplianceEngine (NEW - Layer 3)
    ├─→ Retrieves rules via RuleService
    ├─→ Evaluates rules deterministically
    ├─→ Generates compliance pathway
    └─→ Returns structured result with isDeterministic: true

CodeInterpreterService (NEW - Layer 6)
    ├─→ Takes rule evaluation result
    ├─→ Uses LLM to interpret code clauses
    ├─→ Points to exact NBC references (e.g., 3.2.2.0)
    └─→ Returns explanation with clause citations
```

### Integration Points (NO BREAKING CHANGES)

**Safe Point 1: Create New Service**
```typescript
// NEW FILE: server/deterministicComplianceEngine.ts
export class DeterministicComplianceEngine {
  async evaluateCompliance(scenario: ScenarioInput, rulesetVersion: string): Promise<ComplianceResult> {
    // Implement deterministic evaluation
    // Returns: { isDeterministic: true, rules: [], pathway: [], violations: [] }
  }
}
```

**Safe Point 2: Create New Router Procedure**
```typescript
// ADD TO: server/complianceRouter.ts
evaluateCompliance: protectedProcedure
  .input(complianceInputSchema)
  .mutation(async ({ input, ctx }) => {
    const engine = new DeterministicComplianceEngine();
    return await engine.evaluateCompliance(input.scenario, input.rulesetVersion);
  })
```

**Safe Point 3: Create Code Interpreter Service**
```typescript
// NEW FILE: server/codeInterpreterService.ts
export class CodeInterpreterService {
  async interpretRules(complianceResult: ComplianceResult): Promise<InterpretedResult> {
    // Uses LLM to interpret code only
    // Returns: { ruleExplanations: [], clauseReferences: [], examples: [] }
  }
}
```

**Safe Point 4: Update ComplianceAnalysisService**
```typescript
// MODIFY: server/services/ComplianceAnalysisService.ts
// ONLY add new method, don't modify existing
async analyzeComplianceDeterministic(scenario: any, rulesetVersion: string) {
  const engine = new DeterministicComplianceEngine();
  const result = await engine.evaluateCompliance(scenario, rulesetVersion);
  
  const interpreter = new CodeInterpreterService();
  const interpreted = await interpreter.interpretRules(result);
  
  return { ...result, interpretation: interpreted };
}
```

**Safe Point 5: Frontend Integration**
```typescript
// MODIFY: client/src/pages/Compliance.tsx
// Add new button/option for deterministic evaluation
const { data: deterministicResult } = trpc.compliance.evaluateCompliance.useMutation();

// Keep existing LLM analysis as fallback
const { data: llmResult } = trpc.compliance.analyzeCompliance.useMutation();
```

---

## Decision 3: Professional Review Workflow (Digital Signatures)

### Current State
```
SignaturePad component (commented out)
    └─→ No backend support
```

### New State
```
SignaturePad component (uncommented)
    ├─→ Captures digital signature
    ├─→ Sends to backend
    └─→ Stored in audit trail

Professional Review Workflow
    ├─→ Engineer reviews compliance result
    ├─→ Signs with digital signature
    ├─→ Creates immutable snapshot
    └─→ Logs to audit trail
```

### Integration Points (NO BREAKING CHANGES)

**Safe Point 1: Add Signature Procedure**
```typescript
// ADD TO: server/auditRouter.ts
signAuditLog: protectedProcedure
  .input(z.object({
    auditLogId: z.string(),
    signature: z.string(), // Base64 encoded signature
    signerRole: z.enum(['engineer', 'architect', 'reviewer']),
  }))
  .mutation(async ({ input, ctx }) => {
    // Store signature in audit trail
    // Create immutable snapshot
    // Return success
  })
```

**Safe Point 2: Create Professional Review Service**
```typescript
// NEW FILE: server/professionalReviewService.ts
export class ProfessionalReviewService {
  async reviewAndSign(complianceResult: ComplianceResult, signature: string): Promise<SignedResult> {
    // Verify signature
    // Create immutable snapshot
    // Log to audit trail
    // Return signed result
  }
}
```

**Safe Point 3: Update Compliance Router**
```typescript
// ADD TO: server/complianceRouter.ts
submitForReview: protectedProcedure
  .input(z.object({
    snapshotId: z.string(),
    reviewerNotes: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // Mark snapshot as pending review
    // Create audit trail entry
    // Return review request ID
  })

signReview: protectedProcedure
  .input(z.object({
    reviewRequestId: z.string(),
    signature: z.string(),
    signerRole: z.enum(['engineer', 'architect']),
  }))
  .mutation(async ({ input, ctx }) => {
    // Verify signature
    // Create signed snapshot
    // Log to audit trail
    // Return signed result
  })
```

**Safe Point 4: Frontend Integration**
```typescript
// UNCOMMENT: client/src/components/SignaturePad.tsx
// Wire to new signReview procedure
const { mutate: signReview } = trpc.compliance.signReview.useMutation();

// Add to Compliance.tsx
<SignaturePad onSign={(signature) => signReview({ reviewRequestId, signature })} />
```

---

## Decision 7: Rule Versioning (Already Implemented)

### Current State
- ✅ RulesetVersionManager exists
- ✅ VersionLockingSystem exists
- ✅ Rule history tracking exists
- ✅ Version deprecation system exists

### Safe Extension Points

**Safe Point 1: Add Rule Version Management UI**
```typescript
// NEW FILE: client/src/pages/RuleVersionManagement.tsx
// Display available rule versions
// Allow version selection for new calculations
// Show version history
```

**Safe Point 2: Add Version Comparison Service**
```typescript
// NEW FILE: server/ruleVersionComparisonService.ts
export class RuleVersionComparisonService {
  async compareVersions(version1: string, version2: string): Promise<Comparison> {
    // Compare rules between versions
    // Highlight changes
    // Return diff
  }
}
```

**Safe Point 3: Add Version Migration Service**
```typescript
// NEW FILE: server/ruleVersionMigrationService.ts
export class RuleVersionMigrationService {
  async migrateCalculation(calculationId: string, fromVersion: string, toVersion: string): Promise<MigrationResult> {
    // Recalculate with new version
    // Show differences
    // Create new version record
  }
}
```

---

## Data Flow for Week 2 Implementation

### Deterministic Evaluation Flow
```
User Input (Compliance.tsx)
    ↓
trpc.compliance.evaluateCompliance (NEW)
    ↓
DeterministicComplianceEngine.evaluateCompliance
    ├─→ RuleService.getRulesForVersion (existing)
    ├─→ Evaluate rules deterministically
    └─→ Return ComplianceResult { isDeterministic: true, ... }
    ↓
CodeInterpreterService.interpretRules (NEW)
    ├─→ invokeLLM (existing - code interpretation only)
    └─→ Return InterpretedResult { explanations, clauses, ... }
    ↓
ComplianceRouter returns combined result
    ↓
AuditTrailService.log (existing)
    ↓
Compliance.tsx displays result with audit trail
```

### Professional Review Flow
```
User clicks "Submit for Review"
    ↓
trpc.compliance.submitForReview (NEW)
    ├─→ Create review request
    └─→ Log to audit trail
    ↓
Engineer receives review request
    ↓
Engineer reviews and signs with SignaturePad
    ↓
trpc.compliance.signReview (NEW)
    ├─→ Verify signature
    ├─→ ProfessionalReviewService.reviewAndSign
    ├─→ Create immutable snapshot
    └─→ Log to audit trail
    ↓
AuditTrailService.log (existing)
    ↓
Compliance.tsx displays signed result
```

---

## Database Changes Required (Week 2)

### NEW Tables

**1. professional_reviews**
```sql
CREATE TABLE professional_reviews (
  id VARCHAR(255) PRIMARY KEY,
  snapshotId VARCHAR(255) NOT NULL,
  reviewerId VARCHAR(255) NOT NULL,
  reviewerRole ENUM('engineer', 'architect') NOT NULL,
  signature LONGTEXT NOT NULL,
  signatureTimestamp TIMESTAMP NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snapshotId) REFERENCES complianceSnapshots(snapshotId),
  FOREIGN KEY (reviewerId) REFERENCES users(id)
);
```

**2. rule_version_migrations**
```sql
CREATE TABLE rule_version_migrations (
  id VARCHAR(255) PRIMARY KEY,
  calculationId VARCHAR(255) NOT NULL,
  fromVersion VARCHAR(50) NOT NULL,
  toVersion VARCHAR(50) NOT NULL,
  originalResult LONGTEXT NOT NULL,
  migratedResult LONGTEXT NOT NULL,
  differences LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (calculationId) REFERENCES projectCalculatorResults(id)
);
```

### MODIFIED Tables

**complianceSnapshots** - Add column
```sql
ALTER TABLE complianceSnapshots ADD COLUMN isDeterministic BOOLEAN DEFAULT FALSE;
ALTER TABLE complianceSnapshots ADD COLUMN reviewStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
```

---

## Testing Strategy (Week 2)

### Unit Tests
- [ ] DeterministicComplianceEngine rule evaluation
- [ ] CodeInterpreterService clause interpretation
- [ ] ProfessionalReviewService signature verification
- [ ] RuleVersionComparisonService version comparison

### Integration Tests
- [ ] Deterministic evaluation → Audit trail
- [ ] Professional review → Immutable snapshot
- [ ] Rule version migration → New calculation

### End-to-End Tests
- [ ] User submits scenario → Deterministic evaluation → Audit trail
- [ ] Engineer reviews → Signs → Immutable snapshot
- [ ] Compliance report generation with all details

---

## Rollback Plan (If Issues)

If any Week 2 feature breaks existing functionality:

1. **Deterministic Engine Issues**
   - Disable new procedure
   - Keep existing LLM analysis active
   - Rollback to checkpoint

2. **Professional Review Issues**
   - Comment out SignaturePad again
   - Disable review procedures
   - Rollback to checkpoint

3. **Rule Version Issues**
   - Disable new comparison/migration services
   - Keep existing version locking active
   - Rollback to checkpoint

---

## Success Criteria (Week 2)

- ✅ Deterministic evaluation working without breaking LLM analysis
- ✅ Professional review workflow functional
- ✅ All audit trails recording correctly
- ✅ Immutable snapshots created successfully
- ✅ All tests passing
- ✅ Zero regressions in existing functionality
- ✅ Code follows architectural principles
- ✅ Documentation updated

---

## Next Steps

1. **Implement DeterministicComplianceEngine** (Phase 3)
2. **Implement CodeInterpreterService** (Phase 4)
3. **Implement ProfessionalReviewService** (Phase 5)
4. **Test & Verify** (Phase 6)
5. **Save Checkpoint** (Phase 7)

**Estimated Time:** 40-50 hours
