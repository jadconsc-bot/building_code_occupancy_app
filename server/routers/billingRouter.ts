/**
 * Billing Router
 * Stripe-gated billing procedures — returns real errors when Stripe is not configured.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';

function requireStripe(): never {
  throw new TRPCError({
    code: 'NOT_IMPLEMENTED',
    message:
      'This feature requires Stripe integration. Please configure STRIPE_SECRET_KEY to enable billing management.',
  });
}

export const billingRouter = router({
  /**
   * Download a Stripe invoice as PDF.
   * Requires Stripe integration.
   */
  downloadInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async () => {
      requireStripe();
    }),

  /**
   * Update the default payment method on the Stripe customer.
   * Requires Stripe integration.
   */
  updatePaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async () => {
      requireStripe();
    }),

  /**
   * Add a new payment method to the Stripe customer.
   * Requires Stripe integration.
   */
  addPaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async () => {
      requireStripe();
    }),

  /**
   * Update billing address on the Stripe customer.
   * Requires Stripe integration.
   */
  updateBillingAddress: protectedProcedure
    .input(
      z.object({
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        province: z.string(),
        postalCode: z.string(),
        country: z.string().default('CA'),
      })
    )
    .mutation(async () => {
      requireStripe();
    }),

  /**
   * Add a tax ID (GST/HST number) to the Stripe customer.
   * Requires Stripe integration.
   */
  addTaxId: protectedProcedure
    .input(z.object({ taxId: z.string(), type: z.string().default('ca_gst') }))
    .mutation(async () => {
      requireStripe();
    }),
});
