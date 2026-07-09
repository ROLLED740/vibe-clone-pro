// Coin shop: ball skins, boost packages, and (future) real-money coin packs.
// Owns all picker/shop DOM; the game passes in its save object and callbacks.

import { BALLS, ballThumb } from './balls.js';
import { paymentsEnabled, COIN_PACKS, purchasePack } from './payments.js';

export const BOOSTS = [
  { id: 'headstart', icon: '🚀', name: 'Head Start', desc: 'Begin the run 150 m in, already up to speed', price: 15 },
  { id: 'shield', icon: '🛡️', name: 'Shield', desc: 'Survive one fall — you get dropped back onto the track', price: 25 },
  { id: 'doubler', icon: '✨', name: 'Coin Doubler', desc: 'Every coin this run counts double', price: 20 },
];

let ctx;                 // { save, persist, setBall, showToast, sfxBuy, sfxDeny, showScreen, isYouTube }
const armed = new Set(); // boost ids armed for the next run

const $ = (id) => document.getElementById(id);

function owns(id) { return ctx.save.owned.includes(id); }

function refreshChips() {
  document.querySelectorAll('.ball-chip').forEach((el) => {
    const id = el.dataset.ball;
    el.classList.toggle('selected', id === ctx.save.ball);
    el.classList.toggle('locked', !owns(id));
  });
  document.querySelectorAll('[data-coin-balance]').forEach((el) => {
    el.textContent = String(ctx.save.coins || 0);
  });
  for (const b of BOOSTS) {
    const countEl = $(`boost-count-${b.id}`);
    if (countEl) countEl.textContent = `×${ctx.save.boosts[b.id] || 0}`;
  }
  refreshArmRow();
}

function onChipTap(def) {
  if (owns(def.id)) {
    ctx.save.ball = def.id;
    ctx.setBall(def.id);
    ctx.persist();
    refreshChips();
    return;
  }
  if ((ctx.save.coins || 0) >= def.price) {
    ctx.save.coins -= def.price;
    ctx.save.owned.push(def.id);
    ctx.save.ball = def.id;
    ctx.setBall(def.id);
    ctx.persist();
    ctx.sfxBuy();
    ctx.showToast(`Unlocked ${def.name}!`);
  } else {
    ctx.sfxDeny();
    ctx.showToast(`Need ${def.price - (ctx.save.coins || 0)} more coins`);
  }
  refreshChips();
}

function buildBallRows() {
  for (const rowId of ['ball-row-start', 'ball-row-over', 'ball-row-shop']) {
    const row = $(rowId);
    if (!row) continue;
    for (const def of BALLS) {
      const chip = document.createElement('button');
      chip.className = 'ball-chip';
      chip.dataset.ball = def.id;
      chip.title = def.name;
      chip.appendChild(ballThumb(def));
      if (def.price > 0) {
        const tag = document.createElement('span');
        tag.className = 'price-tag';
        tag.textContent = def.price;
        chip.appendChild(tag);
      }
      chip.addEventListener('click', () => onChipTap(def));
      row.appendChild(chip);
    }
  }
}

function buildBoosts() {
  const list = $('boost-list');
  for (const b of BOOSTS) {
    const card = document.createElement('div');
    card.className = 'boost-card';
    card.innerHTML =
      `<div class="boost-icon">${b.icon}</div>` +
      `<div class="boost-info"><b>${b.name}</b><small>${b.desc}</small></div>` +
      `<div class="boost-buy"><span id="boost-count-${b.id}">×0</span>` +
      `<button class="btn mini" data-boost="${b.id}">● ${b.price}</button></div>`;
    list.appendChild(card);
  }
  list.addEventListener('click', (e) => {
    const id = e.target?.dataset?.boost;
    if (!id) return;
    const b = BOOSTS.find((x) => x.id === id);
    if ((ctx.save.coins || 0) >= b.price) {
      ctx.save.coins -= b.price;
      ctx.save.boosts[id] = (ctx.save.boosts[id] || 0) + 1;
      ctx.persist();
      ctx.sfxBuy();
      ctx.showToast(`${b.icon} ${b.name} purchased!`);
    } else {
      ctx.sfxDeny();
      ctx.showToast(`Need ${b.price - (ctx.save.coins || 0)} more coins`);
    }
    refreshChips();
  });
}

function buildCoinPacks() {
  const section = $('packs-section');
  // YouTube Playables forbids third-party payments — hide the section there.
  if (ctx.isYouTube) { section.remove(); return; }
  const list = $('pack-list');
  const enabled = paymentsEnabled();
  for (const p of COIN_PACKS) {
    const card = document.createElement('button');
    card.className = 'pack-card' + (enabled ? '' : ' disabled');
    card.innerHTML =
      `<b>● ${p.coins.toLocaleString()}</b><span>${p.label}</span>` +
      `<span class="pack-price">${enabled ? p.priceLabel : 'COMING SOON'}</span>`;
    card.addEventListener('click', async () => {
      const res = await purchasePack(p.id);
      if (res.reason === 'checkout-opened') {
        ctx.showToast('Finish checkout in the new tab — coins arrive right after payment');
      } else if (res.reason === 'sign-in-required') {
        ctx.showToast('Sign in (👤 on the main screen) to buy coins');
      } else {
        ctx.showToast('Real-money packs are coming in a future update!');
      }
    });
    list.appendChild(card);
  }
}

// Armed-boost toggles shown on the start screen.
function refreshArmRow() {
  const row = $('boost-arm-row');
  row.innerHTML = '';
  for (const b of BOOSTS) {
    const count = ctx.save.boosts[b.id] || 0;
    if (!count && !armed.has(b.id)) continue;
    const chip = document.createElement('button');
    chip.className = 'arm-chip' + (armed.has(b.id) ? ' armed' : '');
    chip.textContent = `${b.icon} ×${count}`;
    chip.title = `${b.name} — tap to use on next run`;
    chip.addEventListener('click', () => {
      if (armed.has(b.id)) armed.delete(b.id);
      else if (count > 0) armed.add(b.id);
      refreshArmRow();
    });
    row.appendChild(chip);
  }
}

// Called by the game when a run starts: consumes armed boosts.
export function consumeArmedBoosts() {
  const out = { headstart: false, shield: false, doubler: false };
  for (const id of [...armed]) {
    if ((ctx.save.boosts[id] || 0) > 0) {
      ctx.save.boosts[id]--;
      out[id] = true;
    }
    armed.delete(id);
  }
  ctx.persist();
  refreshChips();
  return out;
}

export function refreshShop() { refreshChips(); }

export function initShop(context) {
  ctx = context;
  ctx.save.owned ||= ['sunset'];
  ctx.save.boosts ||= {};
  if (ctx.save.ball && !ctx.save.owned.includes(ctx.save.ball)) {
    ctx.save.owned.push(ctx.save.ball);   // grandfather pre-shop players
  }
  buildBallRows();
  buildBoosts();
  buildCoinPacks();
  let shopReturn = 'start';
  const openShop = (from) => () => { shopReturn = from; ctx.showScreen('shop'); refreshChips(); };
  $('btn-shop').addEventListener('click', openShop('start'));
  $('btn-shop-over').addEventListener('click', openShop('over'));
  $('btn-shop-pause').addEventListener('click', openShop('pause'));
  $('btn-shop-close').addEventListener('click', () => ctx.showScreen(shopReturn));
  refreshChips();
}
