/**
 * CodeComply Home — tRPC Router (Rev 2)
 *
 * Procedures:
 *   home.createReport   — saves form answers + creates Stripe PI → clientSecret
 *   home.getPreview     — runs compliance check, returns partial results
 *   home.downloadReport — validates raw token (SHA-256 lookup), returns PDF info
 *   home.getReport      — poll status by paymentIntentId (processing page)
 *
 * Rev 2 token security: raw token lives only in the email link.
 * DB stores SHA-256 hash only. Download validates by hashing the incoming raw token.
 *
 * PDF generation happens ONLY via Stripe webhook (payment_intent.succeeded),
 * never on client redirect.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { homeReports, userSubscriptions } from "../../drizzle/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { createPaymentIntent } from "../services/stripeService.js";
import { adaptFormAnswers, type RawFormSubmission } from "../services/homeReportAdapter.js";
import {
  evaluateHomeCompliance,
  aggregateOverallResult,
} from "../engine/home/part9Rules.js";

// ─── Input schemas ────────────────────────────────────────────────────────────

const rawFormSchema = z.object({
  province: z.enum(["AB", "BC", "ON"]),
  municipality: z.string().max(100).optional(),
  projectType: z.string().min(1).max(50),
  ceilingHeightFt: z.number().positive().optional(),
  suiteAreaSqFt: z.number().positive().optional(),
  suiteLocation: z.enum(["basement", "above_grade", "attached_garage"]).optional(),
  yearBuilt: z.number().int().min(1800).max(2030).optional(),
  storeys: z.number().int().min(1).max(20).optional(),
  separateEntrance: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  egressWindows: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  egressWindowAreaM2: z.number().positive().optional(),
  smokeAlarms: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  coDetectors: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  fireSeparation: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  sprinklerSystem: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  bedroomCount: z.number().int().nonnegative().max(20).optional(),
  fullBathroom: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  kitchen: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  parking: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  attachedToHouse: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  heightAboveGradeFt: z.number().nonnegative().optional(),
  deckAreaSqFt: z.number().positive().optional(),
  ledgerAttachment: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  footingType: z.enum(["concrete", "helical", "surface"]).optional(),
  joistSpanFt: z.number().positive().optional(),
  beamSpanFt: z.number().positive().optional(),
  postHeightFt: z.number().positive().optional(),
  guardRail: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  guardRailHeightFt: z.number().positive().optional(),
  insulation: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  insulationRValue: z.number().positive().optional(),
  // NBC 9.10.7 egress window dimensions
  egressWindowHeightMm: z.number().positive().optional(),
  egressWindowWidthMm:  z.number().positive().optional(),
  egressWindowSillMm:   z.number().nonnegative().optional(),
  // NBC 9.9.10 window well
  isBelowGradeBedroom:        z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  windowWellProjectionMm:     z.number().positive().optional(),
  windowWellDepthMm:          z.number().positive().optional(),
  windowSwingType:            z.enum(["inswing", "outswing", "slider", "double_hung"]).optional(),
  windowWellSashDepthMm:      z.number().positive().optional(),
  windowWellHasCover:         z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  windowWellCoverOpensInside: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  windowWellHasLadder:        z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  // NBC 9.10.14 spatial separation
  limitingDistanceM:     z.number().positive().optional(),
  exposingFaceAreaM2:    z.number().positive().optional(),
  totalOpeningAreaM2:    z.number().nonnegative().optional(),
  facesStreet:           z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
  fireResponseOver10Min: z.union([z.boolean(), z.enum(["yes", "no"])]).optional(),
});

// ─── Router ──────────────────────────────────────────────────────────────────

export const homeRouter = router({

  /**
   * 1. createReport
   * Saves form answers, runs compliance, creates Stripe PaymentIntent.
   * Returns clientSecret for Stripe Elements + paymentIntentId for polling.
   * Raw token is NOT stored — only SHA-256 hash is stored in DB.
   * Raw token is set AFTER payment confirmed (in webhook).
   */
  createReport: publicProcedure
    .input(z.object({
      email: z.string().email(),
      formAnswers: rawFormSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Adapt and validate form answers
      let adapted: ReturnType<typeof adaptFormAnswers>;
      try {
        adapted = adaptFormAnswers(input.formAnswers as RawFormSubmission);
      } catch (err: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
      }

      // Run compliance — store results upfront
      const complianceItems = evaluateHomeCompliance(adapted);
      const overallResult = aggregateOverallResult(complianceItems);

      // Placeholder token hash (real one set in webhook after payment)
      // We need a token in the DB for the row — use random placeholder that will be replaced
      const placeholderRaw = randomBytes(32).toString("hex");
      const placeholderHash = createHash("sha256").update(placeholderRaw).digest("hex");

      const result = await db.insert(homeReports).values({
        reportToken: placeholderHash,
        email: input.email,
        province: adapted.province,
        municipality: adapted.municipality,
        projectType: adapted.projectType,
        formAnswersJson: input.formAnswers as any,
        complianceResultJson: { items: complianceItems } as any,
        overallResult,
        paymentStatus: "pending",
        createdAt: new Date(),
      });

      const reportId = result[0].insertId;

      // Founding member: bypass payment if they have reports remaining
      const userId = ctx.user?.id;
      if (userId) {
        const [sub] = await db
          .select({
            isFoundingMember:    userSubscriptions.isFoundingMember,
            homeReportsRemaining: userSubscriptions.homeReportsRemaining,
          })
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, userId))
          .limit(1);

        if (sub?.isFoundingMember === 1 && (sub?.homeReportsRemaining ?? 0) > 0) {
          const rawToken = randomBytes(32).toString("hex");
          const tokenHash = createHash("sha256").update(rawToken).digest("hex");
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          await db.update(homeReports)
            .set({
              reportToken: tokenHash,
              paymentStatus: "paid",
              downloadExpiresAt: expiresAt,
              reportGeneratedAt: now,
            })
            .where(eq(homeReports.id, reportId));

          await db.update(userSubscriptions)
            .set({ homeReportsRemaining: sql`homeReportsRemaining - 1` })
            .where(eq(userSubscriptions.userId, userId));

          console.log(`[HomeRouter] Founding member ${userId} used 1 included report (${(sub.homeReportsRemaining) - 1} remaining)`);

          return {
            clientSecret: null,
            paymentIntentId: null,
            reportId,
            overallResult,
            reportToken: rawToken,
            foundingMemberReport: true,
            previewItems: complianceItems.slice(0, 2).map((i) => ({
              ruleId: i.ruleId,
              description: i.description,
              result: i.result,
            })),
          };
        }
      }

      // Create Stripe PaymentIntent
      let clientSecret: string;
      let paymentIntentId: string;
      try {
        ({ clientSecret, paymentIntentId } = await createPaymentIntent(reportId, input.email));
      } catch (err: any) {
        // If Stripe is not configured, return a dev-mode response
        console.warn("[HomeRouter] Stripe not configured — returning mock PI for dev:", err.message);
        return {
          clientSecret: "dev_mock_client_secret",
          paymentIntentId: `dev_pi_${reportId}`,
          reportId,
          overallResult,
          reportToken: null,
          foundingMemberReport: false,
          previewItems: complianceItems.slice(0, 2).map((i) => ({
            ruleId: i.ruleId,
            description: i.description,
            result: i.result,
          })),
        };
      }

      // Store paymentIntentId so webhook can look up the report
      await db.update(homeReports)
        .set({ stripePaymentIntentId: paymentIntentId })
        .where(eq(homeReports.id, reportId));

      return {
        clientSecret,
        paymentIntentId,
        reportId,
        overallResult,
        reportToken: null,
        foundingMemberReport: false,
        previewItems: complianceItems.slice(0, 2).map((i) => ({
          ruleId: i.ruleId,
          description: i.description,
          result: i.result,
        })),
      };
    }),

  /**
   * 2. getPreview
   * Runs compliance check against stored form answers.
   * Returns partial results (ruleId + result only — no plainLanguage details).
   * Full compliance detail is gated behind payment.
   */
  getPreview: publicProcedure
    .input(z.object({ paymentIntentId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [report] = await db
        .select()
        .from(homeReports)
        .where(eq(homeReports.stripePaymentIntentId, input.paymentIntentId))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });

      const complianceResult = report.complianceResultJson as { items: any[] } | null;
      const items = complianceResult?.items ?? [];

      return {
        paymentStatus: report.paymentStatus,
        overallResult: report.overallResult,
        province: report.province,
        projectType: report.projectType,
        // Preview: ruleId + description + result visible, no plainLanguage or whatToDo
        previewItems: items.map((i: any) => ({
          ruleId: i.ruleId,
          description: i.description,
          result: i.result,
        })),
      };
    }),

  /**
   * 3. getReport
   * Poll report status by paymentIntentId.
   * Used by the /home/processing page while webhook is processing.
   */
  getReport: publicProcedure
    .input(z.object({ paymentIntentId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [report] = await db
        .select()
        .from(homeReports)
        .where(eq(homeReports.stripePaymentIntentId, input.paymentIntentId))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });

      return {
        paymentStatus: report.paymentStatus,
        overallResult: report.overallResult,
        reportGeneratedAt: report.reportGeneratedAt,
        pdfReady: !!report.pdfStorageKey,
      };
    }),

  /**
   * 4. downloadReport
   * Token-based access — no authentication required.
   * Hashes the raw token from the email link and looks up the SHA-256 hash in DB.
   * Returns full compliance data + signed PDF URL (if S3 configured).
   * Enforces 30-day expiry.
   */
  downloadReport: publicProcedure
    .input(z.object({ rawToken: z.string().length(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Hash the raw token — never store raw token, only compare hashes
      const tokenHash = createHash("sha256").update(input.rawToken).digest("hex");

      const [report] = await db
        .select()
        .from(homeReports)
        .where(eq(homeReports.reportToken, tokenHash))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found — the link may be invalid or expired" });

      if (report.paymentStatus !== "paid") {
        throw new TRPCError({ code: "FORBIDDEN", message: "This report has not been paid for" });
      }

      // 30-day expiry check
      if (report.downloadExpiresAt && new Date() > report.downloadExpiresAt) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This download link has expired. Contact support to recover your report." });
      }

      const complianceResult = report.complianceResultJson as { items: any[] } | null;

      return {
        email: report.email,
        province: report.province,
        municipality: report.municipality,
        projectType: report.projectType,
        overallResult: report.overallResult,
        complianceItems: complianceResult?.items ?? [],
        pdfStorageKey: report.pdfStorageKey,
        reportGeneratedAt: report.reportGeneratedAt,
        downloadExpiresAt: report.downloadExpiresAt,
      };
    }),

  getMyReports: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user.email) return [];
      return db
        .select({
          id:                homeReports.id,
          paymentStatus:     homeReports.paymentStatus,
          reportGeneratedAt: homeReports.reportGeneratedAt,
          downloadExpiresAt: homeReports.downloadExpiresAt,
          reportToken:       homeReports.reportToken,
          projectType:       homeReports.projectType,
          overallResult:     homeReports.overallResult,
          province:          homeReports.province,
          createdAt:         homeReports.createdAt,
        })
        .from(homeReports)
        .where(eq(homeReports.email, ctx.user.email))
        .orderBy(desc(homeReports.createdAt))
        .limit(20);
    }),
});
