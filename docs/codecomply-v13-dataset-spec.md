# CodeComply v13 Dataset Specification
## Structural Multi-Class Floor Plan Segmentation

**Version:** 13 (draft)
**Date:** August 26, 2026
**Status:** Pre-annotation — pending annotator review and acceptance
**Roboflow project:** jose-acevedo/codecomply
**Supersedes: v12 (Canadian corrected rooms, single class))

---

## 1. Purpose

This specification governs the annotation of the CodeComply v13 training dataset. v13 expands from a single room class to a three-class structural schema: room, door, and window.

The goal is to give the segmentation model enough structural context to:
- Improve room boundary quality near openings
- Detect door locations for downstream portal model construction
- Identify window openings to distinguish exterior from interior walls
- Support travel distance graph construction and egress analysis

Walls and openings are deferred to v13. Three classes is the maximum that can be annotated consistently on Canadian permit drawings without dedicated annotator training.

---

## 2. Dataset Composition

### 2.1 Source Images

v13 uses the same source images already in the Roboflow project:

| Source | Images | Notes |
|--------|-------:|-------|
| FloorPlan-RoomType-segmentation (cleaned) | 2,819 | European residential, single class — room annotations only, door/window annotations optional |
| CodeComply production corrections | 26+ | Canadian permit drawings — all three classes annotated where visible |

All source images remain at their existing resolution. No re-export or preprocessing required.

### 2.2 Class Schema

| ID | Name | Annotation type | Priority |
|----|------|----------------|----------|
| 1 | room | Polygon (instance segmentation) | Required |
| 2 | door | Polygon (instance segmentation) | Required on Canadian drawings |
| 3 | window | Polygon (instance segmentation) | Required on Canadian drawings |

**Important:** Not every class must appear on every image. European source images may retain room-only annotations. Canadian production drawings must have door and window annotations where visible.

---

## 3. Annotation Rules

### 3.1 Room

**What to annotate:**
- The interior floor area of any enclosed space
- Include: bedrooms, bathrooms, kitchens, living areas, corridors, mechanical rooms, storage rooms, vestibules, stairwells

**Polygon guidance:**
- Trace the inner face of the walls (not the wall center or outer face)
- Do not include wall thickness in the room polygon
- For rooms with irregular shapes, follow the actual wall geometry — do not simplify to a rectangle
- Minimum room size: 0.5 m² equivalent at drawing scale (roughly 15×15px at 1:100 scale)

**What NOT to annotate as room:**
- Wall area
- Exterior spaces (patios, balconies that are open to outside)
- Spaces that are clearly not enclosed (open-plan areas without defined boundaries)
- Duplicate detections of the same room from different plan views on the same sheet

**Ambiguous cases:**
- Open-plan living/dining: annotate as one room if no physical partition exists
- Walk-in closets: annotate as a separate room if the entrance has a door or clear threshold
- Stairwells: annotate the floor area of the stair enclosure, not the stair steps themselves

---

### 3.2 Door

**Why this class matters:**
Doors are the primary input to the portal model — the room-to-room connectivity graph that travel distance and egress analysis depend on. Every annotated door becomes a potential portal edge in the compliance engine.

**What to annotate:**
- All door assemblies visible in the floor plan, including:
  - Swing doors (single and double)
  - Sliding doors
  - Pocket doors
  - Fire doors (annotate same as regular doors)
  - Exit doors

**Polygon guidance — standard swing door:**
- Annotate the door leaf + swing arc as a single polygon
- The arc indicates swing direction — this matters for egress assessment
- Trace the full quarter-circle arc from closed to open position
- Include the door leaf thickness in the polygon

**Polygon guidance — sliding door:**
- Annotate the door leaf in its closed position as a thin rectangle in the wall opening
- Do not include the track or pocket

**Polygon guidance — door without visible swing:**
- If the drawing shows only the door leaf with no arc: annotate the door leaf as a thin rectangle spanning the wall opening
- Minimum width: the visible opening width

**Minimum door size to annotate:**
- Opening width ≥ 600mm equivalent at drawing scale
- Do not annotate cabinet doors, closet bi-folds less than 600mm, or decorative openings

**What NOT to annotate as door:**
- Window openings
- Archways or open pass-throughs without a door leaf
- Hatching or wall patterns that resemble door symbols

---

### 3.3 Window

**Why this class matters:**
Windows identify exterior wall segments. A wall segment with a window is almost certainly an exterior wall. This distinction is needed to identify exit doors (doors in exterior walls) vs interior doors, and to support fire separation analysis (exterior walls have different FRR requirements than interior partitions).

**What to annotate:**
- All window openings visible in the floor plan, including:
  - Standard windows (casement, awning, fixed)
  - Sliding glass doors that function primarily as windows
  - Skylights shown in plan view

**Polygon guidance:**
- Annotate the window opening — the gap in the wall where the window sits
- Do NOT include the window frame, sill, or surrounding wall area
- The polygon should span the full width of the opening and the full depth of the wall thickness
- For windows shown as a simple line break in the wall: annotate a thin rectangle spanning the break

**Minimum window size to annotate:**
- Opening width ≥ 400mm equivalent at drawing scale
- Do not annotate small vents, louvres, or decorative openings

**What NOT to annotate as window:**
- Door openings
- Wall breaks caused by annotation text overlapping
- Hatching patterns

---

## 4. Quality Standards

### 4.1 Polygon precision

| Class | Required precision | Acceptable deviation |
|-------|-------------------|---------------------|
| room | High | ≤ 5% of room area outside actual boundary |
| door | Medium | ≤ 3px from visible door geometry |
| window | Medium | ≤ 3px from visible opening edges |

### 4.2 Consistency rules

These rules must be applied uniformly across all annotators and all images:

1. **Same room, same boundary** — if the same room appears on multiple sheets or at multiple scales, annotate its boundary consistently. Do not annotate it differently because one view is clearer.

2. **No partial annotations** — if you annotate one door on an image, annotate all visible doors on that image. Partial annotation (some doors annotated, some missed) is worse than no door annotation on that image.

3. **No overlapping polygons of the same class** — room polygons must not overlap. If two room detections overlap, keep the larger/more accurate one and delete the other.

4. **Doors and windows may overlap with rooms** — this is expected and correct. A door polygon will partially overlap the room polygon it serves.

5. **When in doubt, omit** — a missing annotation is better than a wrong annotation. If a feature is ambiguous, skip it.

### 4.3 Rejection criteria

An annotation session will be rejected if:
- More than 10% of annotated polygons are outside the actual feature boundary
- Any room polygon overlaps another room polygon on the same floor
- Doors are annotated on fewer than 50% of visible door symbols on an image
- Windows are confused with doors or vice versa on more than 5% of instances

---

## 5. Split Assignment

| Split | Target % | Assignment rule |
|-------|--------:|----------------|
| Train | 80% | All new Canadian production drawings |
| Validation | 10% | Random 10% of cleaned public dataset |
| Test | 10% | Held-out Canadian drawings NOT used in training |

**Critical:** The test set must contain only Canadian permit drawings that were not used in training. Do not allow European source images in the test set — they do not represent the production distribution.

---

## 6. Annotation Workflow

### Phase 1 — Canadian production drawings (highest priority)

1. Export current CodeComply corrections using `server/scripts/export-corrections-roboflow.ts`
2. Upload to Roboflow project as train split
3. For each uploaded image, open in Roboflow label editor and add door + window annotations
4. Review and accept each annotated image before marking complete
5. Target: all 26+ corrected room images annotated for all three classes

### Phase 2 — Expanded Canadian drawings

1. Collect additional Canadian permit drawings (Calgary residential new construction preferred)
2. Run through CodeComply Drawing Analyzer to get initial room detections
3. Correct polygon boundaries using the Review → Adjust Polygon → Save workflow
4. Export corrected rooms via the export script
5. Upload and annotate for door + window in Roboflow
6. Target: 100+ Canadian drawing images before v12 training

### Phase 3 — Public dataset door/window retrofit (optional)

If annotation capacity allows, add door + window annotations to the best-quality images from the cleaned FloorPlan-RoomType-segmentation dataset. Focus on images where door and window geometry is clearly visible.

This phase is optional — the Canadian drawings from Phase 1+2 will have more impact on production accuracy than retrofitting the European dataset.

---

## 7. Training Configuration

**Model:** RF-DETR Segmentation Small (same as v10/v11)
**Base checkpoint:** v11 weights (fine-tune, not train from scratch)
**Image size:** 640×640
**Classes:** 3 (room, door, window)
**Augmentation:** Roboflow defaults — rotation ±15°, brightness ±25%, blur up to 1.5px

**Do NOT use:**
- Horizontal flip (floor plans have directional meaning — flipping changes egress directions)
- Large rotation (>15° — permit drawings are always approximately orthogonal)

---

## 8. Acceptance Criteria for v12 Release

v13 replaces the active model in detect-count-and-visualize-2 only when ALL of the following are met:

- [ ] mAP@50 (room class) ≥ 85% on Canadian test set
- [ ] mAP@50 (door class) ≥ 70% on Canadian test set
- [ ] mAP@50 (window class) ≥ 65% on Canadian test set
- [ ] Fallback bbox rate on Canadian production drawings < 40% (down from current 57-80%)
- [ ] Zero regression on room detection: room count within ±15% of v11 on the same 5 reference drawings
- [ ] Visual inspection of 10 production analyses confirms door polygons align with visible door symbols

If door or window mAP is below threshold, the model may still be deployed with door/window detection disabled, using room-only output — v12 behavior is preserved as fallback.

---

## 9. Deferred to v13

The following classes are deferred pending annotation consistency validation:

**Wall** — wall volume polygon. Deferred because:
- Wall boundaries are ambiguous on hatched drawings
- High annotator disagreement expected without dedicated training
- Room polygons already imply wall locations between them

**Opening** — doorway without a door leaf. Deferred because:
- Ambiguous distinction from rooms on open-plan drawings
- Low count in Canadian permit drawings (most pass-throughs have doors)
- Can be approximated from room adjacency + absence of door annotation

---

## 10. Document History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 0.1 draft | 2026-08-26 | CodeComply senior dev session | Initial specification |

