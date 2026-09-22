// Load Calculation Factors by Occupancy Type
// Based on NBC 2020 Table 4.1.5.3 - Minimum Live Loads

export interface LoadFactor {
  occupancyCode: string;
  liveLoad: string; // kPa
  liveLoadDescription: string;
  deadLoad: string; // Typical dead load
  snowLoad?: string; // For roof calculations
  notes: string[];
}

export const loadCalculationFactors: Record<string, LoadFactor> = {
  'A-1': {
    occupancyCode: 'A-1',
    liveLoad: '4.8 kPa',
    liveLoadDescription: 'Assembly areas with fixed seats',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Fixed seating areas: 4.8 kPa',
      'Lobbies and corridors: 4.8 kPa',
      'Stages: 4.8 kPa',
      'Roof snow load varies by location (consult NBC climatic data)'
    ]
  },
  'A-2': {
    occupancyCode: 'A-2',
    liveLoad: '4.8 kPa',
    liveLoadDescription: 'Assembly areas without fixed seats',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Assembly areas without fixed seats: 4.8 kPa',
      'Lobbies and corridors: 4.8 kPa',
      'Stages and platforms: 4.8 kPa',
      'Dance floors and gymnasiums: 4.8 kPa'
    ]
  },
  'A-3': {
    occupancyCode: 'A-3',
    liveLoad: '4.8 kPa',
    liveLoadDescription: 'Arena-type assembly',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Arena seating and floor areas: 4.8 kPa',
      'Ice rink floor (without ice): 4.8 kPa',
      'Pool deck areas: 4.8 kPa',
      'Mechanical equipment areas: As per equipment load'
    ]
  },
  'A-4': {
    occupancyCode: 'A-4',
    liveLoad: '4.8 kPa',
    liveLoadDescription: 'Open-air assembly',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Bleachers and grandstands: 4.8 kPa',
      'Amusement park structures: Design-specific loads',
      'Outdoor stages: 4.8 kPa + wind and snow loads'
    ]
  },
  'B-1': {
    occupancyCode: 'B-1',
    liveLoad: '2.4 kPa',
    liveLoadDescription: 'Institutional - Detention',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Cell blocks and sleeping areas: 2.4 kPa',
      'Corridors and common areas: 4.8 kPa',
      'Exercise areas: 4.8 kPa',
      'Kitchen and dining: 4.8 kPa'
    ]
  },
  'B-2': {
    occupancyCode: 'B-2',
    liveLoad: '2.4 kPa',
    liveLoadDescription: 'Institutional - Treatment and care',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Patient rooms: 2.4 kPa',
      'Operating rooms: 2.4 kPa',
      'Corridors: 4.8 kPa',
      'Laboratories: 2.4 kPa',
      'X-ray and diagnostic rooms: 2.4 kPa + equipment loads'
    ]
  },
  'B-3': {
    occupancyCode: 'B-3',
    liveLoad: '2.4 kPa',
    liveLoadDescription: 'Institutional - Care without treatment',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Resident rooms: 2.4 kPa',
      'Dining and common areas: 4.8 kPa',
      'Corridors: 4.8 kPa',
      'Activity rooms: 4.8 kPa'
    ]
  },
  'C': {
    occupancyCode: 'C',
    liveLoad: '1.9 kPa',
    liveLoadDescription: 'Residential occupancy',
    deadLoad: '0.5 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Dwelling units (floors): 1.9 kPa',
      'Balconies and decks: 1.9 kPa',
      'Corridors and lobbies: 4.8 kPa',
      'Attic with storage: 1.0 kPa',
      'Attic without storage: 0.5 kPa',
      'Garage floors: 2.4 kPa (light vehicles)'
    ]
  },
  'C-2': {
    occupancyCode: 'C (Secondary Suite)',
    liveLoad: '1.9 kPa',
    liveLoadDescription: 'Secondary suite',
    deadLoad: '0.5 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Suite floors: 1.9 kPa',
      'Separate entrance and corridors: 4.8 kPa',
      'Basement suite floors: 1.9 kPa',
      'Mechanical room: Equipment loads + 1.0 kPa'
    ]
  },
  'D': {
    occupancyCode: 'D',
    liveLoad: '2.4 kPa',
    liveLoadDescription: 'Business and personal services',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Office areas: 2.4 kPa',
      'Corridors and lobbies: 4.8 kPa',
      'Banking halls: 4.8 kPa',
      'Computer server rooms: 4.8 kPa + equipment loads',
      'File rooms with mobile shelving: 6.0 kPa or calculated load'
    ]
  },
  'E': {
    occupancyCode: 'E',
    liveLoad: '4.8 kPa',
    liveLoadDescription: 'Mercantile',
    deadLoad: '0.5-1.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Retail sales areas: 4.8 kPa',
      'Storage areas: 4.8 kPa minimum (or calculated)',
      'Mezzanines: 4.8 kPa',
      'Loading docks: 6.0 kPa',
      'Heavy storage: Calculate based on actual loads'
    ]
  },
  'F-1': {
    occupancyCode: 'F-1',
    liveLoad: '6.0 kPa',
    liveLoadDescription: 'Industrial - High hazard',
    deadLoad: '1.0-2.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Manufacturing areas: 6.0 kPa minimum',
      'Storage areas: Calculate based on actual loads',
      'Heavy machinery areas: Equipment loads + 6.0 kPa',
      'Catwalks and platforms: 2.4 kPa',
      'Consult structural engineer for specific processes'
    ]
  },
  'F-2': {
    occupancyCode: 'F-2',
    liveLoad: '6.0 kPa',
    liveLoadDescription: 'Industrial - Medium hazard',
    deadLoad: '1.0-2.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Manufacturing and assembly areas: 6.0 kPa minimum',
      'Warehouse storage: Calculate based on rack loads',
      'Aircraft hangars: 2.4 kPa floor + concentrated loads',
      'Repair shops: 6.0 kPa',
      'Mezzanines: 6.0 kPa'
    ]
  },
  'F-3': {
    occupancyCode: 'F-3',
    liveLoad: '6.0 kPa',
    liveLoadDescription: 'Industrial - Low hazard',
    deadLoad: '1.0-2.0 kPa (typical)',
    snowLoad: '2.0 kPa (Calgary/Edmonton)',
    notes: [
      'Light manufacturing: 6.0 kPa',
      'Power plants: Equipment loads + 6.0 kPa',
      'Creameries and food processing: 6.0 kPa',
      'Printing plants: 6.0 kPa + press loads',
      'Laundries: 6.0 kPa + equipment loads'
    ]
  }
};

// Helper function to get load factors by occupancy code
export function getLoadFactors(occupancyCode: string): LoadFactor | undefined {
  // Handle secondary suite special case
  if (occupancyCode.includes('Secondary Suite')) {
    return loadCalculationFactors['C-2'];
  }
  
  // Get base occupancy code (e.g., "A-1" from "A-1 DIVISION 1")
  const baseCode = occupancyCode.split(' ')[0];
  return loadCalculationFactors[baseCode];
}
