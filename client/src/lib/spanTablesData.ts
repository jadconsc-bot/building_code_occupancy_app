// Span Tables for Structural Lumber (Based on NBC 2020 Part 9, Span Tables)
// Maximum spans for floor joists, ceiling joists, and rafters

export interface SpanData {
  size: string;
  spacing: number; // mm (305, 406, 610)
  span: number; // mm
}

export interface SpanTable {
  species: string;
  grade: string;
  application: 'floor' | 'ceiling' | 'roof';
  data: SpanData[];
}

// Spruce-Pine-Fir (S-P-F) - Most common in Alberta
export const spanTables: SpanTable[] = [
  // Floor Joists - S-P-F No. 1/No. 2
  {
    species: 'S-P-F',
    grade: 'No. 1/No. 2',
    application: 'floor',
    data: [
      // 2x8
      { size: '2x8', spacing: 305, span: 4010 },
      { size: '2x8', spacing: 406, span: 3650 },
      { size: '2x8', spacing: 610, span: 3200 },
      // 2x10
      { size: '2x10', spacing: 305, span: 5120 },
      { size: '2x10', spacing: 406, span: 4650 },
      { size: '2x10', spacing: 610, span: 4080 },
      // 2x12
      { size: '2x12', spacing: 305, span: 6200 },
      { size: '2x12', spacing: 406, span: 5630 },
      { size: '2x12', spacing: 610, span: 4940 },
    ],
  },
  // Ceiling Joists - S-P-F No. 1/No. 2
  {
    species: 'S-P-F',
    grade: 'No. 1/No. 2',
    application: 'ceiling',
    data: [
      // 2x4
      { size: '2x4', spacing: 305, span: 3350 },
      { size: '2x4', spacing: 406, span: 3050 },
      { size: '2x4', spacing: 610, span: 2670 },
      // 2x6
      { size: '2x6', spacing: 305, span: 5260 },
      { size: '2x6', spacing: 406, span: 4780 },
      { size: '2x6', spacing: 610, span: 4190 },
      // 2x8
      { size: '2x8', spacing: 305, span: 6930 },
      { size: '2x8', spacing: 406, span: 6300 },
      { size: '2x8', spacing: 610, span: 5520 },
      // 2x10
      { size: '2x10', spacing: 305, span: 8840 },
      { size: '2x10', spacing: 406, span: 8030 },
      { size: '2x10', spacing: 610, span: 7050 },
    ],
  },
  // Roof Rafters - S-P-F No. 1/No. 2 (Snow Load 2.0 kPa)
  {
    species: 'S-P-F',
    grade: 'No. 1/No. 2',
    application: 'roof',
    data: [
      // 2x6
      { size: '2x6', spacing: 305, span: 4490 },
      { size: '2x6', spacing: 406, span: 4080 },
      { size: '2x6', spacing: 610, span: 3580 },
      // 2x8
      { size: '2x8', spacing: 305, span: 5920 },
      { size: '2x8', spacing: 406, span: 5380 },
      { size: '2x8', spacing: 610, span: 4720 },
      // 2x10
      { size: '2x10', spacing: 305, span: 7550 },
      { size: '2x10', spacing: 406, span: 6860 },
      { size: '2x10', spacing: 610, span: 6020 },
      // 2x12
      { size: '2x12', spacing: 305, span: 9140 },
      { size: '2x12', spacing: 406, span: 8310 },
      { size: '2x12', spacing: 610, span: 7290 },
    ],
  },
  // Floor Joists - D.Fir-L (Douglas Fir-Larch) No. 1/No. 2
  {
    species: 'D.Fir-L',
    grade: 'No. 1/No. 2',
    application: 'floor',
    data: [
      // 2x8
      { size: '2x8', spacing: 305, span: 4270 },
      { size: '2x8', spacing: 406, span: 3880 },
      { size: '2x8', spacing: 610, span: 3400 },
      // 2x10
      { size: '2x10', spacing: 305, span: 5450 },
      { size: '2x10', spacing: 406, span: 4950 },
      { size: '2x10', spacing: 610, span: 4340 },
      // 2x12
      { size: '2x12', spacing: 305, span: 6600 },
      { size: '2x12', spacing: 406, span: 5990 },
      { size: '2x12', spacing: 610, span: 5260 },
    ],
  },
];

export const spanTableNotes = [
  'Spans are based on NBC 2020 Part 9 Span Tables',
  'Floor joists assume 1.9 kPa live load + 0.5 kPa dead load',
  'Ceiling joists assume no attic storage (0.5 kPa)',
  'Roof rafters assume 2.0 kPa snow load (typical for Calgary/Edmonton)',
  'Actual spans may vary based on specific loading conditions',
  'Consult a structural engineer for complex or non-standard applications',
  'Spacing: 305mm = 12", 406mm = 16", 610mm = 24"',
];

export const applications = [
  { value: 'floor', label: 'Floor Joists' },
  { value: 'ceiling', label: 'Ceiling Joists' },
  { value: 'roof', label: 'Roof Rafters' },
];

export const species = [
  { value: 'S-P-F', label: 'Spruce-Pine-Fir (S-P-F)' },
  { value: 'D.Fir-L', label: 'Douglas Fir-Larch (D.Fir-L)' },
];

export const grades = [
  { value: 'No. 1/No. 2', label: 'No. 1/No. 2' },
];

export const spacings = [
  { value: 305, label: '12" (305mm)' },
  { value: 406, label: '16" (406mm)' },
  { value: 610, label: '24" (610mm)' },
];
