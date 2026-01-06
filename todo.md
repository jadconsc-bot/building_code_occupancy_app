
## New Features (Cloud Sync, AI Assistant, Permit Calculator)
- [x] Fix TypeScript error in Home.tsx (useAuth import)
- [x] Implement Permit Fee Calculator
- [x] Create database schema for bookmarks and notes
- [x] Create backend API routes for bookmarks and notes
- [x] Create API helper functions for frontend
- [x] Prepare Mobile Deployment Guide

## Future Enhancements (Deferred)
- [ ] Integrate frontend with cloud sync API (replace localStorage with API calls)
- [ ] Implement AI Code Assistant with LLM integration

## Sustainability & Energy Systems
- [x] Create sustainability data (solar, EV charging, water heaters, grid integration)
- [x] Create SustainabilityTools component
- [x] Add Sustainability tab to main application
- [x] Add visual diagrams for solar panel mounting and EV charging
- [x] Integrate voice commands for Sustainability tab

## Mobile Navigation Fix
- [x] Replace horizontal tab scrolling with mobile dropdown menu
- [x] Position dropdown in top-right corner on mobile screens
- [x] Ensure all tabs (Building, Plumbing, Electrical, Additions, Sustainability) are accessible
- [x] Test on mobile viewport sizes

## Desktop Sidebar Scrolling Fix
- [x] Add max-height to sidebar container
- [x] Enable overflow-y scrolling for occupancy list
- [x] Ensure search bar and bookmarks remain visible while list scrolls

## New Features (Keyboard Nav, PDF Export, Regional Variants)
- [x] Implement keyboard shortcuts (Arrow keys, Tab, "/" for search)
- [x] Add keyboard shortcut help modal
- [x] Implement Export to PDF functionality
- [x] Add Regional Code Variants selector (AB, BC, ON, SK)
- [x] Update UI to display selected region

## Building Code Requirements (Height, Setbacks, Openings, Ergonomics)
- [x] Create data for building height limits by occupancy and construction type
- [x] Create data for property setback requirements
- [x] Create data for allowable openings in fire-rated assemblies
- [x] Create data for ergonomic requirements (stairs, handrails, accessibility)
- [x] Create visual diagrams for setback requirements
- [x] Create visual diagrams for allowable openings
- [x] Create visual diagrams for stair/handrail ergonomics
- [x] Integrate new content into Building tab

## Building Tab Reorganization & New Features
- [x] Fix JSX structure errors in Building tab
- [x] Create span tables data for structural lumber (2x8, 2x10, 2x12)
- [x] Implement Span Tables component with species/grade/spacing filters
- [ ] Create Code Amendment Tracker data (NBC 2019 vs 2023)
- [ ] Implement Code Amendment Tracker component with filtering
- [ ] Create Inspector Checklist Generator component
- [ ] Generate checklists by occupancy type and construction phase
- [ ] Conduct accuracy audit of all code references
- [ ] Document audit findings and corrections
