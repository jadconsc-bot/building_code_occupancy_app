import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HelpContent {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  relatedTopics?: string[];
}

interface HelpSystemContextType {
  isHelpOpen: boolean;
  searchQuery: string;
  activeHelpId: string | null;
  openHelp: (helpId?: string) => void;
  closeHelp: () => void;
  setSearchQuery: (query: string) => void;
  searchHelp: (query: string) => HelpContent[];
  getHelpContent: (id: string) => HelpContent | undefined;
}

const HelpSystemContext = createContext<HelpSystemContextType | undefined>(undefined);

const helpDatabase: HelpContent[] = [
  {
    id: "stair_design",
    category: "Calculators",
    title: "Stair Design Calculator",
    content: `The Stair Design Calculator determines the number of risers, riser height, number of treads, tread depth, and total run based on NBC Article 3.4.6.

**How to Use:**
1. Select stair type (Residential or Commercial)
2. Enter total rise in millimeters
3. Click Calculate to see results

**Code Requirements:**
- Residential: Max riser 200mm, min tread 235mm
- Commercial: Max riser 180mm, min tread 280mm
- All stairs: Min riser 125mm

The calculator automatically checks compliance and displays warnings for non-compliant designs.`,
    keywords: ["stair", "riser", "tread", "3.4.6", "stairs", "residential", "commercial"],
    relatedTopics: ["batch_calculator", "guard_handrail"]
  },
  {
    id: "batch_calculator",
    category: "Calculators",
    title: "Batch Stair Calculator",
    content: `The Batch Stair Calculator allows you to calculate multiple stair scenarios simultaneously and export results to Excel or PDF.

**How to Use:**
1. Add rows for each scenario using the "Add Scenario" button
2. Enter stair type and total rise for each row
3. Click "Calculate All" to process all scenarios
4. Export results to Excel or PDF

**Export Options:**
- **Excel:** Formatted spreadsheet with all calculation data
- **PDF:** Professional report with NBC code references and compliance summary

The batch calculator is ideal for projects with multiple stair types or varying floor heights.`,
    keywords: ["batch", "multiple", "scenarios", "excel", "pdf", "export"],
    relatedTopics: ["stair_design"]
  },
  {
    id: "occupant_load",
    category: "Calculators",
    title: "Occupant Load Calculator",
    content: `The Occupant Load Calculator determines the design occupancy based on NBC Table 3.1.17.1.

**How to Use:**
1. Select occupancy category (Assembly, Residential, Business, etc.)
2. Select specific space type
3. Enter floor area in square meters
4. View calculated occupant load

**Common Occupant Load Factors:**
- Assembly without fixed seats: 1.4 m²/person
- Retail sales (main floor): 3.7 m²/person
- Office spaces: 9.3 m²/person
- Dwelling units: 18.6 m²/person

The occupant load is used to determine exit capacity and the number of exits required.`,
    keywords: ["occupant", "load", "capacity", "3.1.17.1", "assembly", "retail", "office"],
    relatedTopics: ["exit_requirements"]
  },
  {
    id: "exit_requirements",
    category: "Calculators",
    title: "Exit Requirements Calculator",
    content: `The Exit Requirements Calculator determines the number and width of exits based on occupant load per NBC Article 3.4.2 and 3.4.3.

**How to Use:**
1. Enter occupant load (from Occupant Load Calculator)
2. Select building height (number of storeys)
3. Indicate if building is sprinklered
4. View required number of exits and minimum widths

**Exit Requirements:**
- 1 exit: ≤60 persons
- 2 exits: 61-500 persons
- 3 exits: 501-1000 persons
- 4+ exits: >1000 persons

**Width Requirements:**
- Doors/ramps: 4.8mm per person
- Stairs: 6.1mm per person
- Minimum: 900mm (barrier-free requirement)`,
    keywords: ["exit", "egress", "width", "capacity", "3.4.2", "3.4.3", "doors", "stairs"],
    relatedTopics: ["occupant_load", "travel_distance"]
  },
  {
    id: "guard_handrail",
    category: "Calculators",
    title: "Guard and Handrail Calculator",
    content: `The Guard and Handrail Calculator determines required heights for protective barriers and handrails per NBC Article 3.4.6.5 and 3.4.6.7.

**How to Use:**
1. Select location (residential dwelling, residential common, or commercial)
2. Select application (stair, ramp, landing, balcony, mezzanine)
3. Enter fall height in millimeters
4. View required guard and handrail heights

**Guard Heights:**
- Residential dwellings: 1070mm (stairs), 920mm (landings)
- Commercial: 1070mm (all applications)
- Required when fall height >600mm

**Handrail Heights:**
- Residential stairs: 865-965mm
- Commercial stairs: 865-920mm
- Must extend 300mm beyond top and bottom`,
    keywords: ["guard", "handrail", "railing", "barrier", "3.4.6.5", "3.4.6.7", "height"],
    relatedTopics: ["stair_design"]
  },
  {
    id: "snow_load",
    category: "Calculators",
    title: "Snow Load Calculator",
    content: `The Snow Load Calculator determines design snow loads for roofs based on NBC Section 4.1.6.

**How to Use:**
1. Select location (determines ground snow load)
2. Select roof type and slope
3. Select importance category
4. Select exposure and thermal factors
5. View calculated design snow load

**Formula:**
S = Is [Ss(CbCwCsCa) + Sr]

Where:
- Is = importance factor (1.0-1.25)
- Ss = ground snow load (location-specific)
- Cb = basic roof snow load factor
- Cw = wind exposure factor (0.75-1.1)
- Cs = roof slope factor
- Ca = shape factor
- Sr = associated rain load

The calculator accounts for all factors automatically based on your inputs.`,
    keywords: ["snow", "load", "roof", "4.1.6", "structural", "design", "importance"],
    relatedTopics: ["thermal_resistance"]
  },
  {
    id: "accessibility_ramp",
    category: "Calculators",
    title: "Accessibility Ramp Calculator",
    content: `The Accessibility Ramp Calculator determines required length and configuration for barrier-free ramps per NBC Section 3.8.

**How to Use:**
1. Enter vertical rise in millimeters
2. Select ramp type (interior or exterior)
3. View calculated ramp length and landing requirements

**Maximum Slopes:**
- Interior ramps: 1:12 (8.33%)
- Exterior ramps: 1:15 (6.67%) in harsh climates

**Landing Requirements:**
- Top/bottom: 1670mm × 1670mm minimum
- Intermediate: Every 9000mm of horizontal run
- Door landings: 1200mm × 1670mm on pull side

**Handrails:**
- Required when rise >100mm
- Height: 865-965mm
- Must extend 300mm beyond ramp slope`,
    keywords: ["accessibility", "ramp", "barrier-free", "3.8", "slope", "landing", "wheelchair"],
    relatedTopics: ["guard_handrail"]
  },
  {
    id: "calculation_history",
    category: "Features",
    title: "Calculation History",
    content: `The Calculation History feature automatically saves your last 10 calculations for each calculator type.

**How to Use:**
1. Click the History button (clock icon) in any calculator
2. Browse recent calculations with timestamps
3. Click "Load" to restore a previous calculation
4. Click trash icon to delete individual items
5. Click "Clear All" to remove all history

**Features:**
- Automatic saving after each calculation
- Stores inputs and results
- Preview shows key information
- Persists across browser sessions
- Separate history for each calculator type

History is stored locally in your browser and is not shared across devices.`,
    keywords: ["history", "save", "load", "previous", "calculations", "restore"],
    relatedTopics: ["batch_calculator"]
  },
  {
    id: "mobile_features",
    category: "Features",
    title: "Mobile Features",
    content: `The application includes several mobile-optimized features for on-site use.

**Touch Gestures:**
- Swipe left: Next calculator tab
- Swipe right: Previous calculator tab
- Swipe threshold: 50 pixels

**Mobile Input:**
- Numeric keyboards for number fields
- Real-time validation with visual feedback
- Green checkmark: Valid input
- Red warning: Invalid input

**Offline Mode:**
- Install as Progressive Web App (PWA)
- Access previously viewed content offline
- Calculation history available offline
- Automatic sync when back online

**Installing as PWA:**
1. Open in mobile browser (Chrome/Safari)
2. Tap browser menu (three dots)
3. Select "Add to Home Screen"
4. Launch from home screen icon`,
    keywords: ["mobile", "swipe", "gesture", "offline", "pwa", "touch", "keyboard"],
    relatedTopics: ["calculation_history"]
  },
  {
    id: "keyboard_shortcuts",
    category: "Features",
    title: "Keyboard Shortcuts",
    content: `Use keyboard shortcuts for faster navigation and workflow.

**Global Shortcuts:**
- Ctrl/Cmd + K: Focus search bar
- Ctrl/Cmd + P: Open projects menu
- Ctrl/Cmd + /: Show keyboard shortcuts
- Esc: Close panels and dialogs

**Calculator Shortcuts:**
- Ctrl/Cmd + S: Save calculation to project
- Ctrl/Cmd + E: Export calculation
- Ctrl/Cmd + H: Open calculation history
- Ctrl/Cmd + Enter: Execute calculation

**Navigation Shortcuts:**
- Arrow Up/Down: Navigate occupancy groups
- Enter: Open selected occupancy
- Tab: Next interactive element
- Shift + Tab: Previous interactive element

**Tab Shortcuts:**
- Alt + 1: Building Code tab
- Alt + 2: Plumbing tab
- Alt + 3: Electrical tab
- Alt + 4: Additions tab
- Alt + 5: Sustainability tab
- Alt + 6: Fire & Life Safety tab`,
    keywords: ["keyboard", "shortcuts", "hotkeys", "navigation", "ctrl", "cmd", "alt"],
    relatedTopics: ["mobile_features"]
  },
  {
    id: "occupancy_classification",
    category: "Occupancy",
    title: "Occupancy Classifications",
    content: `The NBC organizes buildings into six major occupancy groups (A through F) based on use and fire/life safety risks.

**Major Groups:**
- **Group A:** Assembly (theatres, restaurants, arenas)
- **Group B:** Institutional (hospitals, prisons, care facilities)
- **Group C:** Residential (apartments, hotels, dwellings)
- **Group D:** Business (offices, banks, professional services)
- **Group E:** Mercantile (retail stores, shopping malls)
- **Group F:** Industrial (factories, warehouses, processing plants)

**How to Use:**
1. Search for your building type in the sidebar
2. Select the appropriate occupancy group
3. Review detailed requirements and examples
4. Use the comparison tool to evaluate multiple occupancies

Each occupancy has specific requirements for fire separation, construction limits, sprinkler protection, and egress design.`,
    keywords: ["occupancy", "classification", "group", "assembly", "residential", "commercial", "industrial"],
    relatedTopics: ["fire_separation", "construction_limits"]
  },
  {
    id: "fire_separation",
    category: "Code Requirements",
    title: "Fire Separation Requirements",
    content: `Fire separations are fire-resistance-rated assemblies that prevent fire spread between different areas of a building.

**Common Fire Ratings:**
- 2-hour: Between major occupancies (high hazard)
- 1-hour: Between major occupancies (normal hazard)
- 45-minute: Corridors and exit access
- 30-minute: Dwelling unit separations (some cases)

**Factors Affecting Requirements:**
- Occupancy classification
- Building height and area
- Sprinkler protection
- Construction type
- Proximity to property lines

**Fire Separation Calculator:**
Use the Fire Separation Calculator to determine required ratings based on your specific building configuration and occupancy mix.

Fire separations must extend from floor to underside of floor/roof above, with proper sealing of penetrations.`,
    keywords: ["fire", "separation", "rating", "resistance", "wall", "floor", "assembly"],
    relatedTopics: ["occupancy_classification", "construction_limits"]
  }
];

export function HelpSystemProvider({ children }: { children: ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);

  const openHelp = (helpId?: string) => {
    setIsHelpOpen(true);
    if (helpId) {
      setActiveHelpId(helpId);
    }
  };

  const closeHelp = () => {
    setIsHelpOpen(false);
    setActiveHelpId(null);
    setSearchQuery('');
  };

  const searchHelp = (query: string): HelpContent[] => {
    if (!query.trim()) {
      return helpDatabase;
    }

    const lowerQuery = query.toLowerCase();
    return helpDatabase.filter(help => 
      help.title.toLowerCase().includes(lowerQuery) ||
      help.content.toLowerCase().includes(lowerQuery) ||
      help.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
      help.category.toLowerCase().includes(lowerQuery)
    );
  };

  const getHelpContent = (id: string): HelpContent | undefined => {
    return helpDatabase.find(help => help.id === id);
  };

  return (
    <HelpSystemContext.Provider
      value={{
        isHelpOpen,
        searchQuery,
        activeHelpId,
        openHelp,
        closeHelp,
        setSearchQuery,
        searchHelp,
        getHelpContent
      }}
    >
      {children}
    </HelpSystemContext.Provider>
  );
}

export function useHelpSystem() {
  const context = useContext(HelpSystemContext);
  if (!context) {
    throw new Error('useHelpSystem must be used within HelpSystemProvider');
  }
  return context;
}
