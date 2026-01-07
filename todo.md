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
