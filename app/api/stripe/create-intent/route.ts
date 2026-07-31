import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { getPlan, type BillingInterval } from '@/lib/plans';

export const dynamic = 'force-dynamic';

/**
 * Creates a PaymentIntent for an in-page card form.
 *
 * The client sends a plan id — never an amount. Trusting a client-supplied
 * amount here would let anyone buy any plan for a penny.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Billing is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const planId = typeof body?.planId === 'string' ? body.planId : '';
    const interval: BillingInterval = body?.interval === 'yearly' ? 'yearly' : 'monthly';

    const plan = getPlan(planId);
    if (!plan || plan.cta.kind !== 'checkout') {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    const amount = plan.price[interval];
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'That plan is not purchasable' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { userId, planId: plan.id, interval },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      planName: plan.name,
    });
  } catch (error: unknown) {
    console.error('Stripe Intent Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to init payment' },
      { status: 500 }
    );
  }
}
