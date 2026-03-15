# NBC Drawing Analyzer Integration Design

**Document Purpose:** Architectural design for integrating NBC drawing analyzer skill into existing compliance system following CODING_PROTOCOL.

**Status:** Phase 2 - Architecture Design

---

## Executive Summary

This document outlines the integration of the NBC drawing analyzer skill into the existing compliance analysis system. The integration maintains legal defensibility through deterministic evaluation, immutable audit trails, and professional review workflows while adding comprehensive NBC 2023 compliance analysis capabilities.

**Key Objectives:**
1. Integrate NBC drawing analyzer skill without breaking existing functionality
2. Maintain deterministic evaluation and audit trail requirements
3. Add structured compliance scoring (0-100 scale)
4. Implement comprehensive drawing analysis workflow
5. Ensure all outputs are legally defensible

---

## Current System Architecture

### Existing Components

| Component | Purpose | Status |
|---|---|---|
| `complianceEngine.ts` | Deterministic rule evaluator | ✅ Production |
| `complianceRouter.ts` | tRPC procedures | ✅ Production |
| `ComplianceAnalysisService` | Service layer | ✅ Production |
| `CodeInterpreterService` | LLM clause interpretation | ✅ Production |
| `ProfessionalReviewService` | Professional review workflow | ✅ Production |

### Existing Workflow

```
User Input → ComplianceAnalysisService → ComplianceEngine → 
Rule Trace → Professional Review → Digital Signature
```

### Existing Strengths

- ✅ Deterministic evaluation with full rule trace
- ✅ Immutable audit trail support
- ✅ Professional review workflow
- ✅ Digital signature support
- ✅ Legal defensibility built-in

### Existing Gaps

- ❌ No structured drawing analysis framework
- ❌ No compliance scoring system
- ❌ No NBC-specific analysis procedures
- ❌ No drawing-specific rule sets
- ❌ No structural/fire safety/connection analysis

---

## NBC Drawing Analyzer Integration Architecture

### Three-Layer Architecture (Following CODING_PROTOCOL)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  - Drawing upload UI                                        │
│  - Analysis progress tracking                               │
│  - Compliance score display                                 │
│  - Issues & violations list                                 │
│  - Recommendations display                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)                 │
│  - DrawingAnalysisService (orchestration)                   │
│  - StructuralAnalysisService (load path, bracing)          │
│  - FireSafetyAnalysisService (assembly, fireblocking)      │
│  - ConnectionAnalysisService (fasteners, capacity)         │
│  - ComplianceScoringService (0-100 calculation)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           Repository Layer (Data Access)                    │
│  - DrawingAnalysisRepository (CRUD)                         │
│  - NBCRuleRepository (rule versioning)                      │
│  - ComplianceAuditRepository (immutable audit trail)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (Persistence)                       │
│  - drawingAnalyses table                                    │
│  - nbcRules table (versioned)                               │
│  - complianceAuditTrail table (immutable)                   │
└─────────────────────────────────────────────────────────────┘
```

### New Service Layer Components

**1. DrawingAnalysisService**
- Orchestrates entire analysis workflow
- Coordinates sub-services
- Manages audit trail
- Implements caching strategy

**2. StructuralAnalysisService**
- Analyzes load path continuity
- Verifies lateral bracing
- Checks member sizing
- Assesses connection capacity

**3. FireSafetyAnalysisService**
- Verifies assembly rating
- Checks fireblocking details
- Validates penetration sealing
- Assesses fire separation

**4. ConnectionAnalysisService**
- Verifies fastener specifications
- Checks edge distance & spacing
- Validates connection capacity
- Assesses connection details

**5. ComplianceScoringService**
- Calculates compliance score (0-100)
- Classifies issues (critical/major/minor)
- Generates compliance level (approved/conditional/revision/rejected)
- Produces compliance report

### New Repository Layer Components

**1. DrawingAnalysisRepository**
- CRUD operations for drawing analyses
- Query by project, user, date range
- Retrieve analysis history

**2. NBCRuleRepository**
- Versioned NBC rules storage
- Query rules by section, jurisdiction
- Track rule changes over time

**3. ComplianceAuditRepository**
- Immutable audit trail (append-only)
- Never update or delete records
- Track all analysis operations
- Support legal discovery

### New Data Models

**drawingAnalyses Table**
```sql
CREATE TABLE drawingAnalyses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  userId INT NOT NULL,
  drawingUrl TEXT NOT NULL,
  analysisType ENUM('structural', 'fire-safety', 'connections', 'comprehensive'),
  complianceScore INT,
  complianceLevel ENUM('approved', 'conditional', 'revision', 'rejected'),
  structuralStatus JSON,
  fireSafetyStatus JSON,
  connectionStatus JSON,
  issues JSON,
  recommendations JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**nbcRules Table (Versioned)**
```sql
CREATE TABLE nbcRules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ruleId VARCHAR(50) UNIQUE NOT NULL,
  section VARCHAR(20) NOT NULL,
  clause VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('structural', 'fire-safety', 'connections', 'materials'),
  jurisdiction VARCHAR(50),
  ruleVersion INT DEFAULT 1,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  INDEX (section),
  INDEX (category),
  INDEX (jurisdiction)
);
```

**complianceAuditTrail Table (Immutable)**
```sql
CREATE TABLE complianceAuditTrail (
  id INT PRIMARY KEY AUTO_INCREMENT,
  analysisId INT NOT NULL,
  userId INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSON NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysisId) REFERENCES drawingAnalyses(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (analysisId),
  INDEX (timestamp)
);
```

---

## Integration Points

### 1. tRPC Router Enhancement

**New Procedures:**
```typescript
// Analyze drawing with NBC framework
analyzeDrawingNBC: protectedProcedure
  .input(drawingAnalysisInput)
  .mutation(async ({ ctx, input }) => {
    // Orchestrate analysis
  })

// Get compliance score
getComplianceScore: protectedProcedure
  .input(z.object({ analysisId: z.number() }))
  .query(async ({ ctx, input }) => {
    // Return compliance score & breakdown
  })

// Get analysis issues
getAnalysisIssues: protectedProcedure
  .input(z.object({ analysisId: z.number() }))
  .query(async ({ ctx, input }) => {
    // Return critical/major/minor issues
  })

// Get compliance report
getComplianceReport: protectedProcedure
  .input(z.object({ analysisId: z.number() }))
  .query(async ({ ctx, input }) => {
    // Return full compliance report
  })
```

### 2. Existing Service Integration

**ComplianceAnalysisService Enhancement:**
- Add `analyzeDrawingNBC()` method
- Delegate to DrawingAnalysisService
- Maintain existing `analyzeDrawing()` for backward compatibility

### 3. Audit Trail Integration

**Immutable Audit Trail:**
- Every analysis creates audit trail entry
- Every issue identified creates audit entry
- Every compliance score calculation creates entry
- Entries are never updated or deleted
- Supports legal discovery and compliance audits

### 4. Professional Review Integration

**Existing ProfessionalReviewService:**
- Reuse for NBC analysis results
- Support digital signatures
- Maintain professional accountability

---

## Implementation Phases

### Phase 3: Service Layer Implementation

**Deliverables:**
- DrawingAnalysisService (orchestration)
- StructuralAnalysisService (load path, bracing, members)
- FireSafetyAnalysisService (assembly, fireblocking, penetrations)
- ConnectionAnalysisService (fasteners, edge distance, capacity)
- ComplianceScoringService (0-100 scoring)

**Testing:**
- Unit tests for each service
- Integration tests for service interactions
- Mock drawing data for testing

### Phase 4: Repository Layer Implementation

**Deliverables:**
- DrawingAnalysisRepository (CRUD)
- NBCRuleRepository (versioned rules)
- ComplianceAuditRepository (immutable audit trail)

**Testing:**
- Database schema validation
- CRUD operation tests
- Audit trail immutability tests

### Phase 5: Frontend Integration

**Deliverables:**
- Drawing upload component
- Analysis progress display
- Compliance score visualization
- Issues & violations list
- Recommendations display
- Report generation

**Testing:**
- UI component tests
- tRPC hook integration tests
- Error handling tests

### Phase 6: Comprehensive Testing

**Deliverables:**
- Unit test suite (all services)
- Integration test suite (service interactions)
- E2E test suite (full workflow)
- Performance tests (large drawings)

**Testing:**
- Deterministic evaluation verification
- Audit trail end-to-end testing
- Professional review workflow testing

---

## Legal Defensibility Checklist

| Requirement | Implementation | Status |
|---|---|---|
| Deterministic evaluation | ComplianceEngine + NBC rules | ✅ |
| Immutable audit trail | complianceAuditTrail table | ✅ |
| Rule versioning | nbcRules table with version | ✅ |
| Professional review | ProfessionalReviewService | ✅ |
| Digital signatures | Existing signature support | ✅ |
| Compliance scoring | ComplianceScoringService | 🔄 |
| Issue tracking | drawingAnalyses.issues JSON | 🔄 |
| Recommendations | drawingAnalyses.recommendations JSON | 🔄 |
| User disclaimer | Frontend disclaimer component | 🔄 |
| Analysis traceability | Full audit trail | ✅ |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Breaking existing functionality | High | Maintain backward compatibility, extensive testing |
| Non-deterministic results | Critical | Use deterministic rule engine only |
| Audit trail gaps | Critical | Append-only audit trail, no updates/deletes |
| Missing compliance rules | High | Comprehensive NBC rule library |
| Incorrect scoring | High | Thorough testing, senior review |
| Performance issues | Medium | Caching strategy, query optimization |

---

## Success Criteria

- ✅ All existing functionality remains operational
- ✅ NBC drawing analysis produces consistent results
- ✅ Compliance scoring is accurate (0-100)
- ✅ Audit trail is complete and immutable
- ✅ Professional review workflow functions
- ✅ All tests pass (unit, integration, E2E)
- ✅ Senior coder review and approval
- ✅ No breaking changes to existing APIs

---

**Document Status:** Ready for Phase 3 Implementation

**Next Review:** After Phase 3 Service Layer Implementation
