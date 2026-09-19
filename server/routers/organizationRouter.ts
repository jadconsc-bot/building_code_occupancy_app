import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { organizations, organizationInvitations, users, roomCorrections, trainingExamples } from "../../drizzle/schema";
import { eq, and, count, gt } from "drizzle-orm";
import { assertOrgAdmin, assertOrgMember } from "../services/projectAuthorization";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const dbOrThrow = async () => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
};

export const organizationRouter = router({
  getMyOrg: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    const [me] = await db.select({ orgId: users.orgId, orgRole: users.orgRole }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!me?.orgId) return null;
    const [org] = await db.select().from(organizations).where(eq(organizations.id, me.orgId)).limit(1);
    return org ? { ...org, orgRole: me.orgRole } : null;
  }),

  createOrg: protectedProcedure.input(z.object({ name: z.string().min(2).max(255), slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/) })).mutation(async ({ input, ctx }) => {
    const db = await dbOrThrow();
    const [me] = await db.select({ orgId: users.orgId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (me?.orgId && ctx.user.role !== "admin") throw new TRPCError({ code: "CONFLICT", message: "You already belong to an organization" });
    const id = await db.transaction(async tx => {
      const result = await tx.insert(organizations).values({ ...input, planTier: "professional", createdAt: new Date(), updatedAt: new Date() });
      const orgId = Number(result[0].insertId);
      await tx.update(users).set({ orgId, orgRole: "org_admin" }).where(eq(users.id, ctx.user.id));
      return orgId;
    });
    return { id };
  }),

  assignUserToOrg: protectedProcedure.input(z.object({ userId: z.number().int().positive(), orgId: z.number().int().positive(), orgRole: z.enum(["org_admin", "member"]).default("member") })).mutation(async ({ input, ctx }) => {
    const db = await dbOrThrow();
    const [org] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, input.orgId)).limit(1);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    await assertOrgAdmin(ctx.user, input.orgId);
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    await db.update(users).set({ orgId: input.orgId, orgRole: input.orgRole }).where(eq(users.id, input.userId));
    return { success: true };
  }),

  listOrgMembers: protectedProcedure.input(z.object({ orgId: z.number().int().positive().optional() }).default({})).query(async ({ input, ctx }) => {
    const db = await dbOrThrow();
    const [me] = await db.select({ orgId: users.orgId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const orgId = input.orgId ?? me?.orgId;
    if (!orgId) return [];
    await assertOrgMember(ctx.user, orgId);
    return db.select({ id: users.id, name: users.name, email: users.email, orgId: users.orgId, orgRole: users.orgRole }).from(users).where(eq(users.orgId, orgId));
  }),

  inviteUser: protectedProcedure.input(z.object({ orgId: z.number().int().positive(), email: z.string().email(), expiresInDays: z.number().int().min(1).max(30).default(7) })).mutation(async ({ input, ctx }) => {
    await assertOrgAdmin(ctx.user, input.orgId);
    const db = await dbOrThrow();
    const [target] = await db.select({ id: users.id, orgId: users.orgId }).from(users).where(eq(users.email, input.email)).limit(1);
    if (target?.orgId && target.orgId !== input.orgId) throw new TRPCError({ code: "CONFLICT", message: "User belongs to another organization" });
    const rawToken = randomBytes(32).toString("hex");
    await db.insert(organizationInvitations).values({ organizationId: input.orgId, invitedEmail: input.email, invitedUserId: target?.id ?? null, tokenHash: hashToken(rawToken), invitedBy: ctx.user.id, status: "pending", expiresAt: new Date(Date.now() + input.expiresInDays * 86400000), createdAt: new Date() });
    return { token: rawToken };
  }),

  requestToJoin: protectedProcedure.input(z.object({ orgId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const db = await dbOrThrow();
    const [org] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, input.orgId)).limit(1);
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    const [me] = await db.select({ email: users.email, orgId: users.orgId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (me?.orgId) throw new TRPCError({ code: "CONFLICT", message: "You already belong to an organization" });
    const [pending] = await db.select({ id: organizationInvitations.id }).from(organizationInvitations).where(and(eq(organizationInvitations.organizationId, input.orgId), eq(organizationInvitations.invitedUserId, ctx.user.id), eq(organizationInvitations.status, "pending"))).limit(1);
    if (pending) return { id: pending.id };
    const result = await db.insert(organizationInvitations).values({ organizationId: input.orgId, invitedEmail: me?.email ?? `user-${ctx.user.id}@pending.invalid`, invitedUserId: ctx.user.id, tokenHash: hashToken(randomBytes(32).toString("hex")), invitedBy: ctx.user.id, status: "pending", expiresAt: new Date(Date.now() + 30 * 86400000), createdAt: new Date() });
    return { id: Number(result[0].insertId) };
  }),

  approveJoinRequest: protectedProcedure.input(z.object({ invitationId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const db = await dbOrThrow();
    const [request] = await db.select().from(organizationInvitations).where(eq(organizationInvitations.id, input.invitationId)).limit(1);
    if (!request?.invitedUserId) throw new TRPCError({ code: "NOT_FOUND", message: "Join request not found" });
    await assertOrgAdmin(ctx.user, request.organizationId);
    if (request.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "Join request is no longer pending" });
    await db.transaction(async tx => {
      await tx.update(users).set({ orgId: request.organizationId, orgRole: "member" }).where(eq(users.id, request.invitedUserId!));
      await tx.update(organizationInvitations).set({ status: "accepted", acceptedAt: new Date() }).where(eq(organizationInvitations.id, request.id));
    });
    return { success: true };
  }),

  declineJoinRequest: protectedProcedure.input(z.object({ invitationId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const db = await dbOrThrow();
    const [request] = await db.select().from(organizationInvitations).where(eq(organizationInvitations.id, input.invitationId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Join request not found" });
    await assertOrgAdmin(ctx.user, request.organizationId);
    await db.update(organizationInvitations).set({ status: "declined" }).where(and(eq(organizationInvitations.id, request.id), eq(organizationInvitations.status, "pending")));
    return { success: true };
  }),

  acceptInvite: protectedProcedure.input(z.object({ token: z.string().min(20) })).mutation(async ({ input, ctx }) => {
    const db = await dbOrThrow();
    const [invite] = await db.select().from(organizationInvitations).where(and(eq(organizationInvitations.tokenHash, hashToken(input.token)), eq(organizationInvitations.status, "pending"), gt(organizationInvitations.expiresAt, new Date()))).limit(1);
    if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation is invalid or expired" });
    const [me] = await db.select({ email: users.email, orgId: users.orgId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (me?.orgId && me.orgId !== invite.organizationId) throw new TRPCError({ code: "CONFLICT", message: "You belong to another organization" });
    if (me?.email && me.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) throw new TRPCError({ code: "FORBIDDEN", message: "Invitation email does not match the signed-in user" });
    await db.transaction(async tx => {
      await tx.update(users).set({ orgId: invite.organizationId, orgRole: "member" }).where(eq(users.id, ctx.user.id));
      await tx.update(organizationInvitations).set({ invitedUserId: ctx.user.id, status: "accepted", acceptedAt: new Date() }).where(eq(organizationInvitations.id, invite.id));
    });
    return { success: true, organizationId: invite.organizationId };
  }),

  removeUserFromOrg: protectedProcedure.input(z.object({ orgId: z.number().int().positive(), userId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    await assertOrgAdmin(ctx.user, input.orgId);
    const db = await dbOrThrow();
    await db.update(users).set({ orgId: null, orgRole: null }).where(and(eq(users.id, input.userId), eq(users.orgId, input.orgId)));
    return { success: true };
  }),

  getOrgTrainingStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    const [me] = await db.select({ orgId: users.orgId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!me?.orgId) return { count: 0, byPlanType: [] };
    await assertOrgMember(ctx.user, me.orgId);
    const stats = await db.select({ planType: trainingExamples.planType, count: count() }).from(trainingExamples).where(and(eq(trainingExamples.orgId, me.orgId), eq(trainingExamples.isActive, 1))).groupBy(trainingExamples.planType);
    return { count: stats.reduce((sum, s) => sum + Number(s.count), 0), byPlanType: stats };
  }),

  exportOrgTrainingData: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbOrThrow();
    const [me] = await db.select({ orgId: users.orgId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!me?.orgId) return { corrections: [], examples: [] };
    await assertOrgMember(ctx.user, me.orgId);
    const corrections = await db.select().from(roomCorrections).where(eq(roomCorrections.orgId, me.orgId));
    const examples = await db.select().from(trainingExamples).where(eq(trainingExamples.orgId, me.orgId));
    return { corrections, examples };
  }),
});
