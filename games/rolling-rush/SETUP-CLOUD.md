# Cloud setup: accounts, sync, and real-money coins

Everything client-side is already wired. Three paste-and-click steps make it
live. Until step 2 is done, the game simply runs in offline mode (the 👤
button hides itself).

## 1. Database (2 minutes)

Supabase dashboard → **SQL Editor** → paste and run `supabase/schema.sql`.
Then **Authentication → Providers**: make sure Email is enabled (it is by
default). Optionally turn off "Confirm email" while testing.

## 2. Connect the game (1 minute)

Dashboard → **Project Settings → API**. Copy the **Project URL** and the
**anon public key** into `config.js`:

```js
export const SUPABASE_URL = 'https://xxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';
```

Rebuild (`PUBLISHING.md` has the two commands) and redeploy. That alone
gives you: create account / sign-in, cross-device save sync, and
merge-on-first-login (players keep local progress).

## 3. Stripe coin packs (15 minutes)

1. **Stripe dashboard → Product catalog**: create three products —
   Pocketful $0.99, Sack of Coins $4.99, Treasure Chest $9.99. On each
   product add **metadata**: key `coins`, value `500` / `3000` / `10000`.
2. **Payment Links**: create one link per product. Paste the three URLs
   into `STRIPE_PAYMENT_LINKS` in `config.js`.
3. Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then:

   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase functions deploy stripe-webhook --no-verify-jwt
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...   # from step 4
   ```

4. **Stripe → Developers → Webhooks → Add endpoint**:
   URL `https://<project-ref>.functions.supabase.co/stripe-webhook`,
   event `checkout.session.completed`. Copy the signing secret into the
   command above.
5. Rebuild and redeploy the game.

Test the full loop with Stripe **test mode** first (test-mode payment links
+ card `4242 4242 4242 4242`).

## How the money flow stays honest

- Buy button → Stripe Checkout (new tab) with the player's user id attached.
- Stripe → webhook → verified event → a row in `coin_credits` (service role
  only; the unique session id makes retries harmless).
- Game (on focus / sign-in) calls `claim_coin_credits()` — an atomic,
  security-definer RPC — and adds the returned amount to the balance.
- Players can never insert credits, claim twice, or claim someone else's.

## Platform rules reminder

Real-money packs must stay OFF for YouTube Playables (auto-hidden already),
Poki, and CrazyGames builds. Use them on your own domain / GitHub Pages /
itch.io page only.
