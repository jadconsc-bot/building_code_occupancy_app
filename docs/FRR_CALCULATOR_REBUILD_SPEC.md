# Fire Resistance Rating Calculator — Rebuild Spec

## Status
DISABLED — route returns METHOD_NOT_SUPPORTED.
No client caller exists (confirmed June 2026 recon).

## Why the old calculator was wrong
- Cited nonexistent "NBC 2023 Table 3.1.8.1"
- Article 3.1.8.1 is "General Requirements" only
- Fabricated single occupancy/storey FRR lookup table
- Area input ignored in all calculations
- Universal 25% sprinkler reduction has no NBC basis
- Group E labelled "Educational" (NBC Group E = Mercantile)
- F-1/F-3 hazard classifications inverted
- Single FRR applied to all building elements regardless
  of element type

## Correct NBC architecture
FRR requirements are distributed — not a single table.
Resolution requires:

1. Determine applicable 3.2.2 scenario article
   (already implemented in constructionTypeEngine.ts)
2. Read required ratings for:
   - Floor/roof assemblies (from 3.2.2.x article)
   - Structural members (from 3.2.2.x article)
   - Exterior walls/spatial separation (NBC 3.2.3)
   - Occupancy separations (NBC 3.1.3 / Table 3.1.3.1)
   - Suite/corridor separations (NBC 3.3)
   - Exit enclosures (NBC 3.4)
   - Vertical shafts/service rooms (NBC 3.5-3.6)
3. Apply element-specific requirements per context

## Inputs needed for a correct rebuild
- occupancyGroup (with division: A1/A2/B1/C/D/E/F1 etc.)
- storeys
- buildingAreaM2
- sprinklered
- facingStreets (for 3.2.2 scenario resolution)
- buildingElement (floor|roof|exterior_wall|structural|
  corridor|exit_enclosure|shaft|service_room)
- limitingDistanceM (for 3.2.3 spatial separation)
- adjacentOccupancyGroup (for 3.1.3 separation)

## Primary source articles to extract
- NBC 3.1.3.1 / Table 3.1.3.1 (already done — PR 1)
- NBC 3.2.2.20–3.2.2.92 (already done — scenario engine)
- NBC 3.2.3 (spatial separation — not yet extracted)
- NBC 3.3.1–3.3.4 (suites/corridors — partially done)
- NBC 3.4.3 (exit enclosures — partially done)
- NBC 3.5–3.6 (shafts/service rooms — not yet done)

## Estimated effort
2-3 weeks primary-source extraction + implementation.
Prerequisite: NBC 3.2.3 and 3.5-3.6 extraction.
