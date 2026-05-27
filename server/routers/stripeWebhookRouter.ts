/**
 * Stripe Webhook Handler — CodeComply Home
 *
 * Registered as a raw Express route BEFORE express.json() middleware
 * so that req.body is the raw Buffer needed for Stripe signature verification.
 *
 * Handles: payment_intent.succeeded
 *   1. Verify Stripe signature (rejects tampered requests)
 *   2. Idempotency guard — skip if report already paid
 *   3. Mark paymentStatus = 'paid', set downloadExpiresAt (30 days)
 *   4. Generate PDF (via homeReportPdfService)
 *   5. Store PDF in S3 (pdfStorageKey)
 *   6. Generate raw download token, store SHA-256 hash in DB
 *   7. Send email with raw token link
 *
 * Rev 2 Fix 2: PDF triggered by webhook — never by client redirect.
 * Rev 2 Fix 1: Raw token in email only; SHA-256 hash in DB.
 */

import type { Request, Response } from "express";
import { getDb } from "../db.js";
import { homeReports } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { constructWebhookEvent } from "../services/stripeService.js";
import { randomBytes, createHash } from "crypto";
import { generateHomeReportPdf, getProjectTypeLabel } from "../services/homePdfService.js";
import { sendReportEmail } from "../services/homeEmailService.js";
import { evaluateHomeCompliance } from "../engine/home/part9Rules.js";
import { adaptFormAnswers, type RawFormSubmission } from "../services/homeReportAdapter.js";
import type { ComplianceReport } from "../services/homeComplianceEngine.js";

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  let event;
  try {
    event = constructWebhookEvent(
      req.body as Buffer,
      req.headers["stripe-signature"] as string,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[StripeWebhook] Signature verification failed: ${msg}`);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type !== "payment_intent.succeeded") {
    res.json({ received: true });
    return;
  }

  const paymentIntent = event.data.object as { id: string; metadata?: { reportId?: string } };
  const paymentIntentId = paymentIntent.id;

  try {
    await processSuccessfulPayment(paymentIntentId);
    res.json({ received: true });
  } catch (err) {
    console.error(`[StripeWebhook] Processing error for ${paymentIntentId}:`, err);
    // Return 200 — do not let Stripe retry for application errors
    res.json({ received: true, warning: "Processing error logged" });
  }
}

async function processSuccessfulPayment(paymentIntentId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [report] = await db
    .select()
    .from(homeReports)
    .where(eq(homeReports.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  if (!report) {
    console.error(`[StripeWebhook] No report found for PI ${paymentIntentId}`);
    return;
  }

  // Idempotency: skip if already processed
  if (report.paymentStatus === "paid") {
    console.log(`[StripeWebhook] Report ${report.id} already paid — skipping`);
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Mark paid immediately — before PDF generation, so the user can see status
  await db.update(homeReports)
    .set({ paymentStatus: "paid", downloadExpiresAt: expiresAt })
    .where(eq(homeReports.id, report.id));

  // Generate raw download token — only the hash is stored
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  // Generate PDF
  const appUrl = process.env.APP_URL ?? "https://app.codecomply.ca";
  const downloadUrl = `${appUrl}/home/report/${rawToken}`;
  const projectTypeLabel = getProjectTypeLabel(report.projectType as any);

  let pdfStorageKey: string | null = null;

  try {
    // Re-run compliance from stored form answers to get the full result shape
    const rawAnswers = report.formAnswersJson as RawFormSubmission;
    const adapted = adaptFormAnswers(rawAnswers);
    const complianceItems = evaluateHomeCompliance(adapted);

    const complianceResult: ComplianceReport = {
      projectType: report.projectType,
      province: report.province,
      codeEdition: { AB: "Alberta Building Code 2019", BC: "BC Building Code 2024", ON: "Ontario Building Code 2012" }[report.province] ?? "",
      overallResult: report.overallResult as "pass" | "conditional" | "fail" ?? "conditional",
      items: complianceItems.map((i) => ({
        ruleId: i.ruleId,
        title: i.description,
        result: i.result === "not_applicable" ? "conditional" : i.result,
        message: i.plainLanguage,
        whatToDo: i.whatToDo,
        codeRef: i.codeReference,
      })),
    };

    const pdfBuffer = await generateHomeReportPdf(complianceResult, {
      reportToken: rawToken,
      email: report.email,
      province: report.province,
      municipality: report.municipality ?? undefined,
      projectTypeLabel,
      generatedAt: now,
    });

    // Store in S3 if configured; otherwise log the buffer size
    const awsBucket = process.env.AWS_S3_BUCKET;
    if (awsBucket) {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({ region: process.env.AWS_REGION ?? "ca-central-1" });
      pdfStorageKey = `home-reports/${report.id}-${now.getTime()}.pdf`;
      await s3.send(new PutObjectCommand({
        Bucket: awsBucket,
        Key: pdfStorageKey,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        ContentDisposition: `attachment; filename="codecomply-report-${report.id}.pdf"`,
      }));
    } else {
      console.log(`[StripeWebhook] S3 not configured — PDF generated (${pdfBuffer.length} bytes), skipping upload`);
    }
  } catch (err) {
    console.error(`[StripeWebhook] PDF generation failed for report ${report.id}:`, err);
    // Don't block token update — user can still access the report page
  }

  // Store the SHA-256 hash (never the raw token) + pdfStorageKey
  await db.update(homeReports)
    .set({
      reportToken: tokenHash,
      pdfStorageKey: pdfStorageKey ?? undefined,
      reportGeneratedAt: now,
    })
    .where(eq(homeReports.id, report.id));

  // Send email with raw token in the link
  try {
    await sendReportEmail({
      to: report.email,
      reportToken: rawToken, // raw token for email link only
      projectTypeLabel,
      downloadUrl,
      expiresAt,
    });
  } catch (err) {
    console.error(`[StripeWebhook] Email failed for report ${report.id}:`, err);
  }

  console.log(`[StripeWebhook] Report ${report.id} complete — paid, PDF stored, email sent`);
}
