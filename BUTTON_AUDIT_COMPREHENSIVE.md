# Comprehensive Button Audit - Building Code Occupancy Classifier

## Overview
This document tracks all buttons, links, and interactive elements across all pages of the application, their expected functionality, and testing status.

---

## 1. HOME PAGE (Dashboard)

### Header Buttons
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Start Tutorial | Button | Opens tutorial modal/guide | TBD | Check if tutorial content exists |
| Generate Report | Button | Generates PDF/export of current data | TBD | Verify report generation works |
| Notifications Bell | Icon Button | Shows notifications | TBD | Check if notification system is implemented |
| User Profile (J) | Avatar Button | Opens user menu (logout, settings) | TBD | Check dropdown menu |

### Feature Cards
| Card | Button | Expected Action | Status | Notes |
|------|--------|-----------------|--------|-------|
| Occupancy Classification | Access | Navigate to Occupancy Classifier page | TBD | Check routing |
| Project Management | Access | Navigate to Projects page | TBD | Check routing |
| Documentation | Access | Navigate to Documentation/Help page | TBD | Check routing |

### Legal Disclaimer
| Element | Type | Expected Action | Status | Notes |
|---------|------|-----------------|--------|-------|
| Expand/Collapse | Icon Button | Toggle disclaimer visibility | TBD | Check toggle state |

---

## 2. OCCUPANCY CLASSIFIER PAGE

### Search & Filter Area
| Element | Type | Expected Action | Status | Notes |
|---------|------|-----------------|--------|-------|
| Search Input | Text Field | Filter occupancy types by name/code | TBD | Test search functionality |
| Voice Search Button | Icon Button | Start voice recognition | TBD | Test microphone access |
| Clear Search | Button | Clear search query | TBD | Check if visible when searching |

### Occupancy List
| Element | Type | Expected Action | Status | Notes |
|---------|------|-----------------|--------|-------|
| Occupancy Item (Clickable) | List Item | Select occupancy and show details | TBD | Test selection |
| Bookmark Star | Icon Button | Add/remove from bookmarks | TBD | Test bookmark toggle |

### Sidebar Actions
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Export Bookmarks | Button | Download bookmarks as text file | TBD | Check file download |
| Recent Items | Section | Click to select recent occupancy | TBD | Test recent history |

### Detail Panel
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Share Link | Button | Copy share URL to clipboard | TBD | Test clipboard copy |
| Print | Button | Open print dialog | TBD | Test print functionality |
| Back (Mobile) | Button | Return to list view | TBD | Mobile-only, test on mobile |

---

## 3. PROJECTS PAGE

### Header Actions
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| New Project | Button | Open create project modal | TBD | Check modal appears |
| Filter Projects | Dropdown | Filter by status/date/owner | TBD | Test filter options |
| Sort Projects | Dropdown | Sort by name/date/progress | TBD | Test sort options |

### Project Cards
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Project Name (Clickable) | Link | Open project details | TBD | Check navigation |
| Edit Project | Icon Button | Open edit modal | TBD | Check modal appears |
| Delete Project | Icon Button | Delete project (with confirmation) | TBD | Check confirmation dialog |
| View Details | Button | Open full project view | TBD | Check navigation |

### Project Details Modal
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Save Changes | Button | Save project updates | TBD | Check database update |
| Cancel | Button | Close modal without saving | TBD | Check modal closes |
| Delete | Button | Delete project | TBD | Check confirmation dialog |

---

## 4. RULE MANAGEMENT PAGE

### Header Actions
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Add Rule | Button | Open create rule modal | TBD | Check modal appears |
| Import Rules | Button | Import rules from file | TBD | Check file upload |
| Export Rules | Button | Export rules to file | TBD | Check file download |

### Rules Table
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Edit Rule | Icon Button | Open edit modal | TBD | Check modal appears |
| Delete Rule | Icon Button | Delete rule (with confirmation) | TBD | Check confirmation dialog |
| Duplicate Rule | Icon Button | Create copy of rule | TBD | Check duplication works |
| Enable/Disable | Toggle | Enable/disable rule | TBD | Check toggle state |

### Rule Details Modal
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Save | Button | Save rule changes | TBD | Check database update |
| Cancel | Button | Close modal without saving | TBD | Check modal closes |
| Test Rule | Button | Test rule with sample data | TBD | Check test functionality |

---

## 5. CLIENTS MANAGEMENT PAGE

### Header Actions
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Add Client | Button | Open create client modal | TBD | Check modal appears |
| Import Clients | Button | Import clients from CSV | TBD | Check file upload |
| Export Clients | Button | Export clients to CSV | TBD | Check file download |

### Clients Table
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| View Client | Icon Button | Open client details | TBD | Check details view |
| Edit Client | Icon Button | Open edit modal | TBD | Check modal appears |
| Delete Client | Icon Button | Delete client (with confirmation) | TBD | Check confirmation dialog |
| Send Email | Icon Button | Open email compose | TBD | Check email functionality |

### Client Details Modal
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Save | Button | Save client changes | TBD | Check database update |
| Cancel | Button | Close modal without saving | TBD | Check modal closes |
| Add Contact | Button | Add new contact to client | TBD | Check contact addition |

---

## 6. CALCULATION HISTORY PAGE

### Header Actions
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Clear History | Button | Delete all history (with confirmation) | TBD | Check confirmation dialog |
| Export History | Button | Export history to CSV/PDF | TBD | Check file download |
| Filter by Date | Date Picker | Filter calculations by date range | TBD | Test date filtering |

### History Items
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| View Calculation | Link | Open calculation details | TBD | Check navigation |
| Repeat Calculation | Button | Repeat the same calculation | TBD | Check calculation runs |
| Delete Item | Icon Button | Delete history item | TBD | Check deletion |
| Copy to Clipboard | Button | Copy calculation result | TBD | Check clipboard copy |

---

## 7. PLUMBING TAB

### Calculators
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Fixture Unit Calculator | Button | Open fixture unit calculator | TBD | Check modal/page opens |
| Wet Venting Diagram | Button | Show wet venting diagram | TBD | Check diagram displays |
| Gas Line Calculator | Button | Open gas line calculator | TBD | Check modal/page opens |

### Calculator Controls
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Calculate | Button | Run calculation | TBD | Check calculation works |
| Clear | Button | Reset calculator | TBD | Check reset works |
| Save Result | Button | Save calculation result | TBD | Check database save |
| Print | Button | Print calculation | TBD | Check print dialog |

---

## 8. ELECTRICAL TAB

### Calculators
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Service Load Calculator | Button | Open service load calculator | TBD | Check modal/page opens |
| Voltage Drop Calculator | Button | Open voltage drop calculator | TBD | Check modal/page opens |
| Conduit Fill Calculator | Button | Open conduit fill calculator | TBD | Check modal/page opens |

### Calculator Controls
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Calculate | Button | Run calculation | TBD | Check calculation works |
| Clear | Button | Reset calculator | TBD | Check reset works |
| Save Result | Button | Save calculation result | TBD | Check database save |
| Print | Button | Print calculation | TBD | Check print dialog |

---

## 9. ADDITIONS TAB

### Permit Checklist
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Deck Checklist | Button | Show deck requirements | TBD | Check content displays |
| Garage Checklist | Button | Show garage requirements | TBD | Check content displays |
| Renovation Checklist | Button | Show renovation requirements | TBD | Check content displays |

### Diagram Viewers
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Fire Separation Diagram | Button | Show fire separation diagram | TBD | Check diagram displays |
| Egress Window Diagram | Button | Show egress window diagram | TBD | Check diagram displays |
| GFCI Zone Diagram | Button | Show GFCI zone diagram | TBD | Check diagram displays |
| Setback Diagram | Button | Show setback diagram | TBD | Check diagram displays |

---

## 10. NAVIGATION & GLOBAL

### Main Navigation
| Element | Type | Expected Action | Status | Notes |
|---------|------|-----------------|--------|-------|
| Occupancy Classifier | Nav Link | Navigate to classifier | TBD | Check routing |
| Projects | Nav Link | Navigate to projects | TBD | Check routing |
| Rule Management | Nav Link | Navigate to rules | TBD | Check routing |
| Calculation History | Nav Link | Navigate to history | TBD | Check routing |

### User Menu
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Profile | Menu Item | Open profile page | TBD | Check navigation |
| Settings | Menu Item | Open settings page | TBD | Check navigation |
| Logout | Menu Item | Log out user | TBD | Check logout works |

### Theme Toggle
| Button | Type | Expected Action | Status | Notes |
|--------|------|-----------------|--------|-------|
| Dark/Light Mode | Toggle | Switch theme | TBD | Check theme changes |

---

## Testing Status Summary

- **Total Buttons Identified**: [COUNT]
- **Tested**: 0
- **Working**: 0
- **Dead/Broken**: 0
- **Pending**: [COUNT]

---

## Dead Buttons Found

(To be updated as testing progresses)

| Page | Button | Issue | Fix Applied | Status |
|------|--------|-------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD |

---

## Notes

- All buttons should have clear visual feedback (hover states, disabled states)
- Confirmation dialogs should appear for destructive actions (delete, clear)
- Loading states should appear during async operations
- Error messages should be displayed for failed operations
- Success messages should be displayed for successful operations
