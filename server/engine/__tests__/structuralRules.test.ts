import { describe, expect, it } from 'vitest';
import { evaluateSnowLoad } from '../rules/snowLoad';
import { evaluateStudSpacing } from '../rules/studSpacing';
import { evaluateLintelSpan } from '../rules/lintelSpan';
import { evaluateFoundationDesign } from '../rules/foundationDesign';

describe('structural calculator engines', () => {
  it('evaluates snow loads and factors', () => {
    const values: Record<string, number> = { calgary: 1.1, edmonton: 1.7, 'red-deer': 1.8, lethbridge: 1.2, 'fort-mcmurray': 1.5, 'grande-prairie': 2.2 };
    for (const [location, Ss] of Object.entries(values)) {
      expect(evaluateSnowLoad({ location: location as any, roofType: 'flat', importance: 'normal', exposure: 'normal' }).Ss).toBe(Ss);
    }
    expect(evaluateSnowLoad({ location: 'calgary', roofType: 'flat', importance: 'normal', exposure: 'exposed' }).Cw).toBe(0.75);
    expect(evaluateSnowLoad({ location: 'calgary', roofType: 'sloped', roofSlopeDegrees: 40, importance: 'normal', exposure: 'normal' }).Cs).toBe(0.75);
    expect(evaluateSnowLoad({ location: 'calgary', roofType: 'sloped', roofSlopeDegrees: 75, importance: 'normal', exposure: 'normal' }).Cs).toBe(0);
  });

  it('evaluates stud spacing brackets and overflow', () => {
    expect(evaluateStudSpacing({ studSize: '38x89', wallHeightMm: 2400, wallType: 'load-bearing' }).maxSpacingMm).toBe(400);
    expect(evaluateStudSpacing({ studSize: '38x140', wallHeightMm: 2700, wallType: 'load-bearing' }).maxSpacingMm).toBe(600);
    expect(evaluateStudSpacing({ studSize: '38x184', wallHeightMm: 3000, wallType: 'load-bearing' }).maxSpacingMm).toBe(600);
    const result = evaluateStudSpacing({ studSize: '38x89', wallHeightMm: 4000, wallType: 'load-bearing' });
    expect(result.maxSpacingMm).toBeNull(); expect(result.compliant).toBe(false);
  });

  it('evaluates lintel width tiers and engineered overflow', () => {
    expect(evaluateLintelSpan({ openingWidthMm: 1200, wallType: 'exterior' }).compliant).toBe(true);
    expect(evaluateLintelSpan({ openingWidthMm: 1800, wallType: 'exterior', floorsAbove: 1 }).compliant).toBe(true);
    expect(evaluateLintelSpan({ openingWidthMm: 2400, wallType: 'exterior', floorsAbove: 0 }).compliant).toBe(true);
    const result = evaluateLintelSpan({ openingWidthMm: 2500, wallType: 'exterior' });
    expect(result.compliant).toBe(false); expect(result.lintelSize).toContain('Engineered beam required');
  });

  it('sizes strip, spread, pier, and leaves helical piles uncomputed', () => {
    const strip = evaluateFoundationDesign({ soilType: 'medium', region: 'calgary', foundationType: 'strip', wallLoadKn: 100, wallLengthM: 10 });
    expect(strip.footingWidth).toBe(400);
    const spread = evaluateFoundationDesign({ soilType: 'medium', region: 'calgary', foundationType: 'spread', pointLoadKn: 100 });
    expect(spread.footingWidth).toBe(1000);
    expect(spread.footingShape).toBe('square');
    expect(spread.footingWidth).not.toBe(600); // old wall-load/length bug produced the spread minimum 600 mm
    const pier = evaluateFoundationDesign({ soilType: 'medium', region: 'calgary', foundationType: 'pier', pointLoadKn: 20 });
    expect(pier.footingShape).toBe('circular'); expect(pier.footingWidth).toBe(600);
    const helical = evaluateFoundationDesign({ soilType: 'medium', region: 'calgary', foundationType: 'helical' });
    expect(helical.computable).toBe(false); expect(helical.caveats[0]).toContain('Helical/screw pile capacity');
    expect(helical.footingWidth).toBeUndefined(); expect(helical.footingThickness).toBeUndefined();
  });
});
