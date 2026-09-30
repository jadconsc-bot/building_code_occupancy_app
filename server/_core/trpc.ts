import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { TrpcContext } from "./context";

export function formatTrpcErrorShape({ shape, error }: { shape: any; error: any }) {
  if (!(error?.cause instanceof ZodError)) return shape;
  const issue = error.cause.issues[0];
  const path = issue?.path?.length ? issue.path.join(".") : "input";
  let detail = issue?.message ?? "has an invalid value";
  if (issue?.code === "too_small" && issue?.origin === "number" && issue?.minimum === 0 && issue?.inclusive === false) {
    detail = "must be greater than 0";
  }
  return {
    ...shape,
    message: `Invalid input: ${path} ${detail}.`,
    data: {
      ...shape.data,
      zodError: shape.data?.zodError,
    },
  };
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter: formatTrpcErrorShape,
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
