import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const basicProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const allowed = ['basic', 'professional', 'rule_editor', 'admin'];
    if (!ctx.user || !allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This feature requires a paid subscription." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const professionalProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const allowed = ['professional', 'rule_editor', 'admin'];
    if (!ctx.user || !allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This feature requires a Professional subscription with verified credentials." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

export const ruleEditorProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const allowed = ['rule_editor', 'admin'];
    if (!ctx.user || !allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Rule editing requires special authorization." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
