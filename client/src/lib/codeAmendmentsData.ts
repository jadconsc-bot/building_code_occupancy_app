// NBC 2019 vs NBC 2023 Code Amendments
// Key changes affecting building design and compliance

export interface CodeAmendment {
  id: string;
  section: string;
  category: 'Fire Safety' | 'Structural' | 'Accessibility' | 'Energy' | 'Plumbing' | 'Electrical' | 'General';
  title: string;
  nbc2019: string;
  nbc2023: string;
  impact: 'High' | 'Medium' | 'Low';
  occupancies: string[]; // Which occupancy groups are affected
  description: string;
}

export const codeAmendments: CodeAmendment[] = [
  {
    id: 'fire-01',
    section: '3.2.2',
    category: 'Fire Safety',
    title: 'Combustible Construction Height Increase',
    nbc2019: 'Max 4 storeys for combustible construction',
    nbc2023: 'Max 6 storeys for combustible construction (with specific provisions)',
    impact: 'High',
    occupancies: ['C', 'D'],
    description: 'Allows taller wood-frame buildings with enhanced fire protection measures including sprinklers and fire separations.'
  },
  {
    id: 'fire-02',
    section: '3.2.2.50',
    category: 'Fire Safety',
    title: 'Residential Building Area Increase',
    nbc2019: 'Max 600m² building footprint per floor (Group C)',
    nbc2023: 'Max 1200m² building footprint per floor (Group C) with sprinklers',
    impact: 'High',
    occupancies: ['C'],
    description: 'Doubled maximum building area for residential buildings when fully sprinklered, enabling larger apartment complexes.'
  },
  {
    id: 'fire-03',
    section: '3.3.1.3',
    category: 'Fire Safety',
    title: 'Fire Separation Requirements',
    nbc2019: '1-hour separation between dwelling units',
    nbc2023: '45-minute separation permitted for some configurations',
    impact: 'Medium',
    occupancies: ['C'],
    description: 'Reduced fire separation rating for certain residential configurations, reducing construction costs.'
  },
  {
    id: 'access-01',
    section: '3.8',
    category: 'Accessibility',
    title: 'Barrier-Free Path of Travel',
    nbc2019: 'Required for buildings > 3 storeys or > 600m²',
    nbc2023: 'Required for all new buildings and major renovations',
    impact: 'High',
    occupancies: ['A-1', 'A-2', 'A-3', 'A-4', 'B-2', 'B-3', 'C', 'D', 'E'],
    description: 'Expanded accessibility requirements to include smaller buildings and renovations.'
  },
  {
    id: 'access-02',
    section: '3.8.3.3',
    category: 'Accessibility',
    title: 'Accessible Washroom Requirements',
    nbc2019: 'Min 1 universal washroom per floor',
    nbc2023: 'Universal washroom required on every floor with public washrooms',
    impact: 'Medium',
    occupancies: ['A-1', 'A-2', 'A-3', 'B-2', 'B-3', 'D', 'E'],
    description: 'Ensures accessible washroom facilities are available on all floors with public access.'
  },
  {
    id: 'energy-01',
    section: '9.36',
    category: 'Energy',
    title: 'Energy Efficiency Requirements',
    nbc2019: 'R-20 minimum wall insulation',
    nbc2023: 'R-24 minimum wall insulation (effective R-value)',
    impact: 'High',
    occupancies: ['C', 'D'],
    description: 'Increased insulation requirements to improve energy performance and reduce greenhouse gas emissions.'
  },
  {
    id: 'energy-02',
    section: '9.36.2.9',
    category: 'Energy',
    title: 'Air Barrier Requirements',
    nbc2019: 'Air barrier required, no specific testing',
    nbc2023: 'Air barrier with mandatory blower door testing (≤ 2.5 ACH @ 50Pa)',
    impact: 'High',
    occupancies: ['C'],
    description: 'Mandatory air tightness testing to ensure building envelope performance.'
  },
  {
    id: 'struct-01',
    section: '4.1.3.2',
    category: 'Structural',
    title: 'Snow Load Calculations',
    nbc2019: 'Based on 1-in-50 year return period',
    nbc2023: 'Updated snow load maps with climate change projections',
    impact: 'Medium',
    occupancies: ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C', 'D', 'E', 'F-1', 'F-2', 'F-3'],
    description: 'Revised snow load requirements reflecting updated climate data and projections.'
  },
  {
    id: 'struct-02',
    section: '9.4.3',
    category: 'Structural',
    title: 'Foundation Design',
    nbc2019: 'Prescriptive foundation tables',
    nbc2023: 'Updated foundation tables with additional soil classifications',
    impact: 'Low',
    occupancies: ['C'],
    description: 'Expanded foundation design guidance for various soil conditions.'
  },
  {
    id: 'plumb-01',
    section: '7.2.2',
    category: 'Plumbing',
    title: 'Water Efficiency Requirements',
    nbc2019: 'Max 6 L/flush toilets',
    nbc2023: 'Max 4.8 L/flush toilets (dual flush permitted)',
    impact: 'Medium',
    occupancies: ['A-1', 'A-2', 'A-3', 'B-2', 'B-3', 'C', 'D', 'E'],
    description: 'Reduced water consumption requirements for plumbing fixtures.'
  },
  {
    id: 'plumb-02',
    section: '7.6.2',
    category: 'Plumbing',
    title: 'Greywater Systems',
    nbc2019: 'Not addressed in code',
    nbc2023: 'Provisions for greywater reuse systems',
    impact: 'Low',
    occupancies: ['C', 'D'],
    description: 'New provisions allowing greywater recycling for non-potable uses (toilets, irrigation).'
  },
  {
    id: 'elec-01',
    section: '26-724',
    category: 'Electrical',
    title: 'EV Charging Infrastructure',
    nbc2019: 'No specific requirements',
    nbc2023: 'Energized outlet or Level 2 charger required for 20% of parking spaces',
    impact: 'High',
    occupancies: ['C', 'D'],
    description: 'Mandatory electric vehicle charging infrastructure for new residential and commercial buildings.'
  },
  {
    id: 'elec-02',
    section: '26-700',
    category: 'Electrical',
    title: 'AFCI Protection',
    nbc2019: 'Required for bedrooms only',
    nbc2023: 'Required for all 120V branch circuits in dwelling units',
    impact: 'High',
    occupancies: ['C'],
    description: 'Expanded arc-fault circuit interrupter requirements to all living spaces for enhanced fire safety.'
  },
  {
    id: 'gen-01',
    section: '1.3.3.2',
    category: 'General',
    title: 'Alternative Solutions',
    nbc2019: 'Alternative solutions permitted with AHJ approval',
    nbc2023: 'Clarified process and documentation requirements for alternative solutions',
    impact: 'Medium',
    occupancies: ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C', 'D', 'E', 'F-1', 'F-2', 'F-3'],
    description: 'Streamlined alternative solution submission process with clearer documentation standards.'
  },
  {
    id: 'gen-02',
    section: '9.10.9.14',
    category: 'General',
    title: 'Secondary Suite Requirements',
    nbc2019: 'Limited guidance on secondary suites',
    nbc2023: 'Comprehensive secondary suite provisions (fire separation, egress, sound)',
    impact: 'High',
    occupancies: ['C'],
    description: 'Detailed requirements for basement suites and secondary dwelling units including 1-hour fire separation.'
  }
];

// Helper function to filter amendments by category
export function getAmendmentsByCategory(category: CodeAmendment['category']): CodeAmendment[] {
  return codeAmendments.filter(amendment => amendment.category === category);
}

// Helper function to filter amendments by occupancy
export function getAmendmentsByOccupancy(occupancy: string): CodeAmendment[] {
  return codeAmendments.filter(amendment => 
    amendment.occupancies.some(occ => occupancy.startsWith(occ))
  );
}

// Helper function to filter amendments by impact level
export function getAmendmentsByImpact(impact: CodeAmendment['impact']): CodeAmendment[] {
  return codeAmendments.filter(amendment => amendment.impact === impact);
}
