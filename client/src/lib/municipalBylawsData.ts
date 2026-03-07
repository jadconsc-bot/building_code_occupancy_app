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
    lastUpdated: '2024-01-01',
    sourceUrl: 'https://zoningbylaw.edmonton.ca/',
    generalRegulations: {
      deckMaxHeight: 1.2,
      fenceMaxHeight: 1.85,
      accessoryBuildingMaxArea: 75,
      accessoryBuildingMaxHeight: 4.3,
    },
    zones: [
      {
        zoneCode: 'RSL',
        zoneName: 'Residential Small Lot',
        description: 'Single detached housing on small lots',
        setbacks: {
          front: 3.0,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 2.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 10.0,
          maxStoreys: 2,
          unit: 'meters',
          notes: 'Measured from grade to highest point of roof',
        },
        coverage: {
          maxSiteCoverage: 45,
          maxHardSurface: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 270,
          minWidth: 9.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        projections: [
          { type: 'Eaves', maxProjection: 0.6, unit: 'meters' },
          { type: 'Bay Window', maxProjection: 0.6, maxLength: 3.0, unit: 'meters' },
          { type: 'Chimney', maxProjection: 0.6, unit: 'meters' },
        ],
        specialNotes: [
          'Secondary suites permitted',
          'Garden suites may be allowed with development permit',
        ],
      },
      {
        zoneCode: 'RF1',
        zoneName: 'Single Detached Residential',
        description: 'Single detached housing with secondary suites',
        setbacks: {
          front: 4.5,
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
          maxSiteCoverage: 40,
          maxHardSurface: 55,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 360,
          minWidth: 12.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        projections: [
          { type: 'Eaves', maxProjection: 0.6, unit: 'meters' },
          { type: 'Bay Window', maxProjection: 0.6, maxLength: 3.0, unit: 'meters' },
          { type: 'Porch', maxProjection: 2.0, conditions: 'Unenclosed only', unit: 'meters' },
        ],
      },
      {
        zoneCode: 'RF3',
        zoneName: 'Small Scale Infill Development',
        description: 'Row housing and small apartment buildings',
        setbacks: {
          front: 3.0,
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
          maxHardSurface: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 150,
          minWidth: 5.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'RA7',
        zoneName: 'Low Rise Apartment',
        description: 'Low rise apartment buildings',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 3.0,
          sideCorner: 4.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 14.5,
          maxStoreys: 4,
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
      // Commercial Zones
      {
        zoneCode: 'CB1',
        zoneName: 'Low Intensity Business',
        description: 'Small-scale commercial and office uses',
        setbacks: {
          front: 3.0,
          rear: 0,
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
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 300,
          minWidth: 10.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'Parking required at rear or side',
          'Landscaping required along street frontage',
        ],
      },
      {
        zoneCode: 'CB2',
        zoneName: 'General Business',
        description: 'Medium-scale commercial, retail, and office',
        setbacks: {
          front: 0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 0,
          unit: 'meters',
        },
        height: {
          maxHeight: 14.5,
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
          'No minimum setbacks - build to property line',
          'Underground or structured parking encouraged',
        ],
      },
      {
        zoneCode: 'CNC',
        zoneName: 'Neighbourhood Convenience Commercial',
        description: 'Small-scale neighbourhood retail and services',
        setbacks: {
          front: 3.0,
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
          minArea: 450,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      // Industrial Zones
      {
        zoneCode: 'IB',
        zoneName: 'Industrial Business',
        description: 'Light industrial, warehouse, and business park uses',
        setbacks: {
          front: 6.0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 6.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 14.5,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 900,
          minWidth: 30.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
        specialNotes: [
          'Outdoor storage must be screened',
          'Landscaping required along public roadways',
        ],
      },
      {
        zoneCode: 'IM',
        zoneName: 'Medium Industrial',
        description: 'General industrial, manufacturing, and processing',
        setbacks: {
          front: 6.0,
          rear: 0,
          sideInterior: 0,
          sideCorner: 6.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 20.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 70,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 1500,
          minWidth: 40.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'IH',
        zoneName: 'Heavy Industrial',
        description: 'Heavy industrial, processing, and resource extraction',
        setbacks: {
          front: 15.0,
          rear: 7.5,
          sideInterior: 7.5,
          sideCorner: 15.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 30.0,
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
        specialNotes: [
          'Environmental impact assessment may be required',
          'Buffer zones required adjacent to residential',
        ],
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
        zoneCode: 'R-1',
        zoneName: 'Residential Single Detached',
        description: 'Single detached dwellings',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 11.0,
          maxStoreys: 2,
          unit: 'meters',
          notes: 'Current regulations cap at 11m, under review for increase',
        },
        coverage: {
          maxSiteCoverage: 40,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 400,
          minWidth: 12.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-1N',
        zoneName: 'Residential Single Detached Narrow',
        description: 'Single detached dwellings on narrow lots',
        setbacks: {
          front: 5.5,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 2.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 11.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 300,
          minWidth: 9.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-1U',
        zoneName: 'Residential Single Detached Urban',
        description: 'Urban single detached dwellings',
        setbacks: {
          front: 4.5,
          rear: 7.5,
          sideInterior: 1.2,
          sideCorner: 2.5,
          unit: 'meters',
        },
        height: {
          maxHeight: 11.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 50,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 250,
          minWidth: 8.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'R-2',
        zoneName: 'Residential Two Dwelling',
        description: 'Semi-detached and duplex dwellings',
        setbacks: {
          front: 6.0,
          rear: 7.5,
          sideInterior: 1.5,
          sideCorner: 3.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 11.0,
          maxStoreys: 2,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 45,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 350,
          minWidth: 10.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      // Commercial Zones
      {
        zoneCode: 'C-1',
        zoneName: 'Neighbourhood Commercial',
        description: 'Small-scale neighbourhood commercial',
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
          minArea: 400,
          minWidth: 15.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
      },
      {
        zoneCode: 'C-2',
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
      // Industrial Zones
      {
        zoneCode: 'I-1',
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
          maxHeight: 14.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 65,
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
        zoneCode: 'I-2',
        zoneName: 'General Industrial',
        description: 'General industrial and manufacturing',
        setbacks: {
          front: 10.0,
          rear: 3.0,
          sideInterior: 3.0,
          sideCorner: 10.0,
          unit: 'meters',
        },
        height: {
          maxHeight: 20.0,
          unit: 'meters',
        },
        coverage: {
          maxSiteCoverage: 60,
          unit: 'percent',
        },
        lotRequirements: {
          minArea: 2000,
          minWidth: 40.0,
          areaUnit: 'sqm',
          widthUnit: 'meters',
        },
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
