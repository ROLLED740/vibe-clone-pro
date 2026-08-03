'use server';

import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '@/db/schema';
import { getPlan, resolveStripePriceId, type BillingInterval } from '@/lib/plans';

/**
 * Starts Stripe Checkout for a plan.
 *
 * The client sends a plan id and interval; the price is resolved here from
 * server-side env vars, so a tampered request can't change what gets charged.
 */
export async function startCheckout(planId: string, interval: BillingInterval) {
  const { userId } = await auth();
  if (!userId) throw new Error('Please sign in to continue.');

  const plan = getPlan(planId);
  if (!plan || plan.cta.kind !== 'checkout') {
    throw new Error('That plan is not available for self-serve checkout.');
  }

  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Billing is not configured yet.');

  const priceId = resolveStripePriceId(plan, interval);
  if (!priceId) {
    throw new Error(`${plan.name} is not available for purchase yet — check back shortly.`);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Reuse the Stripe customer already mapped to this user so repeat purchases
  // and the billing portal stay on one customer record.
  let customerId: string | undefined;
  if (process.env.DATABASE_URL) {
    try {
      const db = drizzle(neon(process.env.DATABASE_URL));
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      customerId = rows[0]?.stripeCustomerId ?? undefined;
    } catch (err) {
      console.error('Could not look up Stripe customer, continuing without it:', err);
    }
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    customer: customerId,
    client_reference_id: userId,
    allow_promotion_codes: true,
    metadata: { userId, planId: plan.id, interval },
    // The webhook reads userId off the subscription itself.
    subscription_data: { metadata: { userId, planId: plan.id, interval } },
    success_url: `${appUrl}/studio?upgraded=${plan.id}`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
  });

  if (!session.url) throw new Error('Failed to create checkout session');

  return { url: session.url };
}
