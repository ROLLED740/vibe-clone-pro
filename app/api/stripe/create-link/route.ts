import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// We cast to 'any' to bypass the strict version check causing the error
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { 
  apiVersion: '2023-10-16' as any 
});

export async function POST(req: Request) {
  try {
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
  } catch (error) {
    console.error('Stripe Error:', error);
    return NextResponse.json({ error: 'Payment generation failed' }, { status: 500 });
  }
}
