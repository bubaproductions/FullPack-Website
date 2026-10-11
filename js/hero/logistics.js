// EPAL pallet, KD-case bundles, strapping, turntable stretch wrapper, counterbalance forklift, curtainsider truck.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { box, flatBox, cyl, roller, drawCanvas, tex } from './util.js';

// ---- EPAL 1: 1200 x 800 x 144 mm, 11 boards, 9 blocks ------------------------
export function buildPallet(M) {
  const g = new THREE.Group();
  const T = 0.022, L = 1.2, Wd = 0.8;
  const b = (w, h, d, x, y, z) => box(w, h, d, M.wood(w, d), x, y, z, g);
  // top deck: 145 | 100 | 145 | 100 | 145 across the 800 side, boards run the 1200 direction
  const widths = [0.145, 0.1, 0.145, 0.1, 0.145];
  const gap = (Wd - widths.reduce((a, c) => a + c, 0)) / 4;
  let z = -Wd / 2;
  for (const w of widths) { b(L, T, w, 0, 0.144 - T / 2, z + w / 2); z += w + gap; }
  // three transverse stringer boards 800 x 145 x 22 under the deck, nine blocks under them
  for (const x of [-L / 2 + 0.0725, 0, L / 2 - 0.0725]) {
    b(0.145, T, Wd, x, 0.144 - T - T / 2, 0);
    for (const zz of [-Wd / 2 + 0.0725, 0, Wd / 2 - 0.0725]) { const bw = zz === 0 ? 0.145 : 0.1; b(0.145, 0.078, bw, x, T + 0.039, zz); }
  }
  // bottom boards along the 1200 direction: 100 | 145 | 100, chamfered (approximated by the thin box)
  for (const [zz, w] of [[-Wd / 2 + 0.05, 0.1], [0, 0.145], [Wd / 2 - 0.05, 0.1]]) b(L, T, w, 0, T / 2, zz);
  // EPAL oval burn marks on the corner blocks, IPPC mark on the middle block (canvas decals)
  const markTex = tex(drawCanvas(256, 128, (ctx, w, h) => { ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, 100, 44, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#3a2a18'; ctx.font = '700 54px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('EPAL', w / 2, h / 2 + 20); }), { wrap: THREE.ClampToEdgeWrapping });
  const ippcTex = tex(drawCanvas(256, 160, (ctx, w, h) => { ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 5; ctx.strokeRect(10, 10, w - 20, h - 20); ctx.fillStyle = '#3a2a18'; ctx.font = '600 30px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('IT - 06 - 0142', w / 2, 70); ctx.fillText('HT', w / 2, 118); }), { wrap: THREE.ClampToEdgeWrapping });
  const decal = (t, w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); };
  for (const s of [1, -1]) { decal(markTex, 0.1, 0.05, s * (L / 2 - 0.0725), T + 0.039, s > 0 ? Wd / 2 + 0.0005 : -Wd / 2 - 0.0005, s > 0 ? 0 : Math.PI); decal(ippcTex, 0.1, 0.06, 0, T + 0.039, s * (Wd / 2 + 0.0005), s > 0 ? 0 : Math.PI); }
  return g;
}

// ---- bundle of 25 knocked-down cases (two board layers each), two PP straps ----
// footprint: (L+W) x (H+W); thickness = 25 x 2 x board caliper
export function buildBundle(M, { L, W, H, caliper, count = 25, printed }) {
  const g = new THREE.Group();
  const bw = L + W, bd = H + W, bh = count * 2 * caliper;
  const faces = [M.flute(bd), M.flute(bd), printed, printed, M.flute(bw), M.flute(bw)];
  const body = new THREE.Mesh(new RoundedBoxGeometry(bw, bh, bd, 2, 0.004), faces); body.position.y = bh / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  // layered edge: faint lines every case (drawn into a second thin box with a striped bump)
  for (const x of [-bw * 0.28, bw * 0.28]) { // straps across the short side
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.012, bh + 0.004, bd + 0.004), M.strapPP); s.position.set(x, bh / 2, 0); g.add(s);
  }
  g.userData = { bw, bd, bh }; return g;
}

// ---- stretch wrapper (turntable) ---------------------------------------------
export function buildWrapper(M) {
  const g = new THREE.Group();
  // turntable Ø1650 on its own base; the mast stands behind it, the film carriage runs on the mast's front face
  // and the reel sits beside the carriage, clear of the load's swept radius (corner radius 0.72 m)
  box(1.9, 0.08, 0.9, M.anthracite, 0, 0.04, 1.35, g);                                // base plate behind the turntable
  const table = roller(0.825, 0.07, M.grey, 'y', g, 0, 0.075, 0);
  box(0.3, 2.9, 0.4, M.ivory, 0, 1.45, 1.25, g);                                       // mast
  box(0.6, 0.06, 0.5, M.anthracite, 0, 2.92, 1.25, g);
  const carriage = new THREE.Group(); carriage.position.set(0, 0.5, 0.92); g.add(carriage);
  box(0.42, 0.7, 0.24, M.lightGrey, 0, 0, 0, carriage);
  const reel = cyl(0.11, 0.5, new THREE.MeshPhysicalMaterial({ color: 0xf4f6f8, roughness: 0.15, clearcoat: 1, envMapIntensity: 1.3 }), 'y', 24, carriage, 0.36, 0, 0.0); // film reel 500 mm, beside the carriage
  cyl(0.03, 0.56, M.darkSteel, 'y', 12, carriage, 0.22, 0, -0.1);                      // pre-stretch roller
  box(0.3, 0.2, 0.05, M.anthracite, 0.4, 1.6, 1.25, g); flatBox(0.22, 0.13, 0.01, M.ledGreen, 0.4, 1.6, 1.22, g);   // HMI beside the mast, clear of the carriage travel
  g.userData = { table, carriage, reel }; return g;
}

// ---- counterbalance forklift (Linde-style red, 2.5 t) --------------------------
export function buildForklift(M) {
  const g = new THREE.Group();
  const red = M.lindeRed, dark = M.anthracite, steel = M.steel;
  // body: counterweight rear, operator compartment, overhead guard
  const body = box(1.9, 0.75, 1.15, red, -0.3, 0.75, 0, g);
  box(0.7, 0.95, 1.2, red, -0.95, 0.9, 0, g);                                           // counterweight
  box(0.5, 0.2, 1.1, dark, -1.3, 0.55, 0, g);
  box(1.0, 0.08, 1.0, dark, 0.1, 1.14, 0, g);                                           // floor plate
  box(0.5, 0.55, 0.5, dark, -0.55, 1.4, 0, g);                                          // seat base
  box(0.45, 0.6, 0.5, M.rubber, -0.75, 1.75, 0, g);                                     // seat back
  box(0.35, 0.08, 0.35, dark, 0.25, 1.75, 0, g); cyl(0.03, 0.5, dark, 'x', 8, g, 0.0, 1.5, 0); // wheel + column
  for (const z of [-0.5, 0.5]) { box(0.06, 2.1, 0.06, dark, -0.1, 2.2, z, g); box(0.06, 2.1, 0.06, dark, 0.55, 2.2, z, g); }
  box(1.4, 0.05, 1.15, dark, 0.2, 3.25, 0, g); for (let i = 0; i < 5; i++) box(0.04, 0.02, 1.1, dark, -0.4 + i * 0.3, 3.23, 0, g); // overhead guard
  // mast: two outer channels + inner, carriage, forks
  const mast = new THREE.Group(); mast.position.set(0.95, 0, 0); g.add(mast);
  for (const z of [-0.45, 0.45]) { box(0.12, 2.3, 0.1, steel, 0, 1.15, z, mast); box(0.08, 2.1, 0.07, M.darkSteel, 0.1, 1.2, z * 0.85, mast); }
  box(0.1, 0.08, 1.0, steel, 0, 2.28, 0, mast); box(0.1, 0.08, 1.0, steel, 0, 0.25, 0, mast);
  const carriage = new THREE.Group(); carriage.position.set(0.2, 0.2, 0); mast.add(carriage);
  box(0.08, 0.6, 1.15, M.darkSteel, 0, 0.5, 0, carriage); box(0.08, 0.7, 1.15, M.darkSteel, 0, 0.85, 0, carriage);   // fork carriage + backrest grid
  for (let i = 0; i < 6; i++) box(0.03, 0.6, 0.03, M.darkSteel, 0.04, 1.1, -0.5 + i * 0.2, carriage);
  for (const z of [-0.19, 0.19]) { box(0.12, 0.6, 0.1, M.darkSteel, 0.05, 0.3, z, carriage); flatBox(1.2, 0.045, 0.1, M.darkSteel, 0.68, 0.0225, z, carriage); }   // forks spaced for the EPAL block openings
  // wheels: front drive pair (larger), rear steer pair
  const wheels = [];
  for (const [x, r, z] of [[0.55, 0.33, 0.6], [0.55, 0.33, -0.6], [-0.95, 0.26, 0.5], [-0.95, 0.26, -0.5]]) {
    const w = new THREE.Group(); w.position.set(x, r, z); g.add(w);
    const t = cyl(r, 0.24, M.tyre, 'z', 32, w); const rim = cyl(r * 0.55, 0.25, M.lightGrey, 'z', 24, w); const hub = cyl(r * 0.15, 0.27, dark, 'z', 12, w);
    wheels.push({ g: w, r });
  }
  // lights, hydraulics, details
  box(0.1, 0.08, 0.2, M.lampOn, 0.62, 2.0, 0.58, g); box(0.1, 0.08, 0.2, M.lampOn, 0.62, 2.0, -0.58, g);   // work lamps on the overhead-guard front posts
  box(0.06, 0.08, 0.14, M.ledRed, -1.32, 1.3, 0.5, g); box(0.06, 0.08, 0.14, M.ledRed, -1.32, 1.3, -0.5, g);
  box(0.16, 0.16, 0.16, M.ledAmber, -0.5, 3.33, 0, g);                                   // beacon
  cyl(0.05, 1.9, steel, 'y', 10, g, 0.9, 1.1, 0);                                        // lift cylinder
  g.position.y = 0; g.userData = { mast, carriage, wheels }; return g;
}

// ---- 13.6 m curtainsider semi-trailer + cab-over tractor ------------------------
export function buildTruck(M) {
  const g = new THREE.Group();
  const TL = 13.6, TW = 2.48, TH = 2.7, FY = 1.25;          // internal box; deck height 1.25
  const trailer = new THREE.Group(); g.add(trailer);
  box(TL, 0.2, TW + 0.07, M.lightGrey, -TL / 2, FY - 0.1, 0, trailer);                    // deck
  box(TL + 0.1, 0.1, TW + 0.07, M.ivory, -TL / 2, FY + TH + 0.05, 0, trailer);             // roof
  box(0.1, TH, TW + 0.07, M.ivory, -TL + 0.05, FY + TH / 2, 0, trailer);                  // front bulkhead
  for (let i = 0; i <= 5; i++) { const x = -TL + 0.1 + i * ((TL - 0.2) / 5); for (const s of [1, -1]) box(0.08, TH, 0.08, M.lightGrey, x, FY + TH / 2, s * (TW / 2 + 0.03), trailer); } // pillars
  box(0.1, 0.1, TW + 0.1, M.lightGrey, -TL / 2, FY + 0.02, 0, trailer);
  // curtains (PVC, ribbed, branded) — left/right; the loading side curtain slides open
  const curtains = [];
  for (const s of [1, -1]) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(TL, TH + 0.05), M.curtain); c.position.set(-TL / 2, FY + TH / 2, s * (TW / 2 + 0.07)); c.rotation.y = s > 0 ? 0 : Math.PI; c.castShadow = c.receiveShadow = true; trailer.add(c); curtains.push(c);
    for (let i = 0; i < 22; i++) { const b = box(0.04, 0.12, 0.03, M.anthracite, -TL + 0.3 + i * 0.6, FY + 0.2, s * (TW / 2 + 0.09), trailer); } // tension buckles
  }
  // rear doors with lock bars, bumper, under-run bar, lights, plate
  for (const s of [1, -1]) {
    const d = new THREE.Group(); d.position.set(0, FY + TH / 2, s * (TW / 2 - 0.03)); trailer.add(d);
    box(0.05, TH - 0.06, TW / 2 - 0.06, M.lightGrey, 0, 0, -s * (TW / 4 - 0.01), d);
    for (const zz of [0.18, 0.5]) box(0.05, TH - 0.4, 0.04, M.chrome, 0.03, 0, -s * (TW / 4 - 0.01) * (zz * 2.0), d);
  }
  box(0.12, 0.12, TW + 0.1, M.darkSteel, 0.1, FY - 0.55, 0, trailer);
  for (const s of [1, -1]) { box(0.06, 0.2, 0.3, M.ledRed, 0.1, FY - 0.3, s * (TW / 2 - 0.25), trailer); box(0.06, 0.1, 0.2, M.ledAmber, 0.1, FY - 0.15, s * (TW / 2 - 0.25), trailer); }
  box(0.03, 0.12, 0.52, M.white, 0.12, FY - 0.2, 0, trailer);
  // chassis, landing legs, side guards, 3 axles with super-single tyres (Ø1.08)
  box(TL - 1.0, 0.3, 1.0, M.darkSteel, -TL / 2 - 0.2, FY - 0.35, 0, trailer);
  for (const s of [1, -1]) { box(0.1, 0.9, 0.1, M.darkSteel, -TL + 2.6, 0.55, s * 0.5, trailer); box(0.3, 0.05, 0.2, M.darkSteel, -TL + 2.6, 0.12, s * 0.5, trailer); box(5.2, 0.5, 0.04, M.lightGrey, -TL / 2 - 1.2, 0.72, s * (TW / 2 + 0.02), trailer); }
  const wheels = [];
  for (const x of [-2.3, -3.6, -4.9]) for (const s of [1, -1]) wheels.push(wheel(M, trailer, x, 0.54, s * (TW / 2 - 0.22), 0.54, 0.38));
  for (const x of [-2.3, -3.6, -4.9]) { const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.5, 24, 1, true, Math.PI, Math.PI), M.anthracite); mg.material = M.anthracite.clone(); mg.material.side = THREE.DoubleSide; mg.rotation.x = Math.PI / 2; mg.rotation.z = Math.PI / 2; mg.position.set(x, 0.6, TW / 2 - 0.22); trailer.add(mg); }
  // tractor: cab-over 4x2 (white livery, red bumper line), kingpin behind the cab
  const cab = new THREE.Group(); cab.position.set(-TL - 0.9, 0, 0); g.add(cab);
  box(2.2, 0.35, 1.0, M.darkSteel, -1.0, 0.9, 0, cab);                                  // tractor chassis
  box(0.9, 0.08, 1.8, M.darkSteel, -0.3, 1.1, 0, cab);                                    // fifth wheel plate
  const cabBody = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.6, TW, 4, 0.14), M.cabPaint); cabBody.position.set(-1.7, 1.25 + 1.3, 0); cabBody.castShadow = cabBody.receiveShadow = true; cab.add(cabBody);
  const fairing = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.6, TW - 0.2, 3, 0.12), M.cabPaint); fairing.position.set(-1.55, 1.25 + 2.9, 0); cab.add(fairing);
  box(0.08, 1.25, TW - 0.4, M.glass, -2.92, 1.25 + 1.75, 0, cab);                        // windscreen
  for (const s of [1, -1]) box(0.9, 0.85, 0.06, M.glass, -1.5, 1.25 + 1.8, s * (TW / 2 - 0.02), cab);
  box(0.1, 0.3, TW - 0.5, M.anthracite, -2.95, 1.25 + 2.45, 0, cab);                     // sun visor
  box(0.08, 0.8, TW - 0.6, M.anthracite, -2.93, 1.25 + 0.55, 0, cab);                     // grille
  for (let i = 0; i < 5; i++) box(0.1, 0.03, TW - 0.7, M.chrome, -2.94, 1.25 + 0.3 + i * 0.14, 0, cab);
  box(0.35, 0.5, TW + 0.02, M.anthracite, -2.9, 0.8, 0, cab); box(0.36, 0.08, TW + 0.02, M.ink, -2.9, 1.08, 0, cab); // bumper + red line
  for (const s of [1, -1]) {
    box(0.1, 0.25, 0.5, M.lampOn, -3.0, 1.0, s * (TW / 2 - 0.4), cab); box(0.08, 0.08, 0.2, M.ledAmber, -3.0, 1.2, s * (TW / 2 - 0.3), cab);
    box(0.06, 0.06, 0.4, M.anthracite, -2.7, 1.25 + 2.1, s * (TW / 2 + 0.15), cab); box(0.1, 0.55, 0.25, M.anthracite, -2.7, 1.25 + 1.8, s * (TW / 2 + 0.33), cab);
  }
  cyl(0.33, 0.8, M.chrome, 'x', 24, cab, -1.5, 0.7, TW / 2 - 0.36);                       // fuel tank between the axles, outboard of the chassis rail
  cyl(0.09, 0.9, M.chrome, 'y', 16, cab, -0.5, 2.95, -TW / 2 + 0.1);                      // exhaust
  for (const x of [-0.6, -2.4]) for (const s of [1, -1]) wheels.push(wheel(M, cab, x, 0.54, s * (TW / 2 - 0.22), 0.54, 0.34));
  g.userData = { trailer, cab, wheels, curtains, TL, TW, TH, FY }; return g;
}

function wheel(M, parent, x, y, z, r, w) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  cyl(r, w, M.tyre, 'z', 40, g); cyl(r * 0.6, w + 0.01, M.lightGrey, 'z', 28, g); cyl(r * 0.2, w + 0.06, M.darkSteel, 'z', 16, g);
  for (let i = 0; i < 10; i++) { const n = cyl(0.02, w + 0.07, M.darkSteel, 'z', 6, g); n.position.set(Math.cos(i / 10 * Math.PI * 2) * r * 0.38, Math.sin(i / 10 * Math.PI * 2) * r * 0.38, 0); }
  return { g, r };
}
