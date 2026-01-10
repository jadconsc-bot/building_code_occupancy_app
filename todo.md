# Building Code Occupancy Classifier - TODO

## ✅ Completed Features

### Core Functionality
- [x] Occupancy classification system (A-1 through F-3)
- [x] Search and filter functionality
- [x] Voice search integration
- [x] Bookmark system
- [x] Recent history tracking
- [x] Theme toggle (light/dark mode)
- [x] Print and PDF export
- [x] Share functionality
- [x] Project notes per occupancy
- [x] Keyboard shortcuts

### Building Code Tab
- [x] Definition and common examples
- [x] Load calculation factors (NBC 2023 Table 4.1.5.3) for all occupancy types
- [x] Key compliance notes (Fire Safety, Egress, Construction)
- [x] Construction Limits table (Part 3.2.2)
- [x] Building Height Limits table
- [x] Allowable Openings in Fire-Rated Assemblies (with diagram)
- [x] Ergonomic & Accessibility Requirements (with diagrams)
- [x] Property Setback Requirements (with diagram)
- [x] Structural Span Tables (with filters)
- [x] Code Amendment Tracker (NBC 2019 vs 2023)
- [x] Inspector Checklist Generator with 6 construction phases
- [x] Photo upload feature for Inspector Checklist items (localStorage-based)

### Other Tabs
- [x] Plumbing tab with fixture requirements
- [x] Electrical tab with load calculations
- [x] Additions tab with permit requirements
- [x] Sustainability tab with energy efficiency

### Project Management
- [x] Project Dashboard for tracking multiple projects
- [x] Project creation and management
- [x] Progress tracking across construction phases
- [x] Project statistics and summaries

### Mobile Features
- [x] Enhanced mobile camera integration with permission handling
- [x] Choice between camera capture and photo library
- [x] Mobile-optimized photo upload UI

### Regional Support
- [x] Alberta Building Code differences highlighted
- [x] Region selector (Alberta/National)

## 🚧 In Progress / Remaining Features

### High Priority (Current Session)
- [x] Quick-jump navigation within Building Code tab
  - Add sticky navigation bar with anchor links to major sections
  - Implement smooth scrolling to sections
  - Add scroll-margin for proper positioning
  - Include links to: Construction Limits, Span Tables, Code Amendments, Inspector Checklist
  
- [x] Checklist progress sync with Project Dashboard
  - Connect Inspector Checklist checked items to Project Dashboard
  - Update project progress when checklist items are checked
  - Sync across all phases automatically
  - Store progress in localStorage with project association
  
- [x] Comparison View for occupancy types
  - Side-by-side comparison of two occupancy types
  - Compare load factors, construction limits, and requirements
  - Highlight differences between occupancies
  - Add comparison button in header
  - Create split-screen layout with synchronized scrolling

### Medium Priority (Future Enhancements)
- [ ] Code Search Tool with natural language queries
  - Search across all NBC sections
  - Return relevant sections with visual diagrams
  - Context-aware search results

- [ ] Compliance Summary Reports
  - Generate PDF reports from Project Dashboard
  - Include all checklist items and photos
  - Professional formatting for client delivery

- [ ] Enhanced Photo Management
  - Cloud storage integration (S3) for photos
  - Photo annotations and notes
  - Photo gallery view

### Low Priority (Nice to Have)
- [ ] Offline mode with service workers
- [ ] Multi-language support (French)
- [ ] Integration with municipal permit systems
- [ ] Real-time collaboration features
- [ ] Mobile app version

## 📝 Code Quality Tasks
- [ ] Add comprehensive code comments
- [ ] Write unit tests for key components
- [ ] Performance optimization for large datasets
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness review

## 🐛 Known Issues
- None currently reported

## 📚 Documentation Needs
- [ ] User guide for Inspector Checklist
- [ ] API documentation for data structures
- [ ] Deployment guide
- [ ] Contributing guidelines

## 🎯 Next Session Goals
1. Implement quick-jump navigation (30 min)
2. Add checklist progress sync (45 min)
3. Create comparison view component (60 min)
4. Test all features thoroughly (30 min)
5. Save final checkpoint and deliver (15 min)

**Total estimated time: ~3 hours**

## New Feature Implementation (Current Session)
- [x] NBC Floor Joist Span Calculator (Table 9.23.4.2-A)
  - Create interactive calculator component
  - Add species/grade selection (Douglas Fir-Larch, Hem-Fir, Spruce-Pine-Fir, Northern Species)
  - Add joist size selection (38x89, 38x140, 38x184, 38x235, 38x286)
  - Add joist spacing selection (300mm/12", 400mm/16", 600mm/24")
  - Display maximum span in meters and feet
  - Add visual span limit indicators
  - Include NBC article references
  
- [x] Export to Excel Functionality
  - Export comparison results to Excel
  - Export span tables to Excel
  - Export inspector checklists to Excel
  - Add Excel export buttons throughout the app
  
- [ ] Project Templates System
  - Create template for Single-Family Home
  - Create template for Multi-Unit Residential
  - Create template for Commercial Office
  - Pre-fill occupancy codes and construction phases
  - Allow template selection when creating new projects
  
- [ ] Code Reference Links
  - Add clickable NBC article references
  - Create side panel for detailed code sections
  - Implement search within code references
  - Link from all NBC citations throughout the app
  
- [ ] UI/UX Improvements
  - Review and optimize navigation flow
  - Improve mobile responsiveness
  - Add tooltips and help text where needed
  - Ensure consistent styling across all components
  - Add loading states and error handling

## Latest Implementation (Current Session)
- [x] Project Templates System
  - Create template for Single-Family Home (occupancy C, typical phases)
  - Create template for Multi-Unit Residential (occupancy C, commercial phases)
  - Create template for Commercial Office (occupancy D, business phases)
  - Pre-fill common inspection items and requirements
  - Add template selection in Project Dashboard
  
- [ ] Code Reference Panel
  - Create collapsible side panel for NBC article display
  - Add click handlers to all code references (e.g., "NBC 3.2.2.47")
  - Implement article text display with formatting
  - Add search functionality within articles
  - Add bookmark/favorite functionality
  - Include related articles suggestions
  
- [ ] Beam Span Calculator
  - Create component based on NBC Table 9.23.4.3
  - Add beam type selection (headers, girders, lintels)
  - Add species/grade selection matching floor joist calculator
  - Add beam size and loading condition inputs
  - Display maximum spans with safety factors
  - Add Excel export functionality
  - Include visual beam diagrams
  
- [x] Color Palette Design
  - Research professional building/construction industry palettes
  - Create 3-5 palette options with rationale
  - Document primary, secondary, accent colors
  - Include accessibility considerations (WCAG AA)
  - Provide implementation guide for index.css
  - Created comprehensive COLOR_PALETTE_GUIDE.md with 5 professional options

## Excel Export Enhancement (Current Session)
- [x] Add Excel export button to Structural Span Tables section
- [x] Add Excel export button to Code Amendment Tracker
- [x] Add Excel export button to Inspector Checklist Generator
- [x] Add Excel export button to Comparison View dialog
- [x] Make export buttons more prominent with consistent styling


## Next Implementation Phase (Current Session)

### Structural Calculators Expansion
- [x] Beam Span Calculator (NBC Table 9.23.4.3)
  - Create BeamSpanCalculator component
  - Add beam type selection (headers, girders, lintels)
  - Add species/grade selection (Douglas Fir-Larch, Hem-Fir, S-P-F, Northern)
  - Add beam size selection (38x140, 38x184, 38x235, 38x286, 89x140, 89x184, 89x235, 89x286)
  - Add loading condition inputs (point load, uniform load)
  - Display maximum spans with safety factors
  - Add Excel export functionality
  - Include visual beam diagrams

- [x] Roof Rafter Span Calculator (NBC Part 9 Span Tables)
  - Create RoofRafterSpanCalculator component
  - Add species/grade selection matching other calculators
  - Add rafter size selection (38x89, 38x140, 38x184, 38x235, 38x286)
  - Add rafter spacing selection (300mm/12", 400mm/16", 600mm/24")
  - Add roof pitch selection (3:12, 4:12, 5:12, 6:12, 8:12, 10:12, 12:12)
  - Add snow load selection (Calgary/Edmonton 2.0 kPa, other regions)
  - Display maximum spans in meters and feet
  - Add Excel export functionality
  - Include visual roof pitch diagrams

### UI/UX Enhancement - Blueprint Professional Theme
- [x] Apply Blueprint Professional Color Palette from COLOR_PALETTE_GUIDE.md
  - Update client/src/index.css with new color variables
  - Primary: Deep Blueprint Blue (#1E3A8A)
  - Secondary: Construction Orange (#F59E0B)
  - Accent: Safety Yellow (#FCD34D)
  - Neutral: Concrete Gray (#6B7280)
  - Update all components to use new color scheme
  - Test contrast ratios for accessibility (WCAG AA)
  - Update theme provider for light/dark mode compatibility


## Advanced Structural Calculator Features (Current Session)

### Column Span Calculator
- [x] Column Span Calculator (NBC Table 9.23.4.4)
  - Create ColumnSpanCalculator component
  - Add species/grade selection matching other calculators
  - Add column size selection (89x89, 140x140, 184x184, 235x235, 286x286)
  - Add loading type selection (point load, distributed load)
  - Add supported length/height input
  - Calculate maximum allowable loads
  - Display results in kN and lbs
  - Add Excel export functionality
  - Include safety factor information

### Interactive Beam Diagrams
- [x] Interactive Beam Visualization Component
  - Create BeamDiagram component with SVG rendering
  - Show beam with support points (simple, continuous, cantilever)
  - Display load distribution (point loads, uniform loads)
  - Show deflection curve visualization
  - Add dimension annotations
  - Update dynamically based on calculator inputs
  - Include shear and moment diagrams
  - Add toggle for different diagram types
  - Make diagrams responsive and printable

### Saved Calculator Presets
- [x] Calculator Preset Management System
  - Create preset storage using localStorage
  - Add "Save Preset" button to each calculator
  - Create preset naming dialog
  - Build preset library panel/dropdown
  - Add "Load Preset" functionality
  - Include preset categories (Residential, Commercial, Industrial)
  - Add preset editing and deletion
  - Show preset metadata (date created, occupancy type)
  - Export/import presets as JSON
  - Pre-populate common presets:
    * "Standard Residential Floor" (2x10 @ 16" o.c.)
    * "Heavy Commercial Beam" (6x12 Douglas Fir)
    * "Typical Roof Rafter 4:12" (2x6 @ 24" o.c.)
    * "Calgary Snow Load Rafter" (2x8 @ 16" o.c., 2.0 kPa)


## Final Enhancement Suite (Current Session)

### Preset Selector Integration
- [x] Integrate PresetSelector into FloorJoistSpanCalculator
- [x] Integrate PresetSelector into BeamSpanCalculator
- [x] Integrate PresetSelector into RoofRafterSpanCalculator
- [x] Integrate PresetSelector into ColumnSpanCalculator
- [ ] Add onLoadPreset handlers to update calculator state
- [ ] Test preset save/load functionality across all calculators
- [ ] Ensure preset parameters match calculator input fields

### Minimum Ceiling Heights
- [x] Research NBC minimum ceiling height requirements by occupancy
- [x] Add ceiling height data to ceilingHeightData.ts
- [x] Create CeilingHeightTable component
- [x] Integrate ceiling heights into Construction Limits section
- [ ] Add ceiling height information to Building Height Limits table
- [ ] Include special cases (basements, mezzanines, sloped ceilings)
- [ ] Add visual diagram showing ceiling height measurements

### Multi-Calculator Comparison View
- [x] Create CalculatorComparison component
- [x] Add comparison context for state management
- [x] Build side-by-side calculator layout (2-4 columns)
- [x] Create unified results comparison table
- [ ] Add "Add to Comparison" button to each calculator
- [ ] Implement comparison state management
- [ ] Add export comparison results to Excel
- [ ] Include visual comparison charts (bar charts for spans)
- [ ] Add "Clear Comparison" and "Remove Item" functionality

### PDF Report Generator
- [x] Install PDF generation library (jsPDF)
- [x] Create PDFReportGenerator component
- [x] Design report template with header/footer
- [x] Include project information section
- [x] Add calculator results section with tables
- [ ] Embed beam diagrams as images
- [ ] Include NBC references and compliance notes
- [ ] Add occupancy classification summary
- [ ] Include construction limits and ceiling heights
- [ ] Add custom notes and project details
- [ ] Implement "Generate PDF Report" button
- [ ] Add report preview before download
- [ ] Include timestamp and version information


## NBC 2025 Comprehensive Enhancement - Phase 1 (Critical Priority)

### Fire Protection & Life Safety Calculators
- [x] Fire Separation Calculator (NBC Part 3.2.3, Table 3.1.3.1)
- [x] Occupant Load Calculator (NBC Part 3.1.17, Table 3.1.17.1)
- [x] Exit Requirements Calculator (NBC Part 3.4.2, 3.4.3)
- [x] Travel Distance Calculator (NBC Part 3.4.2.5)
- [x] Construction Type Selector (NBC Part 3.2.2)

### Enhanced Occupancy Classification
- [ ] Mixed Occupancy Calculator (major vs minor occupancy determination)
- [ ] Occupancy Separation Requirements Interactive Diagram
- [ ] Change of Use Assessment Tool

### Integration & UI
- [x] Create "Fire & Life Safety" tab in main interface
- [x] Add Fire Protection calculators section
- [x] Integrate with existing occupancy classification
- [x] Add NBC 2025 reference links for all calculators
- [ ] Update PDF Report Generator to include fire safety calculations

### Data & References
- [ ] Digitize NBC Table 3.1.3.1 (Occupancy Classification)
- [ ] Digitize NBC Table 3.1.17.1 (Occupant Load)
- [ ] Digitize NBC Table 3.2.2.X (Building Height and Area)
- [ ] Add NBC Part 3 reference documentation


## Current Implementation Session - Interactive Calculators & Phase 2

### Interactive Construction Limits Calculator
- [ ] Create ConstructionLimitsCalculator component with input fields
- [ ] Add occupancy type selector
- [ ] Add number of storeys input
- [ ] Add building height input (meters)
- [ ] Add sprinkler protection toggle
- [ ] Calculate maximum allowable building area based on NBC Table 3.2.2.X
- [ ] Display results with construction type recommendations
- [ ] Add visual indicators for compliance/non-compliance
- [ ] Include NBC article references
- [ ] Replace static Construction Limits table with interactive calculator

### Fire & Life Safety Calculator Logic Implementation
- [ ] Fire Separation Calculator - Implement NBC Table 3.1.3.1 lookup logic
- [ ] Fire Separation Calculator - Display required fire resistance rating (FRR)
- [ ] Occupant Load Calculator - Implement NBC Table 3.1.17.1 area factors
- [ ] Occupant Load Calculator - Calculate total occupant load
- [ ] Exit Requirements Calculator - Implement NBC 3.4.2 exit width calculations
- [ ] Exit Requirements Calculator - Determine number of required exits
- [ ] Travel Distance Calculator - Implement NBC 3.4.2.5 maximum distances
- [ ] Travel Distance Calculator - Display compliance status
- [ ] Construction Type Selector - Implement NBC Table 3.2.2.X logic
- [ ] Construction Type Selector - Display allowable construction types
- [ ] Add Excel export for all calculator results

### PDF Report Generator Enhancement
- [ ] Add Fire & Life Safety section to PDF reports
- [ ] Include Fire Separation requirements in reports
- [ ] Include Occupant Load calculations in reports
- [ ] Include Exit Requirements in reports
- [ ] Include Travel Distance analysis in reports
- [ ] Include Construction Type recommendations in reports
- [ ] Add NBC reference citations to PDF
- [ ] Format fire safety data in professional tables

### Phase 2 NBC Calculators
- [x] Barrier-Free Design Calculator (NBC Part 3.8)
- [x] Fire Alarm System Requirements Calculator (NBC Part 3.2.4)
- [x] Emergency Lighting Calculator (NBC Part 3.2.7)
- [x] Integrate Phase 2 calculators into Fire & Life Safety tab
- [x] Add calculation logic for all Phase 2 calculators
- [ ] Include Phase 2 results in PDF reports


### Construction Limits Calculator Enhancement - Street Frontage
- [x] Add street frontage selector (1, 2, 3, or 4 sides facing streets)
- [x] Implement NBC 3.2.2.8 area increase factors based on street frontage
- [x] Calculate increased allowable area for multiple street frontages
- [x] Display area increase percentage and calculation breakdown
- [ ] Add visual diagram showing street frontage scenarios
- [x] Include NBC article references for street frontage provisions


## Bug Fixes (Current Session)
- [x] Fix Interactive Construction Limits Calculator button not working (button works correctly, was disabled until required fields filled)
- [x] Debug calculation logic and result display
- [x] Test all input combinations to ensure proper functionality

## UX Enhancements (Current Session)
- [x] Add visual feedback to Construction Limits Calculator for required fields
- [x] Add helper text explaining button is disabled until occupancy and storeys are selected
- [x] Add asterisk (*) to required field labels
- [x] Add alert box with icon explaining the calculation requirements


## Construction Limits Calculator Advanced UX (Current Session)
- [x] Add real-time validation feedback with green checkmarks for completed required fields
- [x] Implement calculation history with localStorage (last 5 calculations)
- [x] Create interactive street frontage diagram with SVG visualization
- [x] Add clickable street-facing sides to diagram that update dropdown
- [x] Display calculation history with timestamps and quick restore functionality
