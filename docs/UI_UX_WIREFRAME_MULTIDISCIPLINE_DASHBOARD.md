# UI/UX Wireframe — Multi-Discipline Dashboard
**CodeComply — Building Code Occupancy App**  
**Version:** 1.0  
**Date:** May 5, 2026  

---

## 1. Global App Structure

```
┌──────────────────────────────────────────────┐
│  Top Nav                                     │
│  ├─ Logo | Project Selector | Notifications  │
│  └─ User Menu                                │
├──────────────────────────────────────────────┤
│  Left Sidebar                                │
│  ├─ Dashboard                                │
│  ├─ Field Mode (Builders)                    │
│  ├─ Design Mode (Architects)                 │
│  ├─ Engineer Mode                            │
│  ├─ Plan Analyzer                            │
│  ├─ Code Matrix                              │
│  ├─ Compliance Workflow (6-Step)             │
│  └─ Collaboration Workspace                  │
├──────────────────────────────────────────────┤
│  Main Content Area                           │
└──────────────────────────────────────────────┘
```

---

## 2. Builder Field Mode (Mobile-First)

**Purpose:** Give builders a 2-second compliance snapshot on site.

```
┌──────────────────────────────┐
│  FIELD MODE                  │
│  Project: Urban Nest         │
├──────────────────────────────┤

[ Occupancy Snapshot Card ]
┌──────────────────────────────┐
│  A-2 Assembly Occupancy      │
│  • Max Height: 2 storeys     │
│  • Max Area: 1,200 m²        │
│  • Sprinklers: Required      │
│  • Fire Alarm: Required      │
└──────────────────────────────┘

[ Fire Separation Card ]
┌──────────────────────────────┐
│  FIRE SEPARATIONS            │
│  • Suite-to-suite: 1h        │
│  • Corridor: 45 min          │
│  • Service rooms: 1h         │
└──────────────────────────────┘

[ Exits Card ]
┌──────────────────────────────┐
│  EXITS                       │
│  • Min exits: 2              │
│  • Travel distance: 30 m     │
│  • Exit width: 1100 mm       │
└──────────────────────────────┘

[ Quick Actions ]
┌──────────────────────────────┐
│  [ Upload Photo ] [ Notes ]  │
└──────────────────────────────┘
```

**Key UX Principles:**
- Zero scrolling for essential info
- Large tap targets
- Offline caching
- "Red flag" warnings when non-compliant

---

## 3. Architect Design Mode (Desktop)

**Purpose:** Support early design decisions, code matrices, and plan analysis.

```
┌──────────────────────────────────────────────────────────────┐
│  DESIGN MODE – Urban Nest                                    │
├──────────────────────────────────────────────────────────────┤

[ Left Panel – Tools ]
┌──────────────────────────────┐
│  • Occupancy Classification  │
│  • Code Matrix               │
│  • Egress Calculator         │
│  • Spatial Separation        │
│  • Barrier-Free Requirements │
│  • Export AHJ Package        │
└──────────────────────────────┘

[ Main Canvas ]
┌──────────────────────────────────────────────────────────────┐
│  OCCUPANCY + CODE MATRIX                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Occupancy: A-2 Assembly                                │  │
│  │ Construction Type: Non-combustible                     │  │
│  │ Max Area: 1,200 m²                                     │  │
│  │ Max Height: 2 storeys                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [ Table: Requirements by Category ]                         │
│  • Fire Protection                                           │
│  • Egress                                                    │
│  • Barrier-Free                                              │
│  • Structural                                                │
│  • Mechanical                                                │
│  • Electrical                                                │
└──────────────────────────────────────────────────────────────┘
```

**Key UX Principles:**
- Dense information layout
- Exportable sections
- Clear hierarchy of code requirements

---

## 4. Engineer Mode (Desktop)

**Purpose:** Provide calculation templates and system-specific code triggers.

```
┌──────────────────────────────────────────────────────────────┐
│  ENGINEER MODE – Urban Nest                                  │
├──────────────────────────────────────────────────────────────┤

[ Tabs ]
  Structural | Mechanical | Electrical

[ Structural Tab ]
┌──────────────────────────────────────────────────────────────┐
│  STRUCTURAL REQUIREMENTS                                     │
│  • Fire-resistance ratings                                   │
│  • Load-bearing wall rules                                   │
│  • Mezzanine rules                                           │
│  • Spatial separation → allowable openings                   │
│                                                              │
│  [ Calculation Templates ]                                   │
│  • FRR Calculator                                            │
│  • Opening Protection Calculator                             │
│  • Mezzanine Compliance Checker                              │
└──────────────────────────────────────────────────────────────┘
```

**Key UX Principles:**
- Engineers want precision → show formulas
- Inputs on left, outputs on right
- Exportable calculation sheets

---

## 5. Plan Analyzer V2 (Cross-Discipline)

**Purpose:** Upload a plan → get compliance issues.

```
┌──────────────────────────────────────────────────────────────┐
│  PLAN ANALYZER                                               │
├──────────────────────────────────────────────────────────────┤

[ Upload Zone ]
┌──────────────────────────────┐
│  Drag & Drop Floor Plan      │
│  or Browse Files             │
└──────────────────────────────┘

[ Results Panel ]
┌──────────────────────────────────────────────────────────────┐
│  DETECTED ELEMENTS                                           │
│  • Rooms (auto-labeled)                                      │
│  • Exits                                                     │
│  • Travel paths                                              │
│  • Fire separations                                          │
│                                                              │
│  COMPLIANCE FINDINGS                                         │
│  • 2 exits required — only 1 found (Critical)                │
│  • Travel distance exceeds 30 m (Warning)                    │
│  • Missing barrier-free washroom (Warning)                   │
└──────────────────────────────────────────────────────────────┘
```

**Key UX Principles:**
- Visual overlays
- Color-coded issues
- One-click export to AHJ package

---

## 6. Collaboration Workspace

**Purpose:** Let builders, architects, and engineers work together.

```
┌──────────────────────────────────────────────────────────────┐
│  COLLABORATION WORKSPACE                                     │
├──────────────────────────────────────────────────────────────┤

[ Left Panel – Threads ]
┌──────────────────────────────┐
│  • Fire Separation Issue     │
│  • Exit Width Review         │
│  • Mechanical Room Layout    │
└──────────────────────────────┘

[ Main Panel – Discussion ]
┌──────────────────────────────────────────────────────────────┐
│  THREAD: Fire Separation Issue                               │
│  ──────────────────────────────────────────────────────────  │
│  Architect: "Suite-to-suite wall must be 1h."                │
│  Builder: "Framing shows 45 min. Updating."                  │
│  Engineer: "Confirm mechanical penetration protection."      │
│                                                              │
│  [ Add Comment ]                                             │
└──────────────────────────────────────────────────────────────┘
```

**Key UX Principles:**
- Slack-like threads
- Attach plan snippets
- Role-tagged comments

---

## 7. Color + Style Guidelines

| Role | Color Palette | Style |
|---|---|---|
| Builders (Field Mode) | High contrast, yellow/red safety colors | Bold icons, large tap targets |
| Architects (Design Mode) | Neutral palette, blueprint blues | Structured tables, dense info |
| Engineers (Engineer Mode) | Technical greys, grid layouts | Formula-friendly spacing |
| Plan Analyzer | Green (OK), Yellow (warning), Red (critical) | Visual overlays |

---

*CodeComply UI/UX Wireframe v1.0 · May 5, 2026*
