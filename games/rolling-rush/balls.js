// Procedural ball skins: every texture is drawn on a canvas at runtime,
// so there are zero image assets to download.

const TEX_W = 256, TEX_H = 128;

function canvasCtx() {
  const c = document.createElement('canvas');
  c.width = TEX_W; c.height = TEX_H;
  return [c, c.getContext('2d')];
}

function gradientBall(stops, stars = false) {
  return () => {
    const [c, g] = canvasCtx();
    const grad = g.createLinearGradient(0, 0, 0, TEX_H);
    stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));
    g.fillStyle = grad;
    g.fillRect(0, 0, TEX_W, TEX_H);
    if (stars) {
      g.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 40; i++) {
        const r = Math.random() < 0.15 ? 1.8 : 0.9;
        g.beginPath();
        g.arc(Math.random() * TEX_W, Math.random() * TEX_H, r, 0, 7);
        g.fill();
      }
    }
    return c;
  };
}

function pentagon(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  g.fill();
}

function soccer() {
  const [c, g] = canvasCtx();
  g.fillStyle = '#f5f5f2';
  g.fillRect(0, 0, TEX_W, TEX_H);
  g.fillStyle = '#17171a';
  const spots = [[32, 30], [128, 30], [224, 30], [80, 98], [176, 98], [-16, 98], [272, 98]];
  for (const [x, y] of spots) pentagon(g, x, y, 17);
  return c;
}

function basketball() {
  const [c, g] = canvasCtx();
  g.fillStyle = '#e8702a';
  g.fillRect(0, 0, TEX_W, TEX_H);
  g.strokeStyle = '#38220f';
  g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, 64); g.lineTo(TEX_W, 64); g.stroke();
  for (const x of [64, 192]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TEX_H); g.stroke(); }
  for (const x of [0, TEX_W]) { g.beginPath(); g.arc(x, 64, 52, 0, Math.PI * 2); g.stroke(); }
  return c;
}

function tennis() {
  const [c, g] = canvasCtx();
  g.fillStyle = '#cbe63c';
  g.fillRect(0, 0, TEX_W, TEX_H);
  g.strokeStyle = '#f8f8f4';
  g.lineWidth = 7;
  for (const [base, phase] of [[34, 0], [94, Math.PI]]) {
    g.beginPath();
    for (let x = 0; x <= TEX_W; x += 4) {
      const y = base + 18 * Math.sin((x / TEX_W) * Math.PI * 2 + phase);
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  return c;
}

function bowling() {
  const [c, g] = canvasCtx();
  g.fillStyle = '#191036';
  g.fillRect(0, 0, TEX_W, TEX_H);
  g.strokeStyle = 'rgba(110,70,200,.45)';
  g.lineWidth = 10;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.moveTo(Math.random() * TEX_W, Math.random() * TEX_H);
    g.bezierCurveTo(Math.random() * TEX_W, Math.random() * TEX_H,
      Math.random() * TEX_W, Math.random() * TEX_H,
      Math.random() * TEX_W, Math.random() * TEX_H);
    g.stroke();
  }
  g.fillStyle = '#000';
  for (const [x, y, r] of [[128, 46, 7], [112, 66, 7], [146, 66, 7]]) {
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  return c;
}

const POOL_COLORS = [null, '#fdd835', '#1565c0', '#e53935', '#6a2d9e',
  '#fb8c00', '#2e7d32', '#8d2b2b', '#141414'];

function numberSpot(g, x, y, n) {
  g.fillStyle = '#fafafa';
  g.beginPath(); g.arc(x, y, 21, 0, 7); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#111';
  g.font = 'bold 25px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(n), x, y + 1);
}

function billiard(n) {
  return () => {
    const [c, g] = canvasCtx();
    if (n === 0) {                       // cue ball
      g.fillStyle = '#f8f7f2'; g.fillRect(0, 0, TEX_W, TEX_H);
      g.fillStyle = '#c0392b';
      for (const x of [64, 192]) { g.beginPath(); g.arc(x, 64, 7, 0, 7); g.fill(); }
      return c;
    }
    const color = POOL_COLORS[n > 8 ? n - 8 : n];
    if (n > 8) {                         // stripes
      g.fillStyle = '#f8f7f2'; g.fillRect(0, 0, TEX_W, TEX_H);
      g.fillStyle = color; g.fillRect(0, 30, TEX_W, 68);
    } else {                             // solids
      g.fillStyle = color; g.fillRect(0, 0, TEX_W, TEX_H);
    }
    for (const x of [64, 192]) numberSpot(g, x, 64, n);
    return c;
  };
}

export const BALLS = [
  { id: 'sunset', name: 'Sunset', price: 0, make: gradientBall(['#ffd54f', '#ff7043', '#8e24aa']) },
  { id: 'ocean', name: 'Ocean', price: 30, make: gradientBall(['#4dd0e1', '#1976d2', '#0d2c6b']) },
  { id: 'candy', name: 'Candy', price: 30, make: gradientBall(['#ff8a80', '#ff4081', '#7c4dff']) },
  { id: 'lime', name: 'Lime', price: 30, make: gradientBall(['#f4ff81', '#aeea00', '#33691e']) },
  { id: 'galaxy', name: 'Galaxy', price: 120, make: gradientBall(['#b388ff', '#4527a0', '#0d0221'], true) },
  { id: 'soccer', name: 'Soccer', price: 80, make: soccer },
  { id: 'basketball', name: 'Basketball', price: 80, make: basketball },
  { id: 'tennis', name: 'Tennis', price: 60, make: tennis },
  { id: 'bowling', name: 'Bowling', price: 100, make: bowling, roughness: 0.15, metalness: 0.1 },
  { id: 'cue', name: 'Cue Ball', price: 60, make: billiard(0), roughness: 0.2 },
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `pool${i + 1}`,
    name: `${i + 1} Ball`,
    price: i + 1 === 8 ? 150 : i + 1 > 8 ? 70 : 50,
    make: billiard(i + 1),
    roughness: 0.2,
  })),
];

// Small round chip image for the ball-picker UI.
export function ballThumb(def, size = 46) {
  const src = def.make();
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.beginPath(); g.arc(size / 2, size / 2, size / 2 - 1, 0, 7); g.clip();
  g.drawImage(src, 64, 0, 128, 128, 0, 0, size, size);
  const sheen = g.createRadialGradient(size * 0.35, size * 0.3, 2, size / 2, size / 2, size * 0.7);
  sheen.addColorStop(0, 'rgba(255,255,255,.55)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0)');
  sheen.addColorStop(1, 'rgba(0,0,0,.35)');
  g.fillStyle = sheen;
  g.fillRect(0, 0, size, size);
  return c;
}
