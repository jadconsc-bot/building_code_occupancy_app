export interface AssemblyLayer {
  id: string;
  name: string;
  thicknessMm: number;
  rsi: number;
  material: 'cladding' | 'sheathing' | 'insulation_batt' |
            'insulation_rigid' | 'vapour_barrier' | 'drywall' |
            'air_gap' | 'framing' | 'concrete' | 'membrane';
  note?: string;
}

export interface WallAssemblyPreset {
  id: string;
  name: string;
  code: string;
  description: string;
  applicableZones: string[];
  totalRSI: number;
  ulcRef?: string;
  nbcRef?: string;
  layers: AssemblyLayer[];
  assemblyType: 'wall' | 'roof' | 'floor' | 'basement';
  isBearingWall: boolean;
  studSpacingMm?: number;
  fireFRR?: string;
  stcRating?: number;
}

export const WALL_ASSEMBLY_PRESETS: WallAssemblyPreset[] = [

  // ── EXTERIOR WALLS ──────────────────────────────────────────────────────────

  {
    id: 'W-1',
    code: 'W-1',
    name: 'Standard 2×6 Exterior Wall',
    description: 'Typical Alberta exterior wall — 2×6 wood studs 16" O/C with batt insulation',
    applicableZones: ['zone6', 'zone7a', 'zone7b'],
    assemblyType: 'wall',
    isBearingWall: true,
    studSpacingMm: 400,
    totalRSI: 3.87,
    nbcRef: 'NBC 9.36',
    layers: [
      { id: 'w1-1', name: 'Exterior cladding (vinyl/wood)', thicknessMm: 12,  rsi: 0.11, material: 'cladding' },
      { id: 'w1-2', name: 'Building paper / housewrap',     thicknessMm: 2,   rsi: 0.06, material: 'membrane' },
      { id: 'w1-3', name: '7/16" OSB sheathing',            thicknessMm: 11,  rsi: 0.10, material: 'sheathing' },
      { id: 'w1-4', name: '2×6 stud cavity — R20 batt',    thicknessMm: 140, rsi: 3.52, material: 'insulation_batt', note: 'R20 glass fibre batt' },
      { id: 'w1-5', name: 'Polyethylene vapour barrier',    thicknessMm: 0,   rsi: 0.00, material: 'vapour_barrier' },
      { id: 'w1-6', name: '5/8" Type X gypsum board',       thicknessMm: 16,  rsi: 0.08, material: 'drywall' },
    ],
  },

  {
    id: 'W-1A',
    code: 'W-1A',
    name: '2×6 Exterior Wall + Rigid Insulation',
    description: '2×6 studs 16" O/C with R20 batt + 1" rigid exterior insulation — meets NECB Zone 7A',
    applicableZones: ['zone6', 'zone7a', 'zone7b'],
    assemblyType: 'wall',
    isBearingWall: true,
    studSpacingMm: 400,
    totalRSI: 4.93,
    nbcRef: 'NBC 9.36 / NECB Zone 7A',
    layers: [
      { id: 'w1a-1', name: 'Exterior cladding',             thicknessMm: 12,  rsi: 0.11, material: 'cladding' },
      { id: 'w1a-2', name: '1" rigid insulation (XPS)',      thicknessMm: 25,  rsi: 0.88, material: 'insulation_rigid', note: 'R5 XPS board' },
      { id: 'w1a-3', name: 'Building paper / housewrap',     thicknessMm: 2,   rsi: 0.06, material: 'membrane' },
      { id: 'w1a-4', name: '7/16" OSB sheathing',            thicknessMm: 11,  rsi: 0.10, material: 'sheathing' },
      { id: 'w1a-5', name: '2×6 stud cavity — R20 batt',    thicknessMm: 140, rsi: 3.52, material: 'insulation_batt' },
      { id: 'w1a-6', name: 'Polyethylene vapour barrier',    thicknessMm: 0,   rsi: 0.00, material: 'vapour_barrier' },
      { id: 'w1a-7', name: '5/8" Type X gypsum board',       thicknessMm: 16,  rsi: 0.08, material: 'drywall' },
    ],
  },

  {
    id: 'W-2',
    code: 'W-2',
    name: '2×4 Exterior Wall',
    description: '2×4 wood studs 16" O/C with R14 batt — older construction / interior partitions',
    applicableZones: ['zone4', 'zone5'],
    assemblyType: 'wall',
    isBearingWall: true,
    studSpacingMm: 400,
    totalRSI: 2.64,
    nbcRef: 'NBC 9.36',
    layers: [
      { id: 'w2-1', name: 'Exterior cladding',           thicknessMm: 12,  rsi: 0.11, material: 'cladding' },
      { id: 'w2-2', name: 'Building paper',               thicknessMm: 2,   rsi: 0.06, material: 'membrane' },
      { id: 'w2-3', name: '7/16" OSB sheathing',          thicknessMm: 11,  rsi: 0.10, material: 'sheathing' },
      { id: 'w2-4', name: '2×4 stud cavity — R14 batt',  thicknessMm: 89,  rsi: 2.29, material: 'insulation_batt', note: 'R14 glass fibre batt' },
      { id: 'w2-5', name: 'Polyethylene vapour barrier',  thicknessMm: 0,   rsi: 0.00, material: 'vapour_barrier' },
      { id: 'w2-6', name: '1/2" gypsum board',            thicknessMm: 13,  rsi: 0.08, material: 'drywall' },
    ],
  },

  // ── PARTY WALLS / FIRE RATED ────────────────────────────────────────────────

  {
    id: 'PW-1',
    code: 'PW-1',
    name: '2-Hour Party Wall — Double Stud',
    description: 'Double row 2×4 studs on separate plates 1" apart, 5/8" Type X GWB base + face layer both sides. ULC WP3820.',
    applicableZones: ['zone4', 'zone5', 'zone6', 'zone7a', 'zone7b', 'zone8'],
    assemblyType: 'wall',
    isBearingWall: true,
    studSpacingMm: 400,
    totalRSI: 1.84,
    ulcRef: 'ULC WP3820 / GA WP3820',
    nbcRef: 'NBC Table 3.1.3.4',
    fireFRR: '2hr',
    stcRating: 57,
    layers: [
      { id: 'pw1-1', name: '5/8" Type X GWB — face layer', thicknessMm: 16, rsi: 0.08, material: 'drywall', note: '8d coated nails 8" O/C' },
      { id: 'pw1-2', name: '5/8" Type X GWB — base layer', thicknessMm: 16, rsi: 0.08, material: 'drywall', note: '6d coated nails 24" O/C' },
      { id: 'pw1-3', name: '2×4 stud row 1 (16" O/C)',     thicknessMm: 89, rsi: 0.00, material: 'framing' },
      { id: 'pw1-4', name: '1" air gap between plates',     thicknessMm: 25, rsi: 0.16, material: 'air_gap' },
      { id: 'pw1-5', name: '3-1/2" glass fibre insulation', thicknessMm: 89, rsi: 2.29, material: 'insulation_batt', note: 'Sound attenuation — one side only' },
      { id: 'pw1-6', name: '2×4 stud row 2 (16" O/C)',     thicknessMm: 89, rsi: 0.00, material: 'framing' },
      { id: 'pw1-7', name: '5/8" Type X GWB — base layer', thicknessMm: 16, rsi: 0.08, material: 'drywall' },
      { id: 'pw1-8', name: '5/8" Type X GWB — face layer', thicknessMm: 16, rsi: 0.08, material: 'drywall' },
    ],
  },

  {
    id: 'FW-1HR',
    code: 'FW-1HR',
    name: '1-Hour Fire Wall — Single Stud',
    description: '2×4 studs 16" O/C, single layer 5/8" Type X GWB both sides. Common suite/dwelling separation.',
    applicableZones: ['zone4', 'zone5', 'zone6', 'zone7a', 'zone7b', 'zone8'],
    assemblyType: 'wall',
    isBearingWall: true,
    studSpacingMm: 400,
    totalRSI: 0.89,
    ulcRef: 'ULC W301',
    nbcRef: 'NBC 9.10.9.7',
    fireFRR: '1hr',
    stcRating: 45,
    layers: [
      { id: 'fw1-1', name: '5/8" Type X GWB',  thicknessMm: 16, rsi: 0.08, material: 'drywall' },
      { id: 'fw1-2', name: '2×4 stud cavity',  thicknessMm: 89, rsi: 0.16, material: 'framing' },
      { id: 'fw1-3', name: '5/8" Type X GWB',  thicknessMm: 16, rsi: 0.08, material: 'drywall' },
    ],
  },

  // ── BASEMENT WALLS ──────────────────────────────────────────────────────────

  {
    id: 'BW-1',
    code: 'BW-1',
    name: 'Insulated Basement Wall — Interior Frame',
    description: '10" poured concrete + 2×4 interior frame with R14 batt insulation',
    applicableZones: ['zone6', 'zone7a', 'zone7b'],
    assemblyType: 'basement',
    isBearingWall: true,
    totalRSI: 2.71,
    nbcRef: 'NBC 9.36',
    layers: [
      { id: 'bw1-1', name: '10" poured concrete wall',    thicknessMm: 254, rsi: 0.12, material: 'concrete' },
      { id: 'bw1-2', name: 'Dampproofing membrane',        thicknessMm: 2,   rsi: 0.00, material: 'membrane' },
      { id: 'bw1-3', name: '2×4 interior frame (16" O/C)', thicknessMm: 89,  rsi: 0.00, material: 'framing' },
      { id: 'bw1-4', name: 'R14 batt insulation',          thicknessMm: 89,  rsi: 2.29, material: 'insulation_batt' },
      { id: 'bw1-5', name: 'Polyethylene vapour barrier',  thicknessMm: 0,   rsi: 0.00, material: 'vapour_barrier' },
      { id: 'bw1-6', name: '1/2" gypsum board',            thicknessMm: 13,  rsi: 0.08, material: 'drywall' },
    ],
  },

  {
    id: 'BW-2',
    code: 'BW-2',
    name: 'High-Performance Basement Wall',
    description: '10" concrete + 2" rigid XPS + 2×4 frame with R14 batt — meets NECB Zone 7A basement wall requirement',
    applicableZones: ['zone6', 'zone7a', 'zone7b', 'zone8'],
    assemblyType: 'basement',
    isBearingWall: true,
    totalRSI: 3.59,
    nbcRef: 'NECB Zone 7A',
    layers: [
      { id: 'bw2-1', name: '10" poured concrete wall',    thicknessMm: 254, rsi: 0.12, material: 'concrete' },
      { id: 'bw2-2', name: '2" rigid XPS insulation',      thicknessMm: 50,  rsi: 1.76, material: 'insulation_rigid', note: 'R10 XPS, continuous' },
      { id: 'bw2-3', name: '2×4 interior frame (16" O/C)', thicknessMm: 89,  rsi: 0.00, material: 'framing' },
      { id: 'bw2-4', name: 'R14 batt insulation',          thicknessMm: 89,  rsi: 2.29, material: 'insulation_batt' },
      { id: 'bw2-5', name: 'Polyethylene vapour barrier',  thicknessMm: 0,   rsi: 0.00, material: 'vapour_barrier' },
      { id: 'bw2-6', name: '1/2" gypsum board',            thicknessMm: 13,  rsi: 0.08, material: 'drywall' },
    ],
  },

  // ── ROOFS / CEILINGS ─────────────────────────────────────────────────────────

  {
    id: 'R-1',
    code: 'R-1',
    name: 'Standard Attic Ceiling — R40',
    description: 'Flat ceiling with blown-in insulation above — typical Alberta residential',
    applicableZones: ['zone6', 'zone7a', 'zone7b'],
    assemblyType: 'roof',
    isBearingWall: false,
    totalRSI: 7.22,
    nbcRef: 'NBC 9.36',
    layers: [
      { id: 'r1-1', name: '1/2" gypsum board',             thicknessMm: 13,  rsi: 0.08, material: 'drywall' },
      { id: 'r1-2', name: 'Vapour barrier',                 thicknessMm: 0,   rsi: 0.00, material: 'vapour_barrier' },
      { id: 'r1-3', name: 'R40 blown cellulose/fibreglass', thicknessMm: 280, rsi: 7.04, material: 'insulation_batt', note: 'R40 minimum Alberta' },
      { id: 'r1-4', name: 'Ventilated attic space',         thicknessMm: 0,   rsi: 0.10, material: 'air_gap' },
    ],
  },

];

export function getPresetById(id: string): WallAssemblyPreset | undefined {
  return WALL_ASSEMBLY_PRESETS.find(p => p.id === id);
}

export function getPresetsByType(
  assemblyType: WallAssemblyPreset['assemblyType'] | string
): WallAssemblyPreset[] {
  if (assemblyType === 'wall') {
    return WALL_ASSEMBLY_PRESETS.filter(p => p.assemblyType === 'wall' || p.assemblyType === 'basement');
  }
  return WALL_ASSEMBLY_PRESETS.filter(p => p.assemblyType === assemblyType);
}

export function getPresetsByZone(zone: string): WallAssemblyPreset[] {
  return WALL_ASSEMBLY_PRESETS.filter(p => p.applicableZones.includes(zone));
}

export function getFireRatedPresets(): WallAssemblyPreset[] {
  return WALL_ASSEMBLY_PRESETS.filter(p => p.fireFRR);
}
