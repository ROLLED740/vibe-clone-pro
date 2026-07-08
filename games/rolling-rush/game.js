import * as THREE from 'three';
import {
  firstFrameReady, gameReady, sendScore,
  loadSave, saveSave, onSystemPause,
} from './ytgame-shim.js';

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
const SAFE_START_SEGMENTS = 8;       // hazard-free runway at the start
const HAZARD_GAP = 2;                // safe segments enforced after a hazard

// ---------------------------------------------------------------------------
// Renderer / scene
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b1a5e);
scene.fog = new THREE.Fog(0x2b1a5e, 28, 95);

const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);

scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x3a2a66, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(4, 10, 6);
scene.add(sun);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------------------
// Ball
// ---------------------------------------------------------------------------
function makeBallTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const colors = ['#ff5d73', '#ffd23e', '#4ecdc4', '#f7f7ff'];
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      g.fillStyle = colors[y * 2 + x];
      g.fillRect(x * 64, y * 64, 64, 64);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(BALL_R, 28, 20),
  new THREE.MeshStandardMaterial({ map: makeBallTexture(), roughness: 0.35, metalness: 0.05 }),
);
scene.add(ball);

// ---------------------------------------------------------------------------
// Track segments (pooled meshes, procedural layout)
// ---------------------------------------------------------------------------
const laneGeo = new THREE.BoxGeometry(LANE_W, 0.5, SEG_LEN);
const railGeo = new THREE.BoxGeometry(0.22, 0.34, SEG_LEN);
const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.09, 20);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd23e, roughness: 0.25, metalness: 0.65 });
const railMat = new THREE.MeshLambertMaterial({ color: 0xffb347 });

const laneMats = new Map(); // hue bucket -> material, so the track slowly shifts color
function laneMat(index) {
  const bucket = (Math.floor(index / 6) % 12) * 2 + (index % 2);
  if (!laneMats.has(bucket)) {
    const hue = (0.62 + Math.floor(index / 6) * 0.045) % 1;
    const light = index % 2 === 0 ? 0.58 : 0.5;
    laneMats.set(bucket, new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(hue, 0.55, light),
    }));
  }
  return laneMats.get(bucket);
}

const segments = new Map(); // index -> { group, holes, coins }
let genIndex = 0;           // next segment index to generate
let safeLane = 1;
let hazardCooldown = 0;
let coinRun = 0;            // remaining segments in the current coin line
let coinLane = 1;

function segmentCenterZ(i) { return -(i + 0.5) * SEG_LEN; }

function spawnSegment(i) {
  const holes = [false, false, false];
  let isHazard = false;

  if (i >= SAFE_START_SEGMENTS && hazardCooldown <= 0) {
    const meters = i * SEG_LEN;
    const p = Math.min(0.25 + meters / 900, 0.55);
    if (Math.random() < p) {
      isHazard = true;
      // Keep a reachable safe lane: it only ever shifts one lane per hazard.
      safeLane = Math.max(0, Math.min(LANES - 1, safeLane + (Math.floor(Math.random() * 3) - 1)));
      const holeCount = Math.random() < 0.45 ? 2 : 1;
      const candidates = [0, 1, 2].filter((l) => l !== safeLane);
      if (holeCount === 2) {
        holes[candidates[0]] = holes[candidates[1]] = true;
      } else {
        holes[candidates[Math.floor(Math.random() * candidates.length)]] = true;
      }
      hazardCooldown = HAZARD_GAP;
    }
  }
  if (!isHazard) hazardCooldown--;

  const group = new THREE.Group();
  group.position.z = segmentCenterZ(i);

  for (let lane = 0; lane < LANES; lane++) {
    if (holes[lane]) continue;
    const mesh = new THREE.Mesh(laneGeo, laneMat(i));
    mesh.position.set((lane - 1) * LANE_W, -0.25, 0);
    group.add(mesh);
  }
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(side * (TRACK_W / 2 + 0.11), 0.12, 0);
    group.add(rail);
  }

  // Coin lines appear on safe stretches.
  const coins = [];
  if (!isHazard && i >= SAFE_START_SEGMENTS) {
    if (coinRun <= 0 && Math.random() < 0.22) {
      coinRun = 3 + Math.floor(Math.random() * 3);
      coinLane = Math.random() < 0.6 ? safeLane : Math.floor(Math.random() * LANES);
    }
    if (coinRun > 0 && !holes[coinLane]) {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set((coinLane - 1) * LANE_W, 0.55, 0);
      group.add(coin);
      coins.push(coin);
      coinRun--;
    }
  } else {
    coinRun = 0;
  }

  scene.add(group);
  segments.set(i, { group, holes, coins });
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

function resetTrack() {
  for (const seg of segments.values()) scene.remove(seg.group);
  segments.clear();
  genIndex = 0;
  safeLane = 1;
  hazardCooldown = 0;
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

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
const S = { MENU: 0, PLAYING: 1, FALLING: 2, OVER: 3, PAUSED: 4 };
let state = S.MENU;
let stateBeforePause = S.MENU;
let speed = SPEED_START;
let ballX = 0, ballZ = 0, ballY = BALL_R, velY = 0;
let coinsRun = 0;
let save = { best: 0, coins: 0 };

const $ = (id) => document.getElementById(id);
const hudDist = $('hud-dist'), hudCoins = $('hud-coins');
const screens = { start: $('screen-start'), over: $('screen-over'), pause: $('screen-pause') };
function showScreen(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('hidden', k !== name);
}
function hideScreens() { showScreen('none'); }

function startRun() {
  resetTrack();
  speed = SPEED_START;
  ballX = 0; ballZ = 0; ballY = BALL_R; velY = 0;
  coinsRun = 0;
  ball.rotation.set(0, 0, 0);
  ensureTrack(0);
  hideScreens();
  state = S.PLAYING;
  sfxGo();
}

async function endRun() {
  state = S.OVER;
  const dist = Math.floor(-ballZ);
  const newBest = dist > (save.best || 0);
  save.best = Math.max(save.best || 0, dist);
  save.coins = (save.coins || 0) + coinsRun;
  saveSave(save);
  sendScore(dist);
  $('over-stats').innerHTML =
    `Distance: <b>${dist} m</b>${newBest ? ' — new best!' : ` (best ${save.best} m)`}<br>` +
    `Coins: <b>+${coinsRun}</b> (total ${save.coins})`;
  showScreen('over');
}

function pauseGame() {
  if (state !== S.PLAYING && state !== S.FALLING) return;
  stateBeforePause = state;
  state = S.PAUSED;
  showScreen('pause');
}
function resumeGame() {
  if (state !== S.PAUSED) return;
  state = stateBeforePause;
  hideScreens();
}

// ---------------------------------------------------------------------------
// Input: horizontal drag (touch or mouse) + arrow/A-D keys
// ---------------------------------------------------------------------------
let dragging = false, lastPointerX = 0, keyDir = 0;

canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastPointerX = e.clientX;
});
window.addEventListener('pointermove', (e) => {
  if (!dragging || state !== S.PLAYING) return;
  const dx = e.clientX - lastPointerX;
  lastPointerX = e.clientX;
  ballX += dx * (9 / Math.min(window.innerWidth, 900));
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointercancel', () => { dragging = false; });

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyDir = -1;
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyDir = 1;
  else if (e.key === ' ' || e.key === 'Enter') {
    if (state === S.MENU || state === S.OVER) startRun();
    else if (state === S.PAUSED) resumeGame();
  } else if (e.key === 'Escape' || e.key === 'p') {
    state === S.PAUSED ? resumeGame() : pauseGame();
  }
});
window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) keyDir = 0;
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
let camX = 0;
function step(dt) {
  if (state === S.PLAYING || state === S.FALLING) {
    ballZ -= speed * dt;
    if (state === S.PLAYING) {
      speed = Math.min(SPEED_MAX, speed + SPEED_RAMP * dt);
      ballX += keyDir * 7 * dt;
      ballX = Math.max(-X_LIMIT, Math.min(X_LIMIT, ballX));
    }

    const segIndex = Math.floor(-ballZ / SEG_LEN);
    ensureTrack(segIndex);

    const seg = segments.get(segIndex);
    const supported = seg ? !seg.holes[laneAt(ballX)] : true;

    if (state === S.PLAYING && !supported) {
      state = S.FALLING;
      sfxFall();
    }
    if (state === S.FALLING) {
      velY -= GRAVITY * dt;
      ballY += velY * dt;
      // Brief grace: rolling back over solid ground near the surface recovers.
      if (supported && ballY >= BALL_R - 0.18 && velY < 0) {
        state = S.PLAYING;
        ballY = BALL_R;
        velY = 0;
      } else if (ballY < -7) {
        endRun();
      }
    }

    // Coin pickups near the ball.
    for (const idx of [segIndex, segIndex + 1]) {
      const s = segments.get(idx);
      if (!s || !s.coins.length) continue;
      for (const coin of s.coins) {
        if (!coin.visible) continue;
        const wz = s.group.position.z + coin.position.z;
        const dx = coin.position.x - ballX, dz = wz - ballZ;
        if (dx * dx + dz * dz < 0.65 * 0.65) {
          coin.visible = false;
          coinsRun++;
          sfxCoin();
        }
      }
    }

    // Roll the ball.
    ball.rotation.x -= (speed * dt) / BALL_R;

    hudDist.textContent = `${Math.floor(-ballZ)} m`;
    hudCoins.textContent = String(coinsRun);
  }

  // Spin coins around the vertical axis for sparkle.
  for (const s of segments.values()) {
    for (const coin of s.coins) coin.rotateOnWorldAxis(UP, dt * 3);
  }

  ball.position.set(ballX, ballY, ballZ);
  camX += (ballX * 0.55 - camX) * Math.min(1, dt * 5);
  camera.position.set(camX, 3.4, ballZ + 7);
  camera.lookAt(camX * 0.9, 0.6, ballZ - 5);

  renderer.render(scene, camera);
}

let lastT = performance.now();
let sentFirstFrame = false;
function loop(t) {
  const dt = Math.min((t - lastT) / 1000, 0.05);
  lastT = t;
  step(dt);
  if (!sentFirstFrame) {
    sentFirstFrame = true;
    firstFrameReady();
  }
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
(async () => {
  save = await loadSave();
  if (save.best) $('best-line').textContent = `Best run: ${save.best} m · ${save.coins || 0} coins banked`;
  ensureTrack(0);
  showScreen('start');
  requestAnimationFrame(loop);
  gameReady();
})();
