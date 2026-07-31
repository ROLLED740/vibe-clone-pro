import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

const MAX_PRICE_USD = 10_000;

/**
 * Mints a Stripe payment link for an app the user generated.
 *
 * Requires a signed-in user: without it, anyone could create products and
 * payment links on the connected Stripe account.
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
    const appName = typeof body?.appName === 'string' ? body.appName.trim().slice(0, 100) : '';
    const price = Number(body?.price);

    if (!appName) {
      return NextResponse.json({ error: 'appName is required' }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE_USD) {
      return NextResponse.json(
        { error: `price must be between 1 and ${MAX_PRICE_USD}` },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const product = await stripe.products.create({
      name: `${appName} - License`,
      description: 'Generated with VibeClonePro',
      metadata: { createdBy: userId },
    });

    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
      metadata: { createdBy: userId },
      after_completion: { type: 'redirect', redirect: { url: `${appUrl}/dashboard` } },
    });

    return NextResponse.json({ url: paymentLink.url });
  } catch (error: unknown) {
    console.error('Stripe Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment generation failed' },
      { status: 500 }
    );
  }
}
