# VibeClonePro

AI app generator. Describe an app or upload a reference screenshot, and the
swarm generates several styled React variants you can preview live and export.

Built on Next.js 16 (App Router) with Clerk for auth, Neon + Drizzle for data,
Stripe for billing, Inngest for background builds, and Sandpack for live preview.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

At minimum you need `DATABASE_URL`, the two Clerk keys, and one AI provider key.
Stripe keys are only needed to exercise checkout. See `.env.example` for the
full list and what each one gates.

Apply the schema with:

```bash
npx drizzle-kit generate   # after changing db/schema.ts
npx drizzle-kit migrate
```

## How a build works

1. `/editor` posts the prompt and any uploaded image to `POST /api/clone`.
2. The route authenticates, ensures a `users` row exists, then calls
   `runBuild()` in `lib/generate.ts`.
3. `runBuild` checks the caller's monthly quota (`lib/entitlements.ts`), runs an
   optional Gemini vision pass over the uploaded image, then generates one
   variant per entry in `VARIANTS` — Anthropic first, falling back to xAI and
   Gemini per attempt.
4. Variants are persisted to `clones`, grouped by `build_id`, and returned to
   the editor for the variant switcher and live Sandpack preview.

`app/actions/swarm.ts` queues the same `runBuild` on Inngest for builds that
shouldn't hold a request open; results are read back from `/api/clone/[id]`.

## Billing

`lib/plans.ts` is the single source of truth for tiers, prices, feature lists,
the comparison matrix, FAQ copy, and monthly build limits. The pricing page, the
checkout action, and the quota check all read from it.

Clients never send an amount or a Stripe price ID — they send a plan id, and the
server resolves the price from the `STRIPE_PRICE_*` env vars. A plan with no
configured price ID reports as unavailable instead of charging the wrong amount.

To change a price: update `lib/plans.ts` and point the matching env var at the
new Stripe price. To add a tier: add it to `PLANS`, give it a `priceEnv`, add a
`MONTHLY_BUILD_LIMIT` entry, and add a column to `COMPARISON`.

## Layout

| Path | What's there |
| --- | --- |
| `app/pricing` | Pricing page (server) + `app/components/PricingTable.tsx` (client) |
| `app/editor` | Prompt UI, variant switcher, live Sandpack preview |
| `app/preview/[id]` | Single stored variant, scoped to its owner |
| `app/api/clone` | Synchronous build endpoint |
| `app/api/webhooks/stripe` | Subscription lifecycle sync into Neon |
| `lib/` | Plans, entitlements, model IDs, shared generation logic |
| `proxy.ts` | Clerk route protection + maintenance kill switch |

`vibe-clone-pro-export/` and `vibe-clone-pro-export.zip` are a point-in-time
snapshot of the app, excluded from the build and lint.
