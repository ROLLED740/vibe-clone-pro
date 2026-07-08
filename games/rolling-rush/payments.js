// Real-money purchase hook.
//
// This is intentionally a stub: charging real money requires a payments
// provider (e.g. Stripe) plus a small backend to verify purchases and credit
// coins — neither can live safely in client-side code. When that backend
// exists, implement purchasePack() to open the provider's checkout and
// resolve with the verified coin amount.
//
// IMPORTANT: YouTube Playables forbids third-party payments entirely, so the
// shop hides coin packs whenever the game runs inside YouTube regardless of
// this flag. Only enable payments for builds you host yourself.

export const PAYMENTS_ENABLED = false;

export const COIN_PACKS = [
  { id: 'pack-s', coins: 500, label: 'Pocketful', priceLabel: '$0.99' },
  { id: 'pack-m', coins: 3000, label: 'Sack of Coins', priceLabel: '$4.99' },
  { id: 'pack-l', coins: 10000, label: 'Treasure Chest', priceLabel: '$9.99' },
];

export async function purchasePack(_packId) {
  return { ok: false, reason: 'not-configured' };
}
