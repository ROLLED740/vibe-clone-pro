# VibeClips

Turn a one-line idea into a scroll-stopping clip. Describe something, get a
still preview back, then animate the preview you like into a video.

Next.js 16 (App Router) · Clerk auth · Postgres + Drizzle · Stripe billing ·
pluggable media providers.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and the two Clerk keys
npm run db:migrate
npm run dev
```

Open http://localhost:3000.

**You do not need a media API key to run this.** With no `FAL_KEY`, generation
falls back to a stub provider that returns placeholder media. The entire
loop — queue, poll, spend credits, refund on failure, publish to the gallery —
executes for real, and the studio shows a demo-mode banner. Set `FAL_KEY` to
generate actual media.

## How a generation works

1. `/studio` posts an idea, style template and aspect ratio to
   `POST /api/generations`.
2. `createGeneration` checks the plan, takes credits, then submits a job to the
   provider. If submission fails the credits are refunded immediately.
3. The row is stored `running` with the provider's job handle.
4. The studio polls `GET /api/generations/[id]`. Reading is what settles a
   finished job, so **no worker process is required** — the status endpoint
   writes the final state on read.
5. Finished stills can be animated: the same flow runs with `kind: 'video'` and
   the still's URL as the source frame.

Failures refund automatically at every stage.

## Credits

`lib/credits.ts` is an append-only ledger — balance is the sum of its deltas, so
a spend and its refund are both visible rather than one overwriting a counter.

- Monthly grants are idempotent per billing period and applied on studio load,
  so no cron job is needed.
- Spends write the negative entry first and re-check the balance, so two
  concurrent requests can't both pass a check-then-write and overdraw.
- A still costs 1 credit; animating it costs 10. Free users get 30 stills a day
  metered separately, and cannot animate.

## Billing

`lib/plans.ts` is the single source of truth for tiers, prices, feature copy and
FAQ. Clients never send an amount or a Stripe price ID — they send a plan id and
the server resolves the price from `STRIPE_PRICE_*`.

To change a price: edit `lib/plans.ts` and point the matching env var at the new
Stripe price. To add a tier: add it to `PLANS`, give it a `priceEnv`, and add a
`MONTHLY_CREDITS` entry in `lib/credits.ts`.

Point a Stripe webhook at `/api/webhooks/stripe` for
`checkout.session.completed` and the `customer.subscription.*` events.

## Media providers

`lib/provider.ts` defines a queue-based interface: `submit` returns a job handle,
`poll` reports on it. Two implementations ship — `fal` and `stub`. Adding another
(Replicate, Runway, Luma) means implementing that interface and returning it from
`getProvider()`; nothing else changes.

Model IDs are env-overridable (`FAL_IMAGE_MODEL`, `FAL_VIDEO_MODEL`) so a
provider renaming a model doesn't require a code change.

## Layout

| Path | What's there |
| --- | --- |
| `app/studio` | The creation UI — prompt, styles, formats, stage, history |
| `app/gallery` | Public feed of finished generations |
| `app/pricing` | Plans, rendered from `lib/plans.ts` |
| `app/api/generations` | Create and poll generations |
| `lib/generations.ts` | Plan gating, credit handling, provider orchestration |
| `lib/provider.ts` | Media provider abstraction (fal + stub) |
| `lib/templates.ts` | Style presets that wrap the user's prompt |
| `proxy.ts` | Clerk route protection |

## Note on the pricing page

The customer logo strip (`CUSTOMER_LOGOS` in `app/components/PricingTable.tsx`)
ships empty and hides itself. Add only brands that are genuinely customers and
whose marks you may display.
