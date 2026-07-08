// Real-money coin packs via Stripe Payment Links.
//
// Flow: the buy button opens a Stripe Payment Link with the player's user id
// as client_reference_id → Stripe charges the card → the stripe-webhook edge
// function (supabase/functions/stripe-webhook) verifies the event and inserts
// an unclaimed row into coin_credits → the game claims it atomically via the
// claim_coin_credits() RPC (on sign-in and on window focus). Coins are only
// ever credited server-side; nothing here can be forged by a client.
//
// IMPORTANT: YouTube Playables forbids third-party payments entirely, so the
// shop hides coin packs whenever the game runs inside YouTube regardless of
// configuration. Only enable payments for builds you host yourself.

import { STRIPE_PAYMENT_LINKS, CLOUD_ENABLED } from './config.js';
import { cloudUser } from './cloud.js';

export const COIN_PACKS = [
  { id: 'pack-s', coins: 500, label: 'Pocketful', priceLabel: '$0.99' },
  { id: 'pack-m', coins: 3000, label: 'Sack of Coins', priceLabel: '$4.99' },
  { id: 'pack-l', coins: 10000, label: 'Treasure Chest', priceLabel: '$9.99' },
];

export function paymentsEnabled() {
  return CLOUD_ENABLED() && Object.values(STRIPE_PAYMENT_LINKS).some(Boolean);
}

export async function purchasePack(packId) {
  if (!paymentsEnabled()) return { ok: false, reason: 'not-configured' };
  const user = cloudUser();
  if (!user) return { ok: false, reason: 'sign-in-required' };
  const link = STRIPE_PAYMENT_LINKS[packId];
  if (!link) return { ok: false, reason: 'not-configured' };
  window.open(
    `${link}?client_reference_id=${encodeURIComponent(user.id)}` +
    `&prefilled_email=${encodeURIComponent(user.email || '')}`,
    '_blank',
  );
  return { ok: false, reason: 'checkout-opened' };
}
