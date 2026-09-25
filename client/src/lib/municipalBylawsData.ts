// Municipal Land Use Bylaws Data
// Based on research of Edmonton, Calgary, Airdrie, Lethbridge, and Vancouver bylaws

export interface SetbackRequirement {
  front: number;
  rear: number;
  sideInterior: number;
  sideExterior?: number;
  sideCorner?: number;
  flanking?: number;
  unit: 'meters' | 'feet';
}

export interface HeightLimit {
  maxHeight: number;
  maxStoreys?: number;
  unit: 'meters' | 'feet';
  notes?: string;
}

export interface CoverageLimit {
  maxSiteCoverage: number;
  maxBuildingCoverage?: number;
  maxHardSurface?: number;
  unit: 'percent';
}

export interface LotRequirement {
  minArea: number;
  minWidth: number;
  minDepth?: number;
  areaUnit: 'sqm' | 'sqft';
  widthUnit: 'meters' | 'feet';
}

export interface ProjectionAllowance {
  type: string;
  maxProjection: number;
  maxLength?: number;
  conditions?: string;
  unit: 'meters' | 'feet';
}

export interface ZoneRegulation {
  zoneCode: string;
  zoneName: string;
  description: string;
  setbacks: SetbackRequirement;
  height: HeightLimit;
  coverage: CoverageLimit;
  lotRequirements: LotRequirement;
  projections?: ProjectionAllowance[];
  specialNotes?: string[];
}

export interface Municipality {
  id: string;
  name: string;
  province: string;
  bylawName: string;
  bylawNumber: string;
  lastUpdated: string;
  sourceUrl: string;
  zones: ZoneRegulation[];
  generalRegulations?: {
    deckMaxHeight?: number;
    fenceMaxHeight?: number;
    accessoryBuildingMaxArea?: number;
    accessoryBuildingMaxHeight?: number;
  };
}

export const municipalities: Municipality[] = [
  {
    id: 'edmonton',
    name: 'Edmonton',
    province: 'Alberta',
    bylawName: 'Zoning Bylaw',
    bylawNumber: '20001',
    lastUpdated: '2026-01-01',
    sourceUrl: 'https://zoningbylaw.edmonton.ca/',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.85,
      accessoryBuildingMaxArea: 75,
      accessoryBuildingMaxHeight: 4.3,
    },
    zones: [
      {
        zoneCode: 'RS',
        zoneName: 'Standard Residential',
        description: 'Single detached housing on standard lots',
        setbacks: {
          front: 4.5,
          rear: 4.5,
          sideInterior: 1.2,
          sideCorner: 2.5,
          unit: 'meters',
        },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, maxHardSurface: 60, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 10.0, areaUnit: 'sqm', widthUnit: 'meters' },
        projections: [
          { type: 'Eaves', maxProjection: 0.6, unit: 'meters' },
          { type: 'Bay Window', maxProjection: 0.6, maxLength: 3.0, unit: 'meters' },
        ],
        specialNotes: ['Secondary suites permitted', 'Garden suites may be allowed with development permit'],
      },
      {
        zoneCode: 'RSF',
        zoneName: 'Small Scale Flex Residential',
        description: 'Small lot single detached and infill housing',
        setbacks: {
          front: 3.0,
          rear: 3.0,
          sideInterior: 1.2,
          sideCorner: 2.5,
          unit: 'meters',
        },
        height: { maxHeight: 11.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 55, maxHardSurface: 70, unit: 'percent' },
        lotRequirements: { minArea: 200, minWidth: 7.5, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Suites and garden suites permitted', 'Minimum lot width 7.5m'],
      },
      {
        zoneCode: 'RSM',
        zoneName: 'Small-Medium Scale Residential',
        description: 'Skinny homes, stacked row housing and medium density infill',
        setbacks: {
          front: 3.0,
          rear: 3.0,
          sideInterior: 1.2,
          sideCorner: 2.5,
          unit: 'meters',
        },
        height: { maxHeight: 14.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 140, minWidth: 6.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'RM',
        zoneName: 'Row Housing',
        description: 'Attached row housing and townhouses',
        setbacks: {
          front: 3.0,
          rear: 3.0,
          sideInterior: 1.2,
          sideCorner: 2.5,
          unit: 'meters',
        },
        height: { maxHeight: 14.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 65, unit: 'percent' },
        lotRequirements: { minArea: 120, minWidth: 5.5, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Per unit minimums apply'],
      },
      {
        zoneCode: 'RMU',
        zoneName: 'Residential Mixed Use',
        description: 'Ground floor commercial with residential above',
        setbacks: {
          front: 0,
          rear: 3.0,
          sideInterior: 0,
          sideCorner: 0,
          unit: 'meters',
        },
        height: { maxHeight: 16.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 10.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'CB',
        zoneName: 'Commercial Business',
        description: 'General commercial and office uses',
        setbacks: {
          front: 0,
          rear: 3.0,
          sideInterior: 0,
          sideCorner: 0,
          unit: 'meters',
        },
        height: { maxHeight: 20.0, maxStoreys: 5, unit: 'meters' },
        coverage: { maxSiteCoverage: 80, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 10.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'CN',
        zoneName: 'Neighbourhood Convenience Commercial',
        description: 'Small-scale neighbourhood retail and services',
        setbacks: {
          front: 3.0,
          rear: 3.0,
          sideInterior: 0,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: { maxHeight: 14.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 10.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'BE',
        zoneName: 'Business Employment',
        description: 'Light industrial, warehouse, and business park uses',
        setbacks: {
          front: 6.0,
          rear: 3.0,
          sideInterior: 3.0,
          sideCorner: 6.0,
          unit: 'meters',
        },
        height: { maxHeight: 20.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 1000, minWidth: 30.0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Outdoor storage must be screened'],
      },
      {
        zoneCode: 'IM',
        zoneName: 'Medium Industrial',
        description: 'General industrial, manufacturing, and processing',
        setbacks: {
          front: 7.5,
          rear: 4.5,
          sideInterior: 3.0,
          sideCorner: 7.5,
          unit: 'meters',
        },
        height: { maxHeight: 25.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 2000, minWidth: 40.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'IH',
        zoneName: 'Heavy Industrial',
        description: 'Heavy industrial, processing, and resource extraction',
        setbacks: {
          front: 7.5,
          rear: 4.5,
          sideInterior: 3.0,
          sideCorner: 7.5,
          unit: 'meters',
        },
        height: { maxHeight: 30.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 65, unit: 'percent' },
        lotRequirements: { minArea: 4000, minWidth: 60.0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Environmental impact assessment may be required', 'Buffer zones required adjacent to residential'],
      },
    ],
  },
  {
    id: 'calgary',
    name: 'Calgary',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '1P2007',
    lastUpdated: '2026-01-16',
    sourceUrl: 'https://www.calgary.ca/planning/land-use/online-land-use-bylaw.html',
    generalRegulations: {
      deckMaxHeight: 1.5,
      fenceMaxHeight: 1.85,
      accessoryBuildingMaxArea: 75,
      accessoryBuildingMaxHeight: 4.6,
    },
    zones: [
      {
        zoneCode: 'R-C1',
        zoneName: 'Residential - Contextual One Dwelling',
        description: 'Single detached dwellings in established areas',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
          notes: 'Height measured from grade to midpoint of roof',
        },
        coverage: {
          maxSiteCoverage: 45,
          maxBuildingCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 450,
          minWidth: 12.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        projections: [
          { type: 'Bay Window', maxProjection: 0.6, conditions: '≥2.4m above grade', unit: 'meters' },
          { type: 'Eaves', maxProjection: 0.6, unit: 'meters' },
          { type: 'Window Well', maxProjection: 0.8, conditions: 'Side setback only', unit: 'meters' },
          { type: 'Porch', maxProjection: 1.8, conditions: 'Developed Area, unenclosed', unit: 'meters' },
        ],
        specialNotes: [
          'Projections into setback limited to 40% of façade length',
          'Maximum individual projection length: 3.1m',
          'Attached garage may project into rear setback',
        ],
      },
      {
        zoneCode: 'R-C2',
        zoneName: 'Residential - Contextual Two Dwelling',
        description: 'Semi-detached and duplex dwellings',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 360,
          minWidth: 10.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-CG',
        zoneName: 'Residential - Contextual Grade-Oriented',
        description: 'Row housing and townhouses',
        setbacks: {
          front: 3.0,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 11.0,
          maxStoreys: 3,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 55,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 150,
          minWidth: 5.5,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-G',
        zoneName: 'Residential - Grade-Oriented',
        description: 'New residential areas — single and semi-detached with secondary and backyard suites',
        setbacks: {
          front: 3.0,
          rear: 6.0,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
          notes: 'Secondary suites and backyard suites permitted by default',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 240,
          minWidth: 7.5,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'Secondary suites permitted as-of-right',
          'Backyard suites permitted as-of-right',
          'Parking: 1 space per dwelling unit',
        ],
      },
      {
        zoneCode: 'R-2M',
        zoneName: 'Residential - Two Dwelling Multi-Residential',
        description: 'Side-by-side and stacked duplexes in established areas',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 360,
          minWidth: 10.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'Secondary suites may be permitted subject to development permit',
        ],
      },
      {
        zoneCode: 'M-CG',
        zoneName: 'Multi-Residential - Contextual Grade-Oriented',
        description: 'Low-rise multi-residential buildings',
        setbacks: {
          front: 3.0,
          rear: 7.5,
          sideInterior: 3.0,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 16.0,
          maxStoreys: 4,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 600,
          minWidth: 18.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'M-C1',
        zoneName: 'Multi-Residential - Contextual Low Profile',
        description: 'Low-rise apartment buildings up to 4 storeys',
        setbacks: {
          front: 4.5,
          rear: 7.5,
          sideInterior: 3.0,
          sideCorner: 4.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 16.0,
          maxStoreys: 4,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1000,
          minWidth: 20.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'M-C2',
        zoneName: 'Multi-Residential - Contextual Medium Profile',
        description: 'Mid-rise apartment buildings up to 8 storeys',
        setbacks: {
          front: 4.5,
          rear: 7.5,
          sideInterior: 3.0,
          sideCorner: 4.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 26.0,
          maxStoreys: 8,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1500,
          minWidth: 30.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'Underground parking required when site coverage exceeds 40%',
        ],
      },
      // Commercial Zones
      {
        zoneCode: 'C-C1',
        zoneName: 'Commercial - Community 1',
        description: 'Neighbourhood-scale commercial services',
        setbacks: {
          front: 3.0,
          rear: 3.0,
          sideInterior: 0,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 450,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'C-C2',
        zoneName: 'Commercial - Community 2',
        description: 'Community-scale commercial and retail',
        setbacks: {
          front: 0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 0,
          unit: 'meters',
        },
        height: {
          maxHeight: 14.0,
          maxStoreys: 4,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 80,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'C-COR1',
        zoneName: 'Commercial - Corridor 1',
        description: 'Commercial along major corridors',
        setbacks: {
          front: 6.0,
          rear: 3.0,
          sideInterior: 0,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 12.0,
          maxStoreys: 3,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 600,
          minWidth: 20.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      // Industrial Zones
      {
        zoneCode: 'I-G',
        zoneName: 'Industrial - General',
        description: 'General industrial and warehouse uses',
        setbacks: {
          front: 6.0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 6.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 16.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 70,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1000,
          minWidth: 30.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'I-B',
        zoneName: 'Industrial - Business',
        description: 'Light industrial and business park',
        setbacks: {
          front: 6.0,
          rear: 3.0,
          sideInterior: 0,
          sideCorner: 6.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 14.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 800,
          minWidth: 25.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'I-H',
        zoneName: 'Industrial - Heavy',
        description: 'Heavy industrial and manufacturing',
        setbacks: {
          front: 15.0,
          rear: 7.5,
          sideInterior: 7.5,
          sideCorner: 15.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 25.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 4000,
          minWidth: 60.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
    ],
  },
  {
    id: 'airdrie',
    name: 'Airdrie',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: 'B-01/2016',
    lastUpdated: '2026-01-08',
    sourceUrl: 'https://www.airdrie.ca/index.cfm?serviceID=1886',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 65,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'R1',
        zoneName: 'Single Detached Residential',
        description: 'Single detached dwellings on standard lots',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, sideCorner: 3.0, unit: 'meters' },
        height: { maxHeight: 11.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 400, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R1-U',
        zoneName: 'Urban Standard Residential',
        description: 'Single detached on urban standard lots with rear lane',
        setbacks: { front: 4.5, rear: 1.5, sideInterior: 1.2, sideCorner: 2.5, unit: 'meters' },
        height: { maxHeight: 11.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 50, unit: 'percent' },
        lotRequirements: { minArea: 250, minWidth: 8.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R1-L',
        zoneName: 'Narrow Lot Laned Residential',
        description: 'Narrow single detached lots with rear lane access',
        setbacks: { front: 4.5, rear: 1.5, sideInterior: 1.2, sideCorner: 2.5, unit: 'meters' },
        height: { maxHeight: 11.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 55, unit: 'percent' },
        lotRequirements: { minArea: 200, minWidth: 7.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R2',
        zoneName: 'Low Density Residential',
        description: 'Semi-detached and duplex dwellings',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.5, sideCorner: 3.0, unit: 'meters' },
        height: { maxHeight: 11.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 350, minWidth: 10.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R2-T',
        zoneName: 'Townhouse Residential',
        description: 'Attached row housing and townhouses',
        setbacks: { front: 4.5, rear: 6.0, sideInterior: 1.2, sideCorner: 3.0, unit: 'meters' },
        height: { maxHeight: 11.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 55, unit: 'percent' },
        lotRequirements: { minArea: 160, minWidth: 6.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R3',
        zoneName: 'Low-Rise Multifamily Residential',
        description: 'Low-rise apartment and stacked dwelling buildings',
        setbacks: { front: 4.5, rear: 6.0, sideInterior: 3.0, sideCorner: 4.5, unit: 'meters' },
        height: { maxHeight: 14.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 600, minWidth: 18.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'RMH',
        zoneName: 'Residential Mobile Home',
        description: 'Mobile and manufactured home sites',
        setbacks: { front: 6.0, rear: 6.0, sideInterior: 1.5, sideCorner: 3.0, unit: 'meters' },
        height: { maxHeight: 8.0, maxStoreys: 1, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 9.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'C1', zoneName: 'Neighbourhood Commercial',
        description: 'Small-scale commercial development serving the immediate neighbourhood (~3,000 population catchment)',
        setbacks: { front: 4.5, rear: 3.0, sideInterior: 3.0, sideExterior: 6.0, unit: 'meters' },
        height: { maxHeight: 13.0, unit: 'meters', notes: 'No building over 11.0m within 15.0m of an adjacent residential property line' },
        coverage: { maxSiteCoverage: 50, unit: 'percent' },
        lotRequirements: { minArea: 0, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Bylaw gives no minimum lot area/width for this district.', 'Maximum Site Area: 30,000 sqm (3.0 ha). Minimum FAR: 0.25.', 'Building separation: 2.0m. Minimum landscaping: 15% of site area.'],
      },
      {
        zoneCode: 'C2', zoneName: 'Community Commercial',
        description: 'Comprehensive shopping-centre-format retail, office, institutional and open-space uses serving a 6,000–10,000 population catchment',
        setbacks: { front: 3.0, rear: 0, sideInterior: 0, sideExterior: 6.0, unit: 'meters' },
        height: { maxHeight: 0, maxStoreys: 3, unit: 'meters', notes: 'Bylaw sets height by storeys, not meters: 3 storeys for most uses, 4 storeys for Mixed-Use and Apartment buildings. No meters value given. No building over 13.0m within 30m of an adjacent residential property line.' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 0, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Bylaw gives no minimum lot area/width for this district.', 'Maximum Site Area: 65,000 sqm (6.5 ha). Minimum FAR: 0.2.', 'Interior setback is at the discretion of the Development Authority — 0 used as placeholder, not a bylaw figure.', 'Building separation: 3.0m. Minimum landscaping: 10% of site area.'],
      },
      {
        zoneCode: 'C3', zoneName: 'Regional Commercial',
        description: 'Large-format retail and commercial uses serving a City-wide and regional market',
        setbacks: { front: 3.0, rear: 3.0, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 0, maxStoreys: 4, unit: 'meters', notes: 'Bylaw sets height by storeys, not meters: 4 storeys for most uses, 6 storeys for Mixed-Use, Hotel, Office, and Apartment buildings. No meters value given.' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 0, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Bylaw gives no minimum lot area/width for this district.', 'Maximum Site Area: 120,000 sqm (12.0 ha). Minimum FAR: 0.2.', 'Interior setback may instead be set by an approved Master Site Plan, whichever is less.', 'Building separation: 3.0m. Minimum landscaping: 10% of site area.', 'A Development Site under this district may form part of a larger Master Site Plan.'],
      },
      {
        zoneCode: 'CS', zoneName: 'Service Commercial',
        description: 'Medium-scale, automobile-oriented commercial uses',
        setbacks: { front: 6.0, rear: 2.0, sideInterior: 2.0, unit: 'meters' },
        height: { maxHeight: 0, maxStoreys: 3, unit: 'meters', notes: 'Bylaw sets height by storeys, not meters: 3 storeys for most uses, 4 storeys for Hotels. No meters value given.' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 0, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Bylaw gives no minimum lot area/width for this district.', 'Maximum Site Area: 30,000 sqm (3.0 ha). Minimum FAR: 0.2.', 'Interior setback is 8.0m where the site is adjacent to a Residential District (2.0m used above is the "all other circumstances" baseline).', 'Building separation: 2.0m. Minimum landscaping: 10% of site area.'],
      },
      {
        zoneCode: 'IB-1', zoneName: 'Mixed Business/Employment',
        description: 'Small-to-medium-scale employment uses providing a transition between other land use districts',
        setbacks: { front: 6.0, rear: 0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 18.5, unit: 'meters', notes: '18.5m applies to most uses; Hotels permitted to 26.0m.' },
        coverage: { maxSiteCoverage: 65, unit: 'percent' },
        lotRequirements: { minArea: 4000, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Interior Setback is listed as N/A in the bylaw — 0 used as placeholder, not a bylaw figure.', 'Bylaw gives no minimum site width for this district.', 'Maximum Site Area: 20,000 sqm (2.0 ha). Minimum FAR: 0.2.', 'Building separation: 2.0m. Minimum landscaping: 10% of site area.'],
      },
      {
        zoneCode: 'IB-O', zoneName: 'Office Park and Employment',
        description: 'Office and complementary commercial-business-employment uses (office, research and development, related business uses)',
        setbacks: { front: 6.0, rear: 0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 24.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 2000, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Interior Setback is listed as N/A in the bylaw — 0 used as placeholder, not a bylaw figure.', 'Bylaw gives no minimum site width for this district.', 'Minimum FAR: 0.3. Building separation: 2.0m. Minimum landscaping: 10% of site area.'],
      },
      {
        zoneCode: 'IB-2', zoneName: 'Industrial Employment',
        description: 'Concentrated manufacturing, fabrication, and other industrial uses, with commercial uses limited to secondary/employee-serving scale',
        setbacks: { front: 6.0, rear: 0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 18.5, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 1000, minWidth: 24.0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Interior Setback is at the discretion of the Development Authority — 0 used as placeholder, not a bylaw figure.', 'Minimum FAR: 0.2. Building separation: 2.0m. Minimum landscaping: 5% of site area.'],
      },
      {
        zoneCode: 'IB-3', zoneName: 'Heavy Industrial Employment',
        description: 'Large-scale, heavy industrial operations and certain automotive uses that may require site plan design or buffering',
        setbacks: { front: 12.2, rear: 6.0, sideInterior: 6.0, unit: 'meters' },
        height: { maxHeight: 18.5, unit: 'meters', notes: '18.5m applies within 30m of a non-industrial district; the bylaw specifies no general maximum height elsewhere.' },
        coverage: { maxSiteCoverage: 80, unit: 'percent' },
        lotRequirements: { minArea: 4000, minWidth: 48.0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Interior Setback is 6.0m where adjacent to a Residential district; discretionary ("at the discretion of the Development Authority") in all other circumstances — 6.0m used above as the defensible baseline.', 'Exterior Setback reduces to 6.0m for development approved prior to this bylaw\'s adoption.', 'Minimum FAR: 0.2. Building separation: 2.0m. Minimum landscaping: 5% of site area.', 'Outdoor storage associated with an approved use must meet Section 7.21 (Outdoor Storage) requirements.'],
      },
    ],
  },
  {
    id: 'lethbridge',
    name: 'Lethbridge',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '6300',
    lastUpdated: '2022-05-24',
    sourceUrl: 'https://www.lethbridge.ca/planning-development/land-use-statutory-plans-and-zoning/zoning-and-land-use-bylaw/',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 70,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'R-L',
        zoneName: 'Residential Low Density',
        description: 'Single detached dwellings in low density areas',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 40,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 465,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'Uncovered deck rear setback: 5.0m',
          'Covered deck rear setback: 7.6m',
          'Walking surface clearance: 3.5m minimum',
        ],
      },
      {
        zoneCode: 'R-N',
        zoneName: 'Residential Narrow Lot',
        description: 'Single detached dwellings on narrow lots',
        setbacks: {
          front: 5.5,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 2.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 325,
          minWidth: 10.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-M',
        zoneName: 'Residential Medium Density',
        description: 'Semi-detached and row housing',
        setbacks: {
          front: 4.5,
          rear: 7.5,
          sideInterior: 1.5,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 12.0,
          maxStoreys: 3,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 200,
          minWidth: 6.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-H',
        zoneName: 'Residential High Density',
        description: 'Apartment buildings and high density residential',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 3.0,
          sideCorner: 4.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 18.0,
          maxStoreys: 6,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1000,
          minWidth: 30.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      // Commercial Zones
      {
        zoneCode: 'C-N',
        zoneName: 'Neighbourhood Commercial',
        description: 'Small-scale neighbourhood commercial',
        setbacks: {
          front: 3.0,
          rear: 4.5,
          sideInterior: 0,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 350,
          minWidth: 12.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'C-G',
        zoneName: 'General Commercial',
        description: 'General commercial and retail',
        setbacks: {
          front: 0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 0,
          unit: 'meters',
        },
        height: {
          maxHeight: 14.0,
          maxStoreys: 4,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 100,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'C-H',
        zoneName: 'Highway Commercial',
        description: 'Commercial along major highways',
        setbacks: {
          front: 9.0,
          rear: 4.5,
          sideInterior: 3.0,
          sideCorner: 9.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 12.0,
          maxStoreys: 3,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 40,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1000,
          minWidth: 30.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      // Industrial Zones
      {
        zoneCode: 'M-L',
        zoneName: 'Light Industrial',
        description: 'Light industrial and warehouse',
        setbacks: {
          front: 6.0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 6.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 12.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 700,
          minWidth: 20.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'M-G',
        zoneName: 'General Industrial',
        description: 'General industrial and manufacturing',
        setbacks: {
          front: 9.0,
          rear: 3.0,
          sideInterior: 3.0,
          sideCorner: 9.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 18.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 55,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1500,
          minWidth: 35.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
    ],
  },
  {
    id: 'vancouver',
    name: 'Vancouver',
    province: 'British Columbia',
    bylawName: 'Zoning and Development By-law',
    bylawNumber: '3575',
    lastUpdated: '2025-07-22',
    sourceUrl: 'https://vancouver.ca/home-property-development/zoning-and-development-bylaw.aspx',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 44,
      accessoryBuildingMaxHeight: 3.7,
    },
    zones: [
      {
        zoneCode: 'RT-1',
        zoneName: 'Two-Family Dwelling District',
        description: 'Side-by-side duplexes',
        setbacks: {
          front: 7.3,
          rear: 10.7,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.7,
          maxStoreys: 2.5,
          unit: 'meters',
          notes: 'Height varies by site width and depth',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 780,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'FSR (Floor Space Ratio) typically 0.60-0.75',
          'Single detached with secondary suite: 445 sqm minimum',
        ],
      },
      {
        zoneCode: 'RT-5',
        zoneName: 'Two-Family Dwelling District',
        description: 'Duplexes with character retention incentives',
        setbacks: {
          front: 7.3,
          rear: 10.7,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.7,
          maxStoreys: 2.5,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 668,
          minWidth: 12.2,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'RM-1',
        zoneName: 'Multiple Dwelling District',
        description: 'Low-rise multiple dwelling buildings',
        setbacks: {
          front: 7.3,
          rear: 10.7,
          sideInterior: 2.1,
          sideCorner: 3.7,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.7,
          maxStoreys: 3,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1000,
          minWidth: 24.4,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'FSR typically 0.75-1.20 depending on site',
        ],
      },
      {
        zoneCode: 'RM-4',
        zoneName: 'Multiple Dwelling District',
        description: 'Medium-rise apartment buildings',
        setbacks: {
          front: 7.3,
          rear: 10.7,
          sideInterior: 2.4,
          sideCorner: 4.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 13.7,
          maxStoreys: 4,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1500,
          minWidth: 30.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      // Commercial Zones
      {
        zoneCode: 'C-1',
        zoneName: 'Commercial District',
        description: 'Neighbourhood commercial uses',
        setbacks: {
          front: 0,
          rear: 3.0,
          sideInterior: 0,
          sideCorner: 0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.7,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'FSR typically 1.0-2.5',
          'Ground floor commercial required on arterials',
        ],
      },
      {
        zoneCode: 'C-2',
        zoneName: 'Commercial District',
        description: 'General commercial and mixed-use',
        setbacks: {
          front: 0,
          rear: 3.0,
          sideInterior: 0,
          sideCorner: 0,
          unit: 'meters',
        },
        height: {
          maxHeight: 13.8,
          maxStoreys: 4,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 100,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'FSR typically 2.5-3.0',
          'Residential permitted above commercial',
        ],
      },
      {
        zoneCode: 'C-3A',
        zoneName: 'Commercial District',
        description: 'Mixed commercial and residential',
        setbacks: {
          front: 0,
          rear: 7.6,
          sideInterior: 0,
          sideCorner: 0,
          unit: 'meters',
        },
        height: {
          maxHeight: 18.3,
          maxStoreys: 5,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 100,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      // Industrial Zones
      {
        zoneCode: 'I-1',
        zoneName: 'Industrial District',
        description: 'Light industrial and service',
        setbacks: {
          front: 3.0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 18.3,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 75,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'FSR typically 3.0',
          'Office limited to 25% of floor area',
        ],
      },
      {
        zoneCode: 'I-2',
        zoneName: 'Industrial District',
        description: 'General industrial uses',
        setbacks: {
          front: 6.0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 6.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 18.3,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'M-1',
        zoneName: 'Industrial District',
        description: 'Heavy industrial uses',
        setbacks: {
          front: 9.0,
          rear: 3.0,
          sideInterior: 3.0,
          sideCorner: 9.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 30.5,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
    ],
  },
  {
    id: 'rocky_view_county',
    name: 'Rocky View County',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: 'C-8000-2020',
    lastUpdated: '2020-01-01',
    sourceUrl: 'https://www.rockyview.ca/build-plan-and-develop/planning/land-use-bylaw',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 65,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'R-RUR',
        zoneName: 'Rural Residential',
        description: 'Low-density rural residential on large parcels',
        setbacks: {
          front: 10.0,
          rear: 7.5,
          sideInterior: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 15,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 20000, // 2.0 ha converted to m²
          minWidth: 30.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: ['Minimum lot area is 2.0 hectares (20,000 m²)'],
      },
      {
        zoneCode: 'R-1',
        zoneName: 'Residential One',
        description: 'Single detached dwellings in hamlet areas',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 40,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 557,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-2',
        zoneName: 'Residential Two',
        description: 'Semi-detached and duplex dwellings',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 557,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-3',
        zoneName: 'Residential Three',
        description: 'Multi-unit residential',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 14.0,
          maxStoreys: 4,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 557,
          minWidth: 18.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'C-1',
        zoneName: 'Hamlet Commercial',
        description: 'Small-scale commercial serving hamlet areas',
        setbacks: {
          front: 3.0,
          rear: 3.0,
          sideInterior: 0,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 400,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'I-1',
        zoneName: 'Light Industrial',
        description: 'Light industrial and service commercial',
        setbacks: {
          front: 7.5,
          rear: 4.5,
          sideInterior: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 14.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 2000,
          minWidth: 30.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'DC',
        zoneName: 'Direct Control',
        description: 'Regulations set by individual DC bylaw',
        setbacks: {
          front: 0,
          rear: 0,
          sideInterior: 0,
          unit: 'meters',
        },
        height: {
          maxHeight: 0,
          unit: 'meters',
          notes: 'Set by individual DC bylaw',
        },
        coverage: {
          maxSiteCoverage: 0,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 0,
          minWidth: 0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'Regulations set by individual Direct Control bylaw — contact Rocky View County Development Services for site-specific requirements',
        ],
      },
    ],
  },
  {
    id: 'chestermere',
    name: 'Chestermere',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '010-L-2014',
    lastUpdated: '2014-01-01',
    sourceUrl: 'https://www.chestermere.ca/197/Planning-Development',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 65,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'R-1',
        zoneName: 'Low Density Residential',
        description: 'Single detached dwellings',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          unit: 'meters',
        },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: {
          minArea: 450,
          minWidth: 12.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-2',
        zoneName: 'Medium Density Residential',
        description: 'Semi-detached, duplex and row housing',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          unit: 'meters',
        },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: {
          minArea: 450,
          minWidth: 10.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-MH',
        zoneName: 'Mobile Home',
        description: 'Mobile and manufactured home sites',
        setbacks: {
          front: 6.0,
          rear: 6.0,
          sideInterior: 1.5,
          unit: 'meters',
        },
        height: { maxHeight: 7.0, maxStoreys: 1, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: {
          minArea: 300,
          minWidth: 9.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'C-1',
        zoneName: 'General Commercial',
        description: 'Retail, office and service commercial',
        setbacks: {
          front: 0,
          rear: 3.0,
          sideInterior: 0,
          unit: 'meters',
        },
        height: { maxHeight: 15.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: {
          minArea: 500,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'I-1',
        zoneName: 'Light Industrial',
        description: 'Light industrial, business park and warehouse',
        setbacks: {
          front: 7.5,
          rear: 4.5,
          sideInterior: 3.0,
          unit: 'meters',
        },
        height: { maxHeight: 12.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: {
          minArea: 1000,
          minWidth: 20.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'DC',
        zoneName: 'Direct Control',
        description: 'Regulations set by individual DC bylaw',
        setbacks: { front: 0, rear: 0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 0, unit: 'meters', notes: 'Set by individual DC bylaw' },
        coverage: { maxSiteCoverage: 0, unit: 'percent' },
        lotRequirements: { minArea: 0, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: [
          'Regulations set by individual Direct Control bylaw — contact Chestermere Planning for site-specific requirements',
        ],
      },
    ],
  },
  // ── Phase 2A municipalities ──────────────────────────────────────────────
  {
    id: 'red_deer',
    name: 'Red Deer',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '3357/2004',
    lastUpdated: '2023-01-01',
    sourceUrl: 'https://www.reddeer.ca/city-government/bylaws/land-use-bylaw/',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 65,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'R1',
        zoneName: 'Single Detached Residential',
        description: 'Single detached dwellings on standard lots',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 9.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 500, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R2',
        zoneName: 'Two Dwelling Residential',
        description: 'Semi-detached and duplex dwellings',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 9.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 450, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R3',
        zoneName: 'Low Density Multi-Family',
        description: 'Row housing and low-rise multi-family',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.5, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 50, unit: 'percent' },
        lotRequirements: { minArea: 600, minWidth: 18.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'C1',
        zoneName: 'Downtown Commercial',
        description: 'Mixed-use and retail in the downtown core',
        setbacks: { front: 0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 25.0, unit: 'meters', notes: 'Height bonusing may apply' },
        coverage: { maxSiteCoverage: 80, unit: 'percent' },
        lotRequirements: { minArea: 0, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'C2',
        zoneName: 'General Commercial',
        description: 'Highway-oriented and general retail',
        setbacks: { front: 3.0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 14.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 0, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'M1',
        zoneName: 'Light Industrial',
        description: 'Light industrial, warehouse and service',
        setbacks: { front: 7.5, rear: 4.5, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 14.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 2000, minWidth: 30.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
    ],
  },
  {
    id: 'cochrane',
    name: 'Cochrane',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '01/2004',
    lastUpdated: '2023-06-01',
    sourceUrl: 'https://www.cochrane.ca/planning-development/land-use-bylaw',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 65,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'R-LD',
        zoneName: 'Low Density Residential',
        description: 'Single detached dwellings',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 400, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R-MD',
        zoneName: 'Medium Density Residential',
        description: 'Semi-detached, duplex and townhouse',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 9.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R-HD',
        zoneName: 'High Density Residential',
        description: 'Low-rise and mid-rise apartment buildings',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.5, unit: 'meters' },
        height: { maxHeight: 14.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 55, unit: 'percent' },
        lotRequirements: { minArea: 600, minWidth: 18.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'C-1',
        zoneName: 'Community Commercial',
        description: 'Neighbourhood and community-scale retail',
        setbacks: { front: 3.0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 65, unit: 'percent' },
        lotRequirements: { minArea: 400, minWidth: 15.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'I-1',
        zoneName: 'Light Industrial',
        description: 'Light industrial and business park',
        setbacks: { front: 7.5, rear: 4.5, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 12.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 1500, minWidth: 25.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
    ],
  },
  {
    id: 'okotoks',
    name: 'Okotoks',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '40-2002',
    lastUpdated: '2022-01-01',
    sourceUrl: 'https://www.okotoks.ca/town-government/policies-bylaws/land-use-bylaw',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 55,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'TN',
        zoneName: 'Traditional Neighbourhood',
        description: 'Residential neighbourhoods with single detached and semi-detached dwellings',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 9.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 450, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'NC',
        zoneName: 'Neighbourhood Core',
        description: 'Mixed-use neighbourhood centre with commercial and residential',
        setbacks: { front: 3.0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 400, minWidth: 15.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'D',
        zoneName: 'Downtown',
        description: 'Downtown commercial and mixed-use core',
        setbacks: { front: 0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 15.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 80, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 10.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'GC',
        zoneName: 'General Commercial',
        description: 'Highway commercial and large-format retail',
        setbacks: { front: 6.0, rear: 3.0, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 65, unit: 'percent' },
        lotRequirements: { minArea: 600, minWidth: 20.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'IBP',
        zoneName: 'Industrial Business Park',
        description: 'Light industrial, warehousing and business park uses',
        setbacks: { front: 7.5, rear: 4.5, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 12.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 1500, minWidth: 25.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'NA',
        zoneName: 'Natural Areas',
        description: 'Environmental reserve and natural area protection',
        setbacks: { front: 15.0, rear: 15.0, sideInterior: 15.0, unit: 'meters' },
        height: { maxHeight: 6.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 5, unit: 'percent' },
        lotRequirements: { minArea: 4000, minWidth: 30.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'ROS',
        zoneName: 'Recreation & Open Space',
        description: 'Parks, recreation facilities and open space',
        setbacks: { front: 6.0, rear: 6.0, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 9.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 20, unit: 'percent' },
        lotRequirements: { minArea: 2000, minWidth: 30.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'ALH',
        zoneName: 'Agricultural and Land Holdings',
        description: 'Agricultural use and large rural land parcels',
        setbacks: { front: 30.0, rear: 15.0, sideInterior: 7.5, unit: 'meters' },
        height: { maxHeight: 10.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 10, unit: 'percent' },
        lotRequirements: { minArea: 40000, minWidth: 100.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'A',
        zoneName: 'Aerodrome',
        description: 'Aviation and aerodrome uses',
        setbacks: { front: 30.0, rear: 15.0, sideInterior: 15.0, unit: 'meters' },
        height: { maxHeight: 10.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 20, unit: 'percent' },
        lotRequirements: { minArea: 10000, minWidth: 60.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
    ],
  },
  {
    id: 'st_albert',
    name: 'St. Albert',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '17-2017',
    lastUpdated: '2023-03-01',
    sourceUrl: 'https://stalbert.ca/city/land-development/land-use-bylaw/',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 65,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'LDR',
        zoneName: 'Low Density Residential',
        description: 'Single detached dwellings on standard lots',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 500, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'SLR',
        zoneName: 'Small Lot Residential',
        description: 'Single detached dwellings on small lots',
        setbacks: { front: 4.5, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 9.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'LLR',
        zoneName: 'Laned Lot Residential',
        description: 'Single detached on laned lots with rear garage access',
        setbacks: { front: 4.5, rear: 1.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 9.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'MDR',
        zoneName: 'Medium Density Residential',
        description: 'Semi-detached, duplex and row housing',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.5, unit: 'meters' },
        height: { maxHeight: 11.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 50, unit: 'percent' },
        lotRequirements: { minArea: 550, minWidth: 15.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'HDR',
        zoneName: 'High Density Residential',
        description: 'Multi-unit residential including apartments',
        setbacks: { front: 4.5, rear: 6.0, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 20.0, maxStoreys: 6, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 1000, minWidth: 18.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'NHC',
        zoneName: 'Neighbourhood Commercial',
        description: 'Small-scale commercial serving local neighbourhoods',
        setbacks: { front: 3.0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 400, minWidth: 15.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'MU2',
        zoneName: 'Mixed-Use 2',
        description: 'Mixed residential and commercial in community centres',
        setbacks: { front: 0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 15.0, maxStoreys: 4, unit: 'meters' },
        coverage: { maxSiteCoverage: 75, unit: 'percent' },
        lotRequirements: { minArea: 0, minWidth: 0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'ICS',
        zoneName: 'Industrial and Commercial Services',
        description: 'Light industrial, warehouse and business park',
        setbacks: { front: 7.5, rear: 4.5, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 14.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 2000, minWidth: 30.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
    ],
  },
  {
    id: 'strathcona_county',
    name: 'Strathcona County',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '40-2016',
    lastUpdated: '2023-01-01',
    sourceUrl: 'https://www.strathcona.ca/planning-development/land-use-bylaw/',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 75,
      accessoryBuildingMaxHeight: 5.0,
    },
    zones: [
      {
        zoneCode: 'RCS',
        zoneName: 'Country Residential Community Services',
        description: 'Low-density rural residential on large lots',
        setbacks: { front: 15.0, rear: 7.5, sideInterior: 4.5, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 15, unit: 'percent' },
        lotRequirements: { minArea: 20000, minWidth: 60.0, areaUnit: 'sqm', widthUnit: 'meters' },
        specialNotes: ['Minimum lot area is 2.0 hectares (20,000 m²) in rural areas'],
      },
      {
        zoneCode: 'R2B',
        zoneName: 'Low Density Site Residential',
        description: 'Single detached on suburban-sized lots in urban service areas',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 400, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R5',
        zoneName: 'High Density Residential',
        description: 'Multi-unit residential including apartments',
        setbacks: { front: 4.5, rear: 6.0, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 20.0, maxStoreys: 6, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 1000, minWidth: 18.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'RM',
        zoneName: 'Manufactured Home',
        description: 'Manufactured and mobile home residential sites',
        setbacks: { front: 6.0, rear: 6.0, sideInterior: 1.5, unit: 'meters' },
        height: { maxHeight: 8.0, maxStoreys: 1, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 9.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'C1',
        zoneName: 'Community Commercial',
        description: 'Neighbourhood and community commercial services',
        setbacks: { front: 3.0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 500, minWidth: 15.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'C2',
        zoneName: 'Arterial Commercial',
        description: 'Arterial road-facing commercial and auto-oriented retail',
        setbacks: { front: 6.0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 65, unit: 'percent' },
        lotRequirements: { minArea: 600, minWidth: 18.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'AG',
        zoneName: 'Agriculture: General',
        description: 'General agricultural use',
        setbacks: { front: 30.0, rear: 10.0, sideInterior: 10.0, unit: 'meters' },
        height: { maxHeight: 10.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 10, unit: 'percent' },
        lotRequirements: { minArea: 20000, minWidth: 60.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
    ],
  },
  {
    id: 'leduc',
    name: 'Leduc',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '981-2022',
    lastUpdated: '2022-06-01',
    sourceUrl: 'https://www.leduc.ca/index.php/planning-development/land-use-bylaw',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 65,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'R-1',
        zoneName: 'Residential Low Density',
        description: 'Single detached dwellings',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 450, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R-1A',
        zoneName: 'Residential Small Lot',
        description: 'Single detached on compact lots',
        setbacks: { front: 5.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 350, minWidth: 9.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R-2',
        zoneName: 'Residential Two Dwelling',
        description: 'Semi-detached and duplex',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 400, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R-3',
        zoneName: 'Residential Multi-Family',
        description: 'Row housing and low-rise apartments',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.5, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 50, unit: 'percent' },
        lotRequirements: { minArea: 600, minWidth: 18.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'C-1',
        zoneName: 'Community Commercial',
        description: 'Neighbourhood and community retail and services',
        setbacks: { front: 3.0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 500, minWidth: 15.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'I-1',
        zoneName: 'Light Industrial',
        description: 'Light industrial, warehouse and service commercial',
        setbacks: { front: 7.5, rear: 4.5, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 14.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 2000, minWidth: 30.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
    ],
  },
  {
    id: 'spruce_grove',
    name: 'Spruce Grove',
    province: 'Alberta',
    bylawName: 'Land Use Bylaw',
    bylawNumber: '1000-2022',
    lastUpdated: '2022-09-01',
    sourceUrl: 'https://www.sprucegrove.org/business/planning-development/land-use-bylaw/',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.83,
      accessoryBuildingMaxArea: 65,
      accessoryBuildingMaxHeight: 4.5,
    },
    zones: [
      {
        zoneCode: 'R1',
        zoneName: 'Single Detached Residential',
        description: 'Single detached dwellings on standard lots',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 40, unit: 'percent' },
        lotRequirements: { minArea: 400, minWidth: 12.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R1N',
        zoneName: 'Single Detached Narrow',
        description: 'Single detached on narrow and compact lots',
        setbacks: { front: 5.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 300, minWidth: 9.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R2',
        zoneName: 'Semi-Detached / Duplex',
        description: 'Semi-detached and duplex dwellings',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.2, unit: 'meters' },
        height: { maxHeight: 10.0, maxStoreys: 2, unit: 'meters' },
        coverage: { maxSiteCoverage: 45, unit: 'percent' },
        lotRequirements: { minArea: 350, minWidth: 9.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'R3',
        zoneName: 'Multi-Unit Residential',
        description: 'Townhouses and low-rise apartments',
        setbacks: { front: 6.0, rear: 7.5, sideInterior: 1.5, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 50, unit: 'percent' },
        lotRequirements: { minArea: 550, minWidth: 15.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'C1',
        zoneName: 'Community Commercial',
        description: 'Neighbourhood retail, offices and services',
        setbacks: { front: 3.0, rear: 3.0, sideInterior: 0, unit: 'meters' },
        height: { maxHeight: 12.0, maxStoreys: 3, unit: 'meters' },
        coverage: { maxSiteCoverage: 70, unit: 'percent' },
        lotRequirements: { minArea: 500, minWidth: 15.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
      {
        zoneCode: 'I1',
        zoneName: 'Light Industrial',
        description: 'Light industrial and business park',
        setbacks: { front: 7.5, rear: 4.5, sideInterior: 3.0, unit: 'meters' },
        height: { maxHeight: 14.0, unit: 'meters' },
        coverage: { maxSiteCoverage: 60, unit: 'percent' },
        lotRequirements: { minArea: 2000, minWidth: 30.0, areaUnit: 'sqm', widthUnit: 'meters' },
      },
    ],
  },
];

// Helper functions
export function getMunicipalityById(id: string): Municipality | undefined {
  return municipalities.find(m => m.id === id);
}

export function getZoneByCode(municipalityId: string, zoneCode: string): ZoneRegulation | undefined {
  const municipality = getMunicipalityById(municipalityId);
  return municipality?.zones.find(z => z.zoneCode === zoneCode);
}

export function getAllZonesForMunicipality(municipalityId: string): ZoneRegulation[] {
  const municipality = getMunicipalityById(municipalityId);
  return municipality?.zones || [];
}

// Calculator functions
export function calculateSetbackCompliance(
  municipalityId: string,
  zoneCode: string,
  proposedSetbacks: { front: number; rear: number; sideInterior: number; sideCorner?: number }
): { compliant: boolean; violations: string[] } {
  const zone = getZoneByCode(municipalityId, zoneCode);
  if (!zone) {
    return { compliant: false, violations: ['Zone not found'] };
  }

  const violations: string[] = [];
  const required = zone.setbacks;

  if (proposedSetbacks.front < required.front) {
    violations.push(`Front setback (${proposedSetbacks.front}m) is less than required (${required.front}m)`);
  }
  if (proposedSetbacks.rear < required.rear) {
    violations.push(`Rear setback (${proposedSetbacks.rear}m) is less than required (${required.rear}m)`);
  }
  if (proposedSetbacks.sideInterior < required.sideInterior) {
    violations.push(`Side interior setback (${proposedSetbacks.sideInterior}m) is less than required (${required.sideInterior}m)`);
  }
  if (proposedSetbacks.sideCorner !== undefined && required.sideCorner !== undefined) {
    if (proposedSetbacks.sideCorner < required.sideCorner) {
      violations.push(`Side corner setback (${proposedSetbacks.sideCorner}m) is less than required (${required.sideCorner}m)`);
    }
  }

  return { compliant: violations.length === 0, violations };
}

export function calculateSiteCoverage(
  buildingFootprint: number,
  lotArea: number
): { coverage: number; formatted: string } {
  const coverage = (buildingFootprint / lotArea) * 100;
  return {
    coverage,
    formatted: `${coverage.toFixed(1)}%`,
  };
}

export function checkCoverageCompliance(
  municipalityId: string,
  zoneCode: string,
  buildingFootprint: number,
  lotArea: number
): { compliant: boolean; actualCoverage: number; maxAllowed: number; message: string } {
  const zone = getZoneByCode(municipalityId, zoneCode);
  if (!zone) {
    return { compliant: false, actualCoverage: 0, maxAllowed: 0, message: 'Zone not found' };
  }

  const actualCoverage = (buildingFootprint / lotArea) * 100;
  const maxAllowed = zone.coverage.maxSiteCoverage;
  const compliant = actualCoverage <= maxAllowed;

  return {
    compliant,
    actualCoverage,
    maxAllowed,
    message: compliant
      ? `Site coverage (${actualCoverage.toFixed(1)}%) is within the allowed limit (${maxAllowed}%)`
      : `Site coverage (${actualCoverage.toFixed(1)}%) exceeds the allowed limit (${maxAllowed}%)`,
  };
}

export function checkHeightCompliance(
  municipalityId: string,
  zoneCode: string,
  proposedHeight: number,
  proposedStoreys?: number
): { compliant: boolean; violations: string[] } {
  const zone = getZoneByCode(municipalityId, zoneCode);
  if (!zone) {
    return { compliant: false, violations: ['Zone not found'] };
  }

  const violations: string[] = [];

  if (proposedHeight > zone.height.maxHeight) {
    violations.push(`Proposed height (${proposedHeight}m) exceeds maximum (${zone.height.maxHeight}m)`);
  }

  if (proposedStoreys !== undefined && zone.height.maxStoreys !== undefined) {
    if (proposedStoreys > zone.height.maxStoreys) {
      violations.push(`Proposed storeys (${proposedStoreys}) exceeds maximum (${zone.height.maxStoreys})`);
    }
  }

  return { compliant: violations.length === 0, violations };
}

export function checkLotCompliance(
  municipalityId: string,
  zoneCode: string,
  lotArea: number,
  lotWidth: number
): { compliant: boolean; violations: string[] } {
  const zone = getZoneByCode(municipalityId, zoneCode);
  if (!zone) {
    return { compliant: false, violations: ['Zone not found'] };
  }

  const violations: string[] = [];
  const required = zone.lotRequirements;

  if (lotArea < required.minArea) {
    violations.push(`Lot area (${lotArea} ${required.areaUnit}) is less than minimum (${required.minArea} ${required.areaUnit})`);
  }

  if (lotWidth < required.minWidth) {
    violations.push(`Lot width (${lotWidth}m) is less than minimum (${required.minWidth}m)`);
  }

  return { compliant: violations.length === 0, violations };
}

// Comparison helper
export function compareZonesAcrossMunicipalities(
  zoneType: 'single-detached' | 'duplex' | 'multi-family'
): { municipality: string; zone: ZoneRegulation }[] {
  const results: { municipality: string; zone: ZoneRegulation }[] = [];

  const zoneMapping: Record<string, Record<string, string>> = {
    'single-detached': {
      edmonton: 'RF1',
      calgary: 'R-C1',
      airdrie: 'R-1',
      lethbridge: 'R-L',
      vancouver: 'RT-1',
    },
    'duplex': {
      edmonton: 'RF3',
      calgary: 'R-C2',
      airdrie: 'R-2',
      lethbridge: 'R-M',
      vancouver: 'RT-1',
    },
    'multi-family': {
      edmonton: 'RA7',
      calgary: 'M-CG',
      airdrie: 'R-2',
      lethbridge: 'R-H',
      vancouver: 'RM-4',
    },
  };

  const mapping = zoneMapping[zoneType];
  if (!mapping) return results;

  for (const [municipalityId, zoneCode] of Object.entries(mapping)) {
    const municipality = getMunicipalityById(municipalityId);
    const zone = getZoneByCode(municipalityId, zoneCode);
    if (municipality && zone) {
      results.push({ municipality: municipality.name, zone });
    }
  }

  return results;
}
