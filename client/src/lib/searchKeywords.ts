// Comprehensive natural language search keywords for the Building Code app
// Maps common terms, synonyms, and related words to occupancy IDs and app sections

// ============================================
// OCCUPANCY CLASSIFICATION KEYWORDS
// ============================================
export const occupancyKeywords: Record<string, string[]> = {
  // A-1: Assembly - Performing Arts
  "A-1": [
    "theatre", "theater", "cinema", "movie", "film", "opera", "concert", "performance",
    "stage", "auditorium", "playhouse", "amphitheatre", "amphitheater", "tv studio",
    "television studio", "broadcast studio", "performing arts", "live show", "entertainment venue",
    "multiplex", "imax", "screening room", "recital hall", "music hall", "comedy club"
  ],

  // A-2: Assembly - General
  "A-2": [
    "church", "mosque", "temple", "synagogue", "chapel", "worship", "religious", "cathedral",
    "parish hall", "fellowship hall", "prayer room", "meditation center",
    "gym", "gymnasium", "fitness center", "fitness centre", "workout", "exercise", "crossfit",
    "yoga studio", "pilates", "martial arts", "boxing gym", "weight room",
    "bar", "pub", "tavern", "nightclub", "lounge", "club", "drinking establishment", "speakeasy",
    "restaurant", "cafe", "cafeteria", "diner", "eatery", "food service", "dining", "bistro",
    "fast food", "food court", "banquet hall", "catering hall",
    "school", "college", "university", "classroom", "lecture hall", "education", "academy",
    "high school", "elementary school", "middle school", "junior high", "kindergarten",
    "library", "reading room", "study hall", "media center",
    "museum", "gallery", "art gallery", "exhibition", "exhibit hall", "planetarium",
    "community hall", "community center", "community centre", "meeting hall", "civic center",
    "courtroom", "court", "tribunal", "legal", "courthouse",
    "dance hall", "ballroom", "dance studio", "wedding venue", "reception hall",
    "daycare", "day care", "childcare", "child care", "nursery", "preschool", "montessori",
    "bowling alley", "bowling", "recreation", "arcade", "game room", "billiards",
    "passenger station", "bus station", "train station", "transit terminal", "airport terminal"
  ],

  // A-3: Assembly - Arena Type
  "A-3": [
    "arena", "stadium", "sports arena", "hockey rink", "ice rink", "skating rink",
    "swimming pool", "pool", "aquatic center", "aquatic centre", "natatorium", "water park",
    "sports complex", "fieldhouse", "field house", "indoor sports", "velodrome",
    "basketball arena", "volleyball court", "tennis court", "badminton", "squash court",
    "curling rink", "figure skating"
  ],

  // A-4: Assembly - Open Air
  "A-4": [
    "bleachers", "grandstand", "outdoor stadium", "outdoor arena", "open air",
    "amusement park", "theme park", "fairground", "fair grounds", "carnival", "midway",
    "outdoor venue", "outdoor seating", "reviewing stand", "parade ground",
    "race track", "racetrack", "speedway", "motorsport", "rodeo", "exhibition grounds"
  ],

  // B-1: Institutional - Detention
  "B-1": [
    "jail", "prison", "penitentiary", "correctional", "detention center", "detention centre",
    "lockup", "holding cell", "reformatory", "psychiatric detention", "secure facility",
    "police station detention", "custody", "remand center", "youth detention",
    "maximum security", "minimum security", "federal prison", "provincial jail"
  ],

  // B-2: Institutional - Treatment
  "B-2": [
    "hospital", "medical center", "medical centre", "healthcare", "health care",
    "emergency room", "er", "icu", "intensive care", "surgery center", "surgical",
    "infirmary", "clinic", "medical clinic", "treatment facility", "treatment center",
    "nursing home", "long term care", "ltc", "rehabilitation", "rehab", "convalescent",
    "psychiatric hospital", "mental health facility", "detox", "addiction treatment",
    "dialysis center", "cancer center", "oncology", "maternity ward", "pediatric"
  ],

  // B-3: Institutional - Care
  "B-3": [
    "assisted living", "senior living", "seniors home", "seniors residence",
    "care home", "care facility", "group home", "hospice", "palliative",
    "retirement home", "retirement residence", "elderly care", "aged care",
    "custodial home", "childrens home", "children's home", "foster home",
    "memory care", "dementia care", "alzheimer's facility"
  ],

  // C-1: Residential - General
  "C-1": [
    "apartment", "condo", "condominium", "flat", "unit", "suite", "penthouse",
    "house", "home", "residence", "dwelling", "single family", "single-family",
    "townhouse", "town house", "row house", "rowhouse", "duplex", "triplex", "fourplex",
    "hotel", "motel", "inn", "lodge", "hostel", "bed and breakfast", "b&b", "bnb",
    "dormitory", "dorm", "residence hall", "student housing", "fraternity", "sorority",
    "boarding house", "rooming house", "lodging", "residential building",
    "monastery", "convent", "religious residence", "rectory", "parsonage",
    "multi-family", "multi-unit", "high-rise residential", "low-rise residential"
  ],

  // C-2: Residential - Secondary Suite
  "C-2": [
    "basement suite", "basement apartment", "basement unit", "walkout basement",
    "secondary suite", "accessory dwelling", "adu", "granny flat", "granny suite",
    "in-law suite", "inlaw suite", "mother-in-law suite", "nanny suite",
    "garden suite", "laneway house", "laneway home", "coach house", "backyard cottage",
    "garage suite", "garage apartment", "carriage house", "above garage",
    "legal suite", "rental suite", "rental unit", "income suite"
  ],

  // D: Business & Personal Services
  "D": [
    "office", "office building", "corporate", "business", "professional", "coworking",
    "bank", "financial", "credit union", "investment firm", "insurance office",
    "medical office", "doctor office", "doctors office", "physician", "dental office", "dentist",
    "optometrist", "chiropractor", "physiotherapy", "massage therapy", "veterinary",
    "salon", "beauty parlor", "beauty parlour", "barber", "spa", "nail salon", "hair salon",
    "police station", "fire station", "government office", "municipal", "city hall",
    "radio station", "recording studio", "post office", "call center",
    "law office", "legal office", "accounting firm", "consulting", "real estate office"
  ],

  // E: Mercantile
  "E": [
    "store", "shop", "retail", "shopping", "mall", "shopping center", "shopping centre",
    "supermarket", "grocery", "grocery store", "food store", "convenience store",
    "department store", "big box", "warehouse store", "costco", "walmart",
    "market", "farmers market", "flea market", "antique store",
    "boutique", "showroom", "outlet", "strip mall", "plaza",
    "pharmacy", "drugstore", "hardware store", "home improvement",
    "electronics store", "appliance store", "furniture store", "clothing store",
    "liquor store", "cannabis store", "dispensary"
  ],

  // F-1: Industrial - High Hazard
  "F-1": [
    "chemical plant", "chemical factory", "chemical manufacturing", "petrochemical",
    "paint factory", "spray painting", "paint shop", "coating facility",
    "distillery", "brewery", "winery", "alcohol production",
    "grain elevator", "grain storage", "flour mill",
    "flammable", "explosive", "hazardous materials", "hazmat", "combustible liquids",
    "bulk plant", "fuel storage", "petroleum", "refinery", "gas plant",
    "fireworks", "ammunition", "explosives manufacturing"
  ],

  // F-2: Industrial - Medium Hazard
  "F-2": [
    "factory", "manufacturing", "plant", "industrial", "production facility",
    "warehouse", "distribution center", "distribution centre", "fulfillment center", "logistics",
    "aircraft hangar", "hangar", "aviation", "maintenance hangar",
    "auto shop", "repair garage", "mechanic", "automotive", "body shop", "collision center",
    "service station", "gas station", "filling station", "truck stop",
    "laboratory", "lab", "research facility", "testing lab",
    "woodworking", "millwork", "cabinet shop", "furniture factory", "sawmill",
    "printing plant", "print shop", "bindery", "packaging plant"
  ],

  // F-3: Industrial - Low Hazard
  "F-3": [
    "storage garage", "parking garage", "parkade", "parking structure",
    "power plant", "power station", "utility", "substation", "transformer station",
    "creamery", "dairy", "food processing", "bakery", "meat processing",
    "cold storage", "refrigerated warehouse", "freezer warehouse",
    "low hazard storage", "non-combustible storage", "self storage", "mini storage"
  ]
};

// ============================================
// CALCULATOR & TOOL KEYWORDS
// ============================================
export const calculatorKeywords: Record<string, { tab: string; section: string; keywords: string[] }> = {
  // Fire Safety Calculators
  "fire-separation": {
    tab: "fire-safety",
    section: "fire-separation-calculator",
    keywords: [
      "fire separation", "fire rating", "fire resistance", "frr", "fire resistance rating",
      "fire wall", "firewall", "fire barrier", "fire partition", "rated assembly",
      "hour rating", "1 hour", "2 hour", "fire compartment"
    ]
  },
  "occupant-load": {
    tab: "fire-safety",
    section: "occupant-load-calculator",
    keywords: [
      "occupant load", "occupancy load", "maximum occupancy", "occupant capacity",
      "load factor", "area per person", "persons per square meter", "crowd capacity",
      "assembly capacity", "seating capacity"
    ]
  },
  "exit-requirements": {
    tab: "fire-safety",
    section: "exit-requirements-calculator",
    keywords: [
      "exit", "egress", "exit width", "exit door", "exit stair", "means of egress",
      "emergency exit", "fire exit", "exit capacity", "exit route", "exit access",
      "number of exits", "two exits", "required exits"
    ]
  },
  "travel-distance": {
    tab: "fire-safety",
    section: "travel-distance-calculator",
    keywords: [
      "travel distance", "egress distance", "exit distance", "maximum travel",
      "dead end", "dead end corridor", "common path", "travel path"
    ]
  },
  "construction-type": {
    tab: "fire-safety",
    section: "construction-type-selector",
    keywords: [
      "construction type", "building type", "combustible", "non-combustible",
      "noncombustible", "heavy timber", "fire resistive", "type i", "type ii",
      "type iii", "type iv", "type v"
    ]
  },
  "flame-spread": {
    tab: "fire-safety",
    section: "flame-spread-rating",
    keywords: [
      "flame spread", "fsr", "flame spread rating", "smoke developed", "sdr",
      "interior finish", "class a", "class b", "class c", "tunnel test",
      "astm e84", "ulc s102", "surface burning"
    ]
  },
  "barrier-free": {
    tab: "fire-safety",
    section: "barrier-free-calculator",
    keywords: [
      "barrier free", "barrier-free", "accessible", "accessibility", "ada",
      "wheelchair", "handicap", "disabled access", "universal design",
      "accessible entrance", "accessible washroom", "accessible parking"
    ]
  },
  "fire-alarm": {
    tab: "fire-safety",
    section: "fire-alarm-calculator",
    keywords: [
      "fire alarm", "smoke detector", "smoke alarm", "heat detector",
      "pull station", "fire panel", "annunciator", "notification appliance",
      "horn strobe", "sprinkler alarm", "fire detection"
    ]
  },
  "emergency-lighting": {
    tab: "fire-safety",
    section: "emergency-lighting-calculator",
    keywords: [
      "emergency lighting", "exit sign", "egress lighting", "battery backup",
      "emergency power", "standby power", "exit illumination"
    ]
  },

  // Design Tools Calculators
  "stair-design": {
    tab: "design-tools",
    section: "stair-design-calculator",
    keywords: [
      "stair", "stairs", "stairway", "staircase", "step", "riser", "tread",
      "stair rise", "stair run", "stair angle", "stair pitch", "stair width",
      "headroom", "handrail", "guardrail", "nosing", "landing"
    ]
  },
  "guard-handrail": {
    tab: "design-tools",
    section: "guard-handrail-calculator",
    keywords: [
      "guard", "guardrail", "handrail", "railing", "balustrade", "baluster",
      "guard height", "handrail height", "graspable", "guard opening",
      "4 inch sphere", "climbable guard"
    ]
  },
  "snow-load": {
    tab: "design-tools",
    section: "snow-load-calculator",
    keywords: [
      "snow load", "roof load", "ground snow", "snow accumulation",
      "drift", "sliding snow", "unbalanced snow", "rain on snow"
    ]
  },
  "accessibility-ramp": {
    tab: "design-tools",
    section: "accessibility-ramp-calculator",
    keywords: [
      "ramp", "wheelchair ramp", "accessible ramp", "ramp slope", "ramp gradient",
      "1:12 slope", "ramp landing", "ramp handrail", "curb ramp"
    ]
  },
  "thermal-resistance": {
    tab: "design-tools",
    section: "thermal-resistance-calculator",
    keywords: [
      "thermal resistance", "rsi", "r value", "r-value", "insulation",
      "thermal bridging", "effective r value", "nominal r value",
      "heat loss", "thermal envelope", "building envelope"
    ]
  },
  "ventilation-rate": {
    tab: "design-tools",
    section: "ventilation-rate-calculator",
    keywords: [
      "ventilation", "air change", "ach", "cfm", "fresh air", "exhaust",
      "makeup air", "hrv", "erv", "mechanical ventilation", "natural ventilation"
    ]
  },
  "stud-spacing": {
    tab: "design-tools",
    section: "stud-spacing-calculator",
    keywords: [
      "stud", "stud spacing", "wall framing", "16 on center", "24 on center",
      "stud wall", "load bearing wall", "partition wall"
    ]
  },
  "lintel-span": {
    tab: "design-tools",
    section: "lintel-span-calculator",
    keywords: [
      "lintel", "header", "window header", "door header", "lintel span",
      "opening support", "load bearing header"
    ]
  },
  "foundation-design": {
    tab: "design-tools",
    section: "foundation-design-calculator",
    keywords: [
      "foundation", "footing", "foundation wall", "basement wall",
      "frost depth", "frost line", "bearing capacity", "soil bearing",
      "strip footing", "pad footing", "slab on grade"
    ]
  },
  "lateral-load": {
    tab: "design-tools",
    section: "lateral-load-calculator",
    keywords: [
      "lateral load", "wind load", "seismic", "earthquake", "shear wall",
      "bracing", "lateral bracing", "wind pressure", "seismic zone"
    ]
  },
  "energy-code": {
    tab: "design-tools",
    section: "energy-code-calculator",
    keywords: [
      "energy code", "energy efficiency", "necb", "part 10", "tiered energy",
      "step code", "passive house", "net zero", "energy model"
    ]
  },

  // Structural Calculators
  "floor-joist": {
    tab: "building",
    section: "floor-joist-calculator",
    keywords: [
      "floor joist", "joist span", "joist spacing", "floor framing",
      "2x8", "2x10", "2x12", "i-joist", "tji", "engineered joist",
      "floor span table", "joist table"
    ]
  },
  "beam-span": {
    tab: "building",
    section: "beam-span-calculator",
    keywords: [
      "beam", "beam span", "girder", "header beam", "support beam",
      "lvl", "laminated veneer lumber", "glulam", "psl", "lsl",
      "built up beam", "flush beam", "drop beam"
    ]
  },
  "roof-rafter": {
    tab: "building",
    section: "roof-rafter-calculator",
    keywords: [
      "rafter", "roof rafter", "rafter span", "roof framing", "roof pitch",
      "ridge board", "collar tie", "ceiling joist", "roof truss"
    ]
  },
  "column-span": {
    tab: "building",
    section: "column-span-calculator",
    keywords: [
      "column", "post", "support column", "lally column", "steel column",
      "wood post", "column load", "axial load", "column sizing"
    ]
  },

  // Plumbing Calculators
  "water-closet": {
    tab: "plumbing",
    section: "plumbing-fixture-calculators",
    keywords: [
      "water closet", "wc", "toilet", "bathroom fixture", "washroom fixture",
      "fixture count", "plumbing fixtures", "restroom", "lavatory count"
    ]
  },
  "urinal": {
    tab: "plumbing",
    section: "plumbing-fixture-calculators",
    keywords: [
      "urinal", "urinal substitution", "male fixtures", "mens room"
    ]
  },
  "lavatory": {
    tab: "plumbing",
    section: "plumbing-fixture-calculators",
    keywords: [
      "lavatory", "sink", "wash basin", "hand wash", "hand washing"
    ]
  },
  "drinking-fountain": {
    tab: "plumbing",
    section: "plumbing-fixture-calculators",
    keywords: [
      "drinking fountain", "water fountain", "water cooler", "bottle filler"
    ]
  },
  "shower": {
    tab: "plumbing",
    section: "plumbing-fixture-calculators",
    keywords: [
      "shower", "bathtub", "tub", "bath", "shower stall", "shower room"
    ]
  },
  "service-sink": {
    tab: "plumbing",
    section: "plumbing-fixture-calculators",
    keywords: [
      "service sink", "mop sink", "janitor sink", "slop sink", "utility sink"
    ]
  },
  "fixture-unit": {
    tab: "plumbing",
    section: "fixture-unit-calculator",
    keywords: [
      "fixture unit", "dfu", "drainage fixture unit", "wfu", "water fixture unit",
      "pipe sizing", "drain sizing", "vent sizing"
    ]
  },
  "wet-venting": {
    tab: "plumbing",
    section: "wet-venting-diagram",
    keywords: [
      "wet vent", "wet venting", "combination waste and vent", "circuit vent",
      "loop vent", "stack vent", "vent stack"
    ]
  },
  "gas-line": {
    tab: "plumbing",
    section: "gas-line-calculator",
    keywords: [
      "gas line", "gas pipe", "gas sizing", "btu", "natural gas", "propane",
      "gas appliance", "gas meter", "gas pressure"
    ]
  },

  // Electrical Calculators
  "service-load": {
    tab: "electrical",
    section: "service-load-calculator",
    keywords: [
      "service load", "electrical load", "load calculation", "service size",
      "panel size", "amp service", "100 amp", "200 amp", "electrical service"
    ]
  },
  "voltage-drop": {
    tab: "electrical",
    section: "voltage-drop-calculator",
    keywords: [
      "voltage drop", "wire sizing", "conductor sizing", "circuit length",
      "3% voltage drop", "5% voltage drop"
    ]
  },
  "conduit-fill": {
    tab: "electrical",
    section: "conduit-fill-calculator",
    keywords: [
      "conduit fill", "conduit sizing", "wire fill", "raceway fill",
      "40% fill", "emt", "pvc conduit", "rigid conduit"
    ]
  },

  // Sustainability
  "solar-pv": {
    tab: "sustainability",
    section: "solar-pv-diagram",
    keywords: [
      "solar", "pv", "photovoltaic", "solar panel", "solar array",
      "net metering", "grid tie", "off grid", "solar roof"
    ]
  },
  "ev-charging": {
    tab: "sustainability",
    section: "ev-charging-diagram",
    keywords: [
      "ev charging", "electric vehicle", "ev ready", "level 2 charger",
      "charging station", "ev outlet", "nema 14-50"
    ]
  },
  "tankless-heater": {
    tab: "sustainability",
    section: "tankless-heater-diagram",
    keywords: [
      "tankless", "on demand", "instant hot water", "tankless water heater",
      "gas tankless", "electric tankless"
    ]
  },

  // Additions
  "deck": {
    tab: "additions",
    section: "deck-section",
    keywords: [
      "deck", "patio", "outdoor deck", "deck permit", "deck framing",
      "deck post", "deck beam", "deck joist", "deck railing"
    ]
  },
  "garage": {
    tab: "additions",
    section: "garage-section",
    keywords: [
      "garage", "carport", "attached garage", "detached garage",
      "garage conversion", "garage suite"
    ]
  },
  "basement-development": {
    tab: "additions",
    section: "basement-section",
    keywords: [
      "basement", "basement development", "basement finish", "basement renovation",
      "basement bedroom", "egress window", "window well"
    ]
  }
};

// ============================================
// NBC CODE SECTION KEYWORDS
// ============================================
export const codeKeywords: Record<string, { tab: string; keywords: string[] }> = {
  "part-3": {
    tab: "fire-safety",
    keywords: [
      "part 3", "part three", "fire protection", "occupant safety",
      "means of egress", "fire separations", "construction requirements"
    ]
  },
  "part-9": {
    tab: "building",
    keywords: [
      "part 9", "part nine", "housing", "small buildings", "residential construction",
      "houses", "row houses", "small buildings"
    ]
  },
  "part-10": {
    tab: "design-tools",
    keywords: [
      "part 10", "part ten", "energy efficiency", "thermal insulation",
      "air barrier", "vapour barrier"
    ]
  },
  "table-3.1.17.1": {
    tab: "building",
    keywords: [
      "table 3.1.17.1", "occupant load table", "load factor table",
      "area per person table"
    ]
  },
  "table-3.2.2": {
    tab: "fire-safety",
    keywords: [
      "table 3.2.2", "construction limits", "building height", "building area",
      "allowable area", "allowable height"
    ]
  },
  "table-3.7.2.2": {
    tab: "plumbing",
    keywords: [
      "table 3.7.2.2", "water closet table", "fixture table", "plumbing table"
    ]
  },
  "section-3.4": {
    tab: "fire-safety",
    keywords: [
      "section 3.4", "exits", "egress requirements", "exit requirements"
    ]
  },
  "section-3.8": {
    tab: "fire-safety",
    keywords: [
      "section 3.8", "barrier free", "accessibility requirements"
    ]
  },
  "section-9.8": {
    tab: "building",
    keywords: [
      "section 9.8", "stairs", "ramps", "handrails", "guards"
    ]
  },
  "section-9.23": {
    tab: "building",
    keywords: [
      "section 9.23", "wood frame", "floor framing", "wall framing", "roof framing"
    ]
  }
};

// ============================================
// GENERAL BUILDING TERMS
// ============================================
export const generalKeywords: Record<string, { tab: string; keywords: string[] }> = {
  "sprinkler": {
    tab: "fire-safety",
    keywords: [
      "sprinkler", "fire sprinkler", "sprinkler system", "nfpa 13", "nfpa 13r", "nfpa 13d",
      "wet sprinkler", "dry sprinkler", "residential sprinkler", "commercial sprinkler"
    ]
  },
  "standpipe": {
    tab: "fire-safety",
    keywords: [
      "standpipe", "fire hose", "fire department connection", "fdc", "siamese connection"
    ]
  },
  "hvac": {
    tab: "electrical",
    keywords: [
      "hvac", "heating", "cooling", "air conditioning", "furnace", "boiler",
      "heat pump", "ductwork", "duct", "diffuser", "return air"
    ]
  },
  "permit": {
    tab: "building",
    keywords: [
      "permit", "building permit", "development permit", "construction permit",
      "permit application", "permit fee", "permit requirements"
    ]
  },
  "inspection": {
    tab: "building",
    keywords: [
      "inspection", "building inspection", "code inspection", "final inspection",
      "rough in inspection", "framing inspection", "inspector", "safety codes officer"
    ]
  },
  "zoning": {
    tab: "building",
    keywords: [
      "zoning", "land use", "setback", "lot coverage", "building height limit",
      "zoning bylaw", "variance", "development permit"
    ]
  }
};

// ============================================
// COMBINED SEARCH FUNCTIONS
// ============================================

// Legacy export for backward compatibility
export const searchKeywords = occupancyKeywords;

// Get all matching occupancy IDs for a search query
export function getMatchingOccupancyIds(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  const matchingIds: string[] = [];

  for (const [occupancyId, keywords] of Object.entries(occupancyKeywords)) {
    for (const keyword of keywords) {
      if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
        if (!matchingIds.includes(occupancyId)) {
          matchingIds.push(occupancyId);
        }
        break;
      }
    }
  }

  return matchingIds;
}

// Search result type
export interface SearchResult {
  type: 'occupancy' | 'calculator' | 'code' | 'general';
  id: string;
  label: string;
  tab?: string;
  section?: string;
  keywords: string[];
}

// Get comprehensive search results across all categories
export function getComprehensiveSearchResults(query: string): SearchResult[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  // Search occupancy keywords
  for (const [occupancyId, keywords] of Object.entries(occupancyKeywords)) {
    for (const keyword of keywords) {
      if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
        const key = `occupancy-${occupancyId}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            type: 'occupancy',
            id: occupancyId,
            label: `Occupancy ${occupancyId}`,
            tab: 'building',
            keywords
          });
        }
        break;
      }
    }
  }

  // Search calculator keywords
  for (const [calcId, data] of Object.entries(calculatorKeywords)) {
    for (const keyword of data.keywords) {
      if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
        const key = `calculator-${calcId}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            type: 'calculator',
            id: calcId,
            label: keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            tab: data.tab,
            section: data.section,
            keywords: data.keywords
          });
        }
        break;
      }
    }
  }

  // Search code keywords
  for (const [codeId, data] of Object.entries(codeKeywords)) {
    for (const keyword of data.keywords) {
      if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
        const key = `code-${codeId}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            type: 'code',
            id: codeId,
            label: codeId.replace(/-/g, ' ').toUpperCase(),
            tab: data.tab,
            keywords: data.keywords
          });
        }
        break;
      }
    }
  }

  // Search general keywords
  for (const [termId, data] of Object.entries(generalKeywords)) {
    for (const keyword of data.keywords) {
      if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
        const key = `general-${termId}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            type: 'general',
            id: termId,
            label: termId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            tab: data.tab,
            keywords: data.keywords
          });
        }
        break;
      }
    }
  }

  return results;
}

// Get autocomplete suggestions based on partial input
export function getAutocompleteSuggestions(query: string, maxResults: number = 10): Array<{ keyword: string; type: string; tab?: string; section?: string }> {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const suggestions: Array<{ keyword: string; type: string; tab?: string; section?: string; priority: number }> = [];

  // Search all keyword sources
  const sources = [
    { data: occupancyKeywords, type: 'occupancy', tab: 'building', hasSection: false },
    { data: Object.fromEntries(Object.entries(calculatorKeywords).map(([k, v]) => [k, v.keywords])), type: 'calculator', tabMap: calculatorKeywords, hasSection: true },
    { data: Object.fromEntries(Object.entries(codeKeywords).map(([k, v]) => [k, v.keywords])), type: 'code', tabMap: codeKeywords, hasSection: false },
    { data: Object.fromEntries(Object.entries(generalKeywords).map(([k, v]) => [k, v.keywords])), type: 'general', tabMap: generalKeywords, hasSection: false }
  ];

  for (const source of sources) {
    for (const [id, keywords] of Object.entries(source.data)) {
      const keywordArray = Array.isArray(keywords) ? keywords : [];
      for (const keyword of keywordArray) {
        if (keyword.startsWith(lowerQuery)) {
          const tab = source.tabMap ? (source.tabMap as any)[id]?.tab : source.tab;
          const section = source.hasSection && source.tabMap ? (source.tabMap as any)[id]?.section : undefined;
          suggestions.push({ keyword, type: source.type, tab, section, priority: 1 });
        } else if (keyword.includes(lowerQuery)) {
          const tab = source.tabMap ? (source.tabMap as any)[id]?.tab : source.tab;
          const section = source.hasSection && source.tabMap ? (source.tabMap as any)[id]?.section : undefined;
          suggestions.push({ keyword, type: source.type, tab, section, priority: 2 });
        }
      }
    }
  }

  // Sort by priority (prefix matches first) then alphabetically
  return suggestions
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.keyword.localeCompare(b.keyword);
    })
    .slice(0, maxResults)
    .map(({ keyword, type, tab, section }) => ({ keyword, type, tab, section }));
}

// Get "Did you mean?" suggestions when no results found
export function getDidYouMeanSuggestions(query: string, maxResults: number = 5): string[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const suggestions: Array<{ keyword: string; score: number }> = [];

  // Simple Levenshtein-like similarity scoring
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    
    // Check for substring match
    if (str2.includes(str1) || str1.includes(str2)) {
      return 0.8;
    }
    
    // Check for common prefix
    let commonPrefix = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (str1[i] === str2[i]) commonPrefix++;
      else break;
    }
    
    // Check for common characters
    let commonChars = 0;
    const str2Chars = str2.split('');
    for (const char of str1) {
      const idx = str2Chars.indexOf(char);
      if (idx !== -1) {
        commonChars++;
        str2Chars.splice(idx, 1);
      }
    }
    
    const prefixScore = commonPrefix / Math.max(len1, len2);
    const charScore = commonChars / Math.max(len1, len2);
    
    return (prefixScore * 0.6) + (charScore * 0.4);
  };

  // Collect all keywords from all sources
  const allKeywords: string[] = [];
  for (const keywords of Object.values(occupancyKeywords)) {
    allKeywords.push(...keywords);
  }
  for (const data of Object.values(calculatorKeywords)) {
    allKeywords.push(...data.keywords);
  }
  for (const data of Object.values(codeKeywords)) {
    allKeywords.push(...data.keywords);
  }
  for (const data of Object.values(generalKeywords)) {
    allKeywords.push(...data.keywords);
  }

  // Remove duplicates
  const uniqueKeywords = Array.from(new Set(allKeywords));

  for (const keyword of uniqueKeywords) {
    const score = calculateSimilarity(lowerQuery, keyword);
    if (score > 0.3) {
      suggestions.push({ keyword, score });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.keyword);
}

// Get all unique keywords for display
export function getAllKeywords(): string[] {
  const allKeywords: Set<string> = new Set();
  
  for (const keywords of Object.values(occupancyKeywords)) {
    for (const keyword of keywords) {
      allKeywords.add(keyword);
    }
  }
  for (const data of Object.values(calculatorKeywords)) {
    for (const keyword of data.keywords) {
      allKeywords.add(keyword);
    }
  }
  for (const data of Object.values(codeKeywords)) {
    for (const keyword of data.keywords) {
      allKeywords.add(keyword);
    }
  }
  for (const data of Object.values(generalKeywords)) {
    for (const keyword of data.keywords) {
      allKeywords.add(keyword);
    }
  }
  
  return Array.from(allKeywords).sort();
}

// Get tab navigation target for a keyword
export function getTabForKeyword(keyword: string): string | null {
  const lowerKeyword = keyword.toLowerCase();
  
  // Check calculator keywords
  for (const data of Object.values(calculatorKeywords)) {
    if (data.keywords.some(k => k.includes(lowerKeyword) || lowerKeyword.includes(k))) {
      return data.tab;
    }
  }
  
  // Check code keywords
  for (const data of Object.values(codeKeywords)) {
    if (data.keywords.some(k => k.includes(lowerKeyword) || lowerKeyword.includes(k))) {
      return data.tab;
    }
  }
  
  // Check general keywords
  for (const data of Object.values(generalKeywords)) {
    if (data.keywords.some(k => k.includes(lowerKeyword) || lowerKeyword.includes(k))) {
      return data.tab;
    }
  }
  
  return null;
}
