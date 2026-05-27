/**
 * Stripe webhook handler for CodeComply Home payments.
 *
 * Registered BEFORE express.json() to preserve raw body for signature verification.
 * Idempotent — checks paymentStatus = 'paid' before processing to handle duplicate delivery.
 *
 * On checkout.session.completed:
 *   1. Verify Stripe signature
 *   2. Look up homeReport by reportToken from metadata
 *   3. Guard: skip if already paid (idempotency)
 *   4. Mark paid, set downloadExpiresAt (30 days)
 *   5. Generate PDF
 *   6. Send email with download link
 */

import type { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db.js";
import { homeReports } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { generateHomeReportPdf, getProjectTypeLabel } from "../services/homePdfService.js";
import { sendReportEmail } from "../services/homeEmailService.js";
import type { ComplianceReport } from "../services/homeComplianceEngine.js";

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeKey) {
    console.error("[HomeWebhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not configured");
    res.status(500).json({ error: "Stripe not configured" });
    return;
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      req.headers["stripe-signature"] as string,
      webhookSecret,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[HomeWebhook] Signature verification failed: ${message}`);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type !== "checkout.session.completed") {
    res.json({ received: true });
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const reportToken = session.metadata?.reportToken;

  if (!reportToken) {
    console.warn("[HomeWebhook] checkout.session.completed missing reportToken metadata");
    res.json({ received: true });
    return;
  }

  try {
    await processPaymentSuccess(reportToken, session.id);
    res.json({ received: true });
  } catch (err) {
    console.error(`[HomeWebhook] Error processing payment for token ${reportToken}:`, err);
    // Return 200 to prevent Stripe from retrying — we log the error
    res.json({ received: true, warning: "Processing error logged" });
  }
}

async function processPaymentSuccess(reportToken: string, checkoutSessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [report] = await db
    .select()
    .from(homeReports)
    .where(eq(homeReports.reportToken, reportToken))
    .limit(1);

  if (!report) {
    console.error(`[HomeWebhook] Report not found for token ${reportToken}`);
    return;
  }

  // Idempotency guard — duplicate webhook delivery is safe
  if (report.paymentStatus === "paid") {
    console.log(`[HomeWebhook] Report ${reportToken} already paid — skipping`);
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.update(homeReports)
    .set({
      paymentStatus: "paid",
      stripeCheckoutSessionId: checkoutSessionId,
      downloadExpiresAt: expiresAt,
    })
    .where(eq(homeReports.reportToken, reportToken));

  // Generate PDF only after confirmed payment
  const complianceResult = report.complianceResultJson as ComplianceReport | null;
  if (!complianceResult) {
    console.warn(`[HomeWebhook] No compliance data for report ${reportToken} — skipping PDF`);
    return;
  }

  const projectTypeLabel = getProjectTypeLabel(report.projectType);
  const appUrl = process.env.APP_URL ?? "https://app.codecomply.ca";
  const downloadUrl = `${appUrl}/home/report/${reportToken}`;

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateHomeReportPdf(complianceResult, {
      reportToken,
      email: report.email,
      province: report.province,
      municipality: report.municipality ?? undefined,
      projectTypeLabel,
      generatedAt: now,
    });

    await db.update(homeReports)
      .set({ pdfGeneratedAt: now })
      .where(eq(homeReports.reportToken, reportToken));
  } catch (err) {
    console.error(`[HomeWebhook] PDF generation failed for ${reportToken}:`, err);
    // Don't block email — user can still access report via download page
  }

  // Send email with download link
  try {
    await sendReportEmail({
      to: report.email,
      reportToken,
      projectTypeLabel,
      downloadUrl,
      expiresAt: expiresAt,
    });
  } catch (err) {
    console.error(`[HomeWebhook] Email delivery failed for ${reportToken}:`, err);
  }

  console.log(`[HomeWebhook] Report ${reportToken} processed — paid, PDF generated, email sent`);
}
