// Level scenery themes. All decorations are built from a handful of shared
// unit geometries (scaled per-mesh) and cached materials, so recycling track
// segments never leaks GPU resources.

import * as THREE from 'three';

const UNIT = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(0.5, 1, 8),
  cone4: new THREE.ConeGeometry(0.5, 1, 4),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  sphere: new THREE.SphereGeometry(0.5, 12, 10),
  tire: new THREE.TorusGeometry(0.5, 0.2, 8, 16),
};

const matCache = new Map();
export function matFor(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return matCache.get(color);
}

function mesh(geo, color, sx, sy, sz, x, y, z, ry = 0, rz = 0) {
  const m = new THREE.Mesh(UNIT[geo], matFor(color));
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.rotation.z = rz;
  return m;
}

const R = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- decoration builders (base of the group sits at local y = 0) ------------

function jungleTree() {
  const g = new THREE.Group();
  const h = R(6, 11);
  g.add(mesh('cyl', 0x795548, 1.2, h * 0.45, 1.2, 0, h * 0.22, 0));
  g.add(mesh('cone', 0x2e7d32, 6, h * 0.5, 6, 0, h * 0.55, 0));
  g.add(mesh('cone', 0x388e3c, 4.5, h * 0.45, 4.5, 0, h * 0.85, 0));
  return g;
}

function mountain() {
  const g = new THREE.Group();
  const h = R(18, 32), r = h * R(0.5, 0.75);
  g.add(mesh('cone4', 0x78909c, r, h, r, 0, h / 2, 0, R(0, 3)));
  g.add(mesh('cone4', 0xf5f8ff, r * 0.34, h * 0.3, r * 0.34, 0, h * 0.855, 0, R(0, 3)));
  return g;
}

function snowScene() {
  if (Math.random() < 0.25) {
    const g = new THREE.Group();       // snowman
    g.add(mesh('sphere', 0xf8fbff, 5, 5, 5, 0, 2.2, 0));
    g.add(mesh('sphere', 0xf8fbff, 3.6, 3.6, 3.6, 0, 5.4, 0));
    g.add(mesh('sphere', 0xf8fbff, 2.5, 2.5, 2.5, 0, 7.8, 0));
    g.add(mesh('cone', 0xff7043, 0.7, 2, 0.7, 0, 7.8, -1.6, 0, -Math.PI / 2));
    return g;
  }
  const g = new THREE.Group();         // snowy pine
  const h = R(7, 12);
  g.add(mesh('cyl', 0x5d4037, 1, h * 0.3, 1, 0, h * 0.15, 0));
  g.add(mesh('cone', 0x1b5e20, 5, h * 0.55, 5, 0, h * 0.5, 0));
  g.add(mesh('cone', 0xeceff1, 3.4, h * 0.4, 3.4, 0, h * 0.82, 0));
  return g;
}

function iceSpikes() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const h = R(5, 13);
    g.add(mesh('cone', pick([0xb2ebf2, 0xd7f6fb, 0x80deea]), R(1.5, 3.5), h, R(1.5, 3.5),
      R(-3, 3), h / 2, R(-3, 3), 0, R(-0.15, 0.15)));
  }
  return g;
}

function waterScene() {
  if (Math.random() < 0.35) {
    const g = new THREE.Group();       // buoy bobbing on the water
    g.add(mesh('sphere', 0xe53935, 2.4, 2.4, 2.4, 0, 0.7, 0));
    g.add(mesh('cyl', 0xfafafa, 0.5, 1.6, 0.5, 0, 2.4, 0));
    return g;
  }
  const g = new THREE.Group();         // palm island
  g.add(mesh('cyl', 0xf0d090, 7, 1.6, 7, 0, 0.5, 0));
  const h = R(6, 9);
  g.add(mesh('cyl', 0x8d6e63, 0.8, h, 0.8, 0, h / 2 + 1, 0, 0, 0.12));
  for (let i = 0; i < 5; i++) {
    g.add(mesh('cone', 0x43a047, 0.9, 4.5, 0.9, 0, h + 1.2, 0, 0, (i / 5) * Math.PI * 2 + 1.9));
  }
  return g;
}

function junkPile() {
  const g = new THREE.Group();
  const rust = [0x8d6e63, 0x6d4c41, 0x9e9d24, 0x78909c, 0xa1887f, 0xbf360c];
  let y = 0;
  for (let i = 0; i < 4; i++) {
    const s = R(2, 5.5 - i);
    g.add(mesh('box', pick(rust), s, s * 0.7, s, R(-2, 2), y + s * 0.35, R(-2, 2), R(0, 3)));
    y += s * 0.55;
  }
  g.add(mesh('tire', 0x212121, 4, 4, 4, R(-4, 4), 2, R(-1, 1), 0, Math.PI / 2));
  return g;
}

function pyramidScene() {
  const g = new THREE.Group();
  if (Math.random() < 0.3) {           // obelisk
    const h = R(10, 16);
    g.add(mesh('box', 0xd9b36c, 1.6, h, 1.6, 0, h / 2, 0));
    g.add(mesh('cone4', 0xc5a05a, 1.6, 2, 1.6, 0, h + 1, 0, Math.PI / 4));
    return g;
  }
  const h = R(12, 26);
  g.add(mesh('cone4', pick([0xd9b36c, 0xcfa860, 0xe0bd7a]), h * 1.3, h, h * 1.3, 0, h / 2, 0, Math.PI / 4));
  return g;
}

function landmark() {
  const kind = pick(['tower', 'torii', 'arch']);
  const g = new THREE.Group();
  if (kind === 'tower') {              // Eiffel-ish lattice tower
    g.add(mesh('cone4', 0x4e342e, 9, 7, 9, 0, 3.5, 0, Math.PI / 4));
    g.add(mesh('cone4', 0x4e342e, 5, 9, 5, 0, 10, 0, Math.PI / 4));
    g.add(mesh('cone4', 0x4e342e, 2, 9, 2, 0, 17, 0, Math.PI / 4));
    g.add(mesh('cyl', 0x4e342e, 0.5, 3, 0.5, 0, 22, 0));
  } else if (kind === 'torii') {       // torii gate
    for (const s of [-1, 1]) g.add(mesh('cyl', 0xd32f2f, 1.2, 11, 1.2, s * 5, 5.5, 0));
    g.add(mesh('box', 0xd32f2f, 15, 1.3, 1.6, 0, 11.5, 0));
    g.add(mesh('box', 0xb71c1c, 11.5, 1, 1.3, 0, 9, 0));
  } else {                             // stone arch
    for (const s of [-1, 1]) g.add(mesh('box', 0x9e9e9e, 2.4, 12, 2.4, s * 4.5, 6, 0));
    g.add(mesh('box', 0xbdbdbd, 14, 2.6, 3, 0, 13.2, 0));
  }
  return g;
}

// --- theme table -------------------------------------------------------------

export const THEMES = [
  { name: 'Jungle', sky: 0x8fc9a8, ground: 0x2f6d33, lanes: [0x7cb342, 0x689f38], rail: 0x8d6e63, accent: 0xff7043, decor: jungleTree },
  { name: 'Mountains', sky: 0xa7c4e2, ground: 0x5d7361, lanes: [0x9aa5ad, 0x87939c], rail: 0x546e7a, accent: 0x4fc3f7, decor: mountain },
  { name: 'Snow', sky: 0xdde9f7, ground: 0xf2f6fd, lanes: [0xe4eefb, 0xd2e2f5], rail: 0x90caf9, accent: 0x42a5f5, decor: snowScene, snow: true, slippery: 0.5 },
  { name: 'Ice', sky: 0xbfeef7, ground: 0x9fdcee, lanes: [0xb5ecf4, 0x93e0ec], rail: 0x26c6da, accent: 0x00acc1, decor: iceSpikes, snow: true, slippery: 0.28 },
  { name: 'Waterworld', sky: 0x7fc9f2, ground: 0x1565c0, lanes: [0xffcc80, 0xffb74d], rail: 0x8d6e63, accent: 0x29b6f6, decor: waterScene },
  { name: 'Junkyard', sky: 0xc9b28a, ground: 0x87755b, lanes: [0x9e8f7a, 0x8a7c68], rail: 0x5d4037, accent: 0xff8f00, decor: junkPile },
  { name: 'Pyramids', sky: 0xffe0a3, ground: 0xdcbe7a, lanes: [0xf0d090, 0xe4c47e], rail: 0xa1887f, accent: 0xffb300, decor: pyramidScene },
  { name: 'Landmarks', sky: 0xcdd6f7, ground: 0x525f78, lanes: [0x7986cb, 0x6474c4], rail: 0x3949ab, accent: 0xffca28, decor: landmark },
];
