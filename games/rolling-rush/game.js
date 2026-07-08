import * as THREE from 'three';
import {
  firstFrameReady, gameReady, sendScore,
  loadSave, saveSave, onSystemPause,
} from './ytgame-shim.js';
import { BALLS } from './balls.js';
import { THEMES, matFor } from './themes.js';
import { initShop, consumeArmedBoosts, refreshShop } from './shop.js';
import { initCloud, cloudPush } from './cloud.js';

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------
const LANES = 3;
const LANE_W = 2;                    // width of one lane
const TRACK_W = LANES * LANE_W;      // total track width (x: -3..3)
const SEG_LEN = 4;                   // length of one track segment (z)
const SEG_AHEAD = 30;                // segments kept ahead of the ball
const BALL_R = 0.42;
const X_LIMIT = TRACK_W / 2 - BALL_R * 0.7;

const SPEED_START = 9;
const SPEED_MAX = 24;
const SPEED_RAMP = 0.18;             // units/sec gained per second
const GRAVITY = 30;
const SAFE_START_SEGMENTS = 8;       // hazard-free runway at the start of a run
const RAMP_H = 1.2;                  // ramp rise over one segment
const LOOP_R = 2.3;                  // loop-the-loop radius
const GROUND_Y = -10;
const DEATH_Y = -9;

// Dev/test helpers: ?levellen=80 shortens levels, ?start=1200 starts mid-run.
const PARAMS = new URLSearchParams(location.search);
const LEVEL_LEN = Math.max(80, Number(PARAMS.get('levellen')) || 400);
const DEV_START = Math.max(0, Number(PARAMS.get('start')) || 0);
const LOOP_CHANCE = PARAMS.has('loops') ? 0.5 : 0.06;
const DEV_COINS = Math.max(0, Number(PARAMS.get('coins')) || 0);

// ---------------------------------------------------------------------------
// Renderer / scene
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(THEMES[0].sky);
scene.fog = new THREE.Fog(THEMES[0].sky, 28, 95);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 220);

scene.add(new THREE.HemisphereLight(0xffffff, 0x777788, 1.15));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(4, 10, 6);
scene.add(sun);

// Ground far below the floating track, re-tinted per theme.
const groundMat = new THREE.MeshLambertMaterial({ color: THEMES[0].ground });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = GROUND_Y;
scene.add(ground);

// Snow flurry, shown only on snow/ice themes.
const SNOW_N = 500;
const snowPos = new Float32Array(SNOW_N * 3);
for (let i = 0; i < SNOW_N; i++) {
  snowPos[i * 3] = (Math.random() - 0.5) * 50;
  snowPos[i * 3 + 1] = Math.random() * 22 - 2;
  snowPos[i * 3 + 2] = -Math.random() * 80;
}
const snowGeo = new THREE.BufferGeometry();
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({
  color: 0xffffff, size: 0.16, transparent: true, opacity: 0.9,
}));
snow.visible = false;
scene.add(snow);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------------------
// Procedural track textures (wood planks, hazard-stripe rails, boost arrows)
// ---------------------------------------------------------------------------
function makeTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function woodTexture(light) {
  return makeTexture(128, 256, (g, w, h) => {
    g.fillStyle = light ? '#cfa76e' : '#c29a62';
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 43) {          // plank seams run along the track
      g.fillStyle = 'rgba(90,60,30,.35)';
      g.fillRect(x, 0, 2, h);
    }
    for (let i = 0; i < 90; i++) {             // grain streaks
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,235,200' : '110,75,40'},${0.04 + Math.random() * 0.07})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1.5, 8 + Math.random() * 40);
    }
  });
}

const stripeTex = makeTexture(64, 64, (g, w, h) => {
  g.fillStyle = '#f5c02e';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#1c1c1e';
  for (let i = -2; i < 6; i++) {
    g.save();
    g.translate(i * 24, 0);
    g.beginPath();
    g.moveTo(0, h); g.lineTo(12, h); g.lineTo(24 + 12, 0); g.lineTo(24, 0);
    g.closePath(); g.fill();
    g.restore();
  }
});
stripeTex.repeat.set(2, 1);

const boostTex = makeTexture(64, 128, (g, w, h) => {
  g.fillStyle = '#2ec24e';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#eafff0';
  for (const y of [30, 78]) {                  // chevrons pointing forward
    g.beginPath();
    g.moveTo(8, y + 22); g.lineTo(32, y); g.lineTo(56, y + 22);
    g.lineTo(56, y + 36); g.lineTo(32, y + 14); g.lineTo(8, y + 36);
    g.closePath(); g.fill();
  }
});

const trailTex = makeTexture(64, 128, (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(255,255,255,.9)');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
});

// Glowing speed streak shown behind the ball while boosting.
const trail = new THREE.Mesh(
  new THREE.PlaneGeometry(0.7, 4.5),
  new THREE.MeshBasicMaterial({
    map: trailTex, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }),
);
trail.rotation.x = -Math.PI / 2;
scene.add(trail);

// ---------------------------------------------------------------------------
// Ball + skins
// ---------------------------------------------------------------------------
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_R, 28, 20),
  new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.05 }),
);
scene.add(ball);

const texCache = new Map();
function setBall(id) {
  const def = BALLS.find((b) => b.id === id) || BALLS[0];
  if (!texCache.has(def.id)) {
    const tex = new THREE.CanvasTexture(def.make());
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache.set(def.id, tex);
  }
  ball.material.map = texCache.get(def.id);
  ball.material.roughness = def.roughness ?? 0.35;
  ball.material.metalness = def.metalness ?? 0.05;
  ball.material.needsUpdate = true;
  document.querySelectorAll('.ball-chip').forEach((el) => {
    el.classList.toggle('selected', el.dataset.ball === def.id);
  });
  return def.id;
}

// ---------------------------------------------------------------------------
// Themes / levels
// ---------------------------------------------------------------------------
function themeForSegment(i) {
  return THEMES[Math.floor((i * SEG_LEN) / LEVEL_LEN) % THEMES.length];
}
const skyTarget = new THREE.Color(THEMES[0].sky);
const groundTarget = new THREE.Color(THEMES[0].ground);

// Wood planks everywhere (the classic ball-runner look); themes tint them
// subtly so each world still feels different.
const laneMats = new Map();
function laneMat(theme, alt) {
  const key = `${theme.name}-${alt}`;
  if (!laneMats.has(key)) {
    const tint = new THREE.Color(theme.lanes[alt]).lerp(new THREE.Color(0xffffff), 0.75);
    laneMats.set(key, new THREE.MeshLambertMaterial({ map: woodTexture(alt === 0), color: tint }));
  }
  return laneMats.get(key);
}
const railMat = new THREE.MeshLambertMaterial({ map: stripeTex });
const boostMat = new THREE.MeshLambertMaterial({ map: boostTex });

// ---------------------------------------------------------------------------
// Track segments (pooled meshes, procedural layout)
// ---------------------------------------------------------------------------
const laneGeo = new THREE.BoxGeometry(LANE_W, 0.5, SEG_LEN);
const railGeo = new THREE.BoxGeometry(0.3, 0.42, SEG_LEN);
const padGeo = new THREE.BoxGeometry(1.7, 0.08, 2.6);
const boulderGeo = new THREE.SphereGeometry(0.55, 20, 14);
const boulderMat = new THREE.MeshStandardMaterial({ color: 0xb03a3a, roughness: 0.35, metalness: 0.15 });
const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.09, 20);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd23e, roughness: 0.25, metalness: 0.65 });
const rampLen = Math.hypot(SEG_LEN, RAMP_H);
const rampGeo = new THREE.BoxGeometry(TRACK_W, 0.5, rampLen);
// A thin torus stretched along its axis reads as a curled track ribbon.
const loopGeo = new THREE.TorusGeometry(LOOP_R + BALL_R, 0.3, 10, 44);
const loopMats = new Map();
function loopMat(color) {
  if (!loopMats.has(color)) {
    loopMats.set(color, new THREE.MeshLambertMaterial({
      color, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    }));
  }
  return loopMats.get(color);
}

const segments = new Map(); // index -> { type, group, holes, coins, pads, loopDone }
const boulders = [];        // red balls rolling toward the player
let genIndex = 0;           // next segment index to generate
let runStartSeg = 0;
let safeLane = 1;
let featureCooldown = 0;
let upcoming = [];          // queued segment types for multi-segment features
let coinRun = 0;
let coinLane = 1;

function segmentCenterZ(i) { return -(i + 0.5) * SEG_LEN; }

function spawnSegment(i) {
  const theme = themeForSegment(i);
  const holes = [false, false, false];
  let type = 'safe';
  const meters = i * SEG_LEN;

  if (upcoming.length) {
    type = upcoming.shift();
  } else if (i >= runStartSeg + SAFE_START_SEGMENTS && featureCooldown <= 0) {
    const pHole = Math.min(0.26 + meters / 1100, 0.5);
    const r = Math.random();
    if (r < pHole) type = 'holes';
    else if (r < pHole + 0.11) { type = 'ramp'; upcoming = ['gap', 'gap', 'safe']; }
    else if (r < pHole + 0.11 + LOOP_CHANCE && meters > 200) type = 'loop';
    if (type !== 'safe') featureCooldown = upcoming.length + 3;
  }
  featureCooldown--;

  if (type === 'holes') {
    // Keep a reachable safe lane: it only ever shifts one lane per hazard.
    safeLane = Math.max(0, Math.min(LANES - 1, safeLane + (Math.floor(Math.random() * 3) - 1)));
    const candidates = [0, 1, 2].filter((l) => l !== safeLane);
    if (Math.random() < 0.45) holes[candidates[0]] = holes[candidates[1]] = true;
    else holes[candidates[Math.floor(Math.random() * candidates.length)]] = true;
  } else if (type === 'gap') {
    holes[0] = holes[1] = holes[2] = true;
  }

  const group = new THREE.Group();
  group.position.z = segmentCenterZ(i);

  if (type === 'ramp') {
    const ramp = new THREE.Mesh(rampGeo, matFor(theme.accent));
    ramp.rotation.x = Math.atan2(RAMP_H, SEG_LEN);
    ramp.position.y = RAMP_H / 2 - 0.25;
    group.add(ramp);
  } else if (type !== 'gap') {
    for (let lane = 0; lane < LANES; lane++) {
      if (holes[lane]) continue;
      const mesh = new THREE.Mesh(laneGeo, laneMat(theme, i % 2));
      mesh.position.set((lane - 1) * LANE_W, -0.25, 0);
      group.add(mesh);
    }
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(side * (TRACK_W / 2 + 0.15), 0.16, 0);
      group.add(rail);
    }
  }

  if (type === 'loop') {
    const torus = new THREE.Mesh(loopGeo, loopMat(theme.accent));
    torus.scale.z = 3;                 // ribbon just wider than the ball
    torus.rotation.y = Math.PI / 2;
    torus.position.y = LOOP_R + BALL_R;
    group.add(torus);
  }

  // Side scenery on the ground far below.
  if (Math.random() < 0.55) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const decor = theme.decor();
    decor.position.set(side * (11 + Math.random() * 30), GROUND_Y, (Math.random() - 0.5) * SEG_LEN);
    group.add(decor);
  }

  // Boost pads and rolling boulders spice up safe stretches.
  const pads = [];
  if (type === 'safe' && i >= runStartSeg + SAFE_START_SEGMENTS && Math.random() < 0.09) {
    const lane = Math.floor(Math.random() * LANES);
    const pad = new THREE.Mesh(padGeo, boostMat);
    pad.position.set((lane - 1) * LANE_W, 0.045, 0);
    group.add(pad);
    pads.push({ x: (lane - 1) * LANE_W, hit: false });
  }
  if (type === 'safe' && (i - runStartSeg) * SEG_LEN > 120 && Math.random() < 0.08) {
    const boulder = new THREE.Mesh(boulderGeo, boulderMat);
    const lane = Math.floor(Math.random() * LANES);
    boulder.position.set((lane - 1) * LANE_W, 0.55, segmentCenterZ(i));
    scene.add(boulder);
    boulders.push(boulder);
  }

  // Coin lines appear on plain safe stretches.
  const coins = [];
  if (type === 'safe' && i >= runStartSeg + SAFE_START_SEGMENTS) {
    if (coinRun <= 0 && Math.random() < 0.22) {
      coinRun = 3 + Math.floor(Math.random() * 3);
      coinLane = Math.random() < 0.6 ? safeLane : Math.floor(Math.random() * LANES);
    }
    if (coinRun > 0) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set((coinLane - 1) * LANE_W, 0.55, 0);
      group.add(coin);
      coins.push(coin);
      coinRun--;
    }
  } else if (type !== 'safe') {
    coinRun = 0;
  }

  scene.add(group);
  segments.set(i, { type, group, holes, coins, pads, loopDone: false });
}

function ensureTrack(currentIndex) {
  while (genIndex < currentIndex + SEG_AHEAD) spawnSegment(genIndex++);
  for (const [i, seg] of segments) {
    if (i < currentIndex - 3) {
      scene.remove(seg.group);
      segments.delete(i);
    }
  }
}

function resetTrack(startSeg) {
  for (const seg of segments.values()) scene.remove(seg.group);
  segments.clear();
  for (const b of boulders) scene.remove(b);
  boulders.length = 0;
  genIndex = startSeg;
  runStartSeg = startSeg;
  safeLane = 1;
  featureCooldown = 0;
  upcoming = [];
  coinRun = 0;
}

// ---------------------------------------------------------------------------
// Audio (tiny procedural WebAudio blips — no asset files)
// ---------------------------------------------------------------------------
let audioCtx = null;
function beep(freqFrom, freqTo, dur, type = 'sine', gain = 0.12) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch { /* audio is optional */ }
}
const sfxCoin = () => beep(880, 1500, 0.12, 'sine', 0.1);
const sfxFall = () => beep(320, 60, 0.6, 'sawtooth', 0.14);
const sfxGo = () => beep(440, 880, 0.18, 'triangle', 0.1);
const sfxJump = () => beep(300, 900, 0.25, 'triangle', 0.12);
const sfxLevel = () => { beep(523, 784, 0.15, 'square', 0.07); setTimeout(() => beep(784, 1046, 0.2, 'square', 0.07), 130); };

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
const S = { MENU: 0, PLAYING: 1, OVER: 2, PAUSED: 3 };
let state = S.MENU;
let stateBeforePause = S.MENU;
let speed = SPEED_START;
let ballX = 0, ballZ = 0, ballY = BALL_R, velY = 0;
let grounded = true;
let fellSfx = false;
let loop = null;            // { theta, z0 } while inside a loop-the-loop
let lastSegIndex = -1;
let level = 1;
let coinsRun = 0;
let coinValue = 1;          // 2 with the Coin Doubler boost
let shieldCharges = 0;
let save = { best: 0, coins: 0, ball: BALLS[0].id };

const $ = (id) => document.getElementById(id);
const hudDist = $('hud-dist'), hudCoins = $('hud-coins'), hudLevel = $('hud-level');
const toast = $('toast');
let toastTimer = 0;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

const screens = {
  start: $('screen-start'), over: $('screen-over'), pause: $('screen-pause'),
  shop: $('screen-shop'), account: $('screen-account'), leaderboard: $('screen-leaderboard'),
};

function persist() {
  saveSave(save);
  cloudPush(save);
}
function showScreen(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('hidden', k !== name);
}

function applyLevel(newLevel, quiet = false) {
  level = newLevel;
  const theme = THEMES[(level - 1) % THEMES.length];
  skyTarget.set(theme.sky);
  groundTarget.set(theme.ground);
  snow.visible = Boolean(theme.snow);
  hudLevel.textContent = `Lv ${level}`;
  if (!quiet) { showToast(`LEVEL ${level} · ${theme.name}`); sfxLevel(); }
}

function startRun() {
  const boosts = consumeArmedBoosts();
  const startDist = DEV_START + (boosts.headstart ? 150 : 0);
  coinValue = boosts.doubler ? 2 : 1;
  shieldCharges = boosts.shield ? 1 : 0;
  ballZ = -startDist;
  ballX = 0; ballY = BALL_R; velY = 0;
  grounded = true; fellSfx = false; loop = null;
  throttle = 0; boostTimer = 0;
  speed = Math.min(SPEED_MAX, SPEED_START + Math.min(startDist / 60, 5));
  coinsRun = 0;
  lastSegIndex = Math.floor(-ballZ / SEG_LEN);
  ball.rotation.set(0, 0, 0);
  resetTrack(lastSegIndex);
  ensureTrack(lastSegIndex);
  applyLevel(Math.floor(startDist / LEVEL_LEN) + 1, true);
  showScreen('none');
  state = S.PLAYING;
  sfxGo();
}

async function endRun() {
  state = S.OVER;
  sfxFall();
  const dist = Math.floor(-ballZ);
  const distBonus = Math.floor(dist / 100);   // +1 coin per 100 m survived
  const earned = coinsRun + distBonus;
  const newBest = dist > (save.best || 0);
  save.best = Math.max(save.best || 0, dist);
  save.coins = (save.coins || 0) + earned;
  persist();
  sendScore(dist);
  refreshShop();
  $('over-stats').innerHTML =
    `Distance: <b>${dist} m</b>${newBest ? ' — new best!' : ` (best ${save.best} m)`}<br>` +
    `Level <b>${level}</b> · Coins <b>+${earned}</b>` +
    (distBonus ? ` <small>(incl. +${distBonus} distance bonus)</small>` : '') +
    ` · Bank <b data-coin-balance>${save.coins}</b>`;
  showScreen('over');
}

// Shield boost: instead of dying, get dropped back onto the next safe segment.
function shieldRespawn() {
  shieldCharges--;
  showToast('🛡️ Shield saved you!');
  let idx = Math.floor(-ballZ / SEG_LEN) + 2;
  ensureTrack(idx);
  while (true) {
    const s = segments.get(idx);
    if (s && s.type === 'safe' && !s.holes[0] && !s.holes[1] && !s.holes[2]) break;
    idx++;
    if (idx >= genIndex) ensureTrack(idx);
  }
  ballZ = segmentCenterZ(idx);
  ballX = 0;
  ballY = BALL_R + 3;
  velY = 0;
  grounded = false;
  fellSfx = false;
  lastSegIndex = idx;
}

function pauseGame() {
  if (state !== S.PLAYING) return;
  stateBeforePause = state;
  state = S.PAUSED;
  showScreen('pause');
}
function resumeGame() {
  if (state !== S.PAUSED) return;
  state = stateBeforePause;
  showScreen('none');
}

// ---------------------------------------------------------------------------
// Input: horizontal drag (touch or mouse) + arrow/A-D keys
// ---------------------------------------------------------------------------
let dragging = false, lastPointerX = 0, lastPointerY = 0, keyDir = 0;
let throttle = 0, keyThrottle = 0, boostTimer = 0;

canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;
});
window.addEventListener('pointermove', (e) => {
  if (!dragging || state !== S.PLAYING) return;
  const dx = e.clientX - lastPointerX;
  const dy = e.clientY - lastPointerY;
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;
  ballX += dx * (9 / Math.min(window.innerWidth, 900));
  // Push forward to speed up, pull back to brake (Going Balls-style).
  throttle = Math.max(-0.6, Math.min(1, throttle - dy * (4 / Math.min(window.innerHeight, 900))));
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointercancel', () => { dragging = false; });

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyDir = -1;
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyDir = 1;
  else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keyThrottle = 1;
  else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keyThrottle = -0.6;
  else if (e.key === ' ' || e.key === 'Enter') {
    if (state === S.MENU || state === S.OVER) startRun();
    else if (state === S.PAUSED) resumeGame();
  } else if (e.key === 'Escape' || e.key === 'p') {
    state === S.PAUSED ? resumeGame() : pauseGame();
  }
});
window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) keyDir = 0;
  if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) keyThrottle = 0;
});

$('btn-play').addEventListener('click', startRun);
$('btn-retry').addEventListener('click', startRun);
$('btn-resume').addEventListener('click', resumeGame);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});
onSystemPause(pauseGame, resumeGame);

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
function laneAt(x) {
  return Math.max(0, Math.min(LANES - 1, Math.floor((x + TRACK_W / 2) / LANE_W)));
}

const UP = new THREE.Vector3(0, 1, 0);
let camX = 0, camZ = 7;

function die() {
  if (shieldCharges > 0) shieldRespawn();
  else endRun();
}

function step(dt) {
  // Effective speed = base ramp + player throttle + boost-pad burst.
  boostTimer = Math.max(0, boostTimer - dt);
  if (!dragging) throttle *= Math.exp(-dt * 1.6);
  const extra = Math.max(-0.6, Math.min(1, throttle + keyThrottle)) * 8
    + (boostTimer > 0 ? 11 : 0);
  const effSpeed = Math.max(4, speed + extra);

  if (state === S.PLAYING) {
    if (loop) {
      // Scripted loop-the-loop: a vertical circle in the y-z plane.
      const w = Math.max(effSpeed, 15) / LOOP_R;
      loop.theta += w * dt;
      ballX += (0 - ballX) * Math.min(1, dt * 8);
      ballY = BALL_R + LOOP_R * (1 - Math.cos(loop.theta));
      ballZ = loop.z0 - LOOP_R * Math.sin(loop.theta);
      ball.rotation.x -= (w * LOOP_R * dt) / BALL_R;
      if (loop.theta >= Math.PI * 2) {
        ballZ = loop.z0;
        ballY = BALL_R;
        grounded = true;
        loop = null;
        speed = Math.min(SPEED_MAX, speed + 1.5);
      }
    } else {
      ballZ -= effSpeed * dt;
      speed = Math.min(SPEED_MAX, speed + SPEED_RAMP * dt);
      if (grounded || ballY > 0) {   // steer on the ground and mid-jump, not once fallen in
        ballX += keyDir * 7 * dt;
        ballX = Math.max(-X_LIMIT, Math.min(X_LIMIT, ballX));
      }

      const segIndex = Math.floor(-ballZ / SEG_LEN);
      ensureTrack(segIndex);
      const seg = segments.get(segIndex);
      const frac = (-ballZ - segIndex * SEG_LEN) / SEG_LEN;

      // Launch off the end of a ramp.
      if (segIndex !== lastSegIndex) {
        const prev = segments.get(lastSegIndex);
        if (prev && prev.type === 'ramp' && grounded) {
          speed = Math.min(SPEED_MAX, speed + 3);
          const range = 2 * SEG_LEN + 3;
          velY = Math.max(7, Math.min(17, (GRAVITY * range) / (2 * Math.max(effSpeed, speed))));
          grounded = false;
          sfxJump();
        }
        lastSegIndex = segIndex;
      }

      let restY = BALL_R;
      let supported = true;
      if (seg) {
        if (seg.type === 'gap') supported = false;
        else if (seg.type === 'ramp') restY = BALL_R + RAMP_H * frac;
        else supported = !seg.holes[laneAt(ballX)];
      }

      // Enter a loop.
      if (seg && seg.type === 'loop' && grounded && !seg.loopDone && frac < 0.4) {
        seg.loopDone = true;
        loop = { theta: 0, z0: ballZ };
        grounded = false;
        sfxJump();
      } else if (grounded) {
        if (supported) {
          ballY = restY;              // roll along the floor / up the ramp
        } else {
          grounded = false;           // rolled into a hole or gap
          velY = 0;
        }
      } else {
        velY -= GRAVITY * dt;
        const prevY = ballY;
        ballY += velY * dt;
        // Land only when crossing the floor from above this frame — a ball
        // already below the lip has fallen in and cannot be rescued.
        if (velY <= 0 && supported && ballY <= restY && prevY >= restY - 0.05) {
          ballY = restY;              // landed
          velY = 0;
          grounded = true;
          fellSfx = false;
        } else if (ballY < 0 && !fellSfx && !supported) {
          fellSfx = true;
          sfxFall();
        }
        if (ballY < DEATH_Y) die();
      }

      // Boost pads: hit one while grounded for a burst of speed.
      if (grounded && seg && seg.pads.length) {
        const wz = seg.group.position.z;
        for (const pad of seg.pads) {
          if (!pad.hit && Math.abs(pad.x - ballX) < 1.05 && Math.abs(wz - ballZ) < 1.4) {
            pad.hit = true;
            boostTimer = 1.3;
            sfxJump();
          }
        }
      }

      // Rolling boulders: dodge them or die.
      for (let i = boulders.length - 1; i >= 0; i--) {
        const b = boulders[i];
        b.position.z += 6.5 * dt;
        b.rotation.x += (6.5 * dt) / 0.55;
        if (b.position.z > ballZ + 12) {
          scene.remove(b);
          boulders.splice(i, 1);
          continue;
        }
        const dx = b.position.x - ballX, dz = b.position.z - ballZ;
        if (state === S.PLAYING && ballY < 1.4 && dx * dx + dz * dz < 0.9 * 0.9) {
          die();
          break;
        }
      }

      ball.rotation.x -= (effSpeed * dt) / BALL_R;

      // Coin pickups near the ball.
      for (const idx of [segIndex, segIndex + 1]) {
        const s = segments.get(idx);
        if (!s || !s.coins.length) continue;
        for (const coin of s.coins) {
          if (!coin.visible) continue;
          const wz = s.group.position.z + coin.position.z;
          const dx = coin.position.x - ballX, dz = wz - ballZ;
          if (dx * dx + dz * dz < 0.65 * 0.65 && Math.abs(ballY - BALL_R) < 1) {
            coin.visible = false;
            coinsRun += coinValue;
            sfxCoin();
          }
        }
      }
    }

    // Level / theme progression.
    const newLevel = Math.max(1, Math.floor(-ballZ / LEVEL_LEN) + 1);
    if (newLevel !== level) applyLevel(newLevel);

    hudDist.textContent = `${Math.floor(-ballZ)} m`;
    hudCoins.textContent = String(coinsRun);
  }

  // Ambient motion: coins spin, sky/ground colors ease toward the theme.
  for (const s of segments.values()) {
    for (const coin of s.coins) coin.rotateOnWorldAxis(UP, dt * 3);
  }
  scene.background.lerp(skyTarget, Math.min(1, dt * 2));
  scene.fog.color.copy(scene.background);
  groundMat.color.lerp(groundTarget, Math.min(1, dt * 2));
  ground.position.z = ballZ;

  if (snow.visible) {
    const pos = snowGeo.attributes.position;
    for (let i = 0; i < SNOW_N; i++) {
      let y = pos.getY(i) - dt * 2.2;
      if (y < -2) y = 20;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    snow.position.z = ballZ + 10;
  }

  ball.position.set(ballX, ballY, ballZ);

  // Speed streak: fades in with extra speed, hugs the track behind the ball.
  const glow = state === S.PLAYING && grounded ? Math.max(0, extra) / 19 : 0;
  trail.material.opacity += (Math.min(0.75, glow) - trail.material.opacity) * Math.min(1, dt * 8);
  trail.position.set(ballX, 0.06, ballZ + 2.6);

  camX += (ballX * 0.55 - camX) * Math.min(1, dt * 5);
  camZ += (ballZ + 7 - camZ) * Math.min(1, dt * 6);
  const lift = Math.max(0, ballY - BALL_R);
  camera.position.set(camX, 3.4 + lift * 0.35, camZ);
  camera.lookAt(camX * 0.9, 0.6 + lift * 0.55, camZ - 12);

  renderer.render(scene, camera);

  if (PARAMS.has('debug')) {
    window.__rr = {
      ballX, ballY, ballZ, camX, camZ,
      camPos: camera.position.toArray(),
      aspect: camera.aspect,
      iw: window.innerWidth, ih: window.innerHeight,
      canvasW: canvas.width, canvasH: canvas.height,
      cssW: canvas.clientWidth, cssH: canvas.clientHeight,
      ballVisible: ball.visible, ballParent: Boolean(ball.parent),
      ballNdc: ball.position.clone().project(camera).toArray().map((v) => v.toFixed(3)),
      ballWorld: ball.position.toArray().map((v) => v.toFixed(2)),
    };
  }
}

let lastT = performance.now();
let sentFirstFrame = false;
function loopFrame(t) {
  const dt = Math.min((t - lastT) / 1000, 0.05);
  lastT = t;
  step(dt);
  if (!sentFirstFrame) {
    sentFirstFrame = true;
    firstFrameReady();
  }
  requestAnimationFrame(loopFrame);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
(async () => {
  save = await loadSave();
  if (DEV_COINS) save.coins = Math.max(save.coins || 0, DEV_COINS);
  initShop({
    save,
    persist,
    setBall,
    showToast,
    sfxBuy: sfxLevel,
    sfxDeny: () => beep(220, 140, 0.2, 'square', 0.08),
    showScreen,
    isYouTube: typeof window.ytgame !== 'undefined',
  });
  initCloud({
    save,
    persist,
    showScreen,
    showToast,
    onSaveMerged: (merged) => {
      Object.assign(save, merged);
      saveSave(save);
      setBall(save.ball || BALLS[0].id);
      refreshShop();
      if (save.best) $('best-line').textContent = `Best run: ${save.best} m · ${save.coins || 0} coins banked`;
    },
  });
  setBall(save.ball || BALLS[0].id);
  if (save.best) $('best-line').textContent = `Best run: ${save.best} m · ${save.coins || 0} coins banked`;
  hudLevel.textContent = 'Lv 1';
  resetTrack(0);
  ensureTrack(0);
  showScreen('start');
  requestAnimationFrame(loopFrame);
  gameReady();
})();
