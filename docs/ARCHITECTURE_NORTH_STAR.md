# Architecture North Star — Spatial Compliance Engine
**CodeComply — Building Code Occupancy App**
**Version:** 1.0
**Date:** May 5, 2026

## Vision

Evolve from a compliance checker into a deterministic, explainable, constraint-aware spatial compliance engine capable of powering visual design guidance, AI-assisted reasoning, and permit-grade traceability.

## 10 Architectural Goals

### 1. Declarative Rule Evaluation
Rules must be composable, traceable, overrideable, jurisdiction-aware, and testable.
`rule.evaluate(context)` not `if (occupancy === "A-2") { ... }`

### 2. Compliance Reasoning Engine
Every evaluation must answer:
- WHY is this compliant?
- WHAT constraint governs it?
- WHAT would break compliance?
- HOW can compliance be restored?

### 3. Normalized Constraint Model
Reusable constraint primitives: egress.travel_distance, egress.exit_count, fire.separation, occupancy.load, accessibility.clearance. No hardcoded values scattered throughout the system.

### 4. Layered Rule Hierarchy
NBC base -> provincial override -> municipal override -> project override. No duplicated logic.

### 5. Deterministic Traceability
Every engine result must produce a trace object: result, rule, jurisdiction, source, reasoning, evaluatedInputs.

### 6. Spatial Reasoning Primitives
Room, Corridor, Exit, Path, Zone, FireSeparation, OccupancyArea — with coordinates, adjacency, circulation paths, distance calculations.

### 7. Visual Compliance Outputs
SVG diagrams, egress visualization, fire separation overlays, occupancy zoning, travel distance paths, compliance heatmaps. Geometry must not be coupled to UI components.

### 8. AI-Ready Explainability
Structured constraints, structured reasoning, structured outcomes, structured recommendations. No opaque text blobs.

### 9. Recommendation Capability
From "this fails" to "here are compliant alternatives" — suggested fixes, alternative layouts, occupancy adjustments, construction type alternatives.

### 10. Preserve Deterministic Behavior
AI may explain, visualize, suggest. Final compliance evaluation must remain deterministic, reproducible, auditable, testable.

## Code Quality Expectations

Favor: domain-driven architecture, pure evaluation functions, immutable evaluation contexts, composable rules, strongly typed models, semantic naming, explicit trace generation.

Avoid: giant switch statements, scattered constants, hidden side effects, frontend-coupled business logic, duplicated jurisdiction logic, untraceable pass/fail outputs.

## Desired End State

User intent -> code constraints derived -> spatial implications analyzed -> compliant options generated -> visual diagrams rendered -> deterministic traces produced -> reports exported.

*CodeComply Architecture North Star v1.0 · May 5, 2026*
