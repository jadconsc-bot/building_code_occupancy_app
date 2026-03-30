// NBC Table 3.1.17.1 - Occupant Load
// Extracted from OccupantLoadFactors.tsx for testability (no JSX dependency)

export interface OccupantLoadFactor {
  id: string;
  useType: string;
  areaPerPerson: number | null; // m² per person, null if determined by clause
  clause?: string; // Reference clause if not a fixed value
  category: string;
  occupancyGroups: string[]; // Which occupancy classifications this applies to
  notes?: string;
}

export const occupantLoadFactors: OccupantLoadFactor[] = [
  // Assembly Uses (Group A)
  {
    id: "assembly-standing",
    useType: "Standing space",
    areaPerPerson: 0.40,
    category: "Assembly Uses",
    occupancyGroups: ["A-1", "A-2", "A-3", "A-4"],
    notes: "Areas where occupants are standing"
  },
  {
    id: "assembly-non-fixed",
    useType: "Space with non-fixed seats",
    areaPerPerson: 0.75,
    category: "Assembly Uses",
    occupancyGroups: ["A-1", "A-2", "A-3", "A-4"],
    notes: "Seating not permanently attached"
  },
  {
    id: "assembly-fixed-seats",
    useType: "Space with fixed seats",
    areaPerPerson: null,
    clause: "Number of fixed seats",
    category: "Assembly Uses",
    occupancyGroups: ["A-1", "A-2", "A-3", "A-4"],
    notes: "Count actual seats"
  },
  {
    id: "assembly-stages",
    useType: "Stages for theatrical performances",
    areaPerPerson: 0.75,
    category: "Assembly Uses",
    occupancyGroups: ["A-1"],
    notes: "Performance areas"
  },
  {
    id: "assembly-dining",
    useType: "Dining, alcoholic beverage and cafeteria space",
    areaPerPerson: 1.10,
    category: "Assembly Uses",
    occupancyGroups: ["A-2"],
    notes: "Restaurants, bars, cafeterias"
  },
  {
    id: "assembly-exhibition",
    useType: "Exhibition halls (other than those used for trade shows)",
    areaPerPerson: 3.00,
    category: "Assembly Uses",
    occupancyGroups: ["A-2", "A-3"],
    notes: "Museums, galleries"
  },
  {
    id: "assembly-trade-shows",
    useType: "Exhibition halls used for trade shows",
    areaPerPerson: 2.80,
    category: "Assembly Uses",
    occupancyGroups: ["A-2", "A-3"],
    notes: "Trade show floor space"
  },
  {
    id: "assembly-gaming",
    useType: "Gaming premises",
    areaPerPerson: 1.85,
    category: "Assembly Uses",
    occupancyGroups: ["A-2"],
    notes: "Casinos, gaming floors"
  },
  {
    id: "assembly-classrooms",
    useType: "Classrooms",
    areaPerPerson: 1.85,
    category: "Assembly Uses",
    occupancyGroups: ["A-2"],
    notes: "Educational spaces"
  },
  {
    id: "assembly-reading",
    useType: "Reading or writing rooms, lounges",
    areaPerPerson: 1.85,
    category: "Assembly Uses",
    occupancyGroups: ["A-2"],
    notes: "Libraries, study areas"
  },
  {
    id: "assembly-skating",
    useType: "Skating rinks, swimming pools",
    areaPerPerson: 4.60,
    category: "Assembly Uses",
    occupancyGroups: ["A-3"],
    notes: "Ice surface or pool deck area"
  },
  {
    id: "assembly-exercise",
    useType: "Exercise rooms",
    areaPerPerson: 9.30,
    category: "Assembly Uses",
    occupancyGroups: ["A-2", "A-3"],
    notes: "Gyms, fitness centers"
  },

  // Care, Treatment and Detention (Group B)
  {
    id: "care-b1-detention",
    useType: "B-1: Detention quarters",
    areaPerPerson: 11.60,
    category: "Care, Treatment & Detention",
    occupancyGroups: ["B-1"],
    notes: "Prisons, jails, detention centers"
  },
  {
    id: "care-b2-treatment",
    useType: "B-2: Treatment and sleeping room areas",
    areaPerPerson: 10.00,
    category: "Care, Treatment & Detention",
    occupancyGroups: ["B-2"],
    notes: "Hospitals, nursing homes"
  },
  {
    id: "care-b3-care",
    useType: "B-3: Care occupancy sleeping areas",
    areaPerPerson: 10.00,
    category: "Care, Treatment & Detention",
    occupancyGroups: ["B-3"],
    notes: "Group homes, assisted living"
  },

  // Residential (Group C)
  {
    id: "residential-dwelling",
    useType: "Dwelling units",
    areaPerPerson: null,
    clause: "2 persons per sleeping room",
    category: "Residential Uses",
    occupancyGroups: ["C"],
    notes: "Houses, apartments, condos"
  },
  {
    id: "residential-dormitories",
    useType: "Dormitories",
    areaPerPerson: 4.60,
    category: "Residential Uses",
    occupancyGroups: ["C"],
    notes: "Student housing, barracks"
  },

  // Business and Personal Services (Group D)
  {
    id: "business-offices",
    useType: "Offices",
    areaPerPerson: 9.30,
    category: "Business & Personal Services",
    occupancyGroups: ["D"],
    notes: "General office space"
  },

  // Mercantile (Group E)
  {
    id: "mercantile-basement",
    useType: "Basements and first storeys",
    areaPerPerson: 3.70,
    category: "Mercantile Uses",
    occupancyGroups: ["E"],
    notes: "Retail sales floors"
  },
  {
    id: "mercantile-upper",
    useType: "Second storeys and above",
    areaPerPerson: 5.60,
    category: "Mercantile Uses",
    occupancyGroups: ["E"],
    notes: "Upper floor retail"
  },

  // Industrial (Group F)
  {
    id: "industrial-manufacturing",
    useType: "Manufacturing or process rooms",
    areaPerPerson: 4.60,
    category: "Industrial Uses",
    occupancyGroups: ["F-1", "F-2", "F-3"],
    notes: "Factory floors"
  },
  {
    id: "industrial-storage",
    useType: "Storage garages",
    areaPerPerson: 46.00,
    category: "Industrial Uses",
    occupancyGroups: ["F-2", "F-3"],
    notes: "Parking structures"
  },
  {
    id: "industrial-warehouse",
    useType: "Warehouses",
    areaPerPerson: 46.00,
    category: "Industrial Uses",
    occupancyGroups: ["F-2", "F-3"],
    notes: "Storage facilities"
  },

  // Other Uses
  {
    id: "other-kitchens",
    useType: "Kitchens",
    areaPerPerson: 9.30,
    category: "Other Uses",
    occupancyGroups: ["A-2", "B-2", "C", "D", "E", "F-1"],
    notes: "Commercial kitchens"
  },
  {
    id: "other-laboratories",
    useType: "Laboratories",
    areaPerPerson: 4.60,
    category: "Other Uses",
    occupancyGroups: ["A-2", "B-2", "D", "F-1"],
    notes: "Research and testing labs"
  },
  {
    id: "other-library-stacks",
    useType: "Library stack areas",
    areaPerPerson: 9.30,
    category: "Other Uses",
    occupancyGroups: ["A-2"],
    notes: "Book storage areas"
  },
  {
    id: "other-mechanical",
    useType: "Mechanical equipment rooms",
    areaPerPerson: 46.00,
    category: "Other Uses",
    occupancyGroups: ["A-1", "A-2", "A-3", "A-4", "B-1", "B-2", "B-3", "C", "D", "E", "F-1", "F-2", "F-3"],
    notes: "HVAC, electrical rooms"
  }
];

// Helper function to get load factors for a specific occupancy
export function getLoadFactorsForOccupancy(occupancyCode: string): OccupantLoadFactor[] {
  const normalizedCode = occupancyCode.toUpperCase().split(' ')[0].split('(')[0].trim();
  
  return occupantLoadFactors.filter(factor => 
    factor.occupancyGroups.some(group => {
      const normalizedGroup = group.toUpperCase();
      return normalizedGroup === normalizedCode || 
             normalizedCode.startsWith(normalizedGroup) ||
             normalizedGroup.startsWith(normalizedCode.split('-')[0]);
    })
  );
}

// Helper function to calculate occupant load
export function calculateOccupantLoad(floorArea: number, areaPerPerson: number): number {
  if (floorArea <= 0 || areaPerPerson <= 0) return 0;
  return Math.ceil(floorArea / areaPerPerson);
}
