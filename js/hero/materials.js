// Procedural PBR materials for the factory: papers, board, painted machine panels, metals, floor, wood, rubber.
import * as THREE from 'three';
import { noiseField, fieldCanvas, drawCanvas, tex, cloneTex, mulberry32 } from './util.js';

export function buildMaterials(logo) {
  const S = 1024;
  const nA = noiseField(S, S, { octaves: 5, base: 6, seed: 11 });
  const nB = noiseField(S, S, { octaves: 3, base: 96, seed: 23, persistence: 0.6 });
  const nC = noiseField(S, S, { octaves: 6, base: 4, seed: 41 });

  // --- papers
  const kraftC = fieldCanvas(S, S, nA, (v, x, y) => { const f = 0.82 + 0.3 * v + 0.08 * (nB[y * S + x] - 0.5); return [176 * f, 128 * f, 82 * f]; });
  const kc = kraftC.getContext('2d'); const rnd = mulberry32(5);
  for (let i = 0; i < 9000; i++) { const x = rnd() * S, y = rnd() * S, len = 4 + rnd() * 26; kc.strokeStyle = rnd() > 0.5 ? `rgba(255,236,205,${0.05 + rnd() * 0.1})` : `rgba(80,52,25,${0.04 + rnd() * 0.08})`; kc.lineWidth = 0.8 + rnd(); kc.beginPath(); kc.moveTo(x, y); kc.lineTo(x + len, y + (rnd() - 0.5) * 4); kc.stroke(); }
  for (let i = 0; i < 2500; i++) { kc.fillStyle = `rgba(40,25,10,${rnd() * 0.25})`; kc.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd()); }
  // semichem fluting medium: lighter, yellower, more flecked
  const mediumC = fieldCanvas(S, S, nA, (v, x, y) => { const f = 0.8 + 0.34 * v + 0.1 * (nB[y * S + x] - 0.5); return [190 * f, 150 * f, 98 * f]; });
  const mc = mediumC.getContext('2d'); for (let i = 0; i < 4000; i++) { mc.fillStyle = `rgba(70,50,30,${rnd() * 0.3})`; mc.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 3, 1 + rnd()); }
  const paperBump = fieldCanvas(S, S, nB, (v, x, y) => { const g = 120 + 110 * v + 30 * (nA[y * S + x] - 0.5); return [g, g, g]; });
  const paperRough = fieldCanvas(S, S, nA, (v) => { const g = 210 + 36 * (v - 0.5); return [g, g, g]; });
  const kraftMap = tex(kraftC), mediumMap = tex(mediumC), bumpMap = tex(paperBump, { srgb: false }), roughMap = tex(paperRough, { srgb: false });

  // flute edge: sinusoidal medium between two liners, with starch fillets at the tips
  const flute = drawCanvas(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#9e7449'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) { const s = Math.sin(x / 6.4); const sh = 0.7 + 0.3 * Math.cos(x / 6.4); ctx.fillStyle = `rgb(${165 * sh | 0},${125 * sh | 0},${80 * sh | 0})`; ctx.fillRect(x, 9 + (1 - (s + 1) / 2) * 42, 1, 5); }
    for (let x = 0; x < w; x += 40.2) { ctx.fillStyle = 'rgba(230,215,180,0.55)'; ctx.fillRect(x + 7, 7, 6, 4); ctx.fillRect(x + 27, 53, 6, 4); }
    ctx.fillStyle = '#c69a68'; ctx.fillRect(0, 0, w, 8); ctx.fillRect(0, 56, w, 8); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, 8, w, 1); ctx.fillRect(0, 55, w, 1);
  });
  const fluteMap = tex(flute);

  // --- painted panels / metals
  const paintNoise = fieldCanvas(512, 512, noiseField(512, 512, { octaves: 3, base: 64, seed: 7, persistence: 0.55 }), (v) => { const g = 200 + 30 * (v - 0.5); return [g, g, g]; });
  const paintRough = tex(paintNoise, { srgb: false, repeat: [4, 4] });
  const brushed = fieldCanvas(512, 512, noiseField(512, 512, { octaves: 2, base: 2, seed: 9 }), (v, x, y) => { const s = 0.5 + 0.5 * Math.sin(y * 1.7 + v * 40); const g = 150 + 60 * s + 30 * (v - 0.5); return [g, g, g]; });
  const brushedRough = tex(brushed, { srgb: false, repeat: [6, 1] });

  // --- floor: power-trowelled grey concrete with epoxy sheen and expansion joints
  const floorC = fieldCanvas(S, S, nC, (v, x, y) => { let f = 0.78 + 0.42 * v + 0.1 * (nB[y * S + x] - 0.5); if (x % 512 < 3 || y % 512 < 3) f *= 0.72; return [96 * f, 94 * f, 90 * f]; });
  const floorR = fieldCanvas(S, S, nC, (v, x, y) => { const g = 150 + 60 * (v - 0.5) + 25 * (nB[y * S + x] - 0.5); return [g, g, g]; });
  // --- wood (EPAL pine)
  const wN = noiseField(512, 512, { octaves: 4, base: 3, seed: 77 });
  const woodC = fieldCanvas(512, 512, wN, (v, x, y) => { const g = 0.5 + 0.5 * Math.sin((y / 512) * 70 + v * 9); const f = 0.8 + 0.3 * v - 0.16 * g; return [205 * f, 168 * f, 118 * f]; });
  const woodMap = tex(woodC);
  // --- rubber belts (dark, with faint ribs), tyre tread, hazard stripes, PVC curtain, grating
  const beltC = drawCanvas(256, 64, (ctx, w, h) => { ctx.fillStyle = '#1c1c1e'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#262628'; for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 3, h); });
  const treadC = drawCanvas(256, 64, (ctx, w, h) => { ctx.fillStyle = '#7a7a7a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1e1e1e'; for (let x = 0; x < w; x += 16) ctx.fillRect(x, 0, 6, h); for (let y = 0; y < h; y += 21) ctx.fillRect(0, y, w, 3); });
  const hazardC = drawCanvas(128, 16, (ctx) => { for (let x = 0; x < 128; x += 16) { ctx.fillStyle = (x / 16) % 2 ? '#141414' : '#e2b322'; ctx.fillRect(x, 0, 16, 16); } });
  const gratingC = drawCanvas(256, 256, (ctx, w, h) => { ctx.fillStyle = '#5a5c5e'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1a1a1a'; for (let y = 8; y < h; y += 24) for (let x = 8; x < w; x += 40) ctx.fillRect(x, y, 30, 14); });
  const curtainC = drawCanvas(2048, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ece8e1'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#c9221a'; ctx.fillRect(0, h - 90, w, 90);
    const lw = 760, lh = lw * (logo.height / logo.width); ctx.drawImage(logo, (w - lw) / 2, 120, lw, lh);
    ctx.fillStyle = '#6d6e71'; ctx.font = '500 34px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('IMBALLAGGI IN CARTONE ONDULATO · CAMPANIA', w / 2, 120 + lh + 70);
    for (let x = 0; x < w; x += 128) { ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(x, 0, 2, h); }
  });
  const curtainBump = drawCanvas(256, 16, (ctx) => { for (let x = 0; x < 256; x++) { const p = (x % 16) / 16; const g = 100 + 90 * Math.abs(Math.sin(p * Math.PI)); ctx.fillStyle = `rgb(${g},${g},${g})`; ctx.fillRect(x, 0, 1, 16); } });

  const cache = new Map();
  const M = {
    maps: { kraftMap, mediumMap, bumpMap, roughMap, fluteMap, woodMap },
    // paper & board
    kraft: (w, d) => memo(cache, `k${w.toFixed(2)}_${d.toFixed(2)}`, () => new THREE.MeshStandardMaterial({ map: cloneTex(kraftMap, w / 0.9, d / 0.9), bumpMap: cloneTex(bumpMap, w / 0.45, d / 0.45), bumpScale: 0.0025, roughnessMap: cloneTex(roughMap, w / 0.9, d / 0.9), roughness: 1, metalness: 0, envMapIntensity: 0.4, side: THREE.DoubleSide })),
    medium: (w, d) => memo(cache, `m${w.toFixed(2)}_${d.toFixed(2)}`, () => new THREE.MeshStandardMaterial({ map: cloneTex(mediumMap, w / 0.9, d / 0.9), bumpMap: cloneTex(bumpMap, w / 0.45, d / 0.45), bumpScale: 0.002, roughness: 1, metalness: 0, envMapIntensity: 0.35, side: THREE.DoubleSide })),
    flute: (len) => memo(cache, `f${len.toFixed(2)}`, () => new THREE.MeshStandardMaterial({ map: cloneTex(fluteMap, Math.max(1, len / 0.035), 1), roughness: 0.96, envMapIntensity: 0.3, side: THREE.DoubleSide })),
    // machine finishes
    white: new THREE.MeshStandardMaterial({ color: 0xe9e7e1, roughness: 0.42, metalness: 0.08, roughnessMap: paintRough, envMapIntensity: 0.8 }),
    ivory: new THREE.MeshStandardMaterial({ color: 0xe6e2d6, roughness: 0.45, metalness: 0.08, roughnessMap: paintRough, envMapIntensity: 0.8 }),
    lightGrey: new THREE.MeshStandardMaterial({ color: 0xb9bbbd, roughness: 0.5, metalness: 0.1, roughnessMap: paintRough, envMapIntensity: 0.7 }),
    grey: new THREE.MeshStandardMaterial({ color: 0x7d7f82, roughness: 0.55, metalness: 0.15, envMapIntensity: 0.7 }),
    anthracite: new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.6, metalness: 0.2, envMapIntensity: 0.6 }),
    burgundy: new THREE.MeshStandardMaterial({ color: 0x5e1420, roughness: 0.38, metalness: 0.15, roughnessMap: paintRough, envMapIntensity: 0.9 }),
    green: new THREE.MeshStandardMaterial({ color: 0x2f7a4a, roughness: 0.45, metalness: 0.1, envMapIntensity: 0.8 }),
    bluePipe: new THREE.MeshStandardMaterial({ color: 0x1f4fa8, roughness: 0.5, metalness: 0.2, envMapIntensity: 0.7 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xe2b322, roughness: 0.55, metalness: 0.05 }),
    lindeRed: new THREE.MeshPhysicalMaterial({ color: 0xc1121f, roughness: 0.35, metalness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.0 }),
    cabPaint: new THREE.MeshPhysicalMaterial({ color: 0xe9e6df, roughness: 0.3, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.2 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9a9da2, metalness: 0.95, roughness: 0.35, roughnessMap: brushedRough, envMapIntensity: 1.2 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.85, roughness: 0.45, envMapIntensity: 0.9 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe8e8ea, metalness: 1, roughness: 0.1, envMapIntensity: 1.6 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0x8c8f93, metalness: 0.4, roughness: 0.55, envMapIntensity: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x171718, roughness: 0.92, metalness: 0 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.92, bumpMap: tex(treadC, { srgb: false, repeat: [24, 1] }), bumpScale: 0.01 }),
    belt: new THREE.MeshStandardMaterial({ map: tex(beltC, { repeat: [40, 1] }), roughness: 0.85, metalness: 0.05 }),
    hazard: new THREE.MeshStandardMaterial({ map: tex(hazardC, { repeat: [8, 1] }), roughness: 0.6 }),
    grating: new THREE.MeshStandardMaterial({ map: tex(gratingC, { repeat: [8, 8] }), roughness: 0.6, metalness: 0.5, envMapIntensity: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0f1a24, metalness: 0.9, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.5 }),
    guardGlass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.09, roughness: 0.02, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.5, depthWrite: false }),
    film: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    curtain: new THREE.MeshStandardMaterial({ map: tex(curtainC, { wrap: THREE.ClampToEdgeWrapping }), bumpMap: tex(curtainBump, { srgb: false, repeat: [60, 1] }), bumpScale: 0.004, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.7 }),
    strapPP: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.4, metalness: 0.05 }),
    strapPET: new THREE.MeshStandardMaterial({ color: 0x1f7a3a, roughness: 0.25, metalness: 0.1, envMapIntensity: 1.0 }),
    cornerBoard: new THREE.MeshStandardMaterial({ map: cloneTex(kraftMap, 1, 4), roughness: 1, color: 0xa08060 }),
    glue: new THREE.MeshPhysicalMaterial({ color: 0xf3ecd8, roughness: 0.2, transmission: 0.3, thickness: 0.01, transparent: true, opacity: 0.9 }),
    ink: new THREE.MeshStandardMaterial({ color: 0xb4140c, roughness: 0.25, metalness: 0.05 }),
    plate: new THREE.MeshPhysicalMaterial({ color: 0xd98b34, roughness: 0.35, transmission: 0.25, thickness: 0.01, transparent: true, opacity: 0.95 }),
    lampOn: new THREE.MeshStandardMaterial({ color: 0xfff6e6, emissive: 0xfff1d8, emissiveIntensity: 3.5, roughness: 0.4 }),
    ledRed: new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff1a0a, emissiveIntensity: 2.2, roughness: 0.3 }),
    ledGreen: new THREE.MeshStandardMaterial({ color: 0x3bff6a, emissive: 0x1aff50, emissiveIntensity: 2.0, roughness: 0.3 }),
    ledAmber: new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff9a1a, emissiveIntensity: 1.6, roughness: 0.3 }),
    floor: new THREE.MeshStandardMaterial({ map: tex(floorC, { repeat: [28, 28], aniso: 16 }), roughnessMap: tex(floorR, { srgb: false, repeat: [28, 28] }), roughness: 1, metalness: 0.05, envMapIntensity: 0.55 }),
    wood: (w, d) => memo(cache, `w${w.toFixed(2)}_${d.toFixed(2)}`, () => new THREE.MeshStandardMaterial({ map: cloneTex(woodMap, w / 1.2, d / 1.2), roughness: 0.9, envMapIntensity: 0.3 })),
    lineYellow: new THREE.MeshStandardMaterial({ color: 0xd9b52a, roughness: 0.85, transparent: true, opacity: 0.75 }),
  };
  return M;
}

function memo(cache, key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }
