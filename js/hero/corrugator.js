// Corrugator ("ondulatore"), BP Agnati Vantage style: mill-roll stands, preheaters, single facer with fluted
// corrugating rolls + starch glue roll + pressure roll, bridge with festoons, glue machine, hot-plate double
// facer, slitter-scorer, rotary cut-off knife, downstacker. Line axis = +X, web width 2.5 m, metres.
import * as THREE from 'three';
import { box, flatBox, cyl, roller, ribbon, thickRibbon, drawCanvas, tex, cloneTex, decal, bolts } from './util.js';
import { buildPallet } from './logistics.js';

export const WEB_W = 2.5;
const FLUTE_FREQ = Math.PI * 2 * 128;   // C flute: 128 flutes per metre
const FLUTE_AMP = 0.0018;              // half of the 3.6 mm flute height
export const SHEET_LEN = 1.435;        // one 0201 blank per sheet (L=0.4, W=0.3, tab 0.035)
export const STRIP_W = 0.6;            // H + W = 0.3 + 0.3

export function buildCorrugator(scene, M) {
  const g = new THREE.Group(); scene.add(g);
  const spin = [];           // { g, r, dir, axis }
  const webs = [];           // materials to scroll
  const fluted = new THREE.MeshStandardMaterial({ color: 0x9fa3a8, metalness: 0.9, roughness: 0.4, bumpMap: tex(drawCanvas(256, 8, (ctx) => { for (let x = 0; x < 256; x++) { const v = 0.5 + 0.5 * Math.sin(x / 256 * Math.PI * 2 * 16); const c = 60 + 170 * v; ctx.fillStyle = `rgb(${c},${c},${c})`; ctx.fillRect(x, 0, 1, 8); } }), { srgb: false, repeat: [12, 1] }), bumpScale: 0.004, envMapIntensity: 1.1 });
  const webMat = (base, width) => { const m = base.clone(); m.map = cloneTex(base.map, 1 / 0.9, width / 0.9); if (base.bumpMap) m.bumpMap = cloneTex(base.bumpMap, 1 / 0.45, width / 0.45); if (base.roughnessMap) m.roughnessMap = cloneTex(base.roughnessMap, 1 / 0.9, width / 0.9); webs.push(m); return m; };
  const kraftWeb = () => webMat(M.kraft(0.9, WEB_W), WEB_W);
  const mediumWeb = () => webMat(M.medium(0.9, WEB_W), WEB_W);

  // ---- reels & mill-roll stands --------------------------------------------------
  const reels = [];
  const reelEnd = new THREE.MeshStandardMaterial({ map: tex(drawCanvas(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#d2b38b'; ctx.fillRect(0, 0, w, h);
    for (let r = 505; r > 32; r -= 1.6) { ctx.strokeStyle = `rgba(90,60,30,${0.06 + Math.random() * 0.2})`; ctx.lineWidth = 0.6 + Math.random(); ctx.beginPath(); ctx.arc(w / 2 + (Math.random() - 0.5) * 1.2, h / 2 + (Math.random() - 0.5) * 1.2, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#5a4634'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 32, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1e1a18'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 26, 0, Math.PI * 2); ctx.fill();
  }), { wrap: THREE.ClampToEdgeWrapping }), roughness: 0.95, envMapIntensity: 0.3 });
  const reelSide = (base) => { const m = base.clone(); m.map = cloneTex(base.map, 4.4, 2.8); m.bumpMap = cloneTex(base.bumpMap, 9, 6); m.side = THREE.FrontSide; return m; };
  const makeReel = (r, len, side) => {
    const rg = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 96), [side, reelEnd, reelEnd]); m.rotation.x = Math.PI / 2; m.castShadow = m.receiveShadow = true; rg.add(m);
    const core = cyl(0.04, len + 0.02, M.anthracite, 'z', 16, rg);
    rg.userData = { mesh: m, r0: r }; return rg;
  };
  const stand = (x, y, side, { standby = false } = {}) => {
    const s = new THREE.Group(); s.position.set(x, 0, 0); g.add(s);
    for (const zz of [-1.6, 1.6]) {
      box(0.55, 1.6, 0.55, M.anthracite, 0.9, 0.8, zz, s);                                   // column
      box(0.14, 0.14, 0.14, M.yellow, 0.9, 1.68, zz, s);
      const arm = box(1.5, 0.22, 0.26, M.lightGrey, 0.15, y, zz, s);                          // cantilever arm to the reel centre
      cyl(0.1, 0.22, M.steel, 'z', 16, s, 0, y, zz - Math.sign(zz) * 0.24, 0.05);             // cone chuck (touches the reel end at |z| = 1.25)
      if (standby) box(1.3, 0.2, 0.26, M.lightGrey, 1.6, y + 0.5, zz, s).rotation.z = -0.5;      // raised rear arms
    }
    box(2.4, 0.12, 3.6, M.anthracite, 0.9, 0.06, 0, s);                                          // rail base
    const reel = makeReel(0.625, 2.5, side); reel.position.set(0, y, 0); s.add(reel); reels.push(reel);
    return s;
  };
  const linerSide = reelSide(M.kraft(0.9, 2.5)), mediumSide = reelSide(M.medium(0.9, 2.5));
  stand(-6.5, 0.9, linerSide, { standby: true });
  stand(-3.2, 0.9, mediumSide);
  stand(13.8, 0.9, linerSide);
  // spare reels stored on end near the wet end (clamp-truck dents omitted)
  for (const [x, z, r] of [[-8.6, -4.2, 0.6], [-7.2, -4.4, 0.55], [-5.6, -4.6, 0.62]]) { const sp = makeReel(r, 2.3, linerSide); sp.rotation.x = Math.PI / 2; sp.position.set(x, 1.15, z); g.add(sp); }

  // ---- preheater drums (chrome, steam heated) --------------------------------------
  const drum = (x, y, r, len = 2.6) => { const d = roller(r, len, M.chrome, 'z', g, x, y, 0, 64); spin.push({ g: d, r, dir: -1 }); for (const s of [1, -1]) { box(0.5, 2 * r + 0.5, 0.08, M.lightGrey, x, y, s * (len / 2 + 0.06), g); } cyl(0.06, 0.25, M.steel, 'z', 12, g, x, y, len / 2 + 0.2); return d; };
  drum(-1.4, 0.9, 0.45);                 // liner preheater Ø900
  drum(-1.0, 2.7, 0.25, 2.6);            // medium preconditioner Ø500
  for (const y of [0.55, 1.2, 1.85]) drum(15.3, y, 0.3, 2.6); // triple-stack preheater for the bottom liner
  for (const [x, y] of [[-4.0, 1.45], [-2.4, 2.35], [14.6, 1.55]]) { const r = roller(0.06, 2.7, M.steel, 'z', g, x, y, 0, 16); spin.push({ g: r, r: 0.06, dir: -1 }); }

  // ---- single facer ---------------------------------------------------------------
  const sf = new THREE.Group(); sf.position.set(0, 0, 0); g.add(sf);
  box(3.6, 0.3, 3.6, M.anthracite, 1.8, 0.15, 0, sf);                                           // plinth
  box(3.6, 0.12, 3.6, M.ivory, 1.8, 3.3, 0, sf);                                                 // roof
  box(0.12, 3.0, 3.6, M.ivory, 0.06, 1.8, 0, sf); box(0.12, 3.0, 3.6, M.ivory, 3.54, 1.8, 0, sf);  // end walls
  box(3.6, 3.0, 0.1, M.ivory, 1.8, 1.8, -1.75, sf);                                              // back wall
  for (const s of [1, -1]) box(0.09, 2.2, 3.6, M.ivory, 1.8 + s * 1.74, 2.2, 0, sf).visible = false;
  // open front: two hinged doors swung outward
  for (const [hx, dir] of [[0.12, 1], [3.48, -1]]) { const d = new THREE.Group(); d.position.set(hx, 1.8, 1.78); sf.add(d); box(1.6, 2.7, 0.06, M.ivory, dir * 0.8, 0, 0, d); box(0.5, 0.35, 0.07, M.guardGlass, dir * 0.8, 0.6, 0.01, d); d.rotation.y = -dir * 3.08; }
  // label plate
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.22), new THREE.MeshStandardMaterial({ map: tex(drawCanvas(1024, 160, (ctx, w, h) => { ctx.fillStyle = '#e6e2d6'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#2b2d30'; ctx.font = '700 86px "Space Grotesk", sans-serif'; ctx.fillText('SINGLE FACER', 30, 112); ctx.fillStyle = '#c9221a'; ctx.fillRect(760, 40, 200, 80); }), { wrap: THREE.ClampToEdgeWrapping }), roughness: 0.5 })); plate.position.set(1.8, 3.05, 1.81); sf.add(plate);
  const warnTex = tex(drawCanvas(256, 256, (ctx, w, h) => { ctx.fillStyle = '#e2b322'; ctx.beginPath(); ctx.moveTo(w / 2, 14); ctx.lineTo(w - 14, h - 14); ctx.lineTo(14, h - 14); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 10; ctx.stroke(); ctx.fillStyle = '#111'; ctx.font = '700 120px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', w / 2, h - 50); }), { wrap: THREE.ClampToEdgeWrapping });
  const plateTex = tex(drawCanvas(512, 256, (ctx, w, h) => { ctx.fillStyle = '#d9d9d6'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#777'; ctx.lineWidth = 4; ctx.strokeRect(6, 6, w - 12, h - 12); ctx.fillStyle = '#222'; ctx.font = '700 40px "Space Grotesk", sans-serif'; ctx.fillText('SINGLE FACER SF-25', 28, 70); ctx.font = '500 26px "JetBrains Mono", monospace'; ctx.fillText('Larghezza 2.500 mm · Onda C', 28, 125); ctx.fillText('Max 350 m/min · 2019', 28, 170); ctx.fillText('CE  ·  EN 1010-1', 28, 215); }), { wrap: THREE.ClampToEdgeWrapping });
  for (const [x, y] of [[0.5, 0.55], [3.1, 0.55]]) decal(sf, warnTex, 0.24, 0.24, x, y, 1.812);
  decal(sf, plateTex, 0.5, 0.25, 2.6, 1.0, 1.812);
  bolts(sf, M.darkSteel, [0.4, 1.0, 1.6, 2.2, 2.8, 3.2].flatMap((x) => [[x, 0.33, 1.81], [x, 3.22, 1.81]]), 0.012, 'z');
  // internals (visible through the open front)
  box(2.6, 2.3, 0.1, M.grey, 1.4, 1.65, -1.36, sf);                                              // drive-side frame
  for (const [x, y, r] of [[1.4, 1.96, 0.23], [1.4, 1.5, 0.23], [0.98, 1.5, 0.14], [1.4, 1.04, 0.225]]) cyl(r * 0.55, 0.12, M.darkSteel, 'z', 20, sf, x, y, 1.37); // operator-side bearing housings
  const C1 = roller(0.222, 2.62, fluted, 'z', sf, 1.4, 1.96, 0, 64); spin.push({ g: C1, r: 0.23, dir: 1 });
  const C2 = roller(0.222, 2.62, fluted, 'z', sf, 1.4, 1.5, 0, 64); spin.push({ g: C2, r: 0.23, dir: -1 });
  // visible flute teeth: 96 ridges around each corrugating roll (C flute pitch ≈ 7.8 mm → scaled teeth for legibility)
  const toothGeo = new THREE.CylinderGeometry(0.0075, 0.0075, 2.6, 6);
  for (const roll of [C1, C2]) for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2; const tth = new THREE.Mesh(toothGeo, M.steel); tth.rotation.x = Math.PI / 2; tth.position.set(Math.cos(a) * 0.2235, Math.sin(a) * 0.2235, 0); roll.add(tth); }
  const glueRoll = roller(0.14, 2.6, M.steel, 'z', sf, 1.028, 1.5, 0, 40); spin.push({ g: glueRoll, r: 0.14, dir: 1 }); // touches the flute tips on the lower roll
  box(0.5, 0.22, 2.6, M.anthracite, 1.0, 1.2, 0, sf); const gluePan = flatBox(0.46, 0.02, 2.56, M.glue, 1.0, 1.32, 0, sf);  // starch pan
  const PR = roller(0.225, 2.62, M.steel, 'z', sf, 1.4, 1.04, 0, 56); spin.push({ g: PR, r: 0.225, dir: 1 });
  for (const [x, y] of [[0.5, 2.6], [2.6, 2.6], [2.9, 0.9]]) { const r = roller(0.05, 2.62, M.steel, 'z', sf, x, y, 0, 12); spin.push({ g: r, r: 0.05, dir: 1 }); }
  // steam pipes (blue) + insulated risers, routed beside the bridge
  for (const [z, y] of [[-2.05, 3.95], [-2.3, 3.95]]) cyl(0.06, 34, M.bluePipe, 'x', 12, g, 15, y, z);
  for (const x of [-0.3, 4.0, 16.5, 28.5]) cyl(0.07, 3.9, M.lightGrey, 'y', 12, g, x, 1.95, -2.05);
  // bridge: grating deck 3.55 m up, white handrails, support columns, stair at the far end
  const BX0 = 3.0, BX1 = 15.2;
  flatBox(BX1 - BX0, 0.06, 3.3, M.grating, (BX0 + BX1) / 2, 3.55, 0, g);
  for (const s of [1, -1]) { box(BX1 - BX0, 0.16, 0.08, M.ivory, (BX0 + BX1) / 2, 3.5, s * 1.65, g); for (let x = BX0 + 0.1; x <= BX1; x += 1.5) cyl(0.02, 1.1, M.ivory, 'y', 8, g, x, 4.13, s * 1.62); for (const y of [4.68, 4.2]) cyl(0.018, BX1 - BX0, M.ivory, 'x', 8, g, (BX0 + BX1) / 2, y, s * 1.62); flatBox(BX1 - BX0, 0.12, 0.02, M.ivory, (BX0 + BX1) / 2, 3.64, s * 1.62, g); }
  for (const x of [BX0 + 0.3, 7.5, 11.0, 13.1]) for (const s of [1, -1]) box(0.16, 3.52, 0.16, M.ivory, x, 1.76, s * 1.55, g);   // columns clear of the third reel stand (x 13.8–16.1)
  for (let i = 0; i < 12; i++) { flatBox(0.28, 0.04, 1.0, M.grating, BX1 + 0.2 + i * 0.26, 3.5 - i * 0.29, 2.4, g); } // stair treads
  for (const s of [1, -1]) { const st = box(3.6, 0.1, 0.08, M.ivory, BX1 + 1.65, 1.95, 2.4 + s * 0.52, g); st.rotation.z = -0.84; const hr = cyl(0.018, 3.6, M.ivory, 'x', 8, g, BX1 + 1.65, 2.95, 2.4 + s * 0.52); hr.rotation.z = -0.84; }

  // ---- webs (paper paths) ---------------------------------------------------------
  const arc = (cx, cy, r, a0, a1, n = 8) => { const p = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; };
  // top liner: reel -> guide -> Ø900 preheater (wrap over the top) -> pressure-roll nip under the lower corrugating roll
  const liner1 = ribbon([[-6.5, 1.53], [-4.0, 1.51], ...arc(-1.4, 0.9, 0.455, 150, -10), [-0.9, 0.86], [0.4, 1.1], [1.4, 1.272], [1.9, 1.272]], WEB_W, kraftWeb(), { segments: 160 });
  // medium: reel -> guide -> preconditioner -> corrugating nip (flat part), then fluted around the lower roll
  const medium1 = ribbon([[-3.2, 1.53], [-2.4, 2.41], ...arc(-1.0, 2.7, 0.255, 180, 0), [0.3, 2.2], [1.1, 1.76], [1.4, 1.732]], WEB_W, mediumWeb(), { segments: 160 });
  const medium2 = ribbon([[1.4, 1.735], ...arc(1.4, 1.5, 0.234, 90, 270, 24), [1.9, 1.266]], WEB_W, mediumWeb(), { segments: 1400, amp: FLUTE_AMP, freq: FLUTE_FREQ });
  // single-face web (liner + flutes up): exits to the inclined conveyor and up to the bridge, festoons, down to the glue machine
  const sfPath = [[1.9, 1.272], [3.6, 1.3], [4.6, 2.1], [6.0, 3.62], [6.6, 3.66]];
  for (let k = 0; k < 7; k++) sfPath.push([6.9 + k * 0.95, 4.25], [7.35 + k * 0.95, 3.68]);
  sfPath.push([13.8, 3.66], [15.0, 3.62], [15.9, 2.6], [16.6, 1.4], [16.95, 1.16], [17.0, 1.144]);
  const sfWeb = thickRibbon(sfPath, WEB_W, 0.0036, kraftWeb(), M.flute(2.5), { segments: 420 });
  // bottom liner: third reel -> triple-stack preheater (zig-zag) -> double facer entry
  const liner3 = ribbon([[13.8, 1.53], [14.6, 1.61], ...arc(15.3, 1.85, 0.31, 100, -80, 6), ...arc(15.3, 1.2, 0.31, 260, 80, 6).reverse(), ...arc(15.3, 0.55, 0.31, 100, -90, 6), [16.3, 0.9], [17.0, 1.14]], WEB_W, kraftWeb(), { segments: 220 });
  g.add(liner1, medium1, medium2, sfWeb, liner3);

  // ---- glue machine + double facer (hot plates, top belt, ballast rolls) ------------
  // glue machine: open C-frame with side cheeks, a hood above and the glue roll under the single-face web
  box(1.2, 0.3, 3.6, M.anthracite, 16.4, 0.15, 0, g); for (const s of [1, -1]) box(1.2, 2.3, 0.1, M.ivory, 16.4, 1.45, s * 1.4, g);
  box(1.2, 0.4, 3.0, M.ivory, 16.4, 2.6, 0, g); box(1.0, 0.1, 2.8, M.lightGrey, 16.4, 0.9, 0, g);
  const gm = roller(0.16, 2.6, M.steel, 'z', g, 16.4, 0.96, 0, 40); spin.push({ g: gm, r: 0.16, dir: 1 });   // glue roll touching the flute side (web underside at 1.142)
  box(0.5, 0.16, 2.6, M.anthracite, 16.4, 0.74, 0, g); flatBox(0.46, 0.02, 2.56, M.glue, 16.4, 0.83, 0, g);
  const DF0 = 17.2, DFL = 11.6;
  box(DFL, 0.3, 3.4, M.anthracite, DF0 + DFL / 2, 0.15, 0, g);
  box(DFL, 0.55, 2.7, M.darkSteel, DF0 + DFL / 2, 0.85, 0, g);                                   // hot plates
  for (const s of [1, -1]) { box(DFL, 1.15, 0.08, M.ivory, DF0 + DFL / 2, 0.73, s * 1.42, g); box(DFL, 0.6, 0.08, M.ivory, DF0 + DFL / 2, 1.95, s * 1.42, g); }
  box(DFL, 0.1, 3.0, M.ivory, DF0 + DFL / 2, 2.3, 0, g);
  const topBelt = flatBox(DFL, 0.03, 2.56, M.belt, DF0 + DFL / 2, 1.157, 0, g); topBelt.material = M.belt.clone(); topBelt.material.map = cloneTex(M.belt.map, DFL * 4, 1); webs.push(topBelt.material); // belt bottom on the board top (1.142)
  for (let x = DF0 + 0.3; x < DF0 + DFL; x += 0.5) { const r = roller(0.07, 2.56, M.steel, 'z', g, x, 1.242, 0, 20); spin.push({ g: r, r: 0.07, dir: 1 }); }   // ballast rolls resting on the belt
  for (let x = DF0 + 0.6; x < DF0 + DFL; x += 2.0) cyl(0.05, 1.1, M.lightGrey, 'y', 10, g, x, 1.7, -1.5);
  // finished double-faced board web out of the double facer
  const board1 = thickRibbon([[DF0 + DFL, 1.14], [30.0, 1.14]], WEB_W, 0.004, kraftWeb(), M.flute(2.5), { segments: 12 });
  g.add(board1);

  // ---- slitter-scorer ---------------------------------------------------------------
  const SS = 30.4;
  const cFrame = (x, len) => { box(len, 0.3, 3.4, M.anthracite, x, 0.15, 0, g); box(len, 0.12, 3.4, M.ivory, x, 2.2, 0, g); box(len, 2.0, 0.1, M.ivory, x, 1.2, -1.7, g); for (const s of [1, -1]) for (const zz of [-1.65, 1.65]) box(0.14, 1.9, 0.14, M.ivory, x + s * (len / 2 - 0.07), 1.2, zz, g); box(len - 0.3, 0.7, 0.02, M.guardGlass, x, 1.85, 1.7, g); box(len, 0.08, 0.08, M.hazard, x, 0.34, 1.72, g); };
  cFrame(SS, 1.3);
  const upper = roller(0.04, 3.2, M.steel, 'z', g, SS, 1.14 + 0.18, 0, 14), lower = roller(0.04, 3.2, M.steel, 'z', g, SS, 1.14 - 0.18, 0, 14);
  spin.push({ g: upper, r: 0.18, dir: 1 }, { g: lower, r: 0.18, dir: -1 });
  // slitting knives: upper and lower discs overlap the board (rotary shear) and are offset axially by one blade thickness
  for (const z of [-1.2, -0.6, 0, 0.6, 1.2]) { cyl(0.184, 0.004, M.chrome, 'z', 48, upper, 0, 0, z); cyl(0.184, 0.004, M.chrome, 'z', 48, lower, 0, 0, z + 0.0045); }
  // scoring wheels: male ring above just touches the board top (1.142), female ring below just touches the bottom (1.138)
  for (const c of [-0.9, -0.3, 0.3, 0.9]) for (const o of [-0.15, 0.15]) { cyl(0.178, 0.03, M.steel, 'z', 32, upper, 0, 0, c + o); cyl(0.178, 0.05, M.darkSteel, 'z', 32, lower, 0, 0, c + o); }
  // after the slitter: 4 strips of 0.6 m with 2 longitudinal scores each
  const strips = [];
  for (let i = 0; i < 4; i++) { const z = -0.9 + i * 0.6; const s = thickRibbon([[SS + 0.2, 1.14], [32.3, 1.14]], STRIP_W - 0.006, 0.004, kraftWeb(), M.flute(0.6), { segments: 12 }); s.position.z = z; g.add(s); strips.push(s); }

  // ---- rotary cut-off knife + conveyor + downstacker --------------------------------
  const CK = 32.7;
  cFrame(CK, 1.0);
  const k1 = roller(0.15, 2.7, M.darkSteel, 'z', g, CK, 1.14 + 0.165, 0, 32), k2 = roller(0.15, 2.7, M.darkSteel, 'z', g, CK, 1.14 - 0.165, 0, 32);
  flatBox(0.02, 0.022, 2.7, M.chrome, 0, -0.154, 0, k1); flatBox(0.02, 0.022, 2.7, M.chrome, 0, 0.154, 0, k2);   // blades meet at the board mid-plane
  const knives = [k1, k2];
  // sheet conveyor to the stacker
  const conv = box(3.2, 0.06, 2.7, M.belt, CK + 2.1, 1.1, 0, g); conv.material = M.belt.clone(); conv.material.map = cloneTex(M.belt.map, 12, 1); webs.push(conv.material);
  for (const s of [1, -1]) box(3.2, 0.2, 0.06, M.lightGrey, CK + 2.1, 1.05, s * 1.38, g);
  // travelling sheets (4 strips x 5) + growing stacks on pallets on a descending platform
  const sheetGeo = new THREE.BoxGeometry(SHEET_LEN, 0.004, STRIP_W - 0.006);
  const sheets = [];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(sheetGeo, [M.flute(0.6), M.flute(0.6), M.kraft(SHEET_LEN, 0.6), M.kraft(SHEET_LEN, 0.6), M.flute(SHEET_LEN), M.flute(SHEET_LEN)]); m.castShadow = m.receiveShadow = true; m.position.z = -0.9 + i * 0.6; g.add(m); sheets.push({ m, k }); }
  const ST = CK + 4.6;
  const platform = new THREE.Group(); platform.position.set(ST, 0.9, 0); g.add(platform);
  box(2.0, 0.08, 2.8, M.grey, 0, 0, 0, platform);
  // two 1000 x 1200 pallets on the platform, each receiving two strips side by side (strip pitch 0.6 m)
  const stacks = [], stackPallets = [];
  for (let i = 0; i < 2; i++) {
    const p = buildPallet(M); p.scale.set(1.0 / 1.2, 1, 1.5); p.position.set(0, 0.04, -0.6 + i * 1.2); platform.add(p); stackPallets.push(p);
    for (let k = 0; k < 2; k++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(SHEET_LEN, 1, STRIP_W - 0.006), [M.flute(0.6), M.flute(0.6), M.kraft(SHEET_LEN, 0.6), M.kraft(SHEET_LEN, 0.6), M.flute(SHEET_LEN), M.flute(SHEET_LEN)]);
      st.geometry.translate(0, 0.5, 0); st.position.set(0, 0.184, -0.9 + (i * 2 + k) * 0.6); st.castShadow = st.receiveShadow = true; platform.add(st); stacks.push(st);
    }
  }
  for (const s of [1, -1]) { box(0.2, 2.6, 0.2, M.ivory, ST - 1.2, 1.3, s * 1.6, g); box(0.2, 2.6, 0.2, M.ivory, ST + 1.2, 1.3, s * 1.6, g); }
  box(2.8, 0.15, 3.4, M.ivory, ST, 2.65, 0, g);
  // dry-end HMI pulpit
  box(0.6, 1.1, 0.5, M.lightGrey, ST + 2.4, 0.55, 2.2, g); box(0.5, 0.35, 0.03, M.anthracite, ST + 2.4, 1.3, 2.2, g).rotation.x = -0.5;

  // ---- update: everything advances with the metres of web that have run --------------
  const state = { stackBase: 0.62, taken: 0 };   // taken = 1 once the forklift has lifted the near pallet (its two stacks leave the platform)
  function update(dist) {
    for (const s of spin) { const a = (s.dir * dist) / s.r; if (s.g.userData.axis === 'z' || !s.g.userData.axis) s.g.rotation.z = a; else s.g.rotation.y = a; }
    for (const r of reels) { const shrink = Math.max(0.55, 1 - dist * 0.0012); r.userData.mesh.scale.set(shrink, 1, shrink); r.rotation.z = dist / (r.userData.r0 * shrink); }
    for (const m of webs) { if (m.map) m.map.offset.x = -dist / 0.9 % 1; if (m.bumpMap) m.bumpMap.offset.x = -dist / 0.45 % 1; if (m.roughnessMap) m.roughnessMap.offset.x = -dist / 0.9 % 1; }
    for (const k of knives) k.rotation.z = (k === k1 ? -1 : 1) * (dist / SHEET_LEN) * Math.PI * 2;
    const sheetCount = dist / SHEET_LEN;
    for (const { m, k } of sheets) {
      const u = ((sheetCount + k * 0.2) % 1);                      // 0..1 along the conveyor
      const x = CK + 0.6 + u * 3.3; m.position.x = x; m.position.y = 1.134 + (u > 0.75 ? -(u - 0.75) * 0.6 : 0.0); m.visible = u < 0.9;
      m.rotation.z = u > 0.75 ? -(u - 0.75) * 0.3 : 0;
    }
    const h = Math.min(0.8, state.stackBase + sheetCount * 0.004);
    for (const st of stacks) st.scale.y = h;
    platform.position.y = Math.max(0.148, 1.132 - h - 0.184);
    stacks[2].visible = stacks[3].visible = stackPallets[1].visible = state.taken < 0.5;
    state.h = h;
  }
  update(0);
  return { group: g, update, state, refs: { reels, C1, C2, PR, glueRoll, stacks, stackPallets, platform, ST } };
}
