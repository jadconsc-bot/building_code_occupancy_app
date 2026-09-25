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
  it('fails when a detected bedroom is below the NBC 9.5.2.3 minimum area', () => {
    const result = runCalculatorOrchestrator(
      buildInput({ rooms: [{ label: 'Bedroom 1', occupancyGroup: 'C', areaM2: 6.5 }] }),
      'AB',
    );
    expect(result.findings.find(f => f.issueId === 'OCC-UNIT-001')).toMatchObject({
      severity: 'fail',
      citation: 'NBC 9.5.2.3',
    });
  });

  it('keeps non-Group-C room findings unchanged while producing one unit-level Group C finding', () => {
    const result = runCalculatorOrchestrator(
      buildInput({
        rooms: [
          { label: 'Bedroom 1', occupancyGroup: 'C', areaM2: 10 },
          { label: 'Bedroom 2', occupancyGroup: 'C', areaM2: 12 },
          { label: 'Hallway', occupancyGroup: 'C', areaM2: 8 },
          { label: 'Closet', occupancyGroup: 'C', areaM2: 6 },
          { label: 'Office', occupancyGroup: 'D', spaceType: 'room', areaM2: 46.5 },
          { label: 'Retail', occupancyGroup: 'E', spaceType: 'room', areaM2: 37 },
        ],
      }),
      'AB',
    );

    expect(result.occupantLoad).toHaveLength(3);
    expect(result.occupantLoad[0]).toMatchObject({
      roomLabel: 'Dwelling Unit',
      occupancyGroup: 'C',
      areaM2: 22,
      maxOccupants: 4,
      nbcRef: 'NBC 3.1.17.1 Note (2)',
    });

    expect(result.findings.find(f => f.issueId === 'OCC-UNIT-001')).toMatchObject({
      severity: 'pass',
      description: 'Occupant load — Dwelling unit',
      actual: '2 bedrooms across all dwelling units/suites × 2 persons per bedroom = 4 persons',
      required: '2 persons per bedroom (dwelling units), reduced per NBC 9.5.2.3 where room area is below the 2-person minimum',
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
    expect(groupCConstructionType?.actualAreaM2).toBe(22);
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

    expect(result.occupantLoad).toHaveLength(0);
    expect(result.accessoryOccupantLoad).toHaveLength(2);

    expect(result.findings.find(f => f.issueId === 'OCC-UNIT-001')).toBeUndefined();

    expect(result.summary.totalOccupants).toBe(0);
    expect(result.constructionTypes.find(ct => ct.occupancyGroup === 'C')?.actualAreaM2).toBeUndefined();
  });

  it('reclassifies accessory garage space into the dwelling-unit total when the project is clearly single-unit', () => {
    const result = runCalculatorOrchestrator(
      buildInput({
        rooms: [
          { label: 'MASTER', occupancyGroup: 'C', spaceType: 'room', areaM2: 20 },
          { label: 'DOUBLE GARAGE', occupancyGroup: 'F', spaceType: 'garage', areaM2: 30 },
        ],
        totalDwellingUnits: 1,
      }),
      'AB',
    );

    expect(result.findings.some(f => f.issueId.startsWith('ACC-'))).toBe(false);
    expect(result.occupantLoad).toHaveLength(1);
    expect(result.occupantLoad[0]).toMatchObject({
      roomLabel: 'Dwelling Unit',
      occupancyGroup: 'C',
      areaM2: 20,
      maxOccupants: 2,
    });
    expect(result.findings.find(f => f.issueId === 'OCC-UNIT-001')).toMatchObject({
      actual: '1 bedroom across all dwelling units/suites × 2 persons per bedroom = 2 persons',
    });
    expect(result.constructionTypes.find(ct => ct.occupancyGroup === 'C')?.actualAreaM2).toBe(20);
  });

  it('excludes a garage identified only by its label and uses the storage-garage factor', () => {
    const result = runCalculatorOrchestrator(
      buildInput({
        rooms: [
          { label: 'Bedroom 1', occupancyGroup: 'C', areaM2: 20 },
          { label: 'DOUBLE GARAGE', occupancyGroup: 'F-3', areaM2: 41.4 },
        ],
        totalDwellingUnits: 1,
      }),
      'AB',
    );

    expect(result.summary.totalOccupants).toBe(2);
    expect(result.occupantLoad.find(row => row.roomLabel === 'DOUBLE GARAGE')).toBeUndefined();
    expect(result.accessoryOccupantLoad).toMatchObject([{
      roomLabel: 'DOUBLE GARAGE',
      occupancyGroup: 'Accessory (garage)',
      areaM2PerPerson: 46,
      maxOccupants: 1,
    }]);
    expect(result.findings.find(f => f.description === 'Accessory occupant load — DOUBLE GARAGE')).toMatchObject({
      severity: 'advisory',
      citation: 'NBC 2020 Table 3.1.17.1 (storage garages and aircraft hangars)',
    });
  });

  it('flags accessory garage space for verification when dwelling-unit count is missing', () => {
    const result = runCalculatorOrchestrator(
      buildInput({
        rooms: [
          { label: 'MASTER', occupancyGroup: 'C', spaceType: 'room', areaM2: 20 },
          { label: 'DOUBLE GARAGE', occupancyGroup: 'F', spaceType: 'garage', areaM2: 30 },
        ],
        totalDwellingUnits: undefined,
      }),
      'AB',
    );

    expect(result.findings.find(f => f.issueId === 'ACC-001')).toMatchObject({
      severity: 'advisory',
      description: 'Accessory occupancy verification — DOUBLE GARAGE',
    });
    expect(result.occupantLoad).toHaveLength(1);
    expect(result.occupantLoad[0].areaM2).toBe(20);
    expect(result.accessoryOccupantLoad[0]).toMatchObject({
      roomLabel: 'DOUBLE GARAGE',
      occupancyGroup: 'Accessory (garage)',
      areaM2PerPerson: 46,
    });
    expect(result.constructionTypes.find(ct => ct.occupancyGroup === 'C')?.actualAreaM2).toBe(20);
  });

  it('flags accessory garage space for verification when dwelling-unit count is multi-unit', () => {
    const result = runCalculatorOrchestrator(
      buildInput({
        rooms: [
          { label: 'MASTER', occupancyGroup: 'C', spaceType: 'room', areaM2: 20 },
          { label: 'DOUBLE GARAGE', occupancyGroup: 'F', spaceType: 'garage', areaM2: 30 },
        ],
        totalDwellingUnits: 3,
      }),
      'AB',
    );

    expect(result.findings.find(f => f.issueId === 'ACC-001')).toMatchObject({
      severity: 'advisory',
      description: 'Accessory occupancy verification — DOUBLE GARAGE',
    });
    expect(result.occupantLoad).toHaveLength(1);
    expect(result.occupantLoad[0].areaM2).toBe(20);
    expect(result.accessoryOccupantLoad[0].areaM2PerPerson).toBe(46);
  });

  it('skips accessory reclassification when a room has been manually overridden', () => {
    const result = runCalculatorOrchestrator(
      buildInput({
        rooms: [
          { label: 'MASTER', occupancyGroup: 'C', spaceType: 'room', areaM2: 20 },
          {
            label: 'DOUBLE GARAGE',
            occupancyGroup: 'F',
            spaceType: 'garage',
            manualOverride: true,
            areaM2: 30,
          },
        ],
        totalDwellingUnits: 1,
      }),
      'AB',
    );

    expect(result.occupantLoad).toHaveLength(2);
    expect(result.occupantLoad.find(ol => ol.roomLabel === 'DOUBLE GARAGE')).toMatchObject({
      occupancyGroup: 'F',
      areaM2: 30,
    });
    expect(result.barrierFreeRequirements).toMatchObject({
      occupancyGroups: ['C', 'F'],
      isBarrierFreeRequired: true,
    });
    expect(result.findings.some(f => f.issueId.startsWith('ACC-'))).toBe(false);
    expect(result.findings.some(f => f.description === 'FRR advisory — Group C occupancy')).toBe(true);
  });
});

describe('runCalculatorOrchestrator — barrier-free dwelling-unit exemption', () => {
  const baseGroupCInput = buildInput({
    rooms: [
      { label: 'MASTER', occupancyGroup: 'C', areaM2: 20 },
      { label: 'BDRM#3', occupancyGroup: 'C', areaM2: 15 },
    ],
    storeys: 2,
  });

  it('exempts a single dwelling unit with two or fewer storeys', () => {
    const result = runCalculatorOrchestrator(
      {
        ...baseGroupCInput,
        totalDwellingUnits: 1,
      },
      'AB',
    );

    expect(result.barrierFreeRequirements).toMatchObject({
      isBarrierFreeRequired: false,
      ruleId: 'BF-EXEMPT-3.8.1.1',
      nbcRef: 'NBC 2020 Article 3.8.1.1',
    });
    expect(result.barrierFreeRequirements?.assumptions).toContain(
      'Single/semi-detached/duplex dwelling ≤2 storeys — exempt from NBC Part 3.8 (NBC 3.8.1.1)',
    );
  });

  it('safe-fails when dwelling-unit count is missing', () => {
    const result = runCalculatorOrchestrator(
      {
        ...baseGroupCInput,
        totalDwellingUnits: undefined,
      },
      'AB',
    );

    expect(result.barrierFreeRequirements).toMatchObject({
      isBarrierFreeRequired: true,
      ruleId: 'BF-3.8',
      nbcRef: 'NBC 2020 Part 3.8',
    });

    const nullResult = runCalculatorOrchestrator(
      {
        ...baseGroupCInput,
        totalDwellingUnits: null as unknown as number,
      },
      'AB',
    );

    expect(nullResult.barrierFreeRequirements).toMatchObject({
      isBarrierFreeRequired: true,
      ruleId: 'BF-3.8',
      nbcRef: 'NBC 2020 Part 3.8',
    });
  });

  it('requires compliance for a triplex or larger dwelling-unit count', () => {
    const result = runCalculatorOrchestrator(
      {
        ...baseGroupCInput,
        totalDwellingUnits: 3,
      },
      'AB',
    );

    expect(result.barrierFreeRequirements).toMatchObject({
      isBarrierFreeRequired: true,
      ruleId: 'BF-3.8',
      nbcRef: 'NBC 2020 Part 3.8',
    });
    expect(result.barrierFreeRequirements?.assumptions).toContain(
      'Group C: 3 dwelling units — 1 must be accessible (NBC 3.8.3.3)',
    );
  });
});
