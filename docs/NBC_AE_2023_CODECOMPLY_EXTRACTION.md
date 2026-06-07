# NBC(AE) 2023 — CodeComply Rule Extraction
## Source: NR24-28/7-2023E — National Building Code – 2023 Alberta Edition (1st Printing)
## Extracted for: server/rules/overlays/alberta.ts + Home Report + Compliance Engine
## Status: PRIMARY SOURCE — use these values to replace/augment NBC 2020 base rules for province='AB'

---

## PART A — AUTHORITY & JURISDICTION

- **Governing legislation:** Safety Codes Act (R.S.A. 2000, c. S-1)
- **Issuing authority:** Alberta Municipal Affairs + Safety Codes Council
- **Alternative solutions:** Called "Variances" under the Safety Codes Act (not "Alternative Solutions" as in NBC 2020)
- **Amendments:** Alberta Municipal Affairs issues STANDATA (bulletins) to amend NBC(AE) between editions
- **Land use:** NBC(AE) 1.3.3.1(3) — Code does NOT permit construction where land use bylaw prohibits it
  → Validates our secondary suite zone permission check (P9-ZONE-SUITE-PERMISSION) as required pre-check
- **Permit trigger:** Building permit required before construction; alteration permitted if meets current code

---

## PART B — OCCUPANCY CLASSIFICATION (Division B, Table 3.1.2.1)
### Identical to NBC 2020 — no Alberta override

| Group | Division | Description |
|---|---|---|
| A | 1 | Assembly — performing arts |
| A | 2 | Assembly — not elsewhere classified |
| A | 3 | Assembly — arena type |
| A | 4 | Assembly — open air |
| B | 1 | Detention |
| B | 2 | Treatment |
| B | 3 | Care |
| C | — | Residential |
| D | — | Business and personal services |
| E | — | Mercantile |
| F | 1 | High-hazard industrial |
| F | 2 | Medium-hazard industrial |
| F | 3 | Low-hazard industrial |

Special classifications (Alberta-specific):
- Police station with detention quarters → B-2 if ≤1 storey + ≤600 m²  (3.1.2.4)
- Convalescent/children's custodial homes → C if ambulatory, single housekeeping unit, ≤10 persons (3.1.2.5)
- Arena-type buildings used occasionally for trade shows → A-3 (3.1.2.3)

---

## PART C — OCCUPANT LOAD (Table 3.1.17.1)
### Confirmed same as NBC 2020 — no Alberta override needed

| Use | Area per person (m²) |
|---|---|
| Assembly — non-fixed seats | 0.75 |
| Assembly — stages | 0.75 |
| Assembly — non-fixed seats + tables | 0.95 |
| Assembly — standing space | 0.40 |
| Assembly — stadia/grandstands | 0.60 |
| Assembly — bowling/pool/billiards | 9.30 |
| Assembly — classrooms | 1.85 |
| Assembly — school shops/vocational | 9.30 |
| Assembly — reading/writing/lounges | 1.85 |
| Assembly — dining/beverage/cafeteria | 1.20 |
| Assembly — school labs | 4.60 |
| Care/treatment/detention — suites | (2 per sleeping room) |
| Care/treatment — sleeping rooms | 10.00 |
| Detention quarters | 11.60 |
| Residential — dwelling units | (2 per sleeping room) |
| Residential — dormitories | 4.60 |
| Business — personal services | 4.60 |
| Business — offices | 9.30 |
| Mercantile — basement/first storey | 3.70 |
| Mercantile — second storey (principal entrance from parking/pedestrian) | 3.70 |
| Mercantile — other storeys | 5.60 |
| Industrial — manufacturing/process | 4.60 |
| Industrial — storage garages | 46.00 |
| Industrial — storage/warehouse | 28.00 |
| Industrial — aircraft hangars | 46.00 |
| Other — cleaning/repair goods | 4.60 |
| Other — kitchens | 9.30 |
| Other — storage | 46.00 |
| Public corridors (also used for occupancy) | 3.70 |

**Code reference:** NBC(AE) 2023 Article 3.1.17.1, Table 3.1.17.1
**Rule ID for engine:** OCCLOAD-3.1.17.1-AB

---

## PART D — TRAVEL DISTANCE (Articles 3.4.2.4 + 3.4.2.5)
### Core values IDENTICAL to NBC 2020 — confirmed

### Table 3.4.2.1.-A — One Exit (Unsprinklered)

| Occupancy | Max Floor Area (m²) | Max Travel Distance (m) |
|---|---|---|
| Group A | 150 | 15 |
| Group B | 75 | 10 |
| Group C | 100 | 15 |
| Group D | 200 | 25 |
| Group E | 150 | 15 |
| Group F-2 | 150 | 10 |
| Group F-3 | 200 | 15 |

### Table 3.4.2.1.-B — One Exit (Sprinklered), travel distance ≤25 m

| Occupancy | Max Floor Area (m²) |
|---|---|
| Group A | 200 |
| Group B | 100 |
| Group C | 150 |
| Group D | 300 |
| Group E | 200 |
| Group F-2 | 200 |
| Group F-3 | 300 |

### Article 3.4.2.5 — Location of Exits (max travel to nearest exit)

| Condition | Max travel distance (m) |
|---|---|
| High-hazard industrial (F-1) | 25 |
| Business and personal services (D) | 40 |
| Sprinklered throughout (any except F-1) | 45 |
| Open floor area with public corridor ≥9m wide, ceiling ≥4m, sprinklered | 105 |
| Storage garage (3.2.2.92) | 60 |
| All other floor areas | 30 |

**Exit separation:** min distance between 2 exits = half the max diagonal dimension of floor area,
but not less than 9m (or 6m if sprinklered + both discharges within 15m of street)

**Code reference:** NBC(AE) 2023 Subsection 3.4.2
**Rule IDs:** TRAVEL-3.4.2.5-AB, EXIT-3.4.2.1-AB

---

## PART E — PART 9 RESIDENTIAL — SECONDARY SUITES (KEY ALBERTA RULES)

### 9.5.3.1 — Ceiling Heights (TABLE 9.5.3.1)

| Room/Space | Min Ceiling Height (m) | Min Area Coverage |
|---|---|---|
| Living room | 2.10 | Lesser of room area or 10.0 m² |
| Dining room | 2.10 | Lesser of room area or 5.2 m² |
| Kitchen | 2.10 | Lesser of room area or 3.2 m² |
| Master bedroom | 2.10 | Lesser of room area or 4.9 m² |
| Other bedroom | 2.10 | Lesser of room area or 3.5 m² |
| Unfinished basement (incl. laundry) | 2.00 | Clear height under beams + passage areas |
| Bathroom/WC/laundry above grade | 2.10 | Lesser of room area or 2.2 m² |
| Passage/hall/vestibule | 2.10 | Full area |
| Other habitable rooms | 2.10 | Lesser of room area or 2.2 m² |

**ALBERTA-SPECIFIC OVERRIDE (9.5.3.1.(2) + (3)):**
- Secondary suite ceiling: **≥1.95 m** (NOT the standard 2.10 m)
- Clear height under beams/ducting in secondary suites: **≥1.85 m**

⚠️ This is a significant Alberta divergence. Our Home Report currently checks 2.10 m.
→ **Override rule:** If `isSuite=true` AND `province='AB'`, apply 1.95 m minimum (not 2.10 m)
→ **Rule ID:** CEIL-9.5.3.1-AB-SUITE

### 9.5.1.2 — Combination Rooms
- Two areas = combination room if opening ≥ larger of 3 m² or 40% of dependent area wall
- If dependent area is bedroom: direct passage required

### 9.5.4.1 — Hallway Width
- Standard: ≥860 mm unobstructed
- Reduced to 710 mm permitted if: only bedrooms/bathrooms at far end + second exit provided

### 9.5.5.1 — Doorway Sizes (Secondary Suite Override)
- Standard doorways: per Table 9.5.5.1
- **Secondary suite doors: ≥1,890 mm high** (where 1.95 m ceiling applies)

---

## PART F — EGRESS WINDOWS (Article 9.9.10.1)
### Confirmed same as currently implemented — no Alberta override

- Each bedroom (unless suite is sprinklered): ≥1 outside window or exterior door
- Openable from inside without keys, tools, or special knowledge
- Minimum opening: **≥0.35 m²** with no dimension **<380 mm**
- Must maintain opening without additional support during emergency
- Window well clearance: **≥760 mm** in front of window
- Sash swinging into well: must not reduce escape clearance
- Protective enclosure over well: openable from inside without keys/tools
- Security bars: openable from inside without keys/tools

**Code reference:** NBC(AE) 2023 Article 9.9.10.1
**Rule ID:** EGRESS-9.9.10.1-AB (same as NBC 2020 base — no override needed)

---

## PART G — SECONDARY SUITE DEFINITION (Alberta-Specific)

From Note A-1.4.1.2(1):
- Self-contained dwelling unit that is part of a house with ≤2 dwelling units (including suite)
- May be incorporated into existing house or new construction
- Permitted in: detached houses, semi-detached houses (half of double), row houses
- NOT permitted in buildings with multiple occupancies beyond the residential use
- **Requires municipal approval** per local land use bylaw — validates our zone permission check
- Secondary suites need NOT be considered separate dwelling units for purposes of fire separation in certain articles (9.9.10.9.4.(2))

---

## PART H — FIRE SEPARATION (Part 9 Suites — Article 9.10.9)

Key references found: 9.10.9.4, 9.10.9.6, 9.10.9.7, 9.10.9.16, 9.10.9.17
(Full text extraction needed for these — see below)

Fire separation between secondary suite and remainder of house is governed by 9.10.9.4 and 9.10.9.16.
Boarding and lodging houses: 9.10.9.16.
Storage rooms: 9.3.4.3, 9.10.10.6.

**TODO for E2 sprint:** Extract 9.10.9.4 and 9.10.9.16 full text for FRR values.

---

## PART I — MEZZANINE EGRESS (Table 3.4.2.2)

| Occupancy | Max Area (m²) | Distance Limit (m) |
|---|---|---|
| Assembly | 150 | 15 |
| Residential | 100 | 15 |
| Business and personal services | 200 | 25 |
| Mercantile | 150 | 15 |
| Medium-hazard industrial | 150 | 10 |
| Low-hazard industrial | 200 | 15 |

Conditions: occupant load ≤60, not required to terminate at fire separation.

---

## PART J — STANDATA SYSTEM (Alberta-Only)

Alberta Municipal Affairs issues STANDATA bulletins to amend NBC(AE) between editions.
These are the equivalent of code amendments and can override any clause.
**CodeComply action:** The RAIC governance monitoring agent (Phase 4 backlog) should monitor
Alberta Municipal Affairs STANDATA page, not RAIC, for Alberta-specific amendments.
URL to monitor: https://www.alberta.ca/building-technical-standards-standata

---

## PART K — WHAT'S DIFFERENT FROM NBC 2020 (Override Summary)

| Clause | NBC 2020 value | NBC(AE) 2023 value | Override type | Priority |
|---|---|---|---|---|
| 9.5.3.1.(2) Secondary suite ceiling height | 2.10 m | **1.95 m** | Replace | HIGH |
| 9.5.3.1.(3) Secondary suite beam clearance | 2.00 m | **1.85 m** | Replace | HIGH |
| 9.5.5.1.(2) Secondary suite door height | 1,980 mm | **1,890 mm** | Replace | MEDIUM |
| Alternative solutions | "Alternative Solutions" | "Variances" | Label only | LOW |
| STANDATA amendments | Not applicable | Active, monitor regularly | Add | MEDIUM |
| Occupancy table 3.1.2.1 | NBC 2020 | Identical | None needed | — |
| Occupant load table 3.1.17.1 | NBC 2020 | Identical | None needed | — |
| Travel distance 3.4.2.5 | NBC 2020 | Identical | None needed | — |
| Egress windows 9.9.10.1 | NBC 2020 | Identical | None needed | — |

---

## PART L — IMPLEMENTATION PRIORITY FOR E2

**Sprint E2-1 (highest value, immediate):**
1. `secondarySuiteRules.ts`: Update ceiling height check from 2.10m to 1.95m when `province='AB'`
2. `HomeReport PDF`: Note "NBC(AE) 2023 s.9.5.3.1(2)" as the citation for Alberta suite ceiling
3. Home Report rule P9-CEIL-HEIGHT: AB suite = 1.95m, other provinces = 2.10m
4. `complianceEngine.ts`: Wire `edition='NBC(AE) 2023'` when `province='AB'`

**Sprint E2-2 (medium value):**
5. Extract 9.10.9.4 + 9.10.9.16 fire separation FRR for suites
6. Create `server/rules/overlays/alberta.ts` with above override array
7. STANDATA monitoring note in governance agent

**Sprint E2-3 (lower priority):**
8. Door height override for secondary suites
9. Variance vs Alternative Solution label in permit PDF

---

## SOURCE CONFIRMATION

Document: National Building Code – 2023 Alberta Edition, Volume 1 + 2
ISBN (PDF): 978-0-660-68449-9
Cat. No.: NR24-28/7-2023E-PDF
Published: NRC-CNRC, First Printing 2024
Pages extracted: 1,570 pages, full text layer confirmed
