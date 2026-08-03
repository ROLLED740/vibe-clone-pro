# Publishing Rolling Rush

The `dist/` folder contains everything you need:

| File | Use |
|---|---|
| `dist/index.html` | The whole game in one file — host it anywhere |
| `dist/rolling-rush-itch.zip` | Ready-to-upload itch.io package |
| `dist/artifact.html` | Body-only variant for hosts that wrap pages |

Rebuild after code changes:

```bash
npx esbuild game.js --bundle --minify --format=iife \
  --alias:three=./vendor/three.module.min.js \
  --alias:@supabase/supabase-js=./vendor/supabase.module.js \
  --outfile=/tmp/rr-bundle.js
node build.mjs /tmp/rr-bundle.js
cd dist && zip rolling-rush-itch.zip index.html
```

## 1. YouTube Playables — submit the interest form NOW

Approval reportedly takes months, so start the clock today:

1. Open the [Playables interest form](https://docs.google.com/forms/d/e/1FAIpQLSdvdQ0lgIq2369aemj1O6w8R8FwGn9O5ARRGODDDUbVINCRJQ/viewform)
   with the Google account you want as your developer account.
2. Have ready: developer/company name, contact email, a short game
   description ("3D rolling-ball arcade runner with level worlds and
   collectible ball skins"), genre (Arcade/Action), and a playable URL —
   publish to itch.io first (below) so you have one to show.
3. While waiting, faster alternative: publishing partners with existing
   Playables portal access (e.g. Playgama) accept submissions and take a
   revenue share.

Remember: on Playables there are **no third-party payments** — the shop's
coin packs auto-hide there, and revenue comes from YouTube's ad system.

## 2. itch.io — live today, ~15 minutes

1. Create an account at itch.io → **Upload new project**.
2. Title: Rolling Rush · Kind of project: **HTML** · Classification: Game.
3. Upload `dist/rolling-rush-itch.zip`, tick **"This file will be played
   in the browser"**.
4. Viewport 480×854 (or tick "Mobile friendly" + fullscreen button;
   the game adapts to any size).
5. Pricing: free (you can enable "suggested donation").
6. Add screenshots (in the repo's history / take your own) and publish.

## 3. GitHub Pages — free hosting on your own URL

1. Merge this branch (or pick it directly) and make the repo public.
2. Repo → Settings → Pages → Source: **Deploy from a branch** → select
   the branch, folder `/ (root)`.
3. The game will be at
   `https://<user>.github.io/<repo>/games/rolling-rush/dist/`.

## 4. Poki / CrazyGames — curated, apply once you have metrics

Both review submissions and prefer games with proven retention. Submit at
[developers.poki.com](https://developers.poki.com) /
[developer.crazygames.com](https://developer.crazygames.com) with your
itch.io stats after a few weeks. Both require integrating their SDK
(ads at natural breakpoints — same shape as the Playables SDK hooks
already in `ytgame-shim.js`).

## 5. Accounts + real-money coins (the roadmap)

Client-side games can't safely take money or store accounts — that needs
a small backend. The code is already prepared: every purchase flows
through `payments.js` (currently a stub returning `not-configured`) and
all progress flows through the save layer in `ytgame-shim.js`.

Recommended stack when ready:

1. **Supabase** (free tier): email/password + Google sign-in, and a
   `players` table replacing localStorage saves — gives cross-device sync.
2. **Stripe Checkout + a webhook** (Supabase Edge Function): the coin-pack
   buttons open Stripe Checkout; the webhook verifies payment and credits
   coins server-side. Never credit coins client-side.
3. Flip `PAYMENTS_ENABLED` in `payments.js` and implement `purchasePack()`.

Platform rules to respect:
- **YouTube Playables**: no third-party payments at all (already enforced).
- **Poki/CrazyGames**: no third-party payments.
- **itch.io web embeds**: Stripe technically possible but itch prefers its
  own payments; safest to keep real-money on your own domain.
- **iOS/Android apps**: app stores require their own IAP for digital goods.
