import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { disclaimerAcknowledgments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { extractClientIp, extractUserAgent } from "../utils/ipExtraction";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "../../shared/const";

export const disclaimerRouter = router({
  // Auth procedures
  me: publicProcedure.query((opts: any) => opts.ctx.user),
  logout: protectedProcedure.mutation(({ ctx }: any) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),

  // Disclaimer procedures
  // Check if user already accepted disclaimer
  hasAcceptedDisclaimer: protectedProcedure
    .input(
      z.object({
        version: z.string().default("1.0"),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const userId = ctx.user?.id;
      if (!userId) {
        return { accepted: false };
      }

      try {
        const db = await getDb();
        if (!db) {
          return { accepted: false };
        }

        // Query using Drizzle ORM
        const results = await db.select().from(disclaimerAcknowledgments)
          .where(eq(disclaimerAcknowledgments.userId, userId) && eq(disclaimerAcknowledgments.disclaimerVersion, input.version))
          .limit(1) as any;

        const acceptance = results?.[0];

        return {
          accepted: !!acceptance,
        };
      } catch (error) {
        console.error("Failed to check disclaimer acceptance", {
          userId,
          version: input.version,
          error: error instanceof Error ? error.message : String(error),
        });
        return { accepted: false };
      }
    }),

  // Record disclaimer acceptance
  acceptDisclaimer: protectedProcedure
    .input(
      z.object({
        version: z.string().default("1.0"),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Check if already accepted
        const results = await db.select().from(disclaimerAcknowledgments)
          .where(eq(disclaimerAcknowledgments.userId, userId) && eq(disclaimerAcknowledgments.disclaimerVersion, input.version))
          .limit(1) as any;

        const existing = results?.[0];

        if (existing) {
          return {
            success: true,
            alreadyAccepted: true,
            acceptanceId: existing.id,
          };
        }

        // ✅ FIX #3: Extract real IP address from request headers
        // Handles proxies (AWS, Cloudflare, Nginx) for legal audit trail
        const ipAddress = extractClientIp(ctx.req);
        const userAgent = extractUserAgent(ctx.req);

        console.log("🌐 [Auth] Real IP extracted", {
          ipAddress,
          userAgent: userAgent.substring(0, 50),
          userId,
        });

        // Get full disclaimer text
        const disclaimerText = `REQUIRED LEGAL ACKNOWLEDGMENT

NOT A PROFESSIONAL ENGINEER SERVICE

This tool is NOT a substitute for professional engineering review, consultation, or licensed professional services. All analyses are informational only. You are solely responsible for:

• Conducting independent verification of all outputs
• Exercising professional judgment and responsibility
• Obtaining professional engineering review
• Compliance with professional standards and codes of ethics
• Taking full responsibility for any professional opinions

BUILDING CODES VARY BY JURISDICTION

Building codes and regulations vary significantly by jurisdiction. This tool may not reflect all local requirements or recent code updates.

I understand that this tool is NOT a substitute for professional engineering review and that professional judgment and responsibility are required.

I accept all terms, conditions, disclaimers, and limitations of liability outlined above and acknowledge the risks of using this tool.`;

        // Record new acceptance (immutable via Fix #1)
        const result = await db.insert(disclaimerAcknowledgments).values({
          userId,
          disclaimerVersion: input.version,
          disclaimerText,
          ipAddress,
          userAgent,
          isImmutable: true,
        });

        console.log("✅ [Auth] Disclaimer acceptance recorded", {
          userId,
          version: input.version,
          ipAddress,
        });

        return {
          success: true,
          alreadyAccepted: false,
          acceptanceId: (result as any).insertId,
        };
      } catch (error) {
        console.error("❌ [Auth] Failed to accept disclaimer", {
          userId,
          version: input.version,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record disclaimer acceptance",
        });
      }
    }),
});
