# COMPLIANCE_RULES_SKILL.md
# Canadian Building Code Compliance — AI Vision Pipeline Reference
**CodeComply · NBC 2020 (National Building Code of Canada)**
**Living document — last revised: May 2026**

---

## Section 1 — What a Canadian Code Consultant Checks

A licensed building code consultant reviewing architectural floor plan drawings against the NBC 2020 works across six domains. Not all domains are evaluable from floor plan drawings alone; the appropriate drawing type for each is noted.

### 1.1 Building Classification (occupancy groups, Part 3 vs Part 9)

Every building element is assigned an occupancy group (A, B, C, D, E, F) under NBC Division A, Article 3.1.2.1. The group determines which Part governs: Part 9 (simple, prescriptive) applies to buildings ≤3 storeys AND ≤600 m² gross floor area; Part 3 (engineered, prescriptive-or-alternative) applies to everything larger.

A consultant checks:
- Correct group assigned to each space (mixed-use buildings have multiple groups per floor)
- Whether the gross floor area or storey count triggers Part 3
- Mixed-occupancy separations required by NBC 3.3.4 when different groups are adjacent
- Whether any Group F space is F-1 (high hazard), F-2 (medium hazard), or F-3 (low hazard)

**Evaluable from floor plans:** occupancy group classification from room labels and features; Part 3 vs Part 9 trigger from project GFA (project metadata, not floor plan); mixed-occupancy adjacency from room arrangement.

### 1.2 Means of Egress (exits, travel distance, corridor/stair widths)

NBC Part 3 Subsection 3.4 governs egress. Key checks:

| Check | Rule | Threshold |
|---|---|---|
| Exit count per floor | NBC 3.4.2.2 | ≥2 if occupant load >60; ≥3 if >600 |
| Exit door clear width | NBC 3.4.3.4 | ≥860 mm |
| Corridor clear width | NBC 3.4.1.9 | ≥1100 mm |
| Travel distance to exit | NBC 3.4.2.5 | ≤25 m unsprinklered; ≤45 m sprinklered |
| Exit stair clear width | NBC 3.4.6.3 | ≥900 mm |
| Exit stair enclosure | NBC 3.4.3.1 | Fire-rated shaft; fire doors at each floor |

**Evaluable from floor plans:** exit count, exit door widths (if annotated), corridor identification; travel distance and stair width require a confirmed drawing scale.

### 1.3 Fire Safety (separations, sprinklers, alarms, signage)

NBC Part 3 Sections 3.1, 3.2, 3.3, 3.4 govern fire safety. Key checks:

| Check | Rule | Threshold |
|---|---|---|
| Sprinkler requirement | NBC 3.2.5.2 | Required for A-1, B-1, B-2, F-1; A-2 if OL >300 |
| Fire alarm requirement | NBC 3.2.4.7 | Required for A, B occupancies |
| Occupancy fire separation | NBC 3.3.4.2 | A or B adjacent: 2 hr; C+E: 1 hr; D+E: 45 min |
| Residential suite separation | NBC 3.3.3.4 | 1 hr between suites in Group C |
| Fire-rated assembly | NBC 3.1.3.4 | Construction and rating per table |
| Exit signage | NBC 3.4.5 | Required above each exit door |

**Evaluable from floor plans:** sprinkler head features, fire-rated door features, fire separation wall annotations, mixed-occupancy adjacency; alarm devices rarely shown on floor plans.

### 1.4 Residential Space Standards (min bedroom area, ceiling height, light/ventilation)

NBC Part 9 Section 9.5 and 9.13 govern residential habitability. Key checks:

| Check | Rule | Threshold |
|---|---|---|
| Minimum bedroom area | NBC 9.5.2.3 | ≥7 m² per sleeping person; no dimension <2 m |
| Minimum ceiling height | NBC 9.5.3.1 | ≥2.1 m in habitable rooms |
| Natural light | NBC 9.13.2 | Window area ≥10% of room floor area |
| Natural ventilation | NBC 9.13.3 | Openable window area ≥3.75% of room floor area |
| Kitchen ventilation | NBC 9.32.3 | Mechanical exhaust required |

**Evaluable from floor plans:** bedroom area (room area already extracted); window locations (already detected); ceiling height and window openable area require section drawings or additional data.

### 1.5 Accessibility — Barrier-Free Path (NBC Part 3.8)

NBC 3.8 requires barrier-free path of travel from public entrance to all required accessible spaces.

| Check | Rule | Threshold |
|---|---|---|
| Accessible path width | NBC 3.8.3.3 | ≥1500 mm clear |
| Accessible door clear width | NBC 3.8.3.8 | ≥850 mm clear |
| Accessible units (residential) | NBC 3.8.3.8 | ≥15% of units or ≥1 unit, whichever greater |
| Accessible washrooms | NBC 3.8.3.11 | Required where washrooms are provided |
| Turning circle | NBC 3.8.3.4 | 1500 mm diameter clear |
| Ramp slope | NBC 3.8.3.7 | Max 1:12 (8.3%) |

**Evaluable from floor plans:** door locations and rough counts; accessible suite symbols if drawn; washroom locations; ramp presence; actual clearances require dimension annotations.

### 1.6 Structural (framing — NOT evaluable from floor plans)

NBC Part 4 (engineered) and Part 9 (prescriptive) govern structural design. All structural checks require structural drawings (framing plans, structural sections, detail sheets), NOT floor plans.

Structural checks include:
- Stud size and species (NBC 9.5.5.2)
- Stud spacing (NBC 9.5.5.3, max 600 mm o.c. for bearing walls)
- Floor joist size and span (NBC 9.23.3.2)
- Fastener type, size, and spacing (NBC 9.23.9)
- Engineered wood connections (CSA O86)
- Header/lintel sizing over openings (NBC 9.23.5)
- Foundation sizing (NBC 9.12, 9.15)

**Not evaluable from floor plans under any circumstances.** These rules belong exclusively in a structural drawing analysis mode.

---

## Section 2 — Current App Coverage (as of May 2026)

### 2.1 drawingComplianceEngine.ts — Stage 2 Deterministic Engine

This engine receives Zod-validated extraction data and applies deterministic rules. It currently evaluates **eight rules** across three categories, of which only three are correctly scoped to floor plans.

#### Rules correctly scoped to floor plan analysis (3 rules)

| Rule ID | Clause | Description | Current Status |
|---|---|---|---|
| NBC-3.4.3.4 | 3.4.3.4 | Exit door minimum clear width 860 mm | Active, correctly evaluates `fireSafety.exitWidths[]` |
| NBC-3.4.1.9 | 3.4.1.9 | Corridor minimum width 1100 mm | Active, correctly evaluates `fireSafety.corridorWidths[]` |
| NBC-3.1.3.4 | 3.1.3.4 | Fire separation construction and rating | Active, evaluates `fireSafety.fireSeparations[]` — always CONDITIONAL due to verification requirement |

#### Rules incorrectly in this engine — WRONG LAYER (5 rules)

These rules are structural. They will always return `UNABLE_TO_EVALUATE` on any floor plan because the data they need (`structural.memberSizes[]`, `connections.fastenerTypes[]`) is never present in a floor plan image. They add noise to the compliance score calculation, create misleading recommendations, and obscure genuinely evaluable rules.

| Rule ID | Clause | Description | Problem |
|---|---|---|---|
| NBC-9.5.5.2 | 9.5.5.2 | Minimum stud size for bearing walls | Requires framing plan |
| NBC-9.5.5.3 | 9.5.5.3 | Stud spacing max 600 mm o.c. | Requires framing plan |
| NBC-9.23.3.2 | 9.23.3.2 | Floor joist size and span compliance | Requires framing/structural plan |
| NBC-9.23.9 | 9.23.9 | Fastener type and size requirements | Requires detail sheets |
| CSA-O86 | CSA O86 | Engineered wood connection design | Requires structural engineer drawings |

**These 5 rules must be removed from the floor plan analysis path and placed in a new `structuralComplianceEngine.ts` that activates only when `drawingType` is detected as `"structural"` or `"framing plan"`.**

### 2.2 roomComplianceEvaluator.ts — Room-Level Evaluator

This evaluator runs per-room and already implements 13 compliance checks. However, its results are stored in the `complianceResults` table and surfaced separately from the `drawingComplianceEngine` output. The drawing-level compliance score does NOT incorporate these room-level results.

#### Rules implemented in roomComplianceEvaluator.ts (13 rules, not in drawing score)

| Rule | NBC Reference | What it checks |
|---|---|---|
| Occupant load calculation | NBC Table 3.1.17.1 | Calculates OL from area and group factor |
| Exit count check | NBC 3.4.2.2 | Counts exit features vs required exits by OL |
| Sprinkler requirement | NBC 3.2.5.2 | Flags if group requires sprinklers but none detected |
| Fire alarm requirement | NBC 3.2.4.7 | Flags Group A/B rooms (building-level check) |
| Exit door width | NBC 3.4.3.4 | Checks door width metadata if available |
| Corridor width estimate | NBC 3.4.1.9 | Estimates from bounding box aspect ratio |
| Mixed occupancy fire separation | NBC 3.3.4.2 | Queries DB for adjacent groups, flags required separation |
| Occupant load plausibility | NBC Table 3.1.17.1 | Flags rooms whose area is implausibly small for group |
| Accessible door width | NBC 3.8.3.8 | Checks door width in accessible spaces |
| Part 3 vs Part 9 determination | NBC 9.1.1.1 | Reads project GFA from DB |
| Construction type implication | NBC 3.2.2 | Flags Group A/B non-combustible requirement |
| High hazard F-1 flag | NBC 3.2.5.2 | Flags fume hood/lab bench in Group F |
| Exit stair enclosure | NBC 3.4.3.1 | Checks stair rooms for fire-rated door feature |

These results are already being computed and stored; they need to be surfaced in the drawing-level compliance panel UI.

---

## Section 3 — Gap Analysis (Rules Missing From Both Evaluators)

These are rules a consultant always checks that are absent from both evaluators. Ordered by implementation feasibility.

### 3.1 Implementable with currently extracted data

| Gap | Clause | Threshold | Data available |
|---|---|---|---|
| Minimum bedroom area | NBC 9.5.2.3 | ≥7 m²; no dimension <2 m | `room.areaSqm` extracted; label regex for "bedroom" |
| Exit count per floor | NBC 3.4.2.2 | ≥2 exits if OL >60 | `room.features[].type === 'exit_sign'` and door counts; in room evaluator but not aggregated at floor level |
| Mixed occupancy fire separation flag | NBC 3.1.3.2 | 1 hr if C+D on same floor | Room occupancy groups already detected |
| Suite-to-suite fire separation | NBC 3.3.3.4 | 1 hr between Group C suites | Room adjacency from bounding box overlap analysis |
| Sprinkler requirement flag (drawing level) | NBC 3.2.5.2 | Sprinkler if A/B/F-1 and no `sprinkler_head` features | `room.features[]` already extracted |
| Accessible unit count | NBC 3.8.3.3 | ≥15% of units or ≥1 | Count Group C rooms labeled as "unit"; check for wheelchair symbol feature |

### 3.2 Implementable with confirmed drawing scale

| Gap | Clause | Threshold | Data needed |
|---|---|---|---|
| Travel distance to nearest exit | NBC 3.4.2.5 | ≤25 m unsprinklered; ≤45 m sprinklered | Scale bar detection; centroid-to-exit path distance |
| Exit stair clear width | NBC 3.4.6.3 | ≥900 mm | Stair bounding box minor dimension × scale factor |

### 3.3 Implementable with prompt improvements

| Gap | Clause | Threshold | Prompt change needed |
|---|---|---|---|
| Natural light ratio | NBC 9.13.2 | Window area ≥10% of room area | Window bounding box area estimation |
| Fire-rated wall indicators | NBC 3.1.3.4 | Rating annotation extraction | Detect hatching symbols and annotation callouts |
| Accessible suite identification | NBC 3.8.3.3 | Wheelchair symbol on unit | Add `accessible_unit_symbol` to feature detection list |
| Door width annotation extraction | NBC 3.4.3.4 | Width dimension string | Add door width dimension to feature metadata |

### 3.4 Not evaluable from floor plans (by design)

| Gap | Clause | Why not evaluable |
|---|---|---|
| Ceiling heights | NBC 9.5.3.1 | Requires section drawing |
| Window openable area | NBC 9.13.3 | Requires window schedule or elevation |
| Mechanical/electrical systems | NBC Part 6 | Requires MEP drawings |
| Foundation elements | NBC 9.12/9.15 | Requires structural drawings |
| Detailed stair geometry (riser/tread) | NBC 9.8.4 | Requires stair detail |

---

## Section 4 — Claude Vision Data Extraction Capabilities

### 4.1 Currently extracted and working

The following data is reliably extracted by the current Claude Vision pipeline (`roomDetectionService.ts` + `roomDetectionPrompt.ts`) and stored in `detectedRooms` / `detectedFeatures`:

- Room labels and approximate areas (`room.areaSqm`, `room.label`)
- Occupancy group classification A/B/C/D/E/F (`room.occupancyGroup`)
- Door locations and rough counts (`feature.type === 'door'`, `'door_fire_rated'`)
- Window locations (`feature.type === 'window'`)
- Stair locations (`feature.type === 'stair'`)
- Corridor identification (label regex on `room.label`)
- Fixture detection: `sprinkler_head`, `toilet`, `bathroom_sink`, `kitchen_sink`, `stove`
- Equipment detection: `lab_bench`, `fume_hood`, `nursing_station`
- Commercial features: `retail_counter`, `reception_desk`, `fixed_seating`, `loading_dock`
- Safety features: `exit_sign`, `fire_extinguisher`, `emergency_lighting`
- Elevator locations (`feature.type === 'elevator'`)
- Bounding box pixel coordinates for all rooms and features
- Drawing metadata: `drawingType`, `scale` (string from legend), `dimensionsVisible`, `drawingQuality`

### 4.2 Extractable with prompt improvement

| Data | How to improve | Use case |
|---|---|---|
| Door width from annotation | Add `width_mm` field to door feature metadata; instruct Vision to read dimension strings adjacent to door symbols | Exit width compliance (NBC 3.4.3.4) |
| Stair width from annotation | Add `width_mm` to stair feature metadata | Stair width compliance (NBC 3.4.6.3) |
| Scale bar detection | Add scale bar pixel coordinates to `DrawingMetadata`; derive m/pixel ratio | Travel distance (NBC 3.4.2.5), stair width |
| Fire-rated wall symbols | Add `fire_rated_wall` as a detectable feature type with rating annotation | Separation ratings (NBC 3.1.3.4) |
| Accessible unit symbol | Add `accessible_unit_symbol` (wheelchair icon) to feature detection list | Accessible unit count (NBC 3.8.3.3) |
| Window bounding box area | Extend window feature with `estimatedAreaSqm` field | Natural light ratio (NBC 9.13.2) |
| Room dimension strings | Extract annotated dimension labels (e.g. "3600 × 2800") into room metadata | Bedroom minimum dimension check (NBC 9.5.2.3) |

### 4.3 Cannot extract from floor plans (by design)

The following information is architecturally impossible to extract from a floor plan image regardless of prompt quality:

- Structural member sizes (stud dimensions, joist sizes, beam depths)
- Ceiling heights (requires section or elevation drawing)
- Fastener types and sizes (requires detail sheets)
- Window opening areas / sash dimensions (requires window schedule)
- Mechanical and electrical system details
- CSA standard callout numbers from specifications
- Soil bearing capacity or foundation engineering data
- Fire resistance assembly construction details (requires wall section details)

---

## Appendix A — Constraints Registry (as of May 2026)

All threshold values are defined in `server/engine/constraints/index.ts`. Never hardcode these values in rule logic; always reference `Constraints.*`.

| Constraint ID | Value | Unit | NBC Reference |
|---|---|---|---|
| `egress.travel_distance.unsprinklered` | 25 | m | NBC 3.4.2.5.(1) |
| `egress.travel_distance.sprinklered` | 45 | m | NBC 3.4.2.5.(2) |
| `egress.exit_width.minimum` | 860 | mm | NBC 3.4.3.4.(1) |
| `egress.corridor_width.minimum` | 1100 | mm | NBC 3.4.1.9.(1) |
| `egress.exit_count.threshold_low` | 60 | persons | NBC 3.4.2.2.(1) |
| `egress.exit_count.threshold_mid` | 600 | persons | NBC 3.4.2.2.(2) |
| `fire.separation.residential_suite` | 1.0 | hr | NBC 3.3.4.2.(1) |
| `fire.separation.residential_mercantile` | 1.0 | hr | NBC 3.3.4.2.(2) |
| `fire.separation.office_mercantile` | 0.75 | hr | NBC 3.3.4.2.(3) |
| `fire.separation.assembly_any` | 2.0 | hr | NBC 3.3.4.2.(4) |
| `fire.separation.institutional_any` | 2.0 | hr | NBC 3.3.4.2.(5) |
| `building_limits.part3_area_threshold` | 600 | m² | NBC 9.1.1.1 |
| `building_limits.part3_storey_threshold` | 3 | storeys | NBC 9.1.1.1 |
| `accessibility.path_width.minimum` | 1500 | mm | NBC 3.8.3.3.(1) |
| `accessibility.door_width.minimum` | 850 | mm | NBC 3.8.3.8.(1) |

Missing from registry (to be added for Phase B):

| Constraint ID | Value | Unit | NBC Reference |
|---|---|---|---|
| `residential.bedroom_area.minimum` | 7 | m² | NBC 9.5.2.3 |
| `residential.bedroom_dimension.minimum` | 2000 | mm | NBC 9.5.2.3 |
| `egress.stair_width.minimum` | 900 | mm | NBC 3.4.6.3 |
| `residential.accessible_units.fraction` | 0.15 | fraction | NBC 3.8.3.3 |

---

## Appendix B — Architectural Invariants

These design invariants MUST be maintained as rules are added:

1. **LLM extracts; engine evaluates.** The Claude Vision pipeline (`roomDetectionService.ts`, `drawingExtractionService.ts`) may only output structured observations. `drawingComplianceEngine.ts` and `roomComplianceEvaluator.ts` are the only places that produce pass/fail/conditional verdicts.

2. **Constraints are in one place.** All numeric thresholds live in `server/engine/constraints/index.ts`. Reference `Constraints.*`; never hardcode values in rule functions.

3. **Rules are categorized by drawing layer.** Floor plan rules go in `drawingComplianceEngine.ts` (drawing-level) or `roomComplianceEvaluator.ts` (room-level). Structural rules go in `structuralComplianceEngine.ts`. Never mix them.

4. **UNABLE_TO_EVALUATE is excluded from score.** The `calculateScore()` function skips rules with this result. New rules for Phase B must never return `UNABLE_TO_EVALUATE` for data that is already available in the extraction result; use `CONDITIONAL` instead.

5. **Audit trail is immutable.** `complianceAuditTrail` is INSERT-ONLY. Evaluation output changes require a new analysis record, not an update.
