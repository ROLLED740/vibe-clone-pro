import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
      // @ts-expect-error - bypassing strict version check
      apiVersion: '2023-10-16'
    });

    const { amount } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: unknown) {
    console.error('Stripe Intent Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to init payment' }, 
      { status: 500 }
    );
  }
}
