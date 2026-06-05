/**
 * CodeComply Home — Stripe Service
 *
 * Rev 2: PaymentIntent pattern (not Checkout Session).
 * clientSecret returned to frontend for Stripe Elements.
 * PDF generation triggered by payment_intent.succeeded webhook, never client redirect.
 *
 * Env vars required (add to Railway — env.ts is locked):
 *   STRIPE_SECRET_KEY=sk_live_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 */

import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-04-22.dahlia" as const;
const REPORT_PRICE_CAD = 2900; // $29.00 CAD in cents

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export async function createPaymentIntent(
  reportId: number,
  email: string,
): Promise<PaymentIntentResult> {
  const stripe = getStripe();

  const intent = await stripe.paymentIntents.create({
    amount: REPORT_PRICE_CAD,
    currency: "cad",
    receipt_email: email,
    metadata: { reportId: String(reportId) },
  });

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
  };
}

export function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

export function constructWebhookEvent(
  payload: Buffer | string,
  signature: string,
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");

  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
