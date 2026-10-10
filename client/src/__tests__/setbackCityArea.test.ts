import { describe, expect, it } from 'vitest';
import { transitionCityLotArea, type CityLotAreaState } from '../components/setbackCityArea';

const empty: CityLotAreaState = { fetchedParcelArea: null, lotAreaOverrideSqm: null };
const area = { lotAreaSqm: 23044.9, confirmedAddress: '800 MACLEOD TR SE', source: 'calgary_assessment' };
const applied = () => transitionCityLotArea(transitionCityLotArea(empty, { type: 'success', area }), { type: 'apply' });

describe('setback city-area lifecycle (pure helper; no DOM framework)', () => {
  it('keeps successful fetch and explicit Apply behavior unchanged', () => {
    const fetched = transitionCityLotArea(empty, { type: 'success', area });
    expect(fetched).toEqual({ fetchedParcelArea: area, lotAreaOverrideSqm: null });
    expect(transitionCityLotArea(fetched, { type: 'apply' })).toEqual({ fetchedParcelArea: area, lotAreaOverrideSqm: 23044.9 });
  });
  it('clears an applied area and provenance on a failed lookup, restoring width × depth', () => {
    const result = transitionCityLotArea(applied(), { type: 'failure' });
    expect(result).toMatchObject({ fetchedParcelArea: null, lotAreaOverrideSqm: null });
    expect(result.lotAreaOverrideSqm ?? 15 * 35).toBe(525);
    expect(result.message).toContain('Previously applied city area was removed');
  });
  it('clears applied area and provenance when a lookup throws', () => {
    const result = transitionCityLotArea(applied(), { type: 'failure', thrown: true });
    expect(result).toMatchObject({ fetchedParcelArea: null, lotAreaOverrideSqm: null });
    expect(result.message).toContain('Lot area lookup failed');
    expect(result.message).toContain('Previously applied city area was removed');
  });
  it.each(['address', 'municipality', 'project'])('clears applied area and provenance on %s context change', () => {
    const result = transitionCityLotArea(applied(), { type: 'context-change' });
    expect(result).toEqual({ fetchedParcelArea: null, lotAreaOverrideSqm: null, message: 'Previously applied city area was removed; using width × depth.' });
  });
  it('shows a distinct ambiguous message and clears an applied area', () => {
    const result = transitionCityLotArea(applied(), { type: 'failure', ambiguous: true });
    expect(result).toMatchObject({ fetchedParcelArea: null, lotAreaOverrideSqm: null });
    expect(result.message).toContain('Several properties match this address; enter the lot area manually or use the site plan value');
    expect(result.message).toContain('Previously applied city area was removed');
  });
  it('shows ambiguity without falsely claiming that an unapplied area was removed', () => {
    expect(transitionCityLotArea(empty, { type: 'failure', ambiguous: true }).message)
      .toBe('Several properties match this address; enter the lot area manually or use the site plan value');
  });
  it('invalidates fetched provenance on context change even before Apply, without a removal toast', () => {
    expect(transitionCityLotArea({ ...empty, fetchedParcelArea: area }, { type: 'context-change' }))
      .toEqual({ ...empty, message: undefined });
  });
});
