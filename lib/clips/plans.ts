/**
 * Plan catalog for VibeClips — the clip studio.
 *
 * Entirely separate from VibeClonePro's own plans in lib/plans.ts: different
 * tiers, different Stripe prices, different limits. The two products share
 * infrastructure (auth, the subscriptions table, Stripe) but never a price.
 *
 * Stripe price IDs are resolved server-side from `priceEnv` — the client never
 * sends an amount or a price ID.
 */

export type BillingInterval = 'monthly' | 'yearly';

export type ClipPlanId = 'free' | 'starter' | 'pro' | 'ultra' | 'enterprise';

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
  id: ClipPlanId;
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
      { label: 'Upgrade to Full App Builds' },
      { label: 'Upgrade to Export Projects' },
    ],
  },
  {
    id: 'starter',
    name: 'Starter plan',
    tagline: 'Best for small businesses or individuals.',
    price: { monthly: 39, yearly: 31 },
    priceNote: { yearly: 'billed $372 yearly' },
    priceEnv: {
      monthly: ['STRIPE_PRICE_CLIPS_STARTER_MONTHLY'],
      yearly: ['STRIPE_PRICE_CLIPS_STARTER_YEARLY', 'STRIPE_PRICE_CLIPS_STARTER_MONTHLY'],
    },
    ctaLabel: 'Choose Starter',
    cta: { kind: 'checkout' },
    features: [
      { label: 'All Templates & Components', emphasis: true },
      {
        label: '10 Builds Every Month',
        emphasis: true,
        tooltip: 'One build generates a full set of styled variants from your prompt or reference image.',
      },
      {
        label: '50 AI Credits',
        emphasis: true,
        tooltip: 'Credits cover vision analysis and extra variant regenerations beyond your monthly builds.',
      },
      {
        label: 'Public Generations',
        tooltip: 'Your builds are visible in the community gallery. Upgrade to Pro to keep them private.',
      },
      { label: 'Standard Build Queue' },
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
      monthly: ['STRIPE_PRICE_CLIPS_PRO_MONTHLY'],
      yearly: ['STRIPE_PRICE_CLIPS_PRO_YEARLY', 'STRIPE_PRICE_CLIPS_PRO_MONTHLY'],
    },
    accent: 'featured',
    ribbon: '🔥 BEST VALUE',
    ctaLabel: 'Choose Pro',
    cta: { kind: 'checkout' },
    features: [
      {
        label: 'Unlimited Exports',
        emphasis: true,
        tooltip: 'Download the full Next.js project for any build, as many times as you like.',
      },
      {
        label: '300 AI Credits (1st Month)',
        emphasis: true,
        wasLabel: '200',
        badge: '⏰ TODAY ONLY',
        tooltip: 'Your first month includes a bonus credit allowance. It renews at 200 per month after that.',
      },
      { label: 'Unlimited App Builds', emphasis: true },
      { label: 'Full Next.js Project Export' },
      { label: 'Faster Build Queue' },
      {
        label: 'Private Generations',
        tooltip: 'Your builds stay off the community gallery and are visible only to you.',
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
      monthly: ['STRIPE_PRICE_CLIPS_ULTRA_MONTHLY'],
      yearly: ['STRIPE_PRICE_CLIPS_ULTRA_YEARLY', 'STRIPE_PRICE_CLIPS_ULTRA_MONTHLY'],
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
      { label: 'Fastest Build Queue' },
      {
        label: 'White-Label Exports',
        tooltip: 'Exported projects ship without any VibeClonePro branding.',
      },
      { label: 'Direct Support' },
      { label: 'Priority Model Access' },
    ],
  },
];

export const ENTERPRISE_PLAN: Plan = {
  id: 'enterprise',
  name: 'Enterprise',
  tagline: 'For larger teams with procurement.',
  price: { monthly: null, yearly: null },
  ctaLabel: 'Contact sales',
  cta: { kind: 'contact', href: 'mailto:sales@vibeclonepro.com?subject=VibeClips%20Enterprise' },
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
    title: 'Prompt to App',
    description: 'Describe what you want and get a working React app back in one pass.',
    media: '/vibe-intro.mp4',
    ribbon: 'BRAND NEW',
  },
  {
    tag: 'Swarm Engine',
    title: 'Parallel Variants',
    description: 'Every build returns several styled takes at once, so you pick instead of re-prompting.',
    media: '/vibe-logo-loop.mp4',
  },
  {
    tag: 'Vision',
    title: 'Clone Any Screenshot',
    description: 'Upload a reference and the palette, type and layout are extracted before generation.',
    media: '/FlickerMania.mp4',
  },
  {
    tag: 'Live Editor',
    title: 'Edit and See It Instantly',
    description: 'Generated code opens in a live sandbox — tweak it and the preview updates as you type.',
  },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What counts as a build?',
    a: 'One build is one full generation run — we take your prompt or reference, plan the app and return working code. The styled variants that come back from a single run all count as that one build, so exploring alternatives does not cost you extra.',
  },
  {
    q: 'What are AI credits for?',
    a: 'Credits cover the extras around a build: vision analysis of an uploaded screenshot, and regenerating an individual variant after the initial run. Your monthly builds and your credits are metered separately.',
  },
  {
    q: 'Can I try it before paying?',
    a: 'Yes. The Free plan needs no credit card and includes 30 AI static previews a day, so you can see real output from your own prompts before deciding.',
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
    a: 'On every paid plan, yes — generated code is yours, including for commercial work. Ultra adds an explicit license to sell what you build to clients.',
  },
  {
    q: 'Can I use my own AI API keys?',
    a: 'Paid plans let you bring your own Anthropic, OpenAI or Google keys in Settings. Builds then run against your own quota.',
  },
  {
    q: 'What happens if I hit my limit?',
    a: 'Builds pause rather than silently billing you. You can upgrade instantly from the dashboard, or wait for the counter to reset at the start of your next billing period.',
  },
];
