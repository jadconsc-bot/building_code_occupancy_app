import { describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from '../_core/context';
import { getDb } from '../db';
import { complianceMonitorRouter } from '../routers/complianceMonitorRouter';
import { SOURCES } from '../services/complianceMonitorService';

vi.mock('../db', () => ({ getDb: vi.fn() }));

function caller(role: string | null) {
  return complianceMonitorRouter.createCaller({
    user: role ? { id: 1, role } : null,
    req: {},
    res: {},
  } as TrpcContext);
}

describe('monitored source configuration access', () => {
  it('returns the configured sources to an admin without accessing the database', async () => {
    const sources = await caller('admin').getSources();
    expect(sources).toEqual(SOURCES);
    expect(sources).toHaveLength(10);
    expect(sources.find(source => source.id === 'YK')).toMatchObject({ manualOnly: true });
    expect(getDb).not.toHaveBeenCalled();
  });

  it.each([null, 'free', 'professional', 'rule_editor', 'org_admin'])('rejects role %s', async role => {
    await expect(caller(role).getSources()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
