# CodeComply Training Data Roadmap
## Building a Professional-Grade Canadian Floor Plan Dataset

**Date:** August 26, 2026
**Status:** Active — v12 trained, v13 in annotation phase
**Model target:** RF-DETR Instance Segmentation Small (Roboflow)
**Roboflow project:** jose-acevedo/codecomply

---

## 1. Strategic Vision

CodeComply is positioned to become the primary generator of professionally annotated Canadian permit floor plan training data. No public dataset contains:

- Real Canadian permit drawings with AR room designation conventions
- Calibrated scale (known real-world dimensions per pixel)
- Occupancy classifications by qualified professionals
- Multi-class structural annotations (rooms, doors, windows)
- Alberta-specific building conventions and annotation density

Every correction a professional makes in CodeComply is a training annotation. The correction workflow is simultaneously a compliance tool and a data collection pipeline.

**The flywheel:**
```
Professional uploads permit drawing
    ↓
Model detects rooms (imperfectly)
    ↓
Professional corrects polygons + adds missed rooms
    ↓
Corrections captured with calibrated image crops
    ↓
Export pipeline → Roboflow → retrain
    ↓
Better model → fewer corrections → more value
    ↓
More drawings → more data → better model
```

---

## 2. Model Characteristics — RF-DETR Segmentation Small

Understanding the model architecture is essential for effective training data design.

### 2.1 Architecture

RF-DETR (Roboflow Detection Transformer) is a transformer-based object detector with an instance segmentation head. Key properties:

- **Input size:** 640×640 pixels (images are resized to this)
- **Detection paradigm:** End-to-end, no anchor boxes, no NMS post-processing
- **Segmentation:** Mask prediction per detected instance
- **Backbone:** Efficient transformer encoder optimized for speed
- **Training:** Fine-tuning from COCO pre-trained weights

### 2.2 What the model learns well

- Objects with consistent appearance across scales
- Clear boundary contrast between foreground and background
- Instance-level distinctions (individual rooms, not semantic regions)
- Categories that appear frequently in training data

### 2.3 What the model struggles with

- Very small objects (< 20×20px after 640px resize)
- Objects with similar appearance to background (hatched rooms blend with hatched walls)
- Highly elongated objects (thin corridors, narrow service rooms)
- Objects at the image edge (partial visibility)
- Dense, overlapping instances with ambiguous boundaries

### 2.4 Training data implications

**Image quality requirements:**
- Minimum 300 DPI scan equivalent
- Clean, high-contrast lines preferred over photocopied or photographed plans
- Consistent orientation (plans should be upright, not rotated >15°)
- Avoid plans with heavy coffee stains, shadows, or fold lines across room areas

**Annotation quality requirements:**
- Polygon precision: vertices should follow actual wall boundaries, not approximate rectangles
- Minimum instance area: ~0.1% of image area after 640px resize (roughly 640px² = about 40×16px minimum)
- Maximum vertices per polygon: 50 (more causes training instability; simplify complex shapes)
- Overlapping annotations: rooms can touch but should not overlap (except for door/window polygons which may overlap room polygons)

**Class balance requirements:**
RF-DETR learns from the frequency of each class in training data. If 90% of annotations are bedrooms and 2% are mechanical rooms, the model will be far better at bedrooms. Target:
- No class should be less than 5% of total annotations
- Mechanical/electrical/water rooms need deliberate overrepresentation
- Corridors and vestibules need deliberate overrepresentation

---

## 3. Current Dataset State

### 3.1 Version history

| Version | Images | Classes | mAP@50 | Notes |
|---------|-------:|---------|-------:|-------|
| v8 | ~25 | room | 74.9% | Original, small dataset |
| v10 | 2,843 | room | 90.2% | Public European dataset |
| v11 | 2,843+ | room | — | v10 + corrections upload attempted |
| v12 | 2,843+ | room | 83.6% | Canadian corrections mixed in, F1 balanced |

### 3.2 Current gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No Canadian permit drawings in training | Model generalizes poorly to AR labels, dense annotations | Critical |
| MECH/ELEC/WATER rooms underrepresented | 80%+ fallback on these room types | Critical |
| No door annotations | Portal model cannot be built | High |
| No window annotations | Exterior wall identification impossible | High |
| Polygon coordinates not crop-relative (export bug) | 25/26 corrections failed Roboflow upload | High |
| No calibrated scale in training metadata | Model cannot output real-world dimensions | Medium |

---

## 4. Annotation Pipeline — Current State

### 4.1 What already works

```
User corrects polygon in CodeComply
    ↓
correctionService writes to:
  - roomCorrections (correction record)
  - trainingExamples (imageCropBase64 + metadata)
  - detectedRooms (updated polygonJson, polygonSource: 'manual')
    ↓
export-corrections-roboflow.ts collects eligible rooms:
  - boundary_redraw corrections only
  - Must have imageCropBase64 AND polygonJson
  - Deduped by roomId (latest correction)
    ↓
COCO JSON generated → upload via roboflow-upload-retrain.ts
```

### 4.2 Known bugs to fix before next training cycle

**Bug 1 — Polygon coordinates are full-page, not crop-relative**
- Error: `annotation:outside` on 25/26 uploads
- Fix: subtract bounding box origin from each vertex before COCO export
- File: `server/scripts/export-corrections-roboflow.ts`
- Priority: Must fix before v13 upload

**Bug 2 — Occupancy not captured in saveRoomPolygon**
- The save mutation accepts label but not occupancyGroup
- For multi-class training (v13), occupancy class is the primary label
- Fix: extend saveRoomPolygon to accept and persist occupancyGroup
- Priority: Required for v13

**Bug 3 — Add Room tool not yet implemented**
- Missed rooms cannot be annotated through the UI
- Fix: implement polygon draw tool for new rooms (in progress)
- Priority: Required for comprehensive annotation sessions

---

## 5. Annotation Workflow — Target State

### 5.1 Annotation session workflow (per drawing)

This is the target workflow once all tools are built:

**Step 1 — Upload and calibrate**
1. Upload the permit drawing PDF or image to CodeComply
2. Set calibration using a known dimension on the drawing
3. Record: drawing address, occupancy type, number of storeys, jurisdiction

**Step 2 — Run initial analysis**
1. Click "Analyze" — model detects rooms automatically
2. Review the detected rooms overlay
3. Note which rooms are correctly detected, which need correction, which are missing

**Step 3 — Correct existing rooms**
1. For each room with an amber dashed border (fallback bbox):
   - Click Review → Adjust Polygon
   - Trace the actual room boundary carefully
   - Save — polygon is captured with the cropped image
2. For rooms with wrong labels:
   - Click the room → Edit Label
   - Set correct room name and occupancy group
   - Save

**Step 4 — Add missed rooms**
1. Click "Add Room" button (to be built)
2. Click canvas to trace polygon around the missed room
3. Enter room label and occupancy group
4. Save — creates new training example

**Step 5 — Export and upload**
1. Click "Export to Training" (to be built — one-click button)
2. System runs export-corrections-roboflow.ts automatically
3. Uploads to Roboflow as train split additions
4. Confirmation shows count of rooms exported

### 5.2 Quality gates per annotation session

Before an annotation session's data is included in training:
- [ ] All rooms on the drawing have annotations (no rooms skipped)
- [ ] All polygon vertices follow actual wall boundaries (not approximate rectangles)
- [ ] All room labels match the drawing's own room designations
- [ ] Occupancy group is set for every room
- [ ] Calibration is confirmed (scale is set)
- [ ] At least one MECH/ELEC/WATER room annotated if present on the drawing

---

## 6. Phase Roadmap

### Phase 1 — Fix and stabilize (immediate)

**Goal:** Make the current single-class pipeline reliable end-to-end.

| Task | Owner | Status |
|------|-------|--------|
| Fix polygon coordinate transform in export script | Codex | Pending |
| Deploy v12 to detect-count-and-visualize-2 | Manual | Ready |
| Implement Add Room polygon draw tool | Codex | In progress |
| Extend saveRoomPolygon to accept occupancyGroup | Codex | Pending |
| Run corrected export and upload to Roboflow | Manual | Blocked on coord fix |

**Success criteria:** 26 corrected rooms successfully uploaded to Roboflow with zero annotation:outside errors.

### Phase 2 — Scale Canadian data collection (2-4 weeks)

**Goal:** Accumulate 100+ Canadian permit drawing annotations, prioritizing underrepresented room types.

**Priority drawing types to annotate:**
1. Multi-unit residential (duplex, triplex, 4-plex) — highest frequency in Calgary permits
2. Mixed-use (ground floor commercial + residential above)
3. Drawings with MECH/ELEC/WATER rooms clearly labeled
4. Drawings with complex corridor layouts
5. Drawings with vestibules and secondary suites

**Target annotation counts by room type:**

| Room type | Current count | Target for v13 |
|-----------|-------------:|---------------:|
| Bedroom | ~200 | 300 |
| Bathroom/WR | ~150 | 250 |
| Living/Kitchen | ~100 | 200 |
| Corridor | ~30 | 100 |
| Storage | ~50 | 100 |
| MECH/ELEC/WATER | ~10 | 80 |
| Vestibule | ~20 | 60 |
| Stairwell | ~15 | 50 |

**One-click export button (to be built):**
A button in the DrawingAnalysis UI that:
- Runs the export pipeline in the background
- Shows progress (exporting N rooms...)
- Confirms upload to Roboflow
- Records which rooms were exported (marks trainingExamples.exportedAt)

### Phase 3 — Multi-class expansion (v13, 4-8 weeks)

**Goal:** Add door and window annotations to existing and new drawings.

**Model:** RF-DETR Segmentation Small, trained from v12 weights

**New annotation tools required:**
- Door polygon draw tool (similar to Add Room but for doors)
- Window polygon draw tool
- Class selector when drawing (room / door / window)

**Annotation rules:** See `docs/DATASET_V13_SPEC.md`

**Class schema for RF-DETR:**

| ID | Name | Roboflow label | Annotation shape |
|----|------|----------------|------------------|
| 1 | room | room | Polygon — interior floor area |
| 2 | door | door | Polygon — door leaf + swing arc |
| 3 | window | window | Polygon — wall opening only |

**Training configuration for v13:**
- Base: v12 weights (not COCO — preserves Canadian room detection)
- Augmentation: rotation ±10° only (floor plans are orthogonal)
- **No horizontal flip** — egress direction is meaningful
- **No vertical flip** — drawings have a consistent orientation
- Brightness ±20%, contrast ±15%
- Image size: 640×640 (unchanged)
- Epochs: 100 minimum, early stopping on validation mAP

**Why no flip augmentation:**
RF-DETR with flip augmentation on floor plans will learn that a door swinging left and a door swinging right are equivalent. They are not — left-swing and right-swing doors have different egress implications, different accessibility considerations, and different clearance requirements. Disabling flip preserves this semantically meaningful distinction.

### Phase 4 — Calibrated scale integration (v14, future)

**Goal:** Train the model to output real-world dimensions alongside polygon boundaries.

This requires custom training infrastructure beyond Roboflow's standard pipeline. Deferred until Phase 1-3 are validated.

---

## 7. Data Governance

### 7.1 What data can be used for training

**Can use:**
- Drawings uploaded by the account holder for their own projects
- Anonymized drawings where identifying information has been removed
- Drawings explicitly contributed by users for training purposes

**Cannot use without explicit consent:**
- Drawings uploaded by clients on behalf of others
- Drawings containing personal information (owner names, addresses in polygon annotations)
- Drawings under NDA or marked confidential

**Current implementation:** All training data is drawn from the user's own correction workflow. No drawing is exported to Roboflow without the user initiating the export. This is sufficient for the current single-user/single-account setup.

**For multi-tenant future:** Add a per-project "Include in training" toggle that defaults to off. Users opt in explicitly.

### 7.2 Privacy in training annotations

The COCO export includes:
- Cropped room images (small sub-regions of the drawing)
- Polygon coordinates
- Room labels (Bedroom AR-14, etc.)

It does NOT include:
- Full drawing images (only crops)
- Project address or owner information
- Any data from the compliance analysis

The crop-based approach is an accidental privacy safeguard — room crops rarely contain enough context to identify a specific property.

### 7.3 Model versioning and rollback

| Version | Deployed to | Rollback to |
|---------|------------|-------------|
| v12 | detect-count-and-visualize-2 | v11 |
| v13 (future) | detect-count-and-visualize-2 | v12 |

Never delete a Roboflow model version that was in production. Keep v10/v11/v12 indefinitely as rollback targets.

---

## 8. Success Metrics

### 8.1 Model quality metrics (per version)

| Metric | v12 (current) | v13 target | v14 target |
|--------|-------------:|----------:|----------:|
| mAP@50 (room) | 83.6% | ≥ 88% | ≥ 90% |
| mAP@50 (door) | — | ≥ 70% | ≥ 80% |
| mAP@50 (window) | — | ≥ 65% | ≥ 75% |
| Fallback bbox % (production) | ~50% | < 30% | < 20% |
| Phantom room rate | ~15% | < 8% | < 5% |
| Missed room rate | ~25% | < 15% | < 10% |

### 8.2 Pipeline health metrics

| Metric | Target |
|--------|--------|
| Annotation sessions per week | ≥ 2 |
| Rooms exported per session | ≥ 10 |
| Export success rate | ≥ 95% (zero annotation:outside) |
| Time from correction to Roboflow upload | < 5 minutes |

### 8.3 Training cycle cadence

| Trigger | Action |
|---------|--------|
| 50+ new corrected rooms accumulated | Export and upload to Roboflow |
| 200+ new rooms since last training | Trigger new model version |
| Fallback bbox rate > 60% on 3 consecutive analyses | Immediate retraining trigger |
| New room type appears frequently (e.g. secondary suite) | Manual retraining with targeted examples |

---

## 9. Immediate Next Actions

In priority order:

1. **Fix export coordinate transform** — `server/scripts/export-corrections-roboflow.ts`
   Subtract bounding box origin from polygon vertices before COCO export.
   Blocked: v13 upload cannot succeed without this.

2. **Deploy v12** — Update detect-count-and-visualize-2 workflow in Roboflow UI.
   Already trained, metrics confirmed, ready to deploy.

3. **Complete Add Room tool** — `client/src/components/DrawingAnalysis.tsx`
   In progress. Enables annotation of missed rooms.

4. **Extend saveRoomPolygon for occupancyGroup** — `server/routers/drawingAnalysisRouter.ts`
   One field addition. Required for multi-class training.

5. **Run first successful export + upload** — After fixes 1-3.
   Target: 26 rooms uploaded successfully to Roboflow train split.

6. **Conduct 5 annotation sessions** — With real Calgary permit drawings.
   Target: 50+ additional corrected rooms before v13 training.

7. **Commit v13 dataset spec** — `docs/DATASET_V13_SPEC.md`
   Already written. Commit alongside the Add Room tool.

---

## 10. Document History

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-08-26 | Initial roadmap — post v12 training |
