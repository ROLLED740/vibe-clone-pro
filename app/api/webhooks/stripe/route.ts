import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export const dynamic = 'force-dynamic';

// Connect lazily inside the handler: initialising at module scope makes the
// production build fail whenever DATABASE_URL isn't present at build time.
function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return drizzle(neon(process.env.DATABASE_URL));
}

export async function POST(req: Request) {
  // 1. Build-Safe Environment Check
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('CRITICAL: Missing Stripe environment variables.');
    return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });

  // 2. Extract and Verify the Webhook Signature
  const body = await req.text();
  const signature = await headers().then(h => h.get('Stripe-Signature')) as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const error = err as Stripe.errors.StripeSignatureVerificationError;
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // 3. Handle the Billing Events
  try {
    const db = getDb();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // When a checkout finishes, map the Stripe Customer ID to your Clerk User ID
        if (session && session.client_reference_id) {
          await db.update(users)
            .set({ stripeCustomerId: session.customer as string })
            .where(eq(users.id, session.client_reference_id));
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Sync the active subscription data into Neon
        await db.insert(subscriptions).values({
          id: subscription.id,
          userId: subscription.metadata.userId, // Ensure you pass userId in your checkout session metadata!
          stripePriceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        }).onConflictDoUpdate({
          target: subscriptions.id,
          set: {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          }
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update status to canceled in Neon
        await db.update(subscriptions)
          .set({ status: subscription.status, updatedAt: new Date() })
          .where(eq(subscriptions.id, subscription.id));
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Database Sync Error:', error);
    return NextResponse.json({ error: 'Failed to sync with database' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
