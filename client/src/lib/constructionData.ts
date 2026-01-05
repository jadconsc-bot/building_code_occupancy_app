
export type ConstructionType = 'Combustible' | 'Noncombustible' | 'Heavy Timber';

export interface ConstructionLimit {
  article: string;
  maxHeight: string; // e.g., "3 Storeys"
  maxArea: string;   // e.g., "1200 m²"
  sprinklered: boolean;
  constructionType: ConstructionType[];
}

// Data derived from NBC 2023 Alberta Edition Part 3.2.2
export const constructionLimits: Record<string, ConstructionLimit[]> = {
  'A-1': [
    { article: '3.2.2.20', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.21', maxHeight: '1 Storey', maxArea: '600 m²', sprinklered: true, constructionType: ['Heavy Timber', 'Noncombustible'] },
    { article: '3.2.2.22', maxHeight: '1 Storey', maxArea: 'Limited (see 3.2.2.22)', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
  ],
  'A-2': [
    { article: '3.2.2.23', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.24', maxHeight: '6 Storeys', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.25', maxHeight: '2 Storeys', maxArea: 'Varies (Table 3.2.2.25)', sprinklered: false, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.26', maxHeight: '2 Storeys', maxArea: '4800 m² (1 sty) / 2400 m² (2 sty)', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.27', maxHeight: '2 Storeys', maxArea: '2400 m² (1 sty) / 600 m² (2 sty)', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.28', maxHeight: '1 Storey', maxArea: '400-600 m²', sprinklered: false, constructionType: ['Combustible', 'Noncombustible'] },
  ],
  'A-3': [
    { article: '3.2.2.29', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.30', maxHeight: '2 Storeys', maxArea: 'Varies (Table 3.2.2.30)', sprinklered: false, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.31', maxHeight: '2 Storeys', maxArea: '12000 m² (1 sty) / 6000 m² (2 sty)', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.32', maxHeight: '1 Storey', maxArea: '2400-3600 m²', sprinklered: false, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.33', maxHeight: '1 Storey', maxArea: '7200 m²', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.34', maxHeight: '1 Storey', maxArea: '1000-1500 m²', sprinklered: false, constructionType: ['Combustible', 'Noncombustible'] },
  ],
  'A-4': [
    { article: '3.2.2.35', maxHeight: 'Any', maxArea: 'Any', sprinklered: false, constructionType: ['Noncombustible'] }, // Note: Sprinklers required below seats
  ],
  'B-1': [
    { article: '3.2.2.36', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.37', maxHeight: '3 Storeys', maxArea: '12000 m² (2 sty) / 8000 m² (3 sty)', sprinklered: true, constructionType: ['Noncombustible'] },
  ],
  'B-2': [
    { article: '3.2.2.38', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.39', maxHeight: '3 Storeys', maxArea: '12000 m² (2 sty) / 8000 m² (3 sty)', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.40', maxHeight: '2 Storeys', maxArea: '2400 m² (1 sty) / 1600 m² (2 sty)', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.41', maxHeight: '1 Storey', maxArea: '500 m²', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
  ],
  'B-3': [
    { article: '3.2.2.42', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.43', maxHeight: '3 Storeys', maxArea: '12000 m² (2 sty) / 8000 m² (3 sty)', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.44', maxHeight: '3 Storeys', maxArea: '5400 m² (1 sty) / 1800 m² (3 sty)', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.45', maxHeight: '2 Storeys', maxArea: '2400 m² (1 sty) / 1600 m² (2 sty)', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.46', maxHeight: '1 Storey', maxArea: '500 m²', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
  ],
  'C': [
    { article: '3.2.2.47', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.48', maxHeight: '6 Storeys', maxArea: '6000 m²', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] }, // Encapsulated Mass Timber often falls here or similar
    { article: '3.2.2.49', maxHeight: '3 Storeys', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.50', maxHeight: '3 Storeys', maxArea: '1500 m²', sprinklered: false, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.51', maxHeight: '4 Storeys', maxArea: '1800 m²', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
  ],
  'D': [
    { article: '3.2.2.56', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.57', maxHeight: '6 Storeys', maxArea: '7200 m²', sprinklered: true, constructionType: ['Combustible', 'Noncombustible'] },
    { article: '3.2.2.58', maxHeight: '3 Storeys', maxArea: 'Any', sprinklered: false, constructionType: ['Noncombustible'] },
  ],
  'E': [
    { article: '3.2.2.66', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
    { article: '3.2.2.67', maxHeight: '3 Storeys', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
  ],
  'F-1': [
    { article: '3.2.2.72', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
  ],
  'F-2': [
    { article: '3.2.2.76', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
  ],
  'F-3': [
    { article: '3.2.2.82', maxHeight: 'Any', maxArea: 'Any', sprinklered: true, constructionType: ['Noncombustible'] },
  ]
};

// Data derived from Table 3.1.3.1 Major Occupancy Fire Separations
// Values are in hours. "-" means no separation required.
export const separationMatrix: Record<string, Record<string, string>> = {
  'A-1': { 'A-1': '-', 'A-2': '1', 'A-3': '1', 'A-4': '1', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '1', 'D': '1', 'E': '2', 'F-1': '3', 'F-2': '2', 'F-3': '1' },
  'A-2': { 'A-1': '1', 'A-2': '-', 'A-3': '1', 'A-4': '1', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '1', 'D': '1', 'E': '2', 'F-1': '3', 'F-2': '2', 'F-3': '1' },
  'A-3': { 'A-1': '1', 'A-2': '1', 'A-3': '-', 'A-4': '1', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '1', 'D': '1', 'E': '2', 'F-1': '3', 'F-2': '2', 'F-3': '1' },
  'A-4': { 'A-1': '1', 'A-2': '1', 'A-3': '1', 'A-4': '-', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '1', 'D': '1', 'E': '2', 'F-1': '3', 'F-2': '2', 'F-3': '1' },
  'B-1': { 'A-1': '2', 'A-2': '2', 'A-3': '2', 'A-4': '2', 'B-1': '-', 'B-2': '2', 'B-3': '2', 'C': '2', 'D': '2', 'E': '2', 'F-1': '3', 'F-2': '2', 'F-3': '2' },
  'B-2': { 'A-1': '2', 'A-2': '2', 'A-3': '2', 'A-4': '2', 'B-1': '2', 'B-2': '-', 'B-3': '1', 'C': '2', 'D': '2', 'E': '2', 'F-1': '3', 'F-2': '2', 'F-3': '2' },
  'B-3': { 'A-1': '2', 'A-2': '2', 'A-3': '2', 'A-4': '2', 'B-1': '2', 'B-2': '1', 'B-3': '-', 'C': '2', 'D': '2', 'E': '2', 'F-1': '3', 'F-2': '2', 'F-3': '2' },
  'C':   { 'A-1': '1', 'A-2': '1', 'A-3': '1', 'A-4': '1', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '-', 'D': '1', 'E': '2', 'F-1': '3', 'F-2': '2', 'F-3': '1' },
  'D':   { 'A-1': '1', 'A-2': '1', 'A-3': '1', 'A-4': '1', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '1', 'D': '-', 'E': '-', 'F-1': '3', 'F-2': '2', 'F-3': '-' },
  'E':   { 'A-1': '2', 'A-2': '2', 'A-3': '2', 'A-4': '2', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '2', 'D': '-', 'E': '-', 'F-1': '3', 'F-2': '2', 'F-3': '-' },
  'F-1': { 'A-1': '3', 'A-2': '3', 'A-3': '3', 'A-4': '3', 'B-1': '3', 'B-2': '3', 'B-3': '3', 'C': '3', 'D': '3', 'E': '3', 'F-1': '-', 'F-2': '2', 'F-3': '2' },
  'F-2': { 'A-1': '2', 'A-2': '2', 'A-3': '2', 'A-4': '2', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '2', 'D': '2', 'E': '2', 'F-1': '2', 'F-2': '-', 'F-3': '1' },
  'F-3': { 'A-1': '1', 'A-2': '1', 'A-3': '1', 'A-4': '1', 'B-1': '2', 'B-2': '2', 'B-3': '2', 'C': '1', 'D': '-', 'E': '-', 'F-1': '2', 'F-2': '1', 'F-3': '-' },
};
