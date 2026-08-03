# Rolling Rush 🎱

A 3D rolling-ball runner in the spirit of *Going Balls*: drag to steer,
dodge the holes, hit ramps to jump the gaps, ride loop-the-loops, collect
coins, and survive as the track speeds up.

Features:

- **Ramps & jumps** — orange (theme-accent) ramps launch you over full-width gaps
- **Loop-the-loops** — translucent loops carry the ball through a full vertical circle
- **25 ball skins** — 5 gradients (Sunset, Ocean, Candy, Lime, Galaxy), soccer,
  basketball, tennis, bowling, and the full billiards set (cue + balls 1–15),
  all drawn procedurally at runtime
- **8 level worlds** — Jungle, Mountains, Snow (with falling snow), Ice,
  Waterworld, Junkyard, Pyramids, and World Landmarks (Eiffel-style tower,
  torii gate, stone arch). The scenery, track colors, and sky change every
  level (400 m), cycling forever

Built as a **self-contained HTML5 game** that meets YouTube Playables'
technical requirements, and also runs as-is on any static host
(itch.io, Poki, CrazyGames, GitHub Pages, your own site).

## Play it locally

The game uses ES modules, so it needs a local web server (opening
`index.html` directly from disk won't work):

```bash
cd games/rolling-rush
npx serve .            # or: python3 -m http.server 8080
```

Then open the printed URL. Controls:

- **Touch / mouse:** drag left–right to steer
- **Keyboard:** ← → (or A/D) to steer, Space/Enter to start, Esc to pause

## What's in here

| File | Purpose |
|---|---|
| `index.html` | Page shell, HUD, ball picker, start/game-over/pause screens |
| `game.js` | Track generation, physics (jumps/loops), levels, audio, scoring |
| `balls.js` | The 25 procedural ball skins + picker thumbnails |
| `themes.js` | The 8 level themes and their scenery builders |
| `ytgame-shim.js` | YouTube Playables SDK wrapper with a localStorage fallback |
| `vendor/three.module.min.js` | Three.js (vendored — no CDN, no build step) |

Dev/test URL parameters: `?levellen=80` shortens levels, `?start=1200`
starts a run mid-course, `?loops` makes loop-the-loops frequent.

Total bundle: well under 1 MiB — far below the Playables 30 MiB limit
(15 MiB recommended).

## YouTube Playables readiness

Already handled:

- ✅ Bundle size under 15 MiB (no external assets; sounds are synthesized)
- ✅ Touch **and** mouse input
- ✅ Responsive to all aspect ratios (portrait phone → widescreen desktop)
- ✅ Pause/resume on tab-hide and via the Playables system callbacks
- ✅ `firstFrameReady()` / `gameReady()` SDK signals
- ✅ Save data (best distance, coin bank) via SDK with localStorage fallback
- ✅ Score reporting via `engagement.sendScore()`
- ✅ Original theme, name, and art — no third-party IP

Still needed before a real submission:

- [ ] Approved developer access — apply via the
      [Playables interest form](https://docs.google.com/forms/d/e/1FAIpQLSdvdQ0lgIq2369aemj1O6w8R8FwGn9O5ARRGODDDUbVINCRJQ/viewform)
      (direct approval reportedly takes months; publishing partners are faster)
- [ ] Thumbnails in 1:1, 5:7, and 16:9 + a 16:9 preview video
- [ ] Title (≤50 chars) and short description (≤150 chars) for the listing
- [ ] Run the official Playables test suite once you have SDK access
- [ ] Interstitial/rewarded ad breakpoints (YouTube's ad API — pre-roll is automatic)

Monetization note: Playables does **not** allow your own ads or in-app
purchases — revenue comes from YouTube's built-in ad system (pre-roll is
automatic; interstitial and rewarded ads are added through their SDK).

## Ideas for v3

- Moving obstacles (sweeping bars, rolling crushers)
- Coin shop: unlock ball skins with banked coins
- Power-ups (magnet, shield, slow-motion)
- Daily challenge seeds
