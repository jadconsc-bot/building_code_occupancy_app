# Phase 2B: DrawingDataService Implementation Plan
## Following CODING_PROTOCOL 10-Step Workflow

**Status:** Phase 1 - Problem Definition & API Contract  
**Date:** March 15, 2026  
**Author:** Manus AI  
**Compliance:** Senior Coder Requirements + CODING_PROTOCOL

---

## 1. PROBLEM DEFINITION ✅

### Feature Description
DrawingDataService extracts structured drawing data from PDF/image files using Claude Vision LLM, converting unstructured visual content into a typed, validated data structure. This service implements the **first stage of the two-stage pipeline**: LLM extracts drawing data → Rule engine evaluates compliance.

### User Flow
1. User uploads drawing (PDF/PNG/JPEG)
2. DrawingAnalysisService calculates hash and stores snapshot
3. DrawingDataService receives drawing buffer
4. Claude Vision LLM analyzes drawing and extracts structured data
5. Zod schema validates extracted data
6. Validated data returned to orchestrator
7. ComplianceEngine (rule engine) evaluates against NBC rules
8. Results recorded in audit trail

### Data Flow
```
Drawing File (Buffer)
    ↓
DrawingDataService.extractDrawingData()
    ↓
Claude Vision API (LLM extraction)
    ↓
Structured DrawingData (JSON)
    ↓
Zod Schema Validation
    ↓
Validated DrawingData | ValidationError
    ↓
Audit Trail Recording (EXTRACTION_COMPLETED)
    ↓
ComplianceEngine (Rule Evaluation)
```

### Success Criteria
- ✅ Extracts members (beams, columns, studs, headers)
- ✅ Extracts dimensions (spans, heights, depths)
- ✅ Extracts assembly types (wall, roof, floor)
- ✅ Extracts connection details (fasteners, edge distances)
- ✅ Extracts material specifications (steel grade, wood species)
- ✅ Validates all extracted data against Zod schema
- ✅ Records extraction in audit trail with model version
- ✅ Handles extraction failures gracefully
- ✅ Extraction confidence score captured
- ✅ LLM output never influences compliance decisions

### Edge Cases
1. **Illegible Drawing** - LLM cannot read annotations → confidence < 0.5 → flag for manual review
2. **Partial Drawing** - Only section visible → extraction incomplete → flag as CONDITIONAL
3. **Non-Standard Notation** - Custom symbols not in training data → LLM misinterprets → confidence low
4. **Multiple Sheets** - Only first page processed → user must upload individual sheets
5. **Corrupted PDF** - File unreadable → extraction fails → user error message

---

## 2. UX–BACKEND INTEGRATION CONTRACT ✅

### API Endpoint: extractDrawingData

**Method:** Internal Service Call (not exposed as tRPC endpoint)

**Input:**
```typescript
interface DrawingDataExtractionInput {
  analysisId: number;
  drawingBuffer: Buffer;
  drawingMimeType: string; // 'application/pdf' | 'image/png' | 'image/jpeg'
  analysisType: 'structural' | 'fire-safety' | 'connections' | 'comprehensive';
  credentials: UserCredentials; // For audit trail
}
```

**Output (Success):**
```typescript
interface DrawingDataExtractionResult {
  extractionId: number;
  analysisId: number;
  extractedData: {
    members: StructuralMember[];
    assemblies: Assembly[];
    connections: Connection[];
    materials: MaterialSpecification[];
    dimensions: Dimension[];
    annotations: Annotation[];
  };
  extractionModel: string; // e.g., 'claude-vision-4'
  extractionConfidence: number; // 0.0-1.0
  extractedAt: Date; // Server-generated UTC
}
```

**Output (Error):**
```typescript
interface ExtractionError {
  code: 'EXTRACTION_FAILED' | 'VALIDATION_FAILED' | 'CONFIDENCE_TOO_LOW';
  message: string; // User-friendly
  details: {
    confidence?: number;
    validationErrors?: ZodError[];
    llmResponse?: string; // For debugging
  };
}
```

### Validation Rules

**Frontend Validation (UX layer):**
- File size < 50MB
- MIME type supported
- File not corrupted (basic check)

**Backend Validation (API layer):**
- Buffer not empty
- MIME type matches actual content
- LLM extraction confidence > 0.5 (warn if lower)
- Zod schema validation passes
- All required fields present
- Extracted data is deterministic (same drawing → same extraction)

### Error Handling

| Scenario | Error Code | Message | Action |
|----------|-----------|---------|--------|
| LLM API timeout | EXTRACTION_FAILED | "Drawing analysis took too long. Please try again." | Retry with exponential backoff |
| LLM returns invalid JSON | EXTRACTION_FAILED | "Unable to process drawing. Please try again." | Log error, retry |
| Zod validation fails | VALIDATION_FAILED | "Extracted data is incomplete. Please upload a clearer drawing." | Flag for manual review |
| Confidence < 0.5 | CONFIDENCE_TOO_LOW | "Confidence in extraction is low. Professional review recommended." | Flag as CONDITIONAL |
| File corrupted | EXTRACTION_FAILED | "Unable to read drawing file. Please try again." | User uploads new file |

### No Assumptions
- LLM output is deterministic (it's not - add version tracking)
- Extraction always succeeds (it doesn't - handle failures)
- All drawings are clear (they're not - confidence scoring)
- User understands technical output (they don't - use friendly messages)

---

## 3. ARCHITECTURE & FILE STRUCTURE ✅

### File Location
```
server/services/DrawingDataService.ts
```

### Class Structure
```typescript
export class DrawingDataService {
  // Core extraction method
  async extractDrawingData(input: DrawingDataExtractionInput): Promise<DrawingDataExtractionResult>
  
  // LLM integration
  private async callClaudeVision(buffer: Buffer, analysisType: string): Promise<LLMResponse>
  
  // Data validation
  private validateExtractedData(data: unknown): DrawingData
  
  // Audit trail preparation
  private prepareAuditEvent(input: DrawingDataExtractionInput, result: DrawingDataExtractionResult): AuditEvent
}
```

### Dependencies
- `@anthropic-ai/sdk` - Claude Vision API
- `zod` - Schema validation
- `server/_core/monitoring` - Logging
- `server/services/DrawingAnalysisService` - Orchestration context

### Naming Conventions
- Service methods: `extractDrawingData`, `validateExtractedData`
- Interfaces: `DrawingDataExtractionInput`, `DrawingDataExtractionResult`
- Enums: `ExtractionStatus`, `AnalysisType`
- Constants: `MAX_EXTRACTION_RETRIES`, `LLM_TIMEOUT_MS`

### Reusable Utilities
- `createPromptForDrawing(analysisType: string): string` - Generate LLM prompt
- `parseClaudeResponse(response: string): unknown` - Parse LLM JSON
- `calculateExtractionConfidence(data: DrawingData): number` - Score confidence

---

## 4. CODING STANDARDS ✅

### Meaningful Names
- ✅ `extractDrawingData` - Clear what it does
- ✅ `extractionConfidence` - Clear what it measures
- ✅ `validateExtractedData` - Clear purpose
- ❌ `process()` - Too vague
- ❌ `data` - Too generic

### Single Responsibility
- ✅ `extractDrawingData()` - Orchestrates extraction
- ✅ `callClaudeVision()` - Calls LLM only
- ✅ `validateExtractedData()` - Validates only
- ❌ `processDrawing()` - Does everything

### Small Functions
- ✅ All methods < 30 lines
- ✅ Complex logic extracted to helpers
- ✅ Each method does one thing

### Comments
- ✅ Explain WHY: "Confidence < 0.5 indicates LLM uncertainty"
- ✅ Explain EDGE CASES: "Illegible drawings may fail extraction"
- ❌ Explain WHAT: "Extract drawing data" (code already says this)

### Error Handling
- ✅ All async calls wrapped in try/catch
- ✅ Errors logged with context
- ✅ User-friendly error messages
- ✅ Audit trail records failures

### Type Safety
- ✅ No `any` types
- ✅ All inputs validated
- ✅ Return types explicit
- ✅ Zod schemas for runtime validation

---

## 5. INTEGRATION DISCIPLINE ✅

### Frontend Validates
- File size, MIME type, file not corrupted
- Displays extraction progress
- Handles extraction errors gracefully

### Backend Validates
- Buffer not empty
- MIME type matches content
- LLM response is valid JSON
- Extracted data passes Zod schema
- Confidence score is reasonable

### No Silent Failures
- ✅ All extraction failures logged
- ✅ All validation failures reported
- ✅ All LLM timeouts retried
- ✅ All errors included in audit trail

### All States Handled
- ✅ Extracting (progress)
- ✅ Success (return data)
- ✅ Validation error (flag for review)
- ✅ Confidence low (warn user)
- ✅ LLM timeout (retry)
- ✅ File corrupted (user error)

---

## 6. TESTING REQUIREMENTS ✅

### Unit Tests
- ✅ `validateExtractedData()` with valid/invalid data
- ✅ `calculateExtractionConfidence()` with various scores
- ✅ Error handling for each failure scenario

### Integration Tests
- ✅ End-to-end extraction with real drawing
- ✅ Audit trail recorded correctly
- ✅ LLM timeout handled
- ✅ Validation failures caught

### Manual UX Tests
- ✅ Upload valid PDF → extraction succeeds
- ✅ Upload corrupted file → friendly error
- ✅ LLM timeout → retry succeeds
- ✅ Low confidence → warning displayed

### Edge Case Tests
- ✅ Illegible drawing → low confidence
- ✅ Partial drawing → incomplete extraction
- ✅ Non-standard notation → extraction fails

---

## 7. DEFINITION OF DONE ✅

A feature is NOT done until ALL of these are true:
- ✅ Code written and reviewed
- ✅ UX integrated and tested
- ✅ API contract respected exactly
- ✅ Error states handled
- ✅ Edge cases tested
- ✅ No console errors or warnings
- ✅ Audit trail records all events
- ✅ LLM extraction never influences compliance decisions
- ✅ Extraction confidence scored and captured
- ✅ All extracted data validated against Zod schema

---

## 8. IMPLEMENTATION CHECKLIST

- [ ] Create DrawingDataService class
- [ ] Implement `extractDrawingData()` method
- [ ] Integrate Claude Vision API
- [ ] Create Zod schemas for DrawingData
- [ ] Implement `validateExtractedData()` method
- [ ] Implement `calculateExtractionConfidence()` method
- [ ] Create audit event preparation
- [ ] Add comprehensive error handling
- [ ] Add logging and monitoring
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Document API contract
- [ ] Verify audit trail recording
- [ ] Test with real drawings
- [ ] Verify LLM extraction never influences compliance

---

## 9. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|-----------|
| LLM hallucination | High | Zod validation catches invalid data |
| Low confidence extraction | Medium | Flag for manual review, warn user |
| LLM API timeout | Medium | Retry with exponential backoff |
| File corruption | Low | Graceful error message |
| Non-deterministic output | High | Version tracking, audit trail |

---

## 10. SUCCESS METRICS

- ✅ Extraction succeeds for 95%+ of clear drawings
- ✅ Confidence score accurately reflects extraction quality
- ✅ All extraction events recorded in audit trail
- ✅ Zero instances of LLM output influencing compliance decisions
- ✅ All validation errors caught before rule engine
- ✅ User-friendly error messages for all failure scenarios
- ✅ Extraction completes within 10 seconds
- ✅ Audit trail includes extraction model version

---

**Next Phase:** Phase 2 - DrawingDataService Implementation
