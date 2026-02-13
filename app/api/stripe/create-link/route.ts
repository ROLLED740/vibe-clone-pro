import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' });

export async function POST(req: Request) {
  try {
    const { appName, price } = await req.json();
    const product = await stripe.products.create({ name: \`\${appName} - License\`, description: 'VibeClonePro Generated' });
    const priceObj = await stripe.prices.create({ product: product.id, unit_amount: price * 100, currency: 'usd' });
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
      after_completion: { type: 'redirect', redirect: { url: 'https://vibeclonepro.com/dashboard' } }
    });
    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    return NextResponse.json({ error: 'Payment generation failed' }, { status: 500 });
  }
}
