import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    // We cast to 'any' to bypass the strict version check causing the error
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
      // @ts-expect-error - bypassing strict version check
      apiVersion: '2023-10-16'
    });

    const { appName, price } = await req.json();
    
    // Create product
    const product = await stripe.products.create({ 
      name: `${appName} - License`, 
      description: 'VibeClonePro Generated' 
    });
    
    // Create price
    const priceObj = await stripe.prices.create({ 
      product: product.id, 
      unit_amount: price * 100, 
      currency: 'usd' 
    });
    
    // Create link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
      after_completion: { type: 'redirect', redirect: { url: 'https://vibeclonepro.com/dashboard' } }
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
