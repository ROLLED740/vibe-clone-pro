/**
 * Single source of truth for VibeClonePro billing.
 *
 * The pricing page, the checkout server action and the Stripe webhook all read
 * from here so a price only ever has to change in one place. Stripe price IDs
 * are resolved server-side from `priceEnv` — the client never sends an amount
 * or a price ID.
 */

export type BillingInterval = 'monthly' | 'yearly';

export type PlanId = 'starter' | 'pro' | 'studio' | 'lifetime' | 'enterprise';

export type PlanCta =
  | { kind: 'checkout' }
  | { kind: 'signup' }
  | { kind: 'contact'; href: string };

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Price in whole dollars, keyed by interval. `null` = not sold at that interval. */
  price: Record<BillingInterval, number | null>;
  /** Rendered under the price, e.g. "billed $290 yearly". */
  priceNote?: Partial<Record<BillingInterval, string>>;
  /** One-time purchase rather than a recurring subscription. */
  oneTime?: boolean;
  /** Env var names holding the Stripe price ID, in fallback order. */
  priceEnv?: Partial<Record<BillingInterval, string[]>>;
  highlight?: boolean;
  badge?: string;
  ctaLabel: string;
  cta: PlanCta;
  /** Headline limit shown above the feature list. */
  meter: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Kick the tires on the engine.',
    price: { monthly: 0, yearly: 0 },
    priceNote: { monthly: 'Free forever', yearly: 'Free forever' },
    ctaLabel: 'Start free',
    cta: { kind: 'signup' },
    meter: '3 AI builds per month',
    features: [
      '10 static previews per day',
      'Standard build queue',
      'Live Sandpack editor',
      'Export to a single-file bundle',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For solo builders shipping every week.',
    price: { monthly: 29, yearly: 24 },
    priceNote: { yearly: 'billed $290 yearly' },
    priceEnv: {
      monthly: ['STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRO_PRICE_ID', 'NEXT_PUBLIC_STRIPE_PRO_PRICE_ID'],
      yearly: ['STRIPE_PRICE_PRO_YEARLY', 'STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRO_PRICE_ID'],
    },
    highlight: true,
    badge: 'Most popular',
    ctaLabel: 'Choose Pro',
    cta: { kind: 'checkout' },
    meter: '100 AI builds per month',
    features: [
      'Unlimited static previews',
      'Priority build queue',
      'Swarm engine (parallel variants)',
      'Custom vibe presets',
      'Bring your own API keys',
      'Full project export (Next.js repo)',
      'Commercial use rights',
      'Email support',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'For agencies running client work.',
    price: { monthly: 99, yearly: 82 },
    priceNote: { yearly: 'billed $990 yearly' },
    priceEnv: {
      monthly: ['STRIPE_PRICE_STUDIO_MONTHLY'],
      yearly: ['STRIPE_PRICE_STUDIO_YEARLY', 'STRIPE_PRICE_STUDIO_MONTHLY'],
    },
    ctaLabel: 'Choose Studio',
    cta: { kind: 'checkout' },
    meter: 'Unlimited AI builds',
    features: [
      'Everything in Pro',
      '5 team seats included',
      'Fastest build queue',
      'White-label exports (no badge)',
      'Shared preset library',
      'API access & webhooks',
      'Priority support',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    tagline: 'Pay once. Never see this page again.',
    price: { monthly: 499, yearly: 499 },
    priceNote: { monthly: 'One-time payment', yearly: 'One-time payment' },
    oneTime: true,
    priceEnv: {
      monthly: ['STRIPE_PRICE_LIFETIME', 'STRIPE_LIFETIME_PRICE_ID', 'NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID'],
      yearly: ['STRIPE_PRICE_LIFETIME', 'STRIPE_LIFETIME_PRICE_ID', 'NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID'],
    },
    badge: 'Limited',
    ctaLabel: 'Buy Lifetime',
    cta: { kind: 'checkout' },
    meter: 'Unlimited AI builds, forever',
    features: [
      'Everything in Pro, permanently',
      'All future Pro features included',
      'No recurring charges, ever',
      'Exclusive beta access',
      'VIP support',
    ],
  },
];

export const ENTERPRISE_PLAN: Plan = {
  id: 'enterprise',
  name: 'Enterprise',
  tagline: 'For larger teams with procurement.',
  price: { monthly: null, yearly: null },
  ctaLabel: 'Contact sales',
  cta: { kind: 'contact', href: 'mailto:sales@vibeclonepro.com?subject=VibeClonePro%20Enterprise' },
  meter: 'Custom volume',
  features: [
    'Everything in Studio',
    'Unlimited seats & SSO',
    'White-label integration',
    'Dedicated account manager',
    'Custom SLA & invoicing',
  ],
};

/** Percentage saved by paying yearly, derived from Pro so the badge can't drift. */
export const YEARLY_SAVINGS_PERCENT = (() => {
  const pro = PLANS.find((p) => p.id === 'pro');
  if (!pro?.price.monthly || !pro.price.yearly) return 0;
  return Math.round((1 - pro.price.yearly / pro.price.monthly) * 100);
})();

/**
 * Builds allowed per calendar month. `null` means unmetered.
 * Keep in sync with the `meter` copy on each plan above.
 */
export const MONTHLY_BUILD_LIMIT: Record<PlanId, number | null> = {
  starter: 3,
  pro: 100,
  studio: null,
  lifetime: null,
  enterprise: null,
};

export function getPlan(id: string): Plan | undefined {
  if (id === 'enterprise') return ENTERPRISE_PLAN;
  return PLANS.find((p) => p.id === id);
}

/**
 * Resolves the Stripe price ID for a plan. Server-only: reads non-public env
 * vars and must never be called from a client component.
 */
export function resolveStripePriceId(plan: Plan, interval: BillingInterval): string | null {
  const candidates = plan.priceEnv?.[interval] ?? [];
  for (const name of candidates) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

/** Feature comparison matrix rendered below the cards. */
export const COMPARISON: {
  section: string;
  rows: { label: string; values: Record<'starter' | 'pro' | 'studio' | 'lifetime', string | boolean> }[];
}[] = [
  {
    section: 'Generation',
    rows: [
      {
        label: 'AI builds per month',
        values: { starter: '3', pro: '100', studio: 'Unlimited', lifetime: 'Unlimited' },
      },
      {
        label: 'Static previews per day',
        values: { starter: '10', pro: 'Unlimited', studio: 'Unlimited', lifetime: 'Unlimited' },
      },
      {
        label: 'Swarm engine (parallel variants)',
        values: { starter: false, pro: true, studio: true, lifetime: true },
      },
      {
        label: 'Build queue priority',
        values: { starter: 'Standard', pro: 'Priority', studio: 'Fastest', lifetime: 'Priority' },
      },
    ],
  },
  {
    section: 'Shipping',
    rows: [
      { label: 'Live Sandpack editor', values: { starter: true, pro: true, studio: true, lifetime: true } },
      {
        label: 'Full Next.js project export',
        values: { starter: false, pro: true, studio: true, lifetime: true },
      },
      { label: 'White-label exports', values: { starter: false, pro: false, studio: true, lifetime: false } },
      { label: 'Commercial use rights', values: { starter: false, pro: true, studio: true, lifetime: true } },
    ],
  },
  {
    section: 'Team & support',
    rows: [
      { label: 'Team seats', values: { starter: '1', pro: '1', studio: '5', lifetime: '1' } },
      { label: 'API access & webhooks', values: { starter: false, pro: false, studio: true, lifetime: false } },
      {
        label: 'Support',
        values: { starter: 'Community', pro: 'Email', studio: 'Priority', lifetime: 'VIP' },
      },
    ],
  },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What counts as an AI build?',
    a: 'One build is one full generation run — we take your prompt or reference, plan the app and return working code. Regenerating a variant from the swarm engine counts as part of the same build, so exploring alternatives does not burn extra credits.',
  },
  {
    q: 'Can I try it before paying?',
    a: 'Yes. Starter is free forever and includes 3 AI builds a month plus 10 static previews a day — enough to see real output from your own prompts before you decide.',
  },
  {
    q: 'Am I locked into a contract?',
    a: 'No. Monthly and yearly plans can be cancelled at any time from the billing portal, and you keep access until the end of the period you already paid for.',
  },
  {
    q: `How much does yearly billing save?`,
    a: `Paying yearly works out to two months free versus paying month to month — about ${YEARLY_SAVINGS_PERCENT}% off. You can switch between monthly and yearly at any time and Stripe prorates the difference.`,
  },
  {
    q: 'What is Lifetime, exactly?',
    a: 'A single payment for permanent access to everything in Pro, including future Pro features. There is no recurring charge and no expiry. It is a limited offer while the product is early.',
  },
  {
    q: 'Do I own what I generate?',
    a: 'On every paid plan, yes — generated code is yours, including for commercial and client work. Starter output is for personal and evaluation use.',
  },
  {
    q: 'Can I use my own AI API keys?',
    a: 'Pro and above let you bring your own Anthropic, OpenAI or Google keys in Settings. Builds then run against your own quota and do not count toward your monthly build limit.',
  },
  {
    q: 'What happens if I hit my limit?',
    a: 'Builds pause rather than silently billing you. You can upgrade instantly from the dashboard, or wait for the counter to reset at the start of your next billing period.',
  },
];
