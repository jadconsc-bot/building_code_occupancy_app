# Building Code Occupancy Classifier - Comprehensive User Guide

**Version 2.0** | **Last Updated:** January 2026  
**Author:** Manus AI  
**Based on:** National Building Code of Canada (NBC) 2025 - Alberta Edition

---

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start Guide](#quick-start-guide)
3. [Occupancy Classifications](#occupancy-classifications)
4. [NBC 2025 Design Calculators](#nbc-2025-design-calculators)
5. [Project Management Features](#project-management-features)
6. [Rules Management System](#rules-management-system) **NEW**
7. [Advanced Features](#advanced-features)
8. [Mobile Features](#mobile-features)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Troubleshooting](#troubleshooting)
11. [References](#references)

---

## Introduction

The **Building Code Occupancy Classifier** is a comprehensive web application designed to assist architects, engineers, building inspectors, and construction professionals in navigating the complex requirements of the National Building Code of Canada (NBC) 2025, specifically tailored for Alberta's building regulations. This tool provides instant access to occupancy classifications, compliance requirements, and professional-grade design calculators that streamline the building design and approval process.

### Key Features

The application offers three primary categories of functionality that work together to provide a complete building code compliance solution. The **occupancy classification system** provides detailed information on all major building types from Assembly (Group A) to Industrial (Group F), including specific requirements for fire separation, construction limits, and egress design. The **design calculator suite** includes 25 specialized calculators covering stairs, guards, structural loads, accessibility, thermal performance, and ventilation systems. The **project management system** enables users to save calculations, compare occupancy types, track project progress, and generate inspector checklists.

### Who Should Use This Tool

This application serves multiple professional roles in the construction industry. **Architects and designers** use it during the schematic design phase to determine occupancy classifications and verify compliance with NBC requirements. **Structural engineers** rely on the load calculators and span tables for preliminary sizing of building elements. **Building officials and inspectors** reference the tool during plan review and site inspections to verify code compliance. **Contractors and project managers** use it to understand requirements and generate compliance checklists for construction phases.

---

## Quick Start Guide

### First-Time Setup

Upon opening the application, users are presented with a clean, organized interface divided into three main sections. The **left sidebar** displays all occupancy groups organized by major classification (A through F), with each group expandable to show specific divisions. The **main content area** shows detailed information about the selected occupancy type, including definition, examples, and compliance requirements. The **calculator tabs** at the top provide access to specialized design tools organized by discipline (Building Code, Plumbing, Electrical, Sustainability, Fire Safety, and Design Tools).

### Basic Workflow

A typical workflow begins with occupancy classification. Users start by searching for their building type using the search bar at the top of the sidebar (e.g., "restaurant", "hospital", "warehouse"). The system filters results in real-time and highlights matching occupancy groups. After selecting the appropriate classification, users review the detailed requirements including fire separation ratings, construction limits, and egress requirements displayed in the main content area.

Once the occupancy is confirmed, users proceed to the relevant calculators. For example, a residential project might require the **Stair Design Calculator** to verify riser and tread dimensions, the **Guard Height Calculator** to confirm barrier requirements, and the **Occupant Load Calculator** to determine egress capacity. Each calculator provides instant results with clear compliance indicators showing whether the design meets NBC requirements.

### Regional Settings

The application defaults to **Alberta (AB)** building code requirements, but users can select other Canadian provinces using the region selector in the top navigation bar. Different provinces may have specific amendments or variations to the National Building Code, and the tool adjusts calculations and requirements accordingly.

---

## Occupancy Classifications

The National Building Code organizes buildings into six major groups (A through F) based on their primary use and associated fire and life safety risks. Understanding these classifications is fundamental to applying the correct code requirements throughout the design and construction process.

### Group A: Assembly Occupancies

Assembly occupancies are buildings or portions of buildings used for gathering people for civic, political, travel, religious, social, educational, recreational, or similar purposes. The NBC divides Assembly occupancies into four divisions based on occupant load and risk factors.

#### A-1: Assembly with Fixed Seats (Division 1)

**Division A-1** encompasses assembly occupancies designed with fixed seating arrangements where occupants remain primarily seated during events. This classification includes **motion picture theatres** with stadium seating, **opera houses** featuring tiered balconies, **concert halls** with orchestra and mezzanine levels, and **legitimate theatres** for live performances. The fixed seating configuration allows for more precise occupant load calculations and typically results in more efficient egress design compared to open assembly spaces.

The fire and life safety requirements for A-1 occupancies reflect the challenges of evacuating large numbers of people from fixed seating areas. **Fire separation** requirements mandate 1-hour fire-resistance ratings for separations from other major occupancies and 45-minute ratings for corridors serving as exit access. **Construction limits** vary based on building height and area, with sprinklered buildings permitted to be larger and taller than non-sprinklered equivalents. **Egress design** must account for the time required for occupants to leave their seats, enter aisles, and proceed to exits, with specific requirements for aisle width, cross-aisles, and exit capacity based on the number of seats served.

#### A-2: Assembly Without Fixed Seats (Division 2)

**Division A-2** includes assembly spaces where occupants are not confined to fixed seating and may move freely throughout the space. Common examples include **art galleries** displaying rotating exhibitions, **auditoriums** used for multiple purposes, **bowling alleys** combining recreation and social gathering, **community halls** serving various functions, **exhibition halls** for trade shows and conventions, **gymnasiums** for sports and physical education, **museums** with open floor plans, **places of worship** with flexible seating, **restaurants** and **licensed beverage establishments** where patrons may stand or move between areas.

The absence of fixed seating in A-2 occupancies creates different evacuation dynamics and requires conservative occupant load calculations. The **occupant load factor** for A-2 spaces is typically 1.4 m² per person for areas without fixed seats, compared to one person per seat in A-1 occupancies. This results in higher calculated occupant loads and correspondingly greater exit capacity requirements. **Fire protection systems** including automatic sprinklers are often required based on building area and occupant load thresholds, with earlier triggers than A-1 occupancies due to the increased life safety risk.

#### A-3: Arena-Type Assembly (Division 3)

**Division A-3** specifically addresses large-scale assembly venues with arena-type seating configurations. This classification includes **arenas** for sporting events and concerts, **indoor swimming pools** with spectator seating, **skating rinks** serving both participants and observers, and similar facilities where a central performance or activity area is surrounded by tiered seating. The unique spatial configuration of A-3 occupancies presents specific challenges for egress design, as occupants must descend from elevated seating areas and converge at limited exit points.

The code requirements for A-3 occupancies emphasize **egress capacity** and **travel distance limitations**. Exit widths must accommodate peak egress flow from all seating levels simultaneously, with calculations accounting for the reduced flow rates on stairs compared to level surfaces. **Vomitory exits** (passages through seating areas leading to exit stairs) must be strategically located to limit travel distances and prevent bottlenecks. **Emergency lighting** and **exit signage** requirements are more stringent than other assembly types due to the potential for large crowds in partially darkened spaces.

#### A-4: Open-Air Assembly (Division 4)

**Division A-4** covers outdoor assembly facilities where occupants gather in open-air environments. Typical examples include **amusement park structures** such as roller coaster queuing areas and observation platforms, **bleachers** at outdoor sporting venues, **grandstands** at racetracks and fairgrounds, and **stadiums** with open-air seating. While these facilities benefit from natural ventilation and reduced fire spread risk, they present unique challenges related to weather protection, structural stability, and emergency egress during adverse conditions.

The code requirements for A-4 occupancies focus on **structural safety** and **egress reliability** under various environmental conditions. **Bleacher and grandstand design** must comply with specific structural loading requirements accounting for crowd dynamics and potential impact loads. **Exit capacity** calculations must consider the possibility of rapid evacuation during weather emergencies or other incidents. **Accessibility requirements** ensure that persons with disabilities can access and egress from elevated seating areas safely.

### Group B: Institutional Occupancies

Institutional occupancies house persons who require special care or supervision due to age, health conditions, or legal constraints. These facilities present unique life safety challenges because occupants may be unable to self-evacuate in emergency situations.

#### B-1: Treatment and Care (Division 1)

**Division B-1** encompasses facilities providing medical treatment or care to persons who are unable to evacuate without assistance. This classification includes **hospitals** providing acute care services, **nursing homes** for long-term care residents, **psychiatric facilities** treating patients with mental health conditions, and **residential care facilities** for persons with cognitive or physical disabilities. The common characteristic of B-1 occupancies is that occupants are bedridden, have limited mobility, or require continuous supervision and assistance.

The code requirements for B-1 occupancies are among the most stringent in the NBC due to the vulnerability of occupants. **Fire separation** requirements mandate 2-hour fire-resistance ratings for separations from other major occupancies and between different care areas within the facility. **Sprinkler protection** is mandatory regardless of building size or height, with additional requirements for smoke control systems and fire alarm systems with voice communication capabilities. **Egress design** must incorporate **areas of refuge** where non-ambulatory occupants can be moved temporarily while awaiting assisted evacuation. **Corridor widths** must accommodate hospital beds and medical equipment, with minimum clear widths of 2.2 meters for corridors serving patient rooms.

#### B-2: Detention and Correctional (Division 2)

**Division B-2** addresses facilities where occupants are detained for legal or correctional purposes and cannot freely evacuate. This classification includes **correctional facilities** (prisons and jails), **detention centers** for pre-trial custody, **juvenile detention facilities**, and **psychiatric detention units** where patients are held involuntarily. The defining characteristic of B-2 occupancies is that occupants are confined by locked doors and barriers, creating unique life safety challenges during emergencies.

The code requirements for B-2 occupancies balance security needs with life safety imperatives. **Fire separation** requirements are similar to B-1 occupancies, with 2-hour fire-resistance ratings for major separations. **Sprinkler systems** are mandatory, but the design must account for potential vandalism and security concerns. **Egress design** must incorporate **remote release systems** that allow security personnel to unlock cell doors and barriers from a central control point during emergencies. **Smoke control** is critical, as occupants cannot immediately evacuate and may be exposed to smoke for extended periods. The code requires **smoke barriers** dividing the facility into manageable zones, with mechanical smoke exhaust systems to maintain tenable conditions during evacuation.

#### B-3: Residential Care (Division 3)

**Division B-3** covers residential care facilities for persons who require supervision and assistance with daily living activities but are generally capable of responding to fire alarms and evacuating with staff assistance. This classification includes **group homes** for persons with developmental disabilities, **assisted living facilities** for seniors requiring some support, **residential addiction treatment centers**, and **halfway houses** for persons transitioning from institutional care. The distinction between B-3 and B-1 occupancies lies in the level of care required and the evacuation capabilities of residents.

The code requirements for B-3 occupancies are less stringent than B-1 but more demanding than residential occupancies. **Fire separation** requirements typically mandate 1-hour fire-resistance ratings for separations from other major occupancies. **Sprinkler protection** is required for buildings exceeding certain area and height thresholds, with lower triggers than residential occupancies. **Egress design** must provide at least two separate exits from each floor area, with travel distances limited to ensure residents can reach an exit quickly. **Fire alarm systems** must include voice communication capabilities to provide clear evacuation instructions to residents who may have cognitive impairments or hearing difficulties.

### Group C: Residential Occupancies

Residential occupancies are buildings or portions of buildings used for residential purposes where occupants sleep and carry out daily living activities. The NBC divides residential occupancies into three divisions based on building configuration and occupancy characteristics.

#### C-1: Dwelling Units (Division 1)

**Division C-1** encompasses buildings containing multiple dwelling units where each unit has independent cooking, sleeping, and sanitary facilities. This classification includes **apartment buildings** with three or more dwelling units, **condominium towers**, **student residences** with self-contained units, and **senior housing** with independent living units. The key characteristic of C-1 occupancies is that each dwelling unit functions as a complete, self-contained residence with its own means of egress to a common corridor or exterior exit.

The fire and life safety requirements for C-1 occupancies reflect the challenges of protecting sleeping occupants in multi-unit buildings. **Fire separation** between dwelling units requires 1-hour fire-resistance ratings for walls and floor assemblies, ensuring that a fire in one unit does not quickly spread to adjacent units. **Sprinkler protection** is required for buildings exceeding three storeys in height or 600 m² in building area, with the system designed to control fire growth and provide additional evacuation time. **Egress design** must provide access to at least two separate exits from each floor area, with travel distances limited to 45 meters in sprinklered buildings. **Corridor construction** serving dwelling units must have 45-minute fire-resistance ratings and be protected by smoke alarms or smoke detectors connected to the building fire alarm system.

#### C-2: Dwelling Units with Care (Division 2)

**Division C-2** addresses dwelling units that include provisions for care services to residents, but where residents maintain a higher level of independence than B-3 occupancies. This classification primarily includes **secondary suites** within single-family dwellings, where the suite occupants may receive some level of care or supervision from the primary dwelling occupants. The distinction between C-2 and other residential classifications lies in the relationship between the dwelling units and the nature of care provided.

The code requirements for C-2 occupancies focus on **fire separation** between the primary dwelling and secondary suite. A **1-hour fire separation** is required for the floor assembly and walls separating the units, constructed with specific materials and details outlined in NBC Article 9.10.9.14. **Egress requirements** mandate that each dwelling unit have an independent means of egress to the exterior, either through separate exterior doors or through a common vestibule with fire-separation from both units. **Smoke alarms** must be installed in each dwelling unit and interconnected so that activation in one unit alerts occupants in both units.

#### C-3: Hotels and Motels (Division 3)

**Division C-3** covers transient residential occupancies where guests rent rooms or suites for short-term accommodation. This classification includes **hotels** offering daily room rentals, **motels** with direct exterior access to guest rooms, **bed and breakfast establishments** with more than three guest rooms, **hostels** providing dormitory-style accommodation, and **resort lodges** combining accommodation with recreational facilities. The transient nature of occupancy in C-3 buildings creates unique life safety challenges, as guests are unfamiliar with the building layout and egress routes.

The code requirements for C-3 occupancies emphasize **egress clarity** and **fire protection systems**. **Exit signage** must be more prominent and frequent than in C-1 occupancies, with illuminated signs at every decision point along egress routes. **Sprinkler protection** is required for buildings exceeding two storeys in height or 600 m² in building area, with earlier triggers than C-1 occupancies due to the transient occupancy. **Fire alarm systems** must include voice communication capabilities to provide clear evacuation instructions to guests who may be sleeping or unfamiliar with the building. **Corridor widths** must accommodate luggage and cleaning equipment while maintaining minimum clear widths of 1.1 meters.

### Group D: Business and Personal Services

Business and personal services occupancies are buildings or portions of buildings used for professional, clerical, or service activities where occupants are generally awake and alert during business hours.

#### D-1: Business Offices (Division 1)

**Division D-1** encompasses buildings used primarily for business, professional, or administrative purposes. This classification includes **office buildings** housing corporate headquarters and professional services, **banks and financial institutions**, **medical and dental offices** where patients are ambulatory, **professional service offices** for lawyers, accountants, and consultants, and **government administrative buildings**. The occupants of D-1 buildings are typically familiar with the building layout and capable of self-evacuation during emergencies.

The code requirements for D-1 occupancies are moderate compared to assembly or institutional occupancies, reflecting the lower occupant density and higher evacuation capability. **Fire separation** requirements mandate 1-hour fire-resistance ratings for separations from other major occupancies. **Sprinkler protection** is required for buildings exceeding three storeys in height or 600 m² in building area. **Egress design** must provide at least two separate exits from each floor area, with travel distances limited to 45 meters in sprinklered buildings. **Occupant load** calculations use a factor of 9.3 m² per person for general office areas, reflecting typical workstation densities.

#### D-2: Personal Services (Division 2)

**Division D-2** covers buildings used for personal services where the public interacts with service providers in a retail-like environment. This classification includes **barber shops and beauty salons**, **dry cleaning and laundry facilities** with customer service areas, **repair shops** for appliances and electronics, **funeral homes** (excluding chapel areas which are classified as A-2), and **veterinary clinics** for ambulatory animals. The distinguishing feature of D-2 occupancies is the combination of service provision and customer waiting areas.

The code requirements for D-2 occupancies are similar to D-1, with additional considerations for service equipment and customer flow. **Fire separation** from adjacent occupancies requires 1-hour fire-resistance ratings. **Sprinkler protection** thresholds are the same as D-1 occupancies. **Egress design** must account for customer waiting areas and service equipment that may obstruct egress routes. **Occupant load** calculations use a factor of 4.6 m² per person for customer service areas, reflecting higher densities than general office spaces.

### Group E: Mercantile Occupancies

Mercantile occupancies are buildings or portions of buildings used for the display and sale of goods, wares, or merchandise. The NBC recognizes that mercantile occupancies present unique fire and life safety challenges due to high occupant densities, unfamiliar occupants, and combustible merchandise.

#### E-1: Retail Sales (Division 1)

**Division E-1** encompasses buildings used primarily for retail sales where customers browse and purchase merchandise. This classification includes **department stores** with multiple product categories, **shopping malls** with common circulation areas, **supermarkets and grocery stores**, **hardware stores and building supply centers**, **clothing and apparel stores**, **electronics retailers**, and **furniture showrooms**. The common characteristic of E-1 occupancies is that customers have direct access to merchandise and can move freely throughout the sales area.

The code requirements for E-1 occupancies address the challenges of evacuating unfamiliar occupants through potentially congested sales areas. **Fire separation** requirements mandate 1-hour fire-resistance ratings for separations from other major occupancies. **Sprinkler protection** is required for buildings exceeding 300 m² in building area, with much lower thresholds than other occupancy types due to the high fire load from merchandise. **Egress design** must provide clear, unobstructed exit access through sales areas, with travel distances limited to 30 meters in non-sprinklered buildings and 45 meters in sprinklered buildings. **Occupant load** calculations use a factor of 3.7 m² per person for main floor sales areas and 5.6 m² per person for other floors, reflecting the higher densities typically found on ground-level retail spaces.

#### E-2: Storage Areas (Division 2)

**Division E-2** addresses storage areas associated with mercantile occupancies where merchandise is stored and not directly accessible to customers. This classification includes **warehouse areas** within retail buildings, **stockrooms** and **back-of-house storage**, and **loading docks** and **receiving areas**. While E-2 areas are part of mercantile buildings, they have different occupancy characteristics and fire protection requirements than retail sales areas.

The code requirements for E-2 occupancies focus on **fire protection** and **structural loading**. **Sprinkler protection** is required for storage areas exceeding 600 m² in building area, with specific design requirements for high-piled storage. **Fire separation** from E-1 sales areas requires 45-minute fire-resistance ratings to prevent fire spread from storage to occupied areas. **Occupant load** calculations use a factor of 18.6 m² per person, reflecting the low occupant density in storage areas. **Structural design** must account for the higher live loads associated with merchandise storage, typically 4.8 kPa compared to 2.4 kPa for retail sales areas.

### Group F: Industrial Occupancies

Industrial occupancies are buildings or portions of buildings used for manufacturing, processing, assembling, repairing, or storing goods and materials. The NBC divides industrial occupancies into three divisions based on fire and explosion hazards.

#### F-1: High-Hazard Industrial (Division 1)

**Division F-1** encompasses industrial facilities where highly combustible or explosive materials are manufactured, processed, or stored. This classification includes **chemical plants** producing or using flammable chemicals, **explosives manufacturing facilities**, **paint and varnish manufacturing plants**, **petroleum refineries** and **fuel storage facilities**, and **facilities using flammable gases** in manufacturing processes. The defining characteristic of F-1 occupancies is the presence of materials that present severe fire or explosion hazards.

The code requirements for F-1 occupancies are the most stringent among industrial classifications, reflecting the extreme hazards present. **Fire separation** from other occupancies requires 2-hour fire-resistance ratings, with additional requirements for explosion-resistant construction. **Sprinkler protection** is mandatory regardless of building size, with specialized systems designed for the specific hazards present (foam systems for flammable liquids, dry chemical systems for combustible metals). **Egress design** must provide rapid evacuation capabilities, with travel distances limited to 15 meters in non-sprinklered buildings. **Explosion venting** is required for processes involving explosive materials, with vent areas calculated based on the volume of the space and the characteristics of the explosive atmosphere.

#### F-2: Medium-Hazard Industrial (Division 2)

**Division F-2** covers industrial facilities where moderate fire hazards exist due to the presence of combustible materials or processes. This classification includes **woodworking facilities** producing furniture or millwork, **textile manufacturing plants**, **food processing facilities**, **plastics manufacturing** (excluding highly flammable processes), and **general manufacturing** involving combustible materials. F-2 occupancies present significant fire hazards but do not involve the explosive or highly flammable materials found in F-1 facilities.

The code requirements for F-2 occupancies balance fire protection with operational flexibility. **Fire separation** from other occupancies requires 1-hour fire-resistance ratings. **Sprinkler protection** is required for buildings exceeding 600 m² in building area or two storeys in height. **Egress design** must provide at least two separate exits from each floor area, with travel distances limited to 30 meters in non-sprinklered buildings and 60 meters in sprinklered buildings. **Occupant load** calculations use a factor of 9.3 m² per person for industrial work areas, reflecting typical equipment and workspace layouts.

#### F-3: Low-Hazard Industrial (Division 3)

**Division F-3** addresses industrial facilities where fire hazards are minimal due to the non-combustible nature of materials and processes. This classification includes **metal fabrication shops** working with steel and aluminum, **electronics assembly facilities**, **cold storage warehouses**, **beverage bottling plants**, and **non-combustible material storage**. The distinguishing feature of F-3 occupancies is that the primary materials and products are non-combustible or have low fire hazard characteristics.

The code requirements for F-3 occupancies are the least restrictive among industrial classifications. **Fire separation** from other occupancies requires 1-hour fire-resistance ratings. **Sprinkler protection** is required for buildings exceeding 600 m² in building area or two storeys in height, with the same thresholds as F-2 occupancies. **Egress design** requirements are similar to F-2, with travel distances of 30 meters in non-sprinklered buildings and 60 meters in sprinklered buildings. **Construction type** can be less restrictive than F-1 or F-2, with combustible construction permitted in some configurations due to the low fire hazard.

---

## NBC 2025 Design Calculators

The application includes 25 specialized calculators organized into six categories: Building Code, Plumbing, Electrical, Sustainability, Fire & Life Safety, and Design Tools. Each calculator provides instant results with clear compliance indicators and the ability to export calculations for documentation purposes.

### Tier 1: Critical Design Calculators

#### Stair Design Calculator

The **Stair Design Calculator** is one of the most frequently used tools in the application, as stair design requirements are fundamental to every multi-level building. This calculator implements the requirements of **NBC Article 3.4.6** (Stairs, Ramps and Landings) and automatically determines the number of risers, riser height, number of treads, tread depth, total run, and handrail requirements based on the total rise and stair type (residential or commercial).

**Input Parameters:**
- **Stair Type:** Residential (Group C occupancies) or Commercial (all other occupancies)
- **Total Rise:** The vertical distance from one floor level to the next, measured in millimeters

**Calculation Method:**

The calculator first determines the maximum riser height permitted by the code. For residential stairs, the maximum riser height is **200 mm**, while commercial stairs are limited to **180 mm**. The minimum riser height for both types is **125 mm**. The number of risers is calculated by dividing the total rise by the maximum riser height and rounding up to the next whole number. The actual riser height is then calculated by dividing the total rise by the number of risers.

The minimum tread depth is **235 mm** for residential stairs and **280 mm** for commercial stairs. The number of treads is always one less than the number of risers (as the top riser terminates at the landing rather than a tread). The total run is calculated by multiplying the number of treads by the minimum tread depth.

**Compliance Indicators:**

The calculator displays a green checkmark if the calculated riser height falls within the permitted range (125-200 mm for residential, 125-180 mm for commercial) and a red warning icon if the design does not comply. Non-compliant designs typically indicate that the total rise is not compatible with standard riser heights, requiring either a floor level adjustment or a landing to break the run.

**Example Calculation:**

For a residential stair with a total rise of 2700 mm:
- Maximum riser height: 200 mm
- Number of risers: 2700 ÷ 200 = 13.5, rounded up to **14 risers**
- Actual riser height: 2700 ÷ 14 = **192.9 mm** (compliant)
- Number of treads: 14 - 1 = **13 treads**
- Minimum tread depth: **235 mm**
- Total run: 13 × 235 = **3,055 mm**

#### Batch Stair Calculator

The **Batch Stair Calculator** extends the functionality of the standard Stair Design Calculator by allowing users to calculate multiple stair scenarios simultaneously. This tool is particularly valuable for projects with multiple stair types (residential and commercial) or buildings with varying floor-to-floor heights.

**Workflow:**

Users add rows to the batch calculator, each representing a different stair scenario. For each row, users specify the stair type (residential or commercial) and total rise. After entering all scenarios, clicking "Calculate All" processes all rows simultaneously and displays results in a tabular format. The results show the number of risers, actual riser height, number of treads, tread depth, total run, and compliance status for each scenario.

**Export Functionality:**

The batch calculator includes an "Export Excel" button that generates a formatted Excel spreadsheet containing all calculation results. The exported file includes columns for scenario number, stair type, total rise, number of risers, riser height, number of treads, tread depth, total run, and code compliance status. This export feature is valuable for project documentation and submittal packages.

**Summary Statistics:**

The calculator displays a summary showing how many of the calculated designs are code compliant. This provides a quick overview of whether all scenarios meet NBC requirements or if adjustments are needed.

#### Guard and Handrail Calculator

The **Guard and Handrail Calculator** determines the required heights for guards (protective barriers) and handrails based on the location and occupancy type, implementing **NBC Article 3.4.6.5** (Guards) and **3.4.6.7** (Handrails).

**Input Parameters:**
- **Location:** Residential dwelling unit, residential common area, or commercial/assembly
- **Application:** Stair, ramp, landing, balcony, or mezzanine
- **Fall Height:** The vertical distance from the walking surface to the lower level

**Calculation Method:**

Guard height requirements vary significantly based on location and application. For **residential dwelling units**, guards are required when the fall height exceeds 600 mm, with a minimum guard height of 1070 mm for stairs and 920 mm for landings and balconies. For **residential common areas** (corridors, lobbies), guards are required when the fall height exceeds 600 mm, with a minimum height of 1070 mm for all applications. For **commercial and assembly occupancies**, guards are required when the fall height exceeds 600 mm, with a minimum height of 1070 mm.

Handrail height requirements are more consistent across occupancy types. For **residential stairs**, handrails must be installed at a height between 865 mm and 965 mm, measured vertically from the nosing of the treads. For **commercial stairs**, handrails must be between 865 mm and 920 mm. Handrails must be continuous for the full length of the stair flight and extend horizontally at least 300 mm beyond the top and bottom risers.

**Special Requirements:**

The calculator also indicates when **intermediate rails or guards** are required to prevent children from climbing or falling through openings. For residential occupancies, any opening in a guard must not permit the passage of a sphere 100 mm in diameter. For commercial occupancies, the maximum opening is 100 mm for guards less than 900 mm in height and 200 mm for guards 900 mm or higher.

#### Occupant Load Calculator

The **Occupant Load Calculator** determines the number of occupants for which a building or portion of a building must be designed, based on **NBC Table 3.1.17.1** (Occupant Load). This calculation is fundamental to egress design, as exit capacity, exit width, and the number of exits required are all based on occupant load.

**Input Parameters:**
- **Occupancy Category:** Assembly, Institutional, Residential, Business, Mercantile, or Industrial
- **Space Type:** Specific use within the selected category (e.g., "Assembly areas without fixed seats" or "Retail sales areas")
- **Floor Area:** The area of the space in square meters

**Calculation Method:**

The occupant load is calculated by dividing the floor area by the occupant load factor specified in NBC Table 3.1.17.1 for the selected space type. The result is always rounded up to the next whole number, as partial occupants are not permitted in code calculations.

**Occupant Load Factors by Category:**

| Occupancy Category | Space Type | Factor (m²/person) |
|-------------------|------------|-------------------|
| Assembly | Fixed seats | 0.75 |
| Assembly | Standing space | 1.2 |
| Assembly | Without fixed seats | 1.4 |
| Assembly | Exhibit halls, museums | 4.6 |
| Institutional | Treatment/care areas | 10.0 |
| Institutional | Sleeping areas | 4.6 |
| Residential | Dwelling units | 18.6 |
| Residential | Sleeping areas (hotels) | 9.3 |
| Business | Offices | 9.3 |
| Business | Retail sales areas | 4.6 |
| Mercantile | Sales areas (main floor) | 3.7 |
| Mercantile | Sales areas (other floors) | 5.6 |
| Mercantile | Storage areas | 18.6 |
| Industrial | Work areas | 9.3 |
| Industrial | Storage areas | 18.6 |

**Example Calculation:**

For a restaurant (Assembly - dining areas) with a floor area of 250 m²:
- Occupant load factor: 1.9 m²/person
- Occupant load: 250 ÷ 1.9 = 131.6, rounded up to **132 persons**

This occupant load would then be used to determine the required exit capacity (132 × 4.8 mm/person = 634 mm minimum exit width) and the number of exits required (two exits for occupant load > 60).

#### Exit Requirements Calculator

The **Exit Requirements Calculator** determines the number of exits required and the minimum width of each exit based on the occupant load, implementing **NBC Article 3.4.2** (Number of Exits) and **3.4.3** (Width and Capacity of Exits).

**Input Parameters:**
- **Occupant Load:** The calculated number of occupants (from Occupant Load Calculator)
- **Building Height:** Number of storeys (1-3, 4-6, or 7+)
- **Sprinklered:** Whether the building is protected by an automatic sprinkler system

**Calculation Method:**

The number of exits required is determined by the occupant load:
- **1 exit:** Occupant load ≤ 60 persons
- **2 exits:** Occupant load 61-500 persons
- **3 exits:** Occupant load 501-1000 persons
- **4 exits:** Occupant load > 1000 persons

The minimum width of exits is calculated based on the occupant load and the type of exit component. For **doors and ramps**, the required width is 4.8 mm per person. For **stairs**, the required width is 6.1 mm per person (reflecting the reduced flow rate on stairs compared to level surfaces). The total required exit width is divided equally among the required number of exits, but no exit may be less than 900 mm wide (the minimum door width for barrier-free access).

**Example Calculation:**

For a building with an occupant load of 250 persons:
- Number of exits required: **2 exits** (occupant load 61-500)
- Total exit width required (doors): 250 × 4.8 mm = **1,200 mm**
- Minimum width per exit: 1,200 ÷ 2 = **600 mm**
- Actual minimum width: **900 mm** (code minimum for barrier-free access)

### Tier 2: Building Envelope & Systems

#### Thermal Resistance Calculator

The **Thermal Resistance Calculator** determines the effective thermal resistance (RSI-value) of building assemblies, implementing the requirements of **NBC Section 9.36** (Energy Efficiency). This calculator helps designers verify compliance with minimum thermal resistance requirements for walls, roofs, and floors.

**Input Parameters:**
- **Assembly Type:** Wall, roof, or floor
- **Climate Zone:** Based on location (Alberta has multiple climate zones)
- **Construction Type:** Wood frame, steel frame, or concrete
- **Insulation Type:** Fiberglass batt, spray foam, rigid foam, or mineral wool
- **Insulation Thickness:** In millimeters

**Calculation Method:**

The effective thermal resistance is calculated by summing the RSI-values of all layers in the assembly, including structural components, insulation, air films, and sheathing materials. The calculator accounts for thermal bridging through framing members using the parallel path method or isothermal planes method as appropriate.

**Minimum Requirements by Climate Zone:**

| Assembly Type | Climate Zone 6 | Climate Zone 7A | Climate Zone 7B |
|--------------|----------------|-----------------|-----------------|
| Above-grade walls | RSI 3.85 | RSI 4.23 | RSI 4.67 |
| Roofs/ceilings | RSI 7.24 | RSI 8.81 | RSI 10.57 |
| Floors over unheated spaces | RSI 4.67 | RSI 5.46 | RSI 6.69 |
| Below-grade walls | RSI 2.11 | RSI 2.98 | RSI 3.52 |

#### Ventilation Rate Calculator

The **Ventilation Rate Calculator** determines the required ventilation rates for residential and commercial spaces based on **NBC Section 9.32** (Ventilation) and **9.33** (Heating, Ventilating and Air-Conditioning Systems).

**Input Parameters:**
- **Space Type:** Residential dwelling, office, retail, restaurant, or industrial
- **Floor Area:** In square meters
- **Number of Occupants:** For residential spaces, number of bedrooms
- **Special Conditions:** Kitchen exhaust, bathroom exhaust, or other local ventilation

**Calculation Method:**

For **residential dwelling units**, the principal ventilation rate is calculated using the formula:
- Ventilation rate (L/s) = 5 L/s + (number of bedrooms × 5 L/s)

For **commercial spaces**, ventilation rates are based on occupant density and space type:
- Office spaces: 10 L/s per person
- Retail spaces: 10 L/s per person
- Restaurants: 20 L/s per person (due to cooking odors)
- Industrial spaces: Variable based on contaminant generation

**Additional Requirements:**

The calculator also determines requirements for **kitchen exhaust** (minimum 50 L/s for residential kitchens), **bathroom exhaust** (minimum 25 L/s for residential bathrooms), and **clothes dryer exhaust** (as specified by appliance manufacturer).

### Tier 3: Structural Design Tools

#### Snow Load Calculator

The **Snow Load Calculator** determines the design snow load for roofs based on **NBC Section 4.1.6** (Snow and Rain Loads). Snow load is one of the primary design loads for buildings in Canadian climates and varies significantly by location.

**Input Parameters:**
- **Location:** City or region (determines ground snow load)
- **Roof Type:** Flat, sloped, curved, or multi-level
- **Roof Slope:** In degrees
- **Importance Category:** Normal, high, or post-disaster
- **Exposure Factor:** Sheltered, normal, or exposed
- **Thermal Factor:** Heated or unheated building

**Calculation Method:**

The design snow load is calculated using the formula:
- S = Is [Ss(CbCwCsCa) + Sr]

Where:
- **S** = specified snow load
- **Is** = importance factor for snow load (1.0 for normal, 1.15 for high importance, 1.25 for post-disaster)
- **Ss** = ground snow load (from NBC Appendix C, varies by location)
- **Cb** = basic roof snow load factor (accounts for roof slope)
- **Cw** = wind exposure factor (0.75 for exposed, 1.0 for normal, 1.1 for sheltered)
- **Cs** = roof slope factor (reduces load for steep roofs)
- **Ca** = shape factor (accounts for snow drifting and accumulation)
- **Sr** = associated rain load

**Example Calculation:**

For a building in Calgary, Alberta with a flat roof (slope < 15°):
- Ground snow load (Ss): 1.5 kPa
- Importance factor (Is): 1.0 (normal importance)
- Basic roof snow load factor (Cb): 0.8
- Wind exposure factor (Cw): 1.0 (normal exposure)
- Roof slope factor (Cs): 1.0 (flat roof)
- Shape factor (Ca): 1.0 (simple roof shape)
- Associated rain load (Sr): 0.4 kPa
- **Design snow load: S = 1.0 [1.5(0.8×1.0×1.0×1.0) + 0.4] = 1.6 kPa**

#### Accessibility Ramp Calculator

The **Accessibility Ramp Calculator** determines the required length and configuration of barrier-free ramps based on **NBC Section 3.8** (Barrier-Free Design). Ramps are essential for providing accessible routes for persons using wheelchairs, walkers, or other mobility aids.

**Input Parameters:**
- **Vertical Rise:** The height difference to be overcome, in millimeters
- **Ramp Type:** Interior or exterior
- **Maximum Slope:** 1:12 (8.33%) for interior ramps, 1:15 (6.67%) for exterior ramps in harsh climates

**Calculation Method:**

The minimum ramp length is calculated by dividing the vertical rise by the maximum permitted slope. For a **1:12 slope**, the horizontal run must be at least 12 times the vertical rise. For a **1:15 slope**, the horizontal run must be at least 15 times the vertical rise.

**Landing Requirements:**

The calculator also determines landing requirements:
- **Top and bottom landings:** Minimum 1,670 mm × 1,670 mm
- **Intermediate landings:** Required every 9,000 mm of horizontal run, minimum 1,670 mm × 1,670 mm
- **Door landings:** Minimum 1,200 mm × 1,670 mm on the pull side of doors

**Handrail Requirements:**

Ramps with a rise greater than 100 mm must have handrails on both sides, installed at a height between 865 mm and 965 mm. Handrails must extend horizontally at least 300 mm beyond the top and bottom of the ramp slope.

**Example Calculation:**

For an interior ramp with a vertical rise of 600 mm:
- Maximum slope: 1:12
- Minimum horizontal run: 600 × 12 = **7,200 mm** (7.2 meters)
- Number of intermediate landings: 0 (run < 9,000 mm)
- Total ramp length including landings: 7,200 + 1,670 + 1,670 = **10,540 mm** (10.54 meters)

### Calculation History Feature

Every calculator in the application includes a **calculation history** feature that automatically saves the last 10 calculations for each calculator type. This feature provides several benefits for users working on multiple projects or scenarios.

**Accessing History:**

A "History" button appears in the top-right corner of each calculator when previous calculations exist. Clicking this button opens a dropdown panel showing recent calculations with timestamps and preview information.

**Loading from History:**

Users can click the "Load" button next to any history item to instantly restore the inputs and results from that calculation. This is particularly useful when comparing different scenarios or returning to a previous design after exploring alternatives.

**Managing History:**

Individual history items can be deleted using the trash icon, or all history for a calculator can be cleared using the "Clear All" button. History is stored in the browser's local storage, so it persists across sessions but is specific to each device and browser.

**History Preview Format:**

Each history item shows a brief preview of the calculation, formatted to provide quick identification:
- **Stair Design:** "Residential - 2700mm rise → 14 risers"
- **Occupant Load:** "Assembly (dining) - 250 m² → 132 persons"
- **Snow Load:** "Calgary - Flat roof → 1.6 kPa"

---

## Project Management Features

The application includes comprehensive project management tools that enable users to organize calculations, track progress, and generate documentation for building permit submissions and construction coordination.

### Creating and Managing Projects

Users can create projects to organize related calculations and occupancy classifications. Each project has a unique name, description, and can contain multiple saved calculations and occupancy comparisons.

**Creating a New Project:**

Click the "Projects" button in the top navigation bar and select "New Project". Enter a project name (e.g., "Downtown Office Tower") and optional description. The project is immediately created and becomes the active project for all subsequent calculations.

**Switching Between Projects:**

The active project is displayed in the top navigation bar. Users can switch between projects by clicking the project name and selecting a different project from the dropdown list. All calculations and comparisons are automatically associated with the active project.

**Project Progress Tracking:**

The application tracks progress through several metrics:
- **Calculations completed:** Number of calculator results saved to the project
- **Occupancy classifications reviewed:** Number of occupancy groups accessed
- **Comparisons performed:** Number of occupancy comparison tables generated
- **Checklists created:** Number of inspector checklists generated

### Saving and Exporting Calculations

Each calculator includes export functionality that generates formatted Excel spreadsheets or PDF reports containing calculation inputs, results, and code references.

**Export to Excel:**

Clicking the "Export Excel" button generates a spreadsheet with the following structure:
- **Header section:** Project name, calculator type, date, and user information
- **Input parameters:** All values entered by the user
- **Calculation results:** All calculated values with units
- **Code references:** Relevant NBC articles and tables
- **Compliance summary:** Clear indication of whether the design meets code requirements

The Excel format allows users to incorporate calculation results into larger project documentation packages or modify formatting to match company standards.

**Export to PDF:**

The PDF export option generates a formatted report suitable for inclusion in building permit submissions. The PDF includes:
- **Cover page:** Project name, calculator type, and date
- **Calculation summary:** Inputs and results in a clear, professional format
- **Code compliance statement:** Explicit confirmation of code compliance
- **NBC references:** Citations to specific code articles and tables
- **Professional stamp area:** Space for professional engineer or architect stamp and signature

### Occupancy Comparison Tool

The **Occupancy Comparison** tool allows users to compare requirements for different occupancy classifications side-by-side. This is particularly valuable when a building contains multiple occupancy types or when evaluating the impact of occupancy classification decisions on design requirements.

**Creating a Comparison:**

From any occupancy detail page, click the "Compare" button in the top-right corner. This adds the current occupancy to the comparison list. Navigate to other occupancy types and add them to the comparison. Once two or more occupancies are selected, click "View Comparison" to generate a side-by-side comparison table.

**Comparison Table Contents:**

The comparison table includes the following categories:
- **Fire separation requirements:** From other major occupancies and within the occupancy
- **Construction limits:** Maximum building area and height by construction type
- **Sprinkler requirements:** Thresholds for mandatory sprinkler protection
- **Exit requirements:** Number of exits and travel distance limits
- **Occupant load factors:** For calculating design occupancy
- **Structural loads:** Live loads, dead loads, and snow loads

**Exporting Comparisons:**

Comparison tables can be exported to Excel or PDF formats for project documentation. The exported comparison includes all selected occupancies with complete requirement details.

### Inspector Checklist Generator

The **Inspector Checklist Generator** creates customized inspection checklists based on the selected occupancy type and project phase. These checklists help ensure that all code requirements are verified during construction and final inspection.

**Generating a Checklist:**

From any occupancy detail page, click the "Inspector Checklist" button. Select the project phase (Foundation, Framing, Rough-in, Finishes, or Final) and any special systems (Sprinkler, Fire Alarm, Accessibility Features). The generator creates a comprehensive checklist specific to the selected occupancy and phase.

**Checklist Contents:**

Each checklist includes:
- **Project information:** Occupancy classification, building description, and permit number
- **Inspection items:** Specific code requirements to be verified, organized by building system
- **Code references:** NBC article numbers for each inspection item
- **Verification method:** How to verify compliance (measurement, visual inspection, testing)
- **Pass/Fail checkboxes:** For inspector to mark during site visit
- **Notes section:** Space for inspector comments and deficiency descriptions

**Using Checklists:**

Checklists can be printed for field use or exported to PDF for digital inspection workflows. Many building departments accept these checklists as supporting documentation for inspection requests.

---

## Advanced Features

### Favorites and Bookmarks

Users can mark frequently used occupancy classifications as "favorites" for quick access. Click the star icon next to any occupancy group name to add it to favorites. Favorited occupancies appear at the top of the sidebar for easy access.

### Search Functionality

The search bar at the top of the sidebar provides instant filtering of occupancy classifications. Users can search by:
- **Occupancy code:** "A-2", "C-1", "F-3"
- **Building type:** "restaurant", "hospital", "warehouse"
- **Keywords:** "assembly", "residential", "industrial"

The search updates in real-time as users type, highlighting matching occupancy groups and expanding categories to show relevant divisions.

### Voice Search

The microphone icon next to the search bar activates voice search. Users can speak building types or occupancy codes, and the application will filter results accordingly. This feature is particularly useful when reviewing plans hands-free or when accessing the application on mobile devices.

### Regional Code Variations

The region selector in the top navigation bar allows users to switch between provincial building codes. While the application is based on the National Building Code of Canada, provinces may have specific amendments or variations. Selecting a different province updates requirements and calculations to reflect regional differences.

### Keyboard Shortcuts

Power users can navigate the application using keyboard shortcuts:
- **Ctrl+K** or **Cmd+K:** Focus search bar
- **Ctrl+P** or **Cmd+P:** Open projects menu
- **Ctrl+S** or **Cmd+S:** Save current calculation to project
- **Ctrl+E** or **Cmd+E:** Export current calculation
- **Ctrl+H** or **Cmd+H:** Open calculation history
- **Arrow keys:** Navigate between occupancy groups in sidebar
- **Enter:** Open selected occupancy group
- **Esc:** Close open panels and dialogs

---

## Mobile Features

The application is fully optimized for mobile devices, with several features specifically designed for on-site use by inspectors, contractors, and field personnel.

### Touch Gesture Navigation

On mobile devices, users can swipe left or right to navigate between calculator tabs. This gesture-based navigation provides a natural, app-like experience that is faster than tapping tab buttons.

**Swipe Gestures:**
- **Swipe left:** Move to the next tab (Building Code → Plumbing → Electrical → etc.)
- **Swipe right:** Move to the previous tab
- **Swipe threshold:** 50 pixels to trigger navigation

### Mobile-Optimized Input

All numeric input fields use mobile-optimized keyboards that display only numbers and decimal points, making data entry faster and reducing input errors. The application also includes real-time validation with visual feedback (green checkmarks for valid inputs, red warnings for invalid inputs).

### Offline Mode

The application includes **Progressive Web App (PWA)** functionality that enables offline access to previously viewed content and calculations. When users lose internet connectivity, the application automatically switches to offline mode and displays a notification badge.

**Offline Capabilities:**
- **Occupancy classifications:** All previously viewed occupancy details are cached for offline access
- **Calculators:** All calculator interfaces remain functional offline
- **Calculation history:** Previously saved calculations are accessible from local storage
- **Saved projects:** Project data is synchronized when connectivity is restored

**Installing as PWA:**

On supported browsers (Chrome, Edge, Safari), users can install the application as a Progressive Web App:
1. Open the application in the mobile browser
2. Tap the browser menu (three dots)
3. Select "Add to Home Screen" or "Install App"
4. The application icon appears on the device home screen
5. Launching from the home screen opens the app in full-screen mode without browser UI

### Offline Indicator

When the device loses internet connectivity, a badge appears at the bottom of the screen indicating "Offline mode - Using cached data". When connectivity is restored, the badge changes to "Back online" for three seconds before disappearing.

---

## Keyboard Shortcuts

The application supports comprehensive keyboard navigation for power users who prefer keyboard-driven workflows.

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+K** or **Cmd+K** | Focus search bar |
| **Ctrl+P** or **Cmd+P** | Open projects menu |
| **Ctrl+/** or **Cmd+/** | Show keyboard shortcuts help |
| **Esc** | Close open panels and dialogs |

### Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| **Arrow Up/Down** | Navigate between occupancy groups in sidebar |
| **Enter** | Open selected occupancy group |
| **Tab** | Move focus to next interactive element |
| **Shift+Tab** | Move focus to previous interactive element |

### Calculator Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+S** or **Cmd+S** | Save current calculation to project |
| **Ctrl+E** or **Cmd+E** | Export current calculation |
| **Ctrl+H** or **Cmd+H** | Open calculation history |
| **Ctrl+Enter** or **Cmd+Enter** | Execute calculation (when all inputs are valid) |

### Accessibility Shortcuts

| Shortcut | Action |
|----------|--------|
| **Alt+1** through **Alt+6** | Navigate to calculator tabs (1=Building, 2=Plumbing, etc.) |
| **Ctrl+Shift+F** or **Cmd+Shift+F** | Toggle favorites panel |
| **Ctrl+Shift+C** or **Cmd+Shift+C** | Open occupancy comparison tool |

---

## Troubleshooting

### Common Issues and Solutions

#### Calculator Results Not Displaying

**Symptom:** After entering inputs and clicking "Calculate", no results appear.

**Possible Causes:**
1. **Invalid input values:** One or more inputs may be outside the valid range
2. **Required fields empty:** Some inputs may be required but not filled in
3. **Browser compatibility:** The browser may not support required features

**Solutions:**
1. Check for red warning icons next to input fields indicating validation errors
2. Ensure all required fields (marked with asterisks) are filled in
3. Try refreshing the page and re-entering inputs
4. Update to the latest version of Chrome, Firefox, Edge, or Safari

#### Calculation History Not Saving

**Symptom:** Calculations are not appearing in the history panel.

**Possible Causes:**
1. **Browser privacy settings:** Local storage may be disabled
2. **Incognito/private browsing:** History is not saved in private browsing modes
3. **Storage quota exceeded:** Browser storage may be full

**Solutions:**
1. Check browser settings to ensure local storage is enabled
2. Use the application in normal browsing mode (not incognito/private)
3. Clear browser cache and cookies to free up storage space
4. Delete old history items to make room for new calculations

#### Export Functions Not Working

**Symptom:** Clicking "Export Excel" or "Export PDF" does not generate a file.

**Possible Causes:**
1. **Pop-up blocker:** Browser may be blocking the download
2. **No results to export:** Calculation must be completed before exporting
3. **Browser compatibility:** Export features require modern browser APIs

**Solutions:**
1. Check browser settings to allow pop-ups and downloads from the application
2. Ensure the calculation has been completed and results are displayed
3. Try a different browser (Chrome and Edge have the best compatibility)
4. Check the browser's download folder for the exported file

#### Mobile Swipe Gestures Not Working

**Symptom:** Swiping left or right on mobile devices does not change tabs.

**Possible Causes:**
1. **Browser compatibility:** Some mobile browsers may not support touch events
2. **Conflicting gestures:** Other touch handlers may be interfering
3. **Insufficient swipe distance:** Swipe must exceed 50 pixels to trigger

**Solutions:**
1. Ensure you are using a modern mobile browser (Chrome, Safari, Edge)
2. Try swiping with more force or distance
3. Use the tab selector dropdown as an alternative navigation method

#### Offline Mode Not Activating

**Symptom:** Application shows errors when internet connectivity is lost.

**Possible Causes:**
1. **Service worker not installed:** PWA features may not be enabled
2. **Content not cached:** Pages must be visited while online before offline access
3. **Browser compatibility:** Offline mode requires service worker support

**Solutions:**
1. Visit the pages you need while online to ensure they are cached
2. Install the application as a PWA for better offline support
3. Use Chrome, Edge, or Safari for best PWA compatibility
4. Check browser settings to ensure service workers are enabled

### Getting Help

If you encounter issues not covered in this troubleshooting section, several resources are available:

**In-App Help:**
- Click the "?" icon in the top navigation bar to access contextual help
- Hover over field labels to see tooltips with additional information
- Click "Show Code Reference" in calculators to view relevant NBC articles

**Technical Support:**
- For technical issues or bug reports, contact support at [help.manus.im](https://help.manus.im)
- Include your browser type and version, operating system, and a description of the issue
- Screenshots or screen recordings are helpful for diagnosing problems

---

## References

This application is based on the following authoritative sources:

1. **National Building Code of Canada 2025** - National Research Council of Canada. The primary code document governing building construction requirements across Canada. [https://nrc.canada.ca/en/certifications-evaluations-standards/codes-canada/codes-canada-publications/national-building-code-canada-2020](https://nrc.canada.ca/en/certifications-evaluations-standards/codes-canada/codes-canada-publications/national-building-code-canada-2020)

2. **Alberta Building Code 2025** - Alberta Municipal Affairs. Provincial adoption of the National Building Code with Alberta-specific amendments. [https://www.alberta.ca/building-codes](https://www.alberta.ca/building-codes)

3. **NBC Part 3: Fire Protection, Occupant Safety and Accessibility** - Sections 3.1 through 3.8 covering occupancy classifications, fire separations, egress requirements, and barrier-free design.

4. **NBC Part 4: Structural Design** - Sections 4.1 through 4.3 covering loads, structural analysis, and design requirements for building structures.

5. **NBC Part 9: Housing and Small Buildings** - Sections 9.1 through 9.36 covering prescriptive requirements for residential and small commercial buildings.

---

## Document Information

**Document Version:** 2.0  
**Last Updated:** January 11, 2026  
**Application Version:** f13d451c  
**Author:** Manus AI  
**License:** This user guide is provided for informational purposes only. Building code requirements are subject to change, and users should verify all information with current code documents and local authorities having jurisdiction.

**Disclaimer:** While every effort has been made to ensure the accuracy of the information in this guide and the calculations provided by the application, users are responsible for verifying compliance with applicable building codes and regulations. This tool is intended to assist with preliminary design and code research but does not replace professional engineering judgment or official code interpretation by authorities having jurisdiction.

---

*For the latest updates and additional resources, visit the application at your deployment URL.*


---

## Rules Management System

**New in Version 2.1** | **Released:** March 2026

The Rules Management System is a powerful new feature that enables organizations to create, manage, and apply building code rules across projects. This system provides comprehensive rule tracking with full audit trails for legal defensibility and compliance documentation.

### Overview

The Rules Management System serves as a centralized repository for building code rules and compliance requirements. It allows you to:

- **Search and filter** pre-built rules by jurisdiction, category, and keywords
- **Apply rules** to specific projects or organization-wide
- **Create custom rules** with full credentials tracking
- **Track compliance** with immutable audit trails
- **Generate reports** for legal and regulatory purposes

### Accessing Rules Management

To access the Rules Management System:

1. From the main dashboard, click **"Rules Management"** in the navigation menu
2. You will see the Rules Management interface with search and filter options
3. Use the search bar to find rules by keyword (e.g., "occupancy", "fire separation", "egress")
4. Filter by **Jurisdiction** (NBC, Alberta, BC, Ontario, Calgary, Edmonton, Toronto, Lethbridge, Airdrie)
5. Filter by **Category** (occupancy, fire, egress, structural, electrical, plumbing, hvac, accessibility, energy)

### Searching for Rules

The search functionality provides powerful filtering capabilities:

**Keyword Search:** Type keywords to search across rule names, descriptions, NBC references, and keywords. For example:
- "occupancy load" - finds all rules related to occupancy calculations
- "fire separation" - finds fire safety rules
- "egress" - finds exit and egress requirements

**Jurisdiction Filtering:** Select a specific jurisdiction to see rules applicable to that region:
- **NBC** - National Building Code (applies across Canada)
- **Alberta** - Alberta-specific amendments
- **BC** - British Columbia-specific amendments
- **Ontario** - Ontario-specific amendments
- **Calgary** - Calgary municipal requirements
- **Edmonton** - Edmonton municipal requirements
- **Toronto** - Toronto municipal requirements
- **Lethbridge** - Lethbridge municipal requirements
- **Airdrie** - Airdrie municipal requirements

**Category Filtering:** Select a category to see rules for a specific discipline:
- **Occupancy** - Building occupancy classification and load requirements
- **Fire** - Fire safety, separation, and protection requirements
- **Egress** - Exit and emergency egress requirements
- **Structural** - Structural design and load requirements
- **Electrical** - Electrical system requirements
- **Plumbing** - Plumbing and drainage requirements
- **HVAC** - Heating, ventilation, and air conditioning requirements
- **Accessibility** - Barrier-free design and accessibility requirements
- **Energy** - Energy efficiency and thermal performance requirements

### Applying Rules to Projects

Once you find a relevant rule, you can apply it to your project:

1. Click the **"Apply Rule"** button next to the rule
2. Select whether to apply the rule to:
   - **This Project Only** - Rule applies only to the current project
   - **Organization-Wide** - Rule applies to all projects (admin only)
3. Click **"Confirm"** to apply the rule
4. The rule will now appear in your project's applied rules list

### Viewing Applied Rules

To see rules applied to your current project:

1. Navigate to **"Project Settings"** or **"Applied Rules"** section
2. You will see a list of all rules applied to the project
3. Each rule shows:
   - Rule code and name
   - Category and jurisdiction
   - Date applied
   - Compliance status (if tracked)
   - Option to remove or deactivate

### Creating Custom Rules

If you need to create a rule specific to your organization or project:

1. Click **"Create Custom Rule"** button
2. Fill in the rule details:
   - **Rule Name** (minimum 5 characters)
   - **Description** (minimum 20 characters, explain the requirement in detail)
   - **Category** (select from available categories)
   - **Keywords** (optional, for better searchability)
3. Click **"Create"** to save the rule
4. The rule will be marked as custom and associated with your user credentials
5. Custom rules can be applied to projects just like pre-built rules

### Audit Trail and Legal Defensibility

All rule operations are tracked in an immutable audit trail for legal defensibility:

- **Rule Creation** - When and by whom each rule was created
- **Rule Application** - When and by whom rules were applied to projects
- **Rule Deactivation** - When and by whom rules were removed from projects
- **Custom Rule Authorization** - Credentials of rule creators and authorizers

To view the audit trail:

1. Select a rule from the search results
2. Click **"View Audit Trail"** or **"History"**
3. You will see a complete record of all actions on this rule
4. This audit trail can be exported for compliance documentation

### Best Practices

**For Effective Rule Management:**

- **Search thoroughly** before creating custom rules - the pre-built library may already contain what you need
- **Use consistent naming** for custom rules to make them searchable
- **Document your rules clearly** - detailed descriptions help team members understand requirements
- **Apply rules early** in the project design phase to ensure compliance from the start
- **Review audit trails** regularly to ensure all rule applications are properly documented
- **Update rules** when building code changes or new amendments are released

**For Compliance:**

- Keep audit trails as evidence of due diligence
- Document which rules apply to each project
- Track rule compliance status throughout the project lifecycle
- Generate compliance reports for regulatory submissions
- Maintain records of custom rules and their authorization

### Troubleshooting

**Cannot find a specific rule:**
- Try different keywords or search terms
- Check if the rule applies to your selected jurisdiction
- Create a custom rule if the requirement is not in the pre-built library

**Rule not applying to project:**
- Ensure you have permission to apply rules (admin may be required)
- Check that the rule is marked as active
- Verify the project is selected before applying the rule

**Need to remove a rule:**
- Click the **"Deactivate"** or **"Remove"** button next to the applied rule
- This will be recorded in the audit trail
- The rule will no longer apply to the project

### Integration with Project Checklists

Rules are integrated with the project checklist system to provide context-aware compliance requirements:

- When you create a project checklist, applicable rules are automatically suggested
- Each checklist item can be linked to relevant rules
- Compliance status for each rule is tracked in the project dashboard
- Reports can be generated showing rule compliance status

---

## Coding Protocol and Development Standards

**New in Version 2.1** | **Effective:** March 2026

The project now follows a disciplined engineering protocol documented in **CODING_PROTOCOL.md**. This protocol ensures all code is complete, predictable, maintainable, and fully aligned with requirements.

### Key Principles

The protocol enforces a 10-step development workflow:

1. **Problem Definition** - Clear feature description, user flow, data flow, success criteria, and edge cases
2. **UX-Backend Contract** - Explicit API endpoints, request/response schemas, error codes, and validation rules
3. **Architecture Plan** - File structure, component hierarchy, service layer, and repository pattern
4. **Coding Standards** - Meaningful names, single-purpose functions, comprehensive error handling, and logging
5. **Integration Discipline** - Frontend validation, backend validation, no silent failures, all states handled
6. **Testing Requirements** - Unit tests, integration tests, manual UX tests, and edge case coverage
7. **Definition of Done** - Code reviewed, UX tested, API contract respected, error states handled, no TODOs
8. **Self-Review Checklist** - Logic clean, names meaningful, duplication eliminated, all states handled
9. **Deployment Readiness** - Feature flags, environment variables, API keys secured, monitoring, rollback plan
10. **Continuous Improvement** - Reflect on what slowed you down, patterns that repeated, and process improvements

### Architectural Patterns

All code follows established architectural patterns:

- **Service Layer** - Business logic separated from UI and data access
- **Repository Pattern** - Data access abstracted from business logic
- **Middleware Pattern** - Authorization and security enforced consistently
- **Caching Pattern** - Performance improved with TTL-based caching
- **Rate Limiting** - Expensive operations protected against abuse
- **Monitoring Pattern** - Operations tracked and errors logged
- **Transaction Pattern** - Atomic operations wrapped in database transactions

### For Developers

When working on features:

1. Read **CODING_PROTOCOL.md** before starting
2. Follow the 10-step workflow strictly
3. Pass the 22-point audit checklist before deployment
4. Never merge code without tests
5. Never leave TODOs or debug console.log statements
6. Document all public APIs and edge cases

For more details, see the **CODING_PROTOCOL.md** document in the project root.

---
