# Mobile Layout Analysis

## Overlapping Issues Identified

When an occupancy group is selected on mobile (viewport width < 768px):

### Top Action Buttons Area
- **Projects, Compare, Share, Print Guide** buttons (4 buttons)
- **Export PDF, Export Checklist, Beta Feedback** buttons (3 buttons)
- These 7 buttons are all displayed in a row, causing horizontal overflow

### Content Sections
The main content area has multiple sections that should be in an accordion:
1. **Project Notes** - Textarea for adding notes
2. **Tabs Navigation** - Building Code, Plumbing, Electrical, Additions, Sustainability
3. **Quick Jump Navigation** - Construction Limits, Span Tables, Code Amendments, Inspector Checklist, Fire & Life Safety, Design Tools
4. **Main Content** - Definition, Examples, Compliance Data, Diagrams, Calculators

## Proposed Solution

### Keep Fixed:
- "Back to Search" button (should be visible at top)
- Occupancy title (C (Secondary Suite))
- Region selector (General / Residential - Secondary Suite)

### Convert to Accordion:
1. **Actions** section (collapsible)
   - Projects, Compare, Share buttons
   - Print Guide, Export PDF, Export Checklist buttons
   - Beta Feedback button

2. **Project Notes** section (collapsible)
   - Textarea for notes

3. **Content Tabs** section (always visible, but content inside each tab in accordion)
   - Building Code tab content
   - Plumbing tab content
   - Electrical tab content
   - etc.

4. **Quick Navigation** section (collapsible)
   - Jump links to major sections

## Implementation Plan
- Use shadcn/ui Accordion component
- Add mobile-specific CSS classes (md:hidden for accordion, md:flex for desktop layout)
- Ensure accordion sections are keyboard accessible
- Add smooth transitions for expand/collapse
