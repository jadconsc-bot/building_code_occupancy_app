# CodeComply — Developer Build Guide
## AI-Assisted Building Code Compliance Platform (Canadian)

---

## Table of Contents
1. [Project Vision](#1-project-vision)
2. [Current Stage](#2-current-stage)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Database Schema](#5-database-schema)
6. [Core Pipeline](#6-core-pipeline)
7. [Directory Structure](#7-directory-structure)
8. [Key Modules](#8-key-modules)
9. [API Reference](#9-api-reference)
10. [Implementation Phases](#10-implementation-phases)
11. [Prime Directive 2.0](#11-prime-directive-20)
12. [Critical Rules](#12-critical-rules)
13. [Deployment](#13-deployment)
14. [Roadmap to Launch](#14-roadmap-to-launch)

---

## 1. Project Vision

CodeComply is a Canadian SaaS platform for AI-assisted building code compliance, targeting professional engineers, architects, and building code consultants.

**Core value proposition:**
- Trax Codes answers "what does the code say"
- CodeComply answers **"is my building compliant"** — with professional accountability and legal defensibility

**Target users:**
- Licensed engineers and architects in Canada
- Building code consultants
- Developers seeking pre-permit compliance review

**Jurisdictions (MVP):**
- Alberta — National Building Code Alberta Edition 2023 (ABC 2023)
- British Columbia — BC Building Code 2024 (BCBC 2024)
- National — NBC 2020

**Competitive positioning:** UpCodes or Procore for the Canadian market, with professional stamp and audit trail.

---

## 2. Current Stage

**As of May 2026 — Phase 2 Spatial Intelligence (80% complete)**

### What is working in production:

| Feature | Status |
|---|---|
| PDF upload (up to 39 pages) | ✅ Live |
| Multi-page page selector | ✅ Live |
| Azure OCR label extraction | ✅ Live |
| Legend/notes extraction pre-processing | ✅ Live |
| Claude Vision room detection | ✅ Live |
| Adaptive coordinate scale correction | ✅ Live |
| Room overlay on drawing canvas | ✅ Live |
| Occupancy group color coding (A–F) | ✅ Live |
| 12 compliance rules per room | ✅ Live |
| LLM-judge accuracy evaluator (Haiku) | ✅ Live |
| Drawing type selector (6 types + few-shot prompts) | ✅ Live |
| Professional Review Panel (PD2.0) | ✅ Live |
| Compliance audit trail | ✅ Live |
| Export to PDF | ✅ Live |
| Clerk authentication | ✅ Live |
| Railway deployment (MySQL + Node.js) | ✅ Live |

### What is pending:

| Feature | Priority |
|---|---|
| Room-level compliance wired into UI panel | 🔴 Next |
| Travel distance measurement (NBC 3.4.2.5) | 🔴 Phase C |
| Claude Vision prompt enhancements (door widths, scale bar) | 🟡 Phase D |
| Structural drawing mode | 🟡 Phase E |
| OAuth professional credential verification | 🟡 Pending |
| Playwright e2e tests | 🟡 Not started |

### Accuracy benchmark (live):
- Detection accuracy: 70–86% (LLM-judge scored)
- Coverage: 29–33% of page area (main floor plan)
- Azure OCR: 443–562 labels extracted, 20–31 passed as room anchors

---

## 3. Tech Stack

```
Frontend:     React 18, TypeScript, Tailwind CSS, shadcn/ui
Backend:      Node.js, Express.js, tRPC 11
Database:     MySQL 8 (Railway)
ORM:          Drizzle ORM
Auth:         Clerk
AI:           Anthropic Claude (claude-sonnet-4-6) — primary
              Anthropic Claude Haiku (claude-haiku-4-5) — eval/judge
OCR:          Azure Document Intelligence (prebuilt-layout)
Image:        @napi-rs/canvas, sharp, pdfjs-dist
Queue:        p-queue (concurrency 3)
Hosting:      Railway (server + MySQL)
Package:      pnpm
```

---

## 4. Architecture Overview

### The Iron Law (never violate this)

```
LLM Vision  →  interprets drawings (geometry only)
                        ↓
Deterministic Rule Engine  →  makes compliance decisions
                        ↓
Professional Engineer Review  →  legally binding act
```

**AI never makes compliance decisions. The rule engine does.**
**LLM output is always an input to the rule engine, never a final answer.**

### Four-Phase Architecture (approved May 2026)

```
Phase 1 — Engine Integrity        ✅ Complete
Phase 2 — Spatial Intelligence    🔄 80% Complete  
Phase 3 — Visual Guidance         ⏳ Not started (heatmaps, overlays)
Phase 4 — AI Copilot              ⏳ Not started (only after 1+2 are solid)
```

### Request flow for drawing analysis:

```
User uploads PDF
    ↓
pdfjs-dist renders page at 150 DPI → PNG → JPEG
    ↓
[Parallel] Azure Document Intelligence
    → extracts all text labels with pixel coordinates
    → legendExtractor.ts finds GENERAL NOTES / LEGEND block
    → legendSanitiser.ts strips adversarial text
    → filterRoomLabels() reduces to 20-40 room-relevant labels
    ↓
Claude Vision (claude-sonnet-4-6)
    → receives: legend context + few-shot examples + OCR label anchors
    → returns: JSON array of detected rooms with bounding boxes
    ↓
Coordinate restoration
    → adaptive scale correction (1.00x with Azure, 1.61x without)
    → cropOffsetY/X added back to all bounding boxes
    → envelope check rejects key-plan detections (<3% coverage)
    ↓
saveRoomsToDb()
    → clears stale rooms for pageId first
    → inserts detectedRooms + detectedFeatures
    ↓
roomComplianceEvaluator.ts
    → evaluates 12 NBC rules per room
    → saves to complianceResults table
    ↓
[Non-blocking] roomDetectionEvaluator.ts (Haiku judge)
    → scores each room independently
    → saves accuracy to drawingPages.evalAccuracy
    ↓
Client polls getRoomsForDrawing every 3-5s (max 40 polls)
    → room overlays appear on canvas
    → compliance results merge into ProfessionalReviewPanel
```

---

## 5. Database Schema

**Railway MySQL — all tables:**

```sql
-- Core
users                     -- Clerk user sync
projects                  -- Building projects
drawingAnalyses           -- Each analysis run
drawingPages              -- One per analyzed page
  widthPx, heightPx       -- Full image dimensions
  evalAccuracy            -- LLM-judge score (0-1)
  evalPassingRooms        -- Rooms that passed eval
  evalTotalRooms          -- Total rooms evaluated
  evalMissedRoomsJson     -- JSON array of missed room descriptions

-- Spatial Intelligence (Phase 2)
detectedRooms             -- Rooms detected by Claude Vision
  pageId                  -- FK to drawingPages
  projectId               -- FK to projects
  roomLabel               -- e.g. "Bedroom AR-54"
  occupancyGroup          -- A/B/C/D/E/F
  occupancyDivision       -- e.g. "1", "2", "3"
  confidence              -- 0.0-1.0
  areaSqm                 -- Estimated area
  boundingBoxJson         -- {x, y, width, height} in full image pixels
  flagsJson               -- Array of flag strings
  flaggedForReview        -- Boolean

detectedFeatures          -- Features within rooms (doors, windows, etc.)
  roomId                  -- FK to detectedRooms
  featureType             -- door/window/stair/exit_sign/sprinkler_head/etc.
  positionJson            -- {x, y} pixel position
  metadataJson            -- {width_mm, ratingMinutes, etc.}
  confidence

complianceResults         -- Rule evaluation results per room
  roomId                  -- FK to detectedRooms
  analysisId              -- FK to drawingAnalyses
  ruleReference           -- e.g. "NBC 3.4.3.4"
  ruleCategory            -- egress/fire/accessibility/residential
  ruleText                -- Human-readable rule description
  status                  -- pass/fail/warning/not_applicable/unable_to_evaluate
  actualValue             -- What was measured
  requiredValue           -- What is required
  marginPercent           -- How close to limit
  severity                -- info/low/medium/high/critical
  remediationSuggestion   -- What to do if failing
  overrideChain           -- JSON array of override history
  evaluationPath          -- How the decision was made

-- Reference data
occupancyClassifications  -- NBC occupancy group definitions
codeRules                 -- 60 rules (AB+BC editions)

-- Professional accountability
collaborationComments     -- Review comments
```

---

## 6. Core Pipeline

### 6.1 Room Detection Service

**File:** `server/engine/spatial/roomDetectionService.ts`

```typescript
// Key function signature
export async function detectRoomsFromPage(
  pageBase64: string,      // JPEG base64 of full page
  pageId: number,
  projectId: number,
  pageNumber: number,
  projectContext?: {
    occupancyCode?: string;
    province?: string;
    buildingType?: string;
    drawingType?: DrawingType;  // from promptLibrary.ts
  }
): Promise<RoomDetectionResult>
```

**Crop logic (critical — do not change without testing):**
- Left crop: 20% (removes key plan column on left side)
- Top crop: 15% (removes schedule tables)
- Cropped image sent to Claude Vision
- `cropOffsetX = imgW * 0.20`, `cropOffsetY = imgH * 0.15`
- All returned bounding boxes get offset restored after detection

**Scale correction logic:**
```typescript
// Claude Vision internally downscales images to ~1568px max
// With Azure OCR anchors (maxX > 1800): Claude uses full pixel space → no correction
// Without Azure OCR (maxX ≤ 1800): Claude downscaled → apply 1.61x correction
const CLAUDE_MAX_DIMENSION = 1568;
const claudeScale = Math.min(CLAUDE_MAX_DIMENSION / imgW, CLAUDE_MAX_DIMENSION / croppedH);
const needsCorrection = maxX <= imgW * 0.6;
const coordScale = needsCorrection ? (1 / claudeScale) : 1.0;
```

### 6.2 Azure OCR Service

**File:** `server/engine/spatial/azureOcrService.ts`

**Label filtering rules (filterRoomLabels):**
- Keep: room keywords (bedroom, bathroom, kitchen, corridor, etc.)
- Keep: room codes matching `AR-##` pattern
- Keep: abbreviations (W/R, WC, MEC, ELEC, etc.)
- Exclude: y < 20% of cropped height (schedule tables at top)
- Exclude: x > 85% of cropped width (title block column on right)
- Exclude: grid axis refs (`^[A-Z]{1,2}\d{1,2}$` — RC1, A1, B2)
- Exclude: pure numbers (door numbers, dimensions)
- Max 30 labels passed to Claude (slice)

### 6.3 Legend Extractor

**File:** `server/engine/spatial/legendExtractor.ts`

Scans all Azure OCR labels for legend anchor keywords:
`GENERAL NOTES`, `LEGEND`, `ABBREVIATIONS`, `CONVENTIONS`, etc.

When found:
- Collects all labels within 400px radius
- Parses `CODE = Meaning` patterns
- Extracts wall type notes
- Builds `DrawingLegend` object passed to Claude prompt

Falls back to built-in `KNOWN_ABBREVIATIONS` (22 Canadian drawing conventions) when no legend found.

### 6.4 Prompt Library

**File:** `server/engine/spatial/promptLibrary.ts`

6 drawing types with few-shot examples:
- `residential_multi_unit` — Group C, AR-## codes
- `residential_single_family` — Group C, master bedroom, garage
- `commercial_office` — Group D
- `institutional` — Group A/B
- `industrial` — Group F
- `mixed_use` — Multiple groups
- `auto` — No hints (default)

User selects drawing type in UI. Selected type injects:
1. `systemHints` — building type context for Claude
2. `fewShotExamples` — concrete label→bounding box examples

### 6.5 Compliance Rule Engine

**NBC Rules currently evaluated (floor plan mode):**

| Rule | NBC Clause | Type |
|---|---|---|
| Exit door minimum width 860mm | 3.4.3.4 | Drawing-level |
| Corridor minimum width 1100mm | 3.4.1.9 | Drawing-level |
| Fire separation construction | 3.1.3.4 | Drawing-level |
| Minimum bedroom area 7m² | 9.5.2.3 | Room-level |
| Suite-to-suite 1hr separation | 3.3.3.4 | Room-level |
| Accessible unit count ≥15% | 3.8.3.3 | Room-level |
| Storage Group F in residential | 3.1.2 | Room-level |
| C+D mixed occupancy separation | 3.1.3.2 | Room-level |
| Stair enclosure requirement | 3.4.3.1 | Room-level |

**Structural rules** (only run when `analysisType === 'structural'`):
- NBC 9.5.5.2 — Minimum stud size
- NBC 9.5.5.3 — Stud spacing
- NBC 9.23.3.2 — Floor joist size
- NBC 9.23.9 — Fastener requirements
- CSA O86 — Engineered wood connections

### 6.6 LLM-Judge Evaluator

**File:** `server/engine/spatial/roomDetectionEvaluator.ts`

Runs non-blocking after room detection completes.
Uses Claude Haiku to independently score each detected room:
- `label` — correct/wrong
- `box` — accurate/rough/wrong
- `occupancy` — correct/uncertain/wrong

Saves to `drawingPages.evalAccuracy` (0-100 float).
Feeds the Detection Quality panel in the UI.

---

## 7. Directory Structure

```
building_code_occupancy_app/
├── client/
│   └── src/
│       ├── components/
│       │   ├── DrawingAnalysis.tsx        ← Main canvas + analysis UI (3600+ lines)
│       │   ├── ProfessionalReviewPanel.tsx ← PD2.0 review + stamp
│       │   └── ...
│       └── _core/
│           └── hooks/
│               └── useAuth.ts             ← LOCKED — do not modify
├── server/
│   ├── _core/
│   │   ├── env.ts                         ← LOCKED — do not modify
│   │   └── middleware/
│   │       └── auth.ts                    ← LOCKED — do not modify
│   ├── engine/
│   │   ├── constraints/
│   │   │   └── index.ts                   ← NBC numeric thresholds
│   │   ├── rules/
│   │   │   ├── egress.ts                  ← Egress rules
│   │   │   ├── fire.ts                    ← Fire safety rules
│   │   │   └── occupancy.ts               ← Occupancy rules
│   │   ├── spatial/
│   │   │   ├── azureOcrService.ts         ← Azure OCR label extraction
│   │   │   ├── legendExtractor.ts         ← Drawing legend pre-processing
│   │   │   ├── legendSanitiser.ts         ← Prompt injection defense
│   │   │   ├── promptLibrary.ts           ← 6 drawing types + few-shot
│   │   │   ├── roomDetectionService.ts    ← Main spatial pipeline
│   │   │   ├── roomDetectionPrompt.ts     ← Claude Vision prompt builder
│   │   │   ├── roomDetectionEvaluator.ts  ← LLM-judge accuracy eval
│   │   │   ├── roomComplianceEvaluator.ts ← Per-room NBC rule engine
│   │   │   └── types.ts                   ← Spatial type definitions
│   │   ├── types/
│   │   │   └── trace.ts                   ← ComplianceTrace schema
│   │   ├── RuleResolver.ts                ← 4-layer override cascade
│   │   ├── EvaluationContract.ts          ← EvaluationResult interface
│   │   └── EvaluationEngine.ts
│   ├── routers/
│   │   ├── drawingAnalysisRouter.ts       ← tRPC procedures for drawing analysis
│   │   ├── complianceRouter.ts            ← LOCKED — do not modify
│   │   └── ...
│   └── services/
│       ├── drawingComplianceEngine.ts     ← Drawing-level rule evaluation
│       └── structuralComplianceEngine.ts  ← Structural rules (separate mode)
├── drizzle/
│   └── schema.ts                          ← Database schema
├── docs/
│   └── COMPLIANCE_RULES_SKILL.md          ← NBC rule gap analysis
└── client/index.html                      ← LOCKED — do not modify
```

---

## 8. Key Modules

### ComplianceTrace Schema

Every compliance evaluation produces a `ComplianceTrace`:

```typescript
interface ComplianceTrace {
  result: 'pass' | 'fail' | 'conditional' | 'not_applicable' | 'unable_to_evaluate';
  rule: string;                    // e.g. "NBC 3.4.3.4"
  jurisdiction: string;
  source: string;
  reasoning: string;
  evaluatedInputs: {
    actual: number | string;
    required: number | string;
    unit: string;
    margin?: number;               // actual - required
    marginPercent?: number;        // margin / required * 100
  };
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  constraintId: string;
  evaluationTimestamp: string;     // ISO8601
  overrideChain: Array<{
    layer: 'federal' | 'provincial' | 'municipal' | 'project';
    source: string;
    value: unknown;
    applied: boolean;
  }>;
  evaluationPath: string;
  recommendations: string[];
  confidence: number;
}
```

### RuleResolver — 4-layer cascade

```
federal (NBC 2020)
    → provincial override (ABC 2023, BCBC 2024)
        → municipal override (Edmonton, Calgary, Vancouver)
            → project override (engineer decision)
```

Last layer wins. Full `overrideChain` recorded for audit.

### EvaluationResult

```typescript
interface EvaluationResult {
  score: number;           // 0-100
  status: 'pass' | 'fail' | 'conditional' | 'pending_review';
  traces: ComplianceTrace[];
  summary: string;
  rulesEvaluated: number;
  passingRules: number;
  failingRules: number;
  conditionalRules: number;
}
```

---

## 9. API Reference

### tRPC Procedures (drawingAnalysisRouter)

```typescript
// Analyze a drawing page
analyze.mutate({
  projectId: number;
  imageData: string;        // base64 JPEG
  mimeType: string;
  analysisType: 'comprehensive' | 'structural' | 'fire-safety' | 'connections';
  quality: 'fast' | 'standard' | 'detailed';
  drawingType?: DrawingType; // from promptLibrary
  pageNumber?: number;
  selectedPages?: number[];
})

// Get rooms for a drawing
getRoomsForDrawing.query({
  drawingId: number;
})
// Returns: { pages: DrawingPage[], rooms: DetectedRoom[] }

// Get room-level compliance results
getRoomCompliance.query({
  drawingId: number;
  projectId: number;
})
// Returns: Array<{ room: DetectedRoom, compliance: ComplianceResult[] }>

// List analyses for a project
listByProject.query({
  projectId: number;
})

// Professional review actions
validateAnalysis.mutate({ analysisId, licenseNumber, ... })
rejectAnalysis.mutate({ analysisId, rejectionReason })
```

### Environment Variables (Railway)

```bash
DATABASE_URL=mysql://...
CLERK_SECRET_KEY=...
CLERK_PUBLISHABLE_KEY=...
ANTHROPIC_API_KEY=...
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOC_INTELLIGENCE_KEY=...
OPENAI_API_KEY=...              # Optional — GPT-4o fallback
MULTI_PAGE_PDF=true
NODE_ENV=production
```

---

## 10. Implementation Phases

### Phase 1 — Engine Integrity ✅ Complete

1. `server/engine/constraints/index.ts` — NBC numeric thresholds
2. `server/engine/types/trace.ts` — ComplianceTrace schema
3. `server/engine/rules/` — Pure rule functions
4. `server/engine/RuleResolver.ts` — 4-layer override cascade
5. `server/engine/EvaluationContract.ts` — EvaluationResult interface

### Phase 2 — Spatial Intelligence 🔄 80% Complete

**Tasks complete:**
- Multi-page PDF pipeline (pdfjs-dist, @napi-rs/canvas, 150 DPI)
- Room detection with Claude Vision
- Azure OCR + Claude Vision consensus pipeline
- Per-room compliance results (9 rules)
- Drawing viewer with room overlays
- LLM-judge accuracy evaluator
- Legend extraction pre-processing
- Prompt library with few-shot examples
- Adaptive coordinate scale correction
- Drawing type user selector

**Tasks pending:**
- Wire room-level compliance into ProfessionalReviewPanel UI
- Phase C: Travel distance measurement (NBC 3.4.2.5)
- Phase D: Claude Vision prompt enhancements

### Phase 3 — Visual Guidance (not started)
- Compliance heatmaps overlaid on drawings
- Travel path visualization
- Exit route overlays
- Topology edge rendering

### Phase 4 — AI Copilot (not started)
**Only after Phases 1+2 are deterministic and stable.**
- Natural language compliance questions
- "What if I add a sprinkler system?"
- Code pathway suggestions
- Automated code summary letter generation

---

## 11. Prime Directive 2.0

Every AI interaction in CodeComply must satisfy these non-negotiable constraints:

**§1 — LLM Boundary**
LLM interprets drawings. Deterministic rule engine makes compliance decisions. These must never be mixed.

**§2 — Immutability**
All compliance determinations are immutably recorded with timestamp, user ID, and full trace. No silent overwrites.

**§3 — Audit Trail**
Every rule evaluation records: what was checked, what value was found, what was required, which code edition applied, which jurisdiction, and the full override chain.

**§4 — Disclaimer Gate**
Users must acknowledge the PD2.0 notice before any compliance result is shown: "This tool uses AI to extract and interpret drawing data only. All compliance determinations are made by a deterministic rule engine. Results require professional review."

**§5 — Professional Review**
The final compliance determination is always made by a licensed professional. CodeComply provides analysis inputs — not a permit.

**§6 — Escalation Triggers**
If confidence < 0.7 on any room detection, flag for professional review.
If any rule returns FAIL on a critical clause, surface immediately with remediation.

---

## 12. Critical Rules

### Files that must NEVER be modified without explicit approval:

```
client/index.html
client/src/main.tsx
client/src/_core/hooks/useAuth.ts
server/_core/env.ts
server/_core/middleware/auth.ts
server/services/complianceEngine.ts
server/services/compliancePathwayGenerator.ts
server/routers/complianceRouter.ts
client/src/components/AuthHydrationWrapper.tsx
```

### Branch rule for every session:

```bash
git checkout main && git pull origin main
# All work on main
# All pushes: git push origin HEAD:main
# Never push to feature branches as final destination
```

### Database rule:

Railway MySQL at `junction.proxy.rlwy.net:34705/railway` is production.
Manus (Claude Code dev environment) uses a TiDB sandbox — **always verify changes using Railway Data tab, not Manus query results.**

### Drizzle JSON column rule:

MySQL JSON columns are returned by Drizzle as **already-parsed objects** (not strings).
Never call `JSON.parse()` directly on Drizzle output. Always use:

```typescript
function safeJsonParse(value: unknown): unknown {
  if (!value) return null;
  if (typeof value === 'object') return value; // already parsed
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}
```

---

## 13. Deployment

**Platform:** Railway (monorepo — one service)

**Build:**
```bash
pnpm install
pnpm build          # builds client + server
```

**Start:**
```bash
NODE_ENV=production node dist/index.js
```

**DB migrations:**
```bash
# Run migration SQL directly in Railway Data tab
# Drizzle migration files in drizzle/XXXX_*.sql
```

**Verify deployment:**
```bash
git push origin HEAD:main
# Railway auto-deploys on push to main
# Monitor: Railway → Deploy Logs
```

**Health check:**
```
[Env] Environment validation passed
[Env] Azure Doc Intelligence: Configured
Server running on http://localhost:8080/
```

---

## 14. Roadmap to Launch

**Target: September 2026**

### Immediate (May 2026)
- [ ] Wire room-level compliance into ProfessionalReviewPanel
- [ ] Phase C: Travel distance measurement (NBC 3.4.2.5)
- [ ] Replace `alert()` calls with `sonner` toasts
- [ ] Cap `getDrawingAnalyses` with `.limit(20)`

### June 2026
- [ ] Phase D: Claude Vision prompt enhancements
  - Door width extraction from dimension annotations
  - Scale bar detection
  - Fire-rated wall symbol detection
- [ ] Occupancy Advisor feature (FEATURE-OCCUPANCY-ADVISOR-001)
- [ ] Multi-province credential support (AB, BC)

### July 2026
- [ ] Phase 3: Visual Guidance (heatmaps, travel paths)
- [ ] ProjectTabView improvements
- [ ] Collaboration workspace (comments, annotations)
- [ ] OAuth professional credential verification

### August 2026
- [ ] Phase 4: AI Copilot (natural language queries)
- [ ] Code Summary Letter auto-generation
- [ ] Performance optimization
- [ ] Playwright e2e test suite

### September 2026
- [ ] Beta launch with selected engineering firms
- [ ] Professional stamp integration
- [ ] Billing and subscription management

---

## Appendix A — Compliance Score Calculation

```
Score = (passing rules / evaluated rules) * 100

Rules excluded from score:
- UNABLE_TO_EVALUATE
- NOT_APPLICABLE

Structural rules only evaluated when analysisType === 'structural'
Floor plan analysis: 9 rules evaluated (3 drawing-level + 6 room-level)
```

## Appendix B — Room Detection Accuracy Benchmarks

| Analysis | Rooms Saved | LLM-Judge Accuracy | Coverage |
|---|---|---|---|
| Simple residential floor plan | 12-18 | 84-86% | 27-33% |
| Complex multi-unit floor plan | 16-26 | 63-85% | 29-43% |
| Large sheet with key plan | 8-13 | 70-84% | 26-31% |

## Appendix C — NBC Occupancy Groups

| Group | Description | Examples |
|---|---|---|
| A | Assembly | Restaurants, theatres, gyms, churches |
| B | Institutional | Hospitals, care facilities, detention |
| C | Residential | Apartments, condos, houses, hotels |
| D | Business & Personal Services | Offices, clinics, banks |
| E | Mercantile | Retail stores, markets |
| F-1 | High Hazard Industrial | Chemical plants, explosives |
| F-2 | Medium Hazard Industrial | Laboratories, auto repair |
| F-3 | Low Hazard Industrial | Warehouses, cold storage |

## Appendix D — Key NBC Clauses (Floor Plan Analysis)

| Clause | Description | Threshold |
|---|---|---|
| NBC 3.4.3.4 | Exit door clear width | ≥860mm |
| NBC 3.4.1.9 | Corridor clear width | ≥1100mm |
| NBC 3.1.3.4 | Fire separation ratings | Per occupancy combination |
| NBC 9.5.2.3 | Minimum bedroom area | ≥7.0m² (1 person), ≥9.8m² (2 persons) |
| NBC 3.3.3.4 | Suite-to-suite separation | 1 hour FRR |
| NBC 3.8.3.3 | Accessible unit count | ≥15% of residential units |
| NBC 3.1.3.2 | Mixed occupancy separation | C+D=1hr, A or B=2hr |
| NBC 3.4.2.5 | Travel distance to exit | ≤25m (unsprinklered), ≤45m (sprinklered) |
| NBC 3.4.2.2 | Minimum exit count | ≥2 when occupant load >60 |

---

*Document version: May 2026*
*CodeComply — Canadian Building Code Compliance Platform*
*Developed by Jose de Oleo, Calgary, Alberta*
