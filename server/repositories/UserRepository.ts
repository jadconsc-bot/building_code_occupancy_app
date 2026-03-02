/**
 * User Repository
 * 
 * Encapsulates all database queries related to users.
 * Provides a clean interface for user operations.
 */

import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export interface CreateUserInput {
  openId: string;
  email: string;
  name?: string;
}

export interface UpdateUserInput {
  id: number;
  email?: string;
  name?: string;
  role?: 'admin' | 'user';
}

export class UserRepository {
  /**
   * Get user by ID
   */
  async getUserById(id: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[UserRepository] Failed to fetch user:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user',
      });
    }
  }

  /**
   * Get user by OpenID
   */
  async getUserByOpenId(openId: string) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('[UserRepository] Failed to fetch user by OpenID:', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('[UserRepository] Failed to fetch user by email:', error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Check if user already exists
      const existing = await this.getUserByOpenId(input.openId);
      if (existing) {
        return existing;
      }

      const [result] = await db
        .insert(users)
        .values({
          openId: input.openId,
          email: input.email,
          name: input.name || null,
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return result;
    } catch (error) {
      console.error('[UserRepository] Failed to create user:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
      });
    }
  }

  /**
   * Update user
   */
  async updateUser(input: UpdateUserInput) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Verify user exists
      await this.getUserById(input.id);

      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      if (input.email !== undefined) updateData.email = input.email;
      if (input.name !== undefined) updateData.name = input.name;
      if (input.role !== undefined) updateData.role = input.role;

      const [result] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, input.id))
        .returning();

      return result;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[UserRepository] Failed to update user:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user',
      });
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Verify user exists
      await this.getUserById(id);

      await db.delete(users).where(eq(users.id, id));

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[UserRepository] Failed to delete user:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete user',
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(id: number) {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection failed');
      }

      // Verify user exists
      const user = await this.getUserById(id);

      // Get user creation date
      const createdAt = user.createdAt;
      const accountAgeDays = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        userId: id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt,
        accountAgeDays,
        lastUpdated: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      console.error('[UserRepository] Failed to get user stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user statistics',
      });
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(id: number): Promise<boolean> {
    try {
      const user = await this.getUserById(id);
      return user.role === 'admin';
    } catch {
      return false;
    }
  }

  /**
   * Promote user to admin
   */
  async promoteToAdmin(id: number) {
    try {
      return await this.updateUser({ id, role: 'admin' });
    } catch (error) {
      console.error('[UserRepository] Failed to promote user:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to promote user to admin',
      });
    }
  }

  /**
   * Demote admin to user
   */
  async demoteToUser(id: number) {
    try {
      return await this.updateUser({ id, role: 'user' });
    } catch (error) {
      console.error('[UserRepository] Failed to demote user:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to demote user',
      });
    }
  }
}

export const userRepository = new UserRepository();
