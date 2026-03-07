# CodeComply Professional User Manual

## Version 1.0 | Building Code Compliance Analysis Platform

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Getting Started](#getting-started)
4. [Core Features](#core-features)
5. [Building Type Classification](#building-type-classification)
6. [Electrical Calculations](#electrical-calculations)
7. [Plumbing Calculations](#plumbing-calculations)
8. [Fire Safety Analysis](#fire-safety-analysis)
9. [Accessibility Compliance](#accessibility-compliance)
10. [Project Management](#project-management)
11. [Compliance Analysis Engine](#compliance-analysis-engine)
12. [Professional Certification](#professional-certification)
13. [Export and Documentation](#export-and-documentation)
14. [Legal Disclaimers](#legal-disclaimers)
15. [Support and Resources](#support-and-resources)

---

## Introduction

CodeComply is a professional-grade building code compliance analysis platform designed for architects, engineers, building code officials, and construction professionals. The platform provides deterministic, legally defensible compliance evaluations based on current building codes and amendments.

### Key Features

- **Deterministic Analysis**: Identical inputs produce identical outputs, ensuring reproducibility
- **Legally Defensible Results**: Comprehensive audit trails and professional certification workflows
- **Versioned Rulesets**: Support for multiple code editions with immutable snapshots
- **Professional Certification**: Digital signatures for regulatory submission
- **Comprehensive Calculations**: Electrical, plumbing, fire safety, and accessibility analysis
- **Project Management**: Track multiple projects with linked calculations and checklists
- **Audit Trail**: Complete record of all analyses for legal discovery

### Who Should Use This Platform

CodeComply is intended for:
- Licensed architects and engineers
- Building code officials and inspectors
- Construction managers and project coordinators
- Building consultants and compliance specialists
- Regulatory compliance professionals

---

## System Requirements

### Browser Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum screen resolution: 1024x768 (1920x1080 recommended)
- Stable internet connection

### Account Requirements

- Valid email address
- Professional credentials for certification features
- License number and jurisdiction information

---

## Getting Started

### Creating an Account

1. Navigate to the CodeComply login page
2. Click "Sign Up" or enter your email address
3. Complete the email verification process
4. Set up your professional profile with:
   - Full name
   - Professional credentials
   - License number and type
   - Jurisdiction
   - Organization (optional)

### Logging In

1. Enter your registered email address
2. Complete the authentication process
3. You will be redirected to the main dashboard

### First-Time Setup

1. **Complete Your Profile**: Add professional information for certification
2. **Review Terms of Service**: Accept the professional liability disclaimers
3. **Explore the Dashboard**: Familiarize yourself with the main interface sections

---

## Core Features

### Main Navigation

The CodeComply interface is organized into five main sections:

#### 1. Building Type Classification
Classify buildings according to the National Building Code (NBC) occupancy groups. This is the foundation for all subsequent compliance analysis.

#### 2. Electrical Calculations
Perform electrical load calculations, voltage drop analysis, and conduit fill calculations.

#### 3. Plumbing Calculations
Calculate fixture unit requirements, wet venting configurations, and gas line sizing.

#### 4. Fire Safety Analysis
Analyze fire separation requirements, egress window sizing, and GFCI protection zones.

#### 5. Accessibility Compliance
Evaluate barrier-free design requirements including washroom specifications and grab bar placement.

---

## Building Type Classification

### Purpose

Building type classification determines the occupancy group and division, which is the foundation for all code compliance requirements. The NBC classifies buildings into five groups (A through F) with multiple divisions within each group.

### How to Classify a Building

1. **Select Building Type Tab** from the main navigation
2. **Search by Building Code** (e.g., "A-1") or **Building Name** (e.g., "Assembly - Performing Arts")
3. **Review the Classification Details**:
   - Occupancy Group and Division
   - Building description
   - Common examples
   - Key code requirements

### Understanding Occupancy Groups

| Group | Description | Examples |
|-------|-------------|----------|
| **A** | Assembly | Theatres, churches, restaurants, bars |
| **B** | Institutional | Hospitals, schools, prisons |
| **C** | Residential | Apartments, hotels, dormitories |
| **D** | Office/Commercial | Office buildings, retail stores |
| **E** | Industrial | Factories, warehouses, laboratories |
| **F** | Hazardous | Storage of hazardous materials |

### Saving Classifications to Projects

Once you have classified a building:

1. Click **"Save to Project"** button
2. Select an existing project or create a new one
3. Add project-specific notes
4. The classification is saved with timestamp and audit trail

---

## Electrical Calculations

### Service Load Calculator

The Service Load Calculator determines the minimum electrical service capacity required for a building based on connected loads.

#### How to Use

1. **Navigate to Electrical Tools** → **Service Load Calculator**
2. **Enter Building Information**:
   - Building type (from classification)
   - Square footage
   - Number of dwelling units (if applicable)
   - Heating type (electric, gas, other)

3. **Input Connected Loads**:
   - Lighting loads (W/m²)
   - Receptacle loads (W/m²)
   - HVAC loads (kW)
   - Water heater capacity (kW)
   - Cooking equipment (kW)
   - Other major loads

4. **Review Results**:
   - Calculated service size (Amps)
   - Demand factor applied
   - Load breakdown by category
   - Recommended service entrance size

5. **Save to Project**: Click "Save Calculation" to store results

#### Demand Factors

The calculator applies demand factors per NBC Table 32-16 based on:
- Building occupancy type
- Load category
- Diversity of loads
- Simultaneous use factors

---

### Voltage Drop Calculator

Determines the voltage drop in electrical conductors and verifies compliance with NBC requirements (maximum 3% to point of use, 5% to branch circuit).

#### How to Use

1. **Navigate to Electrical Tools** → **Voltage Drop Calculator**
2. **Enter Circuit Parameters**:
   - Conductor size (AWG)
   - Conductor material (copper/aluminum)
   - Circuit length (feet/meters)
   - Phase type (single-phase/three-phase)
   - Load current (Amps)

3. **Select Calculation Method**:
   - Simplified (using standard tables)
   - Detailed (using conductor resistance)

4. **Review Results**:
   - Voltage drop percentage
   - Compliance status (Pass/Fail)
   - Recommended conductor size if oversized

5. **Save to Project**: Store calculation with project reference

#### Compliance Criteria

- **Feeder**: Maximum 3% voltage drop
- **Branch Circuit**: Maximum 3% voltage drop
- **Combined**: Maximum 5% total voltage drop

---

### Conduit Fill Calculator

Verifies that electrical conductors are installed in conduit with proper fill percentages per NBC Table 12-2100.

#### How to Use

1. **Navigate to Electrical Tools** → **Conduit Fill Calculator**
2. **Select Conduit Type and Size**:
   - Conduit type (EMT, PVC, rigid metal)
   - Conduit size (1/2", 3/4", 1", etc.)

3. **Add Conductors**:
   - Conductor size (AWG)
   - Number of conductors
   - Insulation type

4. **Review Results**:
   - Total conductor area
   - Conduit fill percentage
   - Compliance status
   - Maximum conductors allowed

5. **Adjust if Needed**: System recommends larger conduit if fill exceeds limits

#### Fill Percentage Limits

- **1 conductor**: 53% fill
- **2 conductors**: 31% fill
- **3+ conductors**: 40% fill

---

## Plumbing Calculations

### Fixture Unit Calculator

Determines the total fixture unit load for drainage and water supply systems based on connected plumbing fixtures.

#### How to Use

1. **Navigate to Plumbing Tools** → **Fixture Unit Calculator**
2. **Select Building Type** (affects fixture unit values)
3. **Add Fixtures**:
   - Select fixture type from dropdown
   - Enter quantity
   - System displays fixture unit value per NBC Table 32-1

4. **Review Totals**:
   - Total drainage fixture units
   - Total water supply fixture units
   - Recommended pipe sizes
   - Vent stack requirements

5. **Save to Project**: Store calculation with project reference

#### Common Fixture Unit Values

| Fixture | Drainage Units | Water Supply Units |
|---------|----------------|-------------------|
| Water closet (flush tank) | 4 | 3 |
| Water closet (flush valve) | 6 | 6 |
| Lavatory | 1 | 1 |
| Bathtub | 2 | 2 |
| Shower | 2 | 2 |
| Kitchen sink | 2 | 2 |
| Laundry sink | 2 | 2 |

---

### Wet Venting Diagram

Provides visual guidance for proper wet venting configurations that comply with NBC requirements.

#### How to Use

1. **Navigate to Plumbing Tools** → **Wet Venting Diagram**
2. **Review Diagram Components**:
   - Vent stack configuration
   - Trap arm lengths
   - Slope requirements
   - Connection details

3. **Verify Your Installation**:
   - Compare your design to the diagram
   - Check trap arm lengths (maximum 3 feet for 1.5" pipe)
   - Verify vent stack sizing
   - Confirm slope (1/4" per foot minimum)

4. **Document Compliance**: Save diagram reference with project

#### Wet Venting Requirements

- Vent stack must be sized per fixture unit load
- Trap arm length: 3 feet maximum for 1.5" pipe
- Slope: Minimum 1/4" per foot
- Vent opening: Minimum 1.5" diameter

---

### Gas Line Calculator

Determines appropriate gas line sizing based on connected appliance loads and pipe length.

#### How to Use

1. **Navigate to Plumbing Tools** → **Gas Line Calculator**
2. **Enter System Parameters**:
   - Gas type (natural gas/propane)
   - Pressure (low/medium/high)
   - Pipe material (copper/steel/CSST)

3. **Add Connected Appliances**:
   - Appliance type
   - BTU/hour rating
   - Distance from meter

4. **Review Results**:
   - Required pipe size
   - Pressure drop
   - Compliance status
   - Recommended sizing

5. **Save to Project**: Store calculation with reference

---

## Fire Safety Analysis

### Fire Separation Diagram

Illustrates required fire-resistance ratings between different occupancy groups and building elements.

#### How to Use

1. **Navigate to Fire Safety** → **Fire Separation Diagram**
2. **Select Building Occupancy Groups** being separated
3. **Review Required Fire-Resistance Ratings**:
   - Wall assembly rating
   - Door assembly rating
   - Penetration sealing requirements

4. **Verify Compliance**: Confirm your design meets requirements

---

### Egress Window Sizing

Calculates minimum egress window dimensions based on occupancy and room area.

#### How to Use

1. **Navigate to Fire Safety** → **Egress Window Sizing**
2. **Enter Room Information**:
   - Room area (sq ft)
   - Occupancy type
   - Window location (basement/above grade)

3. **Review Requirements**:
   - Minimum net clear opening area
   - Minimum width and height
   - Sill height above floor
   - Operational requirements

---

### GFCI Protection Zones

Identifies areas requiring GFCI protection per NBC electrical requirements.

#### How to Use

1. **Navigate to Fire Safety** → **GFCI Protection Zones**
2. **Select Building Type and Location**
3. **Review Protected Areas**:
   - Bathrooms
   - Kitchen countertops
   - Laundry areas
   - Outdoor locations
   - Crawl spaces

4. **Verify Installation**: Ensure GFCI protection is installed in all required areas

---

## Accessibility Compliance

### Barrier-Free Washroom Diagram

Shows accessible washroom layout with grab bar placement and fixture spacing.

#### How to Use

1. **Navigate to Accessibility** → **Barrier-Free Washroom Diagram**
2. **Review Diagram Components**:
   - Grab bar locations and dimensions
   - Fixture spacing and clearances
   - Door swing requirements
   - Turning radius requirements

3. **Verify Your Design**: Compare your layout to the diagram

---

### Grab Bar Detail Diagram

Provides detailed specifications for grab bar installation including:
- Mounting height
- Diameter requirements
- Support spacing
- Load requirements

---

## Project Management

### Creating a New Project

1. **Click "New Project"** in the Projects section
2. **Enter Project Information**:
   - Project name
   - Address
   - Building type (from classification)
   - Project description
   - Client name (optional)

3. **Set Project Parameters**:
   - Code edition (NBC 2023, etc.)
   - Analysis mode (Strict/Soft)
   - Jurisdiction
   - Notes

4. **Save Project**: Project is created and ready for calculations

### Linking Calculations to Projects

All calculations can be saved to an active project:

1. **Complete a Calculation** (electrical, plumbing, fire safety, etc.)
2. **Click "Save to Project"** button
3. **Select Target Project** from dropdown
4. **Add Calculation Notes** (optional)
5. **Confirm Save**: Calculation is linked to project with timestamp

### Project Dashboard

The Project Dashboard displays:
- All linked calculations
- Checklist status
- Compliance summary
- Audit trail
- Export options

---

## Compliance Analysis Engine

### Understanding Compliance Analysis

The CodeComply Compliance Analysis Engine evaluates your project against the applicable building code using:

1. **Deterministic Rules**: Exact code requirements with no ambiguity
2. **Rule Traceability**: Each result references specific code clauses
3. **Immutable Snapshots**: Results frozen at analysis time
4. **Audit Logging**: Complete record of analysis process

### Running a Compliance Analysis

1. **Navigate to Compliance** section
2. **Select Project** to analyze
3. **Choose Analysis Mode**:
   - **Strict Mode**: For legal/regulatory use (strict interpretation)
   - **Soft Mode**: For design iteration (flexible interpretation)

4. **Review Input Parameters**: Verify all project information
5. **Run Analysis**: Click "Analyze Compliance"
6. **Review Results**:
   - Compliance status (Compliant/Non-Compliant/Conditional)
   - Rule evaluation trace
   - Findings by category
   - Recommendations

### Interpreting Compliance Results

| Status | Meaning | Action |
|--------|---------|--------|
| **✓ Compliant** | All requirements met | Ready for submission |
| **✗ Non-Compliant** | Requirements not met | Design changes required |
| **⚠ Conditional** | Requires professional judgment | Review and document |

### Rule Trace

Each compliance result includes a rule trace showing:
- Rule identifier
- Code clause reference
- Evaluation logic
- Input values used
- Result (pass/fail/conditional)

---

## Professional Certification

### When to Certify

Professional certification is required when:
- Submitting designs to building authorities
- Providing compliance documentation to clients
- Creating legally defensible records
- Regulatory submissions require professional seal

### Certification Process

#### Step 1: Review Analysis

1. **Thoroughly Review** the compliance analysis
2. **Verify All Inputs** are accurate
3. **Check Rule Trace** for correct code interpretation
4. **Evaluate Site Conditions** for applicability
5. **Confirm Professional Judgment** supports results

#### Step 2: Professional Verification

1. **Enter Professional Information**:
   - Full name
   - License number
   - License type (Architect/Engineer/Code Official)
   - Jurisdiction

2. **Add Certification Notes** (optional):
   - Site-specific conditions
   - Design assumptions
   - Limitations or exceptions
   - Professional qualifications

#### Step 3: Digital Signature

1. **Review Certification Details**
2. **Click "Certify Analysis"**
3. **System generates digital signature** with:
   - Cryptographic integrity verification
   - Timestamp
   - Professional credentials
   - Immutable record

#### Step 4: Export and Submit

1. **Download Certificate** (PDF format)
2. **Export for Submission** to authorities
3. **Maintain Records** for audit trail

### Digital Signature Verification

Digital signatures can be verified at any time using:
- Signature ID
- Verification code
- CodeComply verification portal

---

## Export and Documentation

### PDF Export

Export compliance analyses as professional PDF documents including:
- Cover page with project information
- Executive summary
- Compliance status
- Detailed findings
- Rule trace documentation
- Professional certification (if applicable)
- Legal disclaimers

#### How to Export

1. **Open Compliance Analysis** or **Project Dashboard**
2. **Click "Export to PDF"**
3. **Select Export Options**:
   - Include rule trace (detailed/summary)
   - Include certification (if available)
   - Include audit trail
   - Page orientation (portrait/landscape)

4. **Generate and Download** PDF file

### Audit Log Export

Export complete audit trail for legal discovery:

1. **Navigate to Project** → **Audit Log**
2. **Click "Export Audit Trail"**
3. **Select Date Range** (optional)
4. **Choose Format** (CSV/JSON/PDF)
5. **Download** audit log file

### Batch Export

Export multiple projects or analyses:

1. **Select Projects** from list (checkbox)
2. **Click "Batch Export"**
3. **Choose Export Format** and options
4. **Generate** export package
5. **Download** ZIP file with all documents

---

## Legal Disclaimers

### Professional Responsibility

**CodeComply provides analysis tools only.** The user (licensed professional) is solely responsible for:

1. **Accuracy of Inputs**: Verifying all input data is correct
2. **Code Interpretation**: Ensuring compliance with applicable codes
3. **Site-Specific Conditions**: Evaluating local amendments and variations
4. **Professional Judgment**: Applying expertise to project-specific situations
5. **Regulatory Compliance**: Ensuring submission meets authority requirements

### Limitation of Liability

CodeComply is provided "as-is" without warranty. The platform does not:

- Guarantee code compliance
- Replace professional judgment
- Provide legal advice
- Guarantee regulatory approval
- Assume liability for design decisions

### Professional Liability Insurance

Users should maintain appropriate professional liability insurance covering:
- Design errors and omissions
- Code compliance analysis
- Professional certification
- Regulatory submissions

### Regulatory Authority Approval

Final approval authority rests with:
- Local building departments
- Jurisdictional code officials
- Regulatory authorities
- Permitting agencies

CodeComply analysis does not guarantee approval by these authorities.

---

## Support and Resources

### Getting Help

**In-App Support**
- Help icon (?) in top navigation
- Contextual help for each tool
- Glossary of terms
- FAQ section

**Email Support**
- support@codecomply.com
- Response time: 24-48 hours
- Include project ID and description

**Knowledge Base**
- Detailed articles and tutorials
- Video demonstrations
- Code reference materials
- Calculation examples

### Additional Resources

**Building Code References**
- National Building Code (NBC) 2023
- Provincial amendments
- Municipal bylaws
- Accessibility standards

**Professional Organizations**
- Architectural Institute of Canada (AIC)
- Professional Engineers Ontario (PEO)
- Building Officials Association of Canada (BOAC)

**Continuing Education**
- CodeComply webinars
- Professional development courses
- Code update seminars
- Certification workshops

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Ctrl/Cmd + S` | Save calculation |
| `Ctrl/Cmd + P` | Print/Export to PDF |
| `Ctrl/Cmd + F` | Search |
| `Esc` | Close dialog |
| `Tab` | Navigate fields |
| `Enter` | Submit form |

---

## Appendix B: Glossary

**Audit Trail**: Complete record of all analyses, modifications, and certifications

**Compliance Status**: Result of code compliance evaluation (Compliant/Non-Compliant/Conditional)

**Deterministic**: Producing identical results from identical inputs

**Digital Signature**: Cryptographic verification of document authenticity and integrity

**Fixture Unit**: Standard measure of plumbing fixture load per NBC Table 32-1

**GFCI**: Ground Fault Circuit Interrupter protection

**Immutable Snapshot**: Frozen record of analysis results that cannot be modified

**Rule Trace**: Documentation of which rules were evaluated and how

**Strict Mode**: Conservative code interpretation for legal/regulatory use

**Soft Mode**: Flexible code interpretation for design iteration

---

## Document Information

**Version**: 1.0
**Last Updated**: March 1, 2026
**Platform**: CodeComply Professional Edition
**Jurisdiction**: National Building Code (NBC) 2023

For the latest version, visit: codecomply.com/docs

---

**IMPORTANT**: This manual is provided for informational purposes. Users must verify all information against current building codes and regulations. CodeComply is not responsible for errors, omissions, or misuse of the platform.

