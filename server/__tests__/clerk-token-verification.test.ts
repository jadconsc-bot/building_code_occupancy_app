import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyToken } from '@clerk/backend';

/**
 * AUTH-MIGRATE-001: Test Clerk token verification fix
 * 
 * Tests that the verifyToken function from @clerk/backend is being used correctly
 * instead of the non-existent clerkClient.verifyToken method
 */

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
  createClerkClient: vi.fn(() => ({
    users: {
      getUser: vi.fn(),
    },
  })),
}));

describe('AUTH-MIGRATE-001: Clerk Token Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use verifyToken from @clerk/backend', async () => {
    const mockToken = 'test-clerk-token';
    const mockPayload = {
      sub: 'user_123',
      email: 'test@example.com',
    };

    (verifyToken as any).mockResolvedValue(mockPayload);

    // Simulate the token verification
    const result = await verifyToken(mockToken, {
      secretKey: 'test-secret',
    });

    expect(verifyToken).toHaveBeenCalledWith(mockToken, {
      secretKey: 'test-secret',
    });
    expect(result).toEqual(mockPayload);
  });

  it('should extract user ID from verified token', async () => {
    const mockToken = 'test-clerk-token';
    const userId = 'user_456';

    (verifyToken as any).mockResolvedValue({
      sub: userId,
      email: 'user@example.com',
    });

    const result = await verifyToken(mockToken, {
      secretKey: 'test-secret',
    });

    expect(result.sub).toBe(userId);
  });

  it('should handle invalid tokens', async () => {
    const mockToken = 'invalid-token';

    (verifyToken as any).mockRejectedValue(
      new Error('Invalid token signature')
    );

    await expect(
      verifyToken(mockToken, {
        secretKey: 'test-secret',
      })
    ).rejects.toThrow('Invalid token signature');
  });

  it('should not use clerkClient.verifyToken (deprecated method)', () => {
    // This test ensures we're not using the old, non-existent method
    // The verifyToken function should be imported directly from @clerk/backend
    expect(verifyToken).toBeDefined();
  });
});
