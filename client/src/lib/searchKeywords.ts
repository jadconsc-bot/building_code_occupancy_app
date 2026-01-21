// Comprehensive natural language search keywords for occupancy types
// Maps common terms, synonyms, and related words to occupancy IDs

export const searchKeywords: Record<string, string[]> = {
  // A-1: Assembly - Performing Arts
  "A-1": [
    "theatre", "theater", "cinema", "movie", "film", "opera", "concert", "performance",
    "stage", "auditorium", "playhouse", "amphitheatre", "amphitheater", "tv studio",
    "television studio", "broadcast studio", "performing arts", "live show", "entertainment venue"
  ],

  // A-2: Assembly - General
  "A-2": [
    "church", "mosque", "temple", "synagogue", "chapel", "worship", "religious",
    "gym", "gymnasium", "fitness center", "fitness centre", "workout", "exercise",
    "bar", "pub", "tavern", "nightclub", "lounge", "club", "drinking establishment",
    "restaurant", "cafe", "cafeteria", "diner", "eatery", "food service", "dining",
    "school", "college", "university", "classroom", "lecture hall", "education",
    "library", "reading room", "study hall",
    "museum", "gallery", "art gallery", "exhibition", "exhibit hall",
    "community hall", "community center", "community centre", "meeting hall",
    "courtroom", "court", "tribunal", "legal",
    "dance hall", "ballroom", "dance studio",
    "daycare", "day care", "childcare", "child care", "nursery", "preschool",
    "bowling alley", "bowling", "recreation",
    "passenger station", "bus station", "train station", "transit terminal"
  ],

  // A-3: Assembly - Arena Type
  "A-3": [
    "arena", "stadium", "sports arena", "hockey rink", "ice rink", "skating rink",
    "swimming pool", "pool", "aquatic center", "aquatic centre", "natatorium",
    "sports complex", "fieldhouse", "field house", "indoor sports"
  ],

  // A-4: Assembly - Open Air
  "A-4": [
    "bleachers", "grandstand", "outdoor stadium", "outdoor arena", "open air",
    "amusement park", "theme park", "fairground", "fair grounds", "carnival",
    "outdoor venue", "outdoor seating", "reviewing stand"
  ],

  // B-1: Institutional - Detention
  "B-1": [
    "jail", "prison", "penitentiary", "correctional", "detention center", "detention centre",
    "lockup", "holding cell", "reformatory", "psychiatric detention", "secure facility",
    "police station detention", "custody"
  ],

  // B-2: Institutional - Treatment
  "B-2": [
    "hospital", "medical center", "medical centre", "healthcare", "health care",
    "emergency room", "er", "icu", "intensive care", "surgery center", "surgical",
    "infirmary", "clinic", "medical clinic", "treatment facility", "treatment center",
    "nursing home", "long term care", "ltc", "rehabilitation", "rehab"
  ],

  // B-3: Institutional - Care
  "B-3": [
    "assisted living", "senior living", "seniors home", "seniors residence",
    "care home", "care facility", "group home", "hospice", "palliative",
    "retirement home", "retirement residence", "elderly care", "aged care",
    "custodial home", "childrens home", "children's home"
  ],

  // C-1: Residential - General
  "C-1": [
    "apartment", "condo", "condominium", "flat", "unit", "suite",
    "house", "home", "residence", "dwelling", "single family", "single-family",
    "townhouse", "town house", "row house", "rowhouse", "duplex", "triplex", "fourplex",
    "hotel", "motel", "inn", "lodge", "hostel", "bed and breakfast", "b&b", "bnb",
    "dormitory", "dorm", "residence hall", "student housing",
    "boarding house", "rooming house", "lodging",
    "monastery", "convent", "religious residence"
  ],

  // C-2: Residential - Secondary Suite
  "C-2": [
    "basement suite", "basement apartment", "basement unit",
    "secondary suite", "accessory dwelling", "adu", "granny flat", "granny suite",
    "in-law suite", "inlaw suite", "mother-in-law suite",
    "garden suite", "laneway house", "laneway home", "coach house",
    "garage suite", "garage apartment", "carriage house",
    "legal suite", "rental suite", "rental unit"
  ],

  // D: Business & Personal Services
  "D": [
    "office", "office building", "corporate", "business", "professional",
    "bank", "financial", "credit union",
    "medical office", "doctor office", "doctors office", "physician", "dental office", "dentist",
    "salon", "beauty parlor", "beauty parlour", "barber", "spa", "nail salon",
    "police station", "fire station", "government office", "municipal",
    "radio station", "recording studio"
  ],

  // E: Mercantile
  "E": [
    "store", "shop", "retail", "shopping", "mall", "shopping center", "shopping centre",
    "supermarket", "grocery", "grocery store", "food store",
    "department store", "big box", "warehouse store",
    "market", "farmers market", "flea market",
    "boutique", "showroom", "outlet"
  ],

  // F-1: Industrial - High Hazard
  "F-1": [
    "chemical plant", "chemical factory", "chemical manufacturing",
    "paint factory", "spray painting", "paint shop",
    "distillery", "brewery", "winery",
    "grain elevator", "grain storage",
    "flammable", "explosive", "hazardous materials", "hazmat",
    "bulk plant", "fuel storage", "petroleum"
  ],

  // F-2: Industrial - Medium Hazard
  "F-2": [
    "factory", "manufacturing", "plant", "industrial",
    "warehouse", "distribution center", "distribution centre", "fulfillment center",
    "aircraft hangar", "hangar", "aviation",
    "auto shop", "repair garage", "mechanic", "automotive",
    "service station", "gas station", "filling station",
    "laboratory", "lab", "research facility",
    "woodworking", "millwork", "cabinet shop", "furniture factory"
  ],

  // F-3: Industrial - Low Hazard
  "F-3": [
    "storage garage", "parking garage", "parkade",
    "power plant", "power station", "utility",
    "creamery", "dairy", "food processing",
    "cold storage", "refrigerated warehouse",
    "low hazard storage", "non-combustible storage"
  ]
};

// Get all matching occupancy IDs for a search query
export function getMatchingOccupancyIds(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  const matchingIds: string[] = [];

  for (const [occupancyId, keywords] of Object.entries(searchKeywords)) {
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

// Get autocomplete suggestions based on partial input
export function getAutocompleteSuggestions(query: string, maxResults: number = 8): string[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const suggestions: Set<string> = new Set();

  for (const keywords of Object.values(searchKeywords)) {
    for (const keyword of keywords) {
      if (keyword.startsWith(lowerQuery) || keyword.includes(lowerQuery)) {
        suggestions.add(keyword);
        if (suggestions.size >= maxResults) break;
      }
    }
    if (suggestions.size >= maxResults) break;
  }

  return Array.from(suggestions).sort((a, b) => {
    // Prioritize exact prefix matches
    const aStarts = a.startsWith(lowerQuery);
    const bStarts = b.startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.length - b.length;
  });
}

// Get "Did you mean?" suggestions when no results found
export function getDidYouMeanSuggestions(query: string, maxResults: number = 3): string[] {
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

  for (const keywords of Object.values(searchKeywords)) {
    for (const keyword of keywords) {
      const score = calculateSimilarity(lowerQuery, keyword);
      if (score > 0.3) {
        suggestions.push({ keyword, score });
      }
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
  for (const keywords of Object.values(searchKeywords)) {
    for (const keyword of keywords) {
      allKeywords.add(keyword);
    }
  }
  return Array.from(allKeywords).sort();
}
