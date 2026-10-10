import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from '../_core/context';
import { zoneLookupRouter } from './zoneLookupRouter';
import { getDb } from '../db';

vi.mock('../db', () => ({ getDb: vi.fn(() => { throw new Error('No DB access permitted'); }) }));
vi.mock('../services/zoneLookupService', () => ({ lookupZone: vi.fn() }));
const fetchMock = vi.fn<typeof fetch>();
const caller = (signedIn = true) => zoneLookupRouter.createCaller({ user: signedIn ? { id: 1, role: 'free' } : null, req: {}, res: {} } as TrpcContext);

describe('protected read-only parcel discovery', () => {
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => { vi.unstubAllGlobals(); expect(getDb).not.toHaveBeenCalled(); });

  it('rejects an unauthenticated request before fetching', async () => {
    await expect(caller(false).discoverParcels({ address: '823 5 ST NE', municipality: 'Calgary' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('returns unsupported_municipality without fetching', async () => {
    expect(await caller().discoverParcels({ address: '823 5 ST NE', municipality: 'Edmonton' })).toEqual({ status: 'unsupported_municipality' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('passes no_data through unchanged', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [] } as Response);
    expect(await caller().discoverParcels({ address: 'NOT A REAL ADDRESS', municipality: 'CALGARY' })).toEqual({ status: 'no_data' });
  });
  it('maps a transport failure to an error object without exposing the underlying error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('private upstream detail'));
    expect(await caller().discoverParcels({ address: '823 5 ST NE', municipality: 'Calgary' })).toEqual({ error: 'No parcel discovery data available for this address' });
  });
});
