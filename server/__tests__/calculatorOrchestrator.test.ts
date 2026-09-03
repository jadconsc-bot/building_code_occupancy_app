import { describe, expect, it } from 'vitest';
import { runCalculatorOrchestrator } from '../services/calculatorOrchestrator';

function buildInput(overrides: Partial<Parameters<typeof runCalculatorOrchestrator>[0]> = {}) {
  return {
    rooms: [],
    windows: [],
    travelDistanceResults: [],
    storeys: 1,
    sprinklered: false,
    province: 'AB',
    calibrationConfidence: 'high' as const,
    ...overrides,
  };
}

describe('runCalculatorOrchestrator — Group C dwelling unit occupant load', () => {
  it('keeps non-Group-C room findings unchanged while producing one unit-level Group C finding', () => {
    const result = runCalculatorOrchestrator(
      buildInput({
        rooms: [
          { label: 'Bedroom 1', occupancyGroup: 'C', areaM2: 10 },
          { label: 'Bedroom 2', occupancyGroup: 'C', areaM2: 12 },
          { label: 'Hallway', occupancyGroup: 'C', areaM2: 8 },
          { label: 'Closet', occupancyGroup: 'C', areaM2: 6 },
          { label: 'Office', occupancyGroup: 'D', areaM2: 46.5 },
          { label: 'Retail', occupancyGroup: 'E', areaM2: 37 },
        ],
      }),
      'AB',
    );

    expect(result.occupantLoad).toHaveLength(3);
    expect(result.occupantLoad[0]).toMatchObject({
      roomLabel: 'Dwelling Unit',
      occupancyGroup: 'C',
      areaM2: 36,
      maxOccupants: 4,
      nbcRef: 'NBC 3.1.17.1 Note (2)',
    });

    expect(result.findings.find(f => f.issueId === 'OCC-UNIT-001')).toMatchObject({
      severity: 'pass',
      description: 'Occupant load — Dwelling unit',
      actual: 'Total area: 36.0 m² — 2 bedrooms identified × 2 persons/bedroom = 4 persons',
      required: '2 persons per bedroom (dwelling units)',
      citation: 'NBC 3.1.17.1 Note (2)',
    });

    expect(result.findings.find(f => f.issueId === 'OCC-005')).toMatchObject({
      severity: 'pass',
      description: 'Occupant load — Office',
      actual: '46.5 m² ÷ 4.6 m²/p = 11 persons',
      required: 'Group D conservative default 4.6 m²/p',
    });

    expect(result.findings.find(f => f.issueId === 'OCC-006')).toMatchObject({
      severity: 'pass',
      description: 'Occupant load — Retail',
      actual: '37.0 m² ÷ 3.7 m²/p = 10 persons',
      required: 'Group E conservative default 3.7 m²/p',
    });

    const groupCConstructionType = result.constructionTypes.find(ct => ct.occupancyGroup === 'C');
    expect(groupCConstructionType?.actualAreaM2).toBe(36);
    expect(result.summary.totalOccupants).toBe(25);
  });

  it('uses the advisory path when Group C rooms contain no bedroom-labeled rooms', () => {
    const result = runCalculatorOrchestrator(
      buildInput({
        rooms: [
          { label: 'Hallway', occupancyGroup: 'C', areaM2: 10 },
          { label: 'Closet', occupancyGroup: 'C', areaM2: 4 },
        ],
      }),
      'AB',
    );

    expect(result.occupantLoad).toHaveLength(1);
    expect(result.occupantLoad[0]).toMatchObject({
      roomLabel: 'Dwelling Unit',
      occupancyGroup: 'C',
      areaM2: 14,
      maxOccupants: 0,
      nbcRef: 'NBC 3.1.17.1 Note (2)',
    });

    expect(result.findings.find(f => f.issueId === 'OCC-UNIT-001')).toMatchObject({
      severity: 'advisory',
      description: 'Occupant load — Dwelling unit',
      actual: 'Total area: 14.0 m² — no bedroom-labeled rooms detected among Group C spaces; occupant count could not be determined',
      required: 'Verify bedroom count and occupancy classification — NBC 3.1.17.1 Note (2) requires 2 persons/bedroom for dwelling units',
      citation: 'NBC 3.1.17.1 Note (2)',
    });

    expect(result.summary.totalOccupants).toBe(0);
    expect(result.constructionTypes.find(ct => ct.occupancyGroup === 'C')?.actualAreaM2).toBe(14);
  });
});
