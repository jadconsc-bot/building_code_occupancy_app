export type DrawingType =
  | 'residential_multi_unit'
  | 'residential_single_family'
  | 'commercial_office'
  | 'institutional'
  | 'industrial'
  | 'mixed_use'
  | 'auto';

export interface PromptTemplate {
  id: DrawingType;
  label: string;
  description: string;
  fewShotExamples: string;
  systemHints: string;
}

export const PROMPT_LIBRARY: Record<DrawingType, PromptTemplate> = {

  residential_multi_unit: {
    id: 'residential_multi_unit',
    label: 'Residential — Multi-Unit',
    description: 'Apartments, condos, townhouses with multiple dwelling units',
    systemHints: `This is a Canadian multi-unit residential floor plan.
Typical rooms: BEDROOM, BATHROOM, KITCHEN, LIVING, DINING,
VESTIBULE, STORAGE, CORRIDOR, BALCONY, W/R, ENSUITE, DEN,
GREAT ROOM, LAUNDRY, UTILITY, MECHANICAL, STAIR.
Room codes follow pattern: AR-##, e.g. AR-54, AR-103.
Units are labeled: Unit 1, Unit 2, or Unit # BF (barrier-free).
NBC Occupancy: Group C (Residential).
Mixed occupancy possible: mechanical rooms = Group F.`,
    fewShotExamples: `
EXAMPLE DETECTIONS for multi-unit residential:
- Label "BEDROOM AR-54" at pixel (450,820) → {label:"Bedroom AR-54", boundingBox:{x:380,y:750,width:340,height:280}, occupancyGroup:"C", confidence:0.88}
- Label "W/R" at pixel (890,920) → {label:"Washroom", boundingBox:{x:820,y:870,width:160,height:140}, occupancyGroup:"C", confidence:0.82}
- Label "KITCHEN AR-51" at pixel (1200,850) → {label:"Kitchen AR-51", boundingBox:{x:1100,y:780,width:380,height:240}, occupancyGroup:"C", confidence:0.85}
- Label "VESTIBULE AR-30" at pixel (600,1100) → {label:"Vestibule AR-30", boundingBox:{x:540,y:1050,width:180,height:160}, occupancyGroup:"C", confidence:0.80}
- Label "MECHANICAL" at pixel (300,1400) → {label:"Mechanical Room", boundingBox:{x:240,y:1340,width:220,height:200}, occupancyGroup:"F", confidence:0.85}
- Label "CORRIDOR" at pixel (900,1300) → {label:"Corridor", boundingBox:{x:400,y:1250,width:1000,height:120}, occupancyGroup:"C", spaceType:"corridor", confidence:0.78}
`,
  },

  residential_single_family: {
    id: 'residential_single_family',
    label: 'Residential — Single Family',
    description: 'Detached homes, semi-detached, duplexes',
    systemHints: `This is a Canadian single-family residential floor plan.
Typical rooms: MASTER BEDROOM, BEDROOM, ENSUITE, BATHROOM,
KITCHEN, GREAT ROOM, LIVING ROOM, DINING ROOM, FAMILY ROOM,
DEN, STUDY, MUDROOM, FOYER, GARAGE, LAUNDRY, PANTRY, WIC,
MECHANICAL, STORAGE.
NBC Occupancy: Group C (Residential).`,
    fewShotExamples: `
EXAMPLE DETECTIONS for single-family residential:
- Label "MASTER BEDROOM" at pixel (800,400) → {label:"Master Bedroom", boundingBox:{x:680,y:320,width:480,height:380}, occupancyGroup:"C", confidence:0.90}
- Label "ENSUITE" at pixel (1100,380) → {label:"Ensuite", boundingBox:{x:1060,y:320,width:280,height:240}, occupancyGroup:"C", confidence:0.85}
- Label "GREAT ROOM" at pixel (600,900) → {label:"Great Room", boundingBox:{x:400,y:780,width:680,height:480}, occupancyGroup:"C", confidence:0.88}
- Label "GARAGE" at pixel (200,800) → {label:"Garage", boundingBox:{x:80,y:700,width:380,height:480}, occupancyGroup:"F", confidence:0.85}
- Label "DOUBLE GARAGE" at pixel (220,820) → {label:"Garage", boundingBox:{x:90,y:710,width:420,height:500}, occupancyGroup:"F", spaceType:"garage", confidence:0.86}
- Label "CONCRETE DRIVEWAY" at pixel (250,1220) → {label:"Concrete Driveway", boundingBox:{x:100,y:1120,width:920,height:260}, occupancyGroup:"C", spaceType:"exterior", confidence:0.82}
- Label "MUDROOM" at pixel (380,700) → {label:"Mudroom", boundingBox:{x:320,y:650,width:180,height:160}, occupancyGroup:"C", confidence:0.80}
`,
  },

  commercial_office: {
    id: 'commercial_office',
    label: 'Commercial — Office',
    description: 'Office buildings, professional services, clinics',
    systemHints: `This is a Canadian commercial office floor plan.
Typical rooms: OFFICE, OPEN OFFICE, BOARDROOM, MEETING ROOM,
RECEPTION, WAITING, CORRIDOR, WASHROOM, STORAGE, SERVER ROOM,
KITCHEN/BREAK ROOM, COPY ROOM, STAIR, ELEVATOR LOBBY.
NBC Occupancy: Group D (Business & Personal Services).
Washrooms, storage = Group D.
Server/electrical rooms = Group F.`,
    fewShotExamples: `
EXAMPLE DETECTIONS for commercial office:
- Label "OPEN OFFICE" at pixel (800,600) → {label:"Open Office", boundingBox:{x:400,y:400,width:1200,height:680}, occupancyGroup:"D", confidence:0.88}
- Label "BOARDROOM" at pixel (1800,500) → {label:"Boardroom", boundingBox:{x:1680,y:380,width:440,height:380}, occupancyGroup:"D", confidence:0.85}
- Label "RECEPTION" at pixel (600,300) → {label:"Reception", boundingBox:{x:480,y:220,width:380,height:280}, occupancyGroup:"D", confidence:0.87}
- Label "WASHROOM" at pixel (300,800) → {label:"Washroom", boundingBox:{x:240,y:740,width:220,height:200}, occupancyGroup:"D", confidence:0.82}
- Label "SERVER ROOM" at pixel (2000,800) → {label:"Server Room", boundingBox:{x:1940,y:740,width:200,height:200}, occupancyGroup:"F", confidence:0.85}
`,
  },

  institutional: {
    id: 'institutional',
    label: 'Institutional',
    description: 'Schools, hospitals, care facilities, churches',
    systemHints: `This is a Canadian institutional floor plan.
For schools: CLASSROOM, GYMNASIUM, LIBRARY, OFFICE, LAB,
WASHROOM, CORRIDOR, STORAGE, CAFETERIA, AUDITORIUM.
For hospitals: PATIENT ROOM, NURSING STATION, EXAM ROOM,
WAITING, CORRIDOR, STORAGE, MECHANICAL.
NBC Occupancy: Group A (Assembly) for common areas,
Group B (Institutional) for care/treatment areas,
Group D for offices.`,
    fewShotExamples: `
EXAMPLE DETECTIONS for institutional (school):
- Label "CLASSROOM" at pixel (600,500) → {label:"Classroom", boundingBox:{x:480,y:400,width:480,height:380}, occupancyGroup:"A", confidence:0.88}
- Label "GYMNASIUM" at pixel (1400,800) → {label:"Gymnasium", boundingBox:{x:1100,y:600,width:880,height:680}, occupancyGroup:"A", confidence:0.87}
- Label "NURSING STATION" at pixel (900,400) → {label:"Nursing Station", boundingBox:{x:780,y:320,width:380,height:280}, occupancyGroup:"B", confidence:0.88}
`,
  },

  industrial: {
    id: 'industrial',
    label: 'Industrial',
    description: 'Warehouses, manufacturing, laboratories',
    systemHints: `This is a Canadian industrial floor plan.
Typical areas: WAREHOUSE, PRODUCTION, LOADING DOCK,
OFFICE, WASHROOM, LUNCHROOM, MECHANICAL, STORAGE,
LAB, FUME HOOD AREA, CHEMICAL STORAGE.
NBC Occupancy: Group F (Industrial).
Office/lunch areas = Group D.
Lab with fume hoods = Group F-2 (Medium Hazard).
Warehouse/storage = Group F-3 (Low Hazard).`,
    fewShotExamples: `
EXAMPLE DETECTIONS for industrial:
- Label "WAREHOUSE" at pixel (1000,800) → {label:"Warehouse", boundingBox:{x:400,y:400,width:1800,height:1200}, occupancyGroup:"F", confidence:0.88}
- Label "LOADING DOCK" at pixel (200,1200) → {label:"Loading Dock", boundingBox:{x:80,y:1100,width:380,height:280}, occupancyGroup:"F", confidence:0.85}
- Label "LAB" at pixel (1800,400) → {label:"Laboratory", boundingBox:{x:1680,y:320,width:380,height:380}, occupancyGroup:"F", confidence:0.87}
- Label "OFFICE" at pixel (1800,200) → {label:"Office", boundingBox:{x:1680,y:120,width:380,height:280}, occupancyGroup:"D", confidence:0.85}
`,
  },

  mixed_use: {
    id: 'mixed_use',
    label: 'Mixed Use',
    description: 'Retail + residential, office + residential combinations',
    systemHints: `This is a Canadian mixed-use floor plan.
Multiple occupancy groups present on same floor or building.
Ground floor typically: RETAIL, RESTAURANT, LOBBY = Group E or A.
Upper floors typically: RESIDENTIAL UNITS = Group C.
Fire separation REQUIRED between different occupancy groups.
Look carefully for occupancy boundaries.`,
    fewShotExamples: `
EXAMPLE DETECTIONS for mixed-use:
- Label "RETAIL" at pixel (600,800) → {label:"Retail Unit", boundingBox:{x:400,y:600,width:880,height:680}, occupancyGroup:"E", confidence:0.88}
- Label "UNIT 1" at pixel (600,300) → {label:"Residential Unit 1", boundingBox:{x:400,y:200,width:480,height:380}, occupancyGroup:"C", confidence:0.87}
- Label "LOBBY" at pixel (1400,800) → {label:"Lobby", boundingBox:{x:1280,y:700,width:280,height:280}, occupancyGroup:"D", confidence:0.82}
`,
  },

  auto: {
    id: 'auto',
    label: 'Auto-detect',
    description: 'Let AI determine the building type automatically',
    systemHints: '',
    fewShotExamples: '',
  },
};

export function getPromptTemplate(drawingType: DrawingType): PromptTemplate {
  return PROMPT_LIBRARY[drawingType] ?? PROMPT_LIBRARY.auto;
}
