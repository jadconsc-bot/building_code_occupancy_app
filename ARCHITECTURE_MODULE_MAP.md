# Building Code Compliance Platform - Module Dependency Map

**Created:** Week 1 Analysis  
**Status:** Comprehensive Codebase Analysis Complete  
**Purpose:** Document existing modules, dependencies, and safe extension points for Week 2-4 implementation

---

## System Architecture Overview

The platform is organized into **6 Layers** following the architectural directive:

```
Layer 1: User Interface (React Components)
    ↓
Layer 2: Input Parsing & Scenario Modeling
    ↓
Layer 3: Rule Evaluation Engine (Deterministic)
    ↓
Layer 4: Code Knowledge Database (NBC Rules)
    ↓
Layer 5: Reasoning & Pathway Generation
    ↓
Layer 6: Reporting & Explanation Engine
```

---

## Layer 1: User Interface Components

### Existing Components

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| Home | `client/src/pages/Home.tsx` | Landing page with occupancy search | ✅ Active |
| Compliance | `client/src/pages/Compliance.tsx` | Compliance analysis interface | ✅ Active |
| ComplianceAnalyzer | `client/src/components/ComplianceAnalyzer.tsx` | LLM-based analysis (to be refactored) | ⚠️ Needs Refactor |
| AuditTrailViewer | `client/src/components/AuditTrailViewer.tsx` | Audit trail display | ✅ Active |
| SignaturePad | `client/src/components/SignaturePad.tsx` | Digital signature capture | ⏳ Commented Out |
| RequiredLegalAcknowledgment | `client/src/components/RequiredLegalAcknowledgment.tsx` | Legal disclaimer modal | ✅ Active |

### Safe Extension Points (Layer 1)

- Create new pages for rule management UI
- Add professional review workflow UI
- Create rule evaluation result display component
- Add encryption status indicators

---

## Layer 2: Input Parsing & Scenario Modeling

### Existing Modules

| Module | Location | Purpose | Status |
|--------|----------|---------|--------|
| Phase 2 Router | `server/phase2Router.ts` | Scenario management | ✅ Active |
| Scenario History | `server/routers/phase2to5.ts` | Scenario versioning | ✅ Active |
| Persistence Manager | `server/persistenceManager.ts` | Data persistence | ✅ Active |

### Database Tables

| Table | Schema | Purpose |
|-------|--------|---------|
| `scenarios` | id, projectId, userId, name, inputData, version | Stores user scenarios |
| `scenarioHistory` | id, scenarioId, version, changes | Tracks scenario changes |

### Safe Extension Points (Layer 2)

- Add rule-based scenario validation
- Create scenario template system
- Add scenario comparison logic

---

## Layer 3: Rule Evaluation Engine

### Existing Modules

**CRITICAL LAYER - Contains core compliance logic**

| Module | Location | Purpose | Status | Dependencies |
|--------|----------|---------|--------|--------------|
| RuleService | `server/ruleService.ts` | Rule retrieval by version | ✅ Active | rulesDatabase table |
| RuleRouter | `server/ruleRouter.ts` | tRPC procedures for rules | ✅ Active | RuleService |
| ComplianceEngine | `server/complianceEngine.ts` | Compliance evaluation | ✅ Active | RuleService, VersionLockingSystem |
| ComplianceRouter | `server/complianceRouter.ts` | Compliance tRPC procedures | ✅ Active | ComplianceEngine |
| ComplianceAnalysisService | `server/services/ComplianceAnalysisService.ts` | LLM-based analysis (to refactor) | ⚠️ Needs Refactor | RuleService, invokeLLM |

### Database Tables

| Table | Schema | Purpose |
|-------|--------|---------|
| `rulesDatabase` | id, ruleCode, ruleName, codeVersion, jurisdiction, version, conditions | Stores NBC rules |
| `ruleChangeAudit` | id, ruleId, changeType, oldValue, newValue, timestamp | Tracks rule changes |

### Procedures Available

```typescript
// Get rules for specific code version
trpc.rule.getRulesForVersion(codeVersion: string, jurisdiction?: string)

// Get available code versions
trpc.rule.getAvailableCodeVersions()

// Get rule history
trpc.rule.getRuleHistory(ruleCode: string, codeVersion: string)

// Analyze compliance
trpc.compliance.analyzeCompliance(projectData: any, rulesetVersion: string)

// Create snapshot
trpc.compliance.createSnapshot(projectId: string, analysisResult: any)

// Get snapshot
trpc.compliance.getSnapshot(snapshotId: string)
```

### Safe Extension Points (Layer 3)

**CRITICAL: Only extend, never modify core logic**

- Add new rule evaluation procedures (without modifying existing ones)
- Create rule evaluation result formatter
- Add rule conflict detection
- Create rule applicability checker
- Add rule explanation generator (for LLM)

---

## Layer 4: Code Knowledge Database

### Existing Modules

| Module | Location | Purpose | Status |
|--------|----------|---------|--------|
| RuleService | `server/ruleService.ts` | Rule management | ✅ Active |
| RulesetVersionManager | `server/rulesetVersionManager.ts` | Version management | ✅ Active |

### Database Tables

| Table | Schema | Purpose | Records |
|-------|--------|---------|---------|
| `rulesDatabase` | id, ruleCode, ruleName, description, codeVersion, jurisdiction, version, conditions, exceptions, crossReferences | NBC rules storage | ~500+ rules |
| `ruleChangeAudit` | id, ruleId, changeType, oldValue, newValue, timestamp | Rule change history | Growing |

### Available NBC Versions

- NBC-2023-v1.0 (Active)
- NBC-2023-v1.1 (Registered)
- NBC-2025 (In development)

### Safe Extension Points (Layer 4)

- Add new rule versions
- Add rule metadata (e.g., complexity level, common mistakes)
- Create rule cross-reference system
- Add rule exception handling

---

## Layer 5: Reasoning & Pathway Generation

### Existing Modules

| Module | Location | Purpose | Status |
|--------|----------|---------|--------|
| VersionLockingSystem | `server/versionLockingSystem.ts` | Version locking for reproducibility | ✅ Active |
| CalculationBundleBuilder | `server/calculationBundleBuilder.ts` | Creates signed bundles | ✅ Active |
| SignedCalculationBundle | `server/signedCalculationBundle.ts` | Bundle signing and verification | ✅ Active |
| PersistenceManager | `server/persistenceManager.ts` | Calculation persistence | ✅ Active |

### Database Tables

| Table | Schema | Purpose |
|-------|--------|---------|
| `calculationVersions` | id, calculationResultId, versionNumber, parentVersionId, data, createdAt | Stores calculation versions |
| `projectCalculatorResults` | id, projectId, calculatorType, inputData, resultData, notes | Stores calculation results |

### Safe Extension Points (Layer 5)

- Add compliance pathway generation
- Create rule application sequence
- Add alternative compliance pathways
- Create compliance score calculation

---

## Layer 6: Reporting & Explanation Engine

### Existing Modules

| Module | Location | Purpose | Status |
|--------|----------|---------|--------|
| AuditTrailService | `server/auditTrailService.ts` | Audit logging | ✅ Active |
| AppendOnlyAuditLog | `server/appendOnlyAuditLog.ts` | Immutable audit records | ✅ Active |
| AuditTrail | `server/auditTrail.ts` | Audit trail management | ✅ Active |
| TimestampAuthority | `server/timestampAuthority.ts` | RFC 3161 timestamps | ✅ Active |

### Database Tables

| Table | Schema | Purpose |
|-------|--------|---------|
| `auditLog` | id, userId, action, resourceType, resourceId, changes, timestamp, ipAddress | Audit trail |
| `audit_log_immutable` | (same as auditLog) | Immutable copy with database triggers |

### Procedures Available

```typescript
// Log acknowledgment
trpc.audit.logAcknowledgment(acknowledgmentType, timestamp, userAgent)

// Get user acknowledgments
trpc.audit.getUserAcknowledgments()

// Get all acknowledgments (admin)
trpc.audit.getAllAcknowledgments()

// Verify audit integrity
trpc.audit.verifyAuditIntegrity()

// Generate defense report
trpc.audit.generateDefenseReport(projectId)
```

### Safe Extension Points (Layer 6)

- Add compliance report generation
- Create explanation templates
- Add rule citation formatting
- Create professional certification format

---

## Cross-Layer Dependencies

### Critical Dependency Chain

```
ComplianceAnalysisService
    ├─→ RuleService (Layer 4)
    ├─→ invokeLLM (Layer 6 - Code Interpretation)
    ├─→ VersionLockingSystem (Layer 5)
    └─→ CalculationBundleBuilder (Layer 5)

ComplianceRouter
    ├─→ ComplianceEngine (Layer 3)
    ├─→ ComplianceSnapshots (Layer 6)
    └─→ AuditTrailService (Layer 6)

RuleRouter
    ├─→ RuleService (Layer 4)
    └─→ RulesetVersionManager (Layer 4)
```

### Data Flow

```
User Input (Layer 1)
    ↓
Scenario Parsing (Layer 2)
    ↓
Rule Evaluation (Layer 3) ← Uses RuleService (Layer 4)
    ↓
Version Locking (Layer 5) ← Locks ruleset version
    ↓
Audit Trail (Layer 6) ← Records decision
    ↓
Report Generation (Layer 6) ← Includes LLM explanation
    ↓
User Display (Layer 1)
```

---

## Week 2 Implementation Plan

### Phase 1: Module Dependency Map (CURRENT)
- ✅ Identify all modules
- ✅ Document dependencies
- ✅ Identify safe extension points

### Phase 2: Deterministic Rule Engine (Week 2)
- Create `DeterministicComplianceEngine` (extends Layer 3)
- Implement rule-based evaluation logic
- Add compliance pathway generation
- Maintain backward compatibility with existing ComplianceEngine

### Phase 3: LLM Role Refactor (Week 2)
- Refactor `ComplianceAnalysisService` to use LLM for code interpretation only
- Create `CodeInterpreterService` for LLM
- Point to exact NBC clause references (e.g., 3.2.2.0)
- Remove LLM from compliance evaluation

### Phase 4: Professional Review Workflow (Week 2-3)
- Implement SignaturePad functionality
- Create professional review procedures
- Add digital signature verification
- Integrate with audit trail

### Phase 5: Testing & Verification (Week 3)
- Unit tests for new modules
- Integration tests across layers
- End-to-end compliance flow testing
- Audit trail verification

---

## Safe Extension Points Summary

### DO: Extend These Modules
- ✅ RuleService - Add new rule retrieval methods
- ✅ RuleRouter - Add new tRPC procedures
- ✅ ComplianceRouter - Add new compliance procedures
- ✅ AuditTrailService - Add new audit logging methods
- ✅ Create new services in Layer 3, 5, 6

### DON'T: Modify These Modules
- ❌ Existing RuleService methods - Extend instead
- ❌ Existing ComplianceEngine logic - Create new engine instead
- ❌ Database schema - Add new tables instead
- ❌ Existing tRPC procedures - Create new ones instead

### CRITICAL: Preserve These
- ✅ Version locking system (legal defensibility)
- ✅ Audit trail immutability
- ✅ Database triggers on audit_log_immutable
- ✅ Existing calculation versioning

---

## Next Steps

1. **Identify Safe Integration Points** (Phase 2)
2. **Implement Deterministic Rule Engine** (Phase 3)
3. **Refactor LLM to Code Interpretation** (Phase 4)
4. **Implement Professional Review** (Phase 5)
5. **Test & Verify** (Phase 6)
6. **Save Checkpoint** (Phase 7)

**Total Estimated Time:** 40-50 hours for Weeks 2-3
