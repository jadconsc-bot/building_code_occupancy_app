import { describe, it, expect } from 'vitest';
import {
  getPermitsForOccupancy,
  getPermitTypeColor,
  getPermitTypeBgColor,
  permitRequirementsByOccupancy,
  certificateRequirements,
  varianceInfo,
  inspectorPowers,
  ownerResponsibilities,
  appealsInfo
} from '../lib/safetyCodesData';

describe('Safety Codes Data', () => {
  describe('getPermitsForOccupancy', () => {
    it('returns permits for A-1 occupancy', () => {
      const permits = getPermitsForOccupancy('A-1');
      expect(permits.length).toBeGreaterThan(0);
      expect(permits.some(p => p.type === 'building')).toBe(true);
      expect(permits.some(p => p.type === 'electrical')).toBe(true);
      expect(permits.some(p => p.type === 'plumbing')).toBe(true);
    });

    it('returns permits for A-2 occupancy', () => {
      const permits = getPermitsForOccupancy('A-2');
      expect(permits.length).toBeGreaterThan(0);
      expect(permits.some(p => p.type === 'fire')).toBe(true);
    });

    it('returns permits for B-2 hospital occupancy', () => {
      const permits = getPermitsForOccupancy('B-2');
      expect(permits.length).toBeGreaterThan(0);
      // Hospitals should have elevating devices permit
      expect(permits.some(p => p.type === 'elevating')).toBe(true);
    });

    it('returns permits for C residential occupancy', () => {
      const permits = getPermitsForOccupancy('C');
      expect(permits.length).toBeGreaterThan(0);
      expect(permits.some(p => p.type === 'building')).toBe(true);
    });

    it('returns permits for C-secondary (secondary suite) occupancy', () => {
      const permits = getPermitsForOccupancy('C-secondary');
      expect(permits.length).toBeGreaterThan(0);
      expect(permits.some(p => p.name.includes('Fire Separation'))).toBe(true);
    });

    it('handles case-insensitive occupancy codes', () => {
      const permitsLower = getPermitsForOccupancy('a-1');
      const permitsUpper = getPermitsForOccupancy('A-1');
      expect(permitsLower.length).toBe(permitsUpper.length);
    });

    it('handles secondary suite variations', () => {
      const permits = getPermitsForOccupancy('C (Secondary Suite)');
      expect(permits.length).toBeGreaterThan(0);
    });

    it('returns default permits for unknown occupancy', () => {
      const permits = getPermitsForOccupancy('UNKNOWN');
      expect(permits.length).toBeGreaterThan(0);
    });
  });

  describe('getPermitTypeColor', () => {
    it('returns correct color for building permits', () => {
      expect(getPermitTypeColor('building')).toContain('blue');
    });

    it('returns correct color for electrical permits', () => {
      expect(getPermitTypeColor('electrical')).toContain('yellow');
    });

    it('returns correct color for plumbing permits', () => {
      expect(getPermitTypeColor('plumbing')).toContain('cyan');
    });

    it('returns correct color for gas permits', () => {
      expect(getPermitTypeColor('gas')).toContain('orange');
    });

    it('returns correct color for fire permits', () => {
      expect(getPermitTypeColor('fire')).toContain('red');
    });

    it('returns correct color for elevating permits', () => {
      expect(getPermitTypeColor('elevating')).toContain('purple');
    });
  });

  describe('getPermitTypeBgColor', () => {
    it('returns background color for building permits', () => {
      expect(getPermitTypeBgColor('building')).toContain('blue');
    });

    it('returns background color for electrical permits', () => {
      expect(getPermitTypeBgColor('electrical')).toContain('yellow');
    });
  });

  describe('permitRequirementsByOccupancy', () => {
    it('has permits defined for all major occupancy types', () => {
      expect(permitRequirementsByOccupancy['A-1']).toBeDefined();
      expect(permitRequirementsByOccupancy['A-2']).toBeDefined();
      expect(permitRequirementsByOccupancy['A-3']).toBeDefined();
      expect(permitRequirementsByOccupancy['A-4']).toBeDefined();
      expect(permitRequirementsByOccupancy['B-1']).toBeDefined();
      expect(permitRequirementsByOccupancy['B-2']).toBeDefined();
      expect(permitRequirementsByOccupancy['B-3']).toBeDefined();
      expect(permitRequirementsByOccupancy['C']).toBeDefined();
      expect(permitRequirementsByOccupancy['D']).toBeDefined();
      expect(permitRequirementsByOccupancy['E']).toBeDefined();
      expect(permitRequirementsByOccupancy['F-1']).toBeDefined();
      expect(permitRequirementsByOccupancy['F-2']).toBeDefined();
      expect(permitRequirementsByOccupancy['F-3']).toBeDefined();
    });

    it('each permit has required fields', () => {
      Object.values(permitRequirementsByOccupancy).forEach(permits => {
        permits.forEach(permit => {
          expect(permit.type).toBeDefined();
          expect(permit.name).toBeDefined();
          expect(permit.description).toBeDefined();
          expect(typeof permit.required).toBe('boolean');
          expect(permit.codeReference).toBeDefined();
        });
      });
    });

    it('each permit has inspection stages', () => {
      Object.values(permitRequirementsByOccupancy).forEach(permits => {
        permits.forEach(permit => {
          if (permit.inspectionStages) {
            expect(Array.isArray(permit.inspectionStages)).toBe(true);
            expect(permit.inspectionStages.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe('certificateRequirements', () => {
    it('has certificate requirements defined', () => {
      expect(certificateRequirements.length).toBeGreaterThan(0);
    });

    it('includes electrician certificate', () => {
      expect(certificateRequirements.some(c => c.trade === 'Electrician')).toBe(true);
    });

    it('includes plumber certificate', () => {
      expect(certificateRequirements.some(c => c.trade === 'Plumber')).toBe(true);
    });

    it('includes gas fitter certificate', () => {
      expect(certificateRequirements.some(c => c.trade === 'Gas Fitter')).toBe(true);
    });

    it('each certificate has required fields', () => {
      certificateRequirements.forEach(cert => {
        expect(cert.trade).toBeDefined();
        expect(cert.certificateType).toBeDefined();
        expect(cert.description).toBeDefined();
        expect(Array.isArray(cert.requiredFor)).toBe(true);
        expect(cert.codeReference).toBeDefined();
      });
    });
  });

  describe('varianceInfo', () => {
    it('has variance information defined', () => {
      expect(varianceInfo).toBeDefined();
      expect(varianceInfo.title).toBeDefined();
      expect(varianceInfo.description).toBeDefined();
    });

    it('has process steps', () => {
      expect(Array.isArray(varianceInfo.process)).toBe(true);
      expect(varianceInfo.process.length).toBeGreaterThan(0);
    });

    it('has requirements', () => {
      expect(Array.isArray(varianceInfo.requirements)).toBe(true);
      expect(varianceInfo.requirements.length).toBeGreaterThan(0);
    });

    it('has code reference', () => {
      expect(varianceInfo.codeReference).toContain('Section 38');
    });
  });

  describe('inspectorPowers', () => {
    it('has inspector powers defined', () => {
      expect(inspectorPowers.length).toBeGreaterThan(0);
    });

    it('includes entry power', () => {
      expect(inspectorPowers.some(p => p.power.includes('Entry'))).toBe(true);
    });

    it('includes inspection power', () => {
      expect(inspectorPowers.some(p => p.power.includes('Inspection'))).toBe(true);
    });

    it('each power has required fields', () => {
      inspectorPowers.forEach(power => {
        expect(power.power).toBeDefined();
        expect(power.description).toBeDefined();
        expect(power.codeReference).toBeDefined();
      });
    });
  });

  describe('ownerResponsibilities', () => {
    it('has owner responsibilities defined', () => {
      expect(ownerResponsibilities.length).toBeGreaterThan(0);
    });

    it('includes provide assistance responsibility', () => {
      expect(ownerResponsibilities.some(r => r.responsibility.includes('Assistance'))).toBe(true);
    });

    it('each responsibility has required fields', () => {
      ownerResponsibilities.forEach(resp => {
        expect(resp.responsibility).toBeDefined();
        expect(resp.description).toBeDefined();
        expect(resp.codeReference).toBeDefined();
      });
    });
  });

  describe('appealsInfo', () => {
    it('has appeals information defined', () => {
      expect(appealsInfo.length).toBeGreaterThan(0);
    });

    it('includes appeal of orders', () => {
      expect(appealsInfo.some(a => a.type.includes('Orders'))).toBe(true);
    });

    it('includes appeal of permit refusal', () => {
      expect(appealsInfo.some(a => a.type.includes('Permit'))).toBe(true);
    });

    it('each appeal has required fields', () => {
      appealsInfo.forEach(appeal => {
        expect(appeal.type).toBeDefined();
        expect(appeal.description).toBeDefined();
        expect(appeal.timeline).toBeDefined();
        expect(Array.isArray(appeal.process)).toBe(true);
        expect(appeal.codeReference).toBeDefined();
      });
    });

    it('all appeals have 30-day timeline', () => {
      appealsInfo.forEach(appeal => {
        expect(appeal.timeline).toContain('30 days');
      });
    });
  });
});
