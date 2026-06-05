export interface AssemblyNote {
  category: string;
  notes: string[];
}

export const ASSEMBLY_DETAIL_DATA: Record<string, AssemblyNote[]> = {

  'W-1': [
    {
      category: 'Framing',
      notes: [
        '2×6 SPF No.2 studs 406 mm (16") O/C max — double top plate at all bearing conditions',
        'Corner assemblies: 3-stud corners or California corner with blocking at 2400 mm intervals for lateral bracing',
        'Headers: LVL or doubled 2× per span table; cripple studs at each side',
      ],
    },
    {
      category: 'Sheathing',
      notes: [
        '7/16" (11 mm) OSB long dimension perpendicular to studs',
        'Nailing: 8d common (3½") at 150 mm O/C edges / 300 mm O/C field, stagger panel joints',
        'Leave 3 mm gap between panels to allow for expansion',
      ],
    },
    {
      category: 'Insulation & Vapour Barrier',
      notes: [
        'R-20 (RSI 3.52) glass fibre friction-fit batt, full-cavity depth — no voids or compression',
        '6-mil polyethylene vapour barrier on warm side; joints lapped 150 mm minimum at studs and sealed with acoustic sealant (NBC 9.25.3)',
        'Seal all electrical/plumbing penetrations through vapour barrier',
      ],
    },
    {
      category: 'Interior Finish',
      notes: [
        '5/8" Type X GWB for fire-rated assemblies, 1/2" GWB for non-rated',
        'Fasten with 1⅝" drywall screws at 300 mm O/C to framing; taper joints perpendicular to studs',
      ],
    },
    {
      category: 'Code References',
      notes: [
        'NBC 9.36.2.2 (effective thermal resistance)', 'NBC 9.25.3 (vapour barrier)', 'NBC 9.23 (wood framing)',
      ],
    },
  ],

  'W-1A': [
    {
      category: 'Framing & Sheathing',
      notes: [
        'Same 2×6 framing and OSB sheathing as W-1',
        'Install continuous 1" (25 mm) XPS rigid insulation over OSB before cladding — R-5 thermal break eliminates framing cold bridges',
      ],
    },
    {
      category: 'Rigid Insulation',
      notes: [
        'Butt XPS boards tight; tape all joints with manufacturer-approved tape for air/vapour continuity',
        'No air/vapour barrier required between OSB and XPS — OSB acts as secondary control layer',
        'Fasten cladding with screws long enough to penetrate minimum 32 mm into studs through XPS + OSB',
      ],
    },
    {
      category: 'Insulation & Vapour Barrier',
      notes: [
        'R-20 batt in cavity — same requirements as W-1',
        '6-mil poly vapour barrier on warm (interior) side of studs, lapped and sealed',
      ],
    },
    {
      category: 'Code References',
      notes: [
        'NECB 2020 Zone 7A Table 3.2.2.2 (walls RSI 3.85 effective)',
        'NBC 9.36.2.2 (effective thermal resistance)',
      ],
    },
  ],

  'W-2': [
    {
      category: 'Framing',
      notes: [
        '2×4 SPF No.2 studs 406 mm (16") O/C — older construction standard or interior bearing partitions',
        'Double top plate; headers per span tables for openings',
      ],
    },
    {
      category: 'Insulation',
      notes: [
        'R-14 (RSI 2.29) glass fibre batt — 89 mm cavity; ensure full-depth installation without gaps',
        '6-mil poly vapour barrier on warm side, sealed at all joints',
      ],
    },
    {
      category: 'Code References',
      notes: ['NBC 9.36 (only meets Zone 4/5 minimum)', 'Not recommended for new construction in Alberta Zones 7A/7B'],
    },
  ],

  'PW-1': [
    {
      category: 'Structural',
      notes: [
        'Two separate rows of 2×4 studs 406 mm O/C on separate bottom plates — 25 mm clear gap between plate rows',
        'Maintain structural independence: no bridging, blocking, or fasteners that span the gap between stud rows',
        'Plates must be anchored independently at floor and ceiling',
      ],
    },
    {
      category: 'Gypsum Board Application — ULC WP3820',
      notes: [
        'Base layer: 5/8" Type X GWB applied horizontally, 6d coated nails at 600 mm O/C — joints staggered minimum 400 mm from face layer joints',
        'Face layer: 5/8" Type X GWB, 8d coated nails at 200 mm O/C — all end joints must occur at framing',
        'All joints taped and finished; use joint compound, not spray texture, in fire-rated conditions',
        'Penetrations (electrical boxes) must be fire-stopped with approved caulk; offset boxes on opposite faces minimum 600 mm horizontally',
      ],
    },
    {
      category: 'Insulation & Sound',
      notes: [
        'R-14 glass fibre batt in one stud row only (sound attenuation, not thermal bridging) — STC 57',
        'Do not fill both rows — maintaining the air gap is critical to the STC and FRR performance',
      ],
    },
    {
      category: 'Code References',
      notes: ['ULC WP3820 / GA WP3820 (2-hour FRR)', 'NBC Table 3.1.3.4 (required FRR by occupancy)', 'STC 55 minimum per NBC 9.11.2'],
    },
  ],

  'FW-1HR': [
    {
      category: 'Framing',
      notes: [
        '2×4 studs 406 mm (16") O/C, continuous from floor to underside of floor/roof assembly above',
        'No insulation required for FRR — thermal performance not a design parameter for this assembly',
      ],
    },
    {
      category: 'Gypsum Board Application — ULC W301',
      notes: [
        '5/8" Type X GWB both faces — single layer each side',
        'Fasteners: 6d coated nails at 300 mm O/C to framing',
        'Joints staggered 400 mm on opposite faces; all joints taped and finished',
        'Penetrations must be fire-stopped per NBC 3.1.9',
      ],
    },
    {
      category: 'Code References',
      notes: ['ULC W301 (1-hour FRR)', 'NBC 9.10.9.7 (suite separation)', 'STC 45 minimum (check if acoustic upgrade required)'],
    },
  ],

  'BW-1': [
    {
      category: 'Concrete Foundation',
      notes: [
        'Apply dampproofing (parging + bituminous coating) to exterior face of concrete before backfilling',
        'Install drainage layer (weeping tile) at footing before interior framing',
      ],
    },
    {
      category: 'Interior Framing',
      notes: [
        '2×4 frame minimum 25 mm clear from concrete face — prevents moisture wicking',
        'Bottom plate: use pressure-treated lumber if concrete-to-wood contact; fasten with concrete anchors at 1200 mm O/C',
        'Seal floor-to-wall joint with acoustic sealant before installing vapour barrier',
      ],
    },
    {
      category: 'Insulation & Vapour Barrier',
      notes: [
        'R-14 batt in cavity; 6-mil poly vapour barrier on warm (interior) side',
        'Lap vapour barrier to floor poly and seal — continuity prevents interstitial condensation',
      ],
    },
    {
      category: 'Code References',
      notes: ['NBC 9.36.2.3 (basement wall minimum)', 'NBC 9.13.3 (dampproofing)', 'NBC 9.25.3 (vapour barrier)'],
    },
  ],

  'BW-2': [
    {
      category: 'Rigid Insulation Strategy',
      notes: [
        '2" (50 mm) XPS continuous against inside face of concrete — R-10 thermal break; no vapour barrier required between XPS and concrete',
        'Tape all XPS joints; ensure continuity with floor XPS insulation at base',
        'Interior 2×4 frame bears on floor slab independently of XPS',
      ],
    },
    {
      category: 'Interior Framing & Insulation',
      notes: [
        'Same framing requirements as BW-1 — PT lumber bottom plate required',
        'R-14 batt in 2×4 cavity; 6-mil poly vapour barrier on warm side',
        'Combined effective RSI: ~3.59 (meets NECB Zone 7A basement wall requirement)',
      ],
    },
    {
      category: 'Code References',
      notes: ['NECB 2020 Zone 7A (basement wall RSI 2.84 effective minimum)', 'NBC 9.36.2.3', 'NBC 9.13.3'],
    },
  ],

  'R-1': [
    {
      category: 'Ceiling Board',
      notes: [
        '1/2" GWB ceiling nailed or screwed to bottom chord of trusses at 400 mm O/C maximum',
        'Install 6-mil poly vapour barrier on top of GWB before blowing insulation; lap and seal all joints',
      ],
    },
    {
      category: 'Insulation',
      notes: [
        'Blown cellulose or glass fibre minimum 280 mm depth (R-40) — verify settled depth with depth gauge tabs',
        'Install Insulshield or ventilation baffles at all eave locations before blowing — maintain 50 mm clear channel from eave soffit to ridge for ventilation continuity (NBC 9.19.1)',
        'Do not block attic hatch area; insulate hatch lid to equivalent RSI',
      ],
    },
    {
      category: 'Ventilation',
      notes: [
        'Provide 1/300 of attic floor area as net-free ventilation area (NBC 9.19.1.1)',
        '40–60% of ventilation at eaves, remainder at ridge or gable ends',
      ],
    },
    {
      category: 'Code References',
      notes: ['NBC 9.36.2.4 (attic/ceiling minimum RSI)', 'NBC 9.19.1 (attic ventilation)', 'NBC 9.25.3 (vapour barrier)'],
    },
  ],

};

export function getAssemblyNotes(presetId: string): AssemblyNote[] | null {
  return ASSEMBLY_DETAIL_DATA[presetId] ?? null;
}
