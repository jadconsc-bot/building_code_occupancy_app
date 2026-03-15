# Phase 1: Critical Clarifications Implementation Plan

**Status:** Ready for Implementation  
**Based On:** CodeComply Implementation Instructions (Senior Coder Review)  
**Follows:** CODING_PROTOCOL.md (10-Step Workflow)  
**Estimated Effort:** 12-16 hours

---

## Executive Summary

Phase 1 addresses three critical legal defensibility gaps identified in the senior coder review. These must be resolved before Phase 2 (Service Layer) begins. All changes follow the CODING_PROTOCOL 10-step workflow and maintain backward compatibility.

---

## Critical Clarification 1: LLM Role Boundary

### Problem Definition

The architecture documents state "no LLM for compliance decisions" but the drawing analyzer requires LLM-based vision to interpret drawing content. This appears contradictory and creates legal defensibility ambiguity.

### Solution: Two-Stage Pipeline

Implement a clear architectural boundary:

```
┌─────────────────────────────────────────────────────────────┐
│                    DRAWING UPLOAD                           │
│                                                              │
│  User uploads PDF/image of construction drawing             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              STAGE 1: LLM EXTRACTION (Claude Vision)        │
│                                                              │
│  Extract and structure drawing data:                        │
│  - Structural members (beams, columns, studs)               │
│  - Dimensions and spacing                                   │
│  - Assembly types and materials                             │
│  - Fireblocking and penetration details                     │
│  - Fastener specifications                                  │
│  - Annotations and notes                                    │
│                                                              │
│  Output: Typed, validated DrawingData structure             │
│  (NOT compliance decisions)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        STAGE 2: RULE ENGINE EVALUATION (Deterministic)      │
│                                                              │
│  ComplianceEngine evaluates extracted data against:         │
│  - NBC 2020 Part 3 (Fire Safety)                            │
│  - NBC 2020 Part 4 (Structural)                             │
│  - NBC 2020 Part 9 (Materials & Construction)               │
│  - CSA Standards (S136, B137, ASTM A1003)                   │
│                                                              │
│  Output: Compliance decisions, pass/fail, scoring           │
│  (DETERMINISTIC, reproducible, legally defensible)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              COMPLIANCE REPORT GENERATION                   │
│                                                              │
│  - Issues identified (critical/major/minor)                 │
│  - Compliance score (0-100)                                 │
│  - Recommendations                                          │
│  - Professional review required                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

**DrawingDataService (New)**
```typescript
interface DrawingData {
  // Structural System
  structuralSystem: 'steel-stud' | 'wood-frame' | 'concrete' | 'other';
  members: StructuralMember[];
  connections: Connection[];
  
  // Fire Safety
  fireAssembly: FireAssembly;
  fireblocking: Fireblocking[];
  penetrations: Penetration[];
  
  // Materials
  materials: Material[];
  fasteners: Fastener[];
  
  // Dimensions
  dimensions: Dimension[];
  
  // Annotations
  annotations: Annotation[];
}

// LLM extracts drawing → DrawingData (typed, validated)
async extractDrawingData(drawingUrl: string): Promise<DrawingData> {
  const llmResponse = await invokeLLM({
    messages: [{
      role: 'user',
      content: [{
        type: 'image_url',
        image_url: { url: drawingUrl }
      }, {
        type: 'text',
        text: 'Extract structural data from this drawing...'
      }]
    }],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'drawing_data',
        schema: DrawingDataSchema // Zod schema
      }
    }
  });
  
  // Validate extracted data
  const validated = DrawingDataSchema.parse(JSON.parse(llmResponse));
  return validated;
}

// ComplianceEngine evaluates extracted data → Compliance decisions
async evaluateCompliance(drawingData: DrawingData): Promise<ComplianceResult> {
  const results = [];
  
  // Deterministic rule evaluation (NO LLM)
  results.push(await evaluateStructuralCompliance(drawingData));
  results.push(await evaluateFireSafetyCompliance(drawingData));
  results.push(await evaluateConnectionCompliance(drawingData));
  
  return aggregateResults(results);
}
```

### Code Documentation

**Required comments in DrawingAnalysisService:**
```typescript
/**
 * TWO-STAGE DRAWING ANALYSIS PIPELINE
 * 
 * STAGE 1: LLM EXTRACTION (Claude Vision)
 * ========================================
 * The LLM is used ONLY to extract and structure drawing data into a typed,
 * validated DrawingData object. The LLM does NOT make compliance decisions.
 * 
 * Input: Raw drawing (PDF/image)
 * Output: Typed DrawingData structure (validated against Zod schema)
 * 
 * STAGE 2: RULE ENGINE EVALUATION (Deterministic)
 * ================================================
 * The ComplianceEngine evaluates extracted DrawingData against NBC rules.
 * This stage is DETERMINISTIC and reproducible.
 * 
 * Input: DrawingData structure
 * Output: ComplianceResult (pass/fail, issues, score)
 * 
 * LEGAL DEFENSIBILITY
 * ===================
 * All compliance decisions flow EXCLUSIVELY from the rule engine.
 * The LLM output is never used for compliance decisions.
 * This ensures reproducibility and legal defensibility.
 */
```

### Architecture Diagram

**To be added to DRAWING_ANALYZER_INTEGRATION_DESIGN.md:**

```
LLM EXTRACTION BOUNDARY
┌─────────────────────────────────────────────┐
│  Claude Vision API                          │
│  (Structured Data Extraction)               │
│                                             │
│  Input: Drawing (PDF/image)                 │
│  Output: DrawingData (JSON Schema)          │
│                                             │
│  ✓ Permitted: Extract member dimensions    │
│  ✓ Permitted: Identify assembly types      │
│  ✗ NOT Permitted: Make compliance decisions│
└─────────────────────────────────────────────┘
                    ↓
RULE ENGINE BOUNDARY
┌─────────────────────────────────────────────┐
│  ComplianceEngine (Deterministic)           │
│  (Rule-Based Evaluation)                    │
│                                             │
│  Input: DrawingData (structured)            │
│  Output: ComplianceResult (decisions)       │
│                                             │
│  ✓ Permitted: Evaluate against NBC rules   │
│  ✓ Permitted: Calculate compliance score   │
│  ✓ Permitted: Identify violations          │
│  ✗ NOT Permitted: Use LLM output directly  │
└─────────────────────────────────────────────┘
```

---

## Critical Clarification 2: Drawing Immutability

### Problem Definition

Current schema stores `drawingUrl` as TEXT. URLs are mutable—files can be replaced, moved, or deleted, destroying reproducibility and legal defensibility.

### Solution: Content Hash + Optional Snapshot

**Schema Changes to drawingAnalyses table:**

```sql
ALTER TABLE drawingAnalyses ADD COLUMN (
  drawingHash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of drawing file at upload time',
  drawingSnapshotKey VARCHAR(500) COMMENT 'S3 key of immutable drawing snapshot (never overwritten)',
  drawingSnapshotMimeType VARCHAR(50) COMMENT 'MIME type of snapshot (application/pdf, image/jpeg, etc)',
  drawingSnapshotSize INT COMMENT 'Size in bytes of snapshot'
);
```

**Implementation Flow:**

```typescript
async uploadDrawing(file: Buffer, filename: string): Promise<DrawingUploadResult> {
  // 1. Compute SHA-256 hash of file
  const drawingHash = crypto
    .createHash('sha256')
    .update(file)
    .digest('hex');
  
  // 2. Upload to S3 with versioning
  const drawingUrl = await storagePut(
    `drawings/${projectId}/${filename}`,
    file,
    file.mimetype
  );
  
  // 3. Store immutable snapshot in S3 (never overwritten)
  const snapshotKey = `drawing-snapshots/${analysisId}/${drawingHash}.${extension}`;
  const snapshotUrl = await storagePut(
    snapshotKey,
    file,
    file.mimetype
  );
  
  // 4. Record in database
  await db.insert(drawingAnalyses).values({
    projectId,
    drawingUrl,
    drawingHash,
    drawingSnapshotKey: snapshotKey,
    drawingSnapshotMimeType: file.mimetype,
    drawingSnapshotSize: file.size,
    // ... other fields
  });
  
  return {
    drawingUrl,
    drawingHash,
    snapshotKey
  };
}
```

**Verification Function:**

```typescript
async verifyDrawingIntegrity(analysisId: number): Promise<IntegrityResult> {
  const analysis = await db.query.drawingAnalyses.findFirst({
    where: eq(drawingAnalyses.id, analysisId)
  });
  
  // 1. Retrieve snapshot from S3
  const snapshotBuffer = await storageGet(analysis.drawingSnapshotKey);
  
  // 2. Compute hash of retrieved snapshot
  const computedHash = crypto
    .createHash('sha256')
    .update(snapshotBuffer)
    .digest('hex');
  
  // 3. Compare with stored hash
  const isValid = computedHash === analysis.drawingHash;
  
  return {
    analysisId,
    storedHash: analysis.drawingHash,
    computedHash,
    isValid,
    verifiedAt: new Date(),
    snapshotUrl: analysis.drawingSnapshotKey
  };
}
```

**Legal Defensibility:**

- ✅ Drawing content is immutable (stored in S3 with unique key)
- ✅ Hash verification proves integrity
- ✅ Original drawing can be reconstructed for legal proceedings
- ✅ Timestamp proves when drawing was analyzed
- ✅ Audit trail links analysis to specific drawing version

---

## Critical Clarification 3: NBC Rules Seeding

### Problem Definition

The `nbcRules` table requires accurate, legally correct NBC 2020 content before the system can produce defensible compliance outputs. This seeding effort is NOT scoped in the 60-100 hour estimate.

### Solution: Seed Script + Rule Coverage Validation

**Scope (Out of 60-100 hour estimate):**
- NBC 2020 Part 3 (Fire Safety) - Key sections
- NBC 2020 Part 4 (Structural) - Key sections
- NBC 2020 Part 9 (Materials & Construction) - Key sections
- CSA S136-19 (Cold-Formed Steel)
- CSA B137 (Steel Fasteners)
- ASTM A1003 (Cold-Rolled Steel)

**Deliverable: seed-nbc-rules.mjs**

```typescript
// Seed script structure
const nbcRules = [
  {
    ruleId: 'NBC-3.1.5.1',
    section: '3.1.5.1',
    clause: 'Fire Separation - Occupancy Groups',
    description: 'Fire separation between occupancy groups...',
    category: 'fire-safety',
    jurisdiction: 'national',
    ruleVersion: 1,
    isActive: true,
    requiredFields: ['occupancyGroup', 'fireRating'],
    evaluationLogic: 'fireRating >= requiredRating'
  },
  // ... more rules
];

// Seed into database
async function seedNBCRules() {
  for (const rule of nbcRules) {
    await db.insert(nbcRules).values(rule);
  }
}
```

**Rule Coverage Validation:**

```typescript
async function validateRuleCoverage(): Promise<CoverageReport> {
  const coverage = {
    part3: await countRulesByCategory('fire-safety'),
    part4: await countRulesByCategory('structural'),
    part9: await countRulesByCategory('materials'),
    csaStandards: await countRulesByCategory('csa'),
    total: await countAllRules()
  };
  
  const minimumCoverage = {
    part3: 20,
    part4: 15,
    part9: 25,
    csaStandards: 10
  };
  
  // Block analysis if coverage below threshold
  if (coverage.part3 < minimumCoverage.part3) {
    throw new Error('Insufficient NBC Part 3 rule coverage');
  }
  
  return coverage;
}
```

**Guard in Analysis Procedure:**

```typescript
async function analyzeDrawingNBC(input: AnalysisInput) {
  // Validate rule coverage before proceeding
  const coverage = await validateRuleCoverage();
  
  if (!coverage.isAdequate) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'System rule coverage insufficient for analysis'
    });
  }
  
  // Proceed with analysis
  // ...
}
```

**Approval Workflow:**

1. Manus delivers seed script with all rules
2. Jose (CodeComply) reviews rules for accuracy
3. Jose approves rules before production deployment
4. Rules are seeded into production database
5. Coverage validation confirms adequacy
6. System is ready for live analysis

---

## Implementation Checklist (Phase 1)

### Critical Clarification 1: LLM Boundary
- [ ] Create DrawingDataService with LLM extraction
- [ ] Implement DrawingData Zod schema
- [ ] Add LLM boundary documentation to code comments
- [ ] Update architecture diagram in DRAWING_ANALYZER_INTEGRATION_DESIGN.md
- [ ] Verify ComplianceEngine uses only extracted data (no LLM)
- [ ] Write unit tests for DrawingDataService

### Critical Clarification 2: Drawing Immutability
- [ ] Add drawingHash, drawingSnapshotKey, drawingSnapshotMimeType, drawingSnapshotSize to schema
- [ ] Implement SHA-256 hash computation at upload
- [ ] Implement immutable snapshot storage in S3
- [ ] Create verifyDrawingIntegrity function
- [ ] Add hash verification to analysis workflow
- [ ] Write tests for hash computation and verification

### Critical Clarification 3: NBC Rules Seeding
- [ ] Create seed-nbc-rules.mjs script
- [ ] Define NBC rules for Parts 3, 4, 9
- [ ] Define CSA standard rules
- [ ] Implement rule coverage validation
- [ ] Add coverage guard to analysis procedure
- [ ] Document rule approval workflow
- [ ] Write tests for rule coverage validation

### Schema Updates
- [ ] Update drawingAnalyses table with new fields
- [ ] Update complianceAuditTrail with credential fields
- [ ] Add analysisStatus ENUM field
- [ ] Add disclaimer fields
- [ ] Create database migration

### Documentation
- [ ] Update DRAWING_ANALYZER_INTEGRATION_DESIGN.md with LLM boundary
- [ ] Document rule coverage requirements
- [ ] Create seed script documentation
- [ ] Document hash verification process

---

## Success Criteria

Phase 1 is complete when:

1. ✅ LLM extraction boundary is clearly documented and implemented
2. ✅ Drawing hash is computed and stored immutably
3. ✅ Drawing snapshot is stored in S3 with unique key
4. ✅ Hash verification proves drawing integrity
5. ✅ NBC rules seed script is delivered
6. ✅ Rule coverage validation blocks insufficient coverage
7. ✅ All schema changes are implemented
8. ✅ All tests pass
9. ✅ Architecture documentation is updated
10. ✅ Senior coder approves Phase 1 deliverables

---

## Next Phase

Phase 2: Implement Service Layer with LLM/Rule Engine Boundary

---

**Phase 1 Status:** Ready for Implementation  
**Estimated Duration:** 12-16 hours  
**Follows:** CODING_PROTOCOL 10-Step Workflow  
**Maintains:** Backward Compatibility  
**Ensures:** Legal Defensibility
