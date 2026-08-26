# Documentation Index

This folder contains the main project docs and specs.

## High-priority references

- [CodeComply Build Guide](CODECOMPLY_BUILD_GUIDE.md)
- [CodeComply v13 Dataset Spec](codecomply-v13-dataset-spec.md)
- [CodeComply Training Data Roadmap](codecomply-training-data-roadmap.md)

## Dataset spec summary

`codecomply-v13-dataset-spec.md` defines the next training dataset for CodeComply:

- moves from room-only segmentation to a three-class schema: `room`, `door`, `window`
- keeps the same source images already in Roboflow
- uses Canadian production corrections as the highest-priority training set
- requires consistent room, door, and window annotation rules
- sets RF-DETR Small as the training target and recommends fine-tuning from existing weights

`codecomply-training-data-roadmap.md` is the broader planning document for the annotation pipeline and training flywheel:

- explains the dataset strategy and class expansion path
- documents current pipeline gaps and immediate next actions
- lays out phases for room, door, and window annotation rollout
- captures data governance and success metrics for the training program

## Other docs

- `ARCHITECTURE_NORTH_STAR.md`
- `DRAWING_ANALYSIS_FEASIBILITY.md`
- `FRR_CALCULATOR_REBUILD_SPEC.md`
- `NBC_AE_2023_CODECOMPLY_EXTRACTION.md`
- `STEP_CODE_TEST_REMEDIATION.md`
- `TEST_ISOLATION_PLAN.md`
- `UI_UX_WIREFRAME_MULTIDISCIPLINE_DASHBOARD.md`
- `USER_MANUAL.md`
- `VIDEO_SCRIPT.md`
