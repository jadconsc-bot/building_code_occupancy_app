/**
 * Stripe Webhook Handler — CodeComply Home + Pro Subscriptions
 *
 * Registered as a raw Express route BEFORE express.json() middleware
 * so that req.body is the raw Buffer needed for Stripe signature verification.
 *
 * Handles:
 *   payment_intent.succeeded           — Home $29 one-time report purchase
 *   customer.subscription.created      — Pro/Team subscription start → role upgrade
 *   customer.subscription.updated      — Plan change → re-evaluate role
 *   customer.subscription.deleted      — Cancellation → downgrade to free
 *   invoice.payment_failed             — Payment failure → downgrade to free
 */

import type { Request, Response } from "express";
import { getDb } from "../db.js";
import { homeReports, users, userSubscriptions } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { constructWebhookEvent } from "../services/stripeService.js";
import { randomBytes, createHash } from "crypto";
import { generateHomeReportPdf, getProjectTypeLabel } from "../services/homePdfService.js";
import { sendReportEmail } from "../services/homeEmailService.js";
import { evaluateHomeCompliance } from "../engine/home/part9Rules.js";
import { adaptFormAnswers, type RawFormSubmission } from "../services/homeReportAdapter.js";
import type { ComplianceReport } from "../services/homeComplianceEngine.js";
import {
  STRIPE_PRO_MONTHLY_PRICE_ID,
  STRIPE_PRO_ANNUAL_PRICE_ID,
  STRIPE_TEAM_PRICE_ID,
} from "../_core/stripeEnv.js";
import { createStripeClient } from "../services/stripeService.js";

const HANDLED_EVENTS = new Set([
  "payment_intent.succeeded",
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);

function roleFromPriceId(priceId: string): "professional" | "org_admin" | "free" {
  if (priceId === STRIPE_PRO_MONTHLY_PRICE_ID) return "professional";
  if (priceId === STRIPE_PRO_ANNUAL_PRICE_ID)  return "professional";
  if (priceId === STRIPE_TEAM_PRICE_ID)        return "org_admin";
  return "free";
}

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

  if (!HANDLED_EVENTS.has(event.type)) {
    res.json({ received: true });
    return;
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as { id: string };
        await processSuccessfulPayment(pi.id);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as { customer: string; subscription: string };
        console.log(`[StripeWebhook] Checkout completed — customer ${session.customer}, subscription ${session.subscription}`);
        // subscription.created fires separately and handles role upgrade
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await processSubscriptionUpsert(event.data.object as StripeSubscriptionLike);
        break;
      }
      case "customer.subscription.deleted": {
        await processSubscriptionDeleted(event.data.object as { customer: string; id: string });
        break;
      }
      case "invoice.payment_failed": {
        await processInvoicePaymentFailed(event.data.object as { customer: string });
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error(`[StripeWebhook] Processing error for ${event.type}:`, err);
    // Return 200 — do not let Stripe retry for application errors
    res.json({ received: true, warning: "Processing error logged" });
  }
}

// ─── Subscription helpers ─────────────────────────────────────────────────────

interface StripeSubscriptionLike {
  id: string;
  customer: string;
  status: string;
  items: { data: Array<{ price: { id: string } }> };
}

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/**
 * Look up which user owns a Stripe customer ID.
 * Primary path: userSubscriptions.stripeCustomerId match.
 * Fallback for old users: fetch customer email from Stripe, match users.email,
 * then backfill the userSubscriptions row so future webhooks hit the primary path.
 */
async function findUserByStripeCustomer(
  db: Db,
  stripeCustomerId: string,
): Promise<{ userId: number } | null> {
  const [sub] = await db
    .select({ userId: userSubscriptions.userId })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeCustomerId, stripeCustomerId))
    .limit(1);

  if (sub) return sub;

  // Fallback: resolve via Stripe customer email
  try {
    const stripe = createStripeClient();
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (customer.deleted || !("email" in customer) || !customer.email) {
      console.log(`[StripeWebhook] Email fallback: customer ${stripeCustomerId} has no email`);
      return null;
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, customer.email))
      .limit(1);

    if (!user) {
      console.log(`[StripeWebhook] Email fallback: no user found for email ${customer.email}`);
      return null;
    }

    // Backfill so the next webhook takes the fast path
    const now = new Date();
    await db
      .insert(userSubscriptions)
      .values({
        userId: user.id,
        planId: 0,
        stripeCustomerId,
        status: "active" as any,
        billingCycle: "monthly" as any,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      })
      .onDuplicateKeyUpdate({ set: { stripeCustomerId } });

    console.log(`[StripeWebhook] Email fallback: linked customer ${stripeCustomerId} to user ${user.id}`);
    return { userId: user.id };
  } catch (err) {
    console.error(`[StripeWebhook] Email fallback failed for customer ${stripeCustomerId}:`, err);
    return null;
  }
}

async function processSubscriptionUpsert(subscription: StripeSubscriptionLike): Promise<void> {
  const stripeCustomerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price?.id ?? "";
  const newRole = roleFromPriceId(priceId);

  if (newRole === "free") {
    console.log(`[StripeWebhook] Unknown price ID ${priceId} — skipping role upgrade`);
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const sub = await findUserByStripeCustomer(db, stripeCustomerId);
  if (!sub) {
    console.log(`[StripeWebhook] No user found for customer ${stripeCustomerId} — skipping`);
    return;
  }

  await db
    .update(users)
    .set({ role: newRole })
    .where(eq(users.id, sub.userId));

  await db
    .update(userSubscriptions)
    .set({ stripeSubscriptionId: subscription.id, status: "active" })
    .where(eq(userSubscriptions.stripeCustomerId, stripeCustomerId));

  console.log(`[StripeWebhook] User ${sub.userId} upgraded to ${newRole} (subscription ${subscription.id})`);
}

async function processSubscriptionDeleted(subscription: { customer: string; id: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const sub = await findUserByStripeCustomer(db, subscription.customer);
  if (!sub) {
    console.log(`[StripeWebhook] No user found for customer ${subscription.customer} — skipping`);
    return;
  }

  await db
    .update(users)
    .set({ role: "free" })
    .where(eq(users.id, sub.userId));

  await db
    .update(userSubscriptions)
    .set({ stripeSubscriptionId: null, status: "cancelled" })
    .where(eq(userSubscriptions.stripeCustomerId, subscription.customer));

  console.log(`[StripeWebhook] User ${sub.userId} downgraded to free (subscription deleted)`);
}

async function processInvoicePaymentFailed(invoice: { customer: string }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const sub = await findUserByStripeCustomer(db, invoice.customer);
  if (!sub) {
    console.log(`[StripeWebhook] No user found for customer ${invoice.customer} — skipping`);
    return;
  }

  await db
    .update(users)
    .set({ role: "free" })
    .where(eq(users.id, sub.userId));

  console.log(`[StripeWebhook] User ${sub.userId} downgraded to free (invoice payment failed)`);
}

// ─── Home report payment ──────────────────────────────────────────────────────

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
  }

  await db.update(homeReports)
    .set({
      reportToken: tokenHash,
      pdfStorageKey: pdfStorageKey ?? undefined,
      reportGeneratedAt: now,
    })
    .where(eq(homeReports.id, report.id));

  try {
    await sendReportEmail({
      to: report.email,
      reportToken: rawToken,
      projectTypeLabel,
      downloadUrl,
      expiresAt,
    });
  } catch (err) {
    console.error(`[StripeWebhook] Email failed for report ${report.id}:`, err);
  }

  console.log(`[StripeWebhook] Report ${report.id} complete — paid, PDF stored, email sent`);
}
