# Drawing Analysis Feature - Feasibility Assessment

## Overview

This document assesses the feasibility of implementing a feature that analyzes uploaded architectural drawings and applies building code rules (both NBC and municipal bylaws) to identify compliance issues.

## Feature Description

The proposed feature would:
1. Accept uploaded architectural drawings (PDF, DWG, or image formats)
2. Extract dimensional and spatial information from the drawings
3. Compare extracted data against applicable building codes and municipal bylaws
4. Generate a compliance report highlighting potential issues

## Technical Requirements

### 1. Drawing Upload & Processing

**Current Capability:** ✅ Partially Available
- The app already supports image uploads for the Inspector Checklist feature
- PDF viewing is available through browser capabilities
- Storage infrastructure exists via S3

**Additional Requirements:**
- Support for larger file sizes (architectural drawings can be 10-50MB)
- DWG/DXF file format support (requires conversion library)
- Multi-page PDF handling

### 2. Drawing Interpretation

**Complexity:** 🔴 High

This is the most challenging component. Options include:

#### Option A: AI Vision API (Recommended)
- Use GPT-4 Vision or similar AI to interpret drawings
- **Pros:** Can understand context, labels, dimensions, and room types
- **Cons:** May have accuracy limitations, requires careful prompt engineering
- **Estimated Accuracy:** 70-85% for typical residential drawings

#### Option B: OCR + Rule-Based Extraction
- Use OCR to extract text (dimensions, labels)
- Apply pattern matching for common drawing conventions
- **Pros:** More predictable, faster processing
- **Cons:** Limited to text extraction, cannot interpret spatial relationships

#### Option C: CAD File Parsing (for DWG/DXF)
- Parse native CAD files to extract geometry
- **Pros:** Exact dimensions, no interpretation needed
- **Cons:** Only works with CAD files, not scanned drawings or PDFs

### 3. Code Rule Engine

**Complexity:** 🟡 Medium

**Current Capability:** ✅ Partially Available
- Occupancy classification data exists
- Municipal bylaw data exists (Edmonton, Calgary, Airdrie, Lethbridge, Vancouver)
- Calculator logic exists for setbacks, coverage, height, etc.

**Additional Requirements:**
- Structured rule definitions for automated checking
- Mapping between drawing elements and code requirements
- Tolerance handling for measurement variations

### 4. Compliance Report Generation

**Complexity:** 🟢 Low

**Current Capability:** ✅ Available
- PDF export functionality exists
- Checklist generation exists
- Report formatting infrastructure in place

## Implementation Approach

### Phase 1: Basic Drawing Upload & Manual Annotation (2-3 weeks)
1. Add drawing upload functionality
2. Allow users to manually mark dimensions and room types on uploaded drawings
3. Run existing calculators against manually entered data
4. Generate compliance report

### Phase 2: AI-Assisted Extraction (3-4 weeks)
1. Integrate AI vision API (GPT-4 Vision or Claude Vision)
2. Extract dimensions, room labels, and spatial relationships
3. Present extracted data for user verification
4. Run automated compliance checks

### Phase 3: Advanced Analysis (4-6 weeks)
1. Add support for CAD file formats
2. Implement spatial analysis (setback verification, egress path analysis)
3. Add visual overlay showing compliance issues on the drawing
4. Generate detailed compliance reports with code references

## Cost Considerations

| Component | Estimated Cost |
|-----------|---------------|
| AI Vision API calls | $0.01-0.05 per drawing analysis |
| Additional storage | Minimal (existing S3 infrastructure) |
| Development time | 80-120 hours |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI misinterprets dimensions | Medium | High | User verification step |
| Unsupported drawing formats | Medium | Medium | Clear format requirements |
| Complex drawings fail analysis | High | Medium | Manual fallback option |
| Code rule gaps | Medium | Medium | Disclaimer + manual review |

## Recommendation

**Feasibility Rating: Medium-High**

The feature is technically feasible with the following approach:

1. **Start with Phase 1** (Manual Annotation) - This provides immediate value with low risk
2. **Pilot Phase 2** (AI-Assisted) with a subset of users to validate accuracy
3. **Iterate based on feedback** before full rollout

### Minimum Viable Product (MVP)

For an MVP, implement:
1. Drawing upload (PDF/image)
2. Manual dimension input overlay
3. Automatic setback/coverage/height compliance check
4. PDF compliance report

This MVP can be delivered in **2-3 weeks** and provides immediate value while gathering data for AI-assisted improvements.

## Technical Stack Recommendations

- **Drawing Upload:** Existing S3 infrastructure
- **AI Vision:** OpenAI GPT-4 Vision API (via existing LLM integration)
- **PDF Processing:** pdf.js for rendering, canvas for annotation
- **CAD Parsing:** LibreDWG or online conversion service (future phase)

## Conclusion

Drawing analysis with code compliance checking is feasible and would significantly enhance the app's value proposition. The recommended approach is to start with manual annotation (low risk, immediate value) and progressively add AI-assisted features based on user feedback and accuracy validation.

---

*Document Version: 1.0*
*Last Updated: January 2026*
