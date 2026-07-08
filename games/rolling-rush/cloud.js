// Supabase integration: accounts, cross-device cloud saves, and claiming
// coins credited by the Stripe webhook. Everything degrades gracefully —
// with no config the game is exactly the local-save game it always was.

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, CLOUD_ENABLED } from './config.js';

let client = null;
let user = null;
let ctx = null;            // { save, persist, onSaveMerged, showToast }
let pushTimer = 0;

const $ = (id) => document.getElementById(id);

export function cloudUser() { return user; }

// Take the better of local and cloud progress, never losing purchases.
function mergeSaves(a, b) {
  if (!a) return b;
  if (!b) return a;
  const boosts = {};
  for (const k of new Set([...Object.keys(a.boosts || {}), ...Object.keys(b.boosts || {})])) {
    boosts[k] = Math.max(a.boosts?.[k] || 0, b.boosts?.[k] || 0);
  }
  return {
    best: Math.max(a.best || 0, b.best || 0),
    coins: Math.max(a.coins || 0, b.coins || 0),
    ball: b.ball || a.ball,
    owned: [...new Set([...(a.owned || []), ...(b.owned || [])])],
    boosts,
  };
}

let displayName = '';

// Debounced upsert so every coin pickup doesn't hit the network.
export function cloudPush(save) {
  if (!client || !user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      await client.from('profiles').upsert({
        user_id: user.id,
        save,
        display_name: displayName || user.email?.split('@')[0] || 'Player',
        updated_at: new Date().toISOString(),
      });
    } catch { /* offline is fine; localStorage still has it */ }
  }, 1500);
}

export async function fetchLeaderboard(limit = 20) {
  if (!client) return [];
  try {
    const { data, error } = await client.rpc('get_leaderboard', { limit_n: limit });
    return error ? [] : data;
  } catch { return []; }
}

async function pullAndMerge() {
  try {
    const { data } = await client.from('profiles')
      .select('save, display_name').eq('user_id', user.id).maybeSingle();
    if (data?.display_name) displayName = data.display_name;
    const merged = mergeSaves(ctx.save, data?.save);
    ctx.onSaveMerged(merged);
    cloudPush(merged);
  } catch { /* keep local */ }
}

// Coins bought via Stripe are inserted by the webhook as unclaimed credits;
// an atomic RPC claims them so they can never be applied twice.
export async function claimPurchasedCoins() {
  if (!client || !user) return 0;
  try {
    const { data, error } = await client.rpc('claim_coin_credits');
    if (error || !data) return 0;
    const amount = Number(data) || 0;
    if (amount > 0) {
      ctx.save.coins = (ctx.save.coins || 0) + amount;
      ctx.persist();
      ctx.showToast(`💰 +${amount.toLocaleString()} coins from your purchase!`);
    }
    return amount;
  } catch { return 0; }
}

function setStatus(text) {
  const el = $('account-status');
  if (el) el.textContent = text;
}

function refreshAccountUi() {
  $('account-signed-out').classList.toggle('hidden', Boolean(user));
  $('account-signed-in').classList.toggle('hidden', !user);
  $('btn-account').textContent = user ? `👤 ${user.email}` : '👤 Sign in';
  if (user) $('account-email-line').textContent = user.email;
}

async function handleAuth(mode) {
  const email = $('acct-email').value.trim();
  const password = $('acct-password').value;
  const name = $('acct-name').value.trim();
  if (name) displayName = name.slice(0, 20);
  if (!email || password.length < 6) {
    setStatus('Enter your email and a password of 6+ characters.');
    return;
  }
  setStatus('Working…');
  const fn = mode === 'up' ? 'signUp' : 'signInWithPassword';
  const { data, error } = await client.auth[fn]({ email, password });
  if (error) { setStatus(error.message); return; }
  if (mode === 'up' && !data.session) {
    setStatus('Account created — check your email to confirm, then sign in.');
    return;
  }
  setStatus('');
}

async function openLeaderboard() {
  ctx.showScreen('leaderboard');
  const list = $('lb-list');
  list.innerHTML = '<li>Loading…</li>';
  const rows = await fetchLeaderboard(20);
  if (!rows.length) {
    list.innerHTML = '<li>No scores yet — be the first!</li>';
    return;
  }
  list.innerHTML = rows.map((r, i) => {
    const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
    return `<li><span class="lb-rank">${medal}</span>` +
      `<span class="lb-name">${String(r.display_name).replace(/[<>&]/g, '')}</span>` +
      `<b>${r.best} m</b></li>`;
  }).join('');
  const mine = ctx.save.best || 0;
  if (mine) list.insertAdjacentHTML('beforeend',
    `<li class="lb-you"><span class="lb-rank">You</span><span class="lb-name">${user ? '' : '(sign in to compete)'}</span><b>${mine} m</b></li>`);
}

export function initCloud(context) {
  ctx = context;
  const btn = $('btn-account');
  if (!CLOUD_ENABLED()) {
    // Not configured: hide the cloud entry points entirely.
    btn.classList.add('hidden');
    $('btn-leaderboard').classList.add('hidden');
    return;
  }
  $('btn-leaderboard').addEventListener('click', openLeaderboard);
  $('btn-lb-close').addEventListener('click', () => ctx.showScreen('start'));

  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  client.auth.onAuthStateChange(async (_event, session) => {
    const wasSignedIn = Boolean(user);
    user = session?.user || null;
    refreshAccountUi();
    if (user && !wasSignedIn) {
      setStatus('');
      await pullAndMerge();
      await claimPurchasedCoins();
      ctx.showToast('☁️ Progress synced');
    }
  });

  // Claim pending Stripe credits when the player returns from checkout.
  window.addEventListener('focus', () => { claimPurchasedCoins(); });

  btn.addEventListener('click', () => ctx.showScreen('account'));
  $('btn-acct-signin').addEventListener('click', () => handleAuth('in'));
  $('btn-acct-signup').addEventListener('click', () => handleAuth('up'));
  $('btn-acct-signout').addEventListener('click', async () => {
    await client.auth.signOut();
    setStatus('');
  });
  $('btn-acct-close').addEventListener('click', () => ctx.showScreen('start'));
  refreshAccountUi();
}
