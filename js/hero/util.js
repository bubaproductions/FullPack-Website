// Shared helpers: seeded noise, canvas textures, ribbon geometry for paper webs, mesh shortcuts.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// seamless multi-octave value noise in [0,1]
export function noiseField(w, h, { octaves = 4, base = 4, seed = 1, persistence = 0.5 } = {}) {
  const out = new Float32Array(w * h); const rnd = mulberry32(seed); let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const g = base << o; const grid = new Float32Array(g * g); for (let i = 0; i < grid.length; i++) grid[i] = rnd();
    for (let y = 0; y < h; y++) {
      const fy = y / h * g, y0 = Math.floor(fy) % g, ty = fy - Math.floor(fy), sy = ty * ty * (3 - 2 * ty), y1 = (y0 + 1) % g;
      for (let x = 0; x < w; x++) {
        const fx = x / w * g, x0 = Math.floor(fx) % g, tx = fx - Math.floor(fx), sx = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % g;
        out[y * w + x] += ((grid[y0 * g + x0] * (1 - sx) + grid[y0 * g + x1] * sx) * (1 - sy) + (grid[y1 * g + x0] * (1 - sx) + grid[y1 * g + x1] * sx) * sy) * amp;
      }
    }
    total += amp; amp *= persistence;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function tex(canvas, { srgb = true, repeat = [1, 1], aniso = 8, wrap = THREE.RepeatWrapping } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = wrap; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = aniso; return t;
}
export function fieldCanvas(w, h, field, fn) {
  const c = makeCanvas(w, h), ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  for (let i = 0; i < w * h; i++) { const [r, g, b] = fn(field[i], i % w, (i / w) | 0); d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; }
  ctx.putImageData(img, 0, 0); return c;
}
export function drawCanvas(w, h, draw) { const c = makeCanvas(w, h); draw(c.getContext('2d'), w, h); return c; }
export function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
export function cloneTex(t, rx, ry) { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; }

// ---- geometry helpers --------------------------------------------------------
// bevelled box: sheet-metal panels and castings never have razor edges; the bevel catches highlights
const geoCache = new Map();
export function boxGeo(w, h, d) {
  const key = `${w.toFixed(4)}_${h.toFixed(4)}_${d.toFixed(4)}`;
  if (!geoCache.has(key)) {
    const r = Math.min(0.03, Math.min(w, h, d) * 0.22);
    geoCache.set(key, r > 0.002 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d));
  }
  return geoCache.get(key);
}
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  if (parent) parent.add(m); return m;
}
// sharp box for things that really are sharp-edged (paper, board, film)
export function flatBox(w, h, d, mat, x = 0, y = 0, z = 0, parent = null) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  if (parent) parent.add(m); return m;
}
// small label / plate decal on a surface
export function decal(parent, texture, w, h, x, y, z, ry = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1 }));
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0); parent.add(m); return m;
}
// bolt heads along an edge (hex nuts), purely cosmetic
export function bolts(parent, mat, pts, r = 0.012, axis = 'z') {
  for (const [x, y, z] of pts) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 0.8, 6), mat); if (axis === 'z') b.rotation.x = Math.PI / 2; else if (axis === 'x') b.rotation.z = Math.PI / 2; b.position.set(x, y, z); parent.add(b); }
}
// cylinder whose axis is along `axis` ('x' | 'y' | 'z')
export function cyl(r, len, mat, axis = 'z', seg = 32, parent = null, x = 0, y = 0, z = 0, r2 = r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, len, seg), mat);
  if (axis === 'z') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.z = Math.PI / 2;
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (parent) parent.add(m); return m;
}
// a spinning roller: group (for placement/spin) containing the cylinder; spin via group.rotation[axis]
export function roller(r, len, mat, axis = 'z', parent, x, y, z, seg = 48) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  if (axis === 'z') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.z = Math.PI / 2;
  m.castShadow = m.receiveShadow = true; g.add(m); g.userData.r = r; g.userData.axis = axis; parent.add(g); return g;
}

// ---- ribbon (paper web) along a 2D path in the XY plane, extruded across Z ----
// points: array of [x,y]; width across Z; returns a Mesh whose material map scrolls along u.
// amp/freq add a corrugation (flute wave) displaced along the local normal.
export function ribbon(points, width, mat, { segments = 240, amp = 0, freq = 0, uScale = 1, closed = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), closed, 'catmullrom', 0.25);
  const len = curve.getLength();
  const pos = [], uv = [], idx = [];
  const n = segments;
  for (let i = 0; i <= n; i++) {
    const t = i / n; const p = curve.getPointAt(t); const tan = curve.getTangentAt(t);
    const nx = -tan.y, ny = tan.x; // normal in XY
    const d = amp ? amp * Math.sin(t * len * freq) : 0;
    const px = p.x + nx * d, py = p.y + ny * d;
    pos.push(px, py, -width / 2, px, py, width / 2);
    uv.push(t * len * uScale, 0, t * len * uScale, 1);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; m.userData.length = len; return m;
}

// thick ribbon: a flat web with visible thickness (two faces + edges) — used for finished board webs
export function thickRibbon(points, width, thickness, faceMat, edgeMat, opts = {}) {
  const g = new THREE.Group();
  const top = ribbon(points.map(([x, y]) => [x, y + thickness / 2]), width, faceMat, opts);
  const bot = ribbon(points.map(([x, y]) => [x, y - thickness / 2]), width, faceMat, opts);
  g.add(top, bot);
  for (const s of [-1, 1]) {
    const e = ribbon(points, thickness, edgeMat, opts); e.rotation.x = Math.PI / 2; e.position.z = s * width / 2; g.add(e);
  }
  g.userData.length = top.userData.length; g.userData.maps = [top, bot]; return g;
}

export const DEG = Math.PI / 180;
