/**
 * CodeComply Home router — consumer pay-per-report.
 *
 * Flow:
 *   1. createSession   → inserts pending homeReport, returns token
 *   2. submitAnswers   → runs compliance engine, stores results
 *   3. createCheckout  → Stripe Checkout Session ($29 CAD), returns redirect URL
 *   4. getReport       → public token-auth; full data only after paid
 *
 * Stripe webhook (Express route, not tRPC) is registered in server/_core/index.ts.
 * PDF generation happens ONLY after payment_intent webhook — never before.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { homeReports } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import Stripe from "stripe";
import { runHomeCompliance, type HomeFormAnswers } from "../services/homeComplianceEngine.js";

// ─── Stripe singleton ────────────────────────────────────────────────────────
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured" });
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
}

const REPORT_PRICE_CAD = 2900; // $29.00 CAD in cents

// ─── Zod schemas for Q&A answers ────────────────────────────────────────────

const provinceEnum = z.enum(["AB", "BC", "ON"]);
const yesNo = z.enum(["yes", "no"]);

const secondarySuiteSchema = z.object({
  projectType: z.literal("secondary_suite"),
  province: provinceEnum,
  municipality: z.string().optional(),
  yearBuilt: z.number().int().min(1800).max(2026).optional(),
  storeys: z.number().int().min(1).max(10).optional(),
  suiteLocation: z.enum(["basement", "above_grade", "attached_garage"]),
  suiteAreaSqft: z.number().positive().optional(),
  separateEntrance: yesNo,
  ceilingHeightFt: z.number().positive(),
  egressWindows: yesNo,
  egressWindowSizeSqm: z.number().positive().optional(),
  smokeAlarms: yesNo,
  coDetectors: yesNo,
  fireSeparation: yesNo,
  sprinklerSystem: yesNo,
  parkingProvided: yesNo,
  fullBathroom: yesNo,
  kitchen: yesNo,
});

const deckPatioSchema = z.object({
  projectType: z.literal("deck_patio"),
  province: provinceEnum,
  municipality: z.string().optional(),
  attachedToHouse: yesNo,
  heightAboveGradeFt: z.number().nonnegative(),
  deckAreaSqft: z.number().positive().optional(),
  ledgerAttachment: yesNo.optional(),
  footingType: z.enum(["concrete", "helical", "surface"]),
  joistSpanFt: z.number().positive(),
  beamSpanFt: z.number().positive(),
  postHeightFt: z.number().positive().optional(),
  guardRail: yesNo,
  guardRailHeightFt: z.number().positive().optional(),
});

const basementDevSchema = z.object({
  projectType: z.literal("basement_development"),
  province: provinceEnum,
  municipality: z.string().optional(),
  existingState: z.enum(["finished", "unfinished"]),
  ceilingHeightFt: z.number().positive(),
  egressWindows: yesNo,
  bedroomCount: z.number().int().nonnegative(),
  fullBathroom: yesNo,
  smokeAlarms: yesNo,
  separateEntrance: yesNo,
  insulation: yesNo,
  rValue: z.number().positive().optional(),
});

const formAnswersSchema = z.discriminatedUnion("projectType", [
  secondarySuiteSchema,
  deckPatioSchema,
  basementDevSchema,
]);

// ─── Router ──────────────────────────────────────────────────────────────────

export const homeRouter = router({

  // 1. Create a new report session — returns the secure token
  createSession: publicProcedure
    .input(z.object({
      email: z.string().email(),
      province: provinceEnum,
      municipality: z.string().max(100).optional(),
      projectType: z.string().min(1).max(50),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // 256-bit cryptographically secure token — not guessable, not predictable
      const reportToken = randomBytes(32).toString("hex");

      await db.insert(homeReports).values({
        reportToken,
        email: input.email,
        province: input.province,
        municipality: input.municipality,
        projectType: input.projectType,
        paymentStatus: "pending",
        createdAt: new Date(),
      });

      return { reportToken };
    }),

  // 2. Submit Q&A answers and run compliance — stores results, returns preview
  submitAnswers: publicProcedure
    .input(z.object({
      reportToken: z.string().length(64),
      answers: formAnswersSchema,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [report] = await db
        .select()
        .from(homeReports)
        .where(eq(homeReports.reportToken, input.reportToken))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report session not found" });
      if (report.paymentStatus === "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This report has already been paid — answers cannot be changed" });
      }

      const complianceResult = runHomeCompliance(input.answers as HomeFormAnswers);

      await db.update(homeReports)
        .set({
          formAnswersJson: input.answers,
          complianceResultJson: complianceResult,
          overallResult: complianceResult.overallResult,
          province: (input.answers as any).province,
          municipality: (input.answers as any).municipality,
        })
        .where(eq(homeReports.reportToken, input.reportToken));

      // Return preview-safe result (full data — gate is on getReport after payment)
      return { overallResult: complianceResult.overallResult, itemCount: complianceResult.items.length };
    }),

  // 3. Create Stripe Checkout Session — returns redirect URL
  createCheckout: publicProcedure
    .input(z.object({
      reportToken: z.string().length(64),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [report] = await db
        .select()
        .from(homeReports)
        .where(eq(homeReports.reportToken, input.reportToken))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report session not found" });
      if (report.paymentStatus === "paid") throw new TRPCError({ code: "BAD_REQUEST", message: "Already paid" });
      if (!report.complianceResultJson) throw new TRPCError({ code: "BAD_REQUEST", message: "Submit answers before checkout" });

      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        currency: "cad",
        customer_email: report.email,
        line_items: [{
          price_data: {
            currency: "cad",
            unit_amount: REPORT_PRICE_CAD,
            product_data: {
              name: `CodeComply Home — ${report.projectType.replace(/_/g, " ")} Report`,
              description: `Building code compliance report for ${report.province}`,
            },
          },
          quantity: 1,
        }],
        payment_intent_data: {
          metadata: { reportToken: input.reportToken },
        },
        metadata: { reportToken: input.reportToken },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        allow_promotion_codes: true, // supports 5-pack coupon codes per suggestion
      });

      await db.update(homeReports)
        .set({ stripeCheckoutSessionId: session.id })
        .where(eq(homeReports.reportToken, input.reportToken));

      return { checkoutUrl: session.url };
    }),

  // 4. Get report — public, token-gated; full compliance data only after payment
  getReport: publicProcedure
    .input(z.object({ reportToken: z.string().length(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [report] = await db
        .select()
        .from(homeReports)
        .where(eq(homeReports.reportToken, input.reportToken))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });

      // Check 30-day download expiry
      if (report.downloadExpiresAt && new Date() > report.downloadExpiresAt) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This report link has expired. Contact support to recover your report." });
      }

      const paid = report.paymentStatus === "paid";

      return {
        reportToken: report.reportToken,
        email: report.email,
        province: report.province,
        municipality: report.municipality,
        projectType: report.projectType,
        paymentStatus: report.paymentStatus,
        overallResult: report.overallResult,
        pdfGeneratedAt: report.pdfGeneratedAt,
        downloadExpiresAt: report.downloadExpiresAt,
        // Full compliance detail only after payment
        complianceResult: paid ? report.complianceResultJson : null,
        // Preview: top-level items with result visible, detail blurred client-side
        previewItems: paid
          ? null
          : ((report.complianceResultJson as any)?.items ?? []).map((item: any) => ({
              ruleId: item.ruleId,
              title: item.title,
              result: item.result,
            })),
      };
    }),
});
