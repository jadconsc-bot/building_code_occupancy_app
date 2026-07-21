# Step Code Test Remediation Plan

## Status
DEFERRED 2026-07-20. 26 tests skipped.

## Why deferred
Tests mix three layers without separation:
1. Pure calculation (TEDI/TEUI arithmetic)
2. Reference data (jurisdiction profiles, tier targets)
3. Router integration (DB, ownership, audit trail)

Fixture/expectation mismatches require primary-source
verification before any value can be trusted:
- Zone 4 Tier 3 TEDI: fixture has 25.00, test expects
  30.00 — verify against BCBC 2024 Table 9.36.6.2
- seismicRisk vs seismicZone field naming — verify
  against schema and source data
- currentStepCodeTier field absent from fixture

## Required actions
1. Verify TEDI/TEUI tier targets against BCBC 2024
   Table 9.36.6.2 (same primary-source discipline
   as NBC occupant load, fire separation, travel
   distance audits completed June 2026)
2. Export pure functions from stepCodeRouter.ts into
   a domain service file (stepCodeService.ts) —
   evaluateTEDI, evaluateTEUI, evaluateAirtightness,
   evaluateMechEfficiency are currently private
3. Write pure calculation tests against the exported
   service — no DB mock needed
4. Write reference-data tests against explicit fixture
   arrays verified against primary source
5. Write router integration tests against isolated
   test DB (see TEST_ISOLATION_PLAN.md)

## BCBC 2024 source articles
- Table 9.36.6.2 — Step Code energy targets by tier
- Table 9.36.2.3.A — Window/wall ratio by climate zone
- Section 9.36.6 — Compliance path requirements
