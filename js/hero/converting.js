// Flexo folder gluer (casemaker) line, BOBST livery: prefeeder -> lead-edge feeder -> 4 flexo units ->
// slotter-creaser -> folder (rails + belts, glue head) -> counter-ejector -> strapper -> gantry palletiser.
// The hero blank travels through it: printed on its underside, scored, slotted, folded 180° twice, bundled.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { box, flatBox, cyl, roller, drawCanvas, tex, cloneTex, mulberry32, decal, bolts } from './util.js';
import { buildPallet, buildBundle } from './logistics.js';

export const BOX = { L: 0.4, W: 0.3, H: 0.3, T: 0.004, TAB: 0.035, SLOT: 0.007 };
export const LINE_Y = 1.2;      // board line height
// the converting line starts 4 m further down the hall than the corrugator's stacker, leaving room for the forklift transfer
export const X = { hoist: 45.9, feedStack: 47.0, feeder: 48.85, units: [50.4, 52.4, 54.4, 56.4], creaser: 58.5, slotter: 59.25, folder0: 60.4, glue: 65.2, folderEnd: 69.4, ejector: 71.2, strapper: 74.2, palletiser: 78.6, wrapper: 83.0 };

function printLayers(logo) {
  // two ink layers: red (unit 1) and black (unit 2), as separate transparent decals; plus a composite for bundles
  const W = 1024, H = 768;
  const red = drawCanvas(W, H, (ctx, w, h) => { const lw = 560, lh = lw * (logo.height / logo.width); ctx.drawImage(logo, (w - lw) / 2, 150, lw, lh); });
  // keep only the red part of the logo in the red layer; grey part goes to the black layer
  const rc = red.getContext('2d'); const id = rc.getImageData(0, 0, W, H); const d = id.data;
  const blk = drawCanvas(W, H, () => {}); const bc = blk.getContext('2d'); const bid = bc.getImageData(0, 0, W, H); const bd = bid.data;
  for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3]; if (a > 10 && r - g < 60) { bd[i] = 35; bd[i + 1] = 30; bd[i + 2] = 28; bd[i + 3] = a; d[i + 3] = 0; } }
  rc.putImageData(id, 0, 0); bc.putImageData(bid, 0, 0);
  bc.fillStyle = '#231f1d'; bc.strokeStyle = '#231f1d'; bc.lineWidth = 6; bc.textAlign = 'center';
  bc.font = '500 30px "JetBrains Mono", monospace'; bc.fillText('proteggiamo le vostre idee', W / 2, 150 + 560 * (logo.height / logo.width) + 54);
  const y = 600; for (let k = 0; k < 2; k++) { const px = 180 + k * 60; bc.beginPath(); bc.moveTo(px, y + 70); bc.lineTo(px, y); bc.stroke(); bc.beginPath(); bc.moveTo(px - 22, y + 24); bc.lineTo(px, y); bc.lineTo(px + 22, y + 24); bc.stroke(); }
  bc.beginPath(); bc.moveTo(140, y + 86); bc.lineTo(280, y + 86); bc.stroke();
  bc.textAlign = 'left'; bc.font = '700 24px "Space Grotesk", sans-serif'; bc.fillText('FRAGILE', 360, y + 42); bc.font = '500 20px "JetBrains Mono", monospace'; bc.fillText('ISO 9001:2015 · FSC® CoC · FEFCO 0201', 360, y + 78);
  let bx = 700; const r = mulberry32(9); for (let i = 0; i < 46; i++) { const bw = 2 + Math.round(r() * 5); if (i % 2 === 0) bc.fillRect(bx, y, bw, 70); bx += bw + 2; }
  return { red, blk };
}

export function buildConverting(scene, M, logo) {
  const g = new THREE.Group(); scene.add(g);
  const { L, W, H, T, TAB, SLOT } = BOX;
  const spin = [];
  const webs = [];
  const Y = LINE_Y;
  const SW = TAB + 2 * L + 2 * W;              // blank width across the machine (1.435)
  const Z0 = -SW / 2;                          // tab edge
  const zTab = Z0, zP1 = Z0 + TAB, zP2 = zP1 + L, zP3 = zP2 + W, zP4 = zP3 + L, zEnd = zP4 + W;

  // ---- prefeeder: pallet hoist + feed table + lead-edge feeder ---------------------
  // the forklift sets the pallet of sheets on the hoist platform; the hoist raises it to table height and the pile is pushed onto the table
  // the hoist mast stands on the drive side (-z); the forklift drives straight in from the operator aisle (+z)
  const hoist = new THREE.Group(); hoist.position.set(X.hoist, 0, 0); g.add(hoist);
  for (const s of [1, -1]) { box(0.2, 2.6, 0.2, M.lightGrey, s * 0.55, 1.3, -1.2, hoist); box(0.5, 0.06, 0.3, M.anthracite, s * 0.55, 0.03, -1.2, hoist); }
  box(1.4, 0.12, 0.2, M.burgundy, 0, 2.66, -1.2, hoist);
  const hoistPlatform = new THREE.Group(); hoist.add(hoistPlatform);
  flatBox(1.3, 0.05, 1.9, M.grey, 0, 0.025, 0, hoistPlatform); for (const s of [1, -1]) box(0.08, 0.5, 0.1, M.darkSteel, s * 0.55, 0.25, -1.05, hoistPlatform);   // carriage arms on the mast
  box(1.2, 0.3, 3.4, M.anthracite, X.feedStack + 0.2, 0.15, 0, g);
  box(1.2, 0.9, 3.4, M.lightGrey, X.feedStack + 0.2, 0.75, 0, g);                            // feed-table base
  box(1.2, 0.1, 3.0, M.lightGrey, X.feedStack + 0.2, Y - 0.05, 0, g);                        // feed table (top at 1.2)
  // pile of blanks (appears when the hoisted pallet reaches table height); the hero blank is its bottom sheet
  const feedStack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, SW), [M.flute(SW), M.flute(SW), M.kraft(0.6, SW), M.kraft(0.6, SW), M.flute(0.6), M.flute(0.6)]); feedStack.position.set(X.feedStack + 0.2, Y + T + 0.4, 0); feedStack.castShadow = feedStack.receiveShadow = true; feedStack.visible = false; g.add(feedStack);
  // transfer unit: 1000 x 1200 pallet with two strip stacks (long side across the machine), carried by the forklift
  const transfer = new THREE.Group(); transfer.visible = false; g.add(transfer);
  { const p = buildPallet(M); p.scale.set(1.0 / 1.2, 1, 1.5); transfer.add(p);
    // in the group's own frame the sheets lie long along x (as on the stacker); the forklift's 90° turn puts them across the machine
    for (const dz of [-0.3, 0.3]) { const st = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.8, 0.6 - 0.006), [M.flute(0.6), M.flute(0.6), M.kraft(SW, 0.6), M.kraft(SW, 0.6), M.flute(SW), M.flute(SW)]); st.position.set(0, 0.144 + 0.4, dz); st.castShadow = st.receiveShadow = true; transfer.add(st); transfer.userData[dz > 0 ? 'pileB' : 'pileA'] = st; } }
  box(1.2, 0.12, 3.2, M.burgundy, X.feedStack + 0.2, 2.9, 0, g); for (const s of [1, -1]) box(0.12, 1.7, 0.12, M.lightGrey, X.feedStack - 0.35, 2.05, s * 1.5, g);
  const vacHead = box(0.5, 0.25, 1.8, M.lightGrey, X.feedStack + 0.5, 2.26, 0, g); for (let i = 0; i < 6; i++) cyl(0.03, 0.09, M.rubber, 'y', 10, g, X.feedStack + 0.5, 2.09, -0.75 + i * 0.3);   // suction cups just above the pile top (2.004)
  // lead-edge feeder: 1.0 m module between the loader (ends 44.2) and print unit 1 (starts 45.5)
  box(1.0, 0.3, 3.4, M.anthracite, X.feeder, 0.15, 0, g); box(1.0, 0.8, 3.4, M.lightGrey, X.feeder, 0.7, 0, g); box(1.0, 0.08, 3.2, M.burgundy, X.feeder, Y - 0.06, 0, g);
  for (const z of [-0.5, 0.5]) { const b = flatBox(0.9, 0.02, 0.18, M.belt, X.feeder, Y - 0.01, z, g); b.material = M.belt.clone(); b.material.map = cloneTex(M.belt.map, 5, 1); webs.push(b.material); }
  box(0.08, 0.5, 3.0, M.anthracite, X.feeder - 0.42, Y + 0.3, 0, g);                       // gate / back-stop
  box(1.0, 0.3, 3.2, M.burgundy, X.feeder, Y + 0.75, 0, g);

  // ---- flexo print units ----------------------------------------------------------
  const unitParts = [];
  const numberPlate = (n) => tex(drawCanvas(256, 256, (ctx, w, h) => { ctx.fillStyle = '#f2efe9'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#5e1420'; ctx.font = '700 170px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(n), w / 2, 190); }), { wrap: THREE.ClampToEdgeWrapping });
  const inkColours = [M.ink, new THREE.MeshStandardMaterial({ color: 0x1b1816, roughness: 0.3 }), null, null];
  const warnTex = tex(drawCanvas(256, 256, (ctx, w, h) => { ctx.fillStyle = '#e2b322'; ctx.beginPath(); ctx.moveTo(w / 2, 14); ctx.lineTo(w - 14, h - 14); ctx.lineTo(14, h - 14); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 10; ctx.stroke(); ctx.fillStyle = '#111'; ctx.font = '700 120px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', w / 2, h - 50); }), { wrap: THREE.ClampToEdgeWrapping });
  const mainPlate = tex(drawCanvas(768, 256, (ctx, w, h) => { ctx.fillStyle = '#e9e7e1'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#5e1420'; ctx.fillRect(0, 0, w, 70); ctx.fillStyle = '#fff'; ctx.font = '700 44px "Space Grotesk", sans-serif'; ctx.fillText('CASEMAKER FFG 1228', 24, 52); ctx.fillStyle = '#222'; ctx.font = '500 26px "JetBrains Mono", monospace'; ctx.fillText('4 colori flexo · slotter · piegatrice', 24, 120); ctx.fillText('Formato max 1.228 × 2.800 mm', 24, 165); ctx.fillText('24.000 casse/h · CE · EN 1010-2', 24, 210); }), { wrap: THREE.ClampToEdgeWrapping });
  const unitPlate = tex(drawCanvas(768, 256, (ctx, w, h) => { ctx.fillStyle = '#e9e7e1'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#999'; ctx.lineWidth = 6; ctx.strokeRect(8, 8, w - 16, h - 16); ctx.fillStyle = '#222'; ctx.font = '700 40px "Space Grotesk", sans-serif'; ctx.fillText('GRUPPO STAMPA FLEXO', 24, 70); ctx.font = '500 26px "JetBrains Mono", monospace'; ctx.fillText('Anilox ceramico 250 l/in · racla a camera', 24, 130); ctx.fillText('Inchiostri ad acqua · pH 8,5–9,2', 24, 175); ctx.fillText('Non aprire con macchina in moto', 24, 220); }), { wrap: THREE.ClampToEdgeWrapping });
  X.units.forEach((ux, i) => {
    const u = new THREE.Group(); u.position.set(ux, 0, 0); g.add(u);
    box(1.9, 0.3, 3.5, M.anthracite, 0, 0.15, 0, u);
    box(1.9, 1.0, 0.1, M.lightGrey, 0, 0.8, -1.7, u); box(0.1, 1.0, 3.5, M.lightGrey, -0.9, 0.8, 0, u); box(0.1, 1.0, 3.5, M.lightGrey, 0.9, 0.8, 0, u);   // lower cladding (open operator side)
    box(1.7, 0.9, 0.02, M.guardGlass, 0, 0.78, 1.72, u); box(1.9, 0.06, 0.06, M.hazard, 0, 0.32, 1.72, u);
    box(1.9, 1.6, 0.1, M.burgundy, 0, 2.1, -1.7, u); box(0.1, 1.6, 3.5, M.burgundy, -0.9, 2.1, 0, u); box(0.1, 1.6, 3.5, M.burgundy, 0.9, 2.1, 0, u);
    const hood = new THREE.Mesh(new RoundedBoxGeometry(1.9, 0.35, 3.5, 3, 0.08), M.white); hood.position.set(0, 3.115, 0); hood.castShadow = true; u.add(hood);
    box(1.9, 0.08, 3.5, M.burgundy, 0, 2.9, 0, u);
    // operator-side guard: burgundy frame with a glazed door, number plate, red HMI
    box(0.08, 1.6, 0.08, M.burgundy, -0.9, 2.1, 1.72, u); box(0.08, 1.6, 0.08, M.burgundy, 0.9, 2.1, 1.72, u); box(1.9, 0.08, 0.08, M.burgundy, 0, 1.34, 1.72, u);
    box(1.7, 1.45, 0.02, M.guardGlass, 0, 2.1, 1.72, u);
    const np = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({ map: numberPlate(i + 1), roughness: 0.5 })); np.position.set(-0.6, 3.115, 1.755); u.add(np);
    box(0.28, 0.2, 0.05, M.ink, 0.55, 1.1, 1.755, u); for (let k = 0; k < 4; k++) flatBox(0.03, 0.03, 0.01, k === 1 ? M.ledGreen : M.ledAmber, 0.46 + k * 0.06, 1.14, 1.785, u);
    // internals: impression cylinder above the board (touches its top), plate cylinder below (plate surface touches its
    // underside), anilox in contact with the plate, chambered doctor blade against the anilox, ink bucket
    const imp = roller(0.115, 2.9, M.chrome, 'z', u, 0, Y + 0.115 + T, 0, 48); spin.push({ g: imp, r: 0.115, dir: 1 });
    const plateCyl = roller(0.204, 2.9, M.darkSteel, 'z', u, 0, Y - 0.21 - T, 0, 56); spin.push({ g: plateCyl, r: 0.21, dir: -1 });
    const anilox = roller(0.125, 2.9, M.ceramic, 'z', u, 0.30, Y - 0.21 - T - 0.15, 0, 40); spin.push({ g: anilox, r: 0.125, dir: 1 });
    box(0.18, 0.12, 2.8, M.darkSteel, 0.515, Y - 0.21 - T - 0.15, 0, u);                                // chamber doctor blade
    if (inkColours[i]) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 1.6, 48, 1, true, 0, Math.PI * 1.1), M.plate); plate.rotation.x = Math.PI / 2; plateCyl.add(plate);
      const film = new THREE.Mesh(new THREE.CylinderGeometry(0.1265, 0.1265, 2.7, 40, 1, true), inkColours[i]); film.rotation.x = Math.PI / 2; anilox.add(film);
      box(0.35, 0.3, 0.35, M.white, 0.7, 0.45, 1.5, u); cyl(0.02, 0.9, M.rubber, 'y', 8, u, 0.6, 0.6, 1.5);   // ink bucket + hose
    }
    box(1.5, 1.0, 0.08, M.grey, 0, Y - 0.15, -1.5, u);                                                    // drive-side frame
    for (const [x, y, r] of [[0, Y + 0.115 + T, 0.115], [0, Y - 0.21 - T, 0.21], [0.36, Y - 0.21 - T - 0.16, 0.125]]) cyl(r * 0.5, 0.1, M.darkSteel, 'z', 20, u, x, y, 1.5); // operator-side bearings
    decal(u, warnTex, 0.2, 0.2, 0.75, 0.5, 1.785); decal(u, i === 0 ? mainPlate : unitPlate, 0.42, 0.14, -0.45, 1.12, 1.785);
    bolts(u, M.darkSteel, [-0.8, -0.4, 0, 0.4, 0.8].flatMap((x) => [[x, 1.37, 1.77], [x, 2.87, 1.77]]), 0.01, 'z');
    unitParts.push({ imp, plateCyl, anilox });
  });

  // ---- slotter-creaser ------------------------------------------------------------
  const SCX = X.creaser + 0.4;   // slotter-creaser frame centre
  const sc = new THREE.Group(); sc.position.set(SCX, 0, 0); g.add(sc);
  box(2.0, 0.3, 3.5, M.anthracite, 0, 0.15, 0, sc); box(2.0, 1.0, 0.1, M.lightGrey, 0, 0.8, -1.7, sc); box(0.1, 1.0, 3.5, M.lightGrey, -0.95, 0.8, 0, sc); box(0.1, 1.0, 3.5, M.lightGrey, 0.95, 0.8, 0, sc); box(1.8, 0.9, 0.02, M.guardGlass, 0, 0.78, 1.72, sc);
  box(2.0, 1.6, 0.1, M.burgundy, 0, 2.1, -1.7, sc); box(0.1, 1.6, 3.5, M.burgundy, -0.95, 2.1, 0, sc); box(0.1, 1.6, 3.5, M.burgundy, 0.95, 2.1, 0, sc); box(2.0, 0.08, 3.5, M.burgundy, 0, 2.9, 0, sc);
  const hood2 = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.35, 3.5, 3, 0.08), M.white); hood2.position.set(0, 3.05, 0); sc.add(hood2);
  box(1.8, 1.45, 0.02, M.guardGlass, 0, 2.1, 1.72, sc);
  const creases = [zP1, zP2, zP3, zP4];
  // shafts 185 mm above/below the board line: male creasing rings touch the board top, female rings its underside;
  // slotter knives (male above, two female rings below, offset by the knife width) overlap the board like rotary shears
  const upperC = roller(0.05, 3.0, M.steel, 'z', sc, X.creaser - SCX, Y + 0.185, 0, 16), lowerC = roller(0.05, 3.0, M.steel, 'z', sc, X.creaser - SCX, Y - 0.185, 0, 16);
  for (const z of creases) { cyl(0.183, 0.02, M.steel, 'z', 32, upperC, 0, 0, z); cyl(0.183, 0.03, M.darkSteel, 'z', 32, lowerC, 0, 0, z); }
  const upperS = roller(0.05, 3.0, M.steel, 'z', sc, X.slotter - SCX, Y + 0.185, 0, 16), lowerS = roller(0.05, 3.0, M.steel, 'z', sc, X.slotter - SCX, Y - 0.185, 0, 16);
  for (const z of creases) { cyl(0.19, SLOT, M.chrome, 'z', 32, upperS, 0, 0, z); cyl(0.19, 0.004, M.chrome, 'z', 32, lowerS, 0, 0, z - SLOT / 2 - 0.002); cyl(0.19, 0.004, M.chrome, 'z', 32, lowerS, 0, 0, z + SLOT / 2 + 0.002); }
  cyl(0.19, 0.02, M.chrome, 'z', 32, upperS, 0, 0, zTab + TAB / 2); cyl(0.19, 0.02, M.chrome, 'z', 32, upperS, 0, 0, zEnd + 0.01);  // tab knife + slitter
  spin.push({ g: upperC, r: 0.185, dir: 1 }, { g: lowerC, r: 0.185, dir: -1 }, { g: upperS, r: 0.185, dir: 1 }, { g: lowerS, r: 0.185, dir: -1 });
  box(0.9, 0.5, 2.6, M.anthracite, X.slotter - SCX + 0.2, 0.55, 0, sc);                 // scrap chute
  cyl(0.12, 1.2, M.lightGrey, 'y', 12, sc, 0.9, 3.5, -1.2);                               // extraction duct

  // ---- folder: table, belts, folding rails, glue head, compression ----------------
  const FL = X.folderEnd - X.folder0;
  box(FL, 0.3, 3.4, M.anthracite, X.folder0 + FL / 2, 0.15, 0, g);
  box(FL, 0.9, 3.0, M.lightGrey, X.folder0 + FL / 2, 0.75, 0, g);
  for (const z of [zP2 + 0.02, zP4 - 0.02]) { const b = box(FL, 0.02, 0.1, M.belt, X.folder0 + FL / 2, Y - 0.012, z, g); b.material = M.belt.clone(); b.material.map = cloneTex(M.belt.map, FL * 3, 1); webs.push(b.material); }
  flatBox(FL * 0.3, 0.05, 0.25, M.belt, X.folderEnd - FL * 0.15, Y + 2.1 * T + 0.004 + 0.025, 0.06, g);    // compression belt resting on the closed joint
  // folding rails hang from overhead beams on droppers, so nothing crosses the board path
  for (const s of [1, -1]) box(FL - 1.0, 0.08, 0.08, M.darkSteel, X.folder0 + FL / 2, Y + 0.82, s * 1.15, g);
  const rail = (pts, side) => { const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))); const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.016, 10, false), M.chrome); m.castShadow = true; g.add(m); for (const [x, y, z] of pts) { cyl(0.012, Y + 0.82 - y, M.darkSteel, 'y', 8, g, x, (Y + 0.82 + y) / 2, z); cyl(0.012, 1.15 - Math.abs(z), M.darkSteel, 'z', 8, g, x, Y + 0.82, side * (1.15 + Math.abs(z)) / 2); } };
  // side 1 (tab side, folds first): rail rises from flat, passes vertical at ~3.4 m, lays the panel over the top
  rail([[X.folder0 + 0.2, Y + 0.05, zP1 - 0.1], [X.folder0 + 1.6, Y + 0.25, zP1 + 0.05], [X.folder0 + 3.0, Y + 0.45, zP2 - 0.18], [X.folder0 + 4.2, Y + 0.38, zP2 + 0.1], [X.folder0 + 5.0, Y + 0.08, zP2 + 0.33]], -1);
  rail([[X.folder0 + 4.8, Y + 0.05, zP4 + 0.42], [X.folder0 + 6.2, Y + 0.25, zP4 + 0.25], [X.folder0 + 7.4, Y + 0.33, zP4 - 0.05], [X.folder0 + 8.3, Y + 0.12, zP4 - 0.25]], 1);
  const glueHead = box(0.16, 0.3, 0.12, M.lightGrey, X.glue, Y + 0.32, zP2 + L - TAB / 2, g); cyl(0.012, 0.08, M.steel, 'y', 8, g, X.glue, Y + 0.14, zP2 + L - TAB / 2); box(0.14, 0.14, 0.3, M.lightGrey, X.glue, Y + 0.9, zP2 + L - 0.3, g); cyl(0.03, 0.8, M.darkSteel, 'y', 8, g, X.glue, Y + 0.6, zP2 + L - 0.3);
  for (let x = X.folder0 + 0.5; x < X.folderEnd; x += 1.5) box(0.08, 0.6, 0.08, M.darkSteel, x, Y + 0.25, -1.55, g);
  box(FL, 0.06, 0.08, M.darkSteel, X.folder0 + FL / 2, Y + 0.55, -1.55, g);
  box(FL, 0.06, 0.06, M.hazard, X.folder0 + FL / 2, Y - 0.02, 1.52, g);

  // ---- counter-ejector, roller conveyor, strapper ---------------------------------
  const ce = new THREE.Group(); ce.position.set(X.ejector, 0, 0); g.add(ce);
  box(2.4, 0.3, 3.5, M.anthracite, 0, 0.15, 0, ce); box(2.4, 2.4, 0.1, M.lightGrey, 0, 1.5, -1.7, ce); box(0.1, 2.4, 3.5, M.lightGrey, -1.15, 1.5, 0, ce);
  box(2.4, 0.12, 3.5, M.burgundy, 0, 2.75, 0, ce); box(0.12, 2.4, 3.5, M.burgundy, 1.2, 1.5, 0, ce);
  box(2.0, 0.6, 0.02, M.guardGlass, 0, 2.3, 1.72, ce);
  box(2.2, 0.05, 1.0, M.lightGrey, 0, 0.6, 0, ce);                                        // hopper ledge
  const spanker = box(0.5, 0.4, 0.06, M.rubber, 0.8, Y + 0.2, 0.5, ce);
  const convY = 0.63;
  for (let x = X.ejector + 1.3; x < X.palletiser - 1.2; x += 0.14) { const r = roller(0.035, 1.1, M.steel, 'z', g, x, convY - 0.035, 0, 12); spin.push({ g: r, r: 0.035, dir: -1 }); }
  for (const s of [1, -1]) box(X.palletiser - X.ejector - 2.5, 0.12, 0.05, M.lightGrey, (X.ejector + 1.3 + X.palletiser - 1.2) / 2, convY - 0.08, s * 0.6, g);
  for (let x = X.ejector + 1.6; x < X.palletiser - 1.2; x += 1.6) for (const s of [1, -1]) box(0.06, convY - 0.12, 0.06, M.lightGrey, x, (convY - 0.12) / 2, s * 0.55, g);
  // strapper arch
  box(0.5, 0.08, 1.6, M.lightGrey, X.strapper, 1.65, 0, g); for (const s of [1, -1]) box(0.5, 1.6, 0.12, M.lightGrey, X.strapper, 0.85, s * 0.78, g);
  box(0.5, 0.5, 0.5, M.anthracite, X.strapper, 0.25, 1.05, g); box(0.3, 0.3, 0.04, M.lightGrey, X.strapper, 1.3, 0.85, g); cyl(0.09, 0.08, M.strapPP, 'z', 20, g, X.strapper, 1.0, 1.3);

  // ---- gantry palletiser + pallet load, corner boards, PET straps ------------------
  const pz = X.palletiser;
  for (const s of [1, -1]) for (const x of [pz - 1.6, pz + 1.6]) box(0.16, 3.2, 0.16, M.lightGrey, x, 1.6, s * 1.6, g);
  for (const s of [1, -1]) box(3.5, 0.16, 0.16, M.lightGrey, pz, 3.2, s * 1.6, g);
  // the carriage rides on top of the two beams (beam top at 3.28); the gripper hangs below it on a telescopic mast
  const gantryX = new THREE.Group(); gantryX.position.set(pz - 1.0, 3.4, 0); g.add(gantryX);
  box(0.3, 0.2, 3.7, M.burgundy, 0, 0, 0, gantryX); for (const s of [1, -1]) for (const dx of [-0.1, 0.1]) cyl(0.05, 0.08, M.darkSteel, 'z', 12, gantryX, dx, -0.1, s * 1.6);
  const gripper = new THREE.Group(); gripper.position.set(0, -0.6, 0); gantryX.add(gripper);
  box(0.12, 1.3, 0.12, M.lightGrey, 0, 0.55, 0, gripper); box(0.8, 0.12, 0.7, M.anthracite, 0, -0.1, 0, gripper);
  for (const s of [1, -1]) box(0.04, 0.3, 0.7, M.darkSteel, s * 0.36, -0.3, 0, gripper);
  const GRIP_PLATE_BOTTOM = 3.4 - 0.6 - 0.16;   // world y of the gripper plate underside when gripY = 0
  const pallet = buildPallet(M); pallet.position.set(pz + 0.6, 0, 0); g.add(pallet);
  const load = new THREE.Group(); load.position.set(0, 0.144, 0); pallet.add(load);
  const printedTop = new THREE.MeshStandardMaterial({ map: tex(drawCanvas(1024, 878, (ctx, w, h) => { ctx.drawImage(M.maps.kraftMap.image, 0, 0, w, h); const layers = printLayers(logo); ctx.drawImage(layers.red, 0, 0, w * (L / (L + W)), h); ctx.drawImage(layers.blk, 0, 0, w * (L / (L + W)), h); }), { wrap: THREE.ClampToEdgeWrapping }), bumpMap: M.maps.bumpMap, bumpScale: 0.002, roughness: 1, envMapIntensity: 0.4 });
  const bundleProto = buildBundle(M, { L, W, H, caliper: T, printed: printedTop });
  const { bw, bd, bh } = bundleProto.userData;
  const bundles = []; const LAYERS = 9;
  for (let k = 0; k < LAYERS; k++) for (let i = 0; i < 2; i++) {
    const b = bundleProto.clone(); b.rotation.y = Math.PI / 2; b.position.set(-0.3 + i * 0.6, k * bh, (k % 2 ? 0.02 : -0.02)); load.add(b); bundles.push(b);
  }
  const stackH = LAYERS * bh;
  const corners = new THREE.Group(); load.add(corners);
  for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) { box(0.05, stackH, 0.005, M.cornerBoard, x + (x > 0 ? -0.025 : 0.025), stackH / 2, z + (z > 0 ? 0.0025 : -0.0025), corners); box(0.005, stackH, 0.05, M.cornerBoard, x + (x > 0 ? 0.0025 : -0.0025), stackH / 2, z + (z > 0 ? -0.025 : 0.025), corners); }
  const straps = new THREE.Group(); load.add(straps);
  const strapLoop = (axis, off) => { const w = 0.015, th = 0.003; if (axis === 'x') { box(1.2 + 0.02, th, w, M.strapPET, 0, stackH + th / 2, off, straps); box(1.2 + 0.02, th, w, M.strapPET, 0, -0.144 - th / 2, off, straps); box(th, stackH + 0.144, w, M.strapPET, 0.61, (stackH - 0.144) / 2, off, straps); box(th, stackH + 0.144, w, M.strapPET, -0.61, (stackH - 0.144) / 2, off, straps); } else { box(w, th, 0.8 + 0.02, M.strapPET, off, stackH + th / 2, 0, straps); box(w, th, 0.82, M.strapPET, off, -0.144 - th / 2, 0, straps); box(w, stackH + 0.144, th, M.strapPET, off, (stackH - 0.144) / 2, 0.41, straps); box(w, stackH + 0.144, th, M.strapPET, off, (stackH - 0.144) / 2, -0.41, straps); } };
  strapLoop('x', -0.25); strapLoop('x', 0.25); strapLoop('z', -0.35); strapLoop('z', 0.35);
  const wrapGeo = new RoundedBoxGeometry(1.26, stackH + 0.16, 0.86, 2, 0.03); wrapGeo.translate(0, (stackH + 0.16) / 2 - 0.16, 0);
  const film = new THREE.Mesh(wrapGeo, M.film); film.scale.y = 0.001; film.visible = false; load.add(film);
  // bundle on the conveyor that becomes the next layer (the hero's bundle)
  const heroBundle = bundleProto.clone(); heroBundle.position.set(X.ejector + 1.0, convY, 0); heroBundle.scale.y = 0.001; g.add(heroBundle);
  for (const s of [-0.28, 0.28]) { /* strap meshes exist in the prototype; hidden until strapped */ }
  heroBundle.userData.straps = heroBundle.children.filter((c) => c.material === M.strapPP); heroBundle.userData.straps.forEach((s) => (s.visible = false));

  // ---- the hero blank ---------------------------------------------------------------
  const hero = new THREE.Group(); hero.position.set(X.feedStack + 0.2, Y + T / 2, 0); hero.visible = false; g.add(hero);
  const slab = (lx, lz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(lx, T, lz), [M.flute(lz), M.flute(lz), M.kraft(lx, lz), M.kraft(lx, lz), M.flute(lx), M.flute(lx)]); m.castShadow = m.receiveShadow = true; return m; };
  const clipAt = (xw, keepBeyond) => new THREE.Plane(new THREE.Vector3(keepBeyond ? 1 : -1, 0, 0), keepBeyond ? -xw : xw);
  // panel strips: body (H long) + two flaps (W/2) separated by slot fillers between neighbours
  const F = W / 2;
  const stripParts = (z0, w, parent, withFlaps = true) => {
    const body = slab(H, w); body.position.set(0, 0, z0 + w / 2); parent.add(body);
    if (withFlaps) for (const s of [1, -1]) { const f = slab(F, w - SLOT); f.position.set(s * (H / 2 + F / 2), 0, z0 + w / 2); parent.add(f); }
    return body;
  };
  const F1 = new THREE.Group(); F1.position.set(0, 0, zP2); hero.add(F1);          // hinge at the P1|P2 crease
  const F4 = new THREE.Group(); F4.position.set(0, 0, zP4); hero.add(F4);          // hinge at the P3|P4 crease
  const p1 = stripParts(-L, L, F1); const tab = stripParts(-L - TAB, TAB, F1, false);
  const p2 = stripParts(zP2, W, hero); const p3 = stripParts(zP3, L, hero); const p4 = stripParts(0, W, F4);
  // slot fillers (board that the slotter knives remove) + tab-end trims
  const slotMat = M.kraft(F, SLOT).clone(); const trimMat = M.kraft(F, TAB).clone();
  const slotClip = clipAt(X.slotter, false); slotMat.clippingPlanes = [slotClip]; trimMat.clippingPlanes = [slotClip];
  const fillers = [];
  for (const z of [zP2, zP3, zP4]) for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(F, T, SLOT), slotMat); f.position.set(s * (H / 2 + F / 2), 0, z); hero.add(f); fillers.push(f); }
  for (const s of [1, -1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(F, T, SLOT), slotMat); f.position.set(s * (H / 2 + F / 2), 0, -L); F1.add(f); fillers.push(f); const t = new THREE.Mesh(new THREE.BoxGeometry(F, T, TAB), trimMat); t.position.set(s * (H / 2 + F / 2), 0, -L - TAB / 2); F1.add(t); fillers.push(t); }
  // corrugator scores (flap creases, across the sheet) and casemaker scores (panel creases, along the sheet)
  const groove = new THREE.MeshStandardMaterial({ color: 0x5a3f27, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
  const grooveC = groove.clone(); grooveC.clippingPlanes = [clipAt(X.creaser, true)];
  for (const s of [1, -1]) { const gr = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0008, SW), groove); gr.position.set(s * H / 2, T / 2, 0); hero.add(gr); }
  for (const [z, parent, zz] of [[zP1, F1, -L], [zP2, hero, zP2], [zP3, hero, zP3], [zP4, F4, 0]]) { const gr = new THREE.Mesh(new THREE.BoxGeometry(H, 0.0008, 0.004), grooveC); gr.position.set(0, T / 2, zz); parent.add(gr); }
  // print decals on the UNDERSIDE of the L panels (board runs print-side down); two ink layers, two units
  const layers = printLayers(logo);
  const decalGeo = new THREE.PlaneGeometry(H, L); decalGeo.rotateX(Math.PI / 2); decalGeo.rotateY(Math.PI / 2);   // faces -Y, long side along Z
  const mkDecal = (canvas, unitX, parent, zc) => { const m = new THREE.Mesh(decalGeo, new THREE.MeshStandardMaterial({ map: tex(canvas, { wrap: THREE.ClampToEdgeWrapping }), transparent: true, roughness: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, clippingPlanes: [clipAt(unitX, true)] })); m.position.set(0, -T / 2 - 0.0005, zc); parent.add(m); return m; };
  mkDecal(layers.red, X.units[0], F1, -L / 2); mkDecal(layers.blk, X.units[1], F1, -L / 2);
  mkDecal(layers.red, X.units[0], hero, zP3 + L / 2); mkDecal(layers.blk, X.units[1], hero, zP3 + L / 2);
  // glue beads on the tab (appear at the glue head, after the first fold has turned the tab face up)
  const beads = new THREE.Group(); F1.add(beads);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.004, 0.03, 4, 8), M.glue); b.rotation.z = Math.PI / 2; b.position.set(-H / 2 + 0.04 + i * 0.055, -T / 2 - 0.004, -L - TAB / 2); beads.add(b); }
  beads.visible = false;
  // streaming sheets through the print units and slotter (the line is running)
  const stream = [];
  for (let i = 0; i < 7; i++) { const s = slab(H + 2 * F, SW); s.position.y = Y + T / 2; g.add(s); stream.push(s); }

  const state = { convDist: 0, lineOn: 1, heroX: X.feedStack + 0.2, heroOn: 0, pileOn: 0, pileX: X.hoist + 0.3, hoistY: 0, transferOn: 0, transferOnHoist: 0, pileBOn: 1, foldA: 0, foldB: 0, beadsOn: 0, bundleFill: 0, strapped: 0, gripX: 0, gripY: 0, gripZ: 0, carrying: 0, layerVisible: LAYERS, wrapH: 0, tableRot: 0, carriageY: 0.5, bundleX: X.ejector + 1.0, palletX: pz + 0.6, palletY: 0, cornersOn: 1, strapsOn: 1 };
  // the casemaker runs on its own distance counter (state.convDist), advanced by the same tweens that move the hero blank,
  // so the sheet stream, cylinders and belts always move exactly as fast as the blank we follow
  function update(dist) {
    const cd = state.convDist;
    for (const s of spin) s.g.rotation.z = (s.dir * cd) / s.r;
    for (const m of webs) if (m.map) m.map.offset.x = -cd / 0.3 % 1;
    const span = X.folder0 - X.feeder - 0.6, pitch = span / stream.length;
    for (let i = 0; i < stream.length; i++) { const u = (((cd + i * pitch) % span) + span) % span; stream[i].position.x = X.feeder + 0.4 + u; stream[i].visible = state.lineOn > 0.5 && Math.abs(stream[i].position.x - state.heroX) > 0.9; }
    hero.position.x = state.heroX; hero.visible = state.heroOn > 0.5;
    feedStack.visible = state.pileOn > 0.5; feedStack.position.x = state.pileX;
    hoistPlatform.position.y = state.hoistY;
    transfer.visible = state.transferOn > 0.5; transfer.userData.pileB.visible = state.pileBOn > 0.5;
    if (state.transferOnHoist > 0.5) { transfer.position.set(X.hoist, state.hoistY + 0.05, 0); transfer.rotation.set(0, Math.PI / 2, 0); }
    F1.rotation.x = state.foldA * Math.PI; F1.position.y = Math.sin(state.foldA * Math.PI) * 0.0 + state.foldA * T * 1.05;
    F4.rotation.x = -state.foldB * Math.PI; F4.position.y = state.foldB * T * 2.1;
    beads.visible = state.beadsOn > 0.5;
    heroBundle.scale.y = Math.max(0.001, state.bundleFill);
    heroBundle.userData.straps.forEach((s) => (s.visible = state.strapped > 0.5));
    gantryX.position.x = pz - 1.0 + state.gripX; gripper.position.set(0, -0.6 - state.gripY, state.gripZ);
    if (state.carrying > 0.5) { heroBundle.position.set(gantryX.position.x, GRIP_PLATE_BOTTOM - state.gripY - bh, state.gripZ); heroBundle.rotation.y = Math.PI / 2; }
    else { heroBundle.position.set(state.bundleX, convY, 0); heroBundle.rotation.y = 0; }
    for (let i = 0; i < bundles.length; i++) bundles[i].visible = i < state.layerVisible * 2;
    corners.visible = state.cornersOn > 0.5; straps.visible = state.strapsOn > 0.5;
    film.visible = state.wrapH > 0.002; film.scale.y = Math.max(0.001, state.wrapH);
    pallet.position.set(state.palletX, state.palletY, 0); pallet.rotation.set(0, state.tableRot, 0);   // fully re-posed every frame so reverse scrolling is exact
  }
  update(0);
  return { group: g, update, state, refs: { hero, F1, F4, pallet, load, film, heroBundle, bundles, feedStack, transfer, hoistPlatform, LAYERS, stackH, bw, bd, bh, unitParts, convY, GRIP_PLATE_BOTTOM } };
}
