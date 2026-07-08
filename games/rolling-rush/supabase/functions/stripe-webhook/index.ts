// Supabase Edge Function: Stripe webhook that credits purchased coins.
//
// Deploy:   supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets:  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.)
//
// In Stripe: Developers → Webhooks → Add endpoint
//   URL:    https://<project-ref>.functions.supabase.co/stripe-webhook
//   Event:  checkout.session.completed
//
// Each Payment Link must carry metadata `coins` = the pack size (set this in
// the Payment Link's product metadata), and the game passes the player's id
// as client_reference_id.

import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe('sk_unused', { apiVersion: '2024-06-20' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(), signature, webhookSecret,
    );
  } catch (err) {
    return new Response(`bad signature: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const coins = Number(session.metadata?.coins);

    if (!userId || !Number.isFinite(coins) || coins <= 0) {
      // Paid but unattributable — surface loudly in function logs.
      console.error('checkout completed without user/coins', session.id);
      return new Response('ignored', { status: 200 });
    }

    const { error } = await supabase.from('coin_credits').insert({
      user_id: userId,
      coins,
      stripe_session_id: session.id,   // unique: retried webhooks are no-ops
    });
    if (error && !error.message.includes('duplicate')) {
      console.error('credit insert failed', error);
      return new Response('retry', { status: 500 });
    }
  }

  return new Response('ok', { status: 200 });
});
