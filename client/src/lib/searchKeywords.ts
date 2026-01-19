// Natural language search keywords for occupancy types
// Maps common terms, synonyms, and natural language phrases to occupancy IDs

export const searchKeywords: Record<string, string[]> = {
  // A-1: Assembly - Performing Arts
  "A-1": [
    "theatre", "theater", "movie", "cinema", "film", "opera", "concert hall", "performance",
    "stage", "auditorium", "playhouse", "performing arts", "tv studio", "television studio",
    "live show", "entertainment venue", "show", "play", "musical", "drama"
  ],
  
  // A-2: Assembly - General
  "A-2": [
    "art gallery", "museum", "bowling", "club", "community hall", "community center",
    "courtroom", "court", "dance hall", "dancing", "daycare", "child care", "childcare",
    "exhibition", "gym", "gymnasium", "fitness center", "lecture hall", "library",
    "bar", "pub", "tavern", "nightclub", "lounge", "restaurant", "cafe", "cafeteria",
    "dining", "eatery", "food service", "church", "mosque", "temple", "synagogue",
    "chapel", "place of worship", "religious", "school", "college", "university",
    "classroom", "education", "learning", "train station", "bus station", "terminal",
    "passenger station", "transit", "wedding venue", "banquet hall", "reception hall",
    "meeting room", "conference room", "seminar", "workshop space"
  ],
  
  // A-3: Assembly - Arena Type
  "A-3": [
    "arena", "stadium", "sports venue", "hockey rink", "ice rink", "skating rink",
    "swimming pool", "pool", "aquatic center", "natatorium", "indoor sports",
    "basketball court", "volleyball", "tennis court", "indoor tennis", "field house",
    "recreation center", "rec center", "sports complex"
  ],
  
  // A-4: Assembly - Open Air
  "A-4": [
    "amusement park", "theme park", "carnival", "fair", "fairground", "bleachers",
    "grandstand", "outdoor seating", "outdoor venue", "open air", "race track",
    "racetrack", "outdoor stadium", "amphitheatre", "amphitheater", "outdoor concert",
    "festival grounds", "rodeo", "outdoor sports"
  ],
  
  // B-1: Detention - Restrained
  "B-1": [
    "prison", "jail", "penitentiary", "correctional", "detention center", "detention",
    "inmates", "incarceration", "lockup", "holding cell", "maximum security",
    "medium security", "correctional facility", "reformatory"
  ],
  
  // B-2: Detention - Treatment/Care
  "B-2": [
    "hospital", "medical", "healthcare", "health care", "clinic", "infirmary",
    "nursing home", "care home", "long term care", "ltc", "assisted living",
    "rehabilitation", "rehab", "mental health", "psychiatric", "treatment center",
    "medical center", "hospice", "palliative care", "emergency room", "er",
    "surgery center", "outpatient", "inpatient", "patient care", "medical facility",
    "children's hospital", "pediatric", "maternity", "birthing center"
  ],
  
  // C-1: Residential - Single Family
  "C-1": [
    "house", "home", "single family", "single-family", "detached", "dwelling",
    "residence", "residential", "duplex", "semi-detached", "townhouse", "townhome",
    "row house", "rowhouse", "triplex", "fourplex", "living quarters", "housing"
  ],
  
  // C-2: Residential - Secondary Suite
  "C-2": [
    "secondary suite", "basement suite", "in-law suite", "granny suite", "garden suite",
    "accessory dwelling", "adu", "laneway house", "carriage house", "coach house",
    "rental suite", "apartment in house", "basement apartment", "secondary dwelling"
  ],
  
  // C-3: Residential - Multi-Unit
  "C-3": [
    "apartment", "condo", "condominium", "multi-family", "multifamily", "multi-unit",
    "residential building", "apartment building", "high rise", "highrise", "mid rise",
    "low rise", "rental building", "strata", "flat", "unit", "suite", "residential complex"
  ],
  
  // C-4: Residential - Hotel/Motel
  "C-4": [
    "hotel", "motel", "inn", "lodge", "resort", "hostel", "bed and breakfast", "b&b",
    "bnb", "guest house", "boarding house", "rooming house", "dormitory", "dorm",
    "student housing", "transient", "temporary accommodation", "vacation rental",
    "airbnb", "short term rental"
  ],
  
  // D: Business and Personal Services
  "D": [
    "office", "business", "professional", "commercial", "corporate", "headquarters",
    "bank", "financial", "insurance", "real estate", "law office", "legal",
    "accounting", "dental", "dentist", "medical office", "doctor's office", "clinic",
    "optometrist", "chiropractor", "physiotherapy", "massage", "spa", "salon",
    "barber", "hair salon", "beauty salon", "nail salon", "tattoo", "personal services",
    "consulting", "co-working", "coworking", "shared office", "call center",
    "tech office", "startup", "agency", "studio"
  ],
  
  // E: Mercantile
  "E": [
    "store", "shop", "retail", "shopping", "mall", "shopping center", "plaza",
    "supermarket", "grocery", "convenience store", "department store", "boutique",
    "showroom", "market", "farmers market", "pharmacy", "drugstore", "hardware store",
    "clothing store", "furniture store", "electronics store", "appliance store",
    "liquor store", "cannabis store", "dispensary", "pet store", "toy store",
    "bookstore", "gift shop", "jewelry store", "sporting goods", "auto parts",
    "big box", "warehouse store", "outlet", "thrift store", "consignment"
  ],
  
  // F-1: Industrial - High Hazard
  "F-1": [
    "factory", "manufacturing", "industrial", "high hazard", "hazardous", "chemical",
    "flammable", "combustible", "explosive", "paint", "solvent", "petroleum",
    "refinery", "distillery", "brewery", "winery", "processing plant", "heavy industry",
    "metalworking", "foundry", "smelting", "welding shop", "auto body", "spray booth"
  ],
  
  // F-2: Industrial - Medium Hazard
  "F-2": [
    "workshop", "light industrial", "medium hazard", "assembly plant", "fabrication",
    "woodworking", "carpentry", "cabinet shop", "machine shop", "printing",
    "bakery", "food processing", "meat processing", "dairy", "bottling plant",
    "packaging", "textile", "garment", "laundry", "dry cleaning", "repair shop",
    "service garage", "auto repair", "mechanic", "warehouse", "distribution center",
    "logistics", "fulfillment center", "cold storage", "freezer", "refrigerated"
  ],
  
  // F-3: Industrial - Low Hazard
  "F-3": [
    "storage", "low hazard", "self storage", "mini storage", "warehouse",
    "parking garage", "parkade", "parking structure", "aircraft hangar", "hangar",
    "boat storage", "rv storage", "vehicle storage", "equipment storage",
    "archive", "records storage", "data center", "server room"
  ]
};

// Natural language phrase mappings for common questions
export const naturalLanguageMappings: Record<string, string[]> = {
  // Questions about building types
  "where can i open a restaurant": ["A-2"],
  "what code for restaurant": ["A-2"],
  "restaurant building code": ["A-2"],
  "opening a bar": ["A-2"],
  "starting a gym": ["A-2", "A-3"],
  "fitness center requirements": ["A-2", "A-3"],
  "church building requirements": ["A-2"],
  "daycare requirements": ["A-2"],
  "childcare facility": ["A-2"],
  "school building code": ["A-2"],
  "hospital requirements": ["B-2"],
  "medical clinic code": ["B-2", "D"],
  "nursing home requirements": ["B-2"],
  "building a house": ["C-1"],
  "residential construction": ["C-1", "C-3"],
  "basement suite": ["C-2"],
  "secondary suite requirements": ["C-2"],
  "apartment building": ["C-3"],
  "condo requirements": ["C-3"],
  "hotel requirements": ["C-4"],
  "office building": ["D"],
  "retail store": ["E"],
  "opening a shop": ["E"],
  "factory requirements": ["F-1", "F-2"],
  "warehouse code": ["F-2", "F-3"],
  "storage facility": ["F-3"],
  
  // Common abbreviations
  "ltc": ["B-2"],
  "adu": ["C-2"],
  "sfh": ["C-1"],
  "mfh": ["C-3"]
};

// Function to get matching occupancy IDs from a search query
export function getMatchingOccupancyIds(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  const matchedIds = new Set<string>();
  
  // Check direct keyword matches
  for (const [occupancyId, keywords] of Object.entries(searchKeywords)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword) || keyword.includes(lowerQuery)) {
        matchedIds.add(occupancyId);
      }
    }
  }
  
  // Check natural language phrase matches
  for (const [phrase, ids] of Object.entries(naturalLanguageMappings)) {
    if (lowerQuery.includes(phrase) || phrase.includes(lowerQuery)) {
      ids.forEach(id => matchedIds.add(id));
    }
  }
  
  return Array.from(matchedIds);
}
