# BC/AB Compliance Implementation Report
**CodeComply — Building Code Occupancy App**  
**Version:** 1.0  
**Date:** May 5, 2026  
**Status:** Phase 2 Foundation Complete  

---

## 1. Executive Summary

This report documents the current state of building code compliance implementation in CodeComply for Alberta (ABC 2023) and British Columbia (BCBC 2024), both based on the National Building Code of Canada 2020 (NBC 2020). It serves as the authoritative reference for seed data validation, rule engine coverage, and known gaps.

---

## 2. Applicable Code Editions

| Province | Code | Edition | Effective Date |
|---|---|---|---|
| Federal baseline | NBC | 2020 | January 1, 2020 |
| Alberta | ABC (NBC Alberta Edition) | 2023 | January 1, 2023 |
| British Columbia | BCBC | 2024 | March 8, 2024 |

---

## 3. Occupancy Classifications Implemented

All 13 NBC 2020 occupancy subdivisions are seeded in the `occupancyClassifications` table:

| ID | Group | Division | Name | NBC Reference |
|---|---|---|---|---|
| 1 | A | 1 | Assembly — Performing Arts | 3.1.2.1.(1)(a) |
| 2 | A | 2 | Assembly — General | 3.1.2.1.(1)(a) |
| 3 | A | 3 | Assembly — Arena Type | 3.1.2.1.(1)(a) |
| 4 | A | 4 | Assembly — Open Air | 3.1.2.1.(1)(a) |
| 5 | B | 1 | Institutional — Detention | 3.1.2.1.(1)(b) |
| 6 | B | 2 | Institutional — Treatment | 3.1.2.1.(1)(b) |
| 7 | B | 3 | Institutional — Care | 3.1.2.1.(1)(b) |
| 8 | C | — | Residential | 3.1.2.1.(1)(c) |
| 9 | D | — | Business & Personal Services | 3.1.2.1.(1)(d) |
| 10 | E | — | Mercantile | 3.1.2.1.(1)(e) |
| 11 | F | 1 | Industrial — High Hazard | 3.1.2.1.(1)(f)(i) |
| 12 | F | 2 | Industrial — Medium Hazard | 3.1.2.1.(1)(f)(ii) |
| 13 | F | 3 | Industrial — Low Hazard | 3.1.2.1.(1)(f)(iii) |

---

## 4. Code Rules Implemented (60 Total)

### 4.1 Egress Rules (8 rules — AB + BC)

| Rule | Threshold | Unit | NBC Section |
|---|---|---|---|
| Minimum exit door width | 860 | mm | 3.4.3.4.(1) |
| Minimum corridor width | 1100 | mm | 3.4.1.9.(1) |
| Maximum travel distance (unsprinklered) | 25 | m | 3.4.2.5.(1) |
| Maximum travel distance (sprinklered) | 45 | m | 3.4.2.5.(2) |

### 4.2 Sprinkler Rules (12 rules — AB + BC)

| Occupancy | Requirement | NBC Section |
|---|---|---|
| Group A Division 1 | Sprinklered throughout | 3.2.5.2.(1) |
| Group A Division 2 | Sprinklered if occupant load > 300 | 3.2.5.2.(1) |
| Group B Division 1 | Sprinklered throughout | 3.2.5.2.(1) |
| Group B Division 2 | Sprinklered throughout | 3.2.5.2.(1) |
| Group F Division 1 | Sprinklered throughout | 3.2.5.2.(1) |

### 4.3 Fire Resistance Rules (2 rules — generic)

| Rule | Threshold | Unit | NBC Section |
|---|---|---|---|
| Part 3 Non-Combustible minimum FRR | 2 | hr | 3.2.2 |
| Part 9 minimum FRR | 45 | min | 9.10 |

### 4.4 Fire Separation Rules (14 rules — AB + BC)

| Interface | Required FRR | NBC Section |
|---|---|---|
| Residential suite / adjoining suite | 1 hr | 3.3.4.2.(1) |
| Residential (C) / Mercantile (E) | 1 hr | 3.3.4.2.(2) |
| Office (D) / Mercantile (E) | 45 min | 3.3.4.2.(3) |
| Assembly (A) / any other | 2 hr | 3.3.4.2.(4) |
| Institutional B-1 / any other | 2 hr | 3.3.4.2.(5) |
| Institutional B-2 / any other | 2 hr | 3.3.4.2.(5) |
| High Hazard F-1 / any other | 2 hr | 3.3.4.2.(6) |

### 4.5 Occupant Load Rules (28 rules — AB + BC)

| Occupancy | Load Factor | Unit | NBC Section |
|---|---|---|---|
| Group A | 0.65 | m²/person | 3.1.17.1.(1) |
| Group B | 3.00 | m²/person | 3.1.17.1.(1) |
| Group C | 18.60 | m²/person | 3.1.17.1.(1) |
| Group D | 9.30 | m²/person | 3.1.17.1.(1) |
| Group E | 3.70 | m²/person | 3.1.17.1.(1) |
| Group F | 30.00 | m²/person | 3.1.17.1.(1) |

---

## 5. Jurisdiction Profiles

### 5.1 Alberta (12 cities)

| Municipality | Climate Zone | Seismic Zone | Step Code |
|---|---|---|---|
| Calgary | 6A | Low | No |
| Edmonton | 7A | Low | No |
| Red Deer | 7A | Low | No |
| Lethbridge | 6A | Low | No |
| Medicine Hat | 6A | Low | No |
| Fort McMurray | 7B | Low | No |
| Grande Prairie | 7A | Low | No |
| Airdrie | 6A | Low | No |
| High River | 6A | Low | No |
| Leduc | 7A | Low | No |
| Spruce Grove | 7A | Low | No |
| Canmore | 7A | Low | No |

**Alberta Amendments (ABC 2023):**
- Energy: NECB 2017 adopted as energy standard for Part 3
- No significant structural amendments to NBC 2020 fire/egress provisions

### 5.2 British Columbia (10 cities)

| Municipality | Climate Zone | Seismic Zone | Step Code |
|---|---|---|---|
| Vancouver | 4A | Very High | Yes (Tier 3) |
| Surrey | 4A | Very High | Yes (Tier 3) |
| Burnaby | 4A | Very High | Yes (Tier 3) |
| Richmond | 4A | Very High | Yes (Tier 3) |
| Kelowna | 5A | Intermediate | Yes (Tier 2) |
| Abbotsford | 4A | High | Yes (Tier 3) |
| Victoria | 4A | High | Yes (Tier 3) |
| Kamloops | 5B | Intermediate | Yes (Tier 2) |
| Prince George | 7A | Low | Yes (Tier 2) |
| Nanaimo | 4A | High | Yes (Tier 3) |

**BC Amendments (BCBC 2024):**
- Energy: BC Energy Step Code mandatory — minimum Tier 3 for most municipalities
- Accessibility: Enhanced requirements beyond NBC baseline (BCBC 2024 Section 10.4)
- Seismic: Enhanced requirements for Very High seismic zones (Lower Mainland)

---

## 6. Rule Engine Coverage

### 6.1 Compliance Engine (Building-Level)

The deterministic compliance engine (`server/complianceEngine.ts`) evaluates:

| Check | Status | Notes |
|---|---|---|
| Occupant load calculation | ✅ Implemented | Per occupancy type |
| Exit count required | ✅ Implemented | Based on occupant load |
| Travel distance | ✅ Implemented | 25m/45m thresholds |
| Fire resistance rating | ✅ Implemented | By occupancy + construction type |
| Sprinkler requirement | ✅ Implemented | By occupancy type |
| Construction type limits | ✅ Implemented | Part 3 vs Part 9 |
| Mixed occupancy detection | ✅ Implemented | Stack Planner |
| Exit door width | ⚠️ Partial | Not yet room-level |
| Corridor width | ⚠️ Partial | Not yet room-level |
| Barrier-free access | ❌ Not implemented | Phase 2 |
| Natural light requirements | ❌ Not implemented | Phase 2 |
| Ventilation requirements | ❌ Not implemented | Phase 2 |

### 6.2 Plan Analyzer v2 (Room-Level) — Phase 2

| Check | Status | Target |
|---|---|---|
| Room detection (bounding box) | ❌ In development | Sprint 3 |
| Per-room occupancy classification | ❌ In development | Sprint 3 |
| Feature detection | ❌ In development | Sprint 3 |
| Per-room compliance results | ❌ In development | Sprint 4 |
| Egress path calculation | ❌ In development | Sprint 4 |
| Fire separation per interface | ❌ In development | Sprint 4 |

---

## 7. Known Gaps and Limitations

### 7.1 Rule Coverage Gaps

| Category | Gap | Priority |
|---|---|---|
| Stair design | Rise/run dimensions not checked | High |
| Barrier-free | Path widths, washroom requirements | High |
| Natural light | Window area as % of floor area | Medium |
| Ventilation | HRV/ERV requirements | Medium |
| Structural | Beam/column/joist spans | Low (specialized) |
| Plumbing | Fixture counts by occupancy | Medium |
| Electrical | Emergency lighting coverage | Medium |

### 7.2 Jurisdiction Gaps

| Province | Status | Phase |
|---|---|---|
| Ontario | Profiles seeded, no rule amendments | Phase 3 |
| Quebec | Not supported, French language | Phase 3 |
| Saskatchewan | Not supported | Phase 3 |
| Manitoba | Not supported | Phase 3 |
| Municipal bylaws (Calgary, Vancouver) | Not supported | Phase 3 |

### 7.3 Drawing Analysis Gaps

| Gap | Impact | Phase |
|---|---|---|
| DWG file format | Users must export to PDF | Phase 3 |
| Cross-floor analysis | Stairwell continuity not checked | Phase 3 |
| French language drawings | OCR not supported | Phase 3 |
| Hand-drawn plans | Reduced accuracy | Ongoing |
| Multi-storey vertical separations | Per-floor only | Phase 3 |

---

## 8. Accuracy Targets (Phase 2)

| Metric | MVP Target | Current Status |
|---|---|---|
| Room detection accuracy | ≥ 90% (IoU ≥ 0.5) | Not yet measured |
| Occupancy classification | ≥ 85% exact match | Not yet measured |
| Code rule matching | ≥ 95% | ~95% (building-level) |
| Processing time per page | < 60 seconds | ~15-20s (estimated) |
| False positive rate | < 10% | Not yet measured |
| False negative rate | < 5% | Not yet measured |

---

## 9. Professional Disclaimer

All compliance results generated by CodeComply are decision-support outputs only. They do not constitute professional engineering or architectural advice. All results must be verified by a licensed architect, engineer, or code consultant before submission to authorities having jurisdiction (AHJ). The tool's outputs do not constitute legal or professional advice.

Results are cryptographically signed and immutable. Each compliance snapshot includes the rule engine version, model version, analyst name, and timestamp for full audit traceability.

---

## 10. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | May 5, 2026 | Initial report — Phase 2 DB foundation complete |

---

*Generated by CodeComply · Building Code Compliance Platform*  
*Rule Engine v1.0 · NBC 2020 / ABC 2023 / BCBC 2024*
