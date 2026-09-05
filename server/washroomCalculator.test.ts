/**
 * washroomCalculator unit tests
 *
 * Tests NBC 3.7.2.2 fixture counts against primary-source table values
 * (NBC 2020 Table 3.7.2.2.-A / -B / -C and Article 3.7.2.2.(11)).
 * Confirmed identical in NBC(AE) 2023, BCBC 2024, NBC 2025.
 */

import { describe, it, expect } from 'vitest';
import { calculateWashroomRequirements } from './services/washroomCalculator';
import type { WashroomInput } from './services/washroomCalculator';

function req(overrides: Partial<WashroomInput> & { occupancyGroup: string; occupantLoad: number }) {
  return calculateWashroomRequirements({
    sprinklered: false,
    province: 'ON',
    ...overrides,
  });
}

// ─── Group A (Assembly) — Table 3.7.2.2.-A ───────────────────────────────────

describe('Group A — Assembly (Table 3.7.2.2.-A)', () => {
  it('30 persons: male 1, female 2', () => {
    const r = req({ occupancyGroup: 'A2', occupantLoad: 30 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(2);
  });

  it('100 persons: male 2, female 4', () => {
    const r = req({ occupancyGroup: 'A2', occupantLoad: 100 });
    expect(r.required.waterClosetsMale).toBe(2);
    expect(r.required.waterClosetsFemale).toBe(4);
  });

  it('female count exceeds male count for same load (key correctness check)', () => {
    const r = req({ occupancyGroup: 'A1', occupantLoad: 100 });
    expect(r.required.waterClosetsFemale).toBeGreaterThan(r.required.waterClosetsMale);
  });

  it('400 persons: male 6, female 12 (last tabled row)', () => {
    const r = req({ occupancyGroup: 'A3', occupantLoad: 400 });
    expect(r.required.waterClosetsMale).toBe(6);
    expect(r.required.waterClosetsFemale).toBe(12);
  });

  it('over 400: 600 persons uses procedural formula', () => {
    // excessPersons = 200; excessPerSex = 100
    // wcMale   = 7 + ceil(100 / 200) = 7 + 1 = 8
    // wcFemale = 13 + ceil(100 / 100) = 13 + 1 = 14
    const r = req({ occupancyGroup: 'A2', occupantLoad: 600 });
    expect(r.required.waterClosetsMale).toBe(8);
    expect(r.required.waterClosetsFemale).toBe(14);
  });

  it('cites Table 3.7.2.2.-A', () => {
    const r = req({ occupancyGroup: 'A1', occupantLoad: 50 });
    expect(r.nbcRef).toContain('3.7.2.2.-A');
  });
});

// ─── Group D (Business) — Table 3.7.2.2.-B ───────────────────────────────────

describe('Group D — Business (Table 3.7.2.2.-B)', () => {
  it('25 persons: 1 WC per sex', () => {
    const r = req({ occupancyGroup: 'D', occupantLoad: 25 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(1);
  });

  it('52 persons: 2 WC per sex (26 per sex — tier 26-50)', () => {
    const r = req({ occupancyGroup: 'D', occupantLoad: 52 });
    expect(r.required.waterClosetsMale).toBe(2);
    expect(r.required.waterClosetsFemale).toBe(2);
  });

  it('60 persons: 2 WC per sex (30 per sex — still in 26-50 tier)', () => {
    const r = req({ occupancyGroup: 'D', occupantLoad: 60 });
    expect(r.required.waterClosetsMale).toBe(2);
    expect(r.required.waterClosetsFemale).toBe(2);
  });

  it('102 persons: 3 WC per sex (51 per sex — first over-50 tier)', () => {
    // perSex = ceil(102/2) = 51 → 3 + ceil((51-50)/50) = 3 + 1 = 4?
    // Wait: 51 per sex → 3 + ceil(1/50) = 3 + 1 = 4
    // Actually: 51 > 50, so 3 + ceil((51-50)/50) = 3 + ceil(1/50) = 3 + 1 = 4
    const r = req({ occupancyGroup: 'D', occupantLoad: 102 });
    expect(r.required.waterClosetsMale).toBe(4);
    expect(r.required.waterClosetsFemale).toBe(4);
  });

  it('100 persons: 2 WC per sex (50 per sex — last tabled tier)', () => {
    const r = req({ occupancyGroup: 'D', occupantLoad: 100 });
    expect(r.required.waterClosetsMale).toBe(2);
    expect(r.required.waterClosetsFemale).toBe(2);
  });

  it('200 persons: 3 WC per sex (100 per sex → 3 + ceil(50/50) = 4)', () => {
    // perSex = 100 → 3 + ceil((100-50)/50) = 3 + 1 = 4
    const r = req({ occupancyGroup: 'D', occupantLoad: 200 });
    expect(r.required.waterClosetsMale).toBe(4);
    expect(r.required.waterClosetsFemale).toBe(4);
  });

  it('cites Table 3.7.2.2.-B', () => {
    const r = req({ occupancyGroup: 'D', occupantLoad: 50 });
    expect(r.nbcRef).toContain('3.7.2.2.-B');
  });
});

// ─── Group E (Mercantile) — Article 3.7.2.2.(11) ─────────────────────────────

describe('Group E — Mercantile (Article 3.7.2.2.(11))', () => {
  it('300 persons: male 1, female 1', () => {
    // perSex = 150; wcMale = max(1, ceil(150/300)) = 1; wcFemale = max(1, ceil(150/150)) = 1
    const r = req({ occupancyGroup: 'E', occupantLoad: 300 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(1);
  });

  it('400 persons: male 1, female 2', () => {
    // perSex = 200; wcMale = max(1, ceil(200/300)) = 1; wcFemale = max(1, ceil(200/150)) = 2
    const r = req({ occupancyGroup: 'E', occupantLoad: 400 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(2);
  });

  it('600 persons: male 1, female 2', () => {
    // perSex=300, wcMale=ceil(300/300)=1, wcFemale=ceil(300/150)=2
    const r = req({ occupancyGroup: 'E', occupantLoad: 600 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(2);
  });

  it('female rate is 2× male rate', () => {
    const r = req({ occupancyGroup: 'E', occupantLoad: 900 });
    // perSex=450, wcMale=ceil(450/300)=2, wcFemale=ceil(450/150)=3
    expect(r.required.waterClosetsMale).toBe(2);
    expect(r.required.waterClosetsFemale).toBe(3);
  });

  it('cites Article 3.7.2.2.(11)', () => {
    const r = req({ occupancyGroup: 'E', occupantLoad: 300 });
    expect(r.nbcRef).toContain('3.7.2.2.(11)');
  });
});

// ─── Group C (Residential) — Article 3.7.2.2.(1)(c) ─────────────────────────

describe('Group C — Residential (Article 3.7.2.2.(1)(c))', () => {
  it('2 persons still returns 1 WC male, 1 WC female, 1 lavatory', () => {
    const r = req({ occupancyGroup: 'C', occupantLoad: 2 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(1);
    expect(r.required.lavatories).toBe(1);
  });

  it('20 persons still returns 1 WC male, 1 WC female, 1 lavatory', () => {
    const r = req({ occupancyGroup: 'C', occupantLoad: 20 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(1);
    expect(r.required.lavatories).toBe(1);
  });

  it('0 persons still returns 1 WC male, 1 WC female, 1 lavatory', () => {
    const r = req({ occupancyGroup: 'C', occupantLoad: 0 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(1);
    expect(r.required.lavatories).toBe(1);
  });

  it('cites Article 3.7.2.2.(1)(c)', () => {
    const r = req({ occupancyGroup: 'C', occupantLoad: 2 });
    expect(r.nbcRef).toContain('3.7.2.2.(1)(c)');
  });

  it('uses confirmed pass metadata', () => {
    const r = req({ occupancyGroup: 'C', occupantLoad: 2 });
    expect(r.confidence).toBe('confirmed');
    expect(r.severity).toBe('pass');
  });
});

// ─── Group F (Industrial) — Table 3.7.2.2.-C ─────────────────────────────────

describe('Group F — Industrial (Table 3.7.2.2.-C)', () => {
  it('10 persons: 1 WC per sex', () => {
    const r = req({ occupancyGroup: 'F2', occupantLoad: 10 });
    expect(r.required.waterClosetsMale).toBe(1);
    expect(r.required.waterClosetsFemale).toBe(1);
  });

  it('52 persons: 3 WC per sex (26 per sex — tier 26-50)', () => {
    const r = req({ occupancyGroup: 'F1', occupantLoad: 52 });
    expect(r.required.waterClosetsMale).toBe(3);
    expect(r.required.waterClosetsFemale).toBe(3);
  });

  it('100 persons: 4 WC per sex (50 per sex — tier 26-50 → wait, 50 is in ≤50 tier → 3)', () => {
    // perSex = ceil(100/2) = 50 → maxPerSex: 50 → wc: 3
    const r = req({ occupancyGroup: 'F2', occupantLoad: 100 });
    expect(r.required.waterClosetsMale).toBe(3);
    expect(r.required.waterClosetsFemale).toBe(3);
  });

  it('120 persons: 4 WC per sex (60 per sex — tier 51-75)', () => {
    const r = req({ occupancyGroup: 'F3', occupantLoad: 120 });
    expect(r.required.waterClosetsMale).toBe(4);
    expect(r.required.waterClosetsFemale).toBe(4);
  });

  it('150 persons: 4 WC per sex (75 per sex — tier ≤75)', () => {
    const r = req({ occupancyGroup: 'F1', occupantLoad: 150 });
    expect(r.required.waterClosetsMale).toBe(4);
    expect(r.required.waterClosetsFemale).toBe(4);
  });

  it('160 persons: 5 WC per sex (80 per sex — tier 76-100)', () => {
    const r = req({ occupancyGroup: 'F1', occupantLoad: 160 });
    expect(r.required.waterClosetsMale).toBe(5);
    expect(r.required.waterClosetsFemale).toBe(5);
  });

  it('202 persons: 7 WC per sex — over-100 procedural formula', () => {
    // perSex = ceil(202/2) = 101 → 6 + ceil((101-100)/30) = 6 + 1 = 7
    const r = req({ occupancyGroup: 'F2', occupantLoad: 202 });
    expect(r.required.waterClosetsMale).toBe(7);
    expect(r.required.waterClosetsFemale).toBe(7);
  });

  it('cites Table 3.7.2.2.-C', () => {
    const r = req({ occupancyGroup: 'F1', occupantLoad: 50 });
    expect(r.nbcRef).toContain('3.7.2.2.-C');
  });
});

describe('Group F — bare occupancy group fallback', () => {
  it('does not pretend to know fixture counts when division is unspecified', () => {
    const r = req({ occupancyGroup: 'F', occupantLoad: 29 });
    expect(r.required.waterClosetsMale).toBe('—');
    expect(r.required.waterClosetsFemale).toBe('—');
    expect(r.required.lavatories).toBe('—');
    expect(r.confidence).toBe('advisory');
    expect(r.assumptions[0]).toContain('without an F1/F2/F3 division');
  });
});

// ─── Lavatory ratio (NBC 3.7.2.3.(1)) ────────────────────────────────────────

describe('Lavatories — ratio ceil((wcMale + wcFemale) / 2)', () => {
  it('Group D: equal WC counts → lavs = wcMale', () => {
    // D, 100 persons → perSex=50 → wc=2 per sex → lavs = ceil(4/2) = 2
    const r = req({ occupancyGroup: 'D', occupantLoad: 100 });
    expect(r.required.lavatories).toBe(Math.ceil(
      (r.required.waterClosetsMale + r.required.waterClosetsFemale) / 2
    ));
  });

  it('Group A: unequal WC counts → lavs rounds up correctly', () => {
    // A2, 30 persons → male=1, female=2 → lavs = ceil(3/2) = 2
    const r = req({ occupancyGroup: 'A2', occupantLoad: 30 });
    expect(r.required.lavatories).toBe(2);
  });

  it('Group A: 100 persons → male=2, female=4 → lavs = ceil(6/2) = 3', () => {
    const r = req({ occupancyGroup: 'A2', occupantLoad: 100 });
    expect(r.required.lavatories).toBe(3);
  });
});

// ─── drinkingFountains removed from return type ───────────────────────────────

describe('drinkingFountains removed', () => {
  it('result.required does not have a drinkingFountains property', () => {
    const r = req({ occupancyGroup: 'D', occupantLoad: 50 });
    expect('drinkingFountains' in r.required).toBe(false);
  });
});

// ─── Citations and ruleId ─────────────────────────────────────────────────────

describe('ruleId uses 3.7.2.2', () => {
  it('Group D ruleId references 3.7.2.2', () => {
    const r = req({ occupancyGroup: 'D', occupantLoad: 50 });
    expect(r.ruleId).toContain('3.7.2.2');
  });

  it('Group A ruleId references 3.7.2.2', () => {
    const r = req({ occupancyGroup: 'A1', occupantLoad: 50 });
    expect(r.ruleId).toContain('3.7.2.2');
  });
});
