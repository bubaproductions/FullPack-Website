// FullPack hero — one continuous documentary take down a corrugated plant, synchronised to scroll.
// Scene in metres. Wet end at x≈-8, single facer at 0, bridge 3–15, double facer 17–29, dry end 30–38,
// casemaker 46–75, palletiser 79, wrapper 83, side-loading of a curtainsider at 90, yard and road beyond z=5.7.
// A camera rig follows a focus point with distance / azimuth / elevation, so every move is a dolly or an orbit.
// The corrugator advances with scroll; the casemaker advances exactly as fast as the blank the camera follows.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { buildMaterials } from './hero/materials.js';
import { buildCorrugator } from './hero/corrugator.js';
import { buildConverting, X } from './hero/converting.js';
import { buildWrapper, buildForklift, buildTruck, buildPallet } from './hero/logistics.js';
import { box, flatBox, cyl, loadImage, drawCanvas, tex } from './hero/util.js';

const gsap = window.gsap;
const M_PER_VH = 4.5;   // metres of corrugator web per viewport-height of scroll

export async function createHero(canvas, ui) {
  try { await Promise.all([document.fonts.load('700 20px "Space Grotesk"'), document.fonts.load('500 20px "JetBrains Mono"')]); } catch (e) {}
  const logo = await loadImage('assets/logo.png');
  const logoWhite = await loadImage('assets/logo-white.png');
  const M = buildMaterials(logo);

  const lowTier = innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowTier ? 1.25 : 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08080a);
  scene.fog = new THREE.Fog(0x08080a, 28, 110);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 260);

  // ---- hall ---------------------------------------------------------------------------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(320, 90), M.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(45, 0, 2); floor.receiveShadow = true; scene.add(floor);
  for (const z of [3.4, -3.4]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(120, 0.1), M.lineYellow); l.rotation.x = -Math.PI / 2; l.position.set(45, 0.002, z); scene.add(l); }
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.2), new THREE.MeshStandardMaterial({ color: 0xe6e3dc, roughness: 0.9 })); s.rotation.x = -Math.PI / 2; s.position.set(43.5 + i * 0.8, 0.002, 4.6); scene.add(s); }
  const concrete = new THREE.MeshStandardMaterial({ color: 0x8e8c88, roughness: 0.95 });
  for (let x = -12; x <= 108; x += 12) for (const z of [-9, 12]) { box(0.6, 10, 0.6, concrete, x, 5, z, scene); box(0.64, 1.0, 0.64, M.hazard, x, 0.5, z, scene); }
  // roof: lattice trusses between the column rows (two chords + zigzag web), resting on corbels on the columns
  for (let x = -12; x <= 108; x += 12) {
    box(0.3, 0.14, 20.2, M.darkSteel, x, 10.0, 1.5, scene); box(0.3, 0.14, 20.2, M.darkSteel, x, 9.15, 1.5, scene);
    for (const z of [-8.7, 11.7]) box(0.5, 1.2, 0.3, concrete, x, 9.4, z + (z < 0 ? -0.15 : 0.15), scene);
    for (let k = 0; k < 10; k++) { const z0 = -8.6 + k * 2.0, d = box(0.07, 2.02, 0.07, M.darkSteel, x, 9.575, z0 + 1.0, scene); d.rotation.x = (k % 2 ? -1 : 1) * Math.atan2(2.0, 0.71); }
    for (let k = 0; k <= 10; k++) box(0.07, 0.71, 0.07, M.darkSteel, x, 9.575, -8.6 + k * 2.0, scene);
  }
  for (let x = -6; x <= 102; x += 12) { const sk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 18), new THREE.MeshStandardMaterial({ color: 0x9fb2c6, emissive: 0x6f84a0, emissiveIntensity: 0.25, roughness: 0.6 })); sk.position.set(x, 10.08, 1.5); scene.add(sk); }   // skylight strips
  { const signTexB = tex(drawCanvas(1024, 256, (ctx, w, h) => { ctx.fillStyle = '#1f6f3a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fff'; ctx.font = '700 120px "Space Grotesk", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('AREA CARICO · USCITA', w / 2, 170); }), { wrap: THREE.ClampToEdgeWrapping }); const sg = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshStandardMaterial({ map: signTexB, roughness: 0.6 })); sg.position.set(89, 8.4, 6.7); sg.rotation.y = Math.PI; scene.add(sg); }
  { const roof = new THREE.Mesh(new THREE.BoxGeometry(136, 0.3, 23.5), new THREE.MeshStandardMaterial({ color: 0x55565a, roughness: 0.95 })); roof.position.set(48, 10.25, 1.5); roof.castShadow = false; roof.receiveShadow = false; scene.add(roof); }   // roof deck (does not block the key light: the hall is lit by its luminaires)
  const lampGeo = new THREE.BoxGeometry(1.2, 0.12, 0.3);
  for (let x = -9; x <= 105; x += 6) for (const z of [-4.5, 4.5]) { const lamp = new THREE.Mesh(lampGeo, M.lampOn); lamp.position.set(x, 8.6, z); scene.add(lamp); box(1.3, 0.08, 0.4, M.anthracite, x, 8.7, z, scene); }
  // south facade with a window band and the backlit company sign; the loading bay (x 78–100) is an open door
  const facade = new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.9 });
  box(104, 10, 0.4, facade, 26, 5, 7.0, scene); box(14, 10, 0.4, facade, 107, 5, 7.0, scene);
  box(104, 1.2, 0.1, new THREE.MeshStandardMaterial({ color: 0xffe9c8, emissive: 0xffd9a8, emissiveIntensity: 0.9 }), 26, 6.8, 7.22, scene);
  box(22, 1.2, 0.5, facade, 89, 9.4, 7.0, scene); for (const x of [78, 100]) box(0.6, 10, 0.6, concrete, x, 5, 7.0, scene);
  const signTex = tex(drawCanvas(2048, 512, (ctx, w, h) => { ctx.fillStyle = '#16151a'; ctx.fillRect(0, 0, w, h); const lw = 1500, lh = lw * (logoWhite.height / logoWhite.width); ctx.drawImage(logoWhite, (w - lw) / 2, (h - lh) / 2 - 20, lw, lh); ctx.fillStyle = '#f5a054'; ctx.fillRect(w * 0.12, h - 70, w * 0.76, 10); }), { wrap: THREE.ClampToEdgeWrapping });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.4, roughness: 0.6 })); sign.position.set(62, 8.4, 7.26); scene.add(sign);
  // yard and road
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(320, 40), new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 1 })); asphalt.rotation.x = -Math.PI / 2; asphalt.position.set(30, 0.004, 26); asphalt.receiveShadow = true; scene.add(asphalt);
  for (let x = -110; x <= 110; x += 22) { cyl(0.08, 8, M.darkSteel, 'y', 10, scene, x, 4, 15); box(0.9, 0.15, 0.3, M.lampOn, x - 0.3, 8, 15, scene); const pl = new THREE.PointLight(0xffd9a0, 30, 30, 2); pl.position.set(x - 0.3, 7.6, 15); scene.add(pl); }
  for (let x = -110; x <= 110; x += 4) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.12), new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.9 })); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.006, 14.0); scene.add(d); }
  // props
  for (let x = 0; x <= 96; x += 24) { cyl(0.08, 0.5, M.ink, 'y', 14, scene, x + 0.42, 1.25, -9); cyl(0.05, 0.08, M.anthracite, 'y', 10, scene, x + 0.42, 1.54, -9); box(0.14, 0.14, 0.02, M.ink, x + 0.42, 1.75, -8.7, scene); }
  for (const z of [-1.9, 1.9]) { box(30, 0.08, 0.3, M.grating, 61, 3.55, z, scene); for (let x = 47; x <= 75; x += 4) cyl(0.03, 5.9, M.darkSteel, 'y', 8, scene, x, 6.55, z); }
  for (const k of [0, 1, 2, 3, 4]) { const sp = buildPallet(M); sp.position.set(92.5, k * 0.144, -5.2); scene.add(sp); }
  for (const [x, z] of [[77.5, -5.6], [100, -4.6]]) { box(0.6, 0.9, 0.55, new THREE.MeshStandardMaterial({ color: 0x2e5e2e, roughness: 0.7 }), x, 0.5, z, scene); box(0.62, 0.05, 0.57, M.anthracite, x, 0.97, z, scene); for (const s of [1, -1]) cyl(0.09, 0.05, M.rubber, 'z', 12, scene, x + s * 0.22, 0.09, z - 0.3); }
  { const pj = new THREE.Group(); pj.position.set(84.5, 0, -4.8); pj.rotation.y = 0.6; scene.add(pj); for (const zz of [-0.19, 0.19]) flatBox(1.15, 0.05, 0.16, M.ink, 0.57, 0.08, zz, pj); box(0.3, 0.4, 0.55, M.ink, -0.05, 0.3, 0, pj); const h = cyl(0.015, 1.1, M.darkSteel, 'y', 8, pj, -0.3, 0.75, 0); h.rotation.z = 0.5; cyl(0.09, 0.07, M.rubber, 'z', 14, pj, -0.05, 0.09, 0); }

  // ---- lights -----------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0xdfe6ef, 0x141210, 0.32));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.9); key.castShadow = true;
  key.shadow.mapSize.set(lowTier ? 1024 : 2048, lowTier ? 1024 : 2048); key.shadow.camera.left = -16; key.shadow.camera.right = 16; key.shadow.camera.top = 16; key.shadow.camera.bottom = -16;
  key.shadow.camera.near = 1; key.shadow.camera.far = 80; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.03; key.shadow.radius = 3;
  scene.add(key, key.target);
  for (const [x, z] of [[-4, 2], [12, 2], [26, 2], [40, 2], [56, 2.5], [68, 2.5], [81, 2.5], [90, 9]]) { const p = new THREE.PointLight(0xffe9cf, 55, 34, 2); p.position.set(x, 7.6, z); scene.add(p); }
  const rim = new THREE.PointLight(0xc9221a, 25, 30, 2); rim.position.set(1.4, 5, -7); scene.add(rim);
  for (const [x, y, z] of [[1.4, 2.7, 2.2], [52.5, 1.6, 2.6], [59.0, 1.8, 2.6], [65, 2.2, 2.4]]) { const wl = new THREE.PointLight(0xfff3e0, 9, 8, 2); wl.position.set(x, y, z); scene.add(wl); }

  // ---- machines & vehicles ------------------------------------------------------------
  const corr = buildCorrugator(scene, M);
  const conv = buildConverting(scene, M, logo);
  const wrapper = buildWrapper(M); wrapper.position.set(X.wrapper, 0, 0); wrapper.rotation.y = Math.PI; scene.add(wrapper);
  const forklift = buildForklift(M); scene.add(forklift);
  const TRUCK_Z = 9.2, ROW_Z = TRUCK_Z - 0.62;   // near pallet row: 1.2 m pallets across a 2.48 m deck
  const truck = buildTruck(M); truck.position.set(96, 0, TRUCK_Z); scene.add(truck);
  const nearCurtain = truck.userData.curtains[1];
  nearCurtain.geometry = nearCurtain.geometry.clone(); nearCurtain.geometry.translate(truck.userData.TL / 2, 0, 0); nearCurtain.position.x = 0; nearCurtain.scale.x = 0.12;   // this side is rotated by pi, so +x local runs towards the cab: the curtain is anchored at the rear and slides forward when it shuts
  // wrapped unit loads already on the deck (light-weight stand-ins: one block per bundle layer, film, corner boards).
  // Near row: the eight slots behind the one the hero pallet lands in (x 90.5, 0.9 m pitch); far row: full length.
  const unitLoad = (full) => {
    const g = new THREE.Group(); const H = conv.refs.stackH;
    if (full) g.add(buildPallet(M)); else box(1.2, 0.144, 0.8, M.wood(1.2, 0.8), 0, 0.072, 0, g);
    const layers = full ? 9 : 1, lh = H / layers;
    for (let k = 0; k < layers; k++) flatBox(1.19, lh - 0.004, 0.69, [M.flute(0.69), M.flute(0.69), M.kraft(1.19, 0.69), M.kraft(1.19, 0.69), M.flute(1.19), M.flute(1.19)], 0, 0.144 + k * lh + lh / 2, k % 2 ? 0.02 : -0.02, g);
    if (full) for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) { box(0.05, H, 0.005, M.cornerBoard, x + (x > 0 ? -0.025 : 0.025), 0.144 + H / 2, z + (z > 0 ? 0.0025 : -0.0025), g); box(0.005, H, 0.05, M.cornerBoard, x + (x > 0 ? 0.0025 : -0.0025), 0.144 + H / 2, z + (z > 0 ? -0.025 : 0.025), g); }
    const film = new THREE.Mesh(conv.refs.film.geometry, M.film); film.position.set(0, 0.144, 0); g.add(film);
    return g;
  };
  for (let k = 1; k <= 8; k++) { const p = unitLoad(true); p.position.set(90.5 - 0.9 * k, truck.userData.FY, ROW_Z); p.rotation.y = Math.PI * 1.5; scene.add(p); truck.userData.trailer.attach(p); }
  for (let k = 0; k < 14; k++) { const p = unitLoad(k >= 8); p.position.set(83.3 + 0.9 * k, truck.userData.FY, TRUCK_Z + 0.62); p.rotation.y = Math.PI * 1.5; scene.add(p); truck.userData.trailer.attach(p); }
  for (const [x, z] of [[100.5, -1.5], [101.8, -1.5], [100.5, -3.2], [101.8, -3.2], [100.5, -4.9]]) { const p = unitLoad(true); p.position.set(x, 0, z); scene.add(p); }   // finished goods waiting by the bay
  for (let i = 0; i < 5; i++) { const tm = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.18), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1, transparent: true, opacity: 0.35 })); tm.rotation.x = -Math.PI / 2; tm.position.set(86 + i * 2.1, 0.003, 4.2 + (i % 2) * 0.5); tm.rotation.z = -0.15; scene.add(tm); }   // tyre marks
  // headlights (on for the departure)
  const headlights = [];
  for (const s of [1, -1]) { const sl = new THREE.SpotLight(0xfff0d0, 0, 40, 0.5, 0.6, 1.2); sl.position.set(-truck.userData.TL - 3.9, 1.0, s * 0.85); sl.target.position.set(-truck.userData.TL - 30, 0.2, s * 0.85); truck.add(sl); truck.add(sl.target); headlights.push(sl); }
  // steam
  const steamTex = tex(drawCanvas(128, 128, (ctx, w, h) => { const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }), { wrap: THREE.ClampToEdgeWrapping });
  const steamN = 240, sp = new Float32Array(steamN * 3), sPhase = new Float32Array(steamN);
  for (let i = 0; i < steamN; i++) { const src = i < 90 ? [1.4, 2.2, 0] : i < 150 ? [-1.0, 2.9, 0] : [17.2 + Math.random() * 11.6, 1.4, 0]; sp[i * 3] = src[0] + (Math.random() - 0.5) * 0.8; sp[i * 3 + 1] = src[1]; sp[i * 3 + 2] = src[2] + (Math.random() - 0.5) * 2.4; sPhase[i] = Math.random(); }
  const steamGeo = new THREE.BufferGeometry(); steamGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const steam = new THREE.Points(steamGeo, new THREE.PointsMaterial({ map: steamTex, size: 0.28, transparent: true, opacity: 0.07, depthWrite: false, color: 0xffffff })); scene.add(steam);
  const steamBase = sp.slice();

  // ---- post-processing --------------------------------------------------------------
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  try { if (lowTier) throw new Error('low tier'); gtao = new GTAOPass(scene, camera, 1, 1); gtao.output = GTAOPass.OUTPUT.Default; gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.2, thickness: 1.0, scale: 1.0, samples: 12, distanceFallOff: 1.0, screenSpaceRadius: false }); composer.addPass(gtao); } catch (e) { console.warn('GTAO unavailable', e); }
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.16, 0.5, 0.9); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- timeline ------------------------------------------------------------------------
  const lens = ui.lens; const cum = [0]; for (const l of lens) cum.push(cum[cum.length - 1] + l);
  const total = cum[lens.length] - 1;
  const stg = (i) => ({ a: Math.max(0, cum[i] - 0.45), hold: cum[i], end: cum[i] + lens[i] - 1 });
  const S = conv.state;
  const C = corr.state;
  const fk = { x: 41.2, z: 0.6, ry: Math.PI, lift: 0.29, carry: 0, tilt: 0 };   // forks already at the stacker pallet's pocket height (base ≈ 0.25 m)
  const tr = { x: 96, curtain: 0.12, lights: 0 };
  const state = { fade: 0 };
  let depFollow = Infinity;
  // camera rig: focus point + spherical offset; subject kept right of the text column
  const rig = { fx: -2.5, fy: 1.6, fz: 0, d: 12, az: 1.05, el: 0.22, shift: 0.19 };   // intro: looking down the hall from the +x side
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power1.inOut' } });
  const K = (t, v, dur = 0.7, ease = 'power1.inOut') => tl.to(rig, { ...v, duration: dur, ease }, Math.max(0, t));
  // moves the hero blank and the casemaker's distance counter together (same speed for stream, cylinders, belts)
  let heroAt = X.hoist + 0.3;
  const heroMove = (t, toX, dur, ease = 'none', follow = false) => { const d = toX - heroAt; tl.to(S, { heroX: toX, convDist: `+=${d}`, duration: dur, ease }, t); if (follow) tl.to(rig, { fx: toX, duration: dur, ease }, t); heroAt = toX; };
  const FY = truck.userData.FY;

  // 0 — establishing: the wet end, slow push-in
  K(0, { d: 10.4, el: 0.18, az: 0.95 }, stg(1).a, 'none');
  // 1 — reels and preheaters: dolly along the liner web
  { const a = stg(1).a; K(a - 0.2, { fx: -6.4, fy: 1.0, fz: 0, d: 6.6, az: 0.55, el: 0.14 }, 0.8); K(a + 0.7, { fx: -3.4, fy: 1.35, d: 6.0, az: 0.3 }, 0.9); K(a + 1.6, { fx: -1.4, fy: 1.5, d: 5.0, az: 0.1 }, 0.5); }
  // 2 — single facer: orbit the open front, then climb the incline
  { const a = stg(2).a; K(a - 0.2, { fx: 1.35, fy: 1.55, fz: 0, d: 4.3, az: -0.3, el: 0.12 }, 0.6); K(a + 0.5, { az: 0.35, d: 4.6 }, 1.1); K(a + 1.65, { fx: 4.3, fy: 2.4, d: 6.0, el: 0.2 }, 0.7); }
  // 3 — bridge festoons, glue machine, double facer: travelling shot
  { const a = stg(3).a; K(a - 0.1, { fx: 7.5, fy: 3.9, fz: 0, d: 6.5, az: 0.2, el: 0.25 }, 0.7); K(a + 0.65, { fx: 13.5, fy: 3.7 }, 0.8); K(a + 1.45, { fx: 16.4, fy: 1.5, d: 5.0, el: 0.15 }, 0.6); K(a + 2.05, { fx: 23, fy: 1.2, d: 6.4, az: 0.25, el: 0.12 }, 1.0); }
  // 4 — slitter-scorer (top view), cut-off, shingling, downstacker
  { const a = stg(4).a; K(a + 0.85, { fx: 30.4, fy: 1.25, d: 5.0, az: 0.1, el: 0.42 }, 0.6); K(a + 1.45, { fx: 32.7, fy: 1.2, d: 4.2, az: -0.2, el: 0.25 }, 0.6); K(a + 2.05, { fx: 35.4, fy: 1.1 }, 0.5); K(a + 2.3, { fx: 37.6, fy: 0.9, fz: 0.6, d: 5.5, az: 0.55, el: 0.2 }, 0.45); }
  // 5 — transfer: forklift takes the near pallet off the downstacker, carries it to the hoist, pile goes up and onto the table, feeder pulls the blank
  { const a = stg(5).a;
    tl.to(fk, { x: 39.1, duration: 0.3, ease: 'power1.inOut' }, a + 0.05);
    tl.to(fk, { lift: 0.5, tilt: 0.07, duration: 0.13 }, a + 0.37); tl.set(C, { taken: 1 }, a + 0.38); tl.set(S, { transferOn: 1 }, a + 0.38); tl.set(fk, { carry: 2 }, a + 0.38);
    tl.to(fk, { x: 41.6, duration: 0.22, ease: 'power1.inOut' }, a + 0.53);
    tl.to(fk, { x: X.hoist, z: 4.6, ry: Math.PI / 2, duration: 0.58, ease: 'power1.inOut' }, a + 0.77);
    tl.to(fk, { z: 2.0, duration: 0.23, ease: 'power1.inOut' }, a + 1.37);
    tl.to(fk, { lift: 0.105, tilt: 0, duration: 0.1 }, a + 1.62); tl.set(fk, { carry: 0 }, a + 1.73); tl.set(S, { transferOnHoist: 1 }, a + 1.73);
    tl.to(fk, { z: 4.6, duration: 0.25, ease: 'power1.inOut' }, a + 1.75); tl.to(fk, { lift: 0.2, duration: 0.15 }, a + 2.0);
    tl.to(S, { hoistY: 1.006, duration: 0.35, ease: 'power1.inOut' }, a + 1.8);
    tl.set(S, { pileOn: 1, pileBOn: 0, heroOn: 1 }, a + 2.17); tl.set(S, { pileX: X.hoist + 0.3, heroX: X.hoist + 0.3 }, a + 2.17);
    tl.to(S, { pileX: X.feedStack + 0.2, heroX: X.feedStack + 0.2, duration: 0.2, ease: 'power1.inOut' }, a + 2.18); heroAt = X.feedStack + 0.2;
    heroMove(a + 2.4, X.feeder + 0.2, 0.3, 'power1.in', true);
    // forklift drives off along the operator aisle to wait at the dock
    tl.to(fk, { ry: 0, x: 56, z: 4.8, duration: 0.6, ease: 'power1.inOut' }, a + 3.05); tl.to(fk, { x: 91, z: 3.8, duration: 3.0, ease: 'none' }, a + 3.65);   // waits by the loading bay, out of the palletiser shot
    K(a + 0.65, { fx: 40.5, fy: 1.0, fz: 0.6, d: 7.0, az: 0.6, el: 0.2 }, 0.45); K(a + 0.8, { fx: 44.5, fy: 1.2, fz: 1.5, d: 6.0, az: 0.75 }, 0.6); K(a + 1.45, { fx: X.hoist, fy: 1.2, fz: 1.0, d: 5.5, az: 0.45 }, 0.5); K(a + 1.95, { fx: X.feedStack + 0.4, fy: 1.4, fz: 0, d: 5.0, az: 0.1, el: 0.2 }, 0.5); }
  // 6 — flexo units: low angle through the guards as the blank passes the cylinders
  { const a = stg(6).a; const t0 = stg(5).a + 2.7;
    heroMove(t0, X.units[1] + 1.1, 1.05, 'none', true);                 // through units 1 and 2 (inked)
    heroMove(t0 + 1.05, X.units[3] + 1.5, 0.85, 'none', true);          // past the idle units
    K(t0, { fy: 1.2, fz: 0, d: 5.6, az: 0.28, el: 0.14 }, 0.3); K(t0 + 0.4, { az: -0.12, d: 5.2 }, 0.6); K(t0 + 1.05, { d: 6.2, el: 0.24, az: 0.1 }, 0.8); }
  // 7 — creaser and slotter: slow pass, camera looks down on the shafts then swings round
  { const a = stg(7).a; const t0 = stg(5).a + 2.7 + 1.9;
    heroMove(t0, X.slotter + 0.65, 0.95, 'none', true);
    K(t0, { fy: 1.25, d: 3.8, az: 0.1, el: 0.42 }, 0.4); K(t0 + 0.4, { az: -0.4 }, 0.55); }
  // 8 — folding, gluing, counter-ejector, strapping: rear three-quarter view following the blank
  { const t0 = stg(5).a + 2.7 + 1.9 + 0.95; const a = stg(8).a;
    heroMove(t0, X.folder0 + 0.5, 0.5, 'none', true);
    K(t0, { fy: 1.25, d: 4.8, az: -0.38, el: 0.34 }, 0.6);   // side-on and slightly behind: the rising panel reads as a flap, not an edge
    heroMove(t0 + 0.5, X.glue - 0.8, 0.9, 'none', true); tl.to(S, { foldA: 1, duration: 0.75, ease: 'power1.inOut' }, t0 + 0.55);
    tl.set(S, { beadsOn: 1 }, t0 + 1.45);
    heroMove(t0 + 1.45, X.folderEnd - 0.8, 0.75, 'none', true); tl.to(S, { foldB: 1, duration: 0.6, ease: 'power1.inOut' }, t0 + 1.55);
    K(t0 + 1.4, { az: 0.42, el: 0.3, d: 5.0 }, 0.8);        // swing to the front three-quarter as the second panel folds toward the camera
    heroMove(t0 + 2.2, X.ejector + 0.1, 0.4, 'power1.in', true);
    K(t0 + 2.2, { fx: X.ejector + 0.3, fy: 1.0, d: 5.0, az: 0.4, el: 0.25 }, 0.5);
    tl.to(S, { bundleFill: 1, duration: 0.3, ease: 'power1.out' }, t0 + 2.6); tl.set(S, { heroOn: 0 }, t0 + 2.65);
    tl.to(S, { bundleX: X.strapper, duration: 0.35, ease: 'power1.inOut' }, t0 + 2.95); tl.set(S, { strapped: 1 }, t0 + 3.4);
    K(t0 + 2.95, { fx: X.strapper, fy: 0.9, d: 4.0, az: 0.2, el: 0.3 }, 0.4); }
  // 9 — gantry palletiser, corner boards and straps, stretch wrapper
  { const a = stg(9).a; const pz = X.palletiser;
    tl.set(S, { layerVisible: 7, cornersOn: 0, strapsOn: 0 }, 0);
    tl.to(S, { bundleX: pz - 1.3, duration: 0.3, ease: 'power1.inOut' }, a + 0.45);
    K(a + 0.4, { fx: pz + 0.4, fy: 1.3, fz: 0, d: 6.5, az: 0.5, el: 0.3 }, 0.6);
    const pickY = conv.refs.GRIP_PLATE_BOTTOM - (conv.refs.convY + conv.refs.bh);
    const placeY = (k) => conv.refs.GRIP_PLATE_BOTTOM - (0.144 + (k + 1) * conv.refs.bh);
    const place = (t, k, i) => {
      if (i) tl.set(S, { bundleFill: 1, bundleX: pz - 1.3 }, t - 0.02);
      tl.to(S, { gripX: -0.3, gripZ: 0, duration: 0.18 }, t);
      tl.to(S, { gripY: pickY, duration: 0.16, ease: 'power1.inOut' }, t + 0.18);
      tl.set(S, { carrying: 1 }, t + 0.35);
      tl.to(S, { gripY: 0.25, duration: 0.14 }, t + 0.36);
      tl.to(S, { gripX: 1.6 + (i ? 0.3 : -0.3), duration: 0.24, ease: 'power1.inOut' }, t + 0.5);
      tl.to(S, { gripY: placeY(k), duration: 0.16, ease: 'power1.inOut' }, t + 0.74);
      tl.set(S, { layerVisible: k + (i ? 1 : 0.5), carrying: 0, bundleFill: 0.001 }, t + 0.91);
      tl.to(S, { gripY: 0.25, duration: 0.14 }, t + 0.92);
    };
    place(a + 0.8, 7, 0); place(a + 1.75, 7, 1);
    tl.set(S, { layerVisible: 9 }, a + 2.75); tl.set(S, { cornersOn: 1 }, a + 2.8); tl.set(S, { strapsOn: 1 }, a + 2.85);
    K(a + 2.65, { fx: X.wrapper, fy: 1.2, d: 5.2, az: 0.3, el: 0.2 }, 0.6);
    tl.to(S, { palletX: X.wrapper, palletY: 0.11, duration: 0.35, ease: 'power1.inOut' }, a + 2.9);
    tl.to(S, { tableRot: Math.PI * 2 * 7, duration: 0.85, ease: 'power1.inOut' }, a + 3.3);
    tl.to(S, { wrapH: 1, duration: 0.75, ease: 'power1.inOut' }, a + 3.35);
    tl.to(S, { carriageY: 1.9, duration: 0.42, ease: 'power1.inOut', yoyo: true, repeat: 1 }, a + 3.3);
    K(a + 3.3, { az: 1.3, el: 0.25 }, 0.9); }
  // 10 — loading: the forklift takes the wrapped pallet from the turntable and side-loads the curtainsider
  { const a = stg(10).a + 1.2; const pickX = X.wrapper + 0.6 + 2.43 + 0.05;
    K(a - 0.4, { fx: X.wrapper + 2.0, fy: 1.2, fz: 0, d: 9.0, az: 2.6, el: 0.25 }, 0.6);
    tl.to(fk, { x: pickX, z: 0, ry: Math.PI, duration: 0.4, ease: 'power1.inOut' }, a + 0.05);
    tl.to(fk, { lift: 0.145, duration: 0.1 }, a + 0.45);
    tl.to(fk, { x: pickX - 1.2, duration: 0.2, ease: 'power1.inOut' }, a + 0.55);
    tl.to(fk, { lift: 0.36, tilt: 0.07, duration: 0.16 }, a + 0.77); tl.set(fk, { carry: 1 }, a + 0.78);
    tl.to(fk, { x: pickX + 2.4, duration: 0.3, ease: 'power1.inOut' }, a + 0.95);
    tl.to(fk, { x: 90.5, z: 2.8, ry: Math.PI * 1.5, duration: 0.55, ease: 'power1.inOut' }, a + 1.3);
    K(a + 1.3, { fx: 89.5, fy: 1.3, fz: 2.5, d: 10, az: 2.9, el: 0.3 }, 0.6);
    tl.to(fk, { lift: FY + 0.09, duration: 0.3, ease: 'power1.inOut' }, a + 1.85);
    tl.to(fk, { z: ROW_Z - 1.83, duration: 0.28, ease: 'power1.inOut' }, a + 2.17);   // pallet centre lands in the near row
    K(a + 2.1, { fx: 92.3, fy: 1.7, fz: 6.2, d: 9.5, az: 2.62, el: 0.3 }, 0.5);   // three-quarter from the hall so the load shows beside the mast as it goes onto the deck
    tl.to(fk, { lift: FY + 0.055, tilt: 0, duration: 0.13 }, a + 2.47); tl.set(fk, { carry: 0 }, a + 2.6);
    tl.to(fk, { z: 2.6, duration: 0.3, ease: 'power1.inOut' }, a + 2.65); tl.to(fk, { lift: 0.2, duration: 0.2 }, a + 2.95); }
  // 11 — departure: curtain shuts, lights on, pull away past the facade; camera cranes up to a wide shot
  { const a = stg(11).a;
    tl.to(tr, { curtain: 1, duration: 0.4, ease: 'power1.inOut' }, a + 1.35);
    K(a + 1.2, { fx: 90, fy: 2.0, fz: 8.1, d: 10.5, az: 3.0, el: 0.25 }, 0.6);
    tl.to(tr, { lights: 1, duration: 0.15 }, a + 1.8);
    const go = a + 1.95, dur = total - go - 0.02;
    tl.to(tr, { x: -60, duration: dur, ease: 'power2.in' }, go);
    // camera drifts out through the bay opening, swings wide round the trailer's rear into the yard, then cranes up
    // and back as the truck pulls away past the facade and the sign
    // The bay opening spans x 78–100 (facade continues to x 114), so the orbit must cross z = 7 with x inside that range:
    // focus pulled back to x 86–88 and a short radius while the camera slips out above the trailer's rear corner.
    K(go - 0.35, { fx: 88, fy: 2.0, fz: TRUCK_Z, az: 2.6, d: 11, el: 0.42 }, 0.35);       // inside, through the bay: cam ≈ (93.4, 6.5, 0.2)
    K(go, { fx: 88, fy: 2.0, fz: TRUCK_Z, az: 0.99, d: 13, el: 0.3 }, 0.15);                // out past the trailer's rear corner; sight line crosses the canopy column row (z 12, columns at x 84/96) at x ≈ 92: cam ≈ (98.4, 5.8, 16)
    K(go + 0.15, { fx: 88, fy: 2.0, fz: TRUCK_Z, az: 1.1, d: 15, el: 0.35 }, 0.35);          // into the yard: cam ≈ (100.6, 7, 15.6)
    depFollow = go;                                                                           // pose() blends the focus onto the cab over the next 0.9 vh (no jump)
    tl.to(rig, { fy: 2.4, d: 30, el: 0.32, az: 0.8, duration: dur - 0.5, ease: 'power1.inOut' }, go + 0.5);   // chase-drone: crane up and back while tracking the cab
    tl.to(state, { fade: 1, duration: 0.35, ease: 'power1.inOut' }, total - 0.36);
    if (ui.lastCopy) tl.to(ui.lastCopy, { autoAlpha: 0, y: -30, duration: 0.3, ease: 'power1.in' }, total - 0.38); }
  tl.add(() => {}, total);

  // rail + hint
  ui.rail.forEach((el, i) => {
    const s = stg(i + 1); const end = i + 1 < lens.length - 1 ? stg(i + 2).hold : total;
    tl.to(el, { color: '#ffffff', duration: 0.2 }, s.hold - 0.2);
    tl.fromTo(el.querySelector('.rail-bar i'), { scaleX: 0 }, { scaleX: 1, duration: end - s.hold, ease: 'none' }, s.hold);
    if (i < ui.rail.length - 1) tl.to(el, { color: 'rgba(255,255,255,0.4)', duration: 0.2 }, end);
  });
  tl.to(ui.hint, { autoAlpha: 0, duration: 0.25 }, 0.3);

  // ---- posing + render ----------------------------------------------------------------
  const clock = new THREE.Clock();
  let needsResize = true;
  const resize = () => { needsResize = true; };
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  const narrow = () => innerWidth < 820;
  const tmpV = new THREE.Vector3(), tmpE = new THREE.Euler(), tmpQ = new THREE.Quaternion(), tmpAxisZ = new THREE.Vector3(0, 0, 1);
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), look = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const pallet = conv.refs.pallet, transfer = conv.refs.transfer;
  const placedT = stg(10).a + 1.2 + 2.6;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth - 0.5) * 2; mouse.y = (e.clientY / innerHeight - 0.5) * 2; });

  // place an object on the forks: follows heading and mast tilt (pivot at the mast foot, x = 0.95)
  function onForks(obj, cx) {
    forklift.updateMatrixWorld();
    const c = Math.cos(fk.tilt), s = Math.sin(fk.tilt), lx = cx - 0.95, ly = fk.lift - 0.055;
    tmpV.set(0.95 + lx * c - ly * s, lx * s + ly * c, 0); forklift.localToWorld(tmpV); obj.position.copy(tmpV);
    tmpE.set(0, fk.ry, 0); obj.quaternion.setFromEuler(tmpE); tmpQ.setFromAxisAngle(tmpAxisZ, fk.tilt); obj.quaternion.multiply(tmpQ);
  }
  function pose(st) {
    const dist = st * M_PER_VH;
    corr.update(dist); conv.update(dist);
    wrapper.userData.table.rotation.y = S.tableRot; wrapper.userData.carriage.position.y = S.carriageY; wrapper.userData.reel.rotation.y = S.tableRot * 6;
    forklift.position.set(fk.x, 0, fk.z); forklift.rotation.y = fk.ry; forklift.userData.carriage.position.y = fk.lift; forklift.userData.mast.rotation.z = fk.tilt;
    forklift.userData.wheels.forEach((wh) => { wh.g.rotation.z = -(fk.x * Math.cos(fk.ry) - fk.z * Math.sin(fk.ry)) / wh.r; });
    if (fk.carry > 1.5) onForks(transfer, 2.0);           // sheet pallet carried further out: the 1.435 m sheets overhang the 1.0 m pallet
    if (fk.carry > 0.5 && fk.carry < 1.5) onForks(pallet, 1.83);
    else if (st > placedT) { pallet.position.set(90.5 + (tr.x - 96), FY, ROW_Z); pallet.rotation.set(0, Math.PI * 1.5, 0); }
    truck.position.x = tr.x; nearCurtain.scale.x = tr.curtain; truck.userData.wheels.forEach((wh) => (wh.g.rotation.z = -(tr.x - 96) / wh.r));
    headlights.forEach((h) => (h.intensity = tr.lights * 60));
    let fx = rig.fx;
    if (st > depFollow) { const u = Math.min(1, (st - depFollow) / 0.9), w = u * u * (3 - 2 * u); fx = rig.fx + (tr.x - 5 - rig.fx) * w; }   // focus eases onto the cab as the truck pulls away
    // camera from the rig
    const ce = Math.cos(rig.el);
    camera.position.set(fx + rig.d * ce * Math.sin(rig.az), rig.fy + rig.d * Math.sin(rig.el), rig.fz + rig.d * ce * Math.cos(rig.az));
    look.set(fx, rig.fy, rig.fz);
    fwd.subVectors(look, camera.position).normalize(); right.crossVectors(fwd, up).normalize();
    const shift = narrow() ? -0.02 : rig.shift;
    look.addScaledVector(right, -shift * rig.d);
    camera.position.x += mouse.sx * 0.02 * rig.d; camera.position.y -= mouse.sy * 0.012 * rig.d;
    camera.lookAt(look);
    key.target.position.set(fx, 0, rig.fz); key.position.set(fx + 9, 22, rig.fz + 12); key.target.updateMatrixWorld();
  }

  function render() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (needsResize || canvas.width === 0) {
      if (w === 0 || h === 0) { requestAnimationFrame(render); return; }
      renderer.setSize(w, h, false); composer.setSize(w, h); bloom.setSize(w, h); if (gtao) gtao.setSize(w, h);
      camera.aspect = w / h; camera.fov = narrow() ? 50 : 34; camera.updateProjectionMatrix();
      needsResize = false;
    }
    const t = clock.getElapsedTime();
    mouse.sx += (mouse.x - mouse.sx) * 0.04; mouse.sy += (mouse.y - mouse.sy) * 0.04;
    pose(tl.time());
    if (!reducedMotion) { camera.position.x += Math.sin(t * 0.37) * 0.015; camera.position.y += Math.sin(t * 0.52) * 0.01; }
    const pos = steamGeo.attributes.position.array;
    for (let i = 0; i < steamN; i++) { const ph = (t * 0.12 + sPhase[i]) % 1; pos[i * 3 + 1] = steamBase[i * 3 + 1] + ph * 1.6; pos[i * 3] = steamBase[i * 3] + Math.sin((t + i) * 0.5) * 0.15 * ph; }
    steamGeo.attributes.position.needsUpdate = true;
    ui.fade.style.opacity = state.fade;
    composer.render();
    requestAnimationFrame(render);
  }
  render();

  // dev handles: window.__hero.pose(t) poses the scene at timeline time t; window.__audit() lists box overlaps
  window.__hero = { scene, camera, tl, rig, pose: (t) => { tl.time(t); pose(t); } };
  window.__audit = (minRatio = 0.3, limit = 40) => {
    const items = []; const b = new THREE.Box3(); const v = new THREE.Vector3();
    scene.updateMatrixWorld(true);
    scene.traverse((o) => { if (!o.isMesh || !o.visible || o.isPoints || o.geometry.type === 'PlaneGeometry' || o.geometry.type === 'BufferGeometry') return; const mat = Array.isArray(o.material) ? o.material[0] : o.material; if (mat && mat.transparent) return; let p = o; let vis = true; while (p) { if (!p.visible) vis = false; p = p.parent; } if (!vis) return; b.setFromObject(o); if (!isFinite(b.min.x)) return; b.getSize(v); if (v.x > 20 || v.z > 20) return; items.push({ o, box: b.clone(), vol: Math.max(1e-9, v.x * v.y * v.z), size: v.clone() }); });
    const out = []; const inter = new THREE.Box3();
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const A = items[i], B = items[j]; if (A.o.parent === B.o.parent && A.o.parent !== scene) continue; if (!A.box.intersectsBox(B.box)) continue;
      inter.copy(A.box).intersect(B.box); inter.getSize(v); const iv = v.x * v.y * v.z; const ratio = iv / Math.min(A.vol, B.vol);
      if (ratio > minRatio && Math.min(v.x, v.y, v.z) > 0.012) out.push({ ratio: +ratio.toFixed(2), a: label(A), b: label(B) });
    }
    function label(it) { const o = it.o; const g = o.geometry; const c = new THREE.Vector3(); it.box.getCenter(c); const s = it.size; const col = Array.isArray(o.material) ? 'multi' : (o.material.color ? o.material.color.getHexString() : '?'); return `${g.type.replace('Geometry', '').replace('RoundedBox', 'RBox')} ${s.x.toFixed(2)}x${s.y.toFixed(2)}x${s.z.toFixed(2)} #${col} @(${c.x.toFixed(2)},${c.y.toFixed(2)},${c.z.toFixed(2)})`; }
    out.sort((p, q) => q.ratio - p.ratio); return JSON.stringify(out.slice(0, limit));
  };
  return { timeline: tl, duration: total, resize };
}
