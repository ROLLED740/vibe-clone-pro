"use server";

import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { subscriptions } from '../../db/schema';

export async function downgradeSubscription() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Check current active status in Neon Postgres
  const userSubs = await db.select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (userSubs.length === 0 || userSubs[0].status !== 'active') {
    throw new Error('No active subscription found to downgrade.');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  });

  const subscriptionId = userSubs[0].id;

  try {
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      { cancel_at_period_end: true }
    );
    return { success: true, subscription: updatedSubscription };
  } catch (error) {
    console.error('Failed to execute Stripe API call:', error);
    throw new Error('Failed to downgrade subscription via Stripe.');
  }
}
