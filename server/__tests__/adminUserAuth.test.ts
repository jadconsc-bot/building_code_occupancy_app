import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  clerkGetUser: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock('@clerk/backend', () => ({
  verifyToken: mocks.verifyToken,
  createClerkClient: () => ({ users: { getUser: mocks.clerkGetUser } }),
}));
vi.mock('../db', () => ({
  upsertUser: mocks.upsertUser,
  getUserByOpenId: mocks.getUserByOpenId,
  getDb: mocks.getDb,
}));

import { registerAuthRoutes } from '../_core/authRoutes';
import { sdk } from '../_core/sdk';

describe('CIM-AUDIT-043 user ban and invite auth behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyToken.mockResolvedValue({ sub: 'clerk-user' });
    mocks.clerkGetUser.mockResolvedValue({
      firstName: 'Test', lastName: 'User',
      emailAddresses: [{ emailAddress: 'invite@example.com' }],
      externalAccounts: [],
    });
    mocks.upsertUser.mockResolvedValue(undefined);
    vi.spyOn(sdk, 'createSessionToken').mockResolvedValue('session-token');
  });

  it('blocks session issuance for a banned user before setting a cookie', async () => {
    const banned = { id: 42, openId: 'clerk-user', bannedAt: new Date() };
    mocks.getUserByOpenId.mockResolvedValue(banned);
    const app = express();
    app.use(express.json());
    registerAuthRoutes(app);

    const response = await request(app).post('/api/auth/session').send({ clerkToken: 'valid' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('account has been suspended');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(sdk.createSessionToken).not.toHaveBeenCalled();
  });

  it('applies a pending invite only on first login and consumes it', async () => {
    const invite = { id: 7, email: 'invite@example.com', role: 'professional', consumedAt: null };
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([invite]) })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
      })),
    };
    mocks.getDb.mockResolvedValue(db);
    mocks.getUserByOpenId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ id: 99, openId: 'clerk-user', bannedAt: null })
      .mockResolvedValueOnce({ id: 99, openId: 'clerk-user', bannedAt: null })
      .mockResolvedValueOnce({ id: 99, openId: 'clerk-user', bannedAt: null });
    const app = express();
    app.use(express.json());
    registerAuthRoutes(app);

    const response = await request(app).post('/api/auth/session').send({ clerkToken: 'valid' });

    expect(response.status).toBe(200);
    expect(mocks.upsertUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'professional' }));
    expect(db.update).toHaveBeenCalled();

    const returningResponse = await request(app).post('/api/auth/session').send({ clerkToken: 'valid' });
    expect(returningResponse.status).toBe(200);
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it('treats a banned user as unauthenticated on an existing session', async () => {
    vi.spyOn(sdk, 'verifySession').mockResolvedValue({ openId: 'clerk-user', appId: 'codecomply', name: 'Test' });
    mocks.getUserByOpenId.mockResolvedValue({ id: 42, openId: 'clerk-user', bannedAt: new Date() });

    await expect(sdk.authenticateRequest({ headers: { cookie: 'session=test' } } as any)).rejects.toThrow('User not found');
    expect(mocks.upsertUser).not.toHaveBeenCalled();
  });
});
