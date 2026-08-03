// Builds single-file distributions of the game:
//   dist/index.html    — fully standalone page (itch.io, GitHub Pages, any host)
//   dist/artifact.html — body-only fragment for hosts that supply the <html> shell
//
// Usage:  npx esbuild game.js --bundle --minify --format=iife \
//           --alias:three=./vendor/three.module.min.js \
//           --alias:@supabase/supabase-js=./vendor/supabase.module.js \
//           --outfile=/tmp/rr-bundle.js
//         node build.mjs /tmp/rr-bundle.js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const bundlePath = process.argv[2];
if (!bundlePath) { console.error('usage: node build.mjs <bundle.js>'); process.exit(1); }

const html = readFileSync('index.html', 'utf8');
// Escape sequences that would terminate the inline <script> element early.
const js = readFileSync(bundlePath, 'utf8')
  .replaceAll('</script', '<\\/script')
  .replaceAll('<!--', '<\\!--');

// Drop the import map and the module script tag; inline the bundle instead.
// Replacer FUNCTIONS are mandatory here: the bundle contains sequences like
// "$&" that String.replace would otherwise expand, corrupting the code.
let out = html
  .replace(/<script type="importmap">[\s\S]*?<\/script>\n?/, () => '')
  .replace(/<script type="module" src="\.\/game\.js"><\/script>\n?/,
    () => `<script>\n${js}\n</script>\n`);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', out);

// Fragment build: strip the document shell (the host provides one), and the
// YouTube SDK tag (blocked by strict CSPs anyway; the shim handles absence).
const body = out
  .replace(/<!DOCTYPE html>\n?<html[^>]*>\n?/i, '')
  .replace(/<\/html>\s*$/i, '')
  .replace(/<head>\n?/i, '')
  .replace(/<\/head>\n?/i, '')
  .replace(/<body>\n?/i, '')
  .replace(/<\/body>\n?/i, '')
  .replace(/<meta[^>]*>\n?/gi, '')
  .replace(/<script src="https:\/\/www\.youtube\.com\/game_api\/v1"[^>]*><\/script>\n?/, '');
// The artifact's CSP blocks Supabase/Stripe, so disable cloud features there.
writeFileSync('dist/artifact.html', '<script>window.__RR_NO_CLOUD=1</script>\n' + body);

console.log('wrote dist/index.html and dist/artifact.html');
