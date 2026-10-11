import { createHero } from './hero.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

// ---- smooth scroll (Lenis) + GSAP ticker integration
const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
document.documentElement.classList.add('lenis');

// anchor links through lenis
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    lenis.scrollTo(el, { offset: -60, duration: 1.4 });
  });
});

// ---- nav
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
burger.addEventListener('click', () => document.body.classList.toggle('menu-open'));
let lastY = 0;
lenis.on('scroll', ({ scroll }) => {
  nav.classList.toggle('nav--hidden', scroll > lastY && scroll > 400 && !document.body.classList.contains('menu-open'));
  lastY = scroll;
});

// ---- ticker
const ticker = document.getElementById('ticker');
ticker.innerHTML += ticker.innerHTML;
gsap.to(ticker, { xPercent: -50, duration: 48, ease: 'none', repeat: -1 });

// ---- i18n
const langBtns = document.querySelectorAll('#lang button');
function applyLang(lang) {
  const dict = window.I18N[lang] || {};
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!el.dataset.it) el.dataset.it = el.innerHTML;
    el.innerHTML = lang === 'it' ? el.dataset.it : (dict[key] ?? el.dataset.it);
  });
  langBtns.forEach((b) => b.classList.toggle('is-on', b.dataset.lang === lang));
  document.documentElement.lang = lang;
  try { localStorage.setItem('fp-lang', lang); } catch (e) {}
}
langBtns.forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));
let savedLang = 'it';
try { savedLang = localStorage.getItem('fp-lang') || 'it'; } catch (e) {}
if (savedLang !== 'it') applyLang(savedLang);
document.getElementById('year').textContent = new Date().getFullYear();

// ---- section reveals
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 6) * 70}ms`; io.observe(el); });

// ---- hero
const ui = {
  lens: [...document.querySelectorAll('.panel')].map((p) => parseFloat(p.dataset.len) || 1.6),
  rail: [...document.querySelectorAll('.rail-item')],
  hint: document.getElementById('hint'),
  fade: document.getElementById('hero-fade'),
  lastCopy: document.querySelector('.panel:last-child .panel-copy'),
};

async function boot() {
  const loaderNum = document.getElementById('loader-num');
  const loaderBar = document.getElementById('loader-bar');
  const counter = { v: 0 };
  const count = gsap.to(counter, { v: 92, duration: 1.4, ease: 'power2.out', onUpdate: () => { loaderNum.textContent = String(Math.round(counter.v)).padStart(2, '0'); } });
  gsap.to(loaderBar, { scaleX: 0.92, duration: 1.4, ease: 'power2.out' });

  let hero = null;
  try {
    hero = await createHero(document.getElementById('hero-canvas'), ui);
  } catch (err) {
    console.error('Hero 3D failed, falling back to static hero.', err);
  }

  if (hero) {
    // the story's scroll length is (sum of panel lengths - 1) viewport heights; the timeline's time axis
    // uses the same unit, so progress maps 1:1 onto scroll and each panel owns its phase.
    ScrollTrigger.create({
      trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: 0.6, animation: hero.timeline, invalidateOnRefresh: true,
    });
    ScrollTrigger.create({
      trigger: '#hero', start: 'bottom-=120 top', onEnter: () => nav.classList.add('nav--light'), onLeaveBack: () => nav.classList.remove('nav--light'),
    });
  } else {
    ScrollTrigger.create({ trigger: '#hero', start: 'bottom-=120 top', onEnter: () => nav.classList.add('nav--light'), onLeaveBack: () => nav.classList.remove('nav--light') });
  }

  // finish loader
  await count.then();
  gsap.to(counter, { v: 100, duration: 0.3, onUpdate: () => { loaderNum.textContent = String(Math.round(counter.v)).padStart(2, '0'); } });
  gsap.to(loaderBar, { scaleX: 1, duration: 0.3 });
  const intro = gsap.timeline({ delay: 0.35 });
  intro.to('#loader', { yPercent: -100, duration: 0.9, ease: 'power3.inOut' })
    .set('#loader', { display: 'none' })
    .to('.hero-title .line > span', { y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09 }, '-=0.55')
    .from(['.panel[data-stage="0"] .eyebrow', '.panel[data-stage="0"] .hero-sub', '.panel[data-stage="0"] .hero-btns', '#rail', '#hint', '#nav'], { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.07, ease: 'power2.out' }, '-=0.8')
    .add(() => { lenis.start(); ScrollTrigger.refresh(); }, '-=0.6');
}

boot();
window.addEventListener('load', () => ScrollTrigger.refresh());

// ---- FEFCO 0201 blank calculator ------------------------------------------------
// Allowances follow common converting practice: each score across the flute adds about one caliper
// to the panel; the glue tab is 35 mm; flap depth is W/2 plus half a caliper so the outer flaps meet.
(function calculator() {
  const f = document.getElementById('calc-form'); if (!f) return;
  const $ = (id) => document.getElementById(id);
  const svg = $('blank-svg');
  const fmt = (n, d = 0) => n.toLocaleString(document.documentElement.lang === 'en' ? 'en-GB' : 'it-IT', { maximumFractionDigits: d, minimumFractionDigits: d });
  function calc() {
    const L = +$('c-l').value || 0, W = +$('c-w').value || 0, H = +$('c-h').value || 0, q = +$('c-q').value || 0;
    const opt = $('c-f').selectedOptions[0]; const t = +opt.dataset.t, g = +opt.dataset.g, flute = opt.value;
    const tab = 35;
    const pL = L + t, pW = W + t;                       // panel widths across the machine
    const blankL = 2 * pL + 2 * pW + tab + t;           // + one caliper on the slitter trim
    const flap = W / 2 + t / 2, body = H + 2 * t;
    const blankW = body + 2 * flap;
    const area = blankL * blankW / 1e6;                // m² per blank
    const mass = area * g / 1000;                       // kg per blank
    $('o-blank').textContent = `${fmt(blankL)} × ${fmt(blankW)} mm`;
    $('o-area').textContent = `${fmt(area, 3)} m²`;
    $('o-mass').textContent = `${fmt(mass * 1000)} g (${fmt(mass * 1000, 0)} kg / 1000)`;
    $('o-lot').textContent = `${fmt(area * q, 1)} m² · ${fmt(mass * q, 0)} kg`;
    // drawing
    const sx = 940 / blankL, sy = 360 / blankW, s = Math.min(sx, sy); const ox = (1000 - blankL * s) / 2, oy = (420 - blankW * s) / 2;
    const X = (v) => ox + v * s, Y = (v) => oy + v * s;
    const panels = [tab, pL, pW, pL, pW]; let acc = 0; const xs = [0]; for (const p of panels) { acc += p; xs.push(acc); }
    const yTop = flap, yBot = flap + body;
    let d = `<rect x="${X(0)}" y="${Y(0)}" width="${blankL * s}" height="${blankW * s}" fill="#c9a06c" stroke="#8a6a42" stroke-width="2"/>`;
    // tab is body-height only: mask its flap zones
    d += `<rect x="${X(0)}" y="${Y(0)}" width="${tab * s}" height="${flap * s}" fill="#ebe5dc"/><rect x="${X(0)}" y="${Y(yBot)}" width="${tab * s}" height="${flap * s}" fill="#ebe5dc"/>`;
    // slots
    for (let i = 2; i < xs.length - 0; i++) { if (i > 4) break; const x = X(xs[i]); d += `<line x1="${x}" y1="${Y(0)}" x2="${x}" y2="${Y(yTop)}" stroke="#8a6a42" stroke-width="5"/><line x1="${x}" y1="${Y(yBot)}" x2="${x}" y2="${Y(blankW)}" stroke="#8a6a42" stroke-width="5"/>`; }
    // creases (dashed)
    for (let i = 1; i < 5; i++) { const x = X(xs[i]); d += `<line x1="${x}" y1="${Y(yTop)}" x2="${x}" y2="${Y(yBot)}" stroke="#d7261e" stroke-width="2" stroke-dasharray="8 6"/>`; }
    d += `<line x1="${X(tab)}" y1="${Y(yTop)}" x2="${X(blankL)}" y2="${Y(yTop)}" stroke="#d7261e" stroke-width="2" stroke-dasharray="8 6"/><line x1="${X(tab)}" y1="${Y(yBot)}" x2="${X(blankL)}" y2="${Y(yBot)}" stroke="#d7261e" stroke-width="2" stroke-dasharray="8 6"/>`;
    // labels
    const lab = (x, y, txt, size = 20) => `<text x="${x}" y="${y}" font-family="JetBrains Mono, monospace" font-size="${size}" fill="#3b2d20" text-anchor="middle">${txt}</text>`;
    d += lab(X(tab / 2), Y(blankW / 2) + 7, 'tab', 15) + lab(X((xs[1] + xs[2]) / 2), Y(blankW / 2) + 7, 'L') + lab(X((xs[2] + xs[3]) / 2), Y(blankW / 2) + 7, 'W') + lab(X((xs[3] + xs[4]) / 2), Y(blankW / 2) + 7, 'L') + lab(X((xs[4] + xs[5]) / 2), Y(blankW / 2) + 7, 'W');
    d += lab(X(blankL / 2), Y(flap / 2) + 7, '½W', 15) + lab(X(blankL / 2), Y(yBot + flap / 2) + 7, '½W', 15);
    d += lab(X(blankL / 2), 412, `${fmt(blankL)} mm`, 16) + `<text x="14" y="${Y(blankW / 2)}" font-family="JetBrains Mono, monospace" font-size="16" fill="#3b2d20" transform="rotate(-90 14 ${Y(blankW / 2)})" text-anchor="middle">${fmt(blankW)} mm</text>`;
    svg.innerHTML = d;
    const dim = document.getElementById('q-dim'); const qf = document.getElementById('q-flute'); const qq = document.getElementById('q-qty');
    if (dim) dim.value = `${L} × ${W} × ${H}`; if (qf) qf.value = flute; if (qq) qq.value = q;
  }
  f.addEventListener('input', calc); calc();
})();

// ---- quote request: composes a mailto (no backend) ------------------------------
(function quote() {
  const form = document.getElementById('quote-form'); if (!form) return;
  const msg = document.getElementById('quote-msg');
  const build = () => {
    const d = new FormData(form); const en = document.documentElement.lang === 'en';
    const lines = [...d.entries()].filter(([k]) => k !== 'privacy').map(([k, v]) => `${k}: ${v}`);
    const subject = (en ? 'Quote request - ' : 'Richiesta preventivo - ') + (d.get('azienda') || '');
    const body = (en ? 'Quote request from the website\n\n' : 'Richiesta di preventivo dal sito web\n\n') + lines.join('\n');
    return { subject, body };
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (!form.reportValidity()) return;
    const { subject, body } = build();
    window.location.href = `mailto:info@fullpack.it?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    msg.textContent = document.documentElement.lang === 'en' ? 'Your mail client should open with the request.' : 'Si apre il programma di posta con la richiesta pronta.';
  });
  document.getElementById('quote-copy').addEventListener('click', async () => {
    const { subject, body } = build();
    try { await navigator.clipboard.writeText(`${subject}\n\n${body}`); msg.textContent = document.documentElement.lang === 'en' ? 'Copied.' : 'Copiato negli appunti.'; } catch (e) { msg.textContent = 'info@fullpack.it'; }
  });
})();

// ---- reduced motion: no smooth scroll, no camera sway ------------------------------
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { try { lenis.destroy(); } catch (e) {} document.documentElement.classList.remove('lenis'); }
