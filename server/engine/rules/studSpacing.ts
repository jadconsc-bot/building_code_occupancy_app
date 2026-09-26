export interface StudSpacingInput {
  studSize: '38x89' | '38x140' | '38x184'; wallHeightMm: number;
  wallType: 'load-bearing' | 'non-load-bearing'; species?: 'spf' | 'hem-fir' | 'd-fir'; grade?: 'no2' | 'no1' | 'select';
}
export interface StudSpacingResult { maxSpacingMm: number | null; compliant: boolean; numStudsFor10mWall: number; gradeNote: string; }
export function evaluateStudSpacing(input: StudSpacingInput): StudSpacingResult {
  const h = input.wallHeightMm;
  const spacingData: Record<string, Record<string, number>> = {
    '38x89': { 'load-bearing': h <= 2400 ? 400 : h <= 2700 ? 300 : 0, 'non-load-bearing': h <= 3000 ? 600 : h <= 3600 ? 400 : 0 },
    '38x140': { 'load-bearing': h <= 2700 ? 600 : h <= 3000 ? 400 : 0, 'non-load-bearing': h <= 3600 ? 600 : h <= 4200 ? 400 : 0 },
    '38x184': { 'load-bearing': h <= 3000 ? 600 : h <= 3600 ? 400 : 0, 'non-load-bearing': h <= 4200 ? 600 : h <= 4800 ? 400 : 0 },
  };
  const spacing = spacingData[input.studSize][input.wallType] || 0;
  const gradeNote = input.grade === 'no2' ? 'No. 2 or better grade required for load-bearing walls' : input.grade === 'no1' ? 'No. 1 grade allows slightly taller walls or wider spacing' : input.grade === 'select' ? 'Select Structural grade provides maximum capacity' : '';
  return { maxSpacingMm: spacing > 0 ? spacing : null, compliant: spacing > 0, numStudsFor10mWall: spacing > 0 ? Math.ceil(10000 / spacing) + 1 : 0, gradeNote };
}
