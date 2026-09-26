export interface LintelSpanInput { openingWidthMm: number; wallType: 'exterior' | 'interior' | 'partition'; floorsAbove?: 0 | 1 | 2; supportsRoof?: boolean; species?: 'spf' | 'hem-fir' | 'd-fir'; }
export interface LintelSpanResult { lintelSize: string; lintelType: string; compliant: boolean; loadFactor: number; minBearingMm: number; totalLengthMm: number; weightKg: number | null; }
export function evaluateLintelSpan(input: LintelSpanInput): LintelSpanResult {
  const width = input.openingWidthMm;
  const loadFactor = (input.supportsRoof ? 1 : 0) + (input.floorsAbove ?? 0);
  let lintelSize = ''; let lintelType = ''; let compliant = true;
  if (width <= 1200) {
    if (loadFactor <= 1) { lintelSize = '2 × 38 × 184 mm (2-2×8)'; lintelType = 'Double 2×8'; }
    else if (loadFactor <= 2) { lintelSize = '2 × 38 × 235 mm (2-2×10)'; lintelType = 'Double 2×10'; }
    else { lintelSize = '2 × 38 × 286 mm (2-2×12)'; lintelType = 'Double 2×12'; }
  } else if (width <= 1800) {
    if (loadFactor <= 1) { lintelSize = '2 × 38 × 235 mm (2-2×10)'; lintelType = 'Double 2×10'; }
    else if (loadFactor <= 2) { lintelSize = '2 × 38 × 286 mm (2-2×12)'; lintelType = 'Double 2×12'; }
    else { lintelSize = 'Engineered beam required'; lintelType = 'LVL or Steel'; compliant = false; }
  } else if (width <= 2400) {
    if (loadFactor <= 1) { lintelSize = '2 × 38 × 286 mm (2-2×12)'; lintelType = 'Double 2×12'; }
    else { lintelSize = 'Engineered beam required'; lintelType = 'LVL or Steel'; compliant = false; }
  } else { lintelSize = 'Engineered beam required'; lintelType = 'LVL, Glulam, or Steel'; compliant = false; }
  const minBearingMm = 90; const totalLengthMm = width + 2 * minBearingMm;
  let weightKg: number | null = null;
  if (lintelType.includes('Double')) { const depth = parseInt(lintelSize.match(/\d{3}/)?.[0] || '0'); weightKg = (totalLengthMm / 1000) * (depth / 1000) * 0.076 * 2 * 9.81; }
  return { lintelSize, lintelType, compliant, loadFactor, minBearingMm, totalLengthMm, weightKg };
}
