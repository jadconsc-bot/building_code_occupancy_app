import { and, desc, eq, isNull, like, or } from 'drizzle-orm';
import { z } from 'zod';
import { userInvites, users } from '../../drizzle/schema';
import { getDb } from '../db';
import { ENV } from '../_core/env';
import { adminProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';

const roleSchema = z.enum(['free', 'home_user', 'basic', 'professional', 'rule_editor', 'admin', 'org_admin']);

export const adminUserRouter = router({
  listUsers: adminProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const search = input?.search?.trim();
      return db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        bannedAt: users.bannedAt,
        banReason: users.banReason,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
        orgId: users.orgId,
      }).from(users)
        .where(search ? or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)) : undefined)
        .orderBy(desc(users.lastSignedIn))
        .limit(500);
    }),

  banUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot ban your own account.' });
      }
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [target] = await db.select({ id: users.id, openId: users.openId }).from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      if (target.openId === ENV.ownerOpenId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'The platform owner account cannot be banned.' });
      }
      await db.update(users).set({ bannedAt: new Date(), banReason: input.reason, bannedBy: ctx.user.id }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.update(users).set({ bannedAt: null, banReason: null, bannedBy: null }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  createInvite: adminProcedure
    .input(z.object({ email: z.string().email(), role: roleSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.insert(userInvites).values({ email: input.email, role: input.role, invitedBy: ctx.user.id, createdAt: new Date() }).onDuplicateKeyUpdate({
        set: { role: input.role, invitedBy: ctx.user.id, createdAt: new Date(), consumedAt: null, consumedByUserId: null },
      });
      return { success: true };
    }),

  listInvites: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return db.select().from(userInvites).where(isNull(userInvites.consumedAt)).orderBy(desc(userInvites.createdAt));
  }),

  revokeInvite: adminProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [invite] = await db.select({ id: userInvites.id, consumedAt: userInvites.consumedAt }).from(userInvites).where(eq(userInvites.id, input.inviteId)).limit(1);
      if (!invite) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite not found.' });
      if (invite.consumedAt) throw new TRPCError({ code: 'CONFLICT', message: 'Consumed invites cannot be revoked.' });
      await db.delete(userInvites).where(and(eq(userInvites.id, input.inviteId), isNull(userInvites.consumedAt)));
      return { success: true };
    }),
});
