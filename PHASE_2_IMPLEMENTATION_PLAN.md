# Phase 2: Service Layer Implementation - Following CODING_PROTOCOL 10-Step Workflow

**Status:** Ready for Implementation  
**Based On:** CODING_PROTOCOL.md (Mandatory 10-Step Protocol)  
**Senior Coder Instructions:** CodeComply Implementation Instructions  
**Estimated Effort:** 16-20 hours

---

## Step 1: PROBLEM DEFINITION ✅

### Feature Description

Implement a two-stage drawing analysis pipeline that separates LLM-based drawing data extraction from deterministic rule-based compliance evaluation. The service layer encapsulates all business logic for drawing analysis, including LLM extraction, rule evaluation, compliance scoring, and audit trail recording.

### User Flow

1. User uploads construction drawing (PDF/image)
2. System computes SHA-256 hash and stores immutable snapshot in S3
3. LLM extracts structured drawing data (members, dimensions, materials, fireblocking, etc.)
4. Extracted data is validated against DrawingData Zod schema
5. ComplianceEngine evaluates extracted data against NBC rules (deterministic)
6. Compliance score is calculated (0-100)
7. Issues and recommendations are generated
8. Analysis status is set to DRAFT
9. Professional review is required before analysis is valid
10. Professional accepts/rejects analysis with signature

### Data Flow

```
User Upload (PDF/Image)
    ↓
[DrawingAnalysisService.uploadDrawing]
    ├─ Compute SHA-256 hash
    ├─ Store immutable snapshot in S3
    ├─ Create drawingAnalyses record
    └─ Record audit event (DRAWING_UPLOADED)
    ↓
[DrawingDataService.extractDrawingData]
    ├─ Send to Claude Vision API
    ├─ Receive structured JSON
    ├─ Validate against DrawingData schema
    ├─ Store in drawingDataExtractions table
    └─ Record audit event (EXTRACTION_COMPLETED)
    ↓
[ComplianceEvaluationService.evaluateCompliance]
    ├─ Load nbcRules from database
    ├─ Evaluate each rule deterministically
    ├─ Store results in complianceEvaluationResults
    ├─ Calculate compliance score
    ├─ Generate issues and recommendations
    ├─ Update drawingAnalyses.analysisStatus = DRAFT
    └─ Record audit event (EVALUATION_COMPLETED)
    ↓
Professional Review (Manual)
    ├─ Professional reviews analysis
    ├─ Professional accepts or rejects
    ├─ Professional signs digitally
    ├─ Update drawingAnalyses.analysisStatus = VALID/REJECTED
    └─ Record audit event (PROFESSIONAL_ACCEPTED/REJECTED)
```

### Success Criteria

- ✅ LLM extraction produces valid DrawingData objects
- ✅ Rule evaluation is deterministic and reproducible
- ✅ Compliance score accurately reflects NBC compliance
- ✅ All audit events are recorded with full credentials
- ✅ Drawing integrity is verified via hash
- ✅ Professional review workflow is enforced
- ✅ All error states are handled gracefully
- ✅ System is legally defensible

### Edge Cases

1. **Malformed Drawing** - LLM cannot extract data from corrupted/unclear drawing
   - **Handling:** Catch LLM error, set analysisStatus = DRAFT, record error in audit trail, notify user

2. **Insufficient Rule Coverage** - System doesn't have enough rules to evaluate drawing
   - **Handling:** Block analysis, throw error, require rule seeding before proceeding

3. **Network Timeout** - LLM API times out during extraction
   - **Handling:** Retry with exponential backoff (3 attempts), log timeout, notify user

4. **Hash Mismatch** - Drawing snapshot hash doesn't match stored hash (file tampering)
   - **Handling:** Block analysis, log security event, notify administrator

5. **Professional License Invalid** - Professional attempting review with invalid/expired license
   - **Handling:** Block review, verify license with professional association, notify professional

6. **Concurrent Analysis** - User uploads same drawing twice before first analysis completes
   - **Handling:** Check for in-progress analysis, prevent duplicate uploads

---

## Step 2: UX–BACKEND INTEGRATION CONTRACT ✅

### API Endpoints

#### 1. Upload Drawing
```
POST /api/trpc/drawingAnalysis.uploadDrawing
Content-Type: multipart/form-data

Request:
{
  projectId: number (required)
  file: File (required, PDF or image)
  disclaimerAcknowledged: boolean (required, must be true)
  disclaimerVersion: string (required, e.g., "1.0")
}

Response (Success):
{
  analysisId: number
  drawingUrl: string
  drawingHash: string
  analysisStatus: "DRAFT"
  createdAt: ISO8601 timestamp
}

Response (Error):
{
  code: "UNPROCESSABLE_CONTENT" | "BAD_REQUEST" | "FORBIDDEN"
  message: "User-friendly error message"
  details: { field: "error description" }
}

Error Codes:
- 400: Missing required fields, file too large (>50MB), invalid file type
- 403: Disclaimer not acknowledged, user not authenticated
- 409: Duplicate analysis in progress
- 413: File size exceeds limit
- 422: File is corrupted or unreadable
```

#### 2. Get Analysis Status
```
GET /api/trpc/drawingAnalysis.getStatus?analysisId=123

Response (Success):
{
  analysisId: number
  projectId: number
  analysisStatus: "DRAFT" | "UNDER_REVIEW" | "VALID" | "REJECTED"
  complianceScore: number (0-100)
  complianceLevel: "approved" | "conditional" | "revision" | "rejected"
  issues: Issue[]
  recommendations: string[]
  extractedData: DrawingData (if extraction succeeded)
  evaluationResults: EvaluationResult[] (if evaluation succeeded)
  validatedAt: ISO8601 timestamp | null
  validatedByLicenseNumber: string | null
  createdAt: ISO8601 timestamp
  updatedAt: ISO8601 timestamp
}

Response (Error):
{
  code: "NOT_FOUND" | "FORBIDDEN"
  message: "User-friendly error message"
}
```

#### 3. Get Audit Trail
```
GET /api/trpc/drawingAnalysis.getAuditTrail?analysisId=123

Response (Success):
{
  events: AuditEvent[]
}

AuditEvent:
{
  id: number
  analysisId: number
  action: "DRAWING_UPLOADED" | "EXTRACTION_COMPLETED" | "EVALUATION_COMPLETED" | etc
  userEmail: string
  userFullName: string
  professionalLicenseNumber: string | null
  jurisdiction: string
  ipAddress: string
  sessionId: string
  timestamp: ISO8601 timestamp
  details: JSON
}
```

### UI States

| State | Condition | Display |
|-------|-----------|---------|
| **UPLOADING** | File being uploaded | Progress bar, "Uploading..." |
| **EXTRACTING** | LLM extracting drawing data | Spinner, "Analyzing drawing..." |
| **EVALUATING** | Rule engine evaluating | Spinner, "Evaluating compliance..." |
| **DRAFT** | Analysis complete, awaiting review | Summary, "Awaiting professional review" |
| **UNDER_REVIEW** | Professional reviewing | Summary, "Under professional review" |
| **VALID** | Professional accepted | Summary, "Approved by [Professional Name]" |
| **REJECTED** | Professional rejected | Summary, "Rejected - see comments" |
| **ERROR** | Any step failed | Error message, "Retry" button |

### Validation Rules

**Frontend Validation:**
- File type: PDF, PNG, JPG, JPEG only
- File size: Max 50MB
- Disclaimer: Must be checked
- Project: Must be selected

**Backend Validation:**
- File MIME type verified
- File magic bytes verified (not just extension)
- SHA-256 hash computed and verified
- DrawingData schema validation (Zod)
- Rule coverage validation (minimum rules required)
- User authentication verified
- User authorization verified (owns project)
- Disclaimer version matches current version

### Error Handling

| Scenario | User Message | Technical Log |
|----------|--------------|---|
| File too large | "File exceeds 50MB limit. Please compress and try again." | `FILE_SIZE_EXCEEDED: 125MB` |
| Invalid file type | "Please upload a PDF or image file (PNG, JPG)." | `INVALID_MIME_TYPE: application/msword` |
| Corrupted file | "File appears to be corrupted. Please verify and try again." | `FILE_MAGIC_BYTES_MISMATCH` |
| LLM timeout | "Drawing analysis took too long. Please try again." | `LLM_TIMEOUT_AFTER_3_RETRIES` |
| Insufficient rules | "System not ready for analysis. Please contact support." | `INSUFFICIENT_RULE_COVERAGE: 5 rules < 20 required` |
| Hash mismatch | "Security verification failed. Please contact support." | `HASH_MISMATCH: stored != computed` |

---

## Step 3: ARCHITECTURE & FILE STRUCTURE ✅

### Folder Structure

```
server/
├── services/
│   ├── DrawingAnalysisService.ts      # Main orchestration service
│   ├── DrawingDataService.ts          # LLM extraction service
│   ├── ComplianceEvaluationService.ts # Rule engine service
│   └── AuditTrailService.ts           # Audit logging service
├── repositories/
│   ├── DrawingAnalysisRepository.ts   # Data access for analyses
│   ├── DrawingDataRepository.ts       # Data access for extractions
│   ├── ComplianceRuleRepository.ts    # Data access for rules
│   └── AuditTrailRepository.ts        # Data access for audit events
├── routers/
│   └── drawingAnalysisRouter.ts       # tRPC procedures
├── _core/
│   ├── llm.ts                         # LLM integration (existing)
│   ├── monitoring.ts                  # Logging/monitoring (existing)
│   └── cache.ts                       # Caching (existing)
└── validators/
    ├── DrawingData.schema.ts          # Zod schema for extracted data
    └── ComplianceRule.schema.ts       # Zod schema for rules

client/src/
├── pages/
│   └── DrawingAnalysis.tsx            # Main page
├── components/
│   ├── DrawingUploadGate.tsx          # Disclaimer + upload
│   ├── DrawingAnalysisStatus.tsx      # Status display
│   ├── ComplianceReport.tsx           # Results display
│   ├── ProfessionalReviewPanel.tsx    # Professional review UI
│   └── AuditTrailViewer.tsx           # Audit trail display
└── hooks/
    └── useDrawingAnalysis.ts          # Custom hook for analysis
```

### Component Hierarchy

```
DrawingAnalysisPage
├── DrawingUploadGate (Disclaimer gate)
│   └── DisclaimerCheckbox
│       └── FileUploadInput
├── DrawingAnalysisStatus (Status display)
│   ├── ProgressIndicator
│   ├── ComplianceScore
│   └── IssuesList
├── ComplianceReport (Results)
│   ├── SummarySection
│   ├── IssuesSection
│   └── RecommendationsSection
├── ProfessionalReviewPanel (Review UI)
│   ├── LicenseVerification
│   ├── ReviewNotes
│   └── AcceptRejectButtons
└── AuditTrailViewer (Audit log)
    └── AuditEventList
```

### Service Layer Design

**DrawingAnalysisService (Orchestrator)**
```
uploadDrawing(projectId, file, disclaimerVersion)
  ├─ Validate input
  ├─ Compute hash
  ├─ Store snapshot
  ├─ Create record
  ├─ Record audit event
  └─ Return analysisId

analyzeDrawing(analysisId)
  ├─ Extract drawing data
  ├─ Evaluate compliance
  ├─ Calculate score
  ├─ Update status
  └─ Return results

getAnalysisStatus(analysisId)
  ├─ Fetch analysis record
  ├─ Fetch extraction results
  ├─ Fetch evaluation results
  └─ Return combined view
```

**DrawingDataService (LLM Extraction)**
```
extractDrawingData(drawingUrl)
  ├─ Validate URL
  ├─ Call Claude Vision API
  ├─ Validate response schema
  ├─ Store extraction result
  └─ Return DrawingData

validateDrawingData(data)
  ├─ Validate against Zod schema
  ├─ Check required fields
  └─ Return validation result
```

**ComplianceEvaluationService (Rule Engine)**
```
evaluateCompliance(drawingData)
  ├─ Load active rules
  ├─ Evaluate each rule
  ├─ Aggregate results
  ├─ Calculate score
  ├─ Generate issues
  └─ Return ComplianceResult

evaluateRule(rule, drawingData)
  ├─ Check required fields
  ├─ Apply evaluation logic
  └─ Return result
```

### Repository Pattern

**DrawingAnalysisRepository**
```
create(projectId, drawingUrl, drawingHash, drawingSnapshotKey)
findById(analysisId)
updateStatus(analysisId, status)
getByProjectId(projectId)
```

**DrawingDataRepository**
```
create(analysisId, extractedData, modelVersion)
findByAnalysisId(analysisId)
```

**ComplianceRuleRepository**
```
findAll(filters)
findById(ruleId)
findActiveRules()
countByCategory(category)
```

**AuditTrailRepository**
```
record(analysisId, action, credentials, details)
getByAnalysisId(analysisId)
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `DrawingAnalysisService` |
| Methods | camelCase | `extractDrawingData()` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE_MB` |
| Types | PascalCase | `DrawingData`, `ComplianceResult` |
| Files | PascalCase.ts | `DrawingAnalysisService.ts` |
| Folders | camelCase | `services/`, `repositories/` |
| Variables | camelCase | `analysisId`, `drawingHash` |
| Booleans | is/has prefix | `isValid`, `hasErrors` |

---

## Step 4: CODING PLAN ✅

### Implementation Steps

**Phase 2A: Schema Migrations (2 hours)**
1. Create migration file: `0001_add_nbc_analyzer_schema.sql`
2. Run `pnpm db:push` to apply migrations
3. Verify all tables created in database
4. Update Drizzle schema types

**Phase 2B: Validators & Types (3 hours)**
1. Create `DrawingData.schema.ts` with Zod validation
2. Create `ComplianceRule.schema.ts` with Zod validation
3. Create TypeScript types for all data structures
4. Test schema validation with sample data

**Phase 2C: Repository Layer (4 hours)**
1. Create `DrawingAnalysisRepository.ts`
2. Create `DrawingDataRepository.ts`
3. Create `ComplianceRuleRepository.ts`
4. Create `AuditTrailRepository.ts`
5. Write unit tests for each repository

**Phase 2D: Service Layer (6 hours)**
1. Create `DrawingAnalysisService.ts` (orchestrator)
2. Create `DrawingDataService.ts` (LLM extraction)
3. Create `ComplianceEvaluationService.ts` (rule engine)
4. Create `AuditTrailService.ts` (audit logging)
5. Implement error handling in all services
6. Write unit tests for each service

**Phase 2E: tRPC Router (3 hours)**
1. Create `drawingAnalysisRouter.ts`
2. Implement procedures: uploadDrawing, getStatus, getAuditTrail
3. Add input validation with Zod
4. Add error handling
5. Write integration tests

**Phase 2F: Testing & Validation (2 hours)**
1. Run all unit tests
2. Run integration tests
3. Verify database migrations
4. Check TypeScript compilation
5. Verify audit trail recording

### Key Functions

**DrawingAnalysisService.uploadDrawing**
```typescript
static async uploadDrawing(
  projectId: number,
  file: Buffer,
  filename: string,
  disclaimerVersion: string,
  ctx: Context
): Promise<UploadResult> {
  // 1. Validate input
  // 2. Compute SHA-256 hash
  // 3. Store immutable snapshot in S3
  // 4. Create drawingAnalyses record
  // 5. Record audit event
  // 6. Return analysisId
}
```

**DrawingDataService.extractDrawingData**
```typescript
static async extractDrawingData(
  drawingUrl: string,
  analysisId: number
): Promise<DrawingData> {
  // 1. Call Claude Vision API
  // 2. Validate response schema
  // 3. Store extraction result
  // 4. Return DrawingData
}
```

**ComplianceEvaluationService.evaluateCompliance**
```typescript
static async evaluateCompliance(
  drawingData: DrawingData,
  analysisId: number
): Promise<ComplianceResult> {
  // 1. Load active rules
  // 2. Evaluate each rule (deterministic)
  // 3. Store evaluation results
  // 4. Calculate compliance score
  // 5. Generate issues and recommendations
  // 6. Return ComplianceResult
}
```

### Error Handling Strategy

**Validation Errors (400)**
- Input validation fails (Zod schema)
- File validation fails (MIME type, magic bytes)
- Schema validation fails (DrawingData)

**Authentication Errors (401)**
- User not authenticated
- Session expired

**Authorization Errors (403)**
- User doesn't own project
- User doesn't have required role

**Not Found Errors (404)**
- Analysis not found
- Project not found
- Rule not found

**Conflict Errors (409)**
- Duplicate analysis in progress
- Hash mismatch (file tampering)

**Unprocessable Entity Errors (422)**
- File corrupted
- LLM extraction failed
- Rule coverage insufficient

**Server Errors (500)**
- Database error
- LLM API error
- S3 storage error

### Logging Strategy

**Log Levels:**
- `INFO`: User actions (upload, review, export)
- `WARN`: Recoverable errors (LLM timeout, retry)
- `ERROR`: Unrecoverable errors (database failure, security issue)

**Log Events:**
```
[INFO] drawingAnalysis.upload: userId=123, projectId=456, fileSize=2.5MB
[INFO] drawingAnalysis.extraction: analysisId=789, model=claude-vision-4
[INFO] drawingAnalysis.evaluation: analysisId=789, score=85, issues=3
[WARN] drawingAnalysis.llmTimeout: analysisId=789, attempt=2/3
[ERROR] drawingAnalysis.hashMismatch: analysisId=789, security alert
```

---

## Step 5: EDGE CASES ✅

| Edge Case | Handling | Test Scenario |
|-----------|----------|---|
| Malformed drawing | Catch LLM error, set status=DRAFT, notify user | Upload corrupted PDF |
| Insufficient rules | Block analysis, throw error | Run before rule seeding |
| LLM timeout | Retry 3x with backoff, then fail | Mock LLM timeout |
| Hash mismatch | Block analysis, log security event | Modify snapshot file |
| Invalid license | Block review, verify with association | Use expired license |
| Concurrent uploads | Prevent duplicate, return existing | Upload same file twice |
| Large file | Reject >50MB, suggest compression | Upload 100MB file |
| Network error | Retry with exponential backoff | Simulate network failure |
| Database error | Log error, return 500, notify admin | Mock DB connection failure |
| Missing rules | Validate coverage before analysis | Delete rules from DB |

---

## Step 6: TESTING PLAN ✅

### Unit Tests

**DrawingAnalysisService.test.ts**
- ✅ uploadDrawing: valid file
- ✅ uploadDrawing: file too large
- ✅ uploadDrawing: invalid MIME type
- ✅ uploadDrawing: hash computed correctly
- ✅ uploadDrawing: snapshot stored in S3
- ✅ uploadDrawing: audit event recorded

**DrawingDataService.test.ts**
- ✅ extractDrawingData: valid drawing
- ✅ extractDrawingData: malformed drawing
- ✅ extractDrawingData: LLM timeout (retry 3x)
- ✅ extractDrawingData: schema validation passes
- ✅ extractDrawingData: schema validation fails

**ComplianceEvaluationService.test.ts**
- ✅ evaluateCompliance: all rules pass
- ✅ evaluateCompliance: some rules fail
- ✅ evaluateCompliance: score calculated correctly
- ✅ evaluateCompliance: issues generated correctly
- ✅ evaluateCompliance: insufficient rule coverage

### Integration Tests

**drawingAnalysisRouter.test.ts**
- ✅ uploadDrawing: end-to-end flow
- ✅ getStatus: returns correct status
- ✅ getAuditTrail: returns all events
- ✅ uploadDrawing → extraction → evaluation
- ✅ Error handling: proper error codes

### Manual Tests

- ✅ Upload drawing via UI
- ✅ Monitor extraction progress
- ✅ View compliance report
- ✅ Verify audit trail
- ✅ Test with slow network
- ✅ Test with large file
- ✅ Test error scenarios

---

## Step 7: FINAL CODE

**Deliverables:**
1. ✅ Migration file: `drizzle/migrations/0001_add_nbc_analyzer_schema.sql`
2. ✅ Validators: `server/validators/DrawingData.schema.ts`
3. ✅ Repositories: `server/repositories/*.ts` (4 files)
4. ✅ Services: `server/services/*.ts` (4 files)
5. ✅ Router: `server/routers/drawingAnalysisRouter.ts`
6. ✅ Tests: `server/**/*.test.ts` (comprehensive)
7. ✅ Documentation: Updated README and API docs

---

## Step 8: SELF-REVIEW CHECKLIST ✅

Before deployment, verify:

- [ ] All 10 steps completed
- [ ] Problem definition documented
- [ ] API contract defined
- [ ] Architecture documented
- [ ] Code follows naming conventions
- [ ] Service layer implemented
- [ ] Repository pattern implemented
- [ ] All inputs validated with Zod
- [ ] All error states handled
- [ ] All edge cases tested
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Manual UX tests completed
- [ ] No console errors or warnings
- [ ] No TODOs left in code
- [ ] No type errors
- [ ] Audit trail working end-to-end
- [ ] Hash verification working
- [ ] Professional review workflow enforced
- [ ] Documentation updated
- [ ] Deployment plan documented

---

## Step 9: DEPLOYMENT READINESS ✅

**Feature Flags:**
- Can analysis be toggled on/off? YES (feature flag in router)
- Can professional review be skipped? NO (enforced by middleware)

**Environment Variables:**
- `LLM_MODEL_VERSION` - Claude model to use
- `MAX_FILE_SIZE_MB` - Maximum upload size
- `RULE_COVERAGE_MINIMUM` - Minimum rules required
- `LLM_TIMEOUT_SECONDS` - LLM API timeout
- `LLM_RETRY_ATTEMPTS` - Number of retries

**API Keys:**
- Claude API key (from env)
- S3 credentials (from env)

**Logs:**
- All operations logged with monitoring.log()
- All errors logged with monitoring.error()
- Audit trail immutable in database

**Rollback Plan:**
- Revert migration if issues found
- Disable feature flag
- Notify users of temporary unavailability

**Monitoring:**
- Track upload success rate
- Track extraction success rate
- Track evaluation success rate
- Track professional review rate
- Alert on errors >5% failure rate

**Documentation:**
- API documentation
- User guide for drawing upload
- Professional review guide
- Troubleshooting guide

---

## Step 10: CONTINUOUS IMPROVEMENT ✅

**Post-Implementation Reflection:**
- What slowed development?
- What patterns repeated?
- What can be automated?
- How can the protocol be improved?

---

**Phase 2 Status:** Ready for Implementation  
**Next Step:** Execute Phase 2A (Schema Migrations)  
**Follows:** CODING_PROTOCOL 10-Step Workflow  
**Maintains:** Legal Defensibility & Audit Trail
