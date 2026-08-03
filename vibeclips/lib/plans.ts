/**
 * Single source of truth for billing.
 *
 * The pricing page, the checkout action and the credit grants all read from
 * here, so a price only ever changes in one place. Stripe price IDs are
 * resolved server-side from `priceEnv` — the client never sends an amount or
 * a price ID, only a plan id.
 */

export type BillingInterval = 'monthly' | 'yearly';

export type PlanId = 'free' | 'starter' | 'pro' | 'ultra' | 'enterprise';

export type PlanCta =
  | { kind: 'checkout' }
  | { kind: 'signup' }
  | { kind: 'contact'; href: string };

/** Visual treatment for a plan card. */
export type PlanAccent = 'default' | 'featured';

export interface PlanFeature {
  label: string;
  /** Renders a dotted underline with an explanation on hover. */
  tooltip?: string;
  /** Bolder text for the headline benefits of a tier. */
  emphasis?: boolean;
  /** Superseded value shown struck through before the label, e.g. "200". */
  wasLabel?: string;
  /** Small badge pinned after the label, e.g. a limited-time promo. */
  badge?: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Price in whole dollars, keyed by interval. `null` = not sold at that interval. */
  price: Record<BillingInterval, number | null>;
  /** Rendered under the price, e.g. "billed $948 yearly". */
  priceNote?: Partial<Record<BillingInterval, string>>;
  /** One-time purchase rather than a recurring subscription. */
  oneTime?: boolean;
  /** Env var names holding the Stripe price ID, in fallback order. */
  priceEnv?: Partial<Record<BillingInterval, string[]>>;
  accent?: PlanAccent;
  /** Ribbon across the top of the card. */
  ribbon?: string;
  ctaLabel: string;
  cta: PlanCta;
  /** Heading above the feature list, e.g. "Everything in Pro, plus:". */
  featuresHeading?: string;
  features: PlanFeature[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free plan',
    tagline: 'Try before you buy.',
    price: { monthly: 0, yearly: 0 },
    ctaLabel: 'Get Started Now',
    cta: { kind: 'signup' },
    features: [
      { label: 'No Credit Card Needed' },
      { label: '30 AI Static Previews / Day' },
      { label: 'Upgrade to Animate Previews' },
      { label: 'Upgrade to Download Videos' },
    ],
  },
  {
    id: 'starter',
    name: 'Starter plan',
    tagline: 'Best for small businesses or individuals.',
    price: { monthly: 39, yearly: 31 },
    priceNote: { yearly: 'billed $372 yearly' },
    priceEnv: {
      monthly: ['STRIPE_PRICE_STARTER_MONTHLY'],
      yearly: ['STRIPE_PRICE_STARTER_YEARLY', 'STRIPE_PRICE_STARTER_MONTHLY'],
    },
    ctaLabel: 'Choose Starter',
    cta: { kind: 'checkout' },
    features: [
      { label: 'All Animations & Templates', emphasis: true },
      {
        label: '10 Videos Every Month',
        emphasis: true,
        tooltip: 'One video is one animated clip rendered from a still preview.',
      },
      {
        label: '50 AI Credits',
        emphasis: true,
        tooltip: 'Credits cover preview generation and animating a still into a clip.',
      },
      {
        label: 'Public Generations',
        tooltip: 'Your generations appear in the community gallery. Upgrade to Pro to keep them private.',
      },
      { label: 'Standard Rendering' },
      { label: 'Email Support' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro plan',
    tagline: 'Everything you need to grow faster.',
    price: { monthly: 99, yearly: 79 },
    priceNote: { yearly: 'billed $948 yearly' },
    priceEnv: {
      monthly: ['STRIPE_PRICE_PRO_MONTHLY'],
      yearly: ['STRIPE_PRICE_PRO_YEARLY', 'STRIPE_PRICE_PRO_MONTHLY'],
    },
    accent: 'featured',
    ribbon: '🔥 BEST VALUE',
    ctaLabel: 'Choose Pro',
    cta: { kind: 'checkout' },
    features: [
      {
        label: 'Unlimited Downloads',
        emphasis: true,
        tooltip: 'Download any finished clip as many times as you like.',
      },
      {
        label: '300 AI Credits (1st Month)',
        emphasis: true,
        wasLabel: '200',
        badge: '⏰ TODAY ONLY',
        tooltip: 'Your first month includes a bonus credit allowance. It renews at 200 per month after that.',
      },
      { label: 'Move & Resize Animations', emphasis: true },
      { label: 'Unlimited HD Exports' },
      { label: 'Faster Rendering' },
      {
        label: 'Private Generations',
        tooltip: 'Your generations stay off the community gallery and are visible only to you.',
      },
      { label: 'Priority Support' },
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra plan',
    tagline: 'Best for agencies & scaling brands.',
    price: { monthly: 199, yearly: 159 },
    priceNote: { yearly: 'billed $1,908 yearly' },
    priceEnv: {
      monthly: ['STRIPE_PRICE_ULTRA_MONTHLY'],
      yearly: ['STRIPE_PRICE_ULTRA_YEARLY', 'STRIPE_PRICE_ULTRA_MONTHLY'],
    },
    ctaLabel: 'Choose Ultra',
    cta: { kind: 'checkout' },
    featuresHeading: 'Everything in Pro, plus:',
    features: [
      { label: 'License to Sell to Clients', emphasis: true },
      { label: '5 Team Seats', emphasis: true },
      {
        label: '500 AI Credits',
        emphasis: true,
        tooltip: 'Pooled across every seat on the team.',
      },
      { label: 'Fastest Rendering' },
      {
        label: 'White-Label Exports',
        tooltip: 'Exported clips ship with no watermark.',
      },
      { label: 'Direct Support' },
      { label: 'Premium Music' },
    ],
  },
];

export const ENTERPRISE_PLAN: Plan = {
  id: 'enterprise',
  name: 'Enterprise',
  tagline: 'For larger teams with procurement.',
  price: { monthly: null, yearly: null },
  ctaLabel: 'Contact sales',
  cta: { kind: 'contact', href: 'mailto:sales@vibeclips.app?subject=VibeClips%20Enterprise' },
  features: [
    { label: 'Everything in Ultra' },
    { label: 'Unlimited seats & SSO' },
    { label: 'Dedicated account manager' },
    { label: 'Custom SLA & invoicing' },
  ],
};

/**
 * Percentage saved by paying yearly, derived from the featured plan so the
 * badge can't drift from the actual prices.
 */
export const YEARLY_SAVINGS_PERCENT = (() => {
  const featured = PLANS.find((p) => p.accent === 'featured');
  if (!featured?.price.monthly || !featured.price.yearly) return 0;
  return Math.round((1 - featured.price.yearly / featured.price.monthly) * 100);
})();

/**
 * Static previews a free user may generate per day. Paid tiers meter on
 * credits instead, so they aren't listed here.
 */
export const FREE_DAILY_PREVIEWS = 30;

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

/**
 * Capabilities every tier gets, shown as cards below the plans.
 *
 * `media` points at a file in /public. Leave it undefined and the card renders
 * a gradient placeholder instead of a broken image.
 */
export const INCLUDED_IN_ALL_PLANS: {
  tag: string;
  title: string;
  description: string;
  media?: string;
  ribbon?: string;
}[] = [
  {
    tag: 'AI Studio',
    title: 'AI Viral Videos',
    description: 'Create your own animations from a simple text prompt.',
    media: '/vibe-intro.mp4',
    ribbon: 'BRAND NEW',
  },
  {
    tag: 'Templates',
    title: 'Styles That Land',
    description: 'Six directed looks, so a one-line idea still comes out looking deliberate.',
    media: '/vibe-logo-loop.mp4',
  },
  {
    tag: 'Formats',
    title: 'Every Aspect Ratio',
    description: 'Vertical, square and widescreen from the same prompt — no recropping.',
    media: '/FlickerMania.mp4',
  },
  {
    tag: 'Workflow',
    title: 'Preview Before You Render',
    description: 'Generate a cheap still first, then spend credits animating only the ones you like.',
  },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do previews and videos differ?',
    a: 'A preview is a still image and costs 1 credit. Animating that still into a clip costs 10. Generating previews first means you only spend on animation once you like what you see.',
  },
  {
    q: 'What are AI credits for?',
    a: 'Everything you generate draws on credits: 1 for a still preview, 10 for an animated clip. Credits refresh at the start of each billing period and unused ones do not roll over.',
  },
  {
    q: 'Can I try it before paying?',
    a: 'Yes. The Free plan needs no credit card and includes 30 static previews a day, so you can see real output from your own prompts before deciding.',
  },
  {
    q: 'Am I locked into a contract?',
    a: 'No. Monthly and yearly plans can be cancelled at any time from the billing portal, and you keep access until the end of the period you already paid for.',
  },
  {
    q: 'How much does yearly billing save?',
    a: `Yearly billing is ${YEARLY_SAVINGS_PERCENT}% cheaper than paying month to month. You can switch between monthly and yearly at any time and Stripe prorates the difference.`,
  },
  {
    q: 'Do I own what I generate?',
    a: 'On every paid plan, yes — what you generate is yours, including for commercial work. Ultra adds an explicit license to sell finished clips to clients.',
  },
  {
    q: 'What happens if I hit my limit?',
    a: 'Generation pauses rather than silently billing you. You can upgrade instantly, or wait for your credits to refresh at the start of the next billing period.',
  },
];
